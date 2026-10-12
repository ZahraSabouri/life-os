// What Life OS remembers for the whole app (her targets, notices seen, sound links), kept in
// the core under a short key. A value is read once and shared by every part of the page that
// asks for it; a change shows everywhere at once and is saved behind it.
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'

const values = new Map()      // key -> value, once read
const reading = new Map()     // key -> the read in progress
const watchers = new Map()    // key -> who to tell

function tell(key) { for (const watcher of watchers.get(key) ?? []) watcher(values.get(key)) }

export function loadSetting(key) {
  if (values.has(key)) return Promise.resolve(values.get(key))
  if (!reading.has(key)) {
    reading.set(key, apiFetch(`/api/settings/${encodeURIComponent(key)}`)
      .then((answer) => { values.set(key, answer.value ?? null); tell(key); return values.get(key) })
      .catch(() => { reading.delete(key); return null }))
  }
  return reading.get(key)
}

export function saveSetting(key, value) {
  values.set(key, value)
  tell(key)
  return apiFetch(`/api/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) }).catch(() => { /* kept for this visit; saved on the next change */ })
}

// [value, set, loaded]. `value` is `fallback` until the setting has been read, and when nothing is kept.
export function useSetting(key, fallback = null) {
  const [state, setState] = useState(() => ({ value: values.has(key) ? values.get(key) : undefined, loaded: values.has(key) }))
  useEffect(() => {
    let off = false
    const watcher = (value) => { if (!off) setState({ value, loaded: true }) }
    if (!watchers.has(key)) watchers.set(key, new Set())
    watchers.get(key).add(watcher)
    loadSetting(key).then((value) => { if (!off) setState({ value, loaded: true }) })
    return () => { off = true; watchers.get(key)?.delete(watcher) }
  }, [key])
  const set = useCallback((next) => saveSetting(key, typeof next === 'function' ? next(values.get(key) ?? fallback) : next), [key, fallback])
  return [state.value ?? fallback, set, state.loaded]
}
