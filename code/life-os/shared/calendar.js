// Calendar dates are civil dates in Europe/London. Keep date-only values intact.
export const CALENDAR_TIME_ZONE = 'Europe/London'
const londonDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: CALENDAR_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
})

export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function dateKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return isDateKey(value) ? value : ''
  if (value === undefined || value === null || value === '') return ''
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const parts = Object.fromEntries(londonDate.formatToParts(date).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function addDays(value, amount) {
  if (!isDateKey(value) || !Number.isInteger(amount)) return ''
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

export function inRange(value, from, to) {
  const key = dateKey(value)
  return Boolean(key && key >= from && key <= to)
}

// All-day end dates are inclusive. Timed ends are exclusive at midnight.
export function itemOverlaps(item, from, to) {
  const start = dateKey(item.start)
  let end = dateKey(item.end) || start
  if (!item.all_day && item.end) {
    const instant = new Date(item.end)
    if (Number.isFinite(instant.getTime())) end = dateKey(new Date(instant.getTime() - 1))
  }
  return Boolean(start && start <= to && (end < start ? start : end) >= from)
}

// Convert a source's London wall-clock time without relying on the host zone.
export function londonDateTime(day, time) {
  if (!isDateKey(day) || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time || '')) return ''
  const wall = Date.parse(`${day}T${time.length === 5 ? `${time}:00` : time}Z`)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  })
  // London is UTC or UTC+1. A repeated hour cannot identify one instant.
  const matches = []
  for (const offset of [3600000, 0]) {
    const date = new Date(wall - offset)
    const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]))
    const actual = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
    if (actual === `${day}T${time.length === 5 ? `${time}:00` : time}`) matches.push(date.toISOString())
  }
  return matches.length === 1 ? matches[0] : ''
}
