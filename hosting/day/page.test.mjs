import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDay, daysAway, noteTitle, shortPlace } from '../../code/life-os/frontend/src/lib/day.js'

const DATE = '2026-10-12'
const items = [
  { id: 'lecture', area: 'study', kind: 'fixed', title: 'MAT022 · Lecture', start: '2026-10-12T14:10:00.000Z', end: '2026-10-12T16:00:00.000Z', all_day: false, href: '/study-native?session=1',
    location: 'Room: 2.26. Building: Abacws Building. AccessAble Details: https://www.accessable.co.uk/cardiff-university' },
  { id: 'study:native:cards:c1:deadline', area: 'study', kind: 'deadline', title: 'Diagnose the gaps', start: DATE, all_day: true, href: '/study', meta: { entity: 'cards', recordId: 'c1' } },
  { id: 'study:native:cards:c1:start', area: 'study', kind: 'plan', title: 'Start · Diagnose the gaps', start: DATE, all_day: true, href: '/study', meta: { entity: 'cards', recordId: 'c1' } },
  { id: 'study:native:cards:other:start', area: 'study', kind: 'plan', title: 'Start · Optional reading', start: DATE, all_day: true, href: '/study', meta: { entity: 'cards', recordId: 'other' } },
  { id: 'renewal', area: 'money', kind: 'reminder', title: 'SIM card', start: DATE, all_day: true, href: '/budget' },
  { id: 'job', area: 'career', kind: 'deadline', title: 'Data Manager · Swansea', start: DATE, all_day: true, href: '/jobmap' },
  { id: 'task', area: 'core', kind: 'plan', title: 'Return library book', start: DATE, all_day: true },
  { id: 'list', area: 'home', kind: 'plan', title: 'Lidl', start: DATE, all_day: true, href: '/budget' },
  { id: 'tomorrow', area: 'study', kind: 'fixed', title: 'Tomorrow', start: '2026-10-13T12:10:00.000Z', end: '2026-10-13T14:00:00.000Z', all_day: false },
]
const card = { id: 'c1', title: 'Diagnose the gaps', done: false, inBlock: true, steps: [], href: '/study#/today?card=x' }
const loose = { id: 'c2', title: 'Check the portfolio brief', done: false, inBlock: false, steps: [], href: '/study' }
const day = { blocks: [{ id: 'b1', start: '17:30', end: '18:30', minutes: 60, title: 'Library', category: 'study', location: '', card, href: '/study#/schedule' }], study: { today: [card, loose, { id: 'c3', title: 'Done already', done: true, inBlock: false }] } }

test('timed things and study blocks make one path in clock order, in London time', () => {
  const { stops } = buildDay({ items, day, date: DATE, now: '14:09' })
  assert.deepEqual(stops.map(stop => [stop.start, stop.end, stop.title, stop.when]), [['15:10', '17:00', 'MAT022 · Lecture', 'next'], ['17:30', '18:30', 'Library', 'later']])
  assert.equal(stops[0].place, 'Abacws 2.26')
  assert.equal(stops[1].card.id, 'c1')
  assert.equal(stops[1].href, '/study#/today?card=x')
})

test('the path knows what is over, what is on now and where now falls', () => {
  assert.deepEqual(buildDay({ items, day, date: DATE, now: '16:00' }).stops.map(stop => stop.when), ['now', 'next'])
  const evening = buildDay({ items, day, date: DATE, now: '17:10' })
  assert.deepEqual(evening.stops.map(stop => stop.when), ['past', 'next'])
  assert.equal(evening.nowIndex, 1)
  assert.equal(buildDay({ items, day, date: DATE, now: '21:00' }).nowIndex, -1)
  assert.equal(buildDay({ items: [], day: null, date: DATE, now: '21:00' }).nowIndex, -2)
})

test('a study card shown with its steps does not also appear as bare calendar rows', () => {
  const { anytime, also } = buildDay({ items, day, date: DATE, now: '14:09' })
  assert.deepEqual(anytime.map(entry => entry.title), ['Check the portfolio brief', 'Return library book', 'Lidl'])
  assert.deepEqual(also.map(entry => entry.title), ['Start · Optional reading', 'SIM card', 'Data Manager · Swansea'])
})

test('the small wording helpers', () => {
  assert.equal(shortPlace('Room: C/-1.04. Building: Sir Martin Evans Building. Location Details: https://intranet.cardiff.ac.uk/x'), 'Sir Martin Evans C/-1.04')
  assert.equal(shortPlace('Flashpoint, Cardiff https://example.org/map'), 'Flashpoint, Cardiff')
  assert.equal(shortPlace(''), '')
  assert.equal(noteTitle('Ask about calculators\nand the start time'), 'Ask about calculators')
  assert.equal(noteTitle('x'.repeat(120)).length, 78)
  assert.deepEqual([daysAway(0), daysAway(1), daysAway(5), daysAway(-2)], ['today', 'tomorrow', 'in 5 days', '2 days ago'])
})
