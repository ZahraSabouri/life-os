import { useCallback, useEffect, useState } from 'react'
import { isFocusRoomRoute } from '../utils/focusSession.js'
import {
  hubRequest,
  lastSemesterId,
  openSession,
  opensLastSemester,
  setOpensLastSemester,
  staysInSemester,
  tabSemesterId,
} from './session.js'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatDay(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

// What a semester is right now, from its dates and from what the owner said about it.
export function semesterStanding(semester, today = todayKey()) {
  if (semester.status === 'archived') return { id: 'archived', label: 'Archived' }
  if (semester.status === 'completed') return { id: 'past', label: 'Past' }
  if (semester.start_date && semester.start_date > today) return { id: 'upcoming', label: 'Upcoming' }
  if (semester.end_date && semester.end_date < today) return { id: 'ended', label: 'Ended' }
  return { id: 'current', label: 'Current' }
}

const EMPTY_FORM = { title: '', start_date: '', end_date: '', note: '', status: 'active' }

function SemesterForm({ initial = EMPTY_FORM, submitLabel, onSubmit, onCancel, showStatus = false }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit({ ...form, title: form.title.trim(), start_date: form.start_date || null, end_date: form.end_date || null })
    } catch (cause) {
      setError(cause.message)
      setBusy(false)
    }
  }
  return (
    <form className="hub-form" onSubmit={submit}>
      <label className="hub-field hub-field-wide">
        <span>Name</span>
        <input value={form.title} onChange={set('title')} placeholder="Autumn 2026" maxLength={300} required autoFocus />
      </label>
      <label className="hub-field">
        <span>Starts</span>
        <input type="date" value={form.start_date ?? ''} onChange={set('start_date')} />
      </label>
      <label className="hub-field">
        <span>Ends</span>
        <input type="date" value={form.end_date ?? ''} min={form.start_date || undefined} onChange={set('end_date')} />
      </label>
      {showStatus && (
        <label className="hub-field">
          <span>This semester is</span>
          <select value={form.status} onChange={set('status')}>
            <option value="planned">planned</option>
            <option value="active">running</option>
            <option value="completed">finished (past)</option>
            <option value="archived">archived</option>
          </select>
        </label>
      )}
      <label className="hub-field hub-field-wide">
        <span>Note (optional)</span>
        <input value={form.note ?? ''} onChange={set('note')} placeholder="University, programme, anything that helps you recognise it" maxLength={4000} />
      </label>
      {error && <p className="hub-error" role="alert">{error}</p>}
      <div className="hub-form-actions">
        <button type="submit" className="hub-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="hub-secondary" onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </form>
  )
}

function SemesterCard({ semester, onOpen, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const standing = semesterStanding(semester)
  const dates = [formatDay(semester.start_date), formatDay(semester.end_date)].filter(Boolean).join(' – ')

  async function remove() {
    const sure = window.confirm(`Remove "${semester.title}" with its ${semester.modules} modules and ${semester.cards} cards?\n\nIt is taken out of the Study hub. A copy stays in the Life OS database.`)
    if (!sure) return
    setError('')
    try {
      await hubRequest(`/api/hub/semesters/${semester.id}`, { method: 'DELETE', semester: false })
      onChanged()
    } catch (cause) {
      setError(cause.message)
    }
  }

  if (editing) {
    return (
      <article className="hub-semester is-editing">
        <SemesterForm
          initial={semester}
          showStatus
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await hubRequest(`/api/hub/semesters/${semester.id}`, { method: 'PATCH', semester: false, body: { ...values, revision: semester.revision } })
            setEditing(false)
            onChanged()
          }}
        />
      </article>
    )
  }

  return (
    <article className={`hub-semester standing-${standing.id}`}>
      <div className="hub-semester-main">
        <span className={`hub-badge standing-${standing.id}`}>{standing.label}</span>
        <h2>{semester.title}</h2>
        <p className="hub-semester-dates">{dates || 'No dates yet'}</p>
        {semester.note && <p className="hub-semester-note">{semester.note}</p>}
        <p className="hub-semester-counts">
          {semester.modules} {semester.modules === 1 ? 'module' : 'modules'} · {semester.cards} {semester.cards === 1 ? 'card' : 'cards'}
          {semester.cards > 0 ? ` · ${semester.done} done` : ''}
        </p>
        {error && <p className="hub-error" role="alert">{error}</p>}
      </div>
      <div className="hub-semester-actions">
        <button type="button" className="hub-primary" onClick={() => onOpen(semester.id)}>Open</button>
        <button type="button" className="hub-secondary" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="hub-secondary hub-danger" onClick={remove}>Remove</button>
      </div>
    </article>
  )
}

// The way into the Study hub: choose the semester to work in, or add one.
export function HubGate() {
  const [stage, setStage] = useState('loading')
  const [semesters, setSemesters] = useState([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [openLast, setOpenLast] = useState(() => opensLastSemester())
  const [Opened, setOpened] = useState(null)

  const open = useCallback(async (id) => {
    setStage('opening')
    setError('')
    try {
      const workspace = await hubRequest(`/api/hub/workspace?semester=${encodeURIComponent(id)}`, { semester: false })
      openSession(workspace)
      const focusRoom = isFocusRoomRoute()
      const loaded = focusRoom ? await import('../components/FocusRoomTab.jsx') : await import('../App.jsx')
      setOpened(() => (focusRoom ? loaded.FocusRoomTab : loaded.default))
      setStage('open')
    } catch (cause) {
      setError(cause.message)
      setStage('choose')
    }
  }, [])

  const load = useCallback(async () => {
    const result = await hubRequest('/api/hub/semesters', { semester: false })
    setSemesters(result.semesters)
    return result.semesters
  }, [])

  useEffect(() => {
    let cancelled = false
    load()
      .then((list) => {
        if (cancelled) return
        const has = (id) => id && list.some((semester) => semester.id === id)
        // A tab the app opened itself (the Focus Room) follows the semester it came from.
        if (isFocusRoomRoute() && has(tabSemesterId())) return open(tabSemesterId())
        // A link from Life OS (a card of the day, a block on the calendar) names its semester.
        const named = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('semester')
        if (has(named)) return open(named)
        if (staysInSemester() && has(tabSemesterId())) return open(tabSemesterId())
        if (opensLastSemester() && has(lastSemesterId())) return open(lastSemesterId())
        setStage('choose')
        return undefined
      })
      .catch((cause) => {
        if (cancelled) return
        setError(cause.message)
        setStage('choose')
      })
    return () => {
      cancelled = true
    }
  }, [load, open])

  if (stage === 'open' && Opened) return <Opened />

  if (stage === 'loading' || stage === 'opening') {
    return (
      <main className="hub-gate">
        <p className="hub-wait" role="status">{stage === 'opening' ? 'Opening the semester…' : 'Loading your semesters…'}</p>
      </main>
    )
  }

  const order = { current: 0, upcoming: 1, ended: 2, past: 3, archived: 4 }
  const sorted = [...semesters].sort((a, b) =>
    order[semesterStanding(a).id] - order[semesterStanding(b).id] || String(b.start_date ?? '').localeCompare(String(a.start_date ?? '')))

  return (
    <main className="hub-gate">
      <div className="hub-gate-inner">
        <header className="hub-gate-head">
          <p className="hub-eyebrow">Study hub</p>
          <h1>Which semester?</h1>
          <p className="hub-lede">
            Each semester has its own modules, cards, timetable and notes. Open one to work in it, or add a new one.
          </p>
        </header>

        {error && <p className="hub-error" role="alert">{error}</p>}

        <section className="hub-semesters" aria-label="Your semesters">
          {sorted.map((semester) => (
            <SemesterCard key={semester.id} semester={semester} onOpen={open} onChanged={() => load().catch((cause) => setError(cause.message))} />
          ))}
          {sorted.length === 0 && !error && (
            <p className="hub-empty">No semesters yet. Add your first one to start: it begins empty, and you fill it with your own modules.</p>
          )}
        </section>

        {adding ? (
          <section className="hub-add" aria-label="Add a semester">
            <h2>Add a semester</h2>
            <SemesterForm
              submitLabel="Add semester"
              onCancel={() => setAdding(false)}
              onSubmit={async (values) => {
                await hubRequest('/api/hub/semesters', { method: 'POST', semester: false, body: values })
                setAdding(false)
                await load()
              }}
            />
          </section>
        ) : (
          <button type="button" className="hub-secondary hub-add-button" onClick={() => setAdding(true)}>+ Add a semester</button>
        )}

        <label className="hub-open-last">
          <input
            type="checkbox"
            checked={openLast}
            onChange={(event) => {
              setOpenLast(event.target.checked)
              setOpensLastSemester(event.target.checked)
            }}
          />
          Next time, open the semester I used last straight away
        </label>
      </div>
    </main>
  )
}
