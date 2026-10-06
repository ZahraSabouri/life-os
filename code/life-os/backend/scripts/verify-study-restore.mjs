// Restore verification only: creates a fresh isolated target and preserves it.
// It never cleans, drops or restores over an existing database.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import pg from 'pg'
import { postgresConfig, postgresBackup } from '../src/postgres.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const config = postgresConfig(root)
const connection = database => new pg.Client({ host: config.host, port: config.port, database, ...config.owner, connectionTimeoutMillis: 3000 })
const identifier = value => `"${value.replaceAll('"', '""')}"`
async function snapshot(database) {
  const client = connection(database)
  await client.connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await client.query("SET LOCAL TIME ZONE 'UTC'")
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='study' ORDER BY tablename")
    const result = {}
    for (const { tablename } of tables.rows) {
      const rows = await client.query(`SELECT to_jsonb(t)::text AS content FROM study.${identifier(tablename)} t ORDER BY to_jsonb(t)::text`)
      result[tablename] = { count: rows.rowCount, sha256: createHash('sha256').update(JSON.stringify(rows.rows.map(row => row.content))).digest('hex') }
    }
    await client.query('COMMIT')
    return result
  } finally { await client.end() }
}

const before = await snapshot(config.database)
const dump = await postgresBackup(config, root, 'restore-verification')
const target = `lifeos_restore_${Date.now()}_${randomUUID().replaceAll('-', '').slice(0, 8)}`
if (!/^lifeos_restore_\d+_[a-f0-9]{8}$/.test(target)) throw new Error('Unsafe restore target')
const admin = new pg.Client({ host: config.host, port: config.port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 3000 })
await admin.connect()
try {
  await admin.query(`CREATE DATABASE ${identifier(target)} OWNER lifeos_owner TEMPLATE template0`)
  await admin.query(`REVOKE ALL ON DATABASE ${identifier(target)} FROM PUBLIC`)
  await admin.query(`GRANT CONNECT ON DATABASE ${identifier(target)} TO lifeos_owner`)
} finally { await admin.end() }
await new Promise((resolve, reject) => {
  const child = spawn(path.join(config.bin, process.platform === 'win32' ? 'pg_restore.exe' : 'pg_restore'),
    ['-h', config.host, '-p', String(config.port), '-U', config.owner.user, '-d', target, '--exit-on-error', dump],
    { windowsHide: true, env: { ...process.env, PGPASSWORD: config.owner.password }, stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += String(chunk).slice(0, 2000) })
  child.on('error', () => reject(new Error('Restore verification could not start')))
  child.on('close', code => code === 0 ? resolve() : reject(new Error(`Restore verification failed (${code}): ${stderr}`)))
})
const restored = await snapshot(target)
const after = await snapshot(config.database)
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Study changed during restore verification; target preserved, rerun against a stable source')
if (JSON.stringify(before) !== JSON.stringify(restored)) throw new Error('Restored Study content differs; both databases and dump are preserved for review')
console.log(JSON.stringify({ database: config.database, restoreTarget: target, dump, tables: Object.fromEntries(Object.entries(restored).map(([name, value]) => [name, value.count])), fullContentHashesMatch: true, sourceUnchanged: true, targetPreserved: true }))
