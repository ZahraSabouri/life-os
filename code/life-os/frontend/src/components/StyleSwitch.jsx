import { useEffect, useId, useRef } from 'react'
import { usePanel } from '../lib/addresses.js'
import { GROUNDS, GROUND_LABELS, GROUND_SWATCHES, useGround } from '../lib/groundContext.jsx'

function Swatch({ ground }) {
  const [base, accent] = GROUND_SWATCHES[ground]
  return <span className="style-switch-swatch" aria-hidden="true" style={{ '--swatch-base': base, '--swatch-accent': accent }} />
}

// One style control for every page: Court, boards, Study and the framed apps. Its menu is in the
// address (?panel=style), so Back closes it.
export default function StyleSwitch({ className = '', placement = 'below', compact = false }) {
  const { ground, setGround } = useGround()
  const [open, setOpen] = usePanel('style')
  const wrapRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    function onPointer(event) { if (!wrapRef.current?.contains(event.target)) setOpen(false, { inPlace: true }) }
    function onKey(event) { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { setOpen(false); wrapRef.current?.querySelector('button')?.focus() } }
    // A framed app swallows clicks, so leaving the control also closes its menu.
    function onBlur() { setOpen(false, { inPlace: true }) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [open, setOpen])

  return (
    <div className={`style-switch style-switch-${placement}${open ? ' is-open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`style-switch-trigger ${className}`.trim()}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Change style. Current style: ${GROUND_LABELS[ground]}`}
        onClick={() => setOpen(!open)}
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
