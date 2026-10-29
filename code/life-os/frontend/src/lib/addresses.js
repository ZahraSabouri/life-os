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

// The address and its layers as they are this moment (the router keeps its own state under "usr").
function current() {
  const state = window.history.state?.usr ?? {}
  return { search: window.location.search, state, layers: Array.isArray(state.layers) ? state.layers : [] }
}

export function useAddress() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const layers = useMemo(() => (Array.isArray(location.state?.layers) ? location.state.layers : []), [location.state])

  // Changes start from the address as the window has it now, not as the page last drew it: two
  // things done in one click (a panel closing as a day opens) must not undo each other. The part
  // after # is the window's too: a framed app writes its own view there without the router knowing.
  const go = useCallback((changes, options = {}) => {
    const now = current()
    const search = changedSearch(now.search, changes)
    if (search === now.search) return
    navigate({ pathname: location.pathname, search, hash: window.location.hash }, { replace: Boolean(options.replace), state: { ...now.state, layers: nextLayers(now.layers, changes, options) } })
  }, [location.pathname, navigate])

  const close = useCallback((keys, also = []) => {
    const now = current()
    const steps = stepsToClose(new URLSearchParams(now.search), now.layers, keys)
    if (steps) navigate(-steps)
    else go(Object.fromEntries([...keys, ...also].map((key) => [key, null])), { replace: true })
  }, [navigate, go])

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

// A side panel or a menu, held by ?panel=<name>: one at a time on any page. Opening one is a step
// Back closes; opening another in its place changes it without a step of its own. A click
// elsewhere closes it in place (`{ inPlace: true }`), because that click may itself go somewhere
// and a step back at the same moment would undo it.
export function usePanel(name) {
  const address = useAddress()
  const shown = address.params.get('panel') ?? ''
  const setOpen = useCallback((want, { inPlace = false } = {}) => {
    const next = typeof want === 'function' ? want(shown === name) : want
    if (next) {
      if (shown === name) return
      if (shown) address.swap({ panel: name })
      else address.open('panel', { panel: name })
    } else if (shown === name) {
      if (inPlace) address.swap({ panel: null })
      else address.close(['panel'])
    }
  }, [address, shown, name])
  return [shown === name, setOpen]
}
