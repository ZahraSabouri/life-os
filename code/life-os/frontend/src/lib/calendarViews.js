// The calendar's address and its four views, worked out without React so the tests share them.
// The address holds everything the page shows: the view and its month, week or year, the areas
// left out, the Cardiff scope, a search, and the day (and the thing on it) open in the pop-up.
import { addDays, dateKey, isDateKey, itemOverlaps } from '../../../shared/calendar.js'
import { calendarArea } from './calendar.js'
import { clockOf } from './day.js'

export const CALENDAR_VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'agenda', label: 'List' },
  { key: 'year', label: 'Year' },
]
// The pop-up's tabs: the day itself, then the parts that have a panel of their own on Today.
export const DAY_TABS = [
  { key: 'day', label: 'The day' },
  { key: 'study', label: 'Study' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'home', label: 'Home' },
  { key: 'health', label: 'Health' },
]
export const CARDIFF_SCOPES = ['all', 'saved', 'going']
// What belongs to the pop-up in the address: closing it takes all of these out.
export const DAY_KEYS = ['day', 'item', 'tab']

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/
export const isMonthKey = (value) => typeof value === 'string' && MONTH_KEY.test(value)
const weekdayOf = (key) => (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7

export function mondayOf(key) { return addDays(key, -weekdayOf(key)) }
export function lastOfMonth(month) {
  const [year, number] = month.split('-').map(Number)
  return `${month}-${String(new Date(Date.UTC(year, number, 0)).getUTCDate()).padStart(2, '0')}`
}
export function shiftMonth(month, amount) {
  const [year, number] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, number - 1 + amount, 1))
  return date.toISOString().slice(0, 7)
}

// The ISO week number (Monday to Sunday; week 1 holds the year's first Thursday).
export function isoWeek(key) {
  const thursday = addDays(key, 3 - weekdayOf(key))
  const first = `${thursday.slice(0, 4)}-01-01`
  return Math.floor((Date.parse(`${thursday}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / (7 * 86_400_000)) + 1
}

// What the address asks for. Anything missing or wrong falls back to today, so an old or
// mistyped link still opens the calendar. `?date=` is the older way of naming a day.
export function readCalendarAddress(params, today, areaKeys = []) {
  const get = (key) => params.get(key) ?? ''
  const view = CALENDAR_VIEWS.some((entry) => entry.key === get('view')) ? get('view') : 'month'
  const legacy = isDateKey(get('date')) ? get('date') : ''
  const day = isDateKey(get('day')) ? get('day') : legacy
  const anchor = day || today
  const month = isMonthKey(get('month')) ? get('month') : anchor.slice(0, 7)
  // The week follows the month when it is not named, so switching view stays put; the year is the month's.
  const inMonth = today.slice(0, 7) === month ? today : `${month}-01`
  const week = mondayOf(isDateKey(get('week')) ? get('week') : day && day.slice(0, 7) === month ? day : inMonth)
  const year = month.slice(0, 4)
  const hidden = get('hide').split(',').filter((key) => areaKeys.includes(key))
  return {
    view, month, week, year, day, legacy,
    item: day ? get('item').slice(0, 300) : '',
    tab: DAY_TABS.some((entry) => entry.key === get('tab')) ? get('tab') : 'day',
    hidden,
    areas: areaKeys.filter((key) => !hidden.includes(key)),
    cardiff: CARDIFF_SCOPES.includes(get('cardiff')) ? get('cardiff') : 'all',
    q: get('q').slice(0, 100),
  }
}

// The days the view draws, and so the dates the calendar is asked for.
export function viewRange(address) {
  if (address.view === 'week') return { from: address.week, to: addDays(address.week, 6) }
  if (address.view === 'year') return { from: `${address.year}-01-01`, to: `${address.year}-12-31` }
  if (address.view === 'agenda') return { from: `${address.month}-01`, to: lastOfMonth(address.month) }
  const grid = monthGrid(address.month)
  return { from: grid.from, to: grid.to }
}

// One step back or forward in the view: a week (the month follows it), a month, or a year.
export function stepView(address, amount) {
  if (address.view === 'week') {
    const week = addDays(address.week, 7 * amount)
    return { week, month: addDays(week, 3).slice(0, 7) }
  }
  return { month: shiftMonth(address.month, address.view === 'year' ? 12 * amount : amount), week: null }
}

// What "Today" puts in the address for each view.
export function todayIn(view, today) {
  return { month: today.slice(0, 7), week: view === 'week' ? mondayOf(today) : null }
}

// Monday to Sunday rows that hold the month, each with its ISO week number.
export function monthGrid(month, today = '') {
  const first = `${month}-01`
  const last = lastOfMonth(month)
  const from = mondayOf(first)
  const to = addDays(last, 6 - weekdayOf(last))
  const weeks = []
  for (let start = from; start <= to; start = addDays(start, 7)) {
    const days = []
    for (let index = 0; index < 7; index += 1) {
      const key = addDays(start, index)
      days.push({ key, number: Number(key.slice(8)), current: key.slice(0, 7) === month, today: key === today, weekend: index > 4 })
    }
    weeks.push({ start, number: isoWeek(start), days })
  }
  return { from, to, first, last, weeks }
}

export function weekDays(monday, today = '') {
  return Array.from({ length: 7 }, (_, index) => {
    const key = addDays(monday, index)
    return { key, number: Number(key.slice(8)), today: key === today, weekend: index > 4 }
  })
}

export function yearMonths(year) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
}

export function itemsOn(items, key) {
  return items.filter((item) => itemOverlaps(item, key, key))
}

// The first and last London day a thing is on, by the same rule as itemOverlaps: a timed end
// at midnight belongs to the day before.
export function daySpan(item) {
  const first = dateKey(item.start)
  let last = dateKey(item.end) || first
  if (!item.all_day && item.end) {
    const instant = Date.parse(item.end)
    if (Number.isFinite(instant)) last = dateKey(new Date(instant - 1))
  }
  return { first, last: !last || last < first ? first : last }
}

// The things of each day from `from` to `to`, worked out once for the whole view.
export function groupByDay(items, from, to) {
  const days = new Map()
  for (const item of items) {
    const { first, last } = daySpan(item)
    if (!first) continue
    for (let day = first < from ? from : first; day && day <= last && day <= to; day = addDays(day, 1)) {
      if (!days.has(day)) days.set(day, [])
      days.get(day).push(item)
    }
  }
  return days
}

// Her search: words in the title, the place, the area or the kind.
export function matchesSearch(item, q) {
  const words = String(q ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = [item.title, item.location, calendarArea(item.area).label, item.kind, item.meta?.room, item.meta?.module].filter(Boolean).join(' ').toLowerCase()
  return words.every((word) => text.includes(word))
}

// A note she wrote for a day is shown with the day, not as a thing to do on it.
export const isNote = (item) => item.meta?.type === 'note'

// ---- Where a thing opens ----------------------------------------------------------------
const PLACES = [
  ['/study', 'Study hub'], ['/cardiff-life', 'Cardiff Life'], ['/jobmap', 'JobMap'], ['/budget', 'Budget'],
  ['/ledger', 'Ledger'], ['/health', 'Health'], ['/people', 'People'], ['/journal', 'Journal'],
  ['/today', 'Today'], ['/planner', 'the week planner'], ['/room', 'its room'],
]
export function placeOf(href) {
  const path = String(href ?? '').split(/[?#]/)[0]
  return PLACES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? ''
}

// A link to one day of the calendar, open in the pop-up.
export function calendarDayHref(day, item = '') {
  const params = new URLSearchParams({ month: day.slice(0, 7), day })
  if (item) params.set('item', item)
  return `/calendar?${params}`
}

// ---- The week's hours --------------------------------------------------------------------
const minutes = (clock) => { const [hour, minute] = clock.split(':').map(Number); return hour * 60 + minute }
const SHORTEST = 30

// Each timed thing of the day, placed by its London clock times. Things that overlap share the
// width: `column` of `columns` in their group. Something that began the day before starts at
// midnight; something that runs past midnight ends there.
export function placeTimed(items, day) {
  const placed = []
  for (const item of items) {
    if (item.all_day || !itemOverlaps(item, day, day)) continue
    const startDay = dateKey(item.start)
    const start = startDay < day ? 0 : minutes(clockOf(item.start))
    let end = start + SHORTEST
    if (item.end) {
      const endDay = dateKey(new Date(Date.parse(item.end) - 1))
      end = endDay > day ? 24 * 60 : minutes(clockOf(item.end))
    }
    if (end <= start) end = Math.min(24 * 60, start + SHORTEST)
    placed.push({ item, start, end: Math.max(end, start + 15) })
  }
  placed.sort((a, b) => a.start - b.start || b.end - a.end || String(a.item.title).localeCompare(String(b.item.title)))
  let group = []
  let groupEnd = -1
  const finish = () => { const columns = Math.max(0, ...group.map((entry) => entry.column + 1)); for (const entry of group) entry.columns = columns }
  for (const entry of placed) {
    if (entry.start >= groupEnd && group.length) { finish(); group = [] }
    const taken = new Set(group.filter((other) => other.end > entry.start).map((other) => other.column))
    let column = 0
    while (taken.has(column)) column += 1
    entry.column = column
    group.push(entry)
    groupEnd = Math.max(groupEnd, entry.end)
  }
  if (group.length) finish()
  return placed
}

// The hours the week grid opens on: from the earliest thing (or 08:00) to the latest (or 20:00).
export function weekHours(placed) {
  const first = Math.min(8 * 60, ...placed.map((entry) => entry.start))
  const last = Math.max(20 * 60, ...placed.map((entry) => entry.end))
  return { from: Math.floor(first / 60), to: Math.min(24, Math.ceil(last / 60)) }
}
