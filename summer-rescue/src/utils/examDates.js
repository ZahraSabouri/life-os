// Exam-date confidence model.
//
// A semester may publish an overall exam window, and each module may have its own
// confirmed exam date. Both are things the owner enters; nothing is assumed.
//
// Three states are distinguishable at every consumer:
//   confirmed   - a real date has been entered for this module
//   unconfirmed - no date is known for this module
//   window      - the countdown is running against the start of the exam window
import { STUDY_MODULES } from '../data/studyModules.js'
import { semesterWindow } from '../data/plan.js'

// Any module of the open semester can have an exam date.
export const EXAM_MODULES = STUDY_MODULES.map((module) => ({ id: module.id, label: module.label, code: module.code || module.label }))

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDay(value) {
  if (typeof value !== 'string' || !ISO_DAY.test(value)) return false
  // Reject calendar-invalid days that still match the shape, e.g. 2026-02-31.
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

// The days exams can fall on. Without a published window that is the whole semester.
export function examWindow(schedule = {}) {
  const first = [schedule.examWindowStart, schedule.campaignStart, semesterWindow.start].find(isIsoDay) ?? '0001-01-01'
  const last = [schedule.examWindowEnd, schedule.campaignEnd, semesterWindow.end].find(isIsoDay) ?? '9999-12-31'
  return { start: first, end: last < first ? first : last, published: isIsoDay(schedule.examWindowStart) }
}

export function examModule(moduleId) {
  return EXAM_MODULES.find((entry) => entry.id === moduleId) ?? null
}

/**
 * Validate a candidate module exam date before it is allowed into state.
 * An empty value is a legitimate "clear this date" instruction, not an error.
 */
export function validateModuleExamDate(value, { schedule = {}, allowException = false } = {}) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    return { ok: true, status: 'cleared', date: null, code: null, message: '' }
  }
  if (!isIsoDay(text)) {
    return {
      ok: false,
      status: 'invalid',
      date: null,
      code: 'invalid',
      message: 'Enter a valid calendar date (YYYY-MM-DD).',
    }
  }

  const campaignStart = [schedule.campaignStart, semesterWindow.start].find(isIsoDay) ?? ''
  if (campaignStart && text < campaignStart) {
    return {
      ok: false,
      status: 'invalid',
      date: null,
      code: 'pre-campaign',
      message: `An exam cannot fall before the semester starts on ${campaignStart}.`,
    }
  }

  const { start, end } = examWindow(schedule)
  if (text < start || text > end) {
    if (!allowException) {
      return {
        ok: false,
        status: 'out-of-window',
        date: null,
        code: 'out-of-window',
        message: `That date is outside the ${start} to ${end} exam window. Confirm to record it anyway.`,
      }
    }
    return {
      ok: true,
      status: 'valid',
      date: text,
      code: 'out-of-window',
      message: `Recorded outside the ${start} to ${end} exam window.`,
    }
  }

  return { ok: true, status: 'valid', date: text, code: null, message: '' }
}

/**
 * Resolve one module's exam date into an explicit confidence state.
 * A stored value that fails validation is reported as unconfirmed rather than
 * being silently rendered as fact.
 */
export function resolveModuleExamDate(moduleId, moduleExamDates = {}, schedule = {}) {
  const meta = examModule(moduleId) ?? { id: moduleId, label: moduleId, code: moduleId }
  const { start, end } = examWindow(schedule)
  const raw = moduleExamDates?.[moduleId]
  const date = isIsoDay(raw) ? raw : null

  return {
    moduleId: meta.id,
    label: meta.label,
    code: meta.code,
    status: date ? 'confirmed' : 'unconfirmed',
    confirmed: Boolean(date),
    date,
    windowStart: start,
    windowEnd: end,
    outOfWindow: Boolean(date) && (date < start || date > end),
  }
}

export function resolveModuleExamDates(moduleExamDates = {}, schedule = {}) {
  return EXAM_MODULES.map((entry) => resolveModuleExamDate(entry.id, moduleExamDates, schedule))
}

export function confirmedExamDates(moduleExamDates = {}, schedule = {}) {
  return resolveModuleExamDates(moduleExamDates, schedule).filter((entry) => entry.confirmed)
}

/**
 * The single date the countdown runs against.
 * `source: 'window'` means no module date is known and the number is a
 * placeholder against the window start; consumers must label it as such.
 */
export function resolveExamTarget({ moduleExamDates = {}, schedule = {}, referenceDate = '' } = {}) {
  const { start, end, published } = examWindow(schedule)
  const confirmed = confirmedExamDates(moduleExamDates, schedule).sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  if (confirmed.length > 0) {
    const next = confirmed.find((entry) => entry.date >= referenceDate) ?? confirmed[0]
    return {
      source: 'module',
      status: 'confirmed',
      confirmed: true,
      moduleId: next.moduleId,
      label: next.label,
      date: next.date,
      windowStart: start,
      windowEnd: end,
      confirmedCount: confirmed.length,
      moduleCount: EXAM_MODULES.length,
    }
  }

  return {
    source: 'window',
    status: 'unconfirmed',
    confirmed: false,
    moduleId: null,
    label: 'exam window',
    // With neither a module date nor a published window there is nothing to count down to.
    date: published ? start : null,
    windowStart: start,
    windowEnd: end,
    confirmedCount: 0,
    moduleCount: EXAM_MODULES.length,
  }
}

export function examCountdownDays(targetDate, referenceDate) {
  if (!isIsoDay(targetDate) || !isIsoDay(referenceDate)) return null
  const from = new Date(`${referenceDate}T00:00:00Z`)
  const to = new Date(`${targetDate}T00:00:00Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null
  return Math.round((to - from) / 86400000)
}

/**
 * Apply a validated change to the stored map, dropping cleared keys entirely so
 * that an absent key and an empty string can never mean different things.
 */
export function applyModuleExamDate(moduleExamDates = {}, moduleId, date) {
  const next = { ...moduleExamDates }
  if (!date) delete next[moduleId]
  else next[moduleId] = date
  return next
}
