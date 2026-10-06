import { createContext, useContext, useMemo, useState } from 'react'
import { GROUND_KEY, GROUNDS, nextGround, readGround } from './grounds.js'

export { GROUNDS, GROUND_LABELS, GROUND_SWATCHES } from './grounds.js'

const GroundContext = createContext(null)

function saveGround(ground) {
  try { window.localStorage.setItem(GROUND_KEY, ground) } catch { /* The style still changes for this visit. */ }
}

export function GroundProvider({ children }) {
  const [ground, setCurrentGround] = useState(() => readGround(window.localStorage))

  const value = useMemo(() => ({
    ground,
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
  }), [ground])

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
