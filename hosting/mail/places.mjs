// Where a harvested vacancy or event is now: found in JobMap's jobs or Cardiff Life's events by
// its own page's address (shared/harvest.js canonicalUrl), read only, through the loaders the
// calendar uses. Life OS never puts them there itself: the agents queue vacancies through
// jobmap/queue-jobs.mjs and hand events to Cardiff Life's workflow (mail/HARVEST.md). So a place
// is what is really there: { app, href } when found, { app, missing } when not yet, and
// { app, unknown } when the part could not be read.
import { canonicalUrl } from '../../code/life-os/shared/harvest.js'
import { cardiffEventHref } from '../calendar/mappers.mjs'

const index = (rows, address, place) => new Map((rows ?? []).flatMap((row) => {
  const key = canonicalUrl(address(row))
  return key ? [[key, place(row)]] : []
}))

export function createPlaces({ loadCareer, loadEvents }) {
  const read = (load, pick) => Promise.resolve().then(load).then(pick).catch(() => null)
  return async function placeItems(items = []) {
    const wants = (kind) => items.some((item) => item.kind === kind)
    const [jobs, events] = await Promise.all([
      wants('vacancy') ? read(loadCareer, (value) => (Array.isArray(value) ? value : value?.jobs ?? [])) : [],
      wants('event') ? read(loadEvents, (value) => (Array.isArray(value) ? value : value?.events ?? [])) : [],
    ])
    const parts = {
      vacancy: ['jobmap', jobs, index(jobs, (job) => job.url, (job) => ({ app: 'jobmap', href: `/jobmap#job=${encodeURIComponent(job.id)}`, status: job.status ?? null }))],
      event: ['cardiff-life', events, index(events, (event) => event.source_url ?? event.url, (event) => ({ app: 'cardiff-life', href: cardiffEventHref(event.event_id), status: event.status ?? null }))],
    }
    return items.map((item) => {
      const part = parts[item.kind]
      if (!part) return item
      const [app, rows, at] = part
      if (rows === null) return { ...item, place: { app, unknown: true } }
      return { ...item, place: (item.canonical_url && at.get(item.canonical_url)) || { app, missing: true } }
    })
  }
}
