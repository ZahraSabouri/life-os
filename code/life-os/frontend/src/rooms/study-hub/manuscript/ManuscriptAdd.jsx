import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStudyPortalHost } from '../studyPortal.js'
import { MODULE_OPTIONS, PHASE_OPTIONS, PRIORITY_OPTIONS, SLOT_OPTIONS, STATUS_OPTIONS } from '../data/constants'
import { alpha, moduleAccent, normaliseGround, paletteFor } from './ManuscriptPrimitives'
import './card.css'

const TAG_OPTIONS = ['exam', 'evidence', 'rescue', 'gitlab', 'admin', 'insurance', 'date-watch']

const emptyCard = {
  title: '',
  module: 'Admin',
  phase: 'Phase 2',
  status: 'Today',
  priority: 'Medium',
  slotType: 'Flex',
  slotLabel: '',
  startDate: '',
  dueDate: '',
  estimatedHours: '1',
  description: '',
  checklist: '',
  evidenceRequirement: '',
  doneCondition: '',
  tags: '',
}

export function ManuscriptAdd({
  open,
  onClose,
  onAddCard,
  ground = 'paper',
  moduleOptions = MODULE_OPTIONS,
  phaseOptions = PHASE_OPTIONS,
}) {
  const g = normaliseGround(ground)
  const pal = paletteFor(g)
  const RED = pal.red
  const cardBg = g === 'madder' ? '#7d2a20' : g === 'indigo' ? '#1c2340' : pal.leaf
  const btnText = g === 'madder' ? '#57150e' : g === 'indigo' ? '#10152a' : pal.bg
  const [form, setForm] = useState(emptyCard)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const portalHost = getStudyPortalHost()
  if (!open || !portalHost) return null

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const tagSet = new Set(String(form.tags).split(',').map((tag) => tag.trim()).filter(Boolean))

  function toggleTag(tag) {
    const next = new Set(tagSet)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    update('tags', [...next].join(', '))
  }

  function submit() {
    if (!form.title.trim()) return
    const id = onAddCard?.(form)
    setForm(emptyCard)
    onClose?.(id)
  }

  function Chip({ label, on, color, onClick }) {
    const c = color || pal.ink
    return (
      <button
        type="button"
        className="mc-chip"
        onClick={onClick}
        style={{
          borderColor: on ? c : alpha(pal.ink, 0.25),
          background: on ? alpha(c, g === 'paper' ? 0.1 : 0.16) : 'transparent',
        }}
      >
        <span
          className="mc-chip-dot"
          style={{ background: on ? c : 'transparent', borderColor: on ? c : alpha(pal.ink, 0.35) }}
        />
        <span style={{ color: on ? pal.ink : pal.sub, fontWeight: on ? 600 : 400 }}>{label}</span>
      </button>
    )
  }

  const label = (children, mt = 15) => (
    <div className="mc-add-label" style={{ color: pal.sub, marginTop: mt }}>{children}</div>
  )

  return createPortal(
    <div className="mc-overlay" data-ms-ground={g}>
      <button
        type="button"
        className="mc-scrim"
        aria-label="Discard the new leaf"
        onClick={() => onClose?.()}
        style={{ background: alpha('#2a1207', g === 'paper' ? 0.45 : 0.6) }}
      />

      <section
        className="mc-card mc-add"
        role="dialog"
        aria-modal="true"
        aria-label="Add a leaf"
        style={{ background: cardBg, borderColor: alpha(pal.ink, 0.3), color: pal.ink }}
      >
        <div className="mc-frame" style={{ borderColor: alpha(pal.gold, 0.45) }} aria-hidden="true" />

        <div className="mc-scroll">
          <div className="mc-add-body">
            <div className="mc-eyebrow-row">
              <span className="mc-eyebrow" style={{ color: RED }}>A new leaf</span>
              <span className="mc-phase" style={{ color: pal.sub }}>esc to close · ⏎ to write</span>
            </div>

            <div className="mc-add-title" style={{ borderColor: alpha(pal.ink, 0.35) }}>
              <input
                autoFocus
                className="mc-add-title-input"
                style={{ color: pal.ink }}
                placeholder="write the leaf — e.g. TS — mock paper §B, timed, closed book"
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submit()
                  }
                }}
              />
            </div>
            <p className="mc-add-hint" style={{ color: pal.sub }}>
              everything below is already guessed; tap to correct.
            </p>

            <div className="mc-add-grid">
              <div>
                {label('Chapter', 8)}
                <div className="mc-chips">
                  {moduleOptions.map((module) => (
                    <Chip
                      key={module}
                      label={module}
                      color={moduleAccent({ moduleGroup: module, label: module }, g)}
                      on={form.module === module}
                      onClick={() => update('module', module)}
                    />
                  ))}
                </div>
                {label('Lane')}
                <div className="mc-chips">
                  {STATUS_OPTIONS.map((lane) => (
                    <Chip
                      key={lane}
                      label={lane}
                      color={lane === 'Rescue Lane' ? RED : undefined}
                      on={form.status === lane}
                      onClick={() => update('status', lane)}
                    />
                  ))}
                </div>
                {label('Slot · when it fits the day')}
                <div className="mc-chips">
                  {SLOT_OPTIONS.map((slot) => (
                    <Chip key={slot} label={slot} on={form.slotType === slot} onClick={() => update('slotType', slot)} />
                  ))}
                </div>
              </div>

              <div>
                {label('Phase', 8)}
                <div className="mc-chips">
                  {phaseOptions.map((phase) => (
                    <Chip key={phase} label={phase} on={form.phase === phase} onClick={() => update('phase', phase)} />
                  ))}
                </div>
                {label('Priority')}
                <div className="mc-chips">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <Chip
                      key={priority}
                      label={priority}
                      color={priority === 'Critical' ? RED : undefined}
                      on={form.priority === priority}
                      onClick={() => update('priority', priority)}
                    />
                  ))}
                </div>
                {label('Estimate · due')}
                <div className="mc-add-estimate">
                  <input
                    className="mc-add-num"
                    style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.35) }}
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimatedHours}
                    onChange={(event) => update('estimatedHours', event.target.value)}
                  />
                  <span style={{ color: pal.sub }}>h ·</span>
                  <input
                    className="mc-add-date"
                    style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.35) }}
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => update('dueDate', event.target.value)}
                  />
                </div>
              </div>
            </div>

            {label('Tags', 16)}
            <div className="mc-chips">
              {TAG_OPTIONS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  color={tag === 'rescue' ? RED : undefined}
                  on={tagSet.has(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>

            {label('The proof it will leave', 18)}
            <input
              className="mc-add-proof"
              style={{ color: pal.ink, borderColor: alpha(pal.ink, 0.35) }}
              placeholder="e.g. marked mock §B + error list, photographed"
              value={form.evidenceRequirement}
              onChange={(event) => update('evidenceRequirement', event.target.value)}
            />

            <div className="mc-actions">
              <button
                type="button"
                className="mc-btn mc-btn--primary"
                onClick={submit}
                disabled={!form.title.trim()}
                style={{ color: btnText, background: pal.ink, borderColor: pal.ink, opacity: form.title.trim() ? 1 : 0.5 }}
              >
                Write the leaf
              </button>
              <button
                type="button"
                className="mc-btn"
                onClick={() => onClose?.()}
                style={{ color: pal.sub, borderColor: alpha(pal.ink, 0.3) }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>,
    portalHost,
  )
}
