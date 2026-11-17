import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateDetails } from '../../shared/entryTypes.js'
import { cleanLog, cleanMoves, cleanSteps, compareTasks, hoursOf, isLate, laneOf, minutesNoted, moveTask, nextMonday, slippedCount, stepsFromLines, taskDay, tasksForDay, timesMoved } from '../../shared/tasks.js'

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

  it('puts starred tasks first among the open ones', () => {
    const list = [task({ id: 'plain', start_at: '2026-11-12' }), task({ id: 'star', start_at: '2026-11-20', favorite: true }), task({ id: 'done-star', status: 'done', favorite: true })].sort(compareTasks)
    assert.deepEqual(list.map((t) => t.id), ['star', 'plain', 'done-star'])
  })
})

describe('moving a task', () => {
  const now = new Date('2026-11-16T10:00:00.000Z') // a Monday, 10:00 in London

  it('lands each choice on its day and records the move', () => {
    const own = task({ start_at: today }, { lane: 'today' })
    const tomorrow = moveTask(own, { choice: 'tomorrow', today, now, why: 'time' })
    assert.equal(tomorrow.start_at, '2026-11-17')
    assert.equal(tomorrow.all_day, true)
    assert.equal(tomorrow.details.lane, undefined, 'a lane the day decided is let go')
    assert.deepEqual(tomorrow.details.moves, [{ at: now.toISOString(), from: today, to: '2026-11-17', why: 'time' }])
    assert.equal(moveTask(own, { choice: 'week', today, now }).start_at, '2026-11-23')
    assert.equal(nextMonday('2026-11-22'), '2026-11-23', 'from a Sunday, next week starts tomorrow')
    assert.equal(moveTask(own, { choice: 'day', day: '2026-12-02', today, now }).start_at, '2026-12-02')
    const someday = moveTask(own, { choice: 'someday', today, now })
    assert.equal(someday.start_at, null)
    assert.equal(someday.details.lane, 'backlog')
    assert.equal(someday.details.moves[0].to, '')
  })

  it('keeps a lane chosen for the kind of work, and a reason only when it is one of the known ones', () => {
    const moved = moveTask(task({ start_at: today }, { lane: 'deep' }), { choice: 'tomorrow', today, now, why: 'whatever' })
    assert.equal(moved.details.lane, 'deep')
    assert.equal('why' in moved.details.moves[0], false)
  })

  it('puts "later today" in a later part of the day', () => {
    const later = moveTask(task({ start_at: today }, { slot: 'am' }), { choice: 'later', today, now })
    assert.equal(later.start_at, today)
    assert.equal(later.details.slot, 'pm')
    assert.equal(moveTask(task({ start_at: today }), { choice: 'later', today, now: new Date('2026-11-16T15:00:00.000Z') }).details.slot, 'eve')
  })

  it('keeps the London clock time of a timed task across the clock change', () => {
    // 18:00–19:30 in London on Saturday 24 October (UTC+1); moved to Monday 26 October (UTC).
    const timed = task({ start_at: '2026-10-24T17:00:00.000Z', end_at: '2026-10-24T18:30:00.000Z', all_day: false })
    const moved = moveTask(timed, { choice: 'day', day: '2026-10-26', today: '2026-10-24', now })
    assert.equal(moved.start_at, '2026-10-26T18:00:00.000Z')
    assert.equal(moved.end_at, '2026-10-26T19:30:00.000Z')
    assert.equal(moved.all_day, false)
  })

  it('refuses a move with no place to go', () => {
    assert.throws(() => moveTask(task(), { choice: 'day', day: 'Friday', today, now }), /Choose a day/)
    assert.throws(() => moveTask(task(), { choice: 'away', today, now }), /Choose where/)
  })

  it('counts moves, keeps only the latest hundred, and checks what is saved', () => {
    const many = Array.from({ length: 105 }, (_, i) => ({ at: now.toISOString(), from: '', to: today }))
    assert.equal(cleanMoves(many).length, 100)
    assert.equal(timesMoved(task({}, { moves: many.slice(0, 3) })), 3)
    assert.equal(validateDetails('task', { moves: [{ at: 'yesterday', from: '', to: today }] }).ok, false)
    assert.equal(validateDetails('task', { moves: [{ at: now.toISOString(), from: today, to: 'Friday' }] }).ok, false)
  })
})

describe('notes on a task', () => {
  it('keeps dated notes and "how it went" with minutes, and drops empty ones', () => {
    const at = '2026-11-16T21:00:00.000Z'
    const result = validateDetails('task', { log: [{ at, text: '  Read half the brief ' }, { at, kind: 'done', text: 'Went well', minutes: '45' }, { at, text: '  ' }] })
    assert.equal(result.ok, true, result.errors.join('; '))
    assert.equal(result.value.log.length, 2)
    assert.equal(result.value.log[0].text, 'Read half the brief')
    assert.equal(result.value.log[0].kind, 'note')
    assert.deepEqual([result.value.log[1].kind, result.value.log[1].minutes], ['done', 45])
    assert.equal(minutesNoted({ details: result.value }), 45)
  })

  it('refuses notes it cannot keep', () => {
    assert.deepEqual(validateDetails('task', { log: 'a note' }).errors, ['log: log must be a list'])
    assert.equal(validateDetails('task', { log: [{ at: 'now', text: 'x' }] }).ok, false)
    assert.equal(validateDetails('task', { log: [{ at: '2026-11-16T21:00:00.000Z', text: 'x', minutes: 5000 }] }).ok, false)
    assert.notEqual(...cleanLog([{ id: 'a', at: '2026-11-16T21:00:00.000Z', text: 'one' }, { id: 'a', at: '2026-11-16T21:00:00.000Z', text: 'two' }]).map((note) => note.id))
  })
})
