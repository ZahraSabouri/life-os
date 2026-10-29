import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { useAddress } from '../lib/addresses.js'
import { CALENDAR_AREAS, CALENDAR_KINDS, addDays, calendarArea, calendarDisplay, calendarKind, dateForKey, filterCalendarItems, formatCalendarDay, isComplete, itemOverlaps, itemTime, sortCalendarItems } from '../lib/calendar.js'
import { movePlan, undoMove } from '../lib/plans.js'
import { CALENDAR_VIEWS, DAY_KEYS, daySpan, groupByDay, isNote, isoWeek, lastOfMonth, matchesSearch, monthGrid, placeOf, placeTimed, readCalendarAddress, shiftMonth, stepView, todayIn, viewRange, weekDays, weekHours, yearMonths } from '../lib/calendarViews.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { useLondonClock } from '../lib/useDay.js'
import { CalendarStatus } from './CalendarItems.jsx'
import CalendarDay from './CalendarDay.jsx'

const AREA_KEYS = CALENDAR_AREAS.map((area) => area.key)
const NONE = []
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const persianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', month: 'long', year: 'numeric' })
const persianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', year: 'numeric' })
const persianDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', day: 'numeric' })
const persianWeekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', weekday: 'short' })
const monthName = (month, options = {}) => formatCalendarDay(`${month}-01`, { weekday: undefined, day: undefined, month: 'long', ...options })
const span = (first, last) => (first === last ? first : `${first} – ${last}`)
const counted = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`
const typing = (target) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// What the view shows, as a heading in English and in the Persian calendar.
function headings(at) {
  if (at.view === 'week') {
    const last = addDays(at.week, 6)
    return {
      title: `${formatCalendarDay(at.week, { weekday: undefined, year: at.week.slice(0, 4) === last.slice(0, 4) ? undefined : 'numeric' })} – ${formatCalendarDay(last, { weekday: undefined, year: 'numeric' })}`,
      persian: span(persianMonth.format(dateForKey(at.week)), persianMonth.format(dateForKey(last))),
      note: `Week ${isoWeek(at.week)}`,
    }
  }
  if (at.view === 'year') return { title: at.year, persian: span(persianYear.format(dateForKey(`${at.year}-01-01`)), persianYear.format(dateForKey(`${at.year}-12-31`))), note: '' }
  return { title: monthName(at.month, { year: 'numeric' }), persian: span(persianMonth.format(dateForKey(`${at.month}-01`)), persianMonth.format(dateForKey(lastOfMonth(at.month)))), note: '' }
}

// The words on the two step buttons: the month, week or year before and after.
function stepWords(at) {
  if (at.view === 'week') return ['Week before', 'Week after']
  if (at.view === 'year') return [String(Number(at.year) - 1), String(Number(at.year) + 1)]
  return [monthName(shiftMonth(at.month, -1)), monthName(shiftMonth(at.month, 1))]
}

// Her own plan of one day, not done, can be dragged to another day (the same clock time there).
const canMove = (item) => item.meta?.source === 'core' && Boolean(item.meta?.entryId) && !isNote(item) && !isComplete(item) && daySpan(item).first === daySpan(item).last
// What a thing being dragged needs from the thing, and from a day it can be dropped on.
const dragFrom = (drag, item) => (drag && canMove(item) ? { draggable: true, onDragStart: (event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.title); drag.start(item) }, onDragEnd: drag.end } : {})
const dropOn = (drag, key) => (drag ? {
  onDragOver: (event) => { if (!drag.current()) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (drag.over !== key) drag.setOver(key) },
  onDragLeave: (event) => { if (drag.current() && !event.currentTarget.contains(event.relatedTarget)) drag.setOver('') },
  onDrop: (event) => { if (!drag.current()) return; event.preventDefault(); drag.drop(key) },
} : {})

function Chip({ item, onOpen, drag }) {
  const time = item.all_day ? '' : itemTime(item).split('–')[0]
  const words = `${item.meta?.savedSnapshot ? 'Saved copy · ' : ''}${item.choice === 'maybe' ? 'Maybe · ' : ''}${item.title}`
  const moving = dragFrom(drag, item)
  return <button type="button" className={`day-chip${isComplete(item) ? ' is-complete' : ''}${moving.draggable ? ' is-movable' : ''}`} data-kind={item.kind} data-choice={item.choice} onClick={(event) => { event.stopPropagation(); onOpen(item.id) }}
    style={{ '--item-accent': calendarArea(item.area).tone }} title={`${words} · ${calendarArea(item.area).label}${time ? ` · ${itemTime(item)}` : ''}${moving.draggable ? ' · drag it to another day' : ''}`} {...moving}>
    {time ? <small className="day-chip-time">{time}</small> : null}<span>{words}</span>
  </button>
}

function MonthView({ at, today, on, notesOn, calendar, openDay, showWeek, drag, justOpen }) {
  const grid = useMemo(() => monthGrid(at.month, today), [at.month, today])
  return <>
    <div className="calendar-weekdays has-weeks" aria-hidden="true">
      <span className="calendar-week-head">Wk</span>
      {WEEKDAYS.map((label, index) => <span key={label}><strong>{label}</strong><small lang="fa" dir="rtl">{persianWeekday.format(dateForKey(addDays('2026-01-05', index)))}</small></span>)}
    </div>
    <div className="month-grid has-weeks">
      {grid.weeks.map((week) => <Fragment key={week.start}>
        <button type="button" className="calendar-week-number" onClick={() => showWeek(week.start)} title={`Week ${week.number}: show it by the hour`} aria-label={`Week ${week.number}, from ${formatCalendarDay(week.start)}: show the week`}>{week.number}</button>
        {week.days.map((day) => {
          const dayItems = on(day.key)
          const dayNotes = notesOn(day.key).length
          const display = calendarDisplay(calendar, { areas: at.areas, count: dayItems.length })
          return <article key={day.key} className={`calendar-day${day.current ? '' : ' muted-day'}${day.today ? ' today-day' : ''}${day.weekend ? ' weekend-day' : ''}${day.key === at.day ? ' selected-day' : ''}${day.key === justOpen ? ' was-open' : ''}${drag.over === day.key ? ' is-drop' : ''}`} onClick={() => openDay(day.key)} {...dropOn(drag, day.key)}>
            <button className="calendar-day-select" type="button" data-day={day.key} onClick={(event) => { event.stopPropagation(); openDay(day.key) }} aria-label={`${formatCalendarDay(day.key, { weekday: 'long', month: 'long', year: 'numeric' })}, ${display.countLabel}${dayNotes ? `, ${counted(dayNotes, 'note')}` : ''}. Open the day`}>
              <time dateTime={day.key}><span>{day.number}</span><small lang="fa" dir="rtl">{persianDay.format(dateForKey(day.key))}</small></time>
              {dayNotes ? <span className="calendar-day-notes" aria-hidden="true" title={counted(dayNotes, 'note')}>✎{dayNotes > 1 ? dayNotes : ''}</span> : null}
              <span className="calendar-mobile-count">{display.state === 'ready' ? dayItems.length || '' : display.state === 'partial' ? `${dayItems.length}+` : '?'}</span>
            </button>
            <button type="button" className="calendar-day-add" onClick={(event) => { event.stopPropagation(); openDay(day.key, '', '') }} aria-label={`Add to ${formatCalendarDay(day.key, { weekday: 'long', month: 'long' })}`} title="Add a plan, a note or something to buy">+</button>
            <div className="day-entry-list">
              {dayItems.slice(0, 4).map((item) => <Chip key={item.id} item={item} drag={drag} onOpen={(id) => openDay(day.key, id)} />)}
              {dayItems.length > 4 ? <button className="calendar-more" type="button" onClick={(event) => { event.stopPropagation(); openDay(day.key) }}>+{dayItems.length - 4} more</button> : null}
            </div>
          </article>
        })}
      </Fragment>)}
    </div>
  </>
}

function WeekView({ at, today, on, notesOn, openDay, drag, justOpen }) {
  const clock = useLondonClock()
  const days = useMemo(() => weekDays(at.week, today), [at.week, today])
  const placed = useMemo(() => Object.fromEntries(days.map((day) => [day.key, placeTimed(on(day.key), day.key)])), [days, on])
  const hours = weekHours(Object.values(placed).flat())
  const total = (hours.to - hours.from) * 60
  const at0 = hours.from * 60
  const now = (() => { const [hour, minute] = clock.split(':').map(Number); return hour * 60 + minute })()
  return <div className="calendar-week" style={{ '--hours': hours.to - hours.from }}>
    <div className="calendar-week-row calendar-week-days">
      <span className="calendar-week-corner">Wk {isoWeek(at.week)}</span>
      {days.map((day) => <button key={day.key} type="button" data-day={day.key} className={`calendar-week-day${day.today ? ' today-day' : ''}${day.weekend ? ' weekend-day' : ''}${day.key === justOpen ? ' was-open' : ''}`} onClick={() => openDay(day.key)} aria-label={`${formatCalendarDay(day.key, { weekday: 'long', month: 'long' })}: open the day`}>
        <strong>{formatCalendarDay(day.key, { month: undefined })}</strong><small lang="fa" dir="rtl">{persianWeekday.format(dateForKey(day.key))} {persianDay.format(dateForKey(day.key))}</small>
        {notesOn(day.key).length ? <span className="calendar-day-notes" aria-hidden="true">✎</span> : null}
      </button>)}
    </div>
    <div className="calendar-week-row calendar-week-allday">
      <span className="calendar-week-corner">All day</span>
      {days.map((day) => <div key={day.key} className={`day-entry-list${drag.over === day.key ? ' is-drop' : ''}`} onClick={() => openDay(day.key, '', '')} {...dropOn(drag, day.key)}>
        {on(day.key).filter((item) => item.all_day).map((item) => <Chip key={item.id} item={item} drag={drag} onOpen={(id) => openDay(day.key, id)} />)}
      </div>)}
    </div>
    <div className="calendar-week-row calendar-week-hours">
      <div className="calendar-week-clock" aria-hidden="true">
        {Array.from({ length: hours.to - hours.from }, (_, index) => <span key={index}>{String(hours.from + index).padStart(2, '0')}:00</span>)}
      </div>
      {/* A click on an empty hour opens the day with that time in the add line. */}
      {days.map((day) => <div key={day.key} className={`calendar-week-column${day.today ? ' today-day' : ''}${drag.over === day.key ? ' is-drop' : ''}`} title="Click an hour to add a plan then" {...dropOn(drag, day.key)}
        onClick={(event) => { const box = event.currentTarget.getBoundingClientRect(); const minute = at0 + Math.max(0, Math.min(total - 30, Math.floor(((event.clientY - box.top) / box.height) * total / 30) * 30)); openDay(day.key, '', `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')} `) }}>
        {placed[day.key].map(({ item, start, end, column, columns, span: wide }) => <button key={item.id} type="button"
          className={`calendar-week-item${isComplete(item) ? ' is-complete' : ''}`} data-kind={item.kind} data-choice={item.choice} {...dragFrom(drag, item)}
          style={{ '--item-accent': calendarArea(item.area).tone, top: `${((start - at0) / total) * 100}%`, height: `${((end - start) / total) * 100}%`, left: `${(column / columns) * 100}%`, width: `${(wide / columns) * 100}%` }}
          onClick={(event) => { event.stopPropagation(); openDay(day.key, item.id) }} title={`${itemTime(item)} · ${item.title} · ${calendarArea(item.area).label}${canMove(item) ? ' · drag it to another day' : ''}`}>
          <small>{itemTime(item)}</small><span>{item.choice === 'maybe' ? 'Maybe · ' : ''}{item.title}</span>
        </button>)}
        {day.today && now >= at0 && now <= at0 + total ? <i className="calendar-week-now" style={{ top: `${((now - at0) / total) * 100}%` }} aria-hidden="true" /> : null}
      </div>)}
    </div>
  </div>
}

// The month day by day. This month starts at today; the days before it are one click away.
function ListView({ at, today, on, calendar, openDay, justOpen }) {
  const [earlier, setEarlier] = useState(false)
  const all = []
  for (let day = `${at.month}-01`; day <= lastOfMonth(at.month); day = addDays(day, 1)) {
    const dayItems = on(day)
    if (dayItems.length) all.push({ day, items: dayItems })
  }
  const from = at.month === today.slice(0, 7) && !earlier ? today : ''
  const days = all.filter(({ day }) => day >= from)
  const before = all.length - days.length
  if (!all.length) return calendar.loading ? null : <p className="empty-state">{calendarDisplay(calendar, { areas: at.areas, empty: at.q ? `Nothing this month matches “${at.q}”.` : at.areas.length ? 'Nothing dated this month in the chosen areas.' : 'Choose an area to see its dates.' }).emptyMessage}</p>
  return <>{before ? <button type="button" className="ghost-pill compact-pill calendar-list-earlier" onClick={() => setEarlier(true)}>Show the {counted(before, 'earlier day')} this month</button> : null}
  <ol className="calendar-list">
    {days.length ? null : <li className="calendar-list-day"><p className="empty-state">Nothing more this month.</p></li>}
    {days.map(({ day, items: dayItems }) => <li key={day} className={`calendar-list-day${day === today ? ' is-today' : ''}${day === justOpen ? ' was-open' : ''}`}>
      <button type="button" className="calendar-list-date" data-day={day} onClick={() => openDay(day)} aria-label={`${formatCalendarDay(day, { weekday: 'long', month: 'long' })}: open the day`}>
        <strong>{day === today ? 'Today' : formatCalendarDay(day, { weekday: 'short' })}</strong>{day === today ? <span>{formatCalendarDay(day, { weekday: 'short' })}</span> : null}<small lang="fa" dir="rtl">{persianDay.format(dateForKey(day))}</small>
      </button>
      <ol className="calendar-list-items">
        {dayItems.map((item) => <li key={item.id} className={isComplete(item) ? 'is-complete' : undefined} data-kind={item.kind} style={{ '--item-accent': calendarArea(item.area).tone }}>
          <span className="calendar-list-time">{itemTime(item)}</span>
          <button type="button" className="calendar-list-title" onClick={() => openDay(day, item.id)}>{item.choice === 'maybe' ? 'Maybe · ' : ''}{item.title}</button>
          <span className="calendar-item-meta"><span>{calendarArea(item.area).label}</span><span className="calendar-kind-tag">{calendarKind(item.kind)}</span>{item.meta?.candidate && !item.choice ? <span>Available option</span> : null}</span>
          {placeOf(item.href) ? <Link className="calendar-list-open" to={item.href}>Open in {placeOf(item.href)}</Link> : null}
        </li>)}
      </ol>
    </li>)}
  </ol></>
}

function YearView({ at, today, on, openDay, showMonth, justOpen }) {
  return <div className="calendar-year">
    {yearMonths(at.year).map((month) => {
      const grid = monthGrid(month, today)
      const total = grid.weeks.flatMap((week) => week.days).filter((day) => day.current).reduce((sum, day) => sum + on(day.key).length, 0)
      return <section key={month} className={`calendar-mini-month${month === today.slice(0, 7) ? ' is-now' : ''}`} aria-label={monthName(month)}>
        <h3><button type="button" onClick={() => showMonth(month)}>{monthName(month)}</button><small>{total ? counted(total, 'thing') : ''}</small></h3>
        <div className="calendar-mini-grid">
          {WEEKDAYS.map((label) => <span key={label} className="calendar-mini-weekday" aria-hidden="true">{label[0]}</span>)}
          {grid.weeks.flatMap((week) => week.days).map((day) => {
            const count = on(day.key).length
            return day.current ? <button key={day.key} type="button" data-day={day.key} className={`calendar-mini-day${day.today ? ' today-day' : ''}${day.key === justOpen ? ' was-open' : ''}`} data-load={count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : 3}
              onClick={() => openDay(day.key)} aria-label={`${formatCalendarDay(day.key, { weekday: 'long', month: 'long' })}: ${counted(count, 'thing')}`}>{day.number}</button>
              : <span key={day.key} className="calendar-mini-day is-outside" aria-hidden="true" />
          })}
        </div>
      </section>
    })}
  </div>
}

export default function CalendarView() {
  const today = useLondonToday()
  const address = useAddress()
  const at = useMemo(() => readCalendarAddress(address.params, today, AREA_KEYS), [address.params, today])
  const range = useMemo(() => viewRange(at), [at])
  const calendar = useCalendar(range.from, range.to)
  const shown = useMemo(() => sortCalendarItems(filterCalendarItems(calendar.items, { areas: at.areas, cardiffScope: at.cardiff, choices: calendar.choices }).filter((item) => matchesSearch(item, at.q))), [calendar.items, calendar.choices, at.areas, at.cardiff, at.q])
  const items = useMemo(() => shown.filter((item) => !isNote(item)), [shown])
  const notes = useMemo(() => shown.filter(isNote), [shown])
  // Each day's things, worked out once for the view; a day outside it has none.
  const byDay = useMemo(() => groupByDay(items, range.from, range.to), [items, range])
  const notesByDay = useMemo(() => groupByDay(notes, range.from, range.to), [notes, range])
  const on = useCallback((day) => byDay.get(day) ?? NONE, [byDay])
  const notesOn = useCallback((day) => notesByDay.get(day) ?? NONE, [notesByDay])
  const [query, setQuery] = useState(at.q)
  const [captureTitle, setCaptureTitle] = useState('')
  const [captureDate, setCaptureDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  // A plan being dragged, the day it is over, and the last move with its Undo.
  const dragging = useRef(null)
  const [over, setOver] = useState('')
  const [moved, setMoved] = useState(null)
  // What to put in the day's add line when it opens ('' just puts the cursor there; "14:00 " a time).
  const [prefill, setPrefill] = useState(null)
  // The day last opened: when it closes, it has the focus again and is marked for a moment.
  const opened = useRef('')
  const [justOpen, setJustOpen] = useState('')
  const heading = headings(at)
  const [before, after] = stepWords(at)
  // What the heading's count covers: the week, the month (not the days of the months around it), or the year.
  const counting = at.view === 'week' || at.view === 'year' ? items.length
    : items.filter((item) => itemOverlaps(item, `${at.month}-01`, lastOfMonth(at.month))).length
  const isNow = at.view === 'week' ? at.week === todayIn('week', today).week : at.view === 'year' ? at.year === today.slice(0, 4) : at.month === today.slice(0, 7)

  // An older link names a day with ?date=: it becomes the month and the day, open.
  useEffect(() => { if (at.legacy) address.swap({ date: null, month: at.legacy.slice(0, 7), day: at.legacy }) }, [at.legacy, address])
  // The search box follows the address when Back changes it.
  useEffect(() => { setQuery(at.q) }, [at.q])
  useEffect(() => {
    if (query === at.q) return undefined
    const timer = window.setTimeout(() => address.swap({ q: query.trim() || null }), 250)
    return () => window.clearTimeout(timer)
  }, [query, at.q, address])

  const step = (amount) => address.show(stepView(at, amount))
  const goToday = () => address.show(todayIn(at.view, today))
  const showView = (view) => address.show({ view: view === 'month' ? null : view, week: view === 'week' ? at.week : null })
  const showMonth = (month) => address.show({ view: at.view === 'agenda' ? 'agenda' : null, month, week: null })
  const openDay = (day, item = '', add = null) => { setPrefill(add === null ? null : { day, text: add }); address.open('day', { day, item: item || null, tab: null }) }
  async function moveTo(day) {
    const item = dragging.current
    dragging.current = null
    setOver('')
    if (!item || daySpan(item).first === day) return
    try {
      const done = await movePlan(item, day)
      setMoved({ words: `Moved “${item.title}” to ${formatCalendarDay(day, { weekday: 'long', month: 'long' })}.`, undo: () => undoMove(item, done) })
    } catch (failure) { setMoved({ words: `Could not move “${item.title}”: ${failure.message}` }) }
    calendar.refetch()
  }
  async function undoMoved() {
    const last = moved
    if (!last?.undo) return
    setMoved({ words: 'Taking it back…' })
    try { await last.undo(); setMoved({ words: 'Taken back.' }) } catch (failure) { setMoved({ words: `Could not take it back: ${failure.message}` }) }
    calendar.refetch()
  }
  const drag = { current: () => dragging.current, over, setOver, start: (item) => { dragging.current = item }, end: () => { dragging.current = null; setOver('') }, drop: moveTo }

  useEffect(() => {
    if (!moved || moved.words === 'Taking it back…') return undefined
    const timer = window.setTimeout(() => setMoved(null), 12_000)
    return () => window.clearTimeout(timer)
  }, [moved])
  useEffect(() => {
    if (at.day) { opened.current = at.day; setJustOpen(''); return undefined }
    if (!opened.current) return undefined
    const key = opened.current
    opened.current = ''
    setJustOpen(key)
    window.requestAnimationFrame(() => document.querySelector(`[data-day="${key}"]`)?.focus({ preventScroll: true }))
    const timer = window.setTimeout(() => setJustOpen(''), 1800)
    return () => window.clearTimeout(timer)
  }, [at.day])
  const toggleArea = (key) => { const hidden = at.hidden.includes(key) ? at.hidden.filter((area) => area !== key) : [...at.hidden, key]; address.swap({ hide: hidden.join(',') || null }) }

  // Keys, when nothing is being typed and the day is not open: ← and → step, T is today, M W L Y the views.
  useEffect(() => {
    if (at.day) return undefined
    const onKey = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || typing(event.target)) return
      const views = { m: 'month', w: 'week', l: 'agenda', y: 'year' }
      if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key.toLowerCase() === 't') goToday()
      else if (views[event.key.toLowerCase()]) showView(views[event.key.toLowerCase()])
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleCapture(event) {
    event.preventDefault()
    const date = captureDate || at.day || today
    if (!captureTitle.trim() || saving) return
    setSaving(true)
    setActionError('')
    try {
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'event', title: captureTitle.trim(), start_at: date, all_day: true }) })
      setCaptureTitle('')
      calendar.refetch()
      openDay(date)
    } catch (error) { setActionError(error.message) }
    finally { setSaving(false) }
  }

  return <section className="calendar-layout calendar-board-layout unified-calendar calendar-plus" aria-label="Calendar">
    <header className="calendar-board-header">
      <div className="calendar-brandline"><h1>Calendar</h1><span /></div>
      <div className="calendar-title-stack">
        <h2 id="calendar-month-heading">{heading.title}</h2>
        <p lang="fa" dir="rtl">{heading.persian}</p>
        {heading.note ? <p className="calendar-heading-note">{heading.note}</p> : null}
      </div>
    </header>

    <aside className="calendar-legend calendar-filters" aria-label="Calendar filters">
      <p className="calendar-filter-heading">Your areas</p>
      {CALENDAR_AREAS.map((area) => <label key={area.key} style={{ '--item-accent': area.tone }}>
        <input type="checkbox" checked={!at.hidden.includes(area.key)} onChange={() => toggleArea(area.key)} /><span className="calendar-area-dot" aria-hidden="true" /><strong>{area.label}</strong>
      </label>)}
      <label className="calendar-scope-label" htmlFor="calendar-cardiff-scope">Cardiff events</label>
      <select id="calendar-cardiff-scope" value={at.cardiff} onChange={(event) => address.swap({ cardiff: event.target.value === 'all' ? null : event.target.value })}>
        <option value="saved">Saved plans & maybe</option><option value="going">Plan to go</option><option value="all">All researched options</option>
      </select>
      <p className="calendar-filter-note">Showing researched options does not add them to your plans. Choose Maybe or Plan to go in Cardiff Life. <Link to="/cardiff-life">Open Cardiff Life</Link></p>
      <div className="calendar-kind-legend" aria-label="Item kinds">{CALENDAR_KINDS.map((kind) => <span key={kind.key} data-kind={kind.key}>{kind.label}</span>)}</div>
      <p className="calendar-filter-note calendar-keys">Keys: ← → move, T today, M W L Y the views. Click a day to open it.</p>
    </aside>

    <section className="calendar-board calendar-month" aria-labelledby="calendar-month-heading">
      <nav className="calendar-nav" aria-label="Move through the calendar">
        <div className="calendar-steps">
          <button type="button" onClick={() => step(-1)} aria-label={`Show ${before}`}>‹ {before}</button>
          <button type="button" onClick={goToday} aria-pressed={isNow}>Today</button>
          <button type="button" onClick={() => step(1)} aria-label={`Show ${after}`}>{after} ›</button>
          <label className="calendar-jump">Go to<input type="month" value={at.month} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) address.show({ month: event.target.value, week: at.view === 'week' ? `${event.target.value}-01` : null }) }} /></label>
        </div>
        <div className="calendar-views" role="group" aria-label="How to show it">
          {CALENDAR_VIEWS.map((view) => <button key={view.key} type="button" aria-pressed={at.view === view.key} onClick={() => showView(view.key)}>{view.label}</button>)}
        </div>
        <label className="calendar-search"><span className="visually-hidden">Search the calendar</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: a title, a place…" maxLength={100} />
        </label>
      </nav>
      <div className="calendar-view-controls">
        <button type="button" className="ghost-pill compact-pill" onClick={calendar.refetch} disabled={calendar.loading}>Refresh</button>
        {at.q ? <button type="button" className="ghost-pill compact-pill" onClick={() => { setQuery(''); address.swap({ q: null }) }}>Clear the search</button> : null}
        <span>{calendarDisplay(calendar, { areas: at.areas, count: counting, noun: at.q ? 'match' : 'dated item' }).countLabel.replace('matchs', 'matches')}{notes.length ? ` · ${counted(notes.length, 'note')}` : ''}</span>
      </div>
      <CalendarStatus calendar={calendar} />
      {at.view === 'week' ? <WeekView at={at} today={today} on={on} notesOn={notesOn} openDay={openDay} drag={drag} justOpen={justOpen} />
        : at.view === 'agenda' ? <ListView at={at} today={today} on={on} calendar={calendar} openDay={openDay} justOpen={justOpen} />
          : at.view === 'year' ? <YearView at={at} today={today} on={on} openDay={openDay} showMonth={showMonth} justOpen={justOpen} />
            : <MonthView at={at} today={today} on={on} notesOn={notesOn} calendar={calendar} openDay={openDay} drag={drag} justOpen={justOpen} showWeek={(week) => address.show({ view: 'week', week, month: addDays(week, 3).slice(0, 7) })} />}
    </section>

    <form className="calendar-capture-bar calendar-explicit-capture" onSubmit={handleCapture}>
      <label className="calendar-capture-title">Add a Life OS event<input value={captureTitle} onChange={(event) => setCaptureTitle(event.target.value)} placeholder="Event title" aria-label="Event title" /></label>
      <label>Date<input aria-label="Event date" type="date" value={captureDate || at.day || today} onChange={(event) => setCaptureDate(event.target.value)} required /></label>
      <button className="ghost-pill" type="submit" disabled={!captureTitle.trim() || saving}>{saving ? 'Saving…' : 'Add event'}</button>
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
    </form>

    {moved ? <div className="calendar-toast" role="status"><span>{moved.words}</span>{moved.undo ? <button type="button" onClick={undoMoved}>Undo</button> : null}<button type="button" className="calendar-toast-close" onClick={() => setMoved(null)} aria-label="Close">×</button></div> : null}

    {at.day ? <CalendarDay key="day" date={at.day} itemKey={at.item} tab={at.tab} areas={at.areas} cardiffScope={at.cardiff}
      prefill={prefill?.day === at.day ? prefill : null} onPrefilled={() => setPrefill(null)}
      onDay={(day) => address.swap({ day, month: day.slice(0, 7), item: null })}
      onItem={(item) => (item ? address.open('item', { item }) : address.close(['item']))}
      onTab={(tab) => address.swap({ tab: tab === 'day' ? null : tab, item: null })}
      onClose={() => address.close(['day', 'item'], DAY_KEYS)}
      onChanged={calendar.refetch} /> : null}
  </section>
}
