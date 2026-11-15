// Run: node scripts/test-tasks-render.mjs test/day-render.test.jsx
// The day's checklist, how Study hub cards show in it, and the week and month pictures.
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import DayChecklist, { checklistLine } from '../src/components/DayChecklist.jsx'
import { checklistRows, nextLine, nextRow, thingKind } from '../src/lib/checklist.js'
import { groupOf, monthPicture, weekPicture } from '../src/lib/glance.js'

const date = '2026-11-16'
const card = { id: 'c1', hubCardId: 'h1', semesterId: 's1', title: 'CMT309 · Week 1: strings', moduleCode: 'CMT309', done: false, hours: 1.25,
  steps: [{ id: 'a', text: 'Read the strings slides', done: true }, { id: 'b', text: 'Redo the examples from memory', done: false }], doneWhen: 'Examples redone from memory.', href: '/study#/today?card=h1' }
const lone = { id: 'c2', hubCardId: 'h2', semesterId: 's1', title: 'MAT021 · Prepare for the lecture', moduleCode: 'MAT021', done: false, hours: 0.5, steps: [], doneWhen: '', href: '/study' }
const items = [
  { id: 'study:native:sessions:k1', area: 'study', kind: 'fixed', title: 'MAT021 · Lecture (recorded)', start: '2026-11-16T15:10:00.000Z', end: '2026-11-16T17:00:00.000Z', href: '/study#/schedule', location: 'Abacws 2.26', meta: { source: 'native-study', type: 'study-session' } },
  { id: 'core:entry:routine:r1:2026-11-16', area: 'career', kind: 'plan', title: 'Work · ENCAP Student Developer', start: '2026-11-16T13:15:00.000Z', end: '2026-11-16T15:00:00.000Z', href: '/ledger', meta: { source: 'core', type: 'time-block', entryId: 'routine:r1:2026-11-16', routine: { id: 'r1' } } },
  { id: 'core:entry:t1', area: 'core', kind: 'plan', title: 'Ask the module leader', start: '2026-11-16', end: null, all_day: true, href: '/ledger', meta: { source: 'core', type: 'task', entryId: 't1', status: 'planned', room: 'study' } },
  { id: 'career:deadline:j1', area: 'career', kind: 'deadline', title: 'Data Analyst · Hays', start: '2026-11-16', all_day: true, href: '/jobmap#job=j1', meta: { source: 'jobmap', type: 'deadline' } },
]
const path = {
  stops: [
    { key: 'block:s1:o1', type: 'block', start: '10:45', end: '12:00', title: 'CMT309 · Week 1: strings', area: 'study', kind: 'plan', card, href: card.href },
    { key: 'core:entry:routine:r1:2026-11-16', type: 'item', start: '13:15', end: '15:00', title: 'Work · ENCAP Student Developer', area: 'career', kind: 'plan', entry: { id: 'routine:r1:2026-11-16', task: true, routine: { id: 'r1' } }, href: '/ledger' },
    { key: 'study:native:sessions:k1', type: 'item', start: '15:10', end: '17:00', title: 'MAT021 · Lecture (recorded)', area: 'study', kind: 'fixed', place: 'Abacws 2.26', href: '/study#/schedule' },
  ],
  anytime: [{ key: 'core:entry:t1', type: 'item', title: 'Ask the module leader', area: 'core', kind: 'plan', href: '/ledger', entry: { id: 't1', task: true }, room: 'study' }],
  also: [{ key: 'career:deadline:j1', title: 'Data Analyst · Hays', area: 'career', href: '/jobmap#job=j1' }],
}
const tasks = [
  { id: 't1', type: 'task', status: 'planned', title: 'Ask the module leader', start_at: date, all_day: true, details: { area: 'study', steps: [{ id: 'x', text: 'Email both dates', done: false }], proof: 'An answer saved' } },
  { id: 't2', type: 'task', status: 'planned', title: 'Accept the GitHub invitations', start_at: '2026-11-15', all_day: true, details: { area: 'career' } },
]

test('a study block on the calendar is called a study block, not a deadline', () => {
  assert.equal(thingKind({ meta: { type: 'study-block' }, kind: 'deadline' }), 'Study block')
  assert.equal(thingKind(items[0]), 'Class')
  assert.equal(thingKind(items[3]), 'Job closes')
})

test('the checklist has every thing of the day, ticked where it is kept', () => {
  const list = checklistRows({ path, items, tasks, date, today: date, checks: { 'core:entry:routine:r1:2026-11-16': { at: 'x' } }, study: { today: [card, lone] } })
  assert.deepEqual(list.timed.map((row) => [row.time, row.kind, row.how, row.done]), [['10:45', 'Study block', 'check', false], ['13:15', 'Repeating plan', 'own', true], ['15:10', 'Class', 'check', false]])
  // A card due that day that no block covers, the day's own task, and yesterday's task carried over.
  assert.deepEqual(list.anytime.map((row) => [row.title, row.how]), [['MAT021 · Prepare for the lecture', 'card'], ['Ask the module leader', 'own'], ['Accept the GitHub invitations', 'own']])
  assert.equal(list.anytime[2].late, true)
  assert.equal(list.also.length, 1)
  assert.deepEqual([list.done, list.total], [1, 6])
  assert.equal(nextRow(list.timed, '11:00').title, 'CMT309 · Week 1: strings')
  // Under way, it is "Now" until it ends; before it starts, "Next" at its time.
  assert.deepEqual(nextLine(nextRow(list.timed, '11:00'), '11:00'), { label: 'Now', when: 'until 12:00', title: 'CMT309 · Week 1: strings' })
  assert.deepEqual(nextLine(nextRow(list.timed, '09:00'), '09:00'), { label: 'Next', when: '10:45', title: 'CMT309 · Week 1: strings' })
})

test('a study card shows folded: one line with its module, time and steps, opened for its steps and one link', () => {
  const page = { date, today: date, isToday: true, clock: '09:00', fullPath: path, items, tasks: { tasks, loading: false }, data: { study: { today: [card, lone] } },
    loading: false, savingId: '', error: '', change: null, tickStudy() {}, setItemStatus() {} }
  const markup = renderToStaticMarkup(<MemoryRouter><DayChecklist page={page} /></MemoryRouter>)
  for (const words of ['Today’s checklist', '0 of 6 done', 'CMT309 · Week 1: strings', 'Study block', '1 of 2 steps', 'MAT021 · Lecture (recorded)', 'Abacws 2.26', 'Any time', 'Also on this day:', 'Next']) assert.ok(markup.includes(words), words)
  // Folded: the steps and the links wait until the row is opened.
  assert.ok(!markup.includes('Redo the examples from memory'))
  assert.ok(!markup.includes('Open in Study hub'))
  assert.equal((markup.match(/role="checkbox"/g) ?? []).length, 6)
  assert.ok(!/Claude|Codex|agent/i.test(markup))
  assert.equal(checklistLine(6, 6), 'All 6 done.')
})

test('the week picture lays out the week, overlapping things side by side, with hours by module and area', () => {
  const week = weekPicture([
    { id: 'a', title: 'CMT309 · Week 1', area: 'study', start: '2026-11-16T09:00:00.000Z', end: '2026-11-16T10:30:00.000Z', meta: { type: 'study-block' } },
    { id: 'b', title: 'Ben · a question', area: 'relationships', start: '2026-11-16T10:00:00.000Z', end: '2026-11-16T10:15:00.000Z', meta: { source: 'core' } },
    { id: 'c', title: 'MAT021 · Lecture', area: 'study', start: '2026-11-17T13:10:00.000Z', end: '2026-11-17T15:00:00.000Z', meta: { type: 'study-session' } },
    { id: 'd', title: 'Work · ENCAP', area: 'career', start: '2026-11-17T17:00:00.000Z', end: '2026-11-17T19:00:00.000Z', meta: { source: 'core' } },
    { id: 'e', title: 'Data Analyst · Hays', area: 'career', kind: 'deadline', start: '2026-11-16', all_day: true, meta: { source: 'jobmap' } },
  ], '2026-11-16', { '2026-11-16': { a: { at: 'x' } } })
  const monday = week.days[0]
  assert.deepEqual(monday.blocks.map((block) => [block.id, block.lane, block.lanes, block.done]), [['a', 0, 2, true], ['b', 1, 2, false]])
  assert.equal(monday.jobs, 1)
  assert.deepEqual(week.hours.find((entry) => entry.group === 'MAT021 classes'), { group: 'MAT021 classes', hours: 1.8 })
  assert.deepEqual(week.hours.find((entry) => entry.group === 'Work'), { group: 'Work', hours: 2 })
  assert.equal(groupOf({ title: 'Job applications · after September 2027', area: 'career' }), 'Applications')
})

test('the month picture counts each day’s hours and what falls due, but not study blocks or jobs as due', () => {
  const month = monthPicture([
    { id: 'a', title: 'CMT309 · Week 1', area: 'study', kind: 'deadline', start: '2026-11-16T09:00:00.000Z', end: '2026-11-16T10:30:00.000Z', meta: { type: 'study-block' } },
    { id: 'b', title: 'MAT021 · Coursework coversheet', area: 'study', kind: 'deadline', start: '2026-12-01', all_day: true, meta: { type: 'study-deadline' } },
    { id: 'c', title: 'Data Analyst · Hays', area: 'career', kind: 'deadline', start: '2026-11-16', all_day: true, meta: { source: 'jobmap' } },
  ], '2026-11')
  const days = month.weeks.flat()
  assert.equal(days[0].day, '2026-10-26')
  const sixteenth = days.find((day) => day.day === '2026-11-16')
  assert.deepEqual([sixteenth.due, sixteenth.jobs, sixteenth.hours[0]], [[], 1, { group: 'CMT309', hours: 1.5 }])
  assert.deepEqual(days.find((day) => day.day === '2026-12-01').due, ['MAT021 · Coursework coversheet'])
})
