import test from 'node:test'
import assert from 'node:assert/strict'
import { mailNotices, mapMail } from './notices.mjs'

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
  assert.equal(byId['mail:f:late'].detail, 'Was due 2026-10-20 · Email')
  assert.equal(byId['mail:announcements:batch-1'].title, '2 new announcements')
  assert.ok(!notices.some((notice) => notice.id.startsWith('mail:e:') || notice.id.startsWith('mail:g:')))
  assert.ok(notices.every((notice) => notice.href.startsWith('/inbox')))
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
  assert.ok(items.every((item) => item.all_day && item.href === '/inbox' && item.meta.readonly))
})
