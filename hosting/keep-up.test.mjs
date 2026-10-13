import test from 'node:test'
import assert from 'node:assert/strict'
import { keepUp } from './keep-up.mjs'

const quiet = { log() {}, error() {} }
// No real timer: the test asks for each look itself.
const manual = { schedule: () => ({ unref() {} }), unschedule() {} }

test('a part is started, left alone while it answers, and started again when it stops', async () => {
  const seen = []
  let up = false
  let starts = 0
  let stops = 0
  const keeper = keepUp({
    name: 'Budget', ...manual, log: quiet,
    start: async () => { starts += 1; up = true; return { port: 47851, stop: async () => { stops += 1; up = false } } },
    alive: async () => up,
    onChange: (handle) => seen.push(handle?.port ?? null),
  })
  await keeper.first
  assert.deepEqual([starts, seen, keeper.handle.port], [1, [47851], 47851])
  await keeper.check()
  assert.equal(starts, 1)
  // An earlier Life OS, still shutting down, takes the server with it.
  up = false
  await keeper.check()
  assert.deepEqual([starts, seen], [2, [47851, null, 47851]])
  await keeper.stop()
  assert.deepEqual([stops, seen.at(-1), keeper.handle], [1, null, null])
  await keeper.check()
  assert.equal(starts, 2)
})

test('a part that cannot start is tried again at the next look, and looks do not overlap', async () => {
  let attempts = 0
  let release
  const keeper = keepUp({
    name: 'JobMap', ...manual, log: quiet,
    start: async () => { attempts += 1; if (attempts === 1) throw new Error('port in use'); await new Promise((resolve) => { release = resolve }); return { port: 47852, stop: async () => {} } },
    alive: async () => true,
  })
  await keeper.first
  assert.deepEqual([attempts, keeper.handle], [1, null])
  const [a, b] = [keeper.check(), keeper.check()]
  assert.equal(a, b)
  await new Promise((resolve) => setImmediate(resolve))
  release()
  await a
  assert.deepEqual([attempts, keeper.handle.port], [2, 47852])
  await keeper.stop()
})

test('stopped while it was starting, it leaves no server behind', async () => {
  let release
  let stops = 0
  const keeper = keepUp({ name: 'Budget', ...manual, log: quiet, start: async () => { await new Promise((resolve) => { release = resolve }); return { port: 1, stop: async () => { stops += 1 } } }, alive: async () => true })
  await new Promise((resolve) => setImmediate(resolve))
  const stopping = keeper.stop()
  release()
  await stopping
  assert.deepEqual([stops, keeper.handle], [1, null])
})
