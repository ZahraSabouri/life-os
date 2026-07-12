import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStudyPortalHost } from '../studyPortal.js'
import { formatDate } from '../utils/progress.js'
import { Diamond, alpha, paletteFor } from './ManuscriptPrimitives.jsx'
import './overlays.css'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'overdue', label: 'Overdue' },
]
const GROUNDS = ['paper', 'madder', 'indigo']
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

function noticeValues(notifications) {
  const values = Array.isArray(notifications) ? notifications : Object.values(notifications ?? {})
  return values.filter(Boolean).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

function toneForNotice(notice, palette) {
  if (notice.rule === 'overdue' || notice.rule === 'blocked' || notice.type === 'danger') return palette.red ?? palette.coral
  if (notice.rule === 'due-today' || notice.rule === 'due-tomorrow' || notice.type === 'warning') return palette.gold
  if (notice.type === 'success') return '#2a8f84'
  return palette.sub
}

function actionLabel(notice) {
  if (notice.cardId) return notice.rule === 'overdue' ? 'open the card' : notice.rule === 'blocked' ? 'chase · move lane' : 'open'
  if (notice.rule === 'exam-countdown') return 'see the descent'
  if (notice.rule === 'backup-stale') return 'write backup now'
  if (notice.rule === 'mat700-paused') return 'review the lane'
  return 'open'
}

function moduleCode(notice) {
  const text = `${notice.title ?? ''} ${notice.detail ?? ''}`
  return text.match(/\b(?:CMT|MAT|MA)\s?\d{3,4}\b/i)?.[0]?.replace(/\s/g, '').toUpperCase() ?? ''
}

function sentenceCount(value) {
  if (value === 0) return 'No'
  if (value === 1) return 'One'
  if (value === 2) return 'Two'
  if (value === 3) return 'Three'
  if (value === 4) return 'Four'
  if (value === 5) return 'Five'
  if (value === 6) return 'Six'
  return String(value)
}

export function ManuscriptHerald({
  ground = 'paper',
  notifications,
  referenceDate,
  onGoView,
  onOpenCard,
  onSetRead,
  onMarkAllRead,
}) {
  const currentGround = resolvedGround(ground)
  const palette = paletteFor(currentGround)
  const style = paletteVariables(palette, currentGround)
  const titleId = useId()
  const panelId = useId()
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const notices = useMemo(() => noticeValues(notifications), [notifications])
  const unreadCount = notices.filter((notice) => !notice.read).length
  const overdueCount = notices.filter((notice) => notice.rule === 'overdue').length
  const asksToday = notices.filter((notice) => ['due-today', 'overdue', 'blocked'].includes(notice.rule)).length
  const filteredNotices = notices.filter((notice) => {
    if (tab === 'unread') return !notice.read
    if (tab === 'overdue') return notice.rule === 'overdue'
    return true
  })

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined
    const portalHost = getStudyPortalHost()
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current
    const releaseLock = lockOverlayBackground(portalHost)
    const focusId = window.setTimeout(() => {
      const focusable = visibleFocusable(panelRef.current)
      ;(focusable[0] ?? panelRef.current)?.focus()
    }, 0)

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = visibleFocusable(panelRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        panelRef.current?.focus()
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

  function countFor(tabId) {
    if (tabId === 'unread') return unreadCount
    if (tabId === 'overdue') return overdueCount
    return notices.length
  }

  function runAction(notice) {
    onSetRead?.(notice.id, true)
    if (notice.cardId) onOpenCard?.(notice.cardId)
    else if (notice.rule === 'exam-countdown') onGoView?.('progress')
    else if (notice.rule === 'backup-stale') onGoView?.('dashboard')
    else if (notice.rule === 'mat700-paused') onGoView?.('mat700')
    close()
  }

  const portalHost = getStudyPortalHost()
  const drawer = open && portalHost ? createPortal(
    <div className="ms-production-overlay ms-herald-overlay" data-ground={currentGround} style={style}>
      <button type="button" className="ms-herald-backdrop" onClick={close} aria-label="Close the Herald" />
      <aside
        ref={panelRef}
        id={panelId}
        className="ms-herald-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="ms-herald-frame" aria-hidden="true" />
        <div className="ms-herald-content">
          <header className="ms-herald-header">
            <div className="ms-herald-rubric-row">
              <p id={titleId}>The Herald</p>
              <button type="button" onClick={onMarkAllRead} disabled={!unreadCount}>mark all read</button>
              <button type="button" className="ms-herald-close" onClick={close} aria-label="Close the Herald">×</button>
            </div>
            <h2>
              {sentenceCount(notices.length)} {notices.length === 1 ? 'tiding' : 'tidings'}.
              {' '}{sentenceCount(asksToday)} {asksToday === 1 ? 'asks' : 'ask'} for today.
            </h2>
            <div className="ms-herald-tabs" role="tablist" aria-label="Notification filters">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`${panelId}-list`}
                  onClick={() => setTab(item.id)}
                >
                  {item.label} <span>{countFor(item.id)}</span>
                </button>
              ))}
            </div>
          </header>

          <div
            id={`${panelId}-list`}
            className="ms-herald-list"
            role="tabpanel"
            aria-label={`${TABS.find((item) => item.id === tab)?.label} notifications`}
          >
            {filteredNotices.length === 0 && (
              <div className="ms-herald-empty">
                <Diamond color="var(--ms-overlay-accent)" size={7} />
                <div>
                  <strong>All clear</strong>
                  <p>No tidings wait in this folio.</p>
                </div>
              </div>
            )}
            {filteredNotices.map((notice) => {
              const code = moduleCode(notice)
              const tone = toneForNotice(notice, palette)
              return (
                <article key={notice.id} className={`ms-herald-notice${notice.read ? ' is-read' : ' is-unread'}`}>
                  <span className="ms-herald-notice-mark" aria-hidden="true">
                    <Diamond color={tone} size={7} />
                    {!notice.read && <i />}
                  </span>
                  <div className="ms-herald-notice-body">
                    <div className="ms-herald-notice-title">
                      <strong style={{ color: notice.type === 'danger' ? 'var(--ms-overlay-red)' : undefined }}>{notice.title}</strong>
                      <span />
                      {code && <b>{code}</b>}
                      <time dateTime={notice.createdAt}>{formatDate(notice.createdAt)}</time>
                    </div>
                    {notice.detail && <p>{notice.detail}</p>}
                    <div className="ms-herald-notice-actions">
                      <button type="button" onClick={() => runAction(notice)}>{actionLabel(notice)} ›</button>
                      <button
                        type="button"
                        onClick={() => onSetRead?.(notice.id, !notice.read)}
                        aria-label={`Mark ${notice.title} ${notice.read ? 'unread' : 'read'}`}
                      >
                        mark {notice.read ? 'unread' : 'read'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <footer className="ms-herald-footer">
            <Diamond color="var(--ms-overlay-gold)" size={6} />
            <p>
              quiet hours hold — the herald keeps count, and speaks only when spoken to
              {referenceDate ? ` · ${formatDate(referenceDate)}` : ''}
            </p>
          </footer>
        </div>
      </aside>
    </div>,
    portalHost,
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`ms-overlay-trigger ms-herald-trigger${unreadCount ? ' has-unread' : ''}`}
        aria-label={`The Herald${unreadCount ? `, ${unreadCount} unread` : ', all read'}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {drawer}
    </>
  )
}
