import db from '../src/db.js'
import { archetypeOf } from '../../shared/entryTypes.js'

const selectEntries = db.prepare(`
  SELECT id, type, archetype
  FROM entries
`)

const updateEntry = db.prepare(`
  UPDATE entries
     SET archetype = ?
   WHERE id = ?
`)

const rows = selectEntries.all()
let updated = 0
let skipped = 0

rows.forEach((row) => {
  const archetype = archetypeOf(row.type)

  if (!archetype || row.archetype === archetype) {
    skipped += 1
    return
  }

  updateEntry.run(archetype, row.id)
  updated += 1
})

console.log(`Backfilled archetypes: ${updated} updated, ${skipped} skipped`)
