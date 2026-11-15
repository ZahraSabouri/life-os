import test from 'node:test'
import assert from 'node:assert/strict'
import { createDayChecks } from './checks.mjs'
import { createThing } from '../thing.mjs'

function store() {
  const rows = new Map()
  return { rows, readSetting: async (key, fallback) => (rows.has(key) ? structuredClone(rows.get(key)) : fallback), writeSetting: async (key, value) => { rows.set(key, structuredClone(value)) } }
}

test('a tick is kept for its day, and taken back', async () => {
  const s = store()
  const checks = createDayChecks(s)
  await checks.toggle({ date: '2026-11-16', key: 'study:block:x', done: true, title: 'CMT309 · Week 1' })
  assert.deepEqual(Object.keys(await checks.read('2026-11-16')), ['study:block:x'])
  assert.equal((await checks.read('2026-11-16'))['study:block:x'].title, 'CMT309 · Week 1')
  await checks.toggle({ date: '2026-11-16', key: 'study:block:x', done: false })
  assert.deepEqual(await checks.read('2026-11-16'), {})
  assert.deepEqual(await checks.read('2026-11-17'), {})
})

test('quick ticks one after another are all kept', async () => {
  const s = store()
  const checks = createDayChecks(s)
  await Promise.all(['a', 'b', 'c', 'd'].map((key) => checks.toggle({ date: '2026-11-16', key, done: true })))
  assert.deepEqual(Object.keys(await checks.read('2026-11-16')).sort(), ['a', 'b', 'c', 'd'])
})

test('a tick needs a real day, a thing and whether it is done; a range is at most two months', async () => {
  const checks = createDayChecks(store())
  await assert.rejects(checks.toggle({ date: 'Monday', key: 'a', done: true }), /YYYY-MM-DD/)
  await assert.rejects(checks.toggle({ date: '2026-11-16', key: '', done: true }), /which thing/)
  await assert.rejects(checks.toggle({ date: '2026-11-16', key: 'a', done: 'yes' }), /whether/)
  await assert.rejects(checks.range('2026-11-01', '2027-03-01'), /two months/)
  await checks.toggle({ date: '2026-11-18', key: 'a', done: true })
  assert.deepEqual(Object.keys(await checks.range('2026-11-16', '2026-11-22')), ['2026-11-18'])
})

test('a thing opened shows everything that is kept about it', async () => {
  const workspace = {
    modules: [{ id: 'm1', title: 'Computational Data Science', data: { code: 'CMT309' } }],
    materials: [{ id: 'f1', title: 'W01_delivery.ipynb', data: { url: '/study-files/new/f1/W01_delivery.ipynb' } }],
    cards: [{ id: 'c1', title: 'CMT309 · Week 1', module_id: 'm1', status: 'planned', start_date: '2026-11-16', end_date: '2026-11-16',
      data: { priority: 'High', estimatedHours: 1.5, doneCondition: 'W01 run', checklist: [{ id: 's1', text: 'Read the slides' }], resourceIds: ['material-f1'] } }],
    sessions: [{ id: 'k1', title: 'MAT021 · Laboratory', module_id: 'm1', status: 'planned', data: { activity: 'Laboratory', staff: 'Dr A', location: 'Room: 2.35. Building: Abacws. AccessAble Details: https://example.org/a', url: 'https://example.org/a', description: 'Room: 2.35\nGroup: X\nID 1' } }],
    assessments: [],
  }
  const thing = createThing({
    loadEntry: async (id) => (id === 'e1' ? { id: 'e1', type: 'task', title: 'Ask the module leader', status: 'planned', details: JSON.stringify({ area: 'study', note: 'Both dates', proof: 'An answer', steps: [{ id: 'p1', text: 'Email', done: false }] }) } : null),
    loadWorkspace: async () => workspace, loadCareer: async () => ({ jobs: [] }), loadEvents: async () => [],
  })
  const card = await thing('study:native:cards:c1:deadline')
  assert.equal(card.kind, 'Study card')
  assert.deepEqual(card.files, [{ title: 'W01_delivery.ipynb', href: '/study-files/new/f1/W01_delivery.ipynb' }])
  assert.equal(card.steps[0].text, 'Read the slides')
  assert.ok(card.facts.some((f) => f.label === 'Module' && f.value === 'CMT309 · Computational Data Science'))
  const lab = await thing('study:native:sessions:k1')
  assert.equal(lab.kind, 'Laboratory')
  assert.ok(lab.facts.some((f) => f.label === 'Staff' && f.value === 'Dr A'))
  assert.equal(lab.facts.find((f) => f.label === 'Where').value, 'Room: 2.35. Building: Abacws.')
  assert.equal(lab.links[0].href, 'https://example.org/a')
  const own = await thing('core:entry:e1')
  assert.deepEqual([own.kind, own.text[0], own.doneWhen, own.steps[0].text], ['Task', 'Both dates', 'An answer', 'Email'])
  assert.equal((await thing('core:entry:routine:e1:2026-11-16')).title, 'Ask the module leader')
  assert.equal(await thing('core:entry:missing'), null)
})
