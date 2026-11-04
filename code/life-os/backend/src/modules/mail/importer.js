// Applies one gathered mail batch (mail/GATHER.md; version 2 with items, mail/HARVEST.md) to schema mail, and undoes the latest.
// Check → back up → apply in one transaction → log. Imports write source fields only;
// her fields are never written, except closing an open action the source shows as done.
import { randomUUID } from 'node:crypto'
import { checkBatch } from '../../../../../../mail/check-batch.mjs'
import { canonicalUrl } from '../../../../shared/harvest.js'
import { MailError, COLUMNS, same, snapshot, write } from './repository.js'

const RELATIONSHIP_KINDS = new Set(['text', 'call', 'congratulate'])
const lower = (value) => String(value ?? '').trim().toLowerCase()

// A core person for an action: by address in their contact, else by a name only one person has.
export function matchPerson(people, person) {
  if (!person) return null
  const address = lower(person.address)
  if (address) {
    const byAddress = people.filter((entry) => lower(entry.contact).includes(address))
    if (byAddress.length === 1) return String(byAddress[0].id)
  }
  const name = lower(person.name)
  const byName = name ? people.filter((entry) => lower(entry.name) === name) : []
  return byName.length === 1 ? String(byName[0].id) : null
}

const sourceValues = (source, batchId) => ({
  label: source.label, kind: source.kind, route: source.route ?? null, last_status: source.status, coverage: source.coverage ?? null,
  window_from: source.window?.from ?? null, window_to: source.window?.to ?? null, last_batch_id: batchId, deleted_at: null,
})

// Version 1 knows nothing of links, so a v1 batch leaves a message's stored links as they are.
const messageValues = (message, v2) => ({
  ...(v2 ? { links: message.links ?? [] } : {}),
  source_id: message.source, source_message_id: message.sourceId, thread_id: message.threadId ?? null, kind: message.kind,
  received_at: message.receivedAt, from_name: message.from?.name ?? null, from_address: message.from?.address ?? null,
  to_list: message.to ?? [], cc_list: message.cc ?? [], subject: message.subject ?? '', course: message.course ?? null,
  folder: message.folder ?? null, unread_at_source: message.unreadAtSource ?? null, replied_at_source: message.repliedAtSource ?? null,
  attachments: message.attachments ?? [], link: message.link ?? null, body: message.text ?? null, text_complete: message.textComplete ?? null,
  summary: message.summary ?? '', category: message.category, priority: message.priority, priority_reason: message.priorityReason ?? null,
  deadline: message.deadline ?? null,
})

const actionSourceValues = (action, messageIds) => ({
  title: action.title, why: action.why ?? null, priority: action.priority, due: action.due ?? null, message_ids: messageIds,
  resolved_at_source: action.resolvedAtSource === true, resolved_note: action.resolvedNote ?? null,
})

// An item's source fields. Its when is a time or a day; details keeps the rest of what it says.
const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
const DETAILS = ['course', 'organiser', 'employer', 'salary', 'cost', 'tags']
const itemValues = (item, { messageIds, actionIds, sourceId }) => ({
  area: item.area, kind: item.kind, title: item.title, summary: item.summary, day: item.day,
  start_at: item.start && !isDay(item.start) ? item.start : null, start_day: isDay(item.start) ? item.start : null,
  end_at: item.end && !isDay(item.end) ? item.end : null, end_day: isDay(item.end) ? item.end : null,
  all_day: item.allDay ?? isDay(item.start), deadline: item.deadline ?? null, location: item.location ?? null,
  url: item.url ?? null, canonical_url: item.url ? canonicalUrl(item.url) || null : null,
  details: Object.fromEntries(DETAILS.filter((key) => item[key] !== undefined).map((key) => [key, item[key]])),
  source_id: sourceId, message_ids: messageIds, action_ids: actionIds, found_url: item.foundAt?.url ?? null, found_at: item.foundAt?.checkedAt ?? null,
})

export function createMailImporter({ repository, backup = async () => null, findPeople = () => [], log = () => {} }) {
  const { transaction } = repository

  // Returns { repeated, batchId, counts } or throws MailError(422) with every problem listed.
  async function apply(batch, { fileName = '' } = {}) {
    const checked = checkBatch(batch)
    if (!checked.ok) throw new MailError(422, 'The batch did not pass the check', checked.problems)
    const known = (await repository.pool.query('SELECT id, status FROM mail.batches WHERE run_id = $1', [batch.runId])).rows[0]
    if (known) return { repeated: true, batchId: known.id, status: known.status }
    const people = await findPeople()
    const backupFile = await backup()
    const batchId = randomUUID()
    const v2 = batch.version === 2
    const counts = { messages: { new: 0, updated: 0, unchanged: 0 }, actions: { new: 0, updated: 0, unchanged: 0 }, ...(v2 ? { items: { new: 0, updated: 0, unchanged: 0 } } : {}) }
    const tally = (kind, before, after) => { counts[kind][!before ? 'new' : after ? 'updated' : 'unchanged'] += 1 }

    await transaction(async (client) => {
      await client.query('INSERT INTO mail.batches (id, run_id, file_name, gathered_at, agent, sources, digest, backup_file, version) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [batchId, batch.runId, fileName, batch.gatheredAt, batch.agent ?? '', JSON.stringify(batch.sources), JSON.stringify(batch.digest ?? {}), backupFile, batch.version])
      for (const source of batch.sources) {
        await write(client, 'sources', source.id, sourceValues(source, batchId), { batchId })
      }
      const idByRef = new Map()
      for (const message of batch.messages) {
        const found = await sameMessage(client, message)
        const values = messageValues(message, v2)
        const after = !found ? await write(client, 'messages', null, { ...values, first_batch_id: batchId, last_batch_id: batchId }, { batchId, before: null })
          : differs('messages', found, values) ? await write(client, 'messages', found.id, { ...values, last_batch_id: batchId }, { batchId, before: found }) : null
        tally('messages', found, after)
        idByRef.set(message.ref, (after ?? found).id)
      }
      const actionIdByRef = new Map()
      for (const action of batch.actions) {
        const found = (await client.query('SELECT to_jsonb(t) AS row FROM mail.actions t WHERE dedupe_key = $1 AND deleted_at IS NULL', [action.dedupeKey])).rows[0]?.row ?? null
        const values = actionSourceValues(action, (action.messageRefs ?? []).map((ref) => idByRef.get(ref)))
        const personId = matchPerson(people, action.person)
        let after
        if (!found) {
          const resolved = values.resolved_at_source
          after = await write(client, 'actions', null, {
            ...values, origin: 'gathered', dedupe_key: action.dedupeKey, kind: action.kind, area: RELATIONSHIP_KINDS.has(action.kind) ? 'relationships' : 'admin',
            person_name: action.person?.name ?? null, person_address: action.person?.address ?? null, person_id: personId, since: action.since ?? null,
            first_batch_id: batchId, last_batch_id: batchId,
            ...(resolved ? { status: 'done', done_by: 'source', done_at: batch.gatheredAt } : {}),
          }, { batchId, before: null })
        } else {
          const extra = {}
          if (!found.person_id && personId) extra.person_id = personId
          if (values.resolved_at_source && found.status === 'open' && !found.reopened) Object.assign(extra, { status: 'done', done_by: 'source', done_at: batch.gatheredAt })
          after = differs('actions', found, { ...values, ...extra }) ? await write(client, 'actions', found.id, { ...values, ...extra, last_batch_id: batchId }, { batchId, before: found }) : null
        }
        tally('actions', found, after)
        actionIdByRef.set(action.ref, (after ?? found).id)
      }
      // What came in. Her status (kept, dismissed) and when she saw it are never written here.
      const sourceOf = new Map(batch.messages.map((message) => [message.ref, message.source]))
      for (const item of batch.items ?? []) {
        const found = (await client.query('SELECT to_jsonb(t) AS row FROM mail.items t WHERE dedupe_key = $1 AND deleted_at IS NULL', [item.key])).rows[0]?.row ?? null
        const values = itemValues(item, {
          messageIds: (item.messageRefs ?? []).map((ref) => idByRef.get(ref)), actionIds: (item.actionRefs ?? []).map((ref) => actionIdByRef.get(ref)),
          sourceId: sourceOf.get(item.messageRefs?.[0]) ?? null,
        })
        const after = !found ? await write(client, 'items', null, { ...values, dedupe_key: item.key, first_batch_id: batchId, last_batch_id: batchId }, { batchId, before: null })
          : differs('items', found, values) ? await write(client, 'items', found.id, { ...values, last_batch_id: batchId }, { batchId, before: found }) : null
        tally('items', found, after)
      }
      counts.urgent = (await client.query("SELECT count(*)::int AS n FROM mail.actions WHERE last_batch_id = $1 AND status = 'open' AND coalesce(her_priority, priority) = 'urgent' AND deleted_at IS NULL", [batchId])).rows[0].n
      await client.query('UPDATE mail.batches SET counts = $2 WHERE id = $1', [batchId, JSON.stringify(counts)])
    })
    log(`mail: batch applied: ${countLine(counts)}`)
    return { repeated: false, batchId, counts, backupFile, warnings: checked.warnings }
  }

  // Puts back what the latest applied batch changed. Refused if she changed any of it since.
  async function undo(batchId) {
    return transaction(async (client) => {
      const latest = (await client.query('SELECT id, status FROM mail.batches ORDER BY imported_at DESC LIMIT 1 FOR UPDATE')).rows[0]
      if (!latest || latest.id !== batchId) throw new MailError(409, 'Only the latest batch can be undone')
      if (latest.status !== 'applied') throw new MailError(409, 'This batch has already been undone')
      const changes = (await client.query("SELECT id, table_name, record_id, before, after FROM mail.history WHERE batch_id = $1 AND change = 'import' ORDER BY id", [batchId])).rows
      const last = new Map()
      for (const change of changes) {
        const key = `${change.table_name}:${change.record_id}`
        if (!last.has(key)) last.set(key, { table: change.table_name, id: change.record_id, before: change.before, after: change.after })
        else last.get(key).after = change.after
      }
      const changedSince = []
      for (const record of last.values()) {
        const now = await snapshot(client, record.table, record.id)
        if (!now || now.revision !== record.after?.revision) changedSince.push({ table: record.table, id: record.id, title: now?.her_title ?? now?.title ?? now?.subject ?? now?.label ?? '' })
      }
      if (changedSince.length) throw new MailError(409, "You've changed some of this since, so it can't be undone", changedSince)
      // Children first, so a removed source is never left with live messages.
      const order = { items: 0, actions: 1, messages: 2, sources: 3 }
      for (const record of [...last.values()].sort((a, b) => order[a.table] - order[b.table])) {
        const values = record.before
          ? Object.fromEntries(Object.keys(COLUMNS[record.table]).map((column) => [column, record.before[column]]))
          : { deleted_at: new Date().toISOString() }
        await write(client, record.table, record.id, values, { batchId, change: 'undo' })
      }
      await client.query("UPDATE mail.batches SET status = 'undone', undone_at = now() WHERE id = $1", [batchId])
      log(`mail: batch undone: ${last.size} records put back`)
      return { undone: true, records: last.size }
    })
  }

  return { apply, undo }
}

// The stored copy of a message: by its source and id; or else, for a message first stored under
// another id (a backfill that now has the provider's own id), the one message from the same
// source in the same minute with the same sender and subject. Then the newer id is kept.
async function sameMessage(client, message) {
  const byId = (await client.query('SELECT to_jsonb(t) AS row FROM mail.messages t WHERE source_id = $1 AND source_message_id = $2 AND deleted_at IS NULL', [message.source, message.sourceId])).rows[0]?.row
  if (byId) return byId
  const sender = lower(message.from?.address)
  if (!sender && !message.subject) return null
  const alike = (await client.query(`SELECT to_jsonb(t) AS row FROM mail.messages t WHERE source_id = $1 AND deleted_at IS NULL
    AND date_trunc('minute', received_at) = date_trunc('minute', $2::timestamptz) AND lower(coalesce(from_address, '')) = $3 AND subject = $4 LIMIT 2`,
  [message.source, message.receivedAt, sender, message.subject ?? ''])).rows
  return alike.length === 1 ? alike[0].row : null
}

// The receipt's words: "messages 3 new, 0 updated, 1 unchanged; actions …; items …".
export const countLine = (counts) => ['messages', 'actions', 'items'].filter((kind) => counts[kind])
  .map((kind) => `${kind} ${counts[kind].new} new, ${counts[kind].updated} updated, ${counts[kind].unchanged} unchanged`).join('; ')

const differs = (table, before, values) => Object.keys(values).some((column) => !same(COLUMNS[table][column], before[column], values[column]))
