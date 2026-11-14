import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateDetails } from '../../shared/entryTypes.js'
import { cleanSteps, compareTasks, hoursOf, isLate, laneOf, slippedCount, stepsFromLines, taskDay, tasksForDay } from '../../shared/tasks.js'

const today = '2026-11-16'
const task = (fields = {}, details = {}) => ({ id: fields.id ?? 't', type: 'task', status: 'planned', title: 'x', start_at: null, all_day: true, ...fields, details: { priority: 'med', ...details } })

describe('task details', () => {
  it('keeps lane, slot, estimate, due, proof and steps on a task', () => {
    const result = validateDetails('task', {
      lane: 'deep', slot: 'am', estimate: 2.5, due: '2026-12-01', proof: 'submitted, receipt saved',
      steps: [{ id: 'a', text: '  Read the brief ', done: true }, { text: 'Draft' }, { text: '   ' }],
    })
    assert.equal(result.ok, true, result.errors.join('; '))
    assert.equal(result.value.lane, 'deep')
    assert.equal(result.value.due, '2026-12-01')
    assert.equal(result.value.steps.length, 2)
    assert.deepEqual(result.value.steps[0], { id: 'a', text: 'Read the brief', done: true })
    assert.equal(result.value.steps[1].done, false)
    assert.match(result.value.steps[1].id, /^s/)
  })

  it('refuses a lane, a due day or steps that cannot be', () => {
    assert.equal(validateDetails('task', { lane: 'someday' }).ok, false)
    assert.deepEqual(validateDetails('task', { due: 'Tuesday' }).errors, ['due: due must be a day (YYYY-MM-DD)'])
    assert.deepEqual(validateDetails('task', { steps: 'read it' }).errors, ['steps: steps must be a list'])
  })

  it('lets any kind of entry carry steps', () => {
    const result = validateDetails('time-block', { area: 'career', steps: ['Open the repo', 'Log the hours'] })
    assert.equal(result.ok, true)
    assert.deepEqual(result.value.steps.map((step) => step.text), ['Open the repo', 'Log the hours'])
  })

  it('gives repeated step ids new ones', () => {
    const steps = cleanSteps([{ id: 'a', text: 'one' }, { id: 'a', text: 'two' }])
    assert.notEqual(steps[0].id, steps[1].id)
  })

  it('reads steps from lines', () => {
    assert.deepEqual(stepsFromLines('- Read the brief\n[ ] Draft\n\n2. Check').map((step) => step.text), ['Read the brief', 'Draft', 'Check'])
  })
})

describe('task lanes and days', () => {
  it('places a task by its own lane, else by its day', () => {
    assert.equal(laneOf(task({}, { lane: 'waiting' }), today), 'waiting')
    assert.equal(laneOf(task({ start_at: '2026-11-16' }), today), 'today')
    assert.equal(laneOf(task({ start_at: '2026-11-14' }), today), 'today')
    // More than two days late: it has slipped, and waits in Rescue.
    assert.equal(laneOf(task({ start_at: '2026-11-12' }), today), 'rescue')
    assert.equal(laneOf(task({ start_at: '2026-11-21' }), today), 'week')
    assert.equal(laneOf(task({ start_at: '2026-11-30' }), today), 'backlog')
    assert.equal(laneOf(task(), today), 'backlog')
    assert.equal(laneOf(task({ status: 'done' }, { lane: 'today' }), today), 'done')
  })

  it('reads the London day of a timed task', () => {
    // 00:30 in London on 1 July is 23:30 UTC the day before.
    assert.equal(taskDay(task({ start_at: '2026-06-30T23:30:00.000Z', all_day: false })), '2026-07-01')
    assert.equal(taskDay(task({ start_at: '2026-11-20' })), '2026-11-20')
  })

  it('gathers a day: its own tasks; on today also those just late and undated Today ones, not slipped ones', () => {
    const tasks = [
      task({ id: 'own', start_at: today }), task({ id: 'late', start_at: '2026-11-10' }), task({ id: 'lane' }, { lane: 'today' }),
      task({ id: 'later', start_at: '2026-11-18' }), task({ id: 'off', start_at: today, status: 'cancelled' }),
      task({ id: 'done-late', start_at: '2026-11-10', status: 'done' }), task({ id: 'yesterday', start_at: '2026-11-15' }),
    ]
    assert.deepEqual(tasksForDay(tasks, today, today).map((t) => t.id).sort(), ['lane', 'own', 'yesterday'])
    assert.equal(slippedCount(tasks, today), 1)
    assert.deepEqual(tasksForDay(tasks, '2026-11-18', today).map((t) => t.id), ['later'])
    assert.equal(isLate(tasks[1], today), true)
    assert.equal(isLate(tasks[5], today), false)
  })

  it('orders open before done, then by day, slot and priority', () => {
    const list = [
      task({ id: 'done', start_at: '2026-11-10', status: 'done' }),
      task({ id: 'eve', start_at: today }, { slot: 'eve' }),
      task({ id: 'am-low', start_at: today }, { slot: 'am', priority: 'low' }),
      task({ id: 'am-high', start_at: today }, { slot: 'am', priority: 'high' }),
      task({ id: 'late', start_at: '2026-11-12' }),
    ].sort(compareTasks)
    assert.deepEqual(list.map((t) => t.id), ['late', 'am-high', 'am-low', 'eve', 'done'])
  })

  it('adds up estimated hours', () => {
    assert.deepEqual(hoursOf([task({}, { estimate: 2 }), task({ status: 'done' }, { estimate: 1.5 }), task()]), { planned: 3.5, done: 1.5 })
  })
})
