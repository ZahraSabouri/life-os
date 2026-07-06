const FALLBACK_POEM = {
  poet: 'Life OS',
  lines: [
    'A private ledger opens here.',
    'Capture first. Structure after.'
  ],
  en: ''
}

export function getPoemPool() {
  return Array.isArray(window.POEMS_DB) && window.POEMS_DB.length
    ? window.POEMS_DB
    : [FALLBACK_POEM]
}

export function normalizePoem(poem, seed = Math.random()) {
  if (!poem || !Array.isArray(poem.lines) || poem.lines.length === 0) {
    return FALLBACK_POEM
  }

  if (poem.lines.length <= 2) {
    return poem
  }

  const coupletCount = Math.max(1, Math.floor(poem.lines.length / 2))
  const index = Math.floor(seed * coupletCount) * 2

  return {
    ...poem,
    lines: poem.lines.slice(index, index + 2)
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

