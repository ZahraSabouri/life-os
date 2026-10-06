import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api.js'

export default function StudyFolderControls({ module, onChanged }) {
  const [directory, setDirectory] = useState(''), [enabled, setEnabled] = useState(false), [mapping, setMapping] = useState(null), [includeExisting, setIncludeExisting] = useState(false), [count, setCount] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  useEffect(() => {
    if (!module?.id) return
    let cancelled = false
    apiFetch('/api/study/discovery').then(status => { if (cancelled) return; const current = status.mappings?.find(row => row.module_id === module.id); setMapping(current || null); setDirectory(current?.directory || ''); setEnabled(Boolean(current?.enabled)); setIncludeExisting(Boolean(current) && !current.baseline_at) }).catch(cause => { if (!cancelled) setError(cause.message) })
    return () => { cancelled = true }
  }, [module?.id])
  async function request(scan = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await apiFetch(`/api/study/discovery/${scan ? 'scan' : 'configure'}`, { method: 'POST', body: JSON.stringify(scan ? { module_id: module.id } : { module_id: module.id, directory: directory.trim(), enabled, include_existing: includeExisting }) })
      const current = result.mappings?.find(row => row.module_id === module.id)
      if (current) setMapping(current)
      setNotice(scan ? `${result.added || 0} materials added; ${result.pending || 0} files waiting to finish copying.` : enabled ? (includeExisting ? 'Module folder connected. Its existing files and any new ones will appear in Materials.' : 'Module folder connected. Files you add from now on will appear automatically.') : 'Folder watching is disabled.')
      if (result.errors?.length) setError(result.errors.join(' '))
      await onChanged?.()
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  async function countFiles() {
    setBusy(true); setError(''); setNotice('')
    try { setCount(await apiFetch('/api/study/discovery/preview', { method: 'POST', body: JSON.stringify({ module_id: module.id, directory: directory.trim() }) })) }
    catch (cause) { setCount(null); setError(cause.message) } finally { setBusy(false) }
  }
  const megabytes = bytes => bytes >= 1048576 ? `${Math.round(bytes / 1048576)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
  return <section className="study-practice-editor study-folder-controls"><h3>Module folder</h3><p className="study-muted">Files you add to a connected module folder appear in Materials automatically after they finish copying. Files already in the folder are left alone unless you ask for them. Your original files stay where they are.</p>
    {!module?.id ? <p>Save this module first, then connect its folder.</p> : <>
      <label>Folder path<input value={directory} onChange={event => setDirectory(event.target.value)} placeholder="Full path to this module's folder" disabled={busy} /></label>
      <label className="study-check-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} disabled={busy} />Watch this module folder</label>
      <label className="study-check-label"><input type="checkbox" checked={includeExisting} onChange={event => setIncludeExisting(event.target.checked)} disabled={busy} />Also bring in the files already in this folder</label>
      {count && <p className="study-muted">This folder holds {count.files} supported file{count.files === 1 ? '' : 's'} ({megabytes(count.bytes)}){Object.keys(count.types).length ? `: ${Object.entries(count.types).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, total]) => `${total} ${type}`).join(', ')}` : ''}.{count.bulk_folders.length ? ` ${count.bulk_folders.length} large data folder${count.bulk_folders.length === 1 ? ' is' : 's are'} skipped (${count.bulk_folders.slice(0, 3).map(row => `${row.path}, ${row.items} items`).join('; ')}).` : ''}{count.too_large ? ` ${count.too_large} over 100 MB are skipped.` : ''}{count.over_limit ? ' This folder is too large to bring in whole; it can still be watched for new files, or connect a narrower folder.' : ''}</p>}
      {mapping && <p className="study-muted">{mapping.status || (mapping.enabled ? 'Watching' : 'Disabled')} · {mapping.last_scan_at ? `Last scanned ${new Date(mapping.last_scan_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}` : 'Not scanned yet'}{mapping.pending ? ` · ${mapping.pending} pending files` : ''}{mapping.existing ? ` · ${mapping.existing} older files left alone` : ''}{mapping.bulk_folders?.length ? ` · ${mapping.bulk_folders.length} large data folder${mapping.bulk_folders.length === 1 ? '' : 's'} skipped` : ''}</p>}
      {mapping?.errors?.length > 0 && <p className="study-error">{mapping.errors.join(' ')}</p>}
      <div className="study-actions"><button type="button" disabled={busy || enabled && !directory.trim()} onClick={() => request(false)}>{busy ? 'Working…' : 'Save folder'}</button><button type="button" disabled={busy || !mapping?.enabled} onClick={() => request(true)}>Scan now</button><button type="button" disabled={busy || !directory.trim()} onClick={countFiles}>Count files</button></div>
    </>}
    {notice && <p className="study-muted" role="status">{notice}</p>}{error && <p className="study-error" role="alert">{error}</p>}
  </section>
}
