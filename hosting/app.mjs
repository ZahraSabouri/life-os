import express from '../code/life-os/backend/node_modules/express/index.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import entriesRouter from '../code/life-os/backend/src/routes/entries.js'
import peopleRouter from '../code/life-os/backend/src/routes/people.js'
import settingsRouter, { readSetting, writeSetting } from '../code/life-os/backend/src/routes/settings.js'
import filesRouter from '../code/life-os/backend/src/routes/files.js'
import { createLocalTrackerApi } from '../summer-rescue/src/server/localTrackerApi.js'
import { BUDGET_PATH, budgetProxy } from './budget.mjs'
import { budgetBrowserRoutes } from './budget-browser-data.mjs'
import { JOBMAP_PATH, jobMapProxy } from './jobmap.mjs'
import db, { ENTRY_COLUMNS, PERSON_COLUMNS } from '../code/life-os/backend/src/db.js'
import { createCalendarService } from './calendar/service.mjs'
import { createCalendarLoaders } from './calendar/loaders.mjs'
import { createCalendarRouter } from './calendar-route.mjs'
import { createDayRouter, createDayService } from './day/service.mjs'
import { createChecksRouter, createDayChecks } from './day/checks.mjs'
import { createThing, createThingRouter } from './thing.mjs'
import { createStudyFocus, createStudyTick, createStudyTickHandler } from './study/hub/tick.mjs'
import { createReviewRouter, createReviewService } from './review/service.mjs'
import { createAnalysisRouter, createAnalysisService, MAX_ANALYSIS_DAYS } from './review/analysis.mjs'
import { createNoticesRouter, createNoticesService } from './notices/service.mjs'
import { createDesktopNotifier, windowsToast } from './notices/desktop.mjs'
import { withRoutines } from '../code/life-os/shared/routines.js'
import { createOwnEvents, createOwnEventsRouter } from './events/own-events.mjs'
import { createJobMark, createJobMarkHandler } from './career/mark.mjs'
import { createGuideRouter } from './guide.mjs'
import { createShopping, createShoppingRouter, loadBudgetRules } from './home/shopping.mjs'
import { createFood, createFoodRouter } from './health/food.mjs'
import { dateKey } from '../code/life-os/shared/calendar.js'
import { createStudyRuntime } from './study/runtime.mjs'
import { createStudyRouter } from '../code/life-os/backend/src/modules/study/router.js'
import { createMailRuntime } from './mail/inbox.mjs'
import { createMailRouter } from '../code/life-os/backend/src/modules/mail/router.js'
import { createPlaces } from './mail/places.mjs'
import { saveStudyUpload, studyFilesRoot } from './study/storage.mjs'
import { createHubRouter } from './study/hub/router.mjs'
import { skinFiles, skinnedPage } from './skins/index.mjs'
import { dataRoot, eventsRoot, lifeOsOrigin, movedAddresses } from '../code/life-os/backend/src/paths.js'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SUMMER_PATH = '/apps/summer-rescue/'
export const EVENTS_PATH = '/apps/events/'

export function createLifeOsApp(options = {}) {
  const app = express()
  const summerRoot = options.summerRoot ?? path.join(projectRoot, 'summer-rescue')
  const summerDist = options.summerDist ?? path.join(summerRoot, 'dist')
  const eventsFolder = options.eventsRoot ?? eventsRoot(projectRoot)
  const budgetRoot = options.budgetRoot ?? path.join(projectRoot, 'budget-management')
  const getBudgetPort = options.getBudgetPort ?? (() => null)
  const jobmapRoot = options.jobmapRoot ?? path.join(projectRoot, 'jobmap')
  const getJobMapPort = options.getJobMapPort ?? (() => null)
  const mainDist = options.mainDist ?? path.join(projectRoot, 'code/life-os/frontend/dist')
  const token = options.token ?? process.env.LIFE_OS_TOKEN ?? 'dev-token-change-me'
  const study = options.studyRuntime ?? createStudyRuntime(projectRoot)
  app.locals.studyRuntime = study
  const mail = options.mailRuntime !== undefined ? options.mailRuntime : createMailRuntime(projectRoot, { findPeople: () => db.prepare('SELECT id, name, contact, birthday FROM people').all() })
  app.locals.mailRuntime = mail

  // Addresses that moved (LIFE_OS_MOVED_ADDRESSES) send the browser on, keeping the method, the
  // rest of the path, the query and the #part.
  const moved = options.movedAddresses ?? movedAddresses()
  if (moved.length) app.use((req, res, next) => {
    for (const [from, to] of moved) {
      const under = from.endsWith('/')
      const exact = req.path === from || req.path === from.replace(/\/$/, '')
      if (!exact && !(under && req.path.startsWith(from))) continue
      const rest = under && req.path.length > from.length ? req.path.slice(from.length) : ''
      return res.redirect(308, `${to}${rest}${req.originalUrl.slice(req.path.length)}`)
    }
    next()
  })

  app.get('/__life-os/health', (_req, res) => res.json({
    app: 'life-os', root: projectRoot, pid: process.pid,
    subapps: [
      { id: 'study-hub', route: '/study', document: SUMMER_PATH, root: summerRoot },
      { id: 'events', route: '/events', document: EVENTS_PATH, root: eventsFolder },
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
  // Events the owner adds herself: one setting in the core holds the list.
  const ownEvents = options.ownEvents ?? createOwnEvents({
    read: () => readSetting('own-events', []),
    write: (list) => writeSetting('own-events', list),
  })
  app.use(`${EVENTS_PATH}api/own-events`, createOwnEventsRouter({ express, events: ownEvents }))
  // "Retake the pictures" on the Guide page.
  app.use('/api/guide', createGuideRouter({ express, projectRoot, origin: options.origin ?? lifeOsOrigin() }))
  // The Guide's pictures: taken from the running app by scripts/guide-shots.mjs. They show her
  // own records, so the folder is not in git.
  app.use('/guide-shots', express.static(options.guideShots ?? path.join(projectRoot, 'guide-shots'), { fallthrough: false, maxAge: 0 }), (_error, _req, res, _next) => res.status(404).json({ error: 'No such picture' }))
  // Events is a self-contained static page built from the research by events/build_html.py.
  // Its linked report files are shown as plain text, as when opened locally.
  app.get([EVENTS_PATH, `${EVENTS_PATH}index.html`], skinnedPage(path.join(eventsFolder, 'index.html'), 'events'))
  app.use(EVENTS_PATH.slice(0, -1), express.static(eventsFolder, {
    fallthrough: false,
    setHeaders(res, filePath) {
      if (/\.(md|csv)$/i.test(filePath)) res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    },
  }))
  // Self-contained study apps (one offline index.html each), listed in Life_OS_data/study/study-apps.json as
  // [{ "id": "...", "file": "<absolute path to index.html>" }]. Unlike /study-files these run their scripts, so only
  // listed files are served, read where they are (never copied), and kept from calling out.
  app.get('/study-apps/:id/', (req, res) => {
    let apps = []
    try { apps = JSON.parse(fs.readFileSync(options.studyApps ?? path.join(dataRoot(projectRoot), 'study/study-apps.json'), 'utf8')) } catch {}
    const file = Array.isArray(apps) ? apps.find((row) => row?.id === req.params.id)?.file : null
    if (typeof file !== 'string' || !path.isAbsolute(file) || !/index\.html?$/i.test(file) || !fs.existsSync(file)) return res.status(404).json({ error: 'No such study app' })
    res.set({ 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self' data: blob: 'unsafe-inline'; connect-src data: blob:; frame-ancestors 'self'" })
    res.sendFile(file)
  })
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
  app.use('/api/files', filesRouter)
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
  // Where a harvested vacancy or event is now, from the calendar's own readers (set up below).
  let placeItems = async (items) => items
  if (mail) app.use('/api/mail', createMailRouter({ ...mail, places: (items) => placeItems(items) }))
  else app.use('/api/mail', (_req, res) => res.status(503).json({ error: 'Mail storage is not configured.' }))
  // A page asks for the day, the calendar, the notices and the week at once, and each of those
  // needs Study, JobMap and Budget. While one read of a part is under way, everyone who asks is
  // given that same read, instead of starting another. Nothing is kept once it has answered,
  // so the next request reads afresh.
  const together = (load) => {
    let running = null
    return () => (running ??= Promise.resolve().then(load).finally(() => { running = null }))
  }
  const loadWorkspace = together(async () => {
    if (!study.configured) throw new Error('Study state is unavailable')
    return study.repository.workspace()
  })
  const calendarLoaders = createCalendarLoaders({
    projectRoot, summerRoot, eventsRoot: eventsFolder, getBudgetPort, getJobMapPort,
    // The range filter happens in the provider so it can include spanning
    // events, type-specific deadlines and annual dates without the old cap.
    // With the days of her repeating plans in the stretch that is asked for.
    loadEntries: async (range) => withRoutines(await db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries ORDER BY seq`).all(), range?.from, range?.to),
    loadPeople: () => db.prepare(`SELECT ${PERSON_COLUMNS} FROM people`).all(),
    loadStudy: together(async () => {
      const nativeWorkspace = await loadWorkspace()
      // Each open semester's Study hub plan, for its study blocks. A plan that cannot be read
      // leaves the rest of Study on the calendar.
      const open = nativeWorkspace.semesters.filter((row) => !['completed', 'archived'].includes(String(row.status ?? '').toLowerCase()))
      const hubPlans = study.hub ? await Promise.all(open.map(async (row) => ({ semesterId: row.id, plan: await study.hub.plan(row.id).catch(() => ({})) }))) : []
      return { nativeWorkspace, hubPlans }
    }),
    ...options.calendarLoaders,
  })
  // JobMap's answer is five megabytes; Budget's is read by three services.
  calendarLoaders.loadCareer = together(calendarLoaders.loadCareer)
  // The researched events, and with them the ones she added herself.
  const researchedEvents = calendarLoaders.loadEvents
  // If her own list cannot be read, the researched events still show (a save then fails rather
  // than writing over the list, since read() throws instead of answering empty).
  calendarLoaders.loadEvents = async () => [...await researchedEvents(), ...await ownEvents.list().catch(() => [])]
  calendarLoaders.loadBudget = together(calendarLoaders.loadBudget)
  // A part gets eight seconds before the calendar says it could not be read (it was two and a half).
  // What she owes with a day, from the mail part.
  if (mail) calendarLoaders.loadMail = (range) => mail.reads.dated(range.from, range.to)
  placeItems = createPlaces({ loadCareer: () => calendarLoaders.loadCareer(), loadEvents: () => calendarLoaders.loadEvents() })
  // What came in with a day: a moved lab, a brief's due date, a hackathon's closing day (stage 5).
  if (mail) calendarLoaders.loadHarvest = (range) => mail.reads.datedItems(range.from, range.to)
  const calendarService = createCalendarService({ ...calendarLoaders, timeoutMs: 8000 })
  app.use('/api/calendar', createCalendarRouter(calendarService))
  // What a day needs beyond its dated items: study blocks with their cards, and the current
  // content of Study, Jobs, Home and Notes. Read only.
  // A step of a study card ticked from the day, saved by the Study hub's own rule and revision check.
  app.post('/api/day/study', createStudyTickHandler(options.studyTick ?? createStudyTick({ hub: study.hub })))
  // A job marked "applied" or "rejected" from the day, saved by JobMap's own server.
  app.post('/api/day/jobs', createJobMarkHandler(options.jobMark ?? createJobMark({ getJobMapPort })))
  // A focus session from the Life OS timer, added to the card it was spent on.
  app.post('/api/day/study/focus', createStudyTickHandler(options.studyFocus ?? createStudyFocus({ hub: study.hub }), (body) => ({ semester: body.semester, card: body.card, minutes: body.minutes })))
  const dayService = createDayService({
    loadStudy: loadWorkspace,
    loadPlans: async (semesterId) => (study.hub ? study.hub.plan(semesterId) : {}),
    loadCareer: calendarLoaders.loadCareer,
    loadBudget: calendarLoaders.loadBudget,
    loadEntries: () => db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE type IN ('note', 'time-block', 'task', 'repeat') ORDER BY seq`).all(),
    ...options.dayLoaders,
  })
  // The day's checklist: ticks for what keeps no done-state of its own (hosting/day/checks.mjs).
  app.use('/api/day/checks', createChecksRouter({ express, checks: createDayChecks({ readSetting, writeSetting }) }))
  app.use('/api/day', createDayRouter({ express, service: dayService }))
  // Everything about one thing on the calendar or the day, from where it is kept (hosting/thing.mjs).
  app.use('/api/thing', createThingRouter({ express, thing: createThing({
    loadEntry: (id) => db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ?`).get(id),
    loadWorkspace, loadCareer: () => calendarLoaders.loadCareer(), loadEvents: () => calendarLoaders.loadEvents(),
  }) }))
  let budgetRules
  const budgetFigures = (state, month) => { budgetRules ??= loadBudgetRules(budgetRoot); return budgetRules.forecast(state, month) }
  // Notices for the whole app: what is on now, starts soon, is asked of today, has slipped, is close ahead. Read only.
  const noticesService = options.notices ?? createNoticesService({
    dayOf: dayService, calendarOf: calendarService,
    loadEntries: () => db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE type IN ('task', 'time-block') ORDER BY seq`).all(),
    loadBudget: calendarLoaders.loadBudget, budgetFigures,
    loadMail: mail ? () => mail.reads.forNotices() : undefined,
    // The events she chose in Events (her browser keeps them; the app copies them here).
    loadChoices: () => readSetting('event-choices', null),
  })
  // While a tab is open the browser tells her; when none is, the server asks Windows to
  // (hosting/notices/desktop.mjs). Only the real server does this, not a try-out.
  // Started as if a tab had just asked: after a restart an open tab gets six minutes to ask again
  // before Windows is used, so a restart does not tell her what her tab already shows.
  let browserSeenAt = Date.now()
  const notifier = options.desktopNotices ? createDesktopNotifier({
    load: noticesService, show: options.showToast ?? windowsToast(), origin: options.origin ?? lifeOsOrigin(), browserSeenAt: () => browserSeenAt,
    prefs: () => readSetting('notices', {}).catch(() => ({})),
  }) : null
  app.locals.desktopNotifier = notifier
  // A gathered batch that brings urgent things says so once, through Windows.
  if (mail && notifier) mail.onApplied = (result) => (result.counts?.urgent ? notifier.tell(`${result.counts.urgent} urgent ${result.counts.urgent === 1 ? 'thing' : 'things'} in your mail`, 'Open Waiting on you in Life OS.', '/inbox') : null)
  app.use('/api/notices', (_req, _res, next) => { browserSeenAt = Date.now(); next() }, createNoticesRouter({ express, service: async () => { const result = await noticesService(); return { ...result, told: notifier?.told(result.today) ?? [] } } }))
  // A week looked back on across every part. Read only. "Spent" is Budget's own month rule.
  // What the review and the analysis read: the same loaders, so their numbers agree.
  const reviewLoaders = {
    loadStudy: loadWorkspace,
    loadPlans: async (semesterId) => (study.hub ? study.hub.plan(semesterId) : {}),
    loadEvents: async (semesterId) => (study.hub ? study.hub.recentEvents(semesterId, 1000) : []),
    loadCareer: calendarLoaders.loadCareer,
    loadBudget: calendarLoaders.loadBudget,
    loadEntries: () => db.prepare(`SELECT ${ENTRY_COLUMNS} FROM entries WHERE type IN ('note', 'task', 'event', 'time-block', 'repeat') ORDER BY seq`).all(),
    budgetFigures,
    ...options.reviewLoaders,
  }
  // The analysis of a longer stretch, and its rows as files. Mounted before the week's review.
  app.use('/api/review/analysis', createAnalysisRouter({ express, service: options.analysis ?? createAnalysisService({ ...reviewLoaders, review: createReviewService({ ...reviewLoaders, maxDays: MAX_ANALYSIS_DAYS }) }) }))
  app.use('/api/review', createReviewRouter({ express, service: createReviewService(reviewLoaders) }))
  // Things to buy, added from anywhere in Life OS, go into Budget's own shopping list.
  app.use('/api/home/shopping', createShoppingRouter({ express, shopping: options.shopping ?? createShopping({ budgetRoot, getBudgetPort, today: () => dateKey(new Date()) }) }))
  // Health's food: the UK recipes against what is at home in Budget, and one added to her recipes there.
  app.use('/api/health/food', createFoodRouter({ express, food: options.healthFood ?? createFood({ budgetRoot, getBudgetPort }) }))
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
