// Applies the numbered SQL files in src/migrations/<schema>/ that have not run yet,
// Study first, then every other schema folder, each recorded in its own
// <schema>.schema_migrations. Usage: node code/life-os/backend/src/migrate.js <lifeos|lifeos_test> [--check]
// It takes one database dump first, runs each file in its own transaction as the
// owner role, records it, and stops at the first error. A file that has run is
// never edited: a changed file is refused. A new schema gets its migrations table
// in the same transaction as its first file.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool, postgresBackup } from './postgres.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../../../..')

export async function migrate({ database, check = false, log = console.log } = {}) {
  const config = postgresConfig(projectRoot)
  if (!['lifeos', 'lifeos_test'].includes(database)) throw new Error('Name the database: lifeos or lifeos_test')
  if (!/^[a-z_][a-z0-9_]*$/.test(config.app.user)) throw new Error('The app role name is not a plain identifier')
  const pool = createPostgresPool(config, { database, role: 'owner' })
  try {
    const root = path.join(here, 'migrations')
    const schemas = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^[a-z_][a-z0-9_]*$/.test(entry.name)).map((entry) => entry.name)
      .sort((a, b) => (a === 'study' ? -1 : b === 'study' ? 1 : a.localeCompare(b)))
    const pending = []
    for (const schema of schemas) {
      const known = (await pool.query('SELECT to_regclass($1) AS name', [`${schema}.schema_migrations`])).rows[0].name
      const applied = new Map(known ? (await pool.query(`SELECT name, sha256 FROM ${schema}.schema_migrations`)).rows.map((row) => [row.name, row.sha256]) : [])
      const directory = path.join(root, schema)
      let first = !known
      for (const file of fs.readdirSync(directory).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort()) {
        const sql = fs.readFileSync(path.join(directory, file), 'utf8')
        const sha256 = createHash('sha256').update(sql).digest('hex')
        const name = schema === 'study' ? file : `${schema}/${file}`
        if (applied.has(file)) {
          if (applied.get(file) !== sha256) throw new Error(`${name} has already run and was edited since. Add a new migration instead.`)
          continue
        }
        pending.push({ schema, file, name, sql, sha256, bootstrap: first })
        first = false
      }
    }
    if (!pending.length || check) {
      log(pending.length ? `${database}: waiting to run: ${pending.map((item) => item.name).join(', ')}` : `${database}: nothing to run`)
      return pending.map((item) => item.name)
    }
    log(`${database}: dump written to ${await postgresBackup(config, projectRoot, 'before-migration', database)}`)
    for (const { schema, file, name, sql, sha256, bootstrap } of pending) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        if (bootstrap) {
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
          await client.query(`CREATE TABLE IF NOT EXISTS ${schema}.schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`)
        }
        await client.query(sql.replaceAll('{{app_role}}', config.app.user))
        await client.query(`INSERT INTO ${schema}.schema_migrations (name, sha256) VALUES ($1, $2)`, [file, sha256])
        await client.query('COMMIT')
        log(`${database}: applied ${name}`)
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        throw new Error(`${name} failed and was rolled back: ${error.message}`)
      } finally {
        client.release()
      }
    }
    return pending.map((item) => item.name)
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate({ database: process.argv[2], check: process.argv.includes('--check') }).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
