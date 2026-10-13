// Changing something of hers in place, wherever it is shown: its title, its text, when it is,
// whether it is done, and the fields of its kind. A repeating plan has its own form: the days
// it comes round on, its clock time, its first and last day.
import { useState } from 'react'
import { ENTRY_TYPES } from '@shared/entryTypes.js'
import { REPEAT } from '@shared/routines.js'
import { apiFetch } from '../lib/api.js'
import { entryForm, entryPatch, STATES, TICKED, WEEKDAYS } from '../lib/entryPatch.js'
import FieldsForm from './FieldsForm.jsx'

// Filled in by the focus timer when it files the time spent; not for her to type.
const WRITTEN_BY_THE_APP = ['focus', 'minutes', 'body']

export default function EntryEditor({ entry, onSaved, onCancel }) {
  const repeating = entry.type === REPEAT
  const [form, setForm] = useState(() => entryForm(entry))
  const [state, setState] = useState({ saving: false, error: '' })
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const kind = ENTRY_TYPES[entry.type]?.label ?? 'Entry'
  async function save(event) {
    event.preventDefault()
    if (state.saving) return
    let patch
    try { patch = entryPatch(entry, form) } catch (failure) { setState({ saving: false, error: failure.message }); return }
    setState({ saving: true, error: '' })
    try {
      const saved = await apiFetch(`/api/entries/${encodeURIComponent(entry.id)}`, { method: 'PATCH', body: JSON.stringify(patch) })
      onSaved?.(saved)
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="entry-editor" onSubmit={save} aria-label={`Change this ${kind.toLowerCase()}`}>
    <label className="entry-editor-wide"><span>Title</span><input value={form.title} onChange={set('title')} maxLength={300} autoFocus /></label>
    {entry.type === 'note' || 'body' in (entry.details ?? {}) ? <label className="entry-editor-wide"><span>Text</span><textarea value={form.body} onChange={set('body')} rows={4} maxLength={20000} /></label> : null}
    {repeating ? <>
      <fieldset className="entry-editor-wide entry-editor-days"><legend>Comes round on</legend>
        {WEEKDAYS.map(([day, name]) => <label key={day}><input type="checkbox" checked={form.weekdays.includes(day)} onChange={() => setForm((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((value) => value !== day) : [...current.weekdays, day].sort() }))} /><span>{name}</span></label>)}
      </fieldset>
      <label><span>From (empty: any time)</span><input type="time" value={form.start} onChange={set('start')} /></label>
      <label><span>To</span><input type="time" value={form.end} onChange={set('end')} /></label>
      <label><span>First day</span><input type="date" value={form.day} onChange={set('day')} /></label>
      <label><span>Last day (empty: no end)</span><input type="date" value={form.until} onChange={set('until')} /></label>
    </> : <>
      <label><span>Day (empty: no day)</span><input type="date" value={form.day} onChange={set('day')} /></label>
      <label><span>From (empty: any time)</span><input type="time" value={form.start} onChange={set('start')} disabled={!form.day} /></label>
      <label><span>To</span><input type="time" value={form.end} onChange={set('end')} disabled={!form.day} /></label>
      {TICKED.has(entry.type) ? <label><span>State</span><select value={form.status} onChange={set('status')}>{STATES.map(([value, words]) => <option key={value} value={value}>{words}</option>)}</select></label> : null}
      <div className="entry-editor-wide"><FieldsForm type={entry.type} details={form.details} skip={WRITTEN_BY_THE_APP} onChange={(details) => setForm((current) => ({ ...current, details }))} /></div>
    </>}
    {state.error ? <p className="entry-editor-wide entry-editor-error" role="alert">{state.error}</p> : null}
    <p className="entry-editor-wide entry-editor-actions">
      <button type="submit" className="entry-editor-save" disabled={state.saving}>{state.saving ? 'Saving…' : 'Save changes'}</button>
      <button type="button" onClick={onCancel} disabled={state.saving}>Cancel</button>
      {repeating ? <small>Days already ticked or moved stay as they are; the days still to come follow the new plan.</small> : null}
    </p>
  </form>
}
