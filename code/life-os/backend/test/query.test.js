// The query builder. The room filter is tried against the core's tables in the test database:
// LIFE_OS_CORE_DATABASE=lifeos_test node --test (an explicit opt-in, checked before any write).
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { describe, it, after } from 'node:test'
import db, { toPostgres } from '../src/db.js'
import { buildEntriesQuery } from '../src/query.js'
import { typesByRoom } from '../../shared/entryTypes.js'

const enabled = process.env.LIFE_OS_CORE_DATABASE === 'lifeos_test'

describe('entries query builder', () => {
  it('filters entries by room without widening the result set', { skip: !enabled && 'Set LIFE_OS_CORE_DATABASE=lifeos_test to run it' }, async () => {
    assert.equal((await db.prepare('SELECT current_database() AS name').get()).name, 'lifeos_test', 'Refusing to use a non-test database')
    const at = new Date('2099-12-31T12:00:00.000Z').toISOString()
    const make = async (type, title) => {
      const id = randomUUID()
      await db.prepare('INSERT INTO entries (id, type, archetype, title, status, start_at, end_at, all_day, details, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, type, type, title, null, at, null, 0, '{}', at, at)
      return id
    }
    const body = await make('workout', 'Body room temp workout')
    const other = await make('book', 'Culture temp book')
    try {
      const query = buildEntriesQuery({ rooms: ['body'] }, { from: '2099-12-31', end: '2099-12-31', limit: 20 })
      const rows = await db.prepare(query.sql).all(...query.params)
      assert.deepEqual(rows.map((row) => row.id), [body])
      assert.deepEqual(rows.map((row) => row.type), ['workout'])
      assert.ok(typesByRoom('body').includes('workout'))
      assert.ok(!typesByRoom('body').includes('book'))
    } finally {
      await db.prepare('DELETE FROM entries WHERE id IN (?, ?)').run(body, other)
    }
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

  it('numbers the question marks for PostgreSQL, leaving quoted text alone', () => {
    assert.equal(toPostgres("SELECT ? AS a, '?' AS b, 'it''s ?' AS c, ? AS d"), "SELECT $1 AS a, '?' AS b, 'it''s ?' AS c, $2 AS d")
    const query = buildEntriesQuery({ types: ['task'] }, { from: '2026-01-01', limit: 5 })
    assert.equal((toPostgres(query.sql).match(/\$\d+/g) ?? []).length, query.params.length)
  })
})

after(() => db.close())
