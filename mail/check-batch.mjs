// Checks a mail batch against mail-batch.schema.json before it goes into mail/inbox/.
// Usage: node mail/check-batch.mjs <batch.json>   (prints OK, or every problem found)
// No packages needed. It understands the parts of JSON Schema the format uses (type, const,
// enum, required, properties, additionalProperties, items, min/max items and length,
// pattern, format date-time/date/uri, $ref into $defs), then checks what a schema cannot:
// refs are unique and point somewhere real, each message names a source the batch declares,
// and no message or action appears twice. Life OS's importer is meant to use the same rules.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
    if (['newsletter', 'automated', 'noise'].includes(message.category) && message.text) warnings.push(`${where}: ${message.category} mail should leave out its text`)
    if (message.text && /\b\d{6}\b/.test(message.text) && /(code|verification|passcode|one-time|otp)/i.test(`${message.subject} ${message.text}`)) problems.push(`${where}: looks like it holds a security code; keep only the summary`)
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
  for (const [index, entry] of (batch.digest.bySource ?? []).entries()) if (!sourceIds.has(entry.source)) problems.push(`digest.bySource[${index}]: source "${entry.source}" is not in sources`)
  for (const [index, entry] of (batch.digest.deadlines ?? []).entries()) if (entry.ref && !refs.has(entry.ref)) problems.push(`digest.deadlines[${index}]: ref "${entry.ref}" is not in the batch`)
  return { ok: problems.length === 0, problems, warnings }
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
  console.log(`OK: ${batch.messages.length} messages, ${batch.actions.length} actions, ${batch.sources.length} sources (${batch.sources.map((source) => `${source.id} ${source.status}`).join(', ')})`)
}
