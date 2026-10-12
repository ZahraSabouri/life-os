// One-time: the shopping list that came in with the summer study app is not study. It is kept
// aside in the Summer 2026 semester's workspace (`set_aside.shoppingList`). This moves what is
// still to buy onto a shopping list in Budget, through Life OS's own address for that
// (Budget's rules decide what is valid and Budget keeps its own copy before saving), and then
// takes the list out of the study workspace. Usage:
//   node scripts/move-summer-shopping-to-budget.mjs <lifeos|lifeos_test> [--life-os http://127.0.0.1:47850] [--apply]
// Without --apply it only reports. With it, the database is backed up first. Running it
// again moves nothing twice: Budget skips what is already on the list, and the study
// workspace no longer has a list to move.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresConfig, createPostgresPool, postgresBackup } from '../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../code/life-os/backend/src/modules/study/repository.js'
import { createHubStore } from '../hosting/study/hub/store.mjs'
import { dateKey } from '../code/life-os/shared/calendar.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name, fallback = '') => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback)
const database = args[0]
const apply = args.includes('--apply')
const lifeOs = option('life-os', 'http://127.0.0.1:47850')
const token = process.env.LIFE_OS_TOKEN ?? 'dev-token-change-me'
if (!['lifeos', 'lifeos_test'].includes(database)) {
  console.error('Usage: node scripts/move-summer-shopping-to-budget.mjs <lifeos|lifeos_test> [--life-os <address>] [--apply]')
  process.exit(1)
}

const LIST = 'To buy (from the summer list)'
// The summer app's three groups, in Budget's words. "other" has no match and stays uncategorised.
const CATEGORY = { toiletries: 'Personal hygiene', household: 'Household consumables' }

const config = postgresConfig(projectRoot)
const pool = createPostgresPool(config, { database })
try {
  const rows = (await pool.query(`SELECT w.semester_id, s.title, w.set_aside FROM study.hub_workspaces w JOIN study.semesters s ON s.id = w.semester_id
    WHERE json_typeof(w.set_aside->'shoppingList') = 'array'`)).rows
  if (!rows.length) { console.log('No study workspace keeps a shopping list aside. Nothing to move.'); process.exit(0) }
  for (const row of rows) {
    const list = row.set_aside.shoppingList
    const toBuy = list.filter((item) => item && !item.done && String(item.text ?? '').trim())
    console.log(`${row.title}: ${list.length} shopping items kept aside, ${toBuy.length} still to buy, ${list.length - toBuy.length} already bought or empty.`)
    for (const item of list) console.log(`  ${item.done ? '[bought]' : '[to buy]'} ${item.text} (${item.category})`)
    if (!apply) continue

    console.log(`Database dump: ${await postgresBackup(config, projectRoot, 'before-moving-summer-shopping', database)}`)
    let moved = { added: [], skipped: [] }
    if (toBuy.length) {
      const response = await fetch(`${lifeOs}/api/home/shopping`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ list: LIST, date: dateKey(new Date()), items: toBuy.map((item) => ({ name: String(item.text).trim(), quantity: 1, category: CATEGORY[item.category] ?? '' })) }),
      })
      moved = await response.json()
      if (!response.ok || !moved.ok) throw new Error(`Budget did not take the list: ${moved.error ?? response.status}. Nothing was removed from the study workspace.`)
      if (moved.added.length + moved.skipped.length !== toBuy.length) throw new Error(`Budget took ${moved.added.length + moved.skipped.length} of ${toBuy.length}. Nothing was removed from the study workspace.`)
      console.log(`Budget, list "${moved.list.name}": ${moved.added.length} added${moved.skipped.length ? `, ${moved.skipped.length} already there` : ''}; ${moved.list.toBuy} to buy on it now (Budget revision ${moved.revision}).`)
    }
    // Only now, with everything on Budget's list, does the list leave the study workspace.
    const { shoppingList, ...rest } = row.set_aside
    const store = createHubStore({ pool, repository: createStudyRepository({ pool }) })
    await store.replaceWorkspace(row.semester_id, {
      setAside: { ...rest, moved: [...(Array.isArray(rest.moved) ? rest.moved : []), { what: 'shoppingList', count: shoppingList.length, to: `Budget shopping list "${LIST}"`, on: new Date().toISOString() }] },
      reason: 'shopping list moved to Budget', writerId: 'move-summer-shopping',
    })
    const after = (await pool.query('SELECT set_aside FROM study.hub_workspaces WHERE semester_id = $1', [row.semester_id])).rows[0].set_aside
    console.log(`${row.title}: the study workspace now keeps ${'shoppingList' in after ? 'STILL a' : 'no'} shopping list aside. Kept aside still: ${Object.entries(after).filter(([, value]) => Array.isArray(value)).map(([key, value]) => `${key} ${value.length}`).join(', ')}.`)
  }
  if (!apply) console.log('\nNothing was changed. Add --apply to move the list.')
} finally {
  await pool.end()
}
