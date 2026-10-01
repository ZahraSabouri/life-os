import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'
import { archetypeOf, typeExists, validateDetails } from '../../../shared/entryTypes.js'
import { buildEntriesQuery } from '../query.js'

const router = Router()

const insertEntry = db.prepare(`
  INSERT INTO entries (
    id,
    type,
    archetype,
    title,
    status,
    start_at,
    end_at,
    all_day,
    favorite,
    details,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const selectEntryById = db.prepare(`
  SELECT * FROM entries
  WHERE id = ?
`)

const updateEntry = db.prepare(`
  UPDATE entries
     SET title = ?,
         status = ?,
         start_at = ?,
         end_at = ?,
         all_day = ?,
      favorite = ?,
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

function cleanOptionalBoolean(value) {
  if (value === undefined || value === null || value === '') return null
  return Boolean(value)
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
    favorite: Boolean(row.favorite),
    details: parseDetails(row.details)
  }
}

function cleanDetailsForType(type, details) {
  const result = validateDetails(type, details ?? {})

  if (!result.ok) {
    throw new Error(result.errors.join('; '))
  }

  if (result.stripped.length && process.env.NODE_ENV !== 'production') {
    console.warn(`Stripped unknown ${type} detail fields: ${result.stripped.join(', ')}`)
  }

  return result.value
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
      favorite = false,
      details = {}
    } = req.body ?? {}

    const id = randomUUID()
    const now = new Date().toISOString()
    const cleanType = String(type || 'note').trim() || 'note'

    if (!typeExists(cleanType)) {
      return res.status(400).json({ error: `unknown entry type: ${cleanType}` })
    }

    const cleanArchetype = archetypeOf(cleanType)
    const cleanTitle = cleanOptionalString(title)
    const cleanStatus = cleanOptionalString(status)
    const cleanStartAt = cleanOptionalDate(start_at, 'start_at')
    const cleanEndAt = cleanOptionalDate(end_at, 'end_at')
    const cleanAllDay = all_day ? 1 : 0
    const cleanFavorite = cleanOptionalBoolean(favorite) ? 1 : 0
    const cleanDetails = cleanDetailsForType(cleanType, details)

    insertEntry.run(
      id,
      cleanType,
      cleanArchetype,
      cleanTitle,
      cleanStatus,
      cleanStartAt,
      cleanEndAt,
      cleanAllDay,
      cleanFavorite,
      JSON.stringify(cleanDetails),
      now,
      now
    )

    res.status(201).json({
      id,
      type: cleanType,
      archetype: cleanArchetype,
      title: cleanTitle,
      status: cleanStatus,
      start_at: cleanStartAt,
      end_at: cleanEndAt,
      all_day: Boolean(cleanAllDay),
      favorite: Boolean(cleanFavorite),
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
    const requestedLimit = Number(req.query.limit)
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100))
      : 10
    const inlineFilter = req.query.filter ? JSON.parse(String(req.query.filter)) : {}
    const filter = typeof req.query.room === 'string' || typeof req.query.space === 'string'
      ? {
          ...(inlineFilter && typeof inlineFilter === 'object' && !Array.isArray(inlineFilter) ? inlineFilter : {}),
          rooms: [String(req.query.room || req.query.space).trim()].filter(Boolean)
        }
      : inlineFilter

    if (req.query.from || req.query.end || Object.keys(filter || {}).length) {
      const query = buildEntriesQuery(filter, {
        from: cleanOptionalDate(req.query.from, 'from'),
        end: cleanOptionalDate(req.query.end, 'end'),
        limit: Math.max(limit, 100)
      })
      const rows = db.prepare(query.sql).all(...query.params)
      return res.json(rows.map(serializeEntry))
    }

    const rows = db.prepare('SELECT * FROM entries ORDER BY created_at DESC LIMIT ?').all(limit)

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
    const favorite = 'favorite' in body
      ? (cleanOptionalBoolean(body.favorite) ? 1 : 0)
      : existing.favorite
    const details = 'details' in body
      ? JSON.stringify(cleanDetailsForType(existing.type, body.details))
      : existing.details
    const now = new Date().toISOString()

    updateEntry.run(title, status, startAt, endAt, allDay, favorite, details, now, req.params.id)

    res.json(serializeEntry(selectEntryById.get(req.params.id)))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
