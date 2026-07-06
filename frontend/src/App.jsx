import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import CalendarView from './components/CalendarView.jsx'
import CourtLayout from './components/CourtLayout.jsx'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'
import { GroundProvider, useGround } from './lib/groundContext.jsx'

const SKIP_INTRO_KEY = 'life-os.skip-intro'

function DivanRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const forceIntro = location.state?.forceIntro === true
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
        </Route>
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
