import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeStudyUpload } from './storage.mjs'

test('the full 25 MB upload limit decodes without recursive regex failure', () => {
  const source = Buffer.alloc(25 * 1024 * 1024, 42)
  assert.deepEqual(decodeStudyUpload(source.toString('base64')), source)
})

test('uploads reject malformed, noncanonical, empty and oversized base64', () => {
  for (const value of ['', 'a', 'a===', '====', 'Zm9v\n', 'Zh==']) assert.throws(() => decodeStudyUpload(value), error => error.status === 400)
  assert.throws(() => decodeStudyUpload(Buffer.alloc(25 * 1024 * 1024 + 1).toString('base64')), error => error.status === 400)
  assert.equal(decodeStudyUpload('Zm9v').toString(), 'foo')
})
