// Inside Life OS the chosen style (Style menu) decides whether the page is light or dark;
// the skin files Life OS adds to the page say which (hosting/skins). Opened on its own,
// the app keeps its own light and dark setting.
export function styleScheme() {
  if (typeof document === 'undefined' || !document.documentElement.hasAttribute('data-life-os-ground')) return ''
  const scheme = window.getComputedStyle(document.documentElement).getPropertyValue('--m-scheme').trim()
  return scheme === 'dark' || scheme === 'light' ? scheme : ''
}

// Calls `apply` whenever the Life OS style changes; returns the way to stop.
export function followStyle(apply) {
  window.addEventListener('life-os-ground', apply)
  return () => window.removeEventListener('life-os-ground', apply)
}
