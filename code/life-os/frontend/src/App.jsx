import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import CalendarView from './components/CalendarView.jsx'
import CourtLayout from './components/CourtLayout.jsx'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'
import TodayView from './components/TodayView.jsx'
import LedgerView from './components/LedgerView.jsx'
import PlannerView from './components/PlannerView.jsx'
import ReviewView from './components/ReviewView.jsx'
import GuideView from './components/GuideView.jsx'
import JournalView from './components/JournalView.jsx'
import PeopleView from './components/PeopleView.jsx'
import RoomView from './components/RoomView.jsx'
import StudyHub from './components/study/StudyHub.jsx'
import { FocusProvider } from './lib/focus.jsx'
import { NoticesProvider } from './lib/notices.jsx'
import { GroundProvider, useGround } from './lib/groundContext.jsx'

const SKIP_INTRO_KEY = 'life-os.skip-intro'

// Each attached app keeps its own document and runtime inside a same-origin frame, under
// the Life OS top bar like every other page. Its look comes from the chosen style: the
// host adds the shared skin files to its page (hosting/skins).
function SubAppFrame({ route, documentPath, title }) {
  const frameRef = useRef(null)
  const location = useLocation()
  const arrived = useRef(false)
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
  // A Life OS link to another view of the app that is already open (the strip's next job, a
  // shopping list) changes only the fragment. Hand it to the app: it moves without reloading.
  useEffect(() => {
    if (!arrived.current) { arrived.current = true; return }
    const child = frameRef.current?.contentWindow
    try {
      if (child && location.hash && child.location.pathname.startsWith(documentPath) && child.location.hash !== location.hash) child.location.hash = location.hash
    } catch { /* the app is still loading; it reads the address itself when it starts */ }
  }, [location.key, location.hash, documentPath])
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
    <iframe
      ref={frameRef}
      onLoad={onLoad}
      src={initialUrl.current}
      title={title}
      className="subapp-frame"
      allow="fullscreen; autoplay"
    />
  )
}

function StudyRoute() {
  return <SubAppFrame route="/study" documentPath="/apps/summer-rescue/" title="Study hub" />
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
  const { ground, scheme } = useGround()
  return (
    <div className="app-shell" data-ground={ground} data-mode={scheme}>
      <Routes>
        <Route path="/" element={<DivanRoute />} />
        <Route element={<CourtLayout />}>
          <Route path="/court" element={<TheCourt />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/today" element={<TodayView />} />
          <Route path="/review" element={<ReviewView />} />
          <Route path="/planner" element={<PlannerView />} />
          <Route path="/ledger" element={<LedgerView />} />
          <Route path="/guide" element={<GuideView />} />
          <Route path="/guide/:chapter" element={<GuideView />} />
          <Route path="/journal" element={<JournalView />} />
          <Route path="/people" element={<PeopleView />} />
          <Route path="/room/:slug" element={<RoomView />} />
          <Route path="/study" element={<StudyRoute />} />
          <Route path="/cardiff-life" element={<CardiffLifeRoute />} />
          <Route path="/budget" element={<BudgetRoute />} />
          <Route path="/jobmap" element={<JobMapRoute />} />
        </Route>
        {/* The database-backed Study records (this semester's timetable, assessments and materials) until the Study hub reads them itself. */}
        <Route path="/study-native" element={<StudyHub />} />
        <Route path="/study-legacy" element={<Navigate to="/study" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <GroundProvider>
      <BrowserRouter>
        <NoticesProvider>
          <FocusProvider>
            <AppRoutes />
          </FocusProvider>
        </NoticesProvider>
      </BrowserRouter>
    </GroundProvider>
  )
}
