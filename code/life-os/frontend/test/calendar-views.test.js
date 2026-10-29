import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDayHref, daySpan, groupByDay, isoWeek, matchesSearch, monthGrid, placeOf, placeTimed, readCalendarAddress, stepView, todayIn, viewRange, weekHours } from '../src/lib/calendarViews.js'
import { changedSearch, nextLayers, stepsToClose } from '../src/lib/addresses.js'

const AREAS = ['core', 'study', 'career', 'events']
const read = (search, today = '2026-10-28') => readCalendarAddress(new URLSearchParams(search), today, AREAS)
const item = (overrides = {}) => ({ id: 'x', area: 'core', kind: 'plan', title: 'Example', start: '2026-10-28', end: null, all_day: true, meta: {}, ...overrides })

test('an empty address is this month; a wrong one falls back instead of failing', () => {
  const at = read('')
  assert.equal(at.view, 'month')
  assert.equal(at.month, '2026-10')
  assert.equal(at.week, '2026-10-26')
  assert.equal(at.day, '')
  assert.equal(at.cardiff, 'all')
  assert.deepEqual(at.areas, AREAS)
  const wrong = read('view=decade&month=2026-13&day=2026-02-30&tab=nothing&cardiff=everything&hide=study,unknown')
  assert.equal(wrong.view, 'month')
  assert.equal(wrong.month, '2026-10')
  assert.equal(wrong.day, '')
  assert.equal(wrong.tab, 'day')
  assert.equal(wrong.cardiff, 'all')
  assert.deepEqual(wrong.hidden, ['study'])
  assert.deepEqual(wrong.areas, ['core', 'career', 'events'])
})

test('the address names the view, the open day, the thing on it and the tab', () => {
  const at = read('view=week&week=2026-11-04&day=2026-11-05&item=study:block:s1:b2&tab=jobs&q=lecture')
  assert.equal(at.view, 'week')
  assert.equal(at.week, '2026-11-02', 'any day of a week names its Monday')
  assert.equal(at.day, '2026-11-05')
  assert.equal(at.month, '2026-11', 'the month follows the open day when it is not named')
  assert.equal(at.item, 'study:block:s1:b2')
  assert.equal(at.tab, 'jobs')
  assert.equal(at.q, 'lecture')
  assert.equal(read('item=orphan').item, '', 'a thing needs its day')
  // The older ?date= link still opens that day.
  const legacy = read('date=2026-12-03')
  assert.equal(legacy.legacy, '2026-12-03')
  assert.equal(legacy.day, '2026-12-03')
  assert.equal(legacy.month, '2026-12')
})

test('stepping moves a month, a week (the month follows) or a year; Today comes back', () => {
  assert.deepEqual(stepView(read('month=2026-12'), 1), { month: '2027-01', week: null })
  assert.deepEqual(stepView(read('month=2026-01'), -1), { month: '2025-12', week: null })
  assert.deepEqual(stepView(read('view=week&week=2026-10-26'), 1), { week: '2026-11-02', month: '2026-11' })
  assert.deepEqual(stepView(read('view=year&month=2026-10'), -1), { month: '2025-10', week: null })
  assert.deepEqual(todayIn('week', '2026-10-28'), { month: '2026-10', week: '2026-10-26' })
  assert.deepEqual(todayIn('month', '2026-10-28'), { month: '2026-10', week: null })
})

test('each view asks for the dates it draws', () => {
  assert.deepEqual(viewRange(read('month=2026-10')), { from: '2026-09-28', to: '2026-11-01' })
  assert.deepEqual(viewRange(read('view=week&week=2026-10-28')), { from: '2026-10-26', to: '2026-11-01' })
  assert.deepEqual(viewRange(read('view=agenda&month=2026-02')), { from: '2026-02-01', to: '2026-02-28' })
  assert.deepEqual(viewRange(read('view=year&month=2028-05')), { from: '2028-01-01', to: '2028-12-31' })
})

test('the month is whole Monday-to-Sunday weeks with ISO week numbers', () => {
  const grid = monthGrid('2026-10', '2026-10-28')
  assert.equal(grid.weeks.length, 5)
  assert.deepEqual(grid.weeks.map((week) => week.number), [40, 41, 42, 43, 44])
  assert.equal(grid.weeks[4].days[2].today, true)
  assert.equal(grid.weeks[0].days[0].current, false)
  assert.equal(isoWeek('2027-01-01'), 53, 'a Friday 1 January is in the last week of the year before')
  assert.equal(isoWeek('2026-12-31'), 53)
  assert.equal(isoWeek('2025-12-29'), 1)
})

test('timed things are placed by London clock times, side by side when they overlap', () => {
  const placed = placeTimed([
    item({ id: 'a', all_day: false, start: '2026-10-28T08:30:00.000Z', end: '2026-10-28T09:30:00.000Z' }),
    item({ id: 'b', all_day: false, start: '2026-10-28T09:00:00.000Z', end: '2026-10-28T10:00:00.000Z' }),
    item({ id: 'c', all_day: false, start: '2026-10-28T12:00:00.000Z', end: null }),
    item({ id: 'night', all_day: false, start: '2026-10-27T22:00:00.000Z', end: '2026-10-28T01:00:00.000Z' }),
    item({ id: 'all' }),
  ], '2026-10-28')
  const by = Object.fromEntries(placed.map((entry) => [entry.item.id, entry]))
  assert.equal(by.all, undefined, 'all-day things are not on the hours')
  assert.deepEqual([by.night.start, by.night.end], [0, 60], 'begun the evening before: from midnight')
  assert.deepEqual([by.a.start, by.a.end, by.a.column, by.a.columns], [510, 570, 0, 2])
  assert.deepEqual([by.b.column, by.b.columns], [1, 2])
  assert.deepEqual([by.c.start, by.c.end, by.c.columns], [720, 750, 1], 'no end: half an hour')
  assert.deepEqual([by.a.span, by.b.span, by.c.span], [1, 1, 1])
  // A thing widens into the columns beside it that nothing overlapping it uses.
  const crowd = Object.fromEntries(placeTimed([
    item({ id: 'p', all_day: false, start: '2026-10-28T09:00:00.000Z', end: '2026-10-28T10:00:00.000Z' }),
    item({ id: 'q', all_day: false, start: '2026-10-28T09:00:00.000Z', end: '2026-10-28T09:30:00.000Z' }),
    item({ id: 'r', all_day: false, start: '2026-10-28T09:00:00.000Z', end: '2026-10-28T09:15:00.000Z' }),
    item({ id: 's', all_day: false, start: '2026-10-28T09:30:00.000Z', end: '2026-10-28T10:00:00.000Z' }),
  ], '2026-10-28').map((entry) => [entry.item.id, entry]))
  assert.deepEqual(['p', 'q', 'r', 's'].map((id) => [crowd[id].column, crowd[id].span, crowd[id].columns]), [[0, 1, 3], [1, 1, 3], [2, 1, 3], [1, 2, 3]])
  assert.deepEqual(weekHours(placed), { from: 0, to: 20 })
  assert.deepEqual(weekHours([]), { from: 8, to: 20 })
})

test('each day of the view gets its things once, with timed ends at midnight on the day before', () => {
  const days = groupByDay([
    item({ id: 'three', start: '2026-10-27', end: '2026-10-29' }),
    item({ id: 'late', all_day: false, start: '2026-10-28T22:00:00.000Z', end: '2026-10-29T00:00:00.000Z' }),
    item({ id: 'outside', start: '2026-12-01' }),
  ], '2026-10-28', '2026-10-31')
  assert.deepEqual([...days.keys()], ['2026-10-28', '2026-10-29'])
  assert.deepEqual(days.get('2026-10-28').map((entry) => entry.id), ['three', 'late'])
  assert.deepEqual(days.get('2026-10-29').map((entry) => entry.id), ['three'])
  assert.deepEqual(daySpan(item({ all_day: false, start: '2026-10-28T23:30:00.000Z', end: null })), { first: '2026-10-28', last: '2026-10-28' })
})

test('search, where a thing opens, and a link to a day', () => {
  const lecture = item({ title: 'MAT022 · Lecture', area: 'study', location: 'Abacws 2.26' })
  assert.equal(matchesSearch(lecture, 'lecture abacws'), true)
  assert.equal(matchesSearch(lecture, 'study'), true)
  assert.equal(matchesSearch(lecture, 'budget'), false)
  assert.equal(placeOf('/study#/today?card=1'), 'Study hub')
  assert.equal(placeOf('/cardiff-life'), 'Cardiff Life')
  assert.equal(placeOf('/jobmap#job=a'), 'JobMap')
  assert.equal(placeOf('/budget#/meals/week'), 'Budget')
  assert.equal(placeOf('/calendar?date=2026-10-28'), '')
  assert.equal(placeOf('/studyroom'), '')
  assert.equal(calendarDayHref('2026-11-06'), '/calendar?month=2026-11&day=2026-11-06')
})

test('Back closes what was opened here; what came with a link is taken out of the address', () => {
  assert.equal(changedSearch('?month=2026-10&day=2026-10-28', { day: null, item: '' }), '?month=2026-10')
  assert.equal(changedSearch('', { view: 'week', week: '2026-10-26' }), '?view=week&week=2026-10-26')
  const params = (search) => new URLSearchParams(search)
  // Opened the day, then a thing on it: closing the thing is one step, closing the day two.
  assert.equal(stepsToClose(params('day=d&item=i'), ['day', 'item'], ['item']), 1)
  assert.equal(stepsToClose(params('day=d&item=i'), ['day', 'item'], ['day', 'item']), 2)
  // The day came with a link: nothing to go back to.
  assert.equal(stepsToClose(params('day=d&item=i'), ['item'], ['day', 'item']), 0)
  assert.equal(stepsToClose(params('month=m'), [], ['day']), 0)
  // Another day inside the pop-up changes the address in place: the steps stay, a closed thing stays as a blank.
  assert.deepEqual(nextLayers(['day', 'item'], { day: 'e', item: null }, { replace: true }), ['day', ''])
  assert.deepEqual(nextLayers(['day', ''], { item: 'j' }, { layer: 'item' }), ['day', '', 'item'])
  assert.equal(stepsToClose(params('day=e&item=j'), ['day', '', 'item'], ['item']), 1)
  assert.equal(stepsToClose(params('day=e&item=j'), ['day', '', 'item'], ['day', 'item']), 3)
  // Any other step (a month) starts again.
  assert.deepEqual(nextLayers(['day'], { month: '2026-11' }), [])
})
