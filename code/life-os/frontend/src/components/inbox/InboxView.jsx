// Inbox: what came in and what is owed. Four pages under one heading: the Desk (what came in as
// things, by domain; stage 6), Waiting on you, the Harvest log (each day, and everything), and
// Messages (the mail itself, kept as evidence). Life OS only reads mail: it never sends, deletes or
// files anything. Older addresses still lead to the right page.
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLondonToday } from '../../lib/useCalendar.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import InboxDesk from './InboxDesk.jsx'
import InboxWaiting from './InboxWaiting.jsx'
import InboxMail from './InboxMail.jsx'
import InboxLog from './InboxLog.jsx'
import '../../styles/inbox.css'

export const INBOX_PAGES = [['', 'Desk'], ['waiting', 'Waiting on you'], ['log', 'Harvest log'], ['messages', 'Messages']]
const MOVED = { digests: 'log', mail: 'messages' }

export default function InboxView() {
  const { view = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const today = useLondonToday()
  if (MOVED[view]) return <Navigate to={`/inbox/${MOVED[view]}${search}`} replace />
  // "/inbox?action=…" was Waiting on you before the Desk took the first page.
  if (!view && params.get('action')) return <Navigate to={`/inbox/waiting${search}`} replace />
  const page = INBOX_PAGES.some(([key]) => key === view) ? view : ''
  return <section className="today-layout unified-today day-page mail-page" aria-label="Inbox">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Inbox</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>{formatCalendarDay(today, { weekday: 'long', month: 'long' })}</time></div>
    </header>
    <nav className="day-add-kind mail-tabs" aria-label="Inbox pages">
      {INBOX_PAGES.map(([key, label]) => <button key={key || 'desk'} type="button" aria-pressed={page === key} onClick={() => navigate(key ? `/inbox/${key}` : '/inbox')}>{label}</button>)}
    </nav>
    {page === 'messages' ? <InboxMail params={params} setParams={setParams} />
      : page === 'log' ? <InboxLog params={params} setParams={setParams} />
        : page === 'waiting' ? <InboxWaiting focus={params.get('action')} />
          : <InboxDesk params={params} setParams={setParams} />}
  </section>
}
