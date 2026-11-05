// The Harvest log: what came in, one London day at a time, back to the first harvested day. It
// opens with the sources as they were last read; each day has its factual line, then what came in
// by area (each linked to where it is now), the things to do, the messages, and the runs that
// brought them, with Undo on the latest run. It records; it does not advise.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { london, londonTime, mailChanged, useMail } from '../../lib/useMail.js'
import { AREAS, AREA_NAMES, KINDS, KIND_NAMES, dayLine } from '@shared/harvest.js'
import { CameInItem } from './CameInStrip.jsx'
import { MailSettings } from './parts.jsx'

const STATUS_WORDS = { read: 'Read', partial: 'Partly read', unavailable: 'Not reachable', skipped: 'Skipped' }
const IMPORTANT = new Set(['needs-you', 'deadline', 'announcement', 'conversation'])
const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
const dayName = (day, options = { weekday: 'long', day: 'numeric', month: 'long' }) => (isDay(day) ? london(`${day}T12:00:00Z`, options) : '')
const at = (iso) => (iso ? `${london(iso, { weekday: 'short', day: 'numeric', month: 'short' })}, ${londonTime(iso)}` : '')
const counted = (counts = {}) => ['messages', 'actions', 'items'].filter((kind) => counts[kind]).map((kind) => `${kind === 'actions' ? 'to do' : kind} ${counts[kind].new} new, ${counts[kind].updated} changed`).join('; ')

export function SourcesPanel({ sources = [], lastGathered }) {
  if (!sources.length) return <p className="day-quiet">Nothing has been harvested yet.</p>
  return <section className="day-panel log-sources" aria-labelledby="log-sources-heading">
    <header><h2 id="log-sources-heading">Sources</h2><span>{lastGathered ? `Last harvest ${at(lastGathered)}` : ''}</span></header>
    <ul>{sources.map((source) => <li key={source.id} className={`is-${source.status ?? 'unknown'}`}>
      <b>{source.label}</b>
      <span className="log-source-status">{STATUS_WORDS[source.status] ?? 'Not read yet'}</span>
      <span>{source.window_to ? `to ${at(source.window_to)}` : ''}</span>
      <span>{source.messages ? `${source.messages} messages` : ''}</span>
      {source.coverage ? <small dir="auto">{source.coverage}</small> : null}
    </li>)}</ul>
  </section>
}

function Runs({ runs = [], latestBatchId, onUndone }) {
  const [sure, setSure] = useState('')
  const [said, setSaid] = useState('')
  async function undo(id) {
    setSure('')
    try { const done = await apiFetch(`/api/mail/batches/${encodeURIComponent(id)}/undo`, { method: 'POST' }); setSaid(`Undone: ${done.records} records put back as they were.`); mailChanged(); onUndone?.() }
    catch (failure) { setSaid(`Not undone: ${failure.message}`) }
  }
  if (!runs.length) return null
  return <section className="log-runs" aria-label="The runs that brought this day">
    <h3>Brought by</h3>
    <ul>{runs.map((run) => <li key={run.id} className={run.status === 'undone' ? 'is-undone' : ''}>
      <span>Harvest of {at(run.gathered_at)}{run.status === 'undone' ? ' · undone' : ''}</span>
      <span className="log-run-sources">{(run.sources ?? []).map((source) => `${source.label} ${(STATUS_WORDS[source.status] ?? source.status).toLowerCase()}`).join(', ')}</span>
      {counted(run.counts) ? <span className="log-run-counts">{counted(run.counts)}</span> : null}
      {run.id === latestBatchId && run.status === 'applied' ? (sure === run.id
        ? <span className="day-stop-actions"><button type="button" onClick={() => undo(run.id)}>Undo this run</button><button type="button" onClick={() => setSure('')}>Keep it</button></span>
        : <button type="button" className="log-undo" onClick={() => setSure(run.id)}>Undo</button>) : null}
    </li>)}</ul>
    {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
  </section>
}

export function LogDay({ detail, entry, area, setArea, focus, onChanged }) {
  const items = detail.items ?? []
  const areas = AREAS.filter((key) => items.some((item) => item.area === key))
  const shown = items.filter((item) => !area || item.area === area)
  const messages = detail.messages ?? []
  const important = messages.filter((message) => IMPORTANT.has(message.category) && !message.hidden_at)
  const rest = messages.length - important.length
  return <article className="log-day-page" aria-label={dayName(detail.day)}>
    <header><h2>{dayName(detail.day)}</h2><p className="log-line">{dayLine(entry ?? {})}</p></header>
    {areas.length > 1 ? <nav className="mail-chips log-areas" aria-label="Areas">
      <button type="button" aria-pressed={!area} onClick={() => setArea('')}>All</button>
      {areas.map((key) => <button key={key} type="button" aria-pressed={area === key} onClick={() => setArea(key)}>{AREA_NAMES[key]}</button>)}
    </nav> : null}
    {AREAS.filter((key) => shown.some((item) => item.area === key)).map((key) => <section key={key} className="log-area">
      <h3>{AREA_NAMES[key]}</h3>
      <ul className="came-in-list">{shown.filter((item) => item.area === key).map((item) => <CameInItem key={item.id} item={item} focused={item.id === focus} onSaved={onChanged} />)}</ul>
    </section>)}
    {!area && detail.actions?.length ? <section className="log-area"><h3>To do</h3>
      <ul className="log-lines">{detail.actions.map((action) => <li key={action.id}><Link to={`/inbox/waiting?action=${action.id}`} dir="auto">{action.her_title || action.title}</Link>{action.due ? <span>by {dayName(action.due, { weekday: 'short', day: 'numeric', month: 'short' })}</span> : null}{action.status !== 'open' ? <span>{action.status}</span> : null}</li>)}</ul>
    </section> : null}
    {!area && messages.length ? <section className="log-area"><h3>Messages</h3>
      <ul className="log-lines">{important.map((message) => <li key={message.id}>
        <Link to={`/inbox/messages?open=${message.id}`} dir="auto">{message.subject || '(no subject)'}</Link>
        <span dir="auto">{[message.from_name || message.from_address, message.course, message.source_label].filter(Boolean).join(' · ')}</span>
        <small dir="auto">{message.summary}</small>
      </li>)}</ul>
      {rest > 0 ? <p className="log-folded"><Link to={`/inbox/messages?filter=other&from=${detail.day}&to=${detail.day}`}>{rest} more: newsletters, notifications and the rest</Link></p> : null}
    </section> : null}
    <Runs runs={detail.runs} latestBatchId={detail.latestBatchId} onUndone={onChanged} />
  </article>
}

// Everything that came in, on one list with filters, in the address so a view can be kept:
// area, kind, status, closing, where it is, words; soonest or newest first; and Keep, Dismiss or
// back to new for the ones she ticks.
const FILTERS = {
  area: [['', 'Any area'], ...AREAS.map((key) => [key, AREA_NAMES[key]])],
  kind: [['', 'Any kind'], ...KINDS.map((key) => [key, KIND_NAMES[key]])],
  status: [['live', 'Not dismissed'], ['new', 'New'], ['kept', 'Kept'], ['dismissed', 'Dismissed'], ['all', 'Any status']],
  closing: [['', 'Closing any time'], ['week', 'Closing this week'], ['month', 'Closing within a month'], ['past', 'Already closed']],
  where: [['', 'Anywhere'], ['missing', 'Not in JobMap or Events yet'], ['there', 'In JobMap or Events']],
  sort: [['closing', 'Soonest first'], ['newest', 'Newest first']],
}
export function LogEverything({ params, set }) {
  const pick = (key) => (FILTERS[key].some(([value]) => value === (params.get(key) ?? '')) ? params.get(key) ?? '' : FILTERS[key][0][0])
  const chosen = Object.fromEntries(Object.keys(FILTERS).map((key) => [key, pick(key)]))
  const [words, setWords] = useState(params.get('q') ?? '')
  useEffect(() => { const timer = window.setTimeout(() => { if ((params.get('q') ?? '') !== words.trim()) set({ q: words.trim() }) }, 300); return () => window.clearTimeout(timer) }, [words])
  const query = new URLSearchParams(Object.entries({ ...chosen, status: chosen.status === 'all' ? '' : chosen.status, q: params.get('q') ?? '' }).filter(([, value]) => value))
  const list = useMail(`/api/mail/items?${query}`)
  const items = list.data?.items ?? []
  const [ticked, setTicked] = useState(() => new Set())
  const [said, setSaid] = useState('')
  useEffect(() => setTicked(new Set()), [list.data])
  const tick = (id, on) => setTicked((current) => { const next = new Set(current); if (on) next.add(id); else next.delete(id); return next })
  async function mark(status) {
    const chosenItems = items.filter((item) => ticked.has(item.id)).map((item) => ({ id: item.id, revision: item.revision }))
    try {
      const done = await apiFetch('/api/mail/items/bulk', { method: 'POST', body: JSON.stringify({ items: chosenItems, status }) })
      setSaid(`${done.saved} saved${done.changed.length ? `; ${done.changed.length} changed elsewhere since you opened them and were left as they are` : ''}.`)
      mailChanged(); list.reload()
    } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  return <section className="day-panel log-everything" aria-label="Everything that came in">
    <div className="log-filters">
      {Object.entries(FILTERS).map(([key, options]) => <label key={key}><span className="sr-only">{key}</span>
        <select value={chosen[key]} onChange={(event) => set({ [key]: event.target.value === FILTERS[key][0][0] ? '' : event.target.value })}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </label>)}
      <label className="journal-find log-find"><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="A word in a title, an employer, a place" /></label>
    </div>
    <div className="log-bulk">
      <label><input type="checkbox" checked={items.length > 0 && ticked.size === items.length} onChange={(event) => setTicked(event.target.checked ? new Set(items.map((item) => item.id)) : new Set())} /> {list.loading ? 'Reading…' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}{ticked.size ? `, ${ticked.size} ticked` : ''}</label>
      {ticked.size ? <span className="day-stop-actions"><button type="button" onClick={() => mark('kept')}>Keep</button><button type="button" onClick={() => mark('dismissed')}>Dismiss</button><button type="button" onClick={() => mark('new')}>Back to new</button></span> : null}
      {said ? <span role="status">{said}</span> : null}
    </div>
    {list.error ? <p className="form-error" role="alert">These could not be read: {list.error}</p> : null}
    {!list.loading && !items.length ? <p className="day-quiet">Nothing matches.</p> : null}
    <ul className="came-in-list">{items.map((item) => <CameInItem key={item.id} item={item} onSaved={list.reload} selected={ticked.has(item.id)} onSelect={(on) => tick(item.id, on)} />)}</ul>
  </section>
}

export default function InboxLog({ params, setParams }) {
  const days = useMail('/api/mail/days')
  const sources = useMail('/api/mail/sources')
  const list = days.data?.days ?? []
  const chosen = isDay(params.get('day')) ? params.get('day') : list[0]?.day ?? ''
  const detail = useMail(chosen ? `/api/mail/days/${chosen}` : '')
  const focus = params.get('item') ?? ''
  const [reading, setReading] = useState(Boolean(params.get('day')))
  const set = (changes) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key) } setParams(next) }
  const byMonth = useMemo(() => {
    const months = new Map()
    for (const entry of list) {
      const month = london(`${entry.day}T12:00:00Z`, { month: 'long', year: 'numeric' })
      if (!months.has(month)) months.set(month, [])
      months.get(month).push(entry)
    }
    return [...months]
  }, [list])
  // A link to one thing that came in ("Where it came from") scrolls to it once its day is drawn.
  useEffect(() => {
    if (!focus || !detail.data) return undefined
    const timer = window.setTimeout(() => document.getElementById(`came-in-${focus}`)?.scrollIntoView({ block: 'center' }), 100)
    return () => window.clearTimeout(timer)
  }, [focus, detail.data])
  const changed = () => { detail.reload(); days.reload() }
  const everything = params.get('view') === 'all'
  return <div className={`log-page${reading ? ' is-reading' : ''}`}>
    <SourcesPanel sources={sources.data?.sources} lastGathered={sources.data?.lastGathered} />
    {days.error ? <p className="form-error" role="alert">The log could not be read: {days.error}</p> : null}
    <nav className="day-add-kind log-views" aria-label="Show">
      <button type="button" aria-pressed={!everything} onClick={() => setParams(new URLSearchParams(chosen ? { day: chosen } : {}))}>By day</button>
      <button type="button" aria-pressed={everything} onClick={() => setParams(new URLSearchParams({ view: 'all' }))}>Everything</button>
    </nav>
    {everything ? <LogEverything params={params} set={set} /> : <div className="log-split">
      <nav className="day-panel log-days" aria-label="Days">
        {days.loading ? <p className="day-quiet">Reading…</p> : !list.length ? <p className="day-quiet">No days yet.</p> : null}
        {byMonth.map(([month, entries]) => <div key={month} className="log-month">
          <h3>{month}</h3>
          <ul>{entries.map((entry) => <li key={entry.day}>
            <button type="button" aria-current={entry.day === chosen ? 'date' : undefined} onClick={() => { setReading(true); set({ day: entry.day, item: '', area: '' }) }}>
              <b>{dayName(entry.day, { weekday: 'short', day: 'numeric' })}</b><span>{dayLine(entry)}</span>
            </button>
          </li>)}</ul>
        </div>)}
      </nav>
      <section className="day-panel log-day" aria-label="The day">
        <button type="button" className="mail-back" onClick={() => setReading(false)}>All days</button>
        {!chosen ? <p className="day-quiet">Choose a day.</p>
          : detail.error ? <p className="form-error" role="alert">This day could not be read: {detail.error}</p>
            : detail.data ? <LogDay detail={detail.data} entry={list.find((entry) => entry.day === chosen)} area={params.get('area') ?? ''} setArea={(area) => set({ area })} focus={focus} onChanged={changed} />
              : <p className="day-quiet">Reading…</p>}
      </section>
    </div>}
    <MailSettings />
  </div>
}
