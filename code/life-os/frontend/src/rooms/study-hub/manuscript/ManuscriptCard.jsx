import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStudyPortalHost } from '../studyPortal.js'
import { PRIORITY_OPTIONS, SLOT_OPTIONS, STATUS_OPTIONS } from '../data/constants'
import {
  Diamond,
  alpha,
  moduleAccent,
  normaliseGround,
  paletteFor,
} from './ManuscriptPrimitives'
import './card.css'

const CHAPTER_ROMAN = {
  'Applied ML': 'I',
  'Time Series': 'II',
  'Group Project': 'III',
  MAT700: 'IV',
  Admin: 'V',
  Health: 'V',
}

const LANE_ORDER = ['Today', 'This Week', 'Deep Work', 'Backlog', 'Rescue Lane', 'Waiting / Blocked', 'Done']

function romanFor(card) {
  return CHAPTER_ROMAN[card?.moduleGroup] ?? '·'
}

function formatDate(value) {
  if (!value) return 'no date'
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function hoursLabel(value) {
  const amount = Number(value || 0)
  return Number.isInteger(amount) ? `${amount}h` : `${amount.toFixed(1)}h`
}

// Click-to-edit text: shows a span; on click becomes an input that saves on Enter/blur.
function InlineText({ value, onSave, className = '', style, inputStyle }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])
  if (editing) {
    return (
      <input
        autoFocus
        className="mc-inline-input"
        style={inputStyle}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const next = draft.trim()
          if (next && next !== value) onSave(next)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
      />
    )
  }
  return (
    <span
      className={className}
      style={{ cursor: 'text', ...style }}
      title="Click to edit"
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  )
}

export function ManuscriptCard({
  card,
  resources = [],
  referenceDate,
  ground = 'paper',
  activeTimerCardId = null,
  moduleOptions = [],
  phaseOptions = [],
  onClose,
  onToggleDone,
  onStatusChange,
  onChecklistToggle,
  onChecklistAdd,
  onChecklistUpdate,
  onChecklistDelete,
  onHoursChange,
  onStartSession,
  onReschedule,
  onOpenResource,
  onAddResource,
  onRemoveResource,
  onEvidenceAdd,
  onEvidenceUpdate,
  onEvidenceDelete,
  onAddNote,
  onNoteUpdate,
  onDeleteNote,
  onSaveDetails,
  onDeleteCard,
  onResetCard,
}) {
  const g = normaliseGround(ground)
  const pal = paletteFor(g)
  const acc = moduleAccent(card ? { moduleGroup: card.moduleGroup, label: card.moduleGroup } : null, g)
  const RED = pal.red
  const cardBg = g === 'madder' ? '#7d2a20' : g === 'indigo' ? '#1c2340' : pal.leaf
  const btnText = g === 'madder' ? '#57150e' : g === 'indigo' ? '#10152a' : pal.bg
  const line = alpha(pal.ink, 0.25)
  const [stepDraft, setStepDraft] = useState('')
  const [proofDraft, setProofDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [attachId, setAttachId] = useState('')
  const [editing, setEditing] = useState(false)
  const [details, setDetails] = useState(null)
  const dialogRef = useRef(null)

  const resourcesById = useMemo(
    () => new Map(resources.map((resource) => [resource.id, resource])),
    [resources],
  )

  useEffect(() => {
    if (!card) return
    setDetails({
      title: card.title ?? '',
      module: card.module ?? card.moduleGroup ?? '',
      phase: card.phase ?? '',
      priority: card.priority ?? 'Medium',
      status: card.status ?? 'Today',
      startDate: card.startDate ?? '',
      dueDate: card.dueDate ?? '',
      estimatedHours: card.estimatedHours ?? '',
      slotType: card.slotType ?? 'Flex',
      description: card.description ?? '',
      doneCondition: card.doneCondition ?? '',
    })
    setEditing(false)
  }, [card?.id])

  useEffect(() => {
    if (!card || typeof document === 'undefined') return undefined
    const portalHost = getStudyPortalHost()
    const background =
      portalHost?.querySelector(':scope > .study-manuscript-shell, :scope > .srp-shell') ?? null
    const hadInert = background?.hasAttribute('inert') ?? false
    background?.setAttribute('inert', '')
    background?.setAttribute('aria-hidden', 'true')
    document.body.classList.add('modal-open')
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 30)
    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
      if (background && !hadInert) {
        background.removeAttribute('inert')
        background.removeAttribute('aria-hidden')
      }
    }
  }, [card, onClose])

  const portalHost = getStudyPortalHost()
  if (!card || !portalHost || !details) return null

  const steps = Array.isArray(card.checklist) ? card.checklist : []
  const sessions = Array.isArray(card.focusSessions) ? card.focusSessions : []
  const proofs = Array.isArray(card.evidenceEntries) ? card.evidenceEntries : []
  const notes = Array.isArray(card.notes) ? card.notes : []
  const linkedIds = new Set(Array.isArray(card.resourceIds) ? card.resourceIds : [])
  const shelf = [...linkedIds].map((id) => resourcesById.get(id)).filter(Boolean)
  const attachable = resources
    .filter((resource) => !linkedIds.has(resource.id))
    .filter((resource) => !card.moduleGroup || !resource.moduleGroup || resource.moduleGroup === card.moduleGroup)
    .slice(0, 60)
  const est = Number(card.estimatedHours || 0)
  const actual = Number(card.actualHours || 0)
  const frac = est > 0 ? Math.max(0, Math.min(1, actual / est)) : 0
  const running = activeTimerCardId === card.id
  const overdue = referenceDate && card.dueDate && card.dueDate < referenceDate && !card.done

  const commit = (draft, setDraft, fn) => {
    const text = draft.trim()
    if (!text) return
    fn(card.id, text)
    setDraft('')
  }

  function cycleLane() {
    const current = LANE_ORDER.indexOf(card.status)
    onStatusChange?.(card.id, LANE_ORDER[(current + 1) % LANE_ORDER.length])
  }

  function saveDetails() {
    onSaveDetails?.(card.id, {
      ...details,
      estimatedHours: details.estimatedHours === '' ? '' : Number(details.estimatedHours),
    })
    setEditing(false)
  }

  const setD = (key, value) => setDetails((current) => ({ ...current, [key]: value }))

  const label = (children, mt = 16) => (
    <div className="mc-label" style={{ color: pal.sub, marginTop: mt }}>{children}</div>
  )

  function EditableRow({ item, onSave, onDelete }) {
    return (
      <div className="mc-editrow" style={{ borderColor: alpha(pal.ink, 0.08) }}>
        <Diamond color={alpha(pal.ink, 0.4)} size={6} />
        <InlineText
          className="mc-editrow-text"
          style={{ color: pal.ink }}
          inputStyle={{ color: pal.ink, borderColor: alpha(pal.ink, 0.4) }}
          value={item.text}
          onSave={(next) => onSave?.(card.id, item.id, next)}
        />
        {item.at && <span className="mc-editrow-at" style={{ color: pal.sub }}>{formatDate(item.at)}</span>}
        <button type="button" className="mc-mini" style={{ color: RED }} onClick={() => onDelete?.(card.id, item.id)} aria-label="Delete">×</button>
      </div>
    )
  }

  return createPortal(
    <div className="mc-overlay" data-ms-ground={g}>
      <button
        type="button"
        className="mc-scrim"
        aria-label="Close the card"
        onClick={onClose}
        style={{ background: alpha('#2a1207', g === 'paper' ? 0.45 : 0.6) }}
      />

      <section
        ref={dialogRef}
        className="mc-card"
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        tabIndex={-1}
        style={{ background: cardBg, borderColor: alpha(pal.ink, 0.3), color: pal.ink }}
      >
        <div className="mc-frame" style={{ borderColor: alpha(pal.gold, 0.45) }} aria-hidden="true" />

        <div className="mc-scroll">
          <div className="mc-grid">
            {/* LEFT */}
            <div className="mc-main">
              <div className="mc-eyebrow-row">
                <span className="mc-eyebrow" style={{ color: RED }}>
                  Chapter {romanFor(card)} · {card.status || 'Today'}
                </span>
                <span className="mc-phase" style={{ color: pal.sub }}>{card.phase}</span>
              </div>

              <h2 className="mc-title" style={{ color: pal.ink }}>{card.title}</h2>
              {card.description && <p className="mc-why" style={{ color: pal.sub }}>{card.description}</p>}

              {editing ? (
                <div className="mc-details" style={{ borderColor: line }}>
                  <div className="mc-details-label" style={{ color: pal.sub }}>Edit the leaf</div>
                  <label className="mc-field mc-field--wide">
                    <span style={{ color: pal.sub }}>Title</span>
                    <input value={details.title} onChange={(e) => setD('title', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                  </label>
                  <div className="mc-field-grid">
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Chapter</span>
                      <select value={details.module} onChange={(e) => setD('module', e.target.value)} style={{ color: pal.ink, borderColor: line }}>
                        {moduleOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Phase</span>
                      <select value={details.phase} onChange={(e) => setD('phase', e.target.value)} style={{ color: pal.ink, borderColor: line }}>
                        {phaseOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Lane</span>
                      <select value={details.status} onChange={(e) => setD('status', e.target.value)} style={{ color: pal.ink, borderColor: line }}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Priority</span>
                      <select value={details.priority} onChange={(e) => setD('priority', e.target.value)} style={{ color: pal.ink, borderColor: line }}>
                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Slot</span>
                      <select value={details.slotType} onChange={(e) => setD('slotType', e.target.value)} style={{ color: pal.ink, borderColor: line }}>
                        {SLOT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Estimate (h)</span>
                      <input type="number" min="0" step="0.5" value={details.estimatedHours} onChange={(e) => setD('estimatedHours', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Start</span>
                      <input type="date" value={details.startDate} onChange={(e) => setD('startDate', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                    </label>
                    <label className="mc-field">
                      <span style={{ color: pal.sub }}>Due</span>
                      <input type="date" value={details.dueDate} onChange={(e) => setD('dueDate', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                    </label>
                  </div>
                  <label className="mc-field mc-field--wide">
                    <span style={{ color: pal.sub }}>Why it matters</span>
                    <textarea rows={2} value={details.description} onChange={(e) => setD('description', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                  </label>
                  <label className="mc-field mc-field--wide">
                    <span style={{ color: pal.sub }}>Done when</span>
                    <input value={details.doneCondition} onChange={(e) => setD('doneCondition', e.target.value)} style={{ color: pal.ink, borderColor: line }} />
                  </label>
                  <div className="mc-actions">
                    <button type="button" className="mc-btn mc-btn--primary" onClick={saveDetails} style={{ color: btnText, background: pal.ink, borderColor: pal.ink }}>Save</button>
                    <button type="button" className="mc-btn" onClick={() => setEditing(false)} style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {label('The steps')}
                  <div className="mc-steps">
                    {steps.map((step) => (
                      <div key={step.id} className="mc-step" style={{ borderColor: alpha(pal.ink, 0.08) }}>
                        <button
                          type="button"
                          className="mc-step-mark"
                          aria-label={`Toggle ${step.text}`}
                          onClick={() => onChecklistToggle?.(card.id, step.id)}
                          style={{ borderColor: step.done ? acc : alpha(pal.ink, 0.4), background: step.done ? acc : 'transparent' }}
                        />
                        <InlineText
                          className="mc-step-text"
                          style={{ color: pal.ink, textDecoration: step.done ? 'line-through' : 'none', textDecorationColor: alpha(pal.ink, 0.35), opacity: step.done ? 0.55 : 1 }}
                          inputStyle={{ color: pal.ink, borderColor: alpha(pal.ink, 0.4) }}
                          value={step.text}
                          onSave={(next) => onChecklistUpdate?.(card.id, step.id, next)}
                        />
                        <button type="button" className="mc-mini" style={{ color: pal.sub }} onClick={() => onChecklistDelete?.(card.id, step.id)} aria-label="Delete step">×</button>
                      </div>
                    ))}
                    <div className="mc-step mc-step--add">
                      <span className="mc-step-mark mc-step-mark--dashed" style={{ borderColor: alpha(pal.ink, 0.35) }} />
                      <input
                        className="mc-step-input"
                        style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.35) }}
                        placeholder="write a new step — ⏎ to add it"
                        value={stepDraft}
                        onChange={(e) => setStepDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(stepDraft, setStepDraft, onChecklistAdd) } }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="mc-actions">
                <button
                  type="button"
                  className="mc-btn mc-btn--primary"
                  onClick={() => onToggleDone?.(card.id)}
                  title={card.done ? 'Unseal the proof — reopen this card' : 'Seal the proof — mark this card done'}
                  style={{ color: btnText, background: pal.ink, borderColor: pal.ink }}
                >
                  {card.done ? 'Mark undone' : 'Mark done'}
                </button>
                <button
                  type="button"
                  className="mc-btn"
                  onClick={cycleLane}
                  title={`Move lane — currently "${card.status}". Cycles Today · This Week · Deep Work · Backlog · Rescue · Waiting · Done`}
                  style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}
                >
                  Change status
                </button>
                <button
                  type="button"
                  className="mc-btn"
                  onClick={() => onStartSession?.(card.id)}
                  title="Start the glass — begin a focus timer block on this card"
                  style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}
                >
                  Start timer
                </button>
                <button
                  type="button"
                  className="mc-btn"
                  onClick={() => setEditing((v) => !v)}
                  title="Edit the card's title, chapter, phase, dates, and more"
                  style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}
                >
                  {editing ? 'Close edit' : 'Edit details'}
                </button>
                <span className="mc-spacer" />
                <button type="button" className="mc-back" onClick={onClose} style={{ color: pal.sub }} title="Close and return to the board">back to the board ↩</button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="mc-margin" style={{ borderColor: alpha(pal.ink, 0.12) }}>
              <div className="mc-clock-row">
                <span className="mc-clock" style={{ color: RED }}>{running ? 'running' : hoursLabel(actual)}</span>
                <span className="mc-clock-of" style={{ color: pal.sub }}>
                  of {hoursLabel(est)} · due{' '}
                  <button
                    type="button"
                    className="mc-due"
                    style={{ color: overdue ? RED : pal.sub }}
                    onClick={() => {
                      const next = window.prompt('Reschedule to (YYYY-MM-DD):', card.dueDate || '')
                      if (next) onReschedule?.(card.id, next.trim())
                    }}
                  >
                    {formatDate(card.dueDate)}
                  </button>
                </span>
              </div>
              <div className="mc-progress" style={{ background: alpha(pal.ink, 0.12) }}>
                <div style={{ width: `${frac * 100}%`, background: RED }} />
              </div>

              {label('Sessions', 18)}
              {sessions.length === 0 && <p className="mc-empty" style={{ color: pal.sub }}>no sessions yet</p>}
              {sessions.map((session, index) => (
                <div key={index} className="mc-row" style={{ borderColor: alpha(pal.ink, 0.07) }}>
                  <span className="mc-row-date" style={{ color: pal.sub }}>{formatDate(session.at)}</span>
                  <span className="mc-row-note" style={{ color: pal.ink }}>{session.note || 'focus block'}</span>
                  <span className="mc-row-h" style={{ color: pal.sub }}>{hoursLabel((session.minutes || 0) / 60)}</span>
                </div>
              ))}

              {label('Evidence')}
              {proofs.map((proof) => (
                <EditableRow key={proof.id} item={proof} onSave={onEvidenceUpdate} onDelete={onEvidenceDelete} />
              ))}
              {proofs.length === 0 && <p className="mc-empty" style={{ color: pal.sub }}>no evidence yet</p>}
              <input
                className="mc-add-line"
                style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.3) }}
                placeholder="+ add evidence — ⏎"
                value={proofDraft}
                onChange={(e) => setProofDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(proofDraft, setProofDraft, onEvidenceAdd) } }}
              />

              {label('References')}
              {shelf.length === 0 && <p className="mc-empty" style={{ color: pal.sub }}>no references linked yet</p>}
              {shelf.map((resource) => {
                const isVideo = /video|youtube|watch/i.test(`${resource.type} ${resource.group} ${resource.url}`)
                return (
                  <div key={resource.id} className="mc-shelf">
                    <button type="button" className="mc-shelf-open" style={{ color: pal.ink }} onClick={() => onOpenResource?.(resource.id)} title={`Open ${resource.title}`}>
                      <span className="mc-shelf-type" style={{ color: isVideo ? RED : pal.sub, borderColor: alpha(pal.ink, 0.25) }}>{isVideo ? '▶ video' : (resource.type || 'file')}</span>
                      <span className="mc-shelf-title">{resource.title}</span>
                    </button>
                    {onRemoveResource && (
                      <button type="button" className="mc-mini" style={{ color: pal.sub }} aria-label={`Remove ${resource.title}`} onClick={() => onRemoveResource(card.id, resource.id)}>×</button>
                    )}
                  </div>
                )
              })}
              {attachable.length > 0 && onAddResource && (
                <select
                  className="mc-attach"
                  style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}
                  value={attachId}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id) { onAddResource(card.id, id); setAttachId('') }
                  }}
                >
                  <option value="">+ attach a reference…</option>
                  {attachable.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
                </select>
              )}

              {label('Notes')}
              {notes.map((note) => (
                <EditableRow key={note.id} item={note} onSave={onNoteUpdate} onDelete={onDeleteNote} />
              ))}
              {notes.length === 0 && <p className="mc-empty" style={{ color: pal.sub }}>no notes yet</p>}
              <input
                className="mc-add-line"
                style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.3) }}
                placeholder="+ add a note — ⏎"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(noteDraft, setNoteDraft, onAddNote) } }}
              />

              {overdue && (
                <div className="mc-margin-note">
                  <span className="mc-margin-bar" style={{ background: alpha(RED, 0.55) }} />
                  <span className="mc-margin-text" style={{ color: RED }}>overdue since {formatDate(card.dueDate)} — mend it in the next block.</span>
                </div>
              )}

              <div className="mc-tools" style={{ borderColor: alpha(pal.ink, 0.12) }}>
                <label className="mc-tool" style={{ color: pal.sub }}>
                  logged
                  <input type="number" min="0" step="0.5" value={actual || ''} onChange={(e) => onHoursChange?.(card.id, Number(e.target.value) || 0)} style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.25) }} />
                  h
                </label>
                <span className="mc-spacer" />
                {onResetCard && <button type="button" className="mc-tool-link" style={{ color: pal.sub }} onClick={() => onResetCard(card.id)}>reset</button>}
                {onDeleteCard && (
                  <button
                    type="button"
                    className="mc-tool-link"
                    style={{ color: RED }}
                    onClick={() => { if (window.confirm('Delete this leaf for good?')) { onDeleteCard(card.id); onClose?.() } }}
                  >
                    delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>,
    portalHost,
  )
}
