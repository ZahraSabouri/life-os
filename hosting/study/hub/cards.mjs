// The Study hub app saves one state per semester. These functions turn the cards inside
// that state into ordinary Study records, so the calendar and the rest of Life OS can read
// them. The state stays the source; the records are derived from it on every save.
import { createHash } from 'node:crypto'

export function hubUuid(scope, value) {
  const hash = createHash('sha256').update(`${scope}\0${value}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

const list = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
const civilDate = (value) => {
  const day = typeof value === 'string' ? value.slice(0, 10) : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day ? day : null
}

function checklistItems(cardId, items) {
  return list(items).map((item, index) => {
    if (typeof item === 'string') return { id: `${cardId}-check-${index}`, text: item }
    if (item && typeof item === 'object') return { id: item.id || `${cardId}-check-${index}`, text: String(item.text ?? '').trim() }
    return null
  }).filter((item) => item?.text)
}

// The same merge the app does in its browser state: what was prepared, then the owner's
// edits, then her progress.
export function mergeHubCard(base, overlay = {}) {
  const edits = plain(overlay.edits)
  const ticks = plain(overlay.checklist)
  const status = overlay.status ?? edits.status ?? base.status ?? 'Backlog'
  const done = Boolean(overlay.done || status === 'Done')
  return {
    ...base,
    ...edits,
    moduleGroup: edits.moduleGroup ?? edits.module ?? base.moduleGroup ?? '',
    status: done ? 'Done' : status,
    done,
    actualHours: Number(overlay.actualHours ?? 0) || 0,
    progressPercent: done ? 100 : Math.max(0, Math.min(100, Number(overlay.progressPercent ?? 0) || 0)),
    checklist: checklistItems(base.id, edits.checklist ?? base.checklist).map((item, index) => ({ ...item, done: Boolean(ticks[item.id] ?? ticks[index]) })),
    notes: list(overlay.notes),
    evidenceEntries: list(overlay.evidenceEntries),
    focusSessions: list(overlay.focusSessions),
    tags: [...new Set([...list(edits.tags ?? base.tags), ...list(overlay.userTags)])],
    updatedAt: overlay.updatedAt ?? base.updatedAt ?? '',
  }
}

export function hubCards(plan, state) {
  const overlays = plain(state?.cards)
  const seen = new Set()
  const cards = []
  for (const base of [...list(plan?.baseCards), ...list(state?.addedCards)]) {
    if (!base?.id || seen.has(base.id) || overlays[base.id]?.removed) continue
    seen.add(base.id)
    cards.push(mergeHubCard(base, overlays[base.id]))
  }
  return cards
}

// One Study record per card. `moduleIds` maps the app's module group name to the module row.
export function cardRecords({ semesterId, plan, state, moduleIds = new Map() }) {
  return hubCards(plan, state).map((card) => {
    const start = civilDate(card.startDate)
    const due = civilDate(card.dueDate)
    return {
      source_id: String(card.id),
      record: {
        id: hubUuid(`hub:${semesterId}:cards`, card.id),
        title: String(card.title || 'Study card').slice(0, 2000),
        status: card.done ? 'done' : card.status === 'Waiting / Blocked' ? 'blocked' : 'planned',
        semester_id: semesterId,
        module_id: moduleIds.get(card.moduleGroup) ?? null,
        start_date: start && due && due < start ? null : start,
        end_date: due,
        data: {
          hubCardId: String(card.id),
          moduleGroup: card.moduleGroup,
          lane: card.status,
          done: card.done,
          phase: card.phase ?? '',
          priority: card.priority ?? '',
          slotType: card.slotType ?? '',
          slotLabel: card.slotLabel ?? '',
          estimatedHours: Number(card.estimatedHours ?? 0) || 0,
          actualHours: card.actualHours,
          progressPercent: card.progressPercent,
          description: card.description ?? '',
          doneCondition: card.doneCondition ?? '',
          evidenceRequirement: card.evidenceRequirement ?? '',
          tags: card.tags,
          checklist: card.checklist,
          notes: card.notes,
          evidenceEntries: card.evidenceEntries,
          focusSessions: card.focusSessions,
          resourceIds: list(card.resourceIds),
        },
      },
    }
  })
}

// Exam dates the owner recorded per module become assessment records.
export function examRecords({ semesterId, state, modules = [] }) {
  const dates = plain(state?.settings?.moduleExamDates)
  return modules.flatMap((module) => {
    const day = civilDate(dates[module.definition?.id])
    if (!day) return []
    return [{
      source_id: `exam:${module.definition.id}`,
      record: {
        id: hubUuid(`hub:${semesterId}:assessments`, `exam:${module.definition.id}`),
        title: `${module.title} exam`.slice(0, 2000),
        status: 'planned',
        semester_id: semesterId,
        module_id: module.id,
        start_date: day,
        end_date: day,
        data: { type: 'exam', hubExam: true },
      },
    }]
  })
}

export function stateSummary(state) {
  const overlays = Object.values(plain(state?.cards))
  return {
    addedCards: list(state?.addedCards).length,
    cardRecords: overlays.length,
    done: overlays.filter((card) => card?.done || card?.status === 'Done').length,
    bytes: Buffer.byteLength(JSON.stringify(state ?? {})),
  }
}
