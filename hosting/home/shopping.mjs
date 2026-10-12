// Adds things to buy to Budget's shopping list from anywhere in Life OS.
//
// Budget stays the owner of the list. This reads its saved state, makes the change with
// Budget's own functions (the same files its page and its server run), and saves through
// Budget's own address with its revision check, so Budget's rules decide what is valid and
// Budget keeps its automatic copy of the state before each save.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import vm from 'node:vm'
import { isDateKey } from '../../code/life-os/shared/calendar.js'

export class ShoppingError extends Error {
  constructor(status, message) { super(message); this.name = 'ShoppingError'; this.status = status }
}

const text = (value, limit = 200) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, limit)

// Budget's own rules, loaded once: what a valid state is, how a line is added, how a shop is found.
export function loadBudgetRules(budgetRoot) {
  const context = vm.createContext({ React: { createElement: () => null } })
  for (const name of ['core', 'seed', 'domain']) vm.runInContext(fs.readFileSync(path.join(budgetRoot, 'app/src', `${name}.js`), 'utf8'), context)
  const pick = (name) => vm.runInContext(name, context)
  return { validate: pick('validateV4'), addListLine: pick('addListLine'), tickListLine: pick('tickListLine'), ensureShop: pick('ensureShop'), findShop: pick('findShop'), uid: pick('uid') }
}

// "eggs", "6 eggs", "eggs x6", "2 kg rice": a quantity when one is typed, otherwise one.
export function parseItem(input) {
  if (input && typeof input === 'object') {
    const quantity = Number(input.quantity)
    return { name: text(input.name), quantity: quantity > 0 ? quantity : 1, unit: text(input.unit, 20) || 'item', note: text(input.note, 300), category: text(input.category, 60) }
  }
  let name = text(input).replace(/^(?:buy|get)\s+/i, '')
  let quantity = 1, unit = 'item'
  const lead = /^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|packs?|bags?|bottles?|tins?|cans?)?\s+(?:of\s+)?(.+)$/i.exec(name)
  const tail = /^(.+?)\s*(?:x|×)\s*(\d+)$/i.exec(name)
  if (lead) { quantity = Number(lead[1]); unit = lead[2] ? lead[2].toLowerCase() : 'item'; name = lead[3] }
  else if (tail) { name = tail[1]; quantity = Number(tail[2]) }
  return { name: text(name), quantity: quantity > 0 ? quantity : 1, unit, note: '', category: '' }
}

// The change itself, on a copy of Budget's state. Returns the new state and what was done.
export function addToList(rules, state, items, { list: listName = '', date, shop = '' } = {}) {
  if (!state || typeof state !== 'object') throw new ShoppingError(409, 'Budget has nothing saved yet. Open Budget once, then try again.')
  if (!isDateKey(date)) throw new ShoppingError(400, 'Give the day the list is for')
  const wanted = items.map(parseItem).filter((item) => item.name)
  if (!wanted.length) throw new ShoppingError(400, 'Say what to buy')
  let next = state
  const lists = Array.isArray(state.lists) ? state.lists : []
  const open = (list) => !list.archived && !list.deleted
  const named = text(listName, 120)
  // A named list is used or made. Otherwise: the list with something still to buy that is
  // planned soonest from this day on, then any list with something still to buy.
  const waiting = lists.filter((list) => open(list) && list.lines.some((line) => line.status === 'planned')).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  let target = named ? lists.find((list) => open(list) && list.name.toLowerCase() === named.toLowerCase())
    : waiting.find((list) => list.date >= date) ?? waiting.at(-1)
  let created = false
  if (!target) {
    const placed = rules.ensureShop(next, shop)
    target = { id: rules.uid('list'), name: named || 'Shopping list', date, merchant: placed.shopId ? rules.findShop(placed.state, placed.shopId).name : text(shop, 120), ...(placed.shopId ? { shopId: placed.shopId } : {}), channel: 'in-store', note: '', lines: [] }
    next = { ...placed.state, lists: [...placed.state.lists, target] }
    created = true
  }
  const catalogue = Array.isArray(next.items) ? next.items : []
  const categories = Array.isArray(next.categories) ? next.categories : []
  // The catalogue's category for a thing it knows; else a category that was named; else none.
  const categoryFor = (item) => catalogue.find((known) => String(known.name).toLowerCase() === item.name.toLowerCase())?.categoryId
    || (item.category && categories.find((category) => category.id === item.category || String(category.name).toLowerCase() === item.category.toLowerCase())?.id)
    || 'uncategorised'
  const already = new Set((created ? [] : target.lines).filter((line) => line.status === 'planned').map((line) => String(line.name).toLowerCase()))
  const added = [], skipped = []
  for (const item of wanted) {
    if (already.has(item.name.toLowerCase())) { skipped.push(item.name); continue }
    already.add(item.name.toLowerCase())
    try {
      next = rules.addListLine(next, target.id, { name: item.name, quantity: item.quantity, unit: item.unit, categoryId: categoryFor(item), ...(item.note ? { note: item.note } : {}) })
    } catch (error) { throw new ShoppingError(400, error.message) }
    added.push(item.name)
  }
  const saved = next.lists.find((list) => list.id === target.id)
  return { state: next, changed: created || added.length > 0, result: { list: { id: saved.id, name: saved.name, date: saved.date, toBuy: saved.lines.filter((line) => line.status === 'planned').length, created }, added, skipped } }
}

// Ticking an item off a list, or putting it back, by Budget's own rule: no price is asked for and
// nothing reaches the balance or the cupboard (only a receipt does that).
export function tickLine(rules, state, { list: listId, line: lineId, done = true, date } = {}) {
  if (!state || typeof state !== 'object') throw new ShoppingError(409, 'Budget has nothing saved yet. Open Budget once, then try again.')
  const list = (Array.isArray(state.lists) ? state.lists : []).find((row) => row.id === listId)
  const line = list?.lines.find((row) => row.id === lineId)
  if (!line) throw new ShoppingError(404, 'That item is no longer on the list')
  const result = (lines) => ({ item: { id: line.id, name: line.name, done: Boolean(done) }, list: { id: list.id, name: list.name, toBuy: lines.filter((row) => row.status === 'planned').length } })
  if ((line.status !== 'planned') === Boolean(done)) return { state, changed: false, result: result(list.lines) }
  let next
  try { next = rules.tickListLine(state, listId, lineId, Boolean(done), isDateKey(date) ? date : undefined) } catch (error) { throw new ShoppingError(409, error.message) }
  return { state: next, changed: true, result: result(next.lists.find((row) => row.id === listId).lines) }
}

function request(port, method, pathname, body) {
  if (!Number.isInteger(port)) return Promise.reject(new ShoppingError(503, 'Budget is not running'))
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body)
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers: { host: `127.0.0.1:${port}`, accept: 'application/json', ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), 'x-planner-action': 'save' } : {}) } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => { let value = null; try { value = JSON.parse(data) } catch { /* not JSON */ } resolve({ status: res.statusCode, value }) })
      res.on('error', reject)
    })
    req.setTimeout(5000, () => req.destroy(new ShoppingError(504, 'Budget did not answer')))
    req.on('error', (error) => reject(error instanceof ShoppingError ? error : new ShoppingError(503, 'Budget is not running')))
    req.end(payload ?? undefined)
  })
}

export function createShopping({ budgetRoot, getBudgetPort, today }) {
  let rules
  // Read Budget, make the change on a copy by Budget's own rules, and save it with Budget's own
  // revision check. If Budget was saved from its own page in between, read again and redo it once.
  async function change(apply) {
    rules ??= loadBudgetRules(budgetRoot)
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const current = await request(getBudgetPort(), 'GET', '/api/state')
      if (current.status !== 200 || !current.value) throw new ShoppingError(503, 'Budget could not be read')
      const { state, changed, result } = apply(rules, current.value.state)
      if (!changed) return { ...result, revision: current.value.revision }
      const saved = await request(getBudgetPort(), 'PUT', '/api/state', { state, revision: current.value.revision })
      if (saved.status === 200) return { ...result, revision: saved.value.revision }
      if (saved.status !== 409) throw new ShoppingError(saved.status === 400 ? 400 : 502, saved.value?.error || 'Budget refused the change')
    }
    throw new ShoppingError(409, 'Budget is being changed somewhere else. Try again.')
  }
  return {
    async tick({ list, line, done = true } = {}) {
      if (typeof list !== 'string' || typeof line !== 'string' || !list || !line) throw new ShoppingError(400, 'Say which item')
      return change((budget, state) => tickLine(budget, state, { list, line, done, date: today() }))
    },
    async add({ items, list, date, shop } = {}) {
      if (!Array.isArray(items) || items.length === 0 || items.length > 200) throw new ShoppingError(400, 'Say what to buy')
      return change((budget, state) => addToList(budget, state, items, { list, date: isDateKey(date) ? date : today(), shop }))
    },
  }
}

export function createShoppingRouter({ express, shopping }) {
  const router = express.Router()
  // Tick an item off a list, or put it back: { list, line, done }.
  router.post('/tick', async (req, res) => {
    try {
      const body = req.body ?? {}
      res.json({ ok: true, ...(await shopping.tick({ list: body.list, line: body.line, done: body.done !== false })) })
    } catch (error) {
      const status = error instanceof ShoppingError ? error.status : 500
      if (status === 500) console.error('Shopping:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'The shopping list could not be changed. Try again.' : error.message })
    }
  })
  router.post('/', async (req, res) => {
    try {
      const body = req.body ?? {}
      res.status(201).json({ ok: true, ...(await shopping.add({ items: Array.isArray(body.items) ? body.items : [body.item ?? body.name].filter(Boolean), list: body.list, date: body.date, shop: body.shop })) })
    } catch (error) {
      const status = error instanceof ShoppingError ? error.status : 500
      if (status === 500) console.error('Shopping:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'The shopping list could not be changed. Try again.' : error.message })
    }
  })
  return router
}
