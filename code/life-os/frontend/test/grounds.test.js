import test from 'node:test'
import assert from 'node:assert/strict'
import { GROUNDS, GROUND_LABELS, GROUND_SWATCHES, nextGround, readGround } from '../src/lib/grounds.js'

test('every style has a label and a swatch, and cycling visits all four once', () => {
  assert.deepEqual(GROUNDS, ['madder', 'indigo', 'paper', 'modern'])
  for (const ground of GROUNDS) { assert.ok(GROUND_LABELS[ground]); assert.equal(GROUND_SWATCHES[ground].length, 2) }
  const seen = []
  let ground = GROUNDS[0]
  for (let i = 0; i < GROUNDS.length; i++) { seen.push(ground); ground = nextGround(ground) }
  assert.deepEqual(seen, GROUNDS)
  assert.equal(ground, GROUNDS[0])
  assert.equal(nextGround('unknown'), GROUNDS[0])
})

test('a saved style is restored; unknown, missing or blocked storage falls back safely', () => {
  const storage = value => ({ getItem: () => value })
  assert.equal(readGround(storage('modern')), 'modern')
  assert.equal(readGround(storage('indigo')), 'indigo')
  assert.equal(readGround(storage('neon')), 'madder')
  assert.equal(readGround(storage(null)), 'madder')
  assert.equal(readGround(undefined), 'madder')
  assert.equal(readGround({ getItem() { throw new Error('blocked') } }), 'madder')
})
