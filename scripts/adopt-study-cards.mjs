// One-time: cards that were added to a semester as plain Study records (before the Study
// hub app kept the cards) are brought into that semester's Study hub, so they show in the
// app and can be edited there. Usage:
//   node scripts/adopt-study-cards.mjs <lifeos|lifeos_test> [--semester <id>] [--apply]
// Without --apply it only reports. It backs up the database first. Each card is added to
// the hub once (running it again adds nothing twice) and its plain record is then removed,
// which keeps it restorable and keeps the calendar from showing the card twice.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool, postgresBackup } from '../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../code/life-os/backend/src/modules/study/repository.js'
import { createHubStore } from '../hosting/study/hub/store.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback = '') => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback)
const database = args[0]
const apply = args.includes('--apply')
if (!['lifeos', 'lifeos_test'].includes(database)) {
  console.error('Usage: node scripts/adopt-study-cards.mjs <lifeos|lifeos_test> [--semester <id>] [--apply]')
  process.exit(1)
}

const LANES = ['Today', 'This Week', 'Deep Work', 'Backlog', 'Waiting / Blocked', 'Rescue Lane', 'Done']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const GENERAL = 'General'
const stamp = (value) => (value instanceof Date ? value.toISOString() : value || new Date().toISOString())

// A plain Study card in the shape of a card the owner added in the app.
function hubCard(row, moduleGroup, index) {
  const data = row.data ?? {}
  const lane = row.status === 'done' ? 'Done' : row.status === 'blocked' ? 'Waiting / Blocked' : LANES.includes(data.lane) ? data.lane : 'Backlog'
  const startDate = row.start_date ?? ''
  const dueDate = row.end_date ?? ''
  const link = typeof data.url === 'string' && /^https?:\/\//.test(data.url) ? data.url : ''
  return {
    id: `custom-card-${row.id}`,
    number: `A${index + 1}`,
    sortOrder: 1000 + index,
    title: row.title,
    module: moduleGroup,
    moduleGroup,
    phase: 'Phase 1',
    phaseId: 'phase-1',
    sourceList: 'Added in app',
    status: lane,
    priority: PRIORITIES.includes(data.priority) ? data.priority : 'Medium',
    slotType: 'Flex',
    slotLabel: '',
    startDate,
    dueDate,
    dueDateTime: dueDate,
    estimatedHours: Number(data.estimatedHours) > 0 ? Number(data.estimatedHours) : 0,
    description: [String(data.description ?? '').trim(), link].filter(Boolean).join('\n\n'),
    checklist: Array.isArray(data.checklist) ? data.checklist.map((item) => (typeof item === 'string' ? item : item?.text ?? '')).filter(Boolean) : [],
    evidenceRequirement: '',
    doneCondition: '',
    trackerNotes: 'Brought in from Life OS',
    tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag).toLowerCase()) : [],
    custom: true,
    recurrenceKey: '',
    planningWindowStart: startDate,
    planningWindowEnd: dueDate,
    createdAt: stamp(row.created_at),
  }
}

const config = postgresConfig(projectRoot)
const pool = createPostgresPool(config, { database })
const repository = createStudyRepository({ pool })
const store = createHubStore({ pool, repository })
try {
  const all = await repository.workspace({ historyLimit: 1 })
  const plainCard = (row) => !String(row.provenance?.source ?? '').startsWith('hub:')
  const semesters = all.semesters.filter((semester) => (option('semester') ? semester.id === option('semester') : true))
  const work = []
  for (const semester of semesters) {
    const rows = all.cards.filter((row) => row.semester_id === semester.id && plainCard(row))
    if (rows.length === 0) continue
    const opened = await store.workspace(semester.id)
    const groupOf = new Map(opened.modules.map((module) => [module.rowId, module.moduleGroup]))
    const state = (await store.readState(semester.id)).payload?.state ?? { version: 9, cards: {}, addedCards: [], createdAt: new Date().toISOString() }
    const addedCards = [...(Array.isArray(state.addedCards) ? state.addedCards : [])]
    const cards = { ...(state.cards ?? {}) }
    let added = 0
    for (const row of rows) {
      const card = hubCard(row, groupOf.get(row.module_id) ?? GENERAL, addedCards.length)
      if (addedCards.some((item) => item.id === card.id)) continue
      addedCards.push(card)
      cards[card.id] = { status: card.status, done: card.status === 'Done', activity: [{ id: `log-${row.id}`, at: card.createdAt, action: 'Added card', details: card.title }] }
      added += 1
    }
    console.log(`${semester.title}: ${rows.length} plain cards (${added} to add to the hub, ${rows.length - added} already there)`)
    for (const row of rows) console.log(`   ${row.title} | ${row.status} | ${row.start_date ?? '-'} to ${row.end_date ?? '-'} | ${groupOf.get(row.module_id) ?? GENERAL}`)
    work.push({ semester, rows, next: { ...state, cards, addedCards, updatedAt: new Date().toISOString() } })
  }
  if (work.length === 0) console.log('No plain cards to bring in.')
  else if (!apply) console.log('Nothing was changed. Add --apply to do it.')
  else {
    console.log(`Database dump: ${await postgresBackup(config, projectRoot, 'before-adopting-cards', database)}`)
    for (const { semester, rows, next } of work) {
      const result = await store.replaceWorkspace(semester.id, { state: next, reason: 'cards brought into the Study hub', writerId: 'adopt-study-cards' })
      for (const row of rows) await repository.remove('cards', row.id, row.revision, { actor: 'adopt-study-cards' })
      console.log(`Done: ${semester.title}. Hub records ${JSON.stringify(result.records.cards)}; plain records removed ${rows.length}`)
    }
  }
} finally {
  await pool.end()
}
