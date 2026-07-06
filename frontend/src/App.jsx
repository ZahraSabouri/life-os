import { useState } from 'react'
import DivanIntro from './components/DivanIntro.jsx'
import TheCourt from './components/TheCourt.jsx'

const SKIP_INTRO_KEY = 'life-os.skip-intro'
const GROUND_KEY = 'life-os.ground'
const GROUNDS = ['madder', 'indigo', 'paper']

function getInitialScreen() {
  return window.localStorage.getItem(SKIP_INTRO_KEY) === 'true' ? 'court' : 'divan'
}

function getInitialGround() {
  const savedGround = window.localStorage.getItem(GROUND_KEY)
  return GROUNDS.includes(savedGround) ? savedGround : GROUNDS[0]
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen)
  const [ground, setGround] = useState(getInitialGround)

  function cycleGround() {
    setGround((currentGround) => {
      const nextGround = GROUNDS[(GROUNDS.indexOf(currentGround) + 1) % GROUNDS.length]
      window.localStorage.setItem(GROUND_KEY, nextGround)
      return nextGround
    })
  }

  return (
    <div className="app-shell" data-ground={ground}>
      {screen === 'divan'
        ? (
          <DivanIntro
            ground={ground}
            onEnter={() => setScreen('court')}
            onGround={cycleGround}
            skipKey={SKIP_INTRO_KEY}
          />
        )
        : (
          <TheCourt
            ground={ground}
            onDivan={() => setScreen('divan')}
            onGround={cycleGround}
          />
        )}
    </div>
  )
}
