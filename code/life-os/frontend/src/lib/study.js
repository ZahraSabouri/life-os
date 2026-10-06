import { addDays, dateKey, isDateKey, itemOverlaps, londonDateTime } from '../../../shared/calendar.js'

export { addDays, dateKey, isDateKey }
export const DEFAULT_LANES = ['Today', 'This Week', 'Deep Work', 'Backlog', 'Waiting / Blocked', 'Rescue Lane', 'Done']
export const DEFAULT_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
export const DEFAULT_SLOTS = ['AM', 'PM', 'Light/Eve', 'Fixed', 'Flex']
export const EMPTY_WORKSPACE = { semesters: [], modules: [], cards: [], assessments: [], sessions: [], materials: [], progress: [], settings: [], history: [] }
export const ENTITIES = Object.keys(EMPTY_WORKSPACE).filter(key => key !== 'history')

export function normaliseWorkspace(value = {}) {
  const source = value.workspace ?? value
  return Object.fromEntries(Object.keys(EMPTY_WORKSPACE).map(key => [key, Array.isArray(source[key]) ? source[key].filter(row => !row.deleted_at) : []]))
}
export function dataOf(row) { return row?.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : {} }
export function studyPreferences(value = {}) {
  const list = (key, fallback) => Array.isArray(value[key]) && value[key].some(v => typeof v === 'string' && v.trim()) ? [...new Set(value[key].filter(v => typeof v === 'string' && v.trim()))] : fallback
  return { ...value, lanes: list('lanes', DEFAULT_LANES), priorities: list('priorities', DEFAULT_PRIORITIES), slots: list('slots', DEFAULT_SLOTS), notificationReadIds: Array.isArray(value.notificationReadIds) ? value.notificationReadIds : [] }
}
export function titleOf(row) { return row?.title || dataOf(row).title || 'Untitled' }
export function cardLane(card) { return dataOf(card).lane || ({ planned: 'Backlog', active: 'Backlog', draft: 'Backlog', pending: 'Backlog', 'in-progress': 'Deep Work', blocked: 'Waiting / Blocked', done: 'Done', completed: 'Done' }[card?.status]) || card?.status || 'Backlog' }
export function laneStatus(lane) { return lane === 'Done' ? 'done' : lane === 'Waiting / Blocked' ? 'blocked' : lane === 'Deep Work' ? 'in-progress' : 'planned' }
export function cardDone(card) { return Boolean(dataOf(card).done) || ['done', 'completed'].includes(String(cardLane(card)).toLowerCase()) || ['done', 'completed'].includes(card?.status) }
export function cardDue(card) { return card?.end_date || dataOf(card).dueDate || dateKey(card?.end_at) || '' }
export function cardStart(card) { return card?.start_date || dataOf(card).startDate || dateKey(card?.start_at) || '' }
export function cardHours(card) { const n = Number(dataOf(card).actualHours ?? 0); return Number.isFinite(n) ? Math.max(0, n) : 0 }
export function cardEstimate(card) { const n = Number(dataOf(card).estimatedHours ?? dataOf(card).estimateHours ?? 0); return Number.isFinite(n) ? Math.max(0, n) : 0 }
export function studyActive(record) { return record && !record.deleted_at && dataOf(record).active !== false && dataOf(record).enabled !== false && !['archived', 'cancelled', 'canceled', 'deleted', 'inactive'].includes(record.status) }
export function cardActionable(card, { modules = [], semesters = [] } = {}) {
  if (!studyActive(card) || cardDone(card) || dataOf(card).kind === 'reminder' || (dataOf(card).tags ?? []).includes('date-watch')) return false
  const parentActive = row => !row || studyActive(row) && !['done', 'completed'].includes(row.status) && dataOf(row).done !== true && dataOf(row).completed !== true
  const module = modules.find(row => row.id === card.module_id)
  return parentActive(module) && parentActive(semesters.find(row => row.id === card.semester_id)) && parentActive(semesters.find(row => row.id === module?.semester_id))
}
export function cardChecklist(card) {
  return (Array.isArray(dataOf(card).checklist) ? dataOf(card).checklist : []).map((item, i) => typeof item === 'string'
    ? { id: `${card.id}:check:${i}`, text: item, done: false }
    : { ...item, id: item.id || `${card.id}:check:${i}`, text: String(item.text || ''), done: Boolean(item.done) })
}
export function textEntries(card, field) {
  const source = dataOf(card)[field] ?? (field === 'evidenceEntries' ? dataOf(card).evidence : [])
  const rows = typeof source === 'string' ? (source.trim() ? [source] : []) : (Array.isArray(source) ? source : [])
  return rows.map((row, i) => typeof row === 'string' ? { id: `${card.id}:${field}:${i}`, text: row } : { ...row, id: row.id || `${card.id}:${field}:${i}`, text: String(row.text ?? row.note ?? '') })
}
export function displayDate(value) {
  const key = isDateKey(value) ? value : dateKey(value)
  if (!key) return 'No date'
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${key}T12:00:00Z`))
}
export function weekStart(day) {
  if (!isDateKey(day)) return ''
  return addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7))
}
export function scopedRows(rows, semesterId = '', moduleId = '') {
  return rows.filter(row => (!semesterId || row.semester_id === semesterId) && (!moduleId || row.module_id === moduleId))
}
export function filterCards(cards, { search = '', lane = '', priority = '', phase = '', slot = '', tag = '', date = '', semesterId = '', moduleId = '', today = dateKey(new Date()), parents = {} } = {}) {
  const query = search.trim().toLowerCase()
  return scopedRows(cards, semesterId, moduleId).filter(card => {
    const data = dataOf(card)
    const due = cardDue(card), start = cardStart(card)
    if (lane && cardLane(card) !== lane) return false
    if (priority && data.priority !== priority) return false
    if (phase && data.phase !== phase) return false
    if (slot && data.slotType !== slot) return false
    if (tag && !(data.tags ?? []).includes(tag)) return false
    if (date === 'today' && due !== today && start !== today) return false
    if (date === 'overdue' && (!cardActionable(card, parents) || !isDateKey(due) || due >= today)) return false
    if (date === 'week' && ![due, start].some(day => isDateKey(day) && day >= today && day <= addDays(today, 6))) return false
    if (date === 'undated' && (due || start)) return false
    if (query && ![titleOf(card), data.description, data.phase, data.priority, data.moduleGroup, ...(data.tags ?? []), ...textEntries(card, 'notes').map(n => n.text), ...textEntries(card, 'evidenceEntries').map(n => n.text)].filter(Boolean).join(' ').toLowerCase().includes(query)) return false
    return true
  }).sort((a, b) => (cardDue(a) || '9999').localeCompare(cardDue(b) || '9999') || titleOf(a).localeCompare(titleOf(b)))
}
export function studyStats(cards, today = dateKey(new Date()), parents = {}) {
  const done = cards.filter(cardDone)
  const open = cards.filter(card => studyActive(card) && !cardDone(card))
  const actionable = cards.filter(card => cardActionable(card, parents))
  return { total: cards.length, done: done.length, open: open.length, percent: cards.length ? Math.round(done.length / cards.length * 100) : 0,
    hours: cards.reduce((n, c) => n + cardHours(c), 0), estimate: cards.reduce((n, c) => n + cardEstimate(c), 0),
    overdue: actionable.filter(c => isDateKey(cardDue(c)) && cardDue(c) < today), dueToday: actionable.filter(c => cardDue(c) === today),
    nextWeek: actionable.filter(c => isDateKey(cardDue(c)) && cardDue(c) >= today && cardDue(c) <= addDays(today, 6)),
    waiting: actionable.filter(c => cardLane(c) === 'Waiting / Blocked'), rescue: actionable.filter(c => cardLane(c) === 'Rescue Lane'), actionable }
}

export function activityDays(cards, progress = []) {
  const days = new Map()
  const add = (at, minutes = 0, completions = 0) => {
    const day = isDateKey(at) ? at : dateKey(at)
    if (!day) return
    const current = days.get(day) ?? { date: day, minutes: 0, completions: 0 }
    current.minutes += Number(minutes) || 0; current.completions += completions
    days.set(day, current)
  }
  for (const card of cards) {
    const data = dataOf(card)
    for (const session of data.focusSessions ?? []) if (Number(session.minutes) > 0) add(session.at || session.created_at, session.minutes)
    for (const log of data.hoursLog ?? []) if (Number(log.hours) > 0) add(log.at, Number(log.hours) * 60)
    if (cardDone(card)) {
      const completion = data.completedAt || [...(data.activity ?? [])].reverse().find(a => /marked done|completed/i.test(a.action || '') && a.at)?.at
      if (completion) add(completion, 0, 1)
    }
  }
  for (const row of progress) {
    const data = dataOf(row)
    // Daily snapshots alone do not prove work: only explicit positive changes do.
    if (data.type === 'hours.logged' && Number(data.hours ?? data.delta) > 0) add(row.start_at || data.at || row.created_at, Number(data.hours ?? data.delta) * 60)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
export function studyStreak(cards, progress = [], today = dateKey(new Date())) {
  const days = new Set(activityDays(cards, progress).map(row => row.date))
  let cursor = days.has(today) ? today : addDays(today, -1), streak = 0
  while (days.has(cursor)) { streak++; cursor = addDays(cursor, -1) }
  return streak
}
export function safeMaterialUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const url = value.trim()
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url
  try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '' } catch { return '' }
}
export function youtubeEmbed(value) {
  const url = safeMaterialUrl(value)
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (!['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) return ''
    const id = host === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.match(/^\/embed\/([^/]+)/)?.[1]
    if (id && /^[\w-]{6,}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
    const list = parsed.searchParams.get('list')
    return list && /^[\w-]+$/.test(list) ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}` : ''
  } catch { return '' }
}
export function timerRemaining(timer, now = Date.now()) {
  const deadline = Date.parse(timer.deadlineAt)
  if (timer.running && Number.isFinite(deadline) && Number.isFinite(now)) return Math.max(0, Math.ceil((deadline - now) / 1000))
  const remaining = Number(timer.remainingSeconds)
  return Number.isFinite(remaining) ? Math.max(0, Math.round(remaining)) : 0
}
export function timerElapsed(timer, now = Date.now()) {
  const elapsed = Number.isFinite(Number(timer.elapsedMs)) ? Math.max(0, Number(timer.elapsedMs)) : 0
  if (!timer.running || !timer.segmentStartedAt) return elapsed
  const start = Date.parse(timer.segmentStartedAt), deadline = Date.parse(timer.deadlineAt)
  if (!Number.isFinite(start) || !Number.isFinite(deadline) || !Number.isFinite(now)) return elapsed
  return elapsed + Math.max(0, Math.min(now, deadline) - start)
}
export function minutesToLog(milliseconds) { return !Number.isFinite(milliseconds) || milliseconds <= 0 ? 0 : milliseconds / 60_000 }
export function localClock(iso) {
  if (!iso || Number.isNaN(Date.parse(iso))) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
}
export function sessionConflicts(sessions) {
  const timed = sessions.filter(s => s.start_at && s.end_at && Date.parse(s.end_at) > Date.parse(s.start_at)).sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
  const conflicts = []
  for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length && Date.parse(timed[j].start_at) < Date.parse(timed[i].end_at); j++) {
    if (Date.parse(timed[j].end_at) > Date.parse(timed[i].start_at)) conflicts.push([timed[i], timed[j]])
  }
  return conflicts
}
export function inputDateTime(iso) { const day = dateKey(iso), clock = localClock(iso); return day && clock ? `${day}T${clock}` : '' }
export function utcFromInput(value) {
  if (!value) return null
  const [date, time] = value.split('T')
  const result = londonDateTime(date, time)
  if (!result) throw new Error('That London time is invalid or ambiguous. Choose a different time or import an explicit UTC offset.')
  return result
}
export function cardDateFields(startDate, dueDate, startTime = '', dueTime = '') {
  if (startTime && !startDate) throw new Error('Choose a start date before adding a time.')
  if (dueTime && !dueDate) throw new Error('Choose a due date before adding a time.')
  return { start_date: startDate || null, end_date: dueDate || null,
    start_at: startTime ? utcFromInput(`${startDate}T${startTime}`) : null,
    end_at: dueTime ? utcFromInput(`${dueDate}T${dueTime}`) : null }
}
export function recordPayload(record, patch = {}) {
  record = record ?? {}
  return { title: titleOf(record), status: record.status || 'active', semester_id: record.semester_id || null, module_id: record.module_id || null, card_id: record.card_id || null,
    start_date: record.start_date || null, end_date: record.end_date || null, start_at: record.start_at || null, end_at: record.end_at || null, data: dataOf(record), ...patch }
}

export function sessionOccurrences(sessions, from, to) {
  if (!isDateKey(from) || !isDateKey(to) || from > to) return []
  // The server stores concrete occurrences; source recurrence is provenance only.
  return sessions.filter(session => {
    if (['cancelled', 'archived'].includes(session.status)) return false
    return itemOverlaps({ start: session.start_at || session.start_date, end: session.end_at || session.end_date, all_day: !session.start_at }, from, to)
  }).map(session => ({ ...session, occurrenceId: session.id })).sort((a, b) => String(a.start_at || a.start_date).localeCompare(String(b.start_at || b.start_date)))
}
export function sessionOnDay(session, day) { return itemOverlaps({ start: session.start_at || session.start_date, end: session.end_at || session.end_date, all_day: !session.start_at }, day, day) }
export function scheduledMinutes(sessions, from, to = from) {
  const lower = Date.parse(londonDateTime(from, '00:00')), upper = Date.parse(londonDateTime(addDays(to, 1), '00:00'))
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return 0
  return sessions.reduce((total, session) => {
    const start = Date.parse(session.start_at), end = Date.parse(session.end_at)
    return total + (Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.min(end, upper) - Math.max(start, lower)) / 60000 : 0)
  }, 0)
}
export function assessmentDay(row) {
  const exam = ['exam', 'examination'].includes(String(dataOf(row).type || dataOf(row).kind || dataOf(row).assessmentType).toLowerCase())
  return exam ? row.start_date || dateKey(row.start_at) || row.end_date || dateKey(row.end_at) : row.end_date || dateKey(row.end_at) || row.start_date || dateKey(row.start_at)
}
