// One-time transfer of Budget Management's browser storage.
// Browser storage belongs to an address, so this briefly listens on the old
// Budget addresses (127.0.0.1:47831 and :47841), reads everything stored there
// in your browser, saves it to budget-management/browser-data/, then hands
// over to Life OS to add it at the Life OS address. Nothing is deleted.
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'budget-management', 'browser-data')
const ports = [47831, 47841]
const finalUrl = 'http://127.0.0.1:47850/__life-os/budget-browser-import'
const saved = new Set()
const servers = []

const page = (port, next) => `<!doctype html><meta charset="utf-8"><title>Saving Budget browser data</title>
<body style="font:15px system-ui;margin:48px">Saving Budget browser data from 127.0.0.1:${port}…<script>
const entries = {}
for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); entries[k] = localStorage.getItem(k) }
fetch('/save', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ origin: location.origin, exportedAt: new Date().toISOString(), userAgent: navigator.userAgent, entries }) })
  .then(r => { if (!r.ok) throw new Error('save failed'); location.href = ${JSON.stringify(next)} })
  .catch(e => { document.body.textContent = 'Could not save: ' + e.message })
</script>`

function finish() {
  for (const server of servers) server.close()
  console.log(`Saved browser data from ${[...saved].join(' and ')} to ${outDir}`)
  setTimeout(() => process.exit(0), 300)
}

function serve(port, index) {
  const next = index + 1 < ports.length ? `http://127.0.0.1:${ports[index + 1]}/` : finalUrl
  const server = http.createServer(async (req, res) => {
    if (req.headers.host !== `127.0.0.1:${port}`) { res.writeHead(403).end(); return }
    if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(page(port, next)); return }
    if (req.method === 'POST' && req.url === '/save' && (!req.headers.origin || req.headers.origin === `http://127.0.0.1:${port}`)) {
      let text = ''
      for await (const chunk of req) { text += chunk; if (text.length > 20e6) { res.writeHead(413).end(); return } }
      const value = JSON.parse(text)
      await fs.mkdir(outDir, { recursive: true })
      const stamp = value.exportedAt.replace(/[:.]/g, '-')
      await fs.writeFile(path.join(outDir, `origin-${port}-${stamp}.json`), JSON.stringify(value, null, 2), { flag: 'wx' })
      console.log(`127.0.0.1:${port}: ${Object.keys(value.entries).length} item(s) saved`)
      saved.add(port)
      res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}')
      if (saved.size === ports.length) finish()
      return
    }
    res.writeHead(404).end()
  })
  return new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`127.0.0.1:${port} is in use. Stop the old Budget Management first (Stop Budget Management.cmd), then try again.`)))
    server.listen(port, '127.0.0.1', () => { servers.push(server); resolve() })
  })
}

try {
  for (const [index, port] of ports.entries()) await serve(port, index)
} catch (error) {
  console.error(error.message)
  for (const server of servers) server.close()
  process.exit(1)
}
const url = `http://127.0.0.1:${ports[0]}/`
console.log(`Opening ${url} in your default browser. If you used Budget in a different browser, open that address there instead.`)
if (process.platform === 'win32') spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' }).unref()
setTimeout(() => { console.error('Timed out after 10 minutes.'); process.exit(1) }, 10 * 60 * 1000).unref()
