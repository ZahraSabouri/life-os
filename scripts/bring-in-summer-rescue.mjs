// One-time: brings the Summer Rescue app's plan and saved state into the Study hub as one
// semester. Usage:
//   node scripts/bring-in-summer-rescue.mjs <lifeos|lifeos_test> --plan <plan.json> --state <state.json>
//        [--events <progress-log.ndjson>] [--title "Summer 2026"] [--start 2026-07-04] [--end 2026-08-28]
//        [--status completed] [--aside "Health,Admin,General,Job Hunt,Interview Prep"] [--apply]
// Without --apply it only reports what it would do. It backs up the database first, reuses
// the semester an earlier import made (so nothing appears twice) and removes that import's
// stale records. What is not study is kept aside inside the semester's workspace.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool, postgresBackup } from '../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../code/life-os/backend/src/modules/study/repository.js'
import { createHubStore } from '../hosting/study/hub/store.mjs'
import { splitStudy } from '../hosting/study/hub/study-only.mjs'
import { hubCards } from '../hosting/study/hub/cards.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback = '') => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback)
const database = args[0]
const apply = args.includes('--apply')
if (!['lifeos', 'lifeos_test'].includes(database) || !option('plan') || !option('state')) {
  console.error('Usage: node scripts/bring-in-summer-rescue.mjs <lifeos|lifeos_test> --plan <plan.json> --state <state.json> [--apply]')
  process.exit(1)
}

const extracted = JSON.parse(fs.readFileSync(option('plan'), 'utf8'))
const savedState = JSON.parse(fs.readFileSync(option('state'), 'utf8').replace(/^﻿/, ''))
const stateIn = savedState.state ?? savedState
const { modules: allModules, moduleFolders: _folders, extractedFrom: _from, ...planIn } = extracted
const lifeGroups = option('aside', 'Health,Admin,General,Job Hunt,Interview Prep').split(',').map((name) => name.trim()).filter(Boolean)
const { modules, plan, state, setAside } = splitStudy({ plan: planIn, state: stateIn, modules: allModules }, { lifeGroups })

const count = (cards) => `${cards.length} (${cards.filter((card) => card.done).length} done)`
console.log(`Study:     ${modules.length} modules (${modules.map((module) => module.label).join(', ')})`)
console.log(`           cards ${count(hubCards(plan, state))}; schedule rules ${plan.scheduleRules.length}; notes that came with the plan ${plan.knowledgeSeeds.length}`)
console.log(`Kept aside: ${setAside.baseCards.length + setAside.addedCards.length} cards, ${setAside.scheduleRules.length} schedule rules, ${setAside.modules.length} module, ${setAside.knowledgeSeeds.length} notes, ${setAside.shoppingList.length} shopping items`)

const config = postgresConfig(projectRoot)
const pool = createPostgresPool(config, { database })
const repository = createStudyRepository({ pool })
const store = createHubStore({ pool, repository })
try {
  const before = await repository.workspace({ historyLimit: 1 })
  const stale = (entity) => before[entity].filter((row) => row.provenance?.source === 'summer-rescue-original')
  const existing = stale('semesters')[0]
  console.log(existing ? `Reusing the semester "${existing.title}" from the earlier import; its stale records: ${['cards', 'modules', 'materials', 'assessments', 'progress'].map((entity) => `${entity} ${stale(entity).length}`).join(', ')}` : 'No earlier import in this database: a new semester will be made')
  if (!apply) { console.log('Nothing was changed. Add --apply to do it.'); process.exitCode = 0 }
  else {
    console.log(`Database dump: ${await postgresBackup(config, projectRoot, 'before-summer-rescue', database)}`)
    // Stale records first, children before parents. They stay restorable.
    let removed = 0
    for (const entity of ['progress', 'materials', 'assessments', 'cards', 'modules']) {
      for (const row of stale(entity)) { await repository.remove(entity, row.id, row.revision, { actor: 'summer-rescue-import' }); removed += 1 }
    }
    const fields = { title: option('title', 'Summer 2026'), status: option('status', 'completed'), start_date: option('start', '2026-07-04'), end_date: option('end', '2026-08-28') }
    const semester = existing
      ? await repository.patch('semesters', existing.id, { ...fields, data: { ...existing.data, note: plan.campaignMeta?.title ?? '' }, revision: existing.revision }, { actor: 'summer-rescue-import' })
      : await repository.create('semesters', { ...fields, data: { note: plan.campaignMeta?.title ?? '' } }, { actor: 'summer-rescue-import' })
    let order = 0
    for (const definition of modules) {
      await repository.create('modules', { title: definition.title || definition.label, status: 'active', semester_id: semester.id, data: { code: definition.code ?? '', order: order++, definition } }, { actor: 'summer-rescue-import' })
    }
    const result = await store.replaceWorkspace(semester.id, { plan, state, setAside, reason: 'Summer Rescue brought in', writerId: 'summer-rescue-import' })
    let events = 0
    if (option('events') && fs.existsSync(option('events'))) {
      const lines = fs.readFileSync(option('events'), 'utf8').split(/\r?\n/).filter(Boolean)
      events = await store.importEvents(semester.id, lines.map((line) => { try { return JSON.parse(line) } catch { return null } }).filter(Boolean))
    }
    console.log(`Done. Semester ${semester.id} "${semester.title}" (${semester.status}); stale records removed ${removed}; cards ${JSON.stringify(result.records.cards)}; exams ${JSON.stringify(result.records.assessments)}; events ${events}`)
  }
} finally {
  await pool.end()
}
