// "Retake the pictures" on the Guide page: runs scripts/guide-shots.mjs against this running
// Life OS and says how it is going. The script only looks at the app (every write is answered
// inside its own browser), so it is safe to run while she uses Life OS.
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export function createGuideRouter({ express, projectRoot, origin, run = spawn }) {
  const router = express.Router()
  const shots = path.join(projectRoot, 'guide-shots')
  let child = null
  let startedAt = ''
  let lastExit = null
  const status = () => {
    let manifest = null
    try { manifest = JSON.parse(fs.readFileSync(path.join(shots, 'manifest.json'), 'utf8')) } catch { manifest = null }
    return { running: Boolean(child), startedAt, takenAt: manifest?.takenAt ?? '', pictures: Object.keys(manifest?.shots ?? {}).length, lastExit }
  }
  router.get('/status', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json(status()) })
  router.post('/retake', (_req, res) => {
    if (child) return res.status(409).json({ error: 'The pictures are being taken already.' })
    fs.mkdirSync(path.join(projectRoot, '.runtime'), { recursive: true })
    const log = fs.openSync(path.join(projectRoot, '.runtime/guide-shots.log'), 'w')
    const done = (code) => { lastExit = code; child = null; try { fs.closeSync(log) } catch { /* closed already */ } }
    try {
      child = run(process.execPath, [path.join(projectRoot, 'scripts/guide-shots.mjs'), '--base', origin], { cwd: projectRoot, stdio: ['ignore', log, log], windowsHide: true })
    } catch (error) { done(-1); return res.status(500).json({ error: `The pictures could not be started: ${error.message}` }) }
    startedAt = new Date().toISOString()
    lastExit = null
    child.on('exit', (code) => done(code ?? -1))
    child.on('error', () => done(-1))
    return res.status(202).json(status())
  })
  return router
}
