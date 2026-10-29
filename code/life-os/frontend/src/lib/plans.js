// What she can do to a plan of her own, from any page that shows it (the day, the week
// planner): tick it done, take it off its day, move it to another day, add one, stop a
// repeating one. A day of a repeating plan becomes a real entry the first time she acts on it.
import { dateKey, londonDateTime } from '../../../shared/calendar.js'
import { apiFetch } from './api.js'
import { clockOf } from './day.js'

const post = (body) => apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(body) })
const patch = (id, body) => apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) })

// One day of a repeating plan, as the entry it becomes. `routine` is what the calendar sends
// with a worked-out day (hosting/calendar/mappers.mjs: meta.routine).
const occurrence = (routine, title, extra = {}) => ({
  type: routine.type, title, start_at: routine.start_at, ...(routine.end_at ? { end_at: routine.end_at } : {}), all_day: Boolean(routine.all_day),
  details: { ...(routine.area ? { area: routine.area } : {}), routine: routine.id }, ...extra,
})

// `entry` is { id, revision, routine } as the day builds it (lib/day.js: ownEntry).
export function setPlanStatus({ entry, title }, status) {
  if (entry.routine) return post(occurrence(entry.routine, title, { status }))
  return patch(entry.id, { status, ...(entry.revision === undefined ? {} : { revision: entry.revision }) })
}

// The same clock time on another day; a plan for any time just changes its day.
function onDay(item, day) {
  if (item.all_day) return { start_at: day, end_at: null, all_day: true }
  const start = londonDateTime(day, clockOf(item.start))
  if (!start) throw new Error('That clock time does not exist on that day (the clocks change)')
  const length = item.end ? Date.parse(item.end) - Date.parse(item.start) : 0
  return { start_at: start, end_at: length > 0 ? new Date(Date.parse(start) + length).toISOString() : null, all_day: false }
}

// Moves a plan of hers to another day. One day of a repeating plan is taken off its own day
// and put on the new one as a plan by itself; the rest of the repeating plan stays as it is.
export async function movePlan(item, day) {
  const moved = onDay(item, day)
  const routine = item.meta?.routine
  if (!routine) return patch(item.meta.entryId, moved)
  const off = await post(occurrence(routine, item.title, { status: 'cancelled' }))
  const { routine: _left, ...details } = occurrence(routine, item.title).details
  return { ...(await post({ type: routine.type, title: item.title, ...moved, ...(moved.end_at ? {} : { end_at: undefined }), details })), off }
}

// Taking a step back, from the Undo that follows it. A status change: a stored entry gets the
// status it had (`before`); a day of a repeating plan, which became an entry when she acted on
// it, is "to do" again. `saved` is what the change saved (setPlanStatus's answer).
export const undoStatus = (entry, saved, before = null) => patch(entry.routine ? saved.id : entry.id, { status: entry.routine ? null : before })

// A move: a stored plan goes back to its day and time. One day of a repeating plan goes back on
// its own day, and the plan made for the new day is taken off (kept, as everything taken off is).
export async function undoMove(item, moved) {
  if (!item.meta?.routine) return patch(item.meta.entryId, { start_at: item.all_day ? dateKey(item.start) : item.start, end_at: item.end ?? null, all_day: Boolean(item.all_day) })
  await patch(moved.id, { status: 'cancelled' })
  return patch(moved.off.id, { status: null })
}

export const stopRepeating = (id, lastDay) => patch(id, { end_at: lastDay })
export const removeEntry = (id) => apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' })
