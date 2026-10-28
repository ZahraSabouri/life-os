import test from 'node:test'
import assert from 'node:assert/strict'
import { parseOwe, peopleNamed, groupActions, birthdayWishes, textPieces, replyPrompt, priorityOf } from './mail.js'

test('parseOwe: the first word sets the kind, the rest names who and what about', () => {
  assert.deepEqual(parseOwe('text Sam about Saturday'), { kind: 'text', who: 'Sam', about: 'Saturday', title: 'Text Sam about Saturday' })
  assert.equal(parseOwe('call the GP surgery').kind, 'call')
  assert.equal(parseOwe('call the GP surgery').who, 'the GP surgery')
  assert.equal(parseOwe('email the school office').title, 'Email the school office')
  assert.deepEqual(parseOwe('reply to Jo'), { kind: 'reply', who: 'Jo', about: '', title: 'Reply to Jo' })
  assert.equal(parseOwe('Message Ana').kind, 'text')
  assert.equal(parseOwe('library'), null)
  assert.equal(parseOwe('text'), null)
  assert.equal(parseOwe('17:30 call mum'), null)
})

test('peopleNamed: a full or first name, ignoring case; two Sams are both offered', () => {
  const people = [{ id: 1, name: 'Sam Taylor' }, { id: 2, name: 'Sam Lee' }, { id: 3, name: 'Jo Evans' }]
  assert.deepEqual(peopleNamed(people, 'sam').map((person) => person.id), [1, 2])
  assert.deepEqual(peopleNamed(people, 'Sam Taylor').map((person) => person.id), [1, 2])
  assert.deepEqual(peopleNamed(people, 'jo').map((person) => person.id), [3])
  assert.deepEqual(peopleNamed(people, 'the GP surgery'), [])
})

test('groupActions: today, this week, whenever and done lately', () => {
  const today = '2026-10-28'
  const rows = [
    { id: 'late', status: 'open', priority: 'normal', due: '2026-10-27' },
    { id: 'urgent', status: 'open', priority: 'urgent' },
    { id: 'friday', status: 'open', priority: 'normal', due: '2026-10-30' },
    { id: 'mine-low', status: 'open', priority: 'urgent', her_priority: 'low', due: '2026-11-20' },
    { id: 'tomorrow', status: 'snoozed', snoozed_until: '2026-10-29', priority: 'high' },
    { id: 'woke', status: 'snoozed', snoozed_until: '2026-10-28', priority: 'normal' },
    { id: 'done', status: 'done', done_at: '2026-10-27T10:00:00Z', priority: 'normal' },
    { id: 'old', status: 'done', done_at: '2026-10-01T10:00:00Z', priority: 'normal' },
    { id: 'gone', status: 'open', priority: 'urgent', deleted_at: '2026-10-28T00:00:00Z' },
  ]
  const groups = groupActions(rows, today)
  assert.deepEqual(groups.today.map((row) => row.id), ['urgent', 'late', 'woke'])
  assert.deepEqual(groups.week.map((row) => row.id), ['tomorrow', 'friday'])
  assert.deepEqual(groups.whenever.map((row) => row.id), ['mine-low'])
  assert.deepEqual(groups.done.map((row) => row.id), ['done'])
  assert.equal(priorityOf(rows[3]), 'low')
})

test('birthdayWishes: on the day only, from People; a stored row wins; 29 February on the 28th', () => {
  const people = [{ id: 'p1', name: 'Sara', birthday: '1996-10-28' }, { id: 'p2', name: 'Ben', birthday: '1994-11-02' }, { id: 'p3', name: 'Leap', birthday: '2000-02-29' }, { id: 'p4', name: 'None', birthday: '' }]
  const [wish] = birthdayWishes(people, '2026-10-28')
  assert.equal(wish.title, 'Wish Sara a happy birthday')
  assert.equal(wish.kind, 'congratulate')
  assert.equal(wish.dedupe_key, 'birthday:p1:2026')
  assert.equal(birthdayWishes(people, '2026-10-28', [{ dedupe_key: 'birthday:p1:2026', status: 'done' }])[0].status, 'done')
  assert.deepEqual(birthdayWishes(people, '2027-02-28').map((row) => row.person_name), ['Leap'])
  assert.deepEqual(birthdayWishes(people, '2028-02-29').map((row) => row.person_name), ['Leap'])
})

test('textPieces: https links only; everything else, HTML included, stays text', () => {
  assert.deepEqual(textPieces('See https://example.ac.uk/brief. Or http://old.example and <script>alert(1)</script>'), [
    { text: 'See ' }, { href: 'https://example.ac.uk/brief' }, { text: '. Or http://old.example and <script>alert(1)</script>' },
  ])
  assert.deepEqual(textPieces(''), [])
})

test('replyPrompt: keeps to the message and leaves the sending to her', () => {
  const prompt = replyPrompt({ action: { kind: 'reply', title: 'Reply to Sam about Saturday', person_name: 'Sam Taylor', her_note: 'say 3pm instead' }, message: { from_name: 'Sam Taylor', subject: 'Saturday?', body: 'Are we still on?' }, name: 'X' })
  assert.match(prompt, /Are we still on\?/)
  assert.match(prompt, /say 3pm instead/)
  assert.match(prompt, /do not invent/)
  assert.match(prompt, /Sign it X\./)
  assert.match(replyPrompt({ action: { kind: 'email', title: 'Email the office' } }), /Leave the sign-off for me/)
})
