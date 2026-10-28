// Waiting on you: who she owes a reply, an email, a text, a call or birthday wishes, and what to
// read, do or decide. Grouped Today, This week, Whenever; then Done lately, folded.
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { addOwed, useMail } from '../../lib/useMail.js'
import { groupActions, parseOwe, peopleNamed } from '@shared/mail.js'
import { ActionLine, useUndo } from './parts.jsx'

const GROUPS = [['today', 'Today'], ['week', 'This week'], ['whenever', 'Whenever']]

function AddOwed({ people, onSaved }) {
  const [text, setText] = useState('')
  const [pick, setPick] = useState('')
  const [state, setState] = useState({ saving: false, error: '' })
  const owed = parseOwe(text)
  const matches = owed ? peopleNamed(people, owed.who) : []
  const chosen = matches.length === 1 ? matches[0] : matches.find((person) => String(person.id) === pick)
  const hint = !text.trim() ? '' : !owed ? 'Start with text, call, email or reply: “text Sam about Saturday”, “reply to Jo”.'
    : `“${owed.title}” goes on Waiting on you${chosen ? `, under ${chosen.name} in People` : matches.length > 1 ? '. Two people have that name: choose one' : ''}.`
  async function save(event) {
    event.preventDefault()
    if (!owed || state.saving) return
    setState({ saving: true, error: '' })
    try {
      await addOwed({ kind: owed.kind, title: owed.title, ...(chosen ? { person_id: String(chosen.id), person_name: chosen.name } : {}) })
      setText(''); setPick('')
      setState({ saving: false, error: '' })
      onSaved(`Added: ${owed.title}.`)
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="day-note mail-add" onSubmit={save}>
    <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Something you owe: “text Sam about Saturday”, “call the GP surgery”, “reply to Jo”" aria-label="Something you owe" maxLength={300} autoComplete="off" />
    {matches.length > 1 ? <label className="mail-add-pick"><span>Who</span><select value={pick} onChange={(event) => setPick(event.target.value)}>
      <option value="">Nobody in People</option>{matches.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
    </select></label> : null}
    <button type="submit" disabled={!owed || state.saving}>{state.saving ? 'Adding…' : 'Add'}</button>
    {hint ? <p className="day-add-hint">{hint}</p> : null}
    {state.error ? <p className="day-add-hint day-warn" role="alert">{state.error}</p> : null}
  </form>
}

export default function InboxWaiting({ focus }) {
  const actions = useMail('/api/mail/actions')
  const [people, setPeople] = useState([])
  const [error, setError] = useState('')
  const [said, setSaid] = useState('')
  const undo = useUndo()
  useEffect(() => { apiFetch('/api/people').then(setPeople).catch(() => setPeople([])) }, [])
  const today = actions.data?.today ?? ''
  const groups = useMemo(() => groupActions(actions.data?.actions ?? [], today), [actions.data, today])
  useEffect(() => {
    if (!focus || actions.loading) return
    document.getElementById(`mail-action-${focus}`)?.scrollIntoView({ block: 'center' })
  }, [focus, actions.loading])
  const open = groups.today.length + groups.week.length + groups.whenever.length
  return <div className="mail-waiting">
    <section className="day-panel" aria-label="Add something you owe">
      <AddOwed people={people} onSaved={setSaid} />
      {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
    </section>
    {undo.bar}
    {error || actions.error ? <p className="form-error" role="alert">{error || `The Inbox could not be read: ${actions.error}`}</p> : null}
    {actions.loading ? <p className="day-quiet">Reading…</p> : !open && !groups.done.length ? <section className="day-panel">
      <p className="day-quiet">Nothing is waiting on you. Gathered mail adds to this list (see Digests → How to gather); you can add a text, a call or an email above.</p>
    </section> : null}
    {GROUPS.map(([key, label]) => (groups[key].length ? <section key={key} className="day-panel mail-group" aria-labelledby={`mail-group-${key}`}>
      <header><h2 id={`mail-group-${key}`}>{label}</h2><span className="mail-count">{groups[key].length}</span></header>
      <ul className="mail-actions">{groups[key].map((row) => <ActionLine key={row.id} id={`mail-action-${row.id}`} row={row} today={today} undo={undo} onError={setError} />)}</ul>
    </section> : null))}
    {groups.done.length ? <details className="day-panel mail-group mail-done">
      <summary><h2>Done lately</h2><span className="mail-count">{groups.done.length}</span></summary>
      <ul className="mail-actions">{groups.done.map((row) => <ActionLine key={row.id} row={row} today={today} undo={undo} onError={setError} />)}</ul>
    </details> : null}
  </div>
}
