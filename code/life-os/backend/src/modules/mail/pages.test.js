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

// Stage 5: what came in, through the routes the strips, the Harvest log and Everything use.
test('harvest routes on lifeos_test: a part, places, the log, bulk Keep and Dismiss', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const pool = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test', role: 'app' })
  t.after(() => pool.end())
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository })
  const reads = createMailReads({ pool })
  const mark = `${tag.slice(0, 4)}pg`
  const v2 = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch-v2.json'), 'utf8'))
  v2.runId = `2026-11-02-0701-${mark}`
  v2.sources.forEach((entry) => { entry.id = `${entry.id}-${mark}` })
  v2.messages.forEach((message) => { message.source = `${message.source}-${mark}` })
  v2.actions.forEach((entry) => { entry.dedupeKey = `${entry.dedupeKey}:${mark}` })
  v2.items.forEach((item) => { item.key = `${item.key}:${mark}` })
  await importer.apply(v2, { fileName: 'pages-v2.json' })
  const places = async (rows) => rows.map((row) => (row.kind === 'vacancy' ? { ...row, place: row.url?.includes('1002') ? { app: 'jobmap', href: '/jobmap#job=EX-1' } : { app: 'jobmap', missing: true } } : row))
  const app = express()
  app.use(express.json())
  app.use('/api/mail', createMailRouter({ repository, importer, inbox: { status: async () => ({}), scan: async () => ({}) }, reads, places, now: () => new Date('2026-11-03T09:00:00Z') }))
  const server = app.listen(0, '127.0.0.1')
  t.after(() => server.close())
  await new Promise((resolve) => server.once('listening', resolve))
  const call = async (route, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mail${route}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, body: await response.json() }
  }
  const ours = (rows) => rows.filter((row) => row.dedupe_key.endsWith(`:${mark}`))

  await t.test('a part gets only its own open items, with where each vacancy is now', async () => {
    const jobs = ours((await call('/items?part=jobmap&open=1')).body.items)
    assert.equal(jobs.length, 3)
    assert.deepEqual(jobs.map((row) => Boolean(row.place?.href)).sort(), [false, false, true])
    assert.deepEqual(ours((await call('/items?part=budget&open=1')).body.items).map((row) => row.kind).sort(), ['info', 'offer'])
    assert.equal(ours((await call('/items?part=study&open=1')).body.items).length, 3)
    assert.equal((await call('/items?part=nowhere')).status, 400)
    assert.equal(ours((await call('/items?kind=vacancy&where=missing')).body.items).length, 2)
  })

  await t.test('the log: days, one day with places, the sources', async () => {
    const days = (await call('/days')).body.days
    assert.ok(days.some((entry) => entry.day === '2026-10-30'))
    const day = (await call('/days/2026-10-31')).body
    assert.equal(ours(day.items).length, 4)
    assert.ok(ours(day.items).filter((row) => row.kind === 'vacancy').every((row) => row.place))
    assert.equal((await call('/days/yesterday')).status, 400)
    assert.ok((await call('/sources')).body.sources.some((source) => source.id === `gmail-${mark}`))
  })

  await t.test('Keep and Dismiss for several at once; one that changed since is named and left alone', async () => {
    const rows = ours((await call('/items?area=academic')).body.items)
    const stale = { id: rows[0].id, revision: rows[0].revision }
    const kept = await call(`/items/${rows[0].id}`, 'PATCH', { revision: rows[0].revision, status: 'kept' })
    assert.equal(kept.status, 200)
    const bulk = await call('/items/bulk', 'POST', { status: 'dismissed', items: [stale, ...rows.slice(1).map((row) => ({ id: row.id, revision: row.revision }))] })
    assert.deepEqual(bulk.body, { saved: rows.length - 1, changed: [rows[0].id] })
    assert.deepEqual(ours((await call('/items?area=academic&status=dismissed')).body.items).length, rows.length - 1)
    assert.equal((await call('/items/bulk', 'POST', { status: 'gone', items: [stale] })).status, 400)
    assert.equal((await call('/items/bulk', 'POST', { status: 'kept', items: [{ id: rows[1].id }] })).status, 400)
    assert.equal((await call(`/items/${rows[1].id}`, 'PATCH', { revision: 1, status: 'kept' })).status, 409)
  })

  await t.test('Today: what came in today and what closes soon, soonest first, at most six, never the digest headline', async () => {
    const summary = (await call('/summary')).body
    assert.equal('headline' in summary, false)
    const { lines, more, today } = summary.cameIn
    assert.ok(lines.length > 0 && lines.length <= 6 && Number.isInteger(more) && Number.isInteger(today))
    const soon = (item) => (['vacancy', 'opportunity'].includes(item.kind) ? item.deadline >= '2026-11-03' && item.deadline <= '2026-11-09' : item.kind === 'offer' ? item.deadline >= '2026-11-03' && item.deadline <= '2026-11-04' : false)
    assert.ok(lines.every((item) => item.day === '2026-11-03' || soon(item)), JSON.stringify(lines.map((item) => [item.kind, item.day, item.deadline])))
    assert.ok(lines.every((item, index) => index === 0 || String(lines[index - 1].deadline ?? item.day) <= String(item.deadline ?? item.day)))
    assert.ok(lines.filter((item) => item.kind === 'vacancy').every((item) => item.place))
  })

  await t.test('the reading room: filters by area, what it led to, dates, priority, not opened; what was taken', async () => {
    const mine = (rows) => rows.filter((row) => row.source_id.endsWith(`-${mark}`)).map((row) => row.subject).sort()
    const list = async (search) => mine((await call(`/messages?${search}&source=`)).body)
    assert.deepEqual(await list('area=jobs'), ['3 new jobs for data analyst in Cardiff'])
    assert.deepEqual(await list('area=research'), ['3 new jobs for data analyst in Cardiff'])
    assert.deepEqual(await list('has=actions'), ['Library fine: GBP 4.50'])
    assert.equal((await list('has=items')).length, 6)
    assert.deepEqual(await list('from=2026-11-01&to=2026-11-01'), ['Data science hackathon: applications open', 'Library fine: GBP 4.50'])
    assert.deepEqual(await list('priority=high'), ['DS101: week 7 lab moved'])
    const alerts = (await call('/messages?area=jobs')).body.find((row) => row.source_id === `gmail-${mark}`)
    assert.equal(alerts.taken, 3)
    assert.equal(alerts.owed, 0)
    const opened = (await call(`/messages/${alerts.id}`)).body
    assert.deepEqual(opened.taken.items.map((item) => item.kind), ['vacancy', 'vacancy', 'vacancy'])
    assert.ok(opened.taken.items.every((item) => item.place))
    assert.equal(opened.links.length, 3)
    assert.ok(!(await list('notseen=1')).includes('3 new jobs for data analyst in Cardiff'), 'opened now')
  })

  await t.test('sender rules: fold marks the rows, hide leaves them out until hidden ones are shown, and both can be undone', async () => {
    const address = `alerts-${mark}@jobs.example.com`
    await pool.query('UPDATE mail.messages SET from_address = $1 WHERE source_id = $2 AND source_message_id = $3', [address, `gmail-${mark}`, '18c2f0a1b2c3d4e5'])
    const folded = await call('/senders', 'POST', { address: address.toUpperCase(), name: 'Job alerts', rule: 'fold' })
    assert.equal(folded.status, 201)
    assert.equal(folded.body.address, address)
    const row = async (search = '') => (await call(`/messages?source=gmail-${mark}${search}`)).body.find((entry) => entry.from_address === address)
    assert.equal((await row()).rule, 'fold')
    const hidden = await call('/senders', 'POST', { address, rule: 'hide' })
    assert.equal(hidden.body.id, folded.body.id)
    assert.equal(await row(), undefined)
    assert.equal((await row('&hidden=1')).rule, 'hide')
    assert.ok((await call('/senders')).body.senders.some((entry) => entry.address === address && entry.rule === 'hide'))
    assert.equal((await call(`/senders/${hidden.body.id}/remove`, 'POST', { revision: folded.body.revision })).status, 409)
    assert.equal((await call(`/senders/${hidden.body.id}/remove`, 'POST', { revision: hidden.body.revision })).status, 200)
    assert.equal((await row()).rule, null)
    assert.equal((await call('/senders', 'POST', { address: 'not an address', rule: 'hide' })).status, 400)
  })

  await t.test('several messages at once: hide, show again, mark as opened; a changed one is named', async () => {
    const rows = (await call(`/messages?source=uni-outlook-${mark}`)).body
    assert.equal(rows.length, 2)
    const hide = await call('/messages/bulk', 'POST', { change: 'hide', messages: rows.map((entry) => ({ id: entry.id, revision: entry.revision })) })
    assert.deepEqual(hide.body, { saved: 2, changed: [] })
    assert.equal((await call(`/messages?source=uni-outlook-${mark}`)).body.length, 0)
    const again = await call('/messages/bulk', 'POST', { change: 'show', messages: rows.map((entry) => ({ id: entry.id, revision: entry.revision })) })
    assert.deepEqual(again.body, { saved: 0, changed: rows.map((entry) => entry.id) })
    const fresh = (await call(`/messages?source=uni-outlook-${mark}&hidden=1`)).body
    assert.deepEqual((await call('/messages/bulk', 'POST', { change: 'show', messages: fresh.map((entry) => ({ id: entry.id, revision: entry.revision })) })).body.saved, 2)
    assert.equal((await call('/messages/bulk', 'POST', { change: 'delete', messages: fresh })).status, 400)
  })
})

// Stage 6: the Desk's routes. Things with their domains, Now, counts, what was kept quiet, one thing
// in full, a taught sender's domain, and the JobMap change offered for an application.
test('desk routes on lifeos_test: domains, Now, one thing in full, a taught sender, the JobMap change', { skip: !enabled }, async (t) => {
  const { postgresConfig, createPostgresPool } = await import('../../postgres.js')
  const pool = createPostgresPool(postgresConfig(projectRoot), { database: 'lifeos_test', role: 'app' })
  t.after(() => pool.end())
  assert.equal((await pool.query('SELECT current_database() AS name')).rows[0].name, 'lifeos_test', 'Refusing to use a non-test database')
  const repository = createMailRepository({ pool })
  const importer = createMailImporter({ repository })
  const reads = createMailReads({ pool })
  const mark = `${tag.slice(0, 4)}dk`
  const kinds = JSON.parse(fs.readFileSync(path.join(projectRoot, 'mail/example-batch-v2-kinds.json'), 'utf8'))
  kinds.runId = `2026-11-03-0701-${tag.slice(0, 4)}dk`
  kinds.sources.forEach((entry) => { entry.id = `${entry.id}-${mark}` })
  kinds.messages.forEach((message) => { message.source = `${message.source}-${mark}`; if (message.from?.address) message.from.address = message.from.address.replace('@', `+${mark}@`) })
  kinds.actions.forEach((entry) => { entry.dedupeKey = `${entry.dedupeKey}:${mark}` })
  kinds.items.forEach((item) => { item.key = `${item.key}:${mark}` })
  await importer.apply(kinds, { fileName: 'desk.json' })
  const places = async (rows) => rows.map((row) => (row.kind === 'application' ? { ...row, place: { app: 'jobmap', href: '/jobmap#job=NB-1', id: 'NB-1', status: 'To review' } } : row))
  const app = express()
  app.use(express.json())
  app.use('/api/mail', createMailRouter({ repository, importer, inbox: { status: async () => ({}), scan: async () => ({}) }, reads, places, now: () => new Date('2026-11-03T09:00:00Z') }))
  const server = app.listen(0, '127.0.0.1')
  t.after(() => server.close())
  await new Promise((resolve) => server.once('listening', resolve))
  const call = async (route, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mail${route}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, body: await response.json() }
  }
  const mine = (things) => Object.fromEntries(things.filter((thing) => thing.dedupe_key.endsWith(`:${mark}`)).map((thing) => [thing.kind, thing]))

  await t.test('every open thing has its domain, its latest step and, for an application, the JobMap change', async () => {
    const desk = (await call('/desk')).body
    const things = mine(desk.things)
    assert.deepEqual(Object.fromEntries(Object.entries(things).map(([kind, thing]) => [kind, thing.domain])), {
      order: 'home', application: 'work', bill: 'money', subscription: 'money', booking: 'travel', appointment: 'health', official: 'admin', person: 'social', tenancy: 'home', opportunity: 'learning', account: 'admin' })
    assert.equal(things.order.last_step.state, 'dispatched')
    assert.equal(things.order.steps, 1)
    assert.equal(things.order.soon, true, 'delivery expected tomorrow')
    assert.deepEqual(things.application.suggestion, { job: 'NB-1', status: 'Applied', from: 'To review' })
    assert.ok(desk.now.things.includes(things.order.id) && desk.now.things.includes(things.application.id))
    assert.ok(!desk.now.things.includes(things.booking.id), 'the train is on 21 November')
    assert.ok(desk.domains.home.open >= 2 && desk.domains.travel.open >= 1)
    assert.ok(Number.isInteger(desk.quiet.total) && Array.isArray(desk.quiet.senders))
    assert.ok(Array.isArray(desk.now.actions))
  })

  await t.test('one thing in full: what happened, the messages behind it, what it led to', async () => {
    const application = mine((await call('/desk')).body.things).application
    const full = (await call(`/items/${application.id}`)).body
    assert.deepEqual(full.steps.map((step) => step.state), ['test'])
    assert.equal(full.messages.length, 1)
    assert.equal(full.messages[0].subject, 'Next step: online numerical test')
    assert.equal(full.actions[0].title, 'Take the Northbridge online test')
    assert.equal(full.domain, 'work')
    assert.equal((await call('/items/00000000-0000-0000-0000-000000000000')).status, 404)
  })

  await t.test('a taught sender files its things under her domain; her own choice on a thing wins over it', async () => {
    const taught = await call('/senders', 'POST', { address: `orders+${mark}@books.example.com`, rule: 'file', domain: 'money' })
    assert.equal(taught.status, 201)
    assert.equal(taught.body.domain, 'money')
    let order = mine((await call('/desk')).body.things).order
    assert.equal(order.domain, 'money')
    await call(`/items/${order.id}`, 'PATCH', { revision: order.revision, her_domain: 'home' })
    order = mine((await call('/desk')).body.things).order
    assert.equal(order.domain, 'home')
    assert.equal((await call('/senders', 'POST', { address: `x+${mark}@example.com`, rule: 'file' })).status, 400)
    assert.equal((await call(`/items/${order.id}`, 'PATCH', { revision: order.revision, her_domain: 'space' })).status, 400)
    await call(`/senders/${taught.body.id}/remove`, 'POST', { revision: taught.body.revision })
  })
})
