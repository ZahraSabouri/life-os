// Waiting on you, on Today: the five most pressing, with Done and Tomorrow; the latest headline;
// when the mail was last gathered. Three days without a gather gets one quiet line.
import { Link } from 'react-router-dom'
import { london, useMail } from '../../lib/useMail.js'
import { ActionLine, useUndo } from './parts.jsx'

export default function InboxPanel() {
  const summary = useMail('/api/mail/summary', { every: 5 * 60_000 })
  const undo = useUndo()
  if (summary.loading) return <p className="day-quiet">Reading…</p>
  if (summary.error) return <p className="day-unavailable">The Inbox could not be read.</p>
  const { top = [], open = 0, headline, lastGathered, staleDays, today } = summary.data ?? {}
  return <>
    {headline ? <p className="mail-panel-headline" dir="auto">{headline}</p> : null}
    {top.length ? <ul className="mail-actions is-compact">{top.map((row) => <ActionLine key={row.id} row={row} today={today} undo={undo} compact />)}</ul>
      : <p className="day-quiet">Nothing is waiting on you.</p>}
    {undo.bar}
    <p className="mail-panel-foot">
      {open > top.length ? <Link to="/inbox">{open - top.length} more on Waiting on you</Link> : null}
      <span>{lastGathered ? `Last gathered ${london(lastGathered, { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Not gathered yet'}</span>
    </p>
    {staleDays !== null && staleDays >= 3 ? <p className="day-quiet">Nothing has been gathered for {staleDays} days. <Link to="/inbox/digests">How to gather</Link></p> : null}
  </>
}
