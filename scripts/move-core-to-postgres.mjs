// Stage 7, CP3: copies the core (entries, people, places, tags, pictures' rows, links, rooms,
// settings) from its SQLite file into PostgreSQL's schema core, made by migrations/core/0001.
//
//   node scripts/move-core-to-postgres.mjs lifeos_test     a trial, on the test database
//   node scripts/move-core-to-postgres.mjs lifeos          the real move (Life OS stopped first)
//   add --check to read both sides and say what would happen, writing nothing
//
// The SQLite file is only read, through SQLite (so what is still in its write-ahead log comes
// along), and is left as it is. Both sides are backed up first. The copy refuses a target that
// already has rows, runs in one transaction, and is then compared with the source table by
// table and row by row. Any difference is reported and the copy is emptied again, so the
// server never starts on half a move.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync, backup } from 'node:sqlite'
import { postgresConfig, createPostgresPool, postgresBackup } from '../code/life-os/backend/src/postgres.js'
import { backupRoot, lifeOsOrigin } from '../code/life-os/backend/src/paths.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = process.env.LIFE_OS_CORE_SQLITE || path.join(projectRoot, 'code/life-os/backend/data/life-os.db')
// Parents before the rows that point at them.
const TABLES = ['entries', 'tags', 'people', 'places', 'spaces', 'settings', 'entry_tags', 'entry_people', 'entry_places', 'files', 'entry_links', 'person_identities']

const database = process.argv[2]
const check = process.argv.includes('--check')
if (!['lifeos', 'lifeos_test'].includes(database)) {
  console.error('Name the database: lifeos_test (the trial) or lifeos.')
  process.exit(1)
}
if (!fs.existsSync(SOURCE)) {
  console.error('The core SQLite file is not there; nothing to move.')
  process.exit(1)
}

// The real move only while Life OS is stopped, so nothing is saved to SQLite after it is read.
if (database === 'lifeos' && !check) {
  const running = await fetch(`${lifeOsOrigin()}/__life-os/health`, { signal: AbortSignal.timeout(1500) }).then(() => true, () => false)
  if (running) {
    console.error('Life OS is running. Stop it first, so nothing is saved to the old file during the move.')
    process.exit(1)
  }
}

// A value as PostgreSQL's column will hold it, for comparing the two sides.
const asColumn = (value, type) => {
  if (value === null || value === undefined) return null
  if (type === 'text') return String(value)
  if (type === 'integer' || type === 'bigint') return Number(value)
  if (type === 'double precision') return Number(value)
  return value
}
const rowKey = (row, columns) => JSON.stringify(columns.map(([name, type]) => asColumn(row[name], type)))

const source = new DatabaseSync(SOURCE, { readOnly: true })
const config = postgresConfig(projectRoot)
// As the owner role, like a migration (setting where new rows are numbered from needs it).
const pool = createPostgresPool(config, { database, role: 'owner', searchPath: 'core' })
try {
  if ((await pool.query('SELECT current_database() AS name')).rows[0].name !== database) throw new Error('Connected to a different database than named')
  if (!(await pool.query("SELECT to_regclass('core.schema_migrations') AS name")).rows[0].name) throw new Error(`The core's tables are not in ${database} yet. Run: node code/life-os/backend/src/migrate.js ${database}`)

  // Both sides' columns. A source column with no place in the target stops the move.
  const plan = []
  const sqliteTables = source.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((row) => row.name)
  const unknown = sqliteTables.filter((name) => !TABLES.includes(name))
  if (unknown.length) throw new Error(`The SQLite file has tables this move does not know: ${unknown.join(', ')}`)
  for (const table of TABLES) {
    const target = (await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'core' AND table_name = $1 ORDER BY ordinal_position", [table])).rows
    if (!target.length) throw new Error(`core.${table} is missing`)
    const present = sqliteTables.includes(table) ? source.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name) : []
    const missing = present.filter((name) => !target.some((column) => column.column_name === name))
    if (missing.length) throw new Error(`${table}: these columns have no place in PostgreSQL: ${missing.join(', ')}`)
    // seq, the order rows were added, is SQLite's own row number.
    const withSeq = target.some((column) => column.column_name === 'seq') && !present.includes('seq')
    const columns = [...present, ...(withSeq ? ['seq'] : [])].map((name) => [name, target.find((column) => column.column_name === name).data_type])
    const rows = present.length ? source.prepare(`SELECT ${present.join(', ')}${withSeq ? ', rowid AS seq' : ''} FROM ${table}${withSeq ? ' ORDER BY rowid' : ''}`).all() : []
    // A row PostgreSQL would refuse (an empty value where one is required) is named before anything is written.
    for (const column of target.filter((column) => column.is_nullable === 'NO' && present.includes(column.column_name))) {
      const empty = rows.filter((row) => row[column.column_name] === null || row[column.column_name] === undefined).length
      if (empty) throw new Error(`${table}.${column.column_name}: ${empty} rows have no value, which PostgreSQL requires`)
    }
    // Values whose kind changes on the way (a number kept in a text column) are counted, not hidden.
    const retyped = rows.reduce((sum, row) => sum + columns.filter(([name, type]) => row[name] !== null && type === 'text' && typeof row[name] !== 'string').length, 0)
    const already = Number((await pool.query(`SELECT count(*) AS n FROM core.${table}`)).rows[0].n)
    plan.push({ table, columns, rows, retyped, already })
  }

  console.log(`${check ? 'Check' : 'Move'}: core SQLite → ${database}.core`)
  for (const { table, rows, retyped, already } of plan) console.log(`  ${table.padEnd(18)} ${String(rows.length).padStart(5)} rows${retyped ? `, ${retyped} values become text` : ''}${already ? `, target already has ${already}` : ''}`)
  const occupied = plan.filter((step) => step.already)
  if (occupied.length) throw new Error(`The target already has rows (${occupied.map((step) => step.table).join(', ')}). Nothing was written.`)
  if (check) { console.log('Nothing written (--check).'); process.exit(0) }

  // Backups of both sides, before any write.
  const folder = path.join(backupRoot(projectRoot), `core-${new Date().toISOString().slice(0, 10)}`)
  fs.mkdirSync(folder, { recursive: true })
  const copy = path.join(folder, `life-os-before-move-${Date.now()}.sqlite`)
  await backup(source, copy)
  const copied = new DatabaseSync(copy, { readOnly: true })
  try { if (copied.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('The SQLite backup did not pass its check') } finally { copied.close() }
  console.log(`  SQLite backup: ${copy}`)
  console.log(`  PostgreSQL dump: ${await postgresBackup(config, projectRoot, 'before-core-move', database, 'core')}`)

  // The copy, in one transaction.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const { table, columns, rows } of plan) {
      if (!rows.length) continue
      const names = columns.map(([name]) => name)
      for (let start = 0; start < rows.length; start += 200) {
        const slice = rows.slice(start, start + 200)
        const values = slice.map((_, row) => `(${names.map((__, column) => `$${row * names.length + column + 1}`).join(', ')})`).join(', ')
        await client.query(`INSERT INTO core.${table} (${names.join(', ')}) VALUES ${values}`, slice.flatMap((row) => columns.map(([name, type]) => asColumn(row[name], type))))
      }
      // New rows are numbered after the ones brought over.
      if (names.includes('seq')) await client.query(`SELECT setval(pg_get_serial_sequence('core.${table}', 'seq'), (SELECT coalesce(max(seq), 0) + 1 FROM core.${table}), false)`)
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw new Error(`The copy failed and was rolled back: ${error.message}`)
  } finally {
    client.release()
  }

  // The comparison: every table's count, and every row value by value.
  const differences = []
  for (const { table, columns, rows } of plan) {
    const names = columns.map(([name]) => name)
    const back = names.length ? (await pool.query(`SELECT ${names.join(', ')} FROM core.${table}`)).rows : (await pool.query(`SELECT 1 FROM core.${table}`)).rows
    if (back.length !== rows.length) { differences.push(`${table}: ${rows.length} rows in SQLite, ${back.length} in PostgreSQL`); continue }
    const want = rows.map((row) => rowKey(row, columns)).sort()
    const got = back.map((row) => rowKey(row, columns)).sort()
    const unequal = want.filter((key, index) => key !== got[index]).length
    if (unequal) differences.push(`${table}: ${unequal} rows differ`)
  }
  if (differences.length) {
    // Emptied again, children first, so nothing starts on half a move.
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const table of [...TABLES].reverse()) await client.query(`DELETE FROM core.${table}`)
      await client.query('COMMIT')
    } finally { client.release() }
    throw new Error(`The copy does not match, so it was emptied again:\n- ${differences.join('\n- ')}`)
  }
  console.log(`  Compared: ${plan.reduce((sum, step) => sum + step.rows.length, 0)} rows in ${plan.length} tables match, value by value.`)
  console.log('  The SQLite file was only read and is unchanged.')
} catch (error) {
  console.error(`Not moved: ${error.message}`)
  process.exitCode = 1
} finally {
  source.close()
  await pool.end()
}
