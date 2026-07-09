import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { describe, it, beforeEach, afterEach } from 'node:test'
import db from '../src/db.js'
import { buildEntriesQuery } from '../src/query.js'
import { typesByRoom } from '../../shared/entryTypes.js'

const insertEntry = db.prepare(`
  INSERT INTO entries (
    id, type, archetype, title, status, start_at, end_at, all_day, details, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const deleteEntry = db.prepare('DELETE FROM entries WHERE id = ?')

function makeEntry(type, title) {
  const id = randomUUID()
  const now = new Date('2099-12-31T12:00:00.000Z').toISOString()

  insertEntry.run(
    id,
    type,
    type,
    title,
    null,
    now,
    null,
    0,
    '{}',
    now,
    now
  )

  return id
}

describe('entries query builder', () => {
  let bodyEntryId
  let nonBodyEntryId

  beforeEach(() => {
    bodyEntryId = makeEntry('workout', 'Body room temp workout')
    nonBodyEntryId = makeEntry('book', 'Culture temp book')
  })

  afterEach(() => {
    deleteEntry.run(bodyEntryId)
    deleteEntry.run(nonBodyEntryId)
  })

  it('filters entries by room without widening the result set', () => {
    const query = buildEntriesQuery({ rooms: ['body'] }, { from: '2099-12-31', end: '2099-12-31', limit: 20 })
    const rows = db.prepare(query.sql).all(...query.params)

    assert.deepEqual(rows.map((row) => row.type), ['workout'])
    assert.deepEqual(rows.map((row) => row.id), [bodyEntryId])
    assert.ok(typesByRoom('body').includes('workout'))
    assert.ok(!typesByRoom('body').includes('book'))
  })

  it('binds user input instead of interpolating it into SQL', () => {
    const malicious = "x'); DROP TABLE entries; --"
    const query = buildEntriesQuery({ tags: [malicious] }, { limit: 5 })

    assert.match(query.sql, /\?/)
    assert.ok(query.params.includes(malicious))
    assert.doesNotMatch(query.sql, /DROP TABLE/i)
  })

  it('rejects unsupported filter keys', () => {
    assert.throws(() => buildEntriesQuery({ title: ['oops'] }), /unsupported filter key/)
  })
})
