// One-time: JobMap was used in two places (the standalone app and the copy inside Life OS)
// and each gained jobs the other lacks. This brings the standalone workspace into the
// Life OS one so nothing is lost and no vacancy appears twice. Usage:
//   node scripts/merge-jobmap-workspaces.mjs --newer "<folder of the standalone JobMap app>" [--apply]
// Without --apply it only reports. The standalone folder is only read.
//
// Rules:
// - The standalone workspace is the starting point (it carries the dates the new version records).
// - A vacancy held by both under different ids (same advert link) is kept once, under the
//   standalone id, with the earlier of the two "added" dates.
// - A job only the Life OS copy holds is added with everything saved about it (status,
//   shortlist, notes, history) and the day Life OS first imported it.
// - Personal fields that disagree stop the merge; nothing is chosen silently.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Store } from '../jobmap/lib/store.mjs'
import { canonicalUrl } from '../jobmap/lib/discovery.mjs'
import { calendarDay } from '../jobmap/lib/job-dates.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : '')
const apply = args.includes('--apply')
const newerRoot = option('newer')
if (!newerRoot || !fs.existsSync(path.join(newerRoot, 'data/workspace/progress.json'))) {
  console.error('Usage: node scripts/merge-jobmap-workspaces.mjs --newer "<folder of the standalone JobMap app>" [--apply]')
  process.exit(1)
}
const here = path.join(projectRoot, 'jobmap/data')
const there = path.join(newerRoot, 'data')
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
const personal = ['status', 'saved', 'priority', 'notes', 'nextStep', 'followUp', 'applied', 'cv', 'coverLetter', 'hours', 'deadline', 'role', 'company', 'location', 'salary', 'url', 'advertisedOn']
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const norm = (text) => String(text ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

if (!fs.readFileSync(path.join(here, 'jobs.json')).equals(fs.readFileSync(path.join(there, 'jobs.json')))) throw new Error('The two copies do not share the same original collection; this merge does not cover that.')
const base = read(path.join(here, 'jobs.json'))
const mine = read(path.join(here, 'workspace/progress.json'))
const theirs = read(path.join(there, 'workspace/progress.json'))

// The day each Life OS job was first imported, from the batches Life OS processed.
const firstDay = new Map()
const processed = path.join(here, 'inbox/processed')
for (const name of fs.readdirSync(processed).filter((file) => file.endsWith('.json')).sort()) {
  let batch
  try { batch = read(path.join(processed, name)) } catch { continue }
  const run = (mine.importRuns ?? []).find((item) => item.id === batch.runId)
  if (!run || !Array.isArray(batch.jobs)) continue
  const day = calendarDay(new Date(run.at))
  for (const job of batch.jobs) {
    const link = canonicalUrl(job.url)
    if (link && (!firstDay.has(link) || day < firstDay.get(link))) firstDay.set(link, day)
  }
}

const merged = structuredClone(theirs)
merged.observations ??= {}
merged.importRuns ??= []
const theirById = new Map(merged.customJobs.map((job) => [job.id, job]))
const theirByLink = new Map(merged.customJobs.filter((job) => canonicalUrl(job.url)).map((job) => [canonicalUrl(job.url), job]))
const report = { sameId: 0, sameAdvert: 0, onlyHere: [], datesMovedEarlier: [], conflicts: [], lookAlikes: [] }

function carryPersonal(fromId, toId) {
  const from = mine.overrides[fromId]
  if (!from) return
  const to = merged.overrides[toId] ?? {}
  for (const field of personal) {
    if (!(field in from) || same(from[field], to[field])) continue
    if (field in to) report.conflicts.push(`${toId}: ${field} is ${JSON.stringify(to[field])} in the standalone app and ${JSON.stringify(from[field])} in Life OS`)
    else to[field] = from[field]
  }
  if ((from.history ?? []).length > (to.history ?? []).length) to.history = from.history
  merged.overrides[toId] = to
}

for (const job of mine.customJobs) {
  const link = canonicalUrl(job.url)
  const twin = theirById.get(job.id) ?? (link ? theirByLink.get(link) : undefined)
  if (twin) {
    if (twin.id === job.id) report.sameId += 1; else report.sameAdvert += 1
    carryPersonal(job.id, twin.id)
    const day = firstDay.get(link)
    if (day && (!twin.addedOn || day < twin.addedOn)) { report.datesMovedEarlier.push(`${twin.role} @ ${twin.company}: added ${twin.addedOn || 'not recorded'} -> ${day}`); twin.addedOn = day }
    continue
  }
  const lookAlike = merged.customJobs.find((other) => norm(other.company) === norm(job.company) && norm(other.role) === norm(job.role))
  if (lookAlike) report.lookAlikes.push(`${job.role} @ ${job.company}: ${job.url} (Life OS) and ${lookAlike.url} (standalone)`)
  const added = { ...job, addedOn: job.addedOn || firstDay.get(link) || '' }
  merged.customJobs.push(added)
  if (mine.overrides[job.id]) merged.overrides[job.id] = structuredClone(mine.overrides[job.id])
  if (mine.observations?.[job.id]) merged.observations[job.id] = structuredClone(mine.observations[job.id])
  report.onlyHere.push(`${added.role} @ ${added.company} | added ${added.addedOn || 'not recorded'} | ${JSON.stringify({ ...mine.overrides[job.id], history: undefined })}`)
}

// Personal records on the original collection's jobs must agree.
const baseIds = new Set(base.map((job) => job.id))
for (const id of Object.keys(mine.overrides).filter((key) => baseIds.has(key))) carryPersonal(id, id)

for (const run of mine.importRuns ?? []) if (!merged.importRuns.some((item) => item.id === run.id)) merged.importRuns.push(run)
merged.importRuns.sort((a, b) => a.at.localeCompare(b.at))
if (!same(mine.preferences, theirs.preferences)) report.conflicts.push('The matching preferences differ between the two copies')
merged.revision = Math.max(mine.revision, theirs.revision) + 1
merged.updatedAt = new Date().toISOString()

// The app's own check of a saved workspace, and no advert link twice.
const check = new Store(base, fs.mkdtempSync(path.join(os.tmpdir(), 'jobmap-merge-')))
const valid = check.validateState(merged)
const links = merged.customJobs.map((job) => canonicalUrl(job.url)).filter(Boolean)
const repeated = links.filter((link, index) => links.indexOf(link) !== index)
if (repeated.length) report.conflicts.push(`Advert links held twice after merging: ${repeated.join(', ')}`)

const count = (state) => `${state.customJobs.length} added jobs, ${Object.keys(state.overrides).length} personal records, ${Object.keys(state.observations ?? {}).length} refreshed adverts, ${(state.importRuns ?? []).length} imports, revision ${state.revision}`
console.log(`Life OS copy now : ${count(mine)}`)
console.log(`Standalone app   : ${count(theirs)}`)
console.log(`After merging    : ${count(valid)} (with the ${base.length} of the original collection: ${base.length + valid.customJobs.length} jobs)`)
console.log(`Held by both under the same id: ${report.sameId}; same advert under different ids, kept once: ${report.sameAdvert}`)
console.log(`Only in the Life OS copy, carried over: ${report.onlyHere.length}`)
for (const line of report.onlyHere) console.log(`   ${line}`)
console.log(`"Added" dates moved to the earlier day Life OS first had the job: ${report.datesMovedEarlier.length}`)
for (const line of report.datesMovedEarlier) console.log(`   ${line}`)
if (report.lookAlikes.length) { console.log('Same role and employer under different links (kept as two; review in the app):'); for (const line of report.lookAlikes) console.log(`   ${line}`) }
if (report.conflicts.length) {
  console.log('STOPPED. These need a decision before anything is written:')
  for (const line of report.conflicts) console.log(`   ${line}`)
  process.exit(2)
}
if (!apply) { console.log('Nothing was changed. Add --apply to do it.'); process.exit(0) }

// The Life OS JobMap keeps the workspace in memory while it runs; it must be stopped.
const running = await fetch(`http://127.0.0.1:${process.env.LIFE_OS_JOBMAP_PORT || 47852}/api/health`, { signal: AbortSignal.timeout(1500) }).then((response) => response.ok, () => false)
if (running) { console.log('STOPPED. JobMap is running inside Life OS. Stop Life OS first, then run this again.'); process.exit(3) }

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = path.resolve(projectRoot, `../Life_OS_backups/jobmap-before-merge-${stamp}`)
fs.cpSync(here, path.join(backup, 'data'), { recursive: true })
console.log(`Copy of the Life OS JobMap data before the merge: ${backup}`)

const workspace = path.join(here, 'workspace')
fs.mkdirSync(path.join(workspace, 'backups'), { recursive: true })
fs.writeFileSync(path.join(workspace, 'backups', `${stamp}-${mine.revision}-before-merge.json`), JSON.stringify(mine), 'utf8')
fs.writeFileSync(path.join(workspace, 'progress.json.tmp'), JSON.stringify(valid, null, 2), 'utf8')
fs.renameSync(path.join(workspace, 'progress.json.tmp'), path.join(workspace, 'progress.json'))

// The search batches and import records Life OS lacks, so its history is whole.
let copied = 0
for (const folder of ['discoveries', 'inbox/processed']) {
  fs.mkdirSync(path.join(here, folder), { recursive: true })
  const held = new Set(fs.readdirSync(path.join(here, folder)).filter((name) => name.endsWith('.json')).map((name) => { try { return read(path.join(here, folder, name)).runId } catch { return '' } }))
  for (const name of fs.readdirSync(path.join(there, folder)).filter((file) => file.endsWith('.json'))) {
    let runId = ''
    try { runId = read(path.join(there, folder, name)).runId } catch { continue }
    if (!runId || held.has(runId) || fs.existsSync(path.join(here, folder, name))) continue
    fs.copyFileSync(path.join(there, folder, name), path.join(here, folder, name))
    held.add(runId)
    copied += 1
  }
}
const logFile = path.join(workspace, 'import-log.md')
const myLog = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : ''
const theirLog = fs.readFileSync(path.join(there, 'workspace/import-log.md'), 'utf8')
const fileOf = (line) => line.split(' · ')[1] ?? ''
const known = new Set(myLog.split(/\r?\n/).filter((line) => line.startsWith('- ')).map(fileOf))
const missing = theirLog.split(/\r?\n/).filter((line) => line.startsWith('- ') && fileOf(line) && !known.has(fileOf(line)))
fs.writeFileSync(logFile, `${myLog.replace(/\s*$/, '')}\n${missing.map((line) => `${line} (imported in the standalone app)`).join('\n')}${missing.length ? '\n' : ''}- ${merged.updatedAt} · standalone JobMap workspace merged into Life OS · ${valid.customJobs.length - mine.customJobs.length + report.sameAdvert} jobs new to Life OS, ${report.onlyHere.length} Life OS jobs kept, ${report.sameAdvert} held by both kept once\n`, 'utf8')

const opened = await new Store(base, workspace).init()
console.log(`Done. JobMap now opens with ${opened.jobs().length} jobs at revision ${opened.state.revision}; ${copied} search batch files and ${missing.length} import-log lines copied over.`)
