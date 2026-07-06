import { useMemo, useState } from 'react'
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

export default function TheCourt() {
  const [body, setBody] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [detailsDraft, setDetailsDraft] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const { entries, error: entriesError, refetch } = useEntries('?limit=10')
  const error = submitError || entriesError

  const entryTypeOptions = useMemo(() => Object.entries(ENTRY_TYPES), [])
  const dailyPoem = useMemo(() => poemForDate(new Date()), [])

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
        <div className="type-picker" aria-label="Entry type">
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
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={entryType === 'note'
            ? 'Write anything. A task, a deadline, a memory, a line to keep.'
            : `Title for this ${ENTRY_TYPES[entryType].label.toLowerCase()}. Add structure below.`}
          rows={7}
        />
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
                  <p className="entry-title-line">
                    <span className="entry-icon">{ENTRY_TYPES[entry.type]?.icon || '?'}</span>
                    <span>{entry.title || `Untitled ${ENTRY_TYPES[entry.type]?.label?.toLowerCase() || 'entry'}`}</span>
                  </p>
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
  )
}
