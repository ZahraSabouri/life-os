import fs from 'node:fs'
import path from 'node:path'
import { createLifeOsApp, projectRoot } from './app.mjs'
import db from '../code/life-os/backend/src/db.js'
import { startBudget } from './budget.mjs'
import { startJobMap } from './jobmap.mjs'

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
    await budget?.stop().catch(() => {})
    await jobmap?.stop().catch(() => {})
    await app.locals.studyRuntime?.close().catch(() => {})
    db.close()
    process.exit(0)
  })
  server.closeIdleConnections()
}
const app = createLifeOsApp({
  controlToken: process.env.LIFE_OS_CONTROL_TOKEN,
  onStop: stop,
  getBudgetPort: () => budget?.port ?? null,
  getJobMapPort: () => jobmap?.port ?? null,
})
startBudget({ root: path.join(projectRoot, 'budget-management') })
  .then((value) => { budget = value; console.log(`Budget Management ready behind /apps/budget/ (port ${value.port})`) })
  .catch((error) => console.error(`Budget Management: ${error.message}`))
startJobMap({ root: path.join(projectRoot, 'jobmap') })
  .then((value) => { jobmap = value; console.log(`JobMap ready behind /apps/jobmap/ (port ${value.port})`) })
  .catch((error) => console.error(`JobMap: ${error.message}`))
server = app.listen(port, '127.0.0.1', () => console.log(`Life OS ready at http://127.0.0.1:${port}/`))
server.on('error', (error) => { console.error(error.message); process.exit(1) })
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
