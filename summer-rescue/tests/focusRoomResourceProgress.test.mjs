import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const focusRoomPath = fileURLToPath(new URL('../src/components/FocusRoom.jsx', import.meta.url))
const focusTabPath = fileURLToPath(new URL('../src/components/FocusRoomTab.jsx', import.meta.url))
const studyTimerPath = fileURLToPath(new URL('../src/components/StudyTimer.jsx', import.meta.url))
const appPath = fileURLToPath(new URL('../src/App.jsx', import.meta.url))
const editorPath = fileURLToPath(new URL('../src/components/ResourceStudyEditor.jsx', import.meta.url))
const trackerPath = fileURLToPath(new URL('../src/state/useTrackerState.js', import.meta.url))

test('Focus Room renders the shared resource study editor with the saved resource record', async () => {
  const source = await fs.readFile(focusRoomPath, 'utf8')

  assert.match(source, /import \{ ResourceStudyEditor \} from '\.\/ResourceStudyEditor'/)
  assert.match(source, /progress=\{resourceProgress\[resource\.id\]\}/)
  assert.match(source, /onProgressChange=\{onResourceProgressChange\}/)
  assert.match(source, /onProgressSave=\{onResourceProgressSave\}/)
  assert.match(source, /onToggleReviewed=\{onResourceReviewedToggle\}/)
  assert.match(source, /Open, track, and annotate without leaving the room/)
  assert.match(source, /<details className="focus-room-resource-workspace">/)
  assert.match(source, /<details key=\{resource\.id\} className="focus-room-resource-card">/)
  assert.match(source, /<summary className="focus-room-section-head">/)
  assert.match(source, /Open original resource/)
})

test('Focus Room tab carries resource progress across the single-writer bridge', async () => {
  const source = await fs.readFile(focusTabPath, 'utf8')

  assert.match(source, /pendingResourcePatchesRef = useRef\(new Map\(\)\)/)
  assert.match(source, /const nextResourceProgress = \{ \.\.\.\(message\.resourceProgress \?\? \{\}\) \}/)
  assert.match(source, /forward\('update-resource-progress', \{ resourceId, patch \}\)/)
  assert.match(source, /forwardAndWait\('save-resource-progress', \{ resourceId, patch \}\)/)
  assert.match(source, /forward\('mark-resource-opened', \{ resourceId \}\)/)
})

test('main app persists Focus Room resource and card progress actions', async () => {
  const source = await fs.readFile(appPath, 'utf8')

  assert.match(source, /resourceProgress: tracker\.state\.resourceProgress/)
  assert.match(source, /tracker\.updateResourceProgress\(message\.resourceId, message\.patch\)/)
  assert.match(source, /tracker\.saveResourceProgressNow\(message\.resourceId, message\.patch\)/)
  assert.match(source, /postFocusMessage\('action-result'/)
  assert.match(source, /tracker\.toggleResourceProgress\(message\.resourceId\)/)
  assert.match(source, /tracker\.markResourceOpened\(message\.resourceId\)/)
  assert.match(source, /tracker\.setCardProgress\(message\.cardId, message\.progressPercent\)/)
  assert.match(source, /tracker\.setStatus\(message\.cardId, message\.status\)/)
  assert.match(source, /tracker\.toggleDone\(message\.cardId\)/)
})

test('StudyTimer forwards the richer execution controls into Focus Room', async () => {
  const source = await fs.readFile(studyTimerPath, 'utf8')

  assert.match(source, /resourceProgress=\{resourceProgress\}/)
  assert.match(source, /onResourceProgressChange=\{onResourceProgressChange\}/)
  assert.match(source, /onResourceProgressSave=\{onResourceProgressSave\}/)
  assert.match(source, /onCardProgressChange=\{onCardProgressChange\}/)
  assert.match(source, /onStatusChange=\{onStatusChange\}/)
  assert.match(source, /onToggleDone=\{onToggleDone\}/)
})

test('resource notes and progress expose explicit durable save controls', async () => {
  const [editorSource, trackerSource] = await Promise.all([
    fs.readFile(editorPath, 'utf8'),
    fs.readFile(trackerPath, 'utf8'),
  ])

  assert.match(editorSource, /Save notes/)
  assert.match(editorSource, /Save progress/)
  assert.match(editorSource, /Saving to the local tracker/)
  assert.match(trackerSource, /async function saveResourceProgressNow\(resourceId, patch\)/)
  assert.match(trackerSource, /return saveLocalFileNow\(next\)/)
  assert.match(trackerSource, /saveResourceProgressNow,/)
})
