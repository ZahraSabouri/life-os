// Health: moving, eating and care, measured against UK guidance. Four pages under one heading:
// This week, Exercise, Food, Appointments & tests. Sessions and appointments are core entries
// (on the calendar under Health); food is Budget's, read through Life OS.
import { useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useHealth } from '../../lib/useHealth.js'
import { useLondonToday } from '../../lib/useCalendar.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import { weekOfMoving } from '../../../../shared/health/week.js'
import HealthWeek from './HealthWeek.jsx'
import HealthExercise from './HealthExercise.jsx'
import HealthFood from './HealthFood.jsx'
import HealthCare from './HealthCare.jsx'

export const HEALTH_PAGES = [['week', 'This week'], ['exercise', 'Exercise'], ['food', 'Food'], ['care', 'Appointments & tests']]

export default function HealthView() {
  const [params, setParams] = useSearchParams()
  const view = HEALTH_PAGES.some(([key]) => key === params.get('view')) ? params.get('view') : 'week'
  const today = useLondonToday()
  const health = useHealth()
  const week = useMemo(() => weekOfMoving(health.entries, today), [health.entries, today])
  const go = (next, extra = {}) => setParams({ view: next, ...extra })
  // A link to a place on a page ("#health-programmes") scrolls there once the page has drawn it.
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash || health.loading) return undefined
    const timer = window.setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }), 120)
    return () => window.clearTimeout(timer)
  }, [hash, view, health.loading])
  const page = { ...health, today, week, go, params, setParams }
  return <section className="today-layout unified-today day-page health-page" aria-label="Health">
    <header className="ledger-header health-head">
      <div className="ledger-brandline"><h1>Health</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{formatCalendarDay(today, { weekday: 'long', month: 'long' })}</time></div>
    </header>
    <nav className="day-add-kind health-tabs" aria-label="Health pages">
      {HEALTH_PAGES.map(([key, label]) => <button key={key} type="button" aria-pressed={view === key} onClick={() => go(key)}>{label}</button>)}
    </nav>
    {health.error ? <p className="form-error" role="alert">Health could not be read: {health.error}</p> : null}
    {view === 'week' ? <HealthWeek page={page} /> : view === 'exercise' ? <HealthExercise page={page} /> : view === 'food' ? <HealthFood page={page} /> : <HealthCare page={page} />}
  </section>
}
