import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTimetable } from './timetable.mjs'
import { mapNativeStudy } from './calendar.mjs'

const calendar = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n')
const event = (...lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n')
const timed = (extra = []) => event('UID:lecture', 'SUMMARY:Lecture', 'DTSTART;TZID=Europe/London:20261005T090000', 'DTEND;TZID=Europe/London:20261005T100000', ...extra)
const options = { format: 'ics', source: 'test-calendar', semester_id: 'semester', module_id: 'module' }

test('weekly BYDAY COUNT preserves exclusions, cancellations and moved occurrence identity', () => {
  const text = calendar(timed(['RRULE:FREQ=WEEKLY;COUNT=4;BYDAY=MO,WE', 'EXDATE;TZID=Europe/London:20261007T090000']),
    event('UID:lecture', 'RECURRENCE-ID;TZID=Europe/London:20261012T090000', 'STATUS:CANCELLED'),
    event('UID:lecture', 'RECURRENCE-ID;TZID=Europe/London:20261014T090000', 'DTSTART;TZID=Europe/London:20261015T110000', 'SUMMARY:Moved lecture'))
  const imported = parseTimetable(text, options)
  assert.equal(imported.records.length, 4)
  assert.deepEqual(imported.records.map(row => row.record.status), ['planned', 'cancelled', 'cancelled', 'planned'])
  const moved = imported.records[3]
  assert.equal(moved.record.start_at, '2026-10-15T10:00:00.000Z')
  assert.equal(moved.record.end_at, '2026-10-15T11:00:00.000Z')
  assert.match(moved.source_id, /2026-10-14T08:00:00.000Z$/)
  assert.equal(moved.record.data.ics.original_start, '2026-10-14T08:00:00.000Z')
  const shared = mapNativeStudy({ sessions: imported.records.map(row => row.record) }, '2026-10-01', '2026-10-31')
  assert.equal(shared.length, 2)
  assert.deepEqual(parseTimetable(text, options), imported)
})

test('recurrence keeps London wall clock across DST and UNTIL is inclusive', () => {
  const text = calendar(event('UID:dst', 'DTSTART;TZID=Europe/London:20261019T090000', 'DTEND;TZID=Europe/London:20261019T100000', 'RRULE:FREQ=WEEKLY;UNTIL=20261102T090000Z'))
  const imported = parseTimetable(text, options)
  assert.deepEqual(imported.records.map(row => row.record.start_at), ['2026-10-19T08:00:00.000Z', '2026-10-26T09:00:00.000Z', '2026-11-02T09:00:00.000Z'])
  assert.deepEqual(imported.records.map(row => row.record.end_at), ['2026-10-19T09:00:00.000Z', '2026-10-26T10:00:00.000Z', '2026-11-02T10:00:00.000Z'])
})

test('daily weekday filters and week intervals expand complete finite sets', () => {
  const daily = parseTimetable(calendar(timed(['RRULE:FREQ=DAILY;COUNT=5;BYDAY=MO'])), options)
  assert.deepEqual(daily.records.map(row => row.record.start_at.slice(0, 10)), ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'])
  const weekly = parseTimetable(calendar(event('UID:weeks', 'DTSTART;VALUE=DATE:20261007', 'RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=4;BYDAY=MO,WE;WKST=MO')), options)
  assert.deepEqual(weekly.records.map(row => row.record.start_date), ['2026-10-07', '2026-10-19', '2026-10-21', '2026-11-02'])
})

test('UTC and all-day midnight ends preserve exclusive ICS end semantics', () => {
  const imported = parseTimetable(calendar(event('UID:day', 'DTSTART;VALUE=DATE:20261005', 'DTEND;VALUE=DATE:20261007'),
    event('UID:night', 'DTSTART:20261004T200000Z', 'DTEND:20261004T230000Z')), options)
  const day = imported.records.find(row => row.source_id.startsWith('day#')).record
  assert.equal(day.start_date, '2026-10-05')
  assert.equal(day.end_date, '2026-10-06')
  const shared = mapNativeStudy({ sessions: imported.records.map(row => row.record) }, '2026-10-05', '2026-10-05')
  assert.deepEqual(shared.map(item => item.meta.recordId), [day.id])
})

test('source namespace and stable occurrence IDs survive summary edits', () => {
  const original = calendar(timed())
  const row = parseTimetable(original, options).records[0]
  const edited = parseTimetable(original.replace('SUMMARY:Lecture', 'SUMMARY:Updated lecture'), options).records[0]
  const independent = parseTimetable(original, { ...options, source: 'another-feed' }).records[0]
  assert.equal(row.record.id, edited.record.id)
  assert.equal(row.source_id, edited.source_id)
  assert.notEqual(row.record.provenance.fingerprint, edited.record.provenance.fingerprint)
  assert.notEqual(row.record.id, independent.record.id)
  assert.match(row.record.id, /^[a-f\d]{8}-[a-f\d]{4}-5[a-f\d]{3}-a[a-f\d]{3}-[a-f\d]{12}$/)
})

test('bounded unending rules need a range and finite rules cannot silently truncate', () => {
  const text = calendar(timed(['RRULE:FREQ=WEEKLY']))
  assert.throws(() => parseTimetable(text, options), /Unbounded RRULE/)
  assert.equal(parseTimetable(text, { ...options, from: '2026-10-01', to: '2026-10-31' }).records.length, 4)
  assert.throws(() => parseTimetable(text, { ...options, from: '2026-01-01', to: '2027-01-02' }), /366 days/)
  assert.throws(() => parseTimetable(calendar(timed(['RRULE:FREQ=DAILY;COUNT=1000'])), options), /Finite recurrence exceeds/)
  assert.equal(parseTimetable(calendar(timed(['RRULE:FREQ=DAILY;COUNT=1000'])), { ...options, from: '2026-10-05', to: '2026-10-07' }).records.length, 3)
})

test('unsupported recurrence and timezone semantics are explicit errors', () => {
  for (const extra of ['RRULE:FREQ=MONTHLY', 'RRULE:FREQ=WEEKLY;BYSETPOS=1', 'RRULE:FREQ=WEEKLY;BYDAY=1MO', 'RRULE:FREQ=DAILY;COUNT=2;UNTIL=20261008T090000Z', 'RDATE:20261007T090000Z', 'DURATION:PT1H']) {
    assert.throws(() => parseTimetable(calendar(timed([extra])), options), error => error.status === 400)
  }
  assert.throws(() => parseTimetable(calendar(event('UID:zone', 'DTSTART;TZID=America/New_York:20261005T090000')), options), /timezone clocks are unsupported/)
  assert.throws(() => parseTimetable(calendar(event('UID:floating', 'DTSTART:20261005T090000')), options), /floating/)
  assert.throws(() => parseTimetable(calendar(event('UID:gap', 'DTSTART;TZID=Europe/London:20260329T013000')), options), /nonexistent/)
  assert.throws(() => parseTimetable(calendar(event('UID:fold', 'DTSTART;TZID=Europe/London:20261025T013000')), options), /ambiguous/)
  assert.throws(() => parseTimetable(calendar('BEGIN:VTIMEZONE\r\nTZID:America/New_York\r\nEND:VTIMEZONE', timed()), options), /Unsupported VTIMEZONE/)
  assert.throws(() => parseTimetable(calendar(timed(['RRULE:FREQ=WEEKLY']), event('UID:lecture', 'RECURRENCE-ID;RANGE=THISANDFUTURE;TZID=Europe/London:20261012T090000', 'STATUS:CANCELLED')), { ...options, from: '2026-10-01', to: '2026-10-31' }), /RANGE is unsupported/)
})

test('calendar cancellation method and finished count do not create later phantom dates', () => {
  const cancelled = calendar(timed()).replace('VERSION:2.0', 'VERSION:2.0\r\nMETHOD:CANCEL')
  assert.equal(parseTimetable(cancelled, options).records[0].record.status, 'cancelled')
  const countOne = calendar(event('UID:one', 'DTSTART;TZID=Europe/London:20261024T013000', 'RRULE:FREQ=DAILY;COUNT=1'))
  assert.equal(parseTimetable(countOne, { ...options, from: '2026-10-24', to: '2026-10-26' }).records.length, 1)
})

test('folded text, escaped punctuation and UTC exclusions are preserved', () => {
  const text = calendar(timed(['RRULE:FREQ=WEEKLY;COUNT=2', 'EXDATE:20261012T080000Z', 'DESCRIPTION:Line one\\nLine two\\, with punctuation', 'LOCATION:Room \\; A', 'SUMMARY:A long ', ' title']))
    .replace('SUMMARY:Lecture\r\n', '')
  const imported = parseTimetable(text, options)
  assert.equal(imported.records[0].record.title, 'A long title')
  assert.equal(imported.records[0].record.data.description, 'Line one\nLine two, with punctuation')
  assert.equal(imported.records[0].record.data.location, 'Room ; A')
  assert.equal(imported.records[1].record.status, 'cancelled')
})

test('invalid exception membership and duplicate UIDs cannot lose records silently', () => {
  assert.throws(() => parseTimetable(calendar(timed(), timed()), options), /Duplicate master UID/)
  assert.throws(() => parseTimetable(calendar(timed(['RRULE:FREQ=WEEKLY;COUNT=2']), event('UID:lecture', 'RECURRENCE-ID;TZID=Europe/London:20261013T090000', 'STATUS:CANCELLED')), options), /does not match/)
})

test('CSV retains overnight/date spans, quoted titles and stable IDs with explicit warnings', () => {
  const text = 'uid,title,date,start_time,end_time,end_date,location\r\nnight,"Late, lecture",2026-10-05,23:00,01:00,,Room\r\nday,Workshop,2026-10-07,,,2026-10-08,Hall\r\n'
  const imported = parseTimetable(text, { ...options, format: 'csv' })
  assert.equal(imported.records[0].record.start_at, '2026-10-05T22:00:00.000Z')
  assert.equal(imported.records[0].record.end_at, '2026-10-06T00:00:00.000Z')
  assert.equal(imported.records[0].record.title, 'Late, lecture')
  assert.equal(imported.records[1].record.end_date, '2026-10-08')
  assert.deepEqual(imported.warnings, [])
  const changed = parseTimetable(text.replace('Workshop', 'New workshop'), { ...options, format: 'csv' })
  assert.equal(changed.records[1].record.id, imported.records[1].record.id)
  assert.equal(parseTimetable('title,date\nRead,2026-10-05', { ...options, format: 'csv' }).warnings.length, 1)
})

test('CSV validates civil dates, clocks, duplicate rows and malformed quoting', () => {
  for (const row of ['Read,2026-02-30,09:00,10:00', 'Read,2026-10-25,01:30,02:30', 'Read,2026-10-05,,10:00', 'Read,2026-10-05,09:00,09:00']) {
    assert.throws(() => parseTimetable(`title,date,start_time,end_time\n${row}`, { ...options, format: 'csv' }), error => error.status === 400)
  }
  assert.throws(() => parseTimetable('title,date\nRead,2026-10-05\nRead,2026-10-05', { ...options, format: 'csv' }), /duplicates/)
  assert.throws(() => parseTimetable('title,date\n"Read,2026-10-05', { ...options, format: 'csv' }), /unterminated/)
})
