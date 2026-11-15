// The ticks kept for a day's checklist (or a stretch of days, for the week and month pictures).
// Every page that shows them reads again when any of them ticks something.
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'

const CHANGED = 'life-os:checks-changed'

export function useDayChecks(from, to = from) {
  const [state, setState] = useState({ checks: {}, loading: true, error: '' })
  const [turn, setTurn] = useState(0)
  const reload = useCallback(() => setTurn((value) => value + 1), [])
  useEffect(() => {
    if (!from) return undefined
    let off = false
    const query = from === to ? `date=${from}` : `from=${from}&to=${to}`
    apiFetch(`/api/day/checks?${query}`)
      .then((data) => { if (!off) setState({ checks: data.checks ?? {}, loading: false, error: '' }) })
      .catch((failure) => { if (!off) setState((current) => ({ ...current, loading: false, error: failure.message })) })
    return () => { off = true }
  }, [from, to, turn])
  useEffect(() => {
    window.addEventListener(CHANGED, reload)
    return () => window.removeEventListener(CHANGED, reload)
  }, [reload])
  return { ...state, reload }
}

export async function tickCheck(date, key, done, title = '') {
  const saved = await apiFetch('/api/day/checks', { method: 'POST', body: JSON.stringify({ date, key, done, title: String(title).slice(0, 200) }) })
  window.dispatchEvent(new Event(CHANGED))
  return saved
}
