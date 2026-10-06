import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { dataOf, displayDate, titleOf } from '../../lib/study.js'

const ENTITY_LABELS = { semesters: 'Semester', modules: 'Module', cards: 'Card', assessments: 'Assessment', sessions: 'Timetable session', materials: 'Material', progress: 'Progress record', settings: 'Setting' }
const ACTION_LABELS = { create: 'Created', update: 'Changed', delete: 'Removed', import: 'Imported' }
const when = value => value ? new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }) : ''

// Saved changes, removed records and the way back to either. Nothing here deletes anything.
export default function StudyHistory({ workspace, onChanged }) {
  const [removed, setRemoved] = useState(null), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const loadRemoved = useCallback(async () => {
    try { setRemoved(await apiFetch('/api/study/deleted')) } catch (cause) { setError(`Removed records could not be loaded. ${cause.message}`) }
  }, [])
  useEffect(() => { loadRemoved() }, [loadRemoved, workspace.history.length])
  async function act(key, request, done) {
    setBusy(key); setError(''); setNotice('')
    try { await request(); await onChanged(); await loadRemoved(); setNotice(done) }
    catch (cause) { setError(`${cause.message} Nothing was changed.`) }
    finally { setBusy('') }
  }
  const removedRows = removed ? Object.entries(removed).flatMap(([entity, rows]) => rows.map(row => ({ entity, row }))).sort((a, b) => String(b.row.deleted_at).localeCompare(String(a.row.deleted_at))) : []
  return <section>
    <h2>Saved history</h2>
    <p className="study-muted">Every Study save keeps the version before it. A removed record can be brought back, and an earlier version can be put back; both are saved as new changes, so nothing is lost either way.</p>
    {error && <p className="study-error" role="alert">{error}</p>}{notice && <p className="study-muted" role="status">{notice}</p>}
    <h3>Removed records</h3>
    {removed === null ? <p className="study-muted" role="status">Loading removed records…</p> : removedRows.length ? <ul className="study-history">{removedRows.map(({ entity, row }) => <li key={`${entity}-${row.id}`}>
      <strong>{titleOf(row) || dataOf(row).key || 'Untitled'}</strong><small>{ENTITY_LABELS[entity]} · removed {when(row.deleted_at)}</small>
      <div className="study-actions"><button type="button" disabled={Boolean(busy)} onClick={() => act(`restore-${row.id}`, () => apiFetch(`/api/study/${entity}/${row.id}/restore`, { method: 'POST', body: JSON.stringify({ revision: row.revision }) }), 'Record brought back.')}>{busy === `restore-${row.id}` ? 'Bringing back…' : 'Bring back'}</button></div>
    </li>)}</ul> : <p className="study-empty">Nothing has been removed.</p>}
    <h3>Recent changes</h3>
    <ol className="study-history">{workspace.history.slice(0, 100).map(row => {
      const current = (workspace[row.entity] || []).find(record => record.id === row.record_id)
      const version = row.after_data || row.before_data
      const differs = current && row.after_data && row.after_data.revision !== current.revision
      return <li key={row.id}>
        <strong>{ACTION_LABELS[row.action] || 'Saved change'} · {titleOf(version) || dataOf(version).key || 'Untitled'}</strong>
        <small>{ENTITY_LABELS[row.entity] || row.entity} · {when(row.created_at)}{row.actor && row.actor !== 'user' ? ` · ${row.actor}` : ''}</small>
        {differs && row.action !== 'delete' && <div className="study-actions"><button type="button" disabled={Boolean(busy)} onClick={() => act(`revert-${row.id}`, () => apiFetch(`/api/study/${row.entity}/${row.record_id}/revert`, { method: 'POST', body: JSON.stringify({ revision: current.revision, history_id: row.id }) }), 'That version was put back as a new change.')}>{busy === `revert-${row.id}` ? 'Putting back…' : 'Put this version back'}</button></div>}
      </li>
    })}</ol>
    {!workspace.history.length && <p className="study-empty">No saved history yet.</p>}
    {workspace.meta?.history_truncated && <p className="study-muted">Showing the latest {workspace.history.length} of {workspace.meta.history_count} saved changes. Export keeps all of them.</p>}
    <details><summary>Imported progress records ({workspace.progress.length})</summary><ul>{workspace.progress.map(row => <li key={row.id}>{titleOf(row)} · {displayDate(row.start_date || row.start_at || row.created_at)}<details><summary>View preserved record</summary><pre>{JSON.stringify(dataOf(row), null, 2)}</pre></details></li>)}</ul></details>
  </section>
}
