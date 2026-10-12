import test from 'node:test'
import assert from 'node:assert/strict'
import { createReviewService, MAX_DAYS } from './service.mjs'

const FROM = '2026-10-12', TO = '2026-10-18', TODAY = '2026-10-14'
// 13:00 London on a day in British summer time.
const at = (date, clock = '12:00') => `${date}T${clock}:00.000Z`

const workspace = {
  semesters: [{ id: 'autumn', status: 'active' }, { id: 'summer', status: 'completed' }],
  cards: [
    { id: 'c1', title: 'Plots', status: 'done', semester_id: 'autumn', end_date: '2026-10-12', data: { hubCardId: 'plots', done: true } },
    { id: 'c2', title: 'Bayes', status: 'planned', semester_id: 'autumn', end_date: '2026-10-13', data: { hubCardId: 'bayes' } },
    { id: 'c3', title: 'Mock A', status: 'planned', semester_id: 'autumn', end_date: '2026-10-16', data: { hubCardId: 'mock' } },
    { id: 'c4', title: 'Old and late', status: 'planned', semester_id: 'autumn', end_date: '2026-10-05', data: {} },
    { id: 'old', title: 'Summer card', status: 'planned', semester_id: 'summer', end_date: '2026-10-12', data: {} },
  ],
  assessments: [{ id: 'a1', title: 'Test 1', semester_id: 'autumn', start_date: '2026-10-23' }, { id: 'a0', title: 'Gone', semester_id: 'autumn', start_date: '2026-10-01' }, { id: 'a2', title: 'Handed in', status: 'submitted', semester_id: 'autumn', start_date: '2026-10-20' }],
}
const plans = { autumn: { scheduleRules: [{ id: 'r1', title: 'Library', start: '17:30', end: '18:30', from: '2026-10-12', to: '2026-10-12' }], scheduleExceptions: [] } }
const events = [
  { eventType: 'card.done_changed', occurredAt: at('2026-10-12'), payload: { done: true } },
  { eventType: 'checklist_item.toggled', occurredAt: at('2026-10-12'), payload: { done: true } },
  { eventType: 'checklist_item.toggled', occurredAt: at('2026-10-12', '12:05'), payload: { done: true } },
  { eventType: 'checklist_item.toggled', occurredAt: at('2026-10-12', '12:06'), payload: { done: false } },   // one taken back
  { eventType: 'focus_session.completed', occurredAt: at('2026-10-13'), payload: { minutes: 50 } },                       // in the hub's own Focus Room
  { eventType: 'focus_session.completed', occurredAt: at('2026-10-13', '16:00'), payload: { minutes: 40, from: 'life-os' } },   // the Life OS timer's: counted once, as its calendar block
  { eventType: 'focus_session.completed', occurredAt: at('2026-10-01'), payload: { minutes: 25 } },           // before these days
  // Late in the evening in London is still that day, though the stamp says the next one in UTC+0 terms it is the same; past midnight London it is the next.
  { eventType: 'card.done_changed', occurredAt: '2026-10-13T23:30:00.000Z', payload: { done: true } },         // 00:30 on the 14th in London
]
const career = { jobs: [
  { id: 'j1', role: 'Analyst', company: 'A', saved: true, status: 'Applied', applied: '2026-10-13', deadline: '2026-10-20' },
  { id: 'j2', role: 'Tutor', company: 'B', saved: true, status: 'To review', deadline: '2026-10-12' },          // closed on Monday, never applied for
  { id: 'j3', role: 'Engineer', company: 'C', saved: true, status: 'To review', deadline: '2026-10-17' },       // still ahead
  { id: 'j4', role: 'Clerk', company: 'D', saved: false, status: 'To review', deadline: '2026-10-12' },         // never shortlisted
  { id: 'j5', role: 'Old', company: 'E', status: 'Applied', applied: '2026-09-30' },
] }
const entries = [
  { id: 'e1', type: 'time-block', title: 'Job applications', status: 'planned', start_at: at('2026-10-12', '09:00'), end_at: at('2026-10-12', '12:00'), details: { area: 'career' } },
  { id: 'e2', type: 'time-block', title: 'Apply: Analyst', status: 'done', start_at: at('2026-10-13', '09:00'), end_at: at('2026-10-13', '09:27'), details: JSON.stringify({ area: 'career', focus: true, minutes: 25 }) },
  { id: 'e3', type: 'time-block', title: 'Reading', status: 'done', start_at: at('2026-10-13', '15:00'), end_at: at('2026-10-13', '15:50'), details: { area: 'core', focus: true, minutes: 50 } },
  { id: 'e3b', type: 'time-block', title: 'Bayes table', status: 'done', start_at: at('2026-10-13', '16:00'), end_at: at('2026-10-13', '16:40'), details: { area: 'study', focus: true, minutes: 40 } },
  { id: 'e4', type: 'task', title: 'Laundry', status: 'done', start_at: '2026-10-12', details: {} },
  { id: 'e5', type: 'task', title: 'Email the tutor', status: 'planned', start_at: '2026-10-13', details: {} },   // not done, and the day has gone
  { id: 'e6', type: 'event', title: 'Picnic with Ben', status: null, start_at: at('2026-10-17', '11:00'), details: { area: 'relationships' } },
  { id: 'e7', type: 'task', title: 'Dropped', status: 'cancelled', start_at: '2026-10-12', details: {} },
  { id: 'e8', type: 'note', title: 'Idea', created_at: at('2026-10-14'), details: { body: 'x' } },
  { id: 'e9', type: 'book', title: 'Not a plan', start_at: '2026-10-12', details: {} },
]
const budget = { revision: 9, state: {
  lists: [{ id: 'l1', name: 'Lidl', date: '2026-10-12', lines: [
    { id: 'a', name: 'Milk', status: 'bought', ticked: true, gotOn: '2026-10-12' },
    { id: 'b', name: 'Eggs', status: 'bought', receiptId: 'r1' },           // on a receipt: counted as money, not as a tick
    { id: 'c', name: 'Rice', status: 'planned' },
  ] }],
  receipts: [{ id: 'r1', date: '2026-10-12', paidPence: 1840, lines: [] }, { id: 'r0', date: '2026-10-02', paidPence: 900, lines: [] }],
} }
const service = (extra = {}) => createReviewService({
  loadStudy: async () => workspace, loadPlans: async (id) => plans[id] ?? {}, loadEvents: async (id) => (id === 'autumn' ? events : []),
  loadCareer: async () => career, loadBudget: async () => budget, loadEntries: () => entries,
  budgetFigures: (_state, month) => ({ month, totalSpent: 27.4, adjustedTotal: 250, totalRemaining: 222.6 }), today: () => TODAY, ...extra,
})

test('a week is gathered day by day from every part, and each part keeps its own meaning', async () => {
  const review = await service()({ from: FROM, to: TO })
  assert.deepEqual(review.days.map((row) => row.date), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'])
  const [mon, tue, wed] = review.days
  // Monday: an hour of study planned, a card due and done, two steps left ticked, 3 h set aside for jobs, one plan made and done, one thing ticked, a receipt.
  assert.deepEqual(mon.study, { plannedMinutes: 60, cardsDue: 1, cardsDone: 1, steps: 1 })
  assert.deepEqual(mon.jobs, { sent: 0, setAsideMinutes: 180, setAside: 1 })
  assert.deepEqual(mon.plans, { made: 2, done: 1 })                       // the set-aside block and the laundry; the cancelled one and the book are not plans
  assert.deepEqual(mon.home, { ticked: 1, spentPence: 1840, receipts: 1 })
  // Tuesday: 50 min in the hub's Focus Room, and three sessions with the Life OS timer (25 for jobs, 50 reading, 40 on a study card, which the hub also logged and is counted once).
  assert.deepEqual(tue.focus, { total: 165, study: 90, jobs: 25, other: 50 })
  assert.deepEqual([tue.jobs.sent, tue.plans.made], [1, 1])
  // Wednesday (London): the card ticked at half past midnight, and a note.
  assert.deepEqual([wed.study.cardsDone, wed.notes], [1, 1])
  assert.deepEqual(review.totals.study, { plannedMinutes: 60, cardsDue: 3, cardsDone: 2, steps: 1 })
  assert.deepEqual([review.totals.jobs.sent, review.totals.plans.made, review.totals.plans.done, review.totals.focus.total, review.totals.notes], [1, 4, 1, 165, 1])
})

test('what slipped is named: late cards, plans whose day has gone, shortlisted jobs that closed', async () => {
  const review = await service()({ from: FROM, to: TO })
  assert.deepEqual([review.study.cardsDue, review.study.cardsDueDone], [3, 1])
  assert.deepEqual(review.study.late.cards.map((card) => [card.title, card.due]), [['Old and late', '2026-10-05'], ['Bayes', '2026-10-13']])   // the finished semester's card is left out
  assert.equal(review.study.late.cards[1].href, '/study#/today?card=bayes&semester=autumn')
  assert.deepEqual([review.study.next, review.study.semesterId], [{ title: 'Test 1', date: '2026-10-23' }, 'autumn'])
  // Time set aside and a task, both left unticked on days that have gone. Saturday's picnic is ahead; an event is not "not done".
  assert.deepEqual(review.plans.open.plans.map((plan) => plan.title), ['Job applications', 'Email the tutor'])
  assert.deepEqual(review.jobs.missed.jobs.map((job) => [job.role, job.href]), [['Tutor', '/jobmap#job=j2']])
  assert.equal(review.jobs.sentEver, 2)
  assert.deepEqual(review.home.money, { month: '2026-10', spentPence: 2740, budgetPence: 25000, leftPence: 22260 })
  assert.equal(review.home.toBuy, 1)
  assert.deepEqual(review.sources.map((source) => source.status), ['ready', 'ready', 'ready', 'ready'])
})

test('a part that cannot be read says so and the rest still shows; odd dates are refused', async () => {
  const review = await service({ loadCareer: async () => { throw new Error('down') }, budgetFigures: () => { throw new Error('rule changed') } })({ from: FROM, to: TO })
  assert.equal(review.jobs, null)
  assert.deepEqual(review.sources.find((source) => source.id === 'jobs'), { id: 'jobs', label: 'JobMap', status: 'unavailable', error: 'JobMap could not be read.' })
  assert.equal(review.days[0].study.cardsDone, 1)
  assert.equal(review.home.money, null)                                   // Budget's lists still count; only the month's figure is missing
  assert.equal(review.days[0].home.ticked, 1)
  await assert.rejects(service()({ from: TO, to: FROM }), (error) => error.status === 400)
  await assert.rejects(service()({ from: 'monday', to: TO }), (error) => error.status === 400)
  await assert.rejects(service()({ from: '2026-01-01', to: '2026-12-31' }), (error) => error.status === 400 && error.message.includes(String(MAX_DAYS)))
})
