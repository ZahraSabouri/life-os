import { Router } from '../code/life-os/backend/node_modules/express/index.js'
import { addDays, isDateKey } from '../code/life-os/shared/calendar.js'

// Kept separate from app.mjs so fixture tests cannot initialise the real DB.
export function createCalendarRouter(loadCalendar) {
  const router = Router()
  router.get('/', async (req, res) => {
    const { from, to } = req.query
    if (!isDateKey(from) || !isDateKey(to) || to < from || to > addDays(from, 365)) {
      return res.status(400).json({ error: 'Choose a valid date range of up to one year.' })
    }
    res.set('Cache-Control', 'no-store')
    try {
      res.json(await loadCalendar({ from, to }))
    } catch {
      res.status(503).json({ error: 'Calendar is unavailable. Please try again.' })
    }
  })
  return router
}
