// The envelope beside the bell: the count of open urgent and high things she owes, leading to the Inbox.
import { useLocation, useNavigate } from 'react-router-dom'
import { useMail } from '../../lib/useMail.js'

export default function MailEnvelope({ className = '' }) {
  const summary = useMail('/api/mail/summary', { every: 5 * 60_000 })
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const count = summary.data?.pressing ?? 0
  const label = count ? `Inbox: ${count} pressing` : 'Inbox'
  return <button type="button" className={`notice-bell mail-envelope${count ? ' has-new' : ''}${pathname.startsWith('/inbox') ? ' active' : ''} ${className}`.trim()} onClick={() => navigate('/inbox')} aria-label={label} title={count ? `${count} urgent or high ${count === 1 ? 'thing' : 'things'} waiting on you` : 'Inbox: what is waiting on you'}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
    {count ? <span className="notice-count" aria-hidden="true">{count > 9 ? '9+' : count}</span> : null}
  </button>
}
