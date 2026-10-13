// People: the ones in her life, with what she knows of them. A birthday set here is on the
// calendar every year, and in the bell on the day and the day before.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { formatCalendarDay } from '../lib/calendar.js'
import { useLondonToday } from '../lib/useCalendar.js'

const EMPTY = { name: '', birthday: '', relation: '', contact: '', notes: '' }
const RELATIONS = ['Family', 'Friend', 'Partner', 'Classmate', 'Colleague', 'Teacher', 'Neighbour']
// The next time the birthday comes round, how many days away, and the age turned (when the year is known).
export function nextBirthday(birthday, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday ?? '')) return null
  const year = Number(today.slice(0, 4))
  const on = (y) => { const leapDay = birthday.slice(5) === '02-29' && new Date(Date.UTC(y, 1, 29)).getUTCMonth() !== 1; return `${y}-${leapDay ? '02-28' : birthday.slice(5)}` }
  const date = on(year) >= today ? on(year) : on(year + 1)
  const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000)
  const born = Number(birthday.slice(0, 4))
  return { date, days, turns: born > 1900 ? Number(date.slice(0, 4)) - born : null }
}
const away = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`)

function PersonForm({ person = EMPTY, onSaved, onCancel, saveWords }) {
  const [form, setForm] = useState({ ...EMPTY, ...Object.fromEntries(Object.entries(person).map(([key, value]) => [key, value ?? ''])) })
  const [state, setState] = useState({ saving: false, error: '' })
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  async function save(event) {
    event.preventDefault()
    if (state.saving) return
    if (!form.name.trim()) { setState({ saving: false, error: 'Give the person a name' }); return }
    setState({ saving: true, error: '' })
    try {
      const body = JSON.stringify({ name: form.name, birthday: form.birthday, relation: form.relation, contact: form.contact, notes: form.notes })
      const saved = await apiFetch(person.id ? `/api/people/${encodeURIComponent(person.id)}` : '/api/people', { method: person.id ? 'PATCH' : 'POST', body })
      if (!person.id) setForm(EMPTY)
      setState({ saving: false, error: '' })
      onSaved(saved)
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="entry-editor people-form" onSubmit={save} aria-label={person.id ? `Change ${person.name}` : 'Add a person'}>
    <label><span>Name</span><input value={form.name} onChange={set('name')} maxLength={200} placeholder="Sara" /></label>
    <label><span>Birthday (if you know it)</span><input type="date" value={form.birthday} onChange={set('birthday')} /></label>
    <label><span>How you know them</span><input value={form.relation} onChange={set('relation')} list="people-relations" maxLength={120} placeholder="Friend" /></label>
    <label><span>How to reach them</span><input value={form.contact} onChange={set('contact')} maxLength={400} placeholder="Phone, email, handle" /></label>
    <label className="entry-editor-wide"><span>Notes</span><textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={8000} placeholder="Gift ideas, what they like, what you talked about…" /></label>
    <datalist id="people-relations">{RELATIONS.map((name) => <option key={name} value={name} />)}</datalist>
    {state.error ? <p className="entry-editor-wide entry-editor-error" role="alert">{state.error}</p> : null}
    <p className="entry-editor-wide entry-editor-actions">
      <button type="submit" className="entry-editor-save" disabled={state.saving}>{state.saving ? 'Saving…' : saveWords}</button>
      {onCancel ? <button type="button" onClick={onCancel}>Cancel</button> : null}
    </p>
  </form>
}

export default function PeopleView() {
  const today = useLondonToday()
  const [state, setState] = useState({ people: [], loading: true, error: '' })
  const [turn, setTurn] = useState(0)
  const [editing, setEditing] = useState('')
  const [sure, setSure] = useState('')
  const [words, setWords] = useState('')
  const [said, setSaid] = useState('')
  useEffect(() => {
    let off = false
    apiFetch('/api/people').then((people) => { if (!off) setState({ people, loading: false, error: '' }) }).catch((failure) => { if (!off) setState({ people: [], loading: false, error: failure.message }) })
    return () => { off = true }
  }, [turn])
  const again = () => setTurn((value) => value + 1)
  const people = useMemo(() => state.people.map((person) => ({ ...person, next: nextBirthday(person.birthday, today) })), [state.people, today])
  const asked = words.toLowerCase().trim()
  const found = people.filter((person) => !asked || `${person.name} ${person.relation ?? ''} ${person.notes ?? ''} ${person.contact ?? ''}`.toLowerCase().includes(asked)).sort((a, b) => a.name.localeCompare(b.name))
  const coming = people.filter((person) => person.next && person.next.days <= 60).sort((a, b) => a.next.days - b.next.days)
  async function remove(person) {
    setSure('')
    try { await apiFetch(`/api/people/${encodeURIComponent(person.id)}`, { method: 'DELETE' }); setSaid(`${person.name} was removed.`); again() } catch (failure) { setState((current) => ({ ...current, error: failure.message })) }
  }
  return <section className="today-layout unified-today day-page people-page" aria-label="People">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>People</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'}` : 'The people in your life'}</time></div>
    </header>
    <section className="day-panel" aria-labelledby="people-add-heading">
      <header><h2 id="people-add-heading">Add a person</h2></header>
      <PersonForm saveWords="Add" onSaved={(saved) => { setSaid(`${saved.name} was added${saved.birthday ? '. The birthday is on your calendar every year' : ''}.`); again() }} />
      {said ? <p className="day-add-hint day-add-done" role="status">{said}</p> : null}
    </section>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    {coming.length ? <section className="day-panel" aria-labelledby="people-coming-heading">
      <header><h2 id="people-coming-heading">Birthdays in the next two months</h2><Link to="/calendar">Open the calendar</Link></header>
      <ul className="day-list people-coming">{coming.map((person) => <li key={person.id}><span><b>{person.name}</b>{person.next.turns ? ` turns ${person.next.turns}` : ''}</span><small>{formatCalendarDay(person.next.date, { weekday: 'long' })} · {away(person.next.days)}</small></li>)}</ul>
    </section> : null}
    <section className="day-panel" aria-labelledby="people-all-heading">
      <header><h2 id="people-all-heading">Everyone</h2>{people.length > 6 ? <label className="journal-find"><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="A name, or a word in the notes" /></label> : null}</header>
      {found.length ? <ul className="people-list">{found.map((person) => <li key={person.id}>
        {editing === person.id ? <PersonForm person={person} saveWords="Save changes" onCancel={() => setEditing('')} onSaved={() => { setEditing(''); setSaid(''); again() }} /> : <>
          <div className="people-who"><b>{person.name}</b>{person.relation ? <span>{person.relation}</span> : null}</div>
          <p className="people-facts">{[person.next ? `Birthday ${formatCalendarDay(person.next.date, { weekday: undefined })}, ${away(person.next.days)}${person.next.turns ? ` (turns ${person.next.turns})` : ''}` : 'No birthday set', person.contact].filter(Boolean).join(' · ')}</p>
          {person.notes ? <p className="people-notes">{person.notes}</p> : null}
          <p className="day-stop-actions">
            <button type="button" onClick={() => { setEditing(person.id); setSure('') }}>Change</button>
            {sure === person.id ? <><button type="button" onClick={() => remove(person)}>Remove for good</button><button type="button" onClick={() => setSure('')}>Keep</button></> : <button type="button" onClick={() => setSure(person.id)}>Remove</button>}
          </p>
        </>}
      </li>)}</ul> : <p className="day-quiet">{state.loading ? 'Opening…' : people.length ? 'Nobody matches those words.' : 'Nobody yet. Add the first person above; only a name is needed.'}</p>}
    </section>
  </section>
}
