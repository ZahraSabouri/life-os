// Inbox: what is in her mailboxes and who she owes. Three pages under one heading: Waiting on you,
// Mail, and the Harvest log (what came in, day by day; it replaced Digests on 3 November 2026).
// Mail is harvested by the scheduled tasks (mail/HARVEST.md); Life OS only reads it, and never
// sends, deletes or files anything.
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLondonToday } from '../../lib/useCalendar.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import InboxWaiting from './InboxWaiting.jsx'
import InboxMail from './InboxMail.jsx'
import InboxLog from './InboxLog.jsx'
import '../../styles/inbox.css'

export const INBOX_PAGES = [['', 'Waiting on you'], ['mail', 'Mail'], ['log', 'Harvest log']]

export default function InboxView() {
  const { view = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const today = useLondonToday()
  if (view === 'digests') return <Navigate to={`/inbox/log${search}`} replace />
  const page = INBOX_PAGES.some(([key]) => key === view) ? view : ''
  return <section className="today-layout unified-today day-page mail-page" aria-label="Inbox">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Inbox</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{formatCalendarDay(today, { weekday: 'long', month: 'long' })}</time></div>
    </header>
    <nav className="day-add-kind mail-tabs" aria-label="Inbox pages">
      {INBOX_PAGES.map(([key, label]) => <button key={key || 'waiting'} type="button" aria-pressed={page === key} onClick={() => navigate(key ? `/inbox/${key}` : '/inbox')}>{label}</button>)}
    </nav>
    {page === 'mail' ? <InboxMail params={params} setParams={setParams} /> : page === 'log' ? <InboxLog params={params} setParams={setParams} /> : <InboxWaiting focus={params.get('action')} />}
  </section>
}
