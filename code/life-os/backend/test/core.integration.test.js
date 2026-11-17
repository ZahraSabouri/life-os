// The core's routes on PostgreSQL (stage 7), in the test database only:
// LIFE_OS_CORE_DATABASE=lifeos_test node --test test/core.integration.test.js
// Everything it adds is removed again; pictures go to a temporary folder, not the data folder.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import express from 'express'
import { ROOMS } from '../../shared/rooms.js'

const enabled = process.env.LIFE_OS_CORE_DATABASE === 'lifeos_test'
// A one-pixel PNG.
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('the core on lifeos_test: entries, days, If-Match, pictures, people, settings, rooms', { skip: !enabled && 'Set LIFE_OS_CORE_DATABASE=lifeos_test to run it' }, async (t) => {
  const pictures = fs.mkdtempSync(path.join(os.tmpdir(), 'life-os-core-'))
  process.env.LIFE_OS_DATA_DIR = pictures
  const { default: db } = await import('../src/db.js')
  assert.equal((await db.prepare('SELECT current_database() AS name').get()).name, 'lifeos_test', 'Refusing to use a non-test database')
  const { default: entries } = await import('../src/routes/entries.js')
  const { default: people } = await import('../src/routes/people.js')
  const { default: settings, readSetting, writeSetting } = await import('../src/routes/settings.js')
  const { default: files } = await import('../src/routes/files.js')

  const app = express()
  app.use(express.json({ limit: '36mb' }))
  app.use('/entries', entries)
  app.use('/people', people)
  app.use('/settings', settings)
  app.use('/files', files)
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const made = { entries: [], people: [] }
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    for (const id of made.entries) {
      await db.prepare('DELETE FROM files WHERE entry_id = ?').run(id)
      await db.prepare('DELETE FROM entries WHERE id = ?').run(id)
    }
    for (const id of made.people) await db.prepare('DELETE FROM people WHERE id = ?').run(id)
    await db.prepare("DELETE FROM settings WHERE key LIKE 'zz-core-test-%'").run()
    await db.close()
    fs.rmSync(pictures, { recursive: true, force: true })
  })
  const call = async (method, address, body, headers = {}) => {
    const response = await fetch(`${base}${address}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
    return { status: response.status, body: await response.json().catch(() => null) }
  }

  // Entries: made, read back as before (no owner column), found by the UTC day of their start.
  const late = await call('POST', '/entries', { type: 'task', title: 'Late on New Year\'s Eve', start_at: '2099-12-31T23:30:00-02:00' })
  const workout = await call('POST', '/entries', { type: 'workout', title: 'Run', start_at: '2099-12-31', all_day: true })
  assert.equal(late.status, 201); assert.equal(workout.status, 201)
  made.entries.push(late.body.id, workout.body.id)
  const one = await call('GET', `/entries/${workout.body.id}`)
  assert.equal(one.status, 200)
  assert.equal('owner_id' in one.body, false)
  assert.deepEqual([one.body.all_day, one.body.favorite, one.body.files], [true, false, []])
  const onDay = async (day) => (await call('GET', `/entries?from=${day}&end=${day}&limit=50`)).body.map((row) => row.id).filter((id) => made.entries.includes(id))
  // 23:30 at -02:00 is 01:30 on 1 January in UTC, as SQLite's date() said.
  assert.deepEqual(await onDay('2099-12-31'), [workout.body.id])
  assert.deepEqual(await onDay('2100-01-01'), [late.body.id])
  const room = await call('GET', `/entries?room=body&from=2099-12-31&end=2099-12-31`)
  assert.deepEqual(room.body.map((row) => row.id).filter((id) => made.entries.includes(id)), [workout.body.id])

  // If-Match: a stale save is refused; two saves from the same reading, at once, cannot both win.
  assert.equal((await call('PATCH', `/entries/${late.body.id}`, { status: 'done' }, { 'If-Match': '"old"' })).status, 409)
  const read = (await call('GET', `/entries/${late.body.id}`)).body
  await new Promise((resolve) => setTimeout(resolve, 5))
  const both = await Promise.all(['First', 'Second'].map((title) => call('PATCH', `/entries/${late.body.id}`, { title }, { 'If-Match': `"${read.updated_at}"` })))
  assert.deepEqual(both.map((answer) => answer.status).sort(), [200, 409])
  assert.equal((await call('PATCH', '/entries/no-such-entry', { title: 'x' })).status, 404)
  const kept = (await call('GET', `/entries/${late.body.id}`)).body
  assert.equal(kept.title, both.find((answer) => answer.status === 200).body.title)
  assert.equal(kept.start_at, '2099-12-31T23:30:00-02:00')

  // Stage 8: a task's star, its moves and its dated notes are kept and read back; a bad note is refused.
  const at = '2099-12-30T20:00:00.000Z'
  const worked = await call('PATCH', `/entries/${late.body.id}`, { favorite: true, details: {
    moves: [{ at, from: '2099-12-31', to: '2100-01-02', why: 'time' }], log: [{ id: 'n1', at, kind: 'done', text: 'Went well', minutes: 40 }] } }, { 'If-Match': `"${kept.updated_at}"` })
  assert.equal(worked.status, 200, JSON.stringify(worked.body))
  const noted = (await call('GET', `/entries/${late.body.id}`)).body
  assert.equal(noted.favorite, true)
  assert.deepEqual(noted.details.moves, [{ at, from: '2099-12-31', to: '2100-01-02', why: 'time' }])
  assert.deepEqual(noted.details.log, [{ id: 'n1', at, kind: 'done', text: 'Went well', minutes: 40 }])
  assert.equal((await call('PATCH', `/entries/${late.body.id}`, { details: { log: [{ at: 'whenever', text: 'x' }] } })).status, 400)

  // Pictures: kept with the entry, shown with it, and gone with it.
  const picture = await call('POST', '/files', { entry_id: workout.body.id, data: PNG })
  assert.equal(picture.status, 201)
  assert.equal(fs.readdirSync(path.join(pictures, 'files')).length, 1)
  assert.deepEqual((await call('GET', `/entries/${workout.body.id}`)).body.files.map((file) => file.id), [picture.body.id])
  const listed = (await call('GET', '/entries?limit=5000')).body.find((row) => row.id === workout.body.id)
  assert.deepEqual(listed.files.map((file) => file.id), [picture.body.id])
  const gone = await call('DELETE', `/entries/${workout.body.id}`)
  assert.equal(gone.status, 200)
  assert.deepEqual(gone.body.deleted.files.map((file) => file.id), [picture.body.id])
  assert.equal('path' in gone.body.deleted.files[0], false)
  assert.equal(fs.readdirSync(path.join(pictures, 'files')).length, 0)
  assert.equal((await call('GET', `/entries/${workout.body.id}`)).status, 404)
  assert.equal((await call('DELETE', `/entries/${workout.body.id}`)).status, 404)

  // People: in name order whatever the case, changed, and removed.
  for (const name of ['zz bea', 'ZZ Ana', 'zz carl']) made.people.push((await call('POST', '/people', { name })).body.id)
  const order = (await call('GET', '/people')).body.filter((row) => made.people.includes(row.id)).map((row) => row.name)
  assert.deepEqual(order, ['ZZ Ana', 'zz bea', 'zz carl'])
  const changed = await call('PATCH', `/people/${made.people[0]}`, { birthday: '1996-03-14' })
  assert.deepEqual([changed.body.name, changed.body.birthday, 'owner_id' in changed.body], ['zz bea', '1996-03-14', false])
  assert.equal((await call('DELETE', `/people/${made.people[2]}`)).status, 200)
  assert.equal((await call('DELETE', `/people/${made.people[2]}`)).status, 404)

  // Settings: kept, changed in place, and read by the server's own readers.
  assert.equal((await call('PUT', '/settings/zz-core-test-one', { value: { a: 1 } })).status, 200)
  assert.equal((await call('PUT', '/settings/zz-core-test-one', { value: { a: 2 } })).status, 200)
  assert.deepEqual((await call('GET', '/settings/zz-core-test-one')).body.value, { a: 2 })
  assert.deepEqual(await readSetting('zz-core-test-one'), { a: 2 })
  await writeSetting('zz-core-test-two', [1, 2])
  assert.deepEqual((await call('GET', '/settings')).body.settings['zz-core-test-two'], [1, 2])
  assert.deepEqual(await readSetting('zz-core-test-never', []), [])

  // Rooms: written at start, and writing them again changes nothing.
  await db.init()
  await db.init()
  const rooms = await db.prepare("SELECT slug, position FROM spaces WHERE id LIKE 'room:%' ORDER BY position").all()
  for (const [position, room] of ROOMS.entries()) assert.equal(rooms.find((row) => row.slug === room.slug)?.position, position, room.slug)
  assert.equal(new Set(rooms.map((row) => row.slug)).size, rooms.length)

  // A transaction that fails leaves nothing behind.
  await assert.rejects(db.transaction(async (tx) => {
    await tx.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('zz-core-test-rolled', '1', 'now')").run()
    throw new Error('stop here')
  }), /stop here/)
  assert.equal(await db.prepare("SELECT 1 FROM settings WHERE key = 'zz-core-test-rolled'").get(), undefined)
})
