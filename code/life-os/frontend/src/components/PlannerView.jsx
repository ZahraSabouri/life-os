// The week laid out, for planning: seven days side by side with everything dated in them
// (classes, study blocks, job time, her own plans, deadlines). Her own plans can be added to a
// day, ticked, taken off, or moved to another day by dragging or from their menu. Study blocks
// belong to the Study hub's own planner; here they are shown and lead there.
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { dateKey, isDateKey, londonDateTime } from '../../../shared/calendar.js'
import { sayWeekdays } from '../../../shared/routines.js'
import { apiFetch } from '../lib/api.js'
import { addDays, calendarArea, filterCalendarItems, formatCalendarDay, isComplete, itemOverlaps } from '../lib/calendar.js'
import { clockOf, parsePlan } from '../lib/day.js'
import { movePlan, removeEntry, setPlanStatus, stopRepeating } from '../lib/plans.js'
import EntryEditor from './EntryEditor.jsx'
import ChangePlan from './ChangePlan.jsx'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { useDayPage } from '../lib/useDayPage.js'
import { CalendarStatus } from './CalendarItems.jsx'
import { AddLine, roomName } from './DayParts.jsx'

const mondayOf = (date) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7))
const span = (minutes) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}` : `${minutes} min`)
const minutesOf = (item) => (item.end && !item.all_day ? Math.max(0, Math.round((Date.parse(item.end) - Date.parse(item.start)) / 60_000)) : 0)
const isOwn = (item) => item.meta?.source === 'core' && Boolean(item.meta?.entryId)
const ownEntry = (item) => ({ id: item.meta.entryId, revision: item.meta.revision, ...(item.meta.routine ? { routine: item.meta.routine } : {}) })

function Chip({ item, days, date, busy, onStatus, onMove, onChange }) {
  const [open, setOpen] = useState(false)
  const area = calendarArea(item.area)
  const own = isOwn(item)
  const done = isComplete(item)
  const tickable = own && ['task', 'time-block'].includes(item.meta.type)
  const label = item.meta?.room ? roomName(item.meta.room) || area.label : area.label
  return <li className={`planner-chip${done ? ' is-done' : ''}${own ? ' is-own' : ''}`} style={{ '--item-accent': area.tone }}
    draggable={own && !done} onDragStart={(event) => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move' }}>
    <Link to={own ? `/today?date=${date}` : item.href || `/today?date=${date}`} title={`${item.title} · ${label}`}>
      {item.all_day ? null : <time>{clockOf(item.start)}</time>}
      <span>{item.title}</span>
    </Link>
    {own && !done ? <button type="button" className="planner-more" aria-expanded={open} aria-label={`What to do with ${item.title}`} onClick={() => setOpen((value) => !value)}>⋯</button> : null}
    {item.meta?.routine ? <small className="planner-repeats">repeats</small> : null}
    {open && own && !done ? <div className="planner-actions">
      {tickable ? <button type="button" disabled={busy} onClick={() => onStatus(item, 'done')}>Done</button> : null}
      <button type="button" disabled={busy} onClick={() => { setOpen(false); onChange(item) }}>Change</button>
      <button type="button" disabled={busy} onClick={() => onStatus(item, 'cancelled')}>Take off</button>
      <label>Move to<select value="" disabled={busy} onChange={(event) => { if (event.target.value) onMove(item, event.target.value) }}>
        <option value="">…</option>
        {days.filter((day) => day !== date).map((day) => <option key={day} value={day}>{formatCalendarDay(day, { weekday: 'short', month: undefined })}</option>)}
      </select></label>
    </div> : null}
  </li>
}

function DayColumn({ date, today, items, days, busy, onStatus, onMove, onAdd, onChange }) {
  const [text, setText] = useState('')
  const [over, setOver] = useState(false)
  const timed = items.filter((item) => !item.all_day).sort((a, b) => String(a.start).localeCompare(String(b.start)))
  const anytime = items.filter((item) => item.all_day)
  const study = timed.filter((item) => item.meta?.type === 'study-block').reduce((sum, item) => sum + minutesOf(item), 0)
  const jobs = timed.filter((item) => item.area === 'career' && item.meta?.type === 'time-block').reduce((sum, item) => sum + minutesOf(item), 0)
  function add(event) {
    event.preventDefault()
    if (!text.trim()) return
    onAdd(text, date).then((saved) => { if (saved) setText('') })
  }
  return <section className={`planner-day${date === today ? ' is-today' : ''}${date < today ? ' is-past' : ''}${over ? ' is-over' : ''}`} aria-label={formatCalendarDay(date, { weekday: 'long' })}
    onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setOver(true) }} onDragLeave={() => setOver(false)}
    onDrop={(event) => { event.preventDefault(); setOver(false); const id = event.dataTransfer.getData('text/plain'); if (id) onMove(id, date) }}>
    <header>
      <h2><Link to={`/today?date=${date}`}>{formatCalendarDay(date, { weekday: 'short', month: undefined })}</Link>{date === today ? <small> today</small> : null}</h2>
      <p>{[study ? `Study ${span(study)}` : '', jobs ? `Jobs ${span(jobs)}` : ''].filter(Boolean).join(' · ') || ' '}</p>
    </header>
    {timed.length ? <ul className="planner-list">{timed.map((item) => <Chip key={item.id} item={item} days={days} date={date} busy={busy} onStatus={onStatus} onMove={onMove} onChange={onChange} />)}</ul> : null}
    {anytime.length ? <><h3>Any time, and due</h3><ul className="planner-list">{anytime.map((item) => <Chip key={item.id} item={item} days={days} date={date} busy={busy} onStatus={onStatus} onMove={onMove} onChange={onChange} />)}</ul></> : null}
    {!items.length ? <p className="planner-empty">Nothing yet.</p> : null}
    <form className="planner-add" onSubmit={add}>
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="+ 17:30 library" aria-label={`Add a plan to ${formatCalendarDay(date, { weekday: 'long' })}`} maxLength={300} />
    </form>
  </section>
}

// Her repeating plans: what comes round, when, and the way to stop one.
function RepeatingPlans({ today, turn, onChanged }) {
  const [state, setState] = useState({ rows: [], loading: true, error: '' })
  const [sure, setSure] = useState('')
  const [editing, setEditing] = useState('')
  useEffect(() => {
    let off = false
    apiFetch('/api/entries?limit=5000').then((entries) => { if (!off) setState({ rows: entries.filter((entry) => entry.type === 'repeat' && !entry.archived), loading: false, error: '' }) })
      .catch((failure) => { if (!off) setState({ rows: [], loading: false, error: failure.message }) })
    return () => { off = true }
  }, [turn])
  const act = (work) => work.then(onChanged).catch((failure) => setState((current) => ({ ...current, error: failure.message })))
  const running = state.rows.filter((row) => !['cancelled', 'stopped'].includes(String(row.status ?? '').toLowerCase()) && (!row.end_at || row.end_at.slice(0, 10) >= today))
  const ended = state.rows.length - running.length
  return <section className="day-panel planner-repeating" aria-labelledby="planner-repeating-heading">
    <header><h2 id="planner-repeating-heading">Repeating plans</h2></header>
    {state.error ? <p className="day-quiet day-warn" role="alert">{state.error}</p> : null}
    {running.length ? <ul className="day-list">
      {running.map((row) => {
        const details = row.details ?? {}
        const from = String(row.start_at).slice(0, 10)
        const until = row.end_at ? String(row.end_at).slice(0, 10) : ''
        if (editing === row.id) return <li key={row.id}><EntryEditor entry={row} onCancel={() => setEditing('')} onSaved={() => { setEditing(''); onChanged() }} /></li>
        return <li key={row.id}>
          <span><b>{row.title}</b> {sayWeekdays(details.weekdays)}{details.start ? `, ${details.start}${details.end ? ` to ${details.end}` : ''}` : ', any time'}</span>
          <small>{from > today ? `from ${formatCalendarDay(from)}` : `since ${formatCalendarDay(from)}`}{until ? ` until ${formatCalendarDay(until)}` : ', with no end'}{details.area ? ` · ${roomName(details.area) || details.area}` : ''}</small>
          <p className="day-stop-actions">
            <button type="button" onClick={() => { setEditing(row.id); setSure('') }}>Change</button>
            {from <= today ? <button type="button" onClick={() => act(stopRepeating(row.id, today))}>Stop after today</button> : null}
            {sure === row.id ? <button type="button" onClick={() => { setSure(''); act(removeEntry(row.id)) }} onBlur={() => setSure('')}>Remove for good</button>
              : <button type="button" onClick={() => setSure(row.id)}>Remove</button>}
          </p>
        </li>
      })}
    </ul> : <p className="day-quiet">{state.loading ? 'Loading…' : 'Nothing comes round yet. In the line at the top, choose Plan and then “repeat”: every day, weekdays, one weekday, or the days you choose.'}</p>}
    {ended ? <p className="day-more">{ended} ended or stopped. The days already ticked stay on the calendar.</p> : null}
  </section>
}

export default function PlannerView() {
  const today = useLondonToday()
  const [params, setParams] = useSearchParams()
  const asked = params.get('week')
  const from = mondayOf(isDateKey(asked) ? asked : today)
  const to = addDays(from, 6)
  const thisWeek = from === mondayOf(today)
  const days = useMemo(() => Array.from({ length: 7 }, (_value, index) => addDays(from, index)), [from])
  const calendar = useCalendar(from, to)
  const [turn, setTurn] = useState(0)
  const [changing, setChanging] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const refetch = () => { calendar.refetch(); setTurn((value) => value + 1) }
  // The line that adds a plan, a note or something to buy, with "repeat"; for today, or the week's Monday.
  const page = useDayPage(thisWeek ? today : from, { onSaved: refetch })
  const items = useMemo(() => filterCalendarItems(calendar.items, { choices: calendar.choices }), [calendar.items, calendar.choices])
  const show = (monday) => setParams(monday === mondayOf(today) ? {} : { week: monday })

  async function run(work) {
    if (busy) return false
    setBusy(true); setError('')
    try { await work(); refetch(); return true } catch (failure) { setError(failure.message); return false } finally { setBusy(false) }
  }
  const onStatus = (item, status) => run(() => setPlanStatus({ entry: ownEntry(item), title: item.title }, status))
  const onMove = (itemOrId, day) => {
    const item = typeof itemOrId === 'string' ? items.find((row) => row.id === itemOrId) : itemOrId
    if (!item || !isOwn(item)) return undefined
    const on = item.all_day ? String(item.start).slice(0, 10) : dateKey(item.start)
    if (on === day) return undefined
    return run(() => movePlan(item, day))
  }
  const onAdd = (text, day) => run(() => {
    const plan = parsePlan(text)
    if (!plan.title) throw new Error('Say what it is as well as when, for example “17:30 library”.')
    if (!plan.start) return apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'task', title: plan.title, start_at: day, all_day: true, details: {} }) })
    const start = londonDateTime(day, plan.start)
    if (!start) throw new Error('That clock time does not exist on that day (the clocks change).')
    return apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'event', title: plan.title, start_at: start, ...(plan.end && londonDateTime(day, plan.end) ? { end_at: londonDateTime(day, plan.end) } : {}), details: {} }) })
  })

  return <section className="today-layout unified-today day-page planner-page" aria-label="The week, for planning">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Plan the week</h1><span /></div>
      <div className="today-date-stack"><time dateTime={from}>{formatCalendarDay(from, { weekday: 'long' })} to {formatCalendarDay(to, { weekday: 'long', year: 'numeric' })}</time></div>
    </header>
    <nav className="day-nav" aria-label="Choose a week">
      <button type="button" onClick={() => show(addDays(from, -7))}>‹ The week before</button>
      <button type="button" onClick={() => show(mondayOf(today))} aria-pressed={thisWeek}>This week</button>
      <button type="button" onClick={() => show(addDays(from, 7))}>The week after ›</button>
    </nav>
    <AddLine page={page} id="planner-add-input" />
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {calendar.error ? <p className="form-error" role="alert">The week could not be read: {calendar.error}</p> : null}
    <CalendarStatus calendar={calendar} />
    {changing ? <section className="day-panel planner-changing" aria-label={`Change ${changing.title}`}>
      <header><h2>Change: {changing.title}</h2></header>
      <ChangePlan entry={ownEntry(changing)} onCancel={() => setChanging(null)} onSaved={() => { setChanging(null); refetch() }} />
    </section> : null}
    <p className="planner-hint">Drag one of your own plans to another day, or use its ⋯ menu. Study blocks are moved in the <Link to="/study#/planner">Study hub’s planner</Link>.</p>
    <div className="planner-scroll">
      <div className="planner-week">
        {days.map((date) => <DayColumn key={date} date={date} today={today} days={days} busy={busy} onStatus={onStatus} onMove={onMove} onAdd={onAdd} onChange={setChanging}
          items={items.filter((item) => (item.all_day ? itemOverlaps(item, date, date) : dateKey(item.start) === date))} />)}
      </div>
    </div>
    <RepeatingPlans today={today} turn={turn} onChanged={refetch} />
    <div className="today-page-controls">
      <Link className="ghost-pill compact-pill" to="/today">Today</Link>
      <Link className="ghost-pill compact-pill" to={`/calendar?date=${from}`}>The month</Link>
      <Link className="ghost-pill compact-pill" to={thisWeek ? '/review' : `/review?week=${from}`}>Look back on this week</Link>
    </div>
  </section>
}
