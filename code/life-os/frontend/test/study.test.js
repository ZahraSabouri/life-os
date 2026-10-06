import test from 'node:test'
import assert from 'node:assert/strict'
import { activityDays, assessmentDay, cardChecklist, cardDateFields, cardDone, cardDue, DEFAULT_LANES, filterCards, laneStatus, normaliseWorkspace, recordPayload, safeMaterialUrl, scheduledMinutes, sessionConflicts, sessionOccurrences, sessionOnDay, studyPreferences, studyStats, studyStreak, timerElapsed, timerRemaining, minutesToLog, utcFromInput, weekStart, youtubeEmbed } from '../src/lib/study.js'
import { validateRecord } from '../../backend/src/modules/study/schema.js'

const card = (id, data = {}, extra = {}) => ({ id, title: id, status: 'planned', semester_id: 'semester-a', module_id: 'module-a', data: { lane: 'Backlog', ...data }, ...extra })

test('new records have a valid empty envelope and retain explicitly supplied parents/data', () => {
  for (const empty of [undefined, null]) {
    const value = recordPayload(empty, { title: 'A new self-directed module', semester_id: 'semester-b', data: { description: 'No personal constants' } })
    assert.equal(value.title, 'A new self-directed module')
    assert.equal(value.semester_id, 'semester-b')
    assert.equal(value.module_id, null)
    assert.equal(value.start_at, null)
    assert.equal(value.status, 'active')
    assert.equal(value.data.description, 'No personal constants')
  }
})

test('every displayed lane produces a backend-valid native status for new and edited cards', () => {
  for (const lane of DEFAULT_LANES) {
    const payload = recordPayload(undefined, { title: 'Study work', status: laneStatus(lane), data: { lane } })
    assert.equal(validateRecord('cards', payload).data.lane, lane)
    assert.equal(validateRecord('cards', { ...payload, revision: 1 }, { partial: true }).status, laneStatus(lane))
  }
})

test('moving a deadline recomputes its UTC instant and removing its clock clears it', () => {
  assert.equal(cardDateFields('', '2026-10-26', '', '10:00').end_at, '2026-10-26T10:00:00.000Z')
  assert.equal(cardDateFields('', '2026-10-05', '', '10:00').end_at, '2026-10-05T09:00:00.000Z')
  assert.equal(cardDateFields('', '2026-10-05').end_at, null)
  assert.throws(() => cardDateFields('', '', '', '10:00'), /due date/)
})

test('scope, combined filters and unrecorded dates remain distinct from today', () => {
  const cards = [card('Research reading', { phase: 'Reading', priority: 'High', tags: ['review'] }, { end_date: '2026-10-05' }), card('Old exercise', {}, { end_date: '2026-10-01' }), card('Done exercise', { lane: 'Done' }, { end_date: '2026-10-01' }), card('Other module', {}, { module_id: 'module-b', end_date: '2026-10-05' }), card('Undated project')]
  assert.deepEqual(filterCards(cards, { search: 'reading', phase: 'Reading', priority: 'High', tag: 'review', date: 'today', today: '2026-10-05', moduleId: 'module-a' }).map(c => c.id), ['Research reading'])
  assert.deepEqual(filterCards(cards, { date: 'overdue', today: '2026-10-05' }).map(c => c.id), ['Old exercise'])
  assert.deepEqual(filterCards(cards, { date: 'undated', today: '2026-10-05' }).map(c => c.id), ['Undated project'])
  assert.equal(cardDue(card('No date')), '')
  assert.equal(cardDone(card('Complete', { lane: 'Done' })), true)
  assert.deepEqual(studyStats([], '2026-10-05').overdue, [])
})

test('attention excludes inactive records, finished parents and date-watch reminders without hiding history', () => {
  const records = [card('Actual work', {}, { end_date: '2026-10-01' }), card('Archived', {}, { status: 'archived', end_date: '2026-10-01' }), card('Reminder', { tags: ['date-watch'] }, { end_date: '2026-10-01' }), card('Completed module', {}, { module_id: 'module-b', end_date: '2026-10-01' })]
  const parents = { modules: [{ id: 'module-b', status: 'completed', data: {} }] }
  assert.deepEqual(studyStats(records, '2026-10-05', parents).overdue.map(row => row.id), ['Actual work'])
  assert.equal(filterCards(records).length, 4)
  assert.equal(studyStats(records, '2026-10-05', { semesters: [{ id: 'semester-a', data: { enabled: false } }] }).overdue.length, 0)
})

test('checklist normalisation preserves saved IDs and marks while adapting old strings', () => {
  const entries = cardChecklist(card('card-id', { checklist: ['One output', { id: 'saved-id', text: 'Second output', done: true }] }))
  assert.deepEqual(entries, [{ id: 'card-id:check:0', text: 'One output', done: false }, { id: 'saved-id', text: 'Second output', done: true }])
})

test('study streak requires real work, uses London dates and allows today to remain in progress', () => {
  const rows = [card('Reading', { focusSessions: [{ at: '2026-10-03T23:30:00Z', minutes: 25 }, { at: '2026-10-03T10:00:00Z', minutes: 25 }], hoursLog: [{ at: '2026-10-02T10:00:00Z', hours: 0.5 }] }), card('Coursework', { lane: 'Done', completedAt: '2026-10-01T12:00:00Z' })]
  const snapshots = [{ data: { type: 'snapshot', loggedHours: 20 }, start_date: '2026-10-05' }]
  assert.equal(studyStreak(rows, snapshots, '2026-10-05'), 4)
  assert.equal(activityDays(rows, snapshots).some(day => day.date === '2026-10-05'), false)
  assert.equal(studyStreak(rows, snapshots, '2026-10-06'), 0)
})

test('wall-clock timer survives sleep without logging beyond its deadline', () => {
  const start = Date.parse('2026-10-05T10:00:00Z'), deadline = start + 25 * 60_000
  const timer = { running: true, segmentStartedAt: new Date(start).toISOString(), deadlineAt: new Date(deadline).toISOString(), elapsedMs: 0 }
  assert.equal(timerRemaining(timer, start + 60_000), 1440)
  assert.equal(timerElapsed(timer, deadline + 3_600_000), 25 * 60_000)
  assert.equal(timerRemaining(timer, deadline + 3_600_000), 0)
  assert.equal(minutesToLog(59_999), 0)
  assert.equal(minutesToLog(25 * 60_000), 25)
  assert.equal(timerRemaining({ running: true, deadlineAt: 'invalid', remainingSeconds: 60 }), 60)
  assert.equal(timerElapsed({ running: true, segmentStartedAt: 'invalid', deadlineAt: 'invalid', elapsedMs: 0 }), 0)
  assert.equal(minutesToLog(NaN), 0)
})

test('concrete imported timetable rows are shown once even when provenance holds RRULE metadata', () => {
  const sessions = [{ id: 'one', title: 'Tutorial', start_date: '2026-10-05', end_date: '2026-10-05', start_at: '2026-10-05T09:00:00Z', end_at: '2026-10-05T10:00:00Z', data: { recurrence: 'FREQ=WEEKLY;COUNT=10', ics: { rrule: 'FREQ=WEEKLY' } } }, { id: 'cancelled', status: 'cancelled', start_date: '2026-10-05', data: {} }]
  assert.deepEqual(sessionOccurrences(sessions, '2026-10-05', '2026-11-05').map(row => row.occurrenceId), ['one'])
  assert.equal(sessionOccurrences(sessions, '2026-10-12', '2026-10-18').length, 0)
  const adjacent = { ...sessions[0], id: 'adjacent', start_at: '2026-10-05T10:00:00Z', end_at: '2026-10-05T11:00:00Z' }
  const overlap = { ...sessions[0], id: 'overlap', start_at: '2026-10-05T09:30:00Z', end_at: '2026-10-05T10:30:00Z' }
  assert.equal(sessionConflicts([sessions[0], adjacent]).length, 0)
  assert.equal(sessionConflicts([sessions[0], overlap]).length, 1)
})

test('timed timetable and assessment grouping uses London dates, exclusive ends and clipped day totals', () => {
  const overnight = { id: 'overnight', start_at: '2026-10-04T22:30:00Z', end_at: '2026-10-05T00:30:00Z', data: {} }
  assert.equal(sessionOnDay(overnight, '2026-10-04'), true)
  assert.equal(sessionOnDay(overnight, '2026-10-05'), true)
  assert.equal(scheduledMinutes([overnight], '2026-10-05'), 90)
  const midnight = { ...overnight, end_at: '2026-10-04T23:00:00Z' }
  assert.equal(sessionOnDay(midnight, '2026-10-05'), false)
  assert.equal(sessionOccurrences([midnight], '2026-10-05', '2026-10-11').length, 0)
  assert.equal(assessmentDay({ end_at: '2026-10-04T23:30:00Z', data: { type: 'coursework' } }), '2026-10-05')
  assert.equal(assessmentDay({ start_date: '2026-10-05', end_date: '2026-10-06', data: { type: 'exam' } }), '2026-10-05')
})

test('optional preferences from an import cannot turn the workspace controls into invalid strings', () => {
  const value = studyPreferences({ lanes: 'legacy', priorities: null, slots: ['Morning', 'Evening'], custom: 'preserved' })
  assert.deepEqual(value.lanes, DEFAULT_LANES)
  assert.deepEqual(value.slots, ['Morning', 'Evening'])
  assert.equal(value.custom, 'preserved')
})

test('London form times reject DST uncertainty rather than guess an instant', () => {
  assert.equal(utcFromInput('2026-10-05T10:00'), '2026-10-05T09:00:00.000Z')
  assert.throws(() => utcFromInput('2026-10-25T01:30'), /ambiguous/)
  assert.throws(() => utcFromInput('2026-03-29T01:30'), /ambiguous/)
  assert.equal(weekStart('2026-10-11'), '2026-10-05')
})

test('safe material links accept preserved files and known video hosts while rejecting active URLs', () => {
  assert.equal(safeMaterialUrl('/study-files/a.pdf'), '/study-files/a.pdf')
  assert.equal(safeMaterialUrl('javascript:alert(1)'), '')
  assert.equal(safeMaterialUrl('//example.com/file'), '')
  assert.equal(safeMaterialUrl('/\\example.com/file'), '')
  assert.equal(youtubeEmbed('https://example.com/watch?v=abcdef123'), '')
  assert.equal(youtubeEmbed('https://www.youtube.com/watch?v=abcdef123'), 'https://www.youtube-nocookie.com/embed/abcdef123')
})

test('workspace errors or missing tables do not manufacture study records', () => {
  assert.deepEqual(normaliseWorkspace({}).cards, [])
  assert.deepEqual(normaliseWorkspace({ cards: [card('visible'), card('removed', {}, { deleted_at: '2026-10-05T10:00:00Z' })] }).cards.map(c => c.id), ['visible'])
})
