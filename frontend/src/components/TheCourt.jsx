import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { useGround } from '../lib/groundContext.jsx'
import { useEntries } from '../lib/useEntries.js'
import { poemForDate } from '../lib/poems.js'

function titleFromBody(body) {
  const compact = body.trim().replace(/\s+/g, ' ')

  if (compact.length <= 60) {
    return compact
  }

  return `${compact.slice(0, 57)}...`
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

export default function TheCourt({ onCalendar, onDivan }) {
  const { ground, cycleGround } = useGround()
  const [now, setNow] = useState(() => new Date())
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const { entries, error: entriesError, refetch } = useEntries('?limit=10')
  const error = submitError || entriesError

  const dateLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now), [now])
  const dailyPoem = useMemo(() => poemForDate(now), [now])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    const text = body.trim()
    if (!text || status === 'saving') return

    setStatus('saving')
    setSubmitError('')

    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'note',
          title: titleFromBody(text),
          details: { body: text }
        })
      })

      setBody('')
      await refetch()
      setStatus('saved')
      window.setTimeout(() => setStatus('idle'), 1200)
    } catch (submitError) {
      setSubmitError(submitError.message)
      setStatus('idle')
    }
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(event)
    }
  }

  return (
    <main className="court-screen">
      <header className="court-topbar">
        <div className="wordmark">Life OS</div>
        <div className="date-line">{dateLabel}</div>
        <nav className="court-nav" aria-label="Primary">
          <button type="button" aria-disabled="true">Study hub</button>
          <button type="button" onClick={onCalendar}>Calendar</button>
          <button type="button" onClick={cycleGround}>Ground: {ground}</button>
          <button type="button" aria-disabled="true">Poem</button>
          <button className="active" type="button" onClick={onDivan}>Divan</button>
        </nav>
      </header>

      <section className="court-body" aria-label="The Court">
        <form className="capture-arch" onSubmit={handleSubmit}>
          <button
            className="capture-orb"
            type="submit"
            aria-label="Capture entry"
            disabled={!body.trim() || status === 'saving'}
          />
          <p className="capture-label">Capture</p>
          <h1>Capture first. Structure after.</h1>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write anything. A task, a deadline, a memory, a line to keep."
            rows={7}
          />
          <div className="capture-meta">
            <span>{status === 'saving' ? 'Filing...' : status === 'saved' ? 'Filed.' : 'Plain note for now'}</span>
            <button className="submit-link" type="submit" disabled={!body.trim() || status === 'saving'}>
              File entry
            </button>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
        </form>

        <section className="recently-filed" aria-labelledby="recent-heading">
          <div className="section-heading">
            <h2 id="recent-heading">Recently filed</h2>
            <span />
          </div>

          {entries.length ? (
            <ol className="entry-list">
              {entries.map((entry) => (
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

        <aside className="court-poem" id="court-poem" aria-label="Poem of the day">
          <div className="section-heading">
            <h2>Poem of the day</h2>
            <span />
          </div>
          <div className="court-poem-lines" lang="fa" dir="rtl">
            {dailyPoem.lines.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
          <p className="court-poet">{dailyPoem.poet}</p>
        </aside>
      </section>
    </main>
  )
}
