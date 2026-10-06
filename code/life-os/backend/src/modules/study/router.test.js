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
