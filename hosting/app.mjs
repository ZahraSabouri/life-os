import express from '../code/life-os/backend/node_modules/express/index.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import entriesRouter from '../code/life-os/backend/src/routes/entries.js'
import peopleRouter from '../code/life-os/backend/src/routes/people.js'
import settingsRouter from '../code/life-os/backend/src/routes/settings.js'
import { createLocalTrackerApi } from '../summer-rescue/src/server/localTrackerApi.js'
import { BUDGET_PATH, budgetProxy } from './budget.mjs'
import { budgetBrowserRoutes } from './budget-browser-data.mjs'
import { JOBMAP_PATH, jobMapProxy } from './jobmap.mjs'
import db from '../code/life-os/backend/src/db.js'
import { createCalendarService } from './calendar/service.mjs'
import { createCalendarLoaders } from './calendar/loaders.mjs'
import { createCalendarRouter } from './calendar-route.mjs'
import { createDayRouter, createDayService } from './day/service.mjs'
import { createStudyFocus, createStudyTick, createStudyTickHandler } from './study/hub/tick.mjs'
import { createReviewRouter, createReviewService } from './review/service.mjs'
import { createNoticesRouter, createNoticesService } from './notices/service.mjs'
import { createShopping, createShoppingRouter, loadBudgetRules } from './home/shopping.mjs'
import { dateKey } from '../code/life-os/shared/calendar.js'
import { createStudyRuntime } from './study/runtime.mjs'
import { createStudyRouter } from '../code/life-os/backend/src/modules/study/router.js'
import { saveStudyUpload, studyFilesRoot } from './study/storage.mjs'
import { createHubRouter } from './study/hub/router.mjs'
import { skinFiles, skinnedPage } from './skins/index.mjs'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SUMMER_PATH = '/apps/summer-rescue/'
export const CARDIFF_PATH = '/apps/cardiff-life/'

export function createLifeOsApp(options = {}) {
  const app = express()
  const summerRoot = options.summerRoot ?? path.join(projectRoot, 'summer-rescue')
  const summerDist = options.summerDist ?? path.join(summerRoot, 'dist')
  const cardiffRoot = options.cardiffRoot ?? path.join(projectRoot, 'cardiff-life')
  const budgetRoot = options.budgetRoot ?? path.join(projectRoot, 'budget-management')
  const getBudgetPort = options.getBudgetPort ?? (() => null)
  const jobmapRoot = options.jobmapRoot ?? path.join(projectRoot, 'jobmap')
  const getJobMapPort = options.getJobMapPort ?? (() => null)
  const mainDist = options.mainDist ?? path.join(projectRoot, 'code/life-os/frontend/dist')
  const token = options.token ?? process.env.LIFE_OS_TOKEN ?? 'dev-token-change-me'
  const study = options.studyRuntime ?? createStudyRuntime(projectRoot)
  app.locals.studyRuntime = study

  app.get('/__life-os/health', (_req, res) => res.json({
    app: 'life-os', root: projectRoot, pid: process.pid,
    subapps: [
      { id: 'study-hub', route: '/study', document: SUMMER_PATH, root: summerRoot },
      { id: 'cardiff-life', route: '/cardiff-life', document: CARDIFF_PATH, root: cardiffRoot },
      { id: 'budget', route: '/budget', document: BUDGET_PATH, root: budgetRoot, running: Boolean(getBudgetPort()) },
      { id: 'jobmap', route: '/jobmap', document: JOBMAP_PATH, root: jobmapRoot, running: Boolean(getJobMapPort()) },
    ],
  }))

  if (options.onStop && options.controlToken) {
    app.post('/__life-os/stop', (req, res) => {
      if (req.get('x-life-os-control') !== options.controlToken) return res.sendStatus(403)
      res.json({ ok: true })
      setImmediate(options.onStop)
    })
  }

  // One look for every framed app: the shared skin files, added to each app's page as it is served.
  app.use('/skins', skinFiles(express, { palettes: path.join(projectRoot, 'code/life-os/frontend/src/styles/palettes.css') }))

  // Budget Management keeps its own server; forward its document and API.
  // Mounted before any body parsing so request streams reach it untouched.
  app.use(BUDGET_PATH.slice(0, -1), budgetProxy(getBudgetPort))
  budgetBrowserRoutes(app, budgetRoot)
  app.use(JOBMAP_PATH.slice(0, -1), jobMapProxy(getJobMapPort))

  // The Study hub app. What it saves (one workspace per semester) goes to the Study
  // database through the hub router. Files kept for study are still served by the app's
  // own file handler, which reads request streams and so runs before JSON parsing. That
  // handler sets its own security headers on every request it sees (including "never
  // show this in a frame"), so it is handed only the addresses it owns.
  const trackerApi = createLocalTrackerApi({ projectRoot: summerRoot })
  const trackerPaths = /^\/(?:study-assets\/|api\/resources(?:\/|$))/
  app.use((req, res, next) => (trackerPaths.test(req.path) ? trackerApi(req, res, next).catch(next) : next()))
  const hubPaths = /^\/api\/(?:health|state|local-tracker-state|events|data-health|hub)(?:\/|$)/
  const hubRouter = study.hub ? createHubRouter({
    express, store: study.hub, repository: study.repository,
    readAssetsManifest: async () => JSON.parse(await fs.promises.readFile(path.join(summerRoot, 'public/study-assets-manifest.json'), 'utf8')),
  }) : null
  app.use((req, res, next) => {
    if (!hubPaths.test(req.path)) return next()
    if (!hubRouter) return res.status(503).json({ ok: false, error: 'The Study hub needs the Life OS database, which is not set up on this computer.' })
    return hubRouter(req, res, next)
  })
  app.get([SUMMER_PATH, `${SUMMER_PATH}index.html`], skinnedPage(path.join(summerDist, 'index.html'), 'study-hub'))
  app.use(SUMMER_PATH.slice(0, -1), express.static(summerDist, { fallthrough: false }))
  // Cardiff Life is a self-contained static page generated by build_html.py.
  // Its linked report files are shown as plain text, as when opened locally.
  app.get([CARDIFF_PATH, `${CARDIFF_PATH}index.html`], skinnedPage(path.join(cardiffRoot, 'index.html'), 'cardiff-life'))
  app.use(CARDIFF_PATH.slice(0, -1), express.static(cardiffRoot, {
    fallthrough: false,
    setHeaders(res, filePath) {
      if (/\.(md|csv)$/i.test(filePath)) res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    },
  }))
  app.use('/study-files', express.static(studyFilesRoot(projectRoot), {
    fallthrough: false, dotfiles: 'deny',
    setHeaders(res, filename) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      if (/\.html?$/i.test(filename)) res.setHeader('Content-Security-Policy', 'sandbox')
      if (/\.(?:py|r|js|sql|md|txt|csv|ipynb|json)$/i.test(filename)) res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }
  }))

  app.use(express.json({ limit: '36mb' }))
  app.use('/api', (req, res, next) => {
    if ((req.get('authorization') || '') !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    next()
  })
  app.use('/api/entries', entriesRouter)
  app.use('/api/people', peopleRouter)
  app.use('/api/settings', settingsRouter)
  app.post('/api/study/uploads', async (req, res, next) => {
    try { res.status(201).json(await saveStudyUpload(projectRoot, req.body, study.repository)) }
    catch (error) { next(error) }
  })
  const discoveryAction = (action, readBody = false) => async (req, res, next) => {
    try {
      if (!study.discovery || typeof study.discovery[action] !== 'function') throw Object.assign(new Error('Study folder discovery is unavailable until storage is configured'), { status: 503 })
      res.set('Cache-Control', 'no-store')
      res.json(await study.discovery[action](readBody ? req.body || {} : undefined))
    } catch (error) { next(error) }
  }
  app.get('/api/study/discovery', discoveryAction('status'))
  app.post('/api/study/discovery/configure', discoveryAction('configure', true))
  app.post('/api/study/discovery/scan', discoveryAction('scan', true))
  app.post('/api/study/discovery/preview', discoveryAction('preview', true))
  app.get('/api/study/backups', async (_req, res, next) => {
    try {
      if (!study.backups) throw Object.assign(new Error('Study backups are unavailable until storage is configured'), { status: 503 })
      res.set('Cache-Control', 'no-store')
      res.json(await study.backups.status())
    } catch (error) { next(error) }
  })
  app.use('/api/study', createStudyRouter({ repository: study.repository, imports: study.imports }))
  const calendarLoaders = createCalendarLoaders({
    projectRoot, summerRoot, cardiffRoot, getBudgetPort, getJobMapPort,
    // The range filter happens in the provider so it can include spanning
    // events, type-specific deadlines and annual dates without the old cap.
    loadEntries: () => db.prepare('SELECT * FROM entries').all(),
    loadPeople: () => db.prepare('SELECT * FROM people').all(),
    loadStudy: async () => {
      if (!study.configured) throw new Error('Study state is unavailable')
      const nativeWorkspace = await study.repository.workspace()
      // Each open semester's Study hub plan, for its study blocks. A plan that cannot be read
      // leaves the rest of Study on the calendar.
      const open = nativeWorkspace.semesters.filter((row) => !['completed', 'archived'].includes(String(row.status ?? '').toLowerCase()))
      const hubPlans = study.hub ? await Promise.all(open.map(async (row) => ({ semesterId: row.id, plan: await study.hub.plan(row.id).catch(() => ({})) }))) : []
      return { nativeWorkspace, hubPlans }
    },
    ...options.calendarLoaders,
  })
  const calendarService = createCalendarService(calendarLoaders)
  app.use('/api/calendar', createCalendarRouter(calendarService))
  // What a day needs beyond its dated items: study blocks with their cards, and the current
  // content of Study, Jobs, Home and Notes. Read only.
  // A step of a study card ticked from the day, saved by the Study hub's own rule and revision check.
  app.post('/api/day/study', createStudyTickHandler(options.studyTick ?? createStudyTick({ hub: study.hub })))
  // A focus session from the Life OS timer, added to the card it was spent on.
  app.post('/api/day/study/focus', createStudyTickHandler(options.studyFocus ?? createStudyFocus({ hub: study.hub }), (body) => ({ semester: body.semester, card: body.card, minutes: body.minutes })))
  const dayService = createDayService({
    loadStudy: async () => {
      if (!study.configured) throw new Error('Study state is unavailable')
      return study.repository.workspace()
    },
    loadPlans: async (semesterId) => (study.hub ? study.hub.plan(semesterId) : {}),
    loadCareer: calendarLoaders.loadCareer,
    loadBudget: calendarLoaders.loadBudget,
    loadEntries: () => db.prepare("SELECT * FROM entries WHERE type IN ('note', 'time-block')").all(),
    ...options.dayLoaders,
  })
  app.use('/api/day', createDayRouter({ express, service: dayService }))
  let budgetRules
  const budgetFigures = (state, month) => { budgetRules ??= loadBudgetRules(budgetRoot); return budgetRules.forecast(state, month) }
  // Notices for the whole app: what is on now, starts soon, is asked of today, has slipped, is close ahead. Read only.
  app.use('/api/notices', createNoticesRouter({ express, service: options.notices ?? createNoticesService({
    dayOf: dayService, calendarOf: calendarService,
    loadEntries: () => db.prepare("SELECT * FROM entries WHERE type IN ('task', 'time-block')").all(),
    loadBudget: calendarLoaders.loadBudget, budgetFigures,
  }) }))
  // A week looked back on across every part. Read only. "Spent" is Budget's own month rule.
  app.use('/api/review', createReviewRouter({ express, service: createReviewService({
    loadStudy: async () => {
      if (!study.configured) throw new Error('Study state is unavailable')
      return study.repository.workspace()
    },
    loadPlans: async (semesterId) => (study.hub ? study.hub.plan(semesterId) : {}),
    loadEvents: async (semesterId) => (study.hub ? study.hub.recentEvents(semesterId, 1000) : []),
    loadCareer: calendarLoaders.loadCareer,
    loadBudget: calendarLoaders.loadBudget,
    loadEntries: () => db.prepare("SELECT * FROM entries WHERE type IN ('note', 'task', 'event', 'time-block')").all(),
    budgetFigures,
    ...options.reviewLoaders,
  }) }))
  // Things to buy, added from anywhere in Life OS, go into Budget's own shopping list.
  app.use('/api/home/shopping', createShoppingRouter({ express, shopping: options.shopping ?? createShopping({ budgetRoot, getBudgetPort, today: () => dateKey(new Date()) }) }))
  app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }))

  app.use(express.static(mainDist))
  app.use((req, res) => {
    if (req.method !== 'GET' || path.extname(req.path)) return res.sendStatus(404)
    res.sendFile(path.join(mainDist, 'index.html'))
  })
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error)
    const status = error.status || 500
    res.status(status).json({ error: status === 404 ? 'not found' : status >= 400 && status < 500 ? error.message : 'Local server error' })
  })
  return app
}
