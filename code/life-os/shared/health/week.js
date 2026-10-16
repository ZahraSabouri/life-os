// A week of moving, measured against the UK guideline (guidance.js): minutes at moderate effort,
// vigorous minutes counted twice, and the days with a strength session. Weeks run Monday to Sunday.
import { addDays, dateKey } from '../calendar.js'
import { ACTIVITY_TARGET, activity } from './guidance.js'

const DONE = new Set(['done', 'completed', 'complete'])
export const isDone = (entry) => DONE.has(String(entry?.status ?? '').toLowerCase())
export const isSkipped = (entry) => ['skipped', 'cancelled', 'canceled'].includes(String(entry?.status ?? '').toLowerCase())
export const dayOf = (entry) => dateKey(entry?.start_at ?? entry?.created_at ?? '')
export function weekStart(date) {
  const day = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
  return addDays(date, -day)
}
const details = (entry) => {
  let value = entry?.details ?? {}
  if (typeof value === 'string') { try { value = JSON.parse(value) } catch { value = {} } }
  return value && typeof value === 'object' ? value : {}
}

// What one session counts for: moderate and vigorous minutes, the guideline's figure, strength.
export function sessionCounts(entry) {
  const d = details(entry)
  const total = Number(d.duration_min) > 0 ? Number(d.duration_min) : 0
  const given = (value) => value !== undefined && value !== null && value !== '' && Number(value) >= 0
  let moderate = given(d.moderate_min) ? Number(d.moderate_min) : null
  let vigorous = given(d.vigorous_min) ? Number(d.vigorous_min) : null
  if (moderate === null && vigorous === null) {
    const effort = d.effort ?? activity(d.kind).effort
    moderate = effort === 'moderate' ? total : 0
    vigorous = effort === 'vigorous' ? total : 0
  }
  moderate ??= 0
  vigorous ??= 0
  const strength = d.strength === true || (d.strength === undefined && Boolean(activity(d.kind).strength))
  return { total, moderate, vigorous, counted: moderate + 2 * vigorous, strength }
}

// The week that holds `today`: what was done, what is still planned, and the guideline's measures.
export function weekOfMoving(entries, today) {
  const from = weekStart(today), to = addDays(from, 6)
  const sessions = (entries ?? []).filter((entry) => entry?.type === 'workout' && !isSkipped(entry)).map((entry) => ({ entry, day: dayOf(entry), counts: sessionCounts(entry) }))
    .filter((row) => row.day >= from && row.day <= to).sort((a, b) => a.day.localeCompare(b.day) || String(a.entry.start_at).localeCompare(String(b.entry.start_at)))
  const done = sessions.filter((row) => isDone(row.entry))
  const minutes = done.reduce((n, row) => n + row.counts.counted, 0)
  const strengthDays = new Set(done.filter((row) => row.counts.strength).map((row) => row.day)).size
  const activeDays = new Set(done.map((row) => row.day)).size
  const days = Array.from({ length: 7 }, (_, i) => { const day = addDays(from, i); return { day, done: done.filter((row) => row.day === day), planned: sessions.filter((row) => row.day === day && !isDone(row.entry)) } })
  return {
    from, to, sessions, done, planned: sessions.filter((row) => !isDone(row.entry)), days,
    minutes: Math.round(minutes), target: ACTIVITY_TARGET.moderateMinutes, strengthDays, strengthTarget: ACTIVITY_TARGET.strengthDays, activeDays,
    met: minutes >= ACTIVITY_TARGET.moderateMinutes && strengthDays >= ACTIVITY_TARGET.strengthDays,
  }
}

// The daily ticks (5 A Day, drinks) of one day: the latest measurement of each.
export function dayTicks(entries, day) {
  const out = {}
  for (const entry of entries ?? []) {
    if (entry?.type !== 'measurement' || dayOf(entry) !== day) continue
    const d = details(entry)
    if (!d.metric) continue
    if (!out[d.metric] || String(entry.updated_at ?? entry.created_at) > String(out[d.metric].entry.updated_at ?? out[d.metric].entry.created_at)) out[d.metric] = { entry, value: Number(d.value) || 0 }
  }
  return out
}
