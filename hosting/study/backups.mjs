import fs from 'node:fs/promises'
import path from 'node:path'

const DAY_MS = 24 * 60 * 60 * 1000

// Daily rolling copies of the Study database (Architecture section 10).
// Nothing is pruned here: removing old backups stays Xar's step.
export function createStudyBackups({ backupRoot, dump, clock = () => Date.now(), checkEveryMs = 3 * 60 * 60 * 1000 } = {}) {
  if (!backupRoot || typeof dump !== 'function') throw new TypeError('Study backups require a folder and a dump function')
  let timer = null, running = null, lastError = null

  async function list() {
    let folders = []
    try { folders = await fs.readdir(backupRoot, { withFileTypes: true }) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    const rows = []
    for (const folder of folders) {
      if (!folder.isDirectory() || !/^study-\d{4}-\d{2}-\d{2}$/.test(folder.name)) continue
      for (const file of await fs.readdir(path.join(backupRoot, folder.name), { withFileTypes: true })) {
        // The dump writer names files <label>-<milliseconds>.dump, so the time needs no file metadata.
        const match = file.isFile() ? /^(.+)-(\d{12,})\.dump$/.exec(file.name) : null
        if (!match) continue
        const stat = await fs.stat(path.join(backupRoot, folder.name, file.name))
        if (!stat.size) continue
        rows.push({ folder: folder.name, name: file.name, label: match[1], bytes: stat.size, created_at: new Date(Number(match[2])).toISOString() })
      }
    }
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  async function recent(maxAgeMs) {
    // Test and restore-check dumps are not copies of the live database.
    const latest = (await list()).find(row => !/integration|verification/.test(row.label))
    return Boolean(latest && clock() - Date.parse(latest.created_at) < maxAgeMs)
  }

  async function status() {
    const dumps = await list()
    return { last: dumps[0] ?? null, last_daily: dumps.find(row => row.label === 'daily') ?? null, count: dumps.length,
      bytes: dumps.reduce((sum, row) => sum + row.bytes, 0), error: lastError }
  }

  function ensureDaily() {
    if (running) return running
    running = (async () => {
      try {
        const latest = (await list()).find(row => row.label === 'daily')
        if (latest && clock() - Date.parse(latest.created_at) < DAY_MS) return { created: false, last: latest }
        const destination = await dump('daily')
        lastError = null
        return { created: true, name: path.basename(destination) }
      } catch {
        // No path or connection detail leaves the server; the next check tries again.
        lastError = 'The daily Study backup could not be made. It will be retried.'
        return { created: false, error: lastError }
      } finally { running = null }
    })()
    return running
  }

  function start() {
    if (timer) return
    ensureDaily()
    timer = setInterval(ensureDaily, Math.max(60_000, Number(checkEveryMs) || DAY_MS))
    timer.unref?.()
  }
  async function close() { if (timer) clearInterval(timer); timer = null; await running }
  return Object.freeze({ list, recent, status, ensureDaily, start, close })
}
