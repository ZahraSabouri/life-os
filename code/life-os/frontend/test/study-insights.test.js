import test from 'node:test'
import assert from 'node:assert/strict'
import { moduleEffort, recordedCompletionDay, studyDaySummary, studyExecution, studyFocusPicks, studyTrends, studyWorkFacts, studyWorkStreak } from '../src/lib/studyInsights.js'

const card = (id, patch = {}) => ({ id, title: id, status: 'planned', data: {}, ...patch })

test('completion dating requires recorded evidence, follows London midnight and ignores reopened work', () => {
  assert.equal(recordedCompletionDay(card('unknown', { status: 'done', end_date: '2026-10-05', updated_at: '2026-10-06T10:00:00Z' })), '')
  assert.equal(recordedCompletionDay(card('dated', { status: 'done', data: { completedAt: '2026-10-05T23:30:00Z' } })), '2026-10-06')
  const data = { activity: [{ action: 'Marked done', at: '2026-10-05T09:00:00Z' }, { action: 'Moved card', details: 'Done', at: '2026-10-07T10:00:00Z' }] }
  assert.equal(recordedCompletionDay(card('again', { status: 'done', data })), '2026-10-07')
  assert.equal(recordedCompletionDay(card('reopened', { data })), '')
})

test('daily facts preserve credited hours, source deltas and corrections without duplicating logs', () => {
  const cards = [card('work', { status: 'done', data: { sourceId: 'source-work', actualHours: 4, completedAt: '2026-10-06T10:00:00Z',
    focusSessions: [{ id: 'old', at: '2026-10-06T09:00:00Z', minutes: 40, hours: 0.75 }, { id: 'new', at: '2026-10-06T12:00:00Z', minutes: 25 }],
    hoursLog: [{ id: 'manual', at: '2026-10-06T13:00:00Z', hours: 2.25 }, { id: 'correction', at: '2026-10-06T14:00:00Z', hours: -0.5 }] } }),
  card('unknown', { status: 'done' })]
  const progress = [{ id: 'old-log', card_id: 'work', data: { eventType: 'hours.logged', occurredAt: '2026-10-06T08:00:00Z', payload: { deltaHours: 1 } } },
    { id: 'duplicate', card_id: 'work', data: { id: 'manual', type: 'hours.logged', at: '2026-10-06T13:00:00Z', delta: 2.25 } },
    { id: 'snapshot', data: { type: 'snapshot', loggedHours: 100, done: 20 } },
    { id: 'outside-scope', card_id: 'other', data: { type: 'hours.logged', at: '2026-10-06', delta: 100 } }]
  const day = studyDaySummary(cards, progress, '2026-10-06')
  assert.equal(day.loggedHours, 3.9167)
  assert.equal(day.focusMinutes, 65)
  assert.equal(day.focusSessions, 2)
  assert.deepEqual(day.completedCards.map(row => row.id), ['work'])
  assert.equal(day.undatedDone, 1)
  assert.equal(day.undatedHours, 0.0833)
  assert.equal(studyDaySummary(cards, progress, '2026-10-07').loggedHours, 0)
})

test('focus reasons prioritize ready work and never demand disabled, reminder, blocked or future-start work', () => {
  const modules = [{ id: 'off', data: { enabled: false } }, { id: 'finished', status: 'completed' }]
  const cards = [card('normal', { data: { priority: 'Normal' } }), card('due', { end_date: '2026-10-06', data: { priority: 'Important' } }),
    card('waiting', { status: 'blocked', end_date: '2026-10-01' }), card('future', { start_date: '2026-10-07' }),
    card('watch', { end_date: '2026-10-01', data: { tags: ['date-watch'] } }), card('disabled', { module_id: 'off', end_date: '2026-10-01' }),
    card('parent-done', { module_id: 'finished', end_date: '2026-10-01' })]
  const result = studyFocusPicks(cards, '2026-10-06', { priorities: ['Important', 'Normal'], modules, parents: { modules } })
  assert.deepEqual(result.picks.map(row => row.card.id), ['due', 'normal'])
  assert.ok(result.picks[0].reasons.includes('Due today.'))
  assert.ok(result.picks[0].reasons.includes('Your highest priority: Important.'))
})

test('effort shares use context cards and only user-configured targets influence picks', () => {
  const modules = [{ id: 'a', title: 'Topic A', data: { effortTargetPercent: 50, targetHours: 12 } }, { id: 'b', title: 'Topic B', data: { effortTargetPercent: 50 } }]
  const cards = [card('A task', { module_id: 'a' }), card('B task', { module_id: 'b' })]
  const contextCards = [...cards, card('A logged', { module_id: 'a', status: 'done', data: { actualHours: 9 } }), card('B logged', { module_id: 'b', status: 'done', data: { actualHours: 1 } })]
  const effort = moduleEffort(contextCards, modules)
  assert.equal(effort.rows[0].actualPercent, 90)
  assert.equal(effort.rows[0].remainingHours, 3)
  assert.equal(effort.rows[1].deficit, 40)
  assert.equal(studyFocusPicks(cards, '2026-10-06', { modules, contextCards }).picks[0].card.id, 'B task')
  const noTargets = modules.map(row => ({ ...row, data: {} }))
  assert.equal(studyFocusPicks(cards, '2026-10-06', { modules: noTargets, contextCards }).picks[0].card.id, 'A task')
  assert.equal(moduleEffort(contextCards, noTargets).configured, false)
})

test('zero targets stay distinct from missing targets and impossible allocations are not normalized', () => {
  const empty = moduleEffort([], [{ id: 'zero', data: { effortTargetPercent: 0, targetHours: 0 } }, { id: 'unset', data: {} }])
  assert.equal(empty.rows[0].targetPercent, 0)
  assert.equal(empty.rows[0].remainingHours, 0)
  assert.equal(empty.rows[1].targetPercent, null)
  assert.equal(empty.rows[0].actualPercent, null)
  const modules = [{ id: 'a', data: { effortTargetPercent: 80 } }, { id: 'b', data: { effortTargetPercent: 80 } }]
  const cards = [card('A', { module_id: 'a', data: { actualHours: 9 } }), card('B', { module_id: 'b', data: { actualHours: 1 } })]
  const effort = moduleEffort(cards, modules)
  assert.equal(effort.targetTotal, 160)
  assert.equal(effort.inconsistentTargets, true)
  assert.equal(studyFocusPicks(cards, '2026-10-06', { modules }).picks[0].card.id, 'A')
})

test('execution identifies actual intervals and date-only plans without inferring missing ends', () => {
  const now = Date.parse('2026-10-06T11:00:00Z')
  const sessions = [{ id: 'current', start_at: '2026-10-06T10:00:00Z', end_at: '2026-10-06T12:00:00Z' },
    { id: 'next', start_at: '2026-10-06T13:00:00Z', end_at: '2026-10-06T14:00:00Z' },
    { id: 'unknown-end', start_at: '2026-10-06T09:00:00Z' }, { id: 'all-day', start_date: '2026-10-05', end_date: '2026-10-07' },
    { id: 'cancelled', status: 'cancelled', start_at: '2026-10-06T10:00:00Z', end_at: '2026-10-06T12:00:00Z' },
    { id: 'disabled-parent', module_id: 'off', start_at: '2026-10-06T10:00:00Z', end_at: '2026-10-06T12:00:00Z' }]
  const result = studyExecution(sessions, '2026-10-06', now, { modules: [{ id: 'off', data: { enabled: false } }] })
  assert.deepEqual(result.current.map(row => row.id), ['current'])
  assert.equal(result.next.id, 'next')
  assert.deepEqual(result.dateOnly.map(row => row.id), ['all-day'])
  assert.equal(result.plannedMinutesToday, 180)
})

test('trend grains preserve future unknowns, dated completion plans and hour corrections', () => {
  const cards = [card('done-a', { status: 'done', end_date: '2026-10-05', data: { completedAt: '2026-10-05T10:00:00Z', actualHours: 1, estimatedHours: 2, hoursLog: [{ id: 'log', at: '2026-10-05T10:00:00Z', hours: 1 }] } }),
    card('done-b', { status: 'done', end_date: '2026-10-07', data: { completedAt: '2026-10-06T23:30:00Z', actualHours: 0.5, estimatedHours: 1,
      hoursLog: [{ id: 'more', at: '2026-10-06T10:00:00Z', hours: 1 }, { id: 'less', at: '2026-10-07T10:00:00Z', hours: -0.5 }] } }),
    card('later', { end_date: '2026-10-09', data: { estimatedHours: 3 } }), card('start-only', { start_date: '2026-10-06', data: { estimatedHours: 1 } })]
  const input = { cards, today: '2026-10-07', semester: { start_date: '2026-10-05', end_date: '2026-10-09' } }
  const trend = studyTrends(input)
  assert.equal(trend.series.length, 5)
  assert.deepEqual(trend.series.map(row => row.completed), [1, 1, 2, null, null])
  assert.deepEqual(trend.series.map(row => row.planned), [1, 1, 2, 2, 3])
  assert.deepEqual(trend.series.map(row => row.loggedHours), [1, 1, -0.5, null, null])
  assert.equal(trend.series[1].estimatedHours, 1)
  assert.equal(trend.series[4].finishReference, 4)
  assert.equal(trend.requiredPerDay, 0.6667)
  const weekly = studyTrends({ ...input, grain: 'week' })
  assert.equal(weekly.series.length, 1)
  assert.equal(weekly.series[0].loggedHours, 1.5)
  assert.equal(weekly.series[0].completed, 2)
  assert.equal(weekly.series[0].estimatedHours, 7)
  assert.equal(studyTrends({ ...input, grain: 'month' }).series[0].bucket, '2026-10')
})

test('undated totals and snapshots never create imaginary daily work or finish targets', () => {
  const cards = [card('undated', { status: 'done', end_date: '2026-10-05', data: { actualHours: 12 } })]
  const progress = [{ id: 'snapshot', start_date: '2026-10-06', data: { type: 'snapshot', loggedHours: 12, done: 1 } }]
  const facts = studyWorkFacts(cards, progress)
  assert.equal(facts.days.length, 0)
  assert.equal(facts.undatedHours, 12)
  assert.equal(facts.undatedDone, 1)
  const trend = studyTrends({ cards, progress, today: '2026-10-06' })
  assert.equal(trend.finish, '')
  assert.equal(trend.requiredPerDay, null)
  assert.ok(trend.series.every(row => row.finishReference === null && row.completed === 0 && row.loggedHours === 0))
})

test('actual-work streak accepts preserved manual deltas but not corrections, edits or snapshots', () => {
  const cards = [card('work', { data: { activity: [{ action: 'Edited card', at: '2026-10-06' }] } })]
  const progress = [{ id: 'positive', card_id: 'work', data: { eventType: 'hours.logged', occurredAt: '2026-10-05T10:00:00Z', payload: { deltaHours: 1 } } },
    { id: 'correction', card_id: 'work', data: { eventType: 'hours.logged', occurredAt: '2026-10-06T10:00:00Z', payload: { deltaHours: -1 } } },
    { id: 'snapshot', data: { type: 'snapshot', loggedHours: 2 }, start_date: '2026-10-06' }]
  assert.deepEqual(studyWorkStreak(cards, progress, '2026-10-06'), { current: 1, activeDays: 1, activeToday: false })
})

test('long plans keep history but bound the displayed range with a visible limit flag', () => {
  const input = { cards: [card('old-done', { status: 'done', end_date: '2020-01-02', data: { completedAt: '2020-01-02' } })],
    today: '2026-10-06', semester: { start_date: '2020-01-01' } }
  const trend = studyTrends(input)
  assert.equal(trend.rangeLimited, true)
  assert.equal(trend.series.length, 731)
  assert.equal(trend.series[0].completed, 1)
  assert.equal(trend.tracked.length, 1)
})
