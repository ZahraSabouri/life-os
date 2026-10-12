// The jobs JobMap's own first screen lists, in its order, worked out by JobMap's own rule.
// One place, so that the day, the Court, the strip in each part and the calendar agree with
// what JobMap itself shows. The rule takes about half a second over a thousand jobs, so the
// answer is kept until JobMap saves again or the day changes.
import * as matching from '../../jobmap/lib/matching.mjs'

// JobMap's page opens on these choices (jobmap/app/page.tsx: view, scope, sort). If JobMap
// comes to export its own FIRST_SCREEN, that is used instead and this line can go.
const FIRST_SCREEN = matching.FIRST_SCREEN ?? { view: 'all', scope: 'apply', sort: 'priority' }
const SECTIONS = Array.isArray(matching.PRIORITY_SECTIONS) ? matching.PRIORITY_SECTIONS : []

let kept = null

export function firstScreen(value, date) {
  const jobs = (Array.isArray(value) ? value : Array.isArray(value?.jobs) ? value.jobs : []).filter((job) => job && typeof job.id === 'string')
  // Only a saved JobMap state has a revision to recognise it by; anything else is worked out afresh.
  const revision = Array.isArray(value) ? undefined : value?.revision
  const key = revision === undefined || revision === null ? '' : `${revision}|${value.updatedAt ?? ''}|${jobs.length}|${date}`
  if (key && kept?.key === key) return kept.rows
  const preferences = value?.preferences && typeof value.preferences === 'object' && !Array.isArray(value.preferences) ? value.preferences : {}
  const rows = matching.selectJobs(jobs, FIRST_SCREEN, { ...matching.DEFAULT_PROFILE, ...preferences }, date)
  if (key) kept = { key, rows }
  return rows
}

// JobMap's own heading for a group of the list ("Apply now", "Ask about hours first", …).
export const sectionName = (index) => (typeof SECTIONS[index] === 'string' ? SECTIONS[index] : '')
