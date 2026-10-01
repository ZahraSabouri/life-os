// JobMap keeps its own unchanged Node server (server.mjs), started by Life OS
// on a private port. Its inbox poller keeps importing scheduled-search batches
// from jobmap/data/inbox while Life OS is running.
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createSubAppProxy, localRequest } from './proxy.mjs'

export const JOBMAP_PATH = '/apps/jobmap/'
export const JOBMAP_INTERNAL_PORT = Number(process.env.LIFE_OS_JOBMAP_PORT || 47852)

async function health(port) {
  try {
    const { status, text } = await localRequest(port, { path: '/api/health' })
    return status === 200 ? JSON.parse(text) : null
  } catch { return null }
}

async function stopJobMap(port) {
  try {
    await localRequest(port, {
      path: '/api/stop', method: 'POST', timeout: 5000, body: '{}',
      headers: { 'content-type': 'application/json', 'x-jobmap-client': 'workspace-v1' },
    })
  } catch {}
}

export async function startJobMap({ root, port = JOBMAP_INTERNAL_PORT } = {}) {
  const existing = await health(port)
  if (existing) {
    // Only Life OS uses this private port, so a JobMap here is ours from an
    // earlier session that did not shut down cleanly.
    if (existing.app === 'jobmap-local') return { port, stop: () => stopJobMap(port) }
    throw new Error(`Port ${port} is used by another app; JobMap was not started.`)
  }
  const env = { ...process.env, JOBMAP_PORT: String(port) }
  delete env.JOBMAP_DEV; delete env.JOBMAP_DATA_DIR; delete env.JOBMAP_INBOX_DIR
  const child = spawn(process.execPath, [path.join(root, 'server.mjs')], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => process.stdout.write(`[jobmap] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[jobmap] ${chunk}`))
  for (let i = 0; i < 60; i++) {
    if ((await health(port))?.app === 'jobmap-local') return { port, stop: async () => { await stopJobMap(port); child.kill() } }
    if (child.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  child.kill()
  throw new Error('JobMap did not start. See the Life OS server log.')
}

export function jobMapProxy(getPort) {
  return createSubAppProxy({
    mountPath: JOBMAP_PATH, getPort, label: 'JobMap',
    // JobMap forbids all framing; allow Life OS (same origin) only.
    rewriteResponseHeaders(headers) {
      const csp = headers['content-security-policy']
      if (csp) headers['content-security-policy'] = csp.replace("frame-ancestors 'none'", "frame-ancestors 'self'")
      return headers
    },
  })
}
