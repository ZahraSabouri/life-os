// What is sent when she changes an entry in place (components/EntryEditor.jsx): the form's
// boxes turned into the entry's own fields. Pure, so the page and the tests share it.
import { dateKey, isDateKey, londonDateTime } from '../../../shared/calendar.js'
import { REPEAT, weekdaysOf } from '../../../shared/routines.js'
import { clockOf } from './day.js'

export const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']]
// Kinds that are ticked off: the state is offered for these only.
export const TICKED = new Set(['task', 'time-block'])
export const STATES = [['', 'To do'], ['done', 'Done'], ['cancelled', 'Taken off the day']]

const dayOf = (value) => (!value ? '' : String(value).length <= 10 ? String(value) : dateKey(value) || '')
const clockOfEntry = (entry, value) => (!value || entry.all_day || String(value).length <= 10 ? '' : clockOf(value))

// What is sent for an entry, from what the form holds. Throws a plain sentence when it cannot be.
export function entryPatch(entry, form) {
  const title = form.title.trim()
  if (!title) throw new Error('Give it a title')
  if (entry.type === REPEAT) {
    if (!isDateKey(form.day)) throw new Error('Give the first day')
    if (form.until && form.until < form.day) throw new Error('The last day is before the first day')
    if (!form.weekdays.length) throw new Error('Choose at least one weekday')
    if (form.end && !form.start) throw new Error('Give a start time as well as an end time')
    if (form.end && form.end <= form.start) throw new Error('The end time is after the start time')
    const { start: _start, end: _end, weekdays: _days, ...kept } = entry.details ?? {}
    return {
      title, start_at: form.day, end_at: form.until || null, all_day: true,
      details: { ...kept, weekdays: form.weekdays.join(','), ...(form.start ? { start: form.start } : {}), ...(form.end ? { end: form.end } : {}) },
    }
  }
  const patch = { title }
  if (form.day) {
    if (!isDateKey(form.day)) throw new Error('That day does not exist')
    if (form.end && !form.start) throw new Error('Give a start time as well as an end time')
    if (form.start) {
      const start = londonDateTime(form.day, form.start)
      const end = form.end ? londonDateTime(form.day, form.end) : ''
      if (!start || (form.end && !end)) throw new Error('That clock time does not exist on that day (the clocks change)')
      if (end && end <= start) throw new Error('The end time is after the start time')
      Object.assign(patch, { start_at: start, end_at: end || null, all_day: false })
    } else Object.assign(patch, { start_at: form.day, end_at: null, all_day: true })
  } else if (entry.start_at) Object.assign(patch, { start_at: null, end_at: null, all_day: false })
  if (TICKED.has(entry.type)) patch.status = form.status || null
  // Empty boxes are left out, so a cleared number or text is not sent as "".
  const details = Object.fromEntries(Object.entries({ ...form.details, ...(entry.type === 'note' || 'body' in (entry.details ?? {}) ? { body: form.body.trim() } : {}) }).filter(([, value]) => value !== '' && value !== undefined && value !== null))
  if (entry.type === 'note' && !details.body) throw new Error('A note needs some text')
  patch.details = details
  return patch
}

// The form's boxes, from the entry as the core gives it.
export function entryForm(entry) {
  const repeating = entry.type === REPEAT
  return {
    title: entry.title ?? '', body: entry.details?.body ?? '', details: { ...(entry.details ?? {}) },
    day: dayOf(entry.start_at), until: repeating ? dayOf(entry.end_at) : '',
    start: repeating ? entry.details?.start ?? '' : clockOfEntry(entry, entry.start_at), end: repeating ? entry.details?.end ?? '' : clockOfEntry(entry, entry.end_at),
    weekdays: repeating ? weekdaysOf(entry.details?.weekdays) : [], status: ['done', 'cancelled'].includes(entry.status) ? entry.status : '',
  }
}
