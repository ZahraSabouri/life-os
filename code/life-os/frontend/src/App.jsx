import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import CalendarView from './components/CalendarView.jsx'
import CourtLayout from './components/CourtLayout.jsx'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'
import TodayView from './components/TodayView.jsx'
import LedgerView from './components/LedgerView.jsx'
import StudyHub from './components/study/StudyHub.jsx'
import { GroundProvider, useGround } from './lib/groundContext.jsx'

const SKIP_INTRO_KEY = 'life-os.skip-intro'

// Life OS-owned way home. It sits above the sub-app frame so Summer Rescue's
// own code and layout stay untouched; bottom-left avoids its header controls.
const backPillStyle = {
  position: 'fixed',
  left: 'calc(12px + env(safe-area-inset-left, 0px))',
  bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
  zIndex: 101,
  padding: '6px 12px',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: 999,
  background: 'rgba(28, 30, 33, 0.62)',
  color: '#f6f1e7',
  font: "600 12px/1.2 'Manrope', system-ui, sans-serif",
  letterSpacing: '0.02em',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
  cursor: 'pointer',
  opacity: 0.85,
}

// Each standalone app keeps its own document, CSS and runtime inside a
// same-origin frame, so nothing about its appearance or behaviour changes.
function SubAppFrame({ route, documentPath, title }) {
  const navigate = useNavigate()
  const frameRef = useRef(null)
  const initialUrl = useRef(`${documentPath}${window.location.hash}`)
  const childRef = useRef(null)
  function syncHash() {
    if (childRef.current) window.history.replaceState(window.history.state, '', `${route}${childRef.current.location.hash}`)
  }
  function onLoad() {
    childRef.current?.removeEventListener('hashchange', syncHash)
    childRef.current = frameRef.current.contentWindow
    childRef.current.addEventListener('hashchange', syncHash)
    syncHash()
  }
  useEffect(() => {
    // Some sub-apps use history.replaceState, which does not emit hashchange.
    // Mirror the fragment so a Life OS reload restores the same view.
    const timer = window.setInterval(() => {
      const child = frameRef.current?.contentWindow
      if (child && window.location.hash !== child.location.hash) {
        window.history.replaceState(window.history.state, '', `${route}${child.location.hash}`)
      }
    }, 250)
    return () => {
      window.clearInterval(timer)
      childRef.current?.removeEventListener('hashchange', syncHash)
    }
  }, [route])
  return (
    <>
      <iframe
        ref={frameRef}
        onLoad={onLoad}
        src={initialUrl.current}
        title={title}
        allow="fullscreen; autoplay"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, display: 'block', zIndex: 100 }}
      />
      <button type="button" onClick={() => navigate('/court')} style={backPillStyle} aria-label="Back to Life OS">
        ← Life OS
      </button>
    </>
  )
}

function StudyRoute() {
  return <SubAppFrame route="/study-legacy" documentPath="/apps/summer-rescue/" title="Summer Rescue Plan" />
}

function CardiffLifeRoute() {
  return <SubAppFrame route="/cardiff-life" documentPath="/apps/cardiff-life/" title="Cardiff Life" />
}

function BudgetRoute() {
  return <SubAppFrame route="/budget" documentPath="/apps/budget/" title="Everyday · Budget Management" />
}

function JobMapRoute() {
  return <SubAppFrame route="/jobmap" documentPath="/apps/jobmap/" title="JobMap" />
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
          <Route path="/ledger" element={<LedgerView />} />
        </Route>
        <Route path="/study" element={<StudyHub />} />
        <Route path="/study-legacy" element={<StudyRoute />} />
        <Route path="/cardiff-life" element={<CardiffLifeRoute />} />
        <Route path="/budget" element={<BudgetRoute />} />
        <Route path="/jobmap" element={<JobMapRoute />} />
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
