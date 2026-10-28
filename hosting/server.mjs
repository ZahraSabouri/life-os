import fs from 'node:fs'
import path from 'node:path'
import { createLifeOsApp, projectRoot } from './app.mjs'
import db from '../code/life-os/backend/src/db.js'
import { budgetAnswers, startBudget } from './budget.mjs'
import { jobMapAnswers, startJobMap } from './jobmap.mjs'
import { keepUp } from './keep-up.mjs'

const envPath = path.join(projectRoot, 'code/life-os/backend/.env')
if (fs.existsSync(envPath)) process.loadEnvFile(envPath)
const port = Number(process.env.LIFE_OS_PORT || 47850)
let stopping = false
let server
let budget = null
let jobmap = null
function stop() {
  if (stopping) return
  stopping = true
  server.close(async () => {
    app.locals.desktopNotifier?.stop()
    await budgetKeeper.stop()
    await jobmapKeeper.stop()
    await app.locals.studyRuntime?.close().catch(() => {})
    await app.locals.mailRuntime?.close().catch(() => {})
    db.close()
    process.exit(0)
  })
  server.closeIdleConnections()
}
const app = createLifeOsApp({
  controlToken: process.env.LIFE_OS_CONTROL_TOKEN,
  desktopNotices: true,
  origin: `http://127.0.0.1:${port}`,
  onStop: stop,
  getBudgetPort: () => budget?.port ?? null,
  getJobMapPort: () => jobmap?.port ?? null,
})
// Each is started, and started again if it ever stops answering (hosting/keep-up.mjs).
const budgetKeeper = keepUp({
  name: 'Budget Management behind /apps/budget/', start: () => startBudget({ root: path.join(projectRoot, 'budget-management') }),
  alive: (handle) => budgetAnswers(handle.port), onChange: (value) => { budget = value },
})
const jobmapKeeper = keepUp({
  name: 'JobMap behind /apps/jobmap/', start: () => startJobMap({ root: path.join(projectRoot, 'jobmap') }),
  alive: (handle) => jobMapAnswers(handle.port), onChange: (value) => { jobmap = value },
})
server = app.listen(port, '127.0.0.1', () => console.log(`Life OS ready at http://127.0.0.1:${port}/`))
server.on('error', (error) => { console.error(error.message); process.exit(1) })
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
