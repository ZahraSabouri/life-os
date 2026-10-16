// Health → Appointments & tests: appointments (on the calendar and in the bell), results and
// letters, measurements over time, and where to go for urgent help.
import { useState } from 'react'
import { addDays, formatCalendarDay } from '../../lib/calendar.js'
import { clockOf } from '../../lib/day.js'
import { startOf } from '../../lib/useHealth.js'
import { CARE_KINDS, MEASURES, RECORD_KINDS, URGENT_HELP } from '../../../../shared/health/guidance.js'
import { dayOf } from '../../../../shared/health/week.js'

const kindLabel = (key) => CARE_KINDS.find((k) => k.key === key)?.label ?? 'Appointment'
const clockIn = (entry) => (String(entry?.start_at ?? '').length > 10 ? clockOf(entry.start_at) : '')
const over = (entry) => ['done', 'cancelled'].includes(String(entry.status))

function AppointmentForm({ page, entry, onDone }) {
  const d = entry?.details ?? {}
  const [form, setForm] = useState({ kind: d.kind ?? 'doctor', title: entry?.title ?? '', day: entry ? dayOf(entry) : addDays(page.today, 1), time: clockIn(entry), provider: d.provider ?? '', place: d.place ?? '', note: d.note ?? '' })
  const [state, setState] = useState({ saving: false, error: '' })
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))
  async function save(event) {
    event.preventDefault()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.day)) { setState({ saving: false, error: 'Choose the day' }); return }
    setState({ saving: true, error: '' })
    const body = { title: form.title.trim() || kindLabel(form.kind), start_at: startOf(form.day, form.time), all_day: !form.time, details: { ...d, kind: form.kind, provider: form.provider.trim(), place: form.place.trim(), note: form.note.trim(), area: 'body' } }
    try { const saved = entry ? await page.change(entry.id, body) : await page.create({ type: 'appointment', status: 'planned', ...body }); setState({ saving: false, error: '' }); onDone(saved) }
    catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="entry-editor health-form" onSubmit={save} aria-label={entry ? 'Change the appointment' : 'Add an appointment'}>
    <label><span>What</span><select value={form.kind} onChange={set('kind')}>{CARE_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
    <label><span>Name it (optional)</span><input value={form.title} onChange={set('title')} placeholder={kindLabel(form.kind)} maxLength={200} /></label>
    <label><span>Day</span><input type="date" value={form.day} onChange={set('day')} /></label>
    <label><span>Time</span><input type="time" value={form.time} onChange={set('time')} /></label>
    <label><span>With (optional)</span><input value={form.provider} onChange={set('provider')} placeholder="Dr Jones, the practice nurse" maxLength={200} /></label>
    <label><span>Where (optional)</span><input value={form.place} onChange={set('place')} placeholder="The surgery, the hospital, video call" maxLength={300} /></label>
    <label className="entry-editor-wide"><span>Note (optional)</span><input value={form.note} onChange={set('note')} placeholder="Bring the letter; fast from 10 pm the night before" maxLength={2000} /></label>
    {state.error ? <p className="entry-editor-wide entry-editor-error" role="alert">{state.error}</p> : null}
    <p className="entry-editor-wide entry-editor-actions"><button type="submit" className="entry-editor-save" disabled={state.saving}>{state.saving ? 'Saving…' : entry ? 'Save the changes' : 'Put it on the calendar'}</button><button type="button" onClick={() => onDone(null)}>Cancel</button></p>
  </form>
}

function AppointmentCard({ page, entry, onEdit, onClose }) {
  const d = entry.details ?? {}
  const [sure, setSure] = useState(false)
  const act = (status) => page.change(entry.id, { status }).catch(() => {})
  return <section className="day-panel health-session" aria-labelledby="health-appointment">
    <header><h2 id="health-appointment">{entry.title}</h2><button type="button" className="ghost-pill compact-pill" onClick={onClose}>Close</button></header>
    <p className="health-small">{[kindLabel(d.kind), formatCalendarDay(dayOf(entry), { weekday: 'long', month: 'long' }), clockIn(entry), entry.status === 'done' ? 'it happened' : entry.status === 'cancelled' ? 'cancelled' : ''].filter(Boolean).join(' · ')}</p>
    {d.provider || d.place ? <p>{[d.provider ? `With ${d.provider}` : '', d.place ? `at ${d.place}` : ''].filter(Boolean).join(' ')}</p> : null}
    {d.note ? <p>{d.note}</p> : null}
    <p className="entry-editor-actions">
      {over(entry) ? <button type="button" onClick={() => act('planned')}>Put it back as coming up</button> : <><button type="button" className="entry-editor-save" onClick={() => act('done')}>It happened</button><button type="button" onClick={() => act('cancelled')}>Cancelled</button></>}
      <button type="button" onClick={onEdit}>Change</button>
      {sure ? <button type="button" className="is-sure" onClick={() => page.remove(entry.id).then(onClose).catch(() => {})}>Remove for good</button> : <button type="button" onClick={() => setSure(true)}>Remove</button>}
    </p>
  </section>
}

function RecordForm({ page, onDone }) {
  const [form, setForm] = useState({ kind: 'result', title: '', day: page.today, provider: '', note: '' })
  const [state, setState] = useState({ saving: false, error: '' })
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))
  async function save(event) {
    event.preventDefault()
    if (!form.title.trim()) { setState({ saving: false, error: 'Say what it is: “Blood test: vitamin D”' }); return }
    setState({ saving: true, error: '' })
    try { await page.create({ type: 'medical-record', title: form.title.trim(), start_at: form.day, all_day: true, status: 'done', details: { kind: form.kind, provider: form.provider.trim(), note: form.note.trim(), area: 'body' } }); onDone() }
    catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="entry-editor health-form" onSubmit={save} aria-label="Add a result or letter">
    <label><span>What</span><select value={form.kind} onChange={set('kind')}>{RECORD_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
    <label><span>Title</span><input value={form.title} onChange={set('title')} placeholder="Blood test: vitamin D" maxLength={200} /></label>
    <label><span>Date</span><input type="date" value={form.day} onChange={set('day')} /></label>
    <label><span>From (optional)</span><input value={form.provider} onChange={set('provider')} placeholder="GP surgery, hospital" maxLength={200} /></label>
    <label className="entry-editor-wide"><span>What it says</span><textarea rows={3} value={form.note} onChange={set('note')} placeholder="Vitamin D 45 nmol/L, a little low; take a supplement over winter" maxLength={8000} /></label>
    {state.error ? <p className="entry-editor-wide entry-editor-error" role="alert">{state.error}</p> : null}
    <p className="entry-editor-wide entry-editor-actions"><button type="submit" className="entry-editor-save" disabled={state.saving}>{state.saving ? 'Saving…' : 'Keep it'}</button><button type="button" onClick={onDone}>Cancel</button></p>
  </form>
}

function Measurements({ page }) {
  const [form, setForm] = useState({ metric: 'weight', value: '', day: page.today })
  const [state, setState] = useState({ saving: false, error: '' })
  const measure = MEASURES.find((m) => m.key === form.metric)
  const rows = page.entries.filter((e) => e.type === 'measurement' && MEASURES.some((m) => m.key === e.details?.metric))
  async function save(event) {
    event.preventDefault()
    const value = Number(form.value)
    if (!Number.isFinite(value) || value <= 0) { setState({ saving: false, error: 'Type the number' }); return }
    setState({ saving: true, error: '' })
    try { await page.create({ type: 'measurement', title: measure.label, start_at: form.day, all_day: true, status: 'done', details: { metric: form.metric, value, unit: measure.unit, area: 'body' } }); setForm((f) => ({ ...f, value: '' })); setState({ saving: false, error: '' }) }
    catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <section className="day-panel" aria-labelledby="health-measures">
    <header><h2 id="health-measures">Measurements</h2></header>
    <form className="health-measure-form" onSubmit={save} aria-label="Add a measurement">
      <select value={form.metric} onChange={(event) => setForm((f) => ({ ...f, metric: event.target.value }))} aria-label="What">{MEASURES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
      <input type="number" min="0" step="any" value={form.value} onChange={(event) => setForm((f) => ({ ...f, value: event.target.value }))} placeholder={measure.unit} aria-label={`${measure.label} in ${measure.unit}`} />
      <input type="date" value={form.day} onChange={(event) => setForm((f) => ({ ...f, day: event.target.value }))} aria-label="Day" />
      <button type="submit" className="entry-editor-save" disabled={state.saving}>Add</button>
    </form>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    {MEASURES.map((m) => { const mine = rows.filter((e) => e.details.metric === m.key).sort((a, b) => dayOf(b).localeCompare(dayOf(a)))
      return mine.length ? <div className="health-measure" key={m.key}><b>{m.label}</b>
        <span>{mine.slice(0, 6).map((e, i) => <span key={e.id} className={i ? 'is-before' : ''}>{e.details.value} {m.unit} <small>{formatCalendarDay(dayOf(e))}</small><button type="button" className="health-x" aria-label={`Remove ${m.label} of ${formatCalendarDay(dayOf(e))}`} onClick={() => page.remove(e.id).catch(() => {})}>×</button></span>)}</span>
      </div> : null })}
    {!rows.length ? <p className="day-quiet">Weight, sleep, resting heart rate and the rest, a number at a time. Only you see them.</p> : null}
  </section>
}

export default function HealthCare({ page }) {
  const { params, setParams, today } = page
  const entryId = params.get('entry')
  const entry = page.entries.find((e) => e.id === entryId && e.type === 'appointment')
  const editing = params.get('edit')
  const adding = params.get('add')
  const [recordOpen, setRecordOpen] = useState(false)
  const appointments = page.entries.filter((e) => e.type === 'appointment')
  const coming = appointments.filter((e) => !over(e) && dayOf(e) >= today).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
  const past = appointments.filter((e) => over(e) || dayOf(e) < today).sort((a, b) => String(b.start_at).localeCompare(String(a.start_at))).slice(0, 8)
  const records = page.entries.filter((e) => e.type === 'medical-record').sort((a, b) => dayOf(b).localeCompare(dayOf(a)))
  const line = (e) => <li key={e.id} className={over(e) ? 'is-done' : undefined}><button type="button" className="health-link" onClick={() => setParams({ view: 'care', entry: e.id })}>{e.title}</button>
    <small>{[formatCalendarDay(dayOf(e), { weekday: 'long' }), clockIn(e), e.details?.place, e.status === 'cancelled' ? 'cancelled' : e.status === 'done' ? 'happened' : dayOf(e) < today ? 'not marked' : ''].filter(Boolean).join(' · ')}</small></li>
  return <>
    <div className="health-actions entry-editor-actions"><button type="button" className="entry-editor-save" onClick={() => setParams({ view: 'care', add: '1' })}>Add an appointment</button><button type="button" onClick={() => setRecordOpen(true)}>Add a result or letter</button></div>
    {adding ? <AppointmentForm page={page} onDone={(saved) => setParams(saved ? { view: 'care', entry: saved.id } : { view: 'care' })} /> : null}
    {entry && editing ? <AppointmentForm key={entry.id} page={page} entry={entry} onDone={() => setParams({ view: 'care', entry: entry.id })} /> : null}
    {entry && !editing ? <AppointmentCard page={page} entry={entry} onEdit={() => setParams({ view: 'care', entry: entry.id, edit: '1' })} onClose={() => setParams({ view: 'care' })} /> : null}
    {recordOpen ? <RecordForm page={page} onDone={() => setRecordOpen(false)} /> : null}
    <div className="health-grid">
      <section className="day-panel" aria-labelledby="health-appointments">
        <header><h2 id="health-appointments">Appointments</h2></header>
        {coming.length ? <ul className="day-list">{coming.map(line)}</ul> : <p className="day-quiet">Nothing booked. Appointments go on the calendar, and the bell tells you the day before and on the day.</p>}
        {past.length ? <><h3>Earlier</h3><ul className="day-list">{past.map(line)}</ul></> : null}
      </section>
      <section className="day-panel" aria-labelledby="health-records">
        <header><h2 id="health-records">Results and letters</h2></header>
        {records.length ? <ul className="day-list">{records.map((e) => <li key={e.id}><span>{e.title}</span><small>{[RECORD_KINDS.find((k) => k.key === e.details?.kind)?.label, formatCalendarDay(dayOf(e)), e.details?.provider].filter(Boolean).join(' · ')}</small>{e.details?.note ? <p className="health-small">{e.details.note}</p> : null}</li>)}</ul>
          : <p className="day-quiet">Test results, prescriptions and letters you want to keep, with what they said.</p>}
      </section>
      <Measurements page={page} />
      <section className="day-panel" aria-labelledby="health-urgent">
        <header><h2 id="health-urgent">When you need help</h2></header>
        <dl className="health-intakes health-help">{URGENT_HELP.map((h) => <div key={h.label}><dt>{h.label}</dt><dd>{h.say}</dd></div>)}</dl>
      </section>
    </div>
  </>
}
