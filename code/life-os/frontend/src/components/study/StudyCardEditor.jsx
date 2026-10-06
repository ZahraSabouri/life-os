import { useState } from 'react'
import { cardChecklist, cardDateFields, cardDone, cardDue, cardHours, cardLane, cardStart, dataOf, DEFAULT_LANES, DEFAULT_PRIORITIES, DEFAULT_SLOTS, laneStatus, localClock, recordPayload, textEntries, titleOf } from '../../lib/study.js'
import StudyDialog from './StudyDialog.jsx'

const id = () => crypto.randomUUID()
function EntryList({ entries, setEntries, label, checklist = false }) {
  const [draft, setDraft] = useState('')
  return <section className="study-card-section"><h3>{label}</h3>
    {entries.map((entry, i) => <div className="study-entry-row" key={entry.id}>
      {checklist && <input type="checkbox" checked={entry.done} aria-label={`Complete ${entry.text}`} onChange={e => setEntries(entries.map((row, n) => n === i ? { ...row, done: e.target.checked } : row))} />}
      <textarea aria-label={`${label} item ${i + 1}`} value={entry.text} onChange={e => setEntries(entries.map((row, n) => n === i ? { ...row, text: e.target.value } : row))} rows={checklist ? 1 : 2} />
      <button type="button" aria-label={`Remove ${label.toLowerCase()} item ${i + 1}`} onClick={() => setEntries(entries.filter((_, n) => n !== i))}>Remove</button>
    </div>)}
    {!entries.length && <p className="study-muted">Nothing recorded yet.</p>}
    <div className="study-entry-add"><input value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Add ${label.toLowerCase()}`} aria-label={`New ${label.toLowerCase()} item`} /><button type="button" disabled={!draft.trim()} onClick={() => { setEntries([...entries, { id: id(), text: draft.trim(), at: new Date().toISOString(), ...(checklist ? { done: false } : {}) }]); setDraft('') }}>Add</button></div>
  </section>
}

export default function StudyCardEditor({ record, workspace, semesterId = '', moduleId = '', preferences = {}, onSave, onClose, onDelete, onFocus, onOpenMaterial }) {
  const data = dataOf(record)
  const [form, setForm] = useState(() => ({ title: record ? titleOf(record) : '', semester_id: record?.semester_id || semesterId, module_id: record?.module_id || moduleId,
    lane: record ? cardLane(record) : 'Backlog', phase: data.phase || '', priority: data.priority || 'Medium', slotType: data.slotType || 'Flex', slotLabel: data.slotLabel || '',
    start_date: record ? cardStart(record) : '', end_date: record ? cardDue(record) : '', startTime: localClock(record?.start_at) || data.startTime || '', dueTime: localClock(record?.end_at) || data.dueTime || '', estimatedHours: data.estimatedHours ?? data.estimateHours ?? '', actualHours: record ? cardHours(record) : 0,
    description: data.description || '', evidenceRequirement: data.evidenceRequirement || '', doneCondition: data.doneCondition || '', tags: (data.tags ?? []).join(', ') }))
  const [checklist, setChecklist] = useState(() => record ? cardChecklist(record) : [])
  const [notes, setNotes] = useState(() => record ? textEntries(record, 'notes') : [])
  const [evidence, setEvidence] = useState(() => record ? textEntries(record, 'evidenceEntries') : [])
  const [resourceIds, setResourceIds] = useState(data.resourceIds || [])
  const [resourceSearch, setResourceSearch] = useState('')
  const [saving, setSaving] = useState(false), [error, setError] = useState('')
  const [resetProgress, setResetProgress] = useState(false)
  const set = (key, value) => setForm(current => ({ ...current, [key]: value, ...(key === 'semester_id' ? { module_id: '' } : {}) }))
  const options = (defaults, custom, current) => [...new Set([...(Array.isArray(custom) ? custom : defaults), current].filter(Boolean))]
  const lanes = options(DEFAULT_LANES, preferences.lanes, form.lane)
  const modules = workspace.modules.filter(row => !form.semester_id || row.semester_id === form.semester_id)
  const materials = workspace.materials.filter(row => (!form.module_id || row.module_id === form.module_id || resourceIds.includes(row.id)) && (!resourceSearch || [titleOf(row), dataOf(row).group, dataOf(row).description].join(' ').toLowerCase().includes(resourceSearch.toLowerCase())))
  function select(name, caption, values) { return <label>{caption}<select value={form[name]} onChange={e => set(name, e.target.value)}>{values.map(value => <option key={value}>{value}</option>)}</select></label> }
  function field(name, caption, type = 'text', attrs = {}) { return <label>{caption}<input type={type} value={form[name]} onChange={e => set(name, e.target.value)} {...attrs} /></label> }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const nextDone = form.lane === 'Done'
      const changedHours = Number(form.actualHours) !== cardHours(record)
      const now = new Date().toISOString()
      const dates = cardDateFields(form.start_date, form.end_date, form.startTime, form.dueTime)
      const next = { ...data, lane: form.lane, done: nextDone, phase: form.phase, priority: form.priority, slotType: form.slotType, slotLabel: form.slotLabel,
        startDate: form.start_date || null, dueDate: form.end_date || null, startTime: form.startTime || null, dueTime: form.dueTime || null, dueDateTime: dates.end_at || form.end_date || null,
        estimatedHours: Number(form.estimatedHours || 0), actualHours: Number(form.actualHours || 0), description: form.description, evidenceRequirement: form.evidenceRequirement,
        doneCondition: form.doneCondition, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), checklist: checklist.filter(row => row.text.trim()), notes: notes.filter(row => row.text.trim()),
        evidenceEntries: evidence.filter(row => row.text.trim()), evidence: evidence.map(row => row.text).join('\n'), resourceIds,
        ...(resetProgress ? { focusSessions: [], hoursLog: [] } : {}),
        completedAt: nextDone ? data.completedAt || now : null,
        activity: [...(data.activity ?? []), { id: id(), at: now, action: nextDone && !cardDone(record) ? 'Marked done' : 'Edited card', details: changedHours ? `Logged hours: ${form.actualHours}` : '' }],
        ...(changedHours && !resetProgress ? { hoursLog: [...(data.hoursLog ?? []), { id: id(), at: now, hours: Number(form.actualHours) - cardHours(record) }] } : {}) }
      await onSave('cards', record, recordPayload(record, { title: form.title.trim(), status: laneStatus(form.lane), semester_id: form.semester_id || workspace.modules.find(row => row.id === form.module_id)?.semester_id || null, module_id: form.module_id || null,
        ...dates, data: next }))
      onClose()
    } catch (cause) { setError(cause.message) } finally { setSaving(false) }
  }
  return <StudyDialog wide title={record ? 'Edit study card' : 'Add study card'} onClose={onClose}>
    <form className="study-form" onSubmit={submit}>
      <p className="study-muted">Save applies all changes in this card. Existing notes and history are kept.</p>
      {field('title', 'Title', 'text', { required: true, maxLength: 500 })}
      <div className="study-form-row"><label>Semester<select value={form.semester_id} onChange={e => set('semester_id', e.target.value)}><option value="">No semester</option>{workspace.semesters.map(row => <option key={row.id} value={row.id}>{titleOf(row)}</option>)}</select></label><label>Module<select value={form.module_id} onChange={e => set('module_id', e.target.value)}><option value="">No module</option>{modules.map(row => <option key={row.id} value={row.id}>{titleOf(row)}</option>)}</select></label></div>
      <div className="study-form-row">{select('lane', 'Status', lanes)}{select('priority', 'Priority', options(DEFAULT_PRIORITIES, preferences.priorities, form.priority))}</div>
      <div className="study-form-row">{field('phase', 'Phase')}{select('slotType', 'Study slot', options(DEFAULT_SLOTS, preferences.slots, form.slotType))}{field('slotLabel', 'Slot details')}</div>
      <div className="study-form-row">{field('start_date', 'Start date', 'date')}{field('end_date', 'Due date', 'date')}</div>
      <div className="study-form-row">{field('startTime', 'Start time (optional, London)', 'time')}{field('dueTime', 'Due time (optional, London)', 'time')}</div>
      <div className="study-form-row">{field('estimatedHours', 'Estimated hours', 'number', { min: 0, step: 0.25 })}{field('actualHours', 'Logged hours', 'number', { min: 0, step: 'any' })}</div>
      {field('tags', 'Tags, comma separated')}
      <label>Why it matters / description<textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} /></label>
      <label>Done when<textarea value={form.doneCondition} onChange={e => set('doneCondition', e.target.value)} /></label>
      <label>Evidence to produce<textarea value={form.evidenceRequirement} onChange={e => set('evidenceRequirement', e.target.value)} /></label>
      <EntryList label="Checklist" entries={checklist} setEntries={setChecklist} checklist />
      <EntryList label="Notes" entries={notes} setEntries={setNotes} />
      <EntryList label="Evidence" entries={evidence} setEntries={setEvidence} />
      <section className="study-card-section"><h3>Linked materials</h3><input type="search" value={resourceSearch} onChange={e => setResourceSearch(e.target.value)} placeholder="Find materials" aria-label="Find card materials" />
        <div className="study-material-links">{materials.map(material => <div className="study-link-row" key={material.id}><label><input type="checkbox" checked={resourceIds.includes(material.id)} onChange={e => setResourceIds(current => e.target.checked ? [...new Set([...current, material.id])] : current.filter(item => item !== material.id))} />{titleOf(material)}</label><button type="button" onClick={() => onOpenMaterial(material)}>Open</button></div>)}</div>
        {!materials.length && <p className="study-muted">No matching materials. Add materials from the Study workspace.</p>}
      </section>
      {record && <section className="study-card-section"><h3>Logged activity</h3><p>{(data.focusSessions ?? []).length} focus sessions · {cardHours(record).toFixed(2)} logged hours</p><ol className="study-history">{[...(data.activity ?? [])].reverse().slice(0, 12).map((row, i) => <li key={row.id || i}><span>{row.action}</span><small>{row.at && new Date(row.at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}{row.details ? ` · ${row.details}` : ''}</small></li>)}</ol></section>}
      {error && <p className="study-error" role="alert">{error}</p>}
      <footer className="study-actions"><button type="submit" className="study-primary" disabled={saving}>{saving ? 'Saving…' : 'Save card'}</button><button type="button" disabled={saving} onClick={onClose}>Cancel</button>
        {record && <button type="button" disabled={saving} onClick={() => { onFocus(record); onClose() }}>Focus on saved card</button>}
        {record && <button type="button" disabled={saving} onClick={() => { if (!window.confirm('Clear this card’s checklist ticks, notes, evidence and logged hours in the editor? Save card applies the reset; its previous version remains in history.')) return; setResetProgress(true); setChecklist(rows => rows.map(row => ({ ...row, done: false }))); setNotes([]); setEvidence([]); setForm(current => ({ ...current, lane: 'Backlog', actualHours: 0 })) }}>Reset recorded progress</button>}
        {record && <button type="button" className="study-danger" disabled={saving} onClick={async () => { if (!window.confirm('Remove this card? Its history will remain.')) return; setSaving(true); try { await onDelete('cards', record); onClose() } catch (cause) { setError(cause.message); setSaving(false) } }}>Remove card</button>}
      </footer>
    </form>
  </StudyDialog>
}
