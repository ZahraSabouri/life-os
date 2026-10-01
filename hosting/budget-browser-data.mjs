// Budget Management also kept copies of its plan in browser storage at its
// old addresses (127.0.0.1:47831 and :47841). scripts/transfer-budget-browser-data.mjs
// saves those into budget-management/browser-data/. These routes hand them to a
// small page on the Life OS address, which adds any missing keys to this
// address's browser storage, so the app finds the same browser copies here.
import fs from 'node:fs/promises'
import path from 'node:path'

export const BROWSER_PORTS = [47831, 47841]

async function latestExports(dir) {
  let names = []
  try { names = await fs.readdir(dir) } catch { return [] }
  const exports = []
  for (const port of BROWSER_PORTS) {
    const files = names.filter((name) => name.startsWith(`origin-${port}`) && name.endsWith('.json')).sort()
    if (!files.length) continue
    const file = files[files.length - 1]
    const value = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'))
    exports.push({ port, file, exportedAt: value.exportedAt, entries: value.entries || {} })
  }
  return exports
}

function revisionOf(raw) {
  try { return Number(JSON.parse(raw)?.revision) || 0 } catch { return 0 }
}

export async function mergeBrowserExports(dir) {
  const exports = await latestExports(dir)
  const entries = {}
  const conflicts = []
  for (const item of exports) {
    for (const [key, value] of Object.entries(item.entries)) {
      if (!(key in entries)) { entries[key] = value; continue }
      if (entries[key] === value) continue
      // The disk-cache key carries a revision: keep the newer one.
      if (key.endsWith('_v4cache') && revisionOf(value) > revisionOf(entries[key])) entries[key] = value
      conflicts.push({ key, keptFrom: key.endsWith('_v4cache') ? 'newest revision' : `port ${exports[0].port}` })
    }
  }
  return { sources: exports.map(({ port, file, exportedAt, entries: e }) => ({ port, file, exportedAt, keys: Object.keys(e).length })), entries, conflicts }
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Budget browser data · Life OS</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;color:#222;background:#faf7f2}
h1{font-size:22px}code{background:#eee;padding:1px 4px;border-radius:4px}a.button{display:inline-block;margin-top:16px;padding:8px 16px;border-radius:999px;background:#314f40;color:#fff;text-decoration:none}</style></head>
<body><h1>Budget Management browser data</h1><p id="status">Reading saved browser data…</p><ul id="list"></ul>
<a class="button" href="/budget">Open Budget in Life OS</a>
<script>
(async () => {
  const status = document.getElementById('status'), list = document.getElementById('list')
  try {
    const data = await (await fetch('/__life-os/budget-browser-data', { cache: 'no-store' })).json()
    if (!data.sources.length) { status.textContent = 'No browser data has been exported yet. Run "Transfer Budget browser data.cmd" in the Life OS folder.'; return }
    let added = 0, same = 0, kept = []
    for (const [key, value] of Object.entries(data.entries)) {
      const existing = localStorage.getItem(key)
      if (existing === null) { localStorage.setItem(key, value); added++ }
      else if (existing === value) same++
      else kept.push(key)
    }
    localStorage.setItem('life-os.budget-browser-import', JSON.stringify({ at: new Date().toISOString(), sources: data.sources, added, same, kept }))
    status.textContent = 'Done. Added ' + added + ' item(s) to this browser; ' + same + ' were already here.' + (kept.length ? ' Kept ' + kept.length + ' existing item(s) unchanged: ' + kept.join(', ') : '')
    for (const s of data.sources) { const li = document.createElement('li'); li.textContent = 'From 127.0.0.1:' + s.port + ': ' + s.keys + ' item(s), exported ' + s.exportedAt; list.append(li) }
  } catch (error) { status.textContent = 'Could not import: ' + error.message + '. Nothing was changed.' }
})()
</script></body></html>`

export function budgetBrowserRoutes(app, budgetRoot) {
  const dir = path.join(budgetRoot, 'browser-data')
  app.get('/__life-os/budget-browser-data', async (_req, res, next) => {
    try { res.set('Cache-Control', 'no-store').json(await mergeBrowserExports(dir)) } catch (error) { next(error) }
  })
  app.get('/__life-os/budget-browser-import', (_req, res) => res.set('Cache-Control', 'no-store').type('html').send(PAGE))
}
