import test from 'node:test'
import assert from 'node:assert/strict'
import { createStudyImports } from './imports.mjs'

const body = { content: JSON.stringify({ records: [], source: 'fixture' }) }
test('apply requires a matching recent preview and changed input cannot reuse it', async () => {
  let writes = 0, now = 1000
  const repository = { previewImport: async batch => ({ fingerprint: batch.fingerprint, counts: {}, conflicts: [] }), importRecords: async () => { writes++; return { inserted: 0 } } }
  const imports = createStudyImports({ projectRoot: 'unused', repository, clock: () => now })
  await assert.rejects(imports.json.apply({ ...body, fingerprint: 'guessed' }), error => error.status === 409)
  const preview = await imports.json.preview(body)
  await assert.rejects(imports.json.apply({ ...body, content: JSON.stringify({ records: [], source: 'changed' }), fingerprint: preview.fingerprint }), error => error.status === 409)
  await imports.json.apply({ ...body, fingerprint: preview.fingerprint })
  assert.equal(writes, 1)
  now += 31 * 60_000
  await assert.rejects(imports.json.apply({ ...body, fingerprint: preview.fingerprint }), error => error.status === 409)
  assert.equal(writes, 1)
})

test('workspace JSON import ignores tombstones and read-only metadata while preserving content', async () => {
  let received
  const id = '10000000-0000-4000-8000-000000000001'
  const repository = { previewImport: async batch => { received = batch; return { counts: {} } } }
  const imports = createStudyImports({ projectRoot: 'unused', repository })
  await imports.json.preview({ content: JSON.stringify({ cards: [{ id, title: 'Task', status: 'planned', data: { notes: ['retained'] }, revision: 5, created_at: 'old', provenance: { source: 'old' } }, { id: 'removed', deleted_at: '2026-01-01' }] }) })
  assert.equal(received.records.length, 1)
  assert.equal(received.records[0].record.id, id)
  assert.equal(received.records[0].record.title, 'Task')
  assert.deepEqual(received.records[0].record.data.notes, ['retained'])
  assert.equal(received.records[0].record.revision, undefined)
  assert.equal(received.records[0].record.created_at, undefined)
})

test('manual repeating study sessions preview concrete London occurrences with exclusions once', async () => {
  let batch
  const repository = { previewImport: async input => { batch = input; return { counts: { sessions: input.records.length } } }, importRecords: async input => ({ inserted: input.records.length }) }
  const imports = createStudyImports({ projectRoot: 'unused', repository })
  const body = { seriesId: '10000000-0000-4000-8000-000000000009', record: { title: 'Weekly reading', status: 'planned', start_at: '2026-10-05T09:00:00Z', end_at: '2026-10-05T10:00:00Z', data: { rrule: 'FREQ=WEEKLY;COUNT=3', exdates: ['2026-10-12'], category: 'reading' } } }
  const preview = await imports.manual.preview(body)
  assert.equal(batch.records.length, 3)
  assert.deepEqual(batch.records.map(row => row.record.status), ['planned','cancelled','planned'])
  assert.ok(batch.records.every(row => row.record.data.rrule === null && row.record.data.sourceRule === 'FREQ=WEEKLY;COUNT=3'))
  assert.equal(batch.records[0].record.start_at, '2026-10-05T09:00:00.000Z')
  assert.equal(batch.records[0].record.data.category, 'reading')
  assert.equal((await imports.manual.apply({ ...body, fingerprint: preview.fingerprint })).inserted, 3)
})

test('malformed JSON collections and missing manual bounds give readable validation errors', async () => {
  const imports = createStudyImports({ projectRoot: 'unused', repository: { previewImport: async () => ({ counts: {} }) } })
  await assert.rejects(imports.json.preview({ content: JSON.stringify({ semesters: [], cards: {} }) }), error => error.status === 400)
  await assert.rejects(imports.json.preview({ content: JSON.stringify({ records: [], source: {} }) }), error => error.status === 400)
  await assert.rejects(imports.json.preview({ content: 'null' }), error => error.status === 400)
  await assert.rejects(imports.json.preview({ content: JSON.stringify({ cards: [null] }) }), error => error.status === 400)
  await assert.rejects(imports.json.preview({ content: JSON.stringify({ cards: ['invalid'] }) }), error => error.status === 400)
  await assert.rejects(imports.manual.preview({ seriesId: '10000000-0000-4000-8000-000000000009', record: { title: 'Endless', start_date: '2026-10-05', data: { rrule: 'FREQ=WEEKLY' } } }), error => error.status === 400)
  await assert.rejects(imports.manual.preview({ seriesId: '10000000-0000-4000-8000-000000000009', record: { title: 'Reading', start_date: '2026-10-05', data: { rrule: 'FREQ=WEEKLY;COUNT=2', exdates: {} } } }), error => error.status === 400)
})

test('timetable placement and date windows cannot change after review', async () => {
  let writes = 0
  const repository = { previewImport: async batch => ({ manifest: JSON.stringify(batch.records), counts: {} }), importRecords: async () => { writes++; return { inserted: 1 } } }
  const imports = createStudyImports({ projectRoot: 'unused', repository })
  const input = { content: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:reading\r\nSUMMARY:Reading\r\nDTSTART;VALUE=DATE:20261005\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nEND:VEVENT\r\nEND:VCALENDAR', source: 'fixture', from: '2026-10-01', to: '2026-10-31', module_id: '10000000-0000-4000-8000-000000000001' }
  const preview = await imports.ics.preview(input)
  await assert.rejects(imports.ics.apply({ ...input, module_id: '10000000-0000-4000-8000-000000000002', fingerprint: preview.fingerprint }), error => error.status === 409)
  await assert.rejects(imports.ics.apply({ ...input, to: '2026-10-06', fingerprint: preview.fingerprint }), error => error.status === 409)
  assert.equal(writes, 0)
  await imports.ics.apply({ ...input, fingerprint: preview.fingerprint })
  assert.equal(writes, 1)
})
