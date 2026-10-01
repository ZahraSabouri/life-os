import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGround } from '../lib/groundContext.jsx'

export default function CourtLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { ground, cycleGround } = useGround()
  const [now, setNow] = useState(() => new Date())
  const isBoardRoute = location.pathname === '/calendar' || location.pathname === '/today'
  const isCourtRoute = location.pathname === '/court'

  const dateLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
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
    <main className={`court-screen${isBoardRoute ? ' board-screen' : ''}${isCourtRoute ? ' court-redesign-screen' : ''}`}>
      {!isCourtRoute ? (
        <header className="court-topbar">
          <div className="wordmark">Life OS</div>
          <div className="date-line">{dateLabel}</div>
          <nav className="court-nav" aria-label="Primary">
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
            <button type="button" onClick={cycleGround}>Ground: {ground}</button>
            <button type="button" onClick={goDivan}>Divan</button>
          </nav>
        </header>
      ) : null}

      <Outlet />
    </main>
  )
}
