import test from 'node:test'
import assert from 'node:assert/strict'
import { dateKey, isDateKey, addDays, itemOverlaps, londonDateTime } from './calendar.js'

test('London civil dates preserve date-only values and convert UTC across midnight', () => {
  assert.equal(dateKey('2026-07-01T23:30:00Z'), '2026-07-02')
  assert.equal(dateKey('2026-12-01T23:30:00Z'), '2026-12-01')
  assert.equal(dateKey('2026-07-01'), '2026-07-01')
  assert.equal(dateKey('2026-02-30'), '')
  assert.equal(dateKey(undefined), '')
  assert.equal(isDateKey('2024-02-29'), true)
  assert.equal(addDays('2026-10-25', 1), '2026-10-26')
})

test('multi-day items overlap a month and midnight ends do not spill into the next day', () => {
  assert.equal(itemOverlaps({start:'2026-09-29',all_day:true}, '2026-10-01','2026-10-31'), false)
  assert.equal(itemOverlaps({start:'2026-09-29',end:'2026-10-02',all_day:true}, '2026-10-01','2026-10-31'), true)
  assert.equal(itemOverlaps({start:'2026-10-01T20:00:00Z',end:'2026-10-01T23:00:00Z',all_day:false}, '2026-10-02','2026-10-02'), false)
})

test('London source times handle daylight saving and reject nonexistent times', () => {
  assert.equal(londonDateTime('2026-07-01','14:00'), '2026-07-01T13:00:00.000Z')
  assert.equal(londonDateTime('2026-12-01','14:00'), '2026-12-01T14:00:00.000Z')
  assert.equal(londonDateTime('2026-03-29','01:30'), '')
  assert.equal(londonDateTime('2026-10-25','01:30'), '')
})
