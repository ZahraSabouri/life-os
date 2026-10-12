// The pieces a day is drawn with, shared by the Court, Today and the strip inside each part:
// the line that adds to the day, the day's path, and the Study, Jobs, Home and Notes panels.
import { Link } from 'react-router-dom'
import { calendarArea, formatCalendarDay } from '../lib/calendar.js'
import { daysAway } from '../lib/day.js'

export const pounds = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: pence % 100 ? 2 : 0 }).format(pence / 100)
export const hours = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} h`
export const count = (value, one, many = `${one}s`) => `${value} ${value === 1 ? one : many}`
const MEAL_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const ADD = {
  plan: { label: 'Plan', button: 'Add', placeholder: (day) => `Add to ${day}: “17:30 library”, “Lidl”, “dinner at 8pm”` },
  note: { label: 'Note', button: 'Keep', placeholder: () => 'Write a note for today and press Enter' },
  buy: { label: 'To buy', button: 'Add', placeholder: () => 'Something to buy: “eggs, rice, 2 kg onions”' },
}

// One line that adds a plan, a note or something to buy. A hint says what will be saved.
export function AddLine({ page, id = 'day-add-input' }) {
  const { line } = page
  return <form className="day-note" onSubmit={line.save}>
    <div className="day-add-kind" role="group" aria-label="What to add">
      {Object.entries(ADD).map(([kind, words]) => <button key={kind} type="button" aria-pressed={line.kind === kind} onClick={() => line.choose(kind)}
        disabled={kind === 'note' && !line.noteAllowed} title={kind === 'note' && !line.noteAllowed ? 'A note belongs to the day it is written' : undefined}>{words.label}</button>)}
    </div>
    <input id={id} value={line.text} onChange={(event) => line.setText(event.target.value)} aria-label={ADD[line.kind].label} placeholder={ADD[line.kind].placeholder(page.dayName)} autoComplete="off" maxLength={2000} />
    <button type="submit" disabled={!line.text.trim() || line.state === 'saving'}>{line.state === 'saving' ? 'Saving…' : line.state === 'saved' ? 'Saved' : ADD[line.kind].button}</button>
    {line.hint ? <p className="day-add-hint">{line.hint}</p> : null}
    {!line.hint && page.notice ? <p className="day-add-hint day-add-done" role="status">{page.notice}</p> : null}
    {page.error ? <p className="day-add-hint day-warn" role="alert">{page.error}</p> : null}
  </form>
}

function Steps({ card, limit = 6 }) {
  if (!card.steps.length) return card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null
  return <>
    <ul className="day-steps">
      {card.steps.slice(0, limit).map((step, index) => <li key={index} className={step.done ? 'is-done' : undefined}><span className="day-tick" aria-hidden="true" />{step.text}<span className="visually-hidden">{step.done ? ' (done)' : ''}</span></li>)}
    </ul>
    {card.steps.length > limit ? <p className="day-more">and {card.steps.length - limit} more in the Study hub</p> : null}
    {card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null}
  </>
}

function Stop({ stop, onDone, onRemove, busy, compact }) {
  const area = calendarArea(stop.area)
  const card = stop.card
  const detailed = card && !card.done && (card.steps.length || card.doneWhen)
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
        {compact && detailed ? <span>{card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps` : 'planned'}{card.hours ? ` · ${hours(card.hours)}` : ''}</span> : null}
      </p>
      {detailed && !compact ? <div className="day-card">
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

// The day in clock order, then what is for any time, then the all-day rest in one slim row.
export function DayPath({ page, compact = false }) {
  const { path, isToday, clock } = page
  const when = isToday ? 'today' : 'that day'
  if (page.loading) return <p className="day-quiet" role="status">Putting the day in order…</p>
  return <>
    {path.stops.length ? <ol className="day-stops">
      {path.stops.flatMap((stop, index) => [
        index === path.nowIndex && index > 0 && stop.when !== 'now' ? <NowLine key="now" clock={clock} /> : null,
        <Stop key={stop.key} stop={stop} compact={compact} {...page.stopProps} />,
      ])}
      {path.nowIndex === -1 ? <NowLine key="now" clock={clock} label={`Now · nothing else has a time ${when}`} /> : null}
    </ol> : <p className="day-quiet">Nothing has a time {when}. Add a plan in the line above.</p>}
    {path.anytime.length ? <>
      <h3>Any time {when}</h3>
      <ol className="day-stops day-anytime">{path.anytime.map((entry) => <Stop key={entry.key} stop={{ ...entry, start: '', end: '', kind: entry.kind ?? 'plan' }} compact={compact} {...page.stopProps} />)}</ol>
    </> : null}
    {path.also.length ? <>
      <h3>Also {when}</h3>
      <ul className="day-also">{(compact ? path.also.slice(0, 4) : path.also).map((entry) => <li key={entry.key} style={{ '--item-accent': calendarArea(entry.area).tone }}><Link to={entry.href}>{entry.title}</Link><small>{calendarArea(entry.area).label}</small></li>)}
        {compact && path.also.length > 4 ? <li className="day-also-more"><Link to="/today">and {path.also.length - 4} more</Link></li> : null}</ul>
    </> : null}
  </>
}

export function Panel({ title, href, open, children, unavailable, className = '' }) {
  return <section className={`day-panel ${className}`.trim()} aria-label={title}>
    <header><h2>{title}</h2><Link to={href}>{open}</Link></header>
    {unavailable ? <p className="day-unavailable">{unavailable}</p> : children}
  </section>
}

export function StudyPanel({ study, label = 'Today', compact = false }) {
  const pending = study.today.filter((card) => !card.done)
  const when = label === 'Today' ? 'today' : 'that day'
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
    </ul> : <p className="day-quiet">No study card is due {when}.{study.running.length ? '' : ' Add one in the Study hub.'}</p>}
    {!pending.length && study.today.length ? <p className="day-quiet">Everything for {when} is done.</p> : null}
    {study.overdue.count ? <><h3 className="day-warn">{count(study.overdue.count, 'card')} past {study.overdue.count === 1 ? 'its' : 'their'} date</h3>{compact ? null : <ul className="day-list">{study.overdue.cards.map((card) => <li key={card.id}><Link to={card.href}>{card.title}</Link><small>{formatCalendarDay(card.due)}</small></li>)}</ul>}</> : null}
    {compact ? null : <>
      {study.running.length ? <><h3>This week</h3><ul className="day-list">{study.running.map((card) => <li key={card.id}><Link to={card.href}>{card.title}</Link><small>due {formatCalendarDay(card.due)}</small></li>)}</ul></> : null}
      {study.undated.length ? <p className="day-quiet">No date yet: {study.undated.join('; ')}.</p> : null}
    </>}
  </>
}

export function JobsPanel({ jobs, compact = false }) {
  const toApply = jobs.dueToday || jobs.due.filter((job) => !job.applied).length
  const due = compact ? jobs.due.slice(0, 3) : jobs.due
  return <>
    <div className="day-figure">
      <strong>{toApply}</strong>
      <p><b>{jobs.dueToday ? 'to apply for today' : 'to apply for this week'}</b><span>{count(jobs.counts.toApply, 'saved job')} still to apply for · {jobs.appliedThisWeek} sent this week</span></p>
    </div>
    {jobs.time.length ? <p className="day-job-time">{jobs.minutesToday ? `${hours(Math.round(jobs.minutesToday / 6) / 10)} set aside today` : 'Time set aside today'}: {jobs.time.map((block) => `${block.start ? `${block.start}${block.end ? ` to ${block.end}` : ''}` : 'any time'}${block.done ? ' (done)' : ''}`).join(', ')}</p>
      : <p className="day-quiet">No time set aside for applications today. Add “job applications 17:00-20:00” as a plan, or see the calendar.</p>}
    <h3>Closing in the next seven days</h3>
    {due.length ? <ul className="day-list">
      {due.map((job) => <li key={job.id} className={job.applied ? 'is-done' : undefined}>
        <Link to={job.href}>{job.role}<em> · {job.company}</em></Link>
        <small className={job.days === 0 && !job.applied ? 'day-warn' : undefined}>{job.applied ? 'Applied' : job.days === 0 ? 'Closes today' : formatCalendarDay(job.deadline, { weekday: 'short' })}{job.uncertain ? ' · check it is still open' : ''}</small>
      </li>)}
    </ul> : <p className="day-quiet">No saved job closes in the next seven days.</p>}
    {compact && jobs.due.length > due.length ? <p className="day-more">and {jobs.due.length - due.length} more this week</p> : null}
    {jobs.interviews.length ? <><h3>Interviews</h3><ul className="day-list">{jobs.interviews.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link>{job.nextStep ? <small>{job.nextStep}</small> : null}</li>)}</ul></> : null}
    {compact ? null : <>
      {jobs.followUps.length ? <><h3>Follow up</h3><ul className="day-list">{jobs.followUps.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link><small>{daysAway(job.days)}</small></li>)}</ul></> : null}
      {jobs.counts.missed ? <p className="day-quiet">{count(jobs.counts.missed, 'saved job')} passed {jobs.counts.missed === 1 ? 'its' : 'their'} closing date without an application. Archive or check them in JobMap.</p> : null}
    </>}
  </>
}

export function HomePanel({ home, today = true, compact = false }) {
  const shown = compact ? 6 : 10
  return <>
    <h3>Shopping</h3>
    {home.lists.length ? home.lists.slice(0, compact ? 1 : 2).map((list) => <div className="day-shopping" key={list.id}>
      <p className="day-shopping-name"><b>{list.name}</b><span>{[list.shop, list.date ? formatCalendarDay(list.date) : '', `${count(list.items.length, 'thing')} to buy`].filter(Boolean).join(' · ')}</span></p>
      <ul className="day-steps day-items">
        {list.items.slice(0, shown).map((item) => <li key={item.id}><span className="day-tick" aria-hidden="true" />{item.name}{item.quantity && !(item.quantity === 1 && item.unit === 'item') ? <small> {item.quantity}{item.unit && item.unit !== 'item' ? ` ${item.unit}` : ''}</small> : null}{item.optional ? <small> if there is money left</small> : null}</li>)}
      </ul>
      {list.items.length > shown ? <p className="day-more">and {list.items.length - shown} more in Budget</p> : null}
    </div>) : <p className="day-quiet">Nothing on a shopping list. Choose “To buy” in the line at the top and type what you need.</p>}
    {compact && home.lists.length > 1 ? <p className="day-more">and {count(home.lists.length - 1, 'more list')}</p> : null}
    <h3>Eating {today ? 'today' : 'that day'}</h3>
    {home.meals.length ? <ul className="day-list">{home.meals.map((meal) => <li key={meal.id} className={meal.cooked ? 'is-done' : undefined}><span>{meal.name}</span><small>{MEAL_NAMES[meal.slot] ?? 'Meal'}{meal.cooked ? ' · eaten' : ''}</small></li>)}</ul>
      : <p className="day-quiet">Nothing planned to eat.{home.recipes ? '' : ' No recipes are saved yet.'} <Link to="/budget">Plan a meal in Budget</Link>.</p>}
    <dl className="day-facts">
      <div><dt>At home</dt><dd>{home.stock.total ? <>{count(home.stock.total, 'thing')}<small>{home.stock.places.map((place) => `${place.place} ${place.count}`).join(' · ')}</small></> : 'Nothing recorded'}</dd></div>
      <div><dt>{home.budget ? formatCalendarDay(`${home.budget.month}-01`, { weekday: undefined, day: undefined, month: 'long' }) : 'This month'}</dt><dd>{home.budget ? <>{pounds(home.budget.totalPence)} budget<small><Link to="/budget">See what is left in My month</Link></small></> : 'No budget set'}</dd></div>
    </dl>
  </>
}

export function NotesPanel({ notes }) {
  if (!notes.length) return <p className="day-quiet">No notes were written this day. Choose Note in the line at the top; it is kept here and in the Ledger.</p>
  return <ul className="day-notes">{notes.map((note) => <li key={note.id}><time>{note.at}</time><p>{note.body || note.title}</p></li>)}</ul>
}

// The four panels of a day, each drawn when its part could be read.
export function DayPanels({ page, compact = false }) {
  const { data, isToday } = page
  const waiting = (empty) => <p className="day-quiet">{page.loading ? 'Loading…' : empty}</p>
  return <>
    <div className="day-panel-column">
      <Panel title="Study" href="/study" open="Open Study hub" unavailable={page.unavailable('study')}>
        {data?.study ? <StudyPanel study={data.study} label={isToday ? 'Today' : 'That day'} compact={compact} /> : waiting('No semester is open.')}
      </Panel>
      <Panel title="Home" href="/budget" open="Open Budget" unavailable={page.unavailable('home')}>
        {data?.home ? <HomePanel home={data.home} today={isToday} compact={compact} /> : waiting('Nothing to show.')}
      </Panel>
    </div>
    <div className="day-panel-column">
      <Panel title="Jobs" href="/jobmap" open="Open JobMap" unavailable={page.unavailable('jobs')}>
        {data?.jobs ? <JobsPanel jobs={data.jobs} compact={compact} /> : waiting('Nothing to show.')}
      </Panel>
      <Panel title="Notes" href="/ledger" open="Open Ledger" unavailable={page.unavailable('notes')}>
        {data?.notes ? <NotesPanel notes={data.notes} /> : waiting('Nothing to show.')}
      </Panel>
    </div>
  </>
}
