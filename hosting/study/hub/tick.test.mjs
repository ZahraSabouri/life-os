import test from 'node:test'
import assert from 'node:assert/strict'
import { createStudyTick, DAY_WRITER, TickError, tickState } from './tick.mjs'
import { hubCards } from './cards.mjs'

const NOW = '2026-10-12T17:40:00.000Z'
const plan = { baseCards: [{ id: 'base', title: 'Prepared card', status: 'Backlog', checklist: ['Read', 'Write'] }] }
const state = () => ({
  version: 3, updatedAt: '2026-10-12T09:00:00.000Z',
  addedCards: [{ id: 'bayes', title: 'Bayes table', moduleGroup: 'MAT022', status: 'Planned', checklist: [{ id: 's1', text: 'Draw the table' }, { id: 's2', text: 'Check the denominator' }] }],
  cards: { bayes: { checklist: { s1: true }, activity: [{ id: 'log-old', at: '2026-10-11T10:00:00.000Z', action: 'Updated checklist', details: '' }], userTags: ['core'] } },
  notifications: { n1: { cardId: 'bayes', read: false }, n2: { cardId: 'base', read: false } },
  settings: { theme: 'light' },
})
const card = (value, id) => hubCards(plan, value).find((row) => row.id === id)

test('a step is ticked the way the hub ticks it: only that card\'s overlay changes, and it is logged', () => {
  const before = state()
  const frozen = JSON.stringify(before)
  const result = tickState(before, plan, { card: 'bayes', step: 's2', done: true }, NOW)
  assert.equal(JSON.stringify(before), frozen)
  assert.equal(result.changed, true)
  assert.deepEqual(result.state.cards.bayes.checklist, { s1: true, s2: true })
  assert.deepEqual(result.state.cards.bayes.userTags, ['core'])          // her own data on the card is kept
  assert.deepEqual(result.state.cards.bayes.activity.map((entry) => [entry.action, entry.details]), [['Updated checklist', 'From the Life OS day'], ['Updated checklist', '']])
  assert.equal(result.state.updatedAt, NOW)
  assert.deepEqual([result.state.settings, result.state.addedCards, result.state.notifications], [before.settings, before.addedCards, before.notifications])
  assert.deepEqual(card(result.state, 'bayes').checklist.map((item) => item.done), [true, true])
  assert.deepEqual({ ...result.event, id: 'x' }, { id: 'x', occurredAt: NOW, entityType: 'card', entityId: 'bayes', eventType: 'checklist_item.toggled', payload: { cardTitle: 'Bayes table', moduleGroup: 'MAT022', itemId: 's2', text: 'Check the denominator', done: true } })
})

test('a step can be unticked, a prepared card\'s step is found by its made-up id, and no change is no save', () => {
  const unticked = tickState(state(), plan, { card: 'bayes', step: 's1', done: false }, NOW)
  assert.deepEqual(card(unticked.state, 'bayes').checklist.map((item) => item.done), [false, false])
  const prepared = tickState(state(), plan, { card: 'base', step: 'base-check-1', done: true }, NOW)
  assert.deepEqual(card(prepared.state, 'base').checklist.map((item) => [item.text, item.done]), [['Read', false], ['Write', true]])
  const same = tickState(state(), plan, { card: 'bayes', step: 's1', done: true }, NOW)
  assert.equal(same.changed, false)
  assert.equal(same.event, undefined)
})

test('a card is marked done and not done as in the hub: its status is kept for the way back, its reminders are read', () => {
  const done = tickState(state(), plan, { card: 'bayes', done: true }, NOW)
  assert.deepEqual([done.state.cards.bayes.done, done.state.cards.bayes.status, done.state.cards.bayes.previousStatus], [true, 'Done', 'Planned'])
  assert.deepEqual(done.state.notifications, { n1: { cardId: 'bayes', read: true }, n2: { cardId: 'base', read: false } })
  assert.equal(done.event.eventType, 'card.done_changed')
  assert.equal(card(done.state, 'bayes').done, true)
  const back = tickState(done.state, plan, { card: 'bayes', done: false }, NOW)
  assert.deepEqual([back.state.cards.bayes.done, back.state.cards.bayes.status], [false, 'Planned'])
  assert.deepEqual(back.state.cards.bayes.checklist, { s1: true })       // her ticks are untouched
})

test('a card or a step that is gone is refused with a plain reason', () => {
  assert.throws(() => tickState(state(), plan, { card: 'gone', step: 's1' }, NOW), (error) => error instanceof TickError && error.status === 404 && /card/.test(error.message))
  assert.throws(() => tickState(state(), plan, { card: 'bayes', step: 'gone' }, NOW), (error) => error instanceof TickError && error.status === 404 && /step/.test(error.message))
})

// A stand-in for the hub's store: one semester, a revision, a list of saves and events.
function fakeHub({ conflictOnce = false } = {}) {
  const hub = { revision: 7, state: state(), saves: [], events: [] }
  let conflict = conflictOnce
  return Object.assign(hub, {
    readState: async () => ({ revision: hub.revision, payload: { state: hub.state } }),
    plan: async () => plan,
    writeState: async (_semester, next, { expectedRevision, writerId }) => {
      if (conflict) { conflict = false; hub.revision += 1; hub.state = { ...hub.state, settings: { theme: 'dark' } }; return { conflict: true, revision: hub.revision } }
      if (expectedRevision !== hub.revision) return { conflict: true, revision: hub.revision }
      hub.revision += 1; hub.state = next; hub.saves.push({ writerId, revision: hub.revision })
      return { revision: hub.revision }
    },
    appendEvent: async (_semester, event) => { hub.events.push(event) },
  })
}

test('the tick is saved with the revision that was read, under the day\'s own name, and its event is logged', async () => {
  const hub = fakeHub()
  const result = await createStudyTick({ hub, now: () => NOW })({ semester: 'autumn', card: 'bayes', step: 's2', done: true })
  assert.deepEqual([result.changed, result.revision, result.writerId], [true, 8, DAY_WRITER])
  assert.deepEqual(result.card.steps.map((step) => step.done), [true, true])
  assert.deepEqual(hub.saves, [{ writerId: DAY_WRITER, revision: 8 }])
  assert.deepEqual(hub.events.map((event) => event.eventType), ['checklist_item.toggled'])
  // Already ticked: nothing is saved and nothing is logged.
  const again = await createStudyTick({ hub, now: () => NOW })({ semester: 'autumn', card: 'bayes', step: 's2', done: true })
  assert.deepEqual([again.changed, again.revision, hub.saves.length, hub.events.length], [false, 8, 1, 1])
})

test('if the hub\'s page saved in between, the tick is redone on what it saved, not over it', async () => {
  const hub = fakeHub({ conflictOnce: true })
  const result = await createStudyTick({ hub, now: () => NOW })({ semester: 'autumn', card: 'bayes', step: 's2', done: true })
  assert.equal(result.changed, true)
  assert.equal(hub.state.settings.theme, 'dark')                          // what the hub saved in between is kept
  assert.deepEqual(hub.state.cards.bayes.checklist, { s1: true, s2: true })
  await assert.rejects(createStudyTick({ hub })({ semester: '', card: 'bayes' }), (error) => error instanceof TickError && error.status === 400)
  await assert.rejects(createStudyTick({})({ semester: 'autumn', card: 'bayes' }), (error) => error instanceof TickError && error.status === 503)
})
