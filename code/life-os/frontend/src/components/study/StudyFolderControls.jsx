import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api.js'

export default function StudyFolderControls({ module, onChanged }) {
  const [directory, setDirectory] = useState(''), [enabled, setEnabled] = useState(false), [mapping, setMapping] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  useEffect(() => {
    if (!module?.id) return
    let cancelled = false
    apiFetch('/api/study/discovery').then(status => { if (cancelled) return; const current = status.mappings?.find(row => row.module_id === module.id); setMapping(current || null); setDirectory(current?.directory || ''); setEnabled(Boolean(current?.enabled)) }).catch(cause => { if (!cancelled) setError(cause.message) })
    return () => { cancelled = true }
  }, [module?.id])
  async function request(scan = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await apiFetch(`/api/study/discovery/${scan ? 'scan' : 'configure'}`, { method: 'POST', body: JSON.stringify(scan ? { module_id: module.id } : { module_id: module.id, directory: directory.trim(), enabled }) })
      const current = result.mappings?.find(row => row.module_id === module.id)
      if (current) setMapping(current)
      setNotice(scan ? `${result.added || 0} materials added; ${result.pending || 0} files waiting to finish copying.` : enabled ? 'Module folder connected. Stable new files will appear automatically.' : 'Folder watching is disabled.')
      if (result.errors?.length) setError(result.errors.join(' '))
      await onChanged?.()
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <section className="study-practice-editor study-folder-controls"><h3>Module folder</h3><p className="study-muted">New files in a connected module folder appear in Materials automatically after they finish copying. Your original files stay where they are.</p>
    {!module?.id ? <p>Save this module first, then connect its folder.</p> : <>
      <label>Folder path<input value={directory} onChange={event => setDirectory(event.target.value)} placeholder="Full path to this module's folder" disabled={busy} /></label>
      <label className="study-check-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} disabled={busy} />Watch this module folder</label>
      {mapping && <p className="study-muted">{mapping.status || (mapping.enabled ? 'Watching' : 'Disabled')} · {mapping.last_scan_at ? `Last scanned ${new Date(mapping.last_scan_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}` : 'Not scanned yet'}{mapping.pending ? ` · ${mapping.pending} pending files` : ''}</p>}
      {mapping?.errors?.length > 0 && <p className="study-error">{mapping.errors.join(' ')}</p>}
      <div className="study-actions"><button type="button" disabled={busy || enabled && !directory.trim()} onClick={() => request(false)}>{busy ? 'Working…' : 'Save folder'}</button><button type="button" disabled={busy || !mapping?.enabled} onClick={() => request(true)}>Scan now</button></div>
    </>}
    {notice && <p className="study-muted" role="status">{notice}</p>}{error && <p className="study-error" role="alert">{error}</p>}
  </section>
}
