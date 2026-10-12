// Today, as it concerns one part of Life OS. A slim strip under the top bar inside the Study
// hub, JobMap, Budget and Cardiff Life: the same day that the Court and Today show, cut down
// to that part, with the way back to the whole day.
import { Link } from 'react-router-dom'
import { filterCalendarItems, itemOverlaps } from '../lib/calendar.js'
import { clockOf } from '../lib/day.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { useDay, useLondonClock } from '../lib/useDay.js'
import { count, hours, pounds } from './DayParts.jsx'

function studyLine(day, clock) {
  const study = day.study
  if (!study) return ['No semester is open.']
  const ahead = day.blocks.filter((block) => block.end > clock)
  const next = ahead[0]
  const left = study.today.filter((card) => !card.done).length
  return [
    next ? { to: next.card?.href, text: `${next.start <= clock ? 'Now' : next.start}: ${next.card?.title ?? next.title}${next.card?.steps.length ? ` (${next.card.stepsDone} of ${next.card.steps.length} steps)` : ''}` }
      : study.today.length ? (left ? `${count(left, 'card')} still open today, no study time left on the plan` : 'Everything planned for today is done') : 'Nothing to study on the plan today',
    ahead.length > 1 ? `then ${ahead.slice(1).map((block) => block.start).join(', ')}` : '',
    study.next ? `${study.next.days === 0 ? 'Today' : `${study.next.days} ${study.next.days === 1 ? 'day' : 'days'} to`} ${study.next.title}` : '',
    study.overdue.count ? `${count(study.overdue.count, 'card')} past ${study.overdue.count === 1 ? 'its' : 'their'} date` : '',
  ]
}

function jobsLine(day) {
  const jobs = day.jobs
  if (!jobs) return ['JobMap could not be read.']
  // JobMap's own first screen, in its order.
  const first = jobs.next[0]
  return [
    jobs.closing[0] ? { to: jobs.closing[0].href, text: `Closes today: ${jobs.closing[0].role} · ${jobs.closing[0].company}${jobs.closing.length > 1 ? ` and ${jobs.closing.length - 1} more` : ''}` } : '',
    first ? { to: first.href, text: `Next: ${first.role} · ${first.company}${first.days !== null && first.days <= 7 ? ` (closes ${first.days === 1 ? 'tomorrow' : `in ${first.days} days`})` : ''}` } : jobs.closing.length ? '' : 'Nothing to apply for right now',
    `${jobs.applyNow} to apply for now`,
    jobs.minutesToday ? `${hours(Math.round(jobs.minutesToday / 6) / 10)} set aside${jobs.time[0].start ? ` from ${jobs.time[0].start}` : ''}` : '',
    `${jobs.appliedThisWeek} sent this week`,
  ]
}

function homeLine(day) {
  const home = day.home
  if (!home) return ['Budget could not be read.']
  const toBuy = home.lists.reduce((sum, list) => sum + list.items.length, 0)
  const first = home.lists.find((list) => list.items.length > 0)
  const dinner = home.meals.find((meal) => meal.slot === 'dinner') ?? home.meals[0]
  return [
    toBuy ? { to: '/budget#/shopping', text: `${count(toBuy, 'thing')} to buy (${first.items.slice(0, 3).map((item) => item.name).join(', ')}${first.items.length > 3 ? '…' : ''})` } : 'Nothing on a shopping list',
    dinner ? `${dinner.slot === 'dinner' ? 'Dinner' : 'Planned'}: ${dinner.name}` : 'no meal planned today',
    home.budget ? `${pounds(home.budget.totalPence)} this month` : '',
  ]
}

function EventsLine({ today }) {
  const calendar = useCalendar(today, today)
  if (calendar.loading) return <span>Reading your choices…</span>
  const chosen = filterCalendarItems(calendar.items, { choices: calendar.choices }).filter((item) => item.area === 'events' && itemOverlaps(item, today, today))
  const offered = calendar.items.filter((item) => item.area === 'events').length
  return <>
    <span>{chosen.length ? chosen.map((item) => `${item.all_day ? '' : `${clockOf(item.start)} `}${item.title}${item.choice === 'maybe' ? ' (maybe)' : ''}`).join('; ') : 'Nothing chosen for today'}</span>
    {offered ? <span>{count(offered, 'option')} on today</span> : null}
  </>
}

const LINES = { study: studyLine, career: jobsLine, home: homeLine }

export default function AreaToday({ area }) {
  const today = useLondonToday()
  const clock = useLondonClock()
  const day = useDay(today)
  const parts = area !== 'events' && day.data ? LINES[area](day.data, clock).filter(Boolean) : []
  return <aside className="area-today" aria-label="Today in this part">
    <Link className="area-today-name" to="/today">Today</Link>
    <p>
      {area === 'events' ? <EventsLine today={today} /> : day.data ? parts.map((part, index) => <span key={index}>{typeof part === 'object' && part.to ? <Link to={part.to}>{part.text}</Link> : part.text ?? part}</span>) : <span>{day.error ? 'The day could not be read.' : 'Reading the day…'}</span>}
    </p>
    <Link className="area-today-all" to="/today">The whole day</Link>
  </aside>
}
