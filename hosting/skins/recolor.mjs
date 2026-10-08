// Rewrites the colours in a sub-app's own stylesheet so they follow the Life OS style.
//
// A sub-app such as Budget writes hundreds of colours straight into its CSS. Instead of
// listing them by hand, every colour is re-expressed as a blend of the shared palette:
//   "a little of the accent over the card", "half-way from the page to the ink", ...
// so it keeps its place in the design in every style, dark ones included.
//
// `anchors` are the app's own colours for card, page, ink, accent, red, amber and blue.
// The result uses the --m-* names defined in frontend/src/styles/palettes.css.
const NAMED = { white: '#ffffff', black: '#000000' }
const COLOUR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])|rgba?\([^()]*\)|\b(?:white|black)\b/gi
const BASES = ['card', 'bg']
const TONES = ['ink', 'accent', 'red', 'amber', 'blue']
const FOREGROUND = /^(?:color|fill|stroke|caret-color|-webkit-text-fill-color|text-decoration-color|text-emphasis-color)$/
const SHADOW = /^(?:box-shadow|text-shadow|filter|backdrop-filter|-webkit-box-shadow)$/
const UNTOUCHED = /^(?:content|src|font|font-family|unicode-range|transition|animation|will-change|mask|mask-image|-webkit-mask|-webkit-mask-image)$/

export function parseColour(text) {
  const value = String(text).trim().toLowerCase()
  const hex = NAMED[value] ?? value
  if (hex.startsWith('#')) {
    const digits = hex.slice(1)
    const wide = digits.length <= 4 ? [...digits].map((d) => d + d).join('') : digits
    const number = (at) => parseInt(wide.slice(at, at + 2), 16)
    if (wide.length !== 6 && wide.length !== 8) return null
    return { r: number(0), g: number(2), b: number(4), a: wide.length === 8 ? number(6) / 255 : 1 }
  }
  const parts = /^rgba?\(([^)]*)\)$/.exec(value)?.[1].split(/[\s,/]+/).filter(Boolean)
  if (!parts || parts.length < 3 || parts.some((part) => !/^[\d.]+%?$/.test(part))) return null
  const channel = (part) => (part.endsWith('%') ? (parseFloat(part) * 255) / 100 : parseFloat(part))
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
  return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a: Math.max(0, Math.min(1, alpha)) }
}

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`
const luminance = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
const distance = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
const percent = (t) => `${Math.round(t * 100)}%`

// Hue in degrees and how colourful (0 to 1) a colour is.
function hueOf({ r, g, b }) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), spread = max - min
  if (!spread) return { hue: 0, colourful: 0 }
  const hue = max === r ? ((g - b) / spread) % 6 : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4
  return { hue: (hue * 60 + 360) % 360, colourful: spread / Math.max(max, 1) }
}
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

// Where a colour sits on the straight line from one colour to another, and how far off it is.
function along(colour, from, to) {
  const span = { r: to.r - from.r, g: to.g - from.g, b: to.b - from.b }
  const length = span.r ** 2 + span.g ** 2 + span.b ** 2
  if (!length) return { t: 0, miss: distance(colour, from) }
  const t = Math.max(0, Math.min(1, ((colour.r - from.r) * span.r + (colour.g - from.g) * span.g + (colour.b - from.b) * span.b) / length))
  return { t, miss: distance(colour, { r: from.r + span.r * t, g: from.g + span.g * t, b: from.b + span.b * t }) }
}

// tolerance: how far (in colour units) a colour may sit from a palette blend and still become one.
// spread: the same, as a share of how far the colour is from the card or page; lower keeps more
// hues of their own (an app with coloured categories), higher pulls everything onto the palette.
export function createRecolor(anchors, { tolerance = 22, spread = 0.3 } = {}) {
  const palette = Object.fromEntries(Object.entries(anchors).map(([name, value]) => [name, parseColour(value)]))
  for (const name of [...BASES, ...TONES]) if (!palette[name]) throw new Error(`recolor needs the app's ${name} colour`)
  const cache = new Map()

  function blend(colour, role) {
    // White (or nearly) drawn as text or an icon sits on a filled shape.
    if (role === 'foreground' && Math.min(colour.r, colour.g, colour.b) >= 236) return 'var(--m-on-accent)'
    let best = null
    const own = hueOf(colour)
    for (const base of BASES) {
      for (const tone of TONES) {
        const fit = along(colour, palette[base], palette[tone])
        let score = fit.miss + (base === 'card' ? 0 : 0.5)
        if (tone === 'ink') {
          // A strong, colourful fill (a button, a bar) belongs to the accent, not to the ink.
          if (role !== 'foreground' && fit.t > 0.55 && own.colourful > 0.25) score += 7
        } else {
          score += 1.5
          // A colour only joins a tone of a similar hue; the accent also takes its wider family
          // (a lime in a green app is still "the app's colour").
          const gap = own.colourful > 0.18 ? hueGap(own.hue, hueOf(palette[tone]).hue) : 0
          if (gap > (tone === 'accent' ? 95 : 38)) continue
          if (tone === 'accent' && gap > 38) score += 3
        }
        if (!best || score < best.score) best = { base, tone, score, ...fit, travelled: distance(colour, palette[base]) }
      }
    }
    // Close enough to the line between two palette colours, judged against how far along it is:
    // a pale tint of another hue is not mistaken for a pale tint of the accent.
    if (best.miss <= tolerance && best.miss <= Math.max(6, best.travelled * spread)) {
      if (best.t <= 0.02) return `var(--m-${best.base})`
      if (best.t >= 0.98) return `var(--m-${best.tone})`
      return `color-mix(in srgb, var(--m-${best.tone}) ${percent(best.t)}, var(--m-${best.base}))`
    }
    // A colour of its own (a category, a chart): keep its hue, but let the style carry it.
    const light = luminance(colour) > 0.72
    if (role !== 'foreground' && light) {
      // A light tint: the same amount of its full colour, over the style's card.
      const card = palette.card
      const step = { r: colour.r - card.r, g: colour.g - card.g, b: colour.b - card.b }
      let reach = Infinity
      for (const key of ['r', 'g', 'b']) {
        if (step[key] < 0) reach = Math.min(reach, (40 - card[key]) / step[key])
        if (step[key] > 0) reach = Math.min(reach, (255 - card[key]) / step[key])
      }
      if (Number.isFinite(reach) && reach > 1.2) {
        const full = { r: card.r + step.r * reach, g: card.g + step.g * reach, b: card.b + step.b * reach }
        return `color-mix(in srgb, ${hex(full)} ${percent(1 / reach)}, var(--m-card))`
      }
    }
    return `color-mix(in srgb, ${hex(colour)} 74%, var(--m-ink))`
  }

  function one(literal, role) {
    const key = `${role}|${literal.toLowerCase()}`
    if (cache.has(key)) return cache.get(key)
    const colour = parseColour(literal)
    let out = literal
    if (colour && colour.a > 0) {
      const dark = luminance(colour) < 0.22
      if (role === 'shadow' && (dark || colour.a <= 0.3)) {
        // A soft shadow stays dark, and is as strong as the style wants it (none in the manuscript styles).
        out = `color-mix(in srgb, ${hex(colour)} calc(${percent(colour.a)} * var(--m-shadow-strength, 1)), transparent)`
      } else if (!(role !== 'foreground' && dark && colour.a < 0.9)) {
        // (A dark see-through veil over a picture or behind a dialog stays as it is.)
        const solid = blend(colour, role)
        out = colour.a >= 0.995 ? solid : `color-mix(in srgb, ${solid} ${percent(colour.a)}, transparent)`
      }
    }
    cache.set(key, out)
    return out
  }

  function declaration(text) {
    const colon = text.indexOf(':')
    if (colon < 0) return text
    const property = text.slice(0, colon).trim().toLowerCase()
    if (UNTOUCHED.test(property)) return text
    const role = FOREGROUND.test(property) ? 'foreground' : SHADOW.test(property) ? 'shadow' : 'surface'
    const value = text.slice(colon + 1)
    // Addresses and quoted text are left exactly as written.
    const kept = []
    const guarded = value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/gi, (match) => { kept.push(match); return `\u0000${kept.length - 1}\u0000` })
    const recoloured = guarded.replace(COLOUR, (literal) => one(literal, role))
    return text.slice(0, colon + 1) + recoloured.replace(/\u0000(\d+)\u0000/g, (_match, index) => kept[Number(index)])
  }

  // Works on the innermost { ... } blocks, which hold the declarations.
  return function recolor(css) {
    return String(css).replace(/\{([^{}]*)\}/g, (_match, body) => `{${splitDeclarations(body).map(declaration).join(';')}}`)
  }
}

// Splits "a:b;c:d" at the semicolons that are not inside brackets or quotes.
function splitDeclarations(body) {
  const parts = []
  let depth = 0, quote = '', start = 0
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index]
    if (quote) { if (char === quote && body[index - 1] !== '\\') quote = ''; continue }
    if (char === '"' || char === "'") quote = char
    else if (char === '(') depth += 1
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (char === ';' && depth === 0) { parts.push(body.slice(start, index)); start = index + 1 }
  }
  parts.push(body.slice(start))
  return parts
}
