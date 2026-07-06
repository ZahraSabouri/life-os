const FALLBACK_POEM = {
  poet: 'Life OS',
  lines: [
    'A private ledger opens here.',
    'Capture first. Structure after.'
  ],
  en: ''
}

function isUsablePoem(poem) {
  return poem
    && typeof poem.poet === 'string'
    && poem.poet.trim().length > 0
    && Array.isArray(poem.lines)
    && poem.lines.some((line) => typeof line === 'string' && line.trim().length > 0)
}

export function getPoemPool() {
  const source = typeof window !== 'undefined' && Array.isArray(window.POEMS_DB)
    ? window.POEMS_DB.filter(isUsablePoem)
    : []

  return source.length
    ? source
    : [FALLBACK_POEM]
}

export function normalizePoem(poem, seed = Math.random()) {
  if (!isUsablePoem(poem)) {
    return FALLBACK_POEM
  }

  const lines = poem.lines.filter((line) => typeof line === 'string' && line.trim().length > 0)

  if (poem.lines.length <= 2) {
    return {
      ...poem,
      lines
    }
  }

  const coupletCount = Math.max(1, Math.floor(lines.length / 2))
  const index = Math.floor(seed * coupletCount) * 2

  return {
    ...poem,
    lines: lines.slice(index, index + 2)
  }
}

export function pickPoem() {
  const pool = getPoemPool()
  return normalizePoem(pool[Math.floor(Math.random() * pool.length)])
}

export function poemForDate(date = new Date()) {
  const pool = getPoemPool()
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  let hash = 0

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0
  }

  const poem = pool[hash % pool.length]
  const seed = ((hash * 2654435761) >>> 0) / 2 ** 32

  return normalizePoem(poem, seed)
}
