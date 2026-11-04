import test from 'node:test'
import assert from 'node:assert/strict'
import { placeOf, partOf, dayLine, canonicalUrl, junkLink, gmailLink, outlookLink, originalLink, chatty, fitsArea, itemDate } from './harvest.js'

test('placeOf: events through Cardiff Life, vacancies through JobMap, offers on the Offers list', () => {
  assert.deepEqual(placeOf({ kind: 'event', start: '2026-11-05T18:00:00Z' }, '2026-11-03'), { calendar: false, linkTo: 'cardiff-life', offers: false, today: false })
  assert.deepEqual(placeOf({ kind: 'vacancy', deadline: '2026-11-20' }, '2026-11-03'), { calendar: false, linkTo: 'jobmap', offers: false, today: false })
  assert.equal(placeOf({ kind: 'offer', deadline: '2026-11-30' }, '2026-11-03').offers, true)
})

test('placeOf: dated announcements, materials, notes and opportunities go on the calendar; undated ones do not', () => {
  assert.equal(placeOf({ kind: 'announcement', start: '2026-11-10' }).calendar, true)
  assert.equal(placeOf({ kind: 'material', deadline: '2026-11-12' }).calendar, true)
  assert.equal(placeOf({ kind: 'opportunity', deadline: '2026-12-01' }).calendar, true)
  assert.equal(placeOf({ kind: 'info', start_at: '2026-11-04T09:00:00Z' }).calendar, true)
  assert.equal(placeOf({ kind: 'announcement' }).calendar, false)
  assert.equal(placeOf({ kind: 'offer', deadline: '2026-11-12' }).calendar, false)
})

test('placeOf: Today gets vacancies closing within a week and offers in their last two days', () => {
  const today = '2026-11-03'
  assert.equal(placeOf({ kind: 'vacancy', deadline: '2026-11-09' }, today).today, true)
  assert.equal(placeOf({ kind: 'vacancy', deadline: '2026-11-10' }, today).today, false)
  assert.equal(placeOf({ kind: 'vacancy', deadline: '2026-11-02' }, today).today, false)
  assert.equal(placeOf({ kind: 'opportunity', deadline: '2026-11-03' }, today).today, true)
  assert.equal(placeOf({ kind: 'offer', deadline: '2026-11-04' }, today).today, true)
  assert.equal(placeOf({ kind: 'offer', deadline: '2026-11-05' }, today).today, false)
  assert.equal(placeOf({ kind: 'announcement', deadline: '2026-11-03' }, today).today, false)
})

test('itemDate: the start, else the deadline', () => {
  assert.equal(itemDate({ start: '2026-11-10T09:00:00Z', deadline: '2026-11-20' }), '2026-11-10')
  assert.equal(itemDate({ deadline: '2026-11-20' }), '2026-11-20')
  assert.equal(itemDate({}), '')
})

test('fitsArea: a vacancy is jobs or research, a material is academic, an event can be anywhere', () => {
  assert.equal(fitsArea('vacancy', 'research'), true)
  assert.equal(fitsArea('vacancy', 'events'), false)
  assert.equal(fitsArea('material', 'jobs'), false)
  assert.equal(fitsArea('event', 'academic'), true)
  assert.equal(fitsArea('bill', 'money'), true)
  assert.equal(fitsArea('booking', 'jobs'), false)
  assert.equal(fitsArea('gadget', 'money'), false)
})

test('dayLine: a factual count, in a fixed order, never advice', () => {
  assert.equal(dayLine({ messages: 12, actions: 2, kinds: { event: 1, vacancy: 3 } }), '12 messages, 2 to do, 3 vacancies, 1 event')
  assert.equal(dayLine({ messages: 1, kinds: { info: 2, offer: 1 } }), '1 message, 1 offer, 2 notes')
  assert.equal(dayLine({}), 'Nothing came in.')
})

test('canonicalUrl: the same advert found twice is one address', () => {
  assert.equal(canonicalUrl('https://WWW.Example.com/jobs/42/?utm_source=x&b=2&a=1#apply'), 'https://example.com/jobs/42?a=1&b=2')
  assert.equal(canonicalUrl('https://example.com/e/7?fbclid=abc'), canonicalUrl('https://example.com/e/7'))
  assert.equal(canonicalUrl('not a link'), '')
})

test('junkLink: wrappers, sign-ins, unsubscribes and tracking are not destinations', () => {
  assert.match(junkLink('https://eur02.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com'), /safe-link/)
  assert.match(junkLink('https://www.google.com/url?q=https://example.com'), /redirect/)
  assert.match(junkLink('https://login.microsoftonline.com/common'), /sign-in/)
  assert.match(junkLink('https://example.com/unsubscribe?id=1'), /unsubscribe/)
  assert.match(junkLink('https://click.mail.example.com/c/abc'), /tracking/)
  assert.match(junkLink('http://example.com'), /https/)
  assert.equal(junkLink('https://www.cardiffstudents.com/events/11041/43269/'), '')
  assert.equal(junkLink('https://www.linkedin.com/jobs/view/123'), '')
})

test('originalLink: Gmail from its id and her account; Outlook only with the message address; otherwise nothing', () => {
  assert.equal(gmailLink('18C2F0A1B2C3D4E5', 1), 'https://mail.google.com/mail/u/1/#all/18c2f0a1b2c3d4e5')
  assert.equal(gmailLink('18c2f0a1b2c3d4e5', 'x'), 'https://mail.google.com/mail/u/1/#all/18c2f0a1b2c3d4e5')
  assert.equal(gmailLink('g:abc'), null)
  assert.equal(originalLink({ source_kind: 'gmail', source_message_id: '18c2f0a1b2c3d4e5', link: 'https://mail.google.com/mail/u/0/#inbox/x' }, { gmailAccount: 1 }), 'https://mail.google.com/mail/u/1/#all/18c2f0a1b2c3d4e5')
  const opened = 'https://outlook.office.com/mail/inbox/id/AAQkADAwATM0MDAAMS1hZWYwLWE2ODYALTAwAi0wMAoAEAAx%2FzRf'
  assert.equal(outlookLink(opened), opened)
  assert.equal(originalLink({ source_kind: 'outlook', link: 'https://outlook.office.com/mail/' }), null)
  assert.equal(originalLink({ source_kind: 'learning-central', link: 'https://learningcentral.cf.ac.uk/ultra/courses/_1_1/outline' }), 'https://learningcentral.cf.ac.uk/ultra/courses/_1_1/outline')
  assert.equal(originalLink({ source_kind: 'teams', link: 'javascript:alert(1)' }), null)
})

test('chatty: a summary that talks to her is caught; a record is not', () => {
  assert.equal(chatty('You should apply before Friday.'), true)
  assert.equal(chatty('Worth a look if you like hiking.'), true)
  assert.equal(chatty('I recommend booking early.'), true)
  assert.equal(chatty('Graduate data analyst role, Cardiff, closes 20 November.'), false)
  assert.equal(chatty('Week 7 lab moved to Room 0.12.'), false)
})

test('partOf: offers to Budget, vacancies and job opportunities to JobMap, events to Cardiff Life, the rest by area', () => {
  assert.equal(partOf({ kind: 'offer', area: 'health' }), 'budget')
  assert.equal(partOf({ kind: 'vacancy', area: 'research' }), 'jobmap')
  assert.equal(partOf({ kind: 'opportunity', area: 'jobs' }), 'jobmap')
  assert.equal(partOf({ kind: 'opportunity', area: 'academic' }), 'study')
  assert.equal(partOf({ kind: 'event', area: 'academic' }), 'cardiff-life')
  assert.equal(partOf({ kind: 'material', area: 'academic' }), 'study')
  assert.equal(partOf({ kind: 'info', area: 'health' }), 'health')
  assert.equal(partOf({ kind: 'info', area: 'money' }), 'budget')
  assert.equal(partOf({ kind: 'announcement', area: 'admin' }), null)
})

test('domainOf: the kind decides when it can, else the area; her choice and a taught sender win', async () => {
  const { domainOf } = await import('./harvest.js')
  assert.equal(domainOf({ kind: 'order', area: 'money' }), 'home')
  assert.equal(domainOf({ kind: 'application', area: 'jobs' }), 'work')
  assert.equal(domainOf({ kind: 'booking', area: 'travel' }), 'travel')
  assert.equal(domainOf({ kind: 'opportunity', area: 'academic' }), 'learning')
  assert.equal(domainOf({ kind: 'event', area: 'events' }), 'social')
  assert.equal(domainOf({ kind: 'info', area: 'health' }), 'health')
  assert.equal(domainOf({ kind: 'order', area: 'home', her_domain: 'money' }), 'money')
  assert.equal(domainOf({ kind: 'info', area: 'admin' }, { senderDomain: 'learning' }), 'learning')
  assert.equal(domainOf({ kind: 'info', area: 'admin', her_domain: 'nowhere' }), 'admin')
})

test('guessDomain: a guess from words, marked as one; a taught sender is not a guess', async () => {
  const { guessDomain } = await import('./harvest.js')
  assert.deepEqual(guessDomain({ subject: 'Your order has been dispatched' }), { domain: 'home', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Interview invitation: Data Analyst' }), { domain: 'work', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Thank you for your application to our events team' }), { domain: 'work', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Booking confirmed: train to London' }), { domain: 'travel', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Week 7 lecture slides' }), { domain: 'learning', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Hello' }), { domain: '', guessed: true })
  assert.deepEqual(guessDomain({ subject: 'Hello' }, { senderDomain: 'social' }), { domain: 'social', guessed: false })
})

test('states: each moving kind has its own; fitsState and stateName', async () => {
  const { STATES, fitsState, stateName } = await import('./harvest.js')
  assert.ok(STATES.order.includes('out-for-delivery') && STATES.application.includes('unsuccessful'))
  assert.equal(fitsState('order', 'delivered'), true)
  assert.equal(fitsState('order', 'interview'), false)
  assert.equal(fitsState('person', 'active'), false)
  assert.equal(stateName('out-for-delivery'), 'Out for delivery')
})

test('placeOf: the new kinds on the calendar and Today by their dates; never twice; never when over', () => {
  const today = '2026-11-03'
  assert.deepEqual(placeOf({ kind: 'order', state: 'dispatched', start: '2026-11-04', deadline: '2026-12-01' }, today), { calendar: true, linkTo: null, offers: false, today: true })
  assert.equal(placeOf({ kind: 'order', state: 'delivered', start: '2026-11-04' }, today).today, false)
  assert.equal(placeOf({ kind: 'bill', deadline: '2026-11-05' }, today).today, true)
  assert.equal(placeOf({ kind: 'bill', deadline: '2026-11-06' }, today).today, false)
  assert.equal(placeOf({ kind: 'booking', start: '2026-11-21T08:05:00Z' }, today).calendar, true)
  assert.equal(placeOf({ kind: 'booking', state: 'cancelled', start: '2026-11-21T08:05:00Z' }, today).calendar, false)
  assert.equal(placeOf({ kind: 'application', deadline: '2026-11-07', action_ids: ['a1'] }, today).calendar, false, 'its action is on the calendar already')
  assert.equal(placeOf({ kind: 'application', state: 'test' }, today).linkTo, 'jobmap')
  assert.equal(placeOf({ kind: 'account' }, today).calendar, false)
  assert.equal(placeOf({ kind: 'person' }, today).today, false)
})

test('partOf: applications to JobMap; bills, orders and tenancy to Budget; people, bookings and official letters to the Desk only', () => {
  assert.equal(partOf({ kind: 'application', area: 'jobs' }), 'jobmap')
  assert.equal(partOf({ kind: 'bill', area: 'money' }), 'budget')
  assert.equal(partOf({ kind: 'order', area: 'home' }), 'budget')
  assert.equal(partOf({ kind: 'tenancy', area: 'home' }), 'budget')
  assert.equal(partOf({ kind: 'appointment', area: 'health' }), 'health')
  assert.equal(partOf({ kind: 'person', area: 'people' }), null)
  assert.equal(partOf({ kind: 'booking', area: 'travel' }), null)
  assert.equal(partOf({ kind: 'official', area: 'admin' }), null)
})

test('jobmapSuggestion: offered only when JobMap knows the job and says something else', async () => {
  const { jobmapSuggestion } = await import('./harvest.js')
  const placed = (state, status) => ({ kind: 'application', state, place: { app: 'jobmap', id: 'NB-1', status } })
  assert.deepEqual(jobmapSuggestion(placed('unsuccessful', 'Applied')), { job: 'NB-1', status: 'Rejected', from: 'Applied' })
  assert.deepEqual(jobmapSuggestion(placed('interview', 'Applied')), { job: 'NB-1', status: 'Interview', from: 'Applied' })
  assert.equal(jobmapSuggestion(placed('test', 'Applied')), null, 'a test is still Applied in JobMap')
  assert.equal(jobmapSuggestion(placed('unsuccessful', 'Rejected')), null)
  assert.equal(jobmapSuggestion({ kind: 'application', state: 'unsuccessful', place: { app: 'jobmap', missing: true } }), null)
  assert.equal(jobmapSuggestion({ kind: 'order', state: 'delivered', place: { id: 'x', status: 'y' } }), null)
})
