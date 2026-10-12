import { dateKey, isDateKey, addDays, inRange, itemOverlaps, londonDateTime } from '../../code/life-os/shared/calendar.js'
import { mapNativeStudy } from '../study/calendar.mjs'
import { firstScreen } from '../career/first-screen.mjs'

const inactive = new Set(['archived', 'cancelled', 'canceled', 'deleted', 'inactive', 'rejected', 'closed'])
const finished = new Set(['done', 'completed', 'complete', 'bought', 'given', 'skipped'])
// A finished task or plan of her own stays on its day, marked done, so the calendar is also a history.
const kept = new Set(['done', 'completed', 'complete'])
const stateOf = value => String(value ?? '').trim().toLowerCase()
const array = value => Array.isArray(value) ? value : []
const id = value => typeof value === 'string' && value.trim() ? value : null
const available = row => row && !row.archived && !row.deleted && !inactive.has(stateOf(row.status))
const text = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback

// Local source wall times are interpreted in the app's Europe/London zone,
// never through Node's host timezone. Missing or ambiguous clocks are omitted.
function temporal(value) {
  if (isDateKey(value)) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(value)) return londonInstant(value.slice(0, 10), value.slice(11))
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i.test(value)) return null
  if (!isDateKey(value.slice(0, 10)) || !dateKey(value)) return null
  const parsed = new Date(value)
  return Number.isFinite(+parsed) ? parsed.toISOString() : null
}

function item(values, range) {
  let start = temporal(values.start)
  if (!start) return null
  let end = values.end == null || values.end === '' ? null : temporal(values.end)
  if (values.end && !end) return null
  if (values.all_day) { start = dateKey(start); end = end ? dateKey(end) : null }
  const allDay = isDateKey(start)
  if (end && (allDay !== isDateKey(end) || (allDay ? end < start : Date.parse(end) < Date.parse(start)))) return null
  const result = { ...values, start, end, all_day: allDay }
  return itemOverlaps(result, range.from, range.to) ? result : null
}

function annualDates(value, range) {
  const birthday = temporal(value)
  const original = birthday && dateKey(birthday)
  if (!original) return []
  const dates = []
  for (let year = Number(range.from.slice(0, 4)); year <= Number(range.to.slice(0, 4)); year += 1) {
    const candidate = `${year}-${original.slice(5)}`
    if (isDateKey(candidate) && inRange(candidate, range.from, range.to)) dates.push(candidate)
  }
  return dates
}

// A time block belongs to the area it names; other entries to the area of their type.
const blockAreas = new Set(['study', 'career', 'money', 'home', 'relationships', 'events'])
const entryAreas = {
  module: 'study', 'module-session': 'study', assignment: 'study',
  'job-application': 'career', 'academic-application': 'career',
  message: 'relationships', interaction: 'relationships', 'important-date': 'relationships', 'gift-idea': 'relationships',
  'shopping-item': 'home', meal: 'home',
}

export function mapEntries(value, range) {
  const output = []
  for (const entry of array(Array.isArray(value) ? value : value?.entries)) {
    const done = kept.has(stateOf(entry.status))
    if (!id(entry?.id) || !available(entry) || (finished.has(stateOf(entry.status)) && !done)) continue
    let details = entry.details ?? {}
    if (typeof details === 'string') { try { details = JSON.parse(details) } catch { details = {} } }
    if (inactive.has(stateOf(details.status)) || finished.has(stateOf(details.status))) continue
    const type = entry.type
    if (type === 'repeat') continue   // a repeating plan: its days come as worked-out entries (shared/routines.js)
    // Filed under a room: the calendar area of that room when it has one, and the room's name either way.
    const room = type !== 'time-block' && typeof details.area === 'string' ? details.area : ''
    const base = {
      id: `core:entry:${entry.id}`, area: type === 'time-block' && blockAreas.has(details.area) ? details.area : blockAreas.has(room) ? room : entryAreas[type] ?? 'core',
      kind: ['event', 'appointment', 'performance', 'interaction'].includes(type) ? 'fixed'
        : type === 'important-date' || type === 'message' ? 'reminder'
          : ['assignment', 'academic-application'].includes(type) ? 'deadline' : 'plan',
      title: text(entry.title, text(details.title, text(details.name, 'Untitled entry'))),
      href: `/ledger#entry-${encodeURIComponent(entry.id)}`,
      meta: { source: 'core', readonly: false, entryId: entry.id, type, status: entry.status, archetype: entry.archetype, ...(room ? { room } : {}), ...(done ? { completed: true } : {}),
        // One day of a repeating plan that she has not acted on: what it takes to make it a real entry when she does.
        ...(entry.virtual ? { routine: { id: details.routine, type, start_at: entry.start_at, end_at: entry.end_at ?? null, all_day: Boolean(entry.all_day), area: details.area ?? '' } } : {}) },
      ...(details.location || details.venue ? { location: text(details.location ?? details.venue, '') } : {}),
    }
    const start = entry.start_at || details.deadline || details.exam_date || (type === 'trip' && details.start)
    if (type === 'important-date' && details.recurs !== false) {
      for (const date of annualDates(start, range)) {
        output.push({ ...base, id: `${base.id}:${date}`, start: date, end: null, all_day: true })
      }
    } else {
      const mapped = item({ ...base, start, end: entry.end_at || (type === 'trip' && details.end) || null, all_day: Boolean(entry.all_day) }, range)
      if (mapped) output.push(mapped)
    }
  }
  return output
}

export function mapPeople(value, range) {
  return array(value?.people ?? value).flatMap(person => {
    if (!id(person?.id) || !available(person)) return []
    return annualDates(person.birthday, range).map(date => ({
      id: `relationships:birthday:${person.id}:${date}`, area: 'relationships', kind: 'reminder',
      title: `${text(person.name, 'Someone')}’s birthday`, start: date, end: null, all_day: true,
      href: `/calendar?date=${date}`, meta: { source: 'people', readonly: true, personId: person.id, type: 'birthday' },
    }))
  })
}

export function mapStudy(value, range) {
  if (value?.nativeWorkspace) return mapNativeStudy(value.nativeWorkspace, range.from, range.to, value.hubPlans)
  if (!value) return []
  const state = value.state ?? value
  const settings = state.settings ?? {}
  const byId = new Map(array(value.baseCards).map(card => [card.id, card]))
  for (const card of array(state.addedCards)) byId.set(card.id, card)
  // Also accepts already merged fixture cards; saved overlay records alone
  // cannot reconstruct a plan, so they do not invent dates or titles.
  if (Array.isArray(state.cards)) for (const card of state.cards) byId.set(card.id, card)
  const output = []
  for (const base of byId.values()) {
    const progress = !Array.isArray(state.cards) ? state.cards?.[base.id] ?? {} : {}
    const edits = progress.edits ?? {}
    const card = { ...base, ...edits, status: progress.status ?? edits.status ?? base.status }
    const module = edits.moduleGroup ?? edits.module ?? base.moduleGroup ?? base.module
    if (!id(card.id) || !available(card) || progress.done || card.done || finished.has(stateOf(card.status))) continue
    if (settings.mat700Active === false && module === 'MAT700') continue
    const tags = array(card.tags)
    const title = text(card.title, 'Study plan')
    const baseItem = { area: 'study', href: '/study', meta: { source: 'summer-rescue', readonly: true, cardId: card.id, module, status: card.status, dueDate: temporal(card.dueDate), startDate: temporal(card.startDate) } }
    const startItem = item({ ...baseItem, id: `study:start:${card.id}`, kind: tags.includes('fixed') ? 'fixed' : 'plan',
      title: `Start · ${title}`, start: card.startDate, meta: { ...baseItem.meta, type: 'study-start' },
    }, range)
    if (startItem) output.push(startItem)
    const timedDue = temporal(card.dueDateTime), due = temporal(card.dueDate)
    // Date edits override old imported timing when the two fields disagree.
    const deadline = timedDue && (!due || dateKey(timedDue) === dateKey(due)) ? timedDue : due
    const dueItem = item({ ...baseItem, id: `study:deadline:${card.id}`, kind: tags.includes('date-watch') ? 'reminder' : 'deadline',
      title, start: deadline, meta: { ...baseItem.meta, type: 'study-deadline' },
    }, range)
    if (dueItem) output.push(dueItem)
  }
  for (const [module, date] of Object.entries(settings.moduleExamDates ?? {})) {
    if (module === 'mat700' && settings.mat700Active === false) continue
    const mapped = item({
      id: `study:exam:${module}`, area: 'study', kind: 'fixed', title: `${module} exam`, start: date,
      href: '/study', meta: { source: 'summer-rescue', readonly: true, module, confirmedDate: true },
    }, range)
    if (mapped) output.push(mapped)
  }
  return output
}

export function mapCareer(value, range, today = dateKey(new Date())) {
  const output = []
  // The jobs JobMap's first screen lists. A closing date goes on the calendar for the shortlisted
  // ones among these and for jobs already applied for; the scheduled searches shortlist everything
  // they find, so the shortlist alone would fill the calendar with jobs she never chose.
  let current = null
  try { current = new Set(firstScreen(value, today).map((entry) => entry.job.id)) } catch { current = null }
  for (const job of array(value?.jobs ?? value)) {
    if (!id(job?.id) || !available(job)) continue
    const status = stateOf(job.status)
    const applied = ['applied', 'interview', 'offer'].includes(status) || Boolean(temporal(job.applied))
    const title = `${text(job.role, 'Job')} · ${text(job.company, 'Company')}`
    const base = { area: 'career', href: `/jobmap#job=${encodeURIComponent(job.id)}`, meta: { source: 'jobmap', readonly: true, jobId: job.id, status: job.status, saved: Boolean(job.saved) } }
    if ((applied || (job.saved && (!current || current.has(job.id)))) && job.availability !== 'closed') {
      const mapped = item({ ...base, id: `career:deadline:${job.id}`, kind: 'deadline', title, start: job.deadline, meta: { ...base.meta, type: 'deadline' } }, range)
      if (mapped) output.push(mapped)
    }
    if (job.followUp) {
      const mapped = item({ ...base, id: `career:follow-up:${job.id}`, kind: 'reminder', title: `Follow up · ${title}`, start: job.followUp, meta: { ...base.meta, type: 'followup' } }, range)
      if (mapped) output.push(mapped)
    }
  }
  return output
}

// Uses the planner's stored anchor day, including after a shortened February.
export function subscriptionDates(sub, range) {
  if (!available(sub) || sub.paused || !isDateKey(sub.nextDue) || !['weekly', 'monthly', 'yearly'].includes(sub.interval)) return []
  const anchor = Number.isInteger(sub.anchorDay) && sub.anchorDay >= 1 && sub.anchorDay <= 31 ? sub.anchorDay : Number(sub.nextDue.slice(8))
  const result = []
  if (sub.interval === 'weekly') {
    const distance = Math.floor((Date.parse(range.from + 'T12:00:00Z') - Date.parse(sub.nextDue + 'T12:00:00Z')) / 86400000)
    let date = addDays(sub.nextDue, Math.max(0, Math.ceil(distance / 7)) * 7)
    for (; date <= range.to; date = addDays(date, 7)) if (inRange(date, range.from, range.to)) result.push(date)
    return result
  }
  const originYear = Number(sub.nextDue.slice(0, 4)), originMonth = Number(sub.nextDue.slice(5, 7)) - 1
  const fromIndex = Number(range.from.slice(0, 4)) * 12 + Number(range.from.slice(5, 7)) - 1
  const originIndex = originYear * 12 + originMonth
  const step = sub.interval === 'yearly' ? 12 : 1
  let n = Math.max(0, Math.floor((fromIndex - originIndex) / step))
  while (true) {
    const monthIndex = originIndex + n * step, year = Math.floor(monthIndex / 12), month = monthIndex % 12
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const date = `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(Math.min(anchor, last)).padStart(2, '0')}`
    // The stored nextDue is authoritative, even if its current anchor changed.
    const actual = n === 0 ? sub.nextDue : date
    if (actual > range.to) break
    if (actual >= sub.nextDue && inRange(actual, range.from, range.to)) result.push(actual)
    n += 1
  }
  return result
}

export function mapBudget(value, range) {
  const state = value?.state ?? value ?? {}
  const output = array(state.subscriptions).flatMap(sub => !id(sub?.id) ? [] : subscriptionDates(sub, range).map(date => ({
    id: `money:subscription:${sub.id}:${date}`, area: 'money', kind: 'reminder',
    title: text(sub.name, 'Subscription renewal'), start: date, end: null, all_day: true, href: '/budget',
    meta: { source: 'budget', readonly: true, type: 'renewal', subscriptionId: sub.id, costPence: sub.costPence, interval: sub.interval, auto: sub.auto !== false },
  })))
  for (const [month, budget] of Object.entries(state.budgets ?? {})) {
    const date = `${month}-01`
    if (!budget || typeof budget !== 'object' || !isDateKey(date) || !inRange(date, range.from, range.to)) continue
    output.push({ id: `money:month:${month}`, area: 'money', kind: 'plan', title: 'Budget month starts',
      start: date, end: null, all_day: true, href: '/budget', meta: { source: 'budget', readonly: true, type: 'budget-month', month },
    })
  }
  return output
}

export function mapHome(value, range) {
  const state = value?.state ?? value ?? {}, output = []
  for (const list of array(state.lists)) {
    if (!id(list?.id) || !available(list) || !array(list.lines).some(line => line.status === 'planned')) continue
    const mapped = item({ id: `home:shopping:${list.id}`, area: 'home', kind: 'plan', title: text(list.name, 'Shopping plan'), start: list.date,
      href: '/budget', meta: { source: 'budget', readonly: true, listId: list.id, plannedItems: list.lines.filter(line => line.status === 'planned').length },
    }, range)
    if (mapped) output.push(mapped)
  }
  for (const meal of array(state.mealEntries)) {
    if (!id(meal?.id) || !available(meal) || meal.status !== 'planned') continue
    const mapped = item({ id: `home:meal:${meal.id}`, area: 'home', kind: 'plan', title: text(meal.name, 'Meal plan'), start: meal.date,
      href: '/budget', meta: { source: 'budget', readonly: true, mealId: meal.id, slot: meal.slot },
    }, range)
    if (mapped) output.push(mapped)
  }
  return output
}

export function londonInstant(date, time) {
  return londonDateTime(date, time) || null
}

export function mapEvents(value, range) {
  const output = []
  for (const event of array(value?.events ?? value)) {
    if (!id(event?.event_id) || !['upcoming', 'needs_verification', 'recurring', 'past'].includes(event.status) || !isDateKey(event.date)) continue
    const start = londonInstant(event.date, event.start_time)
    let end = null
    if (start && event.end_time) {
      const endDate = event.end_time < event.start_time ? addDays(event.date, 1) : event.date
      end = londonInstant(endDate, event.end_time)
    }
    const mapped = item({
      id: `events:cardiff:${event.event_id}`, area: 'events', kind: 'fixed', title: text(event.name, 'Cardiff event'),
      start: start || event.date, end: start ? end : null, href: '/cardiff-life', ...(event.location ? { location: event.location } : {}),
      meta: { source: 'cardiff-life', readonly: true, eventId: event.event_id, status: event.status, candidate: event.own !== true, needsVerification: event.status === 'needs_verification', ...(event.own === true ? { own: true } : {}) },
    }, range)
    if (mapped) output.push(mapped)
  }
  return output
}
