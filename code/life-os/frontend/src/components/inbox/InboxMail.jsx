// Mail: every gathered message, by day, read inside Life OS as plain text, one click from the
// original. Sources and filters at the top; at phone width the list and the reader take turns.
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { addOwed, london, londonTime, mailChanged, useMail } from '../../lib/useMail.js'
import { MAIL_FILTERS, PRIORITIES, priorityOf } from '@shared/mail.js'
import { MessageText, PriorityMark, WriteWithClaude } from './parts.jsx'

const OPEN_IN = { outlook: 'Open in Outlook', gmail: 'Open in Gmail', 'learning-central': 'Open in Learning Central', teams: 'Open in Teams' }
const PRIORITY_NAMES = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' }
const people = (list) => (Array.isArray(list) ? list : []).map((person) => person?.name || person?.address).filter(Boolean).join(', ')

// The reader: who, when, the summary with its priority, the text as text, and what to do next.
export function MessageReader({ message, onBack, onChanged }) {
  const [said, setSaid] = useState('')
  const [row, setRow] = useState(message)
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
    {row.body ? <MessageText text={row.body} /> : <p className="day-quiet">{row.text_complete === false ? 'Only part of this message was gathered.' : 'Only a summary was gathered for this message.'} Open the original for the rest.</p>}
    {row.body && row.text_complete === false ? <p className="day-quiet">The text was cut short when it was gathered.</p> : null}
    {Array.isArray(row.attachments) && row.attachments.length ? <p className="mail-attachments">Attached: {row.attachments.map((file) => file?.name).filter(Boolean).join(', ')}</p> : null}
    <p className="day-stop-actions mail-reader-actions">
      {row.link && /^https:\/\//.test(row.link) ? <a href={row.link} target="_blank" rel="noopener noreferrer">{OPEN_IN[row.source_kind] ?? 'Open the original'}</a> : null}
      <button type="button" onClick={owe}>I need to reply</button>
      <WriteWithClaude message={row} />
      {row.hidden_at ? <button type="button" onClick={() => change({ hidden_at: null }, 'Shown again.')}>Show again</button> : <button type="button" onClick={() => change({ hidden_at: new Date().toISOString() }, 'Hidden. “Show hidden” brings it back.')}>Hide</button>}
    </p>
    {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
  </article>
}

export default function InboxMail({ params, setParams }) {
  const filter = MAIL_FILTERS.some(([key]) => key === params.get('filter')) ? params.get('filter') : 'all'
  const source = params.get('source') ?? ''
  const flags = { unread: params.get('unread') === '1', hidden: params.get('hidden') === '1', noise: params.get('noise') === '1' }
  const [words, setWords] = useState(params.get('q') ?? '')
  const [asked, setAsked] = useState(words)
  useEffect(() => { const timer = window.setTimeout(() => setAsked(words.trim()), 300); return () => window.clearTimeout(timer) }, [words])
  const query = new URLSearchParams({ filter, ...(source ? { source } : {}), ...(flags.unread ? { unread: '1' } : {}), ...(flags.hidden ? { hidden: '1' } : {}), ...(flags.noise ? { noise: '1' } : {}), ...(asked ? { q: asked } : {}) })
  const list = useMail(`/api/mail/messages?${query}`)
  const status = useMail('/api/mail/digests')
  const sources = useMemo(() => {
    const latest = status.data?.digests?.find((entry) => entry.status === 'applied')
    return (latest?.sources ?? []).map((entry) => ({ id: entry.id, label: entry.label, kind: entry.kind }))
  }, [status.data])
  const [openId, setOpenId] = useState(params.get('open') ?? '')
  const opened = useMail(openId ? `/api/mail/messages/${encodeURIComponent(openId)}` : '')
  const set = (key, value) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next) }
  const open = (id) => { setOpenId(id); set('open', id) }
  const byDay = useMemo(() => {
    const days = new Map()
    for (const row of list.data ?? []) {
      const day = london(row.received_at, { weekday: 'long', day: 'numeric', month: 'long' })
      if (!days.has(day)) days.set(day, [])
      days.get(day).push(row)
    }
    return [...days]
  }, [list.data])
  return <div className={`mail-mail${openId ? ' is-reading' : ''}`}>
    <div className="mail-controls">
      <nav className="mail-chips" aria-label="Sources">
        <button type="button" aria-pressed={!source} onClick={() => set('source', '')}>All</button>
        {sources.map((entry) => <button key={entry.id} type="button" className={`is-${entry.kind}`} aria-pressed={source === entry.id} onClick={() => set('source', entry.id)}>{entry.label}</button>)}
      </nav>
      <nav className="day-add-kind mail-filters" aria-label="Show">
        {MAIL_FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => set('filter', key === 'all' ? '' : key)}>{label}</button>)}
      </nav>
      <div className="mail-flags">
        <label className="journal-find mail-search"><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="A word in a subject, a sender or the text" /></label>
        <label><input type="checkbox" checked={flags.unread} onChange={(event) => set('unread', event.target.checked ? '1' : '')} /> Unread at source</label>
        <label><input type="checkbox" checked={flags.hidden} onChange={(event) => set('hidden', event.target.checked ? '1' : '')} /> Show hidden</label>
        {filter === 'other' ? <label><input type="checkbox" checked={flags.noise} onChange={(event) => set('noise', event.target.checked ? '1' : '')} /> Show noise</label> : null}
      </div>
    </div>
    <div className="mail-split">
      <section className="day-panel mail-list" aria-label="Messages">
        {list.error ? <p className="form-error" role="alert">The mail could not be read: {list.error}</p> : null}
        {list.loading ? <p className="day-quiet">Reading…</p> : !byDay.length ? <p className="day-quiet">{asked ? 'Nothing matches those words.' : 'No messages here yet. They come in when you gather your inboxes.'}</p> : null}
        {byDay.map(([day, rows]) => <div key={day} className="mail-day">
          <h3>{day}</h3>
          <ul>{rows.map((row) => <li key={row.id}>
            <button type="button" className={`mail-row is-${priorityOf(row)}${row.id === openId ? ' is-open' : ''}${row.seen_at ? '' : ' is-new'}${row.hidden_at ? ' is-hidden' : ''}`} onClick={() => open(row.id)}>
              <PriorityMark row={row} />
              <span className="mail-row-from" dir="auto">{row.from_name || row.from_address || row.source_label}</span>
              <span className="mail-row-subject" dir="auto">{row.subject || '(no subject)'}</span>
              <span className="mail-row-summary" dir="auto">{row.summary}</span>
              <span className="mail-row-when">{londonTime(row.received_at)} · {row.source_label}{row.unread_at_source ? ' · unread' : ''}</span>
            </button>
          </li>)}</ul>
        </div>)}
      </section>
      <section className="day-panel mail-read" aria-label="The message">
        {!openId ? <p className="day-quiet">Choose a message to read it here.</p>
          : opened.error ? <p className="form-error" role="alert">This message could not be opened: {opened.error}</p>
            : opened.data ? <MessageReader message={opened.data} onBack={() => open('')} onChanged={list.reload} /> : <p className="day-quiet">Opening…</p>}
      </section>
    </div>
  </div>
}
