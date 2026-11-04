// The Desk (stage 6): what came in as things, not messages. Now (what is close, and what is due),
// the eight domains in their own colours, a board of cards for the chosen domain with its filters,
// a drawer with what happened and the messages behind it, Triage for what is new (one at a time,
// with keys), and what was kept quiet. The domain and filter live in the address.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { london, londonTime, mailChanged, saveAction, useMail } from '../../lib/useMail.js'
import { DOMAINS, DOMAIN_NAMES, FORM_NAMES, KIND_NAMES, stateName } from '@shared/harvest.js'
import { titleOf } from '@shared/mail.js'
import { PlaceOf, whenOf } from './CameInStrip.jsx'
import DomainGlyph from './DomainGlyph.jsx'
import '../../styles/desk.css'

const SHOW = [['', 'Everything'], ['soon', 'Close'], ['new', 'New'], ['kept', 'Kept'], ['missing', 'Not filed yet']]
const QUIET_NAMES = { newsletter: 'Newsletters', automated: 'Notifications', noise: 'Noise', fyi: 'Notes' }
export const kindLabel = (thing) => (thing.kind === 'opportunity' && thing.form ? FORM_NAMES[thing.form] : KIND_NAMES[thing.kind] ?? thing.kind)
const money = (pence, currency) => (pence === null || pence === undefined ? '' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP' }).format(Number(pence) / 100))
export function factsOf(thing) {
  const details = thing.details ?? {}
  return [details.employer || details.organiser, thing.location, money(thing.amount_pence, thing.currency), thing.external_ref ? `Ref ${thing.external_ref}` : '', details.course]
    .filter(Boolean).filter((fact, index, all) => all.indexOf(fact) === index).slice(0, 3)
}
// The day a thing is sorted by: when it starts, else when it closes, else when it came in.
const keyDay = (thing) => String(thing.start_at ?? thing.start_day ?? thing.deadline ?? thing.day ?? '').slice(0, 10)

async function setStatus(thing, status) {
  await apiFetch(`/api/mail/items/${encodeURIComponent(thing.id)}`, { method: 'PATCH', body: JSON.stringify({ revision: thing.revision, status }) })
  mailChanged()
}

// The change JobMap should make for an application, made through JobMap's own server when pressed.
function JobMapChange({ suggestion, onDone }) {
  const [said, setSaid] = useState('')
  if (!suggestion) return null
  async function make() {
    try { await apiFetch('/api/day/jobs', { method: 'POST', body: JSON.stringify({ job: suggestion.job, status: suggestion.status }) }); setSaid(`JobMap now says ${suggestion.status}.`); mailChanged(); onDone?.() }
    catch (failure) { setSaid(`JobMap did not change: ${failure.message}`) }
  }
  return <div className="desk-suggest"><span>JobMap says {suggestion.from || 'nothing yet'}.</span><button type="button" onClick={make}>Move to {suggestion.status}</button>{said ? <span role="status">{said}</span> : null}</div>
}

export function ThingCard({ thing, onOpen, onChanged, leaving = false }) {
  const [said, setSaid] = useState('')
  async function mark(status) {
    try { await setStatus(thing, status); onChanged?.() } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  return <article className={`desk-card is-${thing.status}${thing.soon ? ' is-soon' : ''}${leaving ? ' is-leaving' : ''}`} style={{ '--c': `var(--d-${thing.domain})` }}>
    <div className="desk-card-top"><DomainGlyph domain={thing.domain} size="sm" /><span className="desk-kind">{kindLabel(thing)}</span><span className="desk-when">{whenOf(thing)}</span></div>
    <h4><button type="button" onClick={() => onOpen?.(thing.id)} dir="auto">{thing.title}</button></h4>
    {factsOf(thing).length ? <p className="desk-facts">{factsOf(thing).map((fact) => <span key={fact} dir="auto">{fact}</span>)}</p> : null}
    <div className="desk-marks">
      {thing.state ? <span className="desk-state">{stateName(thing.state)}</span> : null}
      <PlaceOf item={thing} />
      {thing.status === 'kept' ? <span className="desk-kept">Kept</span> : null}
    </div>
    <JobMapChange suggestion={thing.suggestion} onDone={onChanged} />
    <div className="desk-acts">
      {thing.status === 'kept' ? null : <button type="button" className="is-primary" onClick={() => mark('kept')}>Keep</button>}
      <button type="button" onClick={() => mark('dismissed')}>Dismiss</button>
    </div>
    {said ? <p className="form-error" role="alert">{said}</p> : null}
  </article>
}

function DueCard({ row, today, onChanged }) {
  const [said, setSaid] = useState('')
  async function done() {
    try { await saveAction(row, { status: 'done' }); onChanged?.() } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  return <article className="desk-card is-due" style={{ '--c': 'var(--m-accent)' }}>
    <div className="desk-card-top"><span className="desk-kind">To do</span><span className="desk-when">{row.due ? (row.due === today ? 'Today' : row.due < today ? 'Late' : london(`${row.due}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' })) : 'Now'}</span></div>
    <h4><Link to={`/inbox/waiting?action=${row.id}`} dir="auto">{titleOf(row)}</Link></h4>
    {row.why ? <p className="desk-facts"><span dir="auto">{row.why}</span></p> : null}
    <div className="desk-acts"><button type="button" className="is-primary" onClick={done}>Done</button></div>
    {said ? <p className="form-error" role="alert">{said}</p> : null}
  </article>
}

// One thing in full: its facts, what happened, what it led to, the messages behind it, its domain.
export function ThingDrawer({ id, onClose, onChanged }) {
  const found = useMail(id ? `/api/mail/items/${encodeURIComponent(id)}` : '')
  const [said, setSaid] = useState('')
  const panel = useRef(null)
  useEffect(() => { panel.current?.focus() }, [id])
  const thing = found.data
  async function move(domain) {
    try { await apiFetch(`/api/mail/items/${encodeURIComponent(thing.id)}`, { method: 'PATCH', body: JSON.stringify({ revision: thing.revision, her_domain: domain || null }) }); setSaid(domain ? `Moved to ${DOMAIN_NAMES[domain]}.` : 'Back where the harvest filed it.'); mailChanged(); found.reload(); onChanged?.() }
    catch (failure) { setSaid(`Not moved: ${failure.message}`) }
  }
  async function teach() {
    try { await apiFetch('/api/mail/senders', { method: 'POST', body: JSON.stringify({ address: thing.sender, rule: 'file', domain: thing.domain }) }); setSaid(`From now on, ${thing.sender} goes to ${DOMAIN_NAMES[thing.domain]}.`); mailChanged(); onChanged?.() }
    catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  async function mark(status) {
    try { await setStatus(thing, status); onChanged?.(); onClose() } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  return <aside className="desk-drawer" aria-label="The thing" ref={panel} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
    <button type="button" className="desk-close" onClick={onClose}>Close</button>
    {found.error ? <p className="form-error" role="alert">It could not be opened: {found.error}</p> : !thing ? <p className="day-quiet">Opening…</p> : <div className="desk-drawer-body" style={{ '--c': `var(--d-${thing.domain})` }}>
      <div className="desk-card-top"><DomainGlyph domain={thing.domain} /><span className="desk-kind">{DOMAIN_NAMES[thing.domain]} · {kindLabel(thing)}</span></div>
      <h3 dir="auto">{thing.title}</h3>
      <p className="desk-summary" dir="auto">{thing.summary}</p>
      <dl className="desk-dl">
        <div><dt>When</dt><dd>{whenOf(thing)}</dd></div>
        {thing.state ? <div><dt>Where it is</dt><dd>{stateName(thing.state)}</dd></div> : null}
        {factsOf(thing).length ? <div><dt>Details</dt><dd dir="auto">{factsOf(thing).join(' · ')}</dd></div> : null}
        {thing.place ? <div><dt>In the app</dt><dd><PlaceOf item={thing} /></dd></div> : null}
        {thing.url ? <div><dt>Its page</dt><dd><a href={thing.url} target="_blank" rel="noopener noreferrer">{new URL(thing.url).hostname}</a></dd></div> : null}
      </dl>
      <JobMapChange suggestion={thing.suggestion} onDone={() => { found.reload(); onChanged?.() }} />
      {thing.steps?.length ? <section><h4 className="desk-label">What happened</h4><ol className="desk-steps">{thing.steps.map((step, index) => <li key={index}>
        <b>{step.state ? stateName(step.state) : 'Came in'}</b><small>{london(step.at, { weekday: 'short', day: 'numeric', month: 'short' })}, {londonTime(step.at)}</small>{step.note ? <span dir="auto">{step.note}</span> : null}
      </li>)}</ol></section> : null}
      {thing.actions?.length ? <section><h4 className="desk-label">It led to</h4><ul className="desk-list">{thing.actions.map((action) => <li key={action.id}><Link to={`/inbox/waiting?action=${action.id}`} dir="auto">{titleOf(action)}</Link>{action.due ? <small>by {london(`${action.due}T12:00:00Z`, { day: 'numeric', month: 'short' })}</small> : null}</li>)}</ul></section> : null}
      {thing.messages?.length ? <section><h4 className="desk-label">From {thing.messages.length} {thing.messages.length === 1 ? 'message' : 'messages'}</h4><ul className="desk-list">{thing.messages.map((message) => <li key={message.id}>
        <Link to={`/inbox/messages?open=${message.id}`} dir="auto">{message.subject || '(no subject)'}</Link><small dir="auto">{message.from_name || message.from_address} · {london(message.received_at, { day: 'numeric', month: 'short' })}</small>
      </li>)}</ul></section> : null}
      <section className="desk-move"><h4 className="desk-label">Domain</h4>
        <label><span className="sr-only">Domain</span><select value={thing.her_domain ?? ''} onChange={(event) => move(event.target.value)}>
          <option value="">As filed ({DOMAIN_NAMES[thing.domain]})</option>{DOMAINS.map((domain) => <option key={domain} value={domain}>{DOMAIN_NAMES[domain]}</option>)}
        </select></label>
        {thing.sender ? <button type="button" onClick={teach}>Everything from this sender: {DOMAIN_NAMES[thing.domain]}</button> : null}
      </section>
      <div className="desk-acts">{thing.status === 'kept' ? null : <button type="button" className="is-primary" onClick={() => mark('kept')}>Keep</button>}<button type="button" onClick={() => mark('dismissed')}>Dismiss</button></div>
      {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
    </div>}
  </aside>
}

// Triage: what is new, one at a time. Keep →, Dismiss ←, Later ↓ (stays new). A ring says how far.
export function Triage({ things, onClose, onChanged }) {
  const [queue, setQueue] = useState(() => things.filter((thing) => thing.status === 'new'))
  const [done, setDone] = useState(0)
  const [leaving, setLeaving] = useState('')
  const [said, setSaid] = useState('')
  const total = useRef(queue.length)
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  async function choose(choice) {
    const thing = queue[0]
    if (!thing || leaving) return
    setLeaving(choice)
    try { if (choice !== 'later') await setStatus(thing, choice === 'keep' ? 'kept' : 'dismissed') } catch (failure) { setSaid(`Not saved: ${failure.message}`); setLeaving(''); return }
    window.setTimeout(() => { setQueue((current) => current.slice(1)); setDone((count) => count + 1); setLeaving('') }, still ? 0 : 220)
  }
  useEffect(() => {
    const keys = (event) => {
      if (event.key === 'ArrowRight') choose('keep')
      else if (event.key === 'ArrowLeft') choose('dismiss')
      else if (event.key === 'ArrowDown') { event.preventDefault(); choose('later') }
      else if (event.key === 'Escape') { onChanged?.(); onClose() }
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  })
  const circle = 2 * Math.PI * 26
  const thing = queue[0]
  return <div className="desk-triage" role="dialog" aria-modal="true" aria-label="Triage">
    <div className="desk-triage-box">
      <svg className="desk-ring" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${total.current} sorted`}>
        <circle className="track" cx="32" cy="32" r="26" /><circle className="fill" cx="32" cy="32" r="26" strokeDasharray={circle} strokeDashoffset={total.current ? circle * (1 - done / total.current) : 0} />
        <text x="32" y="32">{done}/{total.current}</text>
      </svg>
      {thing ? <>
        <div className={`desk-triage-card${leaving ? ` is-${leaving}` : ''}`}><ThingCard thing={thing} /></div>
        <div className="desk-triage-acts">
          <button type="button" onClick={() => choose('dismiss')}>Dismiss <kbd>←</kbd></button>
          <button type="button" onClick={() => choose('later')}>Later <kbd>↓</kbd></button>
          <button type="button" className="is-primary" onClick={() => choose('keep')}>Keep <kbd>→</kbd></button>
        </div>
      </> : <div className="desk-triage-done"><h3>All sorted</h3><p>Everything new is kept, dismissed or left for later.</p></div>}
      {said ? <p className="form-error" role="alert">{said}</p> : null}
      <button type="button" className="desk-close" onClick={() => { onChanged?.(); onClose() }}>Back to the Desk</button>
    </div>
  </div>
}

function Quiet({ quiet }) {
  if (!quiet) return null
  const most = Math.max(1, ...Object.values(quiet.categories ?? {}), ...(quiet.senders ?? []).map((row) => row.n))
  const rules = quiet.rules ?? {}
  return <aside className="desk-quiet" aria-label="Kept quiet">
    <div><h4 className="desk-label">Kept quiet this week</h4><p className="desk-big">{quiet.total}</p><p className="desk-note">messages that became nothing to look at</p></div>
    <ul className="desk-bars">{Object.entries(quiet.categories ?? {}).sort((a, b) => b[1] - a[1]).map(([category, n]) => <li key={category}><span>{QUIET_NAMES[category] ?? category}</span><b>{n}</b><i style={{ '--w': `${(100 * n) / most}%` }} /></li>)}</ul>
    {quiet.senders?.length ? <div><h4 className="desk-label">Quietest senders</h4><ul className="desk-bars">{quiet.senders.map((row) => <li key={row.sender}><span dir="auto">{row.sender}</span><b>{row.n}</b><i style={{ '--w': `${(100 * row.n) / most}%` }} /></li>)}</ul></div> : null}
    <p className="desk-note">{[rules.fold ? `${rules.fold} folded` : '', rules.hide ? `${rules.hide} hidden` : '', rules.file ? `${rules.file} filed by sender` : ''].filter(Boolean).join(' · ') || 'No sender rules yet.'} <Link to="/inbox/messages?filter=other">Messages</Link></p>
  </aside>
}

export default function InboxDesk({ params, setParams }) {
  const desk = useMail('/api/mail/desk', { every: 5 * 60_000 })
  const [openId, setOpenId] = useState(params.get('thing') ?? '')
  const [triage, setTriage] = useState(false)
  const data = desk.data
  const things = data?.things ?? []
  const domains = data?.domains ?? {}
  const firstWithThings = DOMAINS.find((key) => domains[key]?.open) ?? 'work'
  const domain = DOMAINS.includes(params.get('domain')) ? params.get('domain') : firstWithThings
  const show = SHOW.some(([key]) => key === (params.get('show') ?? '')) ? params.get('show') ?? '' : ''
  const set = (changes) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key) } setParams(next) }
  const open = (id) => { setOpenId(id); set({ thing: id }) }
  const byId = useMemo(() => new Map(things.map((thing) => [thing.id, thing])), [things])
  const now = (data?.now?.things ?? []).map((id) => byId.get(id)).filter(Boolean).sort((a, b) => keyDay(a).localeCompare(keyDay(b)))
  const board = things.filter((thing) => thing.domain === domain)
    .filter((thing) => !show || (show === 'soon' && thing.soon) || (show === 'new' && thing.status === 'new') || (show === 'kept' && thing.status === 'kept') || (show === 'missing' && thing.place?.missing))
    .sort((a, b) => keyDay(a).localeCompare(keyDay(b)))
  const fresh = things.filter((thing) => thing.status === 'new').length
  const changed = () => desk.reload()
  if (desk.loading) return <p className="day-quiet">Reading…</p>
  if (desk.error) return <p className="form-error" role="alert">The Desk could not be read: {desk.error}</p>
  return <div className="desk">
    <div className="desk-bar">
      <p className="desk-tally">{things.length ? `${things.length} open · ${fresh} new` : 'Nothing filed yet'}</p>
      <button type="button" className="desk-triage-open" disabled={!fresh} onClick={() => setTriage(true)}>Triage <span>{fresh} new</span></button>
    </div>
    <section className="desk-now" aria-labelledby="desk-now-heading">
      <h3 id="desk-now-heading">Now</h3>
      {now.length || data?.now?.actions?.length ? <div className="desk-now-row">
        {(data?.now?.actions ?? []).map((row) => <DueCard key={row.id} row={row} today={data.today} onChanged={changed} />)}
        {now.map((thing) => <ThingCard key={thing.id} thing={thing} onOpen={open} onChanged={changed} />)}
      </div> : <p className="day-quiet">Nothing is due or closing in the next two days.</p>}
    </section>
    <div className="desk-body">
      <nav className="desk-rail" aria-label="Domains">
        {DOMAINS.map((key) => <button key={key} type="button" aria-pressed={key === domain} style={{ '--c': `var(--d-${key})` }} onClick={() => set({ domain: key, show: '' })}>
          <DomainGlyph domain={key} /><span><b>{DOMAIN_NAMES[key]}</b>{domains[key]?.soon ? <small>{domains[key].soon} close</small> : null}</span><em>{domains[key]?.open ?? 0}</em>
        </button>)}
      </nav>
      <section className="desk-board" aria-label={DOMAIN_NAMES[domain]} style={{ '--c': `var(--d-${domain})` }}>
        <header><h3>{DOMAIN_NAMES[domain]}</h3>
          <nav className="mail-chips" aria-label="Show">{SHOW.map(([key, label]) => <button key={key || 'all'} type="button" aria-pressed={show === key} onClick={() => set({ show: key })}>{label}</button>)}</nav>
        </header>
        {board.length ? <div className="desk-grid">{board.map((thing) => <ThingCard key={thing.id} thing={thing} onOpen={open} onChanged={changed} />)}</div>
          : <p className="day-quiet">{things.length ? `Nothing in ${DOMAIN_NAMES[domain]}${show ? ' with this filter' : ''}.` : 'Things appear here as the harvest files them: a vacancy, an order on its way, a bill, a booking, each in its domain.'}</p>}
      </section>
      <Quiet quiet={data?.quiet} />
    </div>
    {openId ? <ThingDrawer id={openId} onClose={() => { setOpenId(''); set({ thing: '' }) }} onChanged={changed} /> : null}
    {triage ? <Triage things={things} onClose={() => setTriage(false)} onChanged={changed} /> : null}
  </div>
}
