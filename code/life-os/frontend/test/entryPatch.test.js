import test from 'node:test'
import assert from 'node:assert/strict'
import { entryForm, entryPatch } from '../src/lib/entryPatch.js'

const entry = (overrides = {}) => ({ id: 'e1', type: 'task', title: 'Buy stamps', status: null, start_at: null, end_at: null, all_day: false, details: {}, ...overrides })
const changed = (source, change) => entryPatch(source, { ...entryForm(source), ...change })

test('the form opens with what the entry holds, at London time', () => {
  const block = entry({ type: 'time-block', title: 'Job applications', start_at: '2026-10-13T16:00:00.000Z', end_at: '2026-10-13T19:00:00.000Z', details: { area: 'career' } })
  assert.deepEqual(entryForm(block), { title: 'Job applications', body: '', details: { area: 'career' }, day: '2026-10-13', until: '', start: '17:00', end: '20:00', weekdays: [], status: '' })
  const repeat = entry({ type: 'repeat', title: 'Gym', status: 'active', start_at: '2026-10-26', end_at: '2026-12-27', all_day: true, details: { weekdays: '1,5', start: '18:00', end: '19:00', area: 'body' } })
  assert.deepEqual(entryForm(repeat), { title: 'Gym', body: '', details: repeat.details, day: '2026-10-26', until: '2026-12-27', start: '18:00', end: '19:00', weekdays: [1, 5], status: '' })
  assert.deepEqual([entryForm(entry({ start_at: '2026-10-14', all_day: true })).day, entryForm(entry({ start_at: '2026-10-14', all_day: true })).start, entryForm(entry({ status: 'done' })).status], ['2026-10-14', '', 'done'])
})

test('a plan is given a day, a clock time, another state, or none of them', () => {
  assert.deepEqual(changed(entry(), { title: ' Buy stamps and envelopes ' }), { title: 'Buy stamps and envelopes', status: null, details: {} })
  assert.deepEqual(changed(entry(), { day: '2026-10-14' }), { title: 'Buy stamps', start_at: '2026-10-14', end_at: null, all_day: true, status: null, details: {} })
  // 17:30 on a British Summer Time day is 16:30 in the stored instant.
  assert.deepEqual(changed(entry(), { day: '2026-10-14', start: '17:30', end: '18:15', status: 'done' }), { title: 'Buy stamps', start_at: '2026-10-14T16:30:00.000Z', end_at: '2026-10-14T17:15:00.000Z', all_day: false, status: 'done', details: {} })
  assert.deepEqual(changed(entry({ start_at: '2026-10-14', all_day: true }), { day: '' }), { title: 'Buy stamps', start_at: null, end_at: null, all_day: false, status: null, details: {} })
  // The plan a day belongs to, and its area, are kept; an emptied box is left out.
  assert.deepEqual(changed(entry({ details: { routine: 'r1', area: 'home', priority: 'high' } }), { details: { routine: 'r1', area: 'home', priority: '' } }).details, { routine: 'r1', area: 'home' })
})

test('a note keeps its text; other kinds keep theirs when they have one', () => {
  const note = entry({ type: 'note', title: 'Idea', details: { body: 'First words' } })
  assert.deepEqual(changed(note, { body: ' Better words ' }), { title: 'Idea', details: { body: 'Better words' } })
  assert.throws(() => changed(note, { body: '  ' }), /needs some text/)
  assert.equal('status' in changed(note, {}), false)
})

test('a repeating plan is changed in place: days, clock time, first and last day', () => {
  const repeat = entry({ type: 'repeat', title: 'Job applications', status: 'active', start_at: '2026-10-26', end_at: '2026-12-27', all_day: true, details: { weekdays: '1,5', start: '17:00', end: '20:00', area: 'career' } })
  assert.deepEqual(changed(repeat, { weekdays: [2, 4], start: '18:00', end: '19:30', until: '' }), {
    title: 'Job applications', start_at: '2026-10-26', end_at: null, all_day: true, details: { area: 'career', weekdays: '2,4', start: '18:00', end: '19:30' },
  })
  // Any time of the day: no clock time is kept.
  assert.deepEqual(changed(repeat, { start: '', end: '' }).details, { area: 'career', weekdays: '1,5' })
})

test('what cannot be saved is refused in plain words', () => {
  const repeat = entry({ type: 'repeat', title: 'Gym', start_at: '2026-10-26', all_day: true, details: { weekdays: '1' } })
  assert.throws(() => changed(entry(), { title: '  ' }), /title/)
  assert.throws(() => changed(entry(), { day: '2026-10-14', end: '18:00' }), /start time as well/)
  assert.throws(() => changed(entry(), { day: '2026-10-14', start: '18:00', end: '17:00' }), /after the start/)
  assert.throws(() => changed(entry(), { day: '2026-02-30' }), /does not exist/)
  // 01:30 does not exist on the night the clocks go forward.
  assert.throws(() => changed(entry(), { day: '2027-03-28', start: '01:30' }), /clocks change/)
  assert.throws(() => changed(repeat, { weekdays: [] }), /weekday/)
  assert.throws(() => changed(repeat, { until: '2026-10-01' }), /before the first/)
  assert.throws(() => changed(repeat, { day: '' }), /first day/)
  assert.throws(() => changed(repeat, { start: '19:00', end: '18:00' }), /after the start/)
})
