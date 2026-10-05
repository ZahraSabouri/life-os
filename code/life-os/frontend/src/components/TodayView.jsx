import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { addDays, calendarDisplay, filterCalendarItems, formatCalendarDay, todayGroups } from '../lib/calendar.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { poemForDate } from '../lib/poems.js'
import CalendarItems, { CalendarStatus } from './CalendarItems.jsx'

export default function TodayView() {
  const today = useLondonToday()
  const calendar = useCalendar(addDays(today, -350), addDays(today, 14))
  const [savingId, setSavingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAllAttention, setShowAllAttention] = useState(false)
  const items = useMemo(() => filterCalendarItems(calendar.items, { choices: calendar.choices }), [calendar.items, calendar.choices])
  const groups = useMemo(() => todayGroups(items, today), [items, today])
  const dailyPoem = useMemo(() => poemForDate(new Date()), [today])
  const attention = showAllAttention ? groups.attention : groups.attention.slice(0, 8)

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
  return <section className="today-layout unified-today" aria-label="Today">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Today</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{formatCalendarDay(today, { weekday: 'long', year: 'numeric' })}</time><p lang="fa" dir="rtl">{new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p></div>
    </header>
    <div className="today-page-controls"><Link className="ghost-pill compact-pill" to="/calendar">Open calendar</Link><Link className="ghost-pill compact-pill" to="/ledger">Recent entries</Link><button className="ghost-pill compact-pill" type="button" onClick={calendar.refetch} disabled={calendar.loading}>Refresh</button></div>
    <CalendarStatus calendar={calendar} />
    {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
    <div className="today-cross-area-grid">
      <section className="today-cross-area-panel today-main-panel" aria-labelledby="today-schedule-heading">
        <div className="today-panel-title"><h2 id="today-schedule-heading">Your day</h2><span>{calendarDisplay(calendar, { count: groups.today.length }).countLabel}</span></div>
        {!calendar.loading ? <CalendarItems items={groups.today} {...listProps} empty="Nothing dated for today. Add an event in the calendar, or plan in your rooms." /> : null}
      </section>
      <section className="today-cross-area-panel today-attention-panel" aria-labelledby="today-attention-heading">
        <div className="today-panel-title"><h2 id="today-attention-heading">Needs attention</h2><span>{calendarDisplay(calendar, { count: groups.attention.length }).countLabel}</span></div>
        <p className="today-section-note">Unfinished work from the past 350 days, and follow-ups, deadlines and renewals in the next fortnight.</p>
        {!calendar.loading ? <CalendarItems items={attention} showDate {...listProps} empty="No dated items need attention." /> : null}
        {!showAllAttention && groups.attention.length > 8 ? <button className="ghost-pill compact-pill" type="button" onClick={() => setShowAllAttention(true)}>Show {groups.attention.length - 8} more</button> : null}
      </section>
      <section className="today-cross-area-panel today-week-panel" aria-labelledby="today-week-heading">
        <div className="today-panel-title"><h2 id="today-week-heading">Next six days</h2><span>{calendarDisplay(calendar, { count: groups.week.length }).countLabel}</span></div>
        {!calendar.loading ? <CalendarItems items={groups.week} showDate {...listProps} empty="No further dated plans in the coming week." /> : null}
      </section>
    </div>
    <p className="today-section-note">Cardiff events show your saved plans and maybes from this browser. <Link to="/cardiff-life">Manage choices</Link>. Open an item to use its room’s original workflow.</p>
    <footer className="ledger-poem" aria-label="Poem of the day"><div lang="fa" dir="rtl">{dailyPoem.lines.map((line, index) => <p key={index}>{line}</p>)}</div><small lang="fa" dir="rtl">{dailyPoem.poet}</small></footer>
  </section>
}
