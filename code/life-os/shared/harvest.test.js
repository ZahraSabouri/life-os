import test from 'node:test'
import assert from 'node:assert/strict'
import { placeOf, dayLine, canonicalUrl, junkLink, gmailLink, outlookLink, originalLink, chatty, fitsArea, itemDate } from './harvest.js'

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
  assert.equal(fitsArea('bill', 'money'), false)
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
