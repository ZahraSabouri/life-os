// Budget Management runs its own unchanged Node server as a child process on a
// private port. Life OS forwards /apps/budget/* to it, so the app keeps its
// own saving rules (revisions, automatic backups, validation) exactly as before.
import { createSubAppProxy } from './proxy.mjs'
import { skinHtml } from './skins/index.mjs'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'

export const BUDGET_PATH = '/apps/budget/'
export const BUDGET_IDENTITY = 'zahra-budget-planner-local-v1'
export const BUDGET_INTERNAL_PORT = Number(process.env.LIFE_OS_BUDGET_PORT || 47851)

function request(port, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port, path: options.path || '/__planner/health', method: options.method || 'GET',
      headers: { host: `127.0.0.1:${port}`, ...(options.headers || {}) }, timeout: options.timeout || 1000,
    }, (res) => {
      let text = ''
      res.on('data', (chunk) => { text += chunk })
      res.on('end', () => resolve({ status: res.statusCode, text }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end()
  })
}

async function health(port) {
  try {
    const { status, text } = await request(port)
    return status === 200 ? JSON.parse(text) : null
  } catch { return null }
}

export async function startBudget({ root, port = BUDGET_INTERNAL_PORT } = {}) {
  const appDir = path.join(root, 'app')
  const existing = await health(port)
  if (existing) {
    // Reuse a copy left running by an earlier Life OS session, but never
    // forward to a different copy (for example the old standalone folder).
    if (existing.app === BUDGET_IDENTITY && path.resolve(existing.directory) === path.resolve(appDir)) {
      return { port, ready: true, stop: () => stopBudget(port) }
    }
    throw new Error(`Port ${port} is used by another app; Budget was not started.`)
  }
  const child = spawn(process.execPath, [path.join(appDir, 'local-server.cjs')], {
    cwd: appDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BUDGET_PORT: String(port),
      BUDGET_DATA_DIR: path.join(root, 'data'),
      BUDGET_ASSET_DIR: path.join(root, 'assets/images/generated'),
      BUDGET_APPROVED_DIR: path.join(root, 'assets/images/approved'),
    },
  })
  child.stdout.on('data', (chunk) => process.stdout.write(`[budget] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[budget] ${chunk}`))
  for (let i = 0; i < 50; i++) {
    const value = await health(port)
    if (value?.app === BUDGET_IDENTITY) {
      return { port, ready: true, stop: async () => { await stopBudget(port); child.kill() } }
    }
    if (child.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  child.kill()
  throw new Error('Budget Management did not start. See the Life OS server log.')
}

async function stopBudget(port) {
  // The planner's own stop waits for any save in progress to finish.
  try { await request(port, { path: '/__planner/stop', method: 'POST', headers: { 'x-planner-action': 'stop' }, timeout: 5000 }) } catch {}
}

export function budgetProxy(getPort) {
  return createSubAppProxy({ mountPath: BUDGET_PATH, getPort, label: 'Budget Management', rewriteHtml: (html) => skinHtml(html, 'budget') })
}
