// Runs first in every app Life OS shows in a frame. It tells the page which Life OS style
// is chosen (Madder, Indigo, Paper or Modern), and whether light or dark is chosen, by
// writing both on <html> before anything is drawn, and again whenever either is changed
// from the top bar. The colours for each style are in palettes.css, which also decides
// what a style without the chosen light or dark shows; the app's own layer
// (apps/<id>.css) ties its look to them.
(function () {
  var KEY = 'life-os.ground'
  var MODE_KEY = 'life-os.mode'
  var root = document.documentElement

  function mode() {
    var value = null
    try { value = window.localStorage.getItem(MODE_KEY) } catch (error) { value = null }
    return value === 'light' || value === 'dark' ? value : ''
  }

  function chosen() {
    var value = null
    try { value = window.localStorage.getItem(KEY) } catch (error) { value = null }
    return typeof value === 'string' && /^[a-z]{1,20}$/.test(value) ? value : 'madder'
  }

  function apply() {
    var ground = chosen()
    var wanted = mode()
    if (root.getAttribute('data-life-os-ground') === ground && (root.getAttribute('data-life-os-mode') || '') === wanted) return
    root.setAttribute('data-life-os-ground', ground)
    if (wanted) root.setAttribute('data-life-os-mode', wanted)
    else root.removeAttribute('data-life-os-mode')
    // An app that keeps its own light and dark mode can follow along.
    try { window.dispatchEvent(new CustomEvent('life-os-ground', { detail: ground })) } catch (error) { /* older browsers */ }
  }

  // Under the Life OS top bar the app does not need a second way back or a second logo.
  try {
    if (window.parent !== window && window.parent.location.origin === window.location.origin) root.setAttribute('data-life-os-frame', '')
  } catch (error) { /* not in a Life OS frame */ }

  apply()
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === MODE_KEY || event.key === null) apply()
  })
})()
