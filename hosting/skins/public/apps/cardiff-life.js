// Cardiff Life's place in its address, added by Life OS as the page is served (Cardiff Life's own
// files are not changed). #event=<id> opens that event's details; #view=explore, communities or
// updates shows that part. Opening an event's details here is a step Back closes, and closing it
// is the same as Back; a part chosen is a step too. A link from Life OS ("Open in Cardiff Life"
// on the calendar) opens the event it names.
//
// The page is only ever moved by its own controls: an event opens by a click on a button that
// names it (the page's own handler), a part by its own tab. The address is written only when
// it and the page disagree, so following Back never writes it again.
(function () {
  var VIEWS = ['week', 'explore', 'communities', 'updates']
  var lastDetail = ''
  var openedHere = false

  function read() {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    return { event: params.get('event') || '', view: VIEWS.indexOf(params.get('view')) > 0 ? params.get('view') : 'week' }
  }
  function write(next, push) {
    var params = new URLSearchParams()
    if (next.view && next.view !== 'week') params.set('view', next.view)
    if (next.event) params.set('event', next.event)
    var hash = params.toString() ? '#' + params.toString() : ''
    if (hash === window.location.hash || (!hash && (window.location.hash === '' || window.location.hash === '#'))) return
    window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', window.location.pathname + window.location.search + hash)
  }
  function dialog() { return document.getElementById('event-detail') }
  function shownView() {
    for (var i = 0; i < VIEWS.length; i += 1) {
      var part = document.getElementById(VIEWS[i] + '-view')
      if (part && !part.hidden) return VIEWS[i]
    }
    return 'week'
  }
  function openEvent(id) {
    var button = document.createElement('button')
    button.type = 'button'
    button.hidden = true
    button.dataset.detail = id
    document.body.appendChild(button)
    button.click()
    button.remove()
    return Boolean(dialog() && dialog().open)
  }

  // The page as the address asks: the part, then the event (closed when the address names none).
  function follow() {
    var wanted = read()
    if (shownView() !== wanted.view) {
      var tab = document.querySelector('[data-view="' + wanted.view + '"]')
      if (tab) tab.click()
    }
    var box = dialog()
    if (!box) return true
    if (wanted.event && (!box.open || lastDetail !== wanted.event)) {
      if (box.open) box.close()
      openedHere = false
      return openEvent(wanted.event)
    }
    if (!wanted.event && box.open) box.close()
    return true
  }

  // The address as the page is: after a click on an event or a part, or Esc on the details.
  function record() {
    var box = dialog()
    var at = read()
    var view = shownView()
    var event = box && box.open ? lastDetail : ''
    if (event === at.event && view === at.view) return
    if (!event && at.event && view === at.view) {
      // The details were closed: the step that opened them is taken back, or the event leaves the address.
      if (openedHere) { openedHere = false; window.history.back() } else write({ view: view }, false)
      return
    }
    if (event && at.event) { write({ view: view, event: event }, false); return }
    openedHere = Boolean(event)
    write({ view: view, event: event }, true)
  }

  function start() {
    var box = dialog()
    if (!box) return
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-detail]') : null
      if (button) lastDetail = button.dataset.detail
    }, true)
    var watch = new MutationObserver(function () { window.setTimeout(record, 0) })
    watch.observe(box, { attributes: true, attributeFilter: ['open'] })
    VIEWS.forEach(function (view) {
      var part = document.getElementById(view + '-view')
      if (part) watch.observe(part, { attributes: true, attributeFilter: ['hidden'] })
    })
    window.addEventListener('popstate', follow)
    window.addEventListener('hashchange', follow)
    // The events she added herself arrive a moment later: an event named in the address is looked for a few times.
    var tries = 0
    ;(function first() {
      if (follow() || tries >= 12) return
      tries += 1
      window.setTimeout(first, 250)
    })()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.setTimeout(start, 0) })
  else window.setTimeout(start, 0)
})()
