import test from 'node:test'
import assert from 'node:assert/strict'
import { convertLegacyStudy, mergeLegacyCard } from './legacy.mjs'
import { validateImport } from '../../code/life-os/backend/src/modules/study/schema.js'

test('legacy migration preserves saved checklist identities, resource removals, work and custom fields', () => {
  const base = { id: 'card-one', title: 'Original', moduleGroup: 'Topic', status: 'This Week', checklist: ['Read', { id: 'stable', text: 'Check' }], resourceIds: ['keep', 'hide'], estimatedHours: 2 }
  const overlay = { edits: { title: 'Edited', checklist: ['Read', { id: 'stable', text: 'Review' }], customDetail: 'retained' }, checklist: { 'card-one-check-0': true, stable: false }, hiddenResourceIds: ['hide'], actualHours: 1.5, evidence: 'Evidence', notes: [{ id: 'note', text: 'Note' }], activity: [{ action: 'logged' }], focusSessions: [{ minutes: 20 }], userTags: ['tag'] }
  const merged = mergeLegacyCard(base, overlay)
  assert.equal(merged.title, 'Edited')
  assert.deepEqual(merged.checklist, [{ id: 'card-one-check-0', text: 'Read', done: true }, { id: 'stable', text: 'Review', done: false }])
  assert.deepEqual(merged.resourceIds, ['keep'])
  assert.equal(merged.actualHours, 1.5)
  assert.equal(merged.evidenceEntries[0].text, 'Evidence')
  assert.equal(merged.notes[0].text, 'Note')
  assert.equal(merged.customDetail, 'retained')
  assert.deepEqual(merged.source.overlay, overlay)
})

test('reusable native records preserve entire source archive and link all parent/material UUIDs', () => {
  const state = { cards: { first: { done: true } }, settings: { campaignStart: '2026-01-01', campaignEnd: '2026-03-31' }, addedCards: [{ id: 'custom', title: 'Extra', moduleGroup: 'New module', checklist: [] }], moduleNotes: { topic: 'Scratchpad' }, notifications: { old: { read: true } }, snapshots: { '2026-01-02': { completed: 1 } } }
  const batch = convertLegacyStudy({ state, modules: [{ id: 'topic', label: 'Topic', moduleGroup: 'Topic', resources: [{ id: 'resource' }] }], cards: [{ id: 'first', title: 'Work', moduleGroup: 'Topic', checklist: ['One'], resourceIds: ['resource'] }], resources: [{ id: 'resource', moduleKey: 'topic', title: 'PDF', url: '/study-assets/topic/example.pdf' }], progress: [{ id: 'event', eventType: 'saved' }], fingerprint: 'fixture' })
  const validated = validateImport(batch)
  assert.equal(validated.records.length, batch.records.length)
  const cards = batch.records.filter(row => row.entity === 'cards').map(row => row.record)
  const materials = batch.records.filter(row => row.entity === 'materials').map(row => row.record)
  assert.equal(cards.length, 2)
  assert.equal(cards[0].status, 'done')
  assert.equal(cards[0].data.resourceIds[0], materials[0].id)
  assert.equal(materials[0].data.url, '/study-files/assets/topic/example.pdf')
  assert.equal(batch.records.find(row => row.entity === 'modules').record.data.note, 'Scratchpad')
  assert.deepEqual(batch.records.find(row => row.source_id === 'sourceArchive').record.data.state, state)
  assert.equal(batch.counts.modules, 2)
  const repeat = convertLegacyStudy({ state, modules: [{ id: 'topic', label: 'Topic', moduleGroup: 'Topic', resources: [{ id: 'resource' }] }], cards: [{ id: 'first', title: 'Work', moduleGroup: 'Topic', checklist: ['One'], resourceIds: ['resource'] }], resources: [{ id: 'resource', moduleKey: 'topic', title: 'PDF', url: '/study-assets/topic/example.pdf' }], progress: [{ id: 'event', eventType: 'saved' }], fingerprint: 'fixture' })
  assert.deepEqual(repeat.records, batch.records)
})

test('material ownership follows its resource definition when legacy module aliases differ', () => {
  const batch = convertLegacyStudy({ state: {}, modules: [{ id: 'topic', moduleGroup: 'Topic', resources: [{ id: 'resource' }] }], cards: [], resources: [{ id: 'resource', moduleKey: 'older-alias', title: 'Reading' }], progress: [], fingerprint: 'fixture' })
  assert.equal(batch.records.find(row => row.entity === 'materials').record.module_id, batch.records.find(row => row.entity === 'modules').record.id)
})
