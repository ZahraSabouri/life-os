import { createContext, useContext, useMemo, useState } from 'react'

const GROUND_KEY = 'life-os.ground'
const GROUNDS = ['madder', 'indigo', 'paper']
const GroundContext = createContext(null)

function getInitialGround() {
  const savedGround = window.localStorage.getItem(GROUND_KEY)
  return GROUNDS.includes(savedGround) ? savedGround : GROUNDS[0]
}

export function GroundProvider({ children }) {
  const [ground, setGround] = useState(getInitialGround)

  const value = useMemo(() => ({
    ground,
    cycleGround() {
      setGround((currentGround) => {
        const nextGround = GROUNDS[(GROUNDS.indexOf(currentGround) + 1) % GROUNDS.length]
        window.localStorage.setItem(GROUND_KEY, nextGround)
        return nextGround
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
