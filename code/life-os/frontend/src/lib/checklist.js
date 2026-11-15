// The day's checklist: every thing in the day, in time order, each with a tick. What a tick does
// depends on where the thing is kept:
//   own   — her own plan or task in Life OS: its status (done / to do), as everywhere else
//   card  — a Study hub card due that day: the card itself, in the Study hub
//   mail  — a thing waiting on her from the Inbox: done there
//   check — anything else (a class, a study block worked, an event, an exercise session): a tick
//           kept for that day only, so the thing itself is not changed (hosting/day/checks.mjs)
import { compareTasks, isDoneTask, isLate, stepsDone, taskDay, tasksForDay } from '@shared/tasks.js'
import { calendarArea, isComplete } from './calendar.js'
import { areaName, areaTone } from './useTasks.js'

const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)

// What sort of thing a calendar item is, in words a person uses.
export function thingKind(item) {
  const type = item?.meta?.type
  if (type === 'study-block') return 'Study block'
  if (type === 'study-session') return 'Class'
  if (type === 'study-exam') return 'Exam'
  if (type === 'study-deadline') return 'Due'
  if (item?.meta?.source === 'jobmap') return type === 'followup' ? 'Follow-up' : 'Job closes'
  if (item?.area === 'events') return 'Event'
  if (type === 'workout') return 'Exercise'
  if (type === 'appointment') return 'Appointment'
  if (type === 'repeat' || item?.meta?.routine) return 'Repeating plan'
  if (type === 'task') return 'Task'
  if (type === 'time-block') return 'Time set aside'
  if (item?.meta?.source === 'core') return 'Plan'
  return ''
}

function stopRow(stop, item, { checks, tasksById }) {
  const own = stop.entry && stop.entry.task
  const task = stop.entry && !stop.entry.routine ? tasksById.get(stop.entry.id) ?? null : null
  const card = stop.card ?? null
  const label = (stop.room && areaName(stop.room)) || calendarArea(stop.area).label
  if (stop.type === 'block') {
    const done = Boolean(checks[stop.key]) || Boolean(card?.done)
    return { key: stop.key, how: 'check', kind: 'Study block', time: stop.start, end: stop.end, title: card?.title ?? stop.title, tone: calendarArea('study').tone,
      label: card?.moduleCode || card?.module || 'Study', place: stop.place, done, card, href: stop.href, steps: card?.steps ?? [], doneWhen: card?.doneWhen ?? '', hours: card?.hours ?? 0 }
  }
  const kind = thingKind(item) || (own ? 'Plan' : '')
  // Her own plan is done by its status; a day of a repeating plan may also carry a tick for the
  // day (days ticked in bulk, without making each one an entry).
  const checked = Boolean(checks[stop.key])
  const done = own ? isComplete(item ?? {}) || checked : checked
  return { key: stop.key, how: own ? 'own' : 'check', checked, kind, time: stop.start, end: stop.end, title: stop.title, tone: calendarArea(stop.area).tone,
    label, place: stop.place, done, entry: stop.entry, item, task, href: stop.href, steps: task?.details?.steps ?? [], doneWhen: task?.details?.proof ?? '', choice: stop.choice }
}

// `path` is buildDay over every item of the day, done ones included (useDayPage: fullPath).
export function checklistRows({ path, items = [], tasks = [], date, today, checks = {}, study = null, mail = null }) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const tasksById = new Map(tasks.map((task) => [task.id, task]))
  const timed = (path?.stops ?? []).map((stop) => stopRow(stop, byId.get(stop.key), { checks, tasksById }))
  const anytime = (path?.anytime ?? []).map((entry) => stopRow({ ...entry, start: '', end: '' }, byId.get(entry.key), { checks, tasksById }))
  const shownTasks = new Set([...timed, ...anytime].map((row) => row.task?.id ?? row.entry?.id).filter(Boolean))
  // Her tasks for the day that the calendar does not show on it: just late, or put in Today without a day.
  const carried = tasksForDay(tasks, date, today).filter((task) => !shownTasks.has(task.id)).sort(compareTasks).map((task) => ({
    key: `task:${task.id}`, how: 'own', kind: 'Task', time: '', title: task.title, tone: calendarArea(areaTone(task.details?.area)).tone, label: areaName(task.details?.area),
    done: isDoneTask(task), task, late: isLate(task, today), lateFrom: taskDay(task), steps: task.details?.steps ?? [], doneWhen: task.details?.proof ?? '', href: '/tasks',
  }))
  // Study hub cards due that day that no study block covers.
  const inBlocks = new Set(timed.filter((row) => row.card).map((row) => row.card.id))
  const cards = (study?.today ?? []).filter((card) => !inBlocks.has(card.id)).map((card) => ({
    key: `card:${card.id}`, how: 'card', kind: 'Study card', time: '', title: card.title, tone: calendarArea('study').tone, label: card.moduleCode || 'Study',
    done: Boolean(card.done), card, steps: card.steps ?? [], doneWhen: card.doneWhen ?? '', hours: card.hours ?? 0, href: card.href,
  }))
  // What waits on her from the Inbox, due that day (on today only).
  const owed = date === today ? (mail?.actions ?? []).filter((row) => ['open', 'snoozed'].includes(row.status) && row.due && String(row.due).slice(0, 10) === date).map((row) => ({
    key: `mail:${row.id}`, how: 'mail', kind: 'Waiting on you', time: '', title: row.her_title || row.title, tone: calendarArea('admin').tone, label: 'Waiting on you',
    done: false, row, steps: [], doneWhen: '', href: '/inbox/waiting', extra: row.person_name || '',
  })) : []
  // The all-day rest (deadlines, job closings, reminders): ticked too, but folded away by default.
  const also = (path?.also ?? []).map((entry) => {
    const item = byId.get(entry.key)
    return { key: entry.key, how: 'check', kind: thingKind(item), time: '', title: entry.title, tone: calendarArea(entry.area).tone, label: calendarArea(entry.area).label,
      done: Boolean(checks[entry.key]), item, href: entry.href, steps: [], doneWhen: '' }
  })
  const main = [...timed, ...cards, ...anytime, ...carried, ...owed]
  return { timed, anytime: [...cards, ...anytime, ...carried, ...owed], also, done: main.filter((row) => row.done).length, total: main.length }
}

export const stepCount = (row) => (row.steps?.length ? `${stepsDone(row.steps)} of ${row.steps.length} steps` : '')

// The next thing not done that has not ended, for the line at the top of the list.
export function nextRow(rows, clock) {
  return rows.find((row) => !row.done && row.time && (row.end || row.time) >= clock) ?? null
}

// The words of that line: "Now" while it is under way (until when), "Next" before it starts.
export function nextLine(row, clock) {
  if (!row) return null
  const started = row.time <= clock
  return { label: started ? 'Now' : 'Next', when: started && row.end ? `until ${row.end}` : row.time, title: row.title }
}

export { addDays }
