// Run: node scripts/test-tasks-render.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { TaskCard, TaskMeta, TaskSteps } from '../src/components/tasks/TaskParts.jsx'
import TodayTasks, { folioLine, sumText } from '../src/components/tasks/TodayTasks.jsx'
import { gatherItems, ownItem } from '../src/lib/taskItems.js'
import { MoveMenu, StarButton, dayOfChoice, moveChoices, movedWords } from '../src/components/tasks/TaskActions.jsx'
import { TaskDialog, minutesText } from '../src/components/tasks/TaskEditor.jsx'

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
  assert.equal(sumText(0, 0.25), '0 of 15 min')
  assert.equal(sumText(1.5, 6), '1.5 of 6 h')
  const page = { tasks: { tasks: [task, { ...task, id: 't2', title: 'Gym A', status: 'done', details: { area: 'body', estimate: 1 } }], loading: false, error: '', reload() {} },
    date: today, today, isToday: true, data: null, savingId: '', tickStudy() {} }
  const markup = renderToStaticMarkup(<MemoryRouter><TodayTasks page={page} /></MemoryRouter>)
  for (const words of ['Today’s tasks', 'One done, one to go.', 'MAT021 coursework: read the brief', 'Find the brief on Learning Central', 'Done when', 'brief saved and questions listed', '1 of 2.5 h','Add a task for today', 'All tasks']) assert.ok(markup.includes(words), words)
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

// Stage 8 CP1: moving, starring and noting a task.
const at = '2026-11-16T20:00:00.000Z'
const moves = [
  { at: '2026-11-14T20:00:00.000Z', from: '2026-11-14', to: '2026-11-15', why: 'time' },
  { at: '2026-11-15T20:00:00.000Z', from: '2026-11-15', to: today },
  { at, from: '2026-11-16', to: today, why: 'blocked' },
]
const worked = { ...task, favorite: true, details: { ...task.details, moves, log: [{ id: 'n1', at, kind: 'note', text: 'Read the first page', minutes: 20 }, { id: 'n2', at: '2026-11-16T21:00:00.000Z', kind: 'done', text: 'Clear in the end', minutes: 70 }] } }

test('a card carries its star and the move menu, and says how often it was moved', () => {
  const markup = renderToStaticMarkup(<TaskCard item={ownItem(worked, today)} today={today} onOpen={() => {}} onToggle={() => {}} onMove={() => {}} onStar={() => {}} />)
  for (const words of ['is-starred', 'Take the star off', 'Move', 'moved 3×', 'is-stuck', '2 notes']) assert.ok(markup.includes(words), words)
  // A card without the handlers stays as it was, and a done card offers no move.
  assert.ok(!renderToStaticMarkup(<TaskCard item={ownItem(task, today)} today={today} />).includes('task-tools'))
  assert.ok(!renderToStaticMarkup(<TaskCard item={ownItem({ ...worked, status: 'done' }, today)} today={today} onMove={() => {}} onStar={() => {}} />).includes('task-tools'))
})

test('the move menu offers what fits: later today only for today, someday only for her own tasks', () => {
  const ids = (options) => moveChoices(options).map(([id]) => id)
  assert.deepEqual(ids({ day: today, today }), ['later', 'tomorrow', 'week', 'someday'])
  assert.deepEqual(ids({ day: '2026-11-20', today }), ['tomorrow', 'week', 'someday'])
  assert.deepEqual(ids({ day: today, today, waiting: true }), ['tomorrow', 'week'])
  assert.equal(dayOfChoice('week', today), '2026-11-23')
  assert.equal(movedWords('tomorrow', today), 'Moved to tomorrow')
  assert.equal(movedWords('someday', today), 'Moved to someday')
  assert.equal(minutesText(45), '45 min')
  assert.equal(minutesText(90), '1 h 30 min')
  const closed = renderToStaticMarkup(<MoveMenu title="Read the brief" day={today} today={today} onMove={() => {}} />)
  assert.match(closed, /aria-expanded="false"/)
  assert.ok(!closed.includes('Why, if you like'), 'the menu is closed until asked for')
  const star = renderToStaticMarkup(<StarButton on={false} title="Read the brief" onToggle={() => {}} />)
  assert.match(star, /aria-pressed="false"/)
})

test('an opened task keeps its notes and moves as a timeline, and asks how it went', () => {
  const markup = renderToStaticMarkup(<TaskDialog task={worked} today={today} askHow onClose={() => {}} />)
  for (const words of ['Done. How did it go?', 'Minutes it took', 'How it went', 'Clear in the end', '1 h 10 min', 'Read the first page', '1 h 30 min noted',
    'Moved', 'No time', 'Blocked', 'Moved 3 times', 'About this task', 'Take the star off', 'Move']) assert.ok(markup.includes(words), words)
  assert.ok(markup.indexOf('Clear in the end') < markup.indexOf('Read the first page'), 'newest first')
  assert.ok(!/Claude|Codex|agent/i.test(markup))
  const plain = renderToStaticMarkup(<TaskDialog task={task} today={today} onClose={() => {}} />)
  for (const words of ['Nothing noted yet.', 'Keep the note']) assert.ok(plain.includes(words), words)
  assert.ok(!plain.includes('How did it go?'))
})
