import { Link } from 'react-router-dom'
import { calendarArea, calendarDisplay, calendarKind, dateKey, formatCalendarDay, isComplete, itemTime } from '../lib/calendar.js'

export function CalendarStatus({ calendar, showChoices = true }) {
  const failures = calendar.sources.filter(source => source.status === 'unavailable')
  return <div className="calendar-source-status" aria-live="polite">
    {calendar.loading ? <p>Loading your calendar…</p> : null}
    {calendar.error ? <p className="form-error">Could not load the calendar: {calendar.error} <button type="button" onClick={calendar.refetch}>Try again</button></p> : null}
    {failures.length ? <p className="form-error">Some areas could not be loaded: {failures.map(source => calendarArea(source.area).label).join(', ')}. Other dates are still shown. <button type="button" onClick={calendar.refetch}>Try again</button></p> : null}
    {showChoices && calendar.choicesError ? <p className="form-error">{calendar.choicesError}</p> : null}
  </div>
}

export default function CalendarItems({ items, calendar, areas, showDate = false, onComplete, savingId, empty = 'Nothing dated here.' }) {
  if (!items.length) return <p className="empty-state">{calendar ? calendarDisplay(calendar, { areas, empty }).emptyMessage : empty}</p>
  return <ol className="calendar-agenda-list">
    {items.map(item => {
      const area = calendarArea(item.area)
      const task = item.area === 'core' && item.meta?.type === 'task'
      return <li key={item.id} className={`calendar-agenda-item${isComplete(item) ? ' is-complete' : ''}`} data-kind={item.kind} style={{ '--item-accent': area.tone }}>
        <div className="calendar-agenda-date">
          {showDate ? <time dateTime={item.start}>{formatCalendarDay(dateKey(item.start))}</time> : null}
          <span>{itemTime(item)}</span>
        </div>
        <div className="calendar-agenda-copy">
          <Link className="calendar-item-title" to={item.href || '/calendar'}>{item.title}</Link>
          <div className="calendar-item-meta"><span>{area.label}</span><span className="calendar-kind-tag">{calendarKind(item.kind)}</span>{item.choice ? <span>{item.choice === 'going' ? 'Plan to go' : 'Maybe'}</span> : null}{item.meta?.candidate && !item.choice ? <span>Available option</span> : null}{item.attention ? <span className="calendar-attention-tag">{item.attention}</span> : null}</div>
          {item.location ? <p>{item.location}</p> : null}
          {item.meta?.savedSnapshot ? <p>Saved copy; check the current listing before travelling.</p> : null}
          {item.meta?.needsVerification ? <p>Check the published time and details before travelling.</p> : null}
        </div>
        {onComplete && task && !isComplete(item) ? <button className="ghost-pill compact-pill calendar-complete" type="button" onClick={() => onComplete(item)} disabled={Boolean(savingId)} aria-label={`Mark ${item.title} done`}>{savingId === item.id ? 'Saving…' : 'Done'}</button> : null}
      </li>
    })}
  </ol>
}
