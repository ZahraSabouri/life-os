// Small pieces the Health pages and Today's Health panel share.
import { Link } from 'react-router-dom'
import { formatCalendarDay } from '../../lib/calendar.js'
import { clockOf } from '../../lib/day.js'
import { DAILY_TICKS, activity } from '../../../../shared/health/guidance.js'
import { dayTicks, isDone } from '../../../../shared/health/week.js'

// Minutes to the nearest half: "28½ min", "1 h 5 min".
const half = (n) => { const r = Math.round(n * 2) / 2; return Number.isInteger(r) ? String(r) : `${Math.floor(r) || ''}½` }
export const minutesText = (n) => (n >= 60 ? `${Math.floor(n / 60)} h${n % 60 >= 0.25 ? ` ${half(n % 60)} min` : ''}` : `${half(n)} min`)

// A part against its whole, drawn like the Review's meters.
export function Meter({ part, whole, label }) {
  if (!(whole > 0)) return null
  return <div className={`review-meter${part > whole ? ' is-over' : ''}`} role="img" aria-label={label}><span style={{ width: `${Math.min(100, Math.round((part / whole) * 100))}%` }} /></div>
}

// The source of a figure, as a small link.
export function Source({ source }) {
  if (!source) return null
  return <a className="health-source" href={source.url} target="_blank" rel="noreferrer">{source.by}: {source.title}</a>
}

// Tap the dots: five portions of fruit and veg, eight drinks. Tapping the last one again takes it back.
export function DayTicks({ page, day }) {
  const ticks = dayTicks(page.entries, day)
  return <div className="health-ticks">
    {DAILY_TICKS.map((tick) => {
      const value = ticks[tick.key]?.value ?? 0
      const set = (n) => page.setTick(day, tick.key, n === value ? n - 1 : n, tick.unit).catch(() => {})
      return <div className="health-tick-row" key={tick.key} role="group" aria-label={`${tick.label}: ${value} of ${tick.of}`}>
        <span>{tick.label}</span>
        <span className="health-dots">{Array.from({ length: tick.of }, (_, i) => <button key={i} type="button" className={i < value ? 'is-on' : ''} aria-pressed={i < value} aria-label={`${tick.label} ${i + 1}`} onClick={() => set(i + 1)} />)}</span>
        <small>{value} of {tick.of}</small>
      </div>
    })}
  </div>
}

// One session in a list: when, how long, done or not, with "Done".
export function SessionLine({ row, page, today }) {
  const e = row.entry, d = e.details ?? {}, done = isDone(e)
  const when = String(e.start_at ?? '').length > 10 ? clockOf(e.start_at) : ''
  return <li className={done ? 'is-done' : undefined}>
    <Link to={`/health?view=exercise&entry=${encodeURIComponent(e.id)}`}>{e.title || activity(d.kind).label}</Link>
    <small>{[row.day === today ? (when || 'today') : formatCalendarDay(row.day), d.duration_min ? minutesText(d.duration_min) : '', d.strength ? 'strength' : '', done ? 'done' : ''].filter(Boolean).join(' · ')}</small>
    {!done ? <span className="health-line-actions"><button type="button" onClick={() => page.change(e.id, { status: 'done' }).catch(() => {})}>Done</button></span> : null}
  </li>
}
