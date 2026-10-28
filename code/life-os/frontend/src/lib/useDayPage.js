import { useMemo, useState } from 'react'
import { isDateKey, londonDateTime } from '../../../shared/calendar.js'
import { apiFetch } from './api.js'
import { tellStudyHub } from './studyHub.js'
import { movePlan, setPlanStatus } from './plans.js'
import { isoWeekday, sayWeekdays } from '../../../shared/routines.js'
import { addDays, filterCalendarItems, formatCalendarDay, isComplete, todayGroups } from './calendar.js'
import { buildDay, noteTitle, parsePlan, splitThings } from './day.js'
import { useCalendar, useLondonToday } from './useCalendar.js'
import { useDay, useLondonClock } from './useDay.js'

const ADD_KIND_KEY = 'life-os.today-add'
const KINDS = ['plan', 'note', 'buy']
function savedKind() { try { const saved = window.localStorage.getItem(ADD_KIND_KEY); return KINDS.includes(saved) ? saved : 'plan' } catch { return 'plan' } }

// Everything a page needs to show one day and to add to it: the calendar's dated items, the
// day's study blocks and panels, the path they make, and the one line that adds a plan, a
// note or something to buy. The Court, Today and the strip inside each part all use this.
// The calendar's pop-up asks for the day alone (`only`), with the calendar's own filters
// (`areas`, `cardiffScope`), a note for any day it shows (`notesAnyDay`), and `onChanged` to
// have the month behind it read again after a change.
export function useDayPage(requested, { area: fixedArea = '', onSaved, only = false, areas, cardiffScope = 'saved', notesAnyDay = false, onChanged } = {}) {
  const today = useLondonToday()
  const clock = useLondonClock()
  const date = isDateKey(requested ?? '') ? requested : today
  const isToday = date === today
  // The calendar is read once for the attention lists too, unless the day is far from today.
  const near = !only && date >= addDays(today, -350) && date <= addDays(today, 14)
  const calendar = useCalendar(near ? addDays(today, -350) : only ? date : addDays(date, -7), near ? addDays(today, 14) : only ? date : addDays(date, 14))
  const day = useDay(date)
  const [kind, setKind] = useState(savedKind)
  // The area a plan or note is filed under (a room page fixes it), and the day a plan is for
  // (the day being looked at unless she picks another).
  const [chosenArea, setArea] = useState('')
  const area = fixedArea || chosenArea
  const [chosenDay, setDay] = useState('')
  const planDay = isDateKey(chosenDay) ? chosenDay : date
  const [text, setText] = useState('')
  // A plan can come round: '' is once; 'daily', 'weekdays', 'weekly' (the weekday of its day) or 'custom' (chosen days).
  const [repeat, setRepeat] = useState('')
  const [repeatDays, setRepeatDays] = useState([])
  const [until, setUntil] = useState('')
  const [lineState, setLineState] = useState('')
  const [savingId, setSavingId] = useState('')
  const [jobMark, setJobMark] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const items = useMemo(() => filterCalendarItems(calendar.items, { areas, cardiffScope, choices: calendar.choices }), [calendar.items, areas, cardiffScope, calendar.choices])
  const groups = useMemo(() => todayGroups(items, today), [items, today])
  const open = useMemo(() => items.filter((item) => !isComplete(item)), [items])
  const data = day.data?.date === date ? day.data : null
  const path = useMemo(() => buildDay({ items: open, day: data, date, now: isToday ? clock : '' }), [open, data, date, isToday, clock])
  // A note belongs to the day it is written, so another day takes plans and things to buy only;
  // on the calendar a note can be kept for the day it is about, and is dated to that day.
  const noteAllowed = isToday || notesAnyDay
  const adding = kind === 'note' && !noteAllowed ? 'plan' : kind
  const plan = useMemo(() => parsePlan(text), [text])
  const things = useMemo(() => splitThings(text), [text])
  const dayName = planDay === today ? 'today' : formatCalendarDay(planDay, { weekday: 'long' })
  const filed = area ? { area } : {}
  const repeating = adding === 'plan' && Boolean(repeat)
  const weekdays = repeat === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : repeat === 'weekdays' ? [1, 2, 3, 4, 5] : repeat === 'weekly' ? [isoWeekday(planDay)] : [...repeatDays].sort()
  const hint = !text.trim() ? ''
    : adding === 'note' ? (notesAnyDay ? `A note for ${dayName}, kept on the calendar and in the Ledger.` : 'A note, kept on today and in the Ledger.')
      : adding === 'buy' ? (things.length ? `${things.length === 1 ? `“${things[0]}” goes` : `${things.length} things go`} on your shopping list in Budget.` : 'Say what to buy; commas separate several things.')
        : !plan.title ? 'Say what it is as well as when.'
          : repeating ? (weekdays.length ? `“${plan.title}” ${sayWeekdays(weekdays)}${plan.start ? ` at ${plan.start}${plan.end ? ` to ${plan.end}` : ''}` : ', at any time of the day'}, from ${dayName}${until ? ` until ${formatCalendarDay(until)}` : ''}.` : 'Choose the days it comes round on.')
          : plan.start ? `“${plan.title}” at ${plan.start}${plan.end ? ` to ${plan.end}` : ''}, ${dayName}. It goes on the calendar too.`
            : `“${plan.title}”, any time ${dayName}. Type a time (17:30, 5pm) to place it.`

  function choose(next) { setKind(next); try { window.localStorage.setItem(ADD_KIND_KEY, next) } catch { /* kept for this visit */ } }
  function refetch() { calendar.refetch(); day.refetch(); onChanged?.() }
  // A note dated to the day it is for (the calendar's notes), or written today (Today's).
  const noteFor = (body, details = {}) => ({ type: 'note', title: noteTitle(body), ...(notesAnyDay ? { start_at: date, all_day: true } : {}), details: { body, ...details } })

  async function saveLine(event) {
    event?.preventDefault()
    const body = text.trim()
    if (!body || lineState === 'saving') return
    let request
    if (adding === 'note') request = ['/api/entries', noteFor(body, filed)]
    else if (adding === 'buy') {
      if (!things.length) { setError('Say what to buy.'); return }
      request = ['/api/home/shopping', { items: things, date: planDay }]
    } else if (!plan.title) { setError('Say what it is as well as when, for example “17:30 library”.'); return }
    else if (repeating) {
      if (!weekdays.length) { setError('Choose at least one day for it to come round on.'); return }
      if (until && until < planDay) { setError('It cannot end before it starts.'); return }
      request = ['/api/entries', { type: 'repeat', title: plan.title, status: 'active', start_at: planDay, ...(isDateKey(until) ? { end_at: until } : {}), all_day: true,
        details: { weekdays: weekdays.join(','), ...(plan.start ? { start: plan.start } : {}), ...(plan.end ? { end: plan.end } : {}), ...(area ? { area } : {}) } }]
    }
    else if (plan.start) {
      const start = londonDateTime(planDay, plan.start)
      if (!start) { setError('That clock time does not exist on this day (the clocks change). Try another time.'); return }
      request = ['/api/entries', { type: 'event', title: plan.title, start_at: start, ...(plan.end && londonDateTime(planDay, plan.end) ? { end_at: londonDateTime(planDay, plan.end) } : {}), details: filed }]
    } else request = ['/api/entries', { type: 'task', title: plan.title, start_at: planDay, all_day: true, details: filed }]
    setLineState('saving')
    setError('')
    setNotice('')
    try {
      const saved = await apiFetch(request[0], { method: 'POST', body: JSON.stringify(request[1]) })
      setText('')
      if (repeating) { setRepeat(''); setRepeatDays([]); setUntil('') }
      refetch()
      onSaved?.()
      if (adding === 'buy') setNotice(saved.added?.length ? `On “${saved.list.name}” in Budget: ${saved.added.join(', ')}.${saved.skipped?.length ? ` Already there: ${saved.skipped.join(', ')}.` : ''}` : `Already on “${saved.list.name}”: ${(saved.skipped ?? []).join(', ')}.`)
      setLineState('saved')
      window.setTimeout(() => setLineState(''), 1500)
    } catch (failure) {
      setError(`Not saved: ${failure.message}`)
      setLineState('')
    }
  }

  // Ticking off or taking off something she added herself. The entry is kept; only its status changes.
  async function setEntryStatus(stop, status) {
    if (savingId || !stop.entry) return
    setSavingId(stop.key)
    setError('')
    try {
      await setPlanStatus(stop, status)
      refetch()
    } catch (failure) { setError(`Could not change “${stop.title}”: ${failure.message}`) }
    finally { setSavingId('') }
  }

  // Ticking a step of a study card, or the card itself. The Study hub's own rule saves it; a hub
  // tab that is open is told the way another hub tab would tell it, and reloads.
  async function tickStudy(card, step, done) {
    if (savingId || !card?.hubCardId || !card.semesterId) return
    setSavingId(`study:${card.id}`)
    setError('')
    try {
      const saved = await apiFetch('/api/day/study', { method: 'POST', body: JSON.stringify({ semester: card.semesterId, card: card.hubCardId, ...(step ? { step: step.id } : {}), done }) })
      tellStudyHub(card.semesterId, saved)
      refetch()
    } catch (failure) { setError(`Could not change “${step?.text ?? card.title}”: ${failure.message}`) }
    finally { setSavingId('') }
  }

  // Ticking a thing off a shopping list, or putting it back. Budget keeps the list; no price is asked.
  async function tickShopping(list, item, done) {
    if (savingId) return
    setSavingId(`buy:${item.id}`)
    setError('')
    try {
      await apiFetch('/api/home/shopping/tick', { method: 'POST', body: JSON.stringify({ list: list.id, line: item.id, done }) })
      refetch()
    } catch (failure) { setError(`Could not ${done ? 'tick off' : 'put back'} “${item.name}”: ${failure.message}`) }
    finally { setSavingId('') }
  }

  // A job marked from the day ("applied", "rejected"). JobMap saves it by its own rule; what the
  // status was comes back, so the last mark can be undone from where it was made.
  async function markJob(job, status, restore = null) {
    if (savingId || !job?.id) return
    setSavingId(`job:${job.id}`)
    setError('')
    try {
      const saved = await apiFetch('/api/day/jobs', { method: 'POST', body: JSON.stringify({ job: job.id, status, ...(restore ?? {}) }) })
      setJobMark(restore ? null : { id: job.id, role: job.role, company: job.company, status, previous: saved.previous })
      refetch()
    } catch (failure) { setError(`Could not mark “${job.role}” as ${status.toLowerCase()}: ${failure.message}`) }
    finally { setSavingId('') }
  }

  async function completeTask(item) {
    if (savingId || item.meta?.source !== 'core' || item.meta?.type !== 'task' || !item.meta?.entryId) return
    setSavingId(item.id)
    setError('')
    try {
      await setPlanStatus({ entry: { id: item.meta.entryId, revision: item.meta.revision, routine: item.meta.routine }, title: item.title }, 'done')
      calendar.refetch()
    } catch (failure) { setError(`Could not mark the task done: ${failure.message}`) }
    finally { setSavingId('') }
  }

  // A note about one thing on the day (a class, an event, a job), kept as a note of Life OS
  // dated to the day, so what the thing belongs to (the Study hub, JobMap) is not changed.
  async function keepNote(body, about = null) {
    const words = String(body ?? '').trim()
    if (!words || savingId) return false
    setSavingId(`note:${about?.id ?? date}`)
    setError('')
    try {
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(noteFor(words, about ? { about: about.id, about_title: String(about.title ?? '').slice(0, 200) } : {})) })
      refetch()
      return true
    } catch (failure) { setError(`The note was not kept: ${failure.message}`); return false }
    finally { setSavingId('') }
  }

  // Her own entry, done or not done after all ('' is "to do"), from the calendar's pop-up.
  async function setItemStatus(item, status) {
    if (savingId || item.meta?.source !== 'core' || !item.meta?.entryId) return
    setSavingId(item.id)
    setError('')
    try {
      await setPlanStatus({ entry: { id: item.meta.entryId, revision: item.meta.revision, routine: item.meta.routine }, title: item.title }, status || null)
      refetch()
    } catch (failure) { setError(`Could not change “${item.title}”: ${failure.message}`) }
    finally { setSavingId('') }
  }

  async function moveItem(item, toDay) {
    if (savingId || item.meta?.source !== 'core' || !item.meta?.entryId || !isDateKey(toDay)) return false
    setSavingId(item.id)
    setError('')
    try {
      await movePlan(item, toDay)
      refetch()
      return true
    } catch (failure) { setError(`Could not move “${item.title}”: ${failure.message}`); return false }
    finally { setSavingId('') }
  }

  return {
    today, date, isToday, clock, dayName, calendar, day, data, items, groups, path, refetch, keepNote, setItemStatus, moveItem,
    loading: calendar.loading || (day.loading && !data),
    unavailable: (id) => data?.sources.find((source) => source.id === id && source.status === 'unavailable')?.error,
    line: { kind: adding, choose, text, setText, state: lineState, hint, save: saveLine, noteAllowed, area, setArea, fixedArea: Boolean(fixedArea), day: planDay, setDay,
      repeat, setRepeat, repeatDays, toggleRepeatDay: (weekday) => setRepeatDays((current) => (current.includes(weekday) ? current.filter((value) => value !== weekday) : [...current, weekday])), until, setUntil },
    error, notice, savingId, completeTask, tickShopping, tickStudy, markJob, jobMark,
    undoJobMark: () => (jobMark?.previous?.status ? markJob(jobMark, jobMark.previous.status, jobMark.previous) : undefined),
    stopProps: { onDone: (stop) => setEntryStatus(stop, 'done'), onRemove: (stop) => setEntryStatus(stop, 'cancelled'), onStudy: tickStudy, onChanged: refetch, busy: Boolean(savingId) },
  }
}
