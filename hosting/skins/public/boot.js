// Runs first in every app Life OS shows in a frame. It tells the page which Life OS style
// is chosen (Madder, Indigo, Paper or Modern) by writing it on <html>, before anything is
// drawn, and again whenever the style is changed from the Style menu. The colours for each
// style are in palettes.css; the app's own layer (apps/<id>.css) ties its look to them.
(function () {
  var KEY = 'life-os.ground'
  var root = document.documentElement

  function chosen() {
    var value = null
    try { value = window.localStorage.getItem(KEY) } catch (error) { value = null }
    return typeof value === 'string' && /^[a-z]{1,20}$/.test(value) ? value : 'madder'
  }

  function apply() {
    var ground = chosen()
    if (root.getAttribute('data-life-os-ground') === ground) return
    root.setAttribute('data-life-os-ground', ground)
    // An app that keeps its own light and dark mode can follow along.
    try { window.dispatchEvent(new CustomEvent('life-os-ground', { detail: ground })) } catch (error) { /* older browsers */ }
  }

  // Under the Life OS top bar the app does not need a second way back or a second logo.
  try {
    if (window.parent !== window && window.parent.location.origin === window.location.origin) root.setAttribute('data-life-os-frame', '')
  } catch (error) { /* not in a Life OS frame */ }

  apply()
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) apply()
  })
})()
