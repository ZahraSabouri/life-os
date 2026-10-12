import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { clockOf } from './day.js'

// The day's study blocks and the Study, Jobs, Home and Notes panels. Read again when the
// window is looked at again, because the parts they come from are edited elsewhere.
export function useDay(date) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [refresh, setRefresh] = useState(0)
  const refetch = useCallback(() => setRefresh((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({ ...current, loading: true, error: '' }))
    apiFetch(`/api/day?${new URLSearchParams({ date })}`, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setState({ data, loading: false, error: '' }) })
      .catch((error) => { if (!controller.signal.aborted) setState((current) => ({ data: current.data?.date === date ? current.data : null, loading: false, error: error.message })) })
    return () => controller.abort()
  }, [date, refresh])

  // A part that could not be read is asked for again, twice at most, before the page says so for good.
  const [tries, setTries] = useState({ date, count: 0 })
  useEffect(() => {
    const failed = state.data?.date === date && (state.data.sources ?? []).some((source) => source.status === 'unavailable')
    const count = tries.date === date ? tries.count : 0
    if (!failed || count >= 2) return undefined
    const timer = window.setTimeout(() => { setTries({ date, count: count + 1 }); refetch() }, 2500)
    return () => window.clearTimeout(timer)
  }, [state.data, date, tries, refetch])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refetch() }
    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.removeEventListener('focus', refetch); document.removeEventListener('visibilitychange', onVisible) }
  }, [refetch])

  return { ...state, refetch }
}

export function useLondonClock() {
  const [clock, setClock] = useState(() => clockOf(new Date()))
  useEffect(() => {
    const timer = window.setInterval(() => setClock(clockOf(new Date())), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  return clock
}
