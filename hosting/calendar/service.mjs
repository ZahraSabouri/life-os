import { isDateKey } from '../../code/life-os/shared/calendar.js'
import { mapEntries, mapPeople, mapStudy, mapCareer, mapBudget, mapHome, mapEvents } from './mappers.mjs'

function bounded(load, range, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Source read timed out')), timeoutMs)
    Promise.resolve().then(() => {
      if (typeof load !== 'function') throw new Error('Source is unavailable')
      return load(range)
    }).then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

function validateSource(id, value) {
  const object = row => row !== null && typeof row === 'object' && !Array.isArray(row)
  if (id === 'core' && (Array.isArray(value) || Array.isArray(value?.entries))) return
  if (id === 'people' && (Array.isArray(value) || Array.isArray(value?.people))) return
  if (id === 'career' && (Array.isArray(value) || Array.isArray(value?.jobs))) return
  if (id === 'events' && (Array.isArray(value) || Array.isArray(value?.events))) return
  if (id === 'study') {
    if (value === null) return // Summer Rescue's 204 means no saved state yet.
    const state = value?.state ?? value
    if (object(state) && (object(state.cards) || Array.isArray(state.cards) || Array.isArray(state.addedCards) || object(state.settings))) return
  }
  if (id === 'money' || id === 'home') {
    if (object(value) && value.state === null) return // Fresh planner, revision 0.
    const state = value?.state ?? value
    if (object(state) && ['subscriptions', 'lists', 'mealEntries'].every(key => state[key] == null || Array.isArray(state[key]))
      && ['subscriptions', 'lists', 'mealEntries', 'budgets'].some(key => Object.hasOwn(state, key))) return
  }
  throw new Error('Source returned an unsupported shape')
}

export function createCalendarService(options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1, Math.min(options.timeoutMs, 10000)) : 2500
  return async function calendar({ from, to } = {}) {
    if (!isDateKey(from) || !isDateKey(to) || from > to) {
      const error = new Error('Use a valid inclusive from and to date (YYYY-MM-DD)')
      error.status = 400
      throw error
    }
    if ((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 86400000 > 365) {
      const error = new Error('Choose a calendar range of at most 366 days')
      error.status = 400
      throw error
    }
    const range = { from, to }
    const budget = bounded(options.loadBudget, range, timeoutMs)
    const specs = [
      ['core', 'core', 'Life OS', options.loadEntries, mapEntries],
      ['people', 'relationships', 'People', options.loadPeople, mapPeople],
      ['study', 'study', 'Study', options.loadStudy, mapStudy],
      ['career', 'career', 'JobMap', options.loadCareer, mapCareer],
      ['money', 'money', 'Budget subscriptions', () => budget, mapBudget],
      ['home', 'home', 'Shopping and meals', () => budget, mapHome],
      ['events', 'events', 'Cardiff events', options.loadEvents, mapEvents],
    ]
    const results = await Promise.all(specs.map(async ([id, area, label, load, map]) => {
      try {
        const value = await bounded(load, range, timeoutMs)
        validateSource(id, value)
        const items = map(value, range)
        const knownEventIds = id === 'events' ? [...new Set((Array.isArray(value) ? value : value.events)
          .map(event => event?.event_id).filter(eventId => typeof eventId === 'string' && eventId.trim()))] : undefined
        return { items, knownEventIds, source: { id, area, label, status: 'ready', count: items.length } }
      } catch {
        // Do not expose filesystem paths, connection details or private raw
        // payloads from a failed adapter in the browser.
        return { items: [], source: { id, area, label, status: 'unavailable', count: 0, error: `${label} could not be read. Open its app to check it.` } }
      }
    }))
    const unique = new Map(results.flatMap(result => result.items).map(item => [item.id, item]))
    return { items: [...unique.values()].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)), sources: results.map(result => result.source), knownEventIds: results.find(result => result.source.id === 'events')?.knownEventIds ?? null }
  }
}
