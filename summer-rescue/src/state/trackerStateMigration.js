// The shape of what the app saves for one semester, and how a saved state is brought to
// that shape when it is loaded. Nothing here knows about a particular semester or module:
// a new semester starts from createInitialTrackerState with the semester's own dates.
import { emptyGeneralKnowledge, normaliseGeneralKnowledge } from '../utils/generalKnowledge.js'
import { emptyKnowledge, normaliseKnowledge } from '../utils/knowledge.js'
import { normaliseResourceProgressMap } from '../utils/resourceProgress.js'
import { semesterWindow } from '../data/plan.js'

export const TRACKER_STATE_VERSION = 9

function nowIso() {
  return new Date().toISOString()
}

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(day, amount) {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

// The planning date never sits in the past: today, or a later date the owner chose.
function planningReferenceDate(value) {
  const date = typeof value === 'string' ? value.slice(0, 10) : ''
  const today = localToday()
  return ISO_DAY.test(date) && date > today ? date : today
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function normaliseUploadedResource(resource) {
  if (!resource || typeof resource !== 'object' || !resource.id || !resource.url) return null
  return {
    id: String(resource.id),
    moduleId: String(resource.moduleId ?? ''),
    moduleKey: String(resource.moduleKey ?? ''),
    moduleGroup: String(resource.moduleGroup ?? ''),
    group: String(resource.group ?? 'Uploaded'),
    title: String(resource.title ?? resource.fileName ?? 'Uploaded resource').trim() || 'Uploaded resource',
    path: String(resource.path ?? resource.fileName ?? ''),
    type: String(resource.type ?? 'FILE'),
    viewer: String(resource.viewer ?? 'file'),
    url: String(resource.url),
    description: String(resource.description ?? ''),
    tags: Array.isArray(resource.tags) ? resource.tags.map((tag) => String(tag)).filter(Boolean) : [],
    priority: resource.priority === 'high' ? 'high' : 'normal',
    uploadedAt: String(resource.uploadedAt ?? ''),
    size: Number(resource.size ?? 0),
  }
}

function normaliseUploadedResources(resources) {
  if (!Array.isArray(resources)) return []
  return resources.map(normaliseUploadedResource).filter(Boolean)
}

// The window the semester is planned in: its own dates when it has them.
function defaultWindow() {
  const today = localToday()
  const start = ISO_DAY.test(semesterWindow.start) ? semesterWindow.start : today
  const end = ISO_DAY.test(semesterWindow.end) && semesterWindow.end >= start ? semesterWindow.end : addDays(start, 112)
  return { start, end }
}

export function createInitialTrackerState(referenceDate = localToday()) {
  const window = defaultWindow()
  return {
    version: TRACKER_STATE_VERSION,
    cards: {},
    addedCards: [],
    moduleNotes: {},
    knowledge: emptyKnowledge(),
    generalKnowledge: emptyGeneralKnowledge(),
    notifications: {},
    resourceProgress: {},
    uploadedResources: [],
    recentResourceIds: [],
    snapshots: {},
    dayLogs: {},
    focusRewards: null,
    settings: {
      referenceDate: planningReferenceDate(referenceDate),
      theme: 'light',
      campaignStart: window.start,
      campaignEnd: window.end,
      // The first day exams can fall on, when the owner knows it. Empty until she sets it.
      examWindowStart: '',
      moduleExamDates: {},
      customModules: [],
      customPhases: [],
      lastExportedAt: null,
      saveHintDismissed: false,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function migrateTrackerState(value) {
  const fallback = createInitialTrackerState()
  if (!value || typeof value !== 'object') return fallback

  const previousSettings = plainObject(value.settings)
  const dayLogs = Object.fromEntries(
    Object.entries(plainObject(value.dayLogs)).map(([date, log]) => [
      date,
      { ...plainObject(log), blocks: { ...plainObject(log?.blocks) } },
    ]),
  )
  const addedCards = (Array.isArray(value.addedCards) ? value.addedCards : [])
    .filter((card) => card && typeof card === 'object' && card.id)
    .map((card, index) => ({ ...card, number: `A${index + 1}`, sortOrder: 1000 + index }))

  return {
    ...fallback,
    ...value,
    version: TRACKER_STATE_VERSION,
    cards: { ...plainObject(value.cards) },
    addedCards,
    moduleNotes: plainObject(value.moduleNotes),
    knowledge: normaliseKnowledge(value.knowledge),
    generalKnowledge: normaliseGeneralKnowledge(value.generalKnowledge),
    notifications: { ...plainObject(value.notifications) },
    resourceProgress: normaliseResourceProgressMap(value.resourceProgress),
    uploadedResources: normaliseUploadedResources(value.uploadedResources),
    recentResourceIds: Array.isArray(value.recentResourceIds) ? value.recentResourceIds.slice(0, 8) : [],
    snapshots: plainObject(value.snapshots),
    dayLogs,
    focusRewards:
      value.focusRewards && typeof value.focusRewards === 'object' && !Array.isArray(value.focusRewards)
        ? plainObject(value.focusRewards)
        : null,
    settings: {
      ...fallback.settings,
      ...previousSettings,
      referenceDate: planningReferenceDate(previousSettings.referenceDate || localToday()),
      campaignStart: ISO_DAY.test(previousSettings.campaignStart ?? '') ? previousSettings.campaignStart : fallback.settings.campaignStart,
      campaignEnd: ISO_DAY.test(previousSettings.campaignEnd ?? '') ? previousSettings.campaignEnd : fallback.settings.campaignEnd,
      examWindowStart: ISO_DAY.test(previousSettings.examWindowStart ?? '') ? previousSettings.examWindowStart : '',
      moduleExamDates: plainObject(previousSettings.moduleExamDates),
      customModules: Array.isArray(previousSettings.customModules) ? previousSettings.customModules : [],
      customPhases: Array.isArray(previousSettings.customPhases) ? previousSettings.customPhases : [],
    },
    updatedAt: value.updatedAt ?? nowIso(),
  }
}
