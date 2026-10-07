// The chosen style, published for the apps Life OS shows in a frame.
// Those apps sit on the same address, so they read the style's colours from the browser's
// storage when they open and hear when it changes. The colours themselves are defined in
// one place only: styles/skins.css.
export const SKIN_KEY = 'life-os.skin'

const NAMES = [
  '--m-bg', '--m-surface', '--m-card', '--m-sunken', '--m-ink', '--m-muted', '--m-faint',
  '--m-line', '--m-line-strong', '--m-accent', '--m-accent-strong', '--m-accent-soft', '--m-on-accent',
  '--m-spark', '--m-blue', '--m-red', '--m-amber', '--m-green', '--m-sidebar',
  '--m-radius-sm', '--m-radius', '--m-radius-lg', '--m-shadow', '--m-shadow-lift',
  '--m-font', '--m-display', '--m-num', '--m-scheme'
]

export function publishSkin(ground, shell = document.querySelector('.app-shell')) {
  if (!shell) return
  const computed = window.getComputedStyle(shell)
  const vars = {}
  for (const name of NAMES) {
    const value = computed.getPropertyValue(name).trim()
    if (value) vars[name] = value
  }
  try {
    window.localStorage.setItem(SKIN_KEY, JSON.stringify({ ground, vars }))
  } catch {
    // Storage is unavailable: the framed apps keep their own look.
  }
}
