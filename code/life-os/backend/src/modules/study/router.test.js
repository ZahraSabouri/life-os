import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createServer } from 'node:http'
import { createStudyRouter } from './router.js'
import { StudyError } from './schema.js'

async function fixture(t, repository, imports) {
  const app = express()
  app.use(express.json())
  app.use('/api/study', createStudyRouter({ repository, imports }))
  app.use((_error, _req, res, _next) => res.status(500).json({ error: 'fixture error' }))
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)) })
  const base = `http://127.0.0.1:${server.address().port}/api/study`
  return (route, options) => fetch(`${base}${route}`, options)
}

test('workspace and full export use the injected fixture repository', async (t) => {
  const fetchApi = await fixture(t, { workspace: async () => ({ cards: [{ title: 'Fixture' }] }), exportWorkspace: async () => ({ cards: [], meta: { include_deleted: true } }) })
  assert.equal((await (await fetchApi('/workspace')).json()).cards[0].title, 'Fixture')
  const exported = await fetchApi('/export')
  assert.match(exported.headers.get('content-disposition'), /life-os-study\.json/)
  assert.equal((await exported.json()).meta.include_deleted, true)
})

test('stale conflicts and unavailable storage remain distinct statuses', async (t) => {
  const fetchApi = await fixture(t, { workspace: async () => { throw Object.assign(new Error('not ready'), { code: 'ECONNREFUSED' }) }, patch: async () => { throw new StudyError(409, 'Reload before saving', { current: { revision: 5 } }) } })
  assert.equal((await fetchApi('/workspace')).status, 503)
  const result = await fetchApi('/cards/fixture', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revision: 4, title: 'Changed' }) })
  assert.equal(result.status, 409)
  assert.equal((await result.json()).details.current.revision, 5)
})

test('preview and apply delegate only supported actions and formats', async (t) => {
  const seen = []
  const fetchApi = await fixture(t, {}, { json: { preview: async (body) => { seen.push(body); return { added: 1 } }, apply: async () => ({ inserted: 1 }) } })
  const request = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'fixture JSON' }) }
  assert.equal((await (await fetchApi('/imports/json/preview', request)).json()).added, 1)
  assert.deepEqual(seen, [{ text: 'fixture JSON' }])
  assert.equal((await fetchApi('/imports/json/apply', request)).status, 200)
  assert.equal((await fetchApi('/imports/json/delete', request)).status, 404)
  assert.equal((await fetchApi('/imports/__proto__/preview', request)).status, 404)
})

test('history, removed records, restore and revert are routed with strict bodies', async (t) => {
  const seen = []
  const fetchApi = await fixture(t, {
    deleted: async () => ({ cards: [{ id: 'gone' }] }),
    recordHistory: async (entity, id) => ({ entity, record: { id }, history: [] }),
    restore: async (entity, id, revision) => { seen.push(['restore', entity, id, revision]); return { id, deleted_at: null } },
    revert: async (entity, id, body) => { seen.push(['revert', entity, id, body]); return { id, revision: 9 } },
  })
  const post = body => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal((await (await fetchApi('/deleted')).json()).cards[0].id, 'gone')
  assert.equal((await (await fetchApi('/cards/abc/history')).json()).record.id, 'abc')
  assert.equal((await (await fetchApi('/cards/abc/restore', post({ revision: 4 }))).json()).deleted_at, null)
  assert.equal((await fetchApi('/cards/abc/restore', post({ revision: 4, title: 'Changed while restoring' }))).status, 400)
  assert.equal((await (await fetchApi('/modules/abc/revert', post({ revision: 2, history_id: 'h' }))).json()).revision, 9)
  assert.deepEqual(seen, [['restore', 'cards', 'abc', 4], ['revert', 'modules', 'abc', { revision: 2, history_id: 'h' }]])
  assert.equal((await fetchApi('/unknown/abc/restore', post({ revision: 1 }))).status, 404)
})
