import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createMailRepository } from './repository.js'
import { createMailImporter } from './importer.js'
import { createMailReads } from './reads.js'
import { createMailRouter } from './router.js'

const projectRoot = fileURLToPath(new URL('../../../../../../', import.meta.url))
const example = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch.json'), 'utf8'))
// Explicit opt-in; the database is checked to be lifeos_test before anything is written.
const enabled = process.env.LIFE_OS_MAIL_TEST_DB === 'lifeos_test'
const tag = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
const source = (id) => `${id}-${tag}`

// The example with its own run and source ids, and a body to search for.
function batch() {
  const copy = structuredClone(example)
  copy.runId = `2026-10-28-0916-${tag}`
  copy.sources.forEach((entry) => { entry.id = source(entry.id) })
  copy.messages.forEach((message) => { message.source = source(message.source) })
  copy.digest.bySource.forEach((line) => { line.source = source(line.source) })
  copy.actions.forEach((action) => { action.dedupeKey = action.dedupeKey.replace(/^(\w+):([^:]+):/, (_, kind, id) => `${kind}:${source(id)}:`) })
  copy.messages[2].text = `Are we still on for Saturday? Bring the zebrafish${tag} notes. <script>alert(1)</script>`
  return copy
}

test('mail pages on lifeos_test: hers, birthdays, reading, search, a person, digests, calendar, bell', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const pool = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test', role: 'app' })
  t.after(() => pool.end())
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository })
  const reads = createMailReads({ pool })
  const day = '2026-10-28'
  const people = [{ id: `jo-${tag}`, name: 'Jo Evans', contact: 'jo.evans@example.ac.uk', birthday: '1999-10-28' }, { id: `sam1-${tag}`, name: 'Sam Taylor', contact: '' }, { id: `sam2-${tag}`, name: 'Sam Lee', contact: '' }, { id: `ana-${tag}`, name: `Ana${tag}`, contact: '' }]
  const app = express()
  app.use(express.json())
  app.use('/api/mail', createMailRouter({ repository, importer, inbox: { status: async () => ({}), scan: async () => ({}) }, reads, findPeople: () => people, now: () => new Date(`${day}T09:00:00Z`) }))
  const server = app.listen(0, '127.0.0.1')
  t.after(() => server.close())
  await new Promise((resolve) => server.once('listening', resolve))
  const call = async (route, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mail${route}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, body: await response.json() }
  }
  const applied = batch()
  await importer.apply(applied, { fileName: 'pages.json' })

  await t.test('a line she owes: the first word sets the kind; one match sets the person, two are offered', async () => {
    const ana = await call('/actions', 'POST', { text: `text Ana${tag} about the weekend` })
    assert.equal(ana.status, 201)
    assert.equal(ana.body.kind, 'text')
    assert.equal(ana.body.area, 'relationships')
    assert.equal(ana.body.person_id, `ana-${tag}`)
    const sam = await call('/actions', 'POST', { text: 'reply to Sam' })
    assert.equal(sam.body.person_id, null)
    assert.equal(sam.body.candidates.length, 2)
    assert.equal((await call('/actions', 'POST', { text: 'library' })).status, 400)
    const done = await call(`/actions/${sam.body.id}`, 'PATCH', { revision: sam.body.revision, status: 'done' })
    assert.equal(done.body.done_by, 'her')
    assert.equal((await call(`/actions/${sam.body.id}`, 'PATCH', { revision: sam.body.revision, status: 'open' })).status, 409)
    assert.equal((await call(`/people/ana-${tag}`)).body.actions.length, 1)
  })

  await t.test('a birthday today is a wish until she acts on it; then it is stored once', async () => {
    const wish = (rows) => rows.filter((row) => row.dedupe_key === `birthday:jo-${tag}:2026`)
    const before = wish((await call('/actions')).body.actions)
    assert.deepEqual(before.map((row) => [row.title, row.virtual]), [['Wish Jo Evans a happy birthday', true]])
    assert.equal((await call('/birthdays', 'POST', { person_id: `jo-${tag}`, person_name: 'Jo Evans', day, status: 'done' })).status, 201)
    assert.deepEqual(wish((await call('/actions')).body.actions).map((row) => [row.status, Boolean(row.virtual)]), [['done', false]])
    assert.equal((await call('/birthdays', 'POST', { person_id: `jo-${tag}`, person_name: 'Jo Evans', day, status: 'open' })).body.status, 'open')
  })

  await t.test('messages: filters, search in a body, the reader marks seen, hide', async () => {
    const gmail = (await call(`/messages?source=${source('gmail')}`)).body
    assert.equal(gmail.length, 2)
    assert.ok(gmail.every((row) => !('body' in row)), 'the list carries no text')
    assert.equal((await call(`/messages?source=${source('uni-outlook')}&filter=deadline`)).body.length, 2)
    assert.equal((await call(`/messages?source=${source('learning-platform')}&filter=announcement`)).body.length, 1)
    assert.equal((await call(`/messages?source=${source('uni-outlook')}&filter=other`)).body.length, 1)
    assert.equal((await call(`/messages?source=${source('uni-outlook')}&unread=1`)).body.length, 1)
    const found = (await call(`/messages?q=zebrafish${tag}`)).body
    assert.equal(found.length, 1)
    assert.equal((await call(`/messages?q=ebrafish${tag.slice(0, 3)}`)).body.length, 1, 'part of a word')
    const opened = (await call(`/messages/${found[0].id}`)).body
    assert.ok(opened.seen_at)
    assert.match(opened.body, /<script>/, 'the text is kept as it came; the page shows it as text')
    assert.equal((await call(`/messages/${opened.id}`, 'PATCH', { revision: opened.revision, hidden_at: new Date().toISOString() })).status, 200)
    assert.equal((await call(`/messages?q=zebrafish${tag}`)).body.length, 0)
    assert.equal((await call(`/messages?q=zebrafish${tag}&hidden=1`)).body.length, 1)
    assert.equal((await call(`/messages/${opened.id}`, 'PATCH', { revision: opened.revision, pinned: true })).status, 409)
    assert.equal((await call(`/messages/${opened.id}`, 'PATCH', { revision: opened.revision + 1, subject: 'not hers' })).status, 400)
  })

  await t.test('a person, digests, the summary, the calendar and the bell', async () => {
    const jo = (await call(`/people/jo-${tag}`)).body
    assert.ok(jo.actions.some((row) => row.title.startsWith('Reply to Jo Evans')))
    assert.ok(jo.messages.length >= 1)
    assert.ok((await call('/digests')).body.digests.some((entry) => entry.run_id === applied.runId && entry.digest.headline))
    const summary = (await call('/summary')).body
    assert.ok(summary.top.length > 0 && summary.top.length <= 5)
    assert.ok(summary.pressing >= 1)
    assert.ok((await reads.dated('2026-10-29', '2026-11-02')).some((row) => row.dedupe_key === `reply:${source('uni-outlook')}:group-report-thread`))
    assert.ok((await reads.forNotices()).actions.length > 0)
  })
})
