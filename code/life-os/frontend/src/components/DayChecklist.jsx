// A day as one checklist: every thing in it in time order, each with a tick, then what is for
// any time, then (folded) the day's deadlines and reminders. A row opens to its steps, what shows
// it is done, and what can be done with it. Ticks save where each thing is kept (lib/checklist.js).
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCalendarDay } from '../lib/calendar.js'
import { placeOf } from '../lib/calendarViews.js'
import { checklistRows, nextLine, nextRow, stepCount } from '../lib/checklist.js'
import { tickCheck, useDayChecks } from '../lib/useDayChecks.js'
import { saveAction, snoozeAction, unsnoozeAction, useMail } from '../lib/useMail.js'
import { createTask, postponeTask, setTaskDone, setTaskStar, undoMove } from '../lib/useTasks.js'
import { MovedMark, TaskSteps, hoursText } from './tasks/TaskParts.jsx'
import { MoveMenu, StarButton, dayOfChoice, movedWords } from './tasks/TaskActions.jsx'
import { TaskDialog } from './tasks/TaskEditor.jsx'

const WORDS = ['Nothing', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
export function checklistLine(done, total) {
  if (!total) return 'Nothing on this day yet.'
  if (done === total) return `All ${total} done.`
  return `${done} of ${total} done`
}

function StudySteps({ row, page }) {
  const can = Boolean(row.card?.hubCardId && row.card?.semesterId)
  return <ol className="checklist-steps">
    {row.steps.map((step, index) => <li key={step.id || index} className={step.done ? 'is-done' : undefined}>
      {can && step.id ? <button type="button" className="check-box is-small" role="checkbox" aria-checked={Boolean(step.done)} aria-label={`${step.done ? 'Untick' : 'Tick'}: ${step.text}`}
        disabled={Boolean(page.savingId)} onClick={() => page.tickStudy(row.card, step, !step.done)} /> : <span className="check-box is-small" aria-hidden="true" />}
      <span>{step.text}</span>
    </li>)}
  </ol>
}

function Row({ row, page, open, onToggleOpen, onTick, busy, detailsTo, onOpen, onMove, onStar, onOpenTask, onDismiss }) {
  const place = placeOf(row.href)
  const meta = [row.kind, row.place, stepCount(row), row.hours ? hoursText(row.hours) : '', row.late && row.lateFrom ? `from ${formatCalendarDay(row.lateFrom, { weekday: 'short' })}` : '', row.extra].filter(Boolean)
  const verb = row.kind === 'Class' ? (row.done ? 'Not gone after all' : 'Went') : row.done ? 'Not done after all' : 'Done'
  const more = open
  const task = row.how === 'own' ? row.task : null
  const starred = Boolean(task?.favorite)
  return <li className={`checklist-row${row.done ? ' is-done' : ''}${more ? ' is-open' : ''}${row.late ? ' is-late' : ''}${starred ? ' is-starred' : ''}`} style={{ '--item-accent': row.tone }}>
    <button type="button" className="check-box" role="checkbox" aria-checked={row.done} aria-label={`${verb}: ${row.title}`} title={verb} disabled={busy} onClick={onTick} />
    <div className="checklist-time">{row.time ? <><b>{row.time}</b>{row.end ? <small>{row.end}</small> : null}</> : null}</div>
    <div className="checklist-body">
      <button type="button" className="checklist-title" aria-expanded={more} onClick={onToggleOpen}>{starred ? <span className="task-starred" aria-label="Starred">★ </span> : null}{row.title}</button>
      <p className="checklist-meta"><span className="checklist-chip">{row.label}</span>{meta.map((part) => <span key={part}>{part}</span>)}{task ? <MovedMark task={task} /> : null}</p>
      {more ? <div className="checklist-more">
        {row.steps.length ? (task ? <TaskSteps task={task} busy={busy} /> : <StudySteps row={row} page={page} />) : null}
        {row.doneWhen ? <p className="checklist-done-when"><span>Done when</span> {row.doneWhen}</p> : null}
        {task && !row.done ? <div className="task-tools checklist-tools">
          <StarButton on={starred} title={row.title} busy={busy} onToggle={() => onStar(row)} />
          <MoveMenu title={row.title} day={row.lateFrom || page.date} today={page.today} busy={busy} onMove={(choice) => onMove(row, choice)} />
        </div> : null}
        {row.how === 'mail' && !row.done ? <div className="task-tools checklist-tools">
          <MoveMenu title={row.title} day={page.date} today={page.today} waiting busy={busy} onMove={(choice) => onMove(row, choice)} />
          <button type="button" className="task-move-button" disabled={busy} onClick={() => onDismiss(row)} aria-label={`Dismiss: ${row.title}`} title="Not needed any more: it leaves the list and is kept">Dismiss</button>
        </div> : null}
        <p className="checklist-actions">
          {place ? <Link to={row.href}>Open in {place}</Link> : row.href && row.href !== '/calendar' && !task ? <Link to={row.href}>Open it</Link> : null}
          {task ? <button type="button" onClick={() => onOpenTask(task.id)}>Notes and all its details</button>
            : onOpen ? <button type="button" onClick={() => onOpen(row.key)}>All its details</button> : detailsTo ? <Link to={detailsTo}>All its details</Link> : null}
          {row.card?.hubCardId && row.card?.semesterId ? <button type="button" disabled={busy} onClick={() => page.tickStudy(row.card, null, !row.card.done)}>{row.card.done ? 'Card not done after all' : 'The whole card is done'}</button> : null}
          {row.how === 'own' && row.item ? <button type="button" disabled={busy} onClick={() => page.setItemStatus(row.item, 'cancelled')}>Take off the day</button> : null}
          {row.kind === 'Exercise' ? <Link to="/health?view=gym">Log the sets in Health</Link> : null}
        </p>
      </div> : null}
    </div>
  </li>
}

export default function DayChecklist({ page, onOpen, title, className = '' }) {
  const { date, today, isToday } = page
  const checks = useDayChecks(date)
  const mail = useMail(isToday ? '/api/mail/actions' : '')
  const [openKey, setOpenKey] = useState('')
  const [showAlso, setShowAlso] = useState(false)
  const [adding, setAdding] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  // What was just done here, with Undo, and after a task is ticked done "Add how it went".
  const [said, setSaid] = useState(null)
  const [openTask, setOpenTask] = useState({ id: '', how: false })
  const list = useMemo(() => checklistRows({ path: page.fullPath, items: page.items, tasks: page.tasks.tasks, date, today, checks: checks.checks[date] ?? {}, study: page.data?.study, mail: mail.data }),
    [page.fullPath, page.items, page.tasks.tasks, date, today, checks.checks, page.data, mail.data])
  const next = isToday ? nextLine(nextRow(list.timed, page.clock), page.clock) : null

  async function run(key, work) {
    if (busy || page.savingId) return
    setBusy(key)
    setError('')
    setSaid(null)
    try { await work() } catch (failure) { setError(`Not saved: ${failure.message}`) } finally { setBusy('') }
  }
  // Moved to another day: her task in the core, a thing waiting on her snoozed to that day.
  function move(row, choice) {
    const words = `${movedWords(choice.choice, today, choice.day)}: “${row.title}”.`
    if (row.how === 'mail') {
      return run(row.key, async () => {
        const saved = await snoozeAction(row.row, dayOfChoice(choice.choice, today, choice.day))
        mail.reload()
        setSaid({ words, undo: async () => { await unsnoozeAction(saved, row.row); mail.reload() } })
      })
    }
    return run(row.key, async () => { const saved = await postponeTask(row.task, { ...choice, today }); setSaid({ words, undo: () => undoMove(saved, row.task) }) })
  }
  const star = (row) => run(row.key, async () => {
    const saved = await setTaskStar(row.task, !row.task.favorite)
    setSaid({ words: `${row.task.favorite ? 'Star taken off' : 'Starred, first in every list'}: “${row.title}”.`, undo: () => setTaskStar(saved, row.task.favorite) })
  })
  const undo = () => run('undo', async () => { await said.undo() })
  // A thing waiting on her that is not needed any more: it leaves the list and is kept.
  const dismiss = (row) => run(row.key, async () => {
    const saved = await saveAction(row.row, { status: 'not-needed' })
    mail.reload()
    setSaid({ words: `Dismissed: “${row.title}”.`, undo: async () => { await saveAction(saved, { status: row.row.status }); mail.reload() } })
  })
  function tick(row) {
    // A tick kept for the day is taken back the same way.
    if (row.checked) return run(row.key, () => tickCheck(date, row.key, false, row.title))
    if (row.how === 'own' && row.item) return page.setItemStatus(row.item, row.done ? '' : 'done')
    if (row.how === 'own' && row.task) {
      return run(row.key, async () => { await setTaskDone(row.task, !row.done); if (!row.done) setSaid({ words: `Done: “${row.title}”.`, how: row.task.id }) })
    }
    if (row.how === 'card') return page.tickStudy(row.card, null, !row.done)
    if (row.how === 'mail') return run(row.key, async () => { await saveAction(row.row, { status: 'done' }); mail.reload() })
    return run(row.key, () => tickCheck(date, row.key, !row.done, row.title))
  }
  async function add(event) {
    event.preventDefault()
    const words = adding.trim()
    if (!words) return
    await run('add', async () => { await createTask({ title: words, day: date }); setAdding('') })
  }
  const detailsTo = (row) => (row.key.startsWith('task:') || row.key.startsWith('mail:') ? '' : `/calendar?day=${date}&item=${encodeURIComponent(row.key)}`)
  const rowProps = (row) => ({ row, page, open: openKey === row.key, onToggleOpen: () => setOpenKey(openKey === row.key ? '' : row.key), onTick: () => tick(row),
    busy: Boolean(busy || page.savingId), detailsTo: detailsTo(row), onOpen, onMove: move, onStar: star, onDismiss: dismiss, onOpenTask: (id) => setOpenTask({ id, how: false }) })
  const opened = openTask.id ? page.tasks.tasks.find((task) => task.id === openTask.id) : null
  const percent = list.total ? Math.round((list.done / list.total) * 100) : 0
  const loading = page.loading && !list.total

  return <section className={`day-panel checklist ${className}`.trim()} aria-labelledby={`checklist-${date}`}>
    <header className="checklist-head">
      <h2 id={`checklist-${date}`}>{title ?? (isToday ? 'Today’s checklist' : `Checklist · ${formatCalendarDay(date, { weekday: 'long' })}`)}</h2>
      <span className="checklist-count">{loading ? 'Reading the day…' : checklistLine(list.done, list.total)}</span>
    </header>
    {list.total ? <div className="checklist-progress" role="img" aria-label={`${list.done} of ${list.total} done`}><i style={{ width: `${percent}%` }} /></div> : null}
    {next ? <p className="checklist-next"><span>{next.label}</span> {next.when} · {next.title}</p> : null}
    {list.timed.length ? <ol className="checklist-rows">{list.timed.map((row) => <Row key={row.key} {...rowProps(row)} />)}</ol>
      : !loading ? <p className="day-quiet">Nothing has a time on this day.</p> : null}
    {list.anytime.length ? <><h3 className="checklist-group">Any time</h3><ol className="checklist-rows">{list.anytime.map((row) => <Row key={row.key} {...rowProps(row)} />)}</ol></> : null}
    <form className="checklist-add" onSubmit={add}>
      <span className="check-box is-ghost" aria-hidden="true" />
      <input value={adding} onChange={(event) => setAdding(event.target.value)} placeholder={`Add something to do ${isToday ? 'today' : `on ${formatCalendarDay(date, { weekday: 'long' })}`} and press Enter`} maxLength={300} aria-label="Something to add to the checklist" disabled={busy === 'add'} />
    </form>
    {list.also.length ? <div className="checklist-also">
      <button type="button" className="checklist-fold" aria-expanded={showAlso} onClick={() => setShowAlso(!showAlso)}>
        {showAlso ? 'Hide' : 'Also on this day:'} {list.also.length} {list.also.length === 1 ? 'deadline or reminder' : 'deadlines and reminders'} {showAlso ? '▴' : '▾'}
      </button>
      {showAlso ? <ol className="checklist-rows is-also">{list.also.map((row) => <Row key={row.key} {...rowProps(row)} />)}</ol> : null}
    </div> : null}
    {error || page.error ? <p className="day-warn" role="alert">{error || page.error}</p> : null}
    {page.change ? <p className="day-add-hint day-add-done" role="status">{page.change.words} <button type="button" className="day-undo" onClick={page.undoChange} disabled={Boolean(page.savingId)}>Undo</button></p> : null}
    {said ? <p className="day-add-hint day-add-done" role="status">{said.words}
      {said.undo ? <> <button type="button" className="day-undo" onClick={undo} disabled={Boolean(busy)}>Undo</button></> : null}
      {said.how ? <> <button type="button" className="day-undo" onClick={() => setOpenTask({ id: said.how, how: true })}>Add how it went</button></> : null}</p> : null}
    {opened ? <TaskDialog task={opened} today={today} askHow={openTask.how} onClose={() => setOpenTask({ id: '', how: false })} /> : null}
  </section>
}

export { WORDS }
