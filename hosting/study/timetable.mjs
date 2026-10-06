// Deliberately bounded RFC 5545 subset. Unsupported recurrence/timezone
// semantics are rejected before import; no external URLs are fetched.
import { createHash } from 'node:crypto'
import { addDays, dateKey, isDateKey, itemOverlaps, londonDateTime } from '../../code/life-os/shared/calendar.js'

const MAX_RECORDS = 10000
const MAX_STEPS = 200000
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const hash = value => createHash('sha256').update(value).digest('hex')
const distance = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000)
function fail(message) { const error = new Error(message); error.status = 400; throw error }
function uuid(key) {
  const value = hash(`life-os-study-timetable-v1:${key}`).slice(0, 32)
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-5${value.slice(13, 16)}-a${value.slice(17, 20)}-${value.slice(20)}`
}
function compactDay(value) { return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` }
function unescapeText(value = '') { return value.replace(/\\([nN,;\\])/g, (_, char) => /[nN]/.test(char) ? '\n' : char) }

function property(line) {
  let quoted = false, colon = -1
  for (let index = 0; index < line.length; index++) {
    if (line[index] === '"') quoted = !quoted
    if (line[index] === ':' && !quoted) { colon = index; break }
  }
  if (colon < 1 || quoted) fail('Invalid iCalendar property line')
  const parts = line.slice(0, colon).match(/(?:[^;"\s]|"[^"]*")+/g)
  if (!parts?.length) fail('Invalid iCalendar property parameters')
  const name = parts.shift().toUpperCase(), params = {}
  for (const part of parts) {
    const equals = part.indexOf('=')
    if (equals < 1) fail('Invalid iCalendar property parameter')
    const key = part.slice(0, equals).toUpperCase()
    if (Object.hasOwn(params, key)) fail('Duplicate iCalendar property parameter')
    params[key] = part.slice(equals + 1).replace(/^"(.*)"$/, '$1')
  }
  return { name, params, value: line.slice(colon + 1) }
}

function readIcs(text) {
  const physical = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')
  const lines = []
  for (const line of physical) {
    if (/^[ \t]/.test(line)) {
      if (!lines.length) fail('iCalendar starts with an invalid folded line')
      lines[lines.length - 1] += line.slice(1)
    } else if (line) lines.push(line.replace(/\r$/, ''))
  }
  const stack = [], events = []
  let event = null, calendars = 0, version = '', method = ''
  for (const line of lines) {
    const entry = property(line)
    if (entry.name === 'BEGIN') {
      const kind = entry.value.toUpperCase()
      if (!stack.length && kind !== 'VCALENDAR') fail('Use an iCalendar VCALENDAR document')
      if (kind === 'VCALENDAR') { if (stack.length || ++calendars > 1) fail('Use one VCALENDAR document at a time') }
      if (!['VCALENDAR', 'VEVENT', 'VTIMEZONE', 'STANDARD', 'DAYLIGHT', 'VALARM'].includes(kind)) fail(`Unsupported iCalendar component: ${kind}`)
      if (kind === 'VEVENT') {
        if (stack.at(-1) !== 'VCALENDAR' || event) fail('Invalid VEVENT nesting')
        event = new Map()
      }
      stack.push(kind)
    } else if (entry.name === 'END') {
      if (stack.pop() !== entry.value.toUpperCase()) fail('Unbalanced iCalendar components')
      if (entry.value.toUpperCase() === 'VEVENT') { events.push(event); event = null }
    } else if (stack.at(-1) === 'VEVENT') {
      const previous = event.get(entry.name) || []
      previous.push(entry); event.set(entry.name, previous)
    } else if (stack.at(-1) === 'VTIMEZONE' && entry.name === 'TZID') {
      if (!['Europe/London', 'UTC', 'Etc/UTC'].includes(entry.value)) fail('Unsupported VTIMEZONE TZID; use Europe/London or UTC')
    } else if (stack.at(-1) === 'VCALENDAR' && entry.name === 'VERSION') version = entry.value
    else if (stack.at(-1) === 'VCALENDAR' && entry.name === 'METHOD') {
      if (method) fail('Duplicate iCalendar METHOD')
      method = entry.value.toUpperCase()
    }
  }
  if (stack.length || calendars !== 1 || version !== '2.0') fail('Use a complete iCalendar VERSION:2.0 document')
  if (!events.length) fail('The timetable has no VEVENT sessions')
  if (events.length > MAX_RECORDS) fail('The timetable contains more than 10000 events')
  if (method && !['PUBLISH', 'REQUEST', 'CANCEL'].includes(method)) fail('Unsupported iCalendar METHOD; use PUBLISH, REQUEST or CANCEL')
  return { events, method }
}

function one(event, name, required = false) {
  const values = event.get(name) || []
  if (values.length > 1) fail(`Multiple ${name} properties are unsupported`)
  if (!values.length && required) fail(`A timetable event is missing ${name}`)
  return values[0] || null
}

function temporal(prop, label = 'date') {
  if (!prop) return null
  const valueType = prop.params.VALUE || 'DATE-TIME'
  if (valueType === 'DATE') {
    if (!/^\d{8}$/.test(prop.value) || prop.params.TZID) fail(`Invalid date-only ${label}`)
    const day = compactDay(prop.value)
    if (!isDateKey(day)) fail(`Invalid civil date in ${label}`)
    return { day, time: '', zone: 'date', value: day, key: day }
  }
  if (valueType !== 'DATE-TIME' || !/^\d{8}T\d{6}Z?$/.test(prop.value)) fail(`Unsupported or invalid ${label}; use DATE or a precise DATE-TIME`)
  const day = compactDay(prop.value), time = `${prop.value.slice(9, 11)}:${prop.value.slice(11, 13)}:${prop.value.slice(13, 15)}`
  if (!isDateKey(day) || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) fail(`Invalid clock/date in ${label}`)
  const utc = prop.value.endsWith('Z')
  if (utc && prop.params.TZID) fail(`${label} cannot combine UTC Z with TZID`)
  const zone = utc || prop.params.TZID === 'UTC' || prop.params.TZID === 'Etc/UTC' ? 'utc'
    : prop.params.TZID === 'Europe/London' ? 'london' : ''
  if (!zone) fail(`${label} requires UTC Z or TZID=Europe/London; floating and other timezone clocks are unsupported`)
  const value = zone === 'utc' ? new Date(`${day}T${time}Z`).toISOString() : londonDateTime(day, time)
  if (!value) fail(`${label} has an ambiguous or nonexistent Europe/London clock; supply an explicit UTC time`)
  return { day, time, zone, value, key: value }
}

function onDay(template, day) {
  if (template.zone === 'date') return { ...template, day, value: day, key: day }
  return temporal({ params: template.zone === 'london' ? { TZID: 'Europe/London' } : {}, value: `${day.replaceAll('-', '')}T${template.time.replaceAll(':', '')}${template.zone === 'utc' ? 'Z' : ''}` }, 'recurrence occurrence')
}

function readRule(prop, start) {
  if (!prop) return null
  const rule = {}
  for (const piece of prop.value.toUpperCase().split(';')) {
    const [name, value, extra] = piece.split('=')
    if (!name || !value || extra !== undefined || Object.hasOwn(rule, name)) fail('Invalid or duplicate RRULE part')
    if (!['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'WKST'].includes(name)) fail(`Unsupported RRULE part: ${name}; only daily/weekly timetable rules are supported`)
    rule[name] = value
  }
  if (!['DAILY', 'WEEKLY'].includes(rule.FREQ)) fail('Only DAILY and WEEKLY RRULE frequencies are supported')
  const interval = rule.INTERVAL === undefined ? 1 : Number(rule.INTERVAL)
  if (!/^\d+$/.test(rule.INTERVAL ?? '1') || !Number.isSafeInteger(interval) || interval < 1 || interval > 366) fail('RRULE INTERVAL must be an integer from 1 to 366')
  const count = rule.COUNT === undefined ? null : Number(rule.COUNT)
  if (count !== null && (!/^\d+$/.test(rule.COUNT) || !Number.isSafeInteger(count) || count < 1 || count > MAX_RECORDS)) fail('RRULE COUNT must be an integer from 1 to 10000')
  if (count && rule.UNTIL) fail('RRULE cannot contain both COUNT and UNTIL')
  const byDay = rule.BYDAY ? rule.BYDAY.split(',') : null
  if (byDay?.some(day => !DAYS.includes(day)) || (byDay && new Set(byDay).size !== byDay.length)) fail('BYDAY must use distinct weekdays without ordinal prefixes')
  const weekStart = rule.WKST || 'MO'
  if (!DAYS.includes(weekStart)) fail('Invalid RRULE WKST weekday')
  const until = rule.UNTIL ? temporal({ params: start.zone === 'date' ? { VALUE: 'DATE' } : {}, value: rule.UNTIL }, 'RRULE UNTIL') : null
  if (until && ((until.zone === 'date') !== (start.zone === 'date') || (start.zone !== 'date' && until.zone !== 'utc'))) fail('RRULE UNTIL must match the date type and use UTC for timed sessions')
  if (until && until.value < start.value) fail('RRULE UNTIL is before DTSTART')
  const startWeekday = DAYS[new Date(`${start.day}T12:00:00Z`).getUTCDay()]
  if (byDay && !byDay.includes(startWeekday)) fail('DTSTART must match BYDAY; this recurrence is undefined')
  return { frequency: rule.FREQ, interval, count, until, byDay, weekStart, raw: prop.value }
}

function matchesRule(day, start, rule) {
  const delta = distance(start.day, day)
  const weekday = DAYS[new Date(`${day}T12:00:00Z`).getUTCDay()]
  if (rule.frequency === 'DAILY') return delta % rule.interval === 0 && (!rule.byDay || rule.byDay.includes(weekday))
  const weekOffset = (new Date(`${start.day}T12:00:00Z`).getUTCDay() - DAYS.indexOf(rule.weekStart) + 7) % 7
  const week = Math.floor((delta + weekOffset) / 7)
  const weekdays = rule.byDay || [DAYS[new Date(`${start.day}T12:00:00Z`).getUTCDay()]]
  return week % rule.interval === 0 && weekdays.includes(weekday)
}

function readEvent(event) {
  for (const name of ['RDATE', 'EXRULE', 'DURATION']) if (event.has(name)) fail(`${name} is unsupported; use explicit DTEND and daily/weekly RRULE with EXDATE`)
  const uid = unescapeText(one(event, 'UID', true).value)
  if (!uid.trim() || uid.length > 1000) fail('Timetable UID must be present and at most 1000 characters')
  const recurrenceProp = one(event, 'RECURRENCE-ID')
  if (recurrenceProp?.params.RANGE) fail('RECURRENCE-ID RANGE is unsupported; export individual exceptions')
  const recurrence = temporal(recurrenceProp, 'RECURRENCE-ID')
  const status = one(event, 'STATUS')?.value.toUpperCase() || 'CONFIRMED'
  if (!['CONFIRMED', 'TENTATIVE', 'CANCELLED'].includes(status)) fail('Unsupported VEVENT STATUS')
  const startProp = one(event, 'DTSTART', !recurrence || status !== 'CANCELLED')
  const start = temporal(startProp, 'DTSTART')
  const end = temporal(one(event, 'DTEND'), 'DTEND')
  if (end && (!start || end.zone !== start.zone || end.value <= start.value)) fail('DTEND must be later than DTSTART and use the same date/timezone type')
  const rule = start ? readRule(one(event, 'RRULE'), start) : null
  if (recurrence && rule) fail('A RECURRENCE-ID exception cannot define another RRULE')
  const excluded = (event.get('EXDATE') || []).flatMap(prop => prop.value.split(',').map(value => temporal({ ...prop, value }, 'EXDATE')))
  if (excluded.some(value => !start || (value.zone === 'date') !== (start.zone === 'date'))) fail('EXDATE must match the DTSTART value type')
  return { uid, recurrence, start, end, rule, excluded, status,
    title: one(event, 'SUMMARY') ? unescapeText(one(event, 'SUMMARY').value) : null,
    location: one(event, 'LOCATION') ? unescapeText(one(event, 'LOCATION').value) : null,
    description: one(event, 'DESCRIPTION') ? unescapeText(one(event, 'DESCRIPTION').value) : null,
    url: one(event, 'URL')?.value || null }
}

function ending(event, start) {
  if (!event.end) return null
  if (event.start.zone === 'date') return onDay(event.end, addDays(start.day, distance(event.start.day, event.end.day)))
  if (event.start.zone === 'utc') {
    const value = new Date(Date.parse(start.value) + Date.parse(event.end.value) - Date.parse(event.start.value)).toISOString()
    return { ...event.end, value, day: value.slice(0, 10), key: value }
  }
  const wall = value => Date.parse(`${value.day}T${value.time}Z`)
  const endWall = new Date(wall(start) + wall(event.end) - wall(event.start)).toISOString()
  return onDay({ ...event.end, zone: start.zone, time: endWall.slice(11, 19) }, endWall.slice(0, 10))
}

function within(start, end, range) {
  return itemOverlaps({ start: start.value, end: start.zone === 'date' && end ? addDays(end.day, -1) : end?.value,
    all_day: start.zone === 'date' }, range.from, range.to)
}

function recordFor(event, start, end, identity, options, fingerprint, details = {}) {
  const source = options.source
  const sourceId = identity
  const allDay = start.zone === 'date'
  return { entity: 'sessions', source_id: sourceId, record: {
    id: uuid(`${source}\0${sourceId}`), title: event.title || 'Timetable session', status: event.status === 'CANCELLED' ? 'cancelled' : 'planned',
    semester_id: options.semester_id || null, module_id: options.module_id || null,
    start_date: allDay ? start.day : null, end_date: allDay ? end ? addDays(end.day, -1) : start.day : null,
    start_at: allDay ? null : start.value, end_at: allDay ? null : end?.value || null,
    data: { location: event.location || '', description: event.description || '', url: event.url || '', all_day: allDay,
      timezone: start.zone === 'london' ? 'Europe/London' : start.zone === 'utc' ? 'UTC' : null, ...details },
    provenance: { source, source_id: sourceId, fingerprint }
  } }
}

function importRange(options, groups) {
  if ((options.from && !isDateKey(options.from)) || (options.to && !isDateKey(options.to))) fail('Import range must use valid YYYY-MM-DD dates')
  const starts = [...groups.values()].map(group => group.master?.start?.day).filter(Boolean).sort()
  const from = options.from || starts[0]
  let to = options.to || from
  if (!from) fail('Timetable has no master DTSTART sessions')
  if (!options.to) {
    for (const { master, exceptions } of groups.values()) {
      if (!master) fail('A recurrence exception has no matching master event')
      if (master.rule && !master.rule.until && !master.rule.count) fail('Unbounded RRULE needs explicit import from/to dates')
      let last = master.rule?.until?.day || master.end?.day || master.start.day
      if (master.rule?.count) {
        let count = 0
        const limit = addDays(master.start.day, 365)
        for (let day = master.start.day; day <= limit; day = addDays(day, 1)) {
          if (!matchesRule(day, master.start, master.rule)) continue
          last = day
          if (++count === master.rule.count) break
        }
        if (count !== master.rule.count) fail('Finite recurrence exceeds 366 days; provide an explicit import from/to window')
      }
      to = [to, last, ...[...exceptions.values()].map(event => event.start?.day || event.recurrence.day)].sort().at(-1)
    }
  }
  if (from > to || distance(from, to) > 365) fail('Choose an inclusive timetable import window of at most 366 days')
  return { from, to }
}

function parseIcs(text, options, fingerprint) {
  const groups = new Map()
  const { events, method } = readIcs(text)
  for (const raw of events) {
    if (method === 'CANCEL' && !raw.has('STATUS')) raw.set('STATUS', [{ name: 'STATUS', params: {}, value: 'CANCELLED' }])
    const event = readEvent(raw)
    if (!groups.has(event.uid)) groups.set(event.uid, { master: null, exceptions: new Map() })
    const group = groups.get(event.uid)
    if (event.recurrence) {
      if (group.exceptions.has(event.recurrence.key)) fail('Duplicate RECURRENCE-ID; export the current event version only')
      group.exceptions.set(event.recurrence.key, event)
    } else {
      if (group.master) fail('Duplicate master UID; export the current event version only')
      group.master = event
    }
  }
  const range = importRange(options, groups), records = []
  let steps = 0, generated = 0
  for (const { master, exceptions } of groups.values()) {
    if (!master) fail('A recurrence exception has no matching master event')
    if (exceptions.size && !master.rule) fail('RECURRENCE-ID requires a recurring master event')
    if ([...exceptions.values()].some(event => (event.recurrence.zone === 'date') !== (master.start.zone === 'date'))) fail('RECURRENCE-ID must match the master date type')
    const excluded = new Set(master.excluded.map(value => value.key)), matchedExceptions = new Set()
    const recurrenceDay = event => master.start.zone === 'london' ? dateKey(event.recurrence.value) : event.recurrence.day
    const stop = [range.to, ...[...exceptions.values()].map(recurrenceDay)].sort().at(-1)
    let ordinal = 0
    for (let day = master.start.day; day <= stop; day = addDays(day, 1)) {
      if (++steps > MAX_STEPS) fail('Timetable recurrence expansion exceeds the safe scan limit; use a more recent feed')
      if (master.rule && !matchesRule(day, master.start, master.rule)) continue
      if (!master.rule && ordinal) break
      if (master.rule?.count && ordinal >= master.rule.count) break
      if (master.rule?.until && day > addDays(master.rule.until.day, 1)) break
      const start = onDay(master.start, day)
      if (master.rule?.until && start.value > master.rule.until.value) break
      ordinal++
      if (++generated > MAX_RECORDS) fail('Timetable recurrence expansion exceeds 10000 occurrences; narrow the source/import window')
      const originalEnd = ending(master, start)
      const exception = exceptions.get(start.key)
      if (exception) matchedExceptions.add(start.key)
      const event = exception ? { ...master, ...exception, title: exception.title ?? master.title,
        location: exception.location ?? master.location, description: exception.description ?? master.description, url: exception.url ?? master.url } : master
      const isExcluded = excluded.has(start.key) && !exception
      const actualStart = exception?.start || start
      const actualEnd = exception ? exception.end || (exception.start ? ending(master, actualStart) : originalEnd) : originalEnd
      if (!within(actualStart, actualEnd, range)) continue
      records.push(recordFor(isExcluded ? { ...event, status: 'CANCELLED' } : event, actualStart, actualEnd, `${master.uid}#${start.key}`, options, fingerprint, {
        ics: { uid: master.uid, recurrence_id: exception?.recurrence?.value || null, original_start: start.value,
          rrule: master.rule?.raw || null, exdates: master.excluded.map(value => value.value), status: isExcluded ? 'CANCELLED' : event.status,
          ...(isExcluded ? { cancellation: 'EXDATE' } : {}) }, import_range: range
      }))
    }
    if (matchedExceptions.size !== exceptions.size) fail('A RECURRENCE-ID does not match an occurrence of its master rule')
  }
  if (records.length > MAX_RECORDS) fail('Timetable import exceeds 10000 records')
  return { range, records, warnings: [] }
}

function csvRows(text) {
  const input = text.replace(/^\uFEFF/, ''), rows = []
  let row = [], value = '', quoted = false, closed = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { value += '"'; index++ }
      else if (char === '"') { quoted = false; closed = true }
      else value += char
    } else if (char === '"') {
      if (value || closed) fail('Invalid CSV quoting')
      quoted = true
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(value); value = ''; closed = false
      if (char !== ',') {
        if (char === '\r' && input[index + 1] === '\n') index++
        if (row.some(cell => cell !== '')) rows.push(row)
        row = []
      }
    } else {
      if (closed) fail('Unexpected text after a quoted CSV field')
      value += char
    }
  }
  if (quoted) fail('CSV contains an unterminated quoted field')
  if (value || row.length || closed) { row.push(value); if (row.some(cell => cell !== '')) rows.push(row) }
  const headers = (rows.shift() || []).map(value => value.trim().toLowerCase())
  if (!headers.includes('title') || !headers.includes('date') || new Set(headers).size !== headers.length) fail('CSV needs unique title and date headers')
  const allowed = ['title', 'date', 'start_time', 'end_time', 'end_date', 'location', 'description', 'module_id', 'source_id', 'uid', 'id', 'status']
  if (headers.some(header => !allowed.includes(header))) fail('CSV contains unsupported columns; use title,date,start_time,end_time,end_date,location,description,module_id,source_id,uid,id,status')
  if (rows.length > MAX_RECORDS) fail('Timetable CSV exceeds 10000 rows')
  if (!rows.length) fail('Timetable CSV contains no sessions')
  return rows.map((fields, index) => {
    if (fields.length !== headers.length) fail(`CSV row ${index + 2} has the wrong field count`)
    return Object.fromEntries(headers.map((header, position) => [header, fields[position].trim()]))
  })
}

function parseCsv(text, options, fingerprint) {
  const records = [], seen = new Set()
  let usedContentIdentity = false
  const range = options.from || options.to ? { from: options.from || '0001-01-01', to: options.to || '9999-12-31' } : null
  if (range && (!isDateKey(range.from) || !isDateKey(range.to) || range.from > range.to || distance(range.from, range.to) > 365)) fail('CSV import range requires valid from/to dates within 366 days')
  for (const [index, row] of csvRows(text).entries()) {
    const line = index + 2
    if (!row.title || !isDateKey(row.date) || (row.end_date && !isDateKey(row.end_date))) fail(`CSV row ${line} requires a title and valid civil dates`)
    if (row.end_time && !row.start_time) fail(`CSV row ${line} has an end clock without a start clock`)
    if (row.start_time && row.end_date && !row.end_time) fail(`CSV row ${line} needs an end_time for its timed end_date`)
    if (row.status && !['planned', 'active', 'cancelled', 'canceled'].includes(row.status.toLowerCase())) fail(`CSV row ${line} has an unsupported status`)
    const timed = Boolean(row.start_time)
    const startValue = timed ? londonDateTime(row.date, row.start_time) : row.date
    if (!startValue) fail(`CSV row ${line} has an invalid, ambiguous or nonexistent London start clock; use a date-only row or UTC ICS`)
    const endDay = row.end_date || (timed && row.end_time && row.end_time < row.start_time ? addDays(row.date, 1) : row.date)
    if (endDay < row.date) fail(`CSV row ${line} ends before it starts`)
    const endValue = row.end_time ? londonDateTime(endDay, row.end_time) : null
    if (row.end_time && (!endValue || endValue <= startValue)) fail(`CSV row ${line} has an invalid or ambiguous end clock`)
    const start = { day: row.date, value: startValue, zone: timed ? 'london' : 'date' }
    const end = timed ? endValue ? { day: endDay, value: endValue, zone: 'london' } : null
      : { day: addDays(endDay, 1), value: addDays(endDay, 1), zone: 'date' }
    const rowId = row.source_id || row.uid || row.id
    if (!rowId) usedContentIdentity = true
    const identity = rowId ? `csv:${rowId}` : `csv:${hash(JSON.stringify(row))}`
    if (seen.has(identity)) fail(`CSV row ${line} duplicates another session; supply distinct source_id values`)
    seen.add(identity)
    if (range && !within(start, end, range)) continue
    records.push(recordFor({ ...row, status: ['cancelled', 'canceled'].includes(row.status?.toLowerCase()) ? 'CANCELLED' : 'CONFIRMED' }, start, end, identity,
      { ...options, module_id: row.module_id || options.module_id }, fingerprint, { csv: { row: line, fields: row } }))
  }
  return { range, records, warnings: usedContentIdentity ? ['CSV rows without source_id, uid or id use a content hash. An edited row cannot be matched to its previous version; supply stable identifiers before reimporting edits.'] : [] }
}

export function parseTimetable(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) fail('Upload a nonempty timetable text file')
  if (Buffer.byteLength(text, 'utf8') > 2 * 1024 * 1024) fail('Timetable text exceeds the 2 MB import limit')
  if (!['ics', 'csv'].includes(options.format)) fail('Choose timetable format ics or csv')
  const source = options.source || `timetable:${options.format}`
  if (typeof source !== 'string' || !source.trim() || source.length > 500) fail('Timetable source must be a short nonempty identifier')
  const fingerprint = hash(text)
  const result = options.format === 'ics' ? parseIcs(text, { ...options, source }, fingerprint) : parseCsv(text, { ...options, source }, fingerprint)
  return { source, fingerprint, ...result }
}
