import assert from 'node:assert/strict'
import test from 'node:test'

import { isUserFacingCardNote } from '../src/utils/noteClassification.js'

test('Focus Room step-out records are operational events, not Notes-page content', () => {
  assert.equal(
    isUserFacingCardNote({ text: 'Stepped out (10m, no guard): Open R studio' }),
    false,
  )
})

test('user-authored card notes and restart cues remain visible', () => {
  assert.equal(isUserFacingCardNote({ text: 'Recheck the centred moving-average calculation.' }), true)
  assert.equal(isUserFacingCardNote({ text: 'Restart cue: begin with example 3.' }), true)
})

test('explicitly classified system notes stay out of the Notes page', () => {
  assert.equal(isUserFacingCardNote({ kind: 'system', text: 'Timer event' }), false)
  assert.equal(isUserFacingCardNote({ kind: 'operational', text: 'Guard event' }), false)
})
