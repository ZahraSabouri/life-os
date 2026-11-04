// The core's store. Since stage 7 it is PostgreSQL (schema core, migrations/core), not the
// single-user SQLite file it started in (data/life-os.db, kept untouched as it was). Its callers
// keep SQLite's shape: db.prepare(sql).all/get/run, now answering with a promise, with ? turned
// into PostgreSQL's $1, $2, …; db.transaction(work) runs several statements as one. db.init()
// writes the rooms from shared/rooms.js when the server starts.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOMS } from '../../shared/rooms.js'
import { postgresConfig, createPostgresPool } from './postgres.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
let pool = null
// LIFE_OS_CORE_DATABASE chooses the test database for the core's tests (lifeos_test).
const connection = () => (pool ??= createPostgresPool(postgresConfig(projectRoot), { database: process.env.LIFE_OS_CORE_DATABASE || undefined, searchPath: 'core' }))

// An entry's columns as the pages and services know them (owner_id and seq, the order entries
// were added, stay in the database; seq orders entries that tie).
export const ENTRY_COLUMNS = 'id, type, archetype, title, status, start_at, end_at, all_day, favorite, details, created_at, updated_at'
export const PERSON_COLUMNS = 'id, name, birthday, notes, relation, contact'

// ? outside quoted text becomes $1, $2, … in order.
export const toPostgres = (sql) => {
  let count = 0
  return sql.replace(/'(?:[^']|'')*'|\?/g, (match) => (match === '?' ? `$${++count}` : match))
}

function statement(sql, client) {
  const text = toPostgres(sql)
  const query = (params) => (client ?? connection()).query(text, params)
  return {
    all: async (...params) => (await query(params)).rows,
    get: async (...params) => (await query(params)).rows[0],
    run: async (...params) => ({ changes: (await query(params)).rowCount }),
  }
}

const db = {
  prepare: (sql) => statement(sql),
  // work(tx) gets tx.prepare(sql) on one connection inside BEGIN … COMMIT; anything thrown rolls back.
  async transaction(work) {
    const client = await connection().connect()
    try {
      await client.query('BEGIN')
      const result = await work({ prepare: (sql) => statement(sql, client) })
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      throw error
    } finally {
      client.release()
    }
  },
  async init() {
    const now = new Date().toISOString()
    await db.transaction(async (tx) => {
      const upsert = tx.prepare(`INSERT INTO spaces (id, slug, name, is_room, color, icon, filter, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (slug) DO UPDATE SET name = excluded.name, is_room = excluded.is_room, color = excluded.color, icon = excluded.icon,
          filter = excluded.filter, position = excluded.position, created_at = excluded.created_at`)
      for (const [position, room] of ROOMS.entries()) await upsert.run(`room:${room.slug}`, room.slug, room.name, 1, room.accent, room.icon, JSON.stringify(room.filter ?? {}), position, now)
    })
  },
  async close() { const open = pool; pool = null; if (open) await open.end() },
}

export default db
