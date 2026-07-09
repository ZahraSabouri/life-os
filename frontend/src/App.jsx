import { Component, lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import CalendarView from './components/CalendarView.jsx'
import CourtLayout from './components/CourtLayout.jsx'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'
import TodayView from './components/TodayView.jsx'
import { GroundProvider, useGround } from './lib/groundContext.jsx'

// The Study Hub is a full-screen "room": a self-contained app that keeps 100%
// of its own interior navigation and features, wearing Life OS clothes. It is
// lazy-loaded so its large stylesheet + data only load when you enter /study,
// and it is scoped so it can never affect the rest of Life OS.
const StudyHubRoom = lazy(() => import('./rooms/study-hub/StudyHubRoom.jsx'))

const SKIP_INTRO_KEY = 'life-os.skip-intro'

// Keep a room crash from taking down the whole app.
class StudyErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Study Hub room crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <div>
          <h1>The Study Hub hit an error.</h1>
          <p>Your progress is safe in this browser. Try reloading, or head back to Life OS.</p>
          <p><a href="/court">← Back to Life OS</a></p>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>{this.state.error.message}</pre>
        </div>
      </div>
    )
  }
}

function StudyRoute() {
  return (
    <StudyErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: '100vh' }} aria-busy="true" />}>
        <StudyHubRoom />
      </Suspense>
    </StudyErrorBoundary>
  )
}

function DivanRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const forceIntro = location.state?.forceIntro === true || new URLSearchParams(location.search).get('intro') === '1'
  const shouldSkipIntro = !forceIntro && window.localStorage.getItem(SKIP_INTRO_KEY) === 'true'

  useEffect(() => {
    if (shouldSkipIntro) {
      navigate('/court', { replace: true })
    }
  }, [navigate, shouldSkipIntro])

  if (shouldSkipIntro) return null

  return (
    <DivanIntro
      onEnter={() => navigate('/court')}
      skipKey={SKIP_INTRO_KEY}
    />
  )
}

function AppRoutes() {
  const { ground } = useGround()

  return (
    <div className="app-shell" data-ground={ground}>
      <Routes>
        <Route path="/" element={<DivanRoute />} />
        <Route element={<CourtLayout />}>
          <Route path="/court" element={<TheCourt />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/today" element={<TodayView />} />
        </Route>
        <Route path="/study" element={<StudyRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <GroundProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </GroundProvider>
  )
}
