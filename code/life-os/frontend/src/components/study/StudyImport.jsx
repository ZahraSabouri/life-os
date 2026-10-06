import { useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import StudyDialog from './StudyDialog.jsx'

export function downloadJson(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const examples = {
  json: { cards: [{ id: '11111111-1111-4111-8111-111111111111', title: 'One concrete study task', status: 'planned', start_date: null, end_date: null, data: { lane: 'Backlog', priority: 'Medium', estimatedHours: 1, checklist: [{ id: 'one-output', text: 'Produce one checkable output', done: false }], doneCondition: 'The output is saved', tags: [] } }] },
  csv: 'title,date,start_time,end_time,end_date,location,module_id,source_id\nExample session,YYYY-MM-DD,10:00,11:00,,Room,,session-001\n',
  ics: 'Use the original .ics export or calendar subscription content. Keep UID, DTSTART, DTEND, TZID, RRULE, EXDATE and RECURRENCE-ID unchanged. Do not turn missing dates or times into guessed ones.'
}
export default function StudyImport({ semesterId, moduleId, semester, onClose, onApplied }) {
  const [format, setFormat] = useState('json'), [content, setContent] = useState(''), [filename, setFilename] = useState(''), [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [applied, setApplied] = useState(false)
  const [from, setFrom] = useState(semester?.start_date || ''), [to, setTo] = useState(semester?.end_date || '')
  const body = () => ({ content, semester_id: semesterId || null, module_id: moduleId || null, source: filename || `manual-${format}`, ...(['ics', 'csv'].includes(format) && from && to ? { from, to } : {}) })
  const example = format === 'json' ? { cards: examples.json.cards.map(row => ({ ...row, semester_id: semesterId || null, module_id: moduleId || null })) } : examples[format]
  const change = (nextFormat, nextContent, nextName = '') => { setFormat(nextFormat); setContent(nextContent); setFilename(nextName); setPreview(null); setError(''); setApplied(false) }
  async function choose(event) {
    const file = event.target.files?.[0]; if (!file) return
    if (file.size > 15 * 1024 * 1024) { setError('Choose an import no larger than 15 MB.'); return }
    const next = /\.ics$/i.test(file.name) ? 'ics' : /\.csv$/i.test(file.name) ? 'csv' : 'json'
    change(next, await file.text(), file.name)
  }
  async function request(action) {
    setBusy(true); setError('')
    try {
      if (['ics', 'csv'].includes(format) && Boolean(from) !== Boolean(to)) throw new Error('Choose both From and To, or leave both empty for a bounded source calendar.')
      if (from && to && from > to) throw new Error('The import window ends before it starts.')
      const result = await apiFetch(`/api/study/imports/${format}/${action}`, { method: 'POST', body: JSON.stringify({ ...body(), ...(action === 'apply' ? { fingerprint: preview.fingerprint } : {}) }) })
      if (action === 'preview') setPreview(result)
      else { setApplied(true); await onApplied(result) }
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  const warnings = preview?.warnings ?? []
  const conflicts = preview?.conflicts ?? []
  const explain = value => typeof value === 'string' ? value : value.message || value.reason || JSON.stringify(value)
  return <StudyDialog title="Import study data" wide onClose={onClose}><div className="study-form">
    <p>Choose a file or paste data. Preview checks it before anything is saved. Existing personal edits remain protected.</p>
    <label>Format<select value={format} disabled={busy} onChange={e => change(e.target.value, '')}><option value="json">JSON study data / export</option><option value="csv">CSV timetable</option><option value="ics">iCalendar timetable (.ics)</option><option value="legacy">Original Summer Rescue</option></select></label>
    {format === 'legacy' ? <p className="study-muted">Preview the preserved original Study data. Repeating an import will match source records rather than duplicate them.</p> : <><label>Choose file<input type="file" accept=".json,.csv,.ics,application/json,text/csv,text/calendar" disabled={busy} onChange={choose} /></label><label>Or paste {format.toUpperCase()}<textarea rows={10} value={content} disabled={busy} onChange={e => change(format, e.target.value, filename)} spellCheck="false" /></label>{['ics', 'csv'].includes(format) && <><div className="study-form-row"><label>Import from<input type="date" value={from} disabled={busy} onChange={e => { setFrom(e.target.value); setPreview(null); setApplied(false) }} /></label><label>Import through<input type="date" value={to} disabled={busy} onChange={e => { setTo(e.target.value); setPreview(null); setApplied(false) }} /></label></div><p className="study-muted">A timetable with no end needs an explicit window, up to 366 days. A selected semester supplies its dates.</p></>}<details><summary>Instructions for your own AI</summary><p>Collect only supplied information. Keep dates as YYYY-MM-DD and leave unknown values null. JSON records require UUID IDs: create each ID once and reuse it on later imports. Replace the example ID. CSV uses title,date,start_time,end_time,end_date,location,module_id,source_id; clocks are Europe/London. Use stable source_id values. Preserve ICS timezone, recurrence and excluded dates. Do not invent modules, assessment results or timetable slots.</p><pre>{typeof example === 'object' ? JSON.stringify(example, null, 2) : example}</pre><button type="button" onClick={() => downloadJson({ format, instructions: 'Use supplied source material only. JSON records require stable UUID IDs. CSV columns: title,date,start_time,end_time,end_date,location,module_id,source_id. Dates YYYY-MM-DD; CSV clocks Europe/London. Preserve ICS timezone, recurrence and excluded dates. Leave unknown fields empty. Preview before applying.', example }, `study-${format}-instructions.json`)}>Download instructions</button></details></>}
    {error && <p className="study-error" role="alert">{error}</p>}
    <button type="button" className="study-primary" disabled={busy || (format !== 'legacy' && !content.trim())} onClick={() => request('preview')}>{busy ? 'Checking…' : 'Preview import'}</button>
    {preview && <section className="study-import-preview"><h3>Import preview</h3><dl className="study-metrics">{Object.entries(preview.counts ?? {}).map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
      {warnings.length > 0 && <div><h4>Check these notes</h4><ul>{warnings.map((row, i) => <li key={i}>{explain(row)}</li>)}</ul></div>}
      {conflicts.length > 0 && <div><h4>Conflicts / preserved records</h4><ul>{conflicts.slice(0, 30).map((row, i) => <li key={i}>{explain(row)}</li>)}</ul></div>}
      <p className="study-muted">The server rechecks this preview and makes a backup before applying it.</p>
      {!applied ? <button type="button" className="study-primary" disabled={busy || !preview.fingerprint} onClick={() => request('apply')}>{busy ? 'Applying…' : 'Apply reviewed import'}</button> : <p role="status">Import saved. You can close this window and review the workspace.</p>}
    </section>}
  </div></StudyDialog>
}
