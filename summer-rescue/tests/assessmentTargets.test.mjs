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
