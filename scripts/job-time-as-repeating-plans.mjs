// Job-application time after 25 October, as repeating plans.
//
// The autumn study plan reserved three hours a day for job applications, at a clock time that
// fits around each day's classes and study blocks, through to 27 December
// (.runtime/study-plan-2026-10-12/job-reservations.json). The first fortnight (12 to 25 October)
// was put on the calendar as 14 single blocks. This reads the rest of that file, finds its
// weekly pattern, and makes one repeating plan per weekday-and-time.
//
// Usage: node scripts/job-time-as-repeating-plans.mjs [--write]
// Without --write it only says what it would make. It makes nothing twice.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const base = process.env.LIFE_OS_URL ?? 'http://127.0.0.1:47850'
const headers = { Authorization: `Bearer ${process.env.LIFE_OS_TOKEN ?? 'dev-token-change-me'}`, 'Content-Type': 'application/json' }
const write = process.argv.includes('--write')
const FROM = '2026-10-26'   // the single blocks end on the 25th
const TITLE = 'Job applications'

const weekdayOf = (date) => ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1
const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

const reserved = JSON.parse(fs.readFileSync(path.join(root, '.runtime/study-plan-2026-10-12/job-reservations.json'), 'utf8'))
  .filter((row) => row.date >= FROM && row.start && row.end).sort((a, b) => a.date.localeCompare(b.date))
if (!reserved.length) throw new Error('The study plan reserves no job time after 25 October.')

// Runs of the same weekday at the same clock time, each from its first date to its last.
const runs = []
for (const row of reserved) {
  const weekday = weekdayOf(row.date)
  const run = runs.find((candidate) => candidate.weekday === weekday && candidate.start === row.start && candidate.end === row.end && addDays(candidate.until, 7) === row.date)
  if (run) run.until = row.date
  else runs.push({ weekday, start: row.start, end: row.end, from: row.date, until: row.date, days: 0 })
}
for (const run of runs) run.days = reserved.filter((row) => weekdayOf(row.date) === run.weekday && row.start === run.start && row.date >= run.from && row.date <= run.until).length
// Weekdays that share a clock time and the same first and last week are one plan.
const plans = []
for (const run of runs) {
  const same = plans.find((plan) => plan.start === run.start && plan.end === run.end && Math.abs(Date.parse(plan.from) - Date.parse(run.from)) < 7 * 86_400_000 && Math.abs(Date.parse(plan.until) - Date.parse(run.until)) < 7 * 86_400_000)
  if (same) { same.weekdays.push(run.weekday); same.from = same.from < run.from ? same.from : run.from; same.until = same.until > run.until ? same.until : run.until; same.days += run.days }
  else plans.push({ weekdays: [run.weekday], start: run.start, end: run.end, from: run.from, until: run.until, days: run.days })
}
const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
for (const plan of plans) plan.weekdays.sort()
console.log(`The study plan reserves job time on ${reserved.length} days from ${reserved[0].date} to ${reserved.at(-1).date}. As repeating plans:`)
for (const plan of plans) console.log(`  ${plan.weekdays.map((day) => names[day]).join(', ').padEnd(14)} ${plan.start} to ${plan.end}   ${plan.from} until ${plan.until}   (${plan.days} days)`)
const covered = plans.reduce((sum, plan) => sum + plan.days, 0)
if (covered !== reserved.length) throw new Error(`The plans cover ${covered} days, the file has ${reserved.length}. Nothing was made.`)

const entries = await (await fetch(`${base}/api/entries?limit=5000`, { headers })).json()
const existing = entries.filter((entry) => entry.type === 'repeat' && entry.title === TITLE)
const key = (weekdays, start, from) => `${weekdays}|${start}|${from}`
const have = new Set(existing.map((entry) => key(entry.details?.weekdays, entry.details?.start, String(entry.start_at).slice(0, 10))))
const single = entries.filter((entry) => entry.type === 'time-block' && entry.title === TITLE && String(entry.start_at).slice(0, 10) >= FROM)
if (single.length) throw new Error(`${single.length} single job-time blocks already exist on or after ${FROM}; repeating plans would double them. Nothing was made.`)

let made = 0
for (const plan of plans) {
  const weekdays = plan.weekdays.join(',')
  if (have.has(key(weekdays, plan.start, plan.from))) { console.log(`  already there: ${weekdays} ${plan.start}`); continue }
  if (!write) continue
  const response = await fetch(`${base}/api/entries`, { method: 'POST', headers, body: JSON.stringify({ type: 'repeat', title: TITLE, status: 'active', start_at: plan.from, end_at: plan.until, all_day: true, details: { weekdays, start: plan.start, end: plan.end, area: 'career' } }) })
  if (!response.ok) throw new Error(`Could not make the plan for ${weekdays}: ${response.status} ${await response.text()}`)
  made += 1
}
console.log(write ? `Made ${made} repeating ${made === 1 ? 'plan' : 'plans'}.` : 'Nothing was made (run again with --write).')
