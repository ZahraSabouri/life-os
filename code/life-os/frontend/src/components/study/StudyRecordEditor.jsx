import { useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { dataOf, inputDateTime, recordPayload, titleOf, utcFromInput } from '../../lib/study.js'
import StudyDialog from './StudyDialog.jsx'

const LABELS = { semesters: 'semester', modules: 'module', assessments: 'assessment', sessions: 'timetable session', materials: 'material' }
export default function StudyRecordEditor({ type, record, workspace, semesterId = '', moduleId = '', onSave, onClose, onDelete, onImported }) {
  const initial = dataOf(record)
  const [form, setForm] = useState(() => ({ title: record ? titleOf(record) : '', status: record?.status || 'active', semester_id: record?.semester_id || semesterId,
    module_id: record?.module_id || moduleId, start_date: record?.start_date || '', end_date: record?.end_date || '',
    start_at: inputDateTime(record?.start_at), end_at: inputDateTime(record?.end_at), code: initial.code || '', description: initial.description || initial.subtitle || '',
    note: initial.note || '', objectives: (initial.objectives ?? []).join('\n'), operatingRules: (initial.operatingRules ?? []).join('\n'),
    assessmentType: initial.type || 'coursework', weight: initial.weight ?? '', result: initial.result ?? '', location: initial.location || '',
    category: initial.category || 'class', url: initial.url || '', viewer: initial.viewer || 'frame', group: initial.group || '', tags: (initial.tags ?? []).join(', '),
    rrule: '', exdates: '', priority: initial.priority || 'normal' }))
  const [saving, setSaving] = useState(false), [error, setError] = useState('')
  const [preview, setPreview] = useState(null), [previewBody, setPreviewBody] = useState(null), [seriesId] = useState(() => crypto.randomUUID())
  const set = (key, value) => { setPreview(null); setPreviewBody(null); setForm(current => ({ ...current, [key]: value, ...(key === 'semester_id' ? { module_id: '' } : {}) })) }
  const label = LABELS[type] || 'record'
  const modules = workspace.modules.filter(row => !form.semester_id || row.semester_id === form.semester_id)
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      if (preview && previewBody) {
        await apiFetch('/api/study/imports/manual/apply', { method: 'POST', body: JSON.stringify({ ...previewBody, fingerprint: preview.fingerprint }) })
        await onImported?.(); onClose(); return
      }
      const data = { ...initial, description: form.description }
      if (type === 'modules') Object.assign(data, { code: form.code, note: form.note, objectives: form.objectives.split('\n').map(s => s.trim()).filter(Boolean), operatingRules: form.operatingRules.split('\n').map(s => s.trim()).filter(Boolean) })
      if (type === 'assessments') Object.assign(data, { type: form.assessmentType, weight: form.weight === '' ? null : Number(form.weight), result: form.result === '' ? null : Number(form.result), location: form.location })
      if (type === 'sessions') Object.assign(data, { category: form.category, location: form.location, ...(!record ? { rrule: form.rrule.trim() || null, exdates: form.exdates.split(',').map(s => s.trim()).filter(Boolean) } : {}) })
      if (type === 'materials') Object.assign(data, { url: form.url, viewer: form.viewer, group: form.group, priority: form.priority, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) })
      const start_at = type === 'sessions' || type === 'assessments' ? utcFromInput(form.start_at) : null
      const end_at = type === 'sessions' || type === 'assessments' ? utcFromInput(form.end_at) : null
      if (start_at && end_at && Date.parse(end_at) <= Date.parse(start_at)) throw new Error('The end must be after the start.')
      if (form.start_date && form.end_date && form.end_date < form.start_date) throw new Error('The end date must be after the start date.')
      const parentSemester = form.semester_id || workspace.modules.find(row => row.id === form.module_id)?.semester_id || null
      const payload = recordPayload(record, { title: form.title.trim(), status: form.status, semester_id: type === 'semesters' ? null : parentSemester,
        module_id: ['assessments', 'sessions', 'materials'].includes(type) ? form.module_id || null : null,
        start_date: form.start_date || null, end_date: form.end_date || null, start_at, end_at, data })
      if (type === 'sessions' && !record && form.rrule.trim()) {
        const semester = workspace.semesters.find(row => row.id === parentSemester)
        const body = { record: payload, seriesId, from: semester?.start_date || form.start_date || undefined, to: semester?.end_date || undefined }
        setPreview(await apiFetch('/api/study/imports/manual/preview', { method: 'POST', body: JSON.stringify(body) })); setPreviewBody(body); return
      }
      await onSave(type, record, payload)
      onClose()
    } catch (cause) { setError(cause.message) } finally { setSaving(false) }
  }
  const field = (name, caption, inputType = 'text', attrs = {}) => <label key={name}>{caption}<input type={inputType} value={form[name]} onChange={e => set(name, e.target.value)} {...attrs} /></label>
  return <StudyDialog title={`${record ? 'Edit' : 'Add'} ${label}`} onClose={onClose}>
    <form onSubmit={submit} className="study-form">
      {field('title', 'Title', 'text', { required: true, maxLength: 500 })}
      {type !== 'semesters' && <label>Semester<select value={form.semester_id} onChange={e => set('semester_id', e.target.value)}><option value="">No semester</option>{workspace.semesters.map(s => <option key={s.id} value={s.id}>{titleOf(s)}</option>)}</select></label>}
      {['assessments', 'sessions', 'materials'].includes(type) && <label>Module<select value={form.module_id} onChange={e => set('module_id', e.target.value)}><option value="">No module</option>{modules.map(s => <option key={s.id} value={s.id}>{titleOf(s)}</option>)}</select></label>}
      <label>Status<select value={form.status} onChange={e => set('status', e.target.value)}>{[...new Set([form.status, 'active', 'planned', 'completed', 'cancelled', 'archived'])].map(s => <option key={s}>{s}</option>)}</select></label>
      <div className="study-form-row">{field('start_date', 'Start date', 'date')}{field('end_date', type === 'assessments' ? 'Due date' : 'End date', 'date')}</div>
      {['sessions', 'assessments'].includes(type) && <><p className="study-muted">Times are in Europe/London. Leave them blank for a date-only item.</p><div className="study-form-row">{field('start_at', 'Start time', 'datetime-local')}{field('end_at', type === 'assessments' ? 'Deadline time' : 'End time', 'datetime-local')}</div>{field('location', 'Location')}</>}
      {type === 'modules' && <>{field('code', 'Module code')}<label>Objectives, one per line<textarea value={form.objectives} onChange={e => set('objectives', e.target.value)} /></label><label>Study rules, one per line<textarea value={form.operatingRules} onChange={e => set('operatingRules', e.target.value)} /></label><label>Module notes<textarea value={form.note} onChange={e => set('note', e.target.value)} /></label></>}
      {type === 'assessments' && <><label>Assessment type<select value={form.assessmentType} onChange={e => set('assessmentType', e.target.value)}>{[...new Set([form.assessmentType, 'coursework', 'exam', 'project', 'presentation', 'practical'])].map(s => <option key={s}>{s}</option>)}</select></label><div className="study-form-row">{field('weight', 'Weight (%)', 'number', { min: 0, max: 100, step: 'any' })}{field('result', 'Result (%)', 'number', { min: 0, max: 100, step: 'any' })}</div></>}
      {type === 'sessions' && <><label>Kind<select value={form.category} onChange={e => set('category', e.target.value)}>{[...new Set([form.category, 'class', 'study', 'project', 'exam', 'routine'])].map(s => <option key={s}>{s}</option>)}</select></label>{!record ? <>{field('rrule', 'Recurrence rule (optional)', 'text', { placeholder: 'FREQ=WEEKLY;BYDAY=MO;COUNT=10' })}{field('exdates', 'Excluded dates (comma separated)', 'text', { placeholder: 'YYYY-MM-DD, YYYY-MM-DD' })}<p className="study-muted">Recurring sessions are previewed before saving. Set COUNT or UNTIL, or choose a semester with an end date.</p></> : (initial.ics || initial.sourceSeries || initial.sourceRule) && <p className="study-muted">You are editing this occurrence. Use import to review changes to a recurring series.</p>}</>}
      {type === 'materials' && <>{field('url', 'File or web link', 'text', { required: true })}<label>Reader<select value={form.viewer} onChange={e => set('viewer', e.target.value)}>{['frame', 'youtube', 'video', 'image', 'markdown', 'text', 'code', 'notebook', 'file'].map(s => <option key={s}>{s}</option>)}</select></label>{field('group', 'Group')}{field('tags', 'Tags, comma separated')}<label>Priority<select value={form.priority} onChange={e => set('priority', e.target.value)}><option value="normal">Normal</option><option value="high">Start here</option></select></label></>}
      <label>Description<textarea value={form.description} onChange={e => set('description', e.target.value)} /></label>
      {error && <p className="study-error" role="alert">{error}</p>}
      {preview && <section className="study-import-preview"><h3>Recurring series preview</h3><dl>{Object.entries(preview.counts ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>{(preview.warnings ?? []).map((warning, i) => <p key={i}>{typeof warning === 'string' ? warning : warning.message || JSON.stringify(warning)}</p>)}<p>These concrete sessions will be saved once, including the excluded dates.</p></section>}
      <footer className="study-actions"><button type="submit" className="study-primary" disabled={saving || Boolean(preview && !preview.fingerprint)}>{saving ? 'Saving…' : preview ? 'Apply reviewed series' : type === 'sessions' && !record && form.rrule.trim() ? 'Preview recurring sessions' : 'Save'}</button><button type="button" onClick={onClose} disabled={saving}>Cancel</button>{record && <button type="button" className="study-danger" disabled={saving} onClick={async () => { if (!window.confirm(`Remove this ${label}? It will remain in history.`)) return; setSaving(true); try { await onDelete(type, record); onClose() } catch (cause) { setError(cause.message); setSaving(false) } }}>Remove</button>}</footer>
    </form>
  </StudyDialog>
}
