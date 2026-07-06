import { useMemo, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { useEntries } from '../lib/useEntries.js'

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function relativeTime(value) {
  const then = new Date(value).getTime()
  const now = Date.now()
  const seconds = Math.max(0, Math.round((now - then) / 1000))

  if (seconds < 45) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  if (days < 8) return `${days} day${days === 1 ? '' : 's'} ago`

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}

function dateTimeLabel(value) {
  if (!value) return 'Today'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

export default function TodayView() {
  const [updatingId, setUpdatingId] = useState('')
  const [actionError, setActionError] = useState('')
  const todayKey = useMemo(() => formatDateKey(new Date()), [])
  const todayQuery = useMemo(() => `?from=${todayKey}&end=${todayKey}`, [todayKey])
  const todayEntries = useEntries(todayQuery)
  const recentEntries = useEntries('?limit=10')

  const tasks = todayEntries.entries.filter((entry) => entry.type === 'task')
  const events = todayEntries.entries.filter((entry) => entry.type === 'event')
  const error = actionError || todayEntries.error || recentEntries.error

  async function toggleTask(entry) {
    setUpdatingId(entry.id)
    setActionError('')

    try {
      await apiFetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: entry.status === 'done' ? 'open' : 'done'
        })
      })

      await Promise.all([
        todayEntries.refetch(),
        recentEntries.refetch()
      ])
    } catch (toggleError) {
      setActionError(toggleError.message)
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="today-layout" aria-label="Today">
      <section className="today-panel" aria-labelledby="today-heading">
        <div className="today-panel-header">
          <div>
            <p className="capture-label">Today</p>
            <h1 id="today-heading">What is live now</h1>
          </div>
          <time dateTime={todayKey}>{todayKey}</time>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="today-section">
          <div className="section-heading">
            <h2>Tasks</h2>
            <span />
          </div>

          {tasks.length ? (
            <ol className="today-list">
              {tasks.map((task) => (
                <li className={`today-row${task.status === 'done' ? ' done-row' : ''}`} key={task.id}>
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      disabled={updatingId === task.id}
                      onChange={() => toggleTask(task)}
                    />
                    <span>{task.title || 'Untitled task'}</span>
                  </label>
                  <small>{task.status === 'done' ? 'done' : task.status || 'open'}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No dated tasks for today.</p>
          )}
        </div>

        <div className="today-section">
          <div className="section-heading">
            <h2>Events</h2>
            <span />
          </div>

          {events.length ? (
            <ol className="today-list">
              {events.map((event) => (
                <li className="today-row" key={event.id}>
                  <div>
                    <p>{event.title || 'Untitled event'}</p>
                    <small>{event.all_day ? 'all day' : dateTimeLabel(event.start_at)}</small>
                  </div>
                  <span className="entry-type-pill">event</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No events filed for today.</p>
          )}
        </div>
      </section>

      <section className="recently-filed today-recent" aria-labelledby="today-recent-heading">
        <div className="section-heading">
          <h2 id="today-recent-heading">Recently filed</h2>
          <span />
        </div>

        {recentEntries.entries.length ? (
          <ol className="entry-list">
            {recentEntries.entries.map((entry) => (
              <li key={entry.id} className="entry-item">
                <time dateTime={entry.created_at}>{relativeTime(entry.created_at)}</time>
                <div>
                  <p>{entry.title || 'Untitled note'}</p>
                  {entry.details?.body ? <small>{entry.details.body}</small> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-state">No entries filed yet.</p>
        )}
      </section>
    </section>
  )
}
