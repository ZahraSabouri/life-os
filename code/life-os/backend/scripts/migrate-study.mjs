import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { postgresConfig, createPostgresPool, postgresBackup } from '../src/postgres.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const config = postgresConfig(root)
const database = process.argv.includes('--test') ? config.testDatabase : config.database
const pool = createPostgresPool(config, { role: 'owner', database })
try {
  const backup = await postgresBackup(config, root, 'before-schema', database)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT pg_advisory_xact_lock(hashtext('lifeos-study-migrations'))")
    await client.query('CREATE SCHEMA IF NOT EXISTS study AUTHORIZATION lifeos_owner')
    await client.query('CREATE TABLE IF NOT EXISTS study.schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())')
    const directory = path.join(root, 'code/life-os/backend/src/migrations/study')
    const names = (await fs.readdir(directory)).filter(name => /^\d{4}_[a-z0-9_]+\.sql$/.test(name)).sort()
    for (const name of names) {
      const sql = await fs.readFile(path.join(directory, name), 'utf8')
      const hash = createHash('sha256').update(sql).digest('hex')
      const applied = await client.query('SELECT sha256 FROM study.schema_migrations WHERE name=$1', [name])
      if (applied.rowCount && applied.rows[0].sha256 !== hash) throw new Error(`Applied migration ${name} changed; add a new migration instead`)
      if (applied.rowCount) continue
      await client.query(sql)
      await client.query('INSERT INTO study.schema_migrations(name,sha256) VALUES($1,$2)', [name, hash])
    }
    await client.query('GRANT USAGE ON SCHEMA study TO lifeos_app')
    await client.query('GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA study TO lifeos_app')
    await client.query('REVOKE INSERT,UPDATE ON study.schema_migrations FROM lifeos_app')
    await client.query('REVOKE UPDATE ON study.history FROM lifeos_app')
    await client.query('REVOKE UPDATE ON study.import_batches FROM lifeos_app')
    await client.query('GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA study TO lifeos_app')
    await client.query('COMMIT')
    console.log(JSON.stringify({ database, migrations: names, backup }))
  } catch (error) { await client.query('ROLLBACK'); throw error }
  finally { client.release() }
} finally { await pool.end() }
