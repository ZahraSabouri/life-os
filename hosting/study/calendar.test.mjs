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
  assert.equal(items[1].href, '/study')   // a card kept only as a record opens the Study hub; one the hub saved opens on that card
  assert.deepEqual(workspace, before)
})

test('a card that starts and is due on the same day shows once', () => {
  const workspace = { cards: [
    { id: 'one-day', title: 'Mock A', start_date: '2026-10-20', end_date: '2026-10-20' },
    { id: 'week', title: 'Regression', start_date: '2026-10-26', end_date: '2026-10-30' },
  ] }
  const items = mapNativeStudy(workspace, ...range)
  assert.deepEqual(items.map(item => item.id), ['study:native:cards:one-day:deadline', 'study:native:cards:week:start', 'study:native:cards:week:deadline'])
  assert.equal(items[0].title, 'Mock A')
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

test('study blocks go on the calendar at their clock times, and the card is not listed a second time', () => {
  const workspace = {
    semesters: [{ id: 'autumn', status: 'active' }, { id: 'summer', status: 'completed' }],
    cards: [
      { id: 'c-day', title: 'Mock A', semester_id: 'autumn', end_date: '2026-10-20', data: { hubCardId: 'mock-a' } },
      { id: 'c-week', title: 'Regression', semester_id: 'autumn', start_date: '2026-10-26', end_date: '2026-10-30', data: { hubCardId: 'regression' } },
      { id: 'c-loose', title: 'No block', semester_id: 'autumn', end_date: '2026-10-21', data: { hubCardId: 'loose' } },
      { id: 'c-done', title: 'Finished', status: 'done', semester_id: 'autumn', end_date: '2026-10-19', data: { hubCardId: 'finished' } },
    ],
  }
  const plans = [
    { semesterId: 'autumn', plan: { scheduleRules: [
      { id: 'a', title: 'Mock A: 50 minutes', category: 'study', from: '2026-10-20', to: '2026-10-20', weekdays: [2], start: '09:00', end: '10:30', cardId: 'mock-a', location: 'Library' },
      { id: 'b', title: 'Regression', category: 'study', from: '2026-10-26', to: '2026-10-27', weekdays: [1, 2], start: '10:00', end: '11:30', cardId: 'regression' },
      { id: 'c', title: 'Finished work', category: 'study', from: '2026-10-19', to: '2026-10-19', weekdays: [1], start: '10:00', end: '11:00', cardId: 'finished' },
    ] } },
    { semesterId: 'summer', plan: { scheduleRules: [{ id: 'old', title: 'Summer block', category: 'study', from: '2026-10-20', to: '2026-10-20', weekdays: [2], start: '09:00', end: '10:00' }] } },
  ]
  const items = mapNativeStudy(workspace, ...range, plans)
  assert.deepEqual(items.map(item => [item.start, item.kind, item.title]), [
    ['2026-10-20T08:00:00.000Z', 'deadline', 'Mock A: 50 minutes'],   // 09:00 in London (summer time); the card falls due in this block
    ['2026-10-21', 'deadline', 'No block'],                            // a card without blocks keeps its own line
    ['2026-10-26T10:00:00.000Z', 'plan', 'Regression'],                // 10:00 in London after the clocks go back
    ['2026-10-27T10:00:00.000Z', 'plan', 'Regression'],
    ['2026-10-30', 'deadline', 'Regression'],                          // due on a day with no block: still listed
  ])
  const block = items[0]
  assert.equal(block.end, '2026-10-20T09:30:00.000Z')
  assert.equal(block.meta.type, 'study-block')
  assert.equal(block.meta.cardId, 'c-day')
  assert.equal(block.href, '/study#/today?card=mock-a')
  assert.equal(block.location, 'Library')
  assert.equal(attentionReason(block, '2026-10-21'), 'Overdue')
  assert.equal(attentionReason(items[2], '2026-10-28'), '')
})
