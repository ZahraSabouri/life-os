import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'
import { picturesOf, removePictureFile } from './files.js'
import { archetypeOf, typeExists, validateDetails, validateWorkoutCompletion } from '../../../shared/entryTypes.js'
import { buildEntriesQuery } from '../query.js'

const router = Router()

const INSERT_ENTRY = `
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
`
const SELECT_ENTRY = 'SELECT * FROM entries WHERE id = ?'
const UPDATE_ENTRY = `
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
`

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

// owner_id (for accounts later) and seq (the order entries were added) stay in the database;
// the pages are given the entry as before.
function serializeEntry({ owner_id: _owner, seq: _seq, ...row }, pictures) {
  return {
    ...row,
    all_day: Boolean(row.all_day),
    favorite: Boolean(row.favorite),
    details: parseDetails(row.details),
    files: pictures.get(row.id) ?? []
  }
}
// A list is given its pictures with one question to the database, not one for each entry.
const serializeEntries = async (rows) => { const pictures = await picturesOf(rows.length <= 400 ? rows.map((row) => row.id) : null); return rows.map((row) => serializeEntry(row, pictures)) }
const serializeOne = async (row) => serializeEntry(row, await picturesOf([row.id]))
// Ends a request early with this status (inside a transaction, which it rolls back).
class Answer extends Error { constructor(status, message) { super(message); this.status = status } }

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

router.post('/', async (req, res) => {
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
    // Something brought in from elsewhere may say when it was first written; never in the future.
    const written = cleanOptionalDate(req.body?.created_at, 'created_at')
    const createdAt = written && Date.parse(written) <= Date.parse(now) ? new Date(written).toISOString() : now
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
    if (cleanType === 'workout') validateWorkoutCompletion(cleanDetails, cleanStatus)

    await db.prepare(INSERT_ENTRY).run(
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
      createdAt,
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

router.get('/', async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit)
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 5000))
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
      const rows = await db.prepare(query.sql).all(...query.params)
      return res.json(await serializeEntries(rows))
    }

    const rows = await db.prepare('SELECT * FROM entries ORDER BY created_at DESC, seq ASC LIMIT ?').all(limit)

    res.json(await serializeEntries(rows))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// One entry by its id, for changing it from the page that shows it.
router.get('/:id', async (req, res) => {
  try {
    const existing = await db.prepare(SELECT_ENTRY).get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })
    res.json(await serializeOne(existing))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    // The read holds the row (FOR UPDATE) until the change is written, so no other save
    // can come between them.
    const saved = await db.transaction(async (tx) => {
    const existing = await tx.prepare(`${SELECT_ENTRY} FOR UPDATE`).get(req.params.id)

    if (!existing) throw new Answer(404, 'not found')

    // A caller can guard its patch with the updated_at value it read.
    if (req.headers['if-match'] !== undefined) {
      const expected = String(req.headers['if-match']).trim().replace(/^W\//, '').replace(/^"|"$/g, '')
      if (expected !== existing.updated_at) throw new Answer(409, 'Entry changed. Load it again before saving.')
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

    if (existing.type === 'workout') validateWorkoutCompletion(JSON.parse(details), status)
    await tx.prepare(UPDATE_ENTRY).run(title, status, startAt, endAt, allDay, favorite, details, now, req.params.id)
    return tx.prepare(SELECT_ENTRY).get(req.params.id)
    })
    res.json(await serializeOne(saved))
  } catch (error) {
    res.status(error instanceof Answer ? error.status : 400).json({ error: error.message })
  }
})

// Removes an entry for good, with the ties that exist only because of it (its tags, people,
// places and links). An entry with files is refused: the files would be left without an owner.
router.delete('/:id', async (req, res) => {
  try {
    const gone = await db.transaction(async (tx) => {
      const existing = await tx.prepare(`${SELECT_ENTRY} FOR UPDATE`).get(req.params.id)
      if (!existing) return null
      // Its pictures go with it: the rows here, the files once the rows are gone.
      const pictures = await tx.prepare('SELECT id, path, mime_type, size, created_at FROM files WHERE entry_id = ? ORDER BY created_at').all(req.params.id)
      for (const table of ['entry_tags', 'entry_people', 'entry_places']) await tx.prepare(`DELETE FROM ${table} WHERE entry_id = ?`).run(req.params.id)
      await tx.prepare('DELETE FROM entry_links WHERE from_entry_id = ? OR to_entry_id = ?').run(req.params.id, req.params.id)
      await tx.prepare('DELETE FROM files WHERE entry_id = ?').run(req.params.id)
      await tx.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id)
      return { existing, pictures }
    })
    if (!gone) return res.status(404).json({ error: 'not found' })
    for (const picture of gone.pictures) removePictureFile(picture.path)
    const files = new Map([[gone.existing.id, gone.pictures.map(({ path: _path, ...picture }) => picture)]])
    res.json({ ok: true, deleted: serializeEntry(gone.existing, files) })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
