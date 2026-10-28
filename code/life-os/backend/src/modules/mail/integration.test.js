import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMailRepository } from './repository.js'
import { createMailImporter, matchPerson } from './importer.js'
import { createMailInbox } from '../../../../../../hosting/mail/inbox.mjs'

const projectRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const example = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch.json'), 'utf8'))
// Explicit opt-in; the database is checked to be lifeos_test before anything is written.
const enabled = process.env.LIFE_OS_MAIL_TEST_DB === 'lifeos_test'

test('matchPerson: by address in contact, else by a name only one person has', () => {
  const people = [{ id: 1, name: 'Jo Evans', contact: 'JO.EVANS@example.ac.uk, 07700' }, { id: 2, name: 'Sam Taylor', contact: '' }, { id: 3, name: 'Sam Taylor', contact: null }, { id: 4, name: 'Ana', contact: '' }]
  assert.equal(matchPerson(people, { name: 'Someone', address: 'jo.evans@example.ac.uk' }), '1')
  assert.equal(matchPerson(people, { name: 'sam taylor' }), null)
  assert.equal(matchPerson(people, { name: 'ANA', address: 'ana@example.com' }), '4')
  assert.equal(matchPerson(people, null), null)
})

// A copy of the example with its own run and source ids, so each run of these tests is separate.
const tag = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
let runs = 0
function variant(edit = () => {}) {
  const batch = structuredClone(example)
  const id = (source) => `${source}-${tag}`
  batch.runId = `2026-10-28-0915-${tag.slice(0, 4)}${String(runs++).padStart(2, '0')}`
  batch.sources.forEach((source) => { source.id = id(source.id) })
  batch.messages.forEach((message) => { message.source = id(message.source) })
  batch.digest.bySource.forEach((line) => { line.source = id(line.source) })
  batch.actions.forEach((action) => { action.dedupeKey = action.dedupeKey.replace(/^(\w+):([^:]+):/, (_, kind, source) => `${kind}:${id(source)}:`) })
  edit(batch)
  return batch
}

test('mail import on lifeos_test: apply, repeat, update, fail, her fields, undo', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const config = postgresConfig(projectRoot)
  const pool = createPostgresPool(config, { database: 'lifeos_test', role: 'app' })
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'life-os-mail-'))
  t.after(async () => { await pool.end(); fs.rmSync(directory, { recursive: true, force: true }) })
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')

  let backups = 0
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository, backup: async () => { backups += 1; return null }, findPeople: () => [{ id: 'p-jo', name: 'Jo Evans', contact: 'jo.evans@example.ac.uk' }] })
  const inbox = createMailInbox({ directory, importer, settleMs: 0, log: () => {} })
  const drop = (name, batch) => fs.writeFileSync(path.join(directory, name), typeof batch === 'string' ? batch : JSON.stringify(batch))
  const action = async (key) => (await pool.query("SELECT * FROM mail.actions WHERE dedupe_key = $1 AND deleted_at IS NULL", [key.replace(/^(\w+):([^:]+):/, (_, kind, source) => `${kind}:${source}-${tag}:`)])).rows[0]
  const first = variant()

  await t.test('the example is applied: 7 messages, 4 open actions and 1 already done', async () => {
    drop('first.json', first)
    const [result] = (await inbox.scan()).results
    assert.equal(result.ok, true)
    assert.deepEqual(result.counts, { messages: { new: 7, updated: 0, unchanged: 0 }, actions: { new: 5, updated: 0, unchanged: 0 }, urgent: 1 })
    assert.equal(backups, 1)
    const rows = (await pool.query('SELECT status, done_by FROM mail.actions WHERE first_batch_id = $1', [result.batchId])).rows
    assert.equal(rows.filter((row) => row.status === 'open').length, 4)
    assert.deepEqual(rows.filter((row) => row.status === 'done').map((row) => row.done_by), ['source'])
    assert.equal((await action('reply:uni-outlook:group-report-thread')).person_id, 'p-jo')
    assert.equal(fs.readdirSync(path.join(directory, 'processed')).length, 1)
  })

  await t.test('the same run again changes nothing', async () => {
    drop('again.json', first)
    const [result] = (await inbox.scan()).results
    assert.equal(result.repeated, true)
    assert.equal(backups, 1)
    assert.equal(fs.readdirSync(path.join(directory, 'processed')).length, 2)
  })

  await t.test('a copy with one priority changed updates that one record', async () => {
    const before = await action('reply:gmail:18f2c3a0b9d7e600')
    drop('one-change.json', variant((batch) => { batch.messages[1].priority = 'normal' }))
    const [result] = (await inbox.scan()).results
    assert.deepEqual(result.counts, { messages: { new: 0, updated: 1, unchanged: 6 }, actions: { new: 0, updated: 0, unchanged: 5 }, urgent: 0 })
    assert.equal((await action('reply:gmail:18f2c3a0b9d7e600')).revision, before.revision)
  })

  await t.test('a broken copy lands in failed/ with a readable note; .part files are left alone', async () => {
    drop('broken.json', variant((batch) => { batch.messages[0].priority = 'very' }))
    drop('still-coming.json.part', '{')
    drop('not-json.json', '{ nope')
    const results = (await inbox.scan()).results
    assert.equal(results.length, 2)
    assert.ok(results.every((result) => result.ok === false))
    const notes = fs.readdirSync(path.join(directory, 'failed')).filter((name) => name.endsWith('.error.txt'))
    assert.equal(notes.length, 2)
    assert.match(fs.readFileSync(path.join(directory, 'failed', notes.find((name) => name.includes('broken'))), 'utf8'), /priority/)
    assert.ok(fs.existsSync(path.join(directory, 'still-coming.json.part')))
    assert.deepEqual((await inbox.status()).failed.length, 2)
  })

  await t.test('her fields survive an import; a source-resolved action closes; a reopened one stays open', async () => {
    const sam = await action('reply:gmail:18f2c3a0b9d7e600')
    await repository.patchHers('actions', sam.id, sam.revision, { her_priority: 'low', her_note: 'after the lab' })
    await assert.rejects(repository.patchHers('actions', sam.id, sam.revision, { her_note: 'stale' }), { status: 409 })
    await assert.rejects(repository.patchHers('actions', sam.id, sam.revision + 1, { title: 'not hers' }), { status: 400 })
    const library = await action('email:uni-outlook:library-thread')
    await repository.patchHers('actions', library.id, library.revision, { status: 'open' })
    assert.equal((await action('email:uni-outlook:library-thread')).reopened, true)
    const result = await importer.apply(variant((batch) => {
      batch.actions[1].priority = 'urgent'
      Object.assign(batch.actions[1], { resolvedAtSource: true, resolvedNote: 'You replied on 28 October.' })
    }), { fileName: 'resolved.json' })
    assert.deepEqual(result.counts.actions, { new: 0, updated: 1, unchanged: 4 })
    const after = await action('reply:gmail:18f2c3a0b9d7e600')
    assert.equal(after.priority, 'urgent')
    assert.equal(after.her_priority, 'low')
    assert.equal(after.her_note, 'after the lab')
    assert.equal(after.status, 'done')
    assert.equal(after.done_by, 'source')
    assert.equal((await action('email:uni-outlook:library-thread')).status, 'open')
  })

  await t.test('undo is refused after her change, and otherwise puts everything back', async () => {
    const latest = await repository.lastBatch()
    const sam = await action('reply:gmail:18f2c3a0b9d7e600')
    await repository.patchHers('actions', sam.id, sam.revision, { status: 'open' })
    await assert.rejects(importer.undo(latest.id), (error) => error.status === 409 && error.details.length === 1)
    const fresh = variant()
    const applied = await importer.apply(fresh, { fileName: 'fresh.json' })
    const jo = await action('reply:uni-outlook:group-report-thread')
    assert.ok(jo)
    await assert.rejects(importer.undo(latest.id), { status: 409 }) // no longer the latest
    assert.deepEqual(applied.counts.actions, { new: 0, updated: 1, unchanged: 4 })
    assert.deepEqual(await importer.undo(applied.batchId), { undone: true, records: 5 }) // its four sources and Sam's action
    assert.equal((await action('reply:gmail:18f2c3a0b9d7e600')).priority, 'urgent')
    // A batch that added records: new sources, messages and actions, all removed by undo.
    const other = `${tag.slice(0, 3)}new`
    const added = await importer.apply(variant((batch) => {
      batch.sources.forEach((source) => { source.id = source.id.replace(tag, other) })
      batch.messages.forEach((message) => { message.source = message.source.replace(tag, other) })
      batch.digest.bySource.forEach((line) => { line.source = line.source.replace(tag, other) })
      batch.actions.forEach((entry) => { entry.dedupeKey = entry.dedupeKey.replace(tag, other) })
    }), { fileName: 'added.json' })
    assert.equal(added.counts.messages.new, 7)
    assert.deepEqual(await importer.undo(added.batchId), { undone: true, records: 16 })
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM mail.messages WHERE first_batch_id = $1 AND deleted_at IS NULL", [added.batchId])).rows[0].n, 0)
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM mail.sources WHERE id LIKE $1 AND deleted_at IS NULL", [`%-${other}`])).rows[0].n, 0)
    assert.equal((await pool.query('SELECT status FROM mail.batches WHERE id = $1', [added.batchId])).rows[0].status, 'undone')
    await assert.rejects(importer.undo(added.batchId), { status: 409 })
  })
})
