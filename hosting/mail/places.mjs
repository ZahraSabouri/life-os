// Where a harvested vacancy or event is now: found in JobMap's jobs or the Events page's events by
// its own page's address (shared/harvest.js canonicalUrl), read only, through the loaders the
// calendar uses. Life OS never puts them there itself: the agents queue vacancies through
// jobmap/queue-jobs.mjs and hand events to the Events research (mail/HARVEST.md). So a place
// is what is really there: { app, href } when found, { app, missing } when not yet, and
// { app, unknown } when the part could not be read.
import { canonicalUrl } from '../../code/life-os/shared/harvest.js'
import { eventHref } from '../calendar/mappers.mjs'

const index = (rows, address, place) => new Map((rows ?? []).flatMap((row) => {
  const key = canonicalUrl(address(row))
  return key ? [[key, place(row)]] : []
}))

// An application email rarely carries the advert's address, so an application is also found by its
// employer and role: the same employer, and one role's words containing the other's.
const words = (value) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const roleOf = (title, employer) => words(String(title ?? '').split(/,| at /i)[0]).replace(words(employer), '').trim()
function byEmployer(jobs, item) {
  const employer = words(item.details?.employer)
  const role = roleOf(item.title, item.details?.employer)
  if (!employer || !role) return null
  const found = (jobs ?? []).filter((job) => words(job.company) === employer && (words(job.role).includes(role) || role.includes(words(job.role))))
  return found.length === 1 ? found[0] : null
}

export function createPlaces({ loadCareer, loadEvents }) {
  const read = (load, pick) => Promise.resolve().then(load).then(pick).catch(() => null)
  return async function placeItems(items = []) {
    const wants = (...kinds) => items.some((item) => kinds.includes(item.kind))
    const [jobs, events] = await Promise.all([
      wants('vacancy', 'application') ? read(loadCareer, (value) => (Array.isArray(value) ? value : value?.jobs ?? [])) : [],
      wants('event') ? read(loadEvents, (value) => (Array.isArray(value) ? value : value?.events ?? [])) : [],
    ])
    const jobPlace = (job) => ({ app: 'jobmap', href: `/jobmap#job=${encodeURIComponent(job.id)}`, id: job.id, status: job.status ?? null })
    const jobAt = index(jobs, (job) => job.url, jobPlace)
    const parts = {
      vacancy: ['jobmap', jobs, (item) => item.canonical_url && jobAt.get(item.canonical_url)],
      application: ['jobmap', jobs, (item) => (item.canonical_url && jobAt.get(item.canonical_url)) || (byEmployer(jobs, item) && jobPlace(byEmployer(jobs, item)))],
      event: ['events', events, ((at) => (item) => item.canonical_url && at.get(item.canonical_url))(index(events, (event) => event.source_url ?? event.url, (event) => ({ app: 'events', href: eventHref(event.event_id), status: event.status ?? null })))],
    }
    return items.map((item) => {
      const part = parts[item.kind]
      if (!part) return item
      const [app, rows, find] = part
      if (rows === null) return { ...item, place: { app, unknown: true } }
      return { ...item, place: find(item) || { app, missing: true } }
    })
  }
}
