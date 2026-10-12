// Classes, tests and deadlines, and materials of the open semester: what an import brings in,
// she can also add, change and remove by hand. Each is an ordinary Study record, saved through
// the same addresses an import uses (/api/hub/sessions, /assessments, /materials).
import { useMemo, useState } from 'react'
import { hubRequest, reloadInSemester, session } from './session.js'

const ZONE = 'Europe/London'
const dayText = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, weekday: 'short', day: 'numeric', month: 'short' })
const clockText = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const todayKey = () => dayKey.format(new Date())
const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
const showDay = (date) => (date ? dayText.format(new Date(`${date}T12:00:00Z`)) : 'No date')

// A London clock time on a day, as the moment it is. London is UTC or UTC+1; a time the clocks skip gives nothing.
export function londonMoment(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return ''
  const wall = Date.parse(`${date}T${time}:00Z`)
  for (const offset of [3_600_000, 0]) {
    const moment = new Date(wall - offset)
    if (dayKey.format(moment) === date && clockText.format(moment) === time) return moment.toISOString()
  }
  return ''
}

const moduleName = (id) => session.modules.find((module) => module.rowId === id)?.label ?? session.modules.find((module) => module.rowId === id)?.title ?? 'No module'

function ModuleSelect({ value, onChange }) {
  return (
    <label className="hub-field">
      <span>Module</span>
      <select value={value} onChange={onChange}>
        <option value="">No module</option>
        {session.modules.map((module) => <option key={module.rowId} value={module.rowId}>{module.title}</option>)}
      </select>
    </label>
  )
}

function useForm(initial) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  // Runs the save; on success the app starts again in this semester so every page shows the change.
  const run = (work) => async (event) => {
    event.preventDefault()
    setBusy(true); setError('')
    try { await work(); reloadInSemester() } catch (cause) { setError(cause.message); setBusy(false) }
  }
  return { form, set, busy, error, run }
}

function Actions({ busy, error, submitLabel, onCancel }) {
  return <>
    {error && <p className="hub-error" role="alert">{error}</p>}
    <div className="hub-form-actions">
      <button type="submit" className="hub-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      <button type="button" className="hub-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
    </div>
  </>
}

// ---- A class (one dated meeting; "every week until" makes one for each week) ----------------
function ClassForm({ record, onCancel }) {
  const start = record?.start_at ? new Date(record.start_at) : null
  const { form, set, busy, error, run } = useForm({
    title: record?.title ?? '', module: record?.module_id ?? '', date: start ? dayKey.format(start) : todayKey(),
    from: start ? clockText.format(start) : '', to: record?.end_at ? clockText.format(new Date(record.end_at)) : '',
    place: record?.data?.location ?? '', until: '',
  })
  const save = run(async () => {
    const title = form.title.trim()
    if (!title) throw new Error('Give the class a name.')
    const first = londonMoment(form.date, form.from)
    if (!first) throw new Error('Choose the day and the time it starts.')
    if (form.to && form.to <= form.from) throw new Error('It has to end after it starts.')
    const body = (date) => ({
      title, status: record?.status ?? 'planned', module_id: form.module || null,
      start_at: londonMoment(date, form.from), end_at: form.to ? londonMoment(date, form.to) : null,
      data: { ...(record?.data ?? {}), location: form.place.trim(), ...(record ? {} : { addedByHand: true }) },
    })
    if (record) { await hubRequest(`/api/hub/sessions/${record.id}`, { method: 'PATCH', body: { ...body(form.date), revision: record.revision } }); return }
    const last = form.until && form.until > form.date ? form.until : form.date
    if (Date.parse(last) - Date.parse(form.date) > 400 * 86_400_000) throw new Error('"Every week until" can reach at most a year ahead.')
    for (let date = form.date; date <= last; date = addDays(date, 7)) {
      if (!londonMoment(date, form.from)) continue   // the clocks skip this time on that day
      await hubRequest('/api/hub/sessions', { method: 'POST', body: body(date) })
    }
  })
  return (
    <form className="hub-form" onSubmit={save}>
      <label className="hub-field hub-field-wide"><span>What it is</span><input value={form.title} onChange={set('title')} placeholder="MAT022 · Lecture" maxLength={300} required autoFocus /></label>
      <ModuleSelect value={form.module} onChange={set('module')} />
      <label className="hub-field"><span>Day</span><input type="date" value={form.date} onChange={set('date')} required /></label>
      <label className="hub-field"><span>Starts</span><input type="time" value={form.from} onChange={set('from')} required /></label>
      <label className="hub-field"><span>Ends (optional)</span><input type="time" value={form.to} onChange={set('to')} /></label>
      <label className="hub-field"><span>Where (optional)</span><input value={form.place} onChange={set('place')} placeholder="Abacws 2.26" maxLength={300} /></label>
      {record ? null : <label className="hub-field"><span>Every week until (optional)</span><input type="date" value={form.until} min={form.date} onChange={set('until')} /></label>}
      <Actions busy={busy} error={error} submitLabel={record ? 'Save changes' : 'Add class'} onCancel={onCancel} />
    </form>
  )
}

// ---- A test, an exam, a deadline ----------------------------------------------------------
const KINDS = [['test', 'Test'], ['exam', 'Exam'], ['coursework', 'Coursework'], ['project', 'Project'], ['portfolio', 'Portfolio'], ['presentation', 'Presentation'], ['other', 'Something else']]
function AssessmentForm({ record, onCancel }) {
  const { form, set, busy, error, run } = useForm({
    title: record?.title ?? '', module: record?.module_id ?? '', date: record?.start_date ?? record?.end_date ?? (record?.start_at ? dayKey.format(new Date(record.start_at)) : ''),
    kind: record?.data?.kind ?? 'test', weight: record?.data?.weight ?? '', conditions: record?.data?.conditions ?? '', link: record?.data?.url ?? '', notes: record?.data?.description ?? '',
  })
  const save = run(async () => {
    const title = form.title.trim()
    if (!title) throw new Error('Give it a name.')
    const weight = form.weight === '' ? null : Number(form.weight)
    if (weight !== null && !(weight >= 0 && weight <= 100)) throw new Error('"Counts for" is a percentage between 0 and 100.')
    const data = { ...(record?.data ?? {}), kind: form.kind, conditions: form.conditions.trim(), description: form.notes.trim(), ...(record ? {} : { addedByHand: true }) }
    if (weight === null) delete data.weight; else data.weight = weight
    if (form.link.trim()) data.url = form.link.trim(); else delete data.url
    const body = { title, status: record?.status ?? 'planned', module_id: form.module || null, start_date: form.date || null, end_date: form.date || null, start_at: null, end_at: null, data }
    if (record) await hubRequest(`/api/hub/assessments/${record.id}`, { method: 'PATCH', body: { ...body, revision: record.revision } })
    else await hubRequest('/api/hub/assessments', { method: 'POST', body })
  })
  return (
    <form className="hub-form" onSubmit={save}>
      <label className="hub-field hub-field-wide"><span>What it is</span><input value={form.title} onChange={set('title')} placeholder="MAT022 · In-class test 2" maxLength={300} required autoFocus /></label>
      <ModuleSelect value={form.module} onChange={set('module')} />
      <label className="hub-field"><span>Kind</span><select value={form.kind} onChange={set('kind')}>{KINDS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="hub-field"><span>Date (leave empty if not published)</span><input type="date" value={form.date} onChange={set('date')} /></label>
      <label className="hub-field"><span>Counts for, % (optional)</span><input type="number" min="0" max="100" step="1" value={form.weight} onChange={set('weight')} /></label>
      <label className="hub-field"><span>Conditions (optional)</span><input value={form.conditions} onChange={set('conditions')} placeholder="Closed book, 50 minutes" maxLength={600} /></label>
      <label className="hub-field hub-field-wide"><span>Link (optional)</span><input type="url" value={form.link} onChange={set('link')} placeholder="https://…" maxLength={2000} /></label>
      <label className="hub-field hub-field-wide"><span>Notes (optional)</span><textarea value={form.notes} onChange={set('notes')} /></label>
      <Actions busy={busy} error={error} submitLabel={record ? 'Save changes' : 'Add it'} onCancel={onCancel} />
    </form>
  )
}

// ---- A material: a link to a page, a file, a video ------------------------------------------
function MaterialForm({ record, onCancel }) {
  const { form, set, busy, error, run } = useForm({ title: record?.title ?? '', module: record?.module_id ?? '', link: record?.data?.url ?? '', group: record?.data?.group ?? '', notes: record?.data?.description ?? '' })
  const save = run(async () => {
    const title = form.title.trim()
    const link = form.link.trim()
    if (!title) throw new Error('Give it a name.')
    if (!/^(https?:\/\/|\/)/.test(link)) throw new Error('Paste a link that starts with http:// or https://.')
    const data = { ...(record?.data ?? {}), url: link, group: form.group.trim() || 'Added by hand', description: form.notes.trim(), ...(record ? {} : { addedByHand: true, type: 'link', viewer: 'link' }) }
    const body = { title, status: record?.status ?? 'active', module_id: form.module || null, data }
    if (record) await hubRequest(`/api/hub/materials/${record.id}`, { method: 'PATCH', body: { ...body, revision: record.revision } })
    else await hubRequest('/api/hub/materials', { method: 'POST', body })
  })
  return (
    <form className="hub-form" onSubmit={save}>
      <label className="hub-field hub-field-wide"><span>Name</span><input value={form.title} onChange={set('title')} placeholder="Week 3 lecture recording" maxLength={300} required autoFocus /></label>
      <ModuleSelect value={form.module} onChange={set('module')} />
      <label className="hub-field"><span>Group (optional)</span><input value={form.group} onChange={set('group')} placeholder="Lectures/Week 3" maxLength={200} /></label>
      <label className="hub-field hub-field-wide"><span>Link</span><input type="url" value={form.link} onChange={set('link')} placeholder="https://…" maxLength={2000} required /></label>
      <label className="hub-field hub-field-wide"><span>Notes (optional)</span><textarea value={form.notes} onChange={set('notes')} /></label>
      <Actions busy={busy} error={error} submitLabel={record ? 'Save changes' : 'Add material'} onCancel={onCancel} />
    </form>
  )
}

const KIND = {
  sessions: { title: 'Classes', one: 'class', Form: ClassForm, add: '+ Add a class', empty: 'No classes yet. Add your timetable by hand here, or bring it in from the university calendar.' },
  assessments: { title: 'Tests and deadlines', one: 'test or deadline', Form: AssessmentForm, add: '+ Add a test or deadline', empty: 'No tests or deadlines yet.' },
  materials: { title: 'Materials', one: 'material', Form: MaterialForm, add: '+ Add a material link', empty: 'No materials yet.' },
}

function describe(kind, record) {
  if (kind === 'sessions') {
    const start = record.start_at ? new Date(record.start_at) : null
    return { when: start ? `${dayText.format(start)}, ${clockText.format(start)}${record.end_at ? ` to ${clockText.format(new Date(record.end_at))}` : ''}` : showDay(record.start_date), extra: record.data?.location ?? '' }
  }
  if (kind === 'assessments') return { when: record.start_date || record.end_date ? showDay(record.start_date ?? record.end_date) : 'Date not set', extra: [KINDS.find(([id]) => id === record.data?.kind)?.[1], Number.isFinite(record.data?.weight) ? `${record.data.weight}%` : '', record.data?.conditions].filter(Boolean).join(' · ') }
  return { when: record.data?.group ?? '', extra: record.data?.addedByHand ? 'added by hand' : record.data?.type ?? '' }
}
const sortKey = (kind, record) => (kind === 'materials' ? `${record.data?.addedByHand ? '0' : '1'}${record.title}` : record.start_at ?? record.start_date ?? record.end_date ?? '9999')

function RecordList({ kind }) {
  const meta = KIND[kind]
  const all = session[kind]
  const [mode, setMode] = useState(null)   // 'add' or the id being changed
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState('')
  const [find, setFind] = useState('')
  const [error, setError] = useState('')
  const today = todayKey()
  const rows = useMemo(() => {
    const words = find.trim().toLowerCase()
    const kept = [...all].filter((record) => (!filter || record.module_id === filter) && (!words || `${record.title} ${record.data?.location ?? ''} ${record.data?.group ?? ''}`.toLowerCase().includes(words)))
      .sort((a, b) => sortKey(kind, a).localeCompare(sortKey(kind, b)))
    // Classes: what is still to come first; the past is under "show all".
    return kind === 'sessions' && !showAll ? kept.filter((record) => (record.start_at ? dayKey.format(new Date(record.start_at)) : record.start_date ?? '') >= today) : kept
  }, [all, kind, filter, find, showAll, today])
  // The first eight, and with them everything she added by hand, so what she has just added is in sight.
  const shown = showAll || find.trim() ? rows : rows.filter((record, index) => index < 8 || record.data?.addedByHand)

  async function remove(record) {
    if (!window.confirm(`Remove "${record.title}"?\n\nIt is taken out of the Study hub. A copy stays in the Life OS database.`)) return
    setError('')
    try { await hubRequest(`/api/hub/${kind}/${record.id}`, { method: 'DELETE', body: { revision: record.revision } }); reloadInSemester() } catch (cause) { setError(cause.message) }
  }
  return (
    <section className="panel hub-records" aria-label={meta.title}>
      <div className="hub-records-head">
        <h2>{meta.title} <small>{all.length}</small></h2>
        {all.length > 8 && <input type="search" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find…" aria-label={`Find among the ${meta.title.toLowerCase()}`} />}
        {session.modules.length > 1 && all.length > 0 && (
          <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label={`Show the ${meta.title.toLowerCase()} of one module`}>
            <option value="">All modules</option>
            {session.modules.map((module) => <option key={module.rowId} value={module.rowId}>{module.label ?? module.title}</option>)}
          </select>
        )}
      </div>
      {error && <p className="hub-error" role="alert">{error}</p>}
      {mode === 'add' ? <div className="hub-add"><h3>{meta.add.replace('+ ', '')}</h3><meta.Form onCancel={() => setMode(null)} /></div>
        : <button type="button" className="hub-primary hub-add-button" onClick={() => setMode('add')}>{meta.add}</button>}
      {all.length === 0 && <p className="hub-empty">{meta.empty}</p>}
      <ul className="hub-list">
        {shown.map((record) => {
          const text = describe(kind, record)
          return (
            <li key={record.id} className="hub-list-item">
              <div className="hub-list-row">
                <div>
                  <strong>{kind === 'materials' && record.data?.url ? <a href={record.data.url} target="_blank" rel="noreferrer">{record.title}</a> : record.title}</strong>
                  <small>{[text.when, moduleName(record.module_id), text.extra, kind !== 'materials' && record.data?.addedByHand ? 'added by hand' : ''].filter(Boolean).join(' · ')}</small>
                </div>
                <div className="hub-list-actions">
                  <button type="button" className="hub-secondary" onClick={() => setMode(record.id)}>Change</button>
                  <button type="button" className="hub-secondary hub-danger" onClick={() => remove(record)}>Remove</button>
                </div>
              </div>
              {mode === record.id && <meta.Form record={record} onCancel={() => setMode(null)} />}
            </li>
          )
        })}
      </ul>
      {(rows.length > shown.length || (kind === 'sessions' && !showAll && all.length > rows.length)) && (
        <button type="button" className="hub-secondary" onClick={() => setShowAll(true)}>Show all {all.length}{kind === 'sessions' ? ', past ones too' : ''}</button>
      )}
    </section>
  )
}

export function SemesterRecords() {
  return <>
    <RecordList kind="sessions" />
    <RecordList kind="assessments" />
    <RecordList kind="materials" />
  </>
}
