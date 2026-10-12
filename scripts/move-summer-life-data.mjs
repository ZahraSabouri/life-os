// One-time: what the Summer 2026 semester keeps aside is not study (Xar, 12 October 2026:
// "the summer app integrated into the life os has nothing to do with anything other than
// studying … the admining stuff should be transferred to another part rather than the Study
// Hub"). This moves it into Life OS's own entries, filed under the area each thing belongs
// to, all marked done (they are past; done things stay on the calendar as history), and
// then empties the study workspace's kept-aside store.
//   - the food plan (meals)            -> meals, under Body & Health
//   - other health cards               -> tasks, under Body & Health
//   - admin cards                      -> tasks, under Life admin
//   - chores and errands ("General")   -> tasks, under Home & Living
//   - the interview module and notes   -> notes, under Career & Professional
//   - the summer's daily routine (schedule rules and exceptions) -> the archive file only
// Usage: node scripts/move-summer-life-data.mjs <lifeos|lifeos_test> [--life-os http://127.0.0.1:47850] [--apply]
// Without --apply it only reports. With it: a copy of the core database, a dump of the study
// database and a file holding everything kept aside are written first. Running it again adds
// nothing twice (an entry with the same kind, title and day is left alone).
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool, postgresBackup } from '../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../code/life-os/backend/src/modules/study/repository.js'
import { createHubStore } from '../hosting/study/hub/store.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback = '') => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback)
const database = args[0]
const apply = args.includes('--apply')
const lifeOs = option('life-os', 'http://127.0.0.1:47850')
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.LIFE_OS_TOKEN ?? 'dev-token-change-me'}` }
if (!['lifeos', 'lifeos_test'].includes(database)) {
  console.error('Usage: node scripts/move-summer-life-data.mjs <lifeos|lifeos_test> [--life-os <address>] [--apply]')
  process.exit(1)
}

const AREA = { Health: 'body', Admin: 'admin', General: 'home', 'Job Hunt': 'career', 'Interview Prep': 'career' }
const text = (value, limit = 20000) => String(value ?? '').trim().slice(0, limit)
const day = (value) => (/^\d{4}-\d{2}-\d{2}/.test(String(value ?? '')) ? String(value).slice(0, 10) : '')
// "HISTORY - 19 Jul - 19 Jul - 19 Jul - LIFE — Admin hour" is the summer app's stamp for work
// re-filed as history; the title is what follows it.
const title = (value) => text(value, 300).replace(/^HISTORY\s*-\s*(?:\d{1,2}\s+\w{3}\s*-\s*)+/i, '').trim() || text(value, 300)
const plain = (value) => text(typeof value === 'string' ? value : value?.text ?? value?.body ?? value?.content ?? value?.note ?? '', 6000)

// When a thing was first written: its own stamp, else the end of the semester it belonged to,
// so nothing brought in looks as if it had been written today.
const written = (stamp, fallback) => (/^\d{4}-\d{2}-\d{2}T/.test(stamp ?? '') && Date.parse(stamp) < Date.now() ? new Date(stamp).toISOString() : fallback)

// The mark that ties an entry to the thing it was made from. Two cards with the same title
// on the same day are two entries; the same card is never brought in twice.
const ref = (id) => `Ref: summer-2026/${id}`

function cardEntry(card, state = {}, fallback) {
  const group = card.moduleGroup || card.module || 'General'
  const meal = (card.tags ?? []).includes('food-plan')
  const date = day(card.dueDate) || day(card.startDate)
  const wasDone = Boolean(state.done || state.status === 'Done' || card.status === 'Done')
  const note = [
    text(card.description, 4000),
    card.doneCondition ? `Done when: ${text(card.doneCondition, 1000)}` : '',
    ...(state.notes ?? []).map((item) => `Note: ${plain(item)}`),
    ...(state.evidenceEntries ?? []).map((item) => `Evidence: ${plain(item)}`),
    title(card.title) !== text(card.title, 300) ? `Original title: ${text(card.title, 300)}` : '',
    `From the summer plan (${group})${wasDone ? '' : '; it was still open there'}. ${ref(card.id)}`,
  ].filter(Boolean).join('\n\n')
  return {
    type: meal ? 'meal' : 'task', title: title(card.title), status: 'done',
    ...(date ? { start_at: date, all_day: true } : {}),
    created_at: written(card.createdAt, fallback),
    details: { area: AREA[group] ?? 'admin', note, ...(meal ? { name: title(card.title), kind: 'logged' } : {}) },
  }
}

function seedEntry(seed, fallback) {
  const body = [plain(seed.body ?? seed.content ?? seed.answer ?? seed.text ?? seed.markdown), ...(Array.isArray(seed.points) ? seed.points.map(plain) : [])].filter(Boolean).join('\n\n')
  return { type: 'note', title: text(seed.title ?? seed.question, 300) || 'Interview note', details: { area: 'career', body: body || text(JSON.stringify(seed, null, 2), 15000), note: `From the summer plan (Interview Prep). ${ref(`note/${seed.id ?? seed.title}`)}` }, created_at: written(seed.createdAt ?? seed.updatedAt, fallback) }
}

function moduleEntry(module, fallback) {
  const section = (name, rows) => (Array.isArray(rows) && rows.length ? `${name}:\n${rows.map((row) => `- ${typeof row === 'string' ? row : [row.title, row.detail, row.output, row.url].filter(Boolean).join(' — ')}`).join('\n')}` : '')
  return { type: 'note', title: `${text(module.title ?? module.label, 200) || 'Interview'}: preparation notes from the summer`, details: { area: 'career', body: [text(module.subtitle, 1000), text(module.examShape, 2000), section('Aims', module.objectives), section('Working rules', module.operatingRules), section('Drills', module.drills), section('Patterns', module.recipes), section('Sources', module.resources)].filter(Boolean).join('\n\n'), note: `From the summer plan (Interview Prep). ${ref(`module/${module.id ?? module.title}`)}` }, created_at: fallback }
}

const config = postgresConfig(projectRoot)
const pool = createPostgresPool(config, { database })
try {
  const rows = (await pool.query(`SELECT w.semester_id, s.title, s.end_date::text AS end_date, w.set_aside FROM study.hub_workspaces w JOIN study.semesters s ON s.id = w.semester_id
    WHERE w.set_aside IS NOT NULL AND json_typeof(w.set_aside) = 'object'`)).rows.filter((row) => ['baseCards', 'addedCards', 'modules', 'knowledgeSeeds', 'scheduleRules'].some((key) => Array.isArray(row.set_aside[key]) && row.set_aside[key].length))
  if (!rows.length) { console.log('No study workspace keeps anything aside that is not study. Nothing to move.'); process.exit(0) }
  for (const row of rows) {
    const aside = row.set_aside
    const cards = [...(aside.baseCards ?? []), ...(aside.addedCards ?? [])]
    const ended = `${row.end_date && row.end_date < new Date().toISOString().slice(0, 10) ? row.end_date : '2026-08-28'}T12:00:00.000Z`
    const entries = [
      ...cards.map((card) => cardEntry(card, aside.cardStates?.[card.id], ended)),
      ...(aside.modules ?? []).map((module) => moduleEntry(module, ended)),
      ...(aside.knowledgeSeeds ?? []).map((seed) => seedEntry(seed, ended)),
    ]
    const tally = {}
    for (const entry of entries) tally[`${entry.type} under ${entry.details.area}`] = (tally[`${entry.type} under ${entry.details.area}`] ?? 0) + 1
    console.log(`${row.title}: ${cards.length} cards, ${(aside.modules ?? []).length} module, ${(aside.knowledgeSeeds ?? []).length} notes, ${(aside.scheduleRules ?? []).length} routine rules and ${(aside.scheduleExceptions ?? []).length} exceptions kept aside.`)
    console.log('  Would become:', Object.entries(tally).map(([key, count]) => `${count} ${key}`).join('; '), `(${entries.length} entries, all marked done except notes); the routine goes to the archive file only.`)
    for (const sample of [entries[0], entries.find((entry) => entry.type === 'meal'), entries.find((entry) => entry.details.area === 'admin'), entries.at(-1)].filter(Boolean)) console.log(`  e.g. ${sample.type} | ${sample.start_at ?? 'no day'} | ${sample.title.slice(0, 70)} | note ${String(sample.details.note ?? sample.details.body ?? '').length} chars`)
    if (!apply) continue

    // Copies first: the core database (read through SQLite), the study database, and everything kept aside as a file.
    const folder = path.resolve(projectRoot, '../Life_OS_backups/summer-2026-not-study')
    fs.mkdirSync(folder, { recursive: true })
    const stamp = Date.now()
    const coreCopy = path.join(folder, `core-before-${stamp}.db`)
    const core = new DatabaseSync(path.join(projectRoot, 'code/life-os/backend/data/life-os.db'), { readOnly: true })
    core.exec(`VACUUM INTO '${coreCopy.replace(/'/g, "''")}'`)
    core.close()
    const archive = path.join(folder, `summer-2026-kept-aside-${stamp}.json`)
    fs.writeFileSync(archive, JSON.stringify({ semester: row.title, semesterId: row.semester_id, takenOutOn: new Date().toISOString(), setAside: aside }, null, 2))
    console.log(`  Core database copy: ${coreCopy}`)
    console.log(`  Everything kept aside, as a file: ${archive} (${fs.statSync(archive).size} bytes)`)
    console.log(`  Study database dump: ${await postgresBackup(config, projectRoot, 'before-moving-summer-life-data', database)}`)

    const existing = await (await fetch(`${lifeOs}/api/entries?limit=5000`, { headers })).json()
    const key = (entry) => /Ref: summer-2026\/\S+/.exec(String(entry.details?.note ?? ''))?.[0] ?? ''
    const have = new Set(existing.map(key).filter(Boolean))
    if (new Set(entries.map(key)).size !== entries.length) throw new Error('Two things to move carry the same mark. Nothing was changed.')
    let added = 0, skipped = 0
    for (const entry of entries) {
      if (have.has(key(entry))) { skipped += 1; continue }
      have.add(key(entry))
      const response = await fetch(`${lifeOs}/api/entries`, { method: 'POST', headers, body: JSON.stringify(entry) })
      if (!response.ok) throw new Error(`Life OS did not take "${entry.title}": ${(await response.json()).error}. The study workspace was left as it was.`)
      added += 1
    }
    const after = await (await fetch(`${lifeOs}/api/entries?limit=5000`, { headers })).json()
    console.log(`  Life OS entries: ${existing.length} before, ${after.length} after (${added} added, ${skipped} already there).`)
    if (after.length !== existing.length + added) throw new Error('The count of entries does not add up. The study workspace was left as it was.')

    const store = createHubStore({ pool, repository: createStudyRepository({ pool }) })
    await store.replaceWorkspace(row.semester_id, {
      setAside: { why: 'Nothing is kept aside here any more: what was not study moved into Life OS.', moved: [...(Array.isArray(aside.moved) ? aside.moved : []), { what: 'cards, the interview module and its notes', count: entries.length, to: 'Life OS entries (Body & Health, Life admin, Home & Living, Career)', on: new Date().toISOString() }, { what: 'the daily routine (schedule rules and exceptions)', count: (aside.scheduleRules ?? []).length + (aside.scheduleExceptions ?? []).length, to: archive, on: new Date().toISOString() }] },
      reason: 'life and admin data moved to Life OS', writerId: 'move-summer-life-data',
    })
    const left = (await pool.query('SELECT set_aside FROM study.hub_workspaces WHERE semester_id = $1', [row.semester_id])).rows[0].set_aside
    console.log(`  ${row.title}: the study workspace now keeps aside: ${Object.entries(left).filter(([, value]) => Array.isArray(value) && value.length && typeof value[0] !== 'object' || (Array.isArray(value) && value.length && !('what' in (value[0] ?? {})))).map(([name, value]) => `${name} ${value.length}`).join(', ') || 'nothing but the record of what moved'}.`)
  }
  if (!apply) console.log('\nNothing was changed. Add --apply to move it.')
} finally {
  await pool.end()
}
