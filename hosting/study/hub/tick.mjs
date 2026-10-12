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

const summary = (card) => ({ id: card.id, title: card.title ?? '', done: Boolean(card.done), steps: card.checklist.map((item) => ({ id: item.id, text: item.text, done: Boolean(item.done) })) })

export function createStudyTick({ hub, now = () => new Date().toISOString(), log = console.error } = {}) {
  return async function tick({ semester, card, step, done = true } = {}) {
    if (!hub) throw new TickError(503, 'The Study hub is not available')
    if (!named(semester) || !named(card)) throw new TickError(400, 'Say which card')
    // If the hub's page saved in between, read again and redo the change once.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [{ payload, revision }, plan] = await Promise.all([hub.readState(semester), hub.plan(semester)])
      const state = payload?.state
      if (!state || typeof state !== 'object') throw new TickError(409, 'The Study hub has nothing saved for that semester yet')
      const result = tickState(state, plan, { card, step, done }, now())
      if (!result.changed) return { changed: false, card: summary(result.card), revision, writerId: DAY_WRITER }
      const saved = await hub.writeState(semester, result.state, { expectedRevision: revision, writerId: DAY_WRITER })
      if (saved.conflict) continue
      // The state is saved. The event is the hub's own record for its Review and Analytics pages.
      try { await hub.appendEvent(semester, result.event) } catch (error) { log(`Study tick: the event was not logged (${error.message})`) }
      return { changed: true, card: summary(result.card), revision: saved.revision, writerId: DAY_WRITER }
    }
    throw new TickError(409, 'The Study hub is being changed somewhere else. Try again.')
  }
}

// POST { semester, card, step?, done }.
export function createStudyTickHandler(tick) {
  return async function handler(req, res) {
    try {
      const body = req.body ?? {}
      res.json({ ok: true, ...(await tick({ semester: body.semester, card: body.card, step: body.step, done: body.done !== false })) })
    } catch (error) {
      const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : error instanceof TickError ? error.status : 500
      if (status === 500) console.error('Study tick:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'The Study hub could not be changed. Try again.' : error.message })
    }
  }
}
