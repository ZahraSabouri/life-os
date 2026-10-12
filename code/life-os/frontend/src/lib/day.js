// Puts one day in order: timed things as a path, things for any time, and the all-day rest.
// Pure functions, so the page and the tests share them.
import { CALENDAR_TIME_ZONE, itemOverlaps } from '../../../shared/calendar.js'

const LONDON_CLOCK = new Intl.DateTimeFormat('en-GB', { timeZone: CALENDAR_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function clockOf(instant) {
  const date = instant instanceof Date ? instant : new Date(instant)
  return Number.isFinite(date.getTime()) ? LONDON_CLOCK.format(date) : ''
}

// The timetable writes a room as "Room: 2.26. Building: Abacws Building. AccessAble Details: https://…".
export function shortPlace(location) {
  const value = String(location ?? '').trim()
  if (!value) return ''
  const room = /Room:\s*(.+?)\.\s+Building:\s*(.+?)\.(?:\s|$)/.exec(value)
  if (room) return `${room[2].replace(/\s+Building$/i, '')} ${room[1]}`
  return value.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').replace(/[\s:·,-]+$/, '').slice(0, 80)
}

export function noteTitle(body) {
  const first = String(body ?? '').trim().split(/\r?\n/)[0].trim()
  return first.length > 80 ? `${first.slice(0, 77).trimEnd()}…` : first
}

export function daysAway(days) {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${-days} days ago`
}

const isCardItem = (item) => item.area === 'study' && item.meta?.entity === 'cards'

// ---- "17:30 library", "Lidl", "dinner at 8pm": a plan typed in one line ----
const pad = (value) => String(value).padStart(2, '0')

function clockFrom(hour, minute, half) {
  let h = Number(hour)
  const m = Number(minute ?? 0)
  if (half === 'pm' && h < 12) h += 12
  if (half === 'am' && h === 12) h = 0
  return h > 23 || m > 59 ? '' : `${pad(h)}:${pad(m)}`
}

// A clock time needs minutes after a colon ("17:30") or am/pm ("5pm", "7.15pm"), so "chapter 3.14"
// and "read 20 pages" stay words.
function times(text) {
  const found = []
  for (const match of text.matchAll(/(?<![\d:.])(\d{1,2})(?:([:.])(\d{2}))?\s*(am|pm)?(?![\d:])/gi)) {
    const [whole, hour, separator, minute, meridiem] = match
    const half = meridiem?.toLowerCase() ?? ''
    if (!(separator === ':' || half)) continue
    found.push({ index: match.index, end: match.index + whole.length, hour, minute, half })
  }
  return found
}

export function parsePlan(text) {
  const value = String(text ?? '').trim().replace(/\s+/g, ' ')
  const [first, second] = times(value)
  if (!first) return { title: value, start: '', end: '' }
  // "17:30-18:30", "5:30 to 6:30pm": a second time straight after the first is where it ends.
  const between = second ? value.slice(first.end, second.index) : ''
  const ranged = second && /^\s*(?:-|–|—|to|until|till)\s*$/i.test(between)
  const start = clockFrom(first.hour, first.minute, first.half || (ranged && Number(first.hour) <= 12 ? second.half : ''))
  if (!start) return { title: value, start: '', end: '' }
  const finish = ranged ? clockFrom(second.hour, second.minute, second.half) : ''
  const cut = ranged ? second.end : first.end
  // The word that led to the time ("at", "@", "from") goes with it.
  const before = value.slice(0, first.index).replace(/(?:^|\s)(?:at|@|from)\s*$/i, ' ')
  const title = `${before} ${value.slice(cut)}`.replace(/\s+/g, ' ').replace(/^[\s,;:–—-]+|[\s,;:–—@-]+$/g, '').trim()
  return { title, start, end: finish > start ? finish : '' }
}

// Something she added to the day herself (a core entry) can be ticked off or taken off the day there.
function ownEntry(item) {
  if (item.area !== 'core' || !item.meta?.entryId) return null
  return { id: item.meta.entryId, task: item.meta.type === 'task', revision: item.meta.revision }
}

export function buildDay({ items = [], day = null, date, now = '' }) {
  const todays = items.filter((item) => itemOverlaps(item, date, date))
  const shown = new Set((day?.study?.today ?? []).map((card) => card.id))
  const stops = []
  for (const item of todays) {
    // Study blocks arrive with their cards in `day.blocks`; the calendar's copy of them is left out.
    if (item.all_day || item.meta?.type === 'study-block') continue
    stops.push({
      key: item.id, type: 'item', start: clockOf(item.start), end: item.end ? clockOf(item.end) : '',
      title: item.title, area: item.area, kind: item.kind, place: shortPlace(item.location), href: item.href || '/calendar', choice: item.choice ?? '',
      entry: ownEntry(item),
    })
  }
  for (const block of day?.blocks ?? []) {
    stops.push({
      key: block.id, type: 'block', start: block.start, end: block.end, title: block.title,
      area: block.category === 'job' ? 'career' : 'study', kind: 'plan', place: block.location, href: block.card?.href ?? block.href, card: block.card ?? null, minutes: block.minutes,
    })
  }
  stops.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end) || a.title.localeCompare(b.title))
  if (now) {
    let nextMarked = false
    for (const stop of stops) {
      const end = stop.end || stop.start
      if (end <= now && stop.start < now) stop.when = 'past'
      else if (stop.start <= now) stop.when = 'now'
      else if (!nextMarked) { stop.when = 'next'; nextMarked = true } else stop.when = 'later'
    }
  }

  const anytime = []
  for (const card of day?.study?.today ?? []) if (!card.inBlock && !card.done) anytime.push({ key: `card:${card.id}`, type: 'card', title: card.title, area: 'study', href: card.href, card })
  const also = []
  for (const item of todays) {
    if (!item.all_day) continue
    // Today's study cards are drawn with their steps, so their bare calendar rows are left out.
    if (isCardItem(item) && shown.has(item.meta.recordId)) continue
    const entry = { key: item.id, type: 'item', title: item.title, area: item.area, kind: item.kind, href: item.href || '/calendar', entry: ownEntry(item) }
    if (item.area === 'core' || item.area === 'home') anytime.push(entry)
    else also.push(entry)
  }
  // Where "now" falls in the path: the first stop that is not over. -1 when every stop is over; -2 when there is nothing to place it in.
  return { stops, anytime, also, nowIndex: now && stops.length ? stops.findIndex((stop) => stop.when !== 'past') : -2 }
}
