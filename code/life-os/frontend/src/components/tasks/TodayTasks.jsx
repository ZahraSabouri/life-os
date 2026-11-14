// The day's tasks as cards, as the design's "Today's folio" drew them: a diamond to tick each,
// its steps under it, what shows it is done, and the hours so far. Her own tasks for the day;
// with `others`, also the Study hub's cards and what is waiting on her today, each ticked where
// it is kept. On Today and on every style's Court.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { hoursOf, tasksForDay, compareTasks, isDoneTask, slippedCount } from '@shared/tasks.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import { gatherItems } from '../../lib/taskItems.js'
import { createTask, setTaskDone } from '../../lib/useTasks.js'
import { saveAction, useMail } from '../../lib/useMail.js'
import { TaskMeta, TaskSteps, TaskTick, hoursText } from './TaskParts.jsx'
import { TaskDialog } from './TaskEditor.jsx'

// Hours done of hours planned, both in the planned amount's unit: "15 of 45 min", "1.5 of 6 h".
export function sumText(done, planned) {
  if (planned < 1) return `${Math.round(done * 60)} of ${Math.round(planned * 60)} min`
  const h = (value) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10))
  return `${h(done)} of ${h(planned)} h`
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
const say = (n) => WORDS[n] ?? String(n)
export function folioLine(done, open) {
  if (!done && !open) return 'Nothing on the list yet.'
  if (!open) return `${say(done)} done. Everything is ticked.`
  if (!done) return `${say(open)} to do.`
  return `${say(done)} done, ${say(open).toLowerCase()} to go.`
}

export default function TodayTasks({ page, others = false, title }) {
  const { tasks, date, today, isToday } = page
  const [openId, setOpenId] = useState('')
  const [adding, setAdding] = useState('')
  const [state, setState] = useState({ saving: '', error: '' })
  const mail = useMail(others && isToday ? '/api/mail/actions' : '')
  const mine = useMemo(() => tasksForDay(tasks.tasks, date, today).sort(compareTasks), [tasks.tasks, date, today])
  // From the other parts, only what is for today itself; what is late from them is counted, and
  // listed on the Tasks page, so the first page is not buried under old things.
  const gathered = useMemo(() => (others && isToday ? gatherItems({ tasks: [], today, day: page.data, mail: mail.data, includeDone: true }).filter((item) => item.lane === 'today') : []), [others, isToday, today, page.data, mail.data])
  const rest = gathered.filter((item) => !item.late)
  const lateElsewhere = { study: gathered.filter((item) => item.late && item.kind === 'study').length, mail: gathered.filter((item) => item.late && item.kind === 'mail').length }
  const slipped = isToday ? slippedCount(tasks.tasks, today) : 0
  const done = mine.filter(isDoneTask).length + rest.filter((item) => item.done).length
  const open = mine.length + rest.length - done
  const hours = hoursOf(mine)
  const opened = openId ? tasks.tasks.find((task) => task.id === openId) : null

  async function run(key, action) {
    if (state.saving) return
    setState({ saving: key, error: '' })
    try { await action() } catch (failure) { setState({ saving: '', error: failure.message }); return }
    setState({ saving: '', error: '' })
  }
  async function add(event) {
    event.preventDefault()
    const words = adding.trim()
    if (!words) return
    await run('add', async () => { await createTask({ title: words, day: date }); setAdding('') })
  }
  const dayName = isToday ? 'today' : formatCalendarDay(date, { weekday: 'long' })

  return <section className="day-panel task-folio" aria-labelledby={`task-folio-${date}`}>
    <header>
      <h2 id={`task-folio-${date}`}>{title ?? (isToday ? 'Today’s tasks' : `Tasks for ${dayName}`)}</h2>
      <Link to="/tasks">All tasks</Link>
    </header>
    {tasks.loading && !tasks.tasks.length ? <p className="day-quiet">Reading your tasks…</p> : <p className="task-folio-line">{folioLine(done, open)}</p>}
    {tasks.error ? <p className="day-warn" role="alert">Tasks could not be read: {tasks.error} <button type="button" className="day-retry" onClick={tasks.reload}>Try again</button></p> : null}
    {mine.length || rest.length ? <ul className="task-folio-list">
      {mine.map((task) => {
        const finished = isDoneTask(task)
        return <li key={task.id} className={`task-folio-card${finished ? ' is-done' : ''}`}>
          <TaskTick done={finished} busy={Boolean(state.saving)} label={`${finished ? 'Not done after all' : 'Done'}: ${task.title}`} onToggle={() => run(task.id, () => setTaskDone(task, !finished))} />
          <div>
            <button type="button" className="task-card-title" onClick={() => setOpenId(task.id)}>{task.title}</button>
            <TaskMeta task={task} today={today} />
            {!finished ? <TaskSteps task={task} limit={6} busy={Boolean(state.saving)} onError={(error) => setState({ saving: '', error })} onMore={() => setOpenId(task.id)} /> : null}
            {!finished && task.details?.proof ? <p className="task-proof"><span>Done when</span> {task.details.proof}</p> : null}
          </div>
        </li>
      })}
      {rest.map((item) => <li key={item.key} className={`task-folio-card is-${item.kind}${item.done ? ' is-done' : ''}`}>
        {item.kind === 'study' && item.card.hubCardId ? <TaskTick done={item.done} busy={Boolean(page.savingId)} label={`${item.done ? 'Not done after all' : 'Card done'}: ${item.title}`} onToggle={() => page.tickStudy(item.card, null, !item.done)} />
          : item.kind === 'mail' ? <TaskTick done={false} busy={Boolean(state.saving)} label={`Done: ${item.title}`} onToggle={() => run(item.key, async () => { await saveAction(item.row, { status: 'done' }); mail.reload() })} />
            : <TaskTick done={item.done} />}
        <div>
          <Link className="task-card-title" to={item.href}>{item.title}</Link>
          <p className="task-meta"><span className="task-area" style={{ '--item-accent': item.tone }}>{item.source}</span>{item.when ? <span className={item.late ? 'task-late' : undefined}>{item.when}</span> : null}{item.extra ? <span>{item.extra}</span> : null}</p>
          {item.kind === 'study' && !item.done && item.card.steps?.length ? <ol className="task-steps">{item.card.steps.slice(0, 5).map((step) => <li key={step.id} className={step.done ? 'is-done' : undefined}>
            <TaskTick done={step.done} size="small" busy={Boolean(page.savingId)} label={`${step.done ? 'Untick' : 'Tick'}: ${step.text}`} onToggle={step.id ? () => page.tickStudy(item.card, step, !step.done) : undefined} />
            <span className="task-step-text">{step.text}</span>
          </li>)}</ol> : null}
        </div>
      </li>)}
    </ul> : null}
    {slipped || lateElsewhere.study || lateElsewhere.mail ? <p className="day-more">Also late: {[slipped ? `${slipped} of your ${slipped === 1 ? 'task' : 'tasks'} slipped more than two days` : '', lateElsewhere.study ? `${lateElsewhere.study} Study hub ${lateElsewhere.study === 1 ? 'card' : 'cards'}` : '', lateElsewhere.mail ? `${lateElsewhere.mail} ${lateElsewhere.mail === 1 ? 'thing' : 'things'} waiting on you` : ''].filter(Boolean).join(', ')}. <Link to="/tasks">See them in Tasks</Link></p> : null}
    {hours.planned ? <p className="task-folio-sum"><span>the day so far</span><i aria-hidden="true" /><b>{sumText(hours.done, hours.planned)}</b></p> : null}
    <form className="task-folio-add" onSubmit={add}>
      <span className="task-tick is-ghost" aria-hidden="true" />
      <input value={adding} onChange={(event) => setAdding(event.target.value)} placeholder={`Add a task for ${dayName} and press Enter`} maxLength={300} aria-label={`A new task for ${dayName}`} disabled={state.saving === 'add'} />
    </form>
    {state.error ? <p className="day-warn" role="alert">{state.error}</p> : null}
    {opened ? <TaskDialog task={opened} today={today} onClose={() => setOpenId('')} /> : null}
  </section>
}
