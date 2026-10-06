const OPERATIONAL_CARD_NOTE_PATTERNS = [
  /^Stepped out \(\d+m,\s*no guard\):/i,
]

export function isUserFacingCardNote(note) {
  if (!note || note.kind === 'system' || note.kind === 'operational') return false
  const text = String(note.text ?? '').trim()
  if (!text) return false
  return !OPERATIONAL_CARD_NOTE_PATTERNS.some((pattern) => pattern.test(text))
}
