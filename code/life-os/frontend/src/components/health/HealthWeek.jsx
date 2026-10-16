// Health → This week: the week against the UK guideline, today's sessions, food and ticks, and
// what is coming up. The add line files plans under Health.
import { Link } from 'react-router-dom'
import { useDayPage } from '../../lib/useDayPage.js'
import { formatCalendarDay, dateKey } from '../../lib/calendar.js'
import { clockOf } from '../../lib/day.js'
import { AddLine, count } from '../DayParts.jsx'
import { ACTIVITY_TARGET, EFFORTS, SOURCES } from '../../../../shared/health/guidance.js'
import { dayOf } from '../../../../shared/health/week.js'
import { DayTicks, Meter, SessionLine, Source, minutesText } from './parts.jsx'

const MEALS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
export default function HealthWeek({ page }) {
  const { week, today } = page

  const adding = useDayPage(undefined, { area: 'body', onSaved: page.refetch })
  const meals = adding.data?.home?.meals ?? []
  const todaySessions = week.sessions.filter((row) => row.day === today)
  const appointments = page.entries.filter((e) => e.type === 'appointment' && !['done', 'cancelled'].includes(String(e.status)) && dayOf(e) >= today).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at))).slice(0, 4)
  const plans = (adding.calendar.items ?? []).filter((item) => item.area === 'body' && !['workout', 'appointment'].includes(item.meta?.type) && dateKey(item.start) >= today && !item.meta?.completed).slice(0, 5)
  const left = Math.max(0, ACTIVITY_TARGET.moderateMinutes - week.minutes)
  return <>
    <AddLine page={adding} id="health-add-input" fixedArea />
    <div className="health-grid">
      <section className="day-panel health-moving" aria-labelledby="health-moving">
        <header><h2 id="health-moving">Moving this week</h2><Link to="/health?view=exercise">Exercise</Link></header>
        <p className="review-value">{week.minutes}<small> of {ACTIVITY_TARGET.moderateMinutes} active minutes</small></p>
        <Meter part={week.minutes} whole={ACTIVITY_TARGET.moderateMinutes} label={`${week.minutes} of ${ACTIVITY_TARGET.moderateMinutes} minutes`} />
        <p className="review-value health-second">{week.strengthDays}<small> of {ACTIVITY_TARGET.strengthDays} strength days</small></p>
        <Meter part={week.strengthDays} whole={ACTIVITY_TARGET.strengthDays} label={`${week.strengthDays} of ${ACTIVITY_TARGET.strengthDays} strength days`} />
        <p className="review-note">{week.met ? 'The week meets the UK guideline.' : `${left ? `${left} more minutes of moderate activity (or ${Math.ceil(left / 2)} vigorous)` : 'The minutes are done'}${week.strengthDays < ACTIVITY_TARGET.strengthDays ? `${left ? ' and ' : '; '}${count(ACTIVITY_TARGET.strengthDays - week.strengthDays, 'strength session')} to go` : ''} by Sunday.`}</p>
        <ol className="health-week-strip" aria-label="The week, Monday to Sunday">
          {week.days.map((d) => <li key={d.day} className={`${d.day === today ? 'is-today' : ''}${d.done.length ? ' has-done' : ''}`}>
            <span>{formatCalendarDay(d.day, { day: undefined, month: undefined })}</span>
            <b>{d.done.length ? minutesText(d.done.reduce((n, r) => n + r.counts.total, 0)) : d.planned.length ? 'planned' : '·'}</b>
          </li>)}
        </ol>
        <p className="health-small">Vigorous minutes count twice. {EFFORTS[1].label}: {EFFORTS[1].test.toLowerCase()} {EFFORTS[2].label}: {EFFORTS[2].test.toLowerCase()} <Source source={SOURCES.activity} /></p>
      </section>

      <section className="day-panel" aria-labelledby="health-today">
        <header><h2 id="health-today">Today</h2><Link to="/health?view=exercise&log=1">Log a session</Link></header>
        {todaySessions.length ? <ul className="day-list">{todaySessions.map((row) => <SessionLine key={row.entry.id} row={row} page={page} today={today} />)}</ul>
          : <p className="day-quiet">No exercise planned today. <Link to="/health?view=exercise&log=1">Log what you did</Link> or <Link to="/health?view=exercise&plan=1">plan a session</Link>.</p>}
        <h3>Eating today</h3>
        {meals.length ? <ul className="day-list">{meals.map((meal) => <li key={meal.id} className={meal.cooked ? 'is-done' : undefined}><Link to={meal.href}>{meal.prep ? `Cook: ${meal.name}` : meal.name}</Link><small>{MEALS[meal.slot] ?? 'Meal'}{meal.cooked ? ' · eaten' : ''}</small></li>)}</ul>
          : <p className="day-quiet">{adding.loading ? 'Reading…' : 'Nothing planned to eat.'} <Link to="/health?view=food">Ideas</Link></p>}
        <p className="day-more"><Link to="/budget#/meals/now">What can I eat now?</Link></p>
        <DayTicks page={page} day={today} />
      </section>

      <section className="day-panel" aria-labelledby="health-coming">
        <header><h2 id="health-coming">Coming up</h2><Link to="/calendar">Calendar</Link></header>
        {appointments.length || week.planned.some((row) => row.day > today) || plans.length ? <ul className="day-list">
          {appointments.map((e) => <li key={e.id}><Link to={`/health?view=care&entry=${encodeURIComponent(e.id)}`}>{e.title}</Link><small>{[formatCalendarDay(dayOf(e), { weekday: 'long' }), String(e.start_at).length > 10 ? clockOf(e.start_at) : '', e.details?.place].filter(Boolean).join(' · ')}</small></li>)}
          {week.planned.filter((row) => row.day > today).map((row) => <SessionLine key={row.entry.id} row={row} page={page} today={today} />)}
          {plans.map((item) => <li key={item.id}><Link to={item.href}>{item.title}</Link><small>{formatCalendarDay(dateKey(item.start))}</small></li>)}
        </ul> : <p className="day-quiet">Nothing ahead. <Link to="/health?view=care&add=1">Add an appointment</Link> or <Link to="/health?view=exercise&programmes=1">start a programme</Link>.</p>}
      </section>
    </div>
  </>
}
