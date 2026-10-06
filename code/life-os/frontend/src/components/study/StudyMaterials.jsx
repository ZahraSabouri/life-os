import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api.js'
import { dataOf, safeMaterialUrl, titleOf, youtubeEmbed } from '../../lib/study.js'
import StudyDialog from './StudyDialog.jsx'

function Markdown({ text }) {
  const chunks = String(text).split(/(```[\s\S]*?```)/g)
  return <div className="study-markdown">{chunks.map((chunk, i) => chunk.startsWith('```') ? <pre key={i}>{chunk.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')}</pre> : chunk.split('\n').map((line, j) => /^#{1,6}\s/.test(line) ? <h3 key={`${i}-${j}`}>{line.replace(/^#+\s/, '')}</h3> : /^[-*]\s/.test(line) ? <p key={`${i}-${j}`}>• {line.slice(2)}</p> : <p key={`${i}-${j}`}>{line}</p>))}</div>
}
function Notebook({ text }) {
  let notebook
  try { notebook = JSON.parse(text) } catch { return <pre>{text}</pre> }
  return <div className="study-notebook">{(notebook.cells ?? []).map((cell, i) => <section key={i}>{cell.cell_type === 'markdown' ? <Markdown text={Array.isArray(cell.source) ? cell.source.join('') : cell.source} /> : <pre>{Array.isArray(cell.source) ? cell.source.join('') : cell.source}</pre>}{(cell.outputs ?? []).map((output, n) => <div key={n}>{output.data?.['image/png'] && <img alt={`Notebook output ${n + 1}`} src={`data:image/png;base64,${Array.isArray(output.data['image/png']) ? output.data['image/png'].join('') : output.data['image/png']}`} />}<pre>{[output.text, output.data?.['text/plain'], output.traceback].filter(Boolean).map(v => Array.isArray(v) ? v.join('') : v).join('\n')}</pre></div>)}</section>)}</div>
}
export function StudyReader({ material, onClose }) {
  const data = dataOf(material), url = safeMaterialUrl(data.url)
  const rawViewer = data.viewer || 'file'
  const viewer = rawViewer === 'pdf' || /\.pdf(\?|$)/i.test(url) ? 'frame' : rawViewer === 'ipynb' || /\.ipynb(\?|$)/i.test(url) ? 'notebook' : rawViewer
  const embed = youtubeEmbed(url)
  const [text, setText] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState('')
  const frame = useRef(null)
  useEffect(() => {
    if (!['markdown', 'text', 'code', 'notebook'].includes(viewer) || !url) return
    const controller = new AbortController()
    setLoading(true); setError('')
    fetch(url, { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(`Resource returned ${response.status}`); const value = await response.text(); if (value.length > 8_000_000) throw new Error('This file is too large for the inline reader. Use Open in new tab.'); return value }).then(setText).catch(cause => { if (cause.name !== 'AbortError') setError(cause.message) }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [url, viewer])
  return <StudyDialog wide title={titleOf(material)} onClose={onClose}>
    <div className="study-actions study-reader-actions">{url && <a href={url} target="_blank" rel="noreferrer">Open in new tab</a>}{viewer === 'frame' && <button type="button" onClick={() => { try { frame.current.contentWindow.focus(); frame.current.contentWindow.print() } catch { window.open(url, '_blank', 'noopener') } }}>Print / open</button>}</div>
    {!url ? <p className="study-error" role="alert">This material has no usable file or web link.</p> : <div className="study-reader-body">
      {loading ? <p>Loading material…</p> : error ? <p className="study-error" role="alert">{error} Use the original link to open the file.</p> : embed ? <iframe title={titleOf(material)} src={embed} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        : viewer === 'image' ? <img src={url} alt={titleOf(material)} />
        : viewer === 'video' ? <video src={url} controls preload="metadata" />
        : viewer === 'markdown' ? <Markdown text={text} />
        : viewer === 'notebook' ? <Notebook text={text} />
        : ['text', 'code'].includes(viewer) ? <pre>{text}</pre>
        : viewer === 'frame' || viewer === 'html' ? <iframe ref={frame} title={titleOf(material)} src={url} {...(/\.pdf(\?|$)/i.test(url) ? {} : { sandbox: 'allow-scripts allow-forms allow-popups' })} />
        : <p>This file opens in its own application. Use Open in new tab.</p>}
    </div>}
    {data.description && <p className="study-muted">{data.description}</p>}
  </StudyDialog>
}

export default function StudyMaterials({ materials, workspace, semesterId, moduleId, onOpen, onEdit, onReviewed, onUploaded }) {
  const [search, setSearch] = useState(''), [group, setGroup] = useState(''), [scope, setScope] = useState('all'), [uploadOpen, setUploadOpen] = useState(false)
  const [file, setFile] = useState(null), [title, setTitle] = useState(''), [uploadGroup, setUploadGroup] = useState('Uploaded'), [description, setDescription] = useState(''), [tags, setTags] = useState('')
  const [uploadSemester, setUploadSemester] = useState(semesterId), [uploadModule, setUploadModule] = useState(moduleId)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const modules = workspace.modules.filter(row => !uploadSemester || row.semester_id === uploadSemester)
  const groups = [...new Set(materials.map(row => dataOf(row).group).filter(Boolean))].sort()
  const filtered = materials.filter(row => {
    const data = dataOf(row)
    return (!group || data.group === group) && (!search || [titleOf(row), data.group, data.description, data.path, ...(data.tags ?? [])].join(' ').toLowerCase().includes(search.toLowerCase()))
      && (scope !== 'reviewed' || data.reviewed) && (scope !== 'unreviewed' || !data.reviewed) && (scope !== 'pinned' || data.priority === 'high') && (scope !== 'recent' || data.lastOpenedAt)
  }).sort((a, b) => scope === 'recent' ? String(dataOf(b).lastOpenedAt || '').localeCompare(String(dataOf(a).lastOpenedAt || '')) : titleOf(a).localeCompare(titleOf(b)))
  async function upload(event) {
    event.preventDefault(); if (!file) return
    setBusy(true); setError('')
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('Choose a file no larger than 25 MB.')
      const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ''
      for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
      const result = await apiFetch('/api/study/uploads', { method: 'POST', body: JSON.stringify({ name: file.name, title: title || file.name, dataBase64: btoa(binary), mime: file.type,
        semester_id: uploadSemester || workspace.modules.find(row => row.id === uploadModule)?.semester_id || null, module_id: uploadModule || null, group: uploadGroup, description, tags: tags.split(',').map(s => s.trim()).filter(Boolean) }) })
      await onUploaded(result); setFile(null); setTitle(''); setUploadOpen(false)
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <section><div className="study-section-heading"><div><p className="study-eyebrow">Keep everything close</p><h2>Materials</h2></div><button type="button" onClick={() => setUploadOpen(true)}>Upload file</button></div>
    <div className="study-filter-row"><label>Find materials<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, group or tag" /></label><label>Group<select value={group} onChange={e => setGroup(e.target.value)}><option value="">All groups</option>{groups.map(value => <option key={value}>{value}</option>)}</select></label><label>Show<select value={scope} onChange={e => setScope(e.target.value)}>{[['all', 'All materials'], ['pinned', 'Start here'], ['recent', 'Recently opened'], ['unreviewed', 'Not reviewed'], ['reviewed', 'Reviewed']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <p className="study-muted">{filtered.length} of {materials.length} materials · {materials.filter(row => dataOf(row).reviewed).length} reviewed</p>
    <div className="study-material-grid">{filtered.map(row => <article className="study-material-card" key={row.id}><span className="study-badge">{dataOf(row).type || dataOf(row).viewer || 'Material'}</span>{dataOf(row).priority === 'high' && <span className="study-badge">Start here</span>}<h3><button type="button" onClick={() => onOpen(row)}>{titleOf(row)}</button></h3><p>{dataOf(row).description}</p><small>{dataOf(row).group}</small><div className="study-actions"><button type="button" onClick={() => onOpen(row)}>Read</button><button type="button" onClick={() => onEdit('materials', row)}>Edit</button><label className="study-check-label"><input type="checkbox" checked={Boolean(dataOf(row).reviewed)} onChange={e => onReviewed(row, e.target.checked)} />Reviewed</label></div></article>)}</div>
    {!filtered.length && <p className="study-empty">{materials.length ? 'No materials match these filters.' : 'No materials yet. Add a link or upload a file.'}</p>}
    {uploadOpen && <StudyDialog title="Upload study material" onClose={() => setUploadOpen(false)}><form className="study-form" onSubmit={upload}><label>File<input type="file" required onChange={e => { const chosen = e.target.files?.[0]; setFile(chosen); setTitle(chosen?.name || '') }} /></label><label>Title<input value={title} onChange={e => setTitle(e.target.value)} required /></label><label>Semester<select value={uploadSemester} onChange={e => { setUploadSemester(e.target.value); setUploadModule('') }}><option value="">No semester</option>{workspace.semesters.map(row => <option value={row.id} key={row.id}>{titleOf(row)}</option>)}</select></label><label>Module<select value={uploadModule} onChange={e => setUploadModule(e.target.value)}><option value="">No module</option>{modules.map(row => <option value={row.id} key={row.id}>{titleOf(row)}</option>)}</select></label><label>Group<input value={uploadGroup} onChange={e => setUploadGroup(e.target.value)} /></label><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} /></label><label>Tags, comma separated<input value={tags} onChange={e => setTags(e.target.value)} /></label><p className="study-muted">Files stay in your Life OS data folder. Maximum size: 25 MB.</p>{error && <p className="study-error" role="alert">{error}</p>}<button type="submit" className="study-primary" disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</button></form></StudyDialog>}
  </section>
}
