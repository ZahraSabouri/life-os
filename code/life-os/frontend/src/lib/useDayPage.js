import { useMemo, useState } from 'react'
import { isDateKey, londonDateTime } from '../../../shared/calendar.js'
import { apiFetch } from './api.js'
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
export function useDayPage(requested, { area: fixedArea = '', onSaved } = {}) {
  const today = useLondonToday()
  const clock = useLondonClock()
  const date = isDateKey(requested ?? '') ? requested : today
  const isToday = date === today
  // The calendar is read once for the attention lists too, unless the day is far from today.
  const near = date >= addDays(today, -350) && date <= addDays(today, 14)
  const calendar = useCalendar(near ? addDays(today, -350) : addDays(date, -7), near ? addDays(today, 14) : addDays(date, 14))
  const day = useDay(date)
  const [kind, setKind] = useState(savedKind)
  // The area a plan or note is filed under (a room page fixes it), and the day a plan is for
  // (the day being looked at unless she picks another).
  const [chosenArea, setArea] = useState('')
  const area = fixedArea || chosenArea
  const [chosenDay, setDay] = useState('')
  const planDay = isDateKey(chosenDay) ? chosenDay : date
  const [text, setText] = useState('')
  const [lineState, setLineState] = useState('')
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const items = useMemo(() => filterCalendarItems(calendar.items, { choices: calendar.choices }), [calendar.items, calendar.choices])
  const groups = useMemo(() => todayGroups(items, today), [items, today])
  const open = useMemo(() => items.filter((item) => !isComplete(item)), [items])
  const data = day.data?.date === date ? day.data : null
  const path = useMemo(() => buildDay({ items: open, day: data, date, now: isToday ? clock : '' }), [open, data, date, isToday, clock])
  // A note belongs to the day it is written, so another day takes plans and things to buy only.
  const adding = kind === 'note' && !isToday ? 'plan' : kind
  const plan = useMemo(() => parsePlan(text), [text])
  const things = useMemo(() => splitThings(text), [text])
  const dayName = planDay === today ? 'today' : formatCalendarDay(planDay, { weekday: 'long' })
  const filed = area ? { area } : {}
  const hint = !text.trim() ? ''
    : adding === 'note' ? 'A note, kept on today and in the Ledger.'
      : adding === 'buy' ? (things.length ? `${things.length === 1 ? `“${things[0]}” goes` : `${things.length} things go`} on your shopping list in Budget.` : 'Say what to buy; commas separate several things.')
        : !plan.title ? 'Say what it is as well as when.'
          : plan.start ? `“${plan.title}” at ${plan.start}${plan.end ? ` to ${plan.end}` : ''}, ${dayName}. It goes on the calendar too.`
            : `“${plan.title}”, any time ${dayName}. Type a time (17:30, 5pm) to place it.`

  function choose(next) { setKind(next); try { window.localStorage.setItem(ADD_KIND_KEY, next) } catch { /* kept for this visit */ } }
  function refetch() { calendar.refetch(); day.refetch() }

  async function saveLine(event) {
    event?.preventDefault()
    const body = text.trim()
    if (!body || lineState === 'saving') return
    let request
    if (adding === 'note') request = ['/api/entries', { type: 'note', title: noteTitle(body), details: { body, ...filed } }]
    else if (adding === 'buy') {
      if (!things.length) { setError('Say what to buy.'); return }
      request = ['/api/home/shopping', { items: things, date: planDay }]
    } else if (!plan.title) { setError('Say what it is as well as when, for example “17:30 library”.'); return }
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
      await apiFetch(`/api/entries/${encodeURIComponent(stop.entry.id)}`, { method: 'PATCH', body: JSON.stringify({ status, ...(stop.entry.revision === undefined ? {} : { revision: stop.entry.revision }) }) })
      refetch()
    } catch (failure) { setError(`Could not change “${stop.title}”: ${failure.message}`) }
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

  async function completeTask(item) {
    if (savingId || item.area !== 'core' || item.meta?.type !== 'task' || !item.meta?.entryId) return
    setSavingId(item.id)
    setError('')
    try {
      await apiFetch(`/api/entries/${encodeURIComponent(item.meta.entryId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'done', ...(item.meta.revision === undefined ? {} : { revision: item.meta.revision }) }) })
      calendar.refetch()
    } catch (failure) { setError(`Could not mark the task done: ${failure.message}`) }
    finally { setSavingId('') }
  }

  return {
    today, date, isToday, clock, dayName, calendar, day, data, items, groups, path, refetch,
    loading: calendar.loading || (day.loading && !data),
    unavailable: (id) => data?.sources.find((source) => source.id === id && source.status === 'unavailable')?.error,
    line: { kind: adding, choose, text, setText, state: lineState, hint, save: saveLine, noteAllowed: isToday, area, setArea, fixedArea: Boolean(fixedArea), day: planDay, setDay },
    error, notice, savingId, completeTask, tickShopping,
    stopProps: { onDone: (stop) => setEntryStatus(stop, 'done'), onRemove: (stop) => setEntryStatus(stop, 'cancelled'), busy: Boolean(savingId) },
  }
}
