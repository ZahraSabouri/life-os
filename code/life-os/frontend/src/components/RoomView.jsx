// One area of life (a room): what is filed under it, with the same line that adds to the day.
// Rooms that have a whole part behind them (Study hub, JobMap, Budget) link to it; the others
// work from here: a plan to see someone, a trip, a gym session, a journal note, an errand.
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ENTRY_TYPES } from '@shared/entryTypes.js'
import { ROOMS } from '@shared/rooms.js'
import { apiFetch } from '../lib/api.js'
import { dateKey, formatCalendarDay } from '../lib/calendar.js'
import { clockOf } from '../lib/day.js'
import { useDayPage } from '../lib/useDayPage.js'
import { useEntries } from '../lib/useEntries.js'
import { AddLine, count } from './DayParts.jsx'

const PARTS = { study: ['/study', 'Study hub'], career: ['/jobmap', 'JobMap'], home: ['/budget', 'Budget'] }
const OVER = new Set(['done', 'completed', 'complete'])
const GONE = new Set(['cancelled', 'canceled', 'archived'])
const status = (entry) => String(entry.status ?? '').toLowerCase()

// An entry belongs to the room it was filed under; one that names none, to the first room of its kind.
export function roomOf(entry) {
  if (entry.type === 'time-block') return entry.details?.area === 'career' ? 'career' : entry.details?.area ?? ''
  return entry.details?.area ?? ENTRY_TYPES[entry.type]?.rooms?.[0] ?? ''
}

function when(entry) {
  if (!entry.start_at) return ''
  return entry.start_at.length > 10 ? `${formatCalendarDay(dateKey(entry.start_at))}, ${clockOf(entry.start_at)}${entry.end_at ? ` to ${clockOf(entry.end_at)}` : ''}` : formatCalendarDay(entry.start_at.slice(0, 10))
}

function Row({ entry, onDone, onRemove, busy }) {
  const [sure, setSure] = useState(false)
  const done = OVER.has(status(entry))
  const body = entry.details?.note || entry.details?.body || ''
  return <li className={done ? 'is-done' : undefined}>
    <div>
      <Link to={`/ledger#entry-${encodeURIComponent(entry.id)}`}>{entry.title || ENTRY_TYPES[entry.type]?.label || 'Entry'}</Link>
      <small>{[ENTRY_TYPES[entry.type]?.label, when(entry), done ? 'done' : ''].filter(Boolean).join(' · ')}</small>
      {body && body !== entry.title ? <p>{body.length > 280 ? `${body.slice(0, 277)}…` : body}</p> : null}
    </div>
    <span className="room-row-actions">
      {!done && ['task', 'event', 'time-block'].includes(entry.type) ? <button type="button" onClick={() => onDone(entry)} disabled={busy}>Done</button> : null}
      {sure ? <button type="button" className="is-sure" onClick={() => onRemove(entry)} onBlur={() => setSure(false)} disabled={busy}>Remove for good</button>
        : <button type="button" onClick={() => setSure(true)} disabled={busy}>Remove</button>}
    </span>
  </li>
}

export default function RoomView() {
  const { slug } = useParams()
  const room = ROOMS.find((item) => item.slug === slug)
  const { entries, loading, error, refetch } = useEntries('?limit=500')
  const page = useDayPage(undefined, { area: slug, onSaved: refetch })
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [showAll, setShowAll] = useState(false)
  const mine = useMemo(() => entries.filter((entry) => roomOf(entry) === slug && !GONE.has(status(entry))), [entries, slug])
  const today = page.today
  const isPast = (entry) => OVER.has(status(entry)) || (entry.start_at && dateKey(entry.start_at) < today)
  const coming = mine.filter((entry) => entry.start_at && !isPast(entry)).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
  const anytime = mine.filter((entry) => !entry.start_at && !isPast(entry))
  const past = mine.filter(isPast).sort((a, b) => String(b.start_at || b.created_at).localeCompare(String(a.start_at || a.created_at)))
  if (!room) return <Navigate to="/court" replace />

  async function change(entry, request) {
    setBusy(true)
    setFailure('')
    try { await apiFetch(`/api/entries/${encodeURIComponent(entry.id)}`, request); await refetch(); page.refetch() }
    catch (problem) { setFailure(`“${entry.title}” was not changed: ${problem.message}`) }
    finally { setBusy(false) }
  }
  const rowProps = { busy, onDone: (entry) => change(entry, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) }), onRemove: (entry) => change(entry, { method: 'DELETE' }) }
  const list = (rows) => <ul className="room-list">{rows.map((entry) => <Row key={entry.id} entry={entry} {...rowProps} />)}</ul>

  return <section className="today-layout unified-today day-page room-page" aria-label={room.name} style={{ '--room-accent': room.accent }}>
    <header className="room-head">
      <div className="ledger-brandline"><h1>{room.name}</h1><span /></div>
      <p>{room.blurb}{PARTS[slug] ? <> <Link to={PARTS[slug][0]}>Open {PARTS[slug][1]}</Link></> : null}</p>
    </header>
    <AddLine page={page} id="room-add-input" fixedArea />
    {error ? <p className="form-error" role="alert">This area could not be read: {error}</p> : null}
    {failure ? <p className="form-error" role="alert">{failure}</p> : null}
    <div className="room-grid">
      <section className="day-panel" aria-labelledby="room-coming">
        <header><h2 id="room-coming">Coming up</h2><span>{coming.length ? count(coming.length, 'plan') : ''}</span></header>
        {coming.length ? list(coming) : <p className="day-quiet">{loading ? 'Reading…' : 'Nothing dated ahead. Add a plan above and choose its day.'}</p>}
      </section>
      <section className="day-panel" aria-labelledby="room-anytime">
        <header><h2 id="room-anytime">No day yet</h2><span>{anytime.length ? count(anytime.length, 'thing') : ''}</span></header>
        {anytime.length ? list(anytime) : <p className="day-quiet">{loading ? 'Reading…' : 'Notes and things without a day show here.'}</p>}
      </section>
    </div>
    <section className="day-panel" aria-labelledby="room-past">
      <header><h2 id="room-past">Done and earlier</h2><span>{past.length ? count(past.length, 'entry', 'entries') : ''}</span></header>
      {past.length ? <>{list(showAll ? past : past.slice(0, 12))}{!showAll && past.length > 12 ? <button className="ghost-pill compact-pill" type="button" onClick={() => setShowAll(true)}>Show {past.length - 12} more</button> : null}</> : <p className="day-quiet">Nothing yet. What you finish here stays as its history, and on the calendar on its day.</p>}
    </section>
  </section>
}
