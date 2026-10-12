import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { addToList, loadBudgetRules, parseItem, ShoppingError, tickLine } from './shopping.mjs'

// Budget's own rules, from Budget's own files: a change that passes here is one Budget accepts.
const rules = loadBudgetRules(path.join(import.meta.dirname, '../../budget-management'))
const DATE = '2026-10-12'
// Budget's rules run in their own sandbox; a plain copy makes their results comparable here.
const plainCopy = (value) => JSON.parse(JSON.stringify(value))
const state = (extra = {}) => ({
  version: 4, resources: [], expenses: [], meals: {}, budgets: {}, categories: [{ id: 'personal-hygiene', name: 'Personal hygiene', pool: 'other' }, { id: 'dairy-eggs', name: 'Dairy and eggs', pool: 'grocery' }, { id: 'uncategorised', name: 'Uncategorised', pool: 'unresolved' }],
  items: [{ id: 'i1', name: 'Eggs', categoryId: 'dairy-eggs' }], lists: [], receipts: [], lots: [], stockEvents: [], mealEntries: [], recipes: [],
  subscriptions: [], goals: [], adjustments: [], resourceMeta: {}, savingIntentions: {}, categoryTargets: {}, shops: [{ id: 'shop-lidl', name: 'Lidl', kind: 'supermarket', photo: '', area: '', website: '', notes: '', aliases: [] }], productTypes: [],
  ...extra,
})

test('a typed thing to buy: a quantity when one is typed, otherwise one', () => {
  assert.deepEqual(parseItem('buy milk'), { name: 'milk', quantity: 1, unit: 'item', note: '', category: '' })
  assert.deepEqual(parseItem('6 eggs'), { name: 'eggs', quantity: 6, unit: 'item', note: '', category: '' })
  assert.deepEqual(parseItem('rice x2'), { name: 'rice', quantity: 2, unit: 'item', note: '', category: '' })
  assert.deepEqual(parseItem('500 g mince'), { name: 'mince', quantity: 500, unit: 'g', note: '', category: '' })
  assert.deepEqual(parseItem('Bin liners / trash bags'), { name: 'Bin liners / trash bags', quantity: 1, unit: 'item', note: '', category: '' })
  assert.deepEqual(parseItem({ name: ' Shampoo ', quantity: 0, category: 'Personal hygiene' }), { name: 'Shampoo', quantity: 1, unit: 'item', note: '', category: 'Personal hygiene' })
})

test('with no list yet, one is made for the day and the things go on it, in Budget\'s own shape', () => {
  const before = state()
  const frozen = JSON.stringify(before)
  const { state: next, changed, result } = addToList(rules, before, ['6 eggs', 'rice', { name: 'Shampoo', category: 'Personal hygiene' }, 'Eggs'], { date: DATE })
  assert.equal(JSON.stringify(before), frozen)
  assert.equal(changed, true)
  assert.deepEqual(result.added, ['eggs', 'rice', 'Shampoo'])
  assert.deepEqual(result.skipped, ['Eggs'])
  assert.deepEqual({ ...result.list, id: 'x' }, { id: 'x', name: 'Shopping list', date: DATE, toBuy: 3, created: true })
  assert.deepEqual(plainCopy(next.lists[0].lines).map((line) => [line.name, line.quantity, line.unit, line.categoryId, line.status, line.priority]), [
    ['eggs', 6, 'item', 'dairy-eggs', 'planned', 'needed'],          // the catalogue knows eggs
    ['rice', 1, 'item', 'uncategorised', 'planned', 'needed'],       // not in the catalogue, no category named
    ['Shampoo', 1, 'item', 'personal-hygiene', 'planned', 'needed'], // the category was named
  ])
  rules.validate(next)
})

test('the next thing goes on the list that is waiting, a named list is used or made, and a shop is matched', () => {
  const first = addToList(rules, state(), ['eggs'], { date: DATE }).state
  const second = addToList(rules, first, ['onions'], { date: '2026-10-13' })
  assert.equal(second.state.lists.length, 1)
  assert.deepEqual(plainCopy(second.state.lists[0].lines).map((line) => line.name), ['eggs', 'onions'])
  assert.equal(second.result.list.created, false)
  const named = addToList(rules, second.state, ['Bicycle'], { date: DATE, list: 'To buy sometime', shop: 'lidl' })
  assert.deepEqual(plainCopy(named.state.lists).map((list) => [list.name, list.merchant, list.shopId ?? null, list.lines.length]), [['Shopping list', '', null, 2], ['To buy sometime', 'Lidl', 'shop-lidl', 1]])
  rules.validate(named.state)
  const again = addToList(rules, named.state, ['bicycle'], { date: DATE, list: 'to buy sometime' })
  assert.equal(again.changed, false)
  assert.deepEqual(again.result.skipped, ['bicycle'])
})

test('nothing to buy, a missing day, or a Budget with nothing saved is refused with a plain reason', () => {
  assert.throws(() => addToList(rules, state(), ['  '], { date: DATE }), (error) => error instanceof ShoppingError && error.status === 400)
  assert.throws(() => addToList(rules, state(), ['eggs'], { date: 'today' }), (error) => error instanceof ShoppingError && error.status === 400)
  assert.throws(() => addToList(rules, null, ['eggs'], { date: DATE }), (error) => error instanceof ShoppingError && error.status === 409)
})

test('a thing is ticked off with no price and no receipt, and can be put back exactly', () => {
  const before = addToList(rules, state(), ['eggs', 'rice'], { date: DATE }).state
  const [list] = before.lists
  const eggs = list.lines[0]
  const ticked = tickLine(rules, before, { list: list.id, line: eggs.id, done: true, date: DATE })
  assert.equal(ticked.changed, true)
  assert.deepEqual(ticked.result, { item: { id: eggs.id, name: 'eggs', done: true }, list: { id: list.id, name: 'Shopping list', toBuy: 1 } })
  assert.deepEqual(plainCopy(ticked.state.lists[0].lines).map((line) => [line.name, line.status, line.gotOn ?? null]), [['eggs', 'bought', DATE], ['rice', 'planned', null]])
  // Nothing is spent and nothing is put in the cupboard: only a receipt does that.
  assert.deepEqual([ticked.state.receipts.length, ticked.state.expenses.length, ticked.state.lots.length], [0, 0, 0])
  rules.validate(ticked.state)
  // Ticking what is already ticked changes nothing; putting it back restores the list as it was.
  assert.equal(tickLine(rules, ticked.state, { list: list.id, line: eggs.id, done: true, date: DATE }).changed, false)
  const back = tickLine(rules, ticked.state, { list: list.id, line: eggs.id, done: false, date: DATE })
  assert.deepEqual(plainCopy(back.state), plainCopy(before))
  assert.throws(() => tickLine(rules, before, { list: list.id, line: 'gone', done: true }), (error) => error instanceof ShoppingError && error.status === 404)
})
