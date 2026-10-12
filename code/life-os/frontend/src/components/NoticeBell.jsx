// The bell in the top bar of every page, and the list it opens: notices from every part of
// Life OS (what is on now, what starts soon, what today asks for, what slipped, what is close).
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { NOTICE_GROUPS, useNotices } from '../lib/notices.jsx'

export function NoticeBell({ className = '' }) {
  const notices = useNotices()
  if (!notices) return null
  const count = notices.unseen.length
  return (
    <button
      type="button"
      className={`notice-bell${count ? ' has-new' : ''} ${className}`.trim()}
      onClick={notices.toggle}
      aria-expanded={notices.open}
      aria-controls="notice-panel"
      aria-label={count ? `Notices: ${count} new` : 'Notices'}
      title={count ? `${count} new ${count === 1 ? 'notice' : 'notices'}` : 'Notices'}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" /><path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      {count ? <span className="notice-count" aria-hidden="true">{count > 9 ? '9+' : count}</span> : null}
    </button>
  )
}

export function NoticePanel() {
  const notices = useNotices()
  const panel = useRef(null)
  useEffect(() => {
    if (!notices?.open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') notices.setOpen(false) }
    const onDown = (event) => { if (panel.current && !panel.current.contains(event.target) && !event.target.closest?.('.notice-bell')) notices.setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [notices])
  if (!notices) return null
  const all = notices.notices
  const blocked = notices.permission === 'denied'
  return (
    <aside id="notice-panel" ref={panel} className={`focus-panel notice-panel${notices.open ? ' is-open' : ''}`} aria-label="Notices" inert={!notices.open}>
      <header>
        <h2>Notices</h2>
        <span className="notice-head-actions">
          {notices.unseen.length ? <button type="button" onClick={() => notices.markSeen(notices.unseen.map((notice) => notice.id))}>Mark all as seen</button> : null}
          <button type="button" className="is-quiet" onClick={() => notices.setOpen(false)} aria-label="Close">×</button>
        </span>
      </header>
      {all.length ? NOTICE_GROUPS.map(([level, name]) => {
        const group = all.filter((notice) => notice.level === level)
        if (!group.length) return null
        return <section className="focus-part notice-group" key={level} aria-label={name}>
          <h3>{name}</h3>
          <ul>
            {group.map((notice) => {
              const seen = Boolean(notices.seen[notice.id])
              return <li key={notice.id} className={seen ? 'is-seen' : undefined} data-area={notice.area}>
                <Link to={notice.href} onClick={() => { notices.markSeen([notice.id]); notices.setOpen(false) }}>
                  <b>{notice.title}</b>
                  {notice.detail ? <small>{notice.detail}</small> : null}
                </Link>
                {seen ? null : <button type="button" className="is-quiet" onClick={() => notices.markSeen([notice.id])} aria-label={`Seen: ${notice.title}`} title="Seen">✓</button>}
              </li>
            })}
          </ul>
        </section>
      }) : <p className="focus-note">Nothing needs you right now. Classes, study blocks, plans, jobs closing, things to buy and renewals show here when they come up.</p>}
      <section className="focus-part notice-settings" aria-label="How to be told">
        <label className="notice-desktop">
          <input type="checkbox" checked={notices.desktop} disabled={blocked || notices.permission === 'unsupported'} onChange={(event) => notices.setDesktop(event.target.checked)} />
          <span>Also tell me on this computer</span>
        </label>
        {notices.desktop ? <label className="notice-before"><span>before something starts</span>
          <select value={notices.minutesBefore} onChange={(event) => notices.setMinutesBefore(event.target.value)}>{[5, 10, 15, 30].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</select>
        </label> : null}
        <p className="focus-note">{blocked ? 'This browser has notifications blocked for Life OS. Allow them in the address bar (the padlock) to switch this on.'
          : notices.permission === 'unsupported' ? 'This browser cannot show notifications.'
            : notices.desktop ? 'A notification appears a few minutes before a class, a study block or a plan starts, once a day for what today asks for, and when a focus session ends. Life OS has to be open in a tab.'
              : 'Switch this on to get a notification before a class, a study block or a plan starts, even when Life OS is in another tab.'}</p>
      </section>
    </aside>
  )
}
