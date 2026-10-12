import test from 'node:test'
import assert from 'node:assert/strict'
import { createDayService, homeDay, jobsDay, jobTime, notesDay, studyDay } from './service.mjs'

const DATE = '2026-10-13'
const workspace = {
  semesters: [
    { id: 'autumn', title: 'Autumn', status: 'active', start_date: '2026-09-28', end_date: '2027-01-29' },
    { id: 'summer', title: 'Summer', status: 'completed', start_date: '2026-07-04', end_date: '2026-08-28' },
  ],
  modules: [{ id: 'stats', title: 'Statistics', data: { code: 'MAT022' } }],
  cards: [
    { id: 'c1', title: 'Plots', status: 'planned', semester_id: 'autumn', module_id: 'stats', start_date: DATE, end_date: DATE,
      data: { hubCardId: 'plots', estimatedHours: 1.5, doneCondition: 'Three plots read', checklist: [{ id: 'a', text: 'Histogram', done: true }, { id: 'b', text: 'Box plot', done: false }] } },
    { id: 'c2', title: 'Bayes', status: 'done', semester_id: 'autumn', module_id: 'stats', end_date: DATE, data: { hubCardId: 'bayes', estimatedHours: 1.5, done: true } },
    { id: 'c3', title: 'Late', status: 'planned', semester_id: 'autumn', end_date: '2026-10-12', data: { hubCardId: 'late' } },
    { id: 'c4', title: 'Week card', status: 'planned', semester_id: 'autumn', start_date: '2026-10-12', end_date: '2026-10-18', data: { hubCardId: 'week' } },
    { id: 'c5', title: 'After the test', status: 'planned', semester_id: 'autumn', end_date: '2026-11-01', data: { hubCardId: 'after' } },
    { id: 'old', title: 'Summer card', status: 'planned', semester_id: 'summer', end_date: DATE, data: { hubCardId: 'plots' } },
  ],
  assessments: [
    { id: 'test', title: 'Test 1', status: 'planned', semester_id: 'autumn', module_id: 'stats', start_date: '2026-10-23', end_date: '2026-10-23', data: { weight: 20 } },
    { id: 'project', title: 'Project', status: 'planned', semester_id: 'autumn', end_date: '2026-11-13', data: {} },
    { id: 'tbc', title: 'Test 2', status: 'pending', semester_id: 'autumn', data: {} },
  ],
}
const plans = [{ semesterId: 'autumn', plan: { scheduleRules: [
  { id: 'r2', title: 'Bayes block', category: 'study', from: DATE, to: DATE, weekdays: [2], start: '10:45', end: '12:15', moduleGroup: 'Statistics', cardId: 'bayes' },
  { id: 'r1', title: 'Plots block', category: 'study', from: DATE, to: DATE, weekdays: [2], start: '09:00', end: '10:30', moduleGroup: 'Statistics', cardId: 'plots', location: 'Library' },
  { id: 'r3', title: 'Another day', category: 'study', from: '2026-10-14', to: '2026-10-14', weekdays: [3], start: '09:00', end: '10:00' },
] } }]

test('study blocks come in time order with the card each belongs to', () => {
  const { blocks, panel } = studyDay(workspace, plans, DATE)
  assert.deepEqual(blocks.map(block => [block.start, block.end, block.title, block.card?.title]), [['09:00', '10:30', 'Plots block', 'Plots'], ['10:45', '12:15', 'Bayes block', 'Bayes']])
  assert.equal(blocks[0].minutes, 90)
  assert.equal(blocks[0].card.stepsDone, 1)
  assert.equal(blocks[0].card.steps.length, 2)
  assert.equal(blocks[0].card.href, '/study#/today?card=plots')
  assert.deepEqual(panel.today.map(card => [card.title, card.done, card.inBlock]), [['Plots', false, true], ['Bayes', true, true]])
  assert.equal(panel.hoursToday, 3)
})

test('the study panel counts towards the next dated assessment and leaves a finished semester out', () => {
  const { panel } = studyDay(workspace, plans, DATE)
  assert.deepEqual(panel.semesters, [{ id: 'autumn', title: 'Autumn' }])
  assert.deepEqual([panel.next.title, panel.next.date, panel.next.days], ['Test 1', '2026-10-23', 10])
  assert.deepEqual(panel.progress, { done: 1, total: 4 })
  assert.deepEqual(panel.overdue.cards.map(card => card.title), ['Late'])
  assert.deepEqual(panel.running.map(card => card.title), ['Week card'])
  assert.deepEqual(panel.undated, ['Test 2'])
})

test('jobs due within a week are the saved or applied ones, soonest first', () => {
  const jobs = jobsDay({ jobs: [
    { id: 'a', role: 'Analyst', company: 'A', saved: true, status: 'To review', deadline: '2026-10-15' },
    { id: 'b', role: 'Engineer', company: 'B', saved: true, status: 'To review', deadline: DATE },
    { id: 'c', role: 'Not saved', company: 'C', saved: false, status: 'To review', deadline: DATE },
    { id: 'd', role: 'Closed', company: 'D', saved: true, status: 'To review', deadline: DATE, availability: 'closed' },
    { id: 'e', role: 'Archived', company: 'E', saved: true, status: 'Archived', deadline: DATE },
    { id: 'f', role: 'Far', company: 'F', saved: true, status: 'To review', deadline: '2026-11-30' },
    { id: 'g', role: 'Talk', company: 'G', saved: false, status: 'Interview', deadline: '', followUp: '2026-10-14' },
    { id: 'h', role: 'Missed', company: 'H', saved: true, status: 'To review', deadline: '2026-10-01' },
  ] }, DATE)
  assert.deepEqual(jobs.due.map(job => [job.id, job.days]), [['b', 0], ['a', 2]])
  assert.equal(jobs.dueToday, 1)
  assert.deepEqual(jobs.interviews.map(job => job.id), ['g'])
  assert.deepEqual(jobs.followUps.map(job => [job.id, job.days]), [['g', 1]])
  assert.deepEqual(jobs.counts, { saved: 5, toApply: 4, applied: 1, missed: 1 })
})

test('home shows lists that still have something to buy, meals for the day, stock by place and the month budget', () => {
  const home = homeDay({ state: {
    lists: [
      { id: 'l1', name: 'Lidl', date: DATE, merchant: 'Lidl', lines: [{ id: 'x', name: 'Eggs', quantity: 6, unit: 'item', status: 'planned' }, { id: 'y', name: 'Rice', status: 'bought' }] },
      { id: 'l2', name: 'All bought', lines: [{ id: 'z', name: 'Milk', status: 'bought' }] },
    ],
    mealEntries: [{ id: 'm1', date: DATE, slot: 'dinner', name: 'Lentil soup', status: 'planned' }, { id: 'm2', date: DATE, slot: 'breakfast', name: 'Oats', status: 'cooked' }, { id: 'm3', date: '2026-10-14', slot: 'dinner', name: 'Tomorrow' }],
    lots: [{ id: 'a', remaining: 2, location: 'Fridge' }, { id: 'b', remaining: 1, location: 'Fridge' }, { id: 'c', remaining: 0, location: 'Freezer' }, { id: 'd', remaining: 1, location: 'Kitchen', tracking: 'durable' }, { id: 'e', remaining: 4, location: 'Cupboard' }],
    budgets: { '2026-10': { total: 250 } }, recipes: [],
  } }, DATE)
  assert.deepEqual(home.lists.map(list => [list.name, list.items.map(item => item.name), list.bought]), [['Lidl', ['Eggs'], 1]])
  assert.deepEqual(home.meals.map(meal => [meal.slot, meal.name, meal.cooked]), [['breakfast', 'Oats', true], ['dinner', 'Lentil soup', false]])
  assert.deepEqual(home.stock, { total: 3, places: [{ place: 'Fridge', count: 2 }, { place: 'Cupboard', count: 1 }] })
  assert.deepEqual(home.budget, { month: '2026-10', totalPence: 25000 })
  assert.equal(homeDay({ state: {} }, DATE).budget, null)
})

test('notes are the ones written that day in London, newest first', () => {
  const notes = notesDay([
    { id: 'n1', type: 'note', title: 'Morning', details: '{"body":"Ask about calculators"}', created_at: '2026-10-13T08:00:00.000Z' },
    { id: 'n2', type: 'note', title: 'Late', details: { body: 'After midnight in London' }, created_at: '2026-10-12T23:30:00.000Z' },
    { id: 'n3', type: 'note', title: 'Yesterday', details: {}, created_at: '2026-10-12T10:00:00.000Z' },
    { id: 't1', type: 'task', title: 'Not a note', created_at: '2026-10-13T09:00:00.000Z' },
  ], DATE)
  assert.deepEqual(notes.map(note => [note.id, note.at, note.body]), [['n1', '09:00', 'Ask about calculators'], ['n2', '00:30', 'After midnight in London']])
})

test('a source that cannot be read is named and the rest still answers', async () => {
  const service = createDayService({
    loadStudy: async () => workspace, loadPlans: async (id) => plans.find(entry => entry.semesterId === id)?.plan,
    loadCareer: async () => { throw new Error('ECONNREFUSED 127.0.0.1:47852') },
    loadBudget: async () => ({ revision: 0, state: null }),
    loadEntries: () => [],
  })
  const result = await service({ date: DATE })
  assert.equal(result.blocks.length, 2)
  assert.equal(result.jobs, null)
  assert.deepEqual(result.home.lists, [])
  assert.deepEqual(result.sources.find(source => source.id === 'jobs'), { id: 'jobs', label: 'JobMap', status: 'unavailable', error: 'JobMap could not be read. Open it to check.' })
  assert.equal(JSON.stringify(result).includes('ECONNREFUSED'), false)
  await assert.rejects(service({ date: 'tomorrow' }), { status: 400 })
})

test('job time is the hours set aside for the career area that day, and the week counts what was sent', () => {
  const entries = [
    { id: 'b1', type: 'time-block', title: 'Job applications', details: '{"area":"career"}', start_at: '2026-10-13T14:45:00.000Z', end_at: '2026-10-13T17:45:00.000Z', status: null },
    { id: 'b2', type: 'time-block', title: 'Job applications', details: { area: 'career' }, start_at: '2026-10-13', all_day: true, status: 'done' },
    { id: 'b3', type: 'time-block', title: 'Gym', details: { area: 'core' }, start_at: '2026-10-13T08:00:00.000Z', end_at: '2026-10-13T09:00:00.000Z' },
    { id: 'b4', type: 'time-block', title: 'Cancelled', details: { area: 'career' }, start_at: '2026-10-13T08:00:00.000Z', end_at: '2026-10-13T09:00:00.000Z', status: 'cancelled' },
    { id: 'b5', type: 'time-block', title: 'Tomorrow', details: { area: 'career' }, start_at: '2026-10-14T16:00:00.000Z', end_at: '2026-10-14T19:00:00.000Z' },
    { id: 'n1', type: 'note', title: 'A note', created_at: '2026-10-13T08:00:00.000Z' },
  ]
  assert.deepEqual(jobTime(entries, DATE).map(block => [block.id, block.start, block.end, block.minutes, block.done]), [['b2', '', '', 0, true], ['b1', '15:45', '18:45', 180, false]])
  const jobs = jobsDay({ jobs: [
    { id: 'a', role: 'A', company: 'A', saved: true, status: 'Applied', applied: '2026-10-12' },   // Monday of this week
    { id: 'b', role: 'B', company: 'B', saved: true, status: 'Applied', applied: '2026-10-11' },   // the Sunday before
    { id: 'c', role: 'C', company: 'C', saved: true, status: 'To review', deadline: DATE },
  ] }, DATE, entries)
  assert.equal(jobs.minutesToday, 180)
  assert.equal(jobs.appliedThisWeek, 1)
  assert.equal(jobs.time.length, 2)
})

test('the day reads Life OS entries once for notes and job time, and says so when it cannot', async () => {
  let reads = 0
  const entries = [{ id: 'n1', type: 'note', title: 'Morning', details: { body: 'Hello' }, created_at: '2026-10-13T08:00:00.000Z' }, { id: 'b1', type: 'time-block', title: 'Job applications', details: { area: 'career' }, start_at: '2026-10-13T14:45:00.000Z', end_at: '2026-10-13T17:45:00.000Z' }]
  const base = { loadStudy: async () => workspace, loadPlans: async () => ({}), loadCareer: async () => ({ jobs: [] }), loadBudget: async () => ({ state: {} }) }
  const day = await createDayService({ ...base, loadEntries: () => { reads += 1; return entries } })({ date: DATE })
  assert.equal(reads, 1)
  assert.deepEqual(day.notes.map(note => note.body), ['Hello'])
  assert.equal(day.jobs.minutesToday, 180)
  const broken = await createDayService({ ...base, loadEntries: () => { throw new Error('locked') } })({ date: DATE })
  assert.equal(broken.notes, null)
  assert.equal(broken.jobs.minutesToday, 0)
  assert.equal(broken.sources.find(source => source.id === 'notes').status, 'unavailable')
})

test('what to apply for is JobMap\'s own first screen, in its order and groups, not everything a search shortlisted', () => {
  const jobs = jobsDay({ jobs: [
    { id: 'lead-late', role: 'Tutor', company: 'A', saved: true, status: 'To review', hours: '10 hours per week', availability: 'open', checked: '2026-10-10', deadline: '2026-11-20' },
    { id: 'lead-soon', role: 'Analyst', company: 'B', saved: true, status: 'To review', hours: '15 hours per week', availability: 'open', checked: '2026-10-10', deadline: '2026-10-14' },
    { id: 'fulltime', role: 'Data Manager', company: 'C', saved: true, status: 'To review', hours: 'Full time', availability: 'open', checked: '2026-10-10', deadline: DATE },
    { id: 'unchecked', role: 'Officer', company: 'D', saved: true, status: 'To review', hours: '12 hours per week', deadline: '2026-10-15' },
  ] }, DATE)
  // What closes today is said first, whatever its group; the rest follow in JobMap's order (inside a group, the nearest closing date).
  assert.deepEqual(jobs.closing.map(job => [job.id, job.label, job.href]), [['fulltime', 'Full-time or over your hours · closes today', '/jobmap#job=fulltime']])
  assert.deepEqual(jobs.next.map(job => job.id), ['lead-soon', 'lead-late'])
  assert.match(jobs.next[0].label, /^Apply now · closes tomorrow/)
  assert.equal(jobs.applyNow, 2)
  assert.deepEqual(jobs.groups, [{ name: 'Apply now', count: 2 }, { name: 'Full-time or over your hours', count: 1 }])
  assert.deepEqual([jobs.leads, jobs.closingToday, jobs.closingThisWeek], [3, 1, 2])
  // A job a search shortlisted that nobody has checked still closes this week, but JobMap's first screen does not list it.
  assert.deepEqual(jobs.due.map(job => [job.id, job.listed]), [['fulltime', true], ['lead-soon', true], ['unchecked', false]])
})

test('what was ticked off a shopping list this day stays in sight, and a list with only ticks comes last', () => {
  const home = homeDay({ state: { lists: [
    { id: 'done', name: 'Lidl', date: DATE, lines: [{ id: 'a', name: 'Milk', quantity: 1, status: 'bought', ticked: true, gotOn: DATE }] },
    { id: 'open', name: 'To buy', date: '2026-10-20', lines: [
      { id: 'b', name: 'Shampoo', quantity: 1, status: 'planned' },
      { id: 'c', name: 'Soap', quantity: 1, status: 'bought', ticked: true, gotOn: DATE },
      { id: 'd', name: 'Rice', quantity: 1, status: 'bought', ticked: true, gotOn: '2026-10-01' },   // ticked on another day
      { id: 'e', name: 'Eggs', quantity: 1, status: 'bought', receiptId: 'r1' },                      // on a receipt
    ] },
    { id: 'old', name: 'Last week', date: '2026-10-05', lines: [{ id: 'f', name: 'Tea', quantity: 1, status: 'bought', ticked: true, gotOn: '2026-10-05' }] },
  ] } }, DATE)
  assert.deepEqual(home.lists.map(list => [list.id, list.items.map(item => item.name), list.got.map(item => item.name)]), [['open', ['Shampoo'], ['Soap']], ['done', [], ['Milk']]])
})
