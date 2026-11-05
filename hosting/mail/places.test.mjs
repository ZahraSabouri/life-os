// node --test hosting/mail/places.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlaces } from './places.mjs'
import { canonicalUrl } from '../../code/life-os/shared/harvest.js'

const vacancy = (id, url) => ({ id, kind: 'vacancy', area: 'jobs', url, canonical_url: canonicalUrl(url) })
const event = (id, url) => ({ id, kind: 'event', area: 'events', url, canonical_url: canonicalUrl(url) })

test('a vacancy whose advert is in JobMap links to that job; one that is not says so', async () => {
  const place = createPlaces({ loadCareer: async () => ({ jobs: [{ id: 'JOB-7', url: 'https://www.jobs.example.com/view/1001/', status: 'To review' }] }), loadEvents: async () => [] })
  const [found, missing, other] = await place([vacancy('i1', 'https://jobs.example.com/view/1001?utm_source=alert'), vacancy('i2', 'https://jobs.example.com/view/2002'), { id: 'i3', kind: 'announcement' }])
  assert.deepEqual(found.place, { app: 'jobmap', href: '/jobmap#job=JOB-7', id: 'JOB-7', status: 'To review' })
  assert.deepEqual(missing.place, { app: 'jobmap', missing: true })
  assert.equal(other.place, undefined)
})

test('an event whose page is on the Events page links to that event', async () => {
  const place = createPlaces({ loadCareer: async () => [], loadEvents: async () => [{ event_id: 'su-501', source_url: 'https://su.example.ac.uk/events/501/', status: 'upcoming' }] })
  const [found, missing] = await place([event('i9', 'https://su.example.ac.uk/events/501'), event('i10', 'https://su.example.ac.uk/events/777')])
  assert.deepEqual(found.place, { app: 'events', href: '/events#event=su-501', status: 'upcoming' })
  assert.deepEqual(missing.place, { app: 'events', missing: true })
})

test('a part that cannot be read is unknown, never "missing"; nothing is read when nothing needs it', async () => {
  let reads = 0
  const place = createPlaces({ loadCareer: async () => { reads += 1; throw new Error('JobMap is closed') }, loadEvents: async () => { reads += 1; return [] } })
  const [item] = await place([vacancy('i1', 'https://jobs.example.com/view/1001')])
  assert.deepEqual(item.place, { app: 'jobmap', unknown: true })
  assert.equal(reads, 1)
  await place([{ id: 'x', kind: 'offer' }])
  assert.equal(reads, 1)
})

test('an application is found in JobMap by its advert, else by the same employer and role; two candidates find none', async () => {
  const jobs = [
    { id: 'NB-1', company: 'Northbridge Analytics', role: 'Data Analyst Intern (Summer)', status: 'Applied', url: 'https://northbridge.example.com/careers/1' },
    { id: 'EX-2', company: 'Example Retail', role: 'Insight Analyst', status: 'Applied' },
    { id: 'EX-3', company: 'Example Retail', role: 'Senior Insight Analyst', status: 'To review' },
  ]
  const place = createPlaces({ loadCareer: async () => ({ jobs }), loadEvents: async () => [] })
  const application = (title, employer, url) => ({ id: title, kind: 'application', title, details: { employer }, url, canonical_url: url ? canonicalUrl(url) : null })
  const [byRole, byLink, twoMatch, none] = await place([
    application('Data Analyst Intern, Northbridge Analytics', 'Northbridge Analytics'),
    application('Graduate scheme', 'Somebody Else', 'https://northbridge.example.com/careers/1'),
    application('Insight Analyst, Example Retail', 'Example Retail'),
    application('Data Scientist, Nowhere Ltd', 'Nowhere Ltd'),
  ])
  assert.deepEqual(byRole.place, { app: 'jobmap', href: '/jobmap#job=NB-1', id: 'NB-1', status: 'Applied' })
  assert.equal(byLink.place.id, 'NB-1')
  assert.deepEqual(twoMatch.place, { app: 'jobmap', missing: true }, 'Insight Analyst is in both roles: not sure, so not found')
  assert.deepEqual(none.place, { app: 'jobmap', missing: true })
})
