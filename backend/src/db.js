import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOMS } from '../../shared/rooms.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')

fs.mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'life-os.db'))

db.exec('PRAGMA foreign_keys = ON;')

const migrations = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8')
db.exec(migrations)

const entryColumns = db.prepare('PRAGMA table_info(entries)').all().map((column) => column.name)
if (!entryColumns.includes('archetype')) {
  db.exec('ALTER TABLE entries ADD COLUMN archetype TEXT')
}
if (!entryColumns.includes('favorite')) {
  db.exec('ALTER TABLE entries ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0')
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_entries_archetype ON entries(archetype);
  CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
  CREATE INDEX IF NOT EXISTS idx_entries_favorite ON entries(favorite);
`)

const insertSpace = db.prepare(`
  INSERT INTO spaces (id, slug, name, is_room, color, icon, filter, position, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    is_room = excluded.is_room,
    color = excluded.color,
    icon = excluded.icon,
    filter = excluded.filter,
    position = excluded.position,
    created_at = excluded.created_at
`)

const now = new Date().toISOString()
ROOMS.forEach((room, position) => {
  insertSpace.run(
    `room:${room.slug}`,
    room.slug,
    room.name,
    1,
    room.accent,
    room.icon,
    JSON.stringify(room.filter ?? {}),
    position,
    now
  )
})

export default db
