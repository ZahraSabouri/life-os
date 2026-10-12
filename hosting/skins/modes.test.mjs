import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GROUND_MODES, GROUNDS, readMode, schemeFor } from '../../code/life-os/frontend/src/lib/grounds.js'

const palettes = fs.readFileSync(path.join(import.meta.dirname, '../../code/life-os/frontend/src/styles/palettes.css'), 'utf8')
const storage = (value) => ({ getItem: () => value })

test('light or dark is read from one saved choice, and anything else means "the style decides"', () => {
  assert.equal(readMode(storage('dark')), 'dark')
  assert.equal(readMode(storage('light')), 'light')
  assert.equal(readMode(storage('night')), '')
  assert.equal(readMode(storage(null)), '')
  assert.equal(readMode({ getItem() { throw new Error('blocked') } }), '')
})

test('a style shows the chosen light or dark when it has it, and its own otherwise', () => {
  assert.equal(schemeFor('modern', ''), 'light')
  assert.equal(schemeFor('modern', 'dark'), 'dark')
  assert.equal(schemeFor('modern', 'light'), 'light')
  assert.equal(schemeFor('madder', 'light'), 'dark')
  assert.equal(schemeFor('indigo', ''), 'dark')
  assert.equal(schemeFor('paper', 'dark'), 'light')
  assert.equal(schemeFor('unknown', 'dark'), 'dark')
})

test('every version a style lists has its colours in the palette file, for pages and for framed apps', () => {
  for (const ground of GROUNDS) {
    const [own, ...others] = GROUND_MODES[ground]
    assert.ok(['light', 'dark'].includes(own))
    for (const mode of others) {
      assert.ok(palettes.includes(`.app-shell[data-ground='${ground}'][data-mode='${mode}']`), `${ground} ${mode}: pages`)
      assert.ok(palettes.includes(`html[data-life-os-ground='${ground}'][data-life-os-mode='${mode}']`), `${ground} ${mode}: framed apps`)
    }
  }
})

test('the second version of a style defines every colour its first version defines', () => {
  const block = (selector) => {
    const start = palettes.indexOf(selector)
    assert.ok(start >= 0, selector)
    return new Set([...palettes.slice(start, palettes.indexOf('}', start)).matchAll(/(--m-[a-z-]+)\s*:/g)].map((match) => match[1]))
  }
  const light = block(".app-shell[data-ground='modern'],")
  const dark = block(".app-shell[data-ground='modern'][data-mode='dark'],")
  assert.deepEqual([...light].filter((name) => !dark.has(name)), [])
  assert.ok(palettes.slice(palettes.indexOf(".app-shell[data-ground='modern'][data-mode='dark'],")).includes('--m-scheme: dark'))
})
