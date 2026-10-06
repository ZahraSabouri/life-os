export const GROUND_KEY = 'life-os.ground'
// The three manuscript grounds, then the modern skin shared with the attached apps' look.
export const GROUNDS = ['madder', 'indigo', 'paper', 'modern']
export const GROUND_LABELS = { madder: 'Madder', indigo: 'Indigo', paper: 'Paper', modern: 'Modern' }
export const GROUND_SWATCHES = {
  madder: ['#6f241b', '#dfae4f'],
  indigo: ['#171b2c', '#d7a445'],
  paper: ['#eee1c6', '#a5432f'],
  modern: ['#f4f2ea', '#1f6f5e']
}

export function nextGround(ground) {
  return GROUNDS[(GROUNDS.indexOf(ground) + 1) % GROUNDS.length]
}

// An unknown or unreadable saved style falls back to the first ground instead of breaking the page.
export function readGround(storage) {
  try {
    const savedGround = storage?.getItem(GROUND_KEY)
    return GROUNDS.includes(savedGround) ? savedGround : GROUNDS[0]
  } catch {
    return GROUNDS[0]
  }
}
