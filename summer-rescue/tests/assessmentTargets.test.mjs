import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentTargets } from '../src/utils/assessmentTargets.js'

test('an official exam confirms its own date and maps the module without changing saved settings', () => {
  const exam = { id: 'official-exam', title: 'Statistics test', status: 'planned', module_id: 'module-row', start_date: '2030-11-06', data: { kind: 'exam' } }
  const original = structuredClone(exam)
  assert.deepEqual(assessmentTargets([exam], [{ id: 'statistics', rowId: 'module-row' }], '2030-10-28'), [{ date: '2030-11-06', label: 'Statistics test', moduleId: 'statistics', assessmentId: 'official-exam', confirmed: true }])
  assert.deepEqual(exam, original)
})

test('past, completed, removed, invalid dates and project deadlines never become the next exam', () => {
  const row = { id: 'exam', status: 'planned', start_date: '2030-11-06', data: { kind: 'test' } }
  assert.deepEqual(assessmentTargets([
    { ...row, start_date: '2030-10-01' }, { ...row, status: 'done' }, { ...row, deleted_at: '2030-10-01' },
    { ...row, start_date: '2030-02-30' }, { ...row, data: { kind: 'project' } },
  ], [], '2030-10-28'), [])
})

test('a timed exam today stays eligible and a missing date stays unconfirmed', () => {
  assert.equal(assessmentTargets([{ id: 'today', start_at: '2030-10-28T14:10:00Z', data: { kind: 'exam' } }], [], '2030-10-28')[0].date, '2030-10-28')
  assert.deepEqual(assessmentTargets([{ id: 'unknown', data: { kind: 'exam' } }]), [])
})

test('once every exam is behind, the countdown points at the next coursework due, never at a past exam', async () => {
  const { resolveExamTarget } = await import('../src/utils/examDates.js')
  const modules = [{ id: 'mat022', rowId: 'm22' }, { id: 'mat021', rowId: 'm21' }, { id: 'cmt309', rowId: 'm309' }]
  const assessments = [
    { id: 't2', title: 'MAT022 · In-class test 2', status: 'done', module_id: 'm22', start_date: '2026-11-06', data: { kind: 'exam' } },
    { id: 'cw1', title: 'MAT021 · Individual Coursework (70%) · coversheet due', status: 'planned', module_id: 'm21', end_at: '2026-12-01T09:30:00.000Z', data: { kind: 'coursework' } },
    { id: 'cw2', title: 'CMT309 · Coursework', status: 'in-progress', module_id: 'm309', end_at: '2026-12-27T23:59:00.000Z', data: { kind: 'portfolio' } },
  ]
  const target = resolveExamTarget({ assessments, modules, referenceDate: '2026-11-15', schedule: { examWindowStart: '2026-11-06' } })
  assert.deepEqual([target.date, target.label, target.assessmentId], ['2026-12-01', 'MAT021 · Individual Coursework (70%) · coversheet due', 'cw1'])
  // With nothing ahead at all there is nothing to count down to.
  const none = resolveExamTarget({ assessments: assessments.slice(0, 1), modules, referenceDate: '2026-11-15', schedule: { examWindowStart: '2026-11-06' } })
  assert.equal(none.date, null)
})
