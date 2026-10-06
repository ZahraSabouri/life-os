import test from 'node:test'
import assert from 'node:assert/strict'
import { createStudyRepository } from './repository.js'
import { StudyError } from './schema.js'

const id = '11111111-1111-4111-8111-111111111111'
const row = { id, title: 'Saved', status: 'planned', semester_id: null, module_id: null, card_id: null, start_date: '2026-10-05', end_date: null, start_at: null, end_at: null, data: { notes: 'Keep me' }, provenance: {}, revision: 3, created_at: new Date('2026-10-01T12:00:00Z'), updated_at: new Date('2026-10-05T12:00:00Z'), deleted_at: null }

function fixture(respond) {
  const calls = []
  let released = false
  const client = { async query(sql, params = []) { calls.push({ sql, params }); return respond(sql, params, calls) ?? { rows: [] } }, release() { released = true } }
  const pool = { query: client.query, async connect() { return client } }
  return { pool, calls, released: () => released }
}

test('a stale edit rolls back without an update or history write', async () => {
  const f = fixture((sql) => sql.startsWith('SELECT id, title') ? { rows: [row] } : undefined)
  const repository = createStudyRepository({ pool: f.pool })
  await assert.rejects(repository.patch('cards', id, { revision: 2, title: 'Overwrite' }), (error) => error instanceof StudyError && error.status === 409 && error.details.current.data.notes === 'Keep me')
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('UPDATE') || sql.startsWith('INSERT')), false)
  assert.equal(f.calls.at(-1).sql, 'ROLLBACK')
  assert.equal(f.released(), true)
})

test('a history failure rolls the record write back rather than claiming it saved', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('INSERT INTO study.cards')) return { rows: [{ ...row, revision: 1 }] }
    if (sql.startsWith('INSERT INTO study.history')) throw Object.assign(new Error('disk failure'), { code: '53100' })
  })
  const repository = createStudyRepository({ pool: f.pool })
  await assert.rejects(repository.create('cards', { title: 'Fixture only' }), /disk failure/)
  assert.equal(f.calls.some(({ sql }) => sql === 'COMMIT'), false)
  assert.equal(f.calls.at(-1).sql, 'ROLLBACK')
})

test('a changed settings key maps uniqueness failure to conflict', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title')) return { rows: [{ ...row, data: { key: 'preferences' } }] }
    if (sql.startsWith('UPDATE study.settings')) throw Object.assign(new Error('unique'), { code: '23505' })
  })
  const repository = createStudyRepository({ pool: f.pool })
  await assert.rejects(repository.patch('settings', id, { revision: 3, data: { key: 'timer' } }), (error) => error.status === 409)
  assert.equal(f.calls.at(-1).sql, 'ROLLBACK')
})

test('a parent with live linked records cannot be soft-deleted', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title')) return { rows: [row] }
    if (sql.startsWith('SELECT 1 FROM study.modules')) return { rows: [{ '?column?': 1 }] }
  })
  const repository = createStudyRepository({ pool: f.pool })
  await assert.rejects(repository.remove('semesters', id, 3), (error) => error.status === 409)
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('UPDATE')), false)
})

test('successful writes include history in the same transaction and return civil dates', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title')) return { rows: [row] }
    if (sql.startsWith('UPDATE study.cards')) return { rows: [{ ...row, title: 'Changed', revision: 4 }] }
  })
  const result = await createStudyRepository({ pool: f.pool }).patch('cards', id, { revision: 3, title: 'Changed' })
  assert.equal(result.revision, 4)
  assert.equal(result.start_date, '2026-10-05')
  assert.equal(result.updated_at, '2026-10-05T12:00:00.000Z')
  const history = f.calls.find(({ sql }) => sql.startsWith('INSERT INTO study.history'))
  assert.equal(JSON.parse(history.params[4]).title, 'Saved')
  assert.equal(JSON.parse(history.params[5]).title, 'Changed')
  assert.equal(f.calls.at(-1).sql, 'COMMIT')
})

test('import preview detects changed records without requesting a backup or writing', async () => {
  const existing = { ...row, provenance: { source: 'fixture', source_id: 'original' } }
  const f = fixture((sql) => sql.includes('FROM study.cards WHERE provenance') ? { rows: [existing] } : undefined)
  let backups = 0
  const repository = createStudyRepository({ pool: f.pool, beforeImport: async () => { backups += 1 } })
  const batch = { source: 'fixture', fingerprint: 'one', records: [{ entity: 'cards', source_id: 'original', record: { id, title: 'Different', status: 'planned', start_date: '2026-10-05', data: { notes: 'Keep me' } } }] }
  const preview = await repository.previewImport(batch)
  assert.equal(preview.added, 0)
  assert.equal(preview.conflicts.length, 1)
  await assert.rejects(repository.importRecords(batch), (error) => error.status === 409)
  assert.equal(backups, 0)
  assert.equal(f.calls.some(({ sql }) => /^(INSERT|UPDATE|DELETE|BEGIN)/.test(sql)), false)
})

test('repeat exact imports are idempotent, including JSON key-order changes', async () => {
  const existing = { ...row, provenance: { source: 'fixture', source_id: 'original' } }
  const f = fixture((sql) => sql.includes('FROM study.cards WHERE provenance') ? { rows: [existing] } : undefined)
  const repository = createStudyRepository({ pool: f.pool, beforeImport: async () => { throw new Error('Unneeded backup') } })
  const result = await repository.importRecords({ source: 'fixture', fingerprint: 'two', records: [{ entity: 'cards', source_id: 'original', record: { id, data: { notes: 'Keep me' }, start_date: '2026-10-05', status: 'planned', title: 'Saved' } }] })
  assert.equal(result.inserted, 0)
  assert.equal(result.skipped, 1)
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('INSERT')), false)
})

test('backup failure prevents the import transaction entirely', async () => {
  const f = fixture(() => undefined)
  const repository = createStudyRepository({ pool: f.pool, beforeImport: async () => { throw new Error('Backup failed') } })
  await assert.rejects(repository.importRecords({ source: 'fixture', fingerprint: 'new', records: [{ entity: 'cards', source_id: 'new', record: { id, title: 'New' } }] }), /Backup failed/)
  assert.equal(f.calls.some(({ sql }) => /^(BEGIN|INSERT|UPDATE|DELETE)/.test(sql)), false)
})

test('new import backs up first and commits records, history and batch together', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('INSERT INTO study.cards')) return { rows: [{ ...row, title: 'New', revision: 1, provenance: { source: 'fixture', source_id: 'new' } }] }
  })
  let backedUp = false
  const repository = createStudyRepository({ pool: f.pool, beforeImport: async ({ preview }) => {
    assert.equal(preview.added, 1)
    assert.equal(f.calls.some(({ sql }) => sql === 'BEGIN'), false)
    backedUp = true
  } })
  const result = await repository.importRecords({ source: 'fixture', fingerprint: 'new', records: [{ entity: 'cards', source_id: 'new', record: { id, title: 'New' } }] })
  assert.equal(backedUp, true)
  assert.equal(result.inserted, 1)
  assert.ok(f.calls.find(({ sql }) => sql.startsWith('SELECT pg_advisory_xact_lock')))
  assert.ok(f.calls.find(({ sql }) => sql.startsWith('INSERT INTO study.history')))
  assert.ok(f.calls.find(({ sql }) => sql.startsWith('INSERT INTO study.import_batches')))
  assert.equal(f.calls.at(-1).sql, 'COMMIT')
})

test('a conflict appearing after backup aborts the whole import transaction', async () => {
  let backedUp = false
  const f = fixture((sql) => {
    if (backedUp && sql.includes('FROM study.cards WHERE provenance')) return { rows: [{ ...row, provenance: { source: 'fixture', source_id: 'new' } }] }
  })
  const repository = createStudyRepository({ pool: f.pool, beforeImport: async () => { backedUp = true } })
  await assert.rejects(repository.importRecords({ source: 'fixture', fingerprint: 'race', records: [{ entity: 'cards', source_id: 'new', record: { id, title: 'New' } }] }), (error) => error.status === 409)
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('INSERT')), false)
  assert.equal(f.calls.at(-1).sql, 'ROLLBACK')
})

test('changing parent context cannot silently detach the context of live children', async () => {
  const newSemester = '22222222-2222-4222-8222-222222222222'
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title')) return { rows: [row] }
    if (sql.startsWith('SELECT id, semester_id')) return { rows: [{ id: newSemester, semester_id: null, module_id: null }] }
    if (sql.startsWith('SELECT 1 FROM study.cards')) return { rows: [{ '?column?': 1 }] }
  })
  await assert.rejects(createStudyRepository({ pool: f.pool }).patch('modules', id, { revision: 3, semester_id: newSemester }), (error) => error.status === 409)
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('UPDATE')), false)
})

test('refresh imports skip unchanged records despite new file bookkeeping and append new rows', async () => {
  const newId = '22222222-2222-4222-8222-222222222222'
  const oldData = { notes: 'Keep me', import_range: { from: '2026-10-01', to: '2026-10-31' }, csv: { row: 2, fields: { source_id: 'original', title: 'Saved' } } }
  const existing = { ...row, data: oldData, provenance: { source: 'fixture', source_id: 'original', fingerprint: 'old-file' } }
  const f = fixture((sql) => {
    if (sql.includes('FROM study.cards WHERE provenance')) return { rows: [existing] }
    if (sql.startsWith('INSERT INTO study.cards')) return { rows: [{ ...row, id: newId, title: 'New' }] }
  })
  const repository = createStudyRepository({ pool: f.pool })
  const record = { id, title: 'Saved', status: 'planned', start_date: '2026-10-05', data: { ...oldData, import_range: { from: '2026-10-01', to: '2026-11-30' }, csv: { ...oldData.csv, row: 3 } }, provenance: { fingerprint: 'new-file' } }
  const batch = { source: 'fixture', fingerprint: 'new-file', records: [
    { entity: 'cards', source_id: 'original', record },
    { entity: 'cards', source_id: 'new', record: { id: newId, title: 'New', provenance: { fingerprint: 'new-file' } } },
  ] }
  const result = await repository.importRecords(batch)
  assert.equal(result.skipped, 1)
  assert.equal(result.inserted, 1)
  assert.equal(f.calls.filter(({ sql }) => sql.startsWith('INSERT INTO study.cards')).length, 1)
  assert.equal(f.calls.some(({ sql }) => sql.startsWith('UPDATE')), false)
  assert.equal(existing.provenance.fingerprint, 'old-file')
  assert.equal(existing.data.csv.row, 2)
  assert.equal(existing.data.import_range.to, '2026-10-31')
  const conflict = await repository.previewImport({ ...batch, fingerprint: 'edited-file', records: [{ entity: 'cards', source_id: 'original', record: { ...record, data: { ...record.data, notes: 'Source edit would replace work' } } }] })
  assert.equal(conflict.conflicts.length, 1)
})

const removed = { ...row, deleted_at: '2026-10-06T10:00:00.000Z', revision: 4 }

test('a removed record is restored with its content, a new revision and a history entry', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title')) return { rows: [removed] }
    if (sql.startsWith('UPDATE study.cards SET deleted_at = NULL')) return { rows: [{ ...removed, deleted_at: null, revision: 5 }] }
  })
  const repository = createStudyRepository({ pool: f.pool })
  const restored = await repository.restore('cards', id, 4)
  assert.equal(restored.deleted_at, null)
  assert.equal(restored.data.notes, 'Keep me')
  const historyCall = f.calls.find(({ sql }) => sql.startsWith('INSERT INTO study.history'))
  assert.equal(JSON.parse(historyCall.params[4]).deleted_at, removed.deleted_at)
  assert.equal(JSON.parse(historyCall.params[5]).deleted_at, null)
  assert.equal(f.calls.at(-1).sql, 'COMMIT')
})

test('restore refuses a live record, a stale revision and a record whose parent is still removed', async () => {
  const live = createStudyRepository({ pool: fixture((sql) => sql.startsWith('SELECT id, title') ? { rows: [row] } : undefined).pool })
  await assert.rejects(live.restore('cards', id, 3), (error) => error.status === 409 && /not removed/.test(error.message))
  const stale = fixture((sql) => sql.startsWith('SELECT id, title') ? { rows: [removed] } : undefined)
  await assert.rejects(createStudyRepository({ pool: stale.pool }).restore('cards', id, 3), (error) => error.status === 409)
  assert.equal(stale.calls.some(({ sql }) => sql.startsWith('UPDATE')), false)
  const orphan = fixture((sql) => sql.startsWith('SELECT id, title') ? { rows: [{ ...removed, module_id: '22222222-2222-4222-8222-222222222222' }] } : undefined)
  await assert.rejects(createStudyRepository({ pool: orphan.pool }).restore('cards', id, 4), (error) => error.status === 400 && /module_id/.test(error.message))
  assert.equal(orphan.calls.some(({ sql }) => sql.startsWith('UPDATE')), false)
  assert.equal(orphan.calls.at(-1).sql, 'ROLLBACK')
})

test('revert writes an earlier saved version back as a normal revision-checked edit', async () => {
  const historyId = '33333333-3333-4333-8333-333333333333'
  const f = fixture((sql, params) => {
    if (sql.startsWith('SELECT after_data')) return { rows: params[0] === historyId ? [{ after_data: { ...row, title: 'Earlier title', data: { notes: 'Earlier notes' }, revision: 1 }, before_data: null }] : [] }
    if (sql.startsWith('SELECT id, title')) return { rows: [row] }
    if (sql.startsWith('UPDATE study.cards')) return { rows: [{ ...row, title: params[0], revision: 4 }] }
  })
  const repository = createStudyRepository({ pool: f.pool })
  const reverted = await repository.revert('cards', id, { revision: 3, history_id: historyId })
  assert.equal(reverted.title, 'Earlier title')
  const update = f.calls.find(({ sql }) => sql.startsWith('UPDATE study.cards'))
  assert.ok(update.params.includes(JSON.stringify({ notes: 'Earlier notes' })))
  assert.equal(update.params.at(-1), 3, 'the caller\'s current revision guards the write, not the old one')
  assert.ok(f.calls.some(({ sql }) => sql.startsWith('INSERT INTO study.history')))
  await assert.rejects(repository.revert('cards', id, { revision: 3, history_id: '44444444-4444-4444-8444-444444444444' }), (error) => error.status === 404)
  await assert.rejects(repository.revert('cards', id, { revision: 3, history_id: historyId, title: 'Sneaky' }), (error) => error.status === 400)
})

test('record history and the removed list read without writing', async () => {
  const f = fixture((sql) => {
    if (sql.startsWith('SELECT id, title') && sql.includes('deleted_at IS NOT NULL')) return { rows: sql.includes('study.cards') ? [removed] : [] }
    if (sql.startsWith('SELECT id, title')) return { rows: [row] }
    if (sql.startsWith('SELECT id, entity')) return { rows: [{ id: 'h1', action: 'update', created_at: new Date('2026-10-06T09:00:00Z') }] }
  })
  const repository = createStudyRepository({ pool: f.pool })
  const result = await repository.recordHistory('cards', id)
  assert.equal(result.record.id, id)
  assert.equal(result.history[0].created_at, '2026-10-06T09:00:00.000Z')
  const list = await repository.deleted()
  assert.equal(list.cards.length, 1)
  assert.equal(list.modules.length, 0)
  assert.equal(f.calls.some(({ sql }) => /^(INSERT|UPDATE|DELETE)/.test(sql)), false)
})
