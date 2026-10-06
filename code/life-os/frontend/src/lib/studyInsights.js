import { addDays, cardActionable, cardChecklist, cardDone, cardDue, cardEstimate, cardHours, cardLane, cardStart, dataOf, dateKey, isDateKey, scheduledMinutes, sessionOnDay, studyActive, titleOf, weekStart } from './study.js'

const rows = value => Array.isArray(value) ? value : []
const finite = value => value !== null && value !== '' && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : null
const round = value => Math.round(value * 10000) / 10000
const dayOf = value => isDateKey(value) ? value : dateKey(value)
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000)
const reminder = card => dataOf(card).kind === 'reminder' || rows(dataOf(card).tags).includes('date-watch')
function parentsAvailable(record, parents, excludeCompleted = false) {
  const available = parent => !parent || studyActive(parent) && (!excludeCompleted || !['done', 'completed'].includes(parent.status)
    && dataOf(parent).done !== true && dataOf(parent).completed !== true)
  const module = parents.modules?.find(row => row.id === record.module_id)
  return available(module) && available(parents.semesters?.find(row => row.id === record.semester_id))
    && available(parents.semesters?.find(row => row.id === module?.semester_id))
}

export function recordedCompletionDay(card) {
  if (!cardDone(card)) return ''
  const explicit = dayOf(dataOf(card).completedAt)
  if (explicit) return explicit
  // Dates/updated_at do not prove completion. Reopened work is currently open;
  // when it is completed again, use its latest explicit completion marker.
  const markers = rows(dataOf(card).activity).filter(row => /^(marked done|completed)$/i.test(row.action || '')
    || (/^moved card$/i.test(row.action || '') && row.details === 'Done'))
    .map(row => dayOf(row.at)).filter(Boolean).sort()
  return markers.at(-1) || ''
}

export function studyWorkFacts(cards, progress = []) {
  const byId = new Map(cards.map(card => [card.id, card]))
  const days = new Map(), seen = new Set()
  const add = (key, at, hours = 0, minutes = 0, focus = 0, card = null) => {
    const day = dayOf(at)
    if (!day || seen.has(key)) return
    seen.add(key)
    const fact = days.get(day) || { day, loggedHours: 0, focusMinutes: 0, focusSessions: 0, completedCards: [] }
    fact.loggedHours += hours; fact.focusMinutes += minutes; fact.focusSessions += focus
    if (card) fact.completedCards.push(card)
    days.set(day, fact)
  }
  for (const card of cards) {
    const data = dataOf(card), completed = recordedCompletionDay(card)
    if (completed) add(`complete:${card.id}`, completed, 0, 0, 0, card)
    rows(data.focusSessions).forEach((session, index) => {
      const minutes = finite(session.minutes)
      if (minutes === null || minutes <= 0) return
      // Older saved sessions store their rounded credited hours explicitly.
      const credited = finite(session.hours)
      add(`focus:${card.id}:${session.id || index}`, session.at || session.created_at,
        credited !== null && credited >= 0 ? credited : minutes / 60, minutes, 1)
    })
    rows(data.hoursLog).forEach((log, index) => {
      const hours = finite(log.hours)
      if (hours !== null && hours !== 0) add(`hours:${card.id}:${log.id || index}`, log.at, hours)
    })
  }
  for (const record of progress) {
    // Preserved source logs contain manual hour deltas; snapshots contain
    // aggregates and are never interpreted as work performed on that day.
    const data = dataOf(record), source = data.source && typeof data.source === 'object' ? data.source : data
    if ((source.eventType || source.type) !== 'hours.logged') continue
    const card = byId.get(record.card_id) || (source.entityId ? cards.find(row => dataOf(row).sourceId === source.entityId) : null)
    if (!card) continue
    const delta = finite(source.payload?.deltaHours ?? source.deltaHours ?? source.delta)
    if (delta === null || delta === 0) continue
    const id = source.id || record.id
    if (id && rows(dataOf(card).hoursLog).some(log => log.id === id)) continue
    add(`progress:${record.id || id}`, source.occurredAt || source.at || record.start_at, delta)
  }
  const result = [...days.values()].sort((a, b) => a.day.localeCompare(b.day))
    .map(row => ({ ...row, loggedHours: round(row.loggedHours) }))
  const datedHours = round(result.reduce((sum, row) => sum + row.loggedHours, 0))
  const totalHours = round(cards.reduce((sum, card) => sum + cardHours(card), 0))
  return { days: result, datedHours, totalHours, undatedHours: round(Math.max(0, totalHours - datedHours)),
    hoursMismatch: datedHours > totalHours + 0.0001,
    undatedDone: cards.filter(card => cardDone(card) && !recordedCompletionDay(card)).length }
}

export function studyDaySummary(cards, progress, today) {
  const facts = studyWorkFacts(cards, progress)
  const day = facts.days.find(row => row.day === today)
  return { ...(day || { day: today, loggedHours: 0, focusMinutes: 0, focusSessions: 0, completedCards: [] }),
    undatedHours: facts.undatedHours, undatedDone: facts.undatedDone }
}

export function studyWorkStreak(cards, progress, today) {
  const active = new Set(studyWorkFacts(cards, progress).days.filter(row => row.day <= today
    && (row.focusMinutes > 0 || row.loggedHours > 0 || row.completedCards.length > 0)).map(row => row.day))
  let cursor = active.has(today) ? today : addDays(today, -1), current = 0
  while (active.has(cursor)) { current++; cursor = addDays(cursor, -1) }
  return { current, activeDays: active.size, activeToday: active.has(today) }
}

export function moduleEffort(cards, modules, parents = {}) {
  const activeModules = modules.filter(module => studyActive(module) && parentsAvailable(module, parents))
  const linked = cards.filter(card => studyActive(card) && activeModules.some(module => module.id === card.module_id))
  const totalHours = linked.reduce((sum, card) => sum + cardHours(card), 0)
  const allocations = activeModules.map(module => {
    const selected = linked.filter(card => card.module_id === module.id)
    const hours = selected.reduce((sum, card) => sum + cardHours(card), 0)
    const rawShare = finite(dataOf(module).effortTargetPercent), rawHours = finite(dataOf(module).targetHours)
    const targetPercent = rawShare !== null && rawShare >= 0 && rawShare <= 100 ? rawShare : null
    const targetHours = rawHours !== null && rawHours >= 0 ? rawHours : null
    const actualPercent = totalHours > 0 ? hours / totalHours * 100 : null
    return { module, hours: round(hours), estimatedHours: round(selected.reduce((sum, card) => sum + cardEstimate(card), 0)),
      targetPercent, targetHours, actualPercent: actualPercent === null ? null : round(actualPercent),
      deficit: actualPercent !== null && targetPercent !== null ? Math.max(0, targetPercent - actualPercent) : 0,
      remainingHours: targetHours === null ? null : round(Math.max(0, targetHours - hours)) }
  })
  const targetTotal = allocations.reduce((sum, row) => sum + (row.targetPercent || 0), 0)
  return { rows: allocations, totalHours: round(totalHours), targetTotal, inconsistentTargets: targetTotal > 100.0001,
    configured: allocations.some(row => row.targetPercent !== null || row.targetHours !== null),
    unassignedHours: round(cards.filter(card => !card.module_id).reduce((sum, card) => sum + cardHours(card), 0)) }
}

export function studyFocusPicks(cards, today, { modules = [], parents = {}, contextCards = cards, priorities = ['Critical', 'High', 'Medium', 'Low'], count = 3 } = {}) {
  const effort = moduleEffort(contextCards, modules, parents)
  const candidates = cards.filter(card => cardActionable(card, parents) && cardLane(card) !== 'Waiting / Blocked' && card.status !== 'blocked'
    && (!cardStart(card) || cardStart(card) <= today))
  const ranked = candidates.map(card => {
    const due = cardDue(card), start = cardStart(card), lane = cardLane(card), reasons = []
    let score = 0
    if (due && due < today) { score += 400 + Math.min(14, daysBetween(due, today)); reasons.push('The deadline has passed; finish it, defer it or mark it waiting.') }
    else if (due === today) { score += 300; reasons.push('Due today.') }
    else if (due && due <= addDays(today, 3)) { score += 200; reasons.push('Due in the next three days.') }
    else if (due && due <= addDays(today, 7)) { score += 100; reasons.push('Due in the next seven days.') }
    if (lane === 'Today') { score += 80; reasons.push('You put this in Today.') }
    if (lane === 'Deep Work') { score += 50; reasons.push('Already in your Deep Work lane.') }
    if (lane === 'This Week') { score += 30; reasons.push('Planned in This Week.') }
    if (start && start <= today && (!due || due > today)) { score += 20; reasons.push('Its planned start has arrived.') }
    const priority = priorities.indexOf(dataOf(card).priority)
    if (priority >= 0) { score += (priorities.length - priority) * 10; if (priority === 0) reasons.push(`Your highest priority: ${priorities[0]}.`) }
    const checks = cardChecklist(card), ticked = checks.filter(row => row.done).length
    if (ticked && ticked < checks.length) { score += 15; reasons.push(`${ticked} of ${checks.length} checklist steps are already done.`) }
    const target = effort.rows.find(row => row.module.id === card.module_id)
    if (!effort.inconsistentTargets && target?.deficit > 0) {
      score += Math.min(25, target.deficit)
      reasons.push(`${titleOf(target.module)} has ${target.actualPercent.toFixed(1)}% of logged module hours against your ${target.targetPercent}% target.`)
    }
    if (!reasons.length) reasons.push('An open, unblocked card in the current selection.')
    return { card, score, reasons }
  }).sort((a, b) => b.score - a.score || (cardDue(a.card) || '9999').localeCompare(cardDue(b.card) || '9999') || titleOf(a.card).localeCompare(titleOf(b.card)))
  return { picks: ranked.slice(0, count), queue: ranked.slice(count, count + 6), effort }
}

export function studyExecution(sessions, today, now = Date.now(), parents = {}) {
  const available = sessions.filter(session => studyActive(session) && !['done', 'completed'].includes(session.status)
    && parentsAvailable(session, parents, true))
  const timed = available.filter(session => Number.isFinite(Date.parse(session.start_at))).sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
  const current = timed.filter(session => Date.parse(session.start_at) <= now && session.end_at && Date.parse(session.end_at) > now)
  const next = timed.find(session => Date.parse(session.start_at) > now) || null
  return { current, next, dateOnly: available.filter(session => !session.start_at && sessionOnDay(session, today)),
    plannedMinutesToday: scheduledMinutes(available, today) }
}

function trackedCards(cards, parents) {
  return cards.filter(card => studyActive(card) && !reminder(card)
    && parentsAvailable(card, parents))
}

export function studyTrends({ cards, progress = [], semester = null, parents = {}, today, grain = 'day' }) {
  const tracked = trackedCards(cards, parents), facts = studyWorkFacts(tracked, progress)
  const finish = isDateKey(semester?.end_date) ? semester.end_date : ''
  const knownDates = [...tracked.flatMap(card => [cardStart(card), cardDue(card)]), ...facts.days.map(row => row.day)].filter(isDateKey).sort()
  const originalFrom = isDateKey(semester?.start_date) ? semester.start_date : knownDates[0] || today
  const to = finish && finish > today ? finish : today
  // A view window is bounded independently of the stored history.
  const from = daysBetween(originalFrom, to) > 730 ? addDays(to, -730) : originalFrom
  const byDay = new Map(facts.days.map(row => [row.day, row]))
  let completed = facts.days.filter(row => row.day < from).reduce((sum, row) => sum + row.completedCards.length, 0)
  let logged = facts.days.filter(row => row.day < from).reduce((sum, row) => sum + row.loggedHours, 0)
  const series = []
  for (let day = from, index = 0; isDateKey(day) && day <= to && index <= 730; day = addDays(day, 1), index++) {
    const fact = byDay.get(day), past = day <= today
    const due = tracked.filter(card => (cardDue(card) || cardStart(card)) === day)
    completed += fact?.completedCards.length || 0; logged += fact?.loggedHours || 0
    const planned = tracked.filter(card => isDateKey(cardDue(card)) && cardDue(card) <= day).length
    const span = finish && originalFrom < finish ? daysBetween(originalFrom, finish) : 0
    series.push({ day, planned, completed: past ? completed : null,
      finishReference: span > 0 ? round(tracked.length * Math.min(1, Math.max(0, daysBetween(originalFrom, day) / span))) : null,
      estimatedHours: round(due.reduce((sum, card) => sum + cardEstimate(card), 0)),
      loggedHours: past ? round(fact?.loggedHours || 0) : null, cumulativeLoggedHours: past ? round(logged) : null })
  }
  const buckets = new Map()
  for (const point of series) {
    const key = grain === 'week' ? weekStart(point.day) : grain === 'month' ? point.day.slice(0, 7) : point.day
    const previous = buckets.get(key)
    buckets.set(key, { ...point, bucket: key, estimatedHours: round((previous?.estimatedHours || 0) + point.estimatedHours),
      loggedHours: point.loggedHours === null && previous?.loggedHours == null ? null : round((previous?.loggedHours || 0) + (point.loggedHours || 0)),
      // The actual cumulative value stops at the last observed day even when
      // its week/month also contains future planned dates.
      completed: point.completed ?? previous?.completed ?? null,
      cumulativeLoggedHours: point.cumulativeLoggedHours ?? previous?.cumulativeLoggedHours ?? null,
      observedThrough: point.completed === null ? previous?.observedThrough || null : point.day })
  }
  const remaining = tracked.filter(card => !cardDone(card)).length
  const daysLeft = finish && finish >= today ? daysBetween(today, finish) + 1 : null
  const recentStart = addDays(today, -6)
  const recentDone = facts.days.filter(row => row.day >= recentStart && row.day <= today).reduce((sum, row) => sum + row.completedCards.length, 0)
  return { series: [...buckets.values()], tracked, facts, from, to, finish, rangeLimited: from !== originalFrom,
    undatedPlanned: tracked.filter(card => !isDateKey(cardDue(card))).length, remaining, daysLeft,
    requiredPerDay: daysLeft === null ? null : round(remaining / daysLeft), recentPerDay: round(recentDone / 7) }
}
