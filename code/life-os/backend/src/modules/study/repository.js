import { createHash, randomUUID } from 'node:crypto'
import { STUDY_ENTITIES, MUTABLE_FIELDS, StudyError, assertEntity, validateId, validateRevision, validateRecord, validateRecordRange, validateImport } from './schema.js'

const SELECT_COLUMNS = `id, title, status, semester_id, module_id, card_id,
  start_date::text AS start_date, end_date::text AS end_date,
  start_at, end_at, data, provenance, revision, created_at, updated_at, deleted_at`
const WRITE_FIELDS = ['id', ...MUTABLE_FIELDS, 'provenance']

function serialize(row) {
  if (!row) return row
  const result = { ...row }
  for (const field of ['start_at', 'end_at', 'created_at', 'updated_at', 'deleted_at']) {
    if (result[field] instanceof Date) result[field] = result[field].toISOString()
  }
  return result
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

function importedContent(record) {
  return Object.fromEntries(WRITE_FIELDS.map((key) => [key, record[key]]))
}

function comparableImportedContent(record) {
  const content = importedContent(record)
  content.provenance = { ...content.provenance }
  delete content.provenance.fingerprint
  content.data = { ...content.data }
  delete content.data.import_range
  if (content.data.csv && typeof content.data.csv === 'object' && !Array.isArray(content.data.csv)) {
    content.data.csv = { ...content.data.csv }
    delete content.data.csv.row
  }
  return content
}

function manifestHash(batch) {
  return createHash('sha256').update(canonical(batch.records.map(({ entity, source_id, record }) => ({ entity, source_id, record: importedContent(record) })))).digest('hex')
}

function databaseError(error) {
  if (error instanceof StudyError) return error
  if (error.code === '23505') return new StudyError(409, 'A Study record or setting already exists')
  if (error.code === '23503') return new StudyError(400, 'A Study parent record does not exist')
  if (error.code === '23514' || error.code === '22P02' || error.code === '22007') return new StudyError(400, 'Study record failed validation')
  return error
}

export function createStudyRepository({ pool, beforeImport } = {}) {
  if (!pool?.query || !pool?.connect) throw new TypeError('Study repository requires a PostgreSQL pool')

  async function transaction(callback) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { /* Preserve the original error. */ }
      throw databaseError(error)
    } finally {
      client.release()
    }
  }

  async function history(client, entity, action, before, after, actor = 'user') {
    await client.query(`INSERT INTO study.history (id, entity, record_id, action, before_data, after_data, actor)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`, [randomUUID(), entity, (after ?? before).id, action, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, actor])
  }

  async function parents(client, record, pending = new Map()) {
    const parentRows = {}
    for (const [field, entity] of [['semester_id', 'semesters'], ['module_id', 'modules'], ['card_id', 'cards']]) {
      if (!record[field]) continue
      if (record[field] === record.id) throw new StudyError(400, 'A Study record cannot be its own parent')
      const pendingParent = pending.get(`${entity}:${record[field]}`)
      const parent = pendingParent ?? (await client.query(`SELECT id, semester_id, module_id FROM study.${entity} WHERE id = $1 AND deleted_at IS NULL FOR SHARE`, [record[field]])).rows[0]
      if (!parent) throw new StudyError(400, `${field} does not refer to an available Study record`)
      parentRows[field] = parent
    }
    if (parentRows.module_id) {
      const semester = parentRows.module_id.semester_id
      if (record.semester_id && semester && semester !== record.semester_id) throw new StudyError(400, 'Module and semester do not match')
      record.semester_id ??= semester ?? null
    }
    if (parentRows.card_id) {
      const card = parentRows.card_id
      if (record.module_id && card.module_id && card.module_id !== record.module_id) throw new StudyError(400, 'Card and module do not match')
      if (record.semester_id && card.semester_id && card.semester_id !== record.semester_id) throw new StudyError(400, 'Card and semester do not match')
      record.module_id ??= card.module_id ?? null
      record.semester_id ??= card.semester_id ?? null
    }
  }

  async function insert(client, entity, record, actor = 'user', action = 'create', pending) {
    await parents(client, record, pending)
    const values = WRITE_FIELDS.map((field) => ['data', 'provenance'].includes(field) ? JSON.stringify(record[field]) : record[field])
    const row = (await client.query(`INSERT INTO study.${entity} (${WRITE_FIELDS.join(', ')})
      VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING ${SELECT_COLUMNS}`, values)).rows[0]
    const created = serialize(row)
    await history(client, entity, action, null, created, actor)
    return created
  }

  async function workspace({ includeDeleted = false, historyLimit = 100 } = {}) {
    const client = await pool.connect()
    try {
      // One snapshot prevents exports from mixing old parents with new children.
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const result = {}
      for (const entity of STUDY_ENTITIES) {
        const rows = (await client.query(`SELECT ${SELECT_COLUMNS} FROM study.${entity} ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'} ORDER BY created_at, id`)).rows
        result[entity] = rows.map(serialize)
      }
      const limit = historyLimit === null ? null : Math.max(1, Math.min(Number.isSafeInteger(historyLimit) ? historyLimit : 100, 1000))
      result.history = (await client.query(`SELECT * FROM study.history ORDER BY created_at DESC, id ${limit === null ? '' : 'LIMIT $1'}`, limit === null ? [] : [limit])).rows.map(serialize)
      result.import_batches = (await client.query('SELECT * FROM study.import_batches ORDER BY created_at, id')).rows.map(serialize)
      const count = Number((await client.query('SELECT count(*)::text AS count FROM study.history')).rows[0].count)
      result.meta = { version: 1, exported_at: new Date().toISOString(), include_deleted: includeDeleted, history_count: count, history_truncated: result.history.length < count }
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { /* Preserve the original error. */ }
      throw databaseError(error)
    } finally {
      client.release()
    }
  }

  async function create(entity, body, { actor = 'user' } = {}) {
    const record = validateRecord(entity, body)
    return transaction((client) => insert(client, entity, record, actor))
  }

  async function patch(entity, id, body, { actor = 'user' } = {}) {
    assertEntity(entity)
    validateId(id)
    const changes = validateRecord(entity, body, { partial: true })
    return transaction(async (client) => {
      const previous = serialize((await client.query(`SELECT ${SELECT_COLUMNS} FROM study.${entity} WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0])
      if (!previous) throw new StudyError(404, 'Study record was not found')
      if (previous.revision !== changes.revision) throw new StudyError(409, 'This Study record changed. Reload before saving.', { current: previous })
      const next = { ...previous, ...changes }
      validateRecordRange(next)
      await parents(client, next)
      const contextChanged = ['semester_id', 'module_id', 'card_id'].some((field) => previous[field] !== next[field])
      if (contextChanged && ['semesters', 'modules', 'cards'].includes(entity)) {
        const childField = { semesters: 'semester_id', modules: 'module_id', cards: 'card_id' }[entity]
        for (const child of STUDY_ENTITIES) {
          if ((await client.query(`SELECT 1 FROM study.${child} WHERE ${childField} = $1 AND deleted_at IS NULL LIMIT 1`, [id])).rows.length) throw new StudyError(409, 'This Study record has linked records. Move or remove its links before changing its parent.')
        }
      }
      const fields = MUTABLE_FIELDS.filter((field) => field in changes || next[field] !== previous[field])
      if (!fields.length) return previous
      const values = fields.map((field) => field === 'data' ? JSON.stringify(next[field]) : next[field])
      values.push(id, changes.revision)
      const updated = serialize((await client.query(`UPDATE study.${entity} SET ${fields.map((field, index) => `${field} = $${index + 1}`).join(', ')},
        revision = revision + 1, updated_at = now() WHERE id = $${fields.length + 1} AND revision = $${fields.length + 2} RETURNING ${SELECT_COLUMNS}`, values)).rows[0])
      if (!updated) throw new StudyError(409, 'This Study record changed. Reload before saving.')
      await history(client, entity, 'update', previous, updated, actor)
      return updated
    })
  }

  async function remove(entity, id, revision, { actor = 'user' } = {}) {
    assertEntity(entity)
    validateId(id)
    validateRevision(revision)
    return transaction(async (client) => {
      const previous = serialize((await client.query(`SELECT ${SELECT_COLUMNS} FROM study.${entity} WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [id])).rows[0])
      if (!previous) throw new StudyError(404, 'Study record was not found')
      if (previous.revision !== revision) throw new StudyError(409, 'This Study record changed. Reload before deleting.', { current: previous })
      if (['semesters', 'modules', 'cards'].includes(entity)) {
        const field = { semesters: 'semester_id', modules: 'module_id', cards: 'card_id' }[entity]
        for (const child of STUDY_ENTITIES) {
          if ((await client.query(`SELECT 1 FROM study.${child} WHERE ${field} = $1 AND deleted_at IS NULL LIMIT 1`, [id])).rows.length) throw new StudyError(409, 'This Study record has linked records. Archive it or remove its links first.')
        }
      }
      const deleted = serialize((await client.query(`UPDATE study.${entity} SET deleted_at = now(), updated_at = now(), revision = revision + 1 WHERE id = $1 RETURNING ${SELECT_COLUMNS}`, [id])).rows[0])
      await history(client, entity, 'delete', previous, deleted, actor)
      return deleted
    })
  }

  async function inspectImport(client, batch) {
    // Resolve omitted parent context consistently in preview and apply, so a
    // repeated import is compared with the exact content previously stored.
    const pending = new Map(batch.records.map((item) => [`${item.entity}:${item.record.id}`, item.record]))
    for (const item of batch.records) await parents(client, item.record, pending)
    const manifest = manifestHash(batch)
    const prior = (await client.query('SELECT * FROM study.import_batches WHERE source = $1 AND fingerprint = $2', [batch.source, batch.fingerprint])).rows[0]
    if (prior && prior.result?.manifest !== manifest) throw new StudyError(409, 'This import fingerprint was already used for different records')
    const existing = new Map()
    for (const entity of STUDY_ENTITIES) {
      const rows = (await client.query(`SELECT ${SELECT_COLUMNS} FROM study.${entity} WHERE provenance->>'source' = $1 OR id = ANY($2::uuid[])`, [batch.source, batch.records.filter((item) => item.entity === entity).map((item) => item.record.id)])).rows
      for (const row of rows.map(serialize)) {
        existing.set(`${entity}:id:${row.id}`, row)
        if (row.provenance?.source === batch.source) existing.set(`${entity}:source:${row.provenance.source_id}`, row)
      }
    }
    const additions = [], skipped = [], conflicts = []
    for (const item of batch.records) {
      const current = existing.get(`${item.entity}:source:${item.source_id}`) ?? existing.get(`${item.entity}:id:${item.record.id}`)
      if (!current) additions.push(item)
      else if (!current.deleted_at && canonical(comparableImportedContent(current)) === canonical(comparableImportedContent(item.record))) skipped.push({ entity: item.entity, source_id: item.source_id, id: current.id })
      else conflicts.push({ entity: item.entity, source_id: item.source_id, id: current.id, revision: current.revision, reason: current.deleted_at ? 'previously-deleted' : 'existing-record-differs' })
    }
    return { source: batch.source, fingerprint: batch.fingerprint, manifest, already_applied: Boolean(prior), added: additions.length, skipped: skipped.length, conflicts, counts: Object.fromEntries(STUDY_ENTITIES.map((entity) => [entity, batch.records.filter((item) => item.entity === entity).length])), additions }
  }

  function publicPreview(preview) {
    const { additions, ...result } = preview
    return result
  }

  async function previewImport(input) {
    const batch = validateImport(input)
    return publicPreview(await inspectImport(pool, batch))
  }

  async function importRecords(input, { rejectConflicts = true, actor = 'import' } = {}) {
    const batch = validateImport(input)
    const initial = await inspectImport(pool, batch)
    if (initial.conflicts.length && rejectConflicts) throw new StudyError(409, 'Import conflicts with existing Study records; no records were changed', publicPreview(initial))
    if (!initial.added) return { ...publicPreview(initial), inserted: 0 }
    if (beforeImport) await beforeImport({ batch, preview: publicPreview(initial) })
    return transaction(async (client) => {
      // Serialise writers from a source, then repeat the preview after backup.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`study-import:${batch.source}`])
      const preview = await inspectImport(client, batch)
      if (preview.conflicts.length && rejectConflicts) throw new StudyError(409, 'Import conflicts with existing Study records; no records were changed', publicPreview(preview))
      if (preview.already_applied) return { ...publicPreview(preview), inserted: 0 }
      const pending = new Map(preview.additions.map((item) => [`${item.entity}:${item.record.id}`, item.record]))
      for (const item of preview.additions) await parents(client, item.record, pending)
      for (const item of preview.additions) await insert(client, item.entity, item.record, actor, 'import', pending)
      const result = { ...publicPreview(preview), inserted: preview.additions.length }
      await client.query('INSERT INTO study.import_batches (id, source, fingerprint, record_count, result) VALUES ($1,$2,$3,$4,$5::jsonb)', [randomUUID(), batch.source, batch.fingerprint, batch.records.length, JSON.stringify(result)])
      return result
    })
  }

  return Object.freeze({ workspace, exportWorkspace: () => workspace({ includeDeleted: true, historyLimit: null }), create, patch, remove, previewImport, importRecords })
}
