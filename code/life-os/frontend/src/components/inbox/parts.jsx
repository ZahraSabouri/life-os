// The pieces the Inbox is drawn with: what kind a line is and how pressing (a word, not only a
// colour), one thing owed with its buttons, and a message's text as plain text. The app names no
// assistant and hands out no prompts to copy (Xar, 4 November 2026): drafting returns as the app's own feature.
import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { useSetting } from '../../lib/settings.js'
import { addDay, london, mailChanged, saveAction, useMail } from '../../lib/useMail.js'
import { KIND_NAMES, PRIORITIES, priorityOf, textPieces, titleOf } from '@shared/mail.js'
import { GMAIL_ACCOUNT_KEY } from '@shared/harvest.js'

const PRIORITY_NAMES = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' }

// What the Inbox remembers, at the end of the Harvest log: which Gmail account "Open in Gmail"
// opens (u/1 by default: the second account signed in in the browser), and the senders folded or
// hidden, each with the way back.
export function MailSettings() {
  const [account, setAccount] = useSetting(GMAIL_ACCOUNT_KEY, 1)
  const senders = useMail('/api/mail/senders')
  const [said, setSaid] = useState('')
  async function remove(rule) {
    try { await apiFetch(`/api/mail/senders/${encodeURIComponent(rule.id)}/remove`, { method: 'POST', body: JSON.stringify({ revision: rule.revision }) }); mailChanged(); senders.reload(); setSaid(`${rule.address} shows as usual again.`) }
    catch (failure) { setSaid(`Not saved: ${failure.message}`) }
  }
  const rules = senders.data?.senders ?? []
  return <details className="day-panel mail-settings">
    <summary>Settings</summary>
    <label className="mail-sign"><span>Your Gmail account number in this browser (the number after /u/ in Gmail’s address)</span>
      <input type="number" min="0" max="9" value={account ?? 1} onChange={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value < 10) setAccount(value) }} /></label>
    <div className="mail-senders"><span>Senders you fold or hide</span>
      {rules.length ? <ul className="log-lines">{rules.map((rule) => <li key={rule.id}><b>{rule.name || rule.address}</b><span>{rule.address} · {rule.rule === 'hide' ? 'hidden' : 'folded'}</span><button type="button" onClick={() => remove(rule)}>Show as usual</button></li>)}</ul>
        : <p className="day-quiet">None. In Mail, a message’s sender can be folded to one line a day, or hidden.</p>}
      {said ? <p role="status">{said}</p> : null}
    </div>
  </details>
}

export const KindMark = ({ kind }) => <span className={`mail-kind is-${kind}`}>{KIND_NAMES[kind] ?? kind}</span>
export const PriorityMark = ({ row }) => <span className={`mail-priority is-${priorityOf(row)}`}>{PRIORITY_NAMES[priorityOf(row)]}</span>

// A short "Done. Undo" after each change, for a few seconds.
export function useUndo() {
  const [last, setLast] = useState(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const offer = (text, revert) => {
    window.clearTimeout(timer.current)
    setLast({ text, revert })
    timer.current = window.setTimeout(() => setLast(null), 7000)
  }
  const bar = last ? <p className="day-add-hint day-add-done mail-undo" role="status">{last.text} <button type="button" onClick={async () => { const { revert } = last; setLast(null); await revert() }}>Undo</button></p> : null
  return { offer, bar }
}

const since = (row) => {
  if (!row.since) return ''
  const days = Math.floor((Date.now() - Date.parse(row.since)) / 86_400_000)
  return days >= 1 ? `waiting ${days} ${days === 1 ? 'day' : 'days'}` : 'since today'
}

// One thing she owes: Done, Tomorrow, Next week, Not needed, the email, its priority, a note.
export function ActionLine({ row, today, undo, id, compact = false, onError = () => {} }) {
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)
  const closed = row.status === 'done' || row.status === 'not-needed'
  async function change(fields, words) {
    if (busy) return
    setBusy(true)
    const before = Object.fromEntries(Object.keys(fields).map((key) => [key, row[key] ?? null]))
    try {
      const saved = await saveAction(row, fields)
      if (words) undo?.offer(words, () => saveAction(saved, before).catch((failure) => onError(failure.message)))
    } catch (failure) { onError(`Not saved: ${failure.message}`) } finally { setBusy(false) }
  }
  const snooze = (days, words) => change({ status: 'snoozed', snoozed_until: addDay(today, days) }, words)
  const who = row.person_name ? <span className="mail-who">{row.person_name}</span> : null
  return <li id={id} className={`mail-action is-${priorityOf(row)}${closed ? ' is-closed' : ''}`}>
    <div className="mail-action-head">
      <KindMark kind={row.kind} />
      <b className="mail-action-title">{titleOf(row)}</b>
      {compact ? null : <PriorityMark row={row} />}
    </div>
    <p className="mail-action-facts">{[who, row.why ? <span key="why">{row.why}</span> : null,
      row.due ? <span key="due">{row.due === today ? 'today' : `by ${london(`${row.due}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' })}`}</span> : null,
      row.status === 'snoozed' && row.snoozed_until ? <span key="snooze">back {row.snoozed_until === addDay(today, 1) ? 'tomorrow' : london(`${row.snoozed_until}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' })}</span> : null,
      compact || !since(row) ? null : <span key="since">{since(row)}</span>,
      row.done_by === 'source' && row.status === 'done' ? <span key="source">{row.resolved_note || 'Done at the source'}</span> : null].filter(Boolean).reduce((all, piece, index) => (index ? [...all, ' · ', piece] : [piece]), [])}</p>
    {row.her_note && !compact ? <p className="mail-action-note">{row.her_note}</p> : null}
    <p className="day-stop-actions mail-action-buttons">
      {closed ? <button type="button" disabled={busy} onClick={() => change({ status: 'open' }, 'Opened again.')}>Open again</button> : <>
        <button type="button" disabled={busy} onClick={() => change({ status: 'done' }, 'Done.')}>Done</button>
        <button type="button" disabled={busy} onClick={() => snooze(1, 'Moved to tomorrow.')}>Tomorrow</button>
        {compact ? null : <button type="button" disabled={busy} onClick={() => snooze(7, 'Moved to next week.')}>Next week</button>}
        {compact ? null : <button type="button" disabled={busy} onClick={() => change({ status: 'not-needed' }, 'Marked not needed.')}>Not needed</button>}
      </>}
      {row.link && /^https:\/\//.test(row.link) ? <a href={row.link} target="_blank" rel="noopener noreferrer">Open the email</a> : null}
      {compact ? null : <>
        <label className="mail-priority-pick"><span className="sr-only">Priority</span>
          <select value={priorityOf(row)} disabled={busy} onChange={(event) => change({ her_priority: event.target.value === row.priority ? null : event.target.value }, 'Priority changed.')}>
            {PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_NAMES[value]}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setNote(note === null ? row.her_note ?? '' : null)}>{row.her_note ? 'Change the note' : 'A note'}</button>
      </>}
    </p>
    {note !== null ? <form className="mail-note-form" onSubmit={async (event) => { event.preventDefault(); await change({ her_note: note.trim() || null }); setNote(null) }}>
      <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="A note for yourself" aria-label="Note" autoFocus />
      <button type="submit" disabled={busy}>Keep</button>
    </form> : null}
  </li>
}

// A message's text, as plain text only: no HTML is ever drawn; https links open in a new tab.
export function MessageText({ text }) {
  return <div className="mail-text" dir="auto">{textPieces(text).map((piece, index) => (piece.href
    ? <a key={index} href={piece.href} target="_blank" rel="noopener noreferrer">{piece.href}</a>
    : <span key={index}>{piece.text}</span>))}</div>
}
