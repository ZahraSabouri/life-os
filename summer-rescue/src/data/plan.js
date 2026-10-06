// The open semester's plan: cards that were prepared in advance, the schedule and its
// wording. All of it is data that belongs to the semester; a new semester has none.
import { openSemester } from '../hub/session.js'

const session = openSemester()

const plan = session.plan ?? {}
const list = (value) => (Array.isArray(value) ? value : [])
const LONDON = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function londonParts(instant) {
  const time = Date.parse(instant)
  if (!Number.isFinite(time)) return null
  const parts = Object.fromEntries(LONDON.formatToParts(new Date(time)).map((part) => [part.type, part.value]))
  return { day: `${parts.year}-${parts.month}-${parts.day}`, clock: `${parts.hour}:${parts.minute}` }
}

function isoWeekday(day) {
  const weekday = new Date(`${day}T12:00:00`).getDay()
  return weekday === 0 ? 7 : weekday
}

const moduleGroupForRow = (moduleRowId) => session.modules.find((module) => module.rowId === moduleRowId)?.moduleGroup ?? ''

// A class kept in the Life OS timetable shows as a fixed block on the schedule.
function classRule(row) {
  if (['cancelled', 'archived'].includes(row.status)) return null
  const start = londonParts(row.start_at)
  const end = londonParts(row.end_at)
  if (!start || !end) return null
  return {
    id: `class-${row.id}`,
    title: row.title,
    category: 'class',
    from: start.day,
    to: start.day,
    weekdays: [isoWeekday(start.day)],
    start: start.clock,
    end: end.clock,
    location: row.data?.location ?? '',
    moduleGroup: moduleGroupForRow(row.module_id),
    countsToward: ['academic'],
    protected: true,
    checkable: false,
    notes: row.data?.description ?? '',
    classId: row.id,
  }
}

function examRule(row) {
  if (String(row.data?.type ?? '').toLowerCase() !== 'exam' || ['cancelled', 'archived'].includes(row.status)) return null
  const start = londonParts(row.start_at)
  const end = londonParts(row.end_at)
  if (!start || !end) return null
  return {
    id: `exam-${row.id}`,
    title: row.title,
    category: 'exam',
    from: start.day,
    to: start.day,
    weekdays: [isoWeekday(start.day)],
    start: start.clock,
    end: end.clock,
    location: row.data?.location ?? '',
    moduleGroup: moduleGroupForRow(row.module_id),
    countsToward: ['academic'],
    protected: true,
    checkable: false,
    notes: '',
    assessmentId: row.id,
  }
}

export const basePlanCards = list(plan.baseCards)

export const campaignMeta = {
  ...(plan.campaignMeta ?? {}),
  title: plan.campaignMeta?.title || session.semester?.title || 'Study hub',
  cardCount: basePlanCards.length,
}

export const scheduleRules = [
  ...list(plan.scheduleRules),
  ...session.sessions.map(classRule).filter(Boolean),
  ...session.assessments.map(examRule).filter(Boolean),
]
export const scheduleExceptions = list(plan.scheduleExceptions)
export const scheduleAssumptions = plan.scheduleAssumptions ?? {}

// The semester's own dates. The schedule and progress views plan inside this window.
export const semesterWindow = {
  start: session.semester?.start_date || '',
  end: session.semester?.end_date || '',
}
