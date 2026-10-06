import test from 'node:test'
import assert from 'node:assert/strict'
import { mapNativeStudy } from './calendar.mjs'
import { attentionReason } from '../../code/life-os/frontend/src/lib/calendar.js'

const range = ['2026-10-01', '2026-10-31']
test('native cards produce separate starts and deadlines with native source identities', () => {
  const workspace = { cards: [{ id: 'card', title: 'Read', start_date: '2026-10-05', end_date: '2026-10-07', data: { dueTime: '16:00' } }] }
  const before = structuredClone(workspace)
  const items = mapNativeStudy(workspace, ...range)
  assert.equal(items.length, 2)
  assert.equal(items[0].id, 'study:native:cards:card:start')
  assert.equal(items[0].end, null)
  assert.equal(items[1].start, '2026-10-07T15:00:00.000Z')
  assert.equal(items[1].meta.type, 'study-deadline')
  assert.equal(items[1].href, '/study-native?card=card')
  assert.deepEqual(workspace, before)
})

test('native provider excludes completion/results and inactive parent semesters/modules', () => {
  const workspace = { semesters: [{ id: 'old', status: 'archived' }], modules: [{ id: 'off', status: 'inactive' }, { id: 'old-module', semester_id: 'old' }],
    cards: ['done', 'completed', 'archived'].map(status => ({ id: status, status, end_date: '2026-10-05' })),
    sessions: [{ id: 'inactive', module_id: 'off', start_date: '2026-10-05' }, { id: 'old', module_id: 'old-module', start_date: '2026-10-05' }],
    assessments: [{ id: 'result', end_date: '2026-10-05', data: { result: 0 } }, { id: 'done', status: 'completed', end_date: '2026-10-05' }] }
  assert.deepEqual(mapNativeStudy(workspace, ...range), [])
})

test('disabled and completed modules/semesters do not contribute child dates', () => {
  const workspace = {
    semesters: [{ id: 'done-semester', status: 'completed' }, { id: 'flagged-semester', data: { completed: true } }],
    modules: [{ id: 'disabled', data: { enabled: false } }, { id: 'done-module', status: 'done' },
      { id: 'flagged-module', data: { done: true } }, { id: 'finished-semester-module', semester_id: 'done-semester' },
      { id: 'flagged-semester-module', semester_id: 'flagged-semester' }, { id: 'active', status: 'active', data: { enabled: true } }],
    cards: ['disabled', 'done-module', 'flagged-module', 'finished-semester-module', 'flagged-semester-module', 'active']
      .map(module_id => ({ id: `card-${module_id}`, module_id, start_date: '2026-10-05', end_date: '2026-10-07' })),
    sessions: [{ id: 'direct-semester', semester_id: 'done-semester', start_date: '2026-10-06' }],
    assessments: [{ id: 'direct-flagged-semester', semester_id: 'flagged-semester', end_date: '2026-10-06' }]
  }
  assert.deepEqual(mapNativeStudy(workspace, ...range).map(item => item.meta.cardId), ['card-active', 'card-active'])
})

test('assessments are deadline/exam dates, sessions preserve timed midnight and civil spans', () => {
  const workspace = { assessments: [{ id: 'exam', end_date: '2026-10-10', data: { kind: 'exam' } }, { id: 'essay', end_at: '2026-10-11T15:00:00Z' }],
    sessions: [{ id: 'span', start_date: '2026-09-30', end_date: '2026-10-02' }, { id: 'ends', start_at: '2026-09-30T20:00:00Z', end_at: '2026-09-30T23:00:00Z' }] }
  const items = mapNativeStudy(workspace, ...range)
  assert.deepEqual(items.map(item => item.meta.recordId), ['span', 'exam', 'essay'])
  assert.equal(items[1].kind, 'fixed')
  assert.equal(items[2].kind, 'deadline')
  assert.equal(items[0].all_day, true)
})

test('ambiguous due clocks preserve the known date with a verification note', () => {
  const [item] = mapNativeStudy({ cards: [{ id: 'clock', end_date: '2026-10-25', data: { dueTime: '01:30' } }] }, ...range)
  assert.equal(item.start, '2026-10-25')
  assert.equal(item.meta.needsVerification, true)
})

test('date watches and explicit reminders do not become overdue study deadlines', () => {
  const cards = [{ id: 'watch', end_date: '2026-10-05', data: { tags: ['date-watch'] } },
    { id: 'reminder', end_date: '2026-10-05', data: { kind: 'reminder' } },
    { id: 'deadline', end_date: '2026-10-05' }]
  const items = mapNativeStudy({ cards }, ...range)
  assert.deepEqual(items.map(item => [item.meta.cardId, item.kind, attentionReason(item, '2026-10-10')]),
    [['deadline', 'deadline', 'Overdue'], ['reminder', 'reminder', ''], ['watch', 'reminder', '']])
})

test('personal planned sessions remain plans while fixed classes retain their kind', () => {
  const categories = ['study', 'project', 'routine', 'reading', 'exercise', 'class', 'lecture', 'exam', 'unknown']
  const sessions = categories.map(category => ({ id: category, start_date: '2026-10-05', data: { category } }))
  const items = mapNativeStudy({ sessions }, ...range)
  assert.equal(items.filter(item => item.kind === 'plan').length, 5)
  assert.equal(items.filter(item => item.kind === 'fixed').length, 4)
})

test('exams show their start and full interval while coursework uses its due instant', () => {
  const interval = { start_at: '2026-10-05T08:00:00Z', end_at: '2026-10-05T11:00:00Z' }
  const items = mapNativeStudy({ assessments: [{ id: 'exam', ...interval, data: { kind: 'exam' } },
    { id: 'coursework', ...interval, data: { kind: 'coursework' } }] }, ...range)
  const exam = items.find(item => item.meta.recordId === 'exam')
  const coursework = items.find(item => item.meta.recordId === 'coursework')
  assert.equal(exam.start, '2026-10-05T08:00:00.000Z')
  assert.equal(exam.end, '2026-10-05T11:00:00.000Z')
  assert.equal(exam.kind, 'fixed')
  assert.equal(coursework.start, '2026-10-05T11:00:00.000Z')
  assert.equal(coursework.end, null)
  assert.equal(coursework.kind, 'deadline')
})
