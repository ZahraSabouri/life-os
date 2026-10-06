import test from 'node:test'
import assert from 'node:assert/strict'
import { appendedEntry, initialSemester, linkedMaterials, materialShelves, materialViewer, moduleTitle, moduleToolsData, practiceRows, toggledChecklist, workbenchData } from '../src/components/study/workbench.js'
import { validateRecord } from '../../backend/src/modules/study/schema.js'

const base = { id: '00000000-0000-4000-8000-000000000001', title: 'Read critically', revision: 3, data: {
  lane: 'Deep Work', source: { privateMetadata: 'preserved' }, actualHours: 2,
  checklist: [{ id: 'first', text: 'Compare the claim', done: false }, { id: 'second', text: 'Save evidence', done: true }],
  notes: [{ id: 'existing', text: 'An earlier observation', at: '2026-10-05T09:00:00Z' }],
  activity: [{ id: 'old', at: '2026-10-05T09:00:00Z', action: 'Logged focus' }], resourceIds: ['material-a', 'material-b']
} }

test('working checklist edits retain IDs, unknown source fields and original revision', () => {
  const checks = toggledChecklist(base, 'first', true)
  const data = workbenchData(base, { checklist: checks }, 'Completed checklist item', { id: 'action', at: '2026-10-06T09:00:00Z' })
  const request = validateRecord('cards', { revision: base.revision, data }, { partial: true })
  assert.equal(request.revision, 3)
  assert.equal(request.data.checklist[0].id, 'first')
  assert.equal(request.data.checklist[0].done, true)
  assert.equal(request.data.actualHours, 2)
  assert.deepEqual(request.data.source, base.data.source)
  assert.equal(request.data.activity.length, 2)
  assert.equal(base.data.checklist[0].done, false)
})

test('new notes append to recorded work and whitespace never creates a blank note', () => {
  const notes = appendedEntry(base, 'notes', '  A second observation  ', { id: 'new', at: '2026-10-06T09:00:00Z' })
  assert.deepEqual(notes.map(row => row.id), ['existing', 'new'])
  assert.equal(notes[1].text, 'A second observation')
  assert.equal(appendedEntry(base, 'notes', '  ').length, 1)
  assert.equal(base.data.notes.length, 1)
})

test('active-card references remain exact and library grouping preserves reviewed counts', () => {
  const materials = [{ id: 'material-a', data: { group: 'Readings', reviewed: true } }, { id: 'material-b', data: { group: 'Readings', reviewed: false } }, { id: 'other', data: { group: 'Exercises', reviewed: true } }]
  assert.deepEqual(linkedMaterials(base, materials).map(row => row.id), ['material-a', 'material-b'])
  const shelves = materialShelves(materials)
  assert.equal(shelves.find(row => row.group === 'Readings').reviewed, 1)
  assert.equal(shelves.find(row => row.group === 'Readings').materials.length, 2)
})

test('new modules can store general practice tools and optional effort targets without losing imported fields', () => {
  const original = { objectives: ['Evaluate a source'], custom: { keep: true } }
  const data = moduleToolsData(original, { drills: [{ id: 'practice', title: 'Explain a claim', detail: 'Compare two arguments', output: 'One recorded comparison', sourceReference: 'source-id' }], recipes: [{ title: 'Structure a comparison', detail: 'Claim, evidence, limitations' }], effortTargetPercent: '', targetHours: '' })
  assert.equal(data.effortTargetPercent, null)
  assert.equal(data.targetHours, null)
  assert.equal(data.drills[0].sourceReference, 'source-id')
  assert.equal(data.custom.keep, true)
  assert.equal(validateRecord('modules', { title: 'Independent study', data }).data.recipes.length, 1)
  assert.equal(moduleToolsData(original, { drills: [], recipes: [], effortTargetPercent: '35', targetHours: '12.5' }).targetHours, 12.5)
  assert.throws(() => moduleToolsData(original, { drills: [], recipes: [], effortTargetPercent: 101, targetHours: 0 }), /Effort share/)
  assert.equal(practiceRows(['A reading prompt'])[0].title, 'A reading prompt')
})

test('default semester uses persisted selection first, current dates next and legacy active selection last', () => {
  const workspace = { semesters: [{ id: 'past', start_date: '2026-07-01', end_date: '2026-08-31', status: 'active' }, { id: 'current', start_date: '2026-09-01', end_date: '2026-12-31', status: 'active' }], settings: [{ data: { key: 'preferences', activeSemesterId: 'past' } }] }
  assert.equal(initialSemester(workspace, '2026-10-06'), 'current')
  assert.equal(initialSemester(workspace, '2027-01-01'), 'past')
  workspace.settings[0].data.selectedSemesterId = 'past'
  assert.equal(initialSemester(workspace, '2026-10-06'), 'past')
  workspace.settings[0].data.selectedSemesterId = ''
  assert.equal(initialSemester(workspace, '2026-10-06'), '')
  workspace.settings[0].data.selectedSemesterId = 'missing'
  assert.equal(initialSemester(workspace, '2026-10-06'), 'current')
})

test('module labels show a supplied code once and material reader understands preserved file metadata', () => {
  assert.equal(moduleTitle({ title: 'RES Research methods', data: { code: 'RES' } }), 'RES Research methods')
  assert.equal(moduleTitle({ title: 'Research methods', data: { code: 'MOD' } }), 'MOD · Research methods')
  assert.equal(materialViewer({ data: { viewer: 'application', url: '/study-files/analysis.ipynb' } }), 'notebook')
  assert.equal(materialViewer({ data: { viewer: 'pdf', url: '/study-files/reading.pdf' } }), 'frame')
})
