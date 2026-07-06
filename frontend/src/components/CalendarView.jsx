import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { upcomingBirthdays } from '../utils/birthdays.js'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ENTRY_TYPES = new Set(['task', 'event'])

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

  start.setDate(first.getDate() - first.getDay())
  end.setDate(last.getDate() + (6 - last.getDay()))

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

function birthdayLabel(birthday) {
  if (typeof birthday !== 'string') return ''

  const match = birthday.match(/^\d{4}-(\d{2})-(\d{2})/)
  if (!match) return birthday

  const date = new Date(2000, Number(match[1]) - 1, Number(match[2]))
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date)
}

function relativeBirthdayLabel(daysUntil) {
  if (daysUntil === 0) return 'today'
  if (daysUntil === 1) return 'tomorrow'
  return `in ${daysUntil} days`
}

export default function CalendarView() {
  const navigate = useNavigate()
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(new Date()))
  const [entries, setEntries] = useState([])
  const [people, setPeople] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [showPersonForm, setShowPersonForm] = useState(false)
  const [entryForm, setEntryForm] = useState({
    title: '',
    date: formatDateKey(new Date()),
    type: 'event',
    all_day: true
  })
  const [personForm, setPersonForm] = useState({
    name: '',
    birthday: formatDateKey(new Date()),
    notes: ''
  })

  const monthLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(visibleMonth), [visibleMonth])

  const monthRange = useMemo(() => ({
    from: formatDateKey(firstOfMonth(visibleMonth)),
    end: formatDateKey(lastOfMonth(visibleMonth))
  }), [visibleMonth])

  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])
  const birthdays = useMemo(() => upcomingBirthdays(people), [people])

  const entriesByDay = useMemo(() => {
    const grouped = new Map()

    entries
      .filter((entry) => ENTRY_TYPES.has(entry.type))
      .forEach((entry) => {
        const key = dateKeyFromValue(entry.start_at)
        if (!key) return

        const current = grouped.get(key) || []
        current.push(entry)
        grouped.set(key, current)
      })

    return grouped
  }, [entries])

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

  async function handleEntrySubmit(event) {
    event.preventDefault()

    const title = entryForm.title.trim()
    if (!title || status === 'saving') return

    setStatus('saving')
    setError('')

    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: entryForm.type,
          title,
          start_at: entryForm.date,
          all_day: entryForm.all_day,
          details: { source: 'calendar-manual' }
        })
      })

      setEntryForm((current) => ({ ...current, title: '' }))
      setShowEntryForm(false)
      await loadCalendar()
    } catch (submitError) {
      setError(submitError.message)
      setStatus('idle')
    }
  }

  async function handlePersonSubmit(event) {
    event.preventDefault()

    const name = personForm.name.trim()
    if (!name || status === 'saving-person') return

    setStatus('saving-person')
    setError('')

    try {
      await apiFetch('/api/people', {
        method: 'POST',
        body: JSON.stringify({
          name,
          birthday: personForm.birthday,
          notes: personForm.notes.trim() || null
        })
      })

      setPersonForm((current) => ({ ...current, name: '', notes: '' }))
      setShowPersonForm(false)
      await loadCalendar()
    } catch (submitError) {
      setError(submitError.message)
      setStatus('idle')
    }
  }

  return (
    <main className="calendar-screen">
      <header className="court-topbar">
        <div className="wordmark">Life OS</div>
        <div className="date-line">{monthLabel}</div>
        <nav className="court-nav" aria-label="Primary">
          <button type="button" onClick={() => navigate('/court')}>Court</button>
          <button className="active" type="button">Calendar</button>
          <button type="button" aria-disabled="true">Study hub</button>
          <button type="button" aria-disabled="true">Ground</button>
          <button type="button" aria-disabled="true">Poem</button>
        </nav>
      </header>

      <section className="calendar-layout" aria-label="Calendar">
        <section className="calendar-month" aria-labelledby="calendar-month-heading">
          <div className="calendar-toolbar">
            <button className="ghost-pill compact-pill" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
              Prev
            </button>
            <h1 id="calendar-month-heading">{monthLabel}</h1>
            <button className="ghost-pill compact-pill" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
              Next
            </button>
            <button className="primary-pill compact-pill" type="button" onClick={() => setShowEntryForm((value) => !value)}>
              + Add
            </button>
          </div>

          {showEntryForm ? (
            <form className="calendar-form" onSubmit={handleEntrySubmit}>
              <label>
                <span>Title</span>
                <input
                  value={entryForm.title}
                  onChange={(event) => setEntryForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Seminar, deadline, appointment"
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={entryForm.date}
                  onChange={(event) => setEntryForm((current) => ({ ...current, date: event.target.value }))}
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={entryForm.type}
                  onChange={(event) => setEntryForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                </select>
              </label>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={entryForm.all_day}
                  onChange={(event) => setEntryForm((current) => ({ ...current, all_day: event.target.checked }))}
                />
                <span>All day</span>
              </label>
              <button className="submit-link" type="submit" disabled={!entryForm.title.trim() || status === 'saving'}>
                Save
              </button>
            </form>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <div className="calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="month-grid">
            {monthDays.map((day) => {
              const dayEntries = entriesByDay.get(day.key) || []

              return (
                <article
                  className={`calendar-day${day.isCurrentMonth ? '' : ' muted-day'}${day.isToday ? ' today-day' : ''}`}
                  key={day.key}
                >
                  <time dateTime={day.key}>{day.date.getDate()}</time>
                  <div className="day-entry-list">
                    {dayEntries.map((entry) => (
                      <span className="day-chip" data-type={entry.type} key={entry.id}>
                        {entry.title || entry.type}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="birthday-panel" aria-labelledby="birthday-heading">
          <div className="section-heading">
            <h2 id="birthday-heading">Upcoming birthdays</h2>
            <span />
          </div>

          <button className="submit-link add-person-button" type="button" onClick={() => setShowPersonForm((value) => !value)}>
            + Add person
          </button>

          {showPersonForm ? (
            <form className="person-form" onSubmit={handlePersonSubmit}>
              <label>
                <span>Name</span>
                <input
                  value={personForm.name}
                  onChange={(event) => setPersonForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Name"
                />
              </label>
              <label>
                <span>Birthday</span>
                <input
                  type="date"
                  value={personForm.birthday}
                  onChange={(event) => setPersonForm((current) => ({ ...current, birthday: event.target.value }))}
                />
              </label>
              <label>
                <span>Notes</span>
                <textarea
                  value={personForm.notes}
                  onChange={(event) => setPersonForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                />
              </label>
              <button className="submit-link" type="submit" disabled={!personForm.name.trim() || status === 'saving-person'}>
                Save person
              </button>
            </form>
          ) : null}

          {birthdays.length ? (
            <ol className="birthday-list">
              {birthdays.map((person) => (
                <li key={person.id}>
                  <div>
                    <p>{person.name}</p>
                    <small>{birthdayLabel(person.birthday)}</small>
                  </div>
                  <span>{relativeBirthdayLabel(person.daysUntil)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No birthdays in the next 30 days.</p>
          )}
        </aside>
      </section>
    </main>
  )
}
