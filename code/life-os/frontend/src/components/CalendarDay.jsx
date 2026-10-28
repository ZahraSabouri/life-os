// One day of the calendar, open over the month: everything on it, and what can be done from
// here. The day's path (her plans, classes and study blocks in time order, with Done, Change and
// Take off the day), the line that adds a plan, a note or something to buy, the day's notes,
// and tabs for Study, Jobs, Home and Health. A thing on the day opens in the pop-up with its
// details, a note about it, and a link to where it is kept. Everything is in the address
// (CalendarView), so Back closes what was opened last.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isDateKey } from '@shared/calendar.js'
import { addDays, calendarArea, calendarKind, dateKey, formatCalendarDay, isComplete, itemTime } from '../lib/calendar.js'
import { DAY_TABS, placeOf } from '../lib/calendarViews.js'
import { daysAway, shortPlace } from '../lib/day.js'
import { useDayPage } from '../lib/useDayPage.js'
import ChangePlan from './ChangePlan.jsx'
import { AddLine, DayPath, HomePanel, JobsPanel, Panel, Steps, StudyPanel, count, hours, roomName } from './DayParts.jsx'
import HealthPanel from './health/HealthPanel.jsx'

const persianLong = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const typing = (target) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// A study block is `block:…` in the day and `study:block:…` on the calendar: one thing, one name for its notes.
export const thingId = (key) => (String(key).startsWith('block:') ? `study:${key}` : String(key))

// What a key in the address names: a calendar item, a study block of the day, or a card due that day.
function findThing(page, key) {
  const id = thingId(key)
  const item = page.items.find((entry) => entry.id === id) ?? page.calendar.items.find((entry) => entry.id === id)
  const block = page.data?.blocks?.find((entry) => `study:${entry.id}` === id)
  if (item) return { id, item, card: block?.card ?? null, title: item.title, href: block?.card?.href ?? item.href }
  if (block) return { id, block, card: block.card, title: block.title, href: block.card?.href ?? block.href }
  const card = String(key).startsWith('card:') ? page.data?.study?.today?.find((entry) => `card:${entry.id}` === key) : null
  if (card) return { id, card, title: card.title, href: card.href }
  return null
}

// A job on the calendar ("Role · Company", or "Follow up · Role · Company") as the day's jobs name it.
function jobOf(item) {
  if (item?.area !== 'career' || !item.meta?.jobId) return null
  const [role = '', company = ''] = item.title.replace(/^Follow up · /, '').split(' · ')
  return { id: item.meta.jobId, role, company, status: String(item.meta.status ?? '').toLowerCase() }
}

// Addresses written into a place ("AccessAble Details: https://…") are links.
function Linked({ text }) {
  return String(text).split(/(https?:\/\/[^\s]+)/g).map((part, index) => (/^https?:\/\//.test(part)
    ? <a key={index} href={part} target="_blank" rel="noreferrer">{part.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}{part.length > 56 ? '…' : ''}</a> : part))
}

function NoteForm({ page, about, label }) {
  const [words, setWords] = useState('')
  const busy = page.savingId === `note:${about?.id ?? page.date}`
  return <form className="calendar-note-form" onSubmit={async (event) => { event.preventDefault(); if (await page.keepNote(words, about)) setWords('') }}>
    <label htmlFor={`note-${about?.id ?? 'day'}`}>{label}</label>
    <textarea id={`note-${about?.id ?? 'day'}`} value={words} onChange={(event) => setWords(event.target.value)} rows={3} maxLength={4000}
      placeholder={about ? 'What to remember about it: a question to ask, what to bring, how it went' : 'Anything to remember about this day'} />
    <button type="submit" disabled={!words.trim() || Boolean(page.savingId)}>{busy ? 'Keeping…' : 'Keep the note'}</button>
  </form>
}

// A long note shows its beginning, so the rest of the day stays in sight; "Read all" shows the rest.
const SHORT = 240
function NoteList({ notes }) {
  const [open, setOpen] = useState([])
  if (!notes.length) return null
  return <ul className="day-notes calendar-note-list">{notes.map((note) => {
    const words = note.body || note.title
    const long = words.length > SHORT && !open.includes(note.id)
    return <li key={note.id}>
      <time>{note.forDay ? 'Note' : note.at}</time>
      <p>{long ? `${words.slice(0, SHORT).trimEnd()}… ` : words}{long ? <button type="button" className="calendar-note-more" onClick={() => setOpen((current) => [...current, note.id])}>Read all</button> : null}</p>
      <Link to={note.href} title="Change or remove it in the Ledger">Ledger</Link>
    </li>
  })}</ul>
}

function Thing({ page, thingKey, onBack, onItem }) {
  const [changing, setChanging] = useState(false)
  const [moveTo, setMoveTo] = useState('')
  const thing = findThing(page, thingKey)
  if (!thing) {
    return <section className="calendar-thing">
      <button type="button" className="calendar-thing-back" onClick={onBack}>‹ The whole day</button>
      <p className="day-quiet" role="status">{page.loading ? 'Opening…' : 'This is no longer on this day. It may have been moved, done or taken off.'}</p>
    </section>
  }
  const { item, block, card } = thing
  const area = calendarArea(item?.area ?? (block?.category === 'job' ? 'career' : 'study'))
  const own = item?.meta?.source === 'core' && item.meta?.entryId
  const done = item ? isComplete(item) : Boolean(card?.done)
  const job = jobOf(item)
  const place = placeOf(thing.href)
  const where = item?.location ?? block?.location ?? ''
  const notes = (page.data?.notes ?? []).filter((note) => note.about === thing.id)
  const when = item ? `${itemTime(item)}${item.end && dateKey(item.end) > dateKey(item.start) && item.all_day ? ` until ${formatCalendarDay(dateKey(item.end))}` : ''}`
    : block ? `${block.start}–${block.end}` : 'Any time this day'
  const busy = Boolean(page.savingId)
  const jobDone = ['applied', 'interview', 'offer', 'rejected', 'withdrawn'].includes(job?.status ?? '')
  return <section className="calendar-thing" aria-labelledby="calendar-thing-title" style={{ '--item-accent': area.tone }}>
    <button type="button" className="calendar-thing-back" onClick={onBack}>‹ The whole day</button>
    <h3 id="calendar-thing-title" className={done ? 'is-complete' : undefined}>{thing.title}</h3>
    <dl className="calendar-thing-facts">
      <div><dt>When</dt><dd>{when}</dd></div>
      <div><dt>Part</dt><dd>{(item?.meta?.room && roomName(item.meta.room)) || area.label}{card?.moduleCode || card?.module ? ` · ${card.moduleCode || card.module}` : ''}</dd></div>
      {item ? <div><dt>Kind</dt><dd>{calendarKind(item.kind)}{item.choice ? ` · ${item.choice === 'going' ? 'Plan to go' : 'Maybe'}` : item.meta?.candidate ? ' · Available option' : ''}{done ? ' · Done' : ''}</dd></div> : null}
      {where ? <div><dt>Where</dt><dd><span className="calendar-thing-place">{shortPlace(where)}</span>{shortPlace(where) !== where ? <small><Linked text={where} /></small> : null}</dd></div> : null}
      {card && (card.steps?.length || card.hours) ? <div><dt>Card</dt><dd>{card.steps.length ? `${card.stepsDone} of ${card.steps.length} steps done` : 'Planned'}{card.hours ? ` · ${hours(card.hours)}` : ''}</dd></div> : null}
    </dl>
    {item?.meta?.savedSnapshot ? <p className="day-warn">A saved copy: the listing has changed or gone. Check it before travelling.</p> : null}
    {item?.meta?.needsVerification ? <p className="day-warn">Check the published time and details before travelling.</p> : null}
    {item?.area === 'events' ? <p className="day-quiet">Choose Maybe or Plan to go for it in Cardiff Life; the calendar shows your choice.</p> : null}
    {card && card.steps?.length ? <div className="day-card"><Steps card={card} limit={20} onStudy={page.tickStudy} busy={busy} /></div> : null}

    <div className="calendar-thing-actions">
      {place ? <Link className="calendar-thing-primary" to={thing.href}>Open in {place}</Link> : null}
      {own && !changing ? <>
        <button type="button" onClick={() => page.setItemStatus(item, done ? '' : 'done')} disabled={busy}>{done ? 'Not done after all' : 'Done'}</button>
        <button type="button" onClick={() => setChanging(true)} disabled={busy}>Change</button>
        <button type="button" onClick={async () => { await page.setItemStatus(item, 'cancelled'); onBack() }} disabled={busy}>Take off the day</button>
      </> : null}
      {card?.hubCardId && card.semesterId ? <button type="button" onClick={() => page.tickStudy(card, null, !card.done)} disabled={busy}>{card.done ? 'Card not done after all' : 'Card done'}</button> : null}
      {job && !jobDone ? <button type="button" onClick={() => page.markJob(job, 'Applied')} disabled={busy} title="Mark it as applied in JobMap, with today’s date">I applied</button> : null}
    </div>
    {job && page.jobMark?.id === job.id ? <p className="day-marked" role="status">Marked as {page.jobMark.status.toLowerCase()} in JobMap.{page.jobMark.previous?.status ? <> <button type="button" className="day-mark" disabled={busy} onClick={page.undoJobMark}>Undo</button></> : null}</p> : null}
    {own && !changing ? <form className="calendar-thing-move" onSubmit={async (event) => { event.preventDefault(); if (await page.moveItem(item, moveTo)) onItem(null, moveTo) }}>
      <label>Move it to<input type="date" value={moveTo} min={addDays(page.date, -365)} onChange={(event) => setMoveTo(event.target.value)} /></label>
      <button type="submit" disabled={!isDateKey(moveTo) || moveTo === page.date || busy}>Move</button>
      {item.meta?.routine ? <small>This day of the repeating plan moves alone; the other days stay.</small> : null}
    </form> : null}
    {own && changing ? <ChangePlan entry={{ id: item.meta.entryId, routine: item.meta.routine }} onCancel={() => setChanging(false)} onSaved={() => { setChanging(false); page.refetch() }} /> : null}
    {page.error ? <p className="day-warn" role="alert">{page.error}</p> : null}

    <section className="calendar-thing-notes" aria-label="Notes about it">
      <h4>Notes about it</h4>
      <NoteList notes={notes} />
      <NoteForm page={page} about={{ id: thing.id, title: thing.title }} label={notes.length ? 'Another note' : 'A note about it'} />
    </section>
  </section>
}

function TabBody({ tab, page }) {
  const { data, isToday } = page
  const waiting = (empty) => <p className="day-quiet">{page.loading ? 'Loading…' : empty}</p>
  if (tab === 'study') return <Panel title="Study" href="/study" open="Open Study hub" unavailable={page.unavailable('study')}>
    {data?.study ? <StudyPanel study={data.study} label={isToday ? 'Today' : 'That day'} onStudy={page.tickStudy} savingId={page.savingId} /> : waiting('No semester is open.')}
  </Panel>
  if (tab === 'jobs') return <Panel title="Jobs" href="/jobmap" open="Open JobMap" unavailable={page.unavailable('jobs')}>
    {data?.jobs ? <JobsPanel jobs={data.jobs} onMark={page.markJob} marked={page.jobMark} onUndo={page.undoJobMark} savingId={page.savingId} /> : waiting('Nothing to show.')}
  </Panel>
  if (tab === 'home') return <Panel title="Home" href="/budget" open="Open Budget" unavailable={page.unavailable('home')}>
    {data?.home ? <HomePanel home={data.home} today={isToday} onTick={page.tickShopping} savingId={page.savingId} /> : waiting('Nothing to show.')}
  </Panel>
  if (tab === 'health') return <Panel title="Health" href="/health" open="Open Health"><HealthPanel today={page.date} isToday={isToday} /></Panel>
  return null
}

export default function CalendarDay({ date, itemKey, tab, areas, cardiffScope, onDay, onItem, onTab, onClose, onChanged }) {
  const page = useDayPage(date, { only: true, areas, cardiffScope, notesAnyDay: true, onChanged })
  const dialog = useRef(null)
  const notes = page.data?.notes ?? []
  const dayNotes = notes.filter((note) => !note.about)
  const notesFor = (key) => notes.filter((note) => note.about === thingId(key)).length
  const away = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${page.today}T12:00:00Z`)) / 86_400_000)

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    return () => { if (element?.open) element.close() }
  }, [])
  // ← and → go to the day before and after, when nothing is being typed and no thing is open.
  useEffect(() => {
    const onKey = (event) => {
      if (itemKey || event.altKey || event.ctrlKey || event.metaKey || typing(event.target)) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); onDay(addDays(date, -1)) }
      if (event.key === 'ArrowRight') { event.preventDefault(); onDay(addDays(date, 1)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [date, itemKey, onDay])

  return <dialog ref={dialog} className="calendar-day-dialog" aria-labelledby="calendar-day-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === dialog.current) onClose() }}>
    <div className="calendar-day-sheet day-page">
      <header className="calendar-day-head">
        <button type="button" className="calendar-day-step is-prev" onClick={() => onDay(addDays(date, -1))} aria-label="The day before">‹ <span>{formatCalendarDay(addDays(date, -1), { month: undefined })}</span></button>
        <div className="calendar-day-titles">
          <h2 id="calendar-day-title">{formatCalendarDay(date, { weekday: 'long', month: 'long', year: 'numeric' })}</h2>
          <p><span lang="fa" dir="rtl">{persianLong.format(new Date(`${date}T12:00:00Z`))}</span><span className="calendar-day-away">{daysAway(away)}</span></p>
        </div>
        <button type="button" className="calendar-day-step is-next" onClick={() => onDay(addDays(date, 1))} aria-label="The day after"><span>{formatCalendarDay(addDays(date, 1), { month: undefined })}</span> ›</button>
        <button type="button" className="calendar-day-close" onClick={onClose} aria-label="Close the day" title="Close (Esc)">×</button>
      </header>
      <nav className="calendar-day-tabs" aria-label="Parts of the day">
        <div role="tablist">{DAY_TABS.map((entry) => <button key={entry.key} type="button" role="tab" aria-selected={tab === entry.key && !itemKey} onClick={() => onTab(entry.key)}>{entry.label}</button>)}</div>
        <p className="calendar-day-links">
          <Link to={page.isToday ? '/today' : `/today?date=${date}`}>Open as a page</Link>
          <Link to={`/planner?week=${date}`}>Plan the week</Link>
          {page.isToday ? <Link to="/journal">Journal</Link> : null}
        </p>
      </nav>
      <div className="calendar-day-body">
        {itemKey ? <Thing page={page} thingKey={itemKey} onBack={() => onItem(null)} onItem={(next, movedTo) => (movedTo ? onDay(movedTo) : onItem(next))} />
          : tab !== 'day' ? <div className="calendar-day-panel"><TabBody tab={tab} page={page} /></div>
            : <>
              <AddLine page={page} id="calendar-day-add" />
              {page.day.error ? <p className="form-error" role="alert">The day's details could not be loaded: {page.day.error} <button type="button" className="day-retry" onClick={page.day.refetch}>Try again</button></p> : null}
              <section className="day-path calendar-day-path" aria-label="The day in order">
                <DayPath page={page} onOpen={onItem} notesFor={notesFor} />
              </section>
              <section className="calendar-day-notes-panel" aria-labelledby="calendar-day-notes-heading">
                <h3 id="calendar-day-notes-heading">Notes {page.isToday ? 'today' : 'for this day'}{dayNotes.length ? ` · ${count(dayNotes.length, 'note')}` : ''}</h3>
                <NoteList notes={dayNotes} />
                <NoteForm page={page} label="A note for the day" />
              </section>
            </>}
      </div>
    </div>
  </dialog>
}
