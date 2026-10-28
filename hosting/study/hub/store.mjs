// Storage for the Study hub app: one workspace per semester in PostgreSQL.
// The app saves its whole state for the semester it has open (the same request it used
// to send to its own local file). This keeps that state, an occasional earlier copy, the
// app's event log, and derives ordinary Study records from the cards after each save.
import { randomUUID, createHash } from 'node:crypto'
import { cardRecords, examRecords, stateSummary } from './cards.mjs'

export class HubError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HubError'
    this.status = status
    if (details !== undefined) this.details = details
  }
}

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const iso = (value) => (value instanceof Date ? value.toISOString() : value ?? '')
const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export function semesterId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new HubError(400, 'Choose a semester first')
  return value.toLowerCase()
}

// A module row carries the app's own description of the module when it has one. A module
// that was added elsewhere in Life OS gets a plain one, so the app can still show it.
export function moduleDefinition(row, taken = new Set()) {
  const saved = plain(row.data?.definition) ? row.data.definition : null
  let id = saved?.id || slug(row.data?.code) || slug(row.title) || `module-${row.id.slice(0, 8)}`
  while (taken.has(id)) id = `${id}-${row.id.slice(0, 4)}`
  taken.add(id)
  const code = String(saved?.code ?? row.data?.code ?? '').trim()
  return {
    accent: 'teal', subtitle: '', examShape: '', objectives: [], operatingRules: [], resources: [], drills: [], recipes: [],
    ...(saved ?? {}),
    id,
    viewId: saved?.viewId || id,
    moduleGroup: saved?.moduleGroup || row.title,
    code,
    label: saved?.label || row.title,
    title: saved?.title || row.title,
    rowId: row.id,
    rowRevision: row.revision,
    status: row.status,
  }
}

export function createHubStore({ pool, repository, clock = () => new Date(), log = console.warn }) {
  if (!pool?.query || !pool?.connect || !repository?.syncProjected) throw new TypeError('The Study hub store needs a PostgreSQL pool and the Study repository')

  async function semesterRow(id, client = pool) {
    const row = (await client.query(`SELECT id, title, status, start_date::text AS start_date, end_date::text AS end_date, data, revision
      FROM study.semesters WHERE id = $1 AND deleted_at IS NULL`, [semesterId(id)])).rows[0]
    if (!row) throw new HubError(404, 'That semester no longer exists')
    return row
  }

  async function semesters() {
    const rows = (await pool.query(`SELECT s.id, s.title, s.status, s.start_date::text AS start_date, s.end_date::text AS end_date, s.revision,
        s.data->>'note' AS note, w.revision AS saves, w.written_at,
        (SELECT count(*)::int FROM study.modules m WHERE m.semester_id = s.id AND m.deleted_at IS NULL) AS modules,
        (SELECT count(*)::int FROM study.cards c WHERE c.semester_id = s.id AND c.deleted_at IS NULL) AS cards,
        (SELECT count(*)::int FROM study.cards c WHERE c.semester_id = s.id AND c.deleted_at IS NULL AND c.status = 'done') AS done
      FROM study.semesters s LEFT JOIN study.hub_workspaces w ON w.semester_id = s.id
      WHERE s.deleted_at IS NULL ORDER BY s.start_date DESC NULLS LAST, s.created_at DESC`)).rows
    return rows.map((row) => ({ ...row, written_at: iso(row.written_at), note: row.note ?? '' }))
  }

  async function moduleRows(id, client = pool) {
    return (await client.query(`SELECT id, title, status, data, revision FROM study.modules
      WHERE semester_id = $1 AND deleted_at IS NULL ORDER BY COALESCE((data->>'order')::int, 1000), created_at, id`, [id])).rows
  }

  function definitions(rows) {
    const described = (row) => plain(row.data?.definition) && row.data.definition.id
    // Saved ids are reserved first, so a plain module never takes one that a described module owns.
    const taken = new Set(rows.filter(described).map((row) => row.data.definition.id))
    return rows.map((row) => (described(row) ? moduleDefinition(row) : moduleDefinition(row, taken)))
  }

  // Everything the app needs to open a semester, apart from its saved state.
  async function workspace(id) {
    const semester = await semesterRow(id)
    const rows = await moduleRows(semester.id)
    const saved = (await pool.query('SELECT revision, plan, written_at FROM study.hub_workspaces WHERE semester_id = $1', [semester.id])).rows[0]
    const sessions = (await pool.query(`SELECT id, title, status, module_id, start_date::text AS start_date, end_date::text AS end_date, start_at, end_at, data, revision
      FROM study.sessions WHERE semester_id = $1 AND deleted_at IS NULL ORDER BY start_at NULLS LAST, start_date, id`, [semester.id])).rows
    const assessments = (await pool.query(`SELECT id, title, status, module_id, start_date::text AS start_date, end_date::text AS end_date, start_at, end_at, data, revision
      FROM study.assessments WHERE semester_id = $1 AND deleted_at IS NULL AND COALESCE(provenance->>'source', '') NOT LIKE 'hub:%' ORDER BY COALESCE(end_date, start_date), id`, [semester.id])).rows
    const materials = (await pool.query(`SELECT id, title, status, module_id, data, revision FROM study.materials
      WHERE semester_id = $1 AND deleted_at IS NULL ORDER BY created_at, id`, [semester.id])).rows
    const stamp = (row) => ({ ...row, start_at: iso(row.start_at) || null, end_at: iso(row.end_at) || null })
    return {
      semester: { id: semester.id, title: semester.title, status: semester.status, start_date: semester.start_date, end_date: semester.end_date, revision: semester.revision, note: semester.data?.note ?? '' },
      modules: definitions(rows),
      plan: plain(saved?.plan) ? saved.plan : {},
      sessions: sessions.map(stamp),
      assessments: assessments.map(stamp),
      materials,
      revision: saved?.revision ?? 0,
      writtenAt: iso(saved?.written_at),
    }
  }

  // Only the plan (study blocks, schedule wording) of a semester.
  async function plan(id) {
    const saved = (await pool.query('SELECT plan FROM study.hub_workspaces WHERE semester_id = $1', [semesterId(id)])).rows[0]
    return plain(saved?.plan) ? saved.plan : {}
  }

  async function readState(id) {
    const semester = await semesterRow(id)
    const row = (await pool.query('SELECT revision, state, writer_id, written_at FROM study.hub_workspaces WHERE semester_id = $1', [semester.id])).rows[0]
    if (!row || row.revision === 0) return { payload: null, revision: 0 }
    return {
      revision: row.revision,
      payload: { schemaVersion: Number(row.state?.version ?? 0), revision: row.revision, writtenAt: iso(row.written_at), writerId: row.writer_id, app: 'study-hub', state: row.state },
    }
  }

  // Why an earlier copy is worth keeping before this save replaces it.
  async function versionReason(client, id, current, next, writerId) {
    const today = clock().toISOString().slice(0, 10)
    const latest = (await client.query('SELECT created_at FROM study.hub_versions WHERE semester_id = $1 ORDER BY created_at DESC LIMIT 1', [id])).rows[0]
    if (!latest || iso(latest.created_at).slice(0, 10) < today) return 'first save of the day'
    const before = stateSummary(current.state), after = stateSummary(next)
    if (after.addedCards < before.addedCards - 2 || after.cardRecords < before.cardRecords - 2 || after.bytes < before.bytes * 0.8) return 'the state became much smaller'
    if (current.writer_id && current.writer_id !== writerId && clock().getTime() - new Date(latest.created_at).getTime() > 10 * 60_000) return 'saved from another tab'
    return ''
  }

  async function project(id) {
    const semester = await semesterRow(id)
    const saved = (await pool.query('SELECT state, plan FROM study.hub_workspaces WHERE semester_id = $1', [semester.id])).rows[0]
    if (!saved) return { cards: null }
    const modules = definitions(await moduleRows(semester.id)).map((definition) => ({ id: definition.rowId, title: definition.title, definition }))
    const moduleIds = new Map(modules.map((module) => [module.definition.moduleGroup, module.id]))
    const source = `hub:${semester.id}`
    return {
      cards: await repository.syncProjected('cards', source, cardRecords({ semesterId: semester.id, plan: saved.plan, state: saved.state, moduleIds })),
      assessments: await repository.syncProjected('assessments', source, examRecords({ semesterId: semester.id, state: saved.state, modules })),
    }
  }

  async function writeState(id, payload, { expectedRevision, writerId = 'unknown' } = {}) {
    const state = plain(payload?.state) ? payload.state : payload
    if (!plain(state)) throw new HubError(400, 'The saved state must be an object')
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new HubError(428, 'Send the last revision you loaded')
    const text = JSON.stringify(state)
    if (Buffer.byteLength(text) > 64 * 1024 * 1024) throw new HubError(413, 'The saved state is larger than 64 MB')
    const semester = await semesterRow(id)
    const client = await pool.connect()
    let result
    try {
      await client.query('BEGIN')
      await client.query('INSERT INTO study.hub_workspaces (semester_id) VALUES ($1) ON CONFLICT (semester_id) DO NOTHING', [semester.id])
      const current = (await client.query('SELECT revision, state, writer_id, written_at FROM study.hub_workspaces WHERE semester_id = $1 FOR UPDATE', [semester.id])).rows[0]
      if (expectedRevision !== current.revision) {
        await client.query('ROLLBACK')
        return { conflict: true, revision: current.revision, writtenAt: iso(current.written_at), writerId: current.writer_id || 'unknown' }
      }
      if (current.revision > 0 && JSON.stringify(current.state) === text) {
        await client.query('ROLLBACK')
        return { noChange: true, revision: current.revision, savedAt: iso(current.written_at), writerId: current.writer_id }
      }
      if (current.revision > 0) {
        const reason = await versionReason(client, semester.id, current, state, writerId)
        if (reason) await client.query('INSERT INTO study.hub_versions (id, semester_id, revision, reason, state) VALUES ($1, $2, $3, $4, $5::json)', [randomUUID(), semester.id, current.revision, reason, JSON.stringify(current.state)])
      }
      const saved = (await client.query(`UPDATE study.hub_workspaces SET revision = revision + 1, state = $2::json, writer_id = $3, written_at = now()
        WHERE semester_id = $1 RETURNING revision, written_at`, [semester.id, text, String(writerId).slice(0, 200)])).rows[0]
      await client.query('COMMIT')
      result = { revision: saved.revision, savedAt: iso(saved.written_at), writerId }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
    // The state is saved. Deriving the records from it must never undo that.
    try { result.records = await project(semester.id) } catch (error) { log(`Study hub: records were not refreshed after a save (${error.message})`); result.recordsError = true }
    return result
  }

  // Sets a semester's plan and state in one step: used when data is brought in.
  async function replaceWorkspace(id, { plan, state, setAside, reason = 'brought in', writerId = 'import' }) {
    const semester = await semesterRow(id)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('INSERT INTO study.hub_workspaces (semester_id) VALUES ($1) ON CONFLICT (semester_id) DO NOTHING', [semester.id])
      const current = (await client.query('SELECT revision, state FROM study.hub_workspaces WHERE semester_id = $1 FOR UPDATE', [semester.id])).rows[0]
      if (current.revision > 0) await client.query('INSERT INTO study.hub_versions (id, semester_id, revision, reason, state) VALUES ($1, $2, $3, $4, $5::json)', [randomUUID(), semester.id, current.revision, `before: ${reason}`.slice(0, 200), JSON.stringify(current.state)])
      const saved = (await client.query(`UPDATE study.hub_workspaces SET revision = revision + 1,
          state = COALESCE($2::json, state), plan = COALESCE($3::json, plan), set_aside = COALESCE($4::json, set_aside), writer_id = $5, written_at = now()
        WHERE semester_id = $1 RETURNING revision`, [semester.id, plain(state) ? JSON.stringify(state) : null, plain(plan) ? JSON.stringify(plan) : null, plain(setAside) ? JSON.stringify(setAside) : null, writerId])).rows[0]
      await client.query('COMMIT')
      return { revision: saved.revision, records: await project(semester.id) }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
  }

  async function updatePlan(id, change, { expectedRevision, expectedPlanHash } = {}) {
    const semester = await semesterRow(id)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('INSERT INTO study.hub_workspaces (semester_id) VALUES ($1) ON CONFLICT (semester_id) DO NOTHING', [semester.id])
      const current = (await client.query('SELECT plan, revision FROM study.hub_workspaces WHERE semester_id = $1 FOR UPDATE', [semester.id])).rows[0]
      if (expectedRevision !== undefined && expectedRevision !== current.revision) throw new HubError(409, 'Workspace changed. Load it again before saving the plan.')
      const previous = plain(current.plan) ? current.plan : {}
      const hash = createHash('sha256').update(JSON.stringify(previous)).digest('hex')
      if (expectedPlanHash !== undefined && expectedPlanHash !== hash) throw new HubError(409, 'Plan changed. Load it again before saving.')
      const plan = { ...previous, ...change }
      await client.query('UPDATE study.hub_workspaces SET plan = $2::json WHERE semester_id = $1', [semester.id, JSON.stringify(plan)])
      await client.query('COMMIT')
      return plan
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally { client.release() }
  }

  function normaliseEvent(input) {
    if (!plain(input)) throw new HubError(400, 'An event must be an object')
    const eventType = input.eventType || input.event_type
    if (!eventType) throw new HubError(400, 'An event needs an eventType')
    const event = {
      id: String(input.id || `event-${randomUUID()}`).slice(0, 200),
      occurredAt: input.occurredAt || input.occurred_at || clock().toISOString(),
      entityType: input.entityType || input.entity_type || 'tracker',
      entityId: input.entityId || input.entity_id || 'state',
      eventType,
      payload: input.payload ?? {},
    }
    const checksum = createHash('sha256').update(JSON.stringify(event)).digest('hex')
    if (input.checksum && input.checksum !== checksum) throw new HubError(409, 'The event checksum does not match its content')
    return { ...event, checksum }
  }

  async function appendEvent(id, input) {
    const semester = await semesterRow(id)
    const event = normaliseEvent(input)
    const occurred = Number.isFinite(Date.parse(event.occurredAt)) ? new Date(event.occurredAt).toISOString() : null
    const inserted = await pool.query(`INSERT INTO study.hub_events (semester_id, id, occurred_at, checksum, event) VALUES ($1, $2, $3, $4, $5::json)
      ON CONFLICT (semester_id, id) DO NOTHING RETURNING id`, [semester.id, event.id, occurred, event.checksum, JSON.stringify(event)])
    if (inserted.rows.length) return { event, duplicate: false }
    const existing = (await pool.query('SELECT checksum FROM study.hub_events WHERE semester_id = $1 AND id = $2', [semester.id, event.id])).rows[0]
    if (existing?.checksum !== event.checksum) throw new HubError(409, `Event ${event.id} already exists with different content`)
    return { event, duplicate: true }
  }

  async function importEvents(id, events) {
    const semester = await semesterRow(id)
    let added = 0
    for (const input of events) {
      if (!plain(input) || !input.id || !input.eventType) continue
      const occurred = Number.isFinite(Date.parse(input.occurredAt)) ? new Date(input.occurredAt).toISOString() : null
      const result = await pool.query(`INSERT INTO study.hub_events (semester_id, id, occurred_at, checksum, event) VALUES ($1, $2, $3, $4, $5::json)
        ON CONFLICT (semester_id, id) DO NOTHING RETURNING id`, [semester.id, String(input.id), occurred, String(input.checksum ?? ''), JSON.stringify(input)])
      added += result.rows.length
    }
    return added
  }

  async function recentEvents(id, limit = 200) {
    const semester = await semesterRow(id)
    const rows = (await pool.query('SELECT event FROM study.hub_events WHERE semester_id = $1 ORDER BY occurred_at DESC NULLS LAST, created_at DESC LIMIT $2', [semester.id, Math.max(1, Math.min(limit, 1000))])).rows
    return rows.map((row) => row.event).reverse()
  }

  async function health(id) {
    const semester = await semesterRow(id)
    const saved = (await pool.query('SELECT revision, state->>\'version\' AS version, writer_id, written_at FROM study.hub_workspaces WHERE semester_id = $1', [semester.id])).rows[0]
    const events = (await pool.query('SELECT count(*)::int AS count FROM study.hub_events WHERE semester_id = $1', [semester.id])).rows[0]
    const last = (await pool.query('SELECT event FROM study.hub_events WHERE semester_id = $1 ORDER BY occurred_at DESC NULLS LAST, created_at DESC LIMIT 1', [semester.id])).rows[0]?.event
    const versions = (await pool.query('SELECT count(*)::int AS count, max(created_at) AS latest FROM study.hub_versions WHERE semester_id = $1', [semester.id])).rows[0]
    return {
      semester: semester.title,
      state: { exists: Boolean(saved?.revision), revision: saved?.revision ?? 0, schemaVersion: Number(saved?.version ?? 0), writtenAt: iso(saved?.written_at), writerId: saved?.writer_id ?? '' },
      events: { count: events.count, last: last ? { id: last.id ?? '', eventType: last.eventType ?? '', entityType: last.entityType ?? '', entityId: last.entityId ?? '', occurredAt: last.occurredAt ?? '' } : null },
      versions: { count: versions.count, latest: iso(versions.latest) },
    }
  }

  return Object.freeze({ semesters, semesterRow, workspace, plan, readState, writeState, replaceWorkspace, updatePlan, project, appendEvent, importEvents, recentEvents, health, moduleRows })
}
