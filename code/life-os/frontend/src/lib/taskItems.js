// Everything she has to do, from wherever it is kept, as one list of cards with a lane each:
// her own tasks (Life OS), the Study hub's cards for now (read from the day), and what is
// waiting on her from the Inbox. Each stays owned by its part: a tick saves there.
import { compareTasks, hasSlipped, isDoneTask, isLate, isPutAway, laneOf, stepsDone, taskDay } from '@shared/tasks.js'
import { formatCalendarDay, calendarArea } from './calendar.js'
import { areaTone } from './useTasks.js'

const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
const dayWords = (day, today) => (day === today ? 'today' : day === addDays(today, 1) ? 'tomorrow' : formatCalendarDay(day, { weekday: 'short' }))
const progressOf = (steps) => (steps?.length ? { done: stepsDone(steps), total: steps.length } : null)

export function ownItem(task, today) {
  return {
    key: `own:${task.id}`, kind: 'own', id: task.id, title: task.title || 'Untitled task', task, done: isDoneTask(task),
    lane: laneOf(task, today), late: isLate(task, today), tone: calendarArea(areaTone(task.details?.area)).tone,
    area: task.details?.area ?? '', progress: progressOf(task.details?.steps), day: taskDay(task),
  }
}

function studyItem(card, today, lane) {
  const late = !card.done && Boolean(card.due) && card.due < today
  return {
    key: `study:${card.id}`, kind: 'study', id: card.id, title: card.title, card, done: card.done, lane: late && hasSlipped(card.due, today) ? 'rescue' : lane, late,
    tone: calendarArea('study').tone, area: 'study', source: card.moduleCode || 'Study hub',
    when: card.due ? `${late ? 'late · ' : ''}due ${dayWords(card.due, today)}` : '', extra: card.hours ? `${card.hours} h` : '',
    progress: progressOf(card.steps), href: card.href, day: card.due ?? '',
  }
}

const MAIL_KINDS = new Set(['do', 'email', 'decide', 'read', 'text', 'reply', 'call'])
function mailItem(row, today) {
  const due = row.due ? String(row.due).slice(0, 10) : ''
  const lane = row.status === 'snoozed' ? 'waiting' : hasSlipped(due, today) ? 'rescue' : due && due <= today ? 'today' : due && due <= addDays(today, 6) ? 'week' : 'backlog'
  return {
    key: `mail:${row.id}`, kind: 'mail', id: row.id, title: row.her_title || row.title, row, done: false, lane, late: Boolean(due) && due < today,
    tone: calendarArea('admin').tone, area: row.area || 'admin', source: 'Waiting on you',
    when: due ? `${due < today ? 'late · ' : ''}${dayWords(due, today)}` : '', extra: row.person_name || '', href: '/inbox/waiting', day: due,
  }
}

// `day` is the day endpoint's answer for today (lib/useDay.js), `mail` the Inbox's actions.
export function gatherItems({ tasks = [], today, day = null, mail = null, includeDone = true }) {
  const items = tasks.filter((task) => !isPutAway(task)).filter((task) => includeDone || !isDoneTask(task))
    .sort(compareTasks).map((task) => ownItem(task, today))
  const study = day?.study
  if (study) {
    const seen = new Set()
    const add = (card, lane) => { if (!card || seen.has(card.id)) return; seen.add(card.id); if (card.done && !includeDone) return; items.push(studyItem(card, today, lane)) }
    for (const block of day.blocks ?? []) add(block.card, 'today')
    for (const card of study.today ?? []) add(card, 'today')
    for (const card of study.overdue?.cards ?? []) add(card, 'today')
    for (const card of study.tomorrow ?? []) add(card, 'week')
    for (const card of study.running ?? []) add(card, 'week')
  }
  for (const row of mail?.actions ?? []) {
    if (!['open', 'snoozed'].includes(row.status) || !MAIL_KINDS.has(row.kind)) continue
    items.push(mailItem(row, today))
  }
  return items
}
