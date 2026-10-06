import { createHash } from 'node:crypto'
import { readLegacyStudy, studyUuid } from './legacy.mjs'
import { parseTimetable } from './timetable.mjs'
import { StudyError, STUDY_ENTITIES, MUTABLE_FIELDS, validateRecord, validateId } from '../../code/life-os/backend/src/modules/study/schema.js'
import { addDays, dateKey } from '../../code/life-os/shared/calendar.js'

const escapeIcs = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
function londonStamp(value) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(value))
  return `${dateKey(value).replaceAll('-', '')}T${['hour','minute','second'].map(key => parts.find(part => part.type === key).value).join('')}`
}
async function manualBatch(body, repository) {
  const input = body.record
  if (!input || typeof input !== 'object') throw new StudyError(400, 'A recurring schedule needs a session record')
  const rule = String(input.data?.rrule || input.data?.recurrence || '').trim()
  if (!rule || /[\r\n]/.test(rule)) throw new StudyError(400, 'Provide a valid recurrence rule')
  const series = validateId(body.seriesId, 'seriesId')
  const record = validateRecord('sessions', { ...input, data: { ...input.data, rrule: null, recurrence: null } })
  if (record.data.exdates !== undefined && !Array.isArray(record.data.exdates)) throw new StudyError(400, 'Excluded dates must be an array of YYYY-MM-DD values')
  if (!record.start_at && !record.start_date) throw new StudyError(400, 'A schedule needs an explicit start date/time')
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`UID:${series}`,`SUMMARY:${escapeIcs(record.title)}`,
    `DESCRIPTION:${escapeIcs(record.data.description)}`,`LOCATION:${escapeIcs(record.data.location)}`]
  if (record.start_at) {
    lines.push(`DTSTART;TZID=Europe/London:${londonStamp(record.start_at)}`)
    if (record.end_at) lines.push(`DTEND;TZID=Europe/London:${londonStamp(record.end_at)}`)
  } else {
    lines.push(`DTSTART;VALUE=DATE:${record.start_date.replaceAll('-', '')}`)
    if (record.end_date) lines.push(`DTEND;VALUE=DATE:${addDays(record.end_date, 1).replaceAll('-', '')}`)
  }
  lines.push(`RRULE:${rule.replace(/^RRULE:/i, '')}`)
  for (const exclusion of record.data.exdates || []) {
    const day = dateKey(exclusion)
    if (!day || day !== exclusion) throw new StudyError(400, 'Excluded dates must use YYYY-MM-DD')
    lines.push(record.start_at ? `EXDATE;TZID=Europe/London:${day.replaceAll('-', '')}T${londonStamp(record.start_at).split('T')[1]}` : `EXDATE;VALUE=DATE:${day.replaceAll('-', '')}`)
  }
  lines.push('END:VEVENT','END:VCALENDAR')
  const workspace = record.semester_id && (!body.from || !body.to) ? await repository.workspace() : null
  const semester = workspace?.semesters.find(row => row.id === record.semester_id)
  const from = body.from || semester?.start_date || undefined, to = body.to || semester?.end_date || undefined
  const batch = parseTimetable(lines.join('\r\n'), { format: 'ics', source: `manual:${series}`, semester_id: record.semester_id, module_id: record.module_id, from, to })
  batch.fingerprint = createHash('sha256').update(JSON.stringify({ input, series, from, to })).digest('hex')
  batch.records = batch.records.map(item => ({ ...item, record: { ...item.record, status: item.record.status === 'cancelled' ? 'cancelled' : record.status, card_id: record.card_id,
    data: { ...record.data, ...item.record.data, rrule: null, recurrence: null, sourceRule: rule, sourceSeries: series } } }))
  return batch
}

function jsonBatch(body) {
  if (typeof body.content !== 'string' || body.content.length > 16 * 1024 * 1024) throw new StudyError(400, 'Choose a Study JSON file under 16 MB')
  let data
  try { data = JSON.parse(body.content.replace(/^\uFEFF/, '')) } catch { throw new StudyError(400, 'The file is not valid JSON') }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new StudyError(400, 'Use an exported Study workspace or a records batch')
  const source = body.source || data.source || 'study-json'
  if (typeof source !== 'string' || !source.trim() || source.length > 200) throw new StudyError(400, 'Import source must be a short text label')
  const fingerprint = createHash('sha256').update(source).update(body.content).digest('hex')
  if (Array.isArray(data.records)) return { source, fingerprint, records: data.records }
  if (!data || typeof data !== 'object' || !STUDY_ENTITIES.some(entity => Array.isArray(data[entity]))) throw new StudyError(400, 'Use an exported Study workspace or a records batch')
  if (STUDY_ENTITIES.some(entity => data[entity] !== undefined && !Array.isArray(data[entity]))) throw new StudyError(400, 'Workspace record collections must be arrays')
  if (STUDY_ENTITIES.some(entity => (data[entity] || []).some(record => !record || typeof record !== 'object' || Array.isArray(record)))) throw new StudyError(400, 'Each workspace record must be an object with a stable ID')
  const records = STUDY_ENTITIES.flatMap(entity => (data[entity] || []).filter(record => !record.deleted_at).map(record => {
    const source_id = String(record.id || record.source_id || '')
    if (!source_id) throw new StudyError(400, 'JSON records need stable IDs')
    return { entity, source_id, record: { id: record.id || studyUuid(`${source}:${entity}`, source_id), ...Object.fromEntries(MUTABLE_FIELDS.filter(key => key in record).map(key => [key, record[key]])) } }
  }))
  return { source, fingerprint, records }
}

export function createStudyImports({ projectRoot, repository, clock = () => Date.now() }) {
  const previews = new Map()
  const keyFor = (format, batch) => `${format}\0${batch.source}\0${batch.fingerprint}`
  const loaders = {
    legacy: () => readLegacyStudy(projectRoot),
    manual: body => manualBatch(body, repository),
    json: body => jsonBatch(body),
    ics: body => parseTimetable(body.content, { ...body, format: 'ics' }),
    csv: body => parseTimetable(body.content, { ...body, format: 'csv' })
  }
  return Object.fromEntries(Object.entries(loaders).map(([format, load]) => [format, {
    preview: async body => {
      const batch = await load(body)
      const preview = await repository.previewImport(batch)
      for (const [key, entry] of previews) if (clock() - entry.time > 30 * 60_000) previews.delete(key)
      if (previews.size >= 200) previews.delete(previews.keys().next().value)
      previews.set(keyFor(format, batch), { time: clock(), manifest: preview.manifest })
      return { ...preview, fingerprint: batch.fingerprint, counts: { ...preview.counts, ...batch.counts }, warnings: batch.warnings || [], format }
    },
    apply: async body => {
      const batch = await load(body)
      const key = keyFor(format, batch), reviewed = previews.get(key)
      if (body.fingerprint !== batch.fingerprint || !reviewed || clock() - reviewed.time > 30 * 60_000) throw new StudyError(409, 'The import or source changed. Preview it again before applying.')
      const current = await repository.previewImport(batch)
      if (current.manifest !== reviewed.manifest) throw new StudyError(409, 'The import placement, dates or records changed. Preview it again before applying.')
      const result = await repository.importRecords(batch)
      return { ...result, counts: { ...result.counts, ...batch.counts }, warnings: batch.warnings || [], format }
    }
  }]))
}
