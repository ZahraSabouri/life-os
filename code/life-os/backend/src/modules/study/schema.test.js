import test from 'node:test'
import assert from 'node:assert/strict'
import { StudyError, validateRecord, validateImport, validateUrl } from './schema.js'

const id = '11111111-1111-4111-8111-111111111111'
const parent = '22222222-2222-4222-8222-222222222222'
const invalid = (callback, status = 400) => assert.throws(callback, (error) => error instanceof StudyError && error.status === status)

test('rich study data survives validation without a semester or module constant', () => {
  const data = { lane: 'Waiting / Blocked', phase: 'My phase', checklist: ['Read', { id: 'a', text: 'Try', done: true }], evidence: 'A saved paragraph', notes: { scratchpad: 'mine' }, loggedHours: 1.25, resourceIds: ['local-resource'], links: [{ title: 'Notes', url: '/materials/notes.md' }], extraLegacyField: { enabled: true } }
  const record = validateRecord('cards', { id, title: '  New card ', module_id: parent, data })
  assert.equal(record.title, 'New card')
  assert.equal(record.status, 'active')
  assert.deepEqual(record.data, data)
  record.data.extraLegacyField.enabled = false
  assert.equal(data.extraLegacyField.enabled, true)
})

test('civil dates, explicit instants and ranges reject silent rollover or guessed clocks', () => {
  assert.equal(validateRecord('sessions', { start_at: '2026-07-04T09:00:00+01:00' }).start_at, '2026-07-04T08:00:00.000Z')
  assert.equal(validateRecord('cards', { start_date: '2028-02-29' }).start_date, '2028-02-29')
  for (const value of ['2026-02-29', '2026-13-01', '2026-00-01', '0000-01-01', '2026-1-2']) invalid(() => validateRecord('cards', { start_date: value }))
  for (const value of ['2026-10-25T01:30:00', '2026-02-30T09:00:00Z', '2026-10-05T24:00:00Z']) invalid(() => validateRecord('sessions', { start_at: value }))
  invalid(() => validateRecord('cards', { start_date: '2026-10-06', end_date: '2026-10-05' }))
  invalid(() => validateRecord('sessions', { start_at: '2026-10-05T10:00:00Z', end_at: '2026-10-05T09:00:00Z' }))
})

test('mutation schema protects revision, IDs, provenance and numeric values', () => {
  assert.equal(validateRecord('cards', { revision: 2, status: 'blocked' }, { partial: true }).revision, 2)
  invalid(() => validateRecord('cards', { revision: 0, title: 'x' }, { partial: true }))
  invalid(() => validateRecord('cards', { revision: 1, provenance: { source: 'spoofed' } }, { partial: true }))
  invalid(() => validateRecord('cards', { id: 'card-1' }))
  invalid(() => validateRecord('cards', { id, card_id: id }))
  invalid(() => validateRecord('cards', { status: 'This Week' }))
  invalid(() => validateRecord('cards', { data: { loggedHours: -1 } }))
  invalid(() => validateRecord('cards', { data: { estimatedHours: '3' } }))
  invalid(() => validateRecord('cards', { data: { hours: Infinity } }))
  invalid(() => validateRecord('cards', { data: { checklist: 'one' } }))
  invalid(() => validateRecord('settings', { data: { theme: 'light' } }))
  assert.equal(validateRecord('settings', { data: { key: 'preferences', arbitrary: ['okay'] } }).data.key, 'preferences')
})

test('links accept web and local readers but reject executable and ambiguous URLs', () => {
  for (const url of ['https://example.com/x', 'http://127.0.0.1:47850/materials/x', '/study-materials/x.pdf']) assert.equal(validateUrl(url), url)
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///C:/x', '//example.com/x', '/\\example.com/x', 'https://user:password@example.com', 'https://example.com/a b']) invalid(() => validateUrl(url))
  invalid(() => validateRecord('materials', { data: { url: 'javascript:alert(1)' } }))
})

test('import provenance requires stable distinct records and cannot claim another source', () => {
  const item = { entity: 'cards', source_id: 'card-1', record: { id, title: 'x', provenance: { source: 'other', original: true } } }
  const batch = validateImport({ source: 'legacy', fingerprint: 'abc', records: [item] })
  assert.deepEqual(batch.records[0].record.provenance, { source: 'legacy', source_id: 'card-1', original: true })
  invalid(() => validateImport({ source: 'legacy', fingerprint: 'abc', records: [item, item] }))
  invalid(() => validateImport({ source: 'legacy', fingerprint: 'abc', records: [{ entity: 'cards', source_id: 'x', record: { title: 'missing stable ID' } }] }))
})

test('JSON bounds reject non-JSON objects and oversized records', () => {
  invalid(() => validateRecord('cards', { data: { date: new Date() } }))
  invalid(() => validateRecord('cards', { data: { absent: undefined } }))
  invalid(() => validateRecord('cards', { data: { notes: 'x'.repeat(2 * 1024 * 1024) } }), 413)
  let nested = {}
  for (let index = 0; index < 32; index += 1) nested = { next: nested }
  invalid(() => validateRecord('cards', { data: nested }))
})

test('unexpanded session recurrence requires preview/apply while source metadata survives', () => {
  invalid(() => validateRecord('sessions', { data: { rrule: 'FREQ=WEEKLY;COUNT=4' } }))
  invalid(() => validateRecord('sessions', { revision: 1, data: { recurrence: 'Every Tuesday' } }, { partial: true }))
  assert.throws(() => validateRecord('sessions', { data: { rrule: 'FREQ=DAILY' } }), /import preview\/apply/)
  const data = { rrule: '', recurrence: '  ', sourceRule: 'FREQ=WEEKLY;COUNT=4', ics: { rrule: 'FREQ=WEEKLY;COUNT=4', occurrence: 1 } }
  assert.deepEqual(validateRecord('sessions', { start_at: '2026-10-06T08:00:00Z', data }).data, data)
  assert.equal(validateRecord('cards', { data: { rrule: 'Legacy detail' } }).data.rrule, 'Legacy detail')
})
