import { useEffect, useState } from 'react'
import { cardChecklist, cardHours, dataOf, displayDate, safeMaterialUrl, textEntries, titleOf } from '../../lib/study.js'
import { MaterialPreview } from './StudyMaterials.jsx'
import { appendedEntry, linkedMaterials, toggledChecklist } from './workbench.js'
import './study-workbench.css'

function WorkEntries({ label, entries, draft, setDraft, editingId, onEdit, onCancelEdit, onSave, onRemove, busy }) {
  return <section className="study-workbench-entries"><h3>{label}</h3>
    <ol>{entries.slice(-8).map(row => <li key={row.id}><p>{row.text}</p><div className="study-actions"><button type="button" disabled={busy} onClick={() => onEdit(row)}>Edit</button><button type="button" disabled={busy} onClick={() => onRemove(row)}>Remove</button></div></li>)}</ol>
    {!entries.length && <p className="study-muted">Nothing recorded yet.</p>}
    <form className="study-form" onSubmit={event => { event.preventDefault(); onSave() }}><label>{editingId ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}<textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder={label === 'Evidence' ? 'An output, link, timestamp or result you can point to' : 'What you learned or the exact next move'} /></label><div className="study-actions"><button type="submit" disabled={busy || !draft.trim()}>{editingId ? 'Save edit' : `Save ${label.toLowerCase()}`}</button>{editingId && <button type="button" onClick={onCancelEdit} disabled={busy}>Save as new instead</button>}</div></form>
  </section>
}

export default function StudyWorkbench({ card, materials = [], onSaveCard, onMaterialOpen, onReviewed, onCompleteCard }) {
  const [base, setBase] = useState(card), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [note, setNote] = useState(''), [evidence, setEvidence] = useState(''), [noteId, setNoteId] = useState(null), [evidenceId, setEvidenceId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const hasDraft = Boolean(note.trim() || evidence.trim() || noteId || evidenceId)
  useEffect(() => { if (!busy && !hasDraft && card?.revision !== base?.revision) setBase(card) }, [card?.revision, busy, hasDraft, base?.revision])
  const data = dataOf(base), checklist = cardChecklist(base), linked = linkedMaterials(base, materials), selected = linked.find(row => row.id === selectedId)
  const newer = card?.revision !== base?.revision
  async function mutate(change, action) {
    if (busy) return false
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await onSaveCard(base, change, action)
      const saved = result?.record || result?.row || result
      if (saved?.id === base.id && Number.isInteger(saved.revision)) setBase(saved)
      setNotice('Saved to this card.'); return true
    } catch (cause) { setError(`${cause.message} Your drafts are kept. Review the latest card before retrying.`); return false }
    finally { setBusy(false) }
  }
  function capture() { if (!hasDraft) setBase(card) }
  async function saveEntry(field) {
    const isNote = field === 'notes', text = isNote ? note : evidence, editingId = isNote ? noteId : evidenceId
    let rows = textEntries(base, field)
    if (editingId) {
      if (!rows.some(row => row.id === editingId)) { setError('This saved item no longer exists. Your text is kept; choose Save as new instead.'); return }
      rows = rows.map(row => row.id === editingId ? { ...row, text: text.trim(), updatedAt: new Date().toISOString() } : row)
    } else rows = appendedEntry(base, field, text)
    const change = { [field]: rows, ...(field === 'evidenceEntries' ? { evidence: rows.map(row => row.text).join('\n') } : {}) }
    if (await mutate(change, `${editingId ? 'Edited' : 'Added'} ${isNote ? 'note' : 'evidence'}`)) {
      if (isNote) { setNote(''); setNoteId(null) } else { setEvidence(''); setEvidenceId(null) }
    }
  }
  async function removeEntry(field, row) {
    if (!window.confirm(`Remove this ${field === 'notes' ? 'note' : 'evidence item'}? Its previous version remains in history.`)) return
    const rows = textEntries(base, field).filter(item => item.id !== row.id)
    await mutate({ [field]: rows, ...(field === 'evidenceEntries' ? { evidence: rows.map(item => item.text).join('\n') } : {}) }, 'Removed recorded study item')
  }
  function selectMaterial(material) {
    setSelectedId(material.id)
    onMaterialOpen?.(material)
  }
  return <section className="study-workbench" aria-label="Active card workbench">
    <header className="study-workbench-header"><div><p className="study-eyebrow">One piece of work</p><h2>{titleOf(base)}</h2></div><span className="study-muted">{cardHours(base).toFixed(1)} logged hours</span></header>
    <section className="study-workbench-output"><p className="study-eyebrow">Finish when</p><h3>{data.doneCondition || 'Choose one checkable output for this session.'}</h3>{data.description && <p>{data.description}</p>}{data.evidenceRequirement && <p><strong>Evidence to save:</strong> {data.evidenceRequirement}</p>}{onCompleteCard && <button type="button" className="study-primary" disabled={busy || hasDraft || newer} onClick={async () => { setBusy(true); setError(''); try { await onCompleteCard(card.id); setNotice('Card completed.') } catch (cause) { setError(cause.message) } finally { setBusy(false) } }}>Finish card</button>}{hasDraft && <p className="study-muted">Save your draft notes and evidence before finishing the card.</p>}</section>
    {newer && <div className="study-warning" role="status"><p>A newer version of this card was saved. Your drafts are still here.</p><button type="button" disabled={busy} onClick={() => { setBase(card); setError(''); setNotice('Latest card loaded; your draft text is kept.') }}>Review latest card</button></div>}
    {error && <p className="study-error" role="alert">{error}</p>}{notice && <p className="study-muted" role="status">{notice}</p>}
    <div className="study-workbench-columns"><div className="study-workbench-work">
      <section className="study-workbench-checklist"><div className="study-section-heading"><h3>Checklist</h3><span className="study-muted">{checklist.filter(row => row.done).length} / {checklist.length}</span></div>
        {checklist.map(row => <label className={`study-workbench-check${row.done ? ' completed' : ''}`} key={row.id}><input type="checkbox" checked={row.done} disabled={busy || newer} onChange={event => mutate({ checklist: toggledChecklist(base, row.id, event.target.checked) }, event.target.checked ? 'Completed checklist item' : 'Reopened checklist item')} /><span>{row.text}</span></label>)}
        {!checklist.length && <p className="study-muted">No checklist recorded on this card.</p>}
      </section>
      <WorkEntries label="Notes" entries={textEntries(base, 'notes')} draft={note} setDraft={value => { capture(); setNote(value) }} editingId={noteId} onEdit={row => { capture(); setNoteId(row.id); setNote(row.text) }} onCancelEdit={() => setNoteId(null)} onSave={() => saveEntry('notes')} onRemove={row => removeEntry('notes', row)} busy={busy} />
      <WorkEntries label="Evidence" entries={textEntries(base, 'evidenceEntries')} draft={evidence} setDraft={value => { capture(); setEvidence(value) }} editingId={evidenceId} onEdit={row => { capture(); setEvidenceId(row.id); setEvidence(row.text) }} onCancelEdit={() => setEvidenceId(null)} onSave={() => saveEntry('evidenceEntries')} onRemove={row => removeEntry('evidenceEntries', row)} busy={busy} />
    </div><aside className="study-workbench-library"><h3>Files and references</h3><p className="study-muted">Keep the reference open while you work. Notes, evidence and the timer stay beside it.</p>
      <nav className="study-workbench-materials" aria-label="Card references">{linked.map(material => <button type="button" key={material.id} aria-pressed={material.id === selectedId} onClick={() => selectMaterial(material)}><span className="study-badge">{dataOf(material).type || dataOf(material).viewer || 'Material'}</span><span>{titleOf(material)}</span></button>)}</nav>
      {!linked.length && <p className="study-empty">No references linked yet. Add materials from the card editor.</p>}
      {selected ? <section className="study-workbench-reader"><div className="study-section-heading"><h4>{titleOf(selected)}</h4><div className="study-actions">{safeMaterialUrl(dataOf(selected).url) && <a href={safeMaterialUrl(dataOf(selected).url)} target="_blank" rel="noreferrer">New tab</a>}{onReviewed && <label className="study-check-label"><input type="checkbox" checked={Boolean(dataOf(selected).reviewed)} onChange={event => onReviewed(selected, event.target.checked)} />Reviewed</label>}</div></div><MaterialPreview key={selected.id} material={selected} /><p className="study-muted">{dataOf(selected).description}</p></section> : linked.length > 0 && <p className="study-empty">Choose a file or video above to read here.</p>}
    </aside></div>
  </section>
}
