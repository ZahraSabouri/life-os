// The addresses the Study hub app talks to. It keeps the app's own save protocol
// (/api/state with a revision check) and adds what a general study app needs:
// semesters and modules that are created, edited and removed as data.
import { randomUUID } from 'node:crypto'
import { HubError, semesterId } from './store.mjs'
import { duplicateModule } from './duplicate.mjs'

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, limit = 2000) => String(value ?? '').trim().slice(0, limit)
const date = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null)
const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const lines = (value) => (Array.isArray(value) ? value : String(value ?? '').split('\n')).map((item) => String(item).trim()).filter(Boolean)

function sameDevice(req) {
  let host = ''
  try { host = new URL(`http://${req.headers.host ?? ''}`).hostname } catch { /* refused below */ }
  if (!LOCAL_HOSTS.has(host)) return false
  if (String(req.headers['sec-fetch-site'] ?? '').toLowerCase() === 'cross-site') return false
  const origin = String(req.headers.origin ?? '').trim()
  if (!origin || origin === 'null') return true
  try { return LOCAL_HOSTS.has(new URL(origin).hostname) } catch { return false }
}

function expectedRevision(header) {
  const match = /^(?:W\/)?"?(\d+)"?$/.exec(String(header ?? '').trim())
  return match ? Number(match[1]) : null
}

export function createHubRouter({ express, store, repository, readAssetsManifest = async () => null }) {
  const router = express.Router()
  router.use((req, res, next) => {
    if (!sameDevice(req)) return res.status(403).json({ ok: false, error: 'The Study hub only answers this computer.' })
    res.set('Cache-Control', 'no-store')
    res.set('X-Content-Type-Options', 'nosniff')
    next()
  })
  router.use(express.json({ limit: '64mb' }))

  const handle = (callback) => async (req, res) => {
    try { await callback(req, res) } catch (error) {
      const status = error instanceof HubError || (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) ? error.status : 500
      if (status === 500) console.error('Study hub:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'The Study hub could not complete that. Try again.' : error.message, ...(error.details === undefined ? {} : { details: error.details }) })
    }
  }
  const semester = (req) => semesterId(String(req.query.semester ?? ''))

  // ---- The app's own protocol -------------------------------------------------------------
  router.get('/api/health', (_req, res) => res.json({ ok: true, app: 'study-hub', storage: 'postgresql' }))

  router.get(['/api/state', '/api/local-tracker-state'], handle(async (req, res) => {
    const { payload, revision } = await store.readState(semester(req))
    res.set('ETag', `"${revision}"`).set('X-State-Revision', String(revision))
    if (!payload) return res.status(204).end()
    res.json(payload)
  }))

  router.put(['/api/state', '/api/local-tracker-state'], handle(async (req, res) => {
    const expected = expectedRevision(req.headers['if-match'])
    if (expected === null) return res.status(428).json({ ok: false, error: 'If-Match with the last observed state revision is required.' })
    const result = await store.writeState(semester(req), req.body, { expectedRevision: expected, writerId: String(req.headers['x-writer-id'] ?? req.body?.writerId ?? 'unknown') })
    res.set('ETag', `"${result.revision}"`).set('X-State-Revision', String(result.revision))
    if (result.conflict) return res.status(409).json({ ok: false, error: 'State revision conflict.', current: result })
    res.json({ ok: true, path: 'Life OS database', ...result })
  }))

  router.get('/api/events', handle(async (req, res) => res.json({ ok: true, events: await store.recentEvents(semester(req)), malformedCount: 0, quarantinePath: '' })))
  router.post('/api/events', handle(async (req, res) => {
    const result = await store.appendEvent(semester(req), req.body)
    res.status(result.duplicate ? 200 : 201).json({ ok: true, ...result })
  }))

  router.get('/api/data-health', handle(async (req, res) => {
    const [health, manifest] = await Promise.all([store.health(semester(req)), readAssetsManifest().catch(() => null)])
    res.json({
      ok: true,
      authoritativeStore: 'Life OS database (PostgreSQL)',
      semester: health.semester,
      state: { ...health.state, path: 'Life OS database' },
      eventLog: { validCount: health.events.count, malformedCount: 0, lastValidEvent: health.events.last, recoveryCoverage: 'partial audit history; not a complete recovery source' },
      versions: health.versions,
      assets: manifest ? { available: true, syncedAt: manifest.syncedAt ?? '', count: Array.isArray(manifest.assets) ? manifest.assets.length : Number(manifest.assetCount ?? manifest.available ?? manifest.checked ?? 0) } : { available: false },
    })
  }))

  // ---- Semesters --------------------------------------------------------------------------
  router.get('/api/hub/semesters', handle(async (_req, res) => res.json({ ok: true, semesters: await store.semesters() })))

  function semesterFields(body, { partial = false } = {}) {
    if (!plain(body)) throw new HubError(400, 'Describe the semester')
    const fields = {}
    if (!partial || 'title' in body) {
      fields.title = text(body.title, 300)
      if (!fields.title) throw new HubError(400, 'Give the semester a name')
    }
    if (!partial || 'start_date' in body) fields.start_date = date(body.start_date)
    if (!partial || 'end_date' in body) fields.end_date = date(body.end_date)
    if ('status' in body) {
      if (!['active', 'planned', 'completed', 'archived'].includes(body.status)) throw new HubError(400, 'A semester is planned, active, completed or archived')
      fields.status = body.status
    } else if (!partial) fields.status = 'active'
    if (fields.start_date && fields.end_date && fields.end_date < fields.start_date) throw new HubError(400, 'The semester ends before it starts')
    return fields
  }

  router.post('/api/hub/semesters', handle(async (req, res) => {
    const created = await repository.create('semesters', { ...semesterFields(req.body), data: { note: text(req.body.note, 4000) } })
    res.status(201).json({ ok: true, semester: created })
  }))

  router.patch('/api/hub/semesters/:id', handle(async (req, res) => {
    const current = await store.semesterRow(req.params.id)
    const fields = semesterFields(req.body, { partial: true })
    const data = 'note' in req.body ? { ...(current.data ?? {}), note: text(req.body.note, 4000) } : undefined
    const updated = await repository.patch('semesters', current.id, { ...fields, ...(data ? { data } : {}), revision: Number(req.body.revision ?? current.revision) })
    res.json({ ok: true, semester: updated })
  }))

  // Removing a semester removes what belongs to it. Everything stays restorable.
  router.delete('/api/hub/semesters/:id', handle(async (req, res) => {
    const current = await store.semesterRow(req.params.id)
    const workspace = await repository.workspace({ historyLimit: 1 })
    let removed = 0
    for (const entity of ['progress', 'materials', 'sessions', 'assessments', 'cards', 'modules']) {
      for (const row of workspace[entity].filter((item) => item.semester_id === current.id)) { await repository.remove(entity, row.id, row.revision, { actor: 'study-hub' }); removed += 1 }
    }
    await repository.remove('semesters', current.id, current.revision, { actor: 'study-hub' })
    res.json({ ok: true, removed })
  }))

  // ---- Opening a semester -----------------------------------------------------------------
  router.get('/api/hub/workspace', handle(async (req, res) => res.json({ ok: true, ...(await store.workspace(semester(req))) })))

  router.patch('/api/hub/plan', handle(async (req, res) => {
    if (!plain(req.body)) throw new HubError(400, 'Describe what to change')
    const allowed = ['campaignMeta', 'options', 'scheduleRules', 'scheduleExceptions', 'scheduleAssumptions', 'knowledgeSeeds', 'texts']
    const change = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)))
    const expected = req.headers['if-match'] === undefined ? undefined : expectedRevision(req.headers['if-match'])
    if (expected === null) throw new HubError(400, 'If-Match must name the workspace revision')
    const expectedPlanHash = req.get('X-Expected-Plan-Hash')
    if (expectedPlanHash !== undefined && !/^[a-f0-9]{64}$/.test(expectedPlanHash)) throw new HubError(400, 'Send the hash of the plan you loaded')
    res.json({ ok: true, plan: await store.updatePlan(semester(req), change, { expectedRevision: expected, expectedPlanHash }) })
  }))

  // ---- Modules ----------------------------------------------------------------------------
  function moduleDefinitionFrom(body, previous = {}) {
    if (!plain(body)) throw new HubError(400, 'Describe the module')
    const title = text(body.title ?? previous.title, 300)
    if (!title) throw new HubError(400, 'Give the module a name')
    const resources = Array.isArray(body.resources) ? body.resources.filter(plain).slice(0, 2000) : previous.resources ?? []
    return {
      ...previous,
      title,
      label: text(body.label ?? previous.label ?? title, 120) || title,
      code: text(body.code ?? previous.code, 60),
      subtitle: text(body.subtitle ?? previous.subtitle, 600),
      examShape: text(body.examShape ?? previous.examShape, 1200),
      accent: text(body.accent ?? previous.accent ?? 'teal', 40) || 'teal',
      objectives: 'objectives' in body ? lines(body.objectives) : previous.objectives ?? [],
      operatingRules: 'operatingRules' in body ? lines(body.operatingRules) : previous.operatingRules ?? [],
      drills: Array.isArray(body.drills) ? body.drills.filter(plain).slice(0, 500) : previous.drills ?? [],
      recipes: Array.isArray(body.recipes) ? body.recipes.filter(plain).slice(0, 500) : previous.recipes ?? [],
      resources,
    }
  }

  router.post('/api/hub/modules', handle(async (req, res) => {
    const id = semester(req)
    const existing = (await store.workspace(id)).modules
    const definition = moduleDefinitionFrom(req.body)
    if (existing.some((module) => module.moduleGroup.toLowerCase() === definition.title.toLowerCase() || module.label.toLowerCase() === definition.label.toLowerCase())) throw new HubError(409, 'This semester already has a module with that name')
    let moduleId = slug(definition.code) || slug(definition.title) || `module-${randomUUID().slice(0, 8)}`
    while (existing.some((module) => module.id === moduleId)) moduleId = `${moduleId}-${randomUUID().slice(0, 4)}`
    Object.assign(definition, { id: moduleId, viewId: moduleId, moduleGroup: definition.title })
    const created = await repository.create('modules', { title: definition.title, status: 'active', semester_id: id, data: { code: definition.code, order: existing.length, definition } })
    res.status(201).json({ ok: true, module: created, definition: { ...definition, rowId: created.id, rowRevision: created.revision } })
  }))

  async function moduleRow(id) {
    const row = (await repository.workspace({ historyLimit: 1 })).modules.find((item) => item.id === String(id).toLowerCase())
    if (!row) throw new HubError(404, 'That module no longer exists')
    return row
  }

  router.patch('/api/hub/modules/:id', handle(async (req, res) => {
    const row = await moduleRow(req.params.id)
    const current = (await store.workspace(row.semester_id)).modules.find((module) => module.rowId === row.id)
    const { rowId, rowRevision, status, ...previous } = current
    // The group name ties cards to the module, so it stays what it was when only the wording changes.
    const definition = { ...moduleDefinitionFrom(req.body, previous), id: previous.id, viewId: previous.viewId, moduleGroup: previous.moduleGroup }
    const updated = await repository.patch('modules', row.id, {
      title: definition.title,
      ...(['active', 'planned', 'completed', 'archived'].includes(req.body.status) ? { status: req.body.status } : {}),
      data: { ...row.data, code: definition.code, definition },
      revision: Number(req.body.revision ?? row.revision),
    })
    res.json({ ok: true, module: updated, definition: { ...definition, rowId: updated.id, rowRevision: updated.revision } })
  }))

  // A module is removed with what belongs to it in the database (classes, assessments, files).
  // Its cards live in the app's saved state, so the app removes those itself before calling this.
  router.delete('/api/hub/modules/:id', handle(async (req, res) => {
    const row = await moduleRow(req.params.id)
    const workspace = await repository.workspace({ historyLimit: 1 })
    let removed = 0
    for (const entity of ['progress', 'materials', 'sessions', 'assessments']) {
      for (const item of workspace[entity].filter((record) => record.module_id === row.id)) { await repository.remove(entity, item.id, item.revision, { actor: 'study-hub' }); removed += 1 }
    }
    if (workspace.cards.some((card) => card.module_id === row.id)) await store.project(row.semester_id)
    const fresh = await repository.workspace({ historyLimit: 1 })
    if (fresh.cards.some((card) => card.module_id === row.id)) throw new HubError(409, 'This module still has cards. Move or remove them first.')
    await repository.remove('modules', row.id, fresh.modules.find((item) => item.id === row.id).revision, { actor: 'study-hub' })
    res.json({ ok: true, removed })
  }))

  router.post('/api/hub/modules/:id/duplicate', handle(async (req, res) => {
    const row = await moduleRow(req.params.id)
    res.status(201).json({ ok: true, ...(await duplicateModule({ store, repository, moduleRow: row, body: req.body })) })
  }))

  // ---- Classes and assessments: ordinary Study records, edited from inside the app ----------
  for (const entity of ['sessions', 'assessments', 'materials']) {
    router.post(`/api/hub/${entity}`, handle(async (req, res) => res.status(201).json({ ok: true, record: await repository.create(entity, { ...req.body, semester_id: semester(req) }) })))
    router.patch(`/api/hub/${entity}/:id`, handle(async (req, res) => res.json({ ok: true, record: await repository.patch(entity, req.params.id, req.body) })))
    router.delete(`/api/hub/${entity}/:id`, handle(async (req, res) => res.json({ ok: true, record: await repository.remove(entity, req.params.id, Number(req.body?.revision)) })))
  }

  return router
}
