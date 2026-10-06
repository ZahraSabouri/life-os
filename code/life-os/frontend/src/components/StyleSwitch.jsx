import { useEffect, useId, useRef, useState } from 'react'
import { GROUNDS, GROUND_LABELS, GROUND_SWATCHES, useGround } from '../lib/groundContext.jsx'

function Swatch({ ground }) {
  const [base, accent] = GROUND_SWATCHES[ground]
  return <span className="style-switch-swatch" aria-hidden="true" style={{ '--swatch-base': base, '--swatch-accent': accent }} />
}

// One style control for every page: Court, boards, Study and the framed apps.
export default function StyleSwitch({ className = '', placement = 'below', compact = false }) {
  const { ground, setGround } = useGround()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    function onPointer(event) { if (!wrapRef.current?.contains(event.target)) setOpen(false) }
    function onKey(event) { if (event.key === 'Escape') { setOpen(false); wrapRef.current?.querySelector('button')?.focus() } }
    // A framed app swallows clicks, so leaving the control also closes its menu.
    function onBlur() { setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [open])

  return (
    <div className={`style-switch style-switch-${placement}${open ? ' is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`style-switch-trigger ${className}`.trim()}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Change style. Current style: ${GROUND_LABELS[ground]}`}
        onClick={() => setOpen(current => !current)}
      >
        <Swatch ground={ground} />
        <span className="style-switch-label">{compact ? 'Style' : `Style: ${GROUND_LABELS[ground]}`}</span>
      </button>
      {open && (
        <div className="style-switch-menu" id={menuId} role="group" aria-label="Choose a style">
          {GROUNDS.map(option => (
            <button
              type="button"
              key={option}
              className="style-switch-option"
              aria-pressed={option === ground}
              onClick={() => { setGround(option); setOpen(false) }}
            >
              <Swatch ground={option} />
              <span>{GROUND_LABELS[option]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
