import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENTRY_TYPES, validateDetails } from '@shared/entryTypes.js'
import FieldsForm from './FieldsForm.jsx'
import { apiFetch } from '../lib/api.js'
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

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function timeLabel(value) {
  if (!value) return 'Today'

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

function entryTypeLabel(entry) {
  return ENTRY_TYPES[entry.type]?.label || 'Entry'
}

function entryTitle(entry) {
  return entry.title || `Untitled ${entryTypeLabel(entry).toLowerCase()}`
}

const TYPE_TONES = {
  task: 'var(--g-acc)',
  event: 'var(--g-blue)',
  workout: 'var(--g-coral)',
  book: 'var(--g-sage)',
  movie: 'var(--g-sage)',
  place: 'var(--g-rose)',
  'person-link': 'var(--g-rose)',
  'job-application': 'var(--g-blue)',
  material: 'var(--g-sage)',
  snippet: 'var(--g-sage)',
  'shopping-item': 'var(--g-acc)',
  module: 'var(--g-acc)',
  'module-session': 'var(--g-blue)'
}

const LENSES = [
  { label: 'Today', detail: 'now / due / active', route: '/today' },
  { label: 'Calendar', detail: 'events / birthdays', route: '/calendar' },
  { label: 'Boards', detail: 'pipelines', route: '/study' },
  { label: 'Gallery', detail: 'moments / photos' },
  { label: 'Library', detail: 'books / films / code' },
  { label: 'Map', detail: 'places / trips' },
  { label: 'People', detail: 'birthdays / gifts' },
  { label: 'Ask', detail: 'find / reason' }
]

const ARCHETYPE_CARDS = [
  {
    title: 'Moment',
    accent: 'var(--g-blue)',
    line: 'Photos, journal notes, voice notes, places to remember.',
    signal: 'memory / photo / note'
  },
  {
    title: 'Commitment',
    accent: 'var(--g-acc)',
    line: 'Tasks, dates, deadlines, reminders, promises.',
    signal: 'task / event / deadline'
  },
  {
    title: 'Workstream',
    accent: 'var(--g-blue)',
    line: 'Study campaigns, job searches, plans, projects.',
    signal: 'project / pipeline / campaign'
  },
  {
    title: 'Collection',
    accent: 'var(--g-sage)',
    line: 'Books, films, articles, code snippets, clothes.',
    signal: 'library / shelf / archive'
  },
  {
    title: 'Practice',
    accent: 'var(--g-coral)',
    line: 'Workouts, routines, skill loops, habits.',
    signal: 'repeat / log / streak'
  },
  {
    title: 'Anchor',
    accent: 'var(--g-rose)',
    line: 'People and places that connect entries across time.',
    signal: 'person / place / map'
  }
]

export default function TheCourt() {
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [detailsDraft, setDetailsDraft] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const { entries, error: entriesError, refetch } = useEntries('?limit=12')

  const entryTypeOptions = useMemo(() => Object.entries(ENTRY_TYPES), [])
  const todayKey = useMemo(() => formatDateKey(new Date()), [])
  const todayEntries = useEntries(`?from=${todayKey}&end=${todayKey}`)
  const dailyPoem = useMemo(() => poemForDate(new Date()), [])
  const todayItems = useMemo(() => {
    const liveRows = todayEntries.entries.map((entry) => ({
      time: entry.all_day ? 'all day' : timeLabel(entry.start_at),
      title: entryTitle(entry),
      sub: entryTypeLabel(entry),
      tone: TYPE_TONES[entry.type] || 'var(--g-acc)'
    }))

    return liveRows.slice(0, 5)
  }, [todayEntries.entries])
  const streamEntries = useMemo(() => {
    return entries.map((entry) => ({
      type: entryTypeLabel(entry),
      title: entryTitle(entry),
      meta: relativeTime(entry.created_at),
      tone: TYPE_TONES[entry.type] || 'var(--g-acc)',
      body: entry.details?.body || ''
    })).slice(0, 5)
  }, [entries])

  async function handleSubmit(event) {
    event.preventDefault()

    const text = body.trim()
    if (!text || status === 'saving') return

    setStatus('saving')
    setSubmitError('')

    try {
      const details = entryType === 'note'
        ? { body: text }
        : detailsDraft
      const validation = validateDetails(entryType, details)

      if (!validation.ok) {
        setSubmitError(validation.errors.join('; '))
        setStatus('idle')
        return
      }

      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: entryType,
          title: titleFromBody(text),
          details: validation.value
        })
      })

      setBody('')
      setDetailsDraft({})
      await Promise.all([
        refetch(),
        todayEntries.refetch()
      ])
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
    <section className="court-body" aria-label="The Court">
      <form className="capture-arch court-capture-hero" onSubmit={handleSubmit}>
        <button
          className="capture-orb"
          type="submit"
          aria-label="Capture entry"
          disabled={!body.trim() || status === 'saving'}
        />
        <div className="court-capture-copy">
          <p className="capture-label">Capture</p>
          <h1>Capture first. Structure after.</h1>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={entryType === 'note'
            ? 'Tell Life OS anything - a deadline, a memory, a book, a place, a workout, a job lead...'
            : `Title for this ${ENTRY_TYPES[entryType].label.toLowerCase()}. Add structure below.`}
          rows={2}
        />
        <div className="type-picker context-picker" aria-label="Entry type">
          {entryTypeOptions.map(([type, config]) => (
            <button
              className={type === entryType ? 'selected-type' : undefined}
              key={type}
              type="button"
              onClick={() => {
                setEntryType(type)
                setDetailsDraft({})
                setSubmitError('')
              }}
            >
              <span>{config.icon}</span>
              {config.label}
            </button>
          ))}
        </div>
        <FieldsForm
          details={detailsDraft}
          onChange={setDetailsDraft}
          type={entryType}
        />
        <div className="capture-meta">
          <span>{status === 'saving' ? 'Filing...' : status === 'saved' ? 'Filed.' : ENTRY_TYPES[entryType].label}</span>
          <button className="submit-link" type="submit" disabled={!body.trim() || status === 'saving'}>
            File entry
          </button>
        </div>
        {submitError ? <p className="form-error">{submitError}</p> : null}
      </form>

      <section className="lens-strip" aria-label="Life OS lenses">
        {LENSES.map((lens) => (
          <button
            className="lens-card"
            key={lens.label}
            type="button"
            onClick={() => lens.route && navigate(lens.route)}
          >
            <span aria-hidden="true" />
            <strong>{lens.label}</strong>
            <small>{lens.detail}</small>
          </button>
        ))}
      </section>

      <section className="court-main-grid">
        <aside className="court-panel court-today-panel" aria-labelledby="court-today-heading">
          <div className="section-heading">
            <h2 id="court-today-heading">Today</h2>
            <span />
          </div>

          {todayEntries.error ? (
            <p className="form-error compact-error">{todayEntries.error}</p>
          ) : todayItems.length ? (
            <ol className="court-day-list">
              {todayItems.map((entry, index) => (
                <li key={`${entry.title}-${index}`} style={{ '--item-accent': entry.tone }}>
                  <time>{entry.time}</time>
                  <span className="court-day-dot" />
                  <div>
                    <p>{entry.title}</p>
                    <small>{entry.sub}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No dated entries today.</p>
          )}

          <div className="study-progress-mini">
            <div>
              <span>Study lens</span>
              <strong>{entries.filter((entry) => ['module', 'module-session', 'material'].includes(entry.type)).length}</strong>
            </div>
            <progress value={entries.filter((entry) => ['module', 'module-session', 'material'].includes(entry.type)).length} max="12">
              Study entries
            </progress>
            <p>Study work is part of the same ledger.</p>
          </div>
        </aside>

        <section className="entry-grammar-panel" aria-labelledby="grammar-heading">
          <div className="section-heading">
            <h2 id="grammar-heading">Entry grammar</h2>
            <span />
            <small>six shapes, not six boxes</small>
          </div>

          <div className="grammar-grid">
            {ARCHETYPE_CARDS.map((card) => (
              <article className="grammar-card" key={card.title} style={{ '--card-accent': card.accent }}>
                <span aria-hidden="true" />
                <h3>{card.title}</h3>
                <p>{card.line}</p>
                <small>{card.signal}</small>
              </article>
            ))}
          </div>
        </section>

        <aside className="court-panel stream-panel" aria-labelledby="recent-heading">
          <div className="section-heading">
            <h2 id="recent-heading">Recently filed</h2>
            <span />
          </div>

          {entriesError ? (
            <p className="form-error compact-error">{entriesError}</p>
          ) : streamEntries.length ? (
            <ol className="stream-list">
              {streamEntries.map((entry, index) => (
                <li key={`${entry.title}-${index}`} style={{ '--item-accent': entry.tone }}>
                  <p>{entry.type}</p>
                  <h3>{entry.title}</h3>
                  <small>{entry.body || entry.meta}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No entries filed yet.</p>
          )}

          <aside className="court-poem compact-court-poem" id="court-poem" aria-label="Poem of the day">
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
        </aside>
      </section>
    </section>
  )
}
