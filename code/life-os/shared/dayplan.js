// A day's things as one model, and "Running late". Shared by the pages and the tests (stage 8).
// A thing can move when it is hers and has a time: a plan or task of Life OS (one day of a
// repeating plan too) or a Study block. Classes, appointments and events stay, as do things that
// are done or kept elsewhere (meals, shopping); those are what moved things go around.
import { londonDateTime } from './calendar.js'

const timed = (item) => Boolean(item?.start && String(item.start).includes('T') && item.end && Date.parse(item.end) > Date.parse(item.start))

// One thing on the day, from a checklist row (DayChecklist / lib/checklist.js): { key, title, item, done, how }.
export function dayThing(row) {
  const item = row.item ?? null
  const study = String(row.key).startsWith('study:block:')
  const own = row.how === 'own' && item?.meta?.source === 'core' && item.kind !== 'fixed' && Boolean(item.meta?.entryId)
  const kind = study ? 'study' : own ? (item.meta?.routine ? 'routine' : item.meta?.type === 'task' ? 'task' : 'plan') : 'fixed'
  const movable = !row.done && timed(item) && (study || own)
  return { id: row.key, title: row.title, item, kind, done: Boolean(row.done), timed: timed(item), movable,
    start: timed(item) ? Date.parse(item.start) : null, end: timed(item) ? Date.parse(item.end) : null,
    why: movable ? '' : row.done ? 'done' : !timed(item) ? 'no time' : 'fixed' }
}
export const dayThings = (rows = []) => rows.map(dayThing)

// "Running late": what is left of the day moves `minutes` later. The first thing not yet over moves
// by the delay; each next one moves only as far as it must to start after the one before (a gap
// soaks the delay up). A moved thing never lands on a fixed thing: it goes after it. What would end
// after the day's end does not move and is named, so it can be moved to another day.
// Answers { moves: [{ thing, start, end }], overflow: [thing] }, times in milliseconds.
export function planLate(things, { now, minutes, date, gap = 0 }) {
  const dayEnd = Date.parse(londonDateTime(date, '23:59') || `${date}T23:59:00Z`)
  const left = things.filter((t) => t.timed && !t.done && t.end > now).sort((a, b) => a.start - b.start || a.end - b.end)
  const fixed = things.filter((t) => t.timed && !t.movable && !t.done)
  const moves = [], overflow = []
  let cursor = null
  for (const t of left.filter((x) => x.movable)) {
    const length = t.end - t.start
    let start = cursor === null ? t.start + minutes * 60000 : Math.max(t.start, cursor + gap * 60000)
    if (start !== t.start) {
      for (let guard = 0; guard < 50; guard += 1) {
        const block = fixed.find((f) => f.start < start + length && start < f.end)
        if (!block) break
        start = block.end + gap * 60000
      }
    }
    if (start + length > dayEnd) { overflow.push(t); continue }
    if (start !== t.start) moves.push({ thing: t, start, end: start + length })
    cursor = start + length
  }
  return { moves, overflow }
}

// A London clock time ("14:05") of an instant, for the Study hub's own plan.
export function londonClock(ms) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))
}
