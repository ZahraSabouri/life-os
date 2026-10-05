import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ENTRY_TYPES } from '@shared/entryTypes.js'
import { apiFetch } from '../lib/api.js'
import { poemForDate } from '../lib/poems.js'
import { useEntries } from '../lib/useEntries.js'

const TYPE_TONES = {
  task: 'var(--g-acc)',
  event: 'var(--g-acc)',
  workout: 'var(--g-coral)',
  book: 'var(--g-blue)',
  movie: 'var(--g-blue)',
  place: 'var(--g-sage)',
  'person-link': 'var(--g-rose)',
  'job-application': 'var(--g-blue)',
  material: 'var(--g-sage)',
  snippet: 'var(--g-sage)',
  'shopping-item': 'var(--g-acc)',
  module: 'var(--g-acc)',
  'module-session': 'var(--g-blue)',
  note: 'var(--g-sage)'
}

function titleFromBody(body) {
  const compact = body.trim().replace(/\s+/g, ' ')
  return compact.length <= 78 ? compact : `${compact.slice(0, 75)}...`
}

function entryTypeLabel(entry) {
  return ENTRY_TYPES[entry.type]?.label || 'Entry'
}

function entryTitle(entry) {
  return entry.title || `Untitled ${entryTypeLabel(entry).toLowerCase()}`
}

function timeLabel(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function dayLabel(value) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date)
}

function detailLine(entry) {
  if (entry.details?.body) return entry.details.body
  if (entry.type === 'event' && entry.start_at) return entry.all_day ? 'all day' : timeLabel(entry.start_at)
  if (entry.type === 'task') return entry.status || 'open'
  if (entry.type === 'book') return [entry.details?.author, entry.details?.status].filter(Boolean).join(' - ')
  if (entry.type === 'workout') return [entry.details?.kind, entry.details?.duration_min ? `${entry.details.duration_min} minutes` : ''].filter(Boolean).join(' - ')
  if (entry.type === 'place') return entry.details?.notes || entry.details?.name || ''
  if (entry.type === 'module-session') return [entry.details?.module_code, entry.details?.topic].filter(Boolean).join(' - ')
  if (entry.type === 'job-application') return [entry.details?.company, entry.details?.status].filter(Boolean).join(' - ')

  return ''
}

function mediaLabel(entry) {
  const body = `${entry.title || ''} ${entry.details?.body || ''}`.toLowerCase()
  if (!/\b(photo|image|gallery|jpg|jpeg|png)\b/.test(body)) return ''

  const fileMatch = body.match(/\b[\w-]+\.(?:jpg|jpeg|png)\b/)
  return fileMatch ? fileMatch[0] : 'photo'
}

export default function LedgerView() {
  const [captureText, setCaptureText] = useState('')
  const [status, setStatus] = useState('idle')
  const [actionError, setActionError] = useState('')
  const recentEntries = useEntries('?limit=100')
  const location = useLocation()
  const dailyPoem = useMemo(() => poemForDate(new Date()), [])
  const error = actionError || recentEntries.error

  useEffect(() => {
    const id = location.hash.slice(1)
    if (id.startsWith('entry-')) document.getElementById(id)?.scrollIntoView({ block: 'center' })
  }, [location.hash, recentEntries.entries])

  async function handleCaptureSubmit(event) {
    event.preventDefault()

    const body = captureText.trim()
    if (!body || status === 'saving') return

    setStatus('saving')
    setActionError('')

    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'note',
          title: titleFromBody(body),
          details: { body }
        })
      })

      setCaptureText('')
      await recentEntries.refetch()
      setStatus('idle')
    } catch (submitError) {
      setActionError(submitError.message)
      setStatus('idle')
    }
  }

  return (
    <section className="today-layout ledger-layout" aria-label="The ledger">
      <header className="ledger-header">
        <div className="ledger-brandline">
          <h1>Life OS</h1>
          <span />
        </div>
        <p>The ledger - {recentEntries.entries.length} recent entries</p>
      </header>

      <form className="ledger-capture" onSubmit={handleCaptureSubmit}>
        <input
          value={captureText}
          onChange={(event) => setCaptureText(event.target.value)}
          placeholder="Tell me something..."
          aria-label="Capture a ledger entry"
        />
        <button className="capture-orb" type="submit" aria-label="File ledger entry" disabled={!captureText.trim() || status === 'saving'} />
      </form>

      {error ? <p className="form-error">{error}</p> : null}
      {!recentEntries.loading && location.hash.startsWith('#entry-') && !recentEntries.entries.some(entry => `#entry-${entry.id}` === location.hash) ? <p className="empty-state">This entry is outside the recent list.</p> : null}

      {recentEntries.entries.length ? (
        <ol className="ledger-entry-list">
          {recentEntries.entries.map((entry) => {
            const tone = TYPE_TONES[entry.type] || 'var(--g-acc)'
            const media = mediaLabel(entry)

            return (
              <li id={`entry-${entry.id}`} className="ledger-entry" key={entry.id} style={{ '--item-accent': tone }}>
                <aside>
                  <time dateTime={entry.created_at}>{dayLabel(entry.created_at)} {timeLabel(entry.created_at)}</time>
                  <span>{entryTypeLabel(entry)}</span>
                </aside>
                <div className="ledger-entry-body">
                  <h2>{entryTitle(entry)}</h2>
                  {detailLine(entry) ? <p>{detailLine(entry)}</p> : null}
                  {media ? (
                    <div className="ledger-media">
                      <span>{media}</span>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="empty-state">No entries filed yet.</p>
      )}

      <footer className="ledger-poem" aria-label="Poem of the day">
        <div lang="fa" dir="rtl">
          {dailyPoem.lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <small lang="fa" dir="rtl">{dailyPoem.poet}</small>
      </footer>
    </section>
  )
}
