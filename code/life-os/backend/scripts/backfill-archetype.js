// Gives every entry the archetype its type has (shared/entryTypes.js). Writes only where they differ.
import db from '../src/db.js'
import { archetypeOf } from '../../shared/entryTypes.js'

try {
  const counts = await db.transaction(async (tx) => {
    let updated = 0
    let skipped = 0
    for (const row of await tx.prepare('SELECT id, type, archetype FROM entries').all()) {
      const archetype = archetypeOf(row.type)
      if (!archetype || row.archetype === archetype) { skipped += 1; continue }
      await tx.prepare('UPDATE entries SET archetype = ? WHERE id = ?').run(archetype, row.id)
      updated += 1
    }
    return { updated, skipped }
  })
  console.log(`Backfilled archetypes: ${counts.updated} updated, ${counts.skipped} skipped`)
} finally {
  await db.close()
}
