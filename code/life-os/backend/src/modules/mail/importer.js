// Applies one gathered mail batch (mail/GATHER.md) to schema mail, and undoes the latest.
// Check → back up → apply in one transaction → log. Imports write source fields only;
// her fields are never written, except closing an open action the source shows as done.
import { randomUUID } from 'node:crypto'
import { checkBatch } from '../../../../../../mail/check-batch.mjs'
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

const messageValues = (message) => ({
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
    const counts = { messages: { new: 0, updated: 0, unchanged: 0 }, actions: { new: 0, updated: 0, unchanged: 0 } }
    const tally = (kind, before, after) => { counts[kind][!before ? 'new' : after ? 'updated' : 'unchanged'] += 1 }

    await transaction(async (client) => {
      await client.query('INSERT INTO mail.batches (id, run_id, file_name, gathered_at, agent, sources, digest, backup_file) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [batchId, batch.runId, fileName, batch.gatheredAt, batch.agent ?? '', JSON.stringify(batch.sources), JSON.stringify(batch.digest), backupFile])
      for (const source of batch.sources) {
        await write(client, 'sources', source.id, sourceValues(source, batchId), { batchId })
      }
      const idByRef = new Map()
      for (const message of batch.messages) {
        const found = (await client.query('SELECT to_jsonb(t) AS row FROM mail.messages t WHERE source_id = $1 AND source_message_id = $2 AND deleted_at IS NULL', [message.source, message.sourceId])).rows[0]?.row ?? null
        const values = messageValues(message)
        const after = !found ? await write(client, 'messages', null, { ...values, first_batch_id: batchId, last_batch_id: batchId }, { batchId, before: null })
          : differs('messages', found, values) ? await write(client, 'messages', found.id, { ...values, last_batch_id: batchId }, { batchId, before: found }) : null
        tally('messages', found, after)
        idByRef.set(message.ref, (after ?? found).id)
      }
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
      }
      await client.query('UPDATE mail.batches SET counts = $2 WHERE id = $1', [batchId, JSON.stringify(counts)])
    })
    log(`mail: batch applied: messages ${counts.messages.new} new, ${counts.messages.updated} updated, ${counts.messages.unchanged} unchanged; actions ${counts.actions.new} new, ${counts.actions.updated} updated, ${counts.actions.unchanged} unchanged`)
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
      const order = { actions: 0, messages: 1, sources: 2 }
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

const differs = (table, before, values) => Object.keys(values).some((column) => !same(COLUMNS[table][column], before[column], values[column]))
