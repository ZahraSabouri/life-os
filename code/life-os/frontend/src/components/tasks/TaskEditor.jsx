// A task opened: its steps to tick and change, and every field of it. And the form for a new
// one, laid out like the design's "new leaf": the title first, then chips for area, lane, slot
// and priority, the hours and days, what shows it is done, and its steps one a line.
import { useEffect, useRef, useState } from 'react'
import { LANES, PRIORITIES, SLOTS, STUCK_AFTER_MOVES, minutesNoted, moveReasonLabel, notesOf, stepsFromLines, taskDay, timesMoved } from '@shared/tasks.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import { TASK_AREAS, addTaskNote, createTask, dropTaskNote, postponeTask, putTaskAway, saveTask, setTaskDone, setTaskStar, undoMove } from '../../lib/useTasks.js'
import { TaskSteps, TaskTick, toneOf } from './TaskParts.jsx'
import { MoveMenu, StarButton, movedWords } from './TaskActions.jsx'

// "45 min", "1 h 30 min".
export function minutesText(total) {
  const minutes = Math.round(Number(total) || 0)
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`
}
const whenText = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
const dayText = (day) => (day ? formatCalendarDay(day, { weekday: 'short' }) : 'no day')

// A note to keep: words, and the minutes it took if that is worth saying. `onSave` answers true
// once it is kept, and only then is the box emptied.
function NoteForm({ kind, prompt, placeholder, busy, onSave, onSkip, autoFocus = false }) {
  const [text, setText] = useState('')
  const [minutes, setMinutes] = useState('')
  const empty = !text.trim() && !(Number(minutes) > 0)
  async function keep(event) {
    event.preventDefault()
    if (empty) return
    if (await onSave({ text, minutes: Number(minutes) || 0, kind })) { setText(''); setMinutes('') }
  }
  return <form className={`task-note-form${kind === 'done' ? ' is-how' : ''}`} onSubmit={keep}>
    {prompt ? <p className="task-note-prompt">{prompt}</p> : null}
    <textarea rows={2} value={text} onChange={(event) => setText(event.target.value)} placeholder={placeholder} maxLength={4000} aria-label={prompt ?? 'A note'} autoFocus={autoFocus} />
    <div className="task-note-row">
      <label>Minutes it took<input type="number" min="0" max="1440" step="5" inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label>
      <button type="submit" className="task-primary" disabled={busy || empty}>Keep the note</button>
      {onSkip ? <button type="button" onClick={onSkip}>Not now</button> : null}
    </div>
  </form>
}

// What happened to a task, newest first: its notes ("how it went" among them) and its moves.
function TaskNotes({ task, busy, run, askHow, onAsked }) {
  const notes = notesOf(task).map((note) => ({ ...note, type: 'note' }))
  const moves = (Array.isArray(task.details?.moves) ? task.details.moves : []).map((move, index) => ({ ...move, id: `move-${index}`, type: 'move' }))
  const timeline = [...notes, ...moves].sort((a, b) => b.at.localeCompare(a.at))
  const minutes = minutesNoted(task)
  const save = (note, said) => run(() => addTaskNote(task, note), said)
  return <section className="task-notes" aria-label="Notes">
    <h3>Notes{minutes ? <small> · {minutesText(minutes)} noted</small> : null}</h3>
    {askHow ? <NoteForm kind="done" prompt="Done. How did it go?" placeholder="What went well, what to remember next time" busy={busy} autoFocus
      onSave={async (note) => { const kept = await save(note, 'Kept with the task.'); if (kept) onAsked(); return kept }} onSkip={onAsked} />
      : <NoteForm kind="note" placeholder="Where you got to, what comes next, how it is going" busy={busy} onSave={(note) => save(note, 'Note kept.')} />}
    {timeline.length ? <ol className="task-note-list">
      {timeline.map((entry) => entry.type === 'move'
        ? <li key={entry.id} className="is-move"><p className="task-note-when"><b>Moved</b><span>{whenText(entry.at)}</span><span>{dayText(entry.from)} → {dayText(entry.to)}</span>{entry.why ? <span>{moveReasonLabel(entry.why)}</span> : null}</p></li>
        : <li key={entry.id} className={entry.kind === 'done' ? 'is-how' : undefined}>
          <p className="task-note-when">{entry.kind === 'done' ? <b>How it went</b> : null}<span>{whenText(entry.at)}</span>{entry.minutes ? <span>{minutesText(entry.minutes)}</span> : null}
            <button type="button" className="task-note-drop" disabled={busy} onClick={() => run(() => dropTaskNote(task, entry.id), 'Note removed.')} aria-label={`Remove the note of ${whenText(entry.at)}`}>Remove</button></p>
          {entry.text ? <p className="task-note-text">{entry.text}</p> : null}
        </li>)}
    </ol> : <p className="task-notes-empty">Nothing noted yet.</p>}
  </section>
}

function Modal({ label, onClose, children, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const element = ref.current
    const previous = document.activeElement
    if (element && !element.open) element.showModal()
    return () => { element?.close(); previous?.focus?.() }
  }, [])
  return <dialog ref={ref} className={`task-dialog ${className}`.trim()} aria-label={label} onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === ref.current) onClose() }}>
    <div className="task-sheet">{children}</div>
  </dialog>
}

function Chips({ label, options, value, onChange, allowNone = true, tone }) {
  return <fieldset className="task-chips">
    <legend>{label}</legend>
    <div>
      {options.map(([id, words]) => <button key={id} type="button" aria-pressed={value === id} style={tone ? { '--item-accent': tone(id) } : undefined}
        onClick={() => onChange(value === id && allowNone ? '' : id)}>{words}</button>)}
    </div>
  </fieldset>
}

const AREA_OPTIONS = TASK_AREAS.slice(0, 8)
const fieldsOf = (task = null, defaults = {}) => ({
  title: task?.title ?? '', area: task?.details?.area ?? defaults.area ?? '', lane: task?.details?.lane ?? defaults.lane ?? '',
  slot: task?.details?.slot ?? '', priority: task?.details?.priority ?? 'med', estimate: task?.details?.estimate ? String(task.details.estimate) : '',
  day: task ? taskDay(task) : defaults.day ?? '', due: task?.details?.due ?? '', proof: task?.details?.proof ?? '', note: task?.details?.note ?? '', stepsText: '',
})

function Fields({ form, set, withSteps }) {
  const field = (name) => (event) => set({ ...form, [name]: event.target.value })
  return <div className="task-fields">
    <div className="task-fields-col">
      <Chips label="Area" options={AREA_OPTIONS} value={form.area} onChange={(area) => set({ ...form, area })} tone={toneOf} />
      <Chips label="Lane" options={LANES.map((lane) => [lane.id, lane.label])} value={form.lane} onChange={(lane) => set({ ...form, lane })} />
      <Chips label="When it fits the day" options={SLOTS.map((slot) => [slot.id, slot.label])} value={form.slot} onChange={(slot) => set({ ...form, slot })} />
    </div>
    <div className="task-fields-col">
      <Chips label="Priority" options={PRIORITIES.map((p) => [p.id, p.label])} value={form.priority} onChange={(priority) => set({ ...form, priority: priority || 'med' })} allowNone={false} />
      <div className="task-fields-row">
        <label>Hours<input type="number" min="0" max="200" step="0.25" inputMode="decimal" value={form.estimate} onChange={field('estimate')} placeholder="2.5" /></label>
        <label>Day to do it<input type="date" value={form.day} onChange={field('day')} /></label>
        <label>Due by<input type="date" value={form.due} onChange={field('due')} /></label>
      </div>
      <label className="task-wide">Done when<input value={form.proof} onChange={field('proof')} maxLength={600} placeholder="What shows it is done: “submitted, receipt saved”" /></label>
      <label className="task-wide">About this task<textarea rows={2} value={form.note} onChange={field('note')} maxLength={20000} /></label>
      {withSteps ? <label className="task-wide">Steps, one a line<textarea rows={4} value={form.stepsText} onChange={field('stepsText')} placeholder={'Read the brief\nDraft\nCheck and submit'} /></label> : null}
    </div>
  </div>
}

function detailsFrom(form, kept = {}) {
  const estimate = Number(form.estimate)
  const details = { ...kept, area: form.area, lane: form.lane, slot: form.slot, priority: form.priority || 'med', proof: form.proof.trim(), note: form.note.trim(), due: form.due,
    estimate: Number.isFinite(estimate) && estimate > 0 ? estimate : undefined }
  for (const [key, value] of Object.entries(details)) if (value === undefined || value === null || value === '') delete details[key]
  return details
}

export function NewTask({ defaults = {}, onClose, onSaved }) {
  const [form, setForm] = useState(() => fieldsOf(null, defaults))
  const [state, setState] = useState({ saving: false, error: '' })
  async function save(event) {
    event.preventDefault()
    if (!form.title.trim()) { setState({ saving: false, error: 'Give the task a title.' }); return }
    setState({ saving: true, error: '' })
    try {
      const steps = stepsFromLines(form.stepsText)
      const saved = await createTask({ title: form.title, day: form.day, details: { ...detailsFrom(form), ...(steps.length ? { steps } : {}) } })
      onSaved?.(saved)
      onClose()
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <Modal label="A new task" onClose={onClose}>
    <form onSubmit={save}>
      <header className="task-sheet-head"><p className="task-eyebrow">A new task</p><span>Esc to close</span></header>
      <input className="task-title-input" autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={300} placeholder="What is it? “MAT021 coursework: read the brief”" aria-label="The task's title" />
      <Fields form={form} set={setForm} withSteps />
      {state.error ? <p className="task-error" role="alert">{state.error}</p> : null}
      <footer className="task-sheet-foot">
        <button type="submit" className="task-primary" disabled={state.saving}>{state.saving ? 'Saving…' : 'Add the task'}</button>
        <button type="button" onClick={onClose}>Discard</button>
      </footer>
    </form>
  </Modal>
}

// A task opened. `askHow` opens it with "How did it go?" ready, as after a tick elsewhere.
export function TaskDialog({ task, today, onClose, askHow: askAtFirst = false }) {
  const [form, setForm] = useState(() => fieldsOf(task))
  const [state, setState] = useState({ saving: false, error: '', said: '', undo: null })
  const [askHow, setAskHow] = useState(askAtFirst)
  // A change saved elsewhere (a step ticked here, or on another page) brings a newer task: the
  // boxes follow it unless she is in the middle of changing them.
  const [dirty, setDirty] = useState(false)
  useEffect(() => { if (!dirty) setForm(fieldsOf(task)) }, [task, dirty])
  const set = (next) => { setDirty(true); setForm(next) }
  const done = task.status === 'done'
  const moved = timesMoved(task)

  // Runs a save; the action may answer a function that takes it back, offered as Undo.
  async function run(action, said) {
    setState({ saving: true, error: '', said: '', undo: null })
    try { const answer = await action(); setState({ saving: false, error: '', said, undo: typeof answer === 'function' ? answer : null }); return true }
    catch (failure) { setState({ saving: false, error: failure.message, said: '', undo: null }); return false }
  }
  async function markDone(next) {
    if (await run(() => setTaskDone(task, next), next ? 'Done.' : 'Back on the list.')) setAskHow(next)
  }
  const move = (choice) => run(async () => { const saved = await postponeTask(task, { ...choice, today }); return () => undoMove(saved, task) }, `${movedWords(choice.choice, today, choice.day)}.`)
  async function saveFields(event) {
    event.preventDefault()
    if (!form.title.trim()) { setState({ saving: false, error: 'Give the task a title.', said: '' }); return }
    const { area: _a, lane: _l, slot: _s, priority: _p, proof: _pr, note: _n, due: _d, estimate: _e, ...kept } = task.details ?? {}
    const dayChanged = form.day !== taskDay(task)
    const saved = await run(() => saveTask(task, {
      title: form.title.trim(), details: detailsFrom(form, kept),
      ...(dayChanged ? (form.day ? { start_at: form.day, end_at: null, all_day: true } : { start_at: null, end_at: null, all_day: false }) : {}),
    }), 'Saved.')
    if (saved) setDirty(false)
  }

  return <Modal label={task.title} onClose={onClose}>
    <header className="task-sheet-head">
      <p className="task-eyebrow" style={{ '--item-accent': toneOf(task.details?.area) }}>{done ? 'Done' : taskDay(task) ? `For ${taskDay(task) === today ? 'today' : formatCalendarDay(taskDay(task), { weekday: 'long' })}` : 'Task'}</p>
      <span className="task-sheet-tools">
        <StarButton on={Boolean(task.favorite)} title={task.title} busy={state.saving} onToggle={() => run(() => setTaskStar(task, !task.favorite), task.favorite ? 'Star taken off.' : 'Starred: it comes first.')} />
        <button type="button" className="task-close" onClick={onClose}>Close</button>
      </span>
    </header>
    <div className="task-open-title">
      <TaskTick done={done} busy={state.saving} label={done ? 'Not done after all' : 'Done'} onToggle={() => markDone(!done)} />
      <input className="task-title-input" value={form.title} onChange={(event) => set({ ...form, title: event.target.value })} maxLength={300} aria-label="The task's title" />
    </div>
    {state.error ? <p className="task-error" role="alert">{state.error}</p> : null}
    {state.said ? <p className="task-said" role="status">{state.said}{state.undo ? <> <button type="button" className="day-undo" disabled={state.saving} onClick={() => run(state.undo, 'Put back.')}>Undo</button></> : null}</p> : null}
    {!done && moved >= STUCK_AFTER_MOVES ? <p className="task-stuck">Moved {moved} times. Make it smaller (split it into steps below), give it a day you can keep, or take it off the list.</p> : null}
    <section className="task-open-steps" aria-label="Steps">
      <h3>The steps</h3>
      <TaskSteps task={task} editable busy={state.saving} onError={(error) => setState({ saving: false, error, said: '', undo: null })} />
    </section>
    <TaskNotes task={task} busy={state.saving} run={run} askHow={askHow} onAsked={() => setAskHow(false)} />
    <form onSubmit={saveFields}>
      <Fields form={form} set={set} withSteps={false} />
      <footer className="task-sheet-foot">
        <button type="submit" className="task-primary" disabled={state.saving || !dirty}>{state.saving ? 'Saving…' : 'Save changes'}</button>
        <button type="button" onClick={() => markDone(!done)} disabled={state.saving}>{done ? 'Not done after all' : 'Mark done'}</button>
        {done ? null : <MoveMenu title={task.title} day={taskDay(task)} today={today} busy={state.saving} onMove={move} />}
        <button type="button" onClick={() => run(async () => { await putTaskAway(task); onClose() }, '')} disabled={state.saving} title="It is kept, and no longer shown on the list">Take off the list</button>
      </footer>
    </form>
  </Modal>
}
