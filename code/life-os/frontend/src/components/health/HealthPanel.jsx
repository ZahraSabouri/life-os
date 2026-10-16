// Health on Today: the week's minutes and strength days against the guideline, today's sessions,
// and the 5 A Day and drinks ticks. Reads and saves the same entries as the Health pages.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHealth } from '../../lib/useHealth.js'
import { ACTIVITY_TARGET } from '../../../../shared/health/guidance.js'
import { weekOfMoving } from '../../../../shared/health/week.js'
import { DayTicks, Meter, SessionLine } from './parts.jsx'

export default function HealthPanel({ today, isToday = true, compact = false }) {
  const health = useHealth()
  const week = useMemo(() => weekOfMoving(health.entries, today), [health.entries, today])
  if (health.loading) return <p className="day-quiet">Reading…</p>
  if (health.error) return <p className="day-unavailable">Health could not be read.</p>
  const sessions = week.sessions.filter((row) => row.day === today)
  const page = { ...health, today }
  return <>
    <p className="health-panel-figure"><b>{week.minutes}</b> of {ACTIVITY_TARGET.moderateMinutes} active minutes this week · <b>{week.strengthDays}</b> of {ACTIVITY_TARGET.strengthDays} strength days</p>
    <Meter part={week.minutes} whole={ACTIVITY_TARGET.moderateMinutes} label={`${week.minutes} of ${ACTIVITY_TARGET.moderateMinutes} minutes`} />
    <h3>{isToday ? 'Exercise today' : 'Exercise that day'}</h3>
    {sessions.length ? <ul className="day-list">{sessions.map((row) => <SessionLine key={row.entry.id} row={row} page={page} today={today} />)}</ul>
      : <p className="day-quiet">Nothing planned. <Link to="/health?view=exercise&log=1">Log a session</Link></p>}
    {compact ? null : <DayTicks page={page} day={today} />}
  </>
}
