import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_entries_archetype ON entries(archetype);
  CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
`)

export default db
