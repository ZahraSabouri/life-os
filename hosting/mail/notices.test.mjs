import test from 'node:test'
import assert from 'node:assert/strict'
import { mailNotices, mapMail, mapHarvest } from './notices.mjs'

const today = '2026-10-28'
const rows = [
  { id: 'a', kind: 'do', status: 'open', priority: 'normal', due: '2026-10-28', title: 'Fill in the form', origin: 'gathered', area: 'admin' },
  { id: 'b', kind: 'reply', status: 'open', priority: 'high', since: '2026-10-24T10:00:00Z', title: 'Reply to Jo', person_name: 'Jo Evans', origin: 'gathered', area: 'admin' },
  { id: 'c', kind: 'read', status: 'open', priority: 'high', due: '2026-10-29', title: 'Read the brief', origin: 'gathered', area: 'admin' },
  { id: 'd', kind: 'text', status: 'open', priority: 'urgent', title: 'Text Sam', her_title: 'Text Sam about 3pm', origin: 'hers', area: 'relationships' },
  { id: 'e', kind: 'call', status: 'snoozed', snoozed_until: '2026-11-02', priority: 'urgent', title: 'Call the GP', origin: 'hers', area: 'relationships', due: '2026-11-02' },
  { id: 'f', kind: 'email', status: 'open', priority: 'normal', due: '2026-10-20', title: 'Email the office', origin: 'hers', area: 'admin' },
  { id: 'g', kind: 'reply', status: 'open', priority: 'normal', since: '2026-10-27T10:00:00Z', title: 'Reply to Sam', origin: 'gathered', area: 'admin' },
  { id: 'h', kind: 'do', status: 'done', priority: 'normal', due: '2026-10-29', title: 'Done already', origin: 'gathered', area: 'admin' },
]

test('mailNotices: today, late, ahead, and the announcements once per batch', () => {
  const notices = mailNotices({ actions: rows.filter((row) => row.status !== 'done'), announcements: 2, batchId: 'batch-1' }, today)
  const byId = Object.fromEntries(notices.map((notice) => [notice.id, notice]))
  assert.equal(byId['mail:a:today'].detail, 'Due today · Do')
  assert.equal(byId['mail:b:late'].detail, 'Waiting 4 days · Jo Evans · Reply')
  assert.equal(byId['mail:c:ahead'].level, 'ahead')
  assert.equal(byId['mail:d:today'].title, 'Text Sam about 3pm')
  // More than a week past its day: gathered into one line that leads to Tasks, the same line tomorrow.
  assert.ok(!byId['mail:f:late'])
  const older = notices.find((notice) => notice.id.startsWith('mail:older:'))
  assert.equal(older.title, '1 thing waiting on you is more than a week past its day')
  assert.equal(older.href, '/tasks?from=mail')
  assert.equal(mailNotices({ actions: rows.filter((row) => row.status !== 'done') }, '2026-10-29').find((notice) => notice.id.startsWith('mail:older:')).id, older.id)
  assert.deepEqual(byId['mail:a:today'].action, { kind: 'mail', id: 'a', revision: null })
  assert.equal(byId['mail:announcements:batch-1'].title, '2 new announcements')
  assert.ok(!notices.some((notice) => notice.id.startsWith('mail:e:') || notice.id.startsWith('mail:g:')))
  assert.ok(notices.filter((notice) => !notice.id.startsWith('mail:older:')).every((notice) => notice.href.startsWith('/inbox')))
  assert.deepEqual(mailNotices({ actions: [], announcements: 0, batchId: 'x' }, today), [])
})

test('mapMail: a deadline when the mail gave the day, a reminder for hers, done shown done', () => {
  const items = mapMail(rows)
  const byId = Object.fromEntries(items.map((item) => [item.id, item]))
  assert.equal(byId['admin:mail:a'].kind, 'deadline')
  assert.equal(byId['admin:mail:e'].kind, 'reminder')
  assert.equal(byId['admin:mail:e'].start, '2026-11-02')
  assert.equal(byId['admin:mail:e'].area, 'relationships')
  assert.equal(byId['admin:mail:h'].meta.done, true)
  assert.ok(!byId['admin:mail:b'] && !byId['admin:mail:d'], 'no day, no calendar item')
  assert.ok(items.every((item) => item.all_day && item.href === '/inbox/waiting' && item.meta.readonly))
})

test('mapHarvest: dated announcements, materials, notes and opportunities; never events, vacancies or offers', () => {
  const stored = [
    { id: 'i1', area: 'academic', kind: 'announcement', title: 'Lab moves to Room 0.12', summary: 'Thursday 14:00.', day: '2026-10-30', start_at: '2026-11-05T14:00:00+00:00', end_at: '2026-11-05T16:00:00+00:00', location: 'Room 0.12' },
    { id: 'i2', area: 'academic', kind: 'material', title: 'Coursework 2 brief', summary: 'Due 4 December.', day: '2026-10-30', deadline: '2026-12-04' },
    { id: 'i3', area: 'academic', kind: 'opportunity', title: 'Hackathon', summary: 'Applications close 20 November.', day: '2026-11-01', deadline: '2026-11-20', url: 'https://example.com/h' },
    { id: 'i4', area: 'health', kind: 'info', title: 'Flu clinic', summary: 'Drop in.', day: '2026-11-01', start_day: '2026-11-10' },
    { id: 'i5', area: 'jobs', kind: 'vacancy', title: 'Analyst', summary: 'Riverford.', day: '2026-10-31', deadline: '2026-11-07' },
    { id: 'i6', area: 'events', kind: 'event', title: 'Board games', summary: 'Free.', day: '2026-11-01', start_at: '2026-11-04T18:30:00+00:00' },
    { id: 'i7', area: 'perks', kind: 'offer', title: '20% off', summary: 'Books.', day: '2026-10-31', deadline: '2026-11-04' },
    { id: 'i8', area: 'academic', kind: 'announcement', title: 'Undated', summary: 'No day.', day: '2026-10-31' },
  ]
  const items = mapHarvest(stored)
  assert.deepEqual(items.map((item) => item.id), ['came-in:i1', 'came-in:i2', 'came-in:i3', 'came-in:i4'])
  assert.deepEqual(items.map((item) => [item.area, item.kind, item.all_day]), [['study', 'fixed', false], ['study', 'deadline', true], ['study', 'deadline', true], ['body', 'note', true]])
  assert.equal(items[0].end, '2026-11-05T16:00:00+00:00')
  assert.equal(items[0].location, 'Room 0.12')
  assert.equal(items[1].start, '2026-12-04')
  assert.equal(items[0].href, '/inbox/log?day=2026-10-30&item=i1')
  assert.equal(items[2].meta.url, 'https://example.com/h')
  assert.ok(items.every((item) => item.meta.readonly && item.meta.cameIn))
})
