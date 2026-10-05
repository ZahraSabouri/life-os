import test from 'node:test'
import assert from 'node:assert/strict'
import express from '../code/life-os/backend/node_modules/express/index.js'
import { createCalendarRouter } from './calendar-route.mjs'

test('calendar HTTP route protects the API, validates ranges and never accepts writes', async () => {
  const calls = []
  const app = express()
  app.use('/api', (req, res, next) => req.get('authorization') === 'Bearer fixture' ? next() : res.sendStatus(401))
  app.use('/api/calendar', createCalendarRouter(async range => {
    calls.push(range)
    return {items:[],sources:[{area:'study',status:'unavailable'}]}
  }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const url = `http://127.0.0.1:${server.address().port}/api/calendar`
  const headers = {Authorization:'Bearer fixture'}
  try {
    assert.equal((await fetch(`${url}?from=2026-10-01&to=2026-10-31`)).status, 401)
    for (const query of ['from=2026-02-30&to=2026-03-02','from=2026-10-31&to=2026-10-01','from=2026-01-01&to=2028-01-01','from=x&to=x']) {
      assert.equal((await fetch(`${url}?${query}`, {headers})).status, 400)
    }
    const response = await fetch(`${url}?from=2026-10-01&to=2026-10-31`, {headers})
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).sources[0].status, 'unavailable')
    assert.equal((await fetch(url, {method:'POST',headers})).status, 404)
    assert.deepEqual(calls, [{from:'2026-10-01',to:'2026-10-31'}])
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
