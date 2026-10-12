import { useGround } from '../lib/groundContext.jsx'

// One light/dark button in the top bar of every page and every part of Life OS. It shows in
// a style that has both versions (Modern); the other styles have one look and no button.
export default function ModeSwitch({ className = '' }) {
  const { scheme, canSwitchMode, toggleMode } = useGround()
  if (!canSwitchMode) return null
  const label = `Switch to ${scheme === 'dark' ? 'light' : 'dark'}`
  return (
    <button
      type="button"
      className={`mode-switch ${className}`.trim()}
      onClick={toggleMode}
      aria-label={label}
      title={label}
      data-scheme={scheme}
    >
      <span className="mode-switch-mark" aria-hidden="true" />
      <span className="mode-switch-label">{scheme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
