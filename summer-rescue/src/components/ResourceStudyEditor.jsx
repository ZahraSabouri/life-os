import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { normaliseResourceProgressEntry } from '../utils/resourceProgress.js'
import { stripMarkdown } from '../utils/markdown.js'
import { LazyRichTextEditor } from './LazyRichTextEditor'

function learningState(progress) {
  if (progress.progressPercent >= 100) return 'Reviewed'
  if (progress.progressPercent > 0 || progress.understandingPercent > 0 || progress.note.trim()) return 'In progress'
  return 'Not started'
}

function Metric({ label, value, tone }) {
  return (
    <div className={`resource-learning-metric ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <span className="resource-learning-meter" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </span>
    </div>
  )
}

// Notes/questions can run to paragraphs, and an inline <details> used to let
// that grow inside the card grid — one long note made its card towers over
// every sibling in the row. A popup keeps every card the same height no
// matter how much someone has written, the same trick ResourceReader/
// NoteReader already use for viewing a source or a knowledge note.
function ResourceNotesModal({ title, note, onSave, onClose }) {
  const [draft, setDraft] = useState(note)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  async function saveNote() {
    setStatus('saving')
    setError('')
    try {
      await onSave(draft)
      setStatus('saved')
      onClose()
    } catch (saveError) {
      setStatus('error')
      setError(saveError.message || 'Could not save this resource note.')
    }
  }

  return createPortal(
    <div
      className="reader-shell"
      role="dialog"
      aria-modal="true"
      aria-label={`Notes: ${title}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="reader-window is-compact">
        <header className="reader-chrome">
          <span className="reader-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div className="reader-addr">
            <span className="type-badge">Notes</span>
            <strong title={title}>{title}</strong>
          </div>
          <div className="reader-actions">
            <button type="button" className="reader-btn reader-close" onClick={onClose} aria-label="Close notes">
              ✕
            </button>
          </div>
        </header>
        <div className="reader-body">
          <div className="resource-notes-modal-body">
            <LazyRichTextEditor
              rows={12}
              value={draft}
              placeholder="What made sense? What is unclear? What should you return to?"
              onChange={setDraft}
            />
            <div className="resource-notes-modal-actions">
              <span role="status" className={status === 'error' ? 'save-status is-error' : 'save-status'}>
                {status === 'saving' ? 'Saving to the local tracker…' : error}
              </span>
              <button type="button" className="secondary-button" onClick={onClose} disabled={status === 'saving'}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={saveNote} disabled={status === 'saving'}>
                {status === 'saving' ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// The same saved record appears wherever a source is useful: its module library
// and every task that links to it. That keeps progress about the source itself,
// not trapped in one particular card.
export function ResourceStudyEditor({
  resourceId,
  title = 'Resource',
  progress,
  onProgressChange = () => {},
  onProgressSave,
  onToggleReviewed,
  compact = false,
}) {
  const saved = normaliseResourceProgressEntry(progress)
  const state = learningState(saved)
  const reviewed = saved.progressPercent >= 100
  const [notesOpen, setNotesOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [saveError, setSaveError] = useState('')
  const notePreview = stripMarkdown(saved.note)

  function update(patch) {
    onProgressChange(resourceId, patch)
    setSaveStatus('dirty')
    setSaveError('')
  }

  async function save(patch) {
    setSaveStatus('saving')
    setSaveError('')
    try {
      if (onProgressSave) await onProgressSave(resourceId, patch)
      else await Promise.resolve(onProgressChange(resourceId, patch))
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      setSaveError(error.message || 'Could not save this resource progress.')
      throw error
    }
  }

  async function saveCurrentProgress() {
    await save({
      progressPercent: saved.progressPercent,
      understandingPercent: saved.understandingPercent,
      note: saved.note,
    }).catch(() => {})
  }

  return (
    <section className={`resource-study-editor${compact ? ' compact' : ''}`} aria-label={`Study progress: ${saved.progressPercent}% studied, ${saved.understandingPercent}% understood`}>
      <div className="resource-learning-overview">
        <div className="resource-learning-state">
          <span>{state}</span>
          {onToggleReviewed && (
            <label className="resource-reviewed-toggle">
              <input type="checkbox" checked={reviewed} onChange={() => onToggleReviewed(resourceId)} />
              <span>Reviewed</span>
            </label>
          )}
        </div>
        <div className="resource-learning-metrics">
          <Metric label="Studied" value={saved.progressPercent} tone="studied" />
          <Metric label="Understood" value={saved.understandingPercent} tone="understood" />
        </div>
      </div>
      <details className="resource-study-details">
        <summary>{compact ? 'Update study progress' : 'Progress, notes & questions'}</summary>
        <div className="resource-progress-fields">
          <label>
            <span>Read / studied</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={saved.progressPercent}
              onChange={(event) => update({ progressPercent: event.target.value })}
            />
            <output>{saved.progressPercent}%</output>
          </label>
          <label>
            <span>Understood</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={saved.understandingPercent}
              onChange={(event) => update({ understandingPercent: event.target.value })}
            />
            <output>{saved.understandingPercent}%</output>
          </label>
        </div>
        <div className="resource-notes-summary">
          <p className={notePreview ? 'resource-notes-preview' : 'resource-notes-preview is-empty'}>
            {notePreview || 'No notes yet.'}
          </p>
          <button type="button" className="secondary-button compact-button" onClick={() => setNotesOpen(true)}>
            {notePreview ? 'View / edit notes' : 'Add notes'}
          </button>
        </div>
        <div className="resource-progress-save-row">
          <span role="status" className={saveStatus === 'error' ? 'save-status is-error' : 'save-status'}>
            {saveStatus === 'dirty' && 'Unsaved changes'}
            {saveStatus === 'saving' && 'Saving to the local tracker…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && saveError}
          </span>
          <button
            type="button"
            className="primary-button compact-button"
            onClick={saveCurrentProgress}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </details>
      {notesOpen && (
        <ResourceNotesModal
          title={title}
          note={saved.note}
          onSave={async (next) => {
            await save({
              progressPercent: saved.progressPercent,
              understandingPercent: saved.understandingPercent,
              note: next,
            })
          }}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </section>
  )
}
