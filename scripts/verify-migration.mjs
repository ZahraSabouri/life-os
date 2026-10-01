import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { STUDY_MODULES } from '../summer-rescue-plan-app/src/data/studyModules.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const initial = JSON.parse(await fs.readFile(path.join(root, 'migration/initial-copy.json'), 'utf8'))
const preservedChanges = []
const assetChanges = []
const sourceChanges = []
const expectedChanges = new Set([
  'code/life-os/frontend/src/App.jsx',
  'summer-rescue-plan-app/src/App.jsx',
  'summer-rescue-plan-app/src/components/AppIntro.jsx',
])
const hash = value => createHash('sha256').update(value).digest('hex')
for (const entry of initial.entries) {
  if (hash(await fs.readFile(path.join(initial.preserved, entry.path))) !== entry.originalSha256) preservedChanges.push(entry.path)
  if (entry.path.includes('/public/')) {
    if (hash(await fs.readFile(path.join(root, entry.path))) !== entry.originalSha256) assetChanges.push(entry.path)
  }
  if (entry.path.includes('/src/') || /\/(package(-lock)?\.json|vite\.config\.js|index\.html)$/.test(entry.path)) {
    if (hash(await fs.readFile(path.join(root, entry.path))) !== entry.originalSha256) sourceChanges.push(entry.path)
  }
}
const unexpectedSourceChanges = sourceChanges.filter(value => !expectedChanges.has(value))
const baseUrl = 'http://127.0.0.1:47850'
const staticResources = STUDY_MODULES.flatMap(module => module.resources).filter(resource => resource.url.startsWith('/'))
const resourceResults = []
for (let start = 0; start < staticResources.length; start += 8) {
  await Promise.all(staticResources.slice(start, start + 8).map(async resource => {
    const url = `/apps/summer-rescue${resource.url}`
    const response = await fetch(`${baseUrl}${url}`, { method: 'HEAD' })
    const originalPath = path.join(initial.preserved, 'summer-rescue-plan-app/public', decodeURI(resource.url))
    const originallyExisted = await fs.access(originalPath).then(() => true, () => false)
    resourceResults.push({ id: resource.id, url, status: response.status, originallyExisted })
  }))
}
const failedResources = resourceResults.filter(resource => resource.status !== 200)
const originalState = JSON.parse(await fs.readFile(path.join(root, 'migration/backups/summer-rescue-initial-data/summer-rescue-tracker-state.json'), 'utf8')).state
const currentState = await (await fetch(`${baseUrl}/api/state`)).json()
const changedStateKeys = Object.keys(originalState).filter(key => JSON.stringify(originalState[key]) !== JSON.stringify(currentState.state[key]))
const protectedStateKeys = ['cards', 'customCards', 'moduleNotes', 'resourceReviewed', 'localResources', 'settings']
const settingsChanges = Object.keys({ ...originalState.settings, ...currentState.state.settings })
  .filter(key => JSON.stringify(originalState.settings?.[key]) !== JSON.stringify(currentState.state.settings?.[key]))
// The unchanged original app advances referenceDate on startup, generates
// current notifications and rotates safety snapshots. These are runtime work.
const protectedStateChanges = changedStateKeys.filter(key => protectedStateKeys.includes(key) && key !== 'settings')
if (settingsChanges.some(key => key !== 'referenceDate')) protectedStateChanges.push('settings')
function databaseCounts(file) {
  const database = new DatabaseSync(file, { readOnly: true })
  try {
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    return Object.fromEntries(tables.map(({ name }) => [name, database.prepare(`SELECT COUNT(*) AS count FROM "${name.replaceAll('"', '""')}"`).get().count]))
  } finally { database.close() }
}
const originalMainCounts = databaseCounts(path.join(root, 'migration/backups/life-os-initial-data/life-os.db'))
const currentMainCounts = databaseCounts(path.join(root, 'code/life-os/backend/data/life-os.db'))
const mainCountChanges = Object.keys(originalMainCounts).filter(key => originalMainCounts[key] !== currentMainCounts[key])
const summerDbHealth = await (await fetch(`${baseUrl}/api/db/health`)).json()
const report = {
  checkedAt: new Date().toISOString(), preservedFilesChecked: initial.files,
  preservedChanges, assetChanges, sourceChanges, unexpectedSourceChanges,
  staticResourcesChecked: resourceResults.length, failedResources,
  savedCardOverrides: Object.keys(originalState.cards ?? {}).length,
  changedStateKeys, settingsChanges, protectedStateChanges,
  originalMainCounts, currentMainCounts, mainCountChanges,
  summerDbHealth,
}
await fs.writeFile(path.join(root, 'migration/verification.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ...report, summerDbHealth: { ok: summerDbHealth.ok, counts: summerDbHealth.counts } }, null, 2))
if (preservedChanges.length || assetChanges.length || unexpectedSourceChanges.length ||
    protectedStateChanges.length || mainCountChanges.length || failedResources.some(resource => resource.originallyExisted) || !summerDbHealth.ok) process.exitCode = 1
