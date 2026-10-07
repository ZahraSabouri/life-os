// Inside Life OS, JobMap wears the style chosen there (Style menu: Madder, Indigo, Paper,
// Modern). Life OS publishes the chosen style's colours in the browser's storage for the
// apps it shows; this puts them on the page before it is drawn and follows later changes.
// Opened on its own address, JobMap finds nothing there and keeps its own look.
(function () {
  var KEY = 'life-os.skin'
  var root = document.documentElement
  var applied = []

  function apply(raw) {
    var skin = null
    try { skin = raw ? JSON.parse(raw) : null } catch (error) { skin = null }
    for (var i = 0; i < applied.length; i += 1) root.style.removeProperty(applied[i])
    applied = []
    if (!skin || typeof skin.ground !== 'string' || !/^[a-z]{1,20}$/.test(skin.ground) || !skin.vars || typeof skin.vars !== 'object') {
      root.removeAttribute('data-life-os-ground')
      return
    }
    for (var name in skin.vars) {
      var value = skin.vars[name]
      // Colours, fonts and sizes only: nothing that could load a file.
      if (!/^--m-[a-z-]{1,40}$/.test(name) || typeof value !== 'string' || value.length > 300 || /url\(|[;{}]/i.test(value)) continue
      root.style.setProperty(name, value)
      applied.push(name)
    }
    root.setAttribute('data-life-os-ground', skin.ground)
  }

  function read() {
    try { return window.localStorage.getItem(KEY) } catch (error) { return null }
  }

  apply(read())
  window.addEventListener('storage', function (event) {
    if (event.key === KEY) apply(event.newValue)
  })
})()
