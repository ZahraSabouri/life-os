import { addDays, dateKey, isDateKey, itemOverlaps, londonDateTime } from '../../../shared/calendar.js'

export { addDays, dateKey, itemOverlaps }

export const CALENDAR_AREAS = [
  { key: 'core', label: 'Life OS', tone: 'var(--g-acc)' },
  { key: 'relationships', label: 'Relationships', tone: 'var(--g-rose)' },
  { key: 'study', label: 'Study', tone: 'var(--g-sage)' },
  { key: 'career', label: 'Career', tone: 'var(--g-blue)' },
  { key: 'money', label: 'Money', tone: 'var(--g-coral)' },
  { key: 'home', label: 'Home', tone: 'var(--g-acc)' },
  { key: 'body', label: 'Health', tone: 'var(--m-spark)' },
  { key: 'events', label: 'Cardiff events', tone: 'var(--g-rose)' }
]

export const CALENDAR_KINDS = [
  { key: 'fixed', label: 'Fixed time' },
  { key: 'plan', label: 'Plan' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'reminder', label: 'Reminder' },
  { key: 'note', label: 'Note' }
]

export const CARDIFF_CHOICES_KEY = 'cardiff-life-choices-v1'
const DONE_STATUSES = new Set(['done', 'completed', 'complete', 'cancelled', 'canceled', 'archived'])

export function calendarArea(area) {
  return CALENDAR_AREAS.find(item => item.key === area) || CALENDAR_AREAS[0]
}

export function calendarKind(kind) {
  return CALENDAR_KINDS.find(item => item.key === kind)?.label || kind
}

// A failed read is not an empty schedule. Core entries can belong to any area,
// so the core source matters even when only one attached area is selected.
export function calendarDisplay(calendar, { areas, count = 0, noun = 'item', empty = 'Nothing dated here.' } = {}) {
  const selected = areas ?? CALENDAR_AREAS.map(area => area.key)
  const relevant = (calendar.sources || []).filter(source => selected.length > 0
    && (source.id === 'core' || source.area === 'core' || selected.includes(source.area)))
  const failed = relevant.some(source => source.status === 'unavailable')
  const ready = relevant.some(source => source.status === 'ready')
  const choicesMissing = selected.includes('events') && Boolean(calendar.choicesError)
  const state = calendar.loading ? 'loading' : calendar.error || (failed && !ready) ? 'unavailable'
    : failed || choicesMissing ? 'partial' : 'ready'
  const total = `${count} ${noun}${count === 1 ? '' : 's'}`
  return {
    state,
    countLabel: state === 'loading' ? 'Loading…' : state === 'unavailable' ? 'Unavailable'
      : state === 'partial' ? `${total} loaded` : total,
    emptyMessage: state === 'loading' ? 'Loading dates…'
      : state === 'unavailable' ? 'Dates could not be loaded. Try again.'
        : state === 'partial' ? 'No matching dates were found in the available sources. Some dates could not be checked.' : empty
  }
}

export function dateForKey(key) {
  return new Date(`${key}T12:00:00Z`)
}

export function formatCalendarDay(key, options = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short', ...options
  }).format(dateForKey(key))
}

export function itemTime(item) {
  if (item.all_day || !item.start || /^\d{4}-\d{2}-\d{2}$/.test(item.start)) return 'All day'
  const format = value => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
  return item.end && dateKey(item.start) === dateKey(item.end) && item.end !== item.start
    ? `${format(item.start)}–${format(item.end)}`
    : format(item.start)
}

export function readCardiffChoices(storageOrGetter) {
  try {
    const storage = typeof storageOrGetter === 'function' ? storageOrGetter() : storageOrGetter
    const raw = storage.getItem(CARDIFF_CHOICES_KEY)
    if (!raw) return { choices: {}, error: '' }
    const value = JSON.parse(raw)
    if (value.version !== 1 || !value.choices || typeof value.choices !== 'object' || Array.isArray(value.choices)) {
      throw new Error('Invalid choices')
    }
    const choices = Object.fromEntries(Object.entries(value.choices).map(([id, choice]) => {
      if (!/^[a-z0-9][a-z0-9_-]{0,150}$/i.test(id) || !choice || !['going', 'maybe'].includes(choice.status)) throw new Error('Invalid choice')
      const fields = ['event_id', 'name', 'date', 'start_time', 'end_time', 'location', 'source_url', 'activity', 'status', 'cost', 'description', 'organiser']
      const snapshot = Object.fromEntries(fields.map(key => [key, typeof choice.snapshot?.[key] === 'string' ? choice.snapshot[key].slice(0, 3000) : '']))
      return [id, { status: choice.status, note: typeof choice.note === 'string' ? choice.note.slice(0, 2000) : '', snapshot }]
    }))
    return { choices, error: '' }
  } catch {
    return { choices: {}, error: 'Cardiff choices could not be read in this browser. Open Cardiff Life to check your saved plan, or show all options here.' }
  }
}

export function filterCalendarItems(items, { areas, cardiffScope = 'saved', choices = {} } = {}) {
  return items.filter(item => {
    if (areas && !areas.includes(item.area)) return false
    if (item.area !== 'events' || cardiffScope === 'all') return true
    // An event she added to Cardiff Life herself is hers already; the researched ones show once she chooses them.
    if (item.meta?.own) return true
    const choice = choices[item.meta?.eventId]
    return cardiffScope === 'going' ? choice?.status === 'going' : Boolean(choice)
  }).map(item => item.area === 'events' && choices[item.meta?.eventId]
    ? { ...item, choice: choices[item.meta.eventId].status }
    : item)
}

// Cardiff Life keeps a snapshot of a saved event even when research removes it.
// These remain browser-local plans; never send them back to the source files.
export function withSavedCardiffItems(items, choices, from, to, knownEventIds = null) {
  const existing = new Set([...(knownEventIds || []), ...items.filter(item => item.area === 'events').map(item => item.meta?.eventId)])
  const saved = Object.entries(choices).flatMap(([id, choice]) => {
    const event = choice.snapshot
    if (existing.has(id) || !event || !isDateKey(event.date) || !['going', 'maybe'].includes(choice.status)) return []
    const time = /^\d{2}:\d{2}$/.test(event.start_time || '') ? event.start_time : ''
    const endTime = /^\d{2}:\d{2}$/.test(event.end_time || '') ? event.end_time : ''
    const start = time ? londonDateTime(event.date, time) : ''
    const endDay = endTime < time ? addDays(event.date, 1) : event.date
    const end = start && endTime ? londonDateTime(endDay, endTime) : ''
    const item = {
      id: `cardiff-saved:${id}`, area: 'events', kind: start ? 'fixed' : 'plan',
      title: event.name || 'Saved Cardiff event', start: start || event.date,
      end: end || null, all_day: !start,
      href: '/cardiff-life', location: event.location || '',
      meta: { eventId: id, savedSnapshot: true }
    }
    return itemOverlaps(item, from, to) ? [item] : []
  })
  return [...items, ...saved]
}

export function sortCalendarItems(items) {
  return [...items].sort((a, b) =>
    String(a.start).localeCompare(String(b.start)) || String(a.title).localeCompare(String(b.title)))
}

export function isComplete(item) {
  return Boolean(item.meta?.completed || item.meta?.done) || DONE_STATUSES.has(String(item.meta?.status || '').toLowerCase())
}

export function attentionReason(item, today) {
  if (isComplete(item)) return ''
  const day = dateKey(item.start)
  if (!day) return ''
  if (day < today) {
    if ((item.area === 'core' && item.meta?.type === 'task') || (item.area === 'study' && item.kind === 'deadline') || item.meta?.type === 'followup') return 'Overdue'
    return ''
  }
  if (day > addDays(today, 14)) return ''
  if (item.meta?.type === 'birthday') return day === today ? 'Birthday today' : 'Birthday ahead'
  if (item.meta?.type === 'followup' || item.kind === 'deadline') return day === today ? 'Due today' : 'Coming due'
  if (item.meta?.type === 'renewal' || (item.area === 'money' && item.kind === 'reminder')) return 'Renewal ahead'
  if (item.area === 'relationships' && item.kind === 'reminder') return day === today ? 'Follow-up due' : 'Follow-up ahead'
  return ''
}

export function todayGroups(items, today) {
  const active = sortCalendarItems(items.filter(item => !isComplete(item)))
  const weekEnd = addDays(today, 6)
  const todayItems = active.filter(item => itemOverlaps(item, today, today))
  const weekItems = active.filter(item => itemOverlaps(item, addDays(today, 1), weekEnd))
  const attention = active.map(item => ({ ...item, attention: attentionReason(item, today) }))
    .filter(item => item.attention)
  return { today: todayItems, week: weekItems, attention }
}
