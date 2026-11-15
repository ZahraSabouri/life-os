// The day's checklist keeps a tick for what has no done-state of its own: a class gone to, a
// study block worked, an event, a meal. One setting per day, `checks-YYYY-MM-DD`, holding
// { <thing's key>: { at, title } }. Her own plans and tasks are ticked on themselves instead.
// Ticks are written one at a time, so two quick ticks never write over each other.
const DAY = /^\d{4}-\d{2}-\d{2}$/
const isDay = (value) => DAY.test(String(value ?? '')) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
const settingFor = (date) => `checks-${date}`
const plain = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
const fail = (message) => Object.assign(new Error(message), { status: 400 })

export function createDayChecks({ readSetting, writeSetting }) {
  let queue = Promise.resolve()
  function serial(work) {
    const run = queue.then(work)
    queue = run.catch(() => {})
    return run
  }
  async function read(date) {
    if (!isDay(date)) throw fail('A day is YYYY-MM-DD')
    return plain(await readSetting(settingFor(date), {}))
  }
  async function toggle({ date, key, done, title }) {
    if (!isDay(date)) throw fail('A day is YYYY-MM-DD')
    if (typeof key !== 'string' || !key.trim() || key.length > 300) throw fail('Say which thing is ticked')
    if (typeof done !== 'boolean') throw fail('Say whether it is done')
    return serial(async () => {
      const checks = { ...(await read(date)) }
      if (done) checks[key] = { at: new Date().toISOString(), title: String(title ?? '').trim().slice(0, 200) }
      else delete checks[key]
      await writeSetting(settingFor(date), checks)
      return checks
    })
  }
  async function range(from, to) {
    if (!isDay(from) || !isDay(to) || to < from) throw fail('Give a first and a last day')
    if (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`) > 62 * 86_400_000) throw fail('At most two months at once')
    const out = {}
    for (let date = from; date <= to; date = addDays(date, 1)) {
      const checks = await read(date)
      if (Object.keys(checks).length) out[date] = checks
    }
    return out
  }
  return { read, toggle, range }
}

export function createChecksRouter({ express, checks }) {
  const router = express.Router()
  const handle = (work) => async (req, res) => {
    try { res.set('Cache-Control', 'no-store'); res.json(await work(req)) } catch (error) { res.status(error.status ?? 500).json({ error: error.status ? error.message : 'The tick could not be kept' }) }
  }
  router.get('/', handle(async (req) => ({ checks: req.query.date ? { [req.query.date]: await checks.read(String(req.query.date)) } : await checks.range(String(req.query.from ?? ''), String(req.query.to ?? '')) })))
  router.post('/', handle(async (req) => ({ date: req.body?.date, checks: await checks.toggle(req.body ?? {}) })))
  return router
}
