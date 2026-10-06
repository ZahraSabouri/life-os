import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createStudyRepository } from './repository.js'
import { createStudyRouter } from './router.js'

// Explicit opt-in is required; ordinary fixture runs never load local config.
const enabled = process.env.LIFE_OS_STUDY_TEST_DB === 'lifeos_test'

test('Study PostgreSQL integration uses only isolated synthetic test records', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool, postgresBackup } = await import('../../postgres.js')
  const projectRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
  const config = postgresConfig(projectRoot)
  const pool = createPostgresPool(config, { database: 'lifeos_test', role: 'app' })
  const fixtures = []
  let server
  let backups = 0
  const repository = createStudyRepository({ pool, beforeImport: async () => {
    await postgresBackup(config, projectRoot, 'study-integration-before-import', 'lifeos_test')
    backups += 1
  } })

  t.after(async () => {
    try {
      // Reverse creation order removes children first. Reads target UUIDs only;
      // cleanup is a normal revisioned module write, never schema/data reset.
      for (const { entity, id } of [...fixtures].reverse()) {
        const row = (await pool.query(`SELECT revision FROM study.${entity} WHERE id = $1 AND deleted_at IS NULL`, [id])).rows[0]
        if (row) await repository.remove(entity, id, row.revision, { actor: 'integration-cleanup' })
      }
    } finally {
      if (server) {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
      }
      await pool.end()
    }
  })

  const identity = (await pool.query('SELECT current_database() AS database, current_user AS role')).rows[0]
  assert.equal(identity.database, 'lifeos_test', 'Refusing to use a non-test database')
  assert.equal(identity.role, config.app.user, 'Integration must use the restricted app role')
  const app = express()
  app.use(express.json({ limit: '3mb' }))
  app.use('/api/study', createStudyRouter({ repository }))
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'Integration fixture server error' }))
  server = createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/study`

  async function request(route, method = 'GET', body) {
    const response = await fetch(`${base}${route}`, {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    })
    return { status: response.status, body: await response.json() }
  }

  async function create(entity, body) {
    const response = await request(`/${entity}`, 'POST', body)
    assert.equal(response.status, 201)
    fixtures.push({ entity, id: response.body.id })
    return response.body
  }

  let semester, module, card
  await t.test('API writes commit and survive a fresh app-role connection', async () => {
    semester = await create('semesters', { title: 'Integration semester', start_date: '2026-10-01', end_date: '2027-01-31' })
    module = await create('modules', { title: 'Integration module', semester_id: semester.id, data: { code: 'FIXTURE', notes: 'Synthetic module note' } })
    card = await create('cards', { title: 'Integration card', module_id: module.id, status: 'planned', start_date: '2026-10-05', data: { checklist: [{ id: 'fixture-check', text: 'Synthetic step', done: false }], notes: 'Synthetic note', evidence: 'Synthetic evidence', loggedHours: 0.5 } })
    assert.equal(card.semester_id, semester.id)
    assert.equal(card.revision, 1)
    const secondPool = createPostgresPool(config, { database: 'lifeos_test', role: 'app' })
    try {
      assert.equal((await secondPool.query('SELECT current_database() AS database')).rows[0].database, 'lifeos_test')
      const saved = (await secondPool.query('SELECT data, revision, start_date::text AS start_date FROM study.cards WHERE id = $1', [card.id])).rows[0]
      assert.equal(saved.data.evidence, 'Synthetic evidence')
      assert.equal(saved.revision, 1)
      assert.equal(saved.start_date, '2026-10-05')
    } finally { await secondPool.end() }
    const workspace = await request('/workspace')
    assert.equal(workspace.status, 200)
    assert.equal(workspace.body.cards.find((item) => item.id === card.id).start_date, '2026-10-05')
  })

  await t.test('revisioned edits preserve data, stale saves fail and history commits', async () => {
    const updated = await request(`/cards/${card.id}`, 'PATCH', { revision: 1, title: 'Updated integration card', data: { ...card.data, checklist: [{ ...card.data.checklist[0], done: true }], loggedHours: 0.75 } })
    assert.equal(updated.status, 200)
    assert.equal(updated.body.revision, 2)
    const stale = await request(`/cards/${card.id}`, 'PATCH', { revision: 1, title: 'Must not replace saved title' })
    assert.equal(stale.status, 409)
    assert.equal(stale.body.details.current.title, 'Updated integration card')
    const saved = (await pool.query('SELECT title, data, revision FROM study.cards WHERE id = $1', [card.id])).rows[0]
    assert.equal(saved.title, 'Updated integration card')
    assert.equal(saved.data.notes, 'Synthetic note')
    assert.equal(saved.data.checklist[0].done, true)
    assert.equal(saved.revision, 2)
    const history = (await pool.query('SELECT action, before_data, after_data FROM study.history WHERE record_id = $1 ORDER BY created_at', [card.id])).rows
    assert.deepEqual(history.map((item) => item.action), ['create', 'update'])
    assert.equal(history[1].before_data.revision, 1)
    assert.equal(history[1].after_data.revision, 2)
    card = updated.body
  })

  await t.test('an earlier version can be put back and a removed record brought back, all through history', async () => {
    const draft = await create('cards', { title: 'Undo fixture original', module_id: module.id, data: { notes: 'Original note' } })
    const edited = await request(`/cards/${draft.id}`, 'PATCH', { revision: 1, title: 'Undo fixture edited', data: { notes: 'Edited note' } })
    assert.equal(edited.body.revision, 2)
    const listed = await request(`/cards/${draft.id}/history`)
    assert.equal(listed.status, 200)
    assert.deepEqual(listed.body.history.map((item) => item.action).sort(), ['create', 'update'])
    const original = listed.body.history.find((item) => item.action === 'create')
    assert.equal((await request(`/cards/${draft.id}/revert`, 'POST', { revision: 1, history_id: original.id })).status, 409, 'a stale revision cannot revert')
    const reverted = await request(`/cards/${draft.id}/revert`, 'POST', { revision: 2, history_id: original.id })
    assert.equal(reverted.status, 200)
    assert.equal(reverted.body.title, 'Undo fixture original')
    assert.equal(reverted.body.data.notes, 'Original note')
    assert.equal(reverted.body.revision, 3)
    assert.equal(reverted.body.module_id, module.id)
    assert.equal((await request(`/cards/${draft.id}/restore`, 'POST', { revision: 3 })).status, 409, 'a live record cannot be restored')
    const removed = await request(`/cards/${draft.id}`, 'DELETE', { revision: 3 })
    assert.equal(removed.status, 200)
    assert.ok(removed.body.deleted_at)
    assert.equal((await request('/workspace')).body.cards.some((item) => item.id === draft.id), false)
    assert.equal((await request('/deleted')).body.cards.some((item) => item.id === draft.id), true)
    assert.equal((await request(`/cards/${draft.id}/restore`, 'POST', { revision: 3 })).status, 409, 'a stale revision cannot restore')
    const restored = await request(`/cards/${draft.id}/restore`, 'POST', { revision: 4 })
    assert.equal(restored.status, 200)
    assert.equal(restored.body.deleted_at, null)
    assert.equal(restored.body.revision, 5)
    assert.equal(restored.body.data.notes, 'Original note')
    assert.equal((await request('/workspace')).body.cards.some((item) => item.id === draft.id), true)
    const actions = (await pool.query(`SELECT action FROM study.history WHERE record_id = $1 ORDER BY (after_data->>'revision')::int`, [draft.id])).rows.map((item) => item.action)
    assert.deepEqual(actions, ['create', 'update', 'update', 'delete', 'update'])
  })

  await t.test('parents and settings uniqueness protect live record relationships', async () => {
    const invalidParent = await request('/cards', 'POST', { title: 'Missing-parent fixture', module_id: randomUUID() })
    assert.equal(invalidParent.status, 400)
    const deletion = await request(`/modules/${module.id}`, 'DELETE', { revision: module.revision })
    assert.equal(deletion.status, 409)
    const key = `integration-settings-${randomUUID()}`
    await create('settings', { title: 'Fixture preference', data: { key, enabled: true } })
    const duplicate = await request('/settings', 'POST', { data: { key, enabled: false } })
    assert.equal(duplicate.status, 409)
  })

  await t.test('real imports back up, preserve parents and are idempotent', async () => {
    const source = `integration-import-${randomUUID()}`
    const importedId = randomUUID()
    const batch = { source, fingerprint: 'fixture-version-one', records: [{ entity: 'cards', source_id: 'original', record: { id: importedId, title: 'Imported fixture', module_id: module.id, status: 'planned', data: { notes: 'Original imported note', import_range: { from: '2026-10-01', to: '2026-10-31' }, csv: { row: 2, fields: { source_id: 'original' } } }, provenance: { fingerprint: 'fixture-version-one' } } }] }
    const preview = await repository.previewImport(batch)
    assert.equal(preview.added, 1)
    assert.equal(preview.conflicts.length, 0)
    const before = backups
    const result = await repository.importRecords(batch)
    fixtures.push({ entity: 'cards', id: importedId })
    assert.equal(result.inserted, 1)
    assert.equal(backups, before + 1)
    const repeated = await repository.importRecords(batch)
    assert.equal(repeated.inserted, 0)
    assert.equal(repeated.skipped, 1)
    assert.equal(backups, before + 1)
    const rows = (await pool.query('SELECT semester_id, provenance, revision FROM study.cards WHERE id = $1', [importedId])).rows
    assert.equal(rows.length, 1)
    assert.equal(rows[0].semester_id, semester.id)
    assert.equal(rows[0].provenance.source_id, 'original')
    assert.equal(rows[0].revision, 1)
    assert.equal(Number((await pool.query('SELECT count(*)::text AS count FROM study.history WHERE record_id = $1', [importedId])).rows[0].count), 1)
    const appendedId = randomUUID()
    const originalRecord = batch.records[0].record
    const refreshed = { source, fingerprint: 'fixture-version-two', records: [
      { ...batch.records[0], record: { ...originalRecord, data: { ...originalRecord.data, import_range: { from: '2026-10-01', to: '2026-11-30' }, csv: { ...originalRecord.data.csv, row: 3 } }, provenance: { fingerprint: 'fixture-version-two' } } },
      { entity: 'cards', source_id: 'appended', record: { id: appendedId, title: 'Appended fixture', module_id: module.id, data: { notes: 'New record' }, provenance: { fingerprint: 'fixture-version-two' } } },
    ] }
    const appended = await repository.importRecords(refreshed)
    fixtures.push({ entity: 'cards', id: appendedId })
    assert.equal(appended.skipped, 1)
    assert.equal(appended.inserted, 1)
    const original = (await pool.query('SELECT data, provenance, revision FROM study.cards WHERE id = $1', [importedId])).rows[0]
    assert.equal(original.provenance.fingerprint, 'fixture-version-one')
    assert.equal(original.data.import_range.to, '2026-10-31')
    assert.equal(original.data.csv.row, 2)
    assert.equal(original.revision, 1)
    await repository.patch('cards', importedId, { revision: 1, data: { notes: 'User fixture edit wins' } })
    await assert.rejects(repository.importRecords(refreshed), (error) => error.status === 409)
    assert.equal((await pool.query('SELECT data FROM study.cards WHERE id = $1', [importedId])).rows[0].data.notes, 'User fixture edit wins')
  })

  await t.test('a mid-batch database failure rolls records, history and batch back', async () => {
    const source = `integration-rollback-${randomUUID()}`
    const one = randomUUID(), two = randomUUID(), key = `integration-rollback-key-${randomUUID()}`
    const batch = { source, fingerprint: 'fixture-collision', records: [
      { entity: 'settings', source_id: 'one', record: { id: one, data: { key, value: 1 } } },
      { entity: 'settings', source_id: 'two', record: { id: two, data: { key, value: 2 } } },
    ] }
    assert.equal((await repository.previewImport(batch)).added, 2)
    await assert.rejects(repository.importRecords(batch), (error) => error.status === 409)
    assert.equal(Number((await pool.query('SELECT count(*)::text AS count FROM study.settings WHERE id = ANY($1::uuid[])', [[one, two]])).rows[0].count), 0)
    assert.equal(Number((await pool.query('SELECT count(*)::text AS count FROM study.history WHERE record_id = ANY($1::uuid[])', [[one, two]])).rows[0].count), 0)
    assert.equal(Number((await pool.query('SELECT count(*)::text AS count FROM study.import_batches WHERE source = $1', [source])).rows[0].count), 0)
  })

  await t.test('soft deletion hides active records and retains export/history for recovery', async () => {
    const deleted = await request(`/cards/${card.id}`, 'DELETE', { revision: card.revision })
    assert.equal(deleted.status, 200)
    assert.equal(deleted.body.revision, 3)
    assert.ok(deleted.body.deleted_at)
    assert.equal((await request('/workspace')).body.cards.some((item) => item.id === card.id), false)
    const exported = await request('/export')
    assert.equal(exported.status, 200)
    assert.equal(exported.body.meta.include_deleted, true)
    assert.equal(exported.body.meta.history_truncated, false)
    assert.ok(exported.body.cards.find((item) => item.id === card.id).deleted_at)
    const actions = (await pool.query('SELECT action FROM study.history WHERE record_id = $1 ORDER BY created_at', [card.id])).rows.map((item) => item.action)
    assert.deepEqual(actions, ['create', 'update', 'delete'])
  })

  await t.test('the app role cannot create schemas', async () => {
    const name = `integration_denied_${randomUUID().replaceAll('-', '')}`
    await assert.rejects(pool.query(`CREATE SCHEMA ${name}`), (error) => error.code === '42501')
  })
})
