// Everything to do, in one place: her own tasks, the Study hub's cards for now, and what is
// waiting on her from the Inbox, in lanes (Today, This week, Deep work, Backlog, Waiting).
// The Board shows the lanes side by side, as the design's board did; the List is the design's
// ledger: one table, the lanes counted beside it. Her own tasks are opened, ticked, given steps
// and dragged between lanes here; the others are ticked here and opened where they are kept.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LANES, laneLabel } from '@shared/tasks.js'
import { formatCalendarDay } from '../lib/calendar.js'
import { gatherItems } from '../lib/taskItems.js'
import { TASK_AREAS, areaName, createTask, moveTaskLane, postponeTask, setTaskDone, setTaskStar, undoMove, useTasks } from '../lib/useTasks.js'
import { saveAction, snoozeAction, unsnoozeAction, useMail } from '../lib/useMail.js'
import { dayOfChoice, movedWords } from './tasks/TaskActions.jsx'
import { useDay } from '../lib/useDay.js'
import { useLondonToday } from '../lib/useCalendar.js'
import { apiFetch } from '../lib/api.js'
import { tellStudyHub } from '../lib/studyHub.js'
import { TaskCard, TaskTick, hoursText } from './tasks/TaskParts.jsx'
import { NewTask, TaskDialog } from './tasks/TaskEditor.jsx'

const VIEWS = [['board', 'Board'], ['list', 'List']]
const SOURCES = [['all', 'Everything'], ['own', 'My tasks'], ['study', 'Study hub'], ['mail', 'Waiting on you']]

function LaneAdd({ lane, today, onError }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  async function add(event) {
    event.preventDefault()
    const title = text.trim()
    if (!title || saving) return
    setSaving(true)
    try { await createTask({ title, day: lane === 'today' ? today : '', details: lane === 'today' ? {} : { lane } }); setText('') }
    catch (failure) { onError(failure.message) } finally { setSaving(false) }
  }
  return <form className="task-lane-add" onSubmit={add}>
    <input value={text} onChange={(event) => setText(event.target.value)} placeholder="+ add a task" maxLength={300} aria-label={`A new task in ${laneLabel(lane)}`} disabled={saving} />
  </form>
}

export default function TasksView() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const view = params.get('view') === 'list' ? 'list' : 'board'
  const area = params.get('area') ?? ''
  const source = SOURCES.some(([id]) => id === params.get('from')) ? params.get('from') : 'all'
  const today = useLondonToday()
  const tasks = useTasks()
  const day = useDay(today)
  const mail = useMail('/api/mail/actions')
  const [openId, setOpenId] = useState('')
  const [askHow, setAskHow] = useState(false)
  const [adding, setAdding] = useState(null)
  const [showDone, setShowDone] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [said, setSaid] = useState(null)
  const [dragging, setDragging] = useState('')
  const [over, setOver] = useState('')

  const dayData = day.data?.date === today ? day.data : null
  const all = useMemo(() => gatherItems({ tasks: tasks.tasks, today, day: dayData, mail: mail.data }), [tasks.tasks, today, dayData, mail.data])
  const shown = all.filter((item) => (source === 'all' || item.kind === source) && (!area || item.area === area || (area === 'admin' && item.kind === 'mail')))
  const open = shown.filter((item) => !item.done)
  const doneItems = shown.filter((item) => item.done && item.kind === 'own')
  const areas = useMemo(() => {
    const counts = new Map()
    for (const item of all) if (!item.done) counts.set(item.area || '', (counts.get(item.area || '') ?? 0) + 1)
    return TASK_AREAS.filter(([slug]) => counts.has(slug)).map(([slug, name]) => [slug, name, counts.get(slug)])
  }, [all])
  const opened = openId ? tasks.tasks.find((task) => task.id === openId) : null
  const lateCount = open.filter((item) => item.late).length

  function set(next) {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) { if (value) merged.set(key, value); else merged.delete(key) }
    setParams(merged, { replace: true })
  }
  async function run(key, action, words, how = '') {
    if (busy) return
    setBusy(key)
    setError('')
    try { const undo = await action(); setSaid(words ? { words, undo, how } : null) } catch (failure) { setError(failure.message) } finally { setBusy('') }
  }
  // A tick, wherever the thing is kept. Her own task ticked done offers "how it went".
  function toggle(item) {
    if (item.kind === 'own') return run(item.key, async () => { const saved = await setTaskDone(item.task, !item.done); return () => setTaskDone(saved, item.done) }, `${item.done ? 'Back on the list' : 'Done'}: “${item.title}”.`, item.done ? '' : item.id)
    if (item.kind === 'mail') return run(item.key, async () => { const saved = await saveAction(item.row, { status: 'done' }); mail.reload(); return async () => { await saveAction(saved, { status: 'open' }); mail.reload() } }, `Done: “${item.title}”.`)
    if (item.kind === 'study' && item.card.hubCardId) {
      return run(item.key, async () => {
        const saved = await apiFetch('/api/day/study', { method: 'POST', body: JSON.stringify({ semester: item.card.semesterId, card: item.card.hubCardId, done: !item.done }) })
        tellStudyHub(item.card.semesterId, saved)
        day.refetch()
      }, `${item.done ? 'Not done after all' : 'Card done'} in the Study hub: “${item.title}”.`)
    }
    return undefined
  }
  async function undo() {
    if (!said?.undo) return
    await run('undo', async () => { await said.undo(); tasks.reload(); mail.reload() }, '')
  }
  function openItem(item, how = false) {
    setAskHow(how)
    if (item.kind === 'own') setOpenId(item.id)
    else navigate(item.href)
  }
  // Moved to another day: her task in the core, a thing waiting on her snoozed to that day.
  function move(item, choice) {
    const words = `${movedWords(choice.choice, today, choice.day)}: “${item.title}”.`
    if (item.kind === 'own') return run(item.key, async () => { const saved = await postponeTask(item.task, { ...choice, today }); return () => undoMove(saved, item.task) }, words)
    if (item.kind === 'mail') {
      return run(item.key, async () => { const saved = await snoozeAction(item.row, dayOfChoice(choice.choice, today, choice.day)); mail.reload(); return async () => { await unsnoozeAction(saved, item.row); mail.reload() } }, words)
    }
    return undefined
  }
  const star = (item) => run(item.key, async () => { const saved = await setTaskStar(item.task, !item.task.favorite); return () => setTaskStar(saved, item.task.favorite) },
    `${item.task.favorite ? 'Star taken off' : 'Starred, first in every list'}: “${item.title}”.`)
  function drop(lane) {
    const item = all.find((candidate) => candidate.key === dragging)
    setDragging('')
    setOver('')
    if (!item || item.kind !== 'own' || item.lane === lane) return
    run(item.key, async () => { await moveTaskLane(item.task, lane, today) }, `Moved “${item.title}” to ${laneLabel(lane)}.`)
  }

  const card = (item) => <TaskCard key={item.key} item={item} today={today} busy={Boolean(busy)} onOpen={() => openItem(item)} onToggle={item.kind === 'study' && !item.card.hubCardId ? undefined : () => toggle(item)}
    onMove={item.kind === 'own' || item.kind === 'mail' ? (choice) => move(item, choice) : undefined} onStar={item.kind === 'own' ? () => star(item) : undefined}
    draggable={item.kind === 'own'} onDragStart={(event) => { setDragging(item.key); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.key) }} />

  return <section className="today-layout unified-today day-page tasks-page" aria-label="Tasks">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Tasks</h1><span /></div>
      <p className="tasks-subline">{open.length} open{lateCount ? ` · ${lateCount} late` : ''} · {formatCalendarDay(today, { weekday: 'long' })}</p>
    </header>

    <div className="tasks-toolbar">
      <div className="tasks-switch" role="group" aria-label="How to show them">
        {VIEWS.map(([id, words]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => set({ view: id === 'board' ? '' : id })}>{words}</button>)}
      </div>
      <div className="tasks-switch" role="group" aria-label="Which to show">
        {SOURCES.map(([id, words]) => <button key={id} type="button" aria-pressed={source === id} onClick={() => set({ from: id === 'all' ? '' : id })}>{words}</button>)}
      </div>
      <button type="button" className="task-primary" onClick={() => setAdding({})}>New task</button>
    </div>
    <div className="tasks-areas" role="group" aria-label="Area">
      <button type="button" aria-pressed={!area} onClick={() => set({ area: '' })}>All areas</button>
      {areas.map(([slug, name, count]) => <button key={slug} type="button" aria-pressed={area === slug} onClick={() => set({ area: area === slug ? '' : slug })}>{name} <small>{count}</small></button>)}
    </div>

    {said ? <p className="day-add-hint day-add-done" role="status">{said.words}{said.undo ? <> <button type="button" className="day-undo" onClick={undo} disabled={Boolean(busy)}>Undo</button></> : null}
      {said.how ? <> <button type="button" className="day-undo" onClick={() => { setAskHow(true); setOpenId(said.how) }}>Add how it went</button></> : null}</p> : null}
    {error ? <p className="day-add-hint day-warn" role="alert">{error}</p> : null}
    {tasks.error ? <p className="day-warn" role="alert">Your tasks could not be read: {tasks.error} <button type="button" className="day-retry" onClick={tasks.reload}>Try again</button></p> : null}
    {day.error ? <p className="day-quiet">The Study hub’s cards could not be read just now.</p> : null}

    {view === 'board' ? <div className="tasks-board-scroll"><div className="tasks-board">
      {LANES.map((lane) => {
        const items = open.filter((item) => item.lane === lane.id)
        const hours = items.reduce((sum, item) => sum + (Number(item.task?.details?.estimate) || 0), 0)
        return <section key={lane.id} className={`tasks-lane is-${lane.id}${over === lane.id ? ' is-over' : ''}`} aria-labelledby={`lane-${lane.id}`}
          onDragOver={(event) => { if (dragging) { event.preventDefault(); setOver(lane.id) } }} onDragLeave={() => setOver('')} onDrop={(event) => { event.preventDefault(); drop(lane.id) }}>
          <header><h2 id={`lane-${lane.id}`}>{lane.label}</h2><span>{items.length}{hours ? ` · ${hoursText(hours)}` : ''}</span></header>
          <p className="tasks-lane-hint">{lane.hint}</p>
          <div className="tasks-lane-cards">{items.length ? items.map(card) : <p className="day-quiet">{tasks.loading ? 'Reading…' : 'Nothing here.'}</p>}</div>
          {lane.id === 'rescue' ? null : <LaneAdd lane={lane.id} today={today} onError={setError} />}
        </section>
      })}
    </div></div> : <div className="tasks-ledger">
      <aside className="tasks-ledger-lanes" aria-label="The lanes">
        <h2>The lanes</h2>
        <ul>{LANES.map((lane) => <li key={lane.id}><span>{lane.label}</span><i aria-hidden="true" /><b>{open.filter((item) => item.lane === lane.id).length}</b></li>)}
          <li><span>Done</span><i aria-hidden="true" /><b>{doneItems.length}</b></li></ul>
      </aside>
      <div className="tasks-table-scroll"><table className="tasks-table">
        <thead><tr><th scope="col"><span className="visually-hidden">Done</span></th><th scope="col">Lane</th><th scope="col">Task</th><th scope="col">Area</th><th scope="col">Day</th><th scope="col">Hours</th><th scope="col">Steps</th></tr></thead>
        <tbody>
          {LANES.flatMap((lane) => open.filter((item) => item.lane === lane.id)).map((item) => <tr key={item.key} className={item.late ? 'is-late' : undefined} style={{ '--item-accent': item.tone }}>
            <td><TaskTick done={item.done} size="small" busy={Boolean(busy)} label={`Done: ${item.title}`} onToggle={item.kind === 'study' && !item.card.hubCardId ? undefined : () => toggle(item)} /></td>
            <td className="tasks-lane-cell">{laneLabel(item.lane)}</td>
            <td><button type="button" className="task-card-title" onClick={() => openItem(item)}>{item.title}</button></td>
            <td className="tasks-area-cell">{item.kind === 'own' ? areaName(item.area) : item.source}</td>
            <td className={item.late ? 'task-late' : undefined}>{item.day ? (item.day === today ? 'today' : formatCalendarDay(item.day, { weekday: 'short' })) : '—'}</td>
            <td>{item.task?.details?.estimate ? hoursText(item.task.details.estimate) : item.extra && item.kind === 'study' ? item.extra : '—'}</td>
            <td>{item.progress ? `${item.progress.done}/${item.progress.total}` : '—'}</td>
          </tr>)}
        </tbody>
      </table></div>
    </div>}

    <section className="tasks-done" aria-labelledby="tasks-done-heading">
      <header><h2 id="tasks-done-heading">Done</h2><span>{doneItems.length}</span><button type="button" className="ghost-pill compact-pill" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>{showDone ? 'Hide' : 'Show'}</button></header>
      {showDone ? <div className="tasks-lane-cards tasks-done-cards">{doneItems.slice(0, 60).map(card)}</div> : null}
    </section>

    <p className="today-section-note">Study hub cards and things waiting on you are ticked here and kept where they belong: <Link to="/study">Study hub</Link>, <Link to="/inbox/waiting">Waiting on you</Link>.</p>
    {adding ? <NewTask defaults={{ ...adding, area }} onClose={() => setAdding(null)} /> : null}
    {opened ? <TaskDialog task={opened} today={today} askHow={askHow} onClose={() => { setOpenId(''); setAskHow(false) }} /> : null}
  </section>
}
