// The semester the Study hub has open, and that semester's own content.
//
// Nothing about a particular semester is written into the app. When a semester is opened,
// its modules, any cards prepared in advance, its schedule and its wording are loaded here,
// and the rest of the app reads them from this one place. A new semester starts empty.

export const session = {
  semesterId: '',
  semester: null,
  modules: [],
  plan: {},
  sessions: [],
  assessments: [],
  materials: [],
}

// The app's lists (modules, prepared cards, schedule) are worked out once, when the app's
// code loads. They ask for the semester through here, so loading that code before a
// semester is open is caught instead of quietly giving an empty app.
let consulted = false
export function openSemester() {
  consulted = true
  return session
}

const LAST_SEMESTER_KEY = 'study-hub.semester'
const OPEN_LAST_KEY = 'study-hub.open-last'
const PICK_KEY = 'study-hub.pick'
const STAY_KEY = 'study-hub.stay'

const read = (storage, key) => {
  try { return storage.getItem(key) ?? '' } catch { return '' }
}
const write = (storage, key, value) => {
  try { if (value === null) storage.removeItem(key); else storage.setItem(key, value) } catch { /* the choice still holds for this visit */ }
}

export function lastSemesterId() {
  return read(window.sessionStorage, LAST_SEMESTER_KEY) || read(window.localStorage, LAST_SEMESTER_KEY)
}
// A tab opened from the app (the Focus Room) carries the semester in its session storage.
export function tabSemesterId() {
  return read(window.sessionStorage, LAST_SEMESTER_KEY)
}
export function opensLastSemester() {
  return read(window.localStorage, OPEN_LAST_KEY) === '1' && read(window.sessionStorage, PICK_KEY) !== '1'
}
export function setOpensLastSemester(value) {
  write(window.localStorage, OPEN_LAST_KEY, value ? '1' : null)
}
// Used by "Change semester": the next load shows the list instead of reopening the last one.
export function askForSemesterOnNextLoad() {
  write(window.sessionStorage, PICK_KEY, '1')
  write(window.sessionStorage, LAST_SEMESTER_KEY, null)
}

// After a change to the semester's modules the app starts again, in the same semester.
export function reloadInSemester() {
  write(window.sessionStorage, STAY_KEY, '1')
  window.location.reload()
}
// True when this load continues a visit to a semester: the app restarted itself, or the
// page was refreshed. Coming into the Study hub afresh shows the list of semesters.
export function staysInSemester() {
  if (read(window.sessionStorage, PICK_KEY) === '1') return false
  if (read(window.sessionStorage, STAY_KEY) === '1') return true
  try { return window.performance.getEntriesByType('navigation')[0]?.type === 'reload' } catch { return false }
}

export function api(path) {
  return `${path}${path.includes('?') ? '&' : '?'}semester=${encodeURIComponent(session.semesterId)}`
}

export async function hubRequest(path, { method = 'GET', body, semester = true } = {}) {
  const response = await fetch(semester ? api(path) : path, {
    method,
    headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `The Study hub could not do that (${response.status}).`)
  return result
}

// Each semester keeps its own browser copies (the quick-start mirror of the state, timers,
// day logs, safety copies). Without this, opening a second semester would read the first
// one's leftovers.
function keepBrowserStoragePerSemester(semesterId) {
  const scoped = (name) => typeof name === 'string' && /^(summer-rescue-|srp-)/.test(name) && name !== 'srp-nav-collapsed'
  const scope = (name) => (scoped(name) ? `study-hub:${semesterId}:${name}` : name)
  const proto = window.Storage.prototype
  const { getItem, setItem, removeItem } = proto
  proto.getItem = function getScopedItem(key) { return getItem.call(this, scope(key)) }
  proto.setItem = function setScopedItem(key, value) { return setItem.call(this, scope(key), value) }
  proto.removeItem = function removeScopedItem(key) { return removeItem.call(this, scope(key)) }
  if (typeof window.BroadcastChannel === 'function') {
    const Original = window.BroadcastChannel
    window.BroadcastChannel = class ScopedBroadcastChannel extends Original {
      constructor(name) { super(scope(name)) }
    }
  }
  if (window.indexedDB && window.IDBFactory) {
    const open = window.IDBFactory.prototype.open
    window.IDBFactory.prototype.open = function openScoped(name, ...rest) { return open.call(this, scope(name), ...rest) }
  }
}

let opened = false
export function openSession(workspace) {
  if (opened) throw new Error('A semester is already open in this tab.')
  if (consulted) throw new Error('The app loaded before a semester was open. Refresh the page.')
  opened = true
  Object.assign(session, {
    semesterId: workspace.semester.id,
    semester: workspace.semester,
    modules: Array.isArray(workspace.modules) ? workspace.modules : [],
    plan: workspace.plan && typeof workspace.plan === 'object' ? workspace.plan : {},
    sessions: Array.isArray(workspace.sessions) ? workspace.sessions : [],
    assessments: Array.isArray(workspace.assessments) ? workspace.assessments : [],
    materials: Array.isArray(workspace.materials) ? workspace.materials : [],
  })
  write(window.sessionStorage, LAST_SEMESTER_KEY, session.semesterId)
  write(window.localStorage, LAST_SEMESTER_KEY, session.semesterId)
  write(window.sessionStorage, PICK_KEY, null)
  write(window.sessionStorage, STAY_KEY, null)
  keepBrowserStoragePerSemester(session.semesterId)
  document.title = `${workspace.semester.title} · Study hub`
}
