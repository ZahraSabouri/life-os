import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMailRepository } from './repository.js'
import { createMailImporter, matchPerson } from './importer.js'
import { createMailInbox } from '../../../../../../hosting/mail/inbox.mjs'

const projectRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const example = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch.json'), 'utf8'))
// Explicit opt-in; the database is checked to be lifeos_test before anything is written.
const enabled = process.env.LIFE_OS_MAIL_TEST_DB === 'lifeos_test'

test('matchPerson: by address in contact, else by a name only one person has', () => {
  const people = [{ id: 1, name: 'Jo Evans', contact: 'JO.EVANS@example.ac.uk, 07700' }, { id: 2, name: 'Sam Taylor', contact: '' }, { id: 3, name: 'Sam Taylor', contact: null }, { id: 4, name: 'Ana', contact: '' }]
  assert.equal(matchPerson(people, { name: 'Someone', address: 'jo.evans@example.ac.uk' }), '1')
  assert.equal(matchPerson(people, { name: 'sam taylor' }), null)
  assert.equal(matchPerson(people, { name: 'ANA', address: 'ana@example.com' }), '4')
  assert.equal(matchPerson(people, null), null)
})

// A copy of the example with its own run and source ids, so each run of these tests is separate.
const tag = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
let runs = 0
function variant(edit = () => {}) {
  const batch = structuredClone(example)
  const id = (source) => `${source}-${tag}`
  batch.runId = `2026-10-28-0915-${tag.slice(0, 4)}${String(runs++).padStart(2, '0')}`
  batch.sources.forEach((source) => { source.id = id(source.id) })
  batch.messages.forEach((message) => { message.source = id(message.source) })
  batch.digest.bySource.forEach((line) => { line.source = id(line.source) })
  batch.actions.forEach((action) => { action.dedupeKey = action.dedupeKey.replace(/^(\w+):([^:]+):/, (_, kind, source) => `${kind}:${id(source)}:`) })
  edit(batch)
  return batch
}

test('mail import on lifeos_test: apply, repeat, update, fail, her fields, undo', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const config = postgresConfig(projectRoot)
  const pool = createPostgresPool(config, { database: 'lifeos_test', role: 'app' })
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'life-os-mail-'))
  t.after(async () => { await pool.end(); fs.rmSync(directory, { recursive: true, force: true }) })
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')

  let backups = 0
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository, backup: async () => { backups += 1; return null }, findPeople: () => [{ id: 'p-jo', name: 'Jo Evans', contact: 'jo.evans@example.ac.uk' }] })
  const inbox = createMailInbox({ directory, importer, settleMs: 0, log: () => {} })
  const drop = (name, batch) => fs.writeFileSync(path.join(directory, name), typeof batch === 'string' ? batch : JSON.stringify(batch))
  const action = async (key) => (await pool.query("SELECT * FROM mail.actions WHERE dedupe_key = $1 AND deleted_at IS NULL", [key.replace(/^(\w+):([^:]+):/, (_, kind, source) => `${kind}:${source}-${tag}:`)])).rows[0]
  const first = variant()

  await t.test('the example is applied: 7 messages, 4 open actions and 1 already done', async () => {
    drop('first.json', first)
    const [result] = (await inbox.scan()).results
    assert.equal(result.ok, true)
    assert.deepEqual(result.counts, { messages: { new: 7, updated: 0, unchanged: 0 }, actions: { new: 5, updated: 0, unchanged: 0 }, urgent: 1 })
    assert.equal(backups, 1)
    const rows = (await pool.query('SELECT status, done_by FROM mail.actions WHERE first_batch_id = $1', [result.batchId])).rows
    assert.equal(rows.filter((row) => row.status === 'open').length, 4)
    assert.deepEqual(rows.filter((row) => row.status === 'done').map((row) => row.done_by), ['source'])
    assert.equal((await action('reply:uni-outlook:group-report-thread')).person_id, 'p-jo')
    assert.equal(fs.readdirSync(path.join(directory, 'processed')).length, 1)
  })

  await t.test('the same run again changes nothing', async () => {
    drop('again.json', first)
    const [result] = (await inbox.scan()).results
    assert.equal(result.repeated, true)
    assert.equal(backups, 1)
    assert.equal(fs.readdirSync(path.join(directory, 'processed')).length, 2)
  })

  await t.test('a copy with one priority changed updates that one record', async () => {
    const before = await action('reply:gmail:18f2c3a0b9d7e600')
    drop('one-change.json', variant((batch) => { batch.messages[1].priority = 'normal' }))
    const [result] = (await inbox.scan()).results
    assert.deepEqual(result.counts, { messages: { new: 0, updated: 1, unchanged: 6 }, actions: { new: 0, updated: 0, unchanged: 5 }, urgent: 0 })
    assert.equal((await action('reply:gmail:18f2c3a0b9d7e600')).revision, before.revision)
  })

  await t.test('a broken copy lands in failed/ with a readable note; .part files are left alone', async () => {
    drop('broken.json', variant((batch) => { batch.messages[0].priority = 'very' }))
    drop('still-coming.json.part', '{')
    drop('not-json.json', '{ nope')
    const results = (await inbox.scan()).results
    assert.equal(results.length, 2)
    assert.ok(results.every((result) => result.ok === false))
    const notes = fs.readdirSync(path.join(directory, 'failed')).filter((name) => name.endsWith('.error.txt'))
    assert.equal(notes.length, 2)
    assert.match(fs.readFileSync(path.join(directory, 'failed', notes.find((name) => name.includes('broken'))), 'utf8'), /priority/)
    assert.ok(fs.existsSync(path.join(directory, 'still-coming.json.part')))
    assert.deepEqual((await inbox.status()).failed.length, 2)
  })

  await t.test('her fields survive an import; a source-resolved action closes; a reopened one stays open', async () => {
    const sam = await action('reply:gmail:18f2c3a0b9d7e600')
    await repository.patchHers('actions', sam.id, sam.revision, { her_priority: 'low', her_note: 'after the lab' })
    await assert.rejects(repository.patchHers('actions', sam.id, sam.revision, { her_note: 'stale' }), { status: 409 })
    await assert.rejects(repository.patchHers('actions', sam.id, sam.revision + 1, { title: 'not hers' }), { status: 400 })
    const library = await action('email:uni-outlook:library-thread')
    await repository.patchHers('actions', library.id, library.revision, { status: 'open' })
    assert.equal((await action('email:uni-outlook:library-thread')).reopened, true)
    const result = await importer.apply(variant((batch) => {
      batch.actions[1].priority = 'urgent'
      Object.assign(batch.actions[1], { resolvedAtSource: true, resolvedNote: 'You replied on 28 October.' })
    }), { fileName: 'resolved.json' })
    assert.deepEqual(result.counts.actions, { new: 0, updated: 1, unchanged: 4 })
    const after = await action('reply:gmail:18f2c3a0b9d7e600')
    assert.equal(after.priority, 'urgent')
    assert.equal(after.her_priority, 'low')
    assert.equal(after.her_note, 'after the lab')
    assert.equal(after.status, 'done')
    assert.equal(after.done_by, 'source')
    assert.equal((await action('email:uni-outlook:library-thread')).status, 'open')
  })

  await t.test('undo is refused after her change, and otherwise puts everything back', async () => {
    const latest = await repository.lastBatch()
    const sam = await action('reply:gmail:18f2c3a0b9d7e600')
    await repository.patchHers('actions', sam.id, sam.revision, { status: 'open' })
    await assert.rejects(importer.undo(latest.id), (error) => error.status === 409 && error.details.length === 1)
    const fresh = variant()
    const applied = await importer.apply(fresh, { fileName: 'fresh.json' })
    const jo = await action('reply:uni-outlook:group-report-thread')
    assert.ok(jo)
    await assert.rejects(importer.undo(latest.id), { status: 409 }) // no longer the latest
    assert.deepEqual(applied.counts.actions, { new: 0, updated: 1, unchanged: 4 })
    assert.deepEqual(await importer.undo(applied.batchId), { undone: true, records: 5 }) // its four sources and Sam's action
    assert.equal((await action('reply:gmail:18f2c3a0b9d7e600')).priority, 'urgent')
    // A batch that added records: new sources, messages and actions, all removed by undo.
    const other = `${tag.slice(0, 3)}new`
    const added = await importer.apply(variant((batch) => {
      batch.sources.forEach((source) => { source.id = source.id.replace(tag, other) })
      batch.messages.forEach((message) => { message.source = message.source.replace(tag, other) })
      batch.digest.bySource.forEach((line) => { line.source = line.source.replace(tag, other) })
      batch.actions.forEach((entry) => { entry.dedupeKey = entry.dedupeKey.replace(tag, other) })
    }), { fileName: 'added.json' })
    assert.equal(added.counts.messages.new, 7)
    assert.deepEqual(await importer.undo(added.batchId), { undone: true, records: 16 })
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM mail.messages WHERE first_batch_id = $1 AND deleted_at IS NULL", [added.batchId])).rows[0].n, 0)
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM mail.sources WHERE id LIKE $1 AND deleted_at IS NULL", [`%-${other}`])).rows[0].n, 0)
    assert.equal((await pool.query('SELECT status FROM mail.batches WHERE id = $1', [added.batchId])).rows[0].status, 'undone')
    await assert.rejects(importer.undo(added.batchId), { status: 409 })
  })
})

// Version 2 (stage 5): items, links, her status on an item, undo.
const example2 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch-v2.json'), 'utf8'))
function variant2(edit = () => {}, mark = tag) {
  const batch = structuredClone(example2)
  const id = (source) => `${source}-${mark}`
  batch.runId = `2026-11-02-0700-${mark.slice(0, 4)}${String(runs++).padStart(2, '0')}`
  batch.sources.forEach((source) => { source.id = id(source.id) })
  batch.messages.forEach((message) => { message.source = id(message.source) })
  batch.actions.forEach((entry) => { entry.dedupeKey = `${entry.dedupeKey}:${mark}` })
  batch.items.forEach((item) => { item.key = `${item.key}:${mark}` })
  edit(batch)
  return batch
}

test('mail import v2 on lifeos_test: items with their places, links, her status, undo', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const pool = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test', role: 'app' })
  t.after(() => pool.end())
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository })
  const item = async (key, mark = tag) => (await pool.query('SELECT *, day::text AS day FROM mail.items WHERE dedupe_key = $1 AND deleted_at IS NULL', [`${key}:${mark}`])).rows[0]
  const first = variant2()

  await t.test('the example is applied: 6 messages, 1 action, 9 items', async () => {
    const result = await importer.apply(first, { fileName: 'v2.json' })
    assert.deepEqual(result.counts, { messages: { new: 6, updated: 0, unchanged: 0 }, actions: { new: 1, updated: 0, unchanged: 0 }, items: { new: 9, updated: 0, unchanged: 0 }, urgent: 0 })
    assert.equal((await pool.query('SELECT version FROM mail.batches WHERE id = $1', [result.batchId])).rows[0].version, 2)
    const lab = await item('learning-platform:lc:ds101-ann-0042:lab-room')
    assert.equal(lab.day, '2026-10-30')
    assert.equal(lab.start_at.toISOString(), '2026-11-05T14:00:00.000Z')
    assert.equal(lab.start_day, null)
    assert.equal(lab.source_id, `learning-platform-${tag}`)
    assert.equal(lab.status, 'new')
    assert.equal((await item('gmail:18c2f0a1b2c3d4e5:graduate-data-analyst')).canonical_url, 'https://jobs.example.com/view/graduate-data-analyst-1001')
    const fine = await item('uni-outlook:AAQkADExampleItemId0001:library-fine')
    const pay = (await pool.query('SELECT id FROM mail.actions WHERE dedupe_key = $1', [`do:uni-outlook:AAQkADExampleItemId0001:library-fine:${tag}`])).rows[0]
    assert.deepEqual(fine.action_ids, [pay.id])
    assert.deepEqual(fine.details, { cost: 'GBP 4.50' })
    const web = await item('web-events:su-example-501:board-games')
    assert.equal(web.source_id, null)
    assert.equal(web.found_url, 'https://su.example.ac.uk/events')
    const alert = (await pool.query('SELECT links FROM mail.messages WHERE source_id = $1 AND source_message_id = $2', [`gmail-${tag}`, '18c2f0a1b2c3d4e5'])).rows[0]
    assert.equal(alert.links.length, 3)
  })

  await t.test('the same run again changes nothing', async () => {
    assert.equal((await importer.apply(first)).repeated, true)
  })

  await t.test('the calendar gets the dated items placeOf sends there, by London day, and not dismissed ones', async () => {
    const { createMailReads } = await import('./reads.js')
    const reads = createMailReads({ pool })
    const keys = async (from, to) => (await reads.datedItems(from, to)).filter((row) => row.dedupe_key.endsWith(`:${tag}`)).map((row) => row.dedupe_key.split(':').at(-2)).sort()
    assert.deepEqual(await keys('2026-11-01', '2026-12-31'), ['cw2-brief', 'hackathon', 'lab-room', 'library-fine'])
    assert.deepEqual(await keys('2026-11-05', '2026-11-05'), ['lab-room'])
    const brief = await item('learning-platform:lc:ds101-content-0107:cw2-brief')
    const saved = await repository.patchHers('items', brief.id, brief.revision, { status: 'dismissed' })
    assert.deepEqual(await keys('2026-12-04', '2026-12-04'), [])
    await repository.patchHers('items', brief.id, saved.revision, { status: 'new' })
  })

  await t.test('open items: not dismissed and not over, or undated and recent', async () => {
    const { createMailReads } = await import('./reads.js')
    const reads = createMailReads({ pool })
    const keys = async (today) => (await reads.items({ open: true, today })).filter((row) => row.dedupe_key.endsWith(`:${tag}`)).map((row) => row.dedupe_key.split(':').at(-2)).sort()
    // On 3 November: the offer (ends 4 Nov) is open; on 5 November it is over and the lab (5 Nov) is the last day.
    assert.deepEqual(await keys('2026-11-03'), ['board-games', 'cw2-brief', 'graduate-data-analyst', 'hackathon', 'junior-data-engineer', 'lab-room', 'library-fine', 'ra-ml', 'student-books'])
    assert.deepEqual(await keys('2026-11-05'), ['cw2-brief', 'graduate-data-analyst', 'hackathon', 'junior-data-engineer', 'lab-room', 'library-fine', 'ra-ml'])
    assert.deepEqual(await keys('2026-12-05'), [])
    assert.equal((await reads.items({ day: '2026-10-31' })).filter((row) => row.dedupe_key.endsWith(`:${tag}`)).length, 4)
  })

  await t.test('her status on an item survives an import that changes it', async () => {
    const job = await item('gmail:18c2f0a1b2c3d4e5:graduate-data-analyst')
    const dismissed = await repository.patchHers('items', job.id, job.revision, { status: 'dismissed' })
    assert.equal(dismissed.status, 'dismissed')
    await assert.rejects(repository.patchHers('items', job.id, job.revision, { status: 'kept' }), { status: 409 })
    await assert.rejects(repository.patchHers('items', job.id, dismissed.revision, { title: 'not hers' }), { status: 400 })
    const result = await importer.apply(variant2((batch) => { batch.items[2].summary = 'Cardiff, GBP 28,500, graduate entry.' }))
    assert.deepEqual(result.counts.items, { new: 0, updated: 1, unchanged: 8 })
    const after = await item('gmail:18c2f0a1b2c3d4e5:graduate-data-analyst')
    assert.equal(after.summary, 'Cardiff, GBP 28,500, graduate entry.')
    assert.equal(after.status, 'dismissed')
    // Undoing that batch puts the summary back and keeps her dismissal, which came before it.
    assert.deepEqual(await importer.undo(result.batchId), { undone: true, records: 5 }) // four sources and the item
    const back = await item('gmail:18c2f0a1b2c3d4e5:graduate-data-analyst')
    assert.equal(back.summary, 'Cardiff, GBP 28,000, graduate entry.')
    assert.equal(back.status, 'dismissed')
  })

  await t.test('a version 1 batch leaves stored links alone', async () => {
    const other = await importer.apply(variant2((batch) => { batch.items[0].title = 'DS101 week 7 lab: Room 0.12' }))
    assert.deepEqual(other.counts.items, { new: 0, updated: 1, unchanged: 8 })
    const v1 = { format: 'life-os.mail-batch', version: 1, runId: `2026-11-02-0800-${tag}`, gatheredAt: '2026-11-02T08:00:00Z', agent: 'test',
      sources: first.sources, digest: { headline: 'One job alert.' }, actions: [],
      messages: [{ ...first.messages[2], links: undefined }] }
    delete v1.messages[0].links
    const result = await importer.apply(v1)
    assert.deepEqual(result.counts.messages, { new: 0, updated: 0, unchanged: 1 })
    const alert = (await pool.query('SELECT links FROM mail.messages WHERE source_id = $1 AND source_message_id = $2', [`gmail-${tag}`, '18c2f0a1b2c3d4e5'])).rows[0]
    assert.equal(alert.links.length, 3)
  })

  await t.test('the Harvest log: days with their counts, one day in full, the sources as last read', async () => {
    const { createMailReads } = await import('./reads.js')
    const reads = createMailReads({ pool })
    const days = await reads.days()
    const october31 = days.find((entry) => entry.day === '2026-10-31')
    assert.ok(october31.kinds.vacancy >= 3 && october31.kinds.offer >= 1 && october31.sources[`gmail-${tag}`] === 2)
    assert.ok(days.findIndex((entry) => entry.day === '2026-11-01') < days.findIndex((entry) => entry.day === '2026-10-31'), 'newest first')
    const day = await reads.day('2026-10-31')
    const items = day.items.filter((row) => row.dedupe_key.endsWith(`:${tag}`))
    const messages = day.messages.filter((row) => row.source_id.endsWith(`-${tag}`))
    assert.deepEqual(items.map((row) => row.dedupe_key.split(':').at(-2)).sort(), ['graduate-data-analyst', 'junior-data-engineer', 'ra-ml', 'student-books'])
    assert.deepEqual(messages.map((row) => row.subject).sort(), ['3 new jobs for data analyst in Cardiff', 'Students: 20% off until 4 November'])
    assert.ok(day.runs.some((run) => run.run_id === first.runId && run.version === 2))
    assert.equal(await reads.day('31 October'), null)
    const v2Sources = new Set(first.sources.map((source) => source.id))
    const sources = (await reads.sources()).filter((source) => v2Sources.has(source.id))
    assert.equal(sources.length, 4)
    assert.ok(sources.every((source) => source.status === 'read' && source.window_to && source.gathered_at))
  })

  await t.test('Everything: filters by area, kind, status, closing and words; newest first', async () => {
    const { createMailReads } = await import('./reads.js')
    const reads = createMailReads({ pool })
    const keys = async (filters) => (await reads.items({ today: '2026-11-03', ...filters })).filter((row) => row.dedupe_key.endsWith(`:${tag}`)).map((row) => row.dedupe_key.split(':').at(-2))
    assert.deepEqual((await keys({ kind: 'vacancy' })).sort(), ['graduate-data-analyst', 'junior-data-engineer', 'ra-ml'])
    assert.deepEqual((await keys({ area: 'research' })), ['ra-ml'])
    assert.deepEqual((await keys({ status: 'dismissed' })), ['graduate-data-analyst'])
    assert.ok(!(await keys({ status: 'live' })).includes('graduate-data-analyst'))
    assert.deepEqual((await keys({ closing: 'week' })).sort(), ['graduate-data-analyst', 'student-books'])
    assert.deepEqual((await keys({ closing: 'past', today: '2026-11-21' })).sort(), ['graduate-data-analyst', 'hackathon', 'junior-data-engineer', 'library-fine', 'student-books'])
    assert.deepEqual((await keys({ q: 'health board' })), ['graduate-data-analyst'])
    assert.equal((await keys({ sort: 'newest' }))[0], 'board-games') // 1 November; the 30 October ones last
  })

  await t.test('undo of a batch that added items removes them all', async () => {
    const mark = `${tag.slice(0, 3)}v2n`
    const added = await importer.apply(variant2(() => {}, mark))
    assert.equal(added.counts.items.new, 9)
    assert.deepEqual(await importer.undo(added.batchId), { undone: true, records: 20 }) // 4 sources, 6 messages, 1 action, 9 items
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM mail.items WHERE first_batch_id = $1 AND deleted_at IS NULL', [added.batchId])).rows[0].n, 0)
  })
})

// CP8: a backfill from 1 September to 3 November, one batch a week, oldest first; then mail first
// stored under stand-in ids sent again under the provider's own ids.
test('backfill on lifeos_test: weekly batches give one log page per day; re-sent mail updates, never duplicates', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const pool = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test', role: 'app' })
  t.after(() => pool.end())
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository })
  const { createMailReads } = await import('./reads.js')
  const reads = createMailReads({ pool })
  const mark = `${tag.slice(0, 4)}bf`
  const source = { id: `gmail-${mark}`, label: 'Gmail', kind: 'gmail', route: 'connector', status: 'read', coverage: 'Made-up backfill.' }
  const days = []
  for (let at = Date.parse('2026-09-01T12:00:00Z'); at <= Date.parse('2026-11-03T12:00:00Z'); at += 86_400_000) days.push(new Date(at).toISOString().slice(0, 10))
  const message = (day, n, id = `s:${mark}${n}`) => ({ ref: `m${n}`, source: source.id, sourceId: id, kind: 'email', receivedAt: `${day}T09:15:00Z`, from: { name: 'Course office', address: `office-${mark}@example.ac.uk` },
    subject: `Notice ${day}`, summary: `Notice sent on ${day}.`, category: 'announcement', priority: 'normal', text: `Notice for ${day}.` })
  const weeks = []
  for (let start = 0; start < days.length; start += 7) weeks.push(days.slice(start, start + 7))
  const batchOf = (week, w, messages) => ({ format: 'life-os.mail-batch', version: 2, runId: `2026-11-04-0800-${tag.slice(0, 4)}${String(w).padStart(2, '0')}`, gatheredAt: '2026-11-04T08:00:00Z',
    agent: 'Made-up backfill for tests (not real mail)', sources: [{ ...source, window: { from: `${week[0]}T00:00:00Z`, to: `${week.at(-1)}T23:59:00Z` } }], messages, actions: [],
    items: messages.map((entry, index) => ({ ref: `i${index + 1}`, key: `${source.id}:${entry.subject}:notice`, area: 'academic', kind: 'announcement', title: entry.subject, summary: entry.summary, day: entry.receivedAt.slice(0, 10), messageRefs: [entry.ref] })) })
  const batches = weeks.map((week, w) => batchOf(week, w, week.map((day, index) => message(day, w * 7 + index + 1))))

  await t.test('ten weekly batches, oldest first: 64 messages and 64 items, one log day each', async () => {
    let messages = 0
    let items = 0
    for (const batch of batches) {
      const result = await importer.apply(batch)
      messages += result.counts.messages.new
      items += result.counts.items.new
    }
    assert.equal(batches.length, 10)
    assert.equal(days.length, 64)
    assert.equal(messages, 64)
    assert.equal(items, 64)
    const logged = new Set((await reads.days({ limit: 2000 })).map((entry) => entry.day))
    assert.ok(days.every((day) => logged.has(day)))
    const september = await reads.day('2026-09-14')
    assert.deepEqual(september.items.filter((row) => row.source_id === source.id).map((row) => row.title), ['Notice 2026-09-14'])
    assert.ok(september.runs.some((run) => run.run_id === batches[1].runId))
    assert.equal((await importer.apply(batches[0])).repeated, true)
  })

  await t.test('the same mail sent again under the provider’s own ids updates the stored copies', async () => {
    const week = weeks[0]
    const resent = batchOf(week, 90, week.map((day, index) => ({ ...message(day, index + 1, `18f${mark}${index}`.replace(/[^0-9a-f]/g, '0').padEnd(16, '0')), text: `Notice for ${day}, in full.` })))
    resent.runId = `2026-11-04-0900-${tag.slice(0, 4)}90`
    const result = await importer.apply(resent)
    assert.deepEqual(result.counts.messages, { new: 0, updated: 7, unchanged: 0 })
    assert.deepEqual(result.counts.items, { new: 0, updated: 0, unchanged: 7 })
    const stored = (await pool.query('SELECT source_message_id, body FROM mail.messages WHERE source_id = $1 AND deleted_at IS NULL ORDER BY received_at', [source.id])).rows
    assert.equal(stored.length, 64)
    assert.ok(stored.slice(0, 7).every((row) => /^18f[0-9a-f]+$/.test(row.source_message_id) && row.body.endsWith('in full.')))
    assert.ok(stored.slice(7).every((row) => row.source_message_id.startsWith('s:')))
    // Two messages that only look alike (same minute, same sender, different subject) stay two.
    const other = batchOf(week, 91, [{ ...message(week[0], 1, `other-${mark}`), subject: 'A different notice' }])
    other.runId = `2026-11-04-0910-${tag.slice(0, 4)}91`
    other.items = []
    assert.equal((await importer.apply(other)).counts.messages.new, 1)
  })
})
