// Repeating plans. A routine is one entry (type "repeat"; "routine" is the body room's care routine) that says: this title, on these
// weekdays, at this clock time or at any time, from this day, perhaps until that day. Its days
// are not stored: they are worked out when a stretch of days is looked at.
//
// A day of a routine becomes a real entry only when she acts on it (ticks it done, takes it off
// that day): that entry carries `details.routine` and stands in for the worked-out one.
import { addDays, dateKey, isDateKey, londonDateTime } from './calendar.js'

export const REPEAT = 'repeat'
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/
const OFF = new Set(['cancelled', 'canceled', 'archived', 'stopped'])
// The areas a block of set-aside time can belong to (entryTypes.js, "time-block").
const BLOCK_AREAS = new Set(['core', 'study', 'career', 'money', 'home', 'relationships', 'events'])

const detailsOf = (entry) => {
  let value = entry?.details ?? {}
  if (typeof value === 'string') { try { value = JSON.parse(value) } catch { value = {} } }
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
// Monday is 1, Sunday is 7.
export const isoWeekday = (date) => ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1
const dayOf = (value) => (typeof value !== 'string' || !value ? '' : value.length <= 10 ? (isDateKey(value) ? value : '') : dateKey(value) || '')

// "1,3,5" or [1, 3, 5] -> the weekdays as a sorted list; nothing valid means every day.
export function weekdaysOf(value) {
  const days = [...new Set((Array.isArray(value) ? value : String(value ?? '').split(',')).map((day) => Number(String(day).trim())).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))].sort()
  return days.length ? days : [1, 2, 3, 4, 5, 6, 7]
}

// A routine entry in plain terms, or null when the entry is not a routine that runs.
export function routineOf(entry) {
  if (!entry || entry.type !== REPEAT || entry.archived || OFF.has(String(entry.status ?? '').toLowerCase())) return null
  const details = detailsOf(entry)
  const from = dayOf(entry.start_at)
  if (!from) return null
  const start = CLOCK.test(details.start ?? '') ? details.start : ''
  return {
    id: entry.id, title: String(entry.title ?? '').trim() || 'Repeating plan', from, until: dayOf(entry.end_at),
    weekdays: weekdaysOf(details.weekdays), start, end: start && CLOCK.test(details.end ?? '') && details.end > start ? details.end : '',
    area: typeof details.area === 'string' ? details.area : '',
  }
}

// One day of a routine, shaped like the entry it would be: time set aside when it has a clock
// time, a thing to do when it does not.
export function occurrence(routine, date) {
  const timed = Boolean(routine.start)
  const startAt = timed ? londonDateTime(date, routine.start) : date
  if (!startAt) return null   // a clock time that does not exist on this day (the clocks change)
  const type = timed ? 'time-block' : 'task'
  const area = type === 'time-block' ? (BLOCK_AREAS.has(routine.area) ? routine.area : 'core') : routine.area
  return {
    id: `routine:${routine.id}:${date}`, type, title: routine.title, status: 'planned',
    start_at: startAt, end_at: timed && routine.end ? londonDateTime(date, routine.end) || null : null, all_day: timed ? 0 : 1,
    details: { ...(area ? { area } : {}), routine: routine.id }, archived: 0, virtual: true,
  }
}

// The worked-out days of every routine between two days (inclusive), leaving out any day she
// has already acted on.
export function expandRoutines(entries, from, to) {
  if (!isDateKey(from) || !isDateKey(to) || to < from) return []
  const rows = Array.isArray(entries) ? entries : []
  const acted = new Set()
  for (const entry of rows) {
    if (!entry || entry.type === REPEAT) continue
    const routine = detailsOf(entry).routine
    if (typeof routine === 'string' && routine) acted.add(`${routine}\0${dayOf(entry.start_at)}`)
  }
  const output = []
  for (const entry of rows) {
    const routine = routineOf(entry)
    if (!routine) continue
    const first = routine.from > from ? routine.from : from
    const last = routine.until && routine.until < to ? routine.until : to
    for (let date = first; date <= last; date = addDays(date, 1)) {
      if (!routine.weekdays.includes(isoWeekday(date)) || acted.has(`${routine.id}\0${date}`)) continue
      const row = occurrence(routine, date)
      if (row) output.push(row)
    }
  }
  return output
}

// The entries as stored, and with them the days of the routines in that stretch.
export const withRoutines = (entries, from, to) => [...(Array.isArray(entries) ? entries : []), ...expandRoutines(entries, from, to)]

// "every day", "weekdays", "Mon, Wed and Fri": how a routine's days are said.
const NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export function sayWeekdays(value) {
  const days = weekdaysOf(value)
  if (days.length === 7) return 'every day'
  if (days.join() === '1,2,3,4,5') return 'weekdays'
  if (days.join() === '6,7') return 'weekends'
  const names = days.map((day) => NAMES[day])
  return `every ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`}`
}
