// The pieces a task is drawn with wherever it appears: the diamond that ticks it, its steps
// (ticked, added, renamed, moved, removed in place), the line that says what it is, and the card.
import { useState } from 'react'
import { STUCK_AFTER_MOVES, laneLabel, notesOf, slotLabel, stepsDone, taskDay, timesMoved, isLate } from '@shared/tasks.js'
import { formatCalendarDay, calendarArea } from '../../lib/calendar.js'
import { addStep, areaName, areaTone, dropStep, moveStep, renameStep, tickStep } from '../../lib/useTasks.js'
import { MoveMenu, StarButton } from './TaskActions.jsx'

// "moved 3×", in red from the third move, when a task has been moved at all.
export function MovedMark({ task }) {
  const moved = timesMoved(task)
  if (!moved) return null
  return <span className={`task-moved${moved >= STUCK_AFTER_MOVES ? ' is-stuck' : ''}`} title={`Moved to another day ${moved} ${moved === 1 ? 'time' : 'times'}`}>moved {moved}×</span>
}

// Under an hour in minutes ("15 min"), otherwise in hours ("1.5 h").
export const hoursText = (value) => {
  const hours = Number(value)
  if (!hours || !Number.isFinite(hours)) return ''
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${Number.isInteger(hours) ? hours : (Math.round(hours * 10) / 10).toString()} h`
}
export const toneOf = (slug) => calendarArea(areaTone(slug)).tone

// The diamond: open, or filled when done.
export function TaskTick({ done, onToggle, busy, label, size = 'normal' }) {
  if (!onToggle) return <span className={`task-tick${done ? ' is-done' : ''}${size === 'small' ? ' is-small' : ''}`} aria-hidden="true" />
  return <button type="button" className={`task-tick${done ? ' is-done' : ''}${size === 'small' ? ' is-small' : ''}`} role="checkbox" aria-checked={Boolean(done)}
    aria-label={label} title={label} disabled={busy} onClick={onToggle} />
}

// One line of what a task is: its area, lane, day or due day, slot, hours and steps.
export function TaskMeta({ task, today, showLane = false, lane = '' }) {
  const steps = task.details?.steps ?? []
  const day = taskDay(task)
  const late = isLate(task, today)
  const due = task.details?.due
  const notes = notesOf(task).length
  return <p className="task-meta">
    {task.favorite ? <span className="task-starred" title="Starred: first in every list">★</span> : null}
    <span className="task-area" style={{ '--item-accent': toneOf(task.details?.area) }}>{areaName(task.details?.area)}</span>
    {showLane && lane ? <span>{laneLabel(lane)}</span> : null}
    {day ? <span className={late ? 'task-late' : undefined}>{late ? 'late · ' : ''}{day === today ? 'today' : formatCalendarDay(day, { weekday: 'short' })}</span> : null}
    {due && due !== day ? <span className={due < today && task.status !== 'done' ? 'task-late' : undefined}>due {due === today ? 'today' : formatCalendarDay(due, { weekday: 'short' })}</span> : null}
    {task.details?.slot && task.details.slot !== 'any' ? <span>{slotLabel(task.details.slot).toLowerCase()}</span> : null}
    {task.details?.estimate ? <span>{hoursText(task.details.estimate)}</span> : null}
    {task.details?.priority === 'high' ? <span className="task-high">high</span> : null}
    {steps.length ? <span>{stepsDone(steps)} of {steps.length} steps</span> : null}
    {notes ? <span>{notes} {notes === 1 ? 'note' : 'notes'}</span> : null}
    <MovedMark task={task} />
  </p>
}

// A task's steps. `editable` adds the controls to add, rename, move and remove; a tick always saves.
export function TaskSteps({ task, editable = false, limit = 0, busy = false, onError, onMore }) {
  const steps = task.details?.steps ?? []
  const [adding, setAdding] = useState('')
  const [renaming, setRenaming] = useState({ id: '', text: '' })
  const [saving, setSaving] = useState(false)
  const shown = limit && !editable ? steps.slice(0, limit) : steps
  async function run(action) {
    if (saving) return
    setSaving(true)
    try { await action() } catch (failure) { onError?.(failure.message) } finally { setSaving(false) }
  }
  const off = busy || saving
  if (!steps.length && !editable) return null
  return <div className="task-steps-wrap">
    {shown.length ? <ol className="task-steps">
      {shown.map((step, index) => <li key={step.id} className={step.done ? 'is-done' : undefined}>
        <TaskTick done={step.done} size="small" busy={off} label={`${step.done ? 'Untick' : 'Tick'}: ${step.text}`} onToggle={() => run(() => tickStep(task, step.id, !step.done))} />
        {editable && renaming.id === step.id
          ? <form className="task-step-rename" onSubmit={(event) => { event.preventDefault(); const text = renaming.text.trim(); setRenaming({ id: '', text: '' }); if (text && text !== step.text) run(() => renameStep(task, step.id, text)) }}>
            <input autoFocus value={renaming.text} maxLength={300} onChange={(event) => setRenaming({ id: step.id, text: event.target.value })} aria-label="The step's words" onKeyDown={(event) => { if (event.key === 'Escape') setRenaming({ id: '', text: '' }) }} />
            <button type="submit">Keep</button>
          </form>
          : <span className="task-step-text">{step.text}</span>}
        {editable && renaming.id !== step.id ? <span className="task-step-tools">
          <button type="button" onClick={() => setRenaming({ id: step.id, text: step.text })} disabled={off} aria-label={`Change the words of: ${step.text}`} title="Change the words">Edit</button>
          <button type="button" onClick={() => run(() => moveStep(task, step.id, -1))} disabled={off || index === 0} aria-label={`Move up: ${step.text}`} title="Move up">↑</button>
          <button type="button" onClick={() => run(() => moveStep(task, step.id, 1))} disabled={off || index === steps.length - 1} aria-label={`Move down: ${step.text}`} title="Move down">↓</button>
          <button type="button" onClick={() => run(() => dropStep(task, step.id))} disabled={off} aria-label={`Remove the step: ${step.text}`} title="Remove the step">✕</button>
        </span> : null}
      </li>)}
    </ol> : null}
    {limit && !editable && steps.length > limit ? <p className="task-more">{onMore ? <button type="button" onClick={onMore}>and {steps.length - limit} more steps</button> : `and ${steps.length - limit} more steps`}</p> : null}
    {editable ? <form className="task-step-add" onSubmit={(event) => { event.preventDefault(); const text = adding.trim(); if (!text) return; setAdding(''); run(() => addStep(task, text)) }}>
      <span className="task-tick is-small is-ghost" aria-hidden="true" />
      <input value={adding} onChange={(event) => setAdding(event.target.value)} placeholder="Add a step and press Enter" maxLength={300} aria-label="A new step" disabled={off} />
    </form> : null}
  </div>
}

// A card for a task of any kind. `item` is { key, kind: 'own' | 'study' | 'mail', title, done, task?, … }
// as the Tasks page and the day gather them (lib/taskItems.js). With `onMove` (and `onStar` for her
// own tasks) an open card carries the star and the move menu.
export function TaskCard({ item, today, onOpen, onToggle, onMove, onStar, onDismiss, busy, compact = false, draggable = false, onDragStart }) {
  const own = item.kind === 'own'
  const starred = own && Boolean(item.task.favorite)
  const tools = !item.done && (onMove || onDismiss || (own && onStar))
  return <article className={`task-card${item.done ? ' is-done' : ''}${item.late ? ' is-late' : ''}${starred ? ' is-starred' : ''}${own ? ' is-own' : ` is-${item.kind}`}`} style={{ '--item-accent': item.tone }}
    draggable={draggable} onDragStart={onDragStart}>
    <TaskTick done={item.done} busy={busy} label={`${item.done ? 'Not done after all' : 'Done'}: ${item.title}`} onToggle={onToggle} />
    <div className="task-card-body">
      <button type="button" className="task-card-title" onClick={onOpen}>{item.title}</button>
      {own ? <TaskMeta task={item.task} today={today} /> : <p className="task-meta"><span className="task-area" style={{ '--item-accent': item.tone }}>{item.source}</span>{item.when ? <span className={item.late ? 'task-late' : undefined}>{item.when}</span> : null}{item.extra ? <span>{item.extra}</span> : null}</p>}
      {!compact && own && item.task.details?.proof && !item.done ? <p className="task-proof"><span>Done when</span> {item.task.details.proof}</p> : null}
      {item.progress ? <span className="task-progress" role="img" aria-label={`${item.progress.done} of ${item.progress.total} steps done`}><i style={{ width: `${Math.round((item.progress.done / item.progress.total) * 100)}%` }} /></span> : null}
      {tools ? <div className="task-tools">
        {own && onStar ? <StarButton on={starred} title={item.title} busy={busy} onToggle={onStar} /> : null}
        {onMove ? <MoveMenu title={item.title} day={item.day} today={today} waiting={item.kind === 'mail'} busy={busy} onMove={onMove} /> : null}
        {onDismiss ? <button type="button" className="task-move-button" disabled={busy} onClick={onDismiss} aria-label={`Dismiss: ${item.title}`} title="Not needed any more: it leaves the list and is kept">Dismiss</button> : null}
      </div> : null}
    </div>
  </article>
}
