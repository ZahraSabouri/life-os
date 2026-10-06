import http from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function parseEventsCsv(csv) {
  const rows = [], row = []
  let field = '', quoted = false
  const input = String(csv).replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i += 1 }
      else if (!field || quoted) quoted = !quoted
      else throw new Error('Invalid events CSV quoting')
    } else if (char === ',' && !quoted) { row.push(field); field = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1
      row.push(field); if (row.some(value => value !== '')) rows.push([...row]); row.length = 0; field = ''
    } else field += char
  }
  if (quoted) throw new Error('Events CSV contains an unterminated field')
  if (field || row.length) { row.push(field); rows.push([...row]) }
  const headers = rows.shift() ?? []
  if (!headers.includes('event_id') || !headers.includes('date') || !headers.includes('name')) throw new Error('Events CSV headers are unavailable')
  return rows.map(fields => {
    if (fields.length !== headers.length) throw new Error('Events CSV has an incomplete row')
    return Object.fromEntries(headers.map((header, i) => [header, fields[i]]))
  })
}

// Hardcoded GET and loopback host make this adapter unable to save, import,
// acknowledge notifications, or reach an address provided by source data.
export function getLocalJson(port, pathname, { timeoutMs = 2000, maxBytes = 16 * 1024 * 1024 } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return Promise.reject(new Error('Source is not running'))
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method: 'GET', headers: { host: `127.0.0.1:${port}`, accept: 'application/json' } }, res => {
      let body = '', bytes = 0
      res.on('data', chunk => {
        bytes += chunk.length
        if (bytes > maxBytes) req.destroy(new Error('Source response is too large'))
        else body += chunk
      })
      res.on('error', reject)
      res.on('end', () => {
        if (res.statusCode === 204) { resolve(null); return }
        if (res.statusCode !== 200) { reject(new Error('Source read failed')); return }
        try { resolve(JSON.parse(body.replace(/^\uFEFF/, ''))) } catch { reject(new Error('Source returned invalid JSON')) }
      })
    })
    const timer = setTimeout(() => req.destroy(new Error('Source read timed out')), timeoutMs)
    req.on('close', () => clearTimeout(timer))
    req.on('error', reject)
    req.end()
  })
}

export function createCalendarLoaders({ projectRoot, summerRoot = path.join(projectRoot, 'summer-rescue-plan-app'), cardiffRoot = path.join(projectRoot, 'cardiff-life'), getBudgetPort, getJobMapPort, loadEntries, loadPeople, loadStudy, timeoutMs = 2000 }) {
  return {
    loadEntries, loadPeople,
    loadStudy: async range => {
      if (typeof loadStudy !== 'function') throw new Error('Study source is unavailable')
      const state = await loadStudy(range)
      if (state?.nativeWorkspace) return state
      const plan = await import(pathToFileURL(path.join(summerRoot, 'src/data/baseCards.js')).href)
      return state ? { state, baseCards: plan.baseCards } : null
    },
    loadCareer: () => getLocalJson(getJobMapPort?.(), '/api/jobs', { timeoutMs }),
    loadBudget: () => getLocalJson(getBudgetPort?.(), '/api/state', { timeoutMs }),
    loadEvents: async () => parseEventsCsv(await readFile(path.join(cardiffRoot, 'events.csv'), 'utf8')),
  }
}
