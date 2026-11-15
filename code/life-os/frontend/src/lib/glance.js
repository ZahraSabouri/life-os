// The week and the month as pictures: what goes where, worked out from the calendar's items.
// Pure, so the page and the tests share it.
import { dateKey } from '../../../shared/calendar.js'
import { isComplete } from './calendar.js'
import { clockOf } from './day.js'

export const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
export const mondayOf = (day) => addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7))
const minutes = (clock) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5))

// The group a timed thing counts towards in the week's hours: a module by its code, work, job
// applications, or its area.
export function groupOf(item) {
  const title = String(item.title ?? '')
  const code = /^(?:[A-Z]{2,4}\d{3,4})(?=\s|·|$)/.exec(title)?.[0]
  if (item.meta?.type === 'study-session') return code ? `${code} classes` : 'Classes'
  if (item.area === 'study' && code) return code
  if (/^Work\b/.test(title)) return 'Work'
  if (/^Job applications/i.test(title)) return 'Applications'
  if (/^(Research|Review PhD|Thesis)/.test(title) || item.meta?.room === 'academia') return 'Research'
  if (item.meta?.type === 'workout' || item.area === 'body') return 'Health'
  if (item.area === 'events') return 'Events'
  if (item.area === 'study') return 'Study'
  if (item.area === 'career') return 'Career'
  return 'Other'
}

const timed = (item) => !item.all_day && String(item.start ?? '').length > 10 && item.end
// A timed thing within one day, as minutes from midnight, London time.
function span(item) {
  const day = dateKey(item.start)
  const start = minutes(clockOf(item.start))
  const end = dateKey(item.end) === day ? minutes(clockOf(item.end)) : 24 * 60
  return { day, start, end: Math.max(end, start + 15) }
}

// Things that overlap share their day's width side by side, as a calendar's week does.
function lanes(blocks) {
  blocks.sort((a, b) => a.start - b.start || b.end - a.end)
  const groups = []
  let current = []
  let reach = -1
  for (const block of blocks) {
    if (current.length && block.start >= reach) { groups.push(current); current = []; reach = -1 }
    current.push(block)
    reach = Math.max(reach, block.end)
  }
  if (current.length) groups.push(current)
  for (const group of groups) {
    const ends = []
    for (const block of group) {
      let lane = ends.findIndex((end) => end <= block.start)
      if (lane < 0) { lane = ends.length; ends.push(block.end) } else ends[lane] = block.end
      block.lane = lane
    }
    for (const block of group) block.lanes = ends.length
  }
  return blocks
}

// A week: seven days, each with its timed blocks laid out, and its all-day things. `checks` is
// { date: { key: … } } from the day's checklist; a ticked or done thing is marked done.
export function weekPicture(items, monday, checks = {}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index))
  const hours = new Map()
  const picture = days.map((day) => {
    const own = items.filter((item) => dateKey(item.start) === day || (item.all_day && item.end && dateKey(item.start) < day && dateKey(item.end) >= day))
    const blocks = lanes(own.filter(timed).map((item) => {
      const { start, end } = span(item)
      const done = isComplete(item) || Boolean(checks[day]?.[item.id])
      const group = groupOf(item)
      hours.set(group, (hours.get(group) ?? 0) + (end - start) / 60)
      return { id: item.id, title: item.title, area: item.area, start, end, done, group }
    }))
    const allDay = own.filter((item) => !timed(item)).map((item) => ({ id: item.id, title: item.title, area: item.area, kind: item.kind, job: item.meta?.source === 'jobmap', done: isComplete(item) || Boolean(checks[day]?.[item.id]) }))
    // What falls due to her that day first; job closings are counted, not named.
    const due = allDay.filter((entry) => !entry.job)
    return { day, blocks, allDay, due, jobs: allDay.length - due.length }
  })
  const first = Math.min(8 * 60, ...picture.flatMap((day) => day.blocks.map((block) => block.start)))
  const last = Math.max(19 * 60, ...picture.flatMap((day) => day.blocks.map((block) => block.end)))
  return {
    days: picture,
    from: Math.floor(first / 60) * 60, to: Math.min(24 * 60, Math.ceil(last / 60) * 60),
    hours: [...hours].map(([group, value]) => ({ group, hours: Math.round(value * 10) / 10 })).sort((a, b) => b.hours - a.hours),
  }
}

// A month: its weeks from Monday, each day with its hours by group and what falls due.
export function monthPicture(items, month, checks = {}) {
  const first = `${month}-01`
  const start = mondayOf(first)
  const lastDay = addDays(`${addDays(`${month}-28`, 4).slice(0, 7)}-01`, -1)
  const end = addDays(mondayOf(lastDay), 6)
  const days = []
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const own = items.filter((item) => dateKey(item.start) === day)
    const hours = new Map()
    let total = 0
    let done = 0
    for (const item of own.filter(timed)) {
      const { start: from, end: to } = span(item)
      const group = groupOf(item)
      hours.set(group, (hours.get(group) ?? 0) + (to - from) / 60)
      total += 1
      if (isComplete(item) || checks[day]?.[item.id]) done += 1
    }
    const due = own.filter((item) => item.kind === 'deadline' && item.meta?.source !== 'jobmap' && item.meta?.type !== 'study-block').map((item) => item.title)
    const jobs = own.filter((item) => item.meta?.source === 'jobmap' && item.kind === 'deadline').length
    days.push({ day, inMonth: day.slice(0, 7) === month, hours: [...hours].map(([group, value]) => ({ group, hours: Math.round(value * 10) / 10 })).sort((a, b) => b.hours - a.hours), total, done, due, jobs })
  }
  return { weeks: Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)) }
}

// One colour for each group, from the area it belongs to, so the picture matches the calendar.
export function areaOfGroup(group) {
  if (/classes$|^Classes$|^[A-Z]{2,4}\d{3,4}$|^Study$/.test(group)) return 'study'
  return { Work: 'career', Applications: 'career', Career: 'career', Research: 'study', Health: 'body', Events: 'events' }[group] ?? 'core'
}
