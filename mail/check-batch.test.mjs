// node --test mail/check-batch.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { checkBatch } from './check-batch.mjs'

const example = JSON.parse(fs.readFileSync(new URL('./example-batch.json', import.meta.url), 'utf8'))
const changed = (change) => { const batch = structuredClone(example); change(batch); return checkBatch(batch) }

test('the example batch passes with no notes', () => {
  const result = checkBatch(structuredClone(example))
  assert.equal(result.ok, true, result.problems.join('\n'))
  assert.equal(result.warnings.length, 0)
})

test('an empty run is a valid batch', () => {
  assert.equal(changed((b) => { b.messages = []; b.actions = []; b.digest = { headline: 'Nothing new since Monday.' } }).ok, true)
})

const refused = {
  'a missing digest': (b) => { delete b.digest },
  'an unknown priority': (b) => { b.messages[0].priority = 'asap' },
  'a ref used twice': (b) => { b.messages[1].ref = 'm1' },
  'a source the batch does not declare': (b) => { b.messages[0].source = 'yahoo' },
  'an action pointing to a missing message': (b) => { b.actions[0].messageRefs = ['m99'] },
  'a security code in a text': (b) => { b.messages[5].text = 'Your verification code is 482913'; b.messages[5].category = 'fyi' },
  'a day that does not exist': (b) => { b.actions[0].due = '2026-02-30' },
  'a field the format does not know': (b) => { b.messages[0].spam = true },
  'a text over 20,000 characters': (b) => { b.messages[0].text = 'x'.repeat(20001) },
  'a link that is not https': (b) => { b.messages[0].link = 'http://example.com' },
  'a read source with no window': (b) => { delete b.sources[0].window },
  'a dedupeKey used twice': (b) => { b.actions[1].dedupeKey = b.actions[0].dedupeKey },
  'the same message twice': (b) => { b.messages.push({ ...b.messages[0], ref: 'm50' }) },
  'a runId in the wrong shape': (b) => { b.runId = 'today' },
}
for (const [name, change] of Object.entries(refused)) {
  test(`refuses ${name}`, () => {
    const result = changed(change)
    assert.equal(result.ok, false)
    assert.ok(result.problems.length > 0)
  })
}

test('notes, without refusing, a newsletter that keeps its text', () => {
  const result = changed((b) => { b.messages[6].text = 'The whole newsletter' })
  assert.equal(result.ok, true)
  assert.equal(result.warnings.length, 1)
})

// Version 2: items, links, and the rules for what came in.
const example2 = JSON.parse(fs.readFileSync(new URL('./example-batch-v2.json', import.meta.url), 'utf8'))
const changed2 = (change) => { const batch = structuredClone(example2); change(batch); return checkBatch(batch) }

test('the version 2 example passes with no notes, and needs no digest', () => {
  const result = checkBatch(structuredClone(example2))
  assert.equal(result.ok, true, result.problems.join('\n'))
  assert.equal(result.warnings.length, 0)
  assert.equal('digest' in example2, false)
})

test('a version 2 batch may still carry a digest, and an empty one is valid', () => {
  assert.equal(changed2((b) => { b.digest = { headline: 'Nothing new.' } }).ok, true)
  assert.equal(changed2((b) => { b.messages = []; b.actions = []; b.items = [] }).ok, true)
})

test('a version 1 batch still needs its digest and cannot carry items or links', () => {
  assert.match(changed((b) => { delete b.digest }).problems.join('\n'), /digest/)
  assert.match(changed((b) => { b.items = [] }).problems.join('\n'), /version 2/)
  assert.match(changed((b) => { b.messages[0].links = [{ href: 'https://example.com' }] }).problems.join('\n'), /version 2/)
})

const refused2 = {
  'an item ref used twice': [(b) => { b.items[1].ref = 'i1' }, /used twice/],
  'an item key used twice': [(b) => { b.items[1].key = b.items[0].key }, /used twice/],
  'a vacancy outside jobs and research': [(b) => { b.items[2].area = 'events' }, /not in area/],
  'a kind the format does not know': [(b) => { b.items[0].kind = 'gadget' }, /must be one of/],
  'a summary that talks to her': [(b) => { b.items[0].summary = 'You should go to the new room.' }, /talks to her/],
  'a message summary that talks to her': [(b) => { b.messages[0].summary = 'I recommend reading this first.' }, /talks to her/],
  'a start that is not a day or a time': [(b) => { b.items[0].start = 'next Thursday' }, /day like/],
  'an end before the start': [(b) => { b.items[0].end = '2026-11-05T13:00:00Z' }, /ends before/],
  'an all-day item with a time': [(b) => { b.items[0].allDay = true }, /all-day/],
  'a safe-link wrapper as an item link': [(b) => { b.items[3].url = 'https://eur02.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com' }, /safe-link/],
  'an unsubscribe link in a message': [(b) => { b.messages[3].links.push({ href: 'https://books.example.com/unsubscribe' }) }, /unsubscribe/],
  'a vacancy with no link': [(b) => { delete b.items[2].url }, /needs the link/],
  'an event with no link': [(b) => { delete b.items[8].url }, /needs the link/],
  'an item pointing to a missing message': [(b) => { b.items[0].messageRefs = ['m99'] }, /not in the batch/],
  'an item pointing to a missing action': [(b) => { b.items[6].actionRefs = ['a9'] }, /not in the batch/],
  'an item that says nowhere it came from': [(b) => { delete b.items[8].foundAt }, /neither which message nor which page/],
  'an item on a day its message did not come': [(b) => { b.items[0].day = '2026-10-31' }, /London day its first message/],
  'a web find on a day it was not found': [(b) => { b.items[8].day = '2026-11-02' }, /London day it was found/],
  'a field items do not have': [(b) => { b.items[0].priority = 'high' }, /does not know/],
}
for (const [name, [change, reason]] of Object.entries(refused2)) {
  test(`version 2 refuses ${name}`, () => {
    const result = changed2(change)
    assert.equal(result.ok, false)
    assert.match(result.problems.join('\n'), reason)
  })
}

test('automated mail an item cites keeps its text without a note; uncited, it gets one', () => {
  assert.equal(changed2(() => {}).warnings.length, 0)
  const uncited = changed2((b) => { b.items = b.items.filter((item) => !(item.messageRefs ?? []).includes('m3')) })
  assert.equal(uncited.ok, true)
  assert.equal(uncited.warnings.length, 1)
})

test('the London day: a message just after midnight in summer time belongs to the new day', () => {
  const result = changed2((b) => { b.messages[0].receivedAt = '2026-10-24T23:30:00Z'; b.items[0].day = '2026-10-25' })
  assert.equal(result.ok, true, result.problems.join('\n'))
})

// Stage 6: the kinds that move (orders, applications, bills…), their states and amounts.
const kinds = JSON.parse(fs.readFileSync(new URL('./example-batch-v2-kinds.json', import.meta.url), 'utf8'))
const changedKinds = (change) => { const batch = structuredClone(kinds); change(batch); return checkBatch(batch) }

test('the kinds example passes: an order, an application, a bill, a subscription, a booking, an appointment, an official letter, a person, a scholarship, a tenancy, an account notice', () => {
  const result = checkBatch(structuredClone(kinds))
  assert.equal(result.ok, true, result.problems.join('; '))
  assert.equal(result.warnings.length, 0, result.warnings.join('; '))
})

const refusedKinds = {
  'a state its kind does not have': [(b) => { b.items[0].state = 'interview' }, /not a state of a order/],
  'a state on a kind that has none': [(b) => { b.items[7].state = 'active' }, /it has none/],
  'a form on something that is not an opportunity': [(b) => { b.items[0].form = 'course' }, /only an opportunity has a form/],
  'an amount without its currency': [(b) => { delete b.items[2].currency }, /needs its currency/],
  'a booking in the jobs area': [(b) => { b.items[4].area = 'jobs' }, /not in area/],
  'a reference that is too long': [(b) => { b.items[0].reference = 'x'.repeat(201) }, /at most 200/],
}
for (const [name, [change, reason]] of Object.entries(refusedKinds)) {
  test(`kinds: refuses ${name}`, () => {
    const result = changedKinds(change)
    assert.equal(result.ok, false)
    assert.match(result.problems.join('\n'), reason)
  })
}
