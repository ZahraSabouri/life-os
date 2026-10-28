// Gathering runs (mail/GATHER.md) leave a batch file in mail/inbox/. While Life OS runs,
// this picks it up: on start, every 60 seconds, and on "Look now" (POST /api/mail/scan).
// A file goes to processed/ once applied (or as a repeat), or to failed/ with a note.
//
// Safety: on the real database (lifeos) the folder is left alone until
// .runtime/mail-import.json says {"live": true}. The first real batch is tried on
// lifeos_test first (scripts/mail-import.mjs), and she looks at it before that is switched on.
import fs from 'node:fs'
import { readdir, readFile, writeFile, rename, mkdir, appendFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { postgresConfig, createPostgresPool, postgresBackup } from '../../code/life-os/backend/src/postgres.js'
import { createMailRepository, MailError } from '../../code/life-os/backend/src/modules/mail/repository.js'
import { createMailImporter } from '../../code/life-os/backend/src/modules/mail/importer.js'

const MAX_BYTES = 15 * 1024 * 1024
const SETTLE_MS = 5000
const POLL_MS = 60000
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-')

export function liveImportOn(projectRoot) {
  try { return JSON.parse(fs.readFileSync(path.join(projectRoot, '.runtime/mail-import.json'), 'utf8')).live === true } catch { return false }
}

export function createMailInbox({ directory, importer, logFile, enabled = () => true, settleMs = SETTLE_MS, pollMs = POLL_MS, log = console.log }) {
  const processed = path.join(directory, 'processed')
  const failed = path.join(directory, 'failed')
  let running = false
  let timer = null
  let last = null

  async function pending() {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    const now = Date.now()
    const out = []
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) continue // *.part and notes are skipped
      const file = path.join(directory, entry.name)
      const info = await stat(file).catch(() => null)
      if (info) out.push({ name: entry.name, file, bytes: info.size, settled: settleMs <= 0 || now - info.mtimeMs >= settleMs })
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }

  const note = (line) => (logFile ? appendFile(logFile, line + '\n', 'utf8').catch(() => {}) : null)
  async function retire(file, name, into) {
    await mkdir(into, { recursive: true })
    const target = path.join(into, `${stamp()}-${name}`)
    await rename(file, target)
    return target
  }

  // One batch file. Returns a plain summary (counts only, never mail content); never throws.
  async function importFile({ name, file, bytes }) {
    const at = new Date().toISOString()
    try {
      if (bytes > MAX_BYTES) throw new MailError(422, 'The batch file is larger than 15 MB', ['The batch file is larger than 15 MB'])
      let batch
      try { batch = JSON.parse((await readFile(file, 'utf8')).replace(/^﻿/, '')) } catch { throw new MailError(422, 'The file is not valid JSON', ['The file is not valid JSON']) }
      const result = await importer.apply(batch, { fileName: name })
      await retire(file, name, processed)
      const counts = result.repeated ? 'already imported, no change'
        : `messages ${result.counts.messages.new} new, ${result.counts.messages.updated} updated, ${result.counts.messages.unchanged} unchanged; actions ${result.counts.actions.new} new, ${result.counts.actions.updated} updated, ${result.counts.actions.unchanged} unchanged`
      await note(`- ${at} · ${name} · ${counts}`)
      return { name, ok: true, repeated: result.repeated, batchId: result.batchId, counts: result.counts }
    } catch (error) {
      if (!(error instanceof MailError)) {
        // Not the file's fault (the database is down, say): leave it waiting for the next look.
        log(`mail: ${name} not imported yet: ${error.code ?? 'error'}`)
        return { name, ok: false, waiting: true, error: 'Mail storage was unavailable; it will be tried again.' }
      }
      const problems = error.details ?? [error.message]
      const kept = await retire(file, name, failed).catch(() => file)
      await writeFile(`${kept}.error.txt`, `${at}\nThis batch was not imported. Fix these and put it back in mail/inbox/:\n${problems.map((problem) => `- ${problem}`).join('\n')}\n`, 'utf8').catch(() => {})
      await note(`- ${at} · ${name} · NOT imported: ${problems.length} problem(s) (kept in inbox/failed/)`)
      return { name, ok: false, error: error.message, problems: problems.length }
    }
  }

  async function scan() {
    if (!enabled()) return { off: true, results: [], note: 'Importing into the real database is off until the first batch has been tried on lifeos_test.' }
    if (running) return { busy: true, results: [] }
    running = true
    const results = []
    try {
      for (const entry of await pending()) if (entry.settled) results.push(await importFile(entry))
    } finally {
      running = false
    }
    last = { at: new Date().toISOString(), results }
    return { busy: false, results }
  }

  async function status() {
    const failedFiles = (await readdir(failed).catch(() => [])).filter((name) => name.endsWith('.json'))
    return { live: enabled(), waiting: (await pending()).map((entry) => entry.name), failed: failedFiles, lastScan: last }
  }

  function start() {
    scan().catch((error) => log(`mail: ${error.code ?? 'scan failed'}`))
    timer = setInterval(() => scan().catch((error) => log(`mail: ${error.code ?? 'scan failed'}`)), pollMs)
    timer.unref?.()
  }
  function close() { clearInterval(timer); timer = null }

  return { pending, importFile, scan, status, start, close }
}

// The running part: the store, the importer and the watcher for one database. The real
// mail/inbox/ is read only by the real database, once live import is on; a try-out
// reads only a folder it is given.
export function createMailRuntime(projectRoot, { database, directory, findPeople = () => [], background = true, enabled } = {}) {
  let config, pool
  try { config = postgresConfig(projectRoot); pool = createPostgresPool(config, database ? { database } : undefined) } catch { return null }
  const target = database ?? config.database
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository, findPeople, log: console.log, backup: () => postgresBackup(config, projectRoot, 'before-mail-batch', target, 'mail') })
  const own = Boolean(directory)
  const inbox = createMailInbox({ directory: directory ?? path.join(projectRoot, 'mail/inbox'), importer, logFile: path.join(projectRoot, 'mail/import-log.md'),
    enabled: enabled ?? (() => own || (target === 'lifeos' && liveImportOn(projectRoot))) })
  if (background) inbox.start()
  return { repository, importer, inbox, database: target, close: async () => { inbox.close(); await pool.end() } }
}
