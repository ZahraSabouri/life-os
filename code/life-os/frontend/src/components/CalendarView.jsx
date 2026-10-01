import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api.js'

const WEEKDAYS = [
  { label: 'Mon', sample: new Date(2026, 0, 5) },
  { label: 'Tue', sample: new Date(2026, 0, 6) },
  { label: 'Wed', sample: new Date(2026, 0, 7) },
  { label: 'Thu', sample: new Date(2026, 0, 8) },
  { label: 'Fri', sample: new Date(2026, 0, 9) },
  { label: 'Sat', sample: new Date(2026, 0, 10) },
  { label: 'Sun', sample: new Date(2026, 0, 11) }
]
const ENTRY_TYPES = new Set(['task', 'event'])
const PERSIAN_MONTH_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'long',
  year: 'numeric'
})
const PERSIAN_DAY_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  day: 'numeric'
})
const PERSIAN_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'short'
})

const CALENDAR_LEGEND = [
  { key: 'study', label: 'Study', tone: 'var(--g-acc)' },
  { key: 'career', label: 'Career', tone: 'var(--g-blue)' },
  { key: 'body', label: 'Body', tone: 'var(--g-coral)' },
  { key: 'memories', label: 'Memories', tone: 'var(--g-sage)' },
  { key: 'mind', label: 'Mind', tone: 'var(--g-rose)' },
  { key: 'places', label: 'Places', tone: 'var(--g-coral)' }
]

function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function lastOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date, amount) {
  return firstOfMonth(new Date(date.getFullYear(), date.getMonth() + amount, 1))
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function dateKeyFromValue(value) {
  if (typeof value !== 'string') return ''
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  if (match) return match[0]

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatDateKey(date)
}

function buildMonthGrid(monthDate) {
  const first = firstOfMonth(monthDate)
  const last = lastOfMonth(monthDate)
  const start = new Date(first)
  const end = new Date(last)
  const todayKey = formatDateKey(new Date())
  const days = []
  const firstWeekday = (first.getDay() + 6) % 7
  const lastWeekday = (last.getDay() + 6) % 7

  start.setDate(first.getDate() - firstWeekday)
  end.setDate(last.getDate() + (6 - lastWeekday))

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = new Date(cursor)
    const key = formatDateKey(date)

    days.push({
      date,
      key,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: key === todayKey
    })
  }

  return days
}

function domainForText(text, fallback = 'mind') {
  const value = String(text || '').toLowerCase()

  if (/\b(mat|cmt|ma\d|study|exam|revision|paper|module|notebook|seminar|lecture|course)\b/.test(value)) return 'study'
  if (/\b(job|career|cv|phd|application|interview|role|email|bristol|cardiff)\b/.test(value)) return 'career'
  if (/\b(gym|workout|run|lift|push|pull|body|doctor|health)\b/.test(value)) return 'body'
  if (/\b(photo|memory|walk|family|maman|birthday)\b/.test(value)) return 'memories'
  if (/\b(beach|bay|london|trip|travel|place|wales|penarth)\b/.test(value)) return 'places'

  return fallback
}

function toneForDomain(domain) {
  return CALENDAR_LEGEND.find((item) => item.key === domain)?.tone || 'var(--g-acc)'
}

function inferDateFromPrompt(prompt, fallbackKey, visibleMonth) {
  const value = String(prompt || '').toLowerCase()
  const explicit = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)

  if (explicit) {
    const date = new Date(Number(explicit[1]), Number(explicit[2]) - 1, Number(explicit[3]))
    if (!Number.isNaN(date.getTime())) return formatDateKey(date)
  }

  const dayMatch = value.match(/\b([1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\b/)

  if (dayMatch) {
    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), Number(dayMatch[1]))
    if (candidate.getMonth() === visibleMonth.getMonth()) return formatDateKey(candidate)
  }

  return fallbackKey
}

function birthdayKeyInMonth(person, visibleMonth) {
  const match = String(person.birthday || '').match(/^\d{4}-(\d{2})-(\d{2})/)
  if (!match) return ''

  const date = new Date(visibleMonth.getFullYear(), Number(match[1]) - 1, Number(match[2]))
  return date.getMonth() === visibleMonth.getMonth() ? formatDateKey(date) : ''
}

function persianRangeLabel(visibleMonth) {
  const first = firstOfMonth(visibleMonth)
  const last = lastOfMonth(visibleMonth)
  const firstLabel = PERSIAN_MONTH_FORMATTER.format(first)
  const lastLabel = PERSIAN_MONTH_FORMATTER.format(last)

  return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`
}

export default function CalendarView() {
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(new Date()))
  const [entries, setEntries] = useState([])
  const [people, setPeople] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [captureText, setCaptureText] = useState('')
  const [captureDate, setCaptureDate] = useState(() => formatDateKey(new Date()))

  const monthLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(visibleMonth), [visibleMonth])
  const persianMonthLabel = useMemo(() => persianRangeLabel(visibleMonth), [visibleMonth])

  const monthRange = useMemo(() => ({
    from: formatDateKey(firstOfMonth(visibleMonth)),
    end: formatDateKey(lastOfMonth(visibleMonth))
  }), [visibleMonth])

  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])

  const entriesByDay = useMemo(() => {
    const grouped = new Map()

    entries
      .filter((entry) => ENTRY_TYPES.has(entry.type))
      .forEach((entry) => {
        const key = dateKeyFromValue(entry.start_at)
        if (!key) return

        const domain = domainForText(`${entry.title || ''} ${entry.details?.location || ''}`, entry.type === 'task' ? 'study' : 'mind')
        const current = grouped.get(key) || []
        current.push({
          id: entry.id,
          title: entry.title || entry.type,
          domain,
          tone: toneForDomain(domain),
          type: entry.type
        })
        grouped.set(key, current)
      })

    people.forEach((person) => {
      const key = birthdayKeyInMonth(person, visibleMonth)
      if (!key) return

      const current = grouped.get(key) || []
      current.push({
        id: `birthday-${person.id}`,
        title: `${person.name} birthday`,
        domain: 'memories',
        tone: toneForDomain('memories'),
        type: 'birthday'
      })
      grouped.set(key, current)
    })

    return grouped
  }, [entries, people, visibleMonth])

  const loadCalendar = useCallback(async () => {
    setStatus('loading')
    setError('')

    try {
      const params = new URLSearchParams(monthRange)
      const [entryRows, peopleRows] = await Promise.all([
        apiFetch(`/api/entries?${params.toString()}`),
        apiFetch('/api/people')
      ])

      setEntries(entryRows)
      setPeople(peopleRows)
      setStatus('idle')
    } catch (loadError) {
      setError(loadError.message)
      setStatus('idle')
    }
  }, [monthRange])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  async function handleCaptureSubmit(event) {
    event.preventDefault()

    const title = captureText.trim().replace(/^["']|["']$/g, '')
    if (!title || status === 'saving') return

    setStatus('saving')
    setError('')

    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'event',
          title,
          start_at: inferDateFromPrompt(title, captureDate, visibleMonth),
          all_day: true
        })
      })

      setCaptureText('')
      await loadCalendar()
    } catch (submitError) {
      setError(submitError.message)
      setStatus('idle')
    }
  }

  return (
    <section className="calendar-layout calendar-board-layout" aria-label="Calendar">
      <header className="calendar-board-header">
        <div className="calendar-brandline">
          <h1>Life OS</h1>
          <span />
        </div>
        <div className="calendar-title-stack">
          <h2 id="calendar-month-heading">{monthLabel}</h2>
          <p lang="fa" dir="rtl">{persianMonthLabel}</p>
          <div className="calendar-board-controls" aria-label="Month controls">
            <button className="ghost-pill compact-pill" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
              Prev
            </button>
            <button className="ghost-pill compact-pill" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
              Next
            </button>
          </div>
        </div>
      </header>

      <aside className="calendar-legend" aria-label="Calendar domains">
        {CALENDAR_LEGEND.map((item) => (
          <div key={item.key} style={{ '--item-accent': item.tone }}>
            <span aria-hidden="true" />
            <strong>{item.label}</strong>
          </div>
        ))}
      </aside>

      <section className="calendar-month calendar-board" aria-labelledby="calendar-month-heading">
        {error ? <p className="form-error">{error}</p> : null}

        <div className="calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day.label}>
              <strong>{day.label}</strong>
              <small lang="fa" dir="rtl">{PERSIAN_WEEKDAY_FORMATTER.format(day.sample)}</small>
            </span>
          ))}
        </div>

        <div className="month-grid">
          {monthDays.map((day) => {
            const dayEntries = entriesByDay.get(day.key) || []

            return (
              <article
                className={`calendar-day${day.isCurrentMonth ? '' : ' muted-day'}${day.isToday ? ' today-day' : ''}`}
                key={day.key}
              >
                <time dateTime={day.key}>
                  <span>{day.date.getDate()}</span>
                  <small lang="fa" dir="rtl">{PERSIAN_DAY_FORMATTER.format(day.date)}</small>
                </time>
                <div className="day-entry-list">
                  {dayEntries.map((entry) => (
                    <span className="day-chip" data-type={entry.type} key={entry.id} style={{ '--item-accent': entry.tone }}>
                      {entry.title}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <form className="calendar-capture-bar" onSubmit={handleCaptureSubmit}>
        <input
          value={captureText}
          onChange={(event) => setCaptureText(event.target.value)}
          placeholder={'"Seminar on the 22nd, two in the afternoon..."'}
          aria-label="Add calendar item"
        />
        <input
          aria-label="Fallback date"
          type="date"
          value={captureDate}
          onChange={(event) => setCaptureDate(event.target.value)}
        />
        <button className="capture-orb" type="submit" aria-label="Add to calendar" disabled={!captureText.trim() || status === 'saving'} />
      </form>
    </section>
  )
}
