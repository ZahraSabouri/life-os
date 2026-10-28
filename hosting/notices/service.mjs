// Notices for the whole of Life OS, not only study: what is happening now, what starts soon,
// what today asks for, what has slipped, and what is close ahead, gathered from every part.
// It only reads: the day (study, jobs, home), the calendar's dated items, and her own plans.
// What she has already seen is kept by the page, not here.
import { addDays, dateKey } from '../../code/life-os/shared/calendar.js'
import { mailNotices } from '../mail/notices.mjs'

const array = (value) => (Array.isArray(value) ? value : [])
const text = (value, limit = 200) => String(value ?? '').trim().slice(0, limit)
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`
const listed = (names, limit = 2) => `${names.slice(0, limit).join('; ')}${names.length > limit ? ` and ${names.length - limit} more` : ''}`
const pounds = (pence) => `£${(pence / 100).toFixed(2).replace(/\.00$/, '')}`
const LONDON_CLOCK = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const clockOf = (iso) => LONDON_CLOCK.format(new Date(iso))
const AREAS = { core: 'Your plans', study: 'Study', career: 'Jobs', money: 'Money', home: 'Home', relationships: 'People', events: 'Events', body: 'Health' }
const DONE = new Set(['done', 'completed', 'complete', 'cancelled', 'canceled', 'archived', 'submitted'])
const finished = (item) => Boolean(item?.meta?.completed || item?.meta?.done) || DONE.has(String(item?.meta?.status ?? '').toLowerCase())

// In the order they are shown: happening now, starting within the hour, asked of today, slipped, close ahead.
export const LEVELS = ['now', 'soon', 'today', 'late', 'ahead']
export const SOON_MINUTES = 60

// `day` is the day service's answer for today, `items` the calendar's items for today and
// tomorrow, `open` her own plans left unticked on days that have gone, `money` the month by
// Budget's rule. Returns the notices for the bell and the timed things still to start today
// (the page tells her about those a few minutes before, if she asked it to).
export function buildNotices({ day, items, open, money, now = new Date() } = {}) {
  const today = dateKey(now)
  const tomorrow = addDays(today, 1)
  const at = now.getTime()
  const notices = []
  const add = (notice) => notices.push({ detail: '', at: '', href: '/today', ...notice })

  // ---- By the clock: what is on now, what starts within the hour ---------------------------
  const timed = array(items).filter((item) => item && !item.all_day && typeof item.start === 'string' && item.start.length > 10 && dateKey(item.start) === today && !finished(item))
    .map((item) => ({ item, start: Date.parse(item.start), end: item.end ? Date.parse(item.end) : Date.parse(item.start) + 60 * 60_000 }))
    .filter((row) => Number.isFinite(row.start)).sort((a, b) => a.start - b.start)
  for (const { item, start, end } of timed) {
    const area = AREAS[item.area] ?? AREAS.core
    const span = `${clockOf(item.start)}${item.end ? ` to ${clockOf(item.end)}` : ''}`
    if (start <= at && at < end) add({ id: `timed:${item.id}`, level: 'now', area: item.area, title: text(item.title), detail: `On now, ${span} · ${area}`, at: clockOf(item.start), href: item.href || '/today' })
    else if (start > at && start - at <= SOON_MINUTES * 60_000) add({ id: `timed:${item.id}`, level: 'soon', area: item.area, title: text(item.title), detail: `Starts in ${Math.max(1, Math.round((start - at) / 60_000))} min, ${span} · ${area}`, at: clockOf(item.start), href: item.href || '/today' })
  }
  const upcoming = timed.filter((row) => row.start > at).map(({ item }) => ({ id: `timed:${item.id}`, title: text(item.title), startsAt: item.start, at: clockOf(item.start), area: item.area, href: item.href || '/today' }))

  // ---- Study -------------------------------------------------------------------------------
  const study = day?.study
  if (study) {
    const due = array(study.today).filter((card) => !card.done)
    if (due.length) add({ id: `study:due:${today}`, level: 'today', area: 'study', title: `${plural(due.length, 'study card')} due today`, detail: listed(due.map((card) => card.title)), href: due.length === 1 ? due[0].href : '/study' })
    if (study.overdue?.count) add({ id: `study:late:${today}`, level: 'late', area: 'study', title: `${plural(study.overdue.count, 'study card')} past ${study.overdue.count === 1 ? 'its' : 'their'} date`, detail: listed(array(study.overdue.cards).map((card) => card.title)), href: study.overdue.count === 1 ? study.overdue.cards[0]?.href ?? '/study' : '/review' })
    // From the Study hub's own reminders: what is due tomorrow, and what has waited too long.
    const tomorrow = array(study.tomorrow)
    if (tomorrow.length) add({ id: `study:tomorrow:${today}`, level: 'ahead', area: 'study', title: `${plural(tomorrow.length, 'study card')} due tomorrow`, detail: listed(tomorrow.map((card) => card.title)), href: tomorrow.length === 1 ? tomorrow[0].href : '/study' })
    if (study.waiting?.count) add({ id: `study:waiting:${today}`, level: 'late', area: 'study', title: `${plural(study.waiting.count, 'study card')} waiting for two days or more`, detail: listed(array(study.waiting.cards).map((card) => `${card.title} (${card.days} days)`)), href: study.waiting.count === 1 ? array(study.waiting.cards)[0]?.href ?? '/study' : '/study' })
    if (study.next && study.next.days <= 7) add({
      id: `study:test:${study.next.id ?? study.next.title}:${today}`, level: study.next.days === 0 ? 'today' : 'ahead', area: 'study',
      title: study.next.days === 0 ? `${study.next.title} is today` : `${study.next.title} is ${study.next.days === 1 ? 'tomorrow' : `in ${study.next.days} days`}`,
      detail: study.progress?.total ? `${study.progress.done} of ${plural(study.progress.total, 'card')} before it done` : '', href: '/study',
    })
  }

  // ---- Jobs --------------------------------------------------------------------------------
  const jobs = day?.jobs
  if (jobs) {
    for (const job of array(jobs.closing).slice(0, 3)) add({ id: `job:closes:${job.id}:${today}`, level: 'today', area: 'career', title: `Closes today: ${job.role}`, detail: [job.company, job.label].filter(Boolean).join(' · '), href: job.href })
    if (array(jobs.closing).length > 3) add({ id: `job:closes-more:${today}`, level: 'today', area: 'career', title: `${array(jobs.closing).length - 3} more jobs close today`, href: '/jobmap' })
    const tomorrowJobs = array(jobs.due).filter((job) => job.days === 1 && job.listed && !job.applied)
    if (tomorrowJobs.length) add({ id: `job:tomorrow:${today}`, level: 'ahead', area: 'career', title: `${plural(tomorrowJobs.length, 'job')} on your list ${tomorrowJobs.length === 1 ? 'closes' : 'close'} tomorrow`, detail: listed(tomorrowJobs.map((job) => job.role)), href: tomorrowJobs.length === 1 ? tomorrowJobs[0].href : '/jobmap' })
    for (const job of array(jobs.followUps).filter((row) => row.days <= 0).slice(0, 3)) add({ id: `job:follow:${job.id}:${today}`, level: job.days < 0 ? 'late' : 'today', area: 'career', title: `Follow up: ${job.role}`, detail: [job.company, job.days < 0 ? `was due ${Math.abs(job.days)} ${Math.abs(job.days) === 1 ? 'day' : 'days'} ago` : 'due today'].filter(Boolean).join(' · '), href: job.href })
  }

  // ---- Home and money ----------------------------------------------------------------------
  const home = day?.home
  if (home) {
    for (const list of array(home.lists).filter((row) => row.date === today && array(row.items).length).slice(0, 2)) add({ id: `home:list:${list.id}:${today}`, level: 'today', area: 'home', title: `${plural(list.items.length, 'thing')} to buy today`, detail: `${list.name}: ${listed(list.items.map((item) => item.name), 3)}`, href: '/budget#/shopping' })
  }
  if (money && Number.isFinite(money.leftPence) && money.leftPence < 0) add({ id: `money:over:${money.month}`, level: 'late', area: 'money', title: `Over this month's budget by ${pounds(-money.leftPence)}`, detail: `${pounds(money.spentPence)} spent of ${pounds(money.budgetPence)}`, href: '/budget' })
  // Renewals and other dated money or home things, today and tomorrow.
  for (const item of array(items)) {
    if (!item?.all_day || !['money', 'relationships'].includes(item.area) || finished(item) || item.meta?.source === 'mail') continue
    const date = String(item.start).slice(0, 10)
    if (date !== today && date !== tomorrow) continue
    // A birthday today leads to the wish on Waiting on you.
    const wish = item.meta?.type === 'birthday' && date === today
    add({ id: `dated:${item.id}:${date}`, level: date === today ? 'today' : 'ahead', area: item.area, title: `${text(item.title)}${date === today ? ' is today' : ' is tomorrow'}`, detail: wish ? 'Wish them a happy birthday' : AREAS[item.area], href: wish ? '/inbox' : item.href || '/calendar' })
  }

  // ---- Health: appointments today and tomorrow, sessions planned for today ------------------
  for (const item of array(items)) {
    if (item?.area !== 'body' || item.meta?.type !== 'appointment' || finished(item)) continue
    const date = String(item.start).slice(0, 10)
    if (date !== today && date !== tomorrow) continue
    const clock = !item.all_day && String(item.start).length > 10 ? `, ${clockOf(item.start)}` : ''
    add({ id: `health:appointment:${item.id}:${date}`, level: date === today ? 'today' : 'ahead', area: 'body', title: `${text(item.title)}${date === today ? ' is today' : ' is tomorrow'}${clock}`, detail: item.location ? `At ${text(item.location)}` : 'Health', at: clock ? clockOf(item.start) : '', href: item.href || '/health?view=care' })
  }
  const sessions = array(items).filter((item) => item?.area === 'body' && item.meta?.type === 'workout' && String(item.start).slice(0, 10) === today && !finished(item))
  if (sessions.length) add({ id: `health:sessions:${today}`, level: 'today', area: 'body', title: `${plural(sessions.length, 'session')} of exercise planned today`, detail: listed(sessions.map((item) => text(item.title)), 2), href: sessions.length === 1 ? sessions[0].href : '/health?view=exercise' })

  // ---- Her own plans -----------------------------------------------------------------------
  const tasks = array(items).filter((item) => item?.all_day && item.meta?.source === 'core' && item.meta?.type === 'task' && String(item.start).slice(0, 10) === today && !finished(item))
  if (tasks.length) add({ id: `plans:today:${today}`, level: 'today', area: 'core', title: `${plural(tasks.length, 'plan')} of yours for today`, detail: listed(tasks.map((item) => text(item.title)), 3), href: '/today' })
  if (open?.count) add({ id: `plans:late:${today}`, level: 'late', area: 'core', title: `${plural(open.count, 'plan')} left unticked from earlier days`, detail: listed(array(open.plans).map((plan) => plan.title)), href: array(open.plans)[0]?.href ?? '/review' })

  notices.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || String(a.at).localeCompare(String(b.at)))
  return { today, now: now.toISOString(), notices, upcoming }
}

// Plans of hers (tasks and time set aside) on the last `days` days that are not ticked done.
export function openPlans(entries, today, days = 7) {
  const from = addDays(today, -days)
  const open = []
  for (const entry of array(entries)) {
    if (!entry || entry.archived || !['task', 'time-block'].includes(entry.type)) continue
    const status = String(entry.status ?? '').toLowerCase()
    if (DONE.has(status)) continue
    let details = entry.details ?? {}
    if (typeof details === 'string') { try { details = JSON.parse(details) } catch { details = {} } }
    if (details?.focus === true) continue
    const start = typeof entry.start_at === 'string' ? entry.start_at : ''
    const date = start.length <= 10 ? start : dateKey(start)
    if (!date || date >= today || date < from) continue
    open.push({ id: entry.id, title: text(entry.title) || 'Plan', date, href: `/today?date=${date}` })
  }
  open.sort((a, b) => a.date.localeCompare(b.date))
  return { count: open.length, plans: open.slice(0, 6) }
}

export function createNoticesService({ dayOf, calendarOf, loadEntries, loadBudget, budgetFigures, loadMail, now = () => new Date() } = {}) {
  return async function notices() {
    const moment = now()
    const today = dateKey(moment)
    // Each part that cannot be read leaves its notices out; the rest still come.
    const [day, calendar, entries, budget, mail] = await Promise.all([
      Promise.resolve().then(() => dayOf({ date: today })).catch(() => null),
      Promise.resolve().then(() => calendarOf({ from: today, to: addDays(today, 1) })).catch(() => null),
      Promise.resolve().then(() => loadEntries()).catch(() => null),
      Promise.resolve().then(() => loadBudget?.()).catch(() => null),
      Promise.resolve().then(() => loadMail?.()).catch(() => null),
    ])
    let money = null
    try {
      const state = budget?.state ?? null
      const figures = state && typeof budgetFigures === 'function' ? budgetFigures(state, today.slice(0, 7)) : null
      if (figures && Number.isFinite(Number(figures.totalRemaining))) money = { month: today.slice(0, 7), spentPence: Math.round(Number(figures.totalSpent) * 100), budgetPence: Math.round(Number(figures.adjustedTotal) * 100), leftPence: Math.round(Number(figures.totalRemaining) * 100) }
    } catch { money = null }
    const result = buildNotices({ day, items: calendar?.items ?? [], open: entries ? openPlans(entries, today) : null, money, now: moment })
    if (mail) {
      result.notices.push(...mailNotices(mail, today))
      result.notices.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || String(a.at).localeCompare(String(b.at)))
    }
    const missing = [day ? '' : 'the day', calendar ? '' : 'the calendar', entries ? '' : 'your plans'].filter(Boolean)
    return { ...result, ...(missing.length ? { missing } : {}) }
  }
}

export function createNoticesRouter({ express, service }) {
  const router = express.Router()
  router.get('/', async (_req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store')
      res.json(await service())
    } catch (error) { next(error) }
  })
  return router
}
