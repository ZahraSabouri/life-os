import test from 'node:test'
import assert from 'node:assert/strict'
import { expandRoutines, isoWeekday, routineOf, sayWeekdays, weekdaysOf, withRoutines } from '../../shared/routines.js'
import { validateDetails } from '../../shared/entryTypes.js'

const routine = (extra = {}) => ({ id: 'r1', type: 'repeat', title: 'Job applications', status: 'active', start_at: '2026-10-26', end_at: null, details: { weekdays: '1,5', start: '17:45', end: '20:45', area: 'career' }, ...extra })

test('a routine is read from its entry: its days, its clock time, its first and last day', () => {
  assert.deepEqual(routineOf(routine()), { id: 'r1', title: 'Job applications', from: '2026-10-26', until: '', weekdays: [1, 5], start: '17:45', end: '20:45', area: 'career' })
  assert.deepEqual(routineOf(routine({ details: JSON.stringify({ weekdays: '7', area: 'home' }), end_at: '2026-11-30' })), { id: 'r1', title: 'Job applications', from: '2026-10-26', until: '2026-11-30', weekdays: [7], start: '', end: '', area: 'home' })
  assert.equal(routineOf(routine({ status: 'stopped' })), null)
  assert.equal(routineOf(routine({ start_at: null })), null)
  assert.equal(routineOf({ type: 'task' }), null)
  assert.deepEqual(weekdaysOf('3, 1, 9, x'), [1, 3])
  assert.deepEqual(weekdaysOf(''), [1, 2, 3, 4, 5, 6, 7])
  assert.deepEqual([isoWeekday('2026-10-26'), isoWeekday('2026-11-01')], [1, 7])
  assert.deepEqual([sayWeekdays('1,2,3,4,5,6,7'), sayWeekdays('1,2,3,4,5'), sayWeekdays('6,7'), sayWeekdays('1,5'), sayWeekdays('7'), sayWeekdays('1,3,5')], ['every day', 'weekdays', 'weekends', 'every Mon and Fri', 'every Sun', 'every Mon, Wed and Fri'])
})

test('its days are worked out for a stretch: on its weekdays, from its first day to its last, at London time', () => {
  const days = expandRoutines([routine({ end_at: '2026-11-06' })], '2026-10-19', '2026-11-15')
  // Not before it starts (Mon 19, Fri 23 Oct), not after it ends (Mon 9 Nov).
  assert.deepEqual(days.map((row) => row.id), ['routine:r1:2026-10-26', 'routine:r1:2026-10-30', 'routine:r1:2026-11-02', 'routine:r1:2026-11-06'])
  const [summer, winter] = [days[0], days[1]]
  assert.deepEqual([summer.type, summer.title, summer.status, summer.all_day, summer.virtual], ['time-block', 'Job applications', 'planned', 0, true])
  assert.deepEqual(summer.details, { area: 'career', routine: 'r1' })
  // 26 October 2026 is after the clocks go back (25 October): 17:45 in London is 17:45 UTC.
  assert.deepEqual([summer.start_at, summer.end_at], ['2026-10-26T17:45:00.000Z', '2026-10-26T20:45:00.000Z'])
  assert.equal(winter.start_at, '2026-10-30T17:45:00.000Z')
  // In summer time the same clock time is an hour earlier in UTC.
  assert.equal(expandRoutines([routine({ start_at: '2026-10-12' })], '2026-10-12', '2026-10-12')[0].start_at, '2026-10-12T16:45:00.000Z')
})

test('a routine with no clock time gives things to do for any time of its days', () => {
  const [row] = expandRoutines([routine({ id: 'laundry', title: 'Laundry', details: { weekdays: '7', area: 'home' } })], '2026-10-26', '2026-11-01')
  assert.deepEqual([row.id, row.type, row.start_at, row.end_at, row.all_day, row.details], ['routine:laundry:2026-11-01', 'task', '2026-11-01', null, 1, { area: 'home', routine: 'laundry' }])
  // A room that is not one of the calendar's block areas: a timed routine falls under "core".
  assert.deepEqual(expandRoutines([routine({ details: { weekdays: '1', start: '18:00', area: 'body' } })], '2026-10-26', '2026-10-26')[0].details, { area: 'core', routine: 'r1' })
})

test('a day she has acted on is a real entry and stands in for the worked-out one', () => {
  const done = { id: 'e1', type: 'time-block', title: 'Job applications', status: 'done', start_at: '2026-10-26T17:45:00.000Z', details: JSON.stringify({ area: 'career', routine: 'r1' }) }
  const skipped = { id: 'e2', type: 'time-block', title: 'Job applications', status: 'cancelled', start_at: '2026-10-30T17:45:00.000Z', details: { area: 'career', routine: 'r1' } }
  const other = { id: 'e3', type: 'task', title: 'Something else', start_at: '2026-11-02', details: {} }
  const all = withRoutines([routine(), done, skipped, other], '2026-10-26', '2026-11-02')
  assert.deepEqual(all.map((row) => row.id), ['r1', 'e1', 'e2', 'e3', 'routine:r1:2026-11-02'])
  assert.deepEqual(expandRoutines([routine()], '2026-11-03', '2026-11-01'), [])
  assert.deepEqual(expandRoutines(null, '2026-10-26', '2026-10-27'), [])
})

test('the entry kinds accept a routine and the mark an acted-on day carries', () => {
  const kept = validateDetails('repeat', { weekdays: '1,5', start: '17:45', end: '20:45', area: 'career', junk: 1 })
  assert.equal(kept.ok, true)
  assert.deepEqual(kept.value, { weekdays: '1,5', start: '17:45', end: '20:45', area: 'career' })
  assert.deepEqual(validateDetails('time-block', { area: 'career', routine: 'r1' }).value, { area: 'career', routine: 'r1' })
  assert.deepEqual(validateDetails('task', { routine: 'r1' }).value, { routine: 'r1', priority: 'med' })   // a task's own default comes with it
})
