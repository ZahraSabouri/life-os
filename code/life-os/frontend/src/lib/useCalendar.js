import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { CARDIFF_CHOICES_KEY, dateKey, readCardiffChoices, withSavedCardiffItems } from './calendar.js'

export function useLondonToday() {
  const [today, setToday] = useState(() => dateKey(new Date()))
  useEffect(() => {
    const update = () => setToday(dateKey(new Date()))
    const timer = window.setInterval(update, 60_000)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  return today
}

export function useCalendar(from, to) {
  const [items, setItems] = useState([])
  const [sources, setSources] = useState([])
  const [knownEventIds, setKnownEventIds] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [browserChoices, setBrowserChoices] = useState(() => readCardiffChoices(() => window.localStorage))
  const [refresh, setRefresh] = useState(0)
  const refetch = useCallback(() => setRefresh(value => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setItems([])
    setSources([])
    setKnownEventIds(null)
    apiFetch(`/api/calendar?${new URLSearchParams({ from, to })}`, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return
        setItems(Array.isArray(data.items) ? data.items : [])
        setSources(Array.isArray(data.sources) ? data.sources : [])
        setKnownEventIds(Array.isArray(data.knownEventIds) ? data.knownEventIds : null)
      })
      .catch(fetchError => {
        if (!controller.signal.aborted) setError(fetchError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [from, to, refresh])

  useEffect(() => {
    const readChoices = () => setBrowserChoices(readCardiffChoices(() => window.localStorage))
    const onStorage = event => {
      if (!event.key || event.key === CARDIFF_CHOICES_KEY) readChoices()
    }
    const onFocus = () => { readChoices(); refetch() }
    const onVisibility = () => { if (document.visibilityState === 'visible') onFocus() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refetch])

  return { items: withSavedCardiffItems(items, browserChoices.choices, from, to, knownEventIds), sources, loading, error, refetch, choices: browserChoices.choices, choicesError: browserChoices.error }
}
