// A backgrounded tab can be fully discarded by the browser's memory saver
// (Chrome/Edge do this aggressively once another heavy app, e.g. RStudio, is
// using memory) and coming back to it is then a full page reload, not a
// resume — every in-memory ref/state the timer holds (deadline, running,
// mode, session count) is gone. The countdown math itself is already
// wall-clock-based and survives being merely backgrounded; what it cannot
// survive is the React tree itself being torn down and rebuilt. This module
// persists just enough of a running block to rebuild it correctly on the
// next mount, so a discarded-and-reloaded tab resumes instead of resetting.
const STORAGE_KEY = 'summer-rescue-focus-timer-snapshot-v1'
const VALID_MODES = new Set(['focus', 'short', 'long'])

function hasLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function saveTimerSnapshot(snapshot) {
  if (!hasLocalStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }))
  } catch {
    /* storage full or unavailable (private browsing) — the timer still works, it just won't survive a reload */
  }
}

export function clearTimerSnapshot() {
  if (!hasLocalStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to do */
  }
}

/**
 * Returns the persisted snapshot only if it describes a run actually worth
 * resuming (was running, has a real deadline); otherwise null. Does not
 * decide whether the deadline has already passed — the caller does that,
 * since "passed while away" (complete it) and "still ahead" (resume it) are
 * handled differently.
 */
export function loadTimerSnapshot() {
  if (!hasLocalStorage()) return null
  let raw
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  if (parsed.running !== true) return null
  if (!VALID_MODES.has(parsed.mode)) return null
  if (!Number.isFinite(parsed.deadlineAt)) return null

  return {
    activeCardId: typeof parsed.activeCardId === 'string' ? parsed.activeCardId : null,
    mode: parsed.mode,
    deadlineAt: parsed.deadlineAt,
    segmentStartedAt: Number.isFinite(parsed.segmentStartedAt) ? parsed.segmentStartedAt : null,
    segmentCardId: typeof parsed.segmentCardId === 'string' ? parsed.segmentCardId : null,
    sessions: Number.isFinite(parsed.sessions) ? Math.max(0, Math.floor(parsed.sessions)) : 0,
    durations: parsed.durations && typeof parsed.durations === 'object' ? parsed.durations : null,
    focusPreset: typeof parsed.focusPreset === 'string' ? parsed.focusPreset : '25-5',
  }
}
