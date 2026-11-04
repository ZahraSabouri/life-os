// Imports one mail batch (version 1, or 2 with items: mail/HARVEST.md) by hand: the first real batch
// (briefs/mail-and-admin.md, Data safety), and a backfill (briefs/stage-5-harvest.md, CP8).
//   node scripts/mail-import.mjs lifeos_test <file>   try it: the file stays where it is
//   node scripts/mail-import.mjs lifeos <file>        only once that run is on lifeos_test; backs up, then moves the file to processed/
//   node scripts/mail-import.mjs lifeos --live on     after that, let Life OS import new batches by itself
// Prints counts only, never mail content.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool } from '../code/life-os/backend/src/postgres.js'
import { createMailRuntime } from '../hosting/mail/inbox.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [database, file, value] = process.argv.slice(2)
if (!['lifeos', 'lifeos_test'].includes(database) || !file) {
  console.error('Usage: node scripts/mail-import.mjs <lifeos_test|lifeos> <batch file>   or   node scripts/mail-import.mjs lifeos --live on')
  process.exit(1)
}
if (file === '--live') {
  fs.mkdirSync(path.join(projectRoot, '.runtime'), { recursive: true })
  fs.writeFileSync(path.join(projectRoot, '.runtime/mail-import.json'), JSON.stringify({ live: value === 'on' }) + '\n')
  console.log(`Live mail import is ${value === 'on' ? 'on' : 'off'}. Restart Life OS for it to take effect.`)
  process.exit(0)
}

const batch = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
// Made-up batches (the examples, test backfills) say so in their agent, and never reach her data.
if (database === 'lifeos' && /not real mail|example data|made-up|for tests/i.test(String(batch.agent ?? ''))) {
  console.error('Not imported: this batch says it is made up (its agent), so it only goes to lifeos_test.')
  process.exit(1)
}
if (database === 'lifeos') {
  const test = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test' })
  const tried = (await test.query("SELECT 1 FROM mail.batches WHERE run_id = $1 AND status = 'applied'", [batch.runId])).rowCount
  await test.end()
  if (!tried) {
    console.error('Not imported: try this batch on lifeos_test first, and let Xar look at it.')
    process.exit(1)
  }
}
// People are only read (from the core's schema; nothing here writes to it).
let people = []
if (database === 'lifeos') {
  const core = createPostgresPool(postgresConfig(projectRoot), { database, searchPath: 'core' })
  try { people = (await core.query('SELECT id, name, contact FROM people')).rows } finally { await core.end() }
}
const mail = createMailRuntime(projectRoot, { database, findPeople: () => people, background: false, enabled: () => true })
try {
  const result = await mail.importer.apply(batch, { fileName: path.basename(file) })
  if (database === 'lifeos' && path.resolve(path.dirname(file)) === path.join(projectRoot, 'mail/inbox')) {
    fs.mkdirSync(path.join(projectRoot, 'mail/inbox/processed'), { recursive: true })
    fs.renameSync(file, path.join(projectRoot, 'mail/inbox/processed', `${new Date().toISOString().replace(/[:.]/g, '-')}-${path.basename(file)}`))
  }
  console.log(JSON.stringify({ database, repeated: result.repeated, counts: result.counts, backup: result.backupFile, now: await mail.repository.counts() }, null, 2))
} catch (error) {
  console.error(error.details ? `Not imported:\n- ${error.details.join('\n- ')}` : `Not imported: ${error.message}`)
  process.exitCode = 1
} finally {
  await mail.close()
}
