import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'

const router = Router()

const insertEntry = db.prepare(`
  INSERT INTO entries (id, type, title, details, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const selectRecentEntries = db.prepare(`
  SELECT * FROM entries
  ORDER BY created_at DESC
  LIMIT ?
`)

function parseDetails(value) {
  if (!value) return {}

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

router.post('/', (req, res) => {
  const { type = 'note', title = null, details = {} } = req.body ?? {}
  const id = randomUUID()
  const now = new Date().toISOString()
  const cleanType = String(type || 'note').trim() || 'note'
  const cleanTitle = typeof title === 'string' && title.trim() ? title.trim() : null
  const cleanDetails = details && typeof details === 'object' && !Array.isArray(details)
    ? details
    : {}

  insertEntry.run(id, cleanType, cleanTitle, JSON.stringify(cleanDetails), now, now)

  res.status(201).json({
    id,
    type: cleanType,
    title: cleanTitle,
    details: cleanDetails,
    created_at: now,
    updated_at: now
  })
})

router.get('/', (req, res) => {
  const requestedLimit = Number(req.query.limit)
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100))
    : 10

  const rows = selectRecentEntries.all(limit)

  res.json(rows.map((row) => ({
    ...row,
    details: parseDetails(row.details)
  })))
})

export default router

