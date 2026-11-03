// Checks a mail batch against mail-batch.schema.json before it goes into mail/inbox/.
// Usage: node mail/check-batch.mjs <batch.json>   (prints OK, or every problem found)
// No packages needed. It understands the parts of JSON Schema the format uses (type, const,
// enum, required, properties, additionalProperties, items, min/max items and length,
// pattern, format date-time/date/uri, $ref into $defs), then checks what a schema cannot:
// refs are unique and point somewhere real, each message names a source the batch declares,
// and no message or action appears twice; in version 2, the items (shared/harvest.js). Life OS's importer uses the same rules.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatty, fitsArea, junkLink } from '../code/life-os/shared/harvest.js'
import { dateKey } from '../code/life-os/shared/calendar.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const MAX_BYTES = 10 * 1024 * 1024

const isDateTime = (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value))
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
const isUri = (value) => { try { return Boolean(new URL(value).protocol) } catch { return false } }
const typeOf = (value) => (Array.isArray(value) ? 'array' : value === null ? 'null' : Number.isInteger(value) ? 'integer' : typeof value)

function validate(schema, value, where, root, problems) {
  if (schema.$ref) return validate(schema.$ref.replace('#/$defs/', '').split('/').reduce((node, key) => node[key], root.$defs), value, where, root, problems)
  const say = (text) => problems.push(`${where || 'batch'}: ${text}`)
  if ('const' in schema && value !== schema.const) return say(`must be ${JSON.stringify(schema.const)}`)
  if (schema.enum && !schema.enum.includes(value)) return say(`must be one of ${schema.enum.join(', ')}`)
  if (schema.type) {
    const actual = typeOf(value)
    if (!(actual === schema.type || (schema.type === 'number' && actual === 'integer'))) return say(`must be ${schema.type === 'array' || schema.type === 'object' || schema.type === 'integer' ? `an ${schema.type}` : `a ${schema.type}`}, found ${actual}`)
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) say(schema.minLength === 1 ? 'must not be empty' : `must be at least ${schema.minLength} characters`)
    if (schema.maxLength !== undefined && value.length > schema.maxLength) say(`is ${value.length} characters; at most ${schema.maxLength}`)
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) say(`does not match ${schema.pattern}`)
    if (schema.format === 'date-time' && !isDateTime(value)) say('must be a date and time like 2026-10-28T15:30:00Z')
    if (schema.format === 'date' && !isDate(value)) say('must be a day like 2026-10-28')
    if (schema.format === 'uri' && !isUri(value)) say('must be a full link')
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) say(`needs at least ${schema.minItems}`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) say(`has ${value.length}; at most ${schema.maxItems}`)
    if (schema.items) value.forEach((item, index) => validate(schema.items, item, `${where}[${index}]`, root, problems))
  }
  if (typeOf(value) === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) say(`is missing "${key}"`)
    for (const [key, item] of Object.entries(value)) {
      const child = schema.properties?.[key]
      if (child) validate(child, item, where ? `${where}.${key}` : key, root, problems)
      else if (schema.additionalProperties === false) say(`has a field the format does not know: "${key}"`)
    }
  }
}

export function checkBatch(batch, schema = JSON.parse(fs.readFileSync(path.join(here, 'mail-batch.schema.json'), 'utf8'))) {
  const problems = []
  const warnings = []
  validate(schema, batch, '', schema, problems)
  if (problems.length || typeOf(batch) !== 'object') return { ok: false, problems, warnings }
  const v2 = batch.version === 2
  if (!v2) {
    if (!batch.digest) problems.push('batch: is missing "digest" (version 1 needs one)')
    if (batch.items) problems.push('batch: items need version 2')
    if (batch.messages.some((message) => message.links)) problems.push('messages: links need version 2')
    if (problems.length) return { ok: false, problems, warnings }
  }
  // Messages an item cites may keep their text and links, even automated mail (job alerts).
  const cited = new Set((batch.items ?? []).flatMap((item) => item.messageRefs ?? []))

  const sourceIds = new Set()
  for (const source of batch.sources) {
    if (sourceIds.has(source.id)) problems.push(`sources: "${source.id}" is listed twice`)
    sourceIds.add(source.id)
    if (source.status !== 'unavailable' && !source.window) problems.push(`sources: "${source.id}" was read but has no window`)
    if (source.window && Date.parse(source.window.to) < Date.parse(source.window.from)) problems.push(`sources: "${source.id}" window ends before it starts`)
  }
  const refs = new Set()
  const seenMessages = new Set()
  batch.messages.forEach((message, index) => {
    const where = `messages[${index}]`
    if (refs.has(message.ref)) problems.push(`${where}: ref "${message.ref}" is used twice`)
    refs.add(message.ref)
    if (!sourceIds.has(message.source)) problems.push(`${where}: source "${message.source}" is not in sources`)
    const key = `${message.source}|${message.sourceId}`
    if (seenMessages.has(key)) problems.push(`${where}: the same message (${key}) appears twice`)
    seenMessages.add(key)
    if (['newsletter', 'automated', 'noise'].includes(message.category) && message.text && !cited.has(message.ref)) warnings.push(`${where}: ${message.category} mail should leave out its text`)
    if (message.text && /\b\d{6}\b/.test(message.text) && /(code|verification|passcode|one-time|otp)/i.test(`${message.subject} ${message.text}`)) problems.push(`${where}: looks like it holds a security code; keep only the summary`)
    if (v2) {
      if (chatty(message.summary)) problems.push(`${where}: the summary talks to her ("you should…"); write what the message says`)
      for (const [at, link] of (message.links ?? []).entries()) { const junk = junkLink(link.href); if (junk) problems.push(`${where}.links[${at}]: ${junk}`) }
    }
  })
  const dedupe = new Set()
  batch.actions.forEach((action, index) => {
    const where = `actions[${index}]`
    if (refs.has(action.ref)) problems.push(`${where}: ref "${action.ref}" is used twice`)
    refs.add(action.ref)
    if (dedupe.has(action.dedupeKey)) problems.push(`${where}: dedupeKey "${action.dedupeKey}" is used twice`)
    dedupe.add(action.dedupeKey)
    for (const ref of action.messageRefs ?? []) if (!batch.messages.some((message) => message.ref === ref)) problems.push(`${where}: points to message "${ref}", which is not in the batch`)
  })
  for (const [index, entry] of (batch.digest?.bySource ?? []).entries()) if (!sourceIds.has(entry.source)) problems.push(`digest.bySource[${index}]: source "${entry.source}" is not in sources`)
  for (const [index, entry] of (batch.digest?.deadlines ?? []).entries()) if (entry.ref && !refs.has(entry.ref)) problems.push(`digest.deadlines[${index}]: ref "${entry.ref}" is not in the batch`)
  checkItems(batch, refs, problems)
  return { ok: problems.length === 0, problems, warnings }
}

// Version 2's items: each names what it is and where it came from, a real link, its own day.
const isWhen = (value) => isDate(value) || isDateTime(value)
function checkItems(batch, refs, problems) {
  const messages = new Map(batch.messages.map((message) => [message.ref, message]))
  const actionRefs = new Set(batch.actions.map((action) => action.ref))
  const keys = new Set()
  for (const [index, item] of (batch.items ?? []).entries()) {
    const where = `items[${index}]`
    if (refs.has(item.ref)) problems.push(`${where}: ref "${item.ref}" is used twice`)
    refs.add(item.ref)
    if (keys.has(item.key)) problems.push(`${where}: key "${item.key}" is used twice`)
    keys.add(item.key)
    if (!fitsArea(item.kind, item.area)) problems.push(`${where}: a ${item.kind} is not in area "${item.area}"`)
    if (chatty(item.summary)) problems.push(`${where}: the summary talks to her ("you should…"); write what came in`)
    for (const field of ['start', 'end']) if (item[field] !== undefined && !isWhen(item[field])) problems.push(`${where}.${field}: must be a day like 2026-11-05 or a time like 2026-11-05T18:00:00Z`)
    if (item.allDay && item.start && !isDate(item.start)) problems.push(`${where}: an all-day item starts on a day, not a time`)
    if (item.start && item.end && isWhen(item.start) && isWhen(item.end) && Date.parse(item.end) < Date.parse(item.start)) problems.push(`${where}: ends before it starts`)
    for (const [field, value] of [['url', item.url], ['foundAt.url', item.foundAt?.url]]) { const junk = value && junkLink(value); if (junk) problems.push(`${where}.${field}: ${junk}`) }
    if (['vacancy', 'event'].includes(item.kind) && !item.url) problems.push(`${where}: a ${item.kind} needs the link to its own page, so it can be found in ${item.kind === 'vacancy' ? 'JobMap' : 'Cardiff Life'}`)
    const cited = (item.messageRefs ?? []).map((ref) => messages.get(ref))
    for (const [at, ref] of (item.messageRefs ?? []).entries()) if (!cited[at]) problems.push(`${where}: points to message "${ref}", which is not in the batch`)
    for (const ref of item.actionRefs ?? []) if (!actionRefs.has(ref)) problems.push(`${where}: points to action "${ref}", which is not in the batch`)
    if (!cited.length && !item.foundAt) problems.push(`${where}: says neither which message nor which page it came from`)
    const first = cited.filter(Boolean).map((message) => message.receivedAt).sort((a, b) => Date.parse(a) - Date.parse(b))[0]
    if (first && dateKey(first) !== item.day) problems.push(`${where}: day ${item.day} is not the London day its first message came (${dateKey(first)})`)
    if (!first && item.foundAt && dateKey(item.foundAt.checkedAt) !== item.day) problems.push(`${where}: day ${item.day} is not the London day it was found (${dateKey(item.foundAt.checkedAt)})`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2]
  if (!file) { console.error('Usage: node mail/check-batch.mjs <batch.json>'); process.exit(2) }
  const bytes = fs.statSync(file).size
  if (bytes > MAX_BYTES) { console.error(`Too big: ${bytes} bytes; at most ${MAX_BYTES}. Leave out the text of low-priority mail.`); process.exit(1) }
  let batch
  try { batch = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (error) { console.error(`Not readable JSON: ${error.message}`); process.exit(1) }
  const { ok, problems, warnings } = checkBatch(batch)
  for (const warning of warnings) console.log(`Note: ${warning}`)
  if (!ok) { console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:`); for (const problem of problems) console.error(`- ${problem}`); process.exit(1) }
  console.log(`OK (version ${batch.version}): ${batch.messages.length} messages, ${batch.actions.length} actions, ${(batch.items ?? []).length} items, ${batch.sources.length} sources (${batch.sources.map((source) => `${source.id} ${source.status}`).join(', ')})`)
}
