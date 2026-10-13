// Pictures kept with an entry (a journal page, a memory). The picture is a file in the data
// folder under an id made here; the row says which entry it belongs to. Pictures only, so what
// is served back is always safe to show.
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'
import db from '../db.js'

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'files')
export const MAX_PICTURE_BYTES = 8 * 1024 * 1024
export const MAX_PICTURES_PER_ENTRY = 24
// What the first bytes say the file is, whatever its name says.
const KINDS = [
  ['image/jpeg', '.jpg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['image/png', '.png', (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ['image/gif', '.gif', (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1'))],
  ['image/webp', '.webp', (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'],
]
export const pictureKind = (bytes) => KINDS.find(([, , is]) => bytes.length > 12 && is(bytes)) ?? null
const isId = (value) => typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value)
export const removePictureFile = (name) => fs.rmSync(path.join(directory, path.basename(String(name))), { force: true })

const router = Router()

// Every picture of some entries, as { entry id: [pictures] }, for the entry routes to add on.
export function picturesOf(entryIds = null) {
  const rows = entryIds && entryIds.length <= 400
    ? db.prepare(`SELECT id, entry_id, mime_type, size, created_at FROM files WHERE entry_id IN (${entryIds.map(() => '?').join(',')}) ORDER BY created_at`).all(...entryIds)
    : db.prepare('SELECT id, entry_id, mime_type, size, created_at FROM files ORDER BY created_at').all()
  const byEntry = new Map()
  for (const row of rows) byEntry.set(row.entry_id, [...(byEntry.get(row.entry_id) ?? []), { id: row.id, mime_type: row.mime_type, size: row.size, created_at: row.created_at }])
  return byEntry
}

router.post('/', (req, res) => {
  try {
    const { entry_id: entryId, data } = req.body ?? {}
    if (!db.prepare('SELECT 1 FROM entries WHERE id = ?').get(String(entryId ?? ''))) return res.status(404).json({ error: 'That entry is no longer there' })
    if (typeof data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) return res.status(400).json({ error: 'The picture did not arrive whole. Try again.' })
    const bytes = Buffer.from(data, 'base64')
    if (bytes.length > MAX_PICTURE_BYTES) return res.status(413).json({ error: 'A picture can be up to 8 MB' })
    const kind = pictureKind(bytes)
    if (!kind) return res.status(400).json({ error: 'That is not a picture this can keep (JPEG, PNG, WebP or GIF)' })
    if (db.prepare('SELECT COUNT(*) AS n FROM files WHERE entry_id = ?').get(entryId).n >= MAX_PICTURES_PER_ENTRY) return res.status(400).json({ error: `An entry keeps up to ${MAX_PICTURES_PER_ENTRY} pictures` })
    const id = randomUUID()
    const name = `${id}${kind[1]}`
    fs.mkdirSync(directory, { recursive: true })
    fs.writeFileSync(path.join(directory, name), bytes, { flag: 'wx' })
    const row = { id, entry_id: entryId, path: name, mime_type: kind[0], size: bytes.length, created_at: new Date().toISOString() }
    try { db.prepare('INSERT INTO files (id, entry_id, path, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(row.id, row.entry_id, row.path, row.mime_type, row.size, row.created_at) } catch (error) { fs.rmSync(path.join(directory, name), { force: true }); throw error }
    res.status(201).json({ id: row.id, entry_id: row.entry_id, mime_type: row.mime_type, size: row.size, created_at: row.created_at })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/:id', (req, res) => {
  const row = isId(req.params.id) ? db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id) : null
  const file = row ? path.join(directory, path.basename(row.path)) : ''
  if (!row || !fs.existsSync(file)) return res.status(404).json({ error: 'not found' })
  res.set({ 'Content-Type': row.mime_type, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' })
  fs.createReadStream(file).pipe(res)
})

router.delete('/:id', (req, res) => {
  const row = isId(req.params.id) ? db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id) : null
  if (!row) return res.status(404).json({ error: 'not found' })
  db.prepare('DELETE FROM files WHERE id = ?').run(row.id)
  fs.rmSync(path.join(directory, path.basename(row.path)), { force: true })
  res.json({ ok: true })
})

export default router
