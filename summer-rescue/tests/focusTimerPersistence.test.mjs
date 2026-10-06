import test from 'node:test'
import assert from 'node:assert/strict'

// node --test has no `window` — a minimal in-memory Storage-alike is enough
// to exercise the real save/load/validate logic, since the module only ever
// touches window.localStorage through getItem/setItem/removeItem.
function fakeLocalStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

globalThis.window = { localStorage: fakeLocalStorage() }
const { saveTimerSnapshot, loadTimerSnapshot, clearTimerSnapshot } = await import('../src/utils/focusTimerPersistence.js')

function baseSnapshot(overrides = {}) {
  return {
    activeCardId: 'card-002',
    mode: 'focus',
    running: true,
    deadlineAt: Date.now() + 10 * 60 * 1000,
    segmentStartedAt: Date.now() - 5 * 60 * 1000,
    segmentCardId: 'card-002',
    sessions: 2,
    durations: { focus: 25, short: 5, long: 15 },
    focusPreset: '25-5',
    ...overrides,
  }
}

test('a running snapshot round-trips through save and load', () => {
  const snapshot = baseSnapshot()
  saveTimerSnapshot(snapshot)
  const loaded = loadTimerSnapshot()
  assert.ok(loaded)
  assert.equal(loaded.activeCardId, 'card-002')
  assert.equal(loaded.mode, 'focus')
  assert.equal(loaded.deadlineAt, snapshot.deadlineAt)
  assert.equal(loaded.segmentCardId, 'card-002')
  assert.equal(loaded.sessions, 2)
  assert.deepEqual(loaded.durations, { focus: 25, short: 5, long: 15 })
  assert.equal(loaded.focusPreset, '25-5')
})

test('a non-running snapshot is not worth resuming', () => {
  saveTimerSnapshot(baseSnapshot({ running: false }))
  assert.equal(loadTimerSnapshot(), null)
})

test('an invalid mode is rejected', () => {
  saveTimerSnapshot(baseSnapshot({ mode: 'lunch' }))
  assert.equal(loadTimerSnapshot(), null)
})

test('a missing or non-finite deadline is rejected', () => {
  saveTimerSnapshot(baseSnapshot({ deadlineAt: undefined }))
  assert.equal(loadTimerSnapshot(), null)
  saveTimerSnapshot(baseSnapshot({ deadlineAt: Number.NaN }))
  assert.equal(loadTimerSnapshot(), null)
})

test('clearing removes the snapshot entirely', () => {
  saveTimerSnapshot(baseSnapshot())
  assert.ok(loadTimerSnapshot())
  clearTimerSnapshot()
  assert.equal(loadTimerSnapshot(), null)
})

test('malformed JSON in storage is treated as no snapshot, not a crash', () => {
  window.localStorage.setItem('summer-rescue-focus-timer-snapshot-v1', '{not json')
  assert.equal(loadTimerSnapshot(), null)
})

test('a missing key returns null', () => {
  clearTimerSnapshot()
  assert.equal(loadTimerSnapshot(), null)
})
