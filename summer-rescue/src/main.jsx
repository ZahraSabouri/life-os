import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './hub/hub.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { HubGate } from './hub/HubGate.jsx'

// The Study hub opens on its list of semesters. Choosing one loads that semester's
// modules and plan, and only then the app itself, so nothing in the app is tied to a
// particular semester. The Focus Room tab (#/focus-room) follows the semester of the tab
// that opened it and renders only the room.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HubGate />
    </ErrorBoundary>
  </StrictMode>,
)
