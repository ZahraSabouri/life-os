// How the open semester's modules are studied, read from the semester's own records: each
// module's name, colour and kind of work, and the plan's options (the share of time each
// module should get, which modules are the exam spine, when preparation should be finished,
// a project deadline, the order of a module's resource groups). A semester that says nothing
// gets neutral defaults: no time split, no exam spine, no readiness date. Nothing here names
// a particular semester or course.
import { openSemester } from '../hub/session.js'

const session = openSemester()
const options = session.plan?.options ?? {}
const text = (value) => (typeof value === 'string' ? value.trim() : '')
const DAY = /^\d{4}-\d{2}-\d{2}$/
const day = (value) => (DAY.test(text(value)) ? text(value) : '')

// Cards say which module they belong to by its group.
const byGroup = new Map()
for (const module of session.modules) {
  const group = text(module.moduleGroup)
  if (group && !byGroup.has(group)) byGroup.set(group, module)
}

export const moduleOfGroup = (group) => byGroup.get(group) ?? null
// A module's name for people.
export const groupLabel = (group) => text(byGroup.get(group)?.label) || text(byGroup.get(group)?.title) || group
// Its colour: one of the app's chart colours (a CSS variable), or the fallback.
export const groupAccent = (group, fallback = '--chart-aml') => {
  const accent = text(byGroup.get(group)?.accent)
  return accent.startsWith('--') ? accent : fallback
}
// Its kind of work, when the module says (study, project, job, admin, life); see utils/progress.js.
export const groupKind = (group) => text(byGroup.get(group)?.kind)

// The share of study time each module should get, in percent ({ group: percent }): the
// plan's `splitTargets`, or each module's `targetShare`. Empty when the semester sets none.
function splitTargets() {
  const given = options.splitTargets && typeof options.splitTargets === 'object' ? Object.entries(options.splitTargets) : null
  const entries = given ?? [...byGroup].map(([group, module]) => [group, module.targetShare])
  return Object.fromEntries(entries
    .map(([group, share]) => [text(group), Number(share)])
    .filter(([group, share]) => group && Number.isFinite(share) && share > 0))
}
export const SPLIT_TARGETS = splitTargets()

// The modules whose study blocks are the exam spine (they keep their times) and whose cards
// re-planning packs into the days left.
export const EXAM_GROUPS = Array.isArray(options.examGroups) ? options.examGroups.map(text).filter(Boolean) : []
// When exam preparation should be finished (else the semester's end), and a project deadline.
export const READINESS_DATE = day(options.readinessDate) || day(session.semester?.end_date)
export const PROJECT_DEADLINE = day(options.projectDeadline)

// The order a module's resource groups show in (the module's `resourceGroupOrder`).
export function resourceGroupOrder(moduleId) {
  const module = session.modules.find((row) => row.id === moduleId)
  return Array.isArray(module?.resourceGroupOrder) ? module.resourceGroupOrder.map(text).filter(Boolean) : []
}
