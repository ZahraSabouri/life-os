import { useEffect, useMemo, useState } from 'react'
import { hubRequest, reloadInSemester, session } from './session.js'
import { SemesterRecords } from './SemesterRecords.jsx'

const asLines = (value) => (Array.isArray(value) ? value.join('\n') : '')

function ModuleForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    label: initial.label ?? '',
    code: initial.code ?? '',
    subtitle: initial.subtitle ?? '',
    examShape: initial.examShape ?? '',
    objectives: asLines(initial.objectives),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const title = form.title.trim()
      await onSubmit({ ...form, title, label: form.label.trim() || title })
    } catch (cause) {
      setError(cause.message)
      setBusy(false)
    }
  }

  return (
    <form className="hub-form" onSubmit={submit}>
      <label className="hub-field hub-field-wide">
        <span>Module name</span>
        <input value={form.title} onChange={set('title')} placeholder="Statistics for Data Science" maxLength={300} required autoFocus />
      </label>
      <label className="hub-field">
        <span>Short name for the menu (optional)</span>
        <input value={form.label} onChange={set('label')} placeholder="Statistics" maxLength={120} />
      </label>
      <label className="hub-field">
        <span>Module code (optional)</span>
        <input value={form.code} onChange={set('code')} placeholder="ABC123" maxLength={60} />
      </label>
      <label className="hub-field hub-field-wide">
        <span>One line about it (optional)</span>
        <input value={form.subtitle} onChange={set('subtitle')} maxLength={600} />
      </label>
      <label className="hub-field hub-field-wide">
        <span>How it is assessed (optional)</span>
        <input value={form.examShape} onChange={set('examShape')} placeholder="Two-hour exam, 60%; coursework, 40%" maxLength={1200} />
      </label>
      <label className="hub-field hub-field-wide">
        <span>What you want from it, one per line (optional)</span>
        <textarea value={form.objectives} onChange={set('objectives')} />
      </label>
      {error && <p className="hub-error" role="alert">{error}</p>}
      <div className="hub-form-actions">
        <button type="submit" className="hub-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="hub-secondary" onClick={onCancel} disabled={busy}>Cancel</button>}
      </div>
    </form>
  )
}

function DuplicateForm({ module, semesters, onDone, onCancel }) {
  const [target, setTarget] = useState(session.semesterId)
  const [title, setTitle] = useState(module.title)
  const [startDate, setStartDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sameSemester = target === session.semesterId

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await hubRequest(`/api/hub/modules/${module.rowId}/duplicate`, {
        method: 'POST',
        semester: false,
        body: { semester_id: target, title: title.trim(), ...(startDate ? { start_date: startDate } : {}) },
      })
      onDone(result, target)
    } catch (cause) {
      setError(cause.message)
      setBusy(false)
    }
  }

  return (
    <form className="hub-form" onSubmit={submit}>
      <p className="hub-hint">
        Copies the module with its cards, checklists, classes, assessments and materials. The copy starts untouched:
        nothing is marked done, and logged hours and evidence stay with the original.
      </p>
      <label className="hub-field">
        <span>Into semester</span>
        <select value={target} onChange={(event) => setTarget(event.target.value)}>
          {semesters.map((semester) => (
            <option key={semester.id} value={semester.id}>{semester.title}{semester.id === session.semesterId ? ' (this one)' : ''}</option>
          ))}
        </select>
      </label>
      <label className="hub-field">
        <span>Name of the copy</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={300} required />
      </label>
      <label className="hub-field">
        <span>New first day (optional)</span>
        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
      </label>
      <p className="hub-hint">
        With a new first day, every date in the copy moves by the same number of days, so the plan keeps its shape.
        {sameSemester ? ' In the same semester the copy needs a different name.' : ''}
      </p>
      {error && <p className="hub-error" role="alert">{error}</p>}
      <div className="hub-form-actions">
        <button type="submit" className="hub-primary" disabled={busy}>{busy ? 'Copying…' : 'Duplicate module'}</button>
        <button type="button" className="hub-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  )
}

// The semester's own modules. Cards, notes and files are added inside each module's page;
// this is where the modules themselves are added, changed, copied and removed.
export function SemesterSetup({ cards = [] }) {
  const [mode, setMode] = useState(null) // { kind: 'add' | 'edit' | 'duplicate', id }
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [semesters, setSemesters] = useState([])
  const modules = session.modules

  useEffect(() => {
    let cancelled = false
    hubRequest('/api/hub/semesters', { semester: false })
      .then((result) => { if (!cancelled) setSemesters(result.semesters) })
      .catch(() => { /* duplicating into another semester is simply not offered */ })
    return () => { cancelled = true }
  }, [])

  const cardCounts = useMemo(() => {
    const counts = new Map()
    for (const card of cards) counts.set(card.moduleGroup, (counts.get(card.moduleGroup) ?? 0) + 1)
    return counts
  }, [cards])

  async function remove(module) {
    const count = cardCounts.get(module.moduleGroup) ?? 0
    if (count > 0) {
      setError(`"${module.title}" still has ${count} ${count === 1 ? 'card' : 'cards'}. Remove them, or move them to another module, and then remove the module.`)
      return
    }
    if (!window.confirm(`Remove "${module.title}" with its classes, assessments and materials?\n\nIt is taken out of the Study hub. A copy stays in the Life OS database.`)) return
    setError('')
    try {
      await hubRequest(`/api/hub/modules/${module.rowId}`, { method: 'DELETE', semester: false })
      reloadInSemester()
    } catch (cause) {
      setError(cause.message)
    }
  }

  return (
    <div className="view-grid hub-setup">
      <section className="panel">
        <p className="eyebrow">{session.semester?.title}</p>
        <h2>Modules</h2>
        <p className="muted">
          Each module gets its own page in the menu, with its cards, notes, materials and progress.
          New modules start empty: you add the cards yourself.
        </p>

        {error && <p className="hub-error" role="alert">{error}</p>}
        {notice && <p className="hub-notice" role="status">{notice}</p>}

        <ul className="hub-list">
          {modules.map((module) => {
            const count = cardCounts.get(module.moduleGroup) ?? 0
            const open = mode?.id === module.rowId ? mode.kind : ''
            return (
              <li key={module.rowId} className="hub-list-item">
                <div className="hub-list-row">
                  <div>
                    <strong>{module.title}</strong>
                    <small>
                      {[module.code, `${count} ${count === 1 ? 'card' : 'cards'}`, module.subtitle].filter(Boolean).join(' · ')}
                    </small>
                  </div>
                  <div className="hub-list-actions">
                    <a className="hub-secondary" href={`#/${module.viewId}`}>Open</a>
                    <button type="button" className="hub-secondary" onClick={() => setMode({ kind: 'edit', id: module.rowId })}>Edit</button>
                    <button type="button" className="hub-secondary" onClick={() => setMode({ kind: 'duplicate', id: module.rowId })}>Duplicate</button>
                    <button type="button" className="hub-secondary hub-danger" onClick={() => remove(module)}>Remove</button>
                  </div>
                </div>
                {open === 'edit' && (
                  <ModuleForm
                    initial={module}
                    submitLabel="Save changes"
                    onCancel={() => setMode(null)}
                    onSubmit={async (values) => {
                      await hubRequest(`/api/hub/modules/${module.rowId}`, { method: 'PATCH', semester: false, body: { ...values, revision: module.rowRevision } })
                      reloadInSemester()
                    }}
                  />
                )}
                {open === 'duplicate' && (
                  <DuplicateForm
                    module={module}
                    semesters={semesters.length > 0 ? semesters : [session.semester]}
                    onCancel={() => setMode(null)}
                    onDone={(result, target) => {
                      if (target === session.semesterId) { reloadInSemester(); return }
                      const into = semesters.find((semester) => semester.id === target)?.title ?? 'the other semester'
                      setMode(null)
                      setNotice(`Copied "${module.title}" into ${into} with ${result.copied?.cards ?? 0} cards. Use "Change semester" to open it.`)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
        {modules.length === 0 && mode?.kind !== 'add' && (
          <p className="hub-empty">This semester has no modules yet. Add the first one below.</p>
        )}

        {mode?.kind === 'add' ? (
          <div className="hub-add">
            <h3>Add a module</h3>
            <ModuleForm
              submitLabel="Add module"
              onCancel={() => setMode(null)}
              onSubmit={async (values) => {
                await hubRequest('/api/hub/modules', { method: 'POST', body: values })
                reloadInSemester()
              }}
            />
          </div>
        ) : (
          <button type="button" className="hub-primary hub-add-button" onClick={() => { setError(''); setNotice(''); setMode({ kind: 'add' }) }}>+ Add a module</button>
        )}
      </section>
      {/* What an import brings in can also be added, changed and removed by hand. */}
      <SemesterRecords />
    </div>
  )
}
