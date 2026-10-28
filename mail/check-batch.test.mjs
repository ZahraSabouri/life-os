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
