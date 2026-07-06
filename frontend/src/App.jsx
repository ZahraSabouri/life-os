import { useState } from 'react'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'

const SKIP_INTRO_KEY = 'life-os.skip-intro'

function getInitialScreen() {
  return window.localStorage.getItem(SKIP_INTRO_KEY) === 'true' ? 'court' : 'divan'
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen)

  return screen === 'divan'
    ? <DivanIntro onEnter={() => setScreen('court')} skipKey={SKIP_INTRO_KEY} />
    : <TheCourt onDivan={() => setScreen('divan')} />
}

