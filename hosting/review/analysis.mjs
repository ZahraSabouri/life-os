// The Review page's analysis: the same days as the week's review, over a longer stretch, looked
// at the way a data set is looked at. Summary statistics, the shape of a week, hours of the day,
// plan against done, each module, the job pipeline, where money went, and how two measures move
// together. It only reads; each part keeps its own records. The same rows leave as CSV or JSON.
import { addDays, CALENDAR_TIME_ZONE, dateKey, isDateKey } from '../../code/life-os/shared/calendar.js'
import { isoWeekday, withRoutines } from '../../code/life-os/shared/routines.js'
import { expandScheduleRange } from '../../summer-rescue/src/utils/schedule.js'

const array = (value) => (Array.isArray(value) ? value : [])
const plain = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {})
const lower = (value) => String(value ?? '').trim().toLowerCase()
const text = (value, limit = 300) => String(value ?? '').trim().slice(0, limit)
const day = (value) => (typeof value === 'string' && isDateKey(value.slice(0, 10)) ? value.slice(0, 10) : '')
const details = (entry) => { let value = entry?.details ?? {}; if (typeof value === 'string') { try { value = JSON.parse(value) } catch { value = {} } } return plain(value) }
const round = (value, places = 2) => (Number.isFinite(value) ? Math.round(value * 10 ** places) / 10 ** places : 0)
const mondayOf = (date) => addDays(date, 1 - isoWeekday(date))

export const MAX_ANALYSIS_DAYS = 190
const STUDY_OVER = new Set(['completed', 'archived', 'cancelled', 'canceled'])
const JOB_APPLIED = new Set(['applied', 'interview', 'offer'])
const JOB_OVER = new Set(['archived', 'rejected', 'closed', 'withdrawn'])

// ---- Summary statistics -------------------------------------------------------------------
// Each measure of a day: [id, name, unit, how it is read from a day].
export const MEASURES = [
  ['study_planned_minutes', 'Study on the plan', 'min', (d) => d.study.plannedMinutes],
  ['focus_minutes', 'Time focused', 'min', (d) => d.focus.total],
  ['study_cards_done', 'Study cards done', 'count', (d) => d.study.cardsDone],
  ['study_steps', 'Steps ticked', 'count', (d) => d.study.steps],
  ['jobs_sent', 'Applications sent', 'count', (d) => d.jobs.sent],
  ['jobs_set_aside_minutes', 'Time set aside for jobs', 'min', (d) => d.jobs.setAsideMinutes],
  ['plans_made', 'Plans of your own', 'count', (d) => d.plans.made],
  ['plans_done', 'Plans done', 'count', (d) => d.plans.done],
  ['home_ticked', 'Things ticked off', 'count', (d) => d.home.ticked],
  ['home_spent_pence', 'Spent', 'pence', (d) => d.home.spentPence],
  ['notes', 'Notes', 'count', (d) => d.notes],
]

export function describe(values) {
  const list = values.filter((value) => Number.isFinite(value))
  const n = list.length
  if (!n) return { n: 0, total: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0, active: 0 }
  const sorted = [...list].sort((a, b) => a - b)
  const total = list.reduce((sum, value) => sum + value, 0)
  const mean = total / n
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  // The sample standard deviation: these days are a sample of how her days go.
  const sd = n > 1 ? Math.sqrt(list.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1)) : 0
  return { n, total, mean: round(mean), median: round(median), sd: round(sd), min: sorted[0], max: sorted[n - 1], active: list.filter((value) => value > 0).length }
}

// Over the days that have happened (up to today): a day still to come has nothing to count.
export function statsOf(days, today) {
  const elapsed = days.filter((row) => row.date <= today)
  return MEASURES.map(([id, label, unit, pick]) => {
    const values = elapsed.map(pick)
    const summary = describe(values)
    const best = summary.max > 0 ? elapsed[values.indexOf(summary.max)].date : ''
    return { id, label, unit, ...summary, maxDate: best }
  })
}

// ---- The shape of a week ------------------------------------------------------------------
export function weekdayProfile(days, today) {
  const rows = Array.from({ length: 7 }, (_unused, index) => ({ weekday: index + 1, days: 0, studyPlanned: 0, focus: 0, cardsDone: 0, sent: 0, plansMade: 0, plansDone: 0, spentPence: 0 }))
  for (const row of days) {
    if (row.date > today) continue
    const target = rows[isoWeekday(row.date) - 1]
    target.days += 1
    target.studyPlanned += row.study.plannedMinutes
    target.focus += row.focus.total
    target.cardsDone += row.study.cardsDone
    target.sent += row.jobs.sent
    target.plansMade += row.plans.made
    target.plansDone += row.plans.done
    target.spentPence += row.home.spentPence
  }
  return rows
}

// ---- Plan against done: cards due and cards done, added up day after day ----------------------
export function burnUp(days, today) {
  let due = 0
  let done = 0
  return days.map((row) => {
    due += row.study.cardsDue
    done += row.study.cardsDone
    return { date: row.date, due, done: row.date <= today ? done : null }
  })
}

// ---- Hours of the day, by weekday -------------------------------------------------------------
const LONDON = new Intl.DateTimeFormat('en-GB', { timeZone: CALENDAR_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const minutesOfClock = (clock) => { const found = /^(\d{1,2}):(\d{2})/.exec(String(clock ?? '')); return found ? Number(found[1]) * 60 + Number(found[2]) : null }
const emptyGrid = () => Array.from({ length: 7 }, () => new Array(24).fill(0))
// Minutes from `start` to `end` (minutes of the day) shared out over the hours they fall in.
function spread(grid, weekday, start, end) {
  if (!(weekday >= 1 && weekday <= 7) || start === null || end === null || end <= start) return
  for (let at = Math.max(0, start); at < Math.min(1440, end);) {
    const hour = Math.floor(at / 60)
    const until = Math.min(end, (hour + 1) * 60, 1440)
    grid[weekday - 1][hour] += until - at
    at = until
  }
}

export function hourGrid({ plans = [], entries = [], events = [] }, { from, to }) {
  const planned = emptyGrid()
  const jobs = emptyGrid()
  const focus = emptyGrid()
  for (const entry of array(plans)) {
    for (const planDay of expandScheduleRange(array(entry?.plan?.scheduleRules), array(entry?.plan?.scheduleExceptions), from, to)) {
      for (const block of array(planDay.blocks)) spread(planned, isoWeekday(planDay.date), minutesOfClock(block.start), minutesOfClock(block.end))
    }
  }
  for (const entry of array(entries)) {
    if (entry?.type !== 'time-block' || ['cancelled', 'canceled', 'archived'].includes(lower(entry.status))) continue
    if (typeof entry.start_at !== 'string' || entry.start_at.length <= 10) continue
    const date = dateKey(entry.start_at)
    if (!date || date < from || date > to) continue
    const info = details(entry)
    const start = minutesOfClock(LONDON.format(new Date(entry.start_at)))
    const length = info.focus === true && Number(info.minutes) > 0 ? Math.round(Number(info.minutes)) : entry.end_at ? Math.max(0, Math.round((Date.parse(entry.end_at) - Date.parse(entry.start_at)) / 60_000)) : 0
    if (info.focus === true) spread(focus, isoWeekday(date), start, start + length)
    else if (info.area === 'career') spread(jobs, isoWeekday(date), start, start + length)
  }
  // A session in the Study hub's own Focus Room is logged when it ends.
  for (const event of array(events)) {
    if (event?.eventType !== 'focus_session.completed' || plain(event.payload).from === 'life-os') continue
    const date = typeof event.occurredAt === 'string' ? dateKey(event.occurredAt) : ''
    const minutes = Math.max(0, Math.round(Number(plain(event.payload).minutes)) || 0)
    if (!date || date < from || date > to || !minutes) continue
    const end = minutesOfClock(LONDON.format(new Date(event.occurredAt)))
    spread(focus, isoWeekday(date), Math.max(0, end - minutes), end)
  }
  return { planned, jobs, focus }
}

// ---- Each module --------------------------------------------------------------------------
export function modulesOf({ workspace, plans = [] }, { from, to, today }) {
  const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status)))
  const open = new Set(semesters.map((row) => row.id))
  const isDone = (card) => lower(card.status) === 'done' || plain(card.data).done === true
  const plannedByTitle = new Map()
  for (const entry of array(plans)) {
    if (!open.has(entry?.semesterId)) continue
    for (const planDay of expandScheduleRange(array(entry.plan?.scheduleRules), array(entry.plan?.scheduleExceptions), from, to)) {
      for (const block of array(planDay.blocks)) {
        const minutes = Number(block.durationMinutes) || Math.max(0, (minutesOfClock(block.end) ?? 0) - (minutesOfClock(block.start) ?? 0))
        const key = lower(block.moduleGroup)
        plannedByTitle.set(key, (plannedByTitle.get(key) ?? 0) + minutes)
      }
    }
  }
  const cards = array(workspace?.cards).filter((card) => open.has(card.semester_id) && !card.deleted_at)
  const assessments = array(workspace?.assessments).filter((row) => open.has(row.semester_id) && !STUDY_OVER.has(lower(row.status)))
  const row = (id, code, title, own, tests) => {
    const done = own.filter(isDone)
    const upcoming = tests.map((test) => ({ title: text(test.title), date: day(test.start_date) || day(test.end_date) || (typeof test.start_at === 'string' ? dateKey(test.start_at) || '' : '') })).filter((test) => test.date >= today).sort((a, b) => a.date.localeCompare(b.date))
    return {
      id, code, title, cards: own.length, done: done.length,
      late: own.filter((card) => !isDone(card) && day(card.end_date) && day(card.end_date) < today).length,
      dueInRange: own.filter((card) => day(card.end_date) >= from && day(card.end_date) <= to).length,
      undated: own.filter((card) => !isDone(card) && !day(card.end_date)).length,
      plannedMinutes: plannedByTitle.get(lower(title)) ?? 0,
      nextTest: upcoming[0] ?? null,
    }
  }
  const modules = array(workspace?.modules).filter((module) => open.has(module.semester_id) && !['inactive', 'archived'].includes(lower(module.status)) && plain(module.data).enabled !== false)
  const rows = modules.map((module) => row(module.id, text(plain(module.data).code, 40), text(module.title), cards.filter((card) => card.module_id === module.id), assessments.filter((test) => test.module_id === module.id)))
  const known = new Set(modules.map((module) => module.id))
  const loose = cards.filter((card) => !known.has(card.module_id))
  if (loose.length) rows.push(row('', '', 'Not under a module', loose, []))
  return rows.sort((a, b) => b.cards - a.cards)
}

// ---- The job pipeline -----------------------------------------------------------------------
export function funnelOf(career, today, { sources = 8, weeksAhead = 6, weeksBack = 8 } = {}) {
  const jobs = array(career?.jobs ?? career).filter((job) => job && typeof job.id === 'string')
  const status = (job) => lower(job.status)
  const applied = (job) => JOB_APPLIED.has(status(job)) || Boolean(day(job.applied))
  const live = (job) => !JOB_OVER.has(status(job))
  const steps = [
    ['listed', 'Listed in JobMap', jobs.length],
    ['open', 'Seen open at the last check', jobs.filter((job) => live(job) && job.availability === 'open').length],
    ['saved', 'On the shortlist', jobs.filter((job) => live(job) && job.saved).length],
    ['working', 'Being prepared or checked', jobs.filter((job) => ['check details', 'preparing'].includes(status(job))).length],
    ['applied', 'Applied for', jobs.filter(applied).length],
    ['interview', 'Reached an interview', jobs.filter((job) => ['interview', 'offer'].includes(status(job))).length],
    ['offer', 'Offer', jobs.filter((job) => status(job) === 'offer').length],
  ].map(([id, label, count]) => ({ id, label, count }))
  const bySource = new Map()
  for (const job of jobs) {
    const key = text(job.source, 80) || 'No source'
    const row = bySource.get(key) ?? { source: key, total: 0, open: 0, saved: 0, applied: 0 }
    row.total += 1
    if (live(job) && job.availability === 'open') row.open += 1
    if (live(job) && job.saved) row.saved += 1
    if (applied(job)) row.applied += 1
    bySource.set(key, row)
  }
  const ranked = [...bySource.values()].sort((a, b) => b.total - a.total || a.source.localeCompare(b.source))
  const rest = ranked.slice(sources)
  const sourceRows = rest.length ? [...ranked.slice(0, sources), rest.reduce((sum, row) => ({ source: `${rest.length} other sources`, total: sum.total + row.total, open: sum.open + row.open, saved: sum.saved + row.saved, applied: sum.applied + row.applied }), { total: 0, open: 0, saved: 0, applied: 0 })] : ranked
  const thisWeek = mondayOf(today)
  // Closing dates still ahead of jobs not applied for: all of them, and those on the shortlist.
  const closing = Array.from({ length: weeksAhead }, (_unused, index) => {
    const from = addDays(thisWeek, index * 7)
    const until = addDays(from, 6)
    const inWeek = jobs.filter((job) => live(job) && !applied(job) && day(job.deadline) >= (index === 0 ? today : from) && day(job.deadline) <= until)
    return { from, count: inWeek.length, saved: inWeek.filter((job) => job.saved).length }
  })
  // Leads added to JobMap, week by week.
  const found = Array.from({ length: weeksBack }, (_unused, index) => {
    const from = addDays(thisWeek, (index - weeksBack + 1) * 7)
    const until = addDays(from, 6)
    return { from, count: jobs.filter((job) => day(job.addedOn) >= from && day(job.addedOn) <= until).length }
  })
  return {
    steps, sources: sourceRows, closing, found,
    rejected: jobs.filter((job) => status(job) === 'rejected').length,
    archived: jobs.filter((job) => status(job) === 'archived').length,
    withDeadline: jobs.filter((job) => day(job.deadline)).length,
  }
}

// ---- Where money went ---------------------------------------------------------------------
export function moneyOf(budget, { from, to }) {
  const state = plain(budget?.state ?? budget)
  const categories = new Map(array(state.categories).map((row) => [row.id, { name: text(row.name, 80) || row.id, group: text(row.group, 80) }]))
  const shops = new Map(array(state.shops).map((row) => [row.id, text(row.name, 80)]))
  const byCategory = new Map()
  const byShop = new Map()
  let totalPence = 0
  let receipts = 0
  for (const receipt of array(state.receipts)) {
    const date = day(receipt?.date)
    if (!date || date < from || date > to) continue
    receipts += 1
    const paid = Number.isSafeInteger(receipt.paidPence) ? receipt.paidPence : 0
    totalPence += paid
    const shop = shops.get(receipt.shopId) || text(receipt.merchant, 80) || 'No shop named'
    const shopRow = byShop.get(shop) ?? { name: shop, pence: 0, receipts: 0 }
    shopRow.pence += paid
    shopRow.receipts += 1
    byShop.set(shop, shopRow)
    for (const line of array(receipt.lines)) {
      const pence = Number.isSafeInteger(line?.netPence) ? line.netPence : Number.isSafeInteger(line?.grossPence) ? line.grossPence : 0
      const known = categories.get(line?.categoryId)
      const key = known ? line.categoryId : ''
      const row = byCategory.get(key) ?? { id: key, name: known?.name ?? 'No category', group: known?.group ?? '', pence: 0, lines: 0 }
      row.pence += pence
      row.lines += 1
      byCategory.set(key, row)
    }
  }
  const ranked = (map) => [...map.values()].sort((a, b) => b.pence - a.pence || a.name.localeCompare(b.name))
  return { totalPence, receipts, byCategory: ranked(byCategory), byShop: ranked(byShop) }
}

// ---- How two measures move together -------------------------------------------------------
// Pearson's r over the days so far. With few days it says little, so it is only worked out from
// ten days up, and the number of days always travels with it.
export function relate(xs, ys) {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return { n, r: null }
  const mean = (list) => list.slice(0, n).reduce((sum, value) => sum + value, 0) / n
  const [mx, my] = [mean(xs), mean(ys)]
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let index = 0; index < n; index += 1) { const dx = xs[index] - mx; const dy = ys[index] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy }
  return { n, r: sxx > 0 && syy > 0 ? round(sxy / Math.sqrt(sxx * syy)) : null }
}

const PAIRS = [
  ['study_planned_minutes', 'focus_minutes'],
  ['focus_minutes', 'study_cards_done'],
  ['study_planned_minutes', 'study_cards_done'],
  ['plans_made', 'plans_done'],
  ['jobs_set_aside_minutes', 'jobs_sent'],
]
export const MIN_DAYS_TO_RELATE = 10
export function relationsOf(days, today) {
  const elapsed = days.filter((row) => row.date <= today)
  const measure = (id) => MEASURES.find((row) => row[0] === id)
  return PAIRS.map(([a, b]) => {
    const [x, y] = [measure(a), measure(b)]
    const xs = elapsed.map(x[3])
    const ys = elapsed.map(y[3])
    const result = elapsed.length >= MIN_DAYS_TO_RELATE ? relate(xs, ys) : { n: elapsed.length, r: null }
    const why = elapsed.length < MIN_DAYS_TO_RELATE ? 'too-few-days' : result.r === null ? 'no-variation' : ''
    return { a: { id: a, label: x[1] }, b: { id: b, label: y[1] }, n: result.n, r: result.r, why }
  })
}

// ---- The same rows as files ---------------------------------------------------------------
const cell = (value) => { const said = value === null || value === undefined ? '' : String(value); return /[",\r\n]/.test(said) ? `"${said.replaceAll('"', '""')}"` : said }
export const toCsv = (columns, rows) => [columns.join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\r\n') + '\r\n'
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// One row for each day, one column for each measure.
export function dayTable(days, today) {
  const columns = ['date', 'weekday', 'iso_week_start', 'elapsed', ...MEASURES.map((row) => row[0]), 'study_cards_due', 'focus_study_minutes', 'focus_jobs_minutes', 'focus_other_minutes', 'jobs_time_blocks', 'home_receipts']
  const rows = days.map((d) => ({
    date: d.date, weekday: WEEKDAY_NAMES[isoWeekday(d.date) - 1], iso_week_start: mondayOf(d.date), elapsed: d.date <= today ? 1 : 0,
    ...Object.fromEntries(MEASURES.map(([id, _label, _unit, pick]) => [id, pick(d)])),
    study_cards_due: d.study.cardsDue, focus_study_minutes: d.focus.study, focus_jobs_minutes: d.focus.jobs, focus_other_minutes: d.focus.other, jobs_time_blocks: d.jobs.setAside, home_receipts: d.home.receipts,
  }))
  return { columns, rows }
}
// "Tidy": one row for each day and measure, the shape most analysis tools take.
export function tidyTable(days, today) {
  const wide = dayTable(days, today)
  const measures = wide.columns.filter((column) => !['date', 'weekday', 'iso_week_start', 'elapsed'].includes(column))
  return { columns: ['date', 'weekday', 'elapsed', 'measure', 'value'], rows: wide.rows.flatMap((row) => measures.map((measure) => ({ date: row.date, weekday: row.weekday, elapsed: row.elapsed, measure, value: row[measure] }))) }
}
export function jobTable(career) {
  const columns = ['id', 'role', 'company', 'location', 'source', 'status', 'shortlisted', 'my_priority', 'availability', 'added_on', 'advertised_on', 'deadline', 'applied', 'follow_up', 'hours', 'my_categories', 'url']
  const rows = array(career?.jobs ?? career).filter((job) => job && typeof job.id === 'string').map((job) => ({
    id: job.id, role: job.role, company: job.company, location: job.location, source: job.source, status: job.status, shortlisted: job.saved ? 1 : 0, my_priority: job.priority, availability: job.availability ?? '',
    added_on: day(job.addedOn), advertised_on: day(job.advertisedOn), deadline: day(job.deadline), applied: day(job.applied), follow_up: day(job.followUp), hours: job.hours, my_categories: job.tags ?? '', url: job.url,
  }))
  return { columns, rows }
}
export function cardTable(workspace) {
  const modules = new Map(array(workspace?.modules).map((module) => [module.id, module]))
  const semesters = new Map(array(workspace?.semesters).map((semester) => [semester.id, semester]))
  const columns = ['id', 'title', 'semester', 'module_code', 'module', 'status', 'done', 'start_date', 'due_date', 'priority', 'lane', 'created_at', 'updated_at']
  const rows = array(workspace?.cards).filter((card) => !card.deleted_at).map((card) => {
    const module = modules.get(card.module_id)
    const data = plain(card.data)
    return {
      id: card.id, title: card.title, semester: semesters.get(card.semester_id)?.title ?? '', module_code: plain(module?.data).code ?? '', module: module?.title ?? '', status: card.status,
      done: lower(card.status) === 'done' || data.done === true ? 1 : 0, start_date: day(card.start_date), due_date: day(card.end_date), priority: data.priority ?? '', lane: data.lane ?? '', created_at: card.created_at ?? '', updated_at: card.updated_at ?? '',
    }
  })
  return { columns, rows }
}

// ---- The service --------------------------------------------------------------------------
export function createAnalysisService({ review, loadStudy, loadPlans, loadEvents, loadCareer, loadBudget, loadEntries, today = () => dateKey(new Date()) } = {}) {
  const safely = (load) => Promise.resolve().then(load).catch(() => null)
  async function gather({ from, to }) {
    // Asked for at once, so a part read by both the review and the analysis is read one time.
    const [base, studyParts, career, budget, entries] = await Promise.all([
      review({ from, to }),
      safely(async () => {
        const workspace = await loadStudy()
        const semesters = array(workspace?.semesters).filter((row) => !STUDY_OVER.has(lower(row.status)))
        const [plans, events] = await Promise.all([
          Promise.all(semesters.map(async (row) => ({ semesterId: row.id, plan: await Promise.resolve(loadPlans?.(row.id)).catch(() => ({})) }))),
          Promise.all(semesters.map((row) => Promise.resolve(loadEvents?.(row.id)).catch(() => []))),
        ])
        return { workspace, plans, events: events.flat() }
      }),
      safely(loadCareer), safely(loadBudget),
      safely(async () => withRoutines(await loadEntries(), from, to)),
    ])
    return { base, studyParts, career, budget, entries }
  }
  async function analysisOf({ from, to } = {}) {
    const { base, studyParts, career, budget, entries } = await gather({ from, to })
    const range = { from, to, today: base.today ?? today() }
    return {
      from, to, today: range.today, days: base.days, totals: base.totals, sources: base.sources,
      elapsedDays: base.days.filter((row) => row.date <= range.today).length,
      stats: statsOf(base.days, range.today),
      weekdays: weekdayProfile(base.days, range.today),
      burnUp: burnUp(base.days, range.today),
      hours: hourGrid({ plans: studyParts?.plans, entries: entries ?? [], events: studyParts?.events }, range),
      modules: studyParts ? modulesOf(studyParts, range) : null,
      jobs: career && (Array.isArray(career) || Array.isArray(career.jobs)) ? funnelOf(career, range.today) : null,
      money: budget && typeof budget === 'object' ? moneyOf(budget, range) : null,
      relations: relationsOf(base.days, range.today),
    }
  }
  // A file of rows: the days (wide or tidy), every job, every study card, or the whole analysis.
  async function exportOf({ from, to, format }) {
    const name = (what, ext) => `life-os-${what}-${from}-to-${to}.${ext}`
    if (format === 'json') { const data = await analysisOf({ from, to }); return { name: name('analysis', 'json'), type: 'application/json; charset=utf-8', body: JSON.stringify(data, null, 2) } }
    if (format === 'jobs') { const career = await loadCareer(); const table = jobTable(career); return { name: `life-os-jobs-${today()}.csv`, type: 'text/csv; charset=utf-8', body: toCsv(table.columns, table.rows) } }
    if (format === 'cards') { const table = cardTable(await loadStudy()); return { name: `life-os-study-cards-${today()}.csv`, type: 'text/csv; charset=utf-8', body: toCsv(table.columns, table.rows) } }
    if (format !== 'days' && format !== 'tidy') throw Object.assign(new Error('Ask for days, tidy, jobs, cards or json'), { status: 400 })
    const base = await review({ from, to })
    const table = format === 'tidy' ? tidyTable(base.days, base.today ?? today()) : dayTable(base.days, base.today ?? today())
    return { name: name(format === 'tidy' ? 'days-tidy' : 'days', 'csv'), type: 'text/csv; charset=utf-8', body: toCsv(table.columns, table.rows) }
  }
  return { analysisOf, exportOf }
}

export function createAnalysisRouter({ express, service }) {
  const router = express.Router()
  const range = (req) => ({ from: String(req.query.from ?? ''), to: String(req.query.to ?? '') })
  router.get('/', async (req, res, next) => {
    try { res.set('Cache-Control', 'no-store'); res.json(await service.analysisOf(range(req))) } catch (error) { next(error) }
  })
  router.get('/export', async (req, res, next) => {
    try {
      const file = await service.exportOf({ ...range(req), format: String(req.query.format ?? 'days') })
      res.set({ 'Cache-Control': 'no-store', 'Content-Type': file.type, 'Content-Disposition': `attachment; filename="${file.name}"` })
      // A byte-order mark, so a spreadsheet opens "£" and accented names correctly.
      res.send(file.type.startsWith('text/csv') ? `﻿${file.body}` : file.body)
    } catch (error) { next(error) }
  })
  return router
}
