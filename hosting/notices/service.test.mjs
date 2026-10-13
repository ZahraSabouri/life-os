import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNotices, createNoticesService, openPlans } from './service.mjs'
import { settingText, settingValue } from '../../code/life-os/shared/settings.js'

// Monday 12 October 2026, 17:00 in London (British summer time).
const NOW = new Date('2026-10-12T16:00:00.000Z')
const TODAY = '2026-10-12'
const at = (clock, date = TODAY) => new Date(`${date}T${clock}:00+01:00`).toISOString()

const items = [
  { id: 'class', area: 'study', title: 'MAT022 · Lecture', start: at('15:10'), end: at('17:00'), all_day: false, href: '/study#/schedule', meta: {} },            // over by now
  { id: 'block', area: 'study', title: 'Library: diagnose the gaps', start: at('16:30'), end: at('17:30'), all_day: false, href: '/study#/today?card=x', meta: {} },  // on now
  { id: 'dinner', area: 'core', title: 'Dinner with Ben', start: at('17:40'), end: null, all_day: false, href: '/ledger#entry-1', meta: { source: 'core', type: 'event' } },   // in 40 min
  { id: 'late-plan', area: 'career', title: 'Job applications', start: at('20:00'), end: at('21:00'), all_day: false, meta: {} },                               // later today: not in the bell
  { id: 'done-plan', area: 'core', title: 'Gym', start: at('17:20'), end: at('18:00'), all_day: false, meta: { completed: true } },
  { id: 'tomorrow', area: 'study', title: 'Lecture tomorrow', start: at('09:00', '2026-10-13'), end: at('10:00', '2026-10-13'), all_day: false, meta: {} },
  { id: 'task1', area: 'core', title: 'Post the form', start: TODAY, all_day: true, meta: { source: 'core', type: 'task', status: 'planned' } },
  { id: 'task2', area: 'core', title: 'Laundry', start: TODAY, all_day: true, meta: { source: 'core', type: 'task', completed: true } },
  { id: 'sub', area: 'money', title: 'Phone plan renews', start: '2026-10-13', all_day: true, href: '/budget', meta: {} },
  { id: 'birthday', area: 'relationships', title: 'Sara\'s birthday', start: TODAY, all_day: true, meta: {} },
]
const day = {
  study: {
    today: [{ id: 'c1', title: 'Bayes table', done: false, href: '/study#/today?card=bayes' }, { id: 'c2', title: 'Plots', done: true, href: '/study' }],
    overdue: { count: 2, cards: [{ title: 'Old one', href: '/study#/today?card=old' }, { title: 'Older', href: '/study' }] },
    next: { id: 'a1', title: 'MAT022 · In-class test 1', days: 3 }, progress: { done: 4, total: 27 },
  },
  jobs: {
    closing: [{ id: 'j1', role: 'Data Manager', company: 'Swansea University', label: 'Full-time or over your hours · closes today', href: '/jobmap#job=j1' }],
    due: [{ id: 'j2', role: 'Analyst', days: 1, listed: true, applied: false, href: '/jobmap#job=j2' }, { id: 'j3', role: 'Sent', days: 1, listed: true, applied: true }, { id: 'j4', role: 'Not on the list', days: 1, listed: false, applied: false }],
    followUps: [{ id: 'j5', role: 'Tutor', company: 'B', days: -2, href: '/jobmap#job=j5' }, { id: 'j6', role: 'Later', company: 'C', days: 4 }],
  },
  home: { lists: [{ id: 'l1', name: 'Lidl', date: TODAY, items: [{ name: 'Milk' }, { name: 'Rice' }] }, { id: 'l2', name: 'Sometime', date: '2026-10-20', items: [{ name: 'Bicycle' }] }] },
}

test('notices come from every part, in order: on now, soon, asked of today, slipped, close ahead', () => {
  const { notices, upcoming, today } = buildNotices({ day, items, open: { count: 1, plans: [{ title: 'Email the tutor', href: '/today?date=2026-10-10' }] }, money: { month: '2026-10', spentPence: 27150, budgetPence: 25000, leftPence: -2150 }, now: NOW })
  assert.equal(today, TODAY)
  assert.deepEqual(notices.map((notice) => [notice.level, notice.id, notice.title]), [
    ['now', 'timed:block', 'Library: diagnose the gaps'],
    ['soon', 'timed:dinner', 'Dinner with Ben'],
    ['today', 'study:due:2026-10-12', '1 study card due today'],
    ['today', 'job:closes:j1:2026-10-12', 'Closes today: Data Manager'],
    ['today', 'home:list:l1:2026-10-12', '2 things to buy today'],
    ['today', 'dated:birthday:2026-10-12', 'Sara\'s birthday is today'],
    ['today', 'plans:today:2026-10-12', '1 plan of yours for today'],
    ['late', 'study:late:2026-10-12', '2 study cards past their date'],
    ['late', 'job:follow:j5:2026-10-12', 'Follow up: Tutor'],
    ['late', 'money:over:2026-10', 'Over this month\'s budget by £21.50'],
    ['late', 'plans:late:2026-10-12', '1 plan left unticked from earlier days'],
    ['ahead', 'study:test:a1:2026-10-12', 'MAT022 · In-class test 1 is in 3 days'],
    ['ahead', 'job:tomorrow:2026-10-12', '1 job on your list closes tomorrow'],
    ['ahead', 'dated:sub:2026-10-13', 'Phone plan renews is tomorrow'],
  ])
  const byId = Object.fromEntries(notices.map((notice) => [notice.id, notice]))
  assert.equal(byId['timed:block'].detail, 'On now, 16:30 to 17:30 · Study')
  assert.equal(byId['timed:dinner'].detail, 'Starts in 40 min, 17:40 · Your plans')
  assert.equal(byId['study:due:2026-10-12'].href, '/study#/today?card=bayes')            // one card: straight to it
  assert.equal(byId['job:closes:j1:2026-10-12'].href, '/jobmap#job=j1')
  assert.equal(byId['job:follow:j5:2026-10-12'].detail, 'B · was due 2 days ago')
  // What is still to start today, for telling her a few minutes before: not what is over, done, or tomorrow.
  assert.deepEqual(upcoming.map((row) => [row.id, row.at]), [['timed:dinner', '17:40'], ['timed:late-plan', '20:00']])
})

test('a quiet day has no notices, and a part that is missing only leaves its own out', () => {
  assert.deepEqual(buildNotices({ day: { study: { today: [], overdue: { count: 0, cards: [] }, next: { id: 'a', title: 'Test', days: 20 } }, jobs: { closing: [], due: [], followUps: [] }, home: { lists: [] } }, items: [], now: NOW }).notices, [])
  const partial = buildNotices({ day: null, items, now: NOW })
  assert.deepEqual(partial.notices.map((notice) => notice.id), ['timed:block', 'timed:dinner', 'dated:birthday:2026-10-12', 'plans:today:2026-10-12', 'dated:sub:2026-10-13'])
})

test('plans left unticked: her tasks and time set aside from the last week, not focus sessions or done things', () => {
  const entries = [
    { id: 'a', type: 'task', title: 'Email the tutor', status: 'planned', start_at: '2026-10-10', details: {} },
    { id: 'b', type: 'time-block', title: 'Job applications', status: 'planned', start_at: at('09:00', '2026-10-09'), details: JSON.stringify({ area: 'career' }) },
    { id: 'c', type: 'time-block', title: 'Reading', status: 'done', start_at: at('09:00', '2026-10-09'), details: { focus: true } },
    { id: 'd', type: 'task', title: 'Done already', status: 'done', start_at: '2026-10-11', details: {} },
    { id: 'e', type: 'task', title: 'Too old', status: 'planned', start_at: '2026-09-20', details: {} },
    { id: 'f', type: 'task', title: 'Today', status: 'planned', start_at: TODAY, details: {} },
    { id: 'g', type: 'event', title: 'A talk', status: null, start_at: at('18:00', '2026-10-08'), details: {} },
  ]
  assert.deepEqual(openPlans(entries, TODAY), { count: 2, plans: [{ id: 'b', title: 'Job applications', date: '2026-10-09', href: '/today?date=2026-10-09' }, { id: 'a', title: 'Email the tutor', date: '2026-10-10', href: '/today?date=2026-10-10' }] })
})

test('the service reads today and tomorrow, and says which part it could not read', async () => {
  const asked = []
  const service = createNoticesService({
    dayOf: async ({ date }) => { asked.push(`day ${date}`); return day },
    calendarOf: async ({ from, to }) => { asked.push(`calendar ${from} ${to}`); throw new Error('down') },
    loadEntries: () => [], loadBudget: async () => ({ state: {} }), budgetFigures: () => ({ totalSpent: 10, adjustedTotal: 250, totalRemaining: 240 }), now: () => NOW,
  })
  const result = await service()
  assert.deepEqual(asked, ['day 2026-10-12', 'calendar 2026-10-12 2026-10-13'])
  assert.deepEqual(result.missing, ['the calendar'])
  assert.ok(result.notices.some((notice) => notice.id === 'job:closes:j1:2026-10-12'))
  assert.ok(!result.notices.some((notice) => notice.id.startsWith('money:')))             // within budget: nothing to say
})

test('a setting has a plain name and a value that fits', () => {
  assert.equal(settingText('targets', { applications: 5 }), '{"applications":5}')
  assert.deepEqual(settingValue('{"applications":5}'), { applications: 5 })
  assert.equal(settingValue('not json'), null)
  assert.throws(() => settingText('Bad Key', 1), (error) => error.status === 400)
  assert.throws(() => settingText('targets', undefined), (error) => error.status === 400)
  assert.throws(() => settingText('big', 'x'.repeat(300 * 1024)), (error) => error.status === 413)
})

test('from the Study hub\'s own reminders: cards due tomorrow, and cards that have waited two days or more', () => {
  const study = {
    today: [], overdue: { count: 0, cards: [] }, next: null,
    tomorrow: [{ id: 'a', title: 'Hypothesis tests', href: '/study#/today?card=a' }],
    waiting: { count: 2, cards: [{ id: 'w1', title: 'Ask about the formula sheet', days: 4, href: '/study#/today?card=w1' }, { id: 'w2', title: 'Portfolio brief', days: 2, href: '/study#/today?card=w2' }] },
  }
  const { notices } = buildNotices({ day: { date: TODAY, study }, items: [], now: NOW })
  assert.deepEqual(notices.map((notice) => [notice.id, notice.level, notice.title, notice.detail, notice.href]), [
    [`study:waiting:${TODAY}`, 'late', '2 study cards waiting for two days or more', 'Ask about the formula sheet (4 days); Portfolio brief (2 days)', '/study'],
    [`study:tomorrow:${TODAY}`, 'ahead', '1 study card due tomorrow', 'Hypothesis tests', '/study#/today?card=a'],
  ])
  // Nothing due tomorrow and nothing waiting: neither notice is made.
  assert.deepEqual(buildNotices({ day: { date: TODAY, study: { today: [], overdue: { count: 0, cards: [] }, next: null, tomorrow: [], waiting: { count: 0, cards: [] } } }, items: [], now: NOW }).notices, [])
})
