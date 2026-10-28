// The mail store: every write goes through write(), which keeps the revision and
// records the change in mail.history. Imports write source fields; her fields are
// changed only through patchHers(), with a revision check (409 on a stale save).
import { randomUUID } from 'node:crypto'

export class MailError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    if (details !== undefined) this.details = details
  }
}

// Column types, used to compare a batch's values with what is stored and to send jsonb.
export const COLUMNS = {
  sources: { label: 'text', kind: 'text', route: 'text', last_status: 'text', coverage: 'text', window_from: 'ts', window_to: 'ts', last_batch_id: 'text', deleted_at: 'ts' },
  messages: {
    source_id: 'text', source_message_id: 'text', thread_id: 'text', kind: 'text', received_at: 'ts', from_name: 'text', from_address: 'text',
    to_list: 'json', cc_list: 'json', subject: 'text', course: 'text', folder: 'text', unread_at_source: 'text', replied_at_source: 'text',
    attachments: 'json', link: 'text', body: 'text', text_complete: 'text', summary: 'text', category: 'text', priority: 'text',
    priority_reason: 'text', deadline: 'date', first_batch_id: 'text', last_batch_id: 'text',
    her_priority: 'text', seen_at: 'ts', hidden_at: 'ts', pinned: 'text', deleted_at: 'ts',
  },
  actions: {
    origin: 'text', dedupe_key: 'text', kind: 'text', area: 'text', person_name: 'text', person_address: 'text', person_id: 'text',
    message_ids: 'json', since: 'ts', title: 'text', why: 'text', priority: 'text', due: 'date', resolved_at_source: 'text',
    resolved_note: 'text', first_batch_id: 'text', last_batch_id: 'text', status: 'text', snoozed_until: 'date', done_at: 'ts',
    done_by: 'text', her_priority: 'text', her_title: 'text', her_note: 'text', reopened: 'text', deleted_at: 'ts',
  },
}

export const HER_FIELDS = {
  messages: ['her_priority', 'seen_at', 'hidden_at', 'pinned'],
  actions: ['status', 'snoozed_until', 'done_at', 'done_by', 'her_priority', 'her_title', 'her_note', 'reopened'],
}

const stable = (value) => Array.isArray(value) ? `[${value.map(stable).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
    : JSON.stringify(value ?? null)

export function same(type, a, b) {
  if (a === undefined) a = null
  if (b === undefined) b = null
  if (type === 'json') return stable(a ?? []) === stable(b ?? [])
  if (a === null || b === null) return a === b
  if (type === 'ts') return Date.parse(a) === Date.parse(b)
  if (type === 'date') return String(a).slice(0, 10) === String(b).slice(0, 10)
  return String(a) === String(b)
}

const param = (table, column, value) => (COLUMNS[table][column] === 'json' ? JSON.stringify(value ?? []) : value ?? null)

export async function snapshot(client, table, id) {
  return (await client.query(`SELECT to_jsonb(t) AS row FROM mail.${table} t WHERE id = $1`, [id])).rows[0]?.row ?? null
}

// Inserts (no id yet, or no such row) or updates one record and records the change.
// Returns the stored row, or null when nothing differed (nothing written).
export async function write(client, table, id, values, { batchId = null, change = 'import', before } = {}) {
  if (before === undefined) before = id ? await snapshot(client, table, id) : null
  const columns = Object.keys(values).filter((column) => column in COLUMNS[table])
  if (before) {
    const changed = columns.filter((column) => !same(COLUMNS[table][column], before[column], values[column]))
    if (!changed.length) return null
    await client.query(`UPDATE mail.${table} SET ${changed.map((column, index) => `${column} = $${index + 2}`).join(', ')}, revision = revision + 1, updated_at = now() WHERE id = $1`,
      [before.id, ...changed.map((column) => param(table, column, values[column]))])
  } else {
    id ??= randomUUID()
    await client.query(`INSERT INTO mail.${table} (id, ${columns.join(', ')}) VALUES ($1, ${columns.map((_, index) => `$${index + 2}`).join(', ')})`,
      [id, ...columns.map((column) => param(table, column, values[column]))])
  }
  const after = await snapshot(client, table, before?.id ?? id)
  await client.query('INSERT INTO mail.history (table_name, record_id, batch_id, change, before, after) VALUES ($1, $2, $3, $4, $5, $6)',
    [table, after.id, batchId, change, before && JSON.stringify(before), JSON.stringify(after)])
  return after
}

export function createMailRepository({ pool }) {
  if (!pool) throw new TypeError('The mail repository needs a pool')

  async function transaction(work) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
  }

  // Her own change to her fields of a message or an action.
  async function patchHers(table, id, revision, fields = {}) {
    if (!HER_FIELDS[table]) throw new MailError(404, 'Unknown mail record kind')
    const unknown = Object.keys(fields).filter((key) => !HER_FIELDS[table].includes(key))
    if (unknown.length) throw new MailError(400, `These can't be changed here: ${unknown.join(', ')}`)
    if (!Number.isInteger(revision)) throw new MailError(400, 'Send the revision you last saw')
    return transaction(async (client) => {
      const before = (await client.query(`SELECT to_jsonb(t) AS row FROM mail.${table} t WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0]?.row
      if (!before) throw new MailError(404, 'Not found')
      if (before.revision !== revision) throw new MailError(409, 'This changed since you opened it. Reload to see the latest.', { revision: before.revision })
      const values = { ...fields }
      if (table === 'actions' && values.status) {
        if (values.status === 'done' && before.status !== 'done') Object.assign(values, { done_at: new Date().toISOString(), done_by: 'her' })
        if (values.status === 'open' && before.status !== 'open') {
          Object.assign(values, { done_at: null, done_by: null })
          if (before.done_by === 'source') values.reopened = true
        }
      }
      return (await write(client, table, id, values, { change: 'hers', before })) ?? before
    })
  }

  const lastBatch = async () => (await pool.query("SELECT id, run_id, file_name, gathered_at, agent, imported_at, status, counts, sources, digest FROM mail.batches ORDER BY imported_at DESC LIMIT 1")).rows[0] ?? null
  const batches = async ({ limit = 50 } = {}) => (await pool.query('SELECT id, run_id, file_name, gathered_at, agent, imported_at, status, counts, undone_at FROM mail.batches ORDER BY imported_at DESC LIMIT $1', [limit])).rows
  const counts = async () => (await pool.query(`SELECT
      (SELECT count(*)::int FROM mail.messages WHERE deleted_at IS NULL) AS messages,
      (SELECT count(*)::int FROM mail.actions WHERE deleted_at IS NULL AND status = 'open') AS open_actions,
      (SELECT count(*)::int FROM mail.actions WHERE deleted_at IS NULL AND status = 'done') AS done_actions`)).rows[0]

  return { pool, transaction, patchHers, lastBatch, batches, counts }
}
