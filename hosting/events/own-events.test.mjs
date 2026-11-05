import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanOwnEvent, createOwnEvents, OwnEventError } from './own-events.mjs'
import { mapEvents } from '../calendar/mappers.mjs'

test('an event she types becomes a row like the researched ones', () => {
  const event = cleanOwnEvent({ name: '  Picnic in Bute Park ', date: '2026-10-17', start_time: '13:00', end_time: '15:30', location: 'Bute Park', activity: 'social', cost: 'Free', description: 'With Ben', source_url: 'https://example.org/picnic' })
  assert.match(event.event_id, /^own-[a-z0-9]+$/)
  assert.deepEqual({ ...event, event_id: 'x' }, {
    event_id: 'x', name: 'Picnic in Bute Park', date: '2026-10-17', start_time: '13:00', end_time: '15:30', location: 'Bute Park', activity: 'social',
    organiser: 'Added by you', cost: 'Free', description: 'With Ben', source_url: 'https://example.org/picnic', status: 'upcoming', own: true,
    category: '', booking_required: '', experience: '', recurring: '', last_checked: '',
  })
  // Only a name is needed; an unknown category falls back; a date can be left open.
  assert.deepEqual([cleanOwnEvent({ name: 'Sometime' }).date, cleanOwnEvent({ name: 'x', activity: 'nonsense' }).activity], ['', 'social'])
})

test('what cannot be an event is refused with a plain reason', () => {
  const refused = (input, words) => assert.throws(() => cleanOwnEvent(input), (error) => error instanceof OwnEventError && error.status === 400 && words.test(error.message))
  refused({ name: '  ' }, /name/)
  refused({ name: 'x', date: '2026-02-30' }, /date/)
  refused({ name: 'x', start_time: '25:00' }, /start time/)
  refused({ name: 'x', end_time: '20:00' }, /start time as well/)
  refused({ name: 'x', source_url: 'javascript:alert(1)' }, /link/)
  refused(null, /name/)
})

test('events are kept, changed and removed, and the calendar reads them like any researched event', async () => {
  let kept = null
  // Kept in the database, so reading and writing take a moment.
  const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 2))
  const events = createOwnEvents({ read: () => later(kept), write: async (list) => { await later(); kept = list } })
  assert.deepEqual(await events.list(), [])
  // Two added at the same moment are both kept.
  const [picnic, talk] = await Promise.all([
    events.add({ name: 'Picnic', date: '2026-10-17', start_time: '13:00', end_time: '15:00', location: 'Bute Park' }),
    events.add({ name: 'A talk', date: '2026-10-20' }),
  ])
  assert.deepEqual((await events.list()).map((row) => row.name), ['Picnic', 'A talk'])
  const moved = await events.change(picnic.event_id, { name: 'Picnic with Ben', date: '2026-10-18', start_time: '12:00' })
  assert.deepEqual([moved.event_id, moved.name, moved.date, moved.start_time, moved.end_time], [picnic.event_id, 'Picnic with Ben', '2026-10-18', '12:00', ''])
  await events.remove(talk.event_id)
  assert.deepEqual((await events.list()).map((row) => row.name), ['Picnic with Ben'])
  await assert.rejects(events.remove('own-nothing'), (error) => error.status === 404)
  await assert.rejects(events.change('own-nothing', { name: 'x' }), (error) => error.status === 404)
  // A refused change does not stop the next one.
  await events.add({ name: 'After a refusal' })
  // On the calendar, at London time, as an event that leads to the Events page.
  const [item] = mapEvents(await events.list(), { from: '2026-10-12', to: '2026-10-25' })
  assert.deepEqual([item.area, item.title, item.start, item.all_day], ['events', 'Picnic with Ben', '2026-10-18T11:00:00.000Z', false])
})
