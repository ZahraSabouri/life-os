import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { addDays, calendarArea, calendarDisplay, filterCalendarItems, formatCalendarDay, todayGroups } from '../lib/calendar.js'
import { buildDay, daysAway, noteTitle } from '../lib/day.js'
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

function Stop({ stop }) {
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

function StudyPanel({ study }) {
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
    <h3>Today{study.today.length ? ` · ${count(study.today.length, 'card')}${study.hoursToday ? `, ${hours(study.hoursToday)}` : ''}` : ''}</h3>
    {study.today.length ? <ul className="day-list">
      {study.today.map((card) => <li key={card.id} className={card.done ? 'is-done' : undefined}>
        <Link to={card.href}>{card.title}</Link>
        <small>{card.done ? 'Done' : card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps` : card.hours ? hours(card.hours) : 'Planned'}</small>
      </li>)}
    </ul> : <p className="day-quiet">No study card is due today.{study.running.length ? '' : ' Add one in the Study hub.'}</p>}
    {!pending.length && study.today.length ? <p className="day-quiet">Everything for today is done.</p> : null}
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

function HomePanel({ home }) {
  return <>
    <h3>Shopping</h3>
    {home.lists.length ? home.lists.slice(0, 2).map((list) => <div className="day-shopping" key={list.id}>
      <p className="day-shopping-name"><b>{list.name}</b><span>{[list.shop, list.date ? formatCalendarDay(list.date) : '', count(list.items.length, 'thing') + ' to buy'].filter(Boolean).join(' · ')}</span></p>
      <ul className="day-steps day-items">
        {list.items.slice(0, 10).map((item) => <li key={item.id}><span className="day-tick" aria-hidden="true" />{item.name}{item.quantity && !(item.quantity === 1 && item.unit === 'item') ? <small> {item.quantity}{item.unit && item.unit !== 'item' ? ` ${item.unit}` : ''}</small> : null}{item.optional ? <small> if there is money left</small> : null}</li>)}
      </ul>
      {list.items.length > 10 ? <p className="day-more">and {list.items.length - 10} more in Budget</p> : null}
    </div>) : <p className="day-quiet">No shopping list yet. <Link to="/budget">Make one in Budget</Link> (Shopping) and it shows here.</p>}
    <h3>Eating today</h3>
    {home.meals.length ? <ul className="day-list">{home.meals.map((meal) => <li key={meal.id} className={meal.cooked ? 'is-done' : undefined}><span>{meal.name}</span><small>{MEAL_NAMES[meal.slot] ?? 'Meal'}{meal.cooked ? ' · eaten' : ''}</small></li>)}</ul>
      : <p className="day-quiet">Nothing planned to eat today.{home.recipes ? '' : ' No recipes are saved yet.'}</p>}
    <dl className="day-facts">
      <div><dt>At home</dt><dd>{home.stock.total ? <>{count(home.stock.total, 'thing')}<small>{home.stock.places.map((place) => `${place.place} ${place.count}`).join(' · ')}</small></> : 'Nothing recorded'}</dd></div>
      <div><dt>{home.budget ? formatCalendarDay(`${home.budget.month}-01`, { weekday: undefined, day: undefined, month: 'long' }) : 'This month'}</dt><dd>{home.budget ? <>{pounds(home.budget.totalPence)} budget<small><Link to="/budget">See what is left in My month</Link></small></> : 'No budget set'}</dd></div>
    </dl>
  </>
}

function NotesPanel({ notes }) {
  if (!notes.length) return <p className="day-quiet">No notes today. Write one in the line at the top; it is kept here and in the Ledger.</p>
  return <ul className="day-notes">{notes.map((note) => <li key={note.id}><time>{note.at}</time><p>{note.body || note.title}</p></li>)}</ul>
}

export default function TodayView() {
  const today = useLondonToday()
  const clock = useLondonClock()
  const calendar = useCalendar(addDays(today, -350), addDays(today, 14))
  const day = useDay(today)
  const [note, setNote] = useState('')
  const [noteState, setNoteState] = useState('')
  const [savingId, setSavingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [showAllWeek, setShowAllWeek] = useState(false)
  const items = useMemo(() => filterCalendarItems(calendar.items, { choices: calendar.choices }), [calendar.items, calendar.choices])
  const groups = useMemo(() => todayGroups(items, today), [items, today])
  const path = useMemo(() => buildDay({ items: groups.today, day: day.data, date: today, now: clock }), [groups.today, day.data, today, clock])
  const dailyPoem = useMemo(() => poemForDate(new Date()), [today])
  const attention = showAllAttention ? groups.attention : groups.attention.slice(0, 6)
  const unavailable = (id) => day.data?.sources.find((source) => source.id === id && source.status === 'unavailable')?.error
  const loadingDay = day.loading && !day.data

  async function saveNote(event) {
    event.preventDefault()
    const body = note.trim()
    if (!body || noteState === 'saving') return
    setNoteState('saving')
    setActionError('')
    try {
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'note', title: noteTitle(body), details: { body } }) })
      setNote('')
      day.refetch()
      setNoteState('saved')
      window.setTimeout(() => setNoteState(''), 1500)
    } catch (error) {
      setActionError(`The note was not saved: ${error.message}`)
      setNoteState('')
    }
  }

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
  return <section className="today-layout unified-today day-page" aria-label="Today">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Today</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{formatCalendarDay(today, { weekday: 'long', year: 'numeric' })}</time><p lang="fa" dir="rtl">{new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p></div>
    </header>

    <form className="day-note" onSubmit={saveNote}>
      <label htmlFor="day-note-input">Note for today</label>
      <input id="day-note-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a note for today and press Enter" autoComplete="off" maxLength={2000} />
      <button type="submit" disabled={!note.trim() || noteState === 'saving'}>{noteState === 'saving' ? 'Saving…' : noteState === 'saved' ? 'Saved' : 'Keep'}</button>
    </form>
    <CalendarStatus calendar={calendar} />
    {day.error ? <p className="form-error" role="alert">The day's details could not be loaded: {day.error} <button type="button" className="day-retry" onClick={day.refetch}>Try again</button></p> : null}
    {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}

    <div className="day-grid">
      <section className="day-path" aria-labelledby="day-path-heading">
        <header><h2 id="day-path-heading">Your day</h2><span>{clock}</span></header>
        {calendar.loading || loadingDay ? <p className="day-quiet" role="status">Putting your day in order…</p> : <>
          {path.stops.length ? <ol className="day-stops">
            {path.stops.flatMap((stop, index) => [
              index === path.nowIndex && index > 0 && stop.when !== 'now' ? <NowLine key="now" clock={clock} /> : null,
              <Stop key={stop.key} stop={stop} />,
            ])}
            {path.nowIndex === -1 ? <NowLine key="now" clock={clock} label="Now · nothing else has a time today" /> : null}
          </ol>
            : <p className="day-quiet">Nothing has a time today.</p>}
          {path.anytime.length ? <>
            <h3>Any time today</h3>
            <ol className="day-stops day-anytime">{path.anytime.map((entry) => <Stop key={entry.key} stop={{ ...entry, start: '', end: '', kind: entry.kind ?? 'plan' }} />)}</ol>
          </> : null}
          {path.also.length ? <>
            <h3>Also today</h3>
            <ul className="day-also">{path.also.map((entry) => <li key={entry.key} style={{ '--item-accent': calendarArea(entry.area).tone }}><Link to={entry.href}>{entry.title}</Link><small>{calendarArea(entry.area).label}</small></li>)}</ul>
          </> : null}
        </>}
      </section>

      <div className="day-panels">
        <div className="day-panel-column">
          <Panel title="Study" href="/study" open="Open Study hub" unavailable={unavailable('study')}>
            {day.data?.study ? <StudyPanel study={day.data.study} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'No semester is open.'}</p>}
          </Panel>
          <Panel title="Home" href="/budget" open="Open Budget" unavailable={unavailable('home')}>
            {day.data?.home ? <HomePanel home={day.data.home} /> : <p className="day-quiet">{loadingDay ? 'Loading…' : 'Nothing to show.'}</p>}
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

    <div className="day-later">
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
    </div>
    <div className="today-page-controls"><Link className="ghost-pill compact-pill" to="/calendar">Open calendar</Link><Link className="ghost-pill compact-pill" to="/ledger">Recent entries</Link><button className="ghost-pill compact-pill" type="button" onClick={() => { calendar.refetch(); day.refetch() }} disabled={calendar.loading}>Refresh</button></div>
    <p className="today-section-note">Cardiff events show your saved plans and maybes from this browser. <Link to="/cardiff-life">Manage choices</Link>.</p>
    <footer className="ledger-poem" aria-label="Poem of the day"><div lang="fa" dir="rtl">{dailyPoem.lines.map((line, index) => <p key={index}>{line}</p>)}</div><small lang="fa" dir="rtl">{dailyPoem.poet}</small></footer>
  </section>
}
