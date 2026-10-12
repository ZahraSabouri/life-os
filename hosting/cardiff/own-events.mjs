// Events she adds to Cardiff Life herself. The researched events come from events.csv, which
// her agents write; these are hers, kept in the Life OS database (one setting holding the
// list) and shaped like a row of that file, so the page and the calendar treat both alike.

export class OwnEventError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// The categories of the Cardiff Life page (planner.js).
export const ACTIVITIES = ['sport', 'dance', 'creative', 'music', 'social', 'professional', 'volunteering']
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/
const text = (value, limit) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, limit)
const validDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value

// A row like events.csv's, from what she typed. `id` is kept when an event is changed.
export function cleanOwnEvent(input, id) {
  const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const name = text(source.name, 200)
  if (!name) throw new OwnEventError(400, 'Give the event a name')
  const date = text(source.date, 10)
  if (date && !validDay(date)) throw new OwnEventError(400, 'That date does not exist')
  const start = text(source.start_time, 5)
  const end = text(source.end_time, 5)
  if (start && !CLOCK.test(start)) throw new OwnEventError(400, 'The start time is a clock time such as 18:30')
  if (end && !CLOCK.test(end)) throw new OwnEventError(400, 'The end time is a clock time such as 20:00')
  if (end && !start) throw new OwnEventError(400, 'Give a start time as well as an end time')
  const link = text(source.source_url, 2000)
  if (link && !/^https?:\/\//i.test(link)) throw new OwnEventError(400, 'A link starts with http:// or https://')
  const activity = ACTIVITIES.includes(source.activity) ? source.activity : 'social'
  return {
    event_id: id ?? `own-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name, date, start_time: start, end_time: end, location: text(source.location, 300), activity,
    organiser: text(source.organiser, 200) || 'Added by you', cost: text(source.cost, 120), description: text(source.description, 4000),
    source_url: link, status: 'upcoming', own: true,
    // The columns the page reads for a researched event; empty here rather than missing.
    category: '', booking_required: '', experience: '', recurring: '', last_checked: '',
  }
}

const listOf = (value) => (Array.isArray(value) ? value.filter((row) => row && typeof row.event_id === 'string' && typeof row.name === 'string') : [])

// `read()` gives the kept list, `write(list)` keeps it.
export function createOwnEvents({ read, write }) {
  const all = () => listOf(read())
  return {
    list: all,
    add(input) { const event = cleanOwnEvent(input); if (all().length >= 2000) throw new OwnEventError(413, 'That is more events than can be kept'); write([...all(), event]); return event },
    change(id, input) {
      const list = all()
      if (!list.some((row) => row.event_id === id)) throw new OwnEventError(404, 'That event is no longer here')
      const event = cleanOwnEvent(input, id)
      write(list.map((row) => (row.event_id === id ? event : row)))
      return event
    },
    remove(id) {
      const list = all()
      if (!list.some((row) => row.event_id === id)) throw new OwnEventError(404, 'That event is no longer here')
      write(list.filter((row) => row.event_id !== id))
    },
  }
}

const LOCAL = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
function sameDevice(req) {
  const origin = String(req.headers.origin ?? '').trim()
  if (!origin || origin === 'null') return true
  try { return LOCAL.has(new URL(origin).hostname) } catch { return false }
}

// Mounted under the Cardiff Life page's own address, so the page reaches it with a relative path.
export function createOwnEventsRouter({ express, events }) {
  const router = express.Router()
  router.use((req, res, next) => {
    if (!sameDevice(req)) return res.status(403).json({ ok: false, error: 'Cardiff Life only answers this computer.' })
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.use(express.json({ limit: '200kb' }))
  const handle = (work) => (req, res) => {
    try { res.json({ ok: true, ...work(req) }) } catch (error) {
      const status = error instanceof OwnEventError ? error.status : 500
      if (status === 500) console.error('Cardiff Life:', error.message)
      res.status(status).json({ ok: false, error: status === 500 ? 'That could not be saved. Try again.' : error.message })
    }
  }
  router.get('/', handle(() => ({ events: events.list() })))
  router.post('/', handle((req) => ({ event: events.add(req.body) })))
  router.patch('/:id', handle((req) => ({ event: events.change(req.params.id, req.body) })))
  router.delete('/:id', handle((req) => { events.remove(req.params.id); return {} }))
  return router
}
