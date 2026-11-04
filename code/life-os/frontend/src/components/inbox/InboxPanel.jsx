// Waiting on you, on Today: the five most pressing, with Done and Tomorrow; what came in (today's,
// and what closes soon: vacancies and opportunities within a week, offers in their last two days),
// each with where it is; when the mail was last harvested. Three days without one gets one quiet line.
import { Link } from 'react-router-dom'
import { london, useMail } from '../../lib/useMail.js'
import { KIND_NAMES } from '@shared/harvest.js'
import { ActionLine, useUndo } from './parts.jsx'
import { whenOf } from './CameInStrip.jsx'

export function CameInLines({ cameIn }) {
  const lines = cameIn?.lines ?? []
  if (!lines.length) return null
  return <section className="mail-came-in" aria-label="Came in">
    <h3>Came in{cameIn.today ? <span>{cameIn.today} today</span> : null}</h3>
    <ul>{lines.map((item) => <li key={item.id}>
      <span className="came-in-kind">{KIND_NAMES[item.kind] ?? item.kind}</span>
      <Link to={item.place?.href ?? `/inbox/log?day=${item.day}&item=${item.id}`} dir="auto">{item.title}</Link>
      <span className="came-in-when">{whenOf(item)}</span>
    </li>)}</ul>
    {cameIn.more ? <p className="mail-panel-foot"><Link to="/inbox/log?view=all&closing=week">{cameIn.more} more</Link></p> : null}
  </section>
}

export default function InboxPanel() {
  const summary = useMail('/api/mail/summary', { every: 5 * 60_000 })
  const undo = useUndo()
  if (summary.loading) return <p className="day-quiet">Reading…</p>
  if (summary.error) return <p className="day-unavailable">The Inbox could not be read.</p>
  const { top = [], open = 0, cameIn, lastGathered, staleDays, today } = summary.data ?? {}
  return <>
    {top.length ? <ul className="mail-actions is-compact">{top.map((row) => <ActionLine key={row.id} row={row} today={today} undo={undo} compact />)}</ul>
      : <p className="day-quiet">Nothing is waiting on you.</p>}
    {undo.bar}
    <CameInLines cameIn={cameIn} />
    <p className="mail-panel-foot">
      {open > top.length ? <Link to="/inbox">{open - top.length} more on Waiting on you</Link> : null}
      <span>{lastGathered ? `Last harvested ${london(lastGathered, { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Not harvested yet'}</span>
    </p>
    {staleDays !== null && staleDays >= 3 ? <p className="day-quiet">Nothing has been harvested for {staleDays} days. <Link to="/inbox/log">The Harvest log</Link></p> : null}
  </>
}
