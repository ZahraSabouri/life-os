import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { isDateKey } from '../../code/life-os/shared/calendar.js'

export function studyUuid(source, value) {
  const hash = createHash('sha256').update(`${source}\0${value}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}
const list = value => Array.isArray(value) ? value : []
const date = value => isDateKey(value) ? value : null
const SOURCE = 'summer-rescue-original'
const nativeUrl = url => typeof url === 'string'
  ? url.replace(/^\/(?:apps\/summer-rescue\/)?study-assets\//, '/study-files/assets/').replace(/^\/api\/resources\/file\//, '/study-files/uploads/')
  : ''

export function mergeLegacyCard(base, overlay = {}, resourceModules = new Map()) {
  const edits = overlay.edits || {}, card = { ...base, ...edits }
  const lane = overlay.status ?? edits.status ?? base.status ?? 'Backlog'
  const done = Boolean(overlay.done || lane === 'Done')
  const moduleGroup = edits.moduleGroup ?? edits.module ?? base.moduleGroup
  const evidence = Array.isArray(overlay.evidenceEntries) ? overlay.evidenceEntries
    : typeof overlay.evidence === 'string' && overlay.evidence.trim() ? [{ id: `${base.id}-evidence-legacy-0`, text: overlay.evidence.trim(), at: overlay.updatedAt || '' }] : []
  const checklist = list(edits.checklist ?? base.checklist).map((item, index) => typeof item === 'string'
    ? { id: `${base.id}-check-${index}`, text: item }
    : item && typeof item === 'object' ? { id: item.id || `${base.id}-check-${index}`, text: String(item.text || '').trim() } : null)
    .filter(item => item?.text).map((item, index) => ({ ...item, done: Boolean(overlay.checklist?.[item.id] ?? overlay.checklist?.[index]) }))
  const resourceIds = [...new Set([...list(base.resourceIds), ...list(edits.resourceIds), ...list(overlay.resourceIds)])]
    .filter(id => !list(overlay.hiddenResourceIds).includes(id))
    .filter(id => !resourceModules.has(id) || resourceModules.get(id) === moduleGroup)
  return {
    ...card, moduleGroup, lane: done ? 'Done' : lane, done,
    actualHours: Number(overlay.actualHours ?? 0), checklist,
    notes: list(overlay.notes), evidenceEntries: evidence.map((item, index) => typeof item === 'string'
      ? { id: `${base.id}-evidence-${index}`, text: item, at: '' }
      : { ...item, id: item.id || `${base.id}-evidence-${index}`, text: String(item.text || '') }).filter(item => item.text),
    activity: list(overlay.activity), focusSessions: list(overlay.focusSessions), resourceIds,
    tags: [...new Set([...list(edits.tags ?? base.tags), ...list(overlay.userTags)])],
    source: { base, overlay }
  }
}

export function convertLegacyStudy({ state, modules, cards, resources = [], progress = [], fingerprint }) {
  if (!state || typeof state !== 'object' || !Array.isArray(cards) || !Array.isArray(modules)) throw new Error('Study source is unavailable')
  const settings = state.settings || {}, records = [], warnings = []
  const semesterId = studyUuid(SOURCE, 'semester')
  const moduleIds = new Map(), materialIds = new Map(), cardIds = new Map()
  const push = (entity, source_id, record) => records.push({ entity, source_id, record: { id: studyUuid(`${SOURCE}:${entity}`, source_id), ...record } })
  push('semesters', 'semester', { id: semesterId, title: settings.campaignName || 'Imported Study plan', status: 'active', start_date: date(settings.campaignStart), end_date: date(settings.campaignEnd), data: { sourceName: 'Summer Rescue', sourceSettings: settings } })
  const allModules = [...modules]
  const names = new Set(allModules.flatMap(module => [module.id, module.moduleGroup, module.code, module.label]))
  for (const name of [...list(settings.customModules), ...[...cards, ...list(state.addedCards)].map(card => (state.cards?.[card.id]?.edits?.moduleGroup ?? state.cards?.[card.id]?.edits?.module ?? card.moduleGroup ?? card.module))]) {
    const label = typeof name === 'string' ? name : name?.label || name?.name
    if (label && !names.has(label)) { allModules.push({ id: label, moduleGroup: label, label }); names.add(label) }
  }
  for (const module of allModules) {
    const id = studyUuid(`${SOURCE}:modules`, module.id)
    for (const alias of [module.id, module.moduleGroup, module.code, module.label]) if (alias) moduleIds.set(alias, id)
    const note = state.moduleNotes?.[module.id] ?? state.moduleNotes?.[module.moduleGroup] ?? ''
    push('modules', module.id, { id, semester_id: semesterId, title: module.label || module.title || module.id, status: 'active',
      data: { ...module, code: module.code || '', note, enabled: !(module.id === 'mat700' && settings.mat700Active === false), sourceId: module.id } })
  }
  const byResource = new Map(resources.map(resource => [resource.id, resource]))
  for (const resource of [...list(state.uploadedResources)]) byResource.set(resource.id, resource)
  const resourceModules = new Map()
  for (const module of modules) for (const resource of list(module.resources)) resourceModules.set(resource.id, module.moduleGroup)
  for (const resource of byResource.values()) {
    const id = studyUuid(`${SOURCE}:materials`, resource.id)
    materialIds.set(resource.id, id)
    const resourceProgress = state.resourceProgress?.[resource.id] || {}
    push('materials', resource.id, { id, title: resource.title || resource.fileName || resource.id, status: 'active', semester_id: semesterId,
      module_id: moduleIds.get(resource.moduleId ?? resource.moduleKey ?? resource.moduleGroup) || moduleIds.get(resourceModules.get(resource.id)) || null,
      data: { ...resource, ...resourceProgress, source: resource, sourceId: resource.id, url: nativeUrl(resource.url), reviewed: Boolean(resourceProgress.reviewed), lastOpenedAt: resourceProgress.lastOpenedAt || '', recent: list(state.recentResourceIds).includes(resource.id) } })
  }
  const mergedCards = [...cards, ...list(state.addedCards)].filter(card => card?.id).map(base => mergeLegacyCard(base, state.cards?.[base.id], resourceModules))
  for (const card of mergedCards) {
    const id = studyUuid(`${SOURCE}:cards`, card.id)
    cardIds.set(card.id, id)
    const resourceIds = card.resourceIds.map(resource => materialIds.get(resource)).filter(Boolean)
    if (resourceIds.length !== card.resourceIds.length) warnings.push('Some saved resource links have no matching material definition; original IDs remain preserved.')
    const start = date(card.startDate), due = date(card.dueDate)
    if (start && due && due < start) throw new Error('A Study card has a due date before its start date. Review it in the source before importing.')
    push('cards', card.id, { id, title: card.title || 'Study card', status: card.done ? 'done' : card.lane === 'Waiting / Blocked' ? 'blocked' : 'planned',
      semester_id: semesterId, module_id: moduleIds.get(card.moduleGroup) || null, start_date: start, end_date: due,
      data: { ...card, sourceId: card.id, resourceIds, sourceResourceIds: card.resourceIds, estimatedHours: Number(card.estimatedHours || 0) } })
  }
  for (const [module, value] of Object.entries(settings.moduleExamDates || {})) {
    if (!date(value)) { warnings.push('An invalid recorded exam date was preserved in settings but not scheduled.'); continue }
    push('assessments', `exam:${module}`, { title: `${allModules.find(row => row.id === module)?.label || module} exam`, status: 'planned', semester_id: semesterId,
      module_id: moduleIds.get(module) || null, start_date: value, end_date: value, data: { type: 'exam', confirmedDate: true } })
  }
  for (const event of progress) {
    const sourceId = event.id || createHash('sha256').update(JSON.stringify(event)).digest('hex')
    push('progress', sourceId, { title: event.eventType || 'Study activity', status: 'active', semester_id: semesterId,
      card_id: cardIds.get(event.entityId) || null, data: { ...event, kind: 'legacy-event', source: event } })
  }
  const settingRows = {
    preferences: { ...settings, activeSemesterId: semesterId, source: settings },
    notifications: { items: Object.values(state.notifications || {}) },
    snapshots: { items: state.snapshots || {} },
    sourceArchive: { state, sourceName: SOURCE }
  }
  for (const [key, data] of Object.entries(settingRows)) push('settings', key, { title: key, status: 'active', data: { ...data, key } })
  const counts = Object.fromEntries(['semesters','modules','cards','assessments','sessions','materials','progress','settings'].map(entity => [entity, records.filter(record => record.entity === entity).length]))
  counts.checklistItems = mergedCards.reduce((total, card) => total + card.checklist.length, 0)
  counts.cardMaterialLinks = mergedCards.reduce((total, card) => total + card.resourceIds.length, 0)
  counts.notes = mergedCards.reduce((total, card) => total + card.notes.length, 0)
  counts.evidence = mergedCards.reduce((total, card) => total + card.evidenceEntries.length, 0)
  return { source: SOURCE, fingerprint, records, counts, warnings: [...new Set(warnings)] }
}

export async function readLegacyStudy(projectRoot) {
  const root = path.join(projectRoot, 'summer-rescue-plan-app')
  const raw = await fs.readFile(path.join(root, 'local-data/summer-rescue-tracker-state.json'), 'utf8')
  const payload = JSON.parse(raw.replace(/^\uFEFF/, ''))
  const sources = ['baseCards.js', 'studyModules.js', 'amlVideoPlan.js', 'cardResources.js']
  const imported = await Promise.all(sources.map(name => import(pathToFileURL(path.join(root, 'src/data', name)).href)))
  const [base, moduleData, aml, links] = imported
  const cards = links.attachCardResourceLinks(aml.applyAmlVideoStudyPlan(base.baseCards), moduleData.STUDY_MODULES)
  let resources = [], index = '', log = ''
  try { index = await fs.readFile(path.join(root, 'local-data/resources/resources.json'), 'utf8'); const parsed = JSON.parse(index); resources = Array.isArray(parsed) ? parsed : list(parsed.resources) } catch (error) { if (error.code !== 'ENOENT') throw error }
  try { log = await fs.readFile(path.join(root, 'local-data/progress-log.ndjson'), 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const progress = log.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  const hash = createHash('sha256').update(raw).update(index).update(log)
  for (const name of sources) hash.update(await fs.readFile(path.join(root, 'src/data', name)))
  return convertLegacyStudy({ state: payload.state, modules: moduleData.STUDY_MODULES, cards,
    resources: [...moduleData.STUDY_MODULES.flatMap(module => list(module.resources)), ...resources], progress, fingerprint: hash.digest('hex') })
}
