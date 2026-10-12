import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isDateKey } from '../../../shared/calendar.js'
import { addDays, calendarDisplay, formatCalendarDay } from '../lib/calendar.js'
import { daysAway } from '../lib/day.js'
import { useDayPage } from '../lib/useDayPage.js'
import { poemForDate } from '../lib/poems.js'
import CalendarItems, { CalendarStatus } from './CalendarItems.jsx'
import { AddLine, DayPanels, DayPath } from './DayParts.jsx'

// A whole day: today by default, any other day when the address names one (?date=2026-10-13).
export default function TodayView() {
  const [params, setParams] = useSearchParams()
  const page = useDayPage(params.get('date'))
  const { today, date, isToday, calendar, day, groups } = page
  const [showAllAttention, setShowAllAttention] = useState(false)
  const [showAllWeek, setShowAllWeek] = useState(false)
  const dailyPoem = useMemo(() => poemForDate(new Date()), [today])
  const attention = showAllAttention ? groups.attention : groups.attention.slice(0, 6)
  const listProps = { calendar, onComplete: page.completeTask, savingId: page.savingId }
  function show(next) { setParams(next === today ? {} : { date: next }) }

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

    <AddLine page={page} />
    <CalendarStatus calendar={calendar} />
    {day.error ? <p className="form-error" role="alert">The day's details could not be loaded: {day.error} <button type="button" className="day-retry" onClick={day.refetch}>Try again</button></p> : null}

    <div className="day-grid">
      <section className="day-path" aria-labelledby="day-path-heading">
        <header><h2 id="day-path-heading">{isToday ? 'Your day' : 'The day'}</h2><span>{isToday ? page.clock : daysAway(Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000))}</span></header>
        <DayPath page={page} />
      </section>
      <div className="day-panels"><DayPanels page={page} /></div>
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
    <div className="today-page-controls"><Link className="ghost-pill compact-pill" to={isToday ? '/calendar' : `/calendar?date=${date}`}>Open calendar</Link><Link className="ghost-pill compact-pill" to="/planner">Plan the week</Link><Link className="ghost-pill compact-pill" to="/review">Look back on the week</Link><Link className="ghost-pill compact-pill" to="/ledger">Recent entries</Link><button className="ghost-pill compact-pill" type="button" onClick={page.refetch} disabled={calendar.loading}>Refresh</button></div>
    <p className="today-section-note">Cardiff events show your saved plans and maybes from this browser. <Link to="/cardiff-life">Manage choices</Link>.</p>
    <footer className="ledger-poem" aria-label="Poem of the day"><div lang="fa" dir="rtl">{dailyPoem.lines.map((line, index) => <p key={index}>{line}</p>)}</div><small lang="fa" dir="rtl">{dailyPoem.poet}</small></footer>
  </section>
}
