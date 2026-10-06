import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createCalendarService } from './service.mjs'
import { createCalendarLoaders, getLocalJson, parseEventsCsv } from './loaders.mjs'
import { mapEntries, mapPeople, mapStudy, mapCareer, mapBudget, mapHome, mapEvents, subscriptionDates, londonInstant } from './mappers.mjs'

const october = { from: '2026-10-01', to: '2026-10-31' }
const emptyLoaders = () => ({ ...Object.fromEntries(['loadEntries', 'loadPeople', 'loadCareer', 'loadEvents'].map(key => [key, async () => []])), loadStudy: async () => null, loadBudget: async () => ({ state: null }) })

test('the shared service accepts native Study and maps it once without a legacy fallback', async () => {
  const nativeWorkspace = { semesters: [], modules: [], cards: [], assessments: [], sessions: [{ id: 'fixture-session', title: 'Reading', status: 'planned', start_at: '2026-10-05T09:00:00Z', end_at: '2026-10-05T10:00:00Z', data: { category: 'reading' } }] }
  const result = await createCalendarService({ ...emptyLoaders(), loadStudy: async () => ({ nativeWorkspace }) })({ from: '2026-10-01', to: '2026-10-31' })
  assert.equal(result.sources.find(row => row.id === 'study').status, 'ready')
  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].id, 'study:native:sessions:fixture-session')
  assert.equal(result.items[0].href, '/study?session=fixture-session')
})

test('core reads every dated type and inclusive multi-day spans, preserving source identity', () => {
  const rows = [
    { id: 'trip', type: 'trip', title: 'Travel', start_at: '2026-09-29', end_at: '2026-10-02', details: {} },
    { id: 'note', type: 'note', title: 'Dated note', start_at: '2026-10-31', details: '{}' },
    { id: 'deadline', type: 'assignment', title: 'Hand in', start_at: '2026-10-05', details: {} },
    { id: 'undated', type: 'task', title: 'Undated', details: {} },
    { id: 'invalid', type: 'task', start_at: '2026-02-30' },
    { id: 'done', type: 'task', start_at: '2026-10-02', status: 'Done' },
    { id: 'archived', type: 'task', start_at: '2026-10-02', status: 'Archived' },
    { id: 'invalid-end', type: 'task', start_at: '2026-10-02', end_at: 'not a date' },
  ]
  const items = mapEntries(rows, october)
  assert.deepEqual(items.map(row => row.meta.entryId), ['trip', 'note', 'deadline'])
  assert.equal(items[0].end, '2026-10-02')
  assert.equal(items[1].all_day, true)
  assert.equal(items[2].area, 'study')
  assert.equal(items[2].kind, 'deadline')
  assert.equal(items[2].meta.readonly, false)
})

test('timed core month edges follow London and midnight ends are exclusive', () => {
  const rows = [
    { id: 'london', type: 'event', title: 'After midnight', start_at: '2026-09-30T23:30:00Z' },
    { id: 'end', type: 'event', start_at: '2026-09-30T21:00:00Z', end_at: '2026-09-30T23:00:00Z' },
    { id: 'november', type: 'event', start_at: '2026-11-01T00:00:00Z' },
    { id: 'local', type: 'event', start_at: '2026-10-01T08:00' },
  ]
  const items = mapEntries(rows, october)
  assert.deepEqual(items.map(row => row.meta.entryId), ['london', 'local'])
  assert.equal(items[1].start, '2026-10-01T07:00:00.000Z')
})

test('annual relationships dates cross New Year and never invent a leap birthday date', () => {
  const people = [{ id: 'one', name: 'Alex', birthday: '1990-12-31' }, { id: 'two', name: 'Bo', birthday: '1991-01-01' }, { id: 'leap', name: 'Cam', birthday: '2000-02-29' }]
  assert.deepEqual(mapPeople(people, { from: '2026-12-30', to: '2027-01-02' }).map(row => row.start), ['2026-12-31', '2027-01-01'])
  assert.equal(mapPeople(people, { from: '2027-02-01', to: '2027-03-01' }).length, 0)
  assert.equal(mapPeople(people, { from: '2028-02-01', to: '2028-03-01' })[0].start, '2028-02-29')
  const recurring = mapEntries([{ id: 'ann', type: 'important-date', title: 'Anniversary', start_at: '2016-10-09', details: { recurs: true } }], october)
  assert.equal(recurring[0].start, '2026-10-09')
})

test('Study merges user date edits, excludes completed and disabled-module plans, uses only recorded exam dates', () => {
  const value = {
    baseCards: [
      { id: 'edited', title: 'Original plan', moduleGroup: 'Topic', startDate: '2026-09-01', dueDate: '2026-09-01' },
      { id: 'done', title: 'Finished old plan', dueDate: '2026-10-03' },
      { id: 'disabled', title: 'Inactive module', moduleGroup: 'MAT700', dueDate: '2026-10-03' },
      { id: 'undated', title: 'No date' },
    ],
    state: {
      cards: { edited: { edits: { title: 'Updated plan', startDate: '2026-10-07', dueDate: '2026-10-08' } }, done: { done: true } },
      addedCards: [{ id: 'added', title: 'User plan', dueDate: '2026-10-09' }],
      settings: { mat700Active: false, moduleExamDates: { custom: '2026-10-11', mat700: '2026-10-14', unset: '', bad: '2026-02-30' }, examWindowStart: '2026-10-01' },
    },
  }
  const before = structuredClone(value), items = mapStudy(value, october)
  assert.deepEqual(items.map(row => row.id), ['study:start:edited', 'study:deadline:edited', 'study:deadline:added', 'study:exam:custom'])
  assert.equal(items[0].title, 'Start · Updated plan')
  assert.equal(items[0].end, null)
  assert.equal(items[1].start, '2026-10-08')
  assert.deepEqual(value, before)
})

test('Career deadlines respect shortlist/application state and follow-ups must be explicit', () => {
  const jobs = [
    { id: 'saved', role: 'Role', company: 'Org', saved: true, status: 'Preparing', deadline: '2026-10-09', followUp: '2026-10-12' },
    { id: 'applied', status: 'Applied', deadline: '2026-10-10' },
    { id: 'noise', status: 'To review', deadline: '2026-10-11' },
    { id: 'archived', saved: true, status: 'Archived', deadline: '2026-10-12', followUp: '2026-10-14' },
    { id: 'closed', saved: true, status: 'Applied', availability: 'closed', deadline: '2026-10-12', followUp: '2026-10-14' },
    { id: 'invalid', status: 'Applied', deadline: 'TBC', followUp: '2026-02-30' },
  ]
  assert.deepEqual(mapCareer({ jobs }, october).map(row => row.id), ['career:deadline:saved', 'career:follow-up:saved', 'career:deadline:applied', 'career:follow-up:closed'])
})

test('subscription recurrence keeps the month-end anchor and advances from nextDue only', () => {
  const sub = { id: 'monthly', name: 'Tool', interval: 'monthly', nextDue: '2026-01-31', costPence: 1234 }
  assert.deepEqual(subscriptionDates(sub, { from: '2026-02-01', to: '2026-04-30' }), ['2026-02-28', '2026-03-31', '2026-04-30'])
  assert.deepEqual(subscriptionDates({ ...sub, nextDue: '2026-02-28', anchorDay: 31 }, { from: '2026-03-01', to: '2026-03-31' }), ['2026-03-31'])
  assert.deepEqual(subscriptionDates({ ...sub, interval: 'weekly', nextDue: '2026-10-02' }, october), ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30'])
  assert.deepEqual(subscriptionDates({ ...sub, interval: 'yearly', nextDue: '2024-02-29', anchorDay: 29 }, { from: '2027-02-01', to: '2027-03-01' }), ['2027-02-28'])
  assert.deepEqual(subscriptionDates({ ...sub, paused: true }, october), [])
  assert.deepEqual(subscriptionDates({ ...sub, nextDue: '2026-10-01', anchorDay: 31 }, { from: '2026-10-01', to: '2026-10-10' }), ['2026-10-01'])
  const items = mapBudget({ revision: 10, state: { subscriptions: [sub] } }, october)
  assert.equal(items[0].start, '2026-10-31')
  assert.equal(items[0].meta.costPence, 1234)
})

test('home emits only actual dated planned shopping and meals; no stock/receipt guesses', () => {
  const state = {
    lists: [{ id: 'shop', name: 'Essentials', date: '2026-10-05', lines: [{ status: 'planned' }, { status: 'bought' }] }, { id: 'empty', date: '2026-10-06', lines: [] }],
    mealEntries: [{ id: 'meal', name: 'Lunch', date: '2026-10-06', status: 'planned' }, { id: 'cooked', date: '2026-10-07', status: 'cooked' }],
    receipts: [{ date: '2026-10-05' }], lots: [{ expires: '2026-10-05' }],
  }
  assert.deepEqual(mapHome({ state }, october).map(row => row.id), ['home:shopping:shop', 'home:meal:meal'])
})

test('Money month starts come only from configured budget month keys', () => {
  const state = { budgets: { '2026-10': { total: 200 }, '2026-11': { total: 220 }, '2026-13': { total: 50 }, invalid: {}, '2026-09': null }, subscriptions: [] }
  const before = structuredClone(state), items = mapBudget({ state }, october)
  assert.deepEqual(items.map(row => row.id), ['money:month:2026-10'])
  assert.equal(items[0].start, '2026-10-01')
  assert.equal(items[0].meta.type, 'budget-month')
  assert.deepEqual(state, before)
})

test('core all-day timestamps remain civil dates and Study due clock follows user module/date edits', () => {
  const core = mapEntries([{ id: 'all-day', type: 'event', start_at: '2026-10-04T00:00:00Z', all_day: true }], october)
  assert.equal(core[0].start, '2026-10-04')
  assert.equal(core[0].all_day, true)
  const value = { baseCards: [{ id: 'card', title: 'Plan', moduleGroup: 'MAT700', startDate: '2026-10-05', dueDate: '2026-10-05', dueDateTime: '2026-10-05 16:00' }], state: { cards: { card: { edits: { module: 'New module', dueDate: '2026-10-06' } } }, settings: { mat700Active: false } } }
  const study = mapStudy(value, october)
  assert.equal(study.length, 2)
  assert.equal(study[0].meta.module, 'New module')
  assert.equal(study[1].start, '2026-10-06')
  value.state.cards.card.edits.dueDateTime = '2026-10-06 16:00'
  assert.equal(mapStudy(value, october)[1].start, '2026-10-06T15:00:00.000Z')
})

test('Cardiff candidates preserve IDs, validate London clocks, and never guess undated recurrence', () => {
  const events = [
    { event_id: 'timed', name: 'Meet', date: '2026-10-05', start_time: '18:00', end_time: '19:00', status: 'upcoming' },
    { event_id: 'overnight', name: 'Late event', date: '2026-10-04', start_time: '23:00', end_time: '01:00', status: 'upcoming' },
    { event_id: 'unknown', name: 'Time TBC', date: '2026-10-09', start_time: 'TBC', status: 'needs_verification' },
    { event_id: 'repeat', name: 'Every week', date: '', recurring: 'Every Monday', status: 'recurring' },
    { event_id: 'archived', date: '2026-10-05', status: 'archived' },
    { event_id: 'invalid', date: '2026-02-30', status: 'upcoming' },
  ]
  const items = mapEvents(events, october)
  assert.deepEqual(items.map(row => row.meta.eventId), ['timed', 'overnight', 'unknown'])
  assert.equal(items[0].start, '2026-10-05T17:00:00.000Z')
  assert.equal(items[1].end, '2026-10-05T00:00:00.000Z')
  assert.equal(items[2].all_day, true)
  assert.equal(londonInstant('2026-03-29', '01:30'), null)
  assert.equal(londonInstant('2026-10-25', '01:30'), null)
  assert.equal(londonInstant('2026-10-26', '01:30'), '2026-10-26T01:30:00.000Z')
})

test('service isolates unavailable sources and reads Budget only once without mutating inputs', async () => {
  let reads = 0
  const state = { subscriptions: [{ id: 'renew', name: 'Tool', nextDue: '2026-10-05', interval: 'monthly' }], lists: [{ id: 'shop', date: '2026-10-06', lines: [{ status: 'planned' }] }] }
  const before = structuredClone(state)
  const service = createCalendarService({ ...emptyLoaders(), loadStudy: async () => { throw new Error('private path') }, loadBudget: async () => { reads += 1; return { state } }, loadEntries: async () => [{ id: 'core', type: 'task', start_at: '2026-10-05' }] })
  const result = await service(october)
  assert.equal(reads, 1)
  assert.deepEqual(result.items.map(row => row.area), ['money', 'core', 'home'])
  assert.equal(result.sources.find(row => row.area === 'study').status, 'unavailable')
  assert.equal(result.sources.find(row => row.area === 'money').status, 'ready')
  assert.equal(result.sources.find(row => row.area === 'home').status, 'ready')
  assert.ok(!JSON.stringify(result).includes('private path'))
  assert.deepEqual(state, before)
})

test('service timeout returns remaining sources and refuses malformed or oversized ranges before reads', async () => {
  let reads = 0
  const service = createCalendarService({ ...emptyLoaders(), timeoutMs: 10, loadCareer: () => new Promise(() => {}), loadEntries: async () => { reads += 1; return [] } })
  await assert.rejects(service({ from: '2026-02-30', to: '2026-10-01' }), error => error.status === 400)
  await assert.rejects(service({ from: '2027-01-01', to: '2026-01-01' }), error => error.status === 400)
  await assert.rejects(service({ from: '2026-01-01', to: '2028-01-01' }), error => error.status === 400)
  assert.equal(reads, 0)
  const result = await service(october)
  assert.equal(result.sources.find(row => row.area === 'career').status, 'unavailable')
  assert.equal(result.sources.find(row => row.area === 'core').status, 'ready')
})

test('unusable source shapes are unavailable and global Cardiff IDs include rescheduled and cancelled records', async () => {
  const service = createCalendarService({ ...emptyLoaders(), loadCareer: async () => ({ error: 'Not jobs' }), loadStudy: async () => ({ error: 'Not study state' }), loadEvents: async () => [
    { event_id: 'this-month', name: 'Current', date: '2026-10-05', status: 'upcoming' },
    { event_id: 'rescheduled', name: 'Moved', date: '2026-11-05', status: 'upcoming' },
    { event_id: 'cancelled', name: 'Cancelled', date: '2026-10-05', status: 'cancelled' },
    { event_id: 'cancelled', name: 'Duplicate record', date: '', status: 'cancelled' },
  ] })
  const result = await service(october)
  assert.deepEqual(result.items.map(row => row.meta.eventId), ['this-month'])
  assert.deepEqual(result.knownEventIds, ['this-month', 'rescheduled', 'cancelled'])
  assert.equal(result.sources.find(row => row.area === 'career').status, 'unavailable')
  assert.equal(result.sources.find(row => row.area === 'study').status, 'unavailable')
  const unavailable = await createCalendarService({ ...emptyLoaders(), loadEvents: async () => { throw new Error('No events') } })(october)
  assert.equal(unavailable.knownEventIds, null)
})

test('CSV parser handles quoted commas, escaped quotes, multiline fields and BOM without dropping rows', () => {
  const csv = '\uFEFFevent_id,name,date,notes\r\n"one","A, B","2026-10-05","line one\nline ""two"""\r\n'
  assert.deepEqual(parseEventsCsv(csv), [{ event_id: 'one', name: 'A, B', date: '2026-10-05', notes: 'line one\nline "two"' }])
  assert.throws(() => parseEventsCsv('event_id,name,date\na,b'), /incomplete row/)
  assert.throws(() => parseEventsCsv('event_id,name,date\na,"b,c'), /unterminated/)
})

test('local source adapter sends GET only, has no save headers and rejects source errors', async t => {
  const calls = []
  const server = http.createServer((req, res) => {
    calls.push({ method: req.method, path: req.url, headers: req.headers })
    res.writeHead(req.url === '/api/jobs' ? 200 : 503, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ jobs: [] }))
  })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const port = server.address().port
  assert.deepEqual(await getLocalJson(port, '/api/jobs'), { jobs: [] })
  await assert.rejects(getLocalJson(port, '/api/state'), /Source read failed/)
  assert.ok(calls.every(row => row.method === 'GET'))
  assert.ok(calls.every(row => !row.headers['x-planner-action'] && !row.headers['x-jobmap-client'] && !row.headers['content-type']))
  assert.ok(calls.every(row => row.headers.host === `127.0.0.1:${port}`))
  await assert.rejects(getLocalJson(null, '/api/state'), /not running/)
})

test('production loaders preserve source files and read the injected Study state without opening its page', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'life-os-calendar-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const csvPath = path.join(root, 'events.csv'), csv = 'event_id,name,date,status\none,Fixture,2026-10-05,upcoming\n'
  await writeFile(csvPath, csv)
  const loaders = createCalendarLoaders({ projectRoot: root, cardiffRoot: root, getBudgetPort: () => null, getJobMapPort: () => null, loadEntries: async () => [], loadPeople: async () => [] })
  assert.equal((await loaders.loadEvents())[0].event_id, 'one')
  assert.equal(await readFile(csvPath, 'utf8'), csv)
  await assert.rejects(loaders.loadStudy(october), /unavailable/)
  await assert.rejects(loaders.loadCareer(), /not running/)
  await assert.rejects(loaders.loadBudget(), /not running/)
})
