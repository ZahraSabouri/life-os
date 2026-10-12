import test from 'node:test'
import assert from 'node:assert/strict'
import { createJobMark, JobMarkError } from './mark.mjs'

// A stand-in for JobMap's server: one job, a revision, and its refusal of an older revision.
function jobMap({ staleOnce = false } = {}) {
  const state = { revision: 7, job: { id: 'J-1', role: 'Data Analyst', company: 'Example', status: 'To review', applied: '' }, calls: [], stale: staleOnce }
  const request = async (url, init = {}) => {
    const path = new URL(url).pathname
    state.calls.push(`${init.method ?? 'GET'} ${path}`)
    assert.equal(init.headers['X-JobMap-Client'], 'workspace-v1')
    const answer = (status, body) => ({ status, ok: status < 400, json: async () => body })
    if (path === '/api/health') return answer(200, { app: 'jobmap-local', revision: state.revision })
    const { patch, revision } = JSON.parse(init.body)
    if (decodeURIComponent(path) !== '/api/jobs/J-1') return answer(400, { error: 'Job not found.' })
    if (state.stale) { state.stale = false; state.revision += 1; return answer(409, { error: 'This workspace changed in another window. Reload and try again.' }) }
    if (revision !== state.revision) return answer(409, { error: 'This workspace changed in another window. Reload and try again.' })
    // As JobMap does: marking "Applied" fills in the date when there is none, and reports it as changed.
    const filled = patch.status === 'Applied' && !state.job.applied && !Object.hasOwn(patch, 'applied') ? { ...patch, applied: '2026-10-12' } : patch
    const previous = Object.fromEntries(Object.keys(filled).map((key) => [key, state.job[key] ?? '']))
    state.job = { ...state.job, ...filled }
    state.revision += 1
    return answer(200, { job: state.job, revision: state.revision, previous })
  }
  return { state, request }
}

test('a job marked from the day is saved by JobMap, and says what it was before', async () => {
  const { state, request } = jobMap()
  const mark = createJobMark({ getJobMapPort: () => 47852, request })
  const saved = await mark({ job: 'J-1', status: 'Applied' })
  assert.deepEqual(saved, { job: { id: 'J-1', role: 'Data Analyst', company: 'Example', status: 'Applied', applied: '2026-10-12' }, previous: { status: 'To review', applied: '' } })
  assert.deepEqual(state.calls, ['GET /api/health', 'PATCH /api/jobs/J-1'])
  // Undo puts back what it was: the status, and the empty date applied.
  assert.deepEqual((await mark({ job: 'J-1', ...saved.previous })).job, { id: 'J-1', role: 'Data Analyst', company: 'Example', status: 'To review', applied: '' })
  await assert.rejects(mark({ job: 'J-1', status: 'Applied', applied: 'yesterday' }), (error) => error.status === 400)
})

test('a save that meets a newer revision is tried once more, then given up plainly', async () => {
  const once = jobMap({ staleOnce: true })
  assert.equal((await createJobMark({ getJobMapPort: () => 1, request: once.request })({ job: 'J-1', status: 'Rejected' })).job.status, 'Rejected')
  assert.equal(once.state.calls.length, 4)
  const always = async (url, init = {}) => ({ status: new URL(url).pathname === '/api/health' ? 200 : 409, ok: new URL(url).pathname === '/api/health', json: async () => (init.method ? { error: 'This workspace changed in another window.' } : { revision: 1 }) })
  await assert.rejects(createJobMark({ getJobMapPort: () => 1, request: always })({ job: 'J-1', status: 'Applied' }), (error) => error instanceof JobMarkError && error.status === 409)
})

test('what cannot be marked is refused before JobMap is asked', async () => {
  const { state, request } = jobMap()
  const mark = createJobMark({ getJobMapPort: () => 47852, request })
  await assert.rejects(mark({ job: '', status: 'Applied' }), (error) => error.status === 400)
  await assert.rejects(mark({ job: 'J-1', status: 'Hired' }), (error) => error.status === 400 && /statuses/.test(error.message))
  assert.equal(state.calls.length, 0)
  await assert.rejects(createJobMark({ getJobMapPort: () => null, request })({ job: 'J-1', status: 'Applied' }), (error) => error.status === 503 && /not running/.test(error.message))
  await assert.rejects(mark({ job: 'J-9', status: 'Applied' }), (error) => error.status === 404)
  await assert.rejects(createJobMark({ getJobMapPort: () => 1, request: async () => { throw new Error('refused') } })({ job: 'J-1', status: 'Applied' }), (error) => error.status === 503)
})
