// Everything the Health pages read and write: her sessions, appointments, records and daily
// ticks (core entries), her diet (a setting), and food from Budget (read through Life OS).
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { londonDateTime } from '../../../shared/calendar.js'
import { dayTicks } from '../../../shared/health/week.js'

export const HEALTH_TYPES = ['workout', 'appointment', 'medical-record', 'measurement']
const DIET_KEY = 'health-diet'
export const NO_DIET = { eats: 'everything', leaveOut: [], avoid: [] }

// A day, and a clock time if there is one, as the entry's start.
export function startOf(day, time) {
  return time ? londonDateTime(day, time) || day : day
}

export function useHealth() {
  const [entries, setEntries] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [diet, setDietState] = useState(NO_DIET)
  const [turn, setTurn] = useState(0)
  useEffect(() => {
    let off = false
    const filter = encodeURIComponent(JSON.stringify({ types: HEALTH_TYPES }))
    Promise.all([apiFetch(`/api/entries?filter=${filter}&limit=5000`), apiFetch(`/api/settings/${DIET_KEY}`).catch(() => null)])
      .then(([rows, setting]) => {
        if (off) return
        setEntries(Array.isArray(rows) ? rows : [])
        if (setting?.value && typeof setting.value === 'object') setDietState({ ...NO_DIET, ...setting.value })
        setState({ loading: false, error: '' })
      })
      .catch((failure) => { if (!off) setState({ loading: false, error: failure.message }) })
    return () => { off = true }
  }, [turn])
  const refetch = useCallback(() => setTurn((value) => value + 1), [])

  const create = useCallback(async (entry) => { const saved = await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(entry) }); setEntries((rows) => [saved, ...rows]); return saved }, [])
  const change = useCallback(async (id, patch) => { const saved = await apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }); setEntries((rows) => rows.map((row) => (row.id === id ? saved : row))); return saved }, [])
  const remove = useCallback(async (id) => { await apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }); setEntries((rows) => rows.filter((row) => row.id !== id)) }, [])
  const setDiet = useCallback(async (value) => { setDietState(value); await apiFetch(`/api/settings/${DIET_KEY}`, { method: 'PUT', body: JSON.stringify({ value }) }) }, [])

  // A daily tick (5 A Day, drinks): one measurement a day for each, changed in place.
  const setTick = useCallback(async (day, metric, value, unit) => {
    const current = dayTicks(entries, day)[metric]
    if (current) return change(current.entry.id, { details: { ...current.entry.details, metric, value, unit, area: 'body' } })
    return create({ type: 'measurement', title: metric === 'five-a-day' ? '5 A Day' : 'Drinks', start_at: day, all_day: true, status: 'done', details: { metric, value, unit, area: 'body' } })
  }, [entries, change, create])

  return { entries, loading: state.loading, error: state.error, refetch, create, change, remove, diet, setDiet, setTick }
}

// Food from Budget: the UK recipes against what is at home, and her own recipes.
export function useHealthFood(active = true) {
  const [food, setFood] = useState({ loading: true, error: '', ideas: [], mine: [], atHome: 0 })
  const [turn, setTurn] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    let off = false
    apiFetch('/api/health/food').then((value) => { if (!off) setFood({ loading: false, error: '', ...value }) })
      .catch((failure) => { if (!off) setFood((current) => ({ ...current, loading: false, error: failure.message })) })
    return () => { off = true }
  }, [active, turn])
  const add = useCallback(async (id) => { const saved = await apiFetch('/api/health/food/recipes', { method: 'POST', body: JSON.stringify({ id }) }); setTurn((value) => value + 1); return saved }, [])
  return { ...food, refetch: () => setTurn((value) => value + 1), add }
}
