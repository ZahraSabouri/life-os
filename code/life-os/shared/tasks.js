// Tasks: what a task is beyond its title, where it stands, and what is for a given day.
// Shared by the server (to check what is saved) and the pages (to arrange what is shown).

// Where a task stands. A task with no lane of its own is placed by its day (laneOf).
export const LANES = [
  { id: 'today', label: 'Today', hint: 'For today, or late' },
  { id: 'week', label: 'This week', hint: 'In the next seven days' },
  { id: 'deep', label: 'Deep work', hint: 'Needs a long, quiet block' },
  { id: 'backlog', label: 'Backlog', hint: 'No day yet, or further off' },
  { id: 'waiting', label: 'Waiting', hint: 'On someone else' },
  { id: 'rescue', label: 'Rescue', hint: 'Slipped more than two days: do it, give it a new day, or take it off' },
]
// A task late by more than this many days has slipped: it waits in Rescue, not on today's cards.
export const SLIPPED_AFTER_DAYS = 2
export const LANE_IDS = LANES.map((lane) => lane.id)
export const laneLabel = (id) => LANES.find((lane) => lane.id === id)?.label ?? (id === 'done' ? 'Done' : '')

// When in the day it fits.
export const SLOTS = [
  { id: 'am', label: 'Morning' },
  { id: 'pm', label: 'Afternoon' },
  { id: 'eve', label: 'Evening' },
  { id: 'any', label: 'Any time' },
]
export const SLOT_IDS = SLOTS.map((slot) => slot.id)
export const slotLabel = (id) => SLOTS.find((slot) => slot.id === id)?.label ?? ''

export const PRIORITIES = [
  { id: 'high', label: 'High' },
  { id: 'med', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export const MAX_STEPS = 60
const STEP_TEXT = 300

// A new step's id: short, and unique enough within one task.
export function stepId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

// A task's steps as they are kept: [{ id, text, done }]. Text is trimmed; empty steps are dropped;
// a step without an id is given one. Throws a plain sentence when the value cannot be a list of steps.
export function cleanSteps(value) {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) throw new Error('steps must be a list')
  if (value.length > MAX_STEPS) throw new Error(`a task holds at most ${MAX_STEPS} steps`)
  const seen = new Set()
  const steps = []
  for (const raw of value) {
    const item = typeof raw === 'string' ? { text: raw } : raw
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('each step must be a text or { text, done }')
    const text = String(item.text ?? '').replace(/\s+/g, ' ').trim().slice(0, STEP_TEXT)
    if (!text) continue
    let id = typeof item.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(item.id) ? item.id : stepId()
    while (seen.has(id)) id = stepId()
    seen.add(id)
    steps.push({ id, text, done: item.done === true })
  }
  return steps.length ? steps : undefined
}

// Lines of text (one step a line, a leading "-", "*", "[ ]" or "1." dropped) as steps to keep.
export function stepsFromLines(text) {
  return String(text ?? '').split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\[[ xX]?\]|\d+[.)])\s*/, '').trim())
    .filter(Boolean).slice(0, MAX_STEPS)
    .map((line) => ({ id: stepId(), text: line.slice(0, STEP_TEXT), done: false }))
}

export const stepsDone = (steps = []) => steps.filter((step) => step.done).length

const DAY = /^\d{4}-\d{2}-\d{2}$/
const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
const londonDay = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

// The day a task is planned for (its start_at, in London), or ''.
export function taskDay(task) {
  const start = task?.start_at
  if (!start) return ''
  const text = String(start)
  if (DAY.test(text.slice(0, 10)) && (text.length <= 10 || task.all_day)) return text.slice(0, 10)
  return Number.isNaN(Date.parse(text)) ? '' : londonDay(text)
}

export const isDoneTask = (task) => task?.status === 'done'
// Kept but no longer on the list: taken off, or put away.
export const isPutAway = (task) => ['cancelled', 'archived'].includes(task?.status)

// The lane a task stands in today. Done is its own place. A lane she chose wins; otherwise
// the day decides: slipped more than two days is Rescue, today or just late is Today, the next
// six days This week, anything else Backlog.
export const hasSlipped = (day, today) => Boolean(day) && day < addDays(today, -SLIPPED_AFTER_DAYS)
export function laneOf(task, today) {
  if (isDoneTask(task)) return 'done'
  const chosen = task?.details?.lane
  if (LANE_IDS.includes(chosen)) return chosen
  const day = taskDay(task)
  if (hasSlipped(day, today)) return 'rescue'
  if (day && day <= today) return 'today'
  if (day && day <= addDays(today, 6)) return 'week'
  return 'backlog'
}

// Late: planned for a day before today and not done.
export const isLate = (task, today) => !isDoneTask(task) && !isPutAway(task) && Boolean(taskDay(task)) && taskDay(task) < today

// The tasks that belong to a day's folio: planned for that day; on today, also those just late
// (two days at most: older ones wait in Rescue) and those she put in the Today lane without a
// day. Done ones stay, ticked, on their day.
export function tasksForDay(tasks, date, today) {
  return tasks.filter((task) => {
    if (isPutAway(task)) return false
    const day = taskDay(task)
    if (day === date) return true
    if (date !== today || isDoneTask(task)) return false
    if (day) return day < today && !hasSlipped(day, today) && task.details?.lane !== 'rescue'
    return task.details?.lane === 'today'
  })
}

// How many of her tasks have slipped into Rescue (by their day, or put there).
export const slippedCount = (tasks, today) => tasks.filter((task) => !isDoneTask(task) && !isPutAway(task) && laneOf(task, today) === 'rescue').length

// Order within a list: late first, then by clock time or slot, then priority, then title.
const SLOT_ORDER = { am: 0, pm: 1, eve: 2, any: 3 }
const PRIORITY_ORDER = { high: 0, med: 1, low: 2 }
export function compareTasks(a, b) {
  const done = Number(isDoneTask(a)) - Number(isDoneTask(b))
  if (done) return done
  const dayA = taskDay(a) || '9999-12-31'
  const dayB = taskDay(b) || '9999-12-31'
  if (dayA !== dayB) return dayA.localeCompare(dayB)
  const timeA = a.all_day || String(a.start_at ?? '').length <= 10 ? '' : String(a.start_at)
  const timeB = b.all_day || String(b.start_at ?? '').length <= 10 ? '' : String(b.start_at)
  if (timeA !== timeB) return (timeA || '~').localeCompare(timeB || '~')
  const slot = (SLOT_ORDER[a.details?.slot] ?? 3) - (SLOT_ORDER[b.details?.slot] ?? 3)
  if (slot) return slot
  const priority = (PRIORITY_ORDER[a.details?.priority] ?? 1) - (PRIORITY_ORDER[b.details?.priority] ?? 1)
  if (priority) return priority
  return String(a.title ?? '').localeCompare(String(b.title ?? ''))
}

// Hours planned and hours done among tasks with an estimate.
export function hoursOf(tasks) {
  let planned = 0
  let done = 0
  for (const task of tasks) {
    const estimate = Number(task.details?.estimate)
    if (!Number.isFinite(estimate) || estimate <= 0) continue
    planned += estimate
    if (isDoneTask(task)) done += estimate
  }
  return { planned: Math.round(planned * 10) / 10, done: Math.round(done * 10) / 10 }
}

// The day a task is due by (details.due), checked as YYYY-MM-DD.
export function cleanDue(value) {
  if (value === undefined || value === null || value === '') return undefined
  const text = String(value).trim().slice(0, 10)
  if (!DAY.test(text) || Number.isNaN(Date.parse(`${text}T12:00:00Z`))) throw new Error('due must be a day (YYYY-MM-DD)')
  return text
}
