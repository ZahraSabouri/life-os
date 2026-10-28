// Exercises stale-save guards through isolated stores and HTTP routes. No real data is written.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const sourceRoot = root
const uri = p => pathToFileURL(path.join(root, p)).href
const mod = source => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const express = (await import(uri('code/life-os/backend/node_modules/express/index.js'))).default
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const semester = '00000000-0000-4000-8000-000000000001'

let saved = { plan: { scheduleRules: [{ id: 'kept' }], options: { keep: true } }, revision: 7 }
let transaction
const client = {
  async query(sql, values) {
    if (sql === 'BEGIN') { transaction = structuredClone(saved); return { rows: [] } }
    if (sql === 'ROLLBACK') { saved = transaction; return { rows: [] } }
    if (sql === 'COMMIT' || sql.startsWith('INSERT')) return { rows: [] }
    if (sql.includes('FOR UPDATE')) return { rows: [structuredClone(saved)] }
    if (sql.startsWith('UPDATE')) { saved.plan = JSON.parse(values[1]); return { rows: [] } }
    throw Error(`Unexpected mock SQL: ${sql}`)
  }, release() {},
}
const pool = {
  async connect() { return client },
  async query(sql) {
    assert(sql.includes('study.semesters'))
    return { rows: [{ id: semester, title: 'Fixture', status: 'active', data: {}, revision: 1 }] }
  },
}
let source = fs.readFileSync(path.join(sourceRoot, 'hosting/study/hub/store.mjs'), 'utf8')
source = source.replace("'./cards.mjs'", JSON.stringify(uri('hosting/study/hub/cards.mjs')))
const { createHubStore } = await mod(source)
const store = createHubStore({ pool, repository: { syncProjected() {} } })
const initialHash = hash(saved.plan)
await assert.rejects(store.updatePlan(semester, { scheduleRules: [] }, { expectedRevision: 6, expectedPlanHash: initialHash }), { status: 409 })
assert.equal(saved.plan.scheduleRules.length, 1)
await store.updatePlan(semester, { scheduleRules: [{ id: 'new' }] }, { expectedRevision: 7, expectedPlanHash: initialHash })
assert.deepEqual(saved.plan.options, { keep: true })
const good = structuredClone(saved)
await assert.rejects(store.updatePlan(semester, { scheduleRules: [] }, { expectedRevision: 7, expectedPlanHash: initialHash }), { status: 409 })
assert.deepEqual(saved, good)
await store.updatePlan(semester, { options: { legacy: true } })
assert.equal(saved.plan.options.legacy, true)
console.log('PASS plan: stale revision, stale plan at the same revision, rollback, matching save, old clients')

let entry = { id: 'fixture', type: 'task', archetype: 'commitment', title: 'Keep my title', status: null, details: '{}', start_at: null, end_at: null, all_day: 0, favorite: 0, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }
let updates = 0
globalThis.__resetCoreTestDb = {
  prepare(sql) {
    if (sql.includes('SELECT * FROM entries')) return { get: () => structuredClone(entry) }
    if (sql.includes('UPDATE entries')) return { run(...args) { updates++; const [title, status, start_at, end_at, all_day, favorite, details, updated_at] = args; entry = { ...entry, title, status, start_at, end_at, all_day, favorite, details, updated_at } } }
    return { run() { throw Error('Unexpected write in fixture') } }
  },
}
source = fs.readFileSync(path.join(sourceRoot, 'code/life-os/backend/src/routes/entries.js'), 'utf8')
source = source.replace("from 'express'", `from ${JSON.stringify(uri('code/life-os/backend/node_modules/express/index.js'))}`)
source = source.replace("import db from '../db.js'", 'const db = globalThis.__resetCoreTestDb')
source = source.replace("import { picturesOf, removePictureFile } from './files.js'", 'const picturesOf = () => new Map(); const removePictureFile = () => {}')
source = source.replace("'../../../shared/entryTypes.js'", JSON.stringify(uri('code/life-os/shared/entryTypes.js')))
source = source.replace("import { buildEntriesQuery } from '../query.js'", 'const buildEntriesQuery = () => ({})')
const coreRouter = (await mod(source)).default
const app = express(); app.use(express.json()); app.use('/entries', coreRouter)
const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
const url = `http://127.0.0.1:${server.address().port}/entries/fixture`
try {
  const patch = async (match, body) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(match === undefined ? {} : { 'If-Match': match }) }, body: JSON.stringify(body) })
  const stale = await patch('"old"', { status: 'done' }); assert.equal(stale.status, 409); assert.equal(updates, 0)
  const response = await patch(`"${entry.updated_at}"`, { status: 'done' }); assert.equal(response.status, 200)
  const returned = await response.json(); assert.equal(returned.status, 'done'); assert.equal(returned.title, 'Keep my title')
  assert.equal((await patch(undefined, { title: 'Legacy client' })).status, 200)
  console.log('PASS core HTTP: stale patch cannot write, matching timestamp saves only requested fields, old clients')
} finally { await new Promise(resolve => server.close(resolve)); delete globalThis.__resetCoreTestDb }

source = fs.readFileSync(path.join(sourceRoot, 'hosting/study/hub/router.mjs'), 'utf8')
source = source.replace("'./store.mjs'", JSON.stringify(uri('hosting/study/hub/store.mjs'))).replace("'./duplicate.mjs'", JSON.stringify(uri('hosting/study/hub/duplicate.mjs')))
const { createHubRouter } = await mod(source)
let passed
const hubApp = express()
hubApp.use(createHubRouter({ express, store: { async updatePlan(id, change, conditions) { passed = { id, change, conditions }; return change } }, repository: {} }))
const hubServer = hubApp.listen(0, '127.0.0.1'); await new Promise(resolve => hubServer.once('listening', resolve))
try {
  const url = `http://127.0.0.1:${hubServer.address().port}/api/hub/plan?semester=${semester}`
  const patch = (headers) => fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ scheduleRules: [] }) })
  assert.equal((await patch({ 'If-Match': 'bad' })).status, 400)
  assert.equal((await patch({ 'X-Expected-Plan-Hash': 'bad' })).status, 400)
  assert.equal((await patch({ 'If-Match': '7', 'X-Expected-Plan-Hash': initialHash })).status, 200)
  assert.equal(passed.conditions.expectedRevision, 7); assert.equal(passed.conditions.expectedPlanHash, initialHash)
  console.log('PASS plan HTTP: malformed guards refused and valid revision/hash reach the store')
} finally { await new Promise(resolve => hubServer.close(resolve)) }
