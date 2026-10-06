// Copies a module, with its whole planning, into a new time frame.
// The copy is independent: its own module, its own cards, its own classes and assessments.
// Every date moves by the same number of days. Progress is not copied.
import { randomUUID } from 'node:crypto'
import { HubError } from './store.mjs'

const plain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const list = (value) => (Array.isArray(value) ? value : [])
const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

export function shiftDay(value, days) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return value
  const moved = new Date(Date.parse(`${value.slice(0, 10)}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
  return moved + value.slice(10)
}

function shiftInstant(value, days) {
  if (!value || !Number.isFinite(Date.parse(value))) return value ?? null
  // Keep the London clock time: move the calendar day, then rebuild the instant in London.
  const zoned = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  const parts = Object.fromEntries(zoned.formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  const day = shiftDay(`${parts.year}-${parts.month}-${parts.day}`, days)
  for (const offset of ['+01:00', '+00:00']) {
    const candidate = new Date(`${day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`)
    const check = Object.fromEntries(zoned.formatToParts(candidate).map((part) => [part.type, part.value]))
    if (check.hour === parts.hour && `${check.year}-${check.month}-${check.day}` === day) return candidate.toISOString()
  }
  return new Date(Date.parse(value) + days * 86_400_000).toISOString()
}

const earliest = (values) => values.filter(isDay).sort()[0] ?? ''

// Pure part: what the copied cards look like. `cards` are the app's own card objects.
export function copyCards(cards, { days, moduleGroup, prefix = 'copy' }) {
  const idMap = new Map()
  const copies = cards.map((card, index) => {
    const id = `${prefix}-${randomUUID()}`
    idMap.set(card.id, id)
    const { status: _status, done: _done, actualHours: _hours, progressPercent: _progress, evidence: _evidence, evidenceEntries: _entries, notes: _notes, activity: _activity, focusSessions: _focus, userTags: _userTags, updatedAt: _updated, recurrenceKey: _recurrence, ...definition } = card
    return {
      ...definition,
      id,
      number: `A${index + 1}`,
      module: moduleGroup,
      moduleGroup,
      status: 'Backlog',
      custom: true,
      sourceList: 'Copied module',
      startDate: shiftDay(card.startDate, days),
      dueDate: shiftDay(card.dueDate, days),
      dueDateTime: shiftDay(card.dueDateTime, days),
      planningWindowStart: shiftDay(card.planningWindowStart, days),
      planningWindowEnd: shiftDay(card.planningWindowEnd, days),
      checklist: list(card.checklist).map((item) => (typeof item === 'string' ? item : String(item?.text ?? ''))).filter(Boolean),
      tags: list(card.tags).filter((tag) => !/^history$|^pre-/.test(tag)),
      createdAt: new Date().toISOString(),
    }
  })
  return { copies, idMap }
}

export async function duplicateModule({ store, repository, moduleRow, body }) {
  if (!plain(body)) throw new HubError(400, 'Say where the copy goes')
  const target = await store.semesterRow(String(body.semester_id ?? moduleRow.semester_id))
  const source = await store.workspace(moduleRow.semester_id)
  const definition = source.modules.find((module) => module.rowId === moduleRow.id)
  if (!definition) throw new HubError(404, 'That module no longer exists')
  const sourceState = (await store.readState(moduleRow.semester_id)).payload?.state ?? {}
  const overlays = plain(sourceState.cards) ? sourceState.cards : {}
  const sourceCards = [...list(source.plan.baseCards), ...list(sourceState.addedCards)]
    .filter((card) => card?.id && !overlays[card.id]?.removed)
    .map((card) => ({ ...card, ...(plain(overlays[card.id]?.edits) ? overlays[card.id].edits : {}) }))
    .filter((card) => (card.moduleGroup ?? card.module) === definition.moduleGroup)

  const workspace = await repository.workspace({ historyLimit: 1 })
  const sessions = workspace.sessions.filter((row) => row.module_id === moduleRow.id)
  const assessments = workspace.assessments.filter((row) => row.module_id === moduleRow.id && !String(row.provenance?.source ?? '').startsWith('hub:'))
  const materials = workspace.materials.filter((row) => row.module_id === moduleRow.id)

  // The new time frame: every date moves so the module's first date lands on the chosen start.
  const firstDay = earliest([...sourceCards.flatMap((card) => [card.startDate, card.dueDate]), ...sessions.map((row) => row.start_date || String(row.start_at ?? '').slice(0, 10)), ...assessments.map((row) => row.start_date || row.end_date)])
  let days = Number.isInteger(body.shift_days) ? body.shift_days : 0
  if (isDay(body.start_date)) {
    if (!firstDay) days = 0
    else days = Math.round((Date.parse(`${body.start_date}T12:00:00Z`) - Date.parse(`${firstDay}T12:00:00Z`)) / 86_400_000)
  }
  if (!Number.isInteger(days) || Math.abs(days) > 3660) throw new HubError(400, 'Choose a start date within ten years of the original')

  const targetWorkspace = target.id === moduleRow.semester_id ? source : await store.workspace(target.id)
  const title = String(body.title ?? '').trim().slice(0, 300) || `${definition.title} (copy)`
  if (targetWorkspace.modules.some((module) => module.moduleGroup.toLowerCase() === title.toLowerCase())) throw new HubError(409, 'That semester already has a module with this name. Give the copy another name.')
  let moduleId = slug(body.code ?? definition.code) || slug(title) || `module-${randomUUID().slice(0, 8)}`
  while (targetWorkspace.modules.some((module) => module.id === moduleId)) moduleId = `${moduleId}-${randomUUID().slice(0, 4)}`
  const { rowId: _rowId, rowRevision: _rowRevision, status: _status, ...copied } = definition
  const newDefinition = { ...copied, id: moduleId, viewId: moduleId, moduleGroup: title, title, label: title, code: String(body.code ?? definition.code ?? '').trim().slice(0, 60) }

  const created = await repository.create('modules', { title, status: 'active', semester_id: target.id, data: { code: newDefinition.code, order: targetWorkspace.modules.length, definition: newDefinition, copiedFrom: moduleRow.id } })

  // Cards go into the target semester's saved state, as cards the owner added.
  const { copies } = copyCards(sourceCards, { days, moduleGroup: title })
  const targetState = (await store.readState(target.id)).payload?.state
  const nextState = plain(targetState) ? { ...targetState } : null
  if (copies.length) {
    const base = nextState ?? { version: 9, cards: {}, addedCards: [], settings: {} }
    base.addedCards = [...list(base.addedCards), ...copies]
    base.cards = { ...(plain(base.cards) ? base.cards : {}), ...Object.fromEntries(copies.map((card) => [card.id, { status: 'Backlog', done: false, activity: [{ id: `log-${randomUUID()}`, at: new Date().toISOString(), action: 'Copied with its module', details: card.title }] }])) }
    base.updatedAt = new Date().toISOString()
    await store.replaceWorkspace(target.id, { state: base, reason: `copy of module ${definition.title}`, writerId: 'module-copy' })
  }

  // Knowledge notes that came with the plan follow the module.
  const seeds = list(source.plan.knowledgeSeeds).filter((note) => note?.moduleId === definition.id)
  if (seeds.length) {
    const targetPlan = target.id === moduleRow.semester_id ? source.plan : targetWorkspace.plan
    await store.updatePlan(target.id, { knowledgeSeeds: [...list(targetPlan.knowledgeSeeds), ...seeds.map((note) => ({ ...note, id: `${note.id}-${moduleId}`, moduleId }))] })
  }

  const shiftRecord = (row) => ({
    title: row.title, status: ['done', 'completed', 'missed', 'cancelled'].includes(row.status) ? 'planned' : row.status,
    semester_id: target.id, module_id: created.id,
    start_date: shiftDay(row.start_date, days) ?? null, end_date: shiftDay(row.end_date, days) ?? null,
    start_at: shiftInstant(row.start_at, days), end_at: shiftInstant(row.end_at, days),
  })
  for (const row of sessions) await repository.create('sessions', { ...shiftRecord(row), data: { ...row.data, copiedFrom: row.id } })
  for (const row of assessments) {
    const { result: _result, ...data } = row.data ?? {}
    await repository.create('assessments', { ...shiftRecord(row), data: { ...data, copiedFrom: row.id } })
  }
  for (const row of materials) await repository.create('materials', { title: row.title, status: 'active', semester_id: target.id, module_id: created.id, data: { ...row.data, reviewed: false, lastOpenedAt: '', copiedFrom: row.id } })

  return { module: created, definition: { ...newDefinition, rowId: created.id, rowRevision: created.revision }, shifted_days: days, copied: { cards: copies.length, sessions: sessions.length, assessments: assessments.length, materials: materials.length, notes: seeds.length } }
}
