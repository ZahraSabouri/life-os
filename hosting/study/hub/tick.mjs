// Ticking a step of a card, or marking a card done, from outside the Study hub's own page
// (the Life OS day). The change is the one the hub's page makes itself (useTrackerState.js:
// toggleChecklistItem and toggleDone), saved through the same store with the same revision
// check, and logged as the same event. A hub tab that is open learns of the save the way it
// learns of another hub tab's save, and reloads.
import { randomUUID } from 'node:crypto'
import { hubCards } from './cards.mjs'

export class TickError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// Who saved: an open hub tab ignores its own saves and reloads for anyone else's.
export const DAY_WRITER = 'life-os-day'

const plain = (value) => (value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {})
const named = (value) => typeof value === 'string' && value.length > 0 && value.length <= 300

// The change itself, on a copy of the hub's saved state. `step` names a checklist item; without
// it the whole card is marked done or not done.
export function tickState(state, plan, { card: cardId, step, done = true } = {}, now = new Date().toISOString()) {
  const card = hubCards(plan, state).find((row) => row.id === cardId)
  if (!card) throw new TickError(404, 'That card is no longer in the Study hub')
  const overlay = plain(plain(state.cards)[cardId])
  const logged = (action) => [{ id: `log-${randomUUID()}`, at: now, action, details: 'From the Life OS day' }, ...(Array.isArray(overlay.activity) ? overlay.activity : [])].slice(0, 80)
  const context = { cardTitle: card.title ?? '', moduleGroup: card.moduleGroup ?? '' }
  let next
  let event
  let notifications = state.notifications
  if (step !== undefined && step !== null && step !== '') {
    const item = card.checklist.find((row) => row.id === step)
    if (!item) throw new TickError(404, 'That step is no longer on the card')
    if (item.done === Boolean(done)) return { state, changed: false, card }
    next = { ...overlay, checklist: { ...plain(overlay.checklist), [step]: Boolean(done) }, activity: logged('Updated checklist'), updatedAt: now }
    event = { eventType: 'checklist_item.toggled', payload: { ...context, itemId: step, text: item.text, done: Boolean(done) } }
  } else {
    if (card.done === Boolean(done)) return { state, changed: false, card }
    const fallback = card.status && card.status !== 'Done' ? card.status : 'Backlog'
    next = {
      ...overlay, done: Boolean(done), status: done ? 'Done' : overlay.previousStatus ?? fallback,
      previousStatus: done ? fallback : overlay.previousStatus, activity: logged(done ? 'Marked done' : 'Marked not done'), updatedAt: now,
    }
    event = { eventType: 'card.done_changed', payload: { ...context, done: Boolean(done), previousStatus: card.status, status: done ? 'Done' : fallback } }
    // A finished card's reminders are read, as in the hub.
    if (done && state.notifications && typeof state.notifications === 'object') {
      notifications = Object.fromEntries(Object.entries(state.notifications).map(([id, note]) => [id, note?.cardId === cardId && !note.read ? { ...note, read: true } : note]))
    }
  }
  const nextState = { ...state, cards: { ...plain(state.cards), [cardId]: next }, ...(notifications === undefined ? {} : { notifications }), updatedAt: now }
  return {
    state: nextState, changed: true, card: hubCards(plan, nextState).find((row) => row.id === cardId),
    event: { id: `event-${randomUUID()}`, occurredAt: now, entityType: 'card', entityId: cardId, ...event },
  }
}

// A finished focus session on a card, recorded the way the hub's own timer records one
// (useTrackerState.js: logFocusSession): the minutes, the card's hours in quarter hours, a line
// in its activity, and the hub's event.
export function focusState(state, plan, { card: cardId, minutes } = {}, now = new Date().toISOString()) {
  const card = hubCards(plan, state).find((row) => row.id === cardId)
  if (!card) throw new TickError(404, 'That card is no longer in the Study hub')
  const elapsed = Math.round(Number(minutes))
  if (!Number.isFinite(elapsed) || elapsed < 1 || elapsed > 720) throw new TickError(400, 'Say how many minutes, between 1 and 720')
  const overlay = plain(plain(state.cards)[cardId])
  const hours = Math.max(0.25, Math.round((elapsed / 60) * 4) / 4)
  const before = Number(card.actualHours ?? 0) || 0
  const after = Math.round((before + hours) * 4) / 4
  const next = {
    ...overlay, actualHours: after,
    focusSessions: [{ id: `focus-${randomUUID()}`, at: now, minutes: elapsed, hours, from: 'life-os' }, ...(Array.isArray(overlay.focusSessions) ? overlay.focusSessions : [])].slice(0, 80),
    activity: [{ id: `log-${randomUUID()}`, at: now, action: 'Focus session', details: `${elapsed} min, from the Life OS timer` }, ...(Array.isArray(overlay.activity) ? overlay.activity : [])].slice(0, 80),
    updatedAt: now,
  }
  const nextState = { ...state, cards: { ...plain(state.cards), [cardId]: next }, updatedAt: now }
  return {
    state: nextState, changed: true, card: hubCards(plan, nextState).find((row) => row.id === cardId), hours: after,
    event: { id: `event-${randomUUID()}`, occurredAt: now, entityType: 'card', entityId: cardId, eventType: 'focus_session.completed',
      payload: { cardTitle: card.title ?? '', moduleGroup: card.moduleGroup ?? '', minutes: elapsed, hours, previousHours: before, hoursAfter: after, from: 'life-os' } },
  }
}

const summary = (card) => ({ id: card.id, title: card.title ?? '', done: Boolean(card.done), steps: card.checklist.map((item) => ({ id: item.id, text: item.text, done: Boolean(item.done) })) })

// Reads the hub's saved state, makes one change on a copy, and saves it with the revision that
// was read. If the hub's page saved in between, it reads again and redoes the change once.
function createChange({ hub, now, log }) {
  return async function change(semester, card, apply) {
    if (!hub) throw new TickError(503, 'The Study hub is not available')
    if (!named(semester) || !named(card)) throw new TickError(400, 'Say which card')
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [{ payload, revision }, plan] = await Promise.all([hub.readState(semester), hub.plan(semester)])
      const state = payload?.state
      if (!state || typeof state !== 'object') throw new TickError(409, 'The Study hub has nothing saved for that semester yet')
      const result = apply(state, plan, now())
      if (!result.changed) return { changed: false, card: summary(result.card), revision, writerId: DAY_WRITER }
      const saved = await hub.writeState(semester, result.state, { expectedRevision: revision, writerId: DAY_WRITER })
      if (saved.conflict) continue
      // The state is saved. The event is the hub's own record for its Review and Analytics pages.
      try { await hub.appendEvent(semester, result.event) } catch (error) { log(`Study hub: the event was not logged (${error.message})`) }
      return { changed: true, card: summary(result.card), revision: saved.revision, writerId: DAY_WRITER, ...(result.hours === undefined ? {} : { hours: result.hours }) }
    }
    throw new TickError(409, 'The Study hub is being changed somewhere else. Try again.')
  }
}

export function createStudyTick({ hub, now = () => new Date().toISOString(), log = console.error } = {}) {
  const change = createChange({ hub, now, log })
  return ({ semester, card, step, done = true } = {}) => change(semester, card, (state, plan, at) => tickState(state, plan, { card, step, done }, at))
}

export function createStudyFocus({ hub, now = () => new Date().toISOString(), log = console.error } = {}) {
  const change = createChange({ hub, now, log })
  return ({ semester, card, minutes } = {}) => change(semester, card, (state, plan, at) => focusState(state, plan, { card, minutes }, at))
}

// POST { semester, card, step?, done } for a tick; POST { semester, card, minutes } for a focus session.
export function createStudyTickHandler(run, shape = (body) => ({ semester: body.semester, card: body.card, step: body.step, done: body.done !== false })) {
  return async function handler(req, res) {
    try {
      res.json({ ok: true, ...(await run(shape(req.body ?? {}))) })
    } catch (error) {
      const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : error instanceof TickError ? error.status : 500
      if (status === 500) console.error('Study tick:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'The Study hub could not be changed. Try again.' : error.message })
    }
  }
}

// Moving a Study block (one day of the hub's plan) or a card's day from the Life OS day: the
// block's own rule moves (only a block planned for one day; a repeating one is moved in the hub),
// and the card's dates that sat on the old day follow. The plan is saved with its hash check and
// the state with its revision check, so nothing changed elsewhere is written over. The answer
// carries what puts it back.
const DAY = /^\d{4}-\d{2}-\d{2}$/
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/
const weekdayOf = (date) => ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1
function moveCardDates(state, cardId, from, to) {
  const next = structuredClone(state)
  const card = (Array.isArray(next.addedCards) ? next.addedCards : []).find((c) => c?.id === cardId)
  if (!card) return { state: next, changed: false }
  let changed = false
  for (const key of ['startDate', 'dueDate', 'planningWindowStart', 'planningWindowEnd']) if (card[key] === from) { card[key] = to; changed = true }
  return { state: next, changed }
}
export function createStudyMove({ hub, createHash }) {
  return async ({ semester, rule, card, from, date, start, end } = {}) => {
    if (!hub) throw new TickError(503, 'The Study hub is not available')
    if (!named(semester) || !DAY.test(String(date)) || !DAY.test(String(from))) throw new TickError(400, 'Say which semester and which days')
    let moved = null
    if (rule) {
      if (!named(rule) || !CLOCK.test(String(start)) || !CLOCK.test(String(end)) || end <= start) throw new TickError(400, 'Say which block and its new times')
      const plan = await hub.plan(semester)
      const rules = Array.isArray(plan?.scheduleRules) ? plan.scheduleRules : []
      const found = rules.find((r) => r?.id === rule)
      if (!found) throw new TickError(404, 'That Study block is not in the plan any more')
      if (found.from !== found.to || found.from !== from) throw new TickError(409, 'This Study block repeats; move it in the Study hub')
      moved = { rule, start: found.start, end: found.end }
      const scheduleRules = rules.map((r) => (r.id === rule ? { ...r, from: date, to: date, start, end, weekdays: [weekdayOf(date)] } : r))
      await hub.updatePlan(semester, { scheduleRules }, { expectedPlanHash: createHash('sha256').update(JSON.stringify(plan)).digest('hex') })
      card = card || found.cardId
    }
    if (card && named(card) && from !== date) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { payload, revision } = await hub.readState(semester)
        if (!payload?.state) break
        const result = moveCardDates(payload.state, card, from, date)
        if (!result.changed) break
        const saved = await hub.writeState(semester, result.state, { expectedRevision: revision, writerId: DAY_WRITER })
        if (!saved.conflict) break
        if (attempt === 1) throw new TickError(409, 'The Study hub is being changed somewhere else. Try again.')
      }
    }
    // What puts it back: the same call with the old day and times.
    return { moved: true, undo: { semester, ...(rule ? { rule, start: moved.start, end: moved.end } : {}), ...(card ? { card } : {}), from: date, date: from } }
  }
}
