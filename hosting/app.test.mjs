import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { createLifeOsApp } from './app.mjs'
import db from '../code/life-os/backend/src/db.js'

after(() => db.close())

async function fixture(fn) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'life-os-subapp-'))
  const mainDist = path.join(root, 'main-dist')
  const summerDist = path.join(root, 'dist')
  await fs.mkdir(mainDist)
  await fs.mkdir(summerDist)
  await fs.writeFile(path.join(mainDist, 'index.html'), '<title>Life OS</title>')
  await fs.writeFile(path.join(summerDist, 'index.html'), '<title>Summer Rescue Plan 2026</title>')
  await fs.writeFile(path.join(summerDist, 'worksheet.txt'), 'unchanged resource')
  let server
  async function start() {
    const app = createLifeOsApp({ summerRoot: root, summerDist, mainDist, token: 'fixture-token' })
    server = app.listen(0, '127.0.0.1')
    await new Promise(resolve => server.once('listening', resolve))
    return `http://127.0.0.1:${server.address().port}`
  }
  async function stop() {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
      server.closeIdleConnections()
    })
  }
  try { await fn({ root, start, stop }) }
  finally {
    if (server?.listening) await stop()
    // Only remove the exact temporary test directory returned by mkdtemp.
    assert.equal(path.dirname(root), os.tmpdir())
    assert.ok(path.basename(root).startsWith('life-os-subapp-'))
    await fs.rm(root, { recursive: true, force: true })
  }
}

test('one host serves Life OS routes, the original sub-app and its files', async () => {
  await fixture(async ({ root, start }) => {
    const url = await start()
    const health = await (await fetch(`${url}/__life-os/health`)).json()
    assert.equal(health.subapps[0].root, root)
    assert.match(await (await fetch(`${url}/study`)).text(), /Life OS/)
    assert.match(await (await fetch(`${url}/apps/summer-rescue/`)).text(), /Summer Rescue Plan/)
    assert.equal(await (await fetch(`${url}/apps/summer-rescue/worksheet.txt`)).text(), 'unchanged resource')
    assert.equal((await fetch(`${url}/missing.pdf`)).status, 404)
    assert.equal((await fetch(`${url}/apps/summer-rescue/missing.pdf`)).status, 404)
  })
})

test('Summer Rescue saves and uploaded-resource links survive a host restart', async () => {
  await fixture(async ({ root, start, stop }) => {
    let url = await start()
    const state = { app: 'summer-rescue-plan-app', state: { version: 3, cards: {}, settings: { examStart: '2026-08-01' } } }
    const saved = await fetch(`${url}/api/state`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
    })
    assert.equal(saved.status, 200)
    assert.equal((await saved.json()).dbMirrored, true)
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'local-data/summer-rescue-tracker-state.json'), 'utf8')), state)
    const uploaded = await fetch(`${url}/api/resources/upload`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: 'aml', fileName: 'test-note.txt', dataBase64: Buffer.from('test study resource').toString('base64'), title: 'Fixture resource' }),
    })
    assert.equal(uploaded.status, 201)
    const { resource } = await uploaded.json()
    await stop()
    url = await start()
    assert.deepEqual(await (await fetch(`${url}/api/state`)).json(), state)
    assert.equal(await (await fetch(`${url}${resource.url}`)).text(), 'test study resource')
  })
})

test('Summer Rescue routing does not bypass Life OS API authentication', async () => {
  await fixture(async ({ start }) => {
    const url = await start()
    assert.equal((await fetch(`${url}/api/entries`)).status, 401)
    assert.equal((await fetch(`${url}/api/people`)).status, 401)
    assert.equal((await fetch(`${url}/api/entries`, { headers: { Authorization: 'Bearer fixture-token' } })).status, 200)
    assert.equal((await fetch(`${url}/api/health`)).status, 200)
    assert.equal((await fetch(`${url}/api/state`)).status, 204)
  })
})
