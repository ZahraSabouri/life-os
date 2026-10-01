import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const preserved = path.join(path.dirname(root), 'Life_OS_preserved_2026-10-01')
const ignored = new Set(['node_modules', 'dist', '.chrome-modal-fix', '.health-check'])
const entries = []
async function walk(relative) {
  for (const entry of await fs.readdir(path.join(preserved, relative), { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const item = path.join(relative, entry.name)
    if (entry.isDirectory()) await walk(item)
    else if (entry.isFile()) {
      const original = await fs.readFile(path.join(preserved, item))
      const copied = await fs.readFile(path.join(root, item))
      const hash = buffer => createHash('sha256').update(buffer).digest('hex')
      entries.push({ path: item.replaceAll('\\', '/'), bytes: original.length,
        originalSha256: hash(original), copiedSha256: hash(copied) })
    }
  }
}
await walk('code')
await walk('summer-rescue-plan-app')
const changed = entries.filter(entry => entry.originalSha256 !== entry.copiedSha256)
const report = { capturedAt: new Date().toISOString(), root, preserved,
  files: entries.length, changed: changed.map(entry => entry.path), entries }
await fs.mkdir(path.join(root, 'migration'), { recursive: true })
await fs.writeFile(path.join(root, 'migration/initial-copy.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ files: entries.length, changed: report.changed }))
if (changed.length) process.exitCode = 1
