import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/skins.css'
import './styles/day.css'
import './styles/focus.css'
import './styles/review.css'
import './styles/planner.css'
import './styles/entry-editor.css'
import './styles/guide.css'
import './styles/journal.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

