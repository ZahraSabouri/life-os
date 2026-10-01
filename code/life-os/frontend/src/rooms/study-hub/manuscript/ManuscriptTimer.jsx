import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStudyPortalHost } from '../studyPortal.js'
import { Diamond, alpha, paletteFor } from './ManuscriptPrimitives.jsx'
import './overlays.css'

const MODE_META = {
  focus: { label: 'Focus', shortLabel: 'focus', minutes: 25 },
  short: { label: 'Short break', shortLabel: 'short', minutes: 5 },
  long: { label: 'Long break', shortLabel: 'long', minutes: 15 },
}

const GROUNDS = ['paper', 'madder', 'indigo']
const GROUND_SWATCH = {
  paper: '#b97c2d',
  madder: '#7d2a20',
  indigo: '#171b2c',
}
const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function resolvedGround(ground) {
  return GROUNDS.includes(ground) ? ground : 'paper'
}

function formatClock(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60)
  const rest = Math.max(0, seconds) % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function formatEndTime(seconds) {
  const end = new Date(Date.now() + Math.max(0, seconds) * 1000)
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(end)
}

function localDay() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    ;[660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const startsAt = context.currentTime + index * 0.18
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      gain.connect(context.destination)
      gain.gain.setValueAtTime(0.0001, startsAt)
      gain.gain.exponentialRampToValueAtTime(0.16, startsAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.58)
      oscillator.start(startsAt)
      oscillator.stop(startsAt + 0.6)
    })
    window.setTimeout(() => context.close?.(), 1000)
  } catch {
    /* Audio is optional and may be blocked by the browser. */
  }
}

function paletteVariables(palette, ground) {
  return {
    '--ms-overlay-bg': palette.bg,
    '--ms-overlay-bg-2': palette.bg2 ?? palette.bg,
    '--ms-overlay-ink': palette.ink,
    '--ms-overlay-sub': palette.sub,
    '--ms-overlay-line': palette.line ?? alpha(palette.ink, 0.2),
    '--ms-overlay-gold': palette.gold,
    '--ms-overlay-red': palette.red ?? palette.coral,
    '--ms-overlay-accent': ground === 'paper' ? '#2a8f84' : '#72b5aa',
    '--ms-overlay-deep': palette.deep ?? palette.bg,
    '--ms-overlay-button-text': palette.bg,
    '--ms-overlay-panel': ground === 'madder' ? '#7d2a20' : ground === 'indigo' ? '#1c2340' : palette.bg,
    '--ms-overlay-dim': alpha(palette.deep ?? '#2a1207', ground === 'paper' ? 0.35 : 0.5),
  }
}

function visibleFocusable(container) {
  return Array.from(container?.querySelectorAll(FOCUSABLE) ?? []).filter(
    (element) => element.offsetParent !== null && element.getAttribute('aria-hidden') !== 'true',
  )
}

function lockOverlayBackground(portalHost) {
  const body = document.body
  const bodyCount = Number(body.dataset.manuscriptOverlayLocks || 0)
  if (bodyCount === 0) {
    body.dataset.manuscriptOverlayHadClass = body.classList.contains('manuscript-overlay-open') ? '1' : '0'
    body.classList.add('manuscript-overlay-open')
  }
  body.dataset.manuscriptOverlayLocks = String(bodyCount + 1)

  const background = portalHost?.querySelector(':scope > .srp-shell') ?? null
  if (background) {
    const backgroundCount = Number(background.dataset.manuscriptOverlayLocks || 0)
    if (backgroundCount === 0) {
      background.dataset.manuscriptOverlayHadInert = background.hasAttribute('inert') ? '1' : '0'
      const previousAria = background.getAttribute('aria-hidden')
      background.dataset.manuscriptOverlayAriaMissing = previousAria === null ? '1' : '0'
      if (previousAria !== null) background.dataset.manuscriptOverlayPreviousAria = previousAria
      background.setAttribute('inert', '')
      background.setAttribute('aria-hidden', 'true')
    }
    background.dataset.manuscriptOverlayLocks = String(backgroundCount + 1)
  }

  return () => {
    const nextBodyCount = Math.max(0, Number(body.dataset.manuscriptOverlayLocks || 1) - 1)
    if (nextBodyCount === 0) {
      if (body.dataset.manuscriptOverlayHadClass !== '1') body.classList.remove('manuscript-overlay-open')
      delete body.dataset.manuscriptOverlayLocks
      delete body.dataset.manuscriptOverlayHadClass
    } else {
      body.dataset.manuscriptOverlayLocks = String(nextBodyCount)
    }

    if (!background) return
    const nextBackgroundCount = Math.max(0, Number(background.dataset.manuscriptOverlayLocks || 1) - 1)
    if (nextBackgroundCount === 0) {
      if (background.dataset.manuscriptOverlayHadInert !== '1') background.removeAttribute('inert')
      if (background.dataset.manuscriptOverlayAriaMissing === '1') background.removeAttribute('aria-hidden')
      else background.setAttribute('aria-hidden', background.dataset.manuscriptOverlayPreviousAria ?? 'true')
      delete background.dataset.manuscriptOverlayLocks
      delete background.dataset.manuscriptOverlayHadInert
      delete background.dataset.manuscriptOverlayAriaMissing
      delete background.dataset.manuscriptOverlayPreviousAria
    } else {
      background.dataset.manuscriptOverlayLocks = String(nextBackgroundCount)
    }
  }
}

function moduleLabel(card) {
  const source = [card?.module, card?.moduleGroup, card?.title].filter(Boolean).join(' ')
  return source.match(/\b(?:CMT|MAT|MA)\s?\d{3,4}\b/i)?.[0]?.replace(/\s/g, '').toUpperCase() ?? card?.module ?? 'STUDY'
}

export function ManuscriptTimer({
  ground = 'paper',
  onGroundChange,
  activeCard,
  onCompleteSession,
  onClearActive,
}) {
  const currentGround = resolvedGround(ground)
  const palette = paletteFor(currentGround)
  const style = paletteVariables(palette, currentGround)
  const titleId = useId()
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const sessionElapsedRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('focus')
  const [durations, setDurations] = useState(() => Object.fromEntries(
    Object.entries(MODE_META).map(([key, value]) => [key, value.minutes]),
  ))
  const [remaining, setRemaining] = useState(MODE_META.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [chimeEnabled, setChimeEnabled] = useState(true)
  const activeCardId = activeCard?.id

  const total = durations[mode] * 60
  const progress = total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0
  const radius = 172
  const circumference = 2 * Math.PI * radius
  const sessionsToday = useMemo(() => {
    const today = localDay()
    return (activeCard?.focusSessions ?? []).filter((session) => session.at?.slice(0, 10) === today).length
  }, [activeCard?.focusSessions])

  const close = useCallback(() => setOpen(false), [])

  const logActiveSession = useCallback(() => {
    const elapsed = sessionElapsedRef.current
    sessionElapsedRef.current = 0
    if (!activeCard || elapsed < 60) return 0
    const minutes = Math.max(1, Math.round(elapsed / 60))
    onCompleteSession?.(activeCard.id, minutes)
    return minutes
  }, [activeCard, onCompleteSession])

  useEffect(() => {
    if (!activeCardId) return undefined
    const id = window.setTimeout(() => {
      sessionElapsedRef.current = 0
      setMode('focus')
      setRemaining(durations.focus * 60)
      setRunning(false)
      setOpen(true)
    }, 0)
    return () => window.clearTimeout(id)
    // A duration edit must not reopen/reset a running card; this is intentionally keyed to the card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCardId])

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      if (mode === 'focus' && activeCard) sessionElapsedRef.current += 1
      setRemaining((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [activeCard, mode, running])

  useEffect(() => {
    if (remaining !== 0 || !running) return undefined
    const id = window.setTimeout(() => {
      setRunning(false)
      if (chimeEnabled) playChime()
      const completedFocus = mode === 'focus'
      const nextSessionCount = completedFocus ? sessions + 1 : sessions
      if (completedFocus) {
        logActiveSession()
        setSessions(nextSessionCount)
      }
      const nextMode = completedFocus ? (nextSessionCount % 4 === 0 ? 'long' : 'short') : 'focus'
      setMode(nextMode)
      setRemaining(durations[nextMode] * 60)
    }, 0)
    return () => window.clearTimeout(id)
  }, [chimeEnabled, durations, logActiveSession, mode, remaining, running, sessions])

  useEffect(() => {
    if (!open) return undefined
    const portalHost = getStudyPortalHost()
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current
    const releaseLock = lockOverlayBackground(portalHost)
    const focusId = window.setTimeout(() => {
      const focusable = visibleFocusable(dialogRef.current)
      ;(focusable[0] ?? dialogRef.current)?.focus()
    }, 0)

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = visibleFocusable(dialogRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusId)
      document.removeEventListener('keydown', onKeyDown)
      releaseLock()
      previousActiveElement?.focus()
    }
  }, [close, open])

  function selectMode(nextMode) {
    if (mode === 'focus' && nextMode !== 'focus') logActiveSession()
    setMode(nextMode)
    setRemaining(durations[nextMode] * 60)
    setRunning(false)
  }

  function adjustDuration(delta) {
    setDurations((current) => {
      const minutes = Math.max(1, Math.min(120, current[mode] + delta))
      if (!running) setRemaining(minutes * 60)
      return { ...current, [mode]: minutes }
    })
  }

  function toggleRunning() {
    if (running) logActiveSession()
    setRunning((value) => !value)
  }

  function logAndReset() {
    if (mode === 'focus') logActiveSession()
    setRunning(false)
    setRemaining(durations[mode] * 60)
  }

  function abandon() {
    sessionElapsedRef.current = 0
    setRunning(false)
    setRemaining(durations[mode] * 60)
    setOpen(false)
    onClearActive?.()
  }

  const portalHost = getStudyPortalHost()
  const dialog = open && portalHost ? createPortal(
    <div className="ms-production-overlay ms-hourglass-overlay" data-ground={currentGround} style={style}>
      <section
        ref={dialogRef}
        className="ms-hourglass-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="ms-hourglass-frame" aria-hidden="true" />
        <header className="ms-hourglass-header">
          <p id={titleId}>The hourglass {running ? 'runs' : 'waits'}</p>
          <div className="ms-hourglass-chrome">
            <button
              type="button"
              className="ms-hourglass-chime"
              aria-pressed={chimeEnabled}
              onClick={() => setChimeEnabled((value) => !value)}
            >
              <Diamond color="var(--ms-overlay-accent)" size={5} />
              chime {chimeEnabled ? 'on' : 'off'} ♪
            </button>
            <fieldset className="ms-hourglass-grounds" aria-label="Change ground">
              <legend className="ms-overlay-sr-only">Change ground</legend>
              {GROUNDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`${item} ground`}
                  aria-pressed={currentGround === item}
                  onClick={() => onGroundChange?.(item)}
                >
                  <Diamond color={GROUND_SWATCH[item]} size={7} />
                </button>
              ))}
            </fieldset>
            <span className="ms-hourglass-block">block {sessions + 1} · {MODE_META[mode].shortLabel}</span>
          </div>
        </header>

        <main className="ms-hourglass-stage">
          <div className="ms-hourglass-modes" role="group" aria-label="Timer mode">
            {Object.entries(MODE_META).map(([key, item]) => (
              <button key={key} type="button" aria-pressed={mode === key} onClick={() => selectMode(key)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="ms-hourglass-dial" role="timer" aria-live="off" aria-label={`${MODE_META[mode].label}, ${formatClock(remaining)} remaining`}>
            <svg viewBox="0 0 380 380" aria-hidden="true">
              <circle className="ms-hourglass-track" cx="190" cy="190" r={radius} />
              <circle
                className="ms-hourglass-progress"
                cx="190"
                cy="190"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                transform="rotate(-90 190 190)"
              />
              {[
                [190, 16],
                [364, 190],
                [190, 364],
                [16, 190],
              ].map(([x, y], index) => (
                <rect
                  key={`${x}-${y}`}
                  x={x - 3}
                  y={y - 3}
                  width="6"
                  height="6"
                  rx="1"
                  fill={progress >= index / 4 ? palette.gold : alpha(palette.ink, 0.25)}
                  transform={`rotate(45 ${x} ${y})`}
                />
              ))}
            </svg>
            <div className="ms-hourglass-time">
              <strong>{formatClock(remaining)}</strong>
              <span>
                <button type="button" onClick={() => adjustDuration(-5)} aria-label={`Decrease ${MODE_META[mode].label} by five minutes`}>−5</button>
                <em>of {durations[mode]}m · ends {formatEndTime(remaining)}</em>
                <button type="button" onClick={() => adjustDuration(5)} aria-label={`Increase ${MODE_META[mode].label} by five minutes`}>+5</button>
              </span>
            </div>
          </div>

          <div className="ms-hourglass-card">
            <p>
              <span>{moduleLabel(activeCard)}</span>
              <strong>{activeCard?.number ? `${activeCard.number}. ` : ''}{activeCard?.title ?? 'An unlinked focus block'}</strong>
            </p>
            <small>
              {activeCard
                ? `${sessionsToday} linked today · focus minutes are written to this card`
                : 'Choose Start on a card to link the proof of time'}
            </small>
          </div>

          <div className="ms-hourglass-actions">
            <button type="button" className="is-primary" onClick={toggleRunning}>{running ? 'Pause' : 'Start'}</button>
            <button type="button" onClick={logAndReset}>{activeCard ? 'Log & reset' : 'Reset'}</button>
            <button type="button" onClick={abandon}>Abandon the block</button>
          </div>
        </main>

        <footer className="ms-hourglass-vow">
          <Diamond color="var(--ms-overlay-gold)" size={6} />
          <p>no other room may call while the glass runs — the Court holds your messages</p>
        </footer>
      </section>
    </div>,
    portalHost,
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`ms-overlay-trigger ms-hourglass-trigger${running ? ' is-running' : ''}`}
        aria-label={`Study hourglass${running ? `, ${formatClock(remaining)} remaining` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {running ? <span>{formatClock(remaining)}</span> : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3h10M7 21h10M8 3c0 4 1 6 4 9-3 3-4 5-4 9M16 3c0 4-1 6-4 9 3 3 4 5 4 9" />
          </svg>
        )}
      </button>
      {dialog}
    </>
  )
}

