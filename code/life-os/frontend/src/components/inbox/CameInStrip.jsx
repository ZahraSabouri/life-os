// What came in for one part of Life OS (stage 5): a count in the part's strip under the top bar,
// opening a short list with Keep and Dismiss. In JobMap and Events it lists only what is
// not there yet: what is already in the app shows in the app itself. Nothing shows when nothing
// came in. Which part an item belongs to is shared/harvest.js partOf.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { london, londonTime, mailChanged, useMail } from '../../lib/useMail.js'
import { KIND_NAMES, stateName } from '@shared/harvest.js'
import '../../styles/inbox.css'

const APP_NAMES = { jobmap: 'JobMap', events: 'Events' }
const ELSEWHERE = new Set(['jobmap', 'events'])
const day = (value, options = { weekday: 'short', day: 'numeric', month: 'short' }) => london(`${value}T12:00:00Z`, options)

// "Closes Fri 7 Nov", "Thu 5 Nov, 14:00", "From Tue 10 Nov": the one date that matters for it.
export function whenOf(item) {
  const at = (value) => `${london(value, { weekday: 'short', day: 'numeric', month: 'short' })}, ${londonTime(value)}`
  // Kinds that move say where they are in words: an order arrives, then can be returned until.
  if (item.kind === 'order') {
    if (['delivered', 'return-started'].includes(item.state) && item.deadline) return `Returns until ${day(item.deadline)}`
    if (item.state === 'out-for-delivery') return 'Arrives today'
    if (item.start_day || item.start_at) return `Arrives ${day(item.start_day ?? String(item.start_at).slice(0, 10))}`
  }
  if (['booking', 'appointment', 'tenancy'].includes(item.kind) && item.start_at) return at(item.start_at)
  if (item.deadline && item.kind === 'bill') return `${item.state === 'paid' ? 'Paid' : 'Due'} ${day(item.deadline)}`
  if (item.deadline && item.kind === 'subscription') return `${item.state === 'cancelled' ? 'Ends' : 'Renews'} ${day(item.deadline)}`
  if (item.deadline) return `${item.kind === 'offer' ? 'Ends' : item.kind === 'vacancy' || item.kind === 'opportunity' ? 'Closes' : 'By'} ${day(item.deadline)}`
  // A thing that moves, with no date ahead: its latest step and when it happened.
  if (item.state && item.last_step?.at) return `${stateName(item.state)} ${london(item.last_step.at, { day: 'numeric', month: 'short' })}`
  if (item.start_at) return `${london(item.start_at, { weekday: 'short', day: 'numeric', month: 'short' })}, ${londonTime(item.start_at)}`
  if (item.start_day) return day(item.start_day)
  return `Came in ${day(item.day, { day: 'numeric', month: 'short' })}`
}

// Where it is now: in JobMap or Events (a link), not there yet, or could not be checked.
export function PlaceOf({ item }) {
  const place = item.place
  if (!place) return null
  const name = APP_NAMES[place.app]
  if (place.href) return <Link to={place.href}>In {name}</Link>
  return <span className="came-in-place is-waiting">{place.unknown ? `${name} could not be checked` : `Not in ${name} yet`}</span>
}

// onSelect: a list that can act on several at once (the Everything view) gives each a tick box.
export function CameInItem({ item, onSaved, focused = false, selected = false, onSelect }) {
  const [said, setSaid] = useState('')
  async function mark(status) {
    try {
      await apiFetch(`/api/mail/items/${encodeURIComponent(item.id)}`, { method: 'PATCH', body: JSON.stringify({ revision: item.revision, status }) })
      mailChanged(); onSaved?.()
    } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  // Divisions, not paragraphs: the part's strip styles its own paragraphs as one dotted line.
  return <li id={`came-in-${item.id}`} className={`came-in-item is-${item.status}${focused ? ' is-focused' : ''}`}>
    <div className="came-in-line">{onSelect ? <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} aria-label={`Choose ${item.title}`} /> : null}<span className="came-in-kind">{KIND_NAMES[item.kind] ?? item.kind}</span>
      {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" dir="auto">{item.title}</a> : <b dir="auto">{item.title}</b>}
      <span className="came-in-when">{whenOf(item)}</span></div>
    <div className="came-in-summary" dir="auto">{item.summary}</div>
    <div className="came-in-actions">
      <PlaceOf item={item} />
      <Link to={`/inbox/log?day=${item.day}&item=${item.id}`}>Where it came from</Link>
      {item.status === 'kept' ? <span className="came-in-kept">Kept</span> : <button type="button" onClick={() => mark('kept')}>Keep</button>}
      <button type="button" onClick={() => mark('dismissed')}>Dismiss</button>
    </div>
    {said ? <div className="form-error" role="alert">{said}</div> : null}
  </li>
}

export default function CameInStrip({ part, className = '' }) {
  const list = useMail(part ? `/api/mail/items?part=${encodeURIComponent(part)}&open=1` : '', { every: 10 * 60_000 })
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const away = (event) => { if (box.current && !box.current.contains(event.target)) setOpen(false) }
    const escape = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', escape) }
  }, [open])
  const items = (list.data?.items ?? []).filter((item) => !(ELSEWHERE.has(part) && item.place?.href))
  if (!items.length) return null
  const fresh = items.filter((item) => item.status === 'new').length
  return <div className={`came-in ${className}`.trim()} ref={box}>
    <button type="button" className="came-in-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
      Came in <span className="came-in-count">{fresh || items.length}</span>{fresh ? ' new' : ' kept'}
    </button>
    {open ? <section className="came-in-panel" aria-label="Came in">
      <header><h2>Came in</h2><Link to="/inbox/log" onClick={() => setOpen(false)}>Harvest log</Link></header>
      <ul>{items.map((item) => <CameInItem key={item.id} item={item} onSaved={list.reload} />)}</ul>
    </section> : null}
  </div>
}
