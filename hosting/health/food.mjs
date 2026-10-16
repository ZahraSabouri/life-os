// The food side of Health: the UK recipes checked against what is at home in Budget, and a UK
// recipe added to her own recipes. Budget stays the owner of recipes and food at home: this reads
// its saved state, changes it with Budget's own functions and saves through Budget's own address
// with its revision check (the same way as hosting/home/shopping.mjs).
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import http from 'node:http'
import { UK_RECIPES, ukRecipe } from '../../code/life-os/shared/health/recipes.js'
import { recipeAgainstHome, matchesIngredient } from '../../code/life-os/shared/health/match.js'

export class FoodError extends Error {
  constructor(status, message) { super(message); this.name = 'FoodError'; this.status = status }
}

// Budget's rules, with its recipe and food-at-home functions.
export function loadFoodRules(budgetRoot) {
  const context = vm.createContext({ React: { createElement: () => null } })
  for (const name of ['core', 'seed', 'domain', 'types', 'meal-workflow-domain', 'food-domain']) vm.runInContext(fs.readFileSync(path.join(budgetRoot, 'app/src', `${name}.js`), 'utf8'), context)
  const pick = (name) => vm.runInContext(name, context)
  return { validate: pick('validateV4'), stockRows: pick('stockRows'), isFoodRow: pick('isFoodRow'), rankRecipes: pick('rankRecipes'), convertQty: pick('convertQty'), uid: pick('uid') }
}

// A part of what she keeps at home: a clove of a bulb, a slice of a loaf, a tin of a can.
const PART_OF = { clove: { bulb: 0.1 }, cloves: { bulb: 0.1 }, slice: { loaf: 0.05 }, slices: { loaf: 0.05 }, tin: { can: 1, tin: 1 }, tins: { can: 1, tin: 1 }, 'small tin': { can: 1, tin: 1 } }
const unitWord = (unit) => String(unit ?? '').toLowerCase().trim().replace(/s$/, '')
// Food at home, as the rows the matcher reads.
export function foodRows(rules, state) {
  return rules.stockRows(state).filter((row) => row.remaining > 0 && row.tracking !== 'durable' && rules.isFoodRow(state, row))
    .map((row) => ({ id: row.id, name: String(row.name ?? ''), remaining: row.remaining, unit: String(row.unit ?? ''), tracking: row.tracking, itemId: row.itemId ?? '' }))
}

// Each UK recipe against the food at home, and whether it is already one of her recipes.
export function foodView(rules, state) {
  if (!state || typeof state !== 'object') return { ideas: [], mine: [], atHome: 0 }
  const rows = foodRows(rules, state)
  const added = new Map((state.recipes ?? []).filter((r) => r.fromLibrary && !r.archived).map((r) => [r.fromLibrary, r.id]))
  const ideas = UK_RECIPES.map((recipe) => {
    const home = recipeAgainstHome(recipe, rows)
    return { id: recipe.id, ready: home.ready, missing: home.missing, have: home.lines.filter((l) => l.have.length).map((l) => ({ index: l.index, names: l.have })), haveCount: home.haveCount, needCount: home.needCount, added: added.get(recipe.id) ?? null }
  })
  let mine = []
  try {
    mine = rules.rankRecipes(state, {}).map((x) => ({ id: x.recipe.id, name: x.recipe.name, minutes: x.recipe.minutes || null, ready: x.ready, missing: x.missing.map((l) => l.ing.name), fromLibrary: x.recipe.fromLibrary ?? null }))
  } catch { mine = [] }
  return { ideas, mine, atHome: rows.length }
}

// One UK recipe as a Budget recipe. Each ingredient is linked to her own product when one is at
// home, in that product's unit where the recipe's unit cannot be converted to it; otherwise to
// the Budget kind of food it names. Staples and optional things do not block it.
export function recipeForBudget(rules, state, recipe, newId) {
  const rows = foodRows(rules, state)
  const kinds = new Set((state.productTypes ?? []).map((t) => t.id))
  const ingredients = recipe.ingredients.filter((ing) => Number(ing.qty) > 0 || ing.staple).map((ing) => {
    const line = { name: ing.name, quantity: Number(ing.qty) > 0 ? Number(ing.qty) : 1, unit: String(ing.unit ?? '') || 'item' }
    if (ing.optional || ing.staple) line.optional = true
    const row = rows.find((r) => matchesIngredient(ing, r.name))
    if (row) {
      if (row.itemId) line.itemId = row.itemId
      else line.name = row.name
      if (!rules.convertQty(1, row.unit, line.unit)) {
        // Whole things in the recipe ("2 eggs", "1 onion"): the same number of her product's unit.
        // A part of what she keeps ("2 cloves" of a bulb): that share of it. Anything else (grams
        // against a pack): one of it, with the recipe's own amount kept beside it to check.
        const qty = Number(ing.qty) > 0 ? Number(ing.qty) : 1
        const share = PART_OF[String(ing.unit ?? '').toLowerCase()]?.[unitWord(row.unit)]
        if (!String(ing.unit ?? '').trim()) line.quantity = qty
        else if (share) line.quantity = Math.round(qty * share * 100) / 100
        else { line.quantity = 1; line.amount = `${ing.qty ?? ''}${ing.unit ? ` ${ing.unit}` : ''}`.trim() }
        line.unit = row.unit || 'item'
      }
    } else if (ing.type && kinds.has(ing.type)) line.typeId = ing.type
    return line
  })
  return {
    id: newId, name: recipe.name, servings: recipe.serves, minutes: recipe.minutes, ingredients,
    steps: recipe.steps.join('\n'), notes: recipe.tip ?? '', source: recipe.nhs ? `A similar recipe: ${recipe.nhs.title}, NHS Healthier Families (${recipe.nhs.url})` : '',
    image: '', fromLibrary: recipe.id, diet: recipe.tags.filter((t) => ['vegetarian', 'vegan'].includes(t)), allergens: [...recipe.allergens],
  }
}

export function addRecipe(rules, state, id) {
  if (!state || typeof state !== 'object') throw new FoodError(409, 'Budget has nothing saved yet. Open Budget once, then try again.')
  const recipe = ukRecipe(id)
  if (!recipe) throw new FoodError(404, 'That recipe is not in the list')
  const already = (state.recipes ?? []).find((r) => r.fromLibrary === id && !r.archived)
  if (already) return { state, changed: false, result: { recipe: { id: already.id, name: already.name }, already: true } }
  const made = recipeForBudget(rules, state, recipe, rules.uid('recipe'))
  const next = { ...state, recipes: [...(state.recipes ?? []), made] }
  try { rules.validate(next) } catch (error) { throw new FoodError(400, error.message) }
  return { state: next, changed: true, result: { recipe: { id: made.id, name: made.name }, already: false } }
}

function request(port, method, pathname, body) {
  if (!Number.isInteger(port)) return Promise.reject(new FoodError(503, 'Budget is not running'))
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers: { host: `127.0.0.1:${port}`, accept: 'application/json', ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), 'x-planner-action': 'save' } : {}) } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => { let value = null; try { value = JSON.parse(data) } catch { /* not JSON */ } resolve({ status: res.statusCode, value }) })
      res.on('error', reject)
    })
    req.setTimeout(8000, () => req.destroy(new FoodError(504, 'Budget did not answer')))
    req.on('error', (error) => reject(error instanceof FoodError ? error : new FoodError(503, 'Budget is not running')))
    req.end(payload ?? undefined)
  })
}

export function createFood({ budgetRoot, getBudgetPort }) {
  let rules
  const read = async () => {
    rules ??= loadFoodRules(budgetRoot)
    const current = await request(getBudgetPort(), 'GET', '/api/state')
    if (current.status !== 200 || !current.value) throw new FoodError(503, 'Budget could not be read')
    return current.value
  }
  return {
    async view() { const current = await read(); return foodView(rules, current.state) },
    async add(id) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const current = await read()
        const { state, changed, result } = addRecipe(rules, current.state, id)
        if (!changed) return result
        const saved = await request(getBudgetPort(), 'PUT', '/api/state', { state, revision: current.revision })
        if (saved.status === 200) return result
        if (saved.status !== 409) throw new FoodError(saved.status === 400 ? 400 : 502, saved.value?.error || 'Budget refused the change')
      }
      throw new FoodError(409, 'Budget is being changed somewhere else. Try again.')
    },
  }
}

export function createFoodRouter({ express, food }) {
  const router = express.Router()
  const fail = (res, error) => {
    const status = error instanceof FoodError ? error.status : 500
    if (status === 500) console.error('Health food:', error.message)
    res.status(status).json({ ok: false, error: status === 500 ? 'Food could not be read from Budget. Try again.' : error.message })
  }
  router.get('/', async (_req, res) => { try { res.json({ ok: true, ...(await food.view()) }) } catch (error) { fail(res, error) } })
  router.post('/recipes', async (req, res) => {
    try { res.status(201).json({ ok: true, ...(await food.add(String(req.body?.id ?? ''))) }) } catch (error) { fail(res, error) }
  })
  return router
}
