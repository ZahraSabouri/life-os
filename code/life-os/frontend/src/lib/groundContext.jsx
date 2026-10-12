import { createContext, useContext, useMemo, useState } from 'react'
import { GROUND_KEY, GROUND_MODES, GROUNDS, MODE_KEY, nextGround, readGround, readMode, schemeFor } from './grounds.js'

export { GROUNDS, GROUND_LABELS, GROUND_SWATCHES } from './grounds.js'

const GroundContext = createContext(null)

function saveGround(ground) {
  try { window.localStorage.setItem(GROUND_KEY, ground) } catch { /* The style still changes for this visit. */ }
}

function saveMode(mode) {
  try { window.localStorage.setItem(MODE_KEY, mode) } catch { /* The page still changes for this visit. */ }
}

export function GroundProvider({ children }) {
  const [ground, setCurrentGround] = useState(() => readGround(window.localStorage))
  const [mode, setCurrentMode] = useState(() => readMode(window.localStorage))

  const value = useMemo(() => ({
    ground,
    // Light or dark as it is drawn now, and whether this style has the other one.
    scheme: schemeFor(ground, mode),
    canSwitchMode: GROUND_MODES[ground].length > 1,
    toggleMode() {
      if (GROUND_MODES[ground].length < 2) return
      const next = schemeFor(ground, mode) === 'dark' ? 'light' : 'dark'
      saveMode(next)
      setCurrentMode(next)
    },
    setGround(nextValue) {
      if (!GROUNDS.includes(nextValue)) return
      saveGround(nextValue)
      setCurrentGround(nextValue)
    },
    cycleGround() {
      setCurrentGround((currentGround) => {
        const nextValue = nextGround(currentGround)
        saveGround(nextValue)
        return nextValue
      })
    }
  }), [ground, mode])

  return (
    <GroundContext.Provider value={value}>
      {children}
    </GroundContext.Provider>
  )
}

export function useGround() {
  const value = useContext(GroundContext)

  if (!value) {
    throw new Error('useGround must be used inside GroundProvider')
  }

  return value
}
