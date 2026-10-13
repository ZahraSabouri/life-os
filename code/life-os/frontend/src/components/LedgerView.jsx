import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ENTRY_TYPES } from '@shared/entryTypes.js'
import { sayWeekdays } from '@shared/routines.js'
import { apiFetch } from '../lib/api.js'
import { formatCalendarDay } from '../lib/calendar.js'
import { clockOf } from '../lib/day.js'
import { poemForDate } from '../lib/poems.js'
import { useEntries } from '../lib/useEntries.js'
import { removeEntry } from '../lib/plans.js'
import EntryEditor from './EntryEditor.jsx'

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

// When a dated entry is, in words: the day and the clock time, or how a repeating plan comes round.
function whenLine(entry) {
  const day = (value) => (String(value).length <= 10 ? String(value) : new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(value)))
  if (!entry.start_at) return ''
  if (entry.type === 'repeat') {
    const details = entry.details ?? {}
    return `${sayWeekdays(details.weekdays)}${details.start ? `, ${details.start}${details.end ? ` to ${details.end}` : ''}` : ', any time'} · from ${formatCalendarDay(day(entry.start_at))}${entry.end_at ? ` until ${formatCalendarDay(day(entry.end_at))}` : ', with no end'}`
  }
  const timed = !entry.all_day && String(entry.start_at).length > 10
  const state = entry.status === 'done' ? ' · done' : entry.status === 'cancelled' ? ' · taken off the day' : ''
  return `${formatCalendarDay(day(entry.start_at), { year: 'numeric' })}${timed ? ` · ${clockOf(entry.start_at)}${entry.end_at ? ` to ${clockOf(entry.end_at)}` : ''}` : ''}${state}`
}

function detailLine(entry) {
  if (entry.details?.body) return entry.details.body
  if (['task', 'time-block', 'repeat', 'meal'].includes(entry.type) && whenLine(entry)) return whenLine(entry)
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
  const recentEntries = useEntries('?limit=600')
  // Finding one: by its kind, by words in it. Changing or removing one: in place.
  const [kind, setKind] = useState('')
  const [words, setWords] = useState('')
  const [shown, setShown] = useState(60)
  const [editing, setEditing] = useState('')
  const [sure, setSure] = useState('')
  const kinds = useMemo(() => {
    const counts = new Map()
    for (const entry of recentEntries.entries) counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1)
    return [...counts].map(([type, count]) => ({ type, count, label: ENTRY_TYPES[type]?.label || type })).sort((a, b) => a.label.localeCompare(b.label))
  }, [recentEntries.entries])
  const found = useMemo(() => {
    const asked = words.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return recentEntries.entries.filter((entry) => (!kind || entry.type === kind) && (!asked.length || asked.every((word) => `${entry.title ?? ''} ${entry.details?.body ?? ''} ${entry.details?.note ?? ''} ${entry.details?.area ?? ''}`.toLowerCase().includes(word))))
  }, [recentEntries.entries, kind, words])
  async function remove(entry) {
    setSure('')
    setActionError('')
    try { await removeEntry(entry.id); await recentEntries.refetch() } catch (failure) { setActionError(`Could not remove “${entryTitle(entry)}”: ${failure.message}`) }
  }
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
        <p><Link to="/journal">Journal</Link> · The ledger - {found.length === recentEntries.entries.length ? `${recentEntries.entries.length} entries` : `${found.length} of ${recentEntries.entries.length} entries`}</p>
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

      {recentEntries.entries.length ? <div className="ledger-find" role="search">
        <label><span>Kind</span><select value={kind} onChange={(event) => { setKind(event.target.value); setShown(60) }}>
          <option value="">Everything ({recentEntries.entries.length})</option>
          {kinds.map((row) => <option key={row.type} value={row.type}>{row.label} ({row.count})</option>)}
        </select></label>
        <label className="ledger-find-words"><span>Find</span><input type="search" value={words} onChange={(event) => { setWords(event.target.value); setShown(60) }} placeholder="Words in the title or the text" /></label>
      </div> : null}

      {error ? <p className="form-error">{error}</p> : null}
      {!recentEntries.loading && location.hash.startsWith('#entry-') && !recentEntries.entries.some(entry => `#entry-${entry.id}` === location.hash) ? <p className="empty-state">This entry is outside the recent list.</p> : null}

      {found.length ? (
        <ol className="ledger-entry-list">
          {found.slice(0, shown).map((entry) => {
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
                  {detailLine(entry) && editing !== entry.id ? <p>{detailLine(entry)}</p> : null}
                  {media ? (
                    <div className="ledger-media">
                      <span>{media}</span>
                    </div>
                  ) : null}
                  {editing === entry.id
                    ? <EntryEditor entry={entry} onCancel={() => setEditing('')} onSaved={() => { setEditing(''); recentEntries.refetch() }} />
                    : <p className="ledger-entry-actions">
                      <button type="button" onClick={() => { setEditing(entry.id); setSure('') }}>Change</button>
                      {sure === entry.id
                        ? <><button type="button" className="is-danger" onClick={() => remove(entry)}>Remove for good</button><button type="button" onClick={() => setSure('')}>Keep it</button></>
                        : <button type="button" onClick={() => setSure(entry.id)}>Remove</button>}
                    </p>}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="empty-state">{recentEntries.entries.length ? 'Nothing matches. Choose “Everything” or clear the words.' : recentEntries.loading ? 'Loading…' : 'No entries filed yet.'}</p>
      )}
      {found.length > shown ? <p className="ledger-more"><button type="button" onClick={() => setShown((count) => count + 60)}>Show {Math.min(60, found.length - shown)} more</button> <span>{found.length - shown} older ones are not shown yet.</span></p> : null}

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
