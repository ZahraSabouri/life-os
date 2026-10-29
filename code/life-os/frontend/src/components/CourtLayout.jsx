import { useEffect, useMemo, useState } from 'react'
import { usePanel } from '../lib/addresses.js'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGround } from '../lib/groundContext.jsx'
import AreaToday from './AreaToday.jsx'
import { FocusButton, FocusPanel, FocusPlayer } from './FocusDock.jsx'
import { NoticeBell, NoticePanel } from './NoticeBell.jsx'
import MailEnvelope from './inbox/MailEnvelope.jsx'
import ModeSwitch from './ModeSwitch.jsx'
import StyleSwitch from './StyleSwitch.jsx'

export default function CourtLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  // On a narrow window the menu folds behind one button. It is in the address (?panel=menu), so
  // Back closes it, and choosing a page (another address) closes it too.
  const [menuOpen, setMenuOpen] = usePanel('menu')
  // A page chosen from the open menu takes the menu's place in history: Back then goes to the page
  // before, not to the menu again.
  const goTo = (path) => navigate(path, menuOpen ? { replace: true } : undefined)
  const { ground } = useGround()
  // The modern skin gives the Court the same header and page frame as every other page.
  const isManuscriptCourt = location.pathname === '/court' && ground !== 'modern'
  const isBoardRoute = !isManuscriptCourt
  // A framed app fills the rest of the window under the top bar, with today's strip for that part.
  const subAppArea = { '/study': 'study', '/jobmap': 'career', '/budget': 'home', '/cardiff-life': 'events' }[location.pathname]
  const isSubApp = Boolean(subAppArea)

  const dateLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now), [now])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function goDivan() {
    navigate('/', { state: { forceIntro: true } })
  }

  return (
    <main className={`court-screen${isBoardRoute ? ' board-screen' : ''}${isManuscriptCourt ? ' court-redesign-screen' : ''}${isSubApp ? ' subapp-screen' : ''}`}>
      {!isManuscriptCourt ? (
        <header className="court-topbar">
          <button type="button" className="wordmark" onClick={() => goTo('/court')} aria-label="Life OS: the first page">Life OS</button>
          <div className="date-line">{dateLabel}</div>
          <button type="button" className="court-menu-toggle" aria-expanded={menuOpen} aria-controls="court-menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <nav className={`court-nav${menuOpen ? ' is-open' : ''}`} id="court-menu" aria-label="Primary">
            <button
              className={location.pathname === '/court' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/court')}
            >
              Court
            </button>
            <button
              className={location.pathname === '/today' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/today')}
            >
              Today
            </button>
            <button
              className={location.pathname === '/calendar' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/calendar')}
            >
              Calendar
            </button>
            <button
              className={location.pathname === '/review' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/review')}
            >
              Review
            </button>
            <button type="button" onClick={() => goTo('/journal')} className={['/journal', '/ledger'].includes(location.pathname) ? 'active' : undefined}>
              Journal
            </button>
            <button type="button" onClick={() => goTo('/people')} className={location.pathname === '/people' ? 'active' : undefined}>
              People
            </button>
            <button
              className={location.pathname === '/study' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/study')}
            >
              Study hub
            </button>
            <button
              className={location.pathname === '/cardiff-life' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/cardiff-life')}
            >
              Cardiff Life
            </button>
            <button
              className={location.pathname === '/budget' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/budget')}
            >
              Budget
            </button>
            <button type="button" className={location.pathname === '/health' ? 'active' : undefined} onClick={() => goTo('/health')}>
              Health
            </button>
            <button
              className={location.pathname === '/jobmap' ? 'active' : undefined}
              type="button"
              onClick={() => goTo('/jobmap')}
            >
              JobMap
            </button>
            <MailEnvelope />
            <NoticeBell />
            <FocusButton />
            <button type="button" className={`guide-link${location.pathname.startsWith('/guide') ? ' active' : ''}`} onClick={() => goTo('/guide')} title="Guide: how each part works, with pictures" aria-label="Guide">?</button>
            <StyleSwitch />
            <ModeSwitch />
            <button type="button" onClick={goDivan}>Divan</button>
          </nav>
        </header>
      ) : null}

      {isSubApp ? <AreaToday area={subAppArea} /> : null}
      <Outlet />
      <NoticePanel />
      <FocusPanel />
      <FocusPlayer />
    </main>
  )
}
