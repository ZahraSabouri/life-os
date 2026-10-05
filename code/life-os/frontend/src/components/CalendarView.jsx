import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { CALENDAR_AREAS, CALENDAR_KINDS, addDays, calendarArea, dateForKey, dateKey, filterCalendarItems, formatCalendarDay, itemOverlaps, sortCalendarItems } from '../lib/calendar.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { isDateKey } from '@shared/calendar.js'
import CalendarItems, { CalendarStatus } from './CalendarItems.jsx'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const persianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', month: 'long', year: 'numeric' })
const persianDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', day: 'numeric' })
const persianWeekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', weekday: 'short' })

function monthStart(key) { return `${key.slice(0, 7)}-01` }
function shiftMonth(key, amount) {
  const date = dateForKey(key)
  date.setUTCMonth(date.getUTCMonth() + amount, 1)
  return monthStart(dateKey(date))
}
function monthGrid(month, today) {
  const first = dateForKey(month)
  const lastKey = addDays(shiftMonth(month, 1), -1)
  const firstWeekday = (first.getUTCDay() + 6) % 7
  const lastWeekday = (dateForKey(lastKey).getUTCDay() + 6) % 7
  const from = addDays(month, -firstWeekday)
  const to = addDays(lastKey, 6 - lastWeekday)
  const days = []
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    days.push({ key: cursor, date: dateForKey(cursor), current: cursor.slice(0, 7) === month.slice(0, 7), today: cursor === today })
  }
  return { from, to, days, lastKey }
}

export default function CalendarView() {
  const today = useLondonToday()
  const location = useLocation()
  const requestedDay = new URLSearchParams(location.search).get('date')
  const initialDay = isDateKey(requestedDay) ? requestedDay : today
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(initialDay))
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const [areas, setAreas] = useState(() => CALENDAR_AREAS.map(area => area.key))
  const [cardiffScope, setCardiffScope] = useState('saved')
  const [view, setView] = useState('month')
  const [captureTitle, setCaptureTitle] = useState('')
  const [captureDate, setCaptureDate] = useState(initialDay)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const grid = useMemo(() => monthGrid(visibleMonth, today), [visibleMonth, today])
  const calendar = useCalendar(grid.from, grid.to)
  const items = useMemo(() => sortCalendarItems(filterCalendarItems(calendar.items, { areas, cardiffScope, choices: calendar.choices })), [calendar.items, areas, cardiffScope, calendar.choices])
  const selectedItems = items.filter(item => itemOverlaps(item, selectedDay, selectedDay))
  const monthItems = items.filter(item => itemOverlaps(item, visibleMonth, grid.lastKey))
  const monthLabel = formatCalendarDay(visibleMonth, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })
  const firstPersian = persianMonth.format(dateForKey(visibleMonth))
  const lastPersian = persianMonth.format(dateForKey(grid.lastKey))

  useEffect(() => {
    if (isDateKey(requestedDay)) {
      setVisibleMonth(monthStart(requestedDay))
      setSelectedDay(requestedDay)
      setCaptureDate(requestedDay)
    }
  }, [requestedDay])

  function changeMonth(amount) {
    const next = shiftMonth(visibleMonth, amount)
    setVisibleMonth(next)
    setSelectedDay(next)
    setCaptureDate(next)
  }
  function selectDay(key) { setSelectedDay(key); setCaptureDate(key) }
  function toggleArea(key) { setAreas(current => current.includes(key) ? current.filter(area => area !== key) : [...current, key]) }
  async function handleCapture(event) {
    event.preventDefault()
    if (!captureTitle.trim() || !captureDate || saving) return
    setSaving(true)
    setActionError('')
    try {
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({ type: 'event', title: captureTitle.trim(), start_at: captureDate, all_day: true }) })
      setCaptureTitle('')
      if (monthStart(captureDate) !== visibleMonth) setVisibleMonth(monthStart(captureDate))
      setSelectedDay(captureDate)
      calendar.refetch()
    } catch (error) { setActionError(error.message) }
    finally { setSaving(false) }
  }

  return <section className="calendar-layout calendar-board-layout unified-calendar" aria-label="Calendar">
    <header className="calendar-board-header">
      <div className="calendar-brandline"><h1>Calendar</h1><span /></div>
      <div className="calendar-title-stack">
        <h2 id="calendar-month-heading">{monthLabel}</h2>
        <p lang="fa" dir="rtl">{firstPersian === lastPersian ? firstPersian : `${firstPersian} – ${lastPersian}`}</p>
        <div className="calendar-board-controls" aria-label="Month controls">
          <button className="ghost-pill compact-pill" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">Prev</button>
          <button className="ghost-pill compact-pill" type="button" onClick={() => { setVisibleMonth(monthStart(today)); selectDay(today) }}>Today</button>
          <button className="ghost-pill compact-pill" type="button" onClick={() => changeMonth(1)} aria-label="Next month">Next</button>
        </div>
      </div>
    </header>

    <aside className="calendar-legend calendar-filters" aria-label="Calendar filters">
      <p className="calendar-filter-heading">Your areas</p>
      {CALENDAR_AREAS.map(area => <label key={area.key} style={{ '--item-accent': area.tone }}>
        <input type="checkbox" checked={areas.includes(area.key)} onChange={() => toggleArea(area.key)} /><span className="calendar-area-dot" aria-hidden="true" /><strong>{area.label}</strong>
      </label>)}
      <label className="calendar-scope-label" htmlFor="calendar-cardiff-scope">Cardiff events</label>
      <select id="calendar-cardiff-scope" value={cardiffScope} onChange={event => setCardiffScope(event.target.value)}>
        <option value="saved">Saved plans & maybe</option><option value="going">Plan to go</option><option value="all">All researched options</option>
      </select>
      <p className="calendar-filter-note">Choices come from Cardiff Life in this browser. <Link to="/cardiff-life">Open Cardiff Life</Link></p>
      <div className="calendar-kind-legend" aria-label="Item kinds">{CALENDAR_KINDS.map(kind => <span key={kind.key} data-kind={kind.key}>{kind.label}</span>)}</div>
    </aside>

    <section className="calendar-board calendar-month" aria-labelledby="calendar-month-heading">
      <div className="calendar-view-controls" aria-label="Calendar view">
        <button type="button" className="ghost-pill compact-pill" aria-pressed={view === 'month'} onClick={() => setView('month')}>Month</button>
        <button type="button" className="ghost-pill compact-pill" aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}>Agenda</button>
        <button type="button" className="ghost-pill compact-pill" onClick={calendar.refetch} disabled={calendar.loading}>Refresh</button>
        <span>{calendar.loading ? 'Loading…' : `${monthItems.length} dated ${monthItems.length === 1 ? 'item' : 'items'}`}</span>
      </div>
      <CalendarStatus calendar={calendar} />
      {view === 'month' ? <>
        <div className="calendar-weekdays" aria-hidden="true">{WEEKDAYS.map((label, index) => <span key={label}><strong>{label}</strong><small lang="fa" dir="rtl">{persianWeekday.format(dateForKey(addDays('2026-01-05', index)))}</small></span>)}</div>
        <div className="month-grid">
          {grid.days.map(day => {
            const dayItems = items.filter(item => itemOverlaps(item, day.key, day.key))
            return <article className={`calendar-day${day.current ? '' : ' muted-day'}${day.today ? ' today-day' : ''}${day.key === selectedDay ? ' selected-day' : ''}`} key={day.key}>
              <button className="calendar-day-select" type="button" onClick={() => selectDay(day.key)} aria-pressed={day.key === selectedDay} aria-label={`${formatCalendarDay(day.key, { weekday: 'long', year: 'numeric' })}, ${dayItems.length} ${dayItems.length === 1 ? 'item' : 'items'}`}>
                <time dateTime={day.key}><span>{day.date.getUTCDate()}</span><small lang="fa" dir="rtl">{persianDay.format(day.date)}</small></time>
                <span className="calendar-mobile-count">{dayItems.length || ''}</span>
              </button>
              <div className="day-entry-list">{dayItems.slice(0, 3).map(item => <Link className="day-chip" data-kind={item.kind} data-choice={item.choice} key={item.id} to={item.href || '/calendar'} style={{ '--item-accent': calendarArea(item.area).tone }} title={`${item.choice === 'maybe' ? 'Maybe · ' : ''}${item.title} · ${calendarArea(item.area).label}`}>{item.choice === 'maybe' ? 'Maybe · ' : ''}{item.title}</Link>)}{dayItems.length > 3 ? <button className="calendar-more" type="button" onClick={() => selectDay(day.key)}>+{dayItems.length - 3} more</button> : null}</div>
            </article>
          })}
        </div>
        <section className="calendar-day-agenda" aria-labelledby="calendar-day-heading">
          <h3 id="calendar-day-heading">{formatCalendarDay(selectedDay, { weekday: 'long', year: 'numeric' })}</h3>
          {!calendar.loading ? <CalendarItems items={selectedItems} empty={areas.length ? 'Nothing dated for this day in the selected areas.' : 'Choose an area to see its dates.'} /> : null}
        </section>
      </> : <section className="calendar-day-agenda" aria-label="Month agenda">
        {!calendar.loading ? <CalendarItems items={monthItems} showDate empty={areas.length ? 'Nothing dated this month in the selected areas.' : 'Choose an area to see its dates.'} /> : null}
      </section>}
    </section>

    <form className="calendar-capture-bar calendar-explicit-capture" onSubmit={handleCapture}>
      <label className="calendar-capture-title">Add a Life OS event<input value={captureTitle} onChange={event => setCaptureTitle(event.target.value)} placeholder="Event title" aria-label="Event title" /></label>
      <label>Date<input aria-label="Event date" type="date" value={captureDate} onChange={event => setCaptureDate(event.target.value)} required /></label>
      <button className="ghost-pill" type="submit" disabled={!captureTitle.trim() || !captureDate || saving}>{saving ? 'Saving…' : 'Add event'}</button>
      {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
    </form>
  </section>
}
