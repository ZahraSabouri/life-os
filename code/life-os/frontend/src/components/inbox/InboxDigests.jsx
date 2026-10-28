// Digests: each gathering run, newest first: its headline, what needs her, deadlines, what each
// source said and could not read, and the counts. Undo on the latest. How to gather, at the top.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api.js'
import { useSetting } from '../../lib/settings.js'
import { london, londonTime, mailChanged, useMail } from '../../lib/useMail.js'
import { SIGN_NAME_KEY } from './parts.jsx'

export const GATHER_PROMPT = 'Gather my inboxes: follow mail/GATHER.md in the Life_OS folder.'
const STATUS_WORDS = { read: 'Read', partial: 'Partly read', unavailable: 'Not reachable', skipped: 'Skipped' }
const when = (iso) => (iso ? `${london(iso, { weekday: 'long', day: 'numeric', month: 'long' })}, ${londonTime(iso)}` : '')

export function HowToGather() {
  const [said, setSaid] = useState('')
  const [name, setName] = useSetting(SIGN_NAME_KEY, '')
  async function copy() {
    try { await navigator.clipboard.writeText(GATHER_PROMPT); setSaid('Copied.') } catch { setSaid('Could not copy; select the words and copy them.') }
  }
  return <section className="day-panel mail-how" aria-labelledby="mail-how-heading">
    <header><h2 id="mail-how-heading">How to gather</h2><Link to="/guide/inbox">The Guide’s page</Link></header>
    <ol className="mail-how-steps">
      <li>In the Claude app, open your scheduled tasks and run <b>Gather my inboxes</b>. It reads Cardiff Outlook, Gmail, Learning Central and Teams, changes nothing in them, and leaves a batch for Life OS.</li>
      <li>Or give any AI with this folder (Codex, Claude Code) the line below.</li>
      <li>Life OS takes the batch in within a minute and shows it here. Nothing is gathered unless you run it.</li>
    </ol>
    <p className="mail-gather-line"><code>{GATHER_PROMPT}</code> <button type="button" onClick={copy}>Copy</button> {said ? <span role="status">{said}</span> : null}</p>
    <label className="mail-sign"><span>Your name for signing replies Claude writes</span><input value={name ?? ''} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Leave empty to sign them yourself" /></label>
  </section>
}

export default function InboxDigests() {
  const digests = useMail('/api/mail/digests')
  const [said, setSaid] = useState('')
  const [sure, setSure] = useState(false)
  const list = digests.data?.digests ?? []
  const latest = list[0]
  async function undo() {
    setSure(false)
    try { const done = await apiFetch(`/api/mail/batches/${encodeURIComponent(latest.id)}/undo`, { method: 'POST' }); setSaid(`Undone: ${done.records} records put back as they were.`); mailChanged() }
    catch (failure) { setSaid(`Not undone: ${failure.message}`) }
  }
  return <div className="mail-digests">
    <p className="mail-last">{digests.data?.lastGathered ? `Last gathered ${when(digests.data.lastGathered)}.` : digests.loading ? 'Reading…' : 'Nothing has been gathered yet.'}</p>
    <HowToGather />
    {digests.error ? <p className="form-error" role="alert">The digests could not be read: {digests.error}</p> : null}
    {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
    {list.map((entry) => {
      const digest = entry.digest ?? {}
      const counts = entry.counts ?? {}
      return <section key={entry.id} className={`day-panel mail-digest${entry.status === 'undone' ? ' is-undone' : ''}`} aria-label={`Gathered ${when(entry.gathered_at)}`}>
        <header><h2>{when(entry.gathered_at)}</h2><span>{entry.status === 'undone' ? 'Undone' : `${counts.messages?.new ?? 0} new messages · ${counts.actions?.new ?? 0} new things to do`}</span></header>
        {digest.headline ? <p className="mail-headline" dir="auto">{digest.headline}</p> : null}
        {digest.needsYou?.length ? <><h3>Needs you</h3><ul className="day-list">{digest.needsYou.map((line, index) => <li key={index} dir="auto">{line}</li>)}</ul></> : null}
        {digest.deadlines?.length ? <><h3>Deadlines</h3><ul className="day-list">{digest.deadlines.map((line, index) => <li key={index} dir="auto">{line.title} · {london(`${line.date}T12:00:00Z`, { weekday: 'short', day: 'numeric', month: 'short' })}</li>)}</ul></> : null}
        <h3>Each source</h3>
        <ul className="mail-sources">{(entry.sources ?? []).map((source) => {
          const line = digest.bySource?.find((part) => part.source === source.id)
          return <li key={source.id} className={`is-${source.status}`}><b>{source.label}</b> <span className="mail-source-status">{STATUS_WORDS[source.status] ?? source.status}</span>
            {line?.summary ? <p dir="auto">{line.summary}</p> : null}{source.coverage ? <p className="mail-coverage" dir="auto">{source.coverage}</p> : null}</li>
        })}</ul>
        {digest.gaps?.length ? <><h3>Could not be read</h3><ul className="day-list">{digest.gaps.map((line, index) => <li key={index} dir="auto">{line}</li>)}</ul></> : null}
        <p className="mail-counts">Messages: {counts.messages?.new ?? 0} new, {counts.messages?.updated ?? 0} changed, {counts.messages?.unchanged ?? 0} unchanged. Things to do: {counts.actions?.new ?? 0} new, {counts.actions?.updated ?? 0} changed.{entry.agent ? ` Gathered by ${entry.agent}.` : ''}</p>
        {entry === latest && entry.status === 'applied' ? <p className="day-stop-actions">
          {sure ? <><button type="button" onClick={undo}>Undo this batch</button><button type="button" onClick={() => setSure(false)}>Keep it</button></> : <button type="button" onClick={() => setSure(true)}>Undo</button>}
        </p> : null}
      </section>
    })}
  </div>
}
