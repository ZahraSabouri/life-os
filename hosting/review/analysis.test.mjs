import test from 'node:test'
import assert from 'node:assert/strict'
import { burnUp, cardTable, createAnalysisService, dayTable, describe, funnelOf, hourGrid, jobTable, modulesOf, moneyOf, relate, relationsOf, statsOf, tidyTable, toCsv, weekdayProfile } from './analysis.mjs'
import { createReviewService } from './service.mjs'

const dayRow = (date, change = {}) => ({
  date,
  study: { plannedMinutes: 0, cardsDue: 0, cardsDone: 0, steps: 0, ...change.study },
  jobs: { sent: 0, setAsideMinutes: 0, setAside: 0, ...change.jobs },
  plans: { made: 0, done: 0, ...change.plans },
  home: { ticked: 0, spentPence: 0, receipts: 0, ...change.home },
  notes: change.notes ?? 0,
  focus: { total: 0, study: 0, jobs: 0, other: 0, ...change.focus },
})

test('summary statistics: mean, median, sample deviation, days with any, the best day', () => {
  assert.deepEqual(describe([2, 4, 4, 4, 5, 5, 7, 9]), { n: 8, total: 40, mean: 5, median: 4.5, sd: 2.14, min: 2, max: 9, active: 8 })
  assert.deepEqual(describe([]), { n: 0, total: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0, active: 0 })
  assert.equal(describe([3]).sd, 0)
  // Monday 5 to Thursday 8 October; "today" is Wednesday, so Thursday is not counted yet.
  const days = [dayRow('2026-10-05', { focus: { total: 60 } }), dayRow('2026-10-06', { focus: { total: 0 } }), dayRow('2026-10-07', { focus: { total: 90 } }), dayRow('2026-10-08', { focus: { total: 500 } })]
  const focus = statsOf(days, '2026-10-07').find((row) => row.id === 'focus_minutes')
  assert.deepEqual([focus.n, focus.total, focus.mean, focus.median, focus.max, focus.maxDate, focus.active, focus.unit], [3, 150, 50, 60, 90, '2026-10-07', 2, 'min'])
  assert.equal(statsOf(days, '2026-10-07').find((row) => row.id === 'jobs_sent').maxDate, '')
})

test('the shape of a week and the plan against done', () => {
  const days = [dayRow('2026-10-05', { study: { plannedMinutes: 120, cardsDue: 2, cardsDone: 1 }, plans: { made: 2, done: 1 } }), dayRow('2026-10-06', { study: { cardsDue: 1, cardsDone: 2 } }), dayRow('2026-10-12', { study: { plannedMinutes: 60, cardsDue: 3 } }), dayRow('2026-10-13', { study: { cardsDue: 1 } })]
  const profile = weekdayProfile(days, '2026-10-12')
  assert.deepEqual([profile[0].weekday, profile[0].days, profile[0].studyPlanned, profile[0].plansMade, profile[0].plansDone, profile[1].days, profile[6].days], [1, 2, 180, 2, 1, 1, 0])
  assert.deepEqual(burnUp(days, '2026-10-12'), [{ date: '2026-10-05', due: 2, done: 1 }, { date: '2026-10-06', due: 3, done: 3 }, { date: '2026-10-12', due: 6, done: 3 }, { date: '2026-10-13', due: 7, done: null }])
})

test('hours of the day: study on the plan, time set aside for jobs, focus, each at London time', () => {
  const plans = [{ semesterId: 's', plan: { scheduleRules: [{ id: 'a', from: '2026-10-13', to: '2026-10-13', weekdays: [2], title: 'Statistics', category: 'study', start: '09:30', end: '11:00' }] } }]
  const entries = [
    { type: 'time-block', start_at: '2026-10-13T16:00:00.000Z', end_at: '2026-10-13T18:30:00.000Z', details: { area: 'career' } },
    { type: 'time-block', start_at: '2026-10-14T08:10:00.000Z', end_at: '2026-10-14T09:00:00.000Z', details: { area: 'study', focus: true, minutes: 50 } },
    { type: 'time-block', status: 'cancelled', start_at: '2026-10-13T10:00:00.000Z', end_at: '2026-10-13T11:00:00.000Z', details: { area: 'career' } },
    { type: 'time-block', start_at: '2026-10-13', all_day: true, details: { area: 'career' } },
  ]
  const events = [{ eventType: 'focus_session.completed', occurredAt: '2026-10-15T13:00:00.000Z', payload: { minutes: 25 } }, { eventType: 'focus_session.completed', occurredAt: '2026-10-15T13:00:00.000Z', payload: { minutes: 25, from: 'life-os' } }]
  const grid = hourGrid({ plans, entries, events }, { from: '2026-10-12', to: '2026-10-18' })
  // Tuesday 09:30 to 11:00: half of the nine o'clock hour, all of the ten o'clock one.
  assert.deepEqual([grid.planned[1][9], grid.planned[1][10], grid.planned[1][11]], [30, 60, 0])
  // 16:00 UTC is 17:00 in London in October.
  assert.deepEqual([grid.jobs[1][17], grid.jobs[1][18], grid.jobs[1][19], grid.jobs[1][10]], [60, 60, 30, 0])
  assert.deepEqual([grid.focus[2][9], grid.focus[2][10]], [50, 0])
  // The hub's own session ended at 14:00 London time and lasted 25 minutes.
  assert.equal(grid.focus[3][13], 25)
})

test('each module: its cards, what is late, what the plan gives it, its next test', () => {
  const workspace = {
    semesters: [{ id: 's', status: 'active' }, { id: 'old', status: 'archived' }],
    modules: [{ id: 'm1', semester_id: 's', title: 'Statistics', data: { code: 'MAT022' } }, { id: 'm2', semester_id: 's', title: 'Computing', data: { code: 'CMT309' } }, { id: 'gone', semester_id: 'old', title: 'Old' }],
    cards: [
      { id: 'a', semester_id: 's', module_id: 'm1', status: 'done', end_date: '2026-10-06' }, { id: 'b', semester_id: 's', module_id: 'm1', status: 'planned', end_date: '2026-10-08' },
      { id: 'c', semester_id: 's', module_id: 'm1', status: 'planned', end_date: '2026-10-20' }, { id: 'd', semester_id: 's', module_id: 'm2', status: 'planned', data: { done: true } },
      { id: 'e', semester_id: 's', module_id: null, status: 'planned' }, { id: 'f', semester_id: 'old', module_id: 'gone', status: 'planned' }, { id: 'g', semester_id: 's', module_id: 'm1', deleted_at: '2026-10-01' },
    ],
    assessments: [{ semester_id: 's', module_id: 'm1', title: 'Test 1', status: 'pending', start_date: '2026-10-23' }, { semester_id: 's', module_id: 'm1', title: 'Old quiz', status: 'pending', start_date: '2026-10-01' }],
  }
  const plans = [{ semesterId: 's', plan: { scheduleRules: [{ id: 'r', from: '2026-10-13', to: '2026-10-13', weekdays: [2], title: 'x', category: 'study', start: '09:00', end: '10:30', moduleGroup: 'Statistics' }] } }]
  const rows = modulesOf({ workspace, plans }, { from: '2026-10-05', to: '2026-10-18', today: '2026-10-13' })
  assert.deepEqual(rows.map((row) => [row.code, row.title, row.cards, row.done, row.late, row.dueInRange, row.undated, row.plannedMinutes, row.nextTest?.title ?? null]), [
    ['MAT022', 'Statistics', 3, 1, 1, 2, 0, 90, 'Test 1'], ['CMT309', 'Computing', 1, 1, 0, 0, 0, 0, null], ['', 'Not under a module', 1, 0, 0, 0, 1, 0, null],
  ])
})

test('the job pipeline: the steps, where leads come from, closing dates ahead, leads found', () => {
  const job = (id, change = {}) => ({ id, role: 'Role', company: 'Co', source: 'LinkedIn', status: 'To review', saved: false, availability: '', deadline: '', applied: '', addedOn: '2026-10-01', ...change })
  const jobs = [
    job('1', { availability: 'open', saved: true, deadline: '2026-10-14' }), job('2', { availability: 'open', deadline: '2026-10-21' }), job('3', { status: 'Preparing', saved: true, deadline: '2026-10-12' }),
    job('4', { status: 'Applied', applied: '2026-10-09', source: 'Reed' }), job('5', { status: 'Interview', source: 'Reed', saved: true }), job('6', { status: 'Rejected', source: 'Reed', saved: true, availability: 'open' }),
    job('7', { status: 'Archived', source: 'Indeed', deadline: '2026-10-15' }), job('8', { applied: '2026-10-10', source: 'Indeed', addedOn: '2026-10-13' }),
  ]
  const funnel = funnelOf({ jobs }, '2026-10-13', { sources: 2, weeksAhead: 2, weeksBack: 2 })
  assert.deepEqual(funnel.steps.map((step) => [step.id, step.count]), [['listed', 8], ['open', 2], ['saved', 3], ['working', 1], ['applied', 3], ['interview', 1], ['offer', 0]])
  assert.deepEqual(funnel.sources, [{ source: 'LinkedIn', total: 3, open: 2, saved: 2, applied: 0 }, { source: 'Reed', total: 3, open: 0, saved: 1, applied: 2 }, { source: '1 other sources', total: 2, open: 0, saved: 0, applied: 1 }])
  // This week from today (Tuesday 13): the job that closed on Monday 12 is not "ahead".
  assert.deepEqual(funnel.closing, [{ from: '2026-10-12', count: 1, saved: 1 }, { from: '2026-10-19', count: 1, saved: 0 }])
  assert.deepEqual(funnel.found, [{ from: '2026-10-05', count: 0 }, { from: '2026-10-12', count: 1 }])
  assert.deepEqual([funnel.rejected, funnel.archived, funnel.withDeadline], [1, 1, 4])
})

test('where money went: by kind of thing and by shop, inside the days asked for', () => {
  const state = {
    categories: [{ id: 'veg', name: 'Fruit & vegetables', group: 'Fresh food' }, { id: 'home', name: 'Kitchen', group: 'Home' }], shops: [{ id: 'shop-lidl', name: 'Lidl' }],
    receipts: [
      { date: '2026-10-12', shopId: 'shop-lidl', paidPence: 500, lines: [{ categoryId: 'veg', netPence: 300 }, { categoryId: 'home', grossPence: 150 }, { categoryId: 'unknown', netPence: 50 }] },
      { date: '2026-10-13', merchant: 'Corner shop', paidPence: 120, lines: [{ categoryId: 'veg', netPence: 120 }] },
      { date: '2026-09-01', shopId: 'shop-lidl', paidPence: 9999, lines: [{ categoryId: 'veg', netPence: 9999 }] },
    ],
  }
  const money = moneyOf({ state }, { from: '2026-10-05', to: '2026-10-18' })
  assert.deepEqual([money.totalPence, money.receipts], [620, 2])
  assert.deepEqual(money.byCategory.map((row) => [row.name, row.group, row.pence, row.lines]), [['Fruit & vegetables', 'Fresh food', 420, 2], ['Kitchen', 'Home', 150, 1], ['No category', '', 50, 1]])
  assert.deepEqual(money.byShop, [{ name: 'Lidl', pence: 500, receipts: 1 }, { name: 'Corner shop', pence: 120, receipts: 1 }])
})

test('two measures together: r is worked out from ten days up, and never without the number of days', () => {
  assert.deepEqual(relate([1, 2, 3, 4], [2, 4, 6, 8]), { n: 4, r: 1 })
  assert.deepEqual(relate([1, 2, 3, 4], [8, 6, 4, 2]), { n: 4, r: -1 })
  assert.deepEqual(relate([1, 1, 1], [1, 2, 3]), { n: 3, r: null })
  const few = Array.from({ length: 5 }, (_unused, index) => dayRow(`2026-10-0${index + 1}`, { plans: { made: index, done: index } }))
  assert.deepEqual(relationsOf(few, '2026-10-31').find((row) => row.a.id === 'plans_made'), { a: { id: 'plans_made', label: 'Plans of your own' }, b: { id: 'plans_done', label: 'Plans done' }, n: 5, r: null, why: 'too-few-days' })
  const many = Array.from({ length: 12 }, (_unused, index) => dayRow(`2026-10-${String(index + 1).padStart(2, '0')}`, { plans: { made: index, done: Math.floor(index / 2) } }))
  const related = relationsOf(many, '2026-10-31')
  assert.deepEqual([related.find((row) => row.a.id === 'plans_made').n, related.find((row) => row.a.id === 'plans_made').r > 0.9, related.find((row) => row.b.id === 'jobs_sent').why], [12, true, 'no-variation'])
})

test('the rows as files: one row a day, the tidy shape, every job, every card', () => {
  const days = [dayRow('2026-10-12', { focus: { total: 30, study: 30 }, home: { spentPence: 1250, receipts: 1 } }), dayRow('2026-10-13')]
  const wide = dayTable(days, '2026-10-12')
  assert.deepEqual([wide.columns.slice(0, 5), wide.rows[0].weekday, wide.rows[0].focus_minutes, wide.rows[0].home_spent_pence, wide.rows[0].elapsed, wide.rows[1].elapsed, wide.rows[1].iso_week_start],
    [['date', 'weekday', 'iso_week_start', 'elapsed', 'study_planned_minutes'], 'Monday', 30, 1250, 1, 0, '2026-10-12'])
  const tidy = tidyTable(days, '2026-10-12')
  assert.deepEqual([tidy.rows.length, tidy.rows.find((row) => row.date === '2026-10-12' && row.measure === 'focus_study_minutes').value], [2 * (wide.columns.length - 4), 30])
  assert.equal(toCsv(['a', 'b'], [{ a: 'plain', b: 'has, a comma' }, { a: 'says "hi"', b: null }]), 'a,b\r\nplain,"has, a comma"\r\n"says ""hi""",\r\n')
  const jobs = jobTable({ jobs: [{ id: 'J1', role: 'Analyst', company: 'Co', source: 'Reed', status: 'Applied', saved: true, priority: 'P1', deadline: '2026-10-20T00:00:00Z', applied: '2026-10-09', tags: 'NHS, remote', url: 'https://example.org' }] })
  assert.deepEqual([jobs.rows[0].shortlisted, jobs.rows[0].deadline, jobs.rows[0].my_categories, jobs.columns.includes('my_priority')], [1, '2026-10-20', 'NHS, remote', true])
  const cards = cardTable({ semesters: [{ id: 's', title: 'Autumn' }], modules: [{ id: 'm', title: 'Statistics', data: { code: 'MAT022' } }], cards: [{ id: 'c', title: 'Read', semester_id: 's', module_id: 'm', status: 'Done', end_date: '2026-10-08', data: { priority: 'High' } }, { id: 'x', deleted_at: 'yes' }] })
  assert.deepEqual(cards.rows, [{ id: 'c', title: 'Read', semester: 'Autumn', module_code: 'MAT022', module: 'Statistics', status: 'Done', done: 1, start_date: '', due_date: '2026-10-08', priority: 'High', lane: '', created_at: '', updated_at: '' }])
})

test('the service gathers every part once, survives a part that cannot be read, and hands out files', async () => {
  let careerReads = 0
  const loaders = {
    loadStudy: async () => ({ semesters: [{ id: 's', status: 'active' }], modules: [{ id: 'm', semester_id: 's', title: 'Statistics', data: { code: 'MAT022' } }], cards: [{ id: 'c', semester_id: 's', module_id: 'm', status: 'planned', end_date: '2026-10-13', title: 'Read' }], assessments: [] }),
    loadPlans: async () => ({ scheduleRules: [] }), loadEvents: async () => [],
    loadCareer: async () => { careerReads += 1; return { jobs: [{ id: 'J1', role: 'Analyst', company: 'Co', source: 'Reed', status: 'To review', applied: '2026-10-13', addedOn: '2026-10-12' }] } },
    loadBudget: async () => { throw new Error('Budget is not running') },
    loadEntries: async () => [{ id: 'e', type: 'task', title: 'Post a letter', status: 'done', start_at: '2026-10-13', all_day: 1 }],
    today: () => '2026-10-13',
  }
  const review = createReviewService({ ...loaders, maxDays: 190 })
  const service = createAnalysisService({ ...loaders, review })
  const data = await service.analysisOf({ from: '2026-10-05', to: '2026-10-18' })
  assert.deepEqual([data.days.length, data.elapsedDays, data.totals.jobs.sent, data.totals.plans.done, data.money, data.modules[0].code, data.jobs.steps[4].count, data.sources.find((source) => source.id === 'home').status],
    [14, 9, 1, 1, null, 'MAT022', 1, 'unavailable'])
  const file = await service.exportOf({ from: '2026-10-05', to: '2026-10-18', format: 'days' })
  assert.deepEqual([file.name, file.type, file.body.split('\r\n').length, file.body.startsWith('date,weekday,')], ['life-os-days-2026-10-05-to-2026-10-18.csv', 'text/csv; charset=utf-8', 16, true])
  assert.match((await service.exportOf({ from: '2026-10-05', to: '2026-10-18', format: 'jobs' })).body, /^id,role,company[^\n]+\nJ1,Analyst,Co,/)
  assert.equal(JSON.parse((await service.exportOf({ from: '2026-10-05', to: '2026-10-18', format: 'json' })).body).stats.length, 11)
  await assert.rejects(service.exportOf({ from: '2026-10-05', to: '2026-10-18', format: 'xlsx' }), (error) => error.status === 400)
  // Longer than the week's review allows, and within what the analysis allows.
  assert.equal((await service.analysisOf({ from: '2026-07-01', to: '2026-10-18' })).days.length, 110)
  await assert.rejects(service.analysisOf({ from: '2026-01-01', to: '2026-10-18' }), (error) => error.status === 400)
  assert.ok(careerReads >= 1)
})
