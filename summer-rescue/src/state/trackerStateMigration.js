import { emptyGeneralKnowledge, normaliseGeneralKnowledge } from '../utils/generalKnowledge.js'
import { emptyKnowledge, normaliseKnowledge } from '../utils/knowledge.js'
import { normaliseResourceProgressMap } from '../utils/resourceProgress.js'

export const TRACKER_STATE_VERSION = 9
export const PLAN_REVISION = '2026-08-08-dual-module-ten-day-sprint-v1'
export const DEFAULT_CAMPAIGN_START = '2026-08-08'
export const DEFAULT_CAMPAIGN_END = '2026-08-25'
export const DEFAULT_EXAM_WINDOW_START = '2026-08-18'
const PREVIOUS_ZERO_BASED_REVISION_PREFIX = '2026-07-16-zero-based-32-day-plan-v'
const PREVIOUS_JULY20_REVISION = '2026-07-20-fresh-start-plan-v1'
const PREVIOUS_JULY25_REVISION = '2026-07-25-illness-interview-reset-v1'
const PREVIOUS_AUGUST3_REVISION = '2026-08-03-confirmed-exam-date-reset-v1'
const HISTORY_DATE = '2026-07-19'
const AML_LAUNCH_CARD_ID = 'card-001'
const AML_LAUNCH_RESOURCE_IDS = new Set([
  'aml-study-notes-lab-1-ex1-study-notes',
  'aml-study-notes-lab-1-ex2-study-notes',
  'aml-session-1-s1-slides',
  'aml-session-1-lab-1-sheet',
  'aml-session-1-lab-1-ex1-notebook',
  'aml-session-1-lab-1-ex2-notebook',
  'aml-video-ubc-1-0-ml-introduction',
  'aml-video-ubc-2-1-ml-terminology',
  'aml-video-course-s1-workflow',
])

const CONFIRMED_MODULE_EXAM_DATES = {
  aml: '2026-08-26',
  'time-series': '2026-08-19',
  mat700: '2026-08-18',
}

// These former base cards have real work in the live tracker. The new plan no
// longer schedules them, so they are materialised as added history cards during
// the one-time 8 August migration instead of becoming invisible orphan state.
const AUGUST8_RETIRED_HISTORY_CARDS = [
  {
    id: 'card-002',
    title: 'HISTORY — Time Series Pack A: L1 map and core L2 smoothing',
    moduleGroup: 'Time Series',
    phase: 'Phase 0',
    startDate: '2026-08-06',
    dueDate: '2026-08-06',
    estimatedHours: 0,
    priority: 'High',
    description: 'Completed or partially logged work preserved from the plan active before the 8 August sprint.',
    checklist: [],
    evidence: 'Preserved tracker evidence and activity log.',
    done: 'Historical work remains visible and unchanged.',
    tags: ['history', 'pre-8-august-plan'],
  },
  {
    id: 'mat700-foundation-reset',
    title: 'HISTORY — MAT700 foundation reset and pass specification',
    moduleGroup: 'MAT700',
    phase: 'Phase 0',
    startDate: '2026-07-16',
    dueDate: '2026-07-16',
    estimatedHours: 0,
    priority: 'High',
    description: 'Completed planning work preserved from the earlier campaign.',
    checklist: [],
    evidence: 'Preserved tracker evidence and activity log.',
    done: 'Historical work remains visible and unchanged.',
    tags: ['history', 'pre-8-august-plan'],
  },
  {
    id: 'project-submit',
    title: 'HISTORY — CMT501 integration, acceptance, and submission',
    moduleGroup: 'Group Project',
    phase: 'Phase 0',
    startDate: '2026-08-03',
    dueDate: '2026-08-06',
    estimatedHours: 0,
    priority: 'High',
    description: 'Completed project work preserved from the plan active before the 8 August sprint.',
    checklist: [],
    evidence: 'Preserved tracker evidence and activity log.',
    done: 'Historical work remains visible and unchanged.',
    tags: ['history', 'pre-8-august-plan'],
  },
  {
    id: 'admin-date-watch-2',
    title: 'HISTORY — official summer timetable check',
    moduleGroup: 'Admin',
    phase: 'Phase 0',
    startDate: '2026-08-03',
    dueDate: '2026-08-03',
    estimatedHours: 0,
    priority: 'High',
    description: 'Completed timetable-check evidence preserved after the exam dates were confirmed.',
    checklist: [],
    evidence: 'Preserved tracker evidence and activity log.',
    done: 'Historical work remains visible and unchanged.',
    tags: ['history', 'pre-8-august-plan'],
  },
]

const BASE_HISTORY_RECORDS = {
  'admin-summer-assessment-confirmation': 'summer assessment entry confirmed',
  'project-capacity-w1': 'CMT501 protected capacity used, 16-19 July',
}

function historyEdits(cardState, title) {
  return {
    ...(cardState.edits ?? {}),
    title: `HISTORY - 19 Jul - ${title}`,
    phase: 'Phase 0',
    phaseId: 'phase-0',
    startDate: HISTORY_DATE,
    dueDate: HISTORY_DATE,
    dueDateTime: `${HISTORY_DATE} 23:59`,
    slotLabel: `Completed ${HISTORY_DATE} · preserved history`,
    tags: [...new Set([...(cardState.edits?.tags ?? []), 'history', 'pre-reset-completion', '19-july-history', 'pre-25-july-completion'])],
  }
}

function asHistoryState(cardState, title) {
  return {
    ...cardState,
    done: true,
    status: 'Done',
    previousStatus: cardState.previousStatus ?? cardState.status ?? 'This Week',
    edits: historyEdits(cardState, title),
  }
}

function hasUserCardWork(cardState) {
  return Boolean(
    cardState?.done ||
    cardState?.status === 'Done' ||
    Number(cardState?.actualHours ?? 0) > 0 ||
    Number(cardState?.progressPercent ?? 0) > 0 ||
    Object.values(plainObject(cardState?.checklist)).some(Boolean) ||
    (cardState?.edits?.checklist ?? []).length ||
    (cardState?.notes ?? []).length ||
    (cardState?.evidenceEntries ?? []).length ||
    (cardState?.focusSessions ?? []).length,
  )
}

function completionDate(cardState) {
  const existingDate = String(cardState?.edits?.startDate ?? '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(existingDate) && existingDate < DEFAULT_CAMPAIGN_START) return existingDate

  const doneEvent = (Array.isArray(cardState?.activity) ? cardState.activity : [])
    .filter((event) => event?.action === 'Marked done' && String(event?.at ?? '').slice(0, 10) < DEFAULT_CAMPAIGN_START)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0]
  return doneEvent ? String(doneEvent.at).slice(0, 10) : ''
}

function pinCompletedHistory(cardState) {
  if (!cardState?.done && cardState?.status !== 'Done') return cardState
  const date = completionDate(cardState)
  if (!date) return cardState
  return {
    ...cardState,
    done: true,
    status: 'Done',
    edits: {
      ...(cardState.edits ?? {}),
      startDate: date,
      dueDate: date,
      dueDateTime: `${date} 23:59`,
      slotLabel: `Completed ${date} · preserved history`,
      tags: [...new Set([...(cardState.edits?.tags ?? []), 'history', 'pre-25-july-completion'])],
    },
  }
}

function nowIso() {
  return new Date().toISOString()
}

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function campaignReferenceDate(value) {
  const date = typeof value === 'string' ? value.slice(0, 10) : ''
  const today = localToday()
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > today
    ? date
    : today
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

const SHOPPING_CATEGORIES = new Set(['groceries', 'toiletries', 'household', 'other'])

export function normaliseShoppingItem(item) {
  if (!item || typeof item !== 'object' || !String(item.text ?? '').trim()) return null
  return {
    id: String(item.id ?? ''),
    text: String(item.text).trim(),
    category: SHOPPING_CATEGORIES.has(item.category) ? item.category : 'other',
    done: Boolean(item.done),
    addedAt: String(item.addedAt ?? nowIso()),
    doneAt: item.done ? String(item.doneAt ?? nowIso()) : null,
  }
}

function normaliseShoppingList(items) {
  if (!Array.isArray(items)) return []
  return items.map(normaliseShoppingItem).filter((item) => item && item.id)
}

export function createInitialTrackerState(referenceDate = localToday()) {
  return {
    version: TRACKER_STATE_VERSION,
    cards: {},
    addedCards: [],
    shoppingList: [],
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
      referenceDate: campaignReferenceDate(referenceDate),
      mat700Active: true,
      theme: 'light',
      campaignStart: DEFAULT_CAMPAIGN_START,
      campaignEnd: DEFAULT_CAMPAIGN_END,
      examWindowStart: DEFAULT_EXAM_WINDOW_START,
      moduleExamDates: { ...CONFIRMED_MODULE_EXAM_DATES },
      customModules: [],
      customPhases: [],
      lastExportedAt: null,
      saveHintDismissed: false,
      planRevision: PLAN_REVISION,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function migrateTrackerState(value) {
  const fallback = createInitialTrackerState()
  if (!value || typeof value !== 'object') return fallback

  const previousSettings = plainObject(value.settings)
  // The AML launch-card wipe was a one-time v6 correction. A later plan
  // migration must never erase the work completed on that card.
  const resetAmlLaunchCard = Number(value.version ?? 0) < 6
  const planChanged = previousSettings.planRevision !== PLAN_REVISION
  const previousCards = plainObject(value.cards)
  const previousRevision = String(previousSettings.planRevision ?? '')
  const july20ResetRequired = previousRevision.startsWith(PREVIOUS_ZERO_BASED_REVISION_PREFIX)
  const july25ResetRequired = previousRevision === PREVIOUS_JULY20_REVISION
  const august3ResetRequired = previousRevision === PREVIOUS_JULY25_REVISION
  const august8ResetRequired = previousRevision === PREVIOUS_AUGUST3_REVISION
  // August 3 uses the same accurate completion-date-pinning transition as the
  // July 25 reset (below), just one hop later in the chain.
  const preserveHistoryReset = july25ResetRequired || august3ResetRequired || august8ResetRequired
  const legacyResetRequired = planChanged && !july20ResetRequired && !preserveHistoryReset
  let sourceAddedCards = Array.isArray(value.addedCards) ? value.addedCards : []
  if (august8ResetRequired) {
    const existingIds = new Set(sourceAddedCards.map((card) => card.id))
    sourceAddedCards = [
      ...sourceAddedCards,
      ...AUGUST8_RETIRED_HISTORY_CARDS.filter(
        (card) => !existingIds.has(card.id) && hasUserCardWork(previousCards[card.id]),
      ),
    ]
  }
  let cards = legacyResetRequired
    ? Object.fromEntries(Object.entries(previousCards).filter(([, card]) => hasUserCardWork(card)))
    : { ...previousCards }

  if (july20ResetRequired) {
    cards = Object.fromEntries(
      Object.entries(cards).filter(([cardId, cardState]) => {
        if (BASE_HISTORY_RECORDS[cardId] && hasUserCardWork(cardState)) return true
        if (cardId === 'project-capacity-w2') return true
        if (hasUserCardWork(cardState)) return true
        return sourceAddedCards.some((card) => card.id === cardId && card.startDate >= DEFAULT_CAMPAIGN_START)
      }),
    )
  }

  if (preserveHistoryReset) {
    cards = Object.fromEntries(
      Object.entries(cards)
        .filter(([, cardState]) => hasUserCardWork(cardState))
        .map(([cardId, cardState]) => [cardId, pinCompletedHistory(cardState)]),
    )
  }

  for (const [cardId, title] of Object.entries(BASE_HISTORY_RECORDS)) {
    if (cards[cardId] && hasUserCardWork(cards[cardId])) {
      cards[cardId] = asHistoryState(cards[cardId], title)
    }
  }

  for (const [cardId, cardState] of Object.entries(cards)) {
    cards[cardId] = pinCompletedHistory(cardState)
  }

  // One deliberate July 20 correction: the user asked for this launch card,
  // and only this card, to return to a completely untouched state.
  if (resetAmlLaunchCard) delete cards[AML_LAUNCH_CARD_ID]

  const resourceProgress = normaliseResourceProgressMap(value.resourceProgress)
  const recentResourceIds = Array.isArray(value.recentResourceIds) ? value.recentResourceIds.slice(0, 8) : []
  const notifications = { ...plainObject(value.notifications) }
  const dayLogs = Object.fromEntries(
    Object.entries(plainObject(value.dayLogs)).map(([date, log]) => [
      date,
      { ...plainObject(log), blocks: { ...plainObject(log?.blocks) } },
    ]),
  )
  if (resetAmlLaunchCard) {
    for (const resourceId of AML_LAUNCH_RESOURCE_IDS) delete resourceProgress[resourceId]
    for (const [notificationId, notification] of Object.entries(notifications)) {
      if (notification?.cardId === AML_LAUNCH_CARD_ID) delete notifications[notificationId]
    }
    for (const log of Object.values(dayLogs)) {
      if (log?.blocks && typeof log.blocks === 'object') delete log.blocks[`card:${AML_LAUNCH_CARD_ID}`]
    }
  }

  const addedCards = sourceAddedCards
    .filter((card) => {
      if (!planChanged) return true
      if (card.startDate >= DEFAULT_CAMPAIGN_START) return true
      if (preserveHistoryReset && !card.recurrenceKey && card.dueDate >= DEFAULT_CAMPAIGN_START) return true
      return hasUserCardWork(cards[card.id])
    })
    .map((card) => {
      const cardState = cards[card.id]
      if (preserveHistoryReset) {
        if (cardState?.done || cardState?.status === 'Done') {
          const date = completionDate(cardState) || card.startDate
          return {
            ...card,
            startDate: date,
            dueDate: date,
            dueDateTime: `${date} 23:59`,
            tags: [...new Set([...(card.tags ?? []), 'history', 'pre-25-july-completion'])],
          }
        }
        const startDate = card.startDate < DEFAULT_CAMPAIGN_START ? DEFAULT_CAMPAIGN_START : card.startDate
        const dueDate = card.dueDate < startDate ? startDate : card.dueDate
        return { ...card, startDate, dueDate, dueDateTime: `${dueDate} 23:59` }
      }
      if (!planChanged || !hasUserCardWork(cardState)) return card
      const originalTitle = String(card.title ?? 'saved card')
        .replace(/^HISTORY\s*[—-]\s*/i, '')
        .replace(/\s*\(completed before reset\)\s*$/i, '')
        .replace(/\s*\(from .*?\)\s*$/i, '')
      cards[card.id] = asHistoryState(cardState, originalTitle)
      return {
        ...card,
        title: `HISTORY - 19 Jul - ${originalTitle}`,
        phase: 'Phase 0',
        phaseId: 'phase-0',
        startDate: HISTORY_DATE,
        dueDate: HISTORY_DATE,
        dueDateTime: `${HISTORY_DATE} 23:59`,
        estimatedHours: 0,
        tags: [...new Set([...(card.tags ?? []), 'history', 'pre-reset-completion', '19-july-history'])],
      }
    })
    .map((card, index) => ({ ...card, number: `A${index + 1}`, sortOrder: 1000 + index }))
  const campaignStart =
    !previousSettings.campaignStart ||
    previousSettings.campaignStart === '2026-07-04' ||
    previousSettings.campaignStart === '2026-07-13' ||
    previousSettings.campaignStart === '2026-07-16' ||
    planChanged
      ? DEFAULT_CAMPAIGN_START
      : previousSettings.campaignStart
  const campaignEnd =
    planChanged || !previousSettings.campaignEnd || previousSettings.campaignEnd === '2026-08-18'
      ? DEFAULT_CAMPAIGN_END
      : previousSettings.campaignEnd
  const referenceDate = planChanged
    ? localToday()
    : campaignReferenceDate(previousSettings.referenceDate || localToday())

  return {
    ...fallback,
    ...value,
    version: TRACKER_STATE_VERSION,
    cards,
    addedCards,
    // A running "things to buy" list — deliberately outside the card/progress
    // system (see shopping items are not academic backlog), so it survives a
    // plan reset untouched, same reasoning as knowledge/generalKnowledge below.
    shoppingList: normaliseShoppingList(value.shoppingList),
    moduleNotes: plainObject(value.moduleNotes),
    // Reference notes survive a plan reset: they describe the syllabus, not
    // the schedule that was thrown away.
    knowledge: normaliseKnowledge(value.knowledge),
    // Same reasoning: a personal "things I've figured out" log has nothing to
    // do with the schedule and survives a plan reset untouched.
    generalKnowledge: normaliseGeneralKnowledge(value.generalKnowledge),
    // Generated alerts from the abandoned pre-reset plan are noise,
    // not user work. Rebuild them from the live cards after a plan revision.
    notifications: planChanged ? {} : notifications,
    resourceProgress,
    uploadedResources: normaliseUploadedResources(value.uploadedResources),
    recentResourceIds: resetAmlLaunchCard
      ? recentResourceIds.filter((id) => !AML_LAUNCH_RESOURCE_IDS.has(id))
      : recentResourceIds,
    snapshots: plainObject(value.snapshots),
    dayLogs,
    focusRewards:
      value.focusRewards && typeof value.focusRewards === 'object' && !Array.isArray(value.focusRewards)
        ? plainObject(value.focusRewards)
        : null,
    settings: {
      ...fallback.settings,
      ...previousSettings,
      referenceDate,
      campaignStart,
      campaignEnd,
      examWindowStart: planChanged
        ? DEFAULT_EXAM_WINDOW_START
        : previousSettings.examWindowStart || DEFAULT_EXAM_WINDOW_START,
      mat700Active: previousSettings.mat700Active !== false,
      moduleExamDates: planChanged
        ? { ...plainObject(previousSettings.moduleExamDates), ...CONFIRMED_MODULE_EXAM_DATES }
        : plainObject(previousSettings.moduleExamDates),
      customModules: Array.isArray(previousSettings.customModules) ? previousSettings.customModules : [],
      customPhases: Array.isArray(previousSettings.customPhases) ? previousSettings.customPhases : [],
      planRevision: PLAN_REVISION,
    },
    updatedAt: planChanged ? nowIso() : value.updatedAt ?? nowIso(),
  }
}
