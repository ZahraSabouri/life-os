// Each page keeps what it shows in its address: the month, a view, a filter, an open pop-up.
// Back then returns to what was there before, a reload keeps it, and a link can open any of it.
//
// A pop-up opened from the page is a step of its own, remembered as a "layer" with the address,
// so Back closes it and closing it is the same as Back. A pop-up that came with a link (or a
// reload) has no step to go back to, so closing it takes it out of the address instead.
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// The search part of an address with `changes` made: a value of null, '' or false takes the key out.
export function changedSearch(search, changes) {
  const params = new URLSearchParams(search)
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue
    if (value === null || value === '' || value === false) params.delete(key)
    else params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

// The layers after a change. Opening adds one (a step in history); any other step forgets them;
// a change in place keeps them, and a layer it takes out of the address stays as a blank, because
// its step is still in history and Back still has to pass it.
export function nextLayers(layers, changes, { replace = false, layer = '' } = {}) {
  if (layer) return [...layers, layer]
  if (!replace) return []
  return layers.map((name) => (name && Object.hasOwn(changes, name) && (changes[name] === null || changes[name] === '' || changes[name] === false) ? '' : name))
}

// How many steps Back closes the pop-ups held by `keys`, or 0 when one of them was not opened
// here (it came with the address) and so must be taken out of it.
export function stepsToClose(params, layers, keys) {
  const open = keys.filter((key) => params.has(key))
  if (!open.length || !open.every((key) => layers.includes(key))) return 0
  return layers.length - Math.min(...open.map((key) => layers.lastIndexOf(key)))
}

export function useAddress() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const layers = useMemo(() => (Array.isArray(location.state?.layers) ? location.state.layers : []), [location.state])

  const go = useCallback((changes, options = {}) => {
    const search = changedSearch(location.search, changes)
    if (search === location.search) return
    navigate({ pathname: location.pathname, search, hash: location.hash }, { replace: Boolean(options.replace), state: { ...(location.state ?? {}), layers: nextLayers(layers, changes, options) } })
  }, [location.pathname, location.search, location.hash, location.state, layers, navigate])

  const close = useCallback((keys, also = []) => {
    const steps = stepsToClose(params, layers, keys)
    if (steps) navigate(-steps)
    else go(Object.fromEntries([...keys, ...also].map((key) => [key, null])), { replace: true })
  }, [params, layers, navigate, go])

  return useMemo(() => ({
    params,
    layers,
    // Another state of the page, as a step Back returns from (a month, a view).
    show: (changes) => go(changes),
    // A change without a step of its own (a filter, the search, another day inside an open pop-up).
    swap: (changes) => go(changes, { replace: true }),
    // Opens the pop-up held by `layer` (the key that names it in the address).
    open: (layer, changes) => go(changes, { layer }),
    // Closes the pop-ups held by `keys`; `also` names keys that go with them (a tab inside one).
    close,
  }), [params, layers, go, close])
}
