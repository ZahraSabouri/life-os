// Applies the numbered SQL files in src/migrations/<schema>/ that have not run yet.
// Usage: node code/life-os/backend/src/migrate.js <lifeos|lifeos_test> [--check]
// It takes a database dump first, runs each file in its own transaction as the
// owner role, records it, and stops at the first error. A file that has run is
// never edited: a changed file is refused.
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
    const applied = new Map((await pool.query('SELECT name, sha256 FROM study.schema_migrations')).rows.map((row) => [row.name, row.sha256]))
    const directory = path.join(here, 'migrations', 'study')
    const pending = []
    for (const name of fs.readdirSync(directory).filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort()) {
      const sql = fs.readFileSync(path.join(directory, name), 'utf8')
      const sha256 = createHash('sha256').update(sql).digest('hex')
      if (applied.has(name)) {
        if (applied.get(name) !== sha256) throw new Error(`${name} has already run and was edited since. Add a new migration instead.`)
        continue
      }
      pending.push({ name, sql, sha256 })
    }
    if (!pending.length || check) {
      log(pending.length ? `${database}: waiting to run: ${pending.map((item) => item.name).join(', ')}` : `${database}: nothing to run`)
      return pending.map((item) => item.name)
    }
    log(`${database}: dump written to ${await postgresBackup(config, projectRoot, 'before-migration', database)}`)
    for (const { name, sql, sha256 } of pending) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(sql.replaceAll('{{app_role}}', config.app.user))
        await client.query('INSERT INTO study.schema_migrations (name, sha256) VALUES ($1, $2)', [name, sha256])
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
