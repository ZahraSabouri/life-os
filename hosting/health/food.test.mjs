// node --test hosting/health/food.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { loadFoodRules, foodView, addRecipe, recipeForBudget } from './food.mjs'

const budgetRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../budget-management')
const rules = loadFoodRules(budgetRoot)
// A Budget state made by Budget's own code, with a few things at home.
function home() {
  const c = vm.createContext({ React: { createElement: () => null } })
  for (const f of ['core', 'seed', 'domain', 'types']) vm.runInContext(fs.readFileSync(path.join(budgetRoot, 'app/src', `${f}.js`), 'utf8'), c)
  const s = vm.runInContext('migrateV4(defaultState())', c)
  const lot = (id, name, unit, quantity, tracking = 'count') => vm.runInContext('makeLot', c)({ id, name, unit, quantity, tracking, categoryId: 'fruit-vegetables', location: 'Fridge' })
  s.lots.push(lot('eggs', 'Free range eggs', 'egg', 6), lot('onion', 'Red onion', 'onion', 2), lot('garlic', 'Garlic', 'bulb', 1), lot('drink', 'Raspberry oat drink', 'carton', 1))
  return JSON.parse(JSON.stringify(s))
}

test('the UK recipes are checked against what is at home, by whole words', () => {
  const view = foodView(rules, home())
  const shakshuka = view.ideas.find((x) => x.id === 'shakshuka')
  assert.equal(shakshuka.ready, false)
  assert.deepEqual(shakshuka.missing, ['Red peppers', 'Tinned chopped tomatoes', 'Wholemeal bread'])
  assert.ok(shakshuka.have.some((h) => h.names.includes('Red onion')))
  const porridge = view.ideas.find((x) => x.id === 'porridge-berries')
  assert.ok(porridge.missing.includes('Porridge oats'), 'an oat drink is not oats')
  assert.ok(view.atHome >= 4, 'the four added are counted with what a new plan starts with')
})

test('adding one makes a Budget recipe in her own units, once', () => {
  const state = home()
  const made = recipeForBudget(rules, state, { ...UK('shakshuka') }, 'r1')
  const garlic = made.ingredients.find((i) => i.name === 'Garlic')
  assert.equal(garlic.unit, 'bulb'); assert.equal(garlic.quantity, 0.2, '2 cloves of a bulb')
  const eggs = made.ingredients.find((i) => /egg/i.test(i.name))
  assert.equal(eggs.unit, 'egg'); assert.equal(eggs.quantity, 4)
  assert.ok(made.ingredients.filter((i) => i.optional).length >= 2, 'spices and oil do not block it')
  const first = addRecipe(rules, state, 'shakshuka')
  assert.equal(first.changed, true); assert.equal(first.state.recipes.at(-1).fromLibrary, 'shakshuka')
  const again = addRecipe(rules, first.state, 'shakshuka')
  assert.equal(again.changed, false); assert.equal(again.result.already, true)
  assert.throws(() => addRecipe(rules, state, 'no-such-recipe'), /not in the list/)
})

import { ukRecipe } from '../../code/life-os/shared/health/recipes.js'
function UK(id) { return ukRecipe(id) }
