import test from 'node:test'
import assert from 'node:assert/strict'
import { attentionReason, filterCalendarItems, itemTime, readCardiffChoices, todayGroups, withSavedCardiffItems } from '../src/lib/calendar.js'

const item = (overrides = {}) => ({ id: 'example', area: 'core', kind: 'plan', title: 'Example', start: '2026-10-05', end: null, all_day: true, href: '/ledger', meta: {}, ...overrides })
const choices = {
  going: { status: 'going', snapshot: { name: 'Saved event', date: '2026-10-05', start_time: '18:00', end_time: '19:00', location: 'Cardiff' } },
  maybe: { status: 'maybe', snapshot: { name: 'Maybe event', date: '2026-10-06' } }
}

test('Cardiff scope follows the same browser choices without treating research as personal plans', () => {
  const items = [item(), ...['going', 'maybe', 'option'].map(id => item({ id, area: 'events', meta: { eventId: id } }))]
  assert.deepEqual(filterCalendarItems(items, { choices }).map(row => row.id), ['example', 'going', 'maybe'])
  assert.deepEqual(filterCalendarItems(items, { choices, cardiffScope: 'going' }).map(row => row.id), ['example', 'going'])
  assert.equal(filterCalendarItems(items, { choices, cardiffScope: 'all' }).length, 4)
  assert.deepEqual(filterCalendarItems(items, { areas: ['core'], choices }).map(row => row.id), ['example'])
  assert.equal(filterCalendarItems(items, { choices }).find(row => row.id === 'going').choice, 'going')
})

test('saved snapshots fill truly removed research dates but never resurrect rescheduled/cancelled catalogue IDs', () => {
  const saved = withSavedCardiffItems([], choices, '2026-10-01', '2026-10-31', [])
  assert.equal(saved.length, 2)
  assert.equal(saved[0].start, '2026-10-05T17:00:00.000Z')
  assert.equal(saved[0].meta.savedSnapshot, true)
  assert.equal(saved[0].href, '/cardiff-life')
  assert.equal(withSavedCardiffItems([], choices, '2026-10-01', '2026-10-31', ['going', 'maybe']).length, 0)
  assert.equal(withSavedCardiffItems([], choices, '2026-11-01', '2026-11-30', []).length, 0)
  const published = item({ id: 'published', area: 'events', meta: { eventId: 'going' } })
  assert.equal(withSavedCardiffItems([published], choices, '2026-10-01', '2026-10-31', []).length, 2)
})

test('saved overnight events reach the next London day; invalid transition clocks remain a date-only plan', () => {
  const overnight = { night: { status: 'going', snapshot: { name: 'Late event', date: '2026-10-04', start_time: '23:00', end_time: '01:00' } } }
  const nextDay = withSavedCardiffItems([], overnight, '2026-10-05', '2026-10-05', [])
  assert.equal(nextDay.length, 1)
  assert.equal(nextDay[0].start, '2026-10-04T22:00:00.000Z')
  assert.equal(nextDay[0].end, '2026-10-05T00:00:00.000Z')
  const gap = { spring: { status: 'maybe', snapshot: { name: 'Clock gap', date: '2026-03-29', start_time: '01:30', end_time: '02:30' } } }
  const plan = withSavedCardiffItems([], gap, '2026-03-29', '2026-03-29', [])[0]
  assert.equal(plan.start, '2026-03-29')
  assert.equal(plan.end, null)
  assert.equal(plan.all_day, true)
})

test('choice reads preserve storage and tolerate unavailable or malformed browser state', () => {
  let writes = 0
  const storage = { getItem: () => JSON.stringify({ version: 1, choices }), setItem: () => writes++ }
  assert.equal(readCardiffChoices(storage).choices.going.status, 'going')
  assert.equal(writes, 0)
  assert.match(readCardiffChoices(() => { throw new Error('denied') }).error, /could not be read/)
  assert.match(readCardiffChoices({ getItem: () => '{' }).error, /could not be read/)
  assert.match(readCardiffChoices({ getItem: () => JSON.stringify({ version: 1, choices: { bad: { status: 'unknown' } } }) }).error, /could not be read/)
  const broken = readCardiffChoices({ getItem: () => JSON.stringify({ version: 1, choices: { safe: { status: 'going', snapshot: { name: { invalid: true }, location: [] } } } }) })
  assert.equal(broken.choices.safe.snapshot.name, '')
  assert.equal(broken.choices.safe.snapshot.location, '')
})

test('attention follows incomplete due work, not elapsed events or the start of a study plan', () => {
  const today = '2026-10-05'
  assert.equal(attentionReason(item({ start: '2026-10-04', meta: { type: 'task', status: 'open' } }), today), 'Overdue')
  assert.equal(attentionReason(item({ start: '2026-10-04', meta: { type: 'task', status: 'done' } }), today), '')
  assert.equal(attentionReason(item({ area: 'study', start: '2026-10-01', end: '2026-10-10', meta: { type: 'study-start' } }), today), '')
  assert.equal(attentionReason(item({ area: 'study', kind: 'deadline', start: '2026-10-04', meta: { type: 'study-deadline' } }), today), 'Overdue')
  assert.equal(attentionReason(item({ kind: 'fixed', start: '2026-10-04T09:00:00Z', all_day: false }), today), '')
  assert.equal(attentionReason(item({ area: 'career', kind: 'reminder', start: '2026-10-04', meta: { type: 'followup' } }), today), 'Overdue')
  assert.equal(attentionReason(item({ area: 'money', kind: 'reminder', start: '2026-10-12', meta: { type: 'renewal' } }), today), 'Renewal ahead')
  assert.equal(attentionReason(item({ area: 'relationships', kind: 'reminder', meta: { type: 'birthday' } }), today), 'Birthday today')
  assert.equal(attentionReason(item({ kind: 'deadline', start: '2026-10-25' }), today), '')
})

test('Today groups London dates, inclusive all-day spans and exclusive timed midnight ends', () => {
  const rows = [
    item({ id: 'span', start: '2026-10-04', end: '2026-10-06' }),
    item({ id: 'late-utc', start: '2026-10-04T23:30:00Z', all_day: false }),
    item({ id: 'ends-midnight', start: '2026-10-04T20:00:00Z', end: '2026-10-04T23:00:00Z', all_day: false }),
    item({ id: 'future', start: '2026-10-07' }),
    item({ id: 'finished', meta: { type: 'task', status: 'completed' } })
  ]
  const groups = todayGroups(rows, '2026-10-05')
  assert.deepEqual(groups.today.map(row => row.id), ['span', 'late-utc'])
  assert.deepEqual(groups.week.map(row => row.id), ['span', 'future'])
  assert.equal(groups.attention.length, 0)
  assert.equal(itemTime(rows[1]), '00:30')
})
