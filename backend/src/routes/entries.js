import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'

const router = Router()
const ENTRY_TYPES = new Set(['note', 'task', 'event'])

const insertEntry = db.prepare(`
  INSERT INTO entries (
    id,
    type,
    title,
    status,
    start_at,
    end_at,
    all_day,
    details,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const selectRecentEntries = db.prepare(`
  SELECT * FROM entries
  ORDER BY created_at DESC
  LIMIT ?
`)

const selectEntryById = db.prepare(`
  SELECT * FROM entries
  WHERE id = ?
`)

const selectEntriesInRange = db.prepare(`
  SELECT * FROM entries
  WHERE start_at IS NOT NULL
    AND (? IS NULL OR date(start_at) >= date(?))
    AND (? IS NULL OR date(start_at) <= date(?))
  ORDER BY date(start_at) ASC, created_at DESC
  LIMIT ?
`)

const updateEntry = db.prepare(`
  UPDATE entries
     SET title = ?,
         status = ?,
         start_at = ?,
         end_at = ?,
         all_day = ?,
         details = ?,
         updated_at = ?
   WHERE id = ?
`)

function parseDetails(value) {
  if (!value) return {}

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function cleanOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${fieldName} must be an ISO date string`)
  }

  return value.trim()
}

function serializeEntry(row) {
  return {
    ...row,
    all_day: Boolean(row.all_day),
    details: parseDetails(row.details)
  }
}

router.post('/', (req, res) => {
  try {
    const {
      type = 'note',
      title = null,
      status = null,
      start_at = null,
      end_at = null,
      all_day = false,
      details = {}
    } = req.body ?? {}

    const id = randomUUID()
    const now = new Date().toISOString()
    const cleanType = String(type || 'note').trim() || 'note'

    if (!ENTRY_TYPES.has(cleanType)) {
      return res.status(400).json({ error: `type must be one of: ${Array.from(ENTRY_TYPES).join(', ')}` })
    }

    const cleanTitle = cleanOptionalString(title)
    const cleanStatus = cleanOptionalString(status)
    const cleanStartAt = cleanOptionalDate(start_at, 'start_at')
    const cleanEndAt = cleanOptionalDate(end_at, 'end_at')
    const cleanAllDay = all_day ? 1 : 0
    const cleanDetails = details && typeof details === 'object' && !Array.isArray(details)
      ? details
      : {}

    insertEntry.run(
      id,
      cleanType,
      cleanTitle,
      cleanStatus,
      cleanStartAt,
      cleanEndAt,
      cleanAllDay,
      JSON.stringify(cleanDetails),
      now,
      now
    )

    res.status(201).json({
      id,
      type: cleanType,
      title: cleanTitle,
      status: cleanStatus,
      start_at: cleanStartAt,
      end_at: cleanEndAt,
      all_day: Boolean(cleanAllDay),
      details: cleanDetails,
      created_at: now,
      updated_at: now
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/', (req, res) => {
  try {
    const from = cleanOptionalDate(req.query.from, 'from')
    const end = cleanOptionalDate(req.query.end, 'end')
    const requestedLimit = Number(req.query.limit)
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100))
      : 10

    if (from || end) {
      const rows = selectEntriesInRange.all(from, from, end, end, 500)
      return res.json(rows.map(serializeEntry))
    }

    const rows = selectRecentEntries.all(limit)

    res.json(rows.map(serializeEntry))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.patch('/:id', (req, res) => {
  try {
    const existing = selectEntryById.get(req.params.id)

    if (!existing) {
      return res.status(404).json({ error: 'not found' })
    }

    const body = req.body ?? {}
    const title = 'title' in body
      ? cleanOptionalString(body.title)
      : existing.title
    const status = 'status' in body
      ? cleanOptionalString(body.status)
      : existing.status
    const startAt = 'start_at' in body
      ? cleanOptionalDate(body.start_at, 'start_at')
      : existing.start_at
    const endAt = 'end_at' in body
      ? cleanOptionalDate(body.end_at, 'end_at')
      : existing.end_at
    const allDay = 'all_day' in body
      ? (body.all_day ? 1 : 0)
      : existing.all_day
    const details = 'details' in body && body.details && typeof body.details === 'object' && !Array.isArray(body.details)
      ? JSON.stringify(body.details)
      : existing.details
    const now = new Date().toISOString()

    updateEntry.run(title, status, startAt, endAt, allDay, details, now, req.params.id)

    res.json(serializeEntry(selectEntryById.get(req.params.id)))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
