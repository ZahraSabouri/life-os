import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { archetypeOf, typeExists, validateDetails } from '../../shared/entryTypes.js'

describe('entry type registry', () => {
  it('knows registered types and archetypes', () => {
    assert.equal(typeExists('book'), true)
    assert.equal(typeExists('recipe'), false)
    assert.equal(archetypeOf('task'), 'commitment')
  })

  it('applies defaults for optional fields', () => {
    const result = validateDetails('task', {})

    assert.equal(result.ok, true)
    assert.deepEqual(result.value, { priority: 'med' })
  })

  it('rejects enum violations', () => {
    const result = validateDetails('book', { status: 'nonsense' })

    assert.equal(result.ok, false)
    assert.match(result.errors.join(' '), /status must be one of/)
  })

  it('strips unknown keys', () => {
    const result = validateDetails('note', { body: 'keep this', junk: 'strip this' })

    assert.equal(result.ok, true)
    assert.deepEqual(result.value, { body: 'keep this' })
    assert.deepEqual(result.stripped, ['junk'])
  })

  it('rejects missing required fields', () => {
    const result = validateDetails('place', {})

    assert.equal(result.ok, false)
    assert.deepEqual(result.errors, ['name is required'])
  })

  it('rejects wrong primitive types', () => {
    const result = validateDetails('workout', { duration_min: '30' })

    assert.equal(result.ok, false)
    assert.deepEqual(result.errors, ['duration_min must be a number'])
  })
})
