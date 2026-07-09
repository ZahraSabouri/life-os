import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ENTRY_TYPES, validateDetails } from '@shared/entryTypes.js'
import { ROOMS } from '@shared/rooms.js'
import FieldsForm from './FieldsForm.jsx'
import { apiFetch } from '../lib/api.js'
import { useEntries } from '../lib/useEntries.js'
import { poemForDate } from '../lib/poems.js'
import { useGround } from '../lib/groundContext.jsx'

const ROOM_NAME_OVERRIDES = {
  study: 'Study',
  academia: 'Academia',
  career: 'Career',
  growth: 'Growth',
  body: 'Body',
  relationships: 'People',
  culture: 'Culture',
  travel: 'Travel',
  memories: 'Memories',
  home: 'Home',
  mind: 'Mind',
  style: 'Style'
}

const TYPE_ROOM_FALLBACKS = {
  note: ['mind'],
  task: ['home'],
  event: ['home'],
  place: ['travel']
}

const FEATURED_ROOMS = ['study', 'career', 'body']

const WINGS = [
  { key: 'work', label: 'The Work', rooms: ['study', 'academia', 'career', 'growth'] },
  { key: 'life', label: 'The Life', rooms: ['body', 'relationships', 'travel', 'home', 'style'] },
  { key: 'soul', label: 'The Soul', rooms: ['culture', 'memories', 'mind'] }
]

function titleFromBody(body) {
  const compact = body.trim().replace(/\s+/g, ' ')

  if (compact.length <= 60) {
    return compact
  }

  return `${compact.slice(0, 57)}...`
}

function relativeTime(value) {
  if (!value) return 'recently'

  const then = new Date(value).getTime()
  const now = Date.now()

  if (Number.isNaN(then)) return 'recently'

  const seconds = Math.max(0, Math.round((now - then) / 1000))

  if (seconds < 45) return 'now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.round(hours / 24)
  if (days < 8) return `${days}d`

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short'
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

function entryExcerpt(entry) {
  const details = entry.details || {}
  const text = details.body
    || details.note
    || details.summary
    || details.caption
    || details.reason
    || details.transcript
    || details.topic
    || details.source
    || ''

  return typeof text === 'string' && text.trim()
    ? titleFromBody(text)
    : entryTypeLabel(entry)
}

function displayRoomName(room) {
  return ROOM_NAME_OVERRIDES[room.slug] || room.name
}

function roomSlugsForType(type) {
  const configured = ENTRY_TYPES[type]?.rooms

  if (Array.isArray(configured) && configured.length) {
    return configured
  }

  return TYPE_ROOM_FALLBACKS[type] || ['mind']
}

function greetingFor(date) {
  const hour = date.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function dateLabelFor(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

function shortDateLabelFor(date) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short'
  }).format(date)
}

function clockLabelFor(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function sortRoomsForPaper(rooms) {
  const top = Math.ceil(rooms.length / 2)
  const left = rooms.slice(0, top)
  const right = rooms.slice(top)
  const ordered = []

  for (let index = 0; index < top; index += 1) {
    if (left[index]) ordered.push(left[index])
    if (right[index]) ordered.push(right[index])
  }

  return ordered
}

function buildRoomModel(entries) {
  const counts = new Map(ROOMS.map((room) => [room.slug, 0]))
  const latest = new Map()

  entries.forEach((entry) => {
    roomSlugsForType(entry.type).forEach((slug) => {
      counts.set(slug, (counts.get(slug) || 0) + 1)
      if (!latest.has(slug)) {
        latest.set(slug, entry)
      }
    })
  })

  return ROOMS.map((room) => {
    const latestEntry = latest.get(room.slug)

    return {
      ...room,
      displayName: displayRoomName(room),
      count: counts.get(room.slug) || 0,
      latest: latestEntry ? entryTitle(latestEntry) : room.blurb,
      style: { '--room-accent': room.accent }
    }
  })
}

function roomForEntry(entry, rooms) {
  const slug = roomSlugsForType(entry.type)[0]
  return rooms.find((room) => room.slug === slug) || rooms.find((room) => room.slug === 'mind') || rooms[0]
}

function SectionRule({ children, id, right }) {
  return (
    <div className="redesign-rule">
      <span id={id}>{children}</span>
      <i aria-hidden="true" />
      {right ? <strong>{right}</strong> : null}
    </div>
  )
}

function KhatamMark({ small = false }) {
  return (
    <span className={small ? 'khatam-mark khatam-mark-small' : 'khatam-mark'} aria-hidden="true">
      <span />
    </span>
  )
}

function Dia() {
  return <span className="redesign-dia" aria-hidden="true" />
}

function CourtNav({ ground, cycleGround, navigate, quiet = false }) {
  function goDivan() {
    navigate('/', { state: { forceIntro: true } })
  }

  return (
    <nav className={quiet ? 'redesign-nav redesign-nav-quiet' : 'redesign-nav'} aria-label="Primary">
      <button className="is-active" type="button" onClick={() => navigate('/court')}>Court</button>
      <button type="button" onClick={() => navigate('/today')}>Today</button>
      <button type="button" onClick={() => navigate('/calendar')}>Calendar</button>
      <button type="button" onClick={() => navigate('/study')}>Study</button>
      <button type="button" onClick={cycleGround}>Ground: {ground}</button>
      <button type="button" onClick={goDivan}>Divan</button>
    </nav>
  )
}

function CaptureFields({
  body,
  detailsDraft,
  entryType,
  entryTypeOptions,
  handleKeyDown,
  setBody,
  setDetailsDraft,
  setEntryType,
  setSubmitError,
  status,
  submitError,
  variant
}) {
  const typeLabel = ENTRY_TYPES[entryType]?.label || 'Entry'

  return (
    <>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={entryType === 'note'
          ? 'Tell Life OS anything - it files itself after you confirm.'
          : `Title for this ${typeLabel.toLowerCase()}. Add structure below.`}
        rows={variant === 'paper' ? 1 : 3}
        aria-label="Capture text"
      />

      <div className="redesign-capture-tools">
        <label>
          <span>File as</span>
          <select
            value={entryType}
            onChange={(event) => {
              setEntryType(event.target.value)
              setDetailsDraft({})
              setSubmitError('')
            }}
          >
            {entryTypeOptions.map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </label>
        <button className="redesign-submit" type="submit" disabled={!body.trim() || status === 'saving'}>
          {status === 'saving' ? 'Filing...' : status === 'saved' ? 'Filed' : 'File entry'}
        </button>
      </div>

      <FieldsForm
        details={detailsDraft}
        onChange={setDetailsDraft}
        type={entryType}
      />

      {submitError ? <p className="form-error redesign-error">{submitError}</p> : null}
    </>
  )
}

function StreakRing({ days, of = 12 }) {
  const progress = Math.max(0, Math.min(1, days / of))
  const circumference = 2 * Math.PI * 25

  return (
    <div className="redesign-streak-ring" aria-label={`${days} of ${of} study days`}>
      <svg viewBox="0 0 60 60" role="img" aria-hidden="true">
        <circle cx="30" cy="30" r="25" />
        <circle
          className="streak-progress"
          cx="30"
          cy="30"
          r="25"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span>{days}</span>
    </div>
  )
}

function EmptyLine({ children }) {
  return <p className="redesign-empty">{children}</p>
}

function RecentLine({ entry }) {
  return (
    <li className="recent-line" style={{ '--room-accent': entry.room.accent }}>
      <span>{entry.icon}</span>
      <p>{entry.title}</p>
      <time>{entry.ago}</time>
    </li>
  )
}

function TodayLine({ entry }) {
  return (
    <li className={entry.done ? 'today-line is-done' : 'today-line'} style={{ '--room-accent': entry.room.accent }}>
      <time>{entry.time}</time>
      <span aria-hidden="true" />
      <div>
        <p>{entry.title}</p>
        <small>{entry.room.displayName} / {entry.type}</small>
      </div>
    </li>
  )
}

function PoemStrip({ dailyPoem, compact = false }) {
  return (
    <aside className={compact ? 'redesign-poem redesign-poem-compact' : 'redesign-poem'} aria-label="Poem of the day">
      {dailyPoem.en ? <p className="redesign-poem-en">{dailyPoem.en}</p> : null}
      <div className="redesign-poem-lines" dir="auto">
        {dailyPoem.lines.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
      <p className="redesign-poet" dir="auto">{dailyPoem.poet}</p>
    </aside>
  )
}

function PaperIndexRow({ room, onOpen }) {
  return (
    <button
      className="paper-index-row"
      style={room.style}
      type="button"
      onClick={() => onOpen(room)}
    >
      <Dia />
      <span className="paper-index-name">{room.displayName}</span>
      <span className="paper-index-leader" aria-hidden="true" />
      <span className="paper-index-count">{room.count}</span>
      <small>{room.latest}</small>
    </button>
  )
}

function PaperCourt(props) {
  const {
    captureProps,
    clockLabel,
    dateLabel,
    dailyPoem,
    ground,
    greeting,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    shortDateLabel,
    streakDays,
    todayItems,
    cycleGround
  } = props
  const paperRooms = sortRoomsForPaper(rooms)
  const nextItems = todayItems.slice(0, 3)

  return (
    <section className="court-redesign court-redesign-paper" aria-label="The Court - Paper">
      <div className="paper-frame paper-frame-outer" aria-hidden="true" />
      <div className="paper-frame paper-frame-inner" aria-hidden="true" />
      <div className="paper-khatam"><KhatamMark /></div>

      <div className="paper-page">
        <header className="paper-header">
          <span>Life OS</span>
          <i aria-hidden="true" />
          <time>{dateLabel}</time>
          <strong>{clockLabel}</strong>
        </header>

        <CourtNav ground={ground} cycleGround={cycleGround} navigate={navigate} quiet />

        <section className="paper-greeting" aria-label="Court greeting">
          <h1>{greeting}.</h1>
          <p>The desk and the body saw work today. The twelve rooms are open.</p>
        </section>

        <form className="paper-capture" onSubmit={captureProps.handleSubmit}>
          <div className="paper-capture-line">
            <Dia />
            <CaptureFields {...captureProps} variant="paper" />
          </div>
          <p className="paper-capture-hint">it drafts the filing - you confirm - press Enter anywhere</p>
        </form>

        <section className="paper-index" aria-labelledby="paper-rooms-heading">
          <SectionRule right="12" id="paper-rooms-heading">The twelve rooms</SectionRule>
          <div className="paper-index-grid">
            {paperRooms.map((room) => (
              <PaperIndexRow key={room.slug} room={room} onOpen={onOpenRoom} />
            ))}
          </div>
        </section>

        <section className="paper-matter" aria-label="Court matter">
          <article>
            <SectionRule>Next</SectionRule>
            {nextItems.length ? (
              <ol className="paper-simple-list">
                {nextItems.map((entry) => (
                  <li key={entry.id}>
                    <time>{entry.time}</time>
                    <p>{entry.title}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyLine>No dated entries today.</EmptyLine>
            )}
          </article>

          <article>
            <SectionRule>Recently filed</SectionRule>
            {recentEntries.length ? (
              <ol className="recent-lines">
                {recentEntries.slice(0, 3).map((entry) => (
                  <RecentLine key={entry.id} entry={entry} />
                ))}
              </ol>
            ) : (
              <EmptyLine>No entries filed yet.</EmptyLine>
            )}
          </article>

          <article>
            <SectionRule>Streak</SectionRule>
            <div className="paper-streak">
              <StreakRing days={streakDays} />
              <div>
                <strong>{streakDays} of 12 days</strong>
                <span>Study room / {shortDateLabel}</span>
              </div>
            </div>
          </article>
        </section>

        <div className="paper-poem-wrap">
          <KhatamMark small />
          <PoemStrip dailyPoem={dailyPoem} />
        </div>
      </div>
    </section>
  )
}

function MadderDoor({ room, onOpen }) {
  return (
    <button className="madder-door" style={room.style} type="button" onClick={() => onOpen(room)}>
      <span>{room.icon}</span>
      <h2>{room.displayName}</h2>
      <p>{room.latest}</p>
      <small>{room.count} filed</small>
    </button>
  )
}

function MadderTile({ room, onOpen }) {
  return (
    <button className="madder-tile" style={room.style} type="button" onClick={() => onOpen(room)}>
      <span aria-hidden="true" />
      <strong>{room.displayName}</strong>
      <small>{room.count}</small>
    </button>
  )
}

function MadderCourt(props) {
  const {
    captureProps,
    clockLabel,
    dateLabel,
    dailyPoem,
    ground,
    greeting,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    todayItems,
    cycleGround
  } = props
  const featuredRooms = FEATURED_ROOMS.map((slug) => rooms.find((room) => room.slug === slug)).filter(Boolean)
  const quietRooms = rooms.filter((room) => !FEATURED_ROOMS.includes(room.slug))

  return (
    <section className="court-redesign court-redesign-madder" aria-label="The Court - Madder">
      <div className="madder-ticks" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <div className="madder-page">
        <header className="madder-header">
          <div>
            <span>Life OS</span>
            <time>{dateLabel}</time>
          </div>
          <CourtNav ground={ground} cycleGround={cycleGround} navigate={navigate} />
          <strong>{clockLabel}</strong>
        </header>

        <section className="madder-greeting" aria-label="Court greeting">
          <Dia />
          <h1>{greeting}.</h1>
          <p>The courtyard is open. File the thought, then choose a door.</p>
        </section>

        <section className="madder-courtyard" aria-label="Court courtyard">
          <aside className="madder-panel madder-today">
            <SectionRule>Today</SectionRule>
            {todayItems.length ? (
              <ol className="today-lines">
                {todayItems.slice(0, 5).map((entry) => (
                  <TodayLine key={entry.id} entry={entry} />
                ))}
              </ol>
            ) : (
              <EmptyLine>No dated entries today.</EmptyLine>
            )}
          </aside>

          <form className="madder-capture-pool" onSubmit={captureProps.handleSubmit}>
            <KhatamMark small />
            <h2>Capture pool</h2>
            <CaptureFields {...captureProps} variant="madder" />
          </form>

          <aside className="madder-panel">
            <SectionRule>Filed</SectionRule>
            {recentEntries.length ? (
              <ol className="recent-lines">
                {recentEntries.slice(0, 5).map((entry) => (
                  <RecentLine key={entry.id} entry={entry} />
                ))}
              </ol>
            ) : (
              <EmptyLine>No entries filed yet.</EmptyLine>
            )}
          </aside>
        </section>

        <section className="madder-doors" aria-label="Daily doors">
          {featuredRooms.map((room) => (
            <MadderDoor key={room.slug} room={room} onOpen={onOpenRoom} />
          ))}
        </section>

        <section className="madder-tiles" aria-label="Other rooms">
          {quietRooms.map((room) => (
            <MadderTile key={room.slug} room={room} onOpen={onOpenRoom} />
          ))}
        </section>

        <PoemStrip dailyPoem={dailyPoem} compact />
      </div>
    </section>
  )
}

function IndigoRoomRow({ room, onOpen }) {
  return (
    <button className="indigo-room-row" style={room.style} type="button" onClick={() => onOpen(room)}>
      <span>
        <strong>{room.displayName}</strong>
        <small>{room.latest}</small>
      </span>
      <em>{room.count}</em>
      <i aria-hidden="true">&gt;</i>
    </button>
  )
}

function IndigoRecentChip({ entry }) {
  return (
    <span className="indigo-recent-chip" style={{ '--room-accent': entry.room.accent }}>
      <b>{entry.icon}</b>
      <span>{entry.title}</span>
      <time>{entry.ago}</time>
    </span>
  )
}

function IndigoCourt(props) {
  const {
    captureProps,
    clockLabel,
    dailyPoem,
    dateLabel,
    ground,
    greeting,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    streakDays,
    todayItems,
    cycleGround
  } = props

  return (
    <section className="court-redesign court-redesign-indigo" aria-label="The Court - Indigo">
      <div className="indigo-page">
        <header className="indigo-header">
          <div>
            <span>Life OS</span>
            <time>{dateLabel}</time>
          </div>
          <CourtNav ground={ground} cycleGround={cycleGround} navigate={navigate} />
          <strong>{clockLabel}</strong>
        </header>

        <div className="indigo-workspace">
          <aside className="indigo-rail">
            <section className="indigo-rail-greeting">
              <p>{greeting}.</p>
              <span>Working rail / capture first</span>
            </section>

            <form className="indigo-capture" onSubmit={captureProps.handleSubmit}>
              <SectionRule right="Enter">Capture</SectionRule>
              <CaptureFields {...captureProps} variant="indigo" />
            </form>

            <section className="indigo-today">
              <SectionRule>Full day</SectionRule>
              {todayItems.length ? (
                <ol className="today-lines">
                  {todayItems.slice(0, 6).map((entry) => (
                    <TodayLine key={entry.id} entry={entry} />
                  ))}
                </ol>
              ) : (
                <EmptyLine>No dated entries today.</EmptyLine>
              )}
            </section>

            <section className="indigo-streak">
              <StreakRing days={streakDays} />
              <div>
                <strong>{streakDays} / 12</strong>
                <span>Study streak</span>
              </div>
            </section>
          </aside>

          <div className="indigo-divider" aria-hidden="true" />

          <section className="indigo-register" aria-label="The twelve rooms">
            <div className="indigo-register-head">
              <div>
                <p>The twelve rooms</p>
                <h1>Register</h1>
              </div>
              <span>Wing grouped / live counts</span>
            </div>

            <div className="indigo-wings">
              {WINGS.map((wing) => (
                <section key={wing.key}>
                  <SectionRule>{wing.label}</SectionRule>
                  {wing.rooms.map((slug) => {
                    const room = rooms.find((item) => item.slug === slug)
                    return room ? <IndigoRoomRow key={room.slug} room={room} onOpen={onOpenRoom} /> : null
                  })}
                </section>
              ))}
            </div>

            <section className="indigo-recent" aria-label="Recently filed">
              <SectionRule>Recently filed</SectionRule>
              {recentEntries.length ? (
                <div>
                  {recentEntries.slice(0, 4).map((entry) => (
                    <IndigoRecentChip key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyLine>No entries filed yet.</EmptyLine>
              )}
            </section>

            <PoemStrip dailyPoem={dailyPoem} compact />
          </section>
        </div>
      </div>
    </section>
  )
}

export default function TheCourt() {
  const navigate = useNavigate()
  const { ground, cycleGround } = useGround()
  const [body, setBody] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [detailsDraft, setDetailsDraft] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const { entries, refetch } = useEntries('?limit=80')
  const todayKey = useMemo(() => formatDateKey(new Date()), [])
  const todayEntries = useEntries(`?from=${todayKey}&end=${todayKey}`)

  const [now, setNow] = useState(() => new Date())
  const entryTypeOptions = useMemo(() => Object.entries(ENTRY_TYPES), [])
  const dailyPoem = useMemo(() => poemForDate(new Date()), [])
  const rooms = useMemo(() => buildRoomModel(entries), [entries])
  const studyCount = useMemo(() => {
    return entries.filter((entry) => roomSlugsForType(entry.type).includes('study')).length
  }, [entries])
  const streakDays = Math.min(12, studyCount)
  const recentEntries = useMemo(() => {
    return entries.slice(0, 6).map((entry) => {
      const room = roomForEntry(entry, rooms)

      return {
        id: entry.id,
        icon: ENTRY_TYPES[entry.type]?.icon || 'N',
        title: entryTitle(entry),
        excerpt: entryExcerpt(entry),
        type: entryTypeLabel(entry),
        ago: relativeTime(entry.created_at),
        room
      }
    })
  }, [entries, rooms])
  const todayItems = useMemo(() => {
    const currentTime = Date.now()

    return todayEntries.entries.map((entry) => {
      const room = roomForEntry(entry, rooms)
      const startTime = entry.start_at ? new Date(entry.start_at).getTime() : Number.NaN

      return {
        id: entry.id,
        title: entryTitle(entry),
        type: entryTypeLabel(entry),
        time: entry.all_day ? 'all day' : timeLabel(entry.start_at),
        done: Number.isFinite(startTime) && startTime < currentTime,
        room
      }
    }).slice(0, 7)
  }, [rooms, todayEntries.entries])

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
    } catch (error) {
      setSubmitError(error.message)
      setStatus('idle')
    }
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleSubmit(event)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      handleSubmit(event)
    }
  }

  function onOpenRoom(room) {
    if (room.slug === 'study') {
      navigate('/study')
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const captureProps = {
    body,
    detailsDraft,
    entryType,
    entryTypeOptions,
    handleKeyDown,
    handleSubmit,
    setBody,
    setDetailsDraft,
    setEntryType,
    setSubmitError,
    status,
    submitError
  }
  const commonProps = {
    captureProps,
    clockLabel: clockLabelFor(now),
    cycleGround,
    dailyPoem,
    dateLabel: dateLabelFor(now),
    ground,
    greeting: greetingFor(now),
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    shortDateLabel: shortDateLabelFor(now),
    streakDays,
    todayItems
  }

  if (ground === 'paper') {
    return <PaperCourt {...commonProps} />
  }

  if (ground === 'indigo') {
    return <IndigoCourt {...commonProps} />
  }

  return <MadderCourt {...commonProps} />
}
