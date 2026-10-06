import { randomUUID } from 'node:crypto'

export const STUDY_ENTITIES = Object.freeze(['semesters', 'modules', 'cards', 'assessments', 'sessions', 'materials', 'progress', 'settings'])
export const STUDY_STATUSES = Object.freeze(['active', 'planned', 'in-progress', 'done', 'completed', 'archived', 'draft', 'pending', 'cancelled', 'booked', 'missed', 'blocked'])
export const MUTABLE_FIELDS = Object.freeze(['title', 'status', 'semester_id', 'module_id', 'card_id', 'start_date', 'end_date', 'start_at', 'end_at', 'data'])
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const numericFields = new Set(['hours', 'estimatedHours', 'actualHours', 'loggedHours', 'targetHours', 'completedHours', 'durationMinutes', 'durationSeconds', 'weight', 'score', 'credits', 'size'])

export class StudyError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'StudyError'
    this.status = status
    if (details !== undefined) this.details = details
  }
}

export function assertEntity(entity) {
  if (!STUDY_ENTITIES.includes(entity)) throw new StudyError(404, 'Unknown Study record type')
  return entity
}

export function validateId(id, field = 'id') {
  if (typeof id !== 'string' || !uuidPattern.test(id)) throw new StudyError(400, `${field} must be a UUID`)
  return id.toLowerCase()
}

export function validateRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new StudyError(400, 'revision must be a positive integer')
  return value
}

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
}

function jsonValue(value, depth = 0) {
  if (depth > 30) throw new StudyError(400, 'JSON is nested too deeply')
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number' && Number.isFinite(value)) return
  if (Array.isArray(value)) {
    if (value.length > 20000) throw new StudyError(400, 'JSON array is too large')
    value.forEach((item) => jsonValue(item, depth + 1))
    return
  }
  if (plain(value)) {
    const keys = Object.keys(value)
    if (keys.length > 20000) throw new StudyError(400, 'JSON object is too large')
    for (const key of keys) jsonValue(value[key], depth + 1)
    return
  }
  throw new StudyError(400, 'data must contain plain JSON values')
}

export function validateUrl(value, field = 'URL') {
  if (typeof value !== 'string' || !value.trim() || value.length > 8192 || /[\u0000-\u0020\\]/.test(value)) throw new StudyError(400, `${field} must be a safe URL`)
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error()
    return value
  } catch {
    throw new StudyError(400, `${field} must use http, https or a same-origin path`)
  }
}

function validateData(value, entity) {
  if (!plain(value)) throw new StudyError(400, 'data must be an object')
  jsonValue(value)
  if (Buffer.byteLength(JSON.stringify(value)) > 2 * 1024 * 1024) throw new StudyError(413, 'Study record data exceeds 2 MB')
  if (entity === 'sessions' && ((typeof value.rrule === 'string' && value.rrule.trim()) || (typeof value.recurrence === 'string' && value.recurrence.trim()))) throw new StudyError(400, 'Recurring schedules must use import preview/apply so each occurrence has an explicit date')
  for (const [key, item] of Object.entries(value)) {
    if (numericFields.has(key) && item !== null && (typeof item !== 'number' || !Number.isFinite(item) || item < 0 || item > 1e9)) throw new StudyError(400, `data.${key} must be a non-negative number`)
  }
  if ('checklist' in value && !Array.isArray(value.checklist)) throw new StudyError(400, 'data.checklist must be an array')
  for (const key of ['url', 'href']) if (value[key] !== undefined && value[key] !== null && value[key] !== '') validateUrl(value[key], `data.${key}`)
  for (const key of ['links', 'resources']) {
    if (value[key] === undefined) continue
    if (!Array.isArray(value[key])) throw new StudyError(400, `data.${key} must be an array`)
    for (const item of value[key]) {
      if (typeof item === 'string') validateUrl(item, `data.${key}`)
      else if (plain(item)) {
        for (const urlField of ['url', 'href']) if (item[urlField]) validateUrl(item[urlField], `data.${key}.${urlField}`)
      }
      else throw new StudyError(400, `data.${key} must contain URLs or link objects`)
    }
  }
  if (entity === 'settings' && (typeof value.key !== 'string' || !value.key.trim() || value.key.length > 200)) throw new StudyError(400, 'Settings require a non-empty data.key')
  return structuredClone(value)
}

function civilDate(value, field) {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new StudyError(400, `${field} must be YYYY-MM-DD`)
  const date = new Date(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < '0001-01-01') throw new StudyError(400, `${field} is not a valid date`)
  return value
}

function instant(value, field) {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new StudyError(400, `${field} must be an ISO time with a UTC offset`)
  civilDate(value.slice(0, 10), field)
  const clock = value.slice(11, 19).split(':').map(Number)
  if (clock[0] > 23 || clock[1] > 59 || (clock[2] ?? 0) > 59) throw new StudyError(400, `${field} has an invalid clock time`)
  return new Date(value).toISOString()
}

export function validateRecord(entity, body, { partial = false, allowProvenance = false } = {}) {
  assertEntity(entity)
  if (!plain(body)) throw new StudyError(400, 'Study record must be an object')
  const allowed = new Set([...MUTABLE_FIELDS, ...(partial ? ['revision'] : ['id']), ...(allowProvenance ? ['provenance'] : [])])
  for (const field of Object.keys(body)) if (!allowed.has(field)) throw new StudyError(400, `Unknown or read-only field: ${field}`)
  const result = partial ? { revision: validateRevision(body.revision) } : {
    id: body.id === undefined ? randomUUID() : validateId(body.id), title: '', status: 'active',
    semester_id: null, module_id: null, card_id: null, start_date: null, end_date: null,
    start_at: null, end_at: null, data: {}, provenance: {},
  }
  for (const field of MUTABLE_FIELDS) {
    if (!(field in body)) continue
    const value = body[field]
    if (field === 'title') {
      if (typeof value !== 'string' || value.length > 2000) throw new StudyError(400, 'title must be text up to 2000 characters')
      result.title = value.trim()
    } else if (field === 'status') {
      if (!STUDY_STATUSES.includes(value)) throw new StudyError(400, 'Unknown Study status')
      result.status = value
    } else if (field.endsWith('_id')) result[field] = value === null || value === '' ? null : validateId(value, field)
    else if (field.endsWith('_date')) result[field] = civilDate(value, field)
    else if (field.endsWith('_at')) result[field] = instant(value, field)
    else if (field === 'data') result.data = validateData(value, entity)
  }
  if (!partial && entity === 'settings') result.data = validateData(result.data, entity)
  if (allowProvenance && 'provenance' in body) {
    if (!plain(body.provenance)) throw new StudyError(400, 'provenance must be an object')
    jsonValue(body.provenance)
    if (Buffer.byteLength(JSON.stringify(body.provenance)) > 65536) throw new StudyError(413, 'Provenance exceeds 64 KB')
    result.provenance = structuredClone(body.provenance)
  }
  validateRecordRange(result)
  return result
}

export function validateRecordRange(record) {
  if (record.start_date && record.end_date && record.end_date < record.start_date) throw new StudyError(400, 'end_date must not precede start_date')
  if (record.start_at && record.end_at && record.end_at < record.start_at) throw new StudyError(400, 'end_at must not precede start_at')
  if (record.id && (record.semester_id === record.id || record.module_id === record.id || record.card_id === record.id)) throw new StudyError(400, 'A Study record cannot be its own parent')
}

export function validateImport(batch) {
  if (!plain(batch) || typeof batch.source !== 'string' || !batch.source.trim() || batch.source.length > 200 || typeof batch.fingerprint !== 'string' || !batch.fingerprint.trim() || batch.fingerprint.length > 200 || !Array.isArray(batch.records) || batch.records.length > 20000) throw new StudyError(400, 'Import requires source, fingerprint and a bounded records array')
  const seen = new Set()
  const ids = new Set()
  const records = batch.records.map((item) => {
    if (!plain(item) || typeof item.source_id !== 'string' || !item.source_id || item.source_id.length > 1000) throw new StudyError(400, 'Imported records require source_id')
    const entity = assertEntity(item.entity)
    const key = `${entity}\u0000${item.source_id}`
    if (seen.has(key)) throw new StudyError(400, 'Duplicate imported source record')
    seen.add(key)
    const record = validateRecord(entity, item.record, { allowProvenance: true })
    if (!item.record.id) throw new StudyError(400, 'Imported records require stable UUID IDs')
    if (ids.has(record.id)) throw new StudyError(400, 'Duplicate imported UUID')
    ids.add(record.id)
    record.provenance = { ...record.provenance, source: batch.source, source_id: item.source_id }
    return { entity, source_id: item.source_id, record }
  })
  return { source: batch.source, fingerprint: batch.fingerprint, records }
}
