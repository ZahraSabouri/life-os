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
  assert.deepEqual(found.place, { app: 'jobmap', href: '/jobmap#job=JOB-7', status: 'To review' })
  assert.deepEqual(missing.place, { app: 'jobmap', missing: true })
  assert.equal(other.place, undefined)
})

test('an event whose page is in Cardiff Life links to that event', async () => {
  const place = createPlaces({ loadCareer: async () => [], loadEvents: async () => [{ event_id: 'su-501', source_url: 'https://su.example.ac.uk/events/501/', status: 'upcoming' }] })
  const [found, missing] = await place([event('i9', 'https://su.example.ac.uk/events/501'), event('i10', 'https://su.example.ac.uk/events/777')])
  assert.deepEqual(found.place, { app: 'cardiff-life', href: '/cardiff-life#event=su-501', status: 'upcoming' })
  assert.deepEqual(missing.place, { app: 'cardiff-life', missing: true })
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
