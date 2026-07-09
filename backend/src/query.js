import { typesByRoom } from '../../shared/entryTypes.js'

const ALLOWED_FILTER_KEYS = new Set(['types', 'archetypes', 'tags', 'rooms'])

function asStringArray(value, name) {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`)
  }

  return value
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim())
}

function placeholders(count) {
  return Array.from({ length: count }, () => '?').join(', ')
}

export function buildEntriesQuery(filter = {}, options = {}) {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new Error('filter must be an object')
  }

  for (const key of Object.keys(filter)) {
    if (!ALLOWED_FILTER_KEYS.has(key)) {
      throw new Error(`unsupported filter key: ${key}`)
    }
  }

  const explicitTypes = asStringArray(filter.types, 'types')
  const archetypes = asStringArray(filter.archetypes, 'archetypes')
  const tags = asStringArray(filter.tags, 'tags')
  const rooms = asStringArray(filter.rooms, 'rooms')
  const roomTypes = new Set()

  rooms.forEach((roomSlug) => {
    typesByRoom(roomSlug).forEach((type) => roomTypes.add(type))
  })

  const conditions = []
  const params = []

  if (explicitTypes.length) {
    conditions.push(`e.type IN (${placeholders(explicitTypes.length)})`)
    params.push(...explicitTypes)
  }

  if (rooms.length) {
    if (!roomTypes.size) {
      conditions.push('1 = 0')
    } else {
      conditions.push(`e.type IN (${placeholders(roomTypes.size)})`)
      params.push(...roomTypes)
    }
  }

  if (archetypes.length) {
    conditions.push(`e.archetype IN (${placeholders(archetypes.length)})`)
    params.push(...archetypes)
  }

  if (tags.length) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM entry_tags et
      JOIN tags t ON t.id = et.tag_id
      WHERE et.entry_id = e.id
        AND t.name IN (${placeholders(tags.length)})
    )`)
    params.push(...tags)
  }

  if (typeof options.from === 'string' && options.from.trim()) {
    conditions.push('date(e.start_at) >= date(?)')
    params.push(options.from.trim())
  }

  if (typeof options.end === 'string' && options.end.trim()) {
    conditions.push('date(e.start_at) <= date(?)')
    params.push(options.end.trim())
  }

  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(Math.trunc(options.limit), 500)) : 100
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderClause = options.from || options.end
    ? 'ORDER BY date(e.start_at) ASC, e.created_at DESC'
    : 'ORDER BY e.created_at DESC'

  return {
    sql: `SELECT e.* FROM entries e ${whereClause} ${orderClause} LIMIT ?`,
    params: [...params, limit]
  }
}
