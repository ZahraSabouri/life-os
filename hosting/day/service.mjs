// What a day needs beyond its dated items: the study blocks of that day with their cards,
// and the current content of Study, Jobs, Home and Notes. It only reads. The calendar
// already carries the dated items, so they are not repeated here.
import { addDays, dateKey, isDateKey } from '../../code/life-os/shared/calendar.js'
import { expandScheduleForDate } from '../../summer-rescue/src/utils/schedule.js'
// The list JobMap's own first screen shows, by JobMap's own rule.
import { firstScreen, sectionName } from '../career/first-screen.mjs'

const array = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {})
const lower = (value) => String(value ?? '').trim().toLowerCase()
const text = (value, limit = 600) => String(value ?? '').trim().slice(0, limit)
const day = (value) => (typeof value === 'string' && isDateKey(value.slice(0, 10)) ? value.slice(0, 10) : '')
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)

const LONDON_CLOCK = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const STUDY_OVER = new Set(['completed', 'archived', 'cancelled', 'canceled'])
const JOB_OVER = new Set(['archived', 'rejected', 'closed', 'withdrawn'])
const JOB_APPLIED = new Set(['applied', 'interview', 'offer'])

function bounded(load, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), timeoutMs)
    Promise.resolve().then(() => {
      if (typeof load !== 'function') throw new Error('unavailable')
      return load()
    }).then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

// ---- Study ------------------------------------------------------------------------------
function cardSummary(card, modules) {
  const data = plain(card.data)
  const steps = array(data.checklist).map((step) => ({ id: text(step?.id, 200), text: text(step?.text, 400), done: Boolean(step?.done) })).filter((step) => step.text)
  const hubCardId = text(data.hubCardId, 200)
  return {
    id: card.id,
    hubCardId,
    title: text(card.title, 300) || 'Study card',
    module: text(modules.get(card.module_id)?.title ?? data.moduleGroup, 200),
    moduleCode: text(modules.get(card.module_id)?.data?.code, 40),
    due: day(card.end_date),
    start: day(card.start_date),
    hours: Number(data.estimatedHours) || 0,
    priority: text(data.priority, 40),
    done: lower(card.status) === 'done' || data.done === true,
    waiting: lower(card.status) === 'blocked',
    steps,
    stepsDone: steps.filter((step) => step.done).length,
    doneWhen: text(data.doneCondition, 600),
    // The link names the card's semester, so the hub opens it without asking which one.
    href: hubCardId ? `/study#/today?card=${encodeURIComponent(hubCardId)}${card.semester_id ? `&semester=${encodeURIComponent(card.semester_id)}` : ''}` : '/study',
  }
}

export function studyDay(workspace, plans, date) {
  const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status))
    && (!day(row.start_date) || day(row.start_date) <= date) && (!day(row.end_date) || day(row.end_date) >= date))
  const open = new Set(semesters.map((row) => row.id))
  const modules = new Map(array(workspace?.modules).map((row) => [row.id, row]))
  const cards = array(workspace?.cards).filter((row) => open.has(row.semester_id)).map((row) => ({ ...cardSummary(row, modules), semesterId: row.semester_id }))
  const byHubId = new Map(cards.filter((card) => card.hubCardId).map((card) => [`${card.semesterId}\0${card.hubCardId}`, card]))

  const blocks = []
  for (const semester of semesters) {
    const plan = plain(array(plans).find((entry) => entry?.semesterId === semester.id)?.plan)
    for (const block of expandScheduleForDate(array(plan.scheduleRules), array(plan.scheduleExceptions), date)) {
      const linked = [block.cardId, ...array(block.cardIds)].filter(Boolean).map((id) => byHubId.get(`${semester.id}\0${id}`)).filter(Boolean)
      blocks.push({
        id: `block:${semester.id}:${block.occurrenceId}`,
        start: block.start, end: block.end, minutes: block.durationMinutes,
        title: text(block.title, 300), category: block.category, location: text(block.location, 200),
        module: text(block.moduleGroup, 200),
        card: linked.find((card) => !card.done) ?? linked[0] ?? null,
        href: '/study#/schedule',
      })
    }
  }
  blocks.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end) || a.id.localeCompare(b.id))

  const inBlock = new Set(blocks.map((block) => block.card?.id).filter(Boolean))
  const dueToday = cards.filter((card) => card.due === date)
  const running = cards.filter((card) => !card.done && card.due > date && card.start && card.start <= date)
  const overdue = cards.filter((card) => !card.done && card.due && card.due < date)

  const assessments = array(workspace?.assessments).filter((row) => open.has(row.semester_id) && !STUDY_OVER.has(lower(row.status))
    && !['done', 'submitted', 'passed'].includes(lower(row.status)))
    .map((row) => ({ id: row.id, title: text(row.title, 300), date: day(row.start_date) || day(row.end_date) || day(dateKey(row.start_at)) || day(dateKey(row.end_at)), module: text(modules.get(row.module_id)?.title, 200), weight: Number(plain(row.data).weight) || null }))
  const dated = assessments.filter((row) => row.date && row.date >= date).sort((a, b) => a.date.localeCompare(b.date))
  const next = dated[0] ? { ...dated[0], days: daysBetween(date, dated[0].date) } : null
  const before = next ? cards.filter((card) => card.due && card.due <= next.date) : cards.filter((card) => card.due)

  return {
    blocks,
    panel: {
      semesters: semesters.map((row) => ({ id: row.id, title: text(row.title, 300) })),
      today: dueToday.map((card) => ({ ...card, inBlock: inBlock.has(card.id) })),
      running: running.slice(0, 6),
      overdue: { count: overdue.length, cards: overdue.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4) },
      hoursToday: Math.round(dueToday.reduce((sum, card) => sum + card.hours, 0) * 100) / 100,
      next,
      undated: assessments.filter((row) => !row.date).map((row) => row.title).slice(0, 4),
      progress: { done: before.filter((card) => card.done).length, total: before.length },
      href: '/study',
    },
  }
}

// ---- Jobs -------------------------------------------------------------------------------
// Hours she has set aside for job applications: time blocks whose area is career.
export function jobTime(entries, date) {
  return array(Array.isArray(entries) ? entries : entries?.entries).flatMap((entry) => {
    if (!entry || entry.type !== 'time-block' || ['cancelled', 'archived'].includes(lower(entry.status))) return []
    let details = entry.details ?? {}
    if (typeof details === 'string') { try { details = JSON.parse(details) } catch { details = {} } }
    if (plain(details).area !== 'career') return []
    const timed = typeof entry.start_at === 'string' && entry.start_at.length > 10
    if ((timed ? dateKey(entry.start_at) : day(entry.start_at)) !== date) return []
    const minutes = timed && entry.end_at ? Math.max(0, Math.round((Date.parse(entry.end_at) - Date.parse(entry.start_at)) / 60_000)) : 0
    return [{ id: entry.id, title: text(entry.title, 200) || 'Job applications', start: timed ? LONDON_CLOCK.format(new Date(entry.start_at)) : '', end: timed && entry.end_at ? LONDON_CLOCK.format(new Date(entry.end_at)) : '', minutes, done: lower(entry.status) === 'done' }]
  }).sort((a, b) => a.start.localeCompare(b.start))
}

export function jobsDay(value, date, entries = []) {
  const horizon = addDays(date, 7)
  const weekStart = addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7))
  const time = jobTime(entries, date)
  const jobs = array(value?.jobs ?? value).filter((job) => job && typeof job.id === 'string')
  const row = (job) => {
    const deadline = day(job.deadline)
    return {
      id: job.id, role: text(job.role, 200) || 'Job', company: text(job.company, 200) || 'Company', location: text(job.location, 120),
      deadline, days: deadline ? daysBetween(date, deadline) : null, priority: text(job.priority, 20), stage: text(job.status, 40),
      applied: JOB_APPLIED.has(lower(job.status)) || Boolean(day(job.applied)), nextStep: text(job.nextStep, 240),
      uncertain: job.availability === 'uncertain', href: `/jobmap#job=${encodeURIComponent(job.id)}`,
    }
  }
  // What to apply for is JobMap's own answer: the list its first screen shows, in its order and
  // its groups, with JobMap's own words for each. The scheduled searches put everything they
  // find on the shortlist, so "on the shortlist" alone does not mean she chose it.
  let ranked = []
  try { ranked = firstScreen(value, date) } catch { ranked = [] }
  const listed = new Set(ranked.map((entry) => entry.job.id))
  const lead = (entry) => ({ ...row(entry.job), label: text(entry.priority.label, 120), reason: text(entry.priority.reason, 400) })
  // A job that closes today is said first, whatever group JobMap has it in; the rest follow in JobMap's order.
  const closing = ranked.filter((entry) => entry.priority.urgency === 0).map(lead)
  const next = ranked.filter((entry) => entry.priority.urgency !== 0).slice(0, 6).map(lead)
  const closingSoon = ranked.filter((entry) => entry.priority.urgency < 8)
  const groups = new Map()
  for (const entry of ranked) groups.set(entry.priority.section ?? 0, (groups.get(entry.priority.section ?? 0) ?? 0) + 1)
  const live = jobs.filter((job) => !JOB_OVER.has(lower(job.status)) && job.availability !== 'closed')
  const mine = live.map((job) => ({ job, view: row(job) })).filter(({ job, view }) => job.saved || view.applied)
  const due = mine.filter(({ view }) => view.deadline && view.deadline >= date && view.deadline <= horizon).map(({ view }) => ({ ...view, listed: listed.has(view.id) }))
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || Number(a.applied) - Number(b.applied) || a.role.localeCompare(b.role))
  const followUps = live.filter((job) => day(job.followUp) && day(job.followUp) <= horizon)
    .map((job) => ({ ...row(job), followUp: day(job.followUp), days: daysBetween(date, day(job.followUp)) })).sort((a, b) => a.followUp.localeCompare(b.followUp))
  return {
    // In JobMap's order: what to apply for next, its groups, and how many close today or this week.
    closing,
    next,
    leads: ranked.length,
    applyNow: groups.get(0) ?? 0,
    groups: [...groups].sort((a, b) => a[0] - b[0]).map(([section, count]) => ({ name: sectionName(section), count })),
    closingToday: closingSoon.filter((entry) => entry.priority.urgency === 0).length,
    closingThisWeek: closingSoon.length,
    // Everything on the shortlist that closes within a week, whatever its hours (JobMap: Shortlist).
    due,
    dueToday: due.filter((job) => job.deadline === date && !job.applied).length,
    followUps: followUps.slice(0, 6),
    interviews: mine.filter(({ job }) => lower(job.status) === 'interview').map(({ view }) => view).slice(0, 6),
    // The day's own target: the hours set aside, and what has been sent this week (Monday on).
    time,
    minutesToday: time.reduce((sum, block) => sum + block.minutes, 0),
    appliedThisWeek: jobs.filter((job) => day(job.applied) && day(job.applied) >= weekStart && day(job.applied) <= date).length,
    counts: {
      saved: mine.length,
      toApply: mine.filter(({ view }) => !view.applied).length,
      applied: mine.filter(({ view }) => view.applied).length,
      missed: mine.filter(({ view }) => !view.applied && view.deadline && view.deadline < date).length,
    },
    href: '/jobmap',
  }
}

// ---- Home (shopping, meals, what is at home, the month's budget) ------------------------
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

export function homeDay(value, date) {
  const state = plain(value?.state ?? value)
  const lists = array(state.lists).filter((list) => list && typeof list.id === 'string' && !list.archived && !list.deleted).map((list) => {
    const lines = array(list.lines)
    return {
      id: list.id, name: text(list.name, 200) || 'Shopping list', date: day(list.date), shop: text(list.merchant, 120),
      items: lines.filter((line) => line?.status === 'planned').map((line) => ({
        id: text(line.id, 80), name: text(line.name, 200), quantity: Number(line.quantity) || null, unit: text(line.unit, 30), optional: line.priority === 'optional', note: text(line.note ?? line.notes, 200),
      })),
      bought: lines.filter((line) => line?.status === 'bought').length,
      // Ticked off this day without a receipt: shown struck through, and can be put back.
      got: lines.filter((line) => line?.status === 'bought' && line.ticked && !line.receiptId && day(line.gotOn) === date).map((line) => ({ id: text(line.id, 80), name: text(line.name, 200) })),
    }
  }).filter((list) => list.items.length > 0 || list.got.length > 0)
    .sort((a, b) => Number(!a.items.length) - Number(!b.items.length) || (a.date || '9999').localeCompare(b.date || '9999') || a.name.localeCompare(b.name))
  const meals = array(state.mealEntries).filter((meal) => meal && day(meal.date) === date && !['skipped', 'cancelled'].includes(lower(meal.status)))
    .map((meal) => ({ id: text(meal.id, 80), slot: lower(meal.slot), name: text(meal.name, 200) || 'Meal', cooked: lower(meal.status) === 'cooked' }))
    .sort((a, b) => MEAL_ORDER.indexOf(a.slot) - MEAL_ORDER.indexOf(b.slot))
  const places = new Map()
  for (const lot of array(state.lots)) {
    if (!lot || !(Number(lot.remaining) > 0) || lot.tracking === 'durable') continue
    const place = text(lot.location, 60) || 'Unsorted'
    places.set(place, (places.get(place) ?? 0) + 1)
  }
  const month = date.slice(0, 7)
  const budget = plain(plain(state.budgets)[month])
  return {
    lists,
    meals,
    stock: { total: [...places.values()].reduce((sum, count) => sum + count, 0), places: [...places].map(([place, count]) => ({ place, count })).sort((a, b) => b.count - a.count).slice(0, 5) },
    budget: Number.isFinite(Number(budget.total)) && budget.total !== null && budget.total !== '' ? { month, totalPence: Math.round(Number(budget.total) * 100) } : null,
    recipes: array(state.recipes).length,
    href: '/budget',
  }
}

// ---- Notes ------------------------------------------------------------------------------
export function notesDay(value, date) {
  return array(Array.isArray(value) ? value : value?.entries).filter((entry) => entry && entry.type === 'note' && !entry.archived && dateKey(entry.created_at) === date)
    .map((entry) => {
      let details = entry.details ?? {}
      if (typeof details === 'string') { try { details = JSON.parse(details) } catch { details = {} } }
      const body = text(plain(details).body ?? plain(details).note, 2000)
      return { id: entry.id, title: text(entry.title, 200), body, at: LONDON_CLOCK.format(new Date(entry.created_at)), created: entry.created_at, href: `/ledger#entry-${encodeURIComponent(entry.id)}` }
    })
    .sort((a, b) => String(b.created).localeCompare(String(a.created)))
}

// ---- The day ----------------------------------------------------------------------------
export function createDayService({ loadStudy, loadPlans, loadCareer, loadBudget, loadEntries, timeoutMs = 6000 } = {}) {
  return async function dayOf({ date } = {}) {
    if (!isDateKey(date)) throw Object.assign(new Error('Use a valid date (YYYY-MM-DD)'), { status: 400 })
    const sources = []
    async function read(id, label, load, shape, empty) {
      try {
        const result = await shape(await bounded(load, timeoutMs))
        sources.push({ id, label, status: 'ready' })
        return result
      } catch {
        // No paths, addresses or raw content from a source that failed.
        sources.push({ id, label, status: 'unavailable', error: `${label} could not be read. Open it to check.` })
        return empty
      }
    }
    const study = read('study', 'Study hub', async () => {
      const workspace = await loadStudy()
      const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status)))
      const plans = await Promise.all(semesters.map(async (row) => ({ semesterId: row.id, plan: await Promise.resolve(loadPlans?.(row.id)).catch(() => ({})) })))
      return { workspace, plans }
    }, ({ workspace, plans }) => studyDay(workspace, plans, date), { blocks: [], panel: null })
    // Life OS's own entries are read once: the day's notes, and the hours set aside for jobs.
    const entries = Promise.resolve().then(() => loadEntries()).catch(() => null)
    const jobs = read('jobs', 'JobMap', loadCareer, async (value) => {
      if (!Array.isArray(value) && !Array.isArray(value?.jobs)) throw new Error('unsupported')
      return jobsDay(value, date, (await entries) ?? [])
    }, null)
    const home = read('home', 'Budget', loadBudget, (value) => {
      if (plain(value).state === null) return homeDay({}, date) // A fresh planner with nothing saved yet.
      if (!value || typeof value !== 'object') throw new Error('unsupported')
      return homeDay(value, date)
    }, null)
    const notes = read('notes', 'Notes', async () => { const value = await entries; if (value === null) throw new Error('unavailable'); return value }, (value) => notesDay(value, date), null)
    const [studyResult, jobsResult, homeResult, notesResult] = await Promise.all([study, jobs, home, notes])
    return { date, blocks: studyResult.blocks, study: studyResult.panel, jobs: jobsResult, home: homeResult, notes: notesResult, sources }
  }
}

export function createDayRouter({ express, service }) {
  const router = express.Router()
  router.get('/', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store')
      res.json(await service({ date: String(req.query.date ?? '') }))
    } catch (error) { next(error) }
  })
  return router
}
