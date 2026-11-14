// Run: node scripts/test-tasks-render.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { TaskCard, TaskMeta, TaskSteps } from '../src/components/tasks/TaskParts.jsx'
import TodayTasks, { folioLine } from '../src/components/tasks/TodayTasks.jsx'
import { gatherItems, ownItem } from '../src/lib/taskItems.js'

const today = '2026-11-16'
const task = {
  id: 't1', type: 'task', status: 'planned', title: 'MAT021 coursework: read the brief', start_at: today, all_day: true, updated_at: '2026-11-14T10:00:00.000Z',
  details: { area: 'study', priority: 'high', slot: 'am', estimate: 1.5, due: '2026-12-01', proof: 'brief saved and questions listed',
    steps: [{ id: 'a', text: 'Find the brief on Learning Central', done: true }, { id: 'b', text: 'List what is asked', done: false }] },
}

test('a task card says what it is: area, day, due day, slot, hours and steps', () => {
  const markup = renderToStaticMarkup(<TaskMeta task={task} today={today} />)
  for (const words of ['Study', 'today', 'due', 'morning', '1.5 h', 'high', '1 of 2 steps']) assert.ok(markup.includes(words), words)
})

test('steps are real ticks, and the editable list offers to add, change, move and remove', () => {
  const plain = renderToStaticMarkup(<TaskSteps task={task} />)
  assert.equal((plain.match(/role="checkbox"/g) ?? []).length, 2)
  assert.match(plain, /aria-checked="true"/)
  const editable = renderToStaticMarkup(<TaskSteps task={task} editable />)
  for (const words of ['Add a step and press Enter', 'Move up', 'Move down', 'Remove the step', 'Change the words']) assert.ok(editable.includes(words), words)
})

test('the day’s cards are read as a sentence and drawn with their steps and what shows they are done', () => {
  assert.equal(folioLine(0, 0), 'Nothing on the list yet.')
  assert.equal(folioLine(2, 3), 'Two done, three to go.')
  assert.equal(folioLine(1, 0), 'One done. Everything is ticked.')
  const page = { tasks: { tasks: [task, { ...task, id: 't2', title: 'Gym A', status: 'done', details: { area: 'body', estimate: 1 } }], loading: false, error: '', reload() {} },
    date: today, today, isToday: true, data: null, savingId: '', tickStudy() {} }
  const markup = renderToStaticMarkup(<MemoryRouter><TodayTasks page={page} /></MemoryRouter>)
  for (const words of ['Today’s tasks', 'One done, one to go.', 'MAT021 coursework: read the brief', 'Find the brief on Learning Central', 'Done when', 'brief saved and questions listed', '1 h of 2.5 h', 'Add a task for today', 'All tasks']) assert.ok(markup.includes(words), words)
  // Nothing in the app speaks to its maker or names an assistant.
  assert.ok(!/Claude|Codex|agent/i.test(markup))
})

test('everything to do is gathered into lanes: her tasks, Study hub cards and what waits on her', () => {
  const day = { study: { today: [{ id: 'c1', title: 'CMT309 · Week 1', done: false, steps: [], due: today, hubCardId: 'h1', semesterId: 's1', href: '/study' }], overdue: { cards: [] }, tomorrow: [], running: [] }, blocks: [] }
  const mail = { actions: [{ id: 'm1', status: 'open', kind: 'do', title: 'Accept the GitHub invitation', due: '2026-11-20' }, { id: 'm2', status: 'done', kind: 'do', title: 'Old' }, { id: 'm3', status: 'snoozed', kind: 'do', title: 'Later' }] }
  const items = gatherItems({ tasks: [task, { ...task, id: 'off', status: 'cancelled' }], today, day, mail })
  assert.deepEqual(items.map((item) => [item.kind, item.lane]), [['own', 'today'], ['study', 'today'], ['mail', 'week'], ['mail', 'waiting']])
  const markup = renderToStaticMarkup(<TaskCard item={ownItem(task, today)} today={today} onOpen={() => {}} onToggle={() => {}} />)
  assert.match(markup, /aria-label="1 of 2 steps done"/)
})
