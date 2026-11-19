// Stage 8 CP2: a day's things as one model, and Running late.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dayThing, dayThings, planLate, londonClock } from '../../shared/dayplan.js'

const date = '2026-11-23' // GMT
const at = (clock) => `${date}T${clock}:00.000Z`
const own = (key, start, end, extra = {}) => ({ key, title: key, how: 'own', done: false, item: { id: key, kind: 'plan', start: at(start), end: at(end), meta: { source: 'core', entryId: key, type: 'time-block', ...extra } } })
const fixed = (key, start, end) => ({ key, title: key, how: 'check', done: false, item: { id: key, kind: 'fixed', start: at(start), end: at(end), meta: { source: 'native-study' } } })
const study = (key, start, end) => ({ key: `study:block:sem:${key}:${date}`, title: key, how: 'check', done: false, item: { id: key, kind: 'plan', start: at(start), end: at(end), meta: { source: 'native-study' } } })
const clock = (ms) => londonClock(ms)

describe('a day’s things', () => {
  it('knows what can move: her plans, tasks, repeat days and Study blocks; not classes, done or untimed things', () => {
    const things = dayThings([own('p', '10:00', '11:00'), own('r', '12:00', '13:00', { routine: { id: 'rep' } }), own('t', '13:00', '13:30', { type: 'task' }), study('cmt', '14:00', '15:00'), fixed('lecture', '15:10', '17:00'), { ...own('d', '18:00', '19:00'), done: true }])
    assert.deepEqual(things.map((t) => [t.id.split(':').slice(-2)[0] === 'cmt' ? 'cmt' : t.id, t.kind, t.movable]), [['p', 'plan', true], ['r', 'routine', true], ['t', 'task', true], ['cmt', 'study', true], ['lecture', 'fixed', false], ['d', 'plan', false]])
    assert.equal(dayThing({ key: 'x', how: 'own', item: { kind: 'plan', start: date, meta: { source: 'core', entryId: 'x' } } }).why, 'no time')
  })
})

describe('Running late', () => {
  const now = Date.parse(at('09:55'))
  it('moves the next thing by the delay and the rest only as far as they must; a gap soaks it up', () => {
    const things = dayThings([own('a', '10:00', '11:00'), own('b', '11:00', '12:00'), own('c', '13:00', '14:00')])
    const { moves, overflow } = planLate(things, { now, minutes: 30, date })
    assert.deepEqual(moves.map((m) => [m.thing.id, clock(m.start), clock(m.end)]), [['a', '10:30', '11:30'], ['b', '11:30', '12:30']])
    assert.deepEqual(overflow, [])
  })
  it('never lands a moved thing on a class: it goes after it', () => {
    const things = dayThings([own('a', '14:30', '15:00'), fixed('lecture', '15:10', '17:00'), own('b', '17:00', '17:30')])
    const { moves } = planLate(things, { now: Date.parse(at('14:20')), minutes: 30, date })
    assert.deepEqual(moves.map((m) => [m.thing.id, clock(m.start), clock(m.end)]), [['a', '17:00', '17:30'], ['b', '17:30', '18:00']])
  })
  it('leaves what is over or done, and names what would end after midnight', () => {
    const things = dayThings([own('past', '08:00', '09:00'), { ...own('done', '10:00', '11:00'), done: true }, own('late', '23:00', '23:45')])
    const { moves, overflow } = planLate(things, { now: Date.parse(at('22:55')), minutes: 30, date })
    assert.deepEqual(moves, [])
    assert.deepEqual(overflow.map((t) => t.id), ['late'])
  })
})
