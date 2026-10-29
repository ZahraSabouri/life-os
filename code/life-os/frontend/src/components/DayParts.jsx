import ChangePlan from './ChangePlan.jsx'
import HealthPanel from './health/HealthPanel.jsx'
import InboxPanel from './inbox/InboxPanel.jsx'
import { Fragment, useState } from 'react'
// The pieces a day is drawn with, shared by the Court, Today and the strip inside each part:
// the line that adds to the day, the day's path, and the Study, Jobs, Home and Notes panels.
import { Link } from 'react-router-dom'
import { ENTRY_AREAS } from '@shared/entryTypes.js'
import { ROOMS } from '@shared/rooms.js'
import { calendarArea, formatCalendarDay } from '../lib/calendar.js'
import { placeOf } from '../lib/calendarViews.js'
import { daysAway } from '../lib/day.js'

export const pounds = (pence) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: pence % 100 ? 2 : 0 }).format(pence / 100)
export const hours = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} h`
export const count = (value, one, many = `${one}s`) => `${value} ${value === 1 ? one : many}`
const MEAL_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
export const roomName = (slug) => ROOMS.find((room) => room.slug === slug)?.name ?? ''
const ADD = {
  plan: { label: 'Plan', button: 'Add', placeholder: (day) => `Add to ${day}: “17:30 library”, “Lidl”, “dinner at 8pm”` },
  note: { label: 'Note', button: 'Keep', placeholder: (day) => `Write a note for ${day} and press Enter` },
  buy: { label: 'To buy', button: 'Add', placeholder: () => 'Something to buy: “eggs, rice, 2 kg onions”' },
}

// One line that adds a plan, a note or something to buy. A hint says what will be saved. Under it,
// the last change made on the day, with Undo (`undo={false}` where the page shows it elsewhere).
export function AddLine({ page, id = 'day-add-input', fixedArea = false, undo = true }) {
  const { line } = page
  return <form className={`day-note${line.kind === 'buy' ? '' : ' has-filing'}`} onSubmit={line.save}>
    <div className="day-add-kind" role="group" aria-label="What to add">
      {Object.entries(ADD).map(([kind, words]) => <button key={kind} type="button" aria-pressed={line.kind === kind} onClick={() => line.choose(kind)}
        disabled={kind === 'note' && !line.noteAllowed} title={kind === 'note' && !line.noteAllowed ? 'A note belongs to the day it is written' : undefined}>{words.label}</button>)}
    </div>
    <input id={id} value={line.text} onChange={(event) => line.setText(event.target.value)} aria-label={ADD[line.kind].label} placeholder={ADD[line.kind].placeholder(page.dayName)} autoComplete="off" maxLength={2000} />
    {line.kind === 'buy' ? null : <div className="day-add-filing">
      {line.kind === 'plan' ? <label>for<input type="date" value={line.day} onChange={(event) => line.setDay(event.target.value)} aria-label="The day the plan is for" /></label> : null}
      {line.kind === 'plan' ? <label>repeat<select value={line.repeat} onChange={(event) => line.setRepeat(event.target.value)} aria-label="Whether the plan comes round">
        <option value="">once</option><option value="daily">every day</option><option value="weekdays">weekdays</option>
        <option value="weekly">every {formatCalendarDay(line.day, { weekday: 'long', day: undefined, month: undefined })}</option><option value="custom">choose days</option>
      </select></label> : null}
      {fixedArea || line.fixedArea ? null : <label>under<select value={line.area} onChange={(event) => line.setArea(event.target.value)} aria-label="The area to file it under">
        <option value="">no area</option>
        {ENTRY_AREAS.map((slug) => <option key={slug} value={slug}>{roomName(slug)}</option>)}
      </select></label>}
    </div>}
    <button type="submit" disabled={!line.text.trim() || line.state === 'saving'}>{line.state === 'saving' ? 'Saving…' : line.state === 'saved' ? 'Saved' : ADD[line.kind].button}</button>
    {line.kind === 'plan' && line.repeat ? <div className="day-add-repeat">
      {line.repeat === 'custom' ? <span className="day-add-days" role="group" aria-label="The days it comes round on">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, index) => <button key={name} type="button" aria-pressed={line.repeatDays.includes(index + 1)} onClick={() => line.toggleRepeatDay(index + 1)}>{name}</button>)}
      </span> : null}
      <label>until<input type="date" value={line.until} min={line.day} onChange={(event) => line.setUntil(event.target.value)} aria-label="The last day it comes round (optional)" /></label>
      <span>Leave “until” empty for no end. Each day can be ticked or taken off by itself.</span>
    </div> : null}
    {line.hint ? <p className="day-add-hint">{line.hint}{line.area && line.kind !== 'buy' ? ` Filed under ${roomName(line.area)}.` : ''}</p> : null}
    {!line.hint && page.notice ? <p className="day-add-hint day-add-done" role="status">{page.notice}</p> : null}
    {undo && !line.hint && page.change ? <p className="day-add-hint day-add-done" role="status">{page.change.words} <button type="button" className="day-undo" onClick={page.undoChange} disabled={Boolean(page.savingId)}>Undo</button></p> : null}
    {page.error ? <p className="day-add-hint day-warn" role="alert">{page.error}</p> : null}
  </form>
}

// A card's steps. With `onStudy` each square is a real tick, saved in the Study hub.
export function Steps({ card, limit = 6, onStudy, busy, doneWhen = true }) {
  const can = Boolean(onStudy && card.hubCardId && card.semesterId)
  if (!card.steps.length) return doneWhen && card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null
  return <>
    <ul className="day-steps">
      {card.steps.slice(0, limit).map((step, index) => <li key={step.id || index} className={step.done ? 'is-done' : undefined}>
        {can && step.id ? <button type="button" className="day-tick" role="checkbox" aria-checked={step.done} aria-label={`${step.done ? 'Untick' : 'Tick'}: ${step.text}`} disabled={busy} onClick={() => onStudy(card, step, !step.done)} /> : <span className="day-tick" aria-hidden="true" />}
        <span>{step.text}{can ? null : <span className="visually-hidden">{step.done ? ' (done)' : ''}</span>}</span>
      </li>)}
    </ul>
    {card.steps.length > limit ? <p className="day-more">and {card.steps.length - limit} more <Link to={card.href}>on the card</Link></p> : null}
    {doneWhen && card.doneWhen ? <p className="day-done-when"><span>Done when</span> {card.doneWhen}</p> : null}
  </>
}

// With `onOpen` (the calendar's pop-up) the title opens the thing in the pop-up, and a link
// beside it goes to where it is kept; `notes` is how many notes are about it.
function Stop({ stop, onDone, onRemove, onStudy, onChanged, busy, compact, onOpen, notes = 0 }) {
  const [changing, setChanging] = useState(false)
  const area = calendarArea(stop.area)
  const card = stop.card
  const detailed = card && !card.done && (card.steps.length || card.doneWhen)
  // Her own plan says the room it is filed under; everything else, its part of Life OS.
  const label = (stop.room && roomName(stop.room)) || area.label
  const place = onOpen ? placeOf(stop.href) : ''
  return <li className={`day-stop${stop.when ? ` is-${stop.when}` : ''}${card ? ' has-card' : ''}`} data-kind={stop.kind} style={{ '--item-accent': area.tone }}>
    <div className="day-stop-time">{stop.start ? <span>{stop.start}</span> : null}{stop.end ? <small>{stop.end}</small> : null}</div>
    <div className="day-stop-mark" aria-hidden="true" />
    <div className="day-stop-body">
      {onOpen ? <button type="button" className="day-stop-title" onClick={() => onOpen(stop.key)}>{card?.title ?? stop.title}</button>
        : <Link className="day-stop-title" to={stop.href}>{card?.title ?? stop.title}</Link>}
      <p className="day-stop-meta">
        <span>{label}</span>
        {notes ? <span>{count(notes, 'note')}</span> : null}
        {card?.moduleCode || card?.module ? <span>{card.moduleCode || card.module}</span> : null}
        {stop.place ? <span>{stop.place}</span> : null}
        {stop.when === 'now' ? <span className="day-now-tag">Now</span> : null}
        {stop.choice === 'maybe' ? <span>Maybe</span> : null}
        {stop.entry?.routine ? <span>repeats</span> : null}
        {card?.done ? <span className="day-done-tag">Done</span> : null}
        {compact && detailed ? <span>{card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps` : 'planned'}{card.hours ? ` · ${hours(card.hours)}` : ''}</span> : null}
      </p>
      {detailed && !compact ? <div className="day-card">
        <Steps card={card} onStudy={onStudy} busy={busy} />
        <p className="day-card-foot">{card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps done` : null}{card.steps.length && card.hours ? ' · ' : null}{card.hours ? hours(card.hours) : null} <Link to={card.href}>Open in Study hub</Link></p>
      </div> : null}
      {card && onStudy && card.hubCardId && card.semesterId ? <p className="day-stop-actions">
        <button type="button" onClick={() => onStudy(card, null, !card.done)} disabled={busy}>{card.done ? 'Not done after all' : 'Card done'}</button>
      </p> : null}
      {stop.entry && !changing ? <p className="day-stop-actions">
        {stop.entry.task ? <button type="button" onClick={() => onDone(stop)} disabled={busy}>Done</button> : null}
        <button type="button" onClick={() => setChanging(true)} disabled={busy}>Change</button>
        <button type="button" onClick={() => onRemove(stop)} disabled={busy}>Take off the day</button>
        {onOpen ? <button type="button" onClick={() => onOpen(stop.key)}>Move or add a note</button> : null}
      </p> : null}
      {onOpen && !stop.entry ? <p className="day-stop-actions">
        {place ? <Link to={stop.href}>Open in {place}</Link> : null}
        <button type="button" onClick={() => onOpen(stop.key)}>{place ? 'Details and a note' : 'Details'}</button>
      </p> : null}
      {stop.entry && changing ? <ChangePlan entry={stop.entry} onCancel={() => setChanging(false)} onSaved={() => { setChanging(false); onChanged?.() }} /> : null}
    </div>
  </li>
}

function NowLine({ clock, label = 'Now' }) {
  return <li className="day-now-line"><span>{clock}</span><i aria-hidden="true" /><b>{label}</b></li>
}

// The day in clock order, then what is for any time, then the all-day rest in one slim row.
export function DayPath({ page, compact = false, onOpen, notesFor }) {
  const { path, isToday, clock } = page
  const when = isToday ? 'today' : 'that day'
  const opened = onOpen ? { onOpen } : {}
  const notes = (key) => (notesFor ? notesFor(key) : 0)
  if (page.loading) return <p className="day-quiet" role="status">Putting the day in order…</p>
  return <>
    {path.stops.length ? <ol className="day-stops">
      {path.stops.flatMap((stop, index) => [
        index === path.nowIndex && index > 0 && stop.when !== 'now' ? <NowLine key="now" clock={clock} /> : null,
        <Stop key={stop.key} stop={stop} compact={compact} notes={notes(stop.key)} {...opened} {...page.stopProps} />,
      ])}
      {path.nowIndex === -1 ? <NowLine key="now" clock={clock} label={`Now · nothing else has a time ${when}`} /> : null}
    </ol> : <p className="day-quiet">Nothing has a time {when}. Add a plan in the line above.</p>}
    {path.anytime.length ? <>
      <h3>Any time {when}</h3>
      <ol className="day-stops day-anytime">{path.anytime.map((entry) => <Stop key={entry.key} stop={{ ...entry, start: '', end: '', kind: entry.kind ?? 'plan' }} compact={compact} notes={notes(entry.key)} {...opened} {...page.stopProps} />)}</ol>
    </> : null}
    {path.also.length ? <>
      <h3>Also {when}</h3>
      <ul className="day-also">{(compact ? path.also.slice(0, 4) : path.also).map((entry) => <li key={entry.key} style={{ '--item-accent': calendarArea(entry.area).tone }}>{onOpen ? <button type="button" className="day-also-open" onClick={() => onOpen(entry.key)}>{entry.title}</button> : <Link to={entry.href}>{entry.title}</Link>}<small>{calendarArea(entry.area).label}{notes(entry.key) ? ` · ${count(notes(entry.key), 'note')}` : ''}</small></li>)}
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

export function StudyPanel({ study, label = 'Today', compact = false, onStudy, savingId = '' }) {
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
        {/* On the Court the path is short, so the steps are ticked here; on Today they sit in the path. */}
        {compact && !card.done && card.steps.length ? <Steps card={card} limit={5} onStudy={onStudy} busy={Boolean(savingId)} doneWhen={false} /> : null}
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

export function JobsPanel({ jobs, compact = false, onMark, marked = null, onUndo, savingId = '' }) {
  // JobMap's own first screen decides what is "to apply for": the same list, order, groups and words.
  const next = compact ? jobs.next.slice(0, 3) : jobs.next
  const others = jobs.due.filter((job) => !job.applied && !job.listed)
  const later = jobs.groups.slice(jobs.applyNow ? 1 : 0)
  const more = jobs.leads - jobs.closing.length - next.length
  // One step from the day: "I applied" on a job to apply for, "Rejected" on one she is waiting on.
  const act = (job, status, words, title) => (onMark ? <button type="button" className="day-mark" title={title} disabled={Boolean(savingId)} onClick={() => onMark(job, status)}>{savingId === `job:${job.id}` ? 'Saving…' : words}</button> : null)
  const lead = (job, warn) => <li key={job.id} title={job.reason}>
    <Link to={job.href}>{job.role}<em> · {job.company}</em></Link>
    <small className={warn ? 'day-warn' : undefined}>{job.label}{!warn && job.deadline ? ` · ${formatCalendarDay(job.deadline, { weekday: 'short' })}` : ''}</small>
    {act(job, 'Applied', 'I applied', 'Mark it as applied in JobMap, with today’s date')}
  </li>
  return <>
    <div className="day-figure">
      <strong>{jobs.applyNow}</strong>
      <p><b>{jobs.applyNow === 1 ? 'job to apply for now' : 'jobs to apply for now'}</b><span>JobMap lists {jobs.leads} in all · {jobs.appliedThisWeek} sent this week</span></p>
    </div>
    {jobs.time.length ? <p className="day-job-time">{jobs.minutesToday ? `${hours(Math.round(jobs.minutesToday / 6) / 10)} set aside today` : 'Time set aside today'}: {jobs.time.map((block) => `${block.start ? `${block.start}${block.end ? ` to ${block.end}` : ''}` : 'any time'}${block.done ? ' (done)' : ''}`).join(', ')}</p>
      : <p className="day-quiet">No time set aside for applications today. Add “job applications 17:00-20:00” as a plan, or see the calendar.</p>}
    {marked ? <p className="day-marked" role="status">Marked as {marked.status.toLowerCase()} in JobMap: {marked.role}{marked.company ? ` · ${marked.company}` : ''}.{marked.previous?.status && onUndo ? <> <button type="button" className="day-mark" disabled={Boolean(savingId)} onClick={onUndo}>Undo</button></> : null}</p> : null}
    {jobs.closing.length ? <>
      <h3>Closes today</h3>
      <ul className="day-list">{jobs.closing.map((job) => lead(job, true))}</ul>
    </> : null}
    <h3>Next, in JobMap’s order</h3>
    {next.length ? <ul className="day-list">{next.map((job) => lead(job, false))}</ul>
      : <p className="day-quiet">{jobs.closing.length ? 'Nothing else is listed.' : 'JobMap lists nothing to apply for right now.'}</p>}
    {more > 0 ? <p className="day-more"><Link to="/jobmap">and {more} more in JobMap</Link>{later.length ? ` (${later.map((group) => `${group.name.toLowerCase()} ${group.count}`).join(' · ')})` : ''}</p> : null}
    {others.length ? <p className="day-quiet">{count(others.length, 'other job')} on the shortlist {others.length === 1 ? 'closes' : 'close'} this week ({others.slice(0, 2).map((job) => job.role).join('; ')}{others.length > 2 ? '…' : ''}). A search shortlisted {others.length === 1 ? 'it' : 'them'}; JobMap has not seen {others.length === 1 ? 'it' : 'them'} open, or {others.length === 1 ? 'it is' : 'they are'} outside your search. Look under JobMap → Shortlist.</p> : null}
    {jobs.interviews.length ? <><h3>Interviews</h3><ul className="day-list">{jobs.interviews.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link>{job.nextStep ? <small>{job.nextStep}</small> : null}{act(job, 'Rejected', 'Rejected', 'Mark it as rejected in JobMap. It moves to the archive there.')}</li>)}</ul></> : null}
    {compact ? null : <>
      {jobs.followUps.length ? <><h3>Follow up</h3><ul className="day-list">{jobs.followUps.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link><small>{daysAway(job.days)}</small>{act(job, 'Rejected', 'Rejected', 'Mark it as rejected in JobMap. It moves to the archive there.')}</li>)}</ul></> : null}
      {jobs.counts.missed ? <p className="day-quiet">{count(jobs.counts.missed, 'saved job')} passed {jobs.counts.missed === 1 ? 'its' : 'their'} closing date without an application. Archive or check them in JobMap.</p> : null}
    </>}
  </>
}

export function HomePanel({ home, today = true, compact = false, onTick, savingId = '' }) {
  const shown = compact ? 6 : 10
  const toBuy = home.lists.filter((list) => list.items.length > 0)
  // A thing to buy is a real tick when the page can save it; ticked today, it stays struck through.
  const row = (list, item, done) => <li key={item.id} className={done ? 'is-done' : undefined}>
    {onTick ? <button type="button" className="day-tick" role="checkbox" aria-checked={done} aria-label={`${done ? 'Put back on the list' : 'Tick off'}: ${item.name}`} title={done ? 'Put it back on the list' : 'Tick it off. No price needed.'} disabled={Boolean(savingId)} onClick={() => onTick(list, item, !done)} /> : <span className="day-tick" aria-hidden="true" />}
    <span>{item.name}{!done && item.quantity && !(item.quantity === 1 && item.unit === 'item') ? <small> {item.quantity}{item.unit && item.unit !== 'item' ? ` ${item.unit}` : ''}</small> : null}{!done && item.optional ? <small> if there is money left</small> : null}</span>
  </li>
  return <>
    <h3>Shopping</h3>
    {home.lists.length ? home.lists.slice(0, compact ? 1 : 2).map((list) => <div className="day-shopping" key={list.id}>
      <p className="day-shopping-name"><b><Link to="/budget#/shopping">{list.name}</Link></b><span>{[list.shop, list.date ? formatCalendarDay(list.date) : '', list.items.length ? `${count(list.items.length, 'thing')} to buy` : 'everything ticked off'].filter(Boolean).join(' · ')}</span></p>
      <ul className="day-steps day-items">
        {list.items.slice(0, shown).map((item) => row(list, item, false))}
        {list.got.slice(0, compact ? 3 : list.got.length).map((item) => row(list, item, true))}
      </ul>
      {compact && list.got.length > 3 ? <p className="day-more">and {list.got.length - 3} more ticked off today</p> : null}
      {list.items.length > shown ? <p className="day-more">and {list.items.length - shown} more in <Link to="/budget#/shopping">Budget</Link></p> : null}
    </div>) : <p className="day-quiet">Nothing on a shopping list. Choose “To buy” in the line at the top and type what you need.</p>}
    {compact && toBuy.length > 1 ? <p className="day-more">and {count(toBuy.length - 1, 'more list')}</p> : null}
    <h3>Eating {today ? 'today' : 'that day'}</h3>
    {home.meals.length ? <ul className="day-list">{home.meals.map((meal) => <li key={meal.id} className={meal.cooked ? 'is-done' : undefined}>{meal.href ? <Link to={meal.href}>{meal.prep ? `Cook: ${meal.name}` : meal.name}</Link> : <span>{meal.name}</span>}<small>{MEAL_NAMES[meal.slot] ?? 'Meal'}{meal.cooked ? (meal.prep ? ' · cooked' : ' · eaten') : ''}</small></li>)}</ul>
      : <p className="day-quiet">Nothing planned to eat.{home.recipes ? '' : ' No recipes are saved yet.'} <Link to="/budget#/meals/week">Plan a meal in Budget</Link>.</p>}
    {today ? <p className="day-more"><Link to="/budget#/meals/now">What can I eat now?</Link>{home.recipes ? <> · <Link to="/budget#/meals/recipes">{count(home.recipes, 'recipe')}</Link></> : null}</p> : null}
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

// The four panels of a day, each drawn when its part could be read. `layout` says which panel
// stands in which column: two columns beside the day's path (Today), three on the Court.
export const PANELS_BESIDE_PATH = [['study', 'home'], ['mail', 'jobs', 'health', 'notes']]
export const PANELS_ALONE = [['study', 'notes'], ['jobs'], ['home']]
export function DayPanels({ page, compact = false, layout = PANELS_BESIDE_PATH }) {
  const { data, isToday } = page
  const waiting = (empty) => <p className="day-quiet">{page.loading ? 'Loading…' : empty}</p>
  const study = <Panel title="Study" href="/study" open="Open Study hub" unavailable={page.unavailable('study')}>
    {data?.study ? <StudyPanel study={data.study} label={isToday ? 'Today' : 'That day'} compact={compact} onStudy={page.tickStudy} savingId={page.savingId} /> : waiting('No semester is open.')}
  </Panel>
  const home = <Panel title="Home" href="/budget" open="Open Budget" unavailable={page.unavailable('home')}>
    {data?.home ? <HomePanel home={data.home} today={isToday} compact={compact} onTick={page.tickShopping} savingId={page.savingId} /> : waiting('Nothing to show.')}
  </Panel>
  const jobs = <Panel title="Jobs" href="/jobmap" open="Open JobMap" unavailable={page.unavailable('jobs')}>
    {data?.jobs ? <JobsPanel jobs={data.jobs} compact={compact} onMark={page.markJob} marked={page.jobMark} onUndo={page.undoJobMark} savingId={page.savingId} /> : waiting('Nothing to show.')}
  </Panel>
  const notes = <Panel title="Notes" href="/ledger" open="Open Ledger" unavailable={page.unavailable('notes')}>
    {data?.notes ? <NotesPanel notes={data.notes} /> : waiting('Nothing to show.')}
  </Panel>
  const health = <Panel title="Health" href="/health" open="Open Health">
    <HealthPanel today={page.date} isToday={isToday} compact={compact} />
  </Panel>
  const mail = isToday ? <Panel title="Waiting on you" href="/inbox" open="Open the Inbox" className="mail-today">
    <InboxPanel />
  </Panel> : null
  const panels = { study, home, jobs, notes, health, mail }
  return <>{layout.map((column) => <div className="day-panel-column" key={column.join('-')}>{column.map((name) => <Fragment key={name}>{panels[name]}</Fragment>)}</div>)}</>
}
