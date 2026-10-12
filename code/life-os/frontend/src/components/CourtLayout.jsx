import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGround } from '../lib/groundContext.jsx'
import AreaToday from './AreaToday.jsx'
import ModeSwitch from './ModeSwitch.jsx'
import StyleSwitch from './StyleSwitch.jsx'

export default function CourtLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  // On a narrow window the menu folds behind one button; choosing a page closes it.
  const [menuOpen, setMenuOpen] = useState(false)
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

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

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
          <div className="wordmark">Life OS</div>
          <div className="date-line">{dateLabel}</div>
          <button type="button" className="court-menu-toggle" aria-expanded={menuOpen} aria-controls="court-menu" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <nav className={`court-nav${menuOpen ? ' is-open' : ''}`} id="court-menu" aria-label="Primary">
            <button
              className={location.pathname === '/court' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/court')}
            >
              Court
            </button>
            <button
              className={location.pathname === '/today' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/today')}
            >
              Today
            </button>
            <button
              className={location.pathname === '/calendar' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/calendar')}
            >
              Calendar
            </button>
            <button type="button" onClick={() => navigate('/ledger')} className={location.pathname === '/ledger' ? 'active' : undefined}>
              Ledger
            </button>
            <button
              className={location.pathname === '/study' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/study')}
            >
              Study hub
            </button>
            <button
              className={location.pathname === '/cardiff-life' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/cardiff-life')}
            >
              Cardiff Life
            </button>
            <button
              className={location.pathname === '/budget' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/budget')}
            >
              Budget
            </button>
            <button
              className={location.pathname === '/jobmap' ? 'active' : undefined}
              type="button"
              onClick={() => navigate('/jobmap')}
            >
              JobMap
            </button>
            <StyleSwitch />
            <ModeSwitch />
            <button type="button" onClick={goDivan}>Divan</button>
          </nav>
        </header>
      ) : null}

      {isSubApp ? <AreaToday area={subAppArea} /> : null}
      <Outlet />
    </main>
  )
}
