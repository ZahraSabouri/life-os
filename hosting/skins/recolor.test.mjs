import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecolor, parseColour } from './recolor.mjs'

const recolor = createRecolor({ card: '#ffffff', bg: '#f4f5ec', ink: '#263d33', accent: '#315b48', red: '#a44935', amber: '#9a6a1f', blue: '#3d5f8f' })

test('colours are read in every common spelling', () => {
  assert.deepEqual(parseColour('#fff'), { r: 255, g: 255, b: 255, a: 1 })
  assert.deepEqual(parseColour('#00000080'), { r: 0, g: 0, b: 0, a: 128 / 255 })
  assert.deepEqual(parseColour('rgba(10, 20, 30, .5)'), { r: 10, g: 20, b: 30, a: 0.5 })
  assert.deepEqual(parseColour('rgb(10 20 30 / 50%)'), { r: 10, g: 20, b: 30, a: 0.5 })
  assert.equal(parseColour('url(#gradient)'), null)
})

test("the app's own palette colours become the shared ones", () => {
  assert.equal(recolor('.a{background:#fff;color:#263d33;border:1px solid #315b48}'), '.a{background:var(--m-card);color:var(--m-ink);border:1px solid var(--m-accent)}')
  assert.equal(recolor('.a{background:#F4F5EC}'), '.a{background:var(--m-bg)}')
})

test('a shade between two palette colours becomes a blend of them', () => {
  const out = recolor('.a{color:#93a09a}')
  assert.match(out, /^\.a\{color:color-mix\(in srgb, var\(--m-ink\) \d+%, var\(--m-(?:card|bg)\)\)\}$/)
})

test('white text is the colour that sits on a filled shape; a white surface is the card', () => {
  assert.equal(recolor('.a{color:#fff;background:white}'), '.a{color:var(--m-on-accent);background:var(--m-card)}')
})

test('see-through colours keep how see-through they are', () => {
  assert.equal(recolor('.a{border-color:rgba(49,91,72,.2)}'), '.a{border-color:color-mix(in srgb, var(--m-accent) 20%, transparent)}')
})

test('soft shadows stay dark and follow the style; dark veils are left alone', () => {
  assert.equal(recolor('.a{box-shadow:0 2px 8px rgba(0,0,0,.2)}'), '.a{box-shadow:0 2px 8px color-mix(in srgb, #000000 calc(20% * var(--m-shadow-strength, 1)), transparent)}')
  const veil = '.a{background:rgba(10,20,15,.5)}'
  assert.equal(recolor(veil), veil)
  // A coloured ring drawn with box-shadow is a colour like any other.
  assert.equal(recolor('.a{box-shadow:0 0 0 3px #315b48}'), '.a{box-shadow:0 0 0 3px var(--m-accent)}')
})

test('a colour of its own keeps its hue and leans on the style', () => {
  assert.equal(recolor('.a{color:#a14770}'), '.a{color:color-mix(in srgb, #a14770 74%, var(--m-ink))}')
  // An app with coloured categories asks for hues to be kept more strictly.
  const keepsHues = createRecolor({ card: '#ffffff', bg: '#f4f5ec', ink: '#263d33', accent: '#315b48', red: '#a44935', amber: '#9a6a1f', blue: '#3d5f8f' }, { spread: 0.2 })
  assert.match(keepsHues('.a{background:#f6e3ee}'), /^\.a\{background:color-mix\(in srgb, #[0-9a-f]{6} \d+%, var\(--m-card\)\)\}$/)
})

test('addresses, quoted text, fonts and rules inside @media are handled', () => {
  const css = '@media (max-width:600px){.a{background:url("x.svg#fff") #fff;content:"#fff";font-family:"White Rabbit"}}'
  assert.equal(recolor(css), '@media (max-width:600px){.a{background:url("x.svg#fff") var(--m-card);content:"#fff";font-family:"White Rabbit"}}')
})

test('variables and gradients are recoloured too', () => {
  assert.equal(recolor(':root{--ink:#263d33}'), ':root{--ink:var(--m-ink)}')
  assert.equal(recolor('.a{background:linear-gradient(90deg,#fff,#315b48)}'), '.a{background:linear-gradient(90deg,var(--m-card),var(--m-accent))}')
})
