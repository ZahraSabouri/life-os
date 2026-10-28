// What the mail pages, Today, the bell and the calendar read. Rows come back as to_jsonb, so
// dates stay 'YYYY-MM-DD' and times ISO strings, as stored.
import { OTHER_CATEGORIES } from '../../../../shared/mail.js'

const LIST_COLUMNS = `id, source_id, source_message_id, thread_id, kind, received_at, from_name, from_address, subject, course, folder,
  unread_at_source, replied_at_source, attachments, link, summary, category, priority, priority_reason, deadline,
  her_priority, seen_at, hidden_at, pinned, revision`
const like = (value) => `%${String(value).replace(/[\\%_]/g, (character) => `\\${character}`)}%`

export function createMailReads({ pool }) {
  const rows = async (sql, values = []) => (await pool.query(sql, values)).rows.map((row) => row.row)

  // Open and snoozed, and what was closed in the last eight days, with the first message's link and source.
  const actions = () => rows(`SELECT to_jsonb(a) || jsonb_build_object('link', m.link, 'source_id', m.source_id, 'source_label', s.label) AS row
    FROM mail.actions a
    LEFT JOIN mail.messages m ON m.id::text = a.message_ids->>0 AND m.deleted_at IS NULL
    LEFT JOIN mail.sources s ON s.id = m.source_id
    WHERE a.deleted_at IS NULL AND (a.status IN ('open', 'snoozed') OR coalesce(a.done_at, a.updated_at) > now() - interval '8 days')
    ORDER BY a.due NULLS LAST, a.since`)

  const action = async (id) => (await rows('SELECT to_jsonb(a) AS row FROM mail.actions a WHERE id = $1 AND deleted_at IS NULL', [id]))[0] ?? null

  async function messages({ source = '', filter = 'all', unread = false, hidden = false, noise = false, q = '', limit = 300 } = {}) {
    const where = ['m.deleted_at IS NULL']
    const values = []
    const add = (value) => { values.push(value); return `$${values.length}` }
    if (!hidden) where.push('m.hidden_at IS NULL')
    if (source) where.push(`m.source_id = ${add(source)}`)
    if (unread) where.push('m.unread_at_source IS TRUE')
    if (filter === 'deadline') where.push("(m.category = 'deadline' OR m.deadline IS NOT NULL)")
    else if (filter === 'other') where.push(`m.category = ANY(${add(noise ? [...OTHER_CATEGORIES, 'noise'] : OTHER_CATEGORIES)})`)
    else if (filter !== 'all') where.push(`m.category = ${add(filter)}`)
    if (!noise && filter !== 'other') where.push("m.category <> 'noise'")
    const words = String(q ?? '').trim().slice(0, 200)
    if (words) {
      // Whole words through full text ('simple', so Persian works too); any part of a word through ILIKE.
      const document = "coalesce(m.subject, '') || ' ' || coalesce(m.from_name, '') || ' ' || coalesce(m.from_address, '') || ' ' || coalesce(m.summary, '') || ' ' || coalesce(m.body, '')"
      where.push(`(to_tsvector('simple', ${document}) @@ plainto_tsquery('simple', ${add(words)}) OR ${document} ILIKE ${add(like(words))})`)
    }
    return rows(`SELECT jsonb_build_object(${LIST_COLUMNS.split(',').map((column) => `'${column.trim()}', m.${column.trim()}`).join(', ')}, 'source_label', s.label, 'source_kind', s.kind) AS row
      FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id
      WHERE ${where.join(' AND ')} ORDER BY m.pinned DESC, m.received_at DESC LIMIT ${Math.max(1, Math.min(1000, Number(limit) || 300))}`, values)
  }

  const message = async (id) => (await rows(`SELECT to_jsonb(m) || jsonb_build_object('source_label', s.label, 'source_kind', s.kind) AS row
    FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id WHERE m.id = $1 AND m.deleted_at IS NULL`, [id]))[0] ?? null

  // A core person: what is open with them, and the last few messages from their addresses.
  async function person(personId, contact = '') {
    const addresses = [...String(contact ?? '').matchAll(/[^\s,;<>()]+@[^\s,;<>()]+\.[a-z]{2,}/gi)].map((match) => match[0].toLowerCase())
    const open = await rows(`SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.status IN ('open', 'snoozed')
      AND (a.person_id = $1 OR lower(a.person_address) = ANY($2)) ORDER BY a.due NULLS LAST, a.since`, [String(personId), addresses])
    const recent = addresses.length ? await rows(`SELECT jsonb_build_object('id', id, 'subject', subject, 'summary', summary, 'received_at', received_at, 'source_id', source_id) AS row
      FROM mail.messages WHERE deleted_at IS NULL AND hidden_at IS NULL AND lower(from_address) = ANY($1) ORDER BY received_at DESC LIMIT 5`, [addresses]) : []
    return { actions: open, messages: recent }
  }

  const digests = (limit = 30) => rows(`SELECT jsonb_build_object('id', id, 'run_id', run_id, 'gathered_at', gathered_at, 'imported_at', imported_at, 'status', status,
    'counts', counts, 'sources', sources, 'digest', digest, 'agent', agent) AS row FROM mail.batches ORDER BY imported_at DESC LIMIT $1`, [limit])

  const lastGathered = async () => (await pool.query("SELECT max(gathered_at) AS at FROM mail.batches WHERE status = 'applied'")).rows[0]?.at ?? null

  // Actions with a day in the stretch, for the calendar (not-needed ones are left off).
  const dated = (from, to) => rows(`SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.status <> 'not-needed'
    AND coalesce(CASE WHEN a.status = 'snoozed' THEN a.snoozed_until END, a.due) BETWEEN $1::date AND $2::date`, [from, to])

  // For the bell: what is open, and the announcements the latest applied batch brought.
  async function forNotices() {
    const open = await rows("SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.status IN ('open', 'snoozed')")
    const latest = (await pool.query("SELECT id FROM mail.batches WHERE status = 'applied' ORDER BY imported_at DESC LIMIT 1")).rows[0]
    const announcements = latest ? (await pool.query("SELECT count(*)::int AS n FROM mail.messages WHERE first_batch_id = $1 AND category = 'announcement' AND deleted_at IS NULL", [latest.id])).rows[0].n : 0
    return { actions: open, announcements, batchId: latest?.id ?? null }
  }

  return { actions, action, messages, message, person, digests, lastGathered, dated, forNotices }
}
