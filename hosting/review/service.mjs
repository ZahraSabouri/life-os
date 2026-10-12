// A stretch of days looked back on, across every part of Life OS: what was planned and what
// happened in Study, Jobs, her own plans, Home and money, and the time she focused. It only
// reads. Each part keeps its own records; this gathers them by day.
import { addDays, dateKey, isDateKey } from '../../code/life-os/shared/calendar.js'
import { expandScheduleRange } from '../../summer-rescue/src/utils/schedule.js'
import { withRoutines } from '../../code/life-os/shared/routines.js'

const array = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {})
const lower = (value) => String(value ?? '').trim().toLowerCase()
const text = (value, limit = 300) => String(value ?? '').trim().slice(0, limit)
const day = (value) => (typeof value === 'string' && isDateKey(value.slice(0, 10)) ? value.slice(0, 10) : '')
// The London day a moment falls on; a bare date is that day.
const dayOf = (value) => (typeof value !== 'string' || !value ? '' : value.length <= 10 ? day(value) : dateKey(value) || '')
const details = (entry) => { let value = entry?.details ?? {}; if (typeof value === 'string') { try { value = JSON.parse(value) } catch { value = {} } } return plain(value) }
const minutesBetween = (start, end) => Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60_000)) || 0

const STUDY_OVER = new Set(['completed', 'archived', 'cancelled', 'canceled'])
const JOB_APPLIED = new Set(['applied', 'interview', 'offer'])
const JOB_OVER = new Set(['archived', 'rejected', 'closed', 'withdrawn'])
const PLAN_TYPES = new Set(['task', 'event', 'time-block'])
const ENTRY_OFF = new Set(['cancelled', 'canceled', 'archived'])

export const MAX_DAYS = 62

function emptyDay(date) {
  return {
    date,
    study: { plannedMinutes: 0, cardsDue: 0, cardsDone: 0, steps: 0 },
    jobs: { sent: 0, setAsideMinutes: 0, setAside: 0 },
    plans: { made: 0, done: 0 },
    home: { ticked: 0, spentPence: 0, receipts: 0 },
    notes: 0,
    // Minutes focused: with the Life OS timer (by what it was for) and in the Study hub's own Focus Room.
    focus: { total: 0, study: 0, jobs: 0, other: 0 },
  }
}

// ---- Each part, added onto the days -------------------------------------------------------
export function studyReview(days, { workspace, plans, events }, { from, to, today }) {
  const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status)))
  const open = new Set(semesters.map((row) => row.id))
  const cards = array(workspace?.cards).filter((row) => open.has(row.semester_id))
  const isDone = (card) => lower(card.status) === 'done' || plain(card.data).done === true
  const link = (card) => (plain(card.data).hubCardId ? `/study#/today?card=${encodeURIComponent(card.data.hubCardId)}&semester=${encodeURIComponent(card.semester_id)}` : '/study')
  for (const card of cards) {
    const due = day(card.end_date)
    if (due && days.has(due)) { days.get(due).study.cardsDue += 1 }
  }
  for (const entry of array(plans)) {
    if (!open.has(entry?.semesterId)) continue
    for (const planned of expandScheduleRange(array(entry.plan?.scheduleRules), array(entry.plan?.scheduleExceptions), from, to)) {
      const target = days.get(planned.date)
      if (target) target.study.plannedMinutes += planned.blocks.reduce((sum, block) => sum + (Number(block.durationMinutes) || 0), 0)
    }
  }
  // What happened, from the hub's own event log: a card done, a step ticked, a focus session.
  // Undoing on the same day takes it back off.
  for (const event of array(events)) {
    const target = days.get(dayOf(event?.occurredAt))
    if (!target) continue
    const payload = plain(event.payload)
    if (event.eventType === 'card.done_changed' || (event.eventType === 'card.status_changed' && (payload.done === true || payload.previousStatus === 'Done'))) target.study.cardsDone += payload.done ? 1 : -1
    else if (event.eventType === 'checklist_item.toggled') target.study.steps += payload.done ? 1 : -1
    // A session the Life OS timer put on a card is already a block on the calendar (counted with her entries).
    else if (event.eventType === 'focus_session.completed' && payload.from !== 'life-os') { const minutes = Math.max(0, Math.round(Number(payload.minutes)) || 0); target.focus.study += minutes; target.focus.total += minutes }
  }
  for (const target of days.values()) { target.study.cardsDone = Math.max(0, target.study.cardsDone); target.study.steps = Math.max(0, target.study.steps) }
  const inRange = cards.filter((card) => day(card.end_date) >= from && day(card.end_date) <= to)
  const late = cards.filter((card) => !isDone(card) && day(card.end_date) && day(card.end_date) < today).sort((a, b) => day(a.end_date).localeCompare(day(b.end_date)))
  // The next dated test or deadline, read as the day reads it (hosting/day/service.mjs).
  const assessed = (row) => day(row.start_date) || day(row.end_date) || dayOf(row.start_at) || dayOf(row.end_at)
  const next = array(workspace?.assessments).filter((row) => open.has(row.semester_id) && !STUDY_OVER.has(lower(row.status)) && !['done', 'submitted', 'passed'].includes(lower(row.status)) && assessed(row) >= today)
    .map((row) => ({ title: text(row.title), date: assessed(row) })).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  return {
    cardsDue: inRange.length,
    cardsDueDone: inRange.filter(isDone).length,
    cardsTotal: cards.length,
    cardsDone: cards.filter(isDone).length,
    late: { count: late.length, cards: late.slice(0, 6).map((card) => ({ id: card.id, title: text(card.title), due: day(card.end_date), href: link(card) })) },
    next,
    // The semester the hub's own Review, Progress and Analytics pages are opened in.
    semesterId: semesters.find((row) => (!day(row.start_date) || day(row.start_date) <= today) && (!day(row.end_date) || day(row.end_date) >= today))?.id ?? semesters[0]?.id ?? '',
    href: '/study',
  }
}

export function jobsReview(days, career, entries, { from, to, today }) {
  const jobs = array(career?.jobs ?? career).filter((job) => job && typeof job.id === 'string')
  for (const job of jobs) {
    const target = days.get(day(job.applied))
    if (target) target.jobs.sent += 1
  }
  for (const entry of array(entries)) {
    if (entry?.type !== 'time-block' || ENTRY_OFF.has(lower(entry.status))) continue
    const info = details(entry)
    if (info.area !== 'career' || info.focus === true) continue
    const target = days.get(dayOf(entry.start_at))
    if (!target) continue
    target.jobs.setAside += 1
    if (typeof entry.start_at === 'string' && entry.start_at.length > 10 && entry.end_at) target.jobs.setAsideMinutes += minutesBetween(entry.start_at, entry.end_at)
  }
  // Shortlisted, never applied for, and the closing date went by inside these days.
  const missed = jobs.filter((job) => job.saved && !JOB_OVER.has(lower(job.status)) && !JOB_APPLIED.has(lower(job.status)) && !day(job.applied)
    && day(job.deadline) >= from && day(job.deadline) <= to && day(job.deadline) < today)
    .sort((a, b) => day(a.deadline).localeCompare(day(b.deadline)))
  return {
    sentEver: jobs.filter((job) => JOB_APPLIED.has(lower(job.status)) || day(job.applied)).length,
    missed: { count: missed.length, jobs: missed.slice(0, 6).map((job) => ({ id: job.id, role: text(job.role, 200) || 'Job', company: text(job.company, 200), deadline: day(job.deadline), href: `/jobmap#job=${encodeURIComponent(job.id)}` })) },
    href: '/jobmap',
  }
}

// Her own plans (tasks, events, time set aside), the focus sessions the timer wrote, and notes.
export function entriesReview(days, entries, { today }) {
  const open = []
  for (const entry of array(entries)) {
    if (!entry || entry.archived) continue
    if (entry.type === 'note') { const target = days.get(dayOf(entry.created_at)); if (target) target.notes += 1; continue }
    if (!PLAN_TYPES.has(entry.type) || ENTRY_OFF.has(lower(entry.status))) continue
    const date = dayOf(entry.start_at)
    const target = days.get(date)
    if (!target) continue
    const info = details(entry)
    if (entry.type === 'time-block' && info.focus === true) {
      const minutes = Math.max(0, Math.round(Number(info.minutes)) || minutesBetween(entry.start_at, entry.end_at))
      target.focus.total += minutes
      target.focus[info.area === 'study' ? 'study' : info.area === 'career' ? 'jobs' : 'other'] += minutes
      continue
    }
    target.plans.made += 1
    if (lower(entry.status) === 'done') target.plans.done += 1
    // A day of a repeating plan that went by untouched simply lapsed; only her one-off plans are "left".
    else if (date < today && entry.type !== 'event' && !entry.virtual) open.push({ id: entry.id, title: text(entry.title) || 'Plan', date, href: `/today?date=${date}` })
  }
  return { open: { count: open.length, plans: open.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6) } }
}

// `figures` is Budget's own month rule (its forecast), so "spent" means what Budget says it means.
export function homeReview(days, budget, figures, { to }) {
  const state = plain(budget?.state ?? budget)
  for (const list of array(state.lists)) {
    for (const line of array(list?.lines)) {
      if (line?.status === 'bought' && line.ticked && !line.receiptId) { const target = days.get(day(line.gotOn)); if (target) target.home.ticked += 1 }
    }
  }
  for (const receipt of array(state.receipts)) {
    const target = days.get(day(receipt?.date))
    if (!target) continue
    target.home.receipts += 1
    target.home.spentPence += Number.isSafeInteger(receipt.paidPence) ? receipt.paidPence : 0
  }
  const month = to.slice(0, 7)
  let money = null
  try {
    const result = typeof figures === 'function' ? figures(state, month) : null
    if (result && Number.isFinite(Number(result.totalSpent)) && Number.isFinite(Number(result.adjustedTotal))) {
      money = { month, spentPence: Math.round(Number(result.totalSpent) * 100), budgetPence: Math.round(Number(result.adjustedTotal) * 100), leftPence: Math.round(Number(result.totalRemaining) * 100) }
    }
  } catch { money = null }
  const toBuy = array(state.lists).reduce((sum, list) => sum + array(list?.lines).filter((line) => line?.status === 'planned').length, 0)
  return { money, toBuy, href: '/budget' }
}

function totalsOf(days) {
  const sum = (pick) => days.reduce((total, row) => total + pick(row), 0)
  return {
    study: { plannedMinutes: sum((d) => d.study.plannedMinutes), cardsDue: sum((d) => d.study.cardsDue), cardsDone: sum((d) => d.study.cardsDone), steps: sum((d) => d.study.steps) },
    jobs: { sent: sum((d) => d.jobs.sent), setAsideMinutes: sum((d) => d.jobs.setAsideMinutes), setAside: sum((d) => d.jobs.setAside) },
    plans: { made: sum((d) => d.plans.made), done: sum((d) => d.plans.done) },
    home: { ticked: sum((d) => d.home.ticked), spentPence: sum((d) => d.home.spentPence), receipts: sum((d) => d.home.receipts) },
    notes: sum((d) => d.notes),
    focus: { total: sum((d) => d.focus.total), study: sum((d) => d.focus.study), jobs: sum((d) => d.focus.jobs), other: sum((d) => d.focus.other) },
  }
}

async function bounded(load, timeoutMs) {
  let timer
  try {
    return await Promise.race([Promise.resolve().then(load), new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('timed out')), timeoutMs) })])
  } finally { clearTimeout(timer) }
}

export function createReviewService({ loadStudy, loadPlans, loadEvents, loadCareer, loadBudget, loadEntries, budgetFigures, today = () => dateKey(new Date()), timeoutMs = 8000 } = {}) {
  return async function reviewOf({ from, to } = {}) {
    if (!isDateKey(from) || !isDateKey(to) || to < from) throw Object.assign(new Error('Use two valid dates (YYYY-MM-DD), the first not after the second'), { status: 400 })
    if (to > addDays(from, MAX_DAYS - 1)) throw Object.assign(new Error(`Look back on at most ${MAX_DAYS} days at once`), { status: 400 })
    const range = { from, to, today: today() }
    const days = new Map()
    for (let date = from; date <= to; date = addDays(date, 1)) days.set(date, emptyDay(date))
    const sources = []
    // A part that cannot be read leaves its numbers at nothing and says so; the rest still shows.
    async function part(id, label, load, apply) {
      try {
        const result = apply(await bounded(load, timeoutMs))
        sources.push({ id, label, status: 'ready' })
        return result
      } catch {
        sources.push({ id, label, status: 'unavailable', error: `${label} could not be read.` })
        return null
      }
    }
    const entries = Promise.resolve().then(() => loadEntries()).then((rows) => withRoutines(rows, from, to)).catch(() => null)
    const [study, jobs, own, home] = await Promise.all([
      part('study', 'Study hub', async () => {
        const workspace = await loadStudy()
        const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status)))
        const [plans, events] = await Promise.all([
          Promise.all(semesters.map(async (row) => ({ semesterId: row.id, plan: await Promise.resolve(loadPlans?.(row.id)).catch(() => ({})) }))),
          Promise.all(semesters.map((row) => Promise.resolve(loadEvents?.(row.id)).catch(() => []))),
        ])
        return { workspace, plans, events: events.flat() }
      }, (value) => studyReview(days, value, range)),
      part('jobs', 'JobMap', async () => { const value = await loadCareer(); if (!Array.isArray(value) && !Array.isArray(value?.jobs)) throw new Error('unsupported'); return { career: value, entries: (await entries) ?? [] } }, (value) => jobsReview(days, value.career, value.entries, range)),
      part('plans', 'Your plans and notes', async () => { const value = await entries; if (value === null) throw new Error('unavailable'); return value }, (value) => entriesReview(days, value, range)),
      part('home', 'Budget', loadBudget, (value) => { if (!value || typeof value !== 'object') throw new Error('unsupported'); return homeReview(days, value, budgetFigures, range) }),
    ])
    const list = [...days.values()]
    return { from, to, today: range.today, days: list, totals: totalsOf(list), study, jobs, plans: own, home, sources }
  }
}

export function createReviewRouter({ express, service }) {
  const router = express.Router()
  router.get('/', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store')
      res.json(await service({ from: String(req.query.from ?? ''), to: String(req.query.to ?? '') }))
    } catch (error) { next(error) }
  })
  return router
}
