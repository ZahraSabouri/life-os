import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { addDays, calendarArea, calendarDisplay, filterCalendarItems, formatCalendarDay, isComplete, todayGroups } from '../lib/calendar.js'
import { londonDateTime, isDateKey } from '../../../shared/calendar.js'
import { buildDay, daysAway, noteTitle, parsePlan } from '../lib/day.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { useDay, useLondonClock } from '../lib/useDay.js'
import { poemForDate } from '../lib/poems.js'
import CalendarItems, { CalendarStatus } from './CalendarItems.jsx'

const pounds = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: pence % 100 ? 2 : 0 }).format(pence / 100)
const hours = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} h`
const count = (value, one, many = `${one}s`) => `${value} ${value === 1 ? one : many}`
const MEAL_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }

function Steps({ card, limit = 6 }) {
  if (!card.steps.length) return card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null
  const shown = card.steps.slice(0, limit)
  return <>
    <ul className="day-steps">
      {shown.map((step, index) => <li key={index} className={step.done ? 'is-done' : undefined}><span className="day-tick" aria-hidden="true" />{step.text}<span className="visually-hidden">{step.done ? ' (done)' : ''}</span></li>)}
    </ul>
    {card.steps.length > limit ? <p className="day-more">and {card.steps.length - limit} more in the Study hub</p> : null}
    {card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null}
  </>
}

function Stop({ stop, onDone, onRemove, busy }) {
  const area = calendarArea(stop.area)
  const card = stop.card
  return <li className={`day-stop${stop.when ? ` is-${stop.when}` : ''}${card ? ' has-card' : ''}`} data-kind={stop.kind} style={{ '--item-accent': area.tone }}>
    <div className="day-stop-time">{stop.start ? <span>{stop.start}</span> : null}{stop.end ? <small>{stop.end}</small> : null}</div>
    <div className="day-stop-mark" aria-hidden="true" />
    <div className="day-stop-body">
      <Link className="day-stop-title" to={stop.href}>{card?.title ?? stop.title}</Link>
      <p className="day-stop-meta">
        <span>{area.label}</span>
        {card?.moduleCode || card?.module ? <span>{card.moduleCode || card.module}</span> : null}
        {stop.place ? <span>{stop.place}</span> : null}
        {stop.when === 'now' ? <span className="day-now-tag">Now</span> : null}
        {stop.choice === 'maybe' ? <span>Maybe</span> : null}
        {card?.done ? <span className="day-done-tag">Done</span> : null}
      </p>
      {card && !card.done && (card.steps.length || card.doneWhen) ? <div className="day-card">
        <Steps card={card} />
        <p className="day-card-foot">{card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps done` : null}{card.steps.length && card.hours ? ' · ' : null}{card.hours ? hours(card.hours) : null} <Link to={card.href}>Open in Study hub</Link></p>
      </div> : null}
      {stop.entry ? <p className="day-stop-actions">
        {stop.entry.task ? <button type="button" onClick={() => onDone(stop)} disabled={busy}>Done</button> : null}
        <button type="button" onClick={() => onRemove(stop)} disabled={busy}>Take off the day</button>
      </p> : null}
    </div>
  </li>
}

function NowLine({ clock, label = 'Now' }) {
  return <li className="day-now-line"><span>{clock}</span><i aria-hidden="true" /><b>{label}</b></li>
}

function Panel({ title, href, open, children, unavailable }) {
  return <section className="day-panel" aria-label={title}>
    <header><h2>{title}</h2><Link to={href}>{open}</Link></header>
    {unavailable ? <p className="day-unavailable">{unavailable}</p> : children}
  </section>
}

function StudyPanel({ study, label = 'Today' }) {
  const pending = study.today.filter((card) => !card.done)
  return <>
    {study.next ? <div className="day-figure">
      <strong>{study.next.days === 0 ? 'Today' : study.next.days}</strong>
      <p><b>{study.next.days === 0 ? study.next.title : `${study.next.days === 1 ? 'day' : 'days'} to ${study.next.title}`}</b><span>{formatCalendarDay(study.next.date, { weekday: 'long' })}{study.next.weight ? ` · ${study.next.weight}% of the module` : ''}</span></p>
    </div> : <p className="day-quiet">No dated test or deadline ahead.</p>}
    {study.progress.total ? <div className="day-progress" role="img" aria-label={`${study.progress.done} of ${study.progress.total} cards done`}>
      <span style={{ width: `${Math.round((study.progress.done / study.progress.total) * 100)}%` }} />
      <p>{study.progress.done} of {count(study.progress.total, 'card')} {study.next ? 'before it' : 'planned'} done</p>
    </div> : null}
    <h3>{label}{study.today.length ? ` · ${count(study.today.length, 'card')}${study.hoursToday ? `, ${hours(study.hoursToday)}` : ''}` : ''}</h3>
    {study.today.length ? <ul className="day-list">
      {study.today.map((card) => <li key={card.id} className={card.done ? 'is-done' : undefined}>
        <Link to={card.href}>{card.title}</Link>
        <small>{card.done ? 'Done' : card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps` : card.hours ? hours(card.hours) : 'Planned'}</small>
      </li>)}
    </ul> : <p className="day-quiet">No study card is due {label === 'Today' ? 'today' : 'that day'}.{study.running.length ? '' : ' Add one in the Study hub.'}</p>}
    {!pending.length && study.today.length ? <p className="day-quiet">Everything for {label === 'Today' ? 'today' : 'that day'} is done.</p> : null}
    {study.running.length ? <><h3>This week</h3><ul className="day-list">{study.running.map((card) => <li key={card.id}><Link to={card.href}>{card.title}</Link><small>due {formatCalendarDay(card.due)}</small></li>)}</ul></> : null}
    {study.overdue.count ? <><h3 className="day-warn">{count(study.overdue.count, 'card')} past {study.overdue.count === 1 ? 'its' : 'their'} date</h3><ul className="day-list">{study.overdue.cards.map((card) => <li key={card.id}><Link to={card.href}>{card.title}</Link><small>{formatCalendarDay(card.due)}</small></li>)}</ul></> : null}
    {study.undated.length ? <p className="day-quiet">No date yet: {study.undated.join('; ')}.</p> : null}
  </>
}

function JobsPanel({ jobs }) {
  return <>
    <div className="day-figure">
      <strong>{jobs.dueToday || jobs.due.filter((job) => !job.applied).length}</strong>
      <p><b>{jobs.dueToday ? `to apply for today` : `to apply for this week`}</b><span>{count(jobs.counts.toApply, 'saved job')} still to apply for{jobs.counts.applied ? ` · ${jobs.counts.applied} applied` : ''}</span></p>
    </div>
    <h3>Closing in the next seven days</h3>
    {jobs.due.length ? <ul className="day-list">
      {jobs.due.map((job) => <li key={job.id} className={job.applied ? 'is-done' : undefined}>
        <Link to={job.href}>{job.role}<em> · {job.company}</em></Link>
        <small className={job.days === 0 && !job.applied ? 'day-warn' : undefined}>{job.applied ? 'Applied' : job.days === 0 ? 'Closes today' : `${formatCalendarDay(job.deadline, { weekday: 'short' })}`}{job.uncertain ? ' · check it is still open' : ''}</small>
      </li>)}
    </ul> : <p className="day-quiet">No saved job closes in the next seven days.</p>}
    {jobs.interviews.length ? <><h3>Interviews</h3><ul className="day-list">{jobs.interviews.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link>{job.nextStep ? <small>{job.nextStep}</small> : null}</li>)}</ul></> : null}
    {jobs.followUps.length ? <><h3>Follow up</h3><ul className="day-list">{jobs.followUps.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link><small>{daysAway(job.days)}</small></li>)}</ul></> : null}
    {jobs.counts.missed ? <p className="day-quiet">{count(jobs.counts.missed, 'saved job')} passed {jobs.counts.missed === 1 ? 'its' : 'their'} closing date without an application. Archive or check them in JobMap.</p> : null}
  </>
}

function HomePanel({ home, today = true }) {
  return <>
    <h3>Shopping</h3>
    {home.lists.length ? home.lists.slice(0, 2).map((list) => <div className="day-shopping" key={list.id}>
      <p className="day-shopping-name"><b>{list.name}</b><span>{[list.shop, list.date ? formatCalendarDay(list.date) : '', count(list.items.length, 'thing') + ' to buy'].filter(Boolean).join(' · ')}</span></p>
      <ul className="day-steps day-items">
        {list.items.slice(0, 10).map((item) => <li key={item.id}><span className="day-tick" aria-hidden="true" />{item.name}{item.quantity && !(item.quantity === 1 && item.unit === 'item') ? <small> {item.quantity}{item.unit && item.unit !== 'item' ? ` ${item.unit}` : ''}</small> : null}{item.optional ? <small> if there is money left</small> : null}</li>)}
      </ul>
      {list.items.length > 10 ? <p className="day-more">and {list.items.length - 10} more in Budget</p> : null}
    </div>) : <p className="day-quiet">No shopping list yet. <Link to="/budget">Make one in Budget</Link> (Shopping) and it shows here.</p>}
    <h3>Eating {today ? 'today' : 'that day'}</h3>
    {home.meals.length ? <ul className="day-list">{home.meals.map((meal) => <li key={meal.id} className={meal.cooked ? 'is-done' : undefined}><span>{meal.name}</span><small>{MEAL_NAMES[meal.slot] ?? 'Meal'}{meal.cooked ? ' · eaten' : ''}</small></li>)}</ul>
      : <p className="day-quiet">Nothing planned to eat.{home.recipes ? '' : ' No recipes are saved yet.'}</p>}
    <dl className="day-facts">
      <div><dt>At home</dt><dd>{home.stock.total ? <>{count(home.stock.total, 'thing')}<small>{home.stock.places.map((place) => `${place.place} ${place.count}`).join(' · ')}</small></> : 'Nothing recorded'}</dd></div>
      <div><dt>{home.budget ? formatCalendarDay(`${home.budget.month}-01`, { weekday: undefined, day: undefined, month: 'long' }) : 'This month'}</dt><dd>{home.budget ? <>{pounds(home.budget.totalPence)} budget<small><Link to="/budget">See what is left in My month</Link></small></> : 'No budget set'}</dd></div>
    </dl>
  </>
}

function NotesPanel({ notes }) {
  if (!notes.length) return <p className="day-quiet">No notes were written this day. Choose Note in the line at the top; it is kept here and in the Ledger.</p>
  return <ul className="day-notes">{notes.map((note) => <li key={note.id}><time>{note.at}</time><p>{note.body || note.title}</p></li>)}</ul>
}

const ADD_KIND_KEY = 'life-os.today-add'
function savedKind() { try { return window.localStorage.getItem(ADD_KIND_KEY) === 'note' ? 'note' : 'plan' } catch { return 'plan' } }

export default function TodayView() {
  const today = useLondonToday()
  const clock = useLondonClock()
  const [params, setParams] = useSearchParams()
  // Today by default; any other day when the address names one (?date=2026-10-13).
  const date = isDateKey(params.get('date') ?? '') ? params.get('date') : today
  const isToday = date === today
  const near = date >= addDays(today, -350) && date <= addDays(today, 14)
  const calendar = useCalendar(near ? addDays(today, -350) : addDays(date, -7), near ? addDays(today, 14) : addDays(date, 14))
  const day = useDay(date)
  const [kind, setKind] = useState(savedKind)
  const [note, setNote] = useState('')
  const [noteState, setNoteState] = useState('')
  const [savingId, setSavingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [showAllWeek, setShowAllWeek] = useState(false)
  const items = useMemo(() => filterCalendarItems(calendar.items, { choices: calendar.choices }), [calendar.items, calendar.choices])
  const groups = useMemo(() => todayGroups(items, today), [items, today])
  const open = useMemo(() => items.filter((item) => !isComplete(item)), [items])
  const path = useMemo(() => buildDay({ items: open, day: day.data?.date === date ? day.data : null, date, now: isToday ? clock : '' }), [open, day.data, date, isToday, clock])
  const adding = kind === 'note' && isToday ? 'note' : 'plan'
  const plan = useMemo(() => parsePlan(note), [note])
  const dayName = isToday ? 'today' : formatCalendarDay(date, { weekday: 'long' })
  function show(next) { setParams(next === today ? {} : { date: next }) }
  function choose(next) { setKind(next); try { window.localStorage.setItem(ADD_KIND_KEY, next) } catch { /* kept for this visit */ } }
  const dailyPoem = useMemo(() => poemForDate(new Date()), [today])
  const attention = showAllAttention ? groups.attention : groups.attention.slice(0, 6)
  const unavailable = (id) => day.data?.sources.find((source) => source.id === id && source.status === 'unavailable')?.error
  const loadingDay = day.loading && !day.data

  // One line adds to the day: a plan (with a clock time if one is typed, otherwise for any time
  // that day) or a note. A plan is an ordinary Life OS entry, so it is also on the calendar.
  async function saveLine(event) {
    event.preventDefault()
    const body = note.trim()
    if (!body || noteState === 'saving') return
    let entry
    if (adding === 'note') entry = { type: 'note', title: noteTitle(body), details: { body } }
    else if (!plan.title) { setActionError('Say what it is as well as when, for example “17:30 library”.'); return }
    else if (plan.start) {
      const start = londonDateTime(date, plan.start)
      if (!start) { setActionError('That clock time does not exist on this day (the clocks change). Try another time.'); return }
      entry = { type: 'event', title: plan.title, start_at: start, ...(plan.end && londonDateTime(date, plan.end) ? { end_at: londonDateTime(date, plan.end) } : {}) }
    } else entry = { type: 'task', title: plan.title, start_at: date, all_day: true }
    setNoteState('saving')
    setActionError('')
    try {
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(entry) })
      setNote('')
      if (adding === 'note') day.refetch()
      else calendar.refetch()
      setNoteState('saved')
      window.setTimeout(() => setNoteState(''), 1500)
    } catch (error) {
      setActionError(`Not saved: ${error.message}`)
      setNoteState('')
    }
  }

  // Ticking off or taking off something she added herself. The entry is kept; only its status changes.
  async function setEntryStatus(stop, status) {
    if (savingId || !stop.entry) return
    setSavingId(stop.key)
    setActionError('')
    try {
      await apiFetch(`/api/entries/${encodeURIComponent(stop.entry.id)}`, { method: 'PATCH', body: JSON.stringify({ status, ...(stop.entry.revision === undefined ? {} : { revision: stop.entry.revision }) }) })
      calendar.refetch()
    } catch (error) { setActionError(`Could not change “${stop.title}”: ${error.message}`) }
    finally { setSavingId('') }
  }
  const stopProps = { onDone: (stop) => setEntryStatus(stop, 'done'), onRemove: (stop) => setEntryStatus(stop, 'cancelled'), busy: Boolean(savingId) }

  async function completeTask(item) {
    if (savingId || item.area !== 'core' || item.meta?.type !== 'task' || !item.meta?.entryId) return
    setSavingId(item.id)
    setActionError('')
    try {
      await apiFetch(`/api/entries/${encodeURIComponent(item.meta.entryId)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'done', ...(item.meta.revision === undefined ? {} : { revision: item.meta.revision }) })
      })
      calendar.refetch()
    } catch (error) { setActionError(`Could not mark the task done: ${error.message}`) }
    finally { setSavingId('') }
  }

  const listProps = { calendar, onComplete: completeTask, savingId }
  return <section className="today-layout unified-today day-page" aria-label={isToday ? 'Today' : `The day of ${formatCalendarDay(date, { weekday: 'long' })}`}>
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>{isToday ? 'Today' : formatCalendarDay(date, { weekday: 'long', month: undefined, day: undefined })}</h1><span /></div>
      <div className="today-date-stack"><time dateTime={date}>{formatCalendarDay(date, { weekday: 'long', year: 'numeric' })}</time><p lang="fa" dir="rtl">{new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`))}</p></div>
    </header>
    <nav className="day-nav" aria-label="Choose a day">
      <button type="button" onClick={() => show(addDays(date, -1))} aria-label="The day before">‹ {formatCalendarDay(addDays(date, -1), { weekday: 'short', month: undefined })}</button>
      <button type="button" onClick={() => show(today)} aria-pressed={isToday}>Today</button>
      <button type="button" onClick={() => show(addDays(date, 1))} aria-label="The day after">{formatCalendarDay(addDays(date, 1), { weekday: 'short', month: undefined })} ›</button>
      <label>Go to<input type="date" value={date} onChange={(event) => { if (isDateKey(event.target.value)) show(event.target.value) }} /></label>
    </nav>

    <form className="day-note" onSubmit={saveLine}>
      <div className="day-add-kind" role="group" aria-label="What to add">
        <button type="button" aria-pressed={adding === 'plan'} onClick={() => choose('plan')}>Plan</button>
        <button type="button" aria-pressed={adding === 'note'} onClick={() => choose('note')} disabled={!isToday} title={isToday ? undefined : 'A note belongs to the day it is written'}>Note</button>
      </div>
      <input id="day-note-input" value={note} onChange={(event) => setNote(event.target.value)} aria-label={adding === 'note' ? 'A note for today' : `Something to do ${dayName}`}
        placeholder={adding === 'note' ? 'Write a note for today and press Enter' : `Add to ${dayName}: “17:30 library”, “Lidl”, “dinner at 8pm”`} autoComplete="off" maxLength={2000} />
      <button type="submit" disabled={!note.trim() || noteState === 'saving'}>{noteState === 'saving' ? 'Saving…' : noteState === 'saved' ? 'Saved' : adding === 'note' ? 'Keep' : 'Add'}</button>
      {note.trim() ? <p className="day-add-hint">{adding === 'note' ? 'A note, kept on today and in the Ledger.'
        : !plan.title ? 'Say what it is as well as when.'
          : plan.start ? `“${plan.title}” at ${plan.start}${plan.end ? ` to ${plan.end}` : ''}, ${dayName}. It goes on the calendar too.`
            : `“${plan.title}”, any time ${dayName}. Type a time (17:30, 5pm) to place it.`}</p> : null}
    </form>
    <CalendarStatus calendar={calendar} />
    {day.error ? <p className="form-error" role="alert">The day's details could not be loaded: {day.error} <button type="button" className="day-retry" onClick={day.refetch}>Try again</button></p> : null}
    {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}

    <div className="day-grid">
      <section className="day-path" aria-labelledby="day-path-heading">
        <header><h2 id="day-path-heading">{isToday ? 'Your day' : 'The day'}</h2><span>{isToday ? clock : daysAway(Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000))}</span></header>
        {calendar.loading || loadingDay ? <p className="day-quiet" role="status">Putting your day in order…</p> : <>
          {path.stops.length ? <ol className="day-stops">
            {path.stops.flatMap((stop, index) => [
              index === path.nowIndex && index > 0 && stop.when !== 'now' ? <NowLine key="now" clock={clock} /> : null,
              <Stop key={stop.key} stop={stop} {...stopProps} />,
            ])}
            {path.nowIndex === -1 ? <NowLine key="now" clock={clock} label="Now · nothing else has a time today" /> : null}
          </ol>
            : <p className="day-quiet">Nothing has a time {isToday ? 'today' : 'that day'}. Add a plan in the line above.</p>}
          {path.anytime.length ? <>
            <h3>Any time {isToday ? 'today' : 'that day'}</h3>
            <ol className="day-stops day-anytime">{path.anytime.map((entry) => <Stop key={entry.key} stop={{ ...entry, start: '', end: '', kind: entry.kind ?? 'plan' }} {...stopProps} />)}</ol>
          </> : null}
          {path.also.length ? <>
            <h3>Also {isToday ? 'today' : 'that day'}</h3>
            <ul className="day-also">{path.also.map((entry) => <li key={entry.key} style={{ '--item-accent': calendarArea(entry.area).tone }}><Link to={entry.href}>{entry.title}</Link><small>{calendarArea(entry.area).label}</small></li>)}</ul>
          </> : null}
        </>}
      </section>

      <div className="day-panels">
        <div className="day-panel-column">
          <Panel title="Study" href="/study" open="Open Study hub" unavailable={unavailable('study')}>
            {day.data?.study ? <StudyPanel study={day.data.study} label={isToday ? 'Today' : 'That day'} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'No semester is open.'}</p>}
          </Panel>
          <Panel title="Home" href="/budget" open="Open Budget" unavailable={unavailable('home')}>
            {day.data?.home ? <HomePanel home={day.data.home} today={isToday} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'Nothing to show.'}</p>}
          </Panel>
        </div>
        <div className="day-panel-column">
          <Panel title="Jobs" href="/jobmap" open="Open JobMap" unavailable={unavailable('jobs')}>
            {day.data?.jobs ? <JobsPanel jobs={day.data.jobs} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'Nothing to show.'}</p>}
          </Panel>
          <Panel title="Notes" href="/ledger" open="Open Ledger" unavailable={unavailable('notes')}>
            {day.data?.notes ? <NotesPanel notes={day.data.notes} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'Nothing to show.'}</p>}
          </Panel>
        </div>
      </div>
    </div>

    {isToday ? <div className="day-later">
      <section className="today-cross-area-panel" aria-labelledby="today-attention-heading">
        <div className="today-panel-title"><h2 id="today-attention-heading">Needs attention</h2><span>{calendarDisplay(calendar, { count: groups.attention.length }).countLabel}</span></div>
        <p className="today-section-note">Unfinished work from the past 350 days, and follow-ups, deadlines and renewals in the next fortnight.</p>
        {!calendar.loading ? <CalendarItems items={attention} showDate {...listProps} empty="No dated items need attention." /> : null}
        {!showAllAttention && groups.attention.length > 6 ? <button className="ghost-pill compact-pill" type="button" onClick={() => setShowAllAttention(true)}>Show {groups.attention.length - 6} more</button> : null}
      </section>
      <section className="today-cross-area-panel" aria-labelledby="today-week-heading">
        <div className="today-panel-title"><h2 id="today-week-heading">Next six days</h2><span>{calendarDisplay(calendar, { count: groups.week.length }).countLabel}</span></div>
        {!calendar.loading ? <CalendarItems items={showAllWeek ? groups.week : groups.week.slice(0, 6)} showDate {...listProps} empty="No further dated plans in the coming week." /> : null}
        {!showAllWeek && groups.week.length > 6 ? <button className="ghost-pill compact-pill" type="button" onClick={() => setShowAllWeek(true)}>Show {groups.week.length - 6} more</button> : null}
      </section>
    </div> : null}
    <div className="today-page-controls"><Link className="ghost-pill compact-pill" to={isToday ? '/calendar' : `/calendar?date=${date}`}>Open calendar</Link><Link className="ghost-pill compact-pill" to="/ledger">Recent entries</Link><button className="ghost-pill compact-pill" type="button" onClick={() => { calendar.refetch(); day.refetch() }} disabled={calendar.loading}>Refresh</button></div>
    <p className="today-section-note">Cardiff events show your saved plans and maybes from this browser. <Link to="/cardiff-life">Manage choices</Link>.</p>
    <footer className="ledger-poem" aria-label="Poem of the day"><div lang="fa" dir="rtl">{dailyPoem.lines.map((line, index) => <p key={index}>{line}</p>)}</div><small lang="fa" dir="rtl">{dailyPoem.poet}</small></footer>
  </section>
}
