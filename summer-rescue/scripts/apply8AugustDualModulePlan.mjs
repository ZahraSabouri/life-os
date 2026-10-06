import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  migrateTrackerState,
  PLAN_REVISION,
  TRACKER_STATE_VERSION,
} from '../src/state/trackerStateMigration.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const statePath = path.join(projectRoot, 'local-data', 'summer-rescue-tracker-state.json')
const payload = JSON.parse(await readFile(statePath, 'utf8'))
const currentState = payload.state ?? payload

const migratedState = migrateTrackerState(currentState)
if (JSON.stringify(migratedState) === JSON.stringify(currentState)) {
  console.log(`Tracker is already on ${PLAN_REVISION}; no write performed.`)
  process.exit(0)
}

const writtenAt = new Date().toISOString()
const nextPayload = payload.state
  ? {
      ...payload,
      revision: Number(payload.revision ?? 0) + 1,
      writtenAt,
      writerId: 'codex-8-august-dual-module-plan',
      state: migratedState,
    }
  : migratedState

await writeFile(statePath, `${JSON.stringify(nextPayload, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({
  path: statePath,
  revision: nextPayload.revision,
  stateVersion: TRACKER_STATE_VERSION,
  planRevision: migratedState.settings.planRevision,
  campaignStart: migratedState.settings.campaignStart,
  campaignEnd: migratedState.settings.campaignEnd,
  examWindowStart: migratedState.settings.examWindowStart,
  moduleExamDates: migratedState.settings.moduleExamDates,
  preservedCardStates: Object.keys(migratedState.cards ?? {}).length,
  preservedAddedCards: migratedState.addedCards?.length ?? 0,
}, null, 2))
