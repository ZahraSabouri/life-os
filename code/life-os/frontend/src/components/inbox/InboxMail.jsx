// Mail: a reading room, not a copy of the mailbox. Every harvested message by day, read inside
// Life OS as plain text with its real links and what was taken from it, one click from the
// original when that link works (never a broken one). Filters (source, kind, area, priority,
// dates, what it led to, opened or not) live in the address; newsletters, notifications and
// senders she folds collapse to one line per sender per day; senders she hides leave the list.
// Several at once can be hidden or marked as opened. At phone width the list and the reader take turns.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { useSetting } from '../../lib/settings.js'
import { addOwed, london, londonTime, mailChanged, useMail } from '../../lib/useMail.js'
import { MAIL_FILTERS, PRIORITIES, priorityOf } from '@shared/mail.js'
import { AREAS, AREA_NAMES, GMAIL_ACCOUNT_KEY, junkLink, originalLink } from '@shared/harvest.js'
import { MessageText, PriorityMark } from './parts.jsx'
import { CameInItem } from './CameInStrip.jsx'

const OPEN_IN = { outlook: 'Open in Outlook', gmail: 'Open in Gmail', 'learning-central': 'Open in Learning Central', teams: 'Open in Teams' }
const PRIORITY_NAMES = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' }
const RULE_NAMES = { fold: 'Folded', hide: 'Hidden' }
const FOLDED_CATEGORIES = new Set(['newsletter', 'automated', 'noise'])
const people = (list) => (Array.isArray(list) ? list : []).map((person) => person?.name || person?.address).filter(Boolean).join(', ')
const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))

// Her rule for this message's sender: fold or hide, and the way back.
function SenderRule({ row, onChanged }) {
  const [said, setSaid] = useState('')
  if (!row.from_address) return null
  async function rule(kind) {
    try { await apiFetch('/api/mail/senders', { method: 'POST', body: JSON.stringify({ address: row.from_address, name: row.from_name || null, rule: kind }) }); setSaid(kind === 'hide' ? 'Hidden: their mail leaves the list. Settings, at the end of the Harvest log, brings it back.' : 'Folded: their mail is one line a day.'); mailChanged(); onChanged?.() }
    catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  async function stop() {
    try { await apiFetch(`/api/mail/senders/${encodeURIComponent(row.rule.id)}/remove`, { method: 'POST', body: JSON.stringify({ revision: row.rule.revision }) }); setSaid('Their mail shows as usual again.'); mailChanged(); onChanged?.() }
    catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  return <p className="mail-sender-rule">
    {row.rule ? <><span>{RULE_NAMES[row.rule.rule]}: {row.from_address}</span><button type="button" onClick={stop}>Show as usual</button></>
      : <><span>Everything from {row.from_address}:</span><button type="button" onClick={() => rule('fold')}>Fold</button><button type="button" onClick={() => rule('hide')}>Hide</button></>}
    {said ? <span role="status">{said}</span> : null}
  </p>
}

// The reader: who, when, the summary with its priority, what was taken from it, the text as text,
// its real links, and what to do next.
export function MessageReader({ message, onBack, onChanged }) {
  const [said, setSaid] = useState('')
  const [row, setRow] = useState(message)
  const [gmailAccount] = useSetting(GMAIL_ACCOUNT_KEY, 1)
  useEffect(() => setRow(message), [message])
  async function change(fields, words) {
    try {
      const saved = await apiFetch(`/api/mail/messages/${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ revision: row.revision, ...fields }) })
      setRow((current) => ({ ...current, ...saved })); setSaid(words); mailChanged(); onChanged?.()
    } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  async function owe() {
    try {
      await addOwed({ kind: 'reply', title: `Reply to ${row.from_name || row.from_address || 'this message'}${row.subject ? ` about “${row.subject}”` : ''}`, message_id: row.id, person_name: row.from_name || null })
      setSaid('Added to Waiting on you.')
    } catch (failure) { setSaid(`Not added: ${failure.message}`) }
  }
  const original = originalLink(row, { gmailAccount })
  const links = (Array.isArray(row.links) ? row.links : []).filter((link) => link?.href && !junkLink(link.href))
  const taken = row.taken ?? { items: [], actions: [] }
  return <article className="mail-reader" aria-label={row.subject || 'Message'}>
    {onBack ? <button type="button" className="mail-back" onClick={onBack}>Back to the list</button> : null}
    <h2 dir="auto">{row.subject || '(no subject)'}</h2>
    <dl className="mail-meta">
      <div><dt>From</dt><dd dir="auto">{row.from_name || ''}{row.from_address ? ` <${row.from_address}>` : ''}</dd></div>
      {people(row.to_list) ? <div><dt>To</dt><dd dir="auto">{people(row.to_list)}</dd></div> : null}
      {people(row.cc_list) ? <div><dt>Cc</dt><dd dir="auto">{people(row.cc_list)}</dd></div> : null}
      <div><dt>When</dt><dd>{london(row.received_at, { weekday: 'long', day: 'numeric', month: 'long' })}, {londonTime(row.received_at)}</dd></div>
      <div><dt>Where</dt><dd>{[row.source_label, row.course, row.folder].filter(Boolean).join(' · ')}</dd></div>
    </dl>
    <section className={`mail-summary is-${priorityOf(row)}`}>
      <p dir="auto">{row.summary}</p>
      <p className="mail-summary-why"><PriorityMark row={row} />{row.priority_reason ? <span dir="auto">{row.priority_reason}</span> : null}
        <label className="mail-priority-pick"><span className="sr-only">Priority</span>
          <select value={priorityOf(row)} onChange={(event) => change({ her_priority: event.target.value === row.priority ? null : event.target.value }, 'Priority changed.')}>
            {PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_NAMES[value]}</option>)}
          </select>
        </label>
      </p>
    </section>
    {taken.items.length || taken.actions.length ? <section className="mail-taken" aria-label="Taken from this">
      <h3>Taken from this</h3>
      {taken.actions.length ? <ul className="log-lines">{taken.actions.map((action) => <li key={action.id}><Link to={`/inbox?action=${action.id}`} dir="auto">{action.her_title || action.title}</Link><span>{action.due ? `by ${london(`${action.due}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' })} · ` : ''}Waiting on you</span></li>)}</ul> : null}
      {taken.items.length ? <ul className="came-in-list">{taken.items.map((item) => <CameInItem key={item.id} item={item} onSaved={onChanged} />)}</ul> : null}
    </section> : null}
    {row.body ? <MessageText text={row.body} /> : <p className="day-quiet">{row.text_complete === false ? 'Only part of this message was harvested.' : 'Only a summary was harvested for this message.'}{original ? ' The original has the rest.' : ''}</p>}
    {row.body && row.text_complete === false ? <p className="day-quiet">The text was cut short when it was harvested.</p> : null}
    {links.length ? <section className="mail-links" aria-label="Links in this message"><h3>Links</h3>
      <ul>{links.map((link, index) => <li key={index}><a href={link.href} target="_blank" rel="noopener noreferrer" dir="auto">{link.text || new URL(link.href).hostname}</a> <small>{new URL(link.href).hostname}</small></li>)}</ul>
    </section> : null}
    {Array.isArray(row.attachments) && row.attachments.length ? <p className="mail-attachments">Attached: {row.attachments.map((file) => file?.name).filter(Boolean).join(', ')}</p> : null}
    <p className="day-stop-actions mail-reader-actions">
      {original ? <a href={original} target="_blank" rel="noopener noreferrer">{OPEN_IN[row.source_kind] ?? 'Open the original'}</a> : null}
      <button type="button" onClick={owe}>I need to reply</button>
      {row.hidden_at ? <button type="button" onClick={() => change({ hidden_at: null }, 'Shown again.')}>Show again</button> : <button type="button" onClick={() => change({ hidden_at: new Date().toISOString() }, 'Hidden. “Show hidden” brings it back.')}>Hide</button>}
    </p>
    <SenderRule row={row} onChanged={onChanged} />
    {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
  </article>
}

// One day's rows, with newsletters, notifications and folded senders as one line per sender.
export function foldDay(rows) {
  const out = []
  const groups = new Map()
  for (const row of rows) {
    if (!(FOLDED_CATEGORIES.has(row.category) || row.rule === 'fold')) { out.push({ row }); continue }
    const key = String(row.from_address || row.from_name || row.source_label || '').toLowerCase()
    if (!groups.has(key)) { const group = { key, rows: [] }; groups.set(key, group); out.push({ group }) }
    groups.get(key).rows.push(row)
  }
  // A sender with one such message that day is just that message.
  return out.map((entry) => (entry.group && entry.group.rows.length === 1 ? { row: entry.group.rows[0] } : entry))
}

const FILTER_KEYS = ['source', 'filter', 'area', 'priority', 'has', 'from', 'to', 'unread', 'notseen', 'hidden', 'noise', 'q']

function MessageRow({ row, openId, open, ticked, tick }) {
  return <li className="mail-row-line">
    <input type="checkbox" checked={ticked.has(row.id)} onChange={(event) => tick([row], event.target.checked)} aria-label={`Choose ${row.subject || 'this message'}`} />
    <button type="button" className={`mail-row is-${priorityOf(row)}${row.id === openId ? ' is-open' : ''}${row.seen_at ? '' : ' is-new'}${row.hidden_at ? ' is-hidden' : ''}`} onClick={() => open(row.id)}>
      <PriorityMark row={row} />
      <span className="mail-row-from" dir="auto">{row.from_name || row.from_address || row.source_label}</span>
      <span className="mail-row-subject" dir="auto">{row.subject || '(no subject)'}</span>
      <span className="mail-row-summary" dir="auto">{row.summary}</span>
      <span className="mail-row-when">{londonTime(row.received_at)} · {row.source_label}{row.unread_at_source ? ' · unread' : ''}{row.taken ? ` · ${row.taken} taken` : ''}{row.owed ? ' · to do' : ''}</span>
    </button>
  </li>
}

export default function InboxMail({ params, setParams }) {
  const get = (key) => params.get(key) ?? ''
  const filter = MAIL_FILTERS.some(([key]) => key === get('filter')) ? get('filter') : 'all'
  const [words, setWords] = useState(get('q'))
  useEffect(() => { const timer = window.setTimeout(() => { if (get('q') !== words.trim()) set('q', words.trim()) }, 300); return () => window.clearTimeout(timer) }, [words])
  const query = new URLSearchParams(FILTER_KEYS.map((key) => [key, key === 'filter' ? (filter === 'all' ? '' : filter) : get(key)]).filter(([, value]) => value))
  const list = useMail(`/api/mail/messages?${query}`)
  const status = useMail('/api/mail/sources')
  const sources = status.data?.sources ?? []
  const [openId, setOpenId] = useState(get('open'))
  const opened = useMail(openId ? `/api/mail/messages/${encodeURIComponent(openId)}` : '')
  const [expanded, setExpanded] = useState(() => new Set())
  const [ticked, setTicked] = useState(() => new Set())
  const [said, setSaid] = useState('')
  useEffect(() => setTicked(new Set()), [list.data])
  function set(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next) }
  const open = (id) => { setOpenId(id); set('open', id) }
  const tick = (rows, on) => setTicked((current) => { const next = new Set(current); for (const row of rows) { if (on) next.add(row.id); else next.delete(row.id) } return next })
  const filtered = FILTER_KEYS.some((key) => get(key))
  const byDay = useMemo(() => {
    const days = new Map()
    for (const row of list.data ?? []) {
      const day = london(row.received_at, { weekday: 'long', day: 'numeric', month: 'long' })
      if (!days.has(day)) days.set(day, [])
      days.get(day).push(row)
    }
    return [...days].map(([day, rows]) => [day, foldDay(rows)])
  }, [list.data])
  async function bulk(change) {
    const chosen = (list.data ?? []).filter((row) => ticked.has(row.id)).map((row) => ({ id: row.id, revision: row.revision }))
    try {
      const done = await apiFetch('/api/mail/messages/bulk', { method: 'POST', body: JSON.stringify({ messages: chosen, change }) })
      setSaid(`${done.saved} ${change === 'hide' ? 'hidden' : change === 'show' ? 'shown again' : 'marked as opened'}${done.changed.length ? `; ${done.changed.length} changed elsewhere and were left as they are` : ''}.`)
      mailChanged(); list.reload()
    } catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  const select = (key, label, options) => <label><span className="sr-only">{label}</span>
    <select value={get(key)} onChange={(event) => set(key, event.target.value)}>{options.map(([value, words]) => <option key={value} value={value}>{words}</option>)}</select>
  </label>
  return <div className={`mail-mail${openId ? ' is-reading' : ''}`}>
    <div className="mail-controls">
      <nav className="mail-chips" aria-label="Sources">
        <button type="button" aria-pressed={!get('source')} onClick={() => set('source', '')}>All</button>
        {sources.map((entry) => <button key={entry.id} type="button" className={`is-${entry.kind}`} aria-pressed={get('source') === entry.id} onClick={() => set('source', entry.id)}>{entry.label}</button>)}
      </nav>
      <nav className="day-add-kind mail-filters" aria-label="Show">
        {MAIL_FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => set('filter', key === 'all' ? '' : key)}>{label}</button>)}
      </nav>
      <div className="log-filters mail-more-filters">
        {select('area', 'Area', [['', 'Any area'], ...AREAS.map((key) => [key, AREA_NAMES[key]])])}
        {select('priority', 'Priority', [['', 'Any priority'], ...PRIORITIES.map((key) => [key, PRIORITY_NAMES[key]])])}
        {select('has', 'What it led to', [['', 'Led to anything or nothing'], ['items', 'Led to something that came in'], ['actions', 'Led to something to do'], ['deadline', 'Has a deadline']])}
        <label className="mail-date"><span>From</span><input type="date" value={get('from')} onChange={(event) => set('from', isDay(event.target.value) ? event.target.value : '')} /></label>
        <label className="mail-date"><span>To</span><input type="date" value={get('to')} onChange={(event) => set('to', isDay(event.target.value) ? event.target.value : '')} /></label>
      </div>
      <div className="mail-flags">
        <label className="journal-find mail-search"><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="A word in a subject, a sender or the text" /></label>
        <label><input type="checkbox" checked={get('notseen') === '1'} onChange={(event) => set('notseen', event.target.checked ? '1' : '')} /> Not opened here</label>
        <label><input type="checkbox" checked={get('unread') === '1'} onChange={(event) => set('unread', event.target.checked ? '1' : '')} /> Unread at source</label>
        <label><input type="checkbox" checked={get('hidden') === '1'} onChange={(event) => set('hidden', event.target.checked ? '1' : '')} /> Show hidden</label>
        {filter === 'other' ? <label><input type="checkbox" checked={get('noise') === '1'} onChange={(event) => set('noise', event.target.checked ? '1' : '')} /> Show noise</label> : null}
        {filtered ? <button type="button" className="mail-clear" onClick={() => { setWords(''); setParams(new URLSearchParams(openId ? { open: openId } : {})) }}>Clear filters</button> : null}
      </div>
    </div>
    <div className="mail-split">
      <section className="day-panel mail-list" aria-label="Messages">
        <div className="log-bulk mail-bulk">
          <label><input type="checkbox" checked={Boolean(list.data?.length) && ticked.size === list.data.length} onChange={(event) => tick(list.data ?? [], event.target.checked)} /> {list.loading ? 'Reading…' : `${(list.data ?? []).length} messages`}{ticked.size ? `, ${ticked.size} ticked` : ''}</label>
          {ticked.size ? <span className="day-stop-actions"><button type="button" onClick={() => bulk('seen')}>Mark as opened</button>{get('hidden') === '1' ? <button type="button" onClick={() => bulk('show')}>Show again</button> : null}<button type="button" onClick={() => bulk('hide')}>Hide</button></span> : null}
          {said ? <span role="status">{said}</span> : null}
        </div>
        {list.error ? <p className="form-error" role="alert">The mail could not be read: {list.error}</p> : null}
        {!list.loading && !byDay.length ? <p className="day-quiet">{filtered ? 'Nothing matches these filters.' : 'No messages here yet. They come in with each harvest.'}</p> : null}
        {byDay.map(([day, entries]) => <div key={day} className="mail-day">
          <h3>{day}</h3>
          <ul>{entries.map((entry) => entry.row ? <MessageRow key={entry.row.id} row={entry.row} openId={openId} open={open} ticked={ticked} tick={tick} />
            : <li key={`${day}:${entry.group.key}`} className="mail-fold">
              <div className="mail-row-line">
                <input type="checkbox" checked={entry.group.rows.every((row) => ticked.has(row.id))} onChange={(event) => tick(entry.group.rows, event.target.checked)} aria-label={`Choose all ${entry.group.rows.length}`} />
                <button type="button" className="mail-fold-line" aria-expanded={expanded.has(`${day}:${entry.group.key}`)} onClick={() => setExpanded((current) => { const next = new Set(current); const key = `${day}:${entry.group.key}`; if (next.has(key)) next.delete(key); else next.add(key); return next })}>
                  <span className="mail-row-from" dir="auto">{entry.group.rows[0].from_name || entry.group.rows[0].from_address || entry.group.rows[0].source_label}</span>
                  <span>{entry.group.rows.length} messages{entry.group.rows.some((row) => row.taken) ? ` · ${entry.group.rows.reduce((sum, row) => sum + (row.taken || 0), 0)} taken` : ''}{entry.group.rows[0].rule === 'fold' ? ' · folded' : ''}</span>
                </button>
              </div>
              {expanded.has(`${day}:${entry.group.key}`) ? <ul>{entry.group.rows.map((row) => <MessageRow key={row.id} row={row} openId={openId} open={open} ticked={ticked} tick={tick} />)}</ul> : null}
            </li>)}</ul>
        </div>)}
      </section>
      <section className="day-panel mail-read" aria-label="The message">
        {!openId ? <p className="day-quiet">Choose a message to read it here.</p>
          : opened.error ? <p className="form-error" role="alert">This message could not be opened: {opened.error}</p>
            : opened.data ? <MessageReader message={opened.data} onBack={() => open('')} onChanged={() => { list.reload(); opened.reload() }} /> : <p className="day-quiet">Opening…</p>}
      </section>
    </div>
  </div>
}
