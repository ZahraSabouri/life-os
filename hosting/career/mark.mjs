// A job marked from the day: "applied", "rejected". JobMap's own server saves it by its own
// rules (the date applied, the line in the job's history, its revision check); this carries her
// click to it and brings back what the status was, so the click can be undone.

export class JobMarkError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// JobMap's own statuses (jobmap/lib/store.mjs).
export const JOB_STATUSES = ['To review', 'Check details', 'Preparing', 'Applied', 'Interview', 'Offer', 'Rejected', 'Archived']

export function createJobMark({ getJobMapPort, request = fetch, timeoutMs = 6000 }) {
  const call = async (port, path, init = {}) => {
    let response
    try {
      response = await request(`http://127.0.0.1:${port}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', 'X-JobMap-Client': 'workspace-v1' },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch { throw new JobMarkError(503, 'JobMap did not answer. Open JobMap and try again.') }
    const body = await response.json().catch(() => ({}))
    return { status: response.status, ok: response.ok, body }
  }
  return async function mark(input) {
    const id = typeof input?.job === 'string' ? input.job.trim() : ''
    const status = input?.status
    if (!id || id.length > 200) throw new JobMarkError(400, 'Say which job')
    if (!JOB_STATUSES.includes(status)) throw new JobMarkError(400, 'That is not one of JobMap’s statuses')
    // An undo also puts back the date applied that JobMap filled in by itself.
    const applied = input?.applied
    if (applied !== undefined && !(typeof applied === 'string' && /^(\d{4}-\d{2}-\d{2})?$/.test(applied))) throw new JobMarkError(400, 'The date applied is a day, or empty')
    const patch = applied === undefined ? { status } : { status, applied }
    const port = getJobMapPort?.()
    if (!port) throw new JobMarkError(503, 'JobMap is not running')
    // JobMap refuses a change made against an older revision. Another window may save between
    // the two requests, so the pair is tried twice.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const health = await call(port, '/api/health')
      if (!health.ok || !Number.isSafeInteger(health.body.revision)) throw new JobMarkError(503, 'JobMap did not answer. Open JobMap and try again.')
      const saved = await call(port, `/api/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ patch, revision: health.body.revision }) })
      if (saved.status === 409 && attempt === 0) continue
      if (!saved.ok) throw new JobMarkError(saved.status === 409 ? 409 : /not found/i.test(saved.body.error ?? '') ? 404 : 502, saved.body.error || 'JobMap could not save that')
      const job = saved.body.job ?? {}
      return {
        job: { id, role: String(job.role ?? ''), company: String(job.company ?? ''), status: job.status, applied: String(job.applied ?? '') },
        // What it was before, as JobMap reports it: the status, and the date applied when that changed too.
        previous: { status: saved.body.previous?.status ?? '', ...(typeof saved.body.previous?.applied === 'string' ? { applied: saved.body.previous.applied.slice(0, 10) } : {}) },
      }
    }
    throw new JobMarkError(409, 'JobMap changed while this was being saved. Try again.')
  }
}

export function createJobMarkHandler(mark) {
  return async (req, res) => {
    try { res.json({ ok: true, ...await mark({ job: req.body?.job, status: req.body?.status, applied: req.body?.applied }) }) } catch (error) {
      const status = error instanceof JobMarkError ? error.status : 500
      if (status === 500) console.error('Job mark:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'That could not be saved. Try again.' : error.message })
    }
  }
}
