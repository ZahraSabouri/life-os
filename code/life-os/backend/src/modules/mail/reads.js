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

  // The reading room's filters (stage 5) besides source, category and words: area (of what was
  // taken from it), from and to (London days), priority (hers if she set one), has (items: led to
  // something that came in; actions: to something to do; deadline), notSeen (not opened in Life
  // OS). A sender she hides is left out unless hidden ones are shown; each row says its sender's
  // rule, and how many items and things to do were taken from it.
  async function messages({ source = '', filter = 'all', unread = false, hidden = false, noise = false, q = '', area = '', from = '', to = '', priority = '', has = '', notSeen = false, limit = 300 } = {}) {
    const where = ['m.deleted_at IS NULL']
    const values = []
    const add = (value) => { values.push(value); return `$${values.length}` }
    const day = /^\d{4}-\d{2}-\d{2}$/
    if (!hidden) where.push("m.hidden_at IS NULL AND NOT EXISTS (SELECT 1 FROM mail.senders r WHERE r.deleted_at IS NULL AND r.rule = 'hide' AND r.address = lower(m.from_address))")
    if (area) where.push(`EXISTS (SELECT 1 FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text AND i.area = ${add(area)})`)
    if (day.test(from)) where.push(`(m.received_at AT TIME ZONE 'Europe/London')::date >= ${add(from)}::date`)
    if (day.test(to)) where.push(`(m.received_at AT TIME ZONE 'Europe/London')::date <= ${add(to)}::date`)
    if (['urgent', 'high', 'normal', 'low'].includes(priority)) where.push(`coalesce(m.her_priority, m.priority) = ${add(priority)}`)
    if (has === 'items') where.push('EXISTS (SELECT 1 FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text)')
    else if (has === 'actions') where.push('EXISTS (SELECT 1 FROM mail.actions a WHERE a.deleted_at IS NULL AND a.message_ids ? m.id::text)')
    else if (has === 'deadline') where.push("(m.deadline IS NOT NULL OR EXISTS (SELECT 1 FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text AND i.deadline IS NOT NULL))")
    if (notSeen) where.push('m.seen_at IS NULL')
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
    return rows(`SELECT jsonb_build_object(${LIST_COLUMNS.split(',').map((column) => `'${column.trim()}', m.${column.trim()}`).join(', ')}, 'source_label', s.label, 'source_kind', s.kind,
        'rule', (SELECT r.rule FROM mail.senders r WHERE r.deleted_at IS NULL AND r.address = lower(m.from_address)),
        'sender_domain', (SELECT r.domain FROM mail.senders r WHERE r.deleted_at IS NULL AND r.address = lower(m.from_address)),
        'things', (SELECT coalesce(jsonb_agg(jsonb_build_object('kind', i.kind, 'area', i.area, 'her_domain', i.her_domain)), '[]'::jsonb) FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text),
        'taken', (SELECT count(*)::int FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text),
        'owed', (SELECT count(*)::int FROM mail.actions a WHERE a.deleted_at IS NULL AND a.message_ids ? m.id::text)) AS row
      FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id
      WHERE ${where.join(' AND ')} ORDER BY m.pinned DESC, m.received_at DESC LIMIT ${Math.max(1, Math.min(1000, Number(limit) || 300))}`, values)
  }

  const message = async (id) => (await rows(`SELECT to_jsonb(m) || jsonb_build_object('source_label', s.label, 'source_kind', s.kind,
      'rule', (SELECT jsonb_build_object('id', r.id, 'rule', r.rule, 'domain', r.domain, 'revision', r.revision) FROM mail.senders r WHERE r.deleted_at IS NULL AND r.address = lower(m.from_address)),
      'things', (SELECT coalesce(jsonb_agg(jsonb_build_object('kind', i.kind, 'area', i.area, 'her_domain', i.her_domain)), '[]'::jsonb) FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text)) AS row
    FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id WHERE m.id = $1 AND m.deleted_at IS NULL`, [id]))[0] ?? null

  // What was taken from one message: the items that came in through it and the things to do.
  async function taken(id) {
    const [items_, actions_] = await Promise.all([
      rows("SELECT to_jsonb(i) AS row FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? $1 ORDER BY i.deadline NULLS LAST, i.title", [String(id)]),
      rows("SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.message_ids ? $1 ORDER BY a.due NULLS LAST, a.title", [String(id)]),
    ])
    return { items: items_, actions: actions_ }
  }

  // One thing in full (the Desk's drawer): its fields, what happened to it, and the messages behind it.
  async function thing(id) {
    const found = (await rows(`SELECT to_jsonb(i) || jsonb_build_object('source_label', s.label, 'source_kind', s.kind,
        'sender', (SELECT lower(m.from_address) FROM mail.messages m WHERE m.id::text = i.message_ids->>0)) AS row
      FROM mail.items i LEFT JOIN mail.sources s ON s.id = i.source_id WHERE i.id::text = $1 AND i.deleted_at IS NULL`, [String(id)]))[0]
    if (!found) return null
    const [steps, messages_, actions_] = await Promise.all([
      rows('SELECT jsonb_build_object(\'at\', e.at, \'state\', e.state, \'note\', e.note) AS row FROM mail.item_events e WHERE e.item_id = $1 AND e.undone_at IS NULL ORDER BY e.at, e.id', [found.id]),
      rows(`SELECT jsonb_build_object('id', m.id, 'subject', m.subject, 'from_name', m.from_name, 'from_address', m.from_address, 'received_at', m.received_at, 'summary', m.summary,
          'source_kind', s.kind, 'source_message_id', m.source_message_id, 'link', m.link) AS row
        FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id WHERE m.deleted_at IS NULL AND m.id::text IN (SELECT jsonb_array_elements_text($1::jsonb)) ORDER BY m.received_at`, [JSON.stringify(found.message_ids ?? [])]),
      rows("SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.id::text IN (SELECT jsonb_array_elements_text($1::jsonb)) ORDER BY a.due NULLS LAST", [JSON.stringify(found.action_ids ?? [])]),
    ])
    return { ...found, steps, messages: messages_, actions: actions_ }
  }

  // What was kept quiet since a day: newsletters, notifications, noise and notes that became
  // nothing, by kind and by sender (the busiest five), and her sender rules.
  async function quiet(since) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(since ?? '')) ? since : '1970-01-01'
    const empty = "NOT EXISTS (SELECT 1 FROM mail.items i WHERE i.deleted_at IS NULL AND i.message_ids ? m.id::text)"
    const [byCategory, bySender, rules] = await Promise.all([
      pool.query(`SELECT m.category, count(*)::int AS n FROM mail.messages m WHERE m.deleted_at IS NULL AND m.category IN ('newsletter', 'automated', 'noise', 'fyi')
        AND m.received_at >= $1::date AND ${empty} GROUP BY m.category`, [day]),
      pool.query(`SELECT coalesce(nullif(m.from_name, ''), m.from_address, 'Unknown sender') AS sender, count(*)::int AS n FROM mail.messages m WHERE m.deleted_at IS NULL
        AND m.category IN ('newsletter', 'automated', 'noise', 'fyi') AND m.received_at >= $1::date AND ${empty} GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5`, [day]),
      pool.query("SELECT rule, count(*)::int AS n FROM mail.senders WHERE deleted_at IS NULL GROUP BY rule"),
    ])
    const categories = Object.fromEntries(byCategory.rows.map((row) => [row.category, row.n]))
    return { since: day, total: Object.values(categories).reduce((sum, n) => sum + n, 0), categories, senders: bySender.rows, rules: Object.fromEntries(rules.rows.map((row) => [row.rule, row.n])) }
  }

  // Her rules for senders, newest first.
  const senders = () => rows('SELECT to_jsonb(r) AS row FROM mail.senders r WHERE r.deleted_at IS NULL ORDER BY r.updated_at DESC')

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

  // What came in with a day in the stretch, for the calendar's "Came in" layer: the kinds
  // shared/harvest.js placeOf sends there, unless she dismissed them. Its day is London's.
  const datedItems = (from, to) => rows(`SELECT to_jsonb(i) AS row FROM mail.items i WHERE i.deleted_at IS NULL AND i.status <> 'dismissed'
    AND i.kind IN ('announcement', 'material', 'info', 'opportunity')
    AND coalesce((i.start_at AT TIME ZONE 'Europe/London')::date, i.start_day, i.deadline) BETWEEN $1::date AND $2::date`, [from, to])

  // What came in, with its source. day: one London day. open: not dismissed and not over: its
  // last day (closing, ending or starting) is today or later, or, with no day at all, it came in
  // within the last fortnight. The Everything view's filters: area, kind, status (new, kept,
  // dismissed, live = not dismissed), closing (week, month, past: by its closing day), words (q),
  // sort (closing soonest, or newest first).
  const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
  async function items({ day = '', open = false, today = '', area = '', kind = '', status = '', closing = '', q = '', sort = 'closing', limit = 1000 } = {}) {
    const where = ['i.deleted_at IS NULL']
    const values = []
    const add = (value) => { values.push(value); return `$${values.length}` }
    if (ISO_DAY.test(day)) where.push(`i.day = ${add(day)}::date`)
    if (open && ISO_DAY.test(today)) {
      const last = "greatest(i.deadline, i.end_day, i.start_day, (i.end_at AT TIME ZONE 'Europe/London')::date, (i.start_at AT TIME ZONE 'Europe/London')::date)"
      const at = add(today)
      where.push(`i.status <> 'dismissed' AND (${last} >= ${at}::date OR (${last} IS NULL AND i.day >= ${at}::date - 14))`)
    }
    if (area) where.push(`i.area = ${add(area)}`)
    if (kind) where.push(`i.kind = ${add(kind)}`)
    if (status === 'live') where.push("i.status <> 'dismissed'")
    else if (['new', 'kept', 'dismissed'].includes(status)) where.push(`i.status = ${add(status)}`)
    if (ISO_DAY.test(today) && closing) {
      const at = add(today)
      if (closing === 'week') where.push(`i.deadline BETWEEN ${at}::date AND ${at}::date + 6`)
      else if (closing === 'month') where.push(`i.deadline BETWEEN ${at}::date AND ${at}::date + 30`)
      else if (closing === 'past') where.push(`i.deadline < ${at}::date`)
    }
    const words = String(q ?? '').trim().slice(0, 200)
    if (words) where.push(`concat_ws(' ', i.title, i.summary, i.location, i.details->>'organiser', i.details->>'employer', i.details->>'course') ILIKE ${add(like(words))}`)
    const order = sort === 'newest' ? 'i.day DESC, i.title' : "coalesce(i.deadline, i.start_day, (i.start_at AT TIME ZONE 'Europe/London')::date, i.day), i.title"
    // With who sent its first message (for a taught sender's domain) and its latest step.
    return rows(`SELECT to_jsonb(i) || jsonb_build_object('source_label', s.label, 'source_kind', s.kind,
        'sender', (SELECT lower(m.from_address) FROM mail.messages m WHERE m.id::text = i.message_ids->>0),
        'sender_name', (SELECT m.from_name FROM mail.messages m WHERE m.id::text = i.message_ids->>0),
        'steps', (SELECT count(*)::int FROM mail.item_events e WHERE e.item_id = i.id AND e.undone_at IS NULL),
        'last_step', (SELECT jsonb_build_object('state', e.state, 'at', e.at) FROM mail.item_events e WHERE e.item_id = i.id AND e.undone_at IS NULL ORDER BY e.at DESC, e.id DESC LIMIT 1)) AS row
      FROM mail.items i LEFT JOIN mail.sources s ON s.id = i.source_id WHERE ${where.join(' AND ')}
      ORDER BY ${order} LIMIT ${Math.max(1, Math.min(5000, Number(limit) || 1000))}`, values)
  }

  // The Harvest log (stage 5): every London day something came in, newest first, with its counts:
  // messages by source, items by kind, things to do that started that day.
  const MESSAGE_DAY = "(m.received_at AT TIME ZONE 'Europe/London')::date"
  const ACTION_DAY = "(coalesce(a.since, a.created_at) AT TIME ZONE 'Europe/London')::date"
  const days = ({ limit = 400 } = {}) => rows(`WITH
      m AS (SELECT ${MESSAGE_DAY} AS day, m.source_id, count(*)::int AS n FROM mail.messages m WHERE m.deleted_at IS NULL GROUP BY 1, 2),
      i AS (SELECT i.day, i.kind, count(*)::int AS n FROM mail.items i WHERE i.deleted_at IS NULL GROUP BY 1, 2),
      a AS (SELECT ${ACTION_DAY} AS day, count(*)::int AS n FROM mail.actions a WHERE a.deleted_at IS NULL AND a.origin = 'gathered' GROUP BY 1),
      d AS (SELECT day FROM m UNION SELECT day FROM i UNION SELECT day FROM a)
    SELECT jsonb_build_object('day', d.day::text,
      'messages', coalesce((SELECT sum(n) FROM m WHERE m.day = d.day), 0),
      'sources', coalesce((SELECT jsonb_object_agg(source_id, n) FROM m WHERE m.day = d.day), '{}'::jsonb),
      'kinds', coalesce((SELECT jsonb_object_agg(kind, n) FROM i WHERE i.day = d.day), '{}'::jsonb),
      'actions', coalesce((SELECT n FROM a WHERE a.day = d.day), 0)) AS row
    FROM d ORDER BY d.day DESC LIMIT ${Math.max(1, Math.min(2000, Number(limit) || 400))}`)

  // One day of the log: what came in (items), the messages, what to do that started then, and the
  // runs that brought them.
  async function day(when) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(when ?? ''))) return null
    const [items_, messages_, actions_, runs] = await Promise.all([
      items({ day: when }),
      rows(`SELECT jsonb_build_object('id', m.id, 'subject', m.subject, 'from_name', m.from_name, 'from_address', m.from_address, 'received_at', m.received_at,
          'summary', m.summary, 'category', m.category, 'priority', coalesce(m.her_priority, m.priority), 'course', m.course, 'source_id', m.source_id,
          'source_label', s.label, 'source_kind', s.kind, 'hidden_at', m.hidden_at) AS row
        FROM mail.messages m LEFT JOIN mail.sources s ON s.id = m.source_id WHERE m.deleted_at IS NULL AND ${MESSAGE_DAY} = $1::date ORDER BY m.received_at`, [when]),
      rows(`SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.origin = 'gathered' AND ${ACTION_DAY} = $1::date ORDER BY a.due NULLS LAST, a.title`, [when]),
      rows(`SELECT jsonb_build_object('id', b.id, 'run_id', b.run_id, 'gathered_at', b.gathered_at, 'imported_at', b.imported_at, 'agent', b.agent, 'status', b.status,
          'version', b.version, 'counts', b.counts, 'sources', b.sources) AS row FROM mail.batches b
        WHERE b.id IN (SELECT first_batch_id FROM mail.items WHERE day = $1::date AND deleted_at IS NULL
          UNION SELECT first_batch_id FROM mail.messages m WHERE ${MESSAGE_DAY} = $1::date AND deleted_at IS NULL)
        ORDER BY b.gathered_at`, [when]),
    ])
    return { day: when, items: items_, messages: messages_, actions: actions_, runs }
  }

  // Each source as an instrument reads: how far it is read, when, how, and what it could not read.
  const sources = () => rows(`SELECT jsonb_build_object('id', s.id, 'label', s.label, 'kind', s.kind, 'route', s.route, 'status', s.last_status,
      'coverage', s.coverage, 'window_from', s.window_from, 'window_to', s.window_to, 'gathered_at', b.gathered_at, 'messages',
      (SELECT count(*)::int FROM mail.messages m WHERE m.source_id = s.id AND m.deleted_at IS NULL)) AS row
    FROM mail.sources s LEFT JOIN mail.batches b ON b.id = s.last_batch_id WHERE s.deleted_at IS NULL ORDER BY b.gathered_at DESC NULLS LAST, s.label`)

  // For the bell: what is open, and the announcements the latest applied batch brought.
  async function forNotices() {
    const open = await rows("SELECT to_jsonb(a) AS row FROM mail.actions a WHERE a.deleted_at IS NULL AND a.status IN ('open', 'snoozed')")
    const latest = (await pool.query("SELECT id FROM mail.batches WHERE status = 'applied' ORDER BY imported_at DESC LIMIT 1")).rows[0]
    const announcements = latest ? (await pool.query("SELECT count(*)::int AS n FROM mail.messages WHERE first_batch_id = $1 AND category = 'announcement' AND deleted_at IS NULL", [latest.id])).rows[0].n : 0
    return { actions: open, announcements, batchId: latest?.id ?? null }
  }

  return { actions, action, messages, message, taken, senders, thing, quiet, person, digests, lastGathered, dated, datedItems, items, days, day, sources, forNotices }
}
