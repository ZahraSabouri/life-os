import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ENTRY_TYPES, validateDetails } from '@shared/entryTypes.js'
import { ROOMS } from '@shared/rooms.js'
import FieldsForm from './FieldsForm.jsx'
import { apiFetch } from '../lib/api.js'
import { useEntries } from '../lib/useEntries.js'
import { useGround } from '../lib/groundContext.jsx'
import StyleSwitch from './StyleSwitch.jsx'
import { calendarArea, calendarDisplay, calendarKind, filterCalendarItems, itemTime, todayGroups } from '../lib/calendar.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { clockLabelFor, dateLabelFor, greetingFor, jalaliDateLabelFor, shortDateLabelFor, weekdayLabelFor } from '../lib/courtClock.js'

const ROOM_NAME_OVERRIDES = {
  study: 'Study',
  academia: 'Academia',
  career: 'Career',
  growth: 'Growth',
  body: 'Body',
  relationships: 'Relationships',
  culture: 'Culture',
  travel: 'Travel',
  memories: 'Memories',
  home: 'Home',
  mind: 'Mind',
  style: 'Closet'
}

const ROOM_PRESENTATION = {
  study: { motif: 'book', wing: 'desk', latest: 'FIN301 - three revision blocks left this week' },
  academia: { motif: 'academy', wing: 'desk', latest: 'PhD scholarships - Cardiff shortlist drafted' },
  career: { motif: 'case', wing: 'desk', latest: 'Admiral / Data Analyst - applied Tuesday' },
  growth: { motif: 'sprout', wing: 'self', latest: 'SQL course - window functions, lesson 9' },
  body: { motif: 'workout', wing: 'self', latest: 'Push day - five PRs / Bute Park 5k Sunday' },
  style: { motif: 'shirt', wing: 'self', latest: 'Eighteen pieces photographed / two outfits' },
  relationships: { motif: 'heart', wing: 'world', latest: "Sara's birthday - 12 Aug / gift idea saved" },
  travel: { motif: 'compass', wing: 'world', latest: 'London - 19 Jul / 09:12 train booked' },
  home: { motif: 'home', wing: 'world', latest: 'Groceries Saturday / fix the desk lamp' },
  culture: { motif: 'film', wing: 'soul', latest: 'The Blind Owl - chapter four' },
  memories: { motif: 'photo', wing: 'soul', latest: 'Penarth pier at low tide - fourteen photos' },
  mind: { motif: 'quill', wing: 'soul', latest: 'Morning pages / idea - poem-a-day widget' }
}

const ROOM_ACCENTS = {
  study: { dark: '#6fb3a6', paper: '#2f8f83' },
  academia: { dark: '#7c9ec2', paper: '#3a5ba0' },
  career: { dark: '#9a9de0', paper: '#4b4fbf' },
  growth: { dark: '#96b579', paper: '#4f9d4f' },
  body: { dark: '#de8f6d', paper: '#c05a38' },
  style: { dark: '#a3a5c4', paper: '#6b6d92' },
  relationships: { dark: '#d492ac', paper: '#b05a7c' },
  travel: { dark: '#7fb3d4', paper: '#35789f' },
  home: { dark: '#d9a94a', paper: '#a9702a' },
  culture: { dark: '#b193d8', paper: '#7a4fb3' },
  memories: { dark: '#adb37e', paper: '#7a8148' },
  mind: { dark: '#c9917f', paper: '#a05a44' }
}

const GLYPHS = {
  academy: '<path d="M12 4.5 L21 9 L12 13.5 L3 9 Z"/><path d="M6.5 11 V15.5 C6.5 17 9 18.5 12 18.5 C15 18.5 17.5 17 17.5 15.5 V11"/><path d="M21 9 V14"/>',
  book: '<path d="M4 5.2 C7 4.2 9.6 4.4 12 6.2 C14.4 4.4 17 4.2 20 5.2 L20 18.6 C17 17.6 14.4 17.4 12 19.2 C9.6 17.4 7 17.6 4 18.6 Z"/><path d="M12 6.2 V19.2"/>',
  case: '<rect x="3.8" y="8" width="16.4" height="11.2" rx="1.5"/><path d="M8.8 8 V6.2 A1.2 1.2 0 0 1 10 5 H14 A1.2 1.2 0 0 1 15.2 6.2 V8"/><path d="M3.8 12.5 H20.2"/>',
  chev: '<path d="M9 5 L16 12 L9 19"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z"/>',
  event: '<rect x="4" y="5.5" width="16" height="14.5" rx="1.6"/><path d="M4 9.5 H20 M8.5 3.5 V7 M15.5 3.5 V7"/>',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M7.5 5 V19 M16.5 5 V19 M3.5 9 H7.5 M3.5 15 H7.5 M16.5 9 H20.5 M16.5 15 H20.5"/>',
  heart: '<path d="M12 20 C7 16 3.5 12.8 3.5 9.2 C3.5 6.8 5.3 5 7.6 5 C9.4 5 10.9 6 12 7.8 C13.1 6 14.6 5 16.4 5 C18.7 5 20.5 6.8 20.5 9.2 C20.5 12.8 17 16 12 20 Z"/>',
  home: '<path d="M4 11 L12 4 L20 11"/><path d="M6 9.6 V19.5 H18 V9.6"/>',
  mic: '<rect x="9.4" y="3" width="5.2" height="10.4" rx="2.6"/><path d="M6 11.2 A6 6 0 0 0 18 11.2"/><path d="M12 17.2 V20.4 M9 20.4 H15"/>',
  note: '<path d="M5.5 6.5 H15 M5.5 11 H18.5 M5.5 15.5 H12.5"/>',
  photo: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.4"/><circle cx="8.8" cy="10" r="1.7"/><path d="M4.5 17 L9.2 12.2 L13 15 L16.6 11 L19.6 14"/>',
  place: '<path d="M12 20.5 C7 15 5.8 11.4 5.8 9 A6.2 6.2 0 1 1 18.2 9 C18.2 11.4 17 15 12 20.5 Z"/><circle cx="12" cy="9" r="2.3"/>',
  quill: '<path d="M5.5 18.5 C10 8.5 15 5.5 19.5 5 C19 9.5 16 14.5 5.5 18.5 Z"/><path d="M5.5 18.5 L10 14"/>',
  send: '<path d="M20 6 V10.6 A2 2 0 0 1 18 12.6 H5"/><path d="M9.2 8.4 L5 12.6 L9.2 16.8"/>',
  spark: '<path d="M12 3 C12 8 13.4 10.6 21 12 C13.4 13.4 12 16 12 21 C12 16 10.6 13.4 3 12 C10.6 10.6 12 8 12 3 Z"/>',
  sprout: '<path d="M12 20.5 V11"/><path d="M12 11 C12 7 9.5 5 5.5 5 C5.5 9 8 11 12 11 Z"/><path d="M12 13.5 C12 10.2 14.2 8.5 17.5 8.5 C17.5 11.8 15.3 13.5 12 13.5 Z"/>',
  task: '<path d="M4.5 12.5 L9.5 17.5 L19.5 6.5"/>',
  shirt: '<path d="M8.5 4.5 C8.5 6 10 7 12 7 C14 7 15.5 6 15.5 4.5 L20.5 7.5 L18.8 11 L16.5 10 V19.5 H7.5 V10 L5.2 11 L3.5 7.5 Z"/>',
  workout: '<path d="M4 9.5 V14.5 M6.8 7 V17 M17.2 7 V17 M20 9.5 V14.5 M6.8 12 H17.2"/>'
}

const TYPE_ROOM_FALLBACKS = {
  note: ['mind'],
  task: ['home'],
  event: ['home'],
  place: ['travel']
}

const FEATURED_ROOMS = ['study', 'career', 'body']
const ROOM_ORDER = [
  'study', 'academia', 'career', 'growth', 'body', 'style',
  'relationships', 'travel', 'home', 'culture', 'memories', 'mind'
]

const WINGS = [
  { key: 'desk', label: 'The Desk', rooms: ['study', 'academia', 'career'] },
  { key: 'self', label: 'The Self', rooms: ['growth', 'body', 'style'] },
  { key: 'world', label: 'The World', rooms: ['relationships', 'travel', 'home'] },
  { key: 'soul', label: 'The Soul', rooms: ['culture', 'memories', 'mind'] }
]

const COURT_POEMS = {
  paper: {
    poet: 'حافظ',
    lines: ['هرگز نمیرد آن که دلش زنده شد به عشق', 'ثبت است بر جریدهٔ عالم دوامِ ما'],
    hi: 'ثبت است',
    en: 'It is inscribed in the ledger of the world - our permanence.'
  },
  madder: {
    poet: 'مولانا',
    lines: ['از محبت تلخ‌ها شیرین شود', 'از محبت مس‌ها زرّین شود'],
    hi: 'زرّین',
    en: 'Through love all bitterness turns sweet; through love copper turns to gold.'
  },
  indigo: {
    poet: 'خیام',
    lines: ['این یک دو سه روزه نوبتِ عمر گذشت', 'چون آب به جویبار و چون باد به دشت'],
    hi: 'عمر',
    en: 'These two or three days, the turn of a life, slip by - like water in the brook, like wind on the plain.'
  }
}

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

function buildRoomModel(entries, scheme) {
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
      latest: latestEntry ? entryTitle(latestEntry) : ROOM_PRESENTATION[room.slug]?.latest || room.blurb,
      motif: ROOM_PRESENTATION[room.slug]?.motif || 'note',
      wing: ROOM_PRESENTATION[room.slug]?.wing || 'soul',
      accent: ROOM_ACCENTS[room.slug]?.[scheme === 'light' ? 'paper' : 'dark'] || room.accent,
      style: { '--room-accent': ROOM_ACCENTS[room.slug]?.[scheme === 'light' ? 'paper' : 'dark'] || room.accent }
    }
  }).sort((left, right) => ROOM_ORDER.indexOf(left.slug) - ROOM_ORDER.indexOf(right.slug))
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

function Glyph({ name, size = 20, stroke = 1.5 }) {
  return (
    <svg
      className="redesign-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] || GLYPHS.note }}
    />
  )
}

function CourtNav({ navigate, quiet = false }) {
  return (
    <nav className={quiet ? 'redesign-nav redesign-nav-quiet' : 'redesign-nav'} aria-label="Primary">
      <button type="button" onClick={() => navigate('/today')}>Today</button>
      <button type="button" onClick={() => navigate('/calendar')}>Calendar</button>
      <button className="redesign-search-button" type="button">Search <kbd>⌘K</kbd></button>
      <StyleSwitch className="redesign-ground-button" compact />
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
  const courtPlaceholder = variant === 'paper'
    ? 'Tell me about your day - it files itself…'
    : variant === 'madder'
      ? 'Tell me about your day…'
      : 'Tell Life OS anything - it files itself after you confirm.'

  return (
    <>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={entryType === 'note'
          ? courtPlaceholder
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
      <span><Glyph name={entry.glyph} size={15} /></span>
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
        <p><Link to={entry.href}>{entry.title}</Link></p>
        <small>{entry.room.displayName} / {entry.type}</small>
      </div>
    </li>
  )
}

function CourtCalendarNote({ calendar }) {
  const failed = calendar.sources.filter(source => source.status === 'unavailable')
  if (calendar.loading) return <p className="court-calendar-note" role="status">Loading your day…</p>
  if (calendar.error) return <p className="court-calendar-note">Dates could not be loaded. <Link to="/today">Open Today to retry</Link>.</p>
  if (failed.length) return <p className="court-calendar-note">Some areas could not be loaded. <Link to="/today">See details</Link>.</p>
  if (calendar.choicesError) return <p className="court-calendar-note">Cardiff choices could not be read. <Link to="/today">See details</Link>.</p>
  return null
}

function PoemStrip({ dailyPoem, compact = false, variant = 'paper' }) {
  function renderLine(line) {
    if (!dailyPoem.hi || !line.includes(dailyPoem.hi)) return line

    const [before, after] = line.split(dailyPoem.hi)
    return <>{before}<span className="redesign-poem-highlight">{dailyPoem.hi}</span>{after}</>
  }

  if (variant === 'indigo') {
    return (
      <aside className="redesign-poem redesign-poem-compact redesign-poem-indigo" aria-label="Poem of the day">
        <p className="redesign-poem-en">{dailyPoem.en}</p>
        <span className="redesign-poem-spacer" />
        <p className="redesign-indigo-verse" dir="rtl">
          {renderLine(dailyPoem.lines[0])}
          <span>·</span>
          <em>{dailyPoem.poet}</em>
        </p>
      </aside>
    )
  }

  return (
    <aside className={compact ? `redesign-poem redesign-poem-compact redesign-poem-${variant}` : `redesign-poem redesign-poem-${variant}`} aria-label="Poem of the day" dir="rtl">
      <div className="redesign-poem-lines" dir="auto">
        {dailyPoem.lines.map((line, index) => (
          <p key={`${line}-${index}`}>{renderLine(line)}</p>
        ))}
      </div>
      <div className="redesign-poet-row"><i /><p className="redesign-poet" dir="auto">{dailyPoem.poet}</p><i /></div>
      {dailyPoem.en ? <p className="redesign-poem-en" dir="ltr">{dailyPoem.en}</p> : null}
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
    calendarState,
    clockLabel,
    dateLabel,
    dailyPoem,
    ground,
    greeting,
    jalaliDateLabel,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    shortDateLabel,
    streakDays,
    todayItems
  } = props
  const paperRooms = rooms
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
          <strong>{jalaliDateLabel || clockLabel}</strong>
        </header>

        <CourtNav navigate={navigate} quiet />

        <section className="paper-greeting" aria-label="Court greeting">
          <h1>{greeting}, Xar.</h1>
          <p>The desk and the body saw work today · Tehran calls at 19:00</p>
        </section>

        <form className="paper-capture" onSubmit={captureProps.handleSubmit}>
          <div className="paper-capture-line">
            <Dia />
            <CaptureFields {...captureProps} variant="paper" />
            <span className="paper-capture-enter" aria-hidden="true">⏎</span>
          </div>
          <p className="paper-capture-hint">it drafts the filing - you confirm · press / anywhere</p>
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
            <CourtCalendarNote calendar={calendarState} />
            {nextItems.length ? (
              <ol className="paper-simple-list">
                {nextItems.map((entry) => (
                  <li key={entry.id}>
                    <time>{entry.time}</time>
                    <p><Link to={entry.href}>{entry.title}</Link></p>
                  </li>
                ))}
              </ol>
            ) : (
              !calendarState.loading && !calendarState.error ? <EmptyLine>{calendarDisplay(calendarState, { empty: 'No dated items today.' }).emptyMessage} <Link to="/today">Open Today</Link></EmptyLine> : null
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
          <PoemStrip dailyPoem={dailyPoem} variant="paper" />
        </div>
      </div>
    </section>
  )
}

function MadderDoor({ room, onOpen, streakDays }) {
  const metaLine = {
    study: '4 open · exam 14 Jul',
    career: '6 open · 2 interviews ahead',
    body: '2 open · 5k Sunday'
  }

  return (
    <button className="madder-door" style={room.style} type="button" onClick={() => onOpen(room)}>
      <div className="madder-door-copy">
        <div className="madder-door-title">
          <Glyph name={room.motif} size={20} />
          <h2>{room.displayName}</h2>
        </div>
        <p>{room.latest}</p>
        <small>{metaLine[room.slug]}</small>
      </div>
      {room.slug === 'study'
        ? <StreakRing days={streakDays} of={14} />
        : <span className="madder-door-chevron"><Glyph name="chev" size={14} stroke={1.6} /></span>}
    </button>
  )
}

function MadderTile({ room, onOpen }) {
  return (
    <button className="madder-tile" style={room.style} type="button" onClick={() => onOpen(room)}>
      <span aria-hidden="true"><Glyph name={room.motif} size={16} /></span>
      <strong>{room.displayName}</strong>
      <small>{room.count}</small>
    </button>
  )
}

function MadderDayChannel({ clockLabel, todayItems, calendarState }) {
  const stops = todayItems.slice(0, 4)

  return (
    <section className="madder-day-channel" aria-label="Today channel">
      <SectionRule right={`now · ${clockLabel}`}>Today</SectionRule>
      <CourtCalendarNote calendar={calendarState} />
      <div className="madder-channel-track">
        <span className="madder-channel-line" aria-hidden="true" />
        {stops.length ? (
          stops.map((entry, index) => {
            const stopX = stops.length === 1 ? 50 : 6 + (index * (88 / (stops.length - 1)))

            return (
              <article
                className="madder-stop"
                key={entry.id}
                style={{ '--stop-x': `${stopX}%`, '--room-accent': entry.room.accent }}
              >
                <time>{entry.time}</time>
                <Dia />
                <p><Link to={entry.href}>{entry.title}</Link></p>
              </article>
            )
          })
        ) : (
          !calendarState.loading && !calendarState.error ? <EmptyLine>{calendarDisplay(calendarState, { empty: 'No dated items today.' }).emptyMessage} <Link to="/today">Open Today</Link></EmptyLine> : null
        )}
        <div className="madder-now-marker" style={{ '--stop-x': '52%' }}>
          <Dia />
          <span>Now</span>
        </div>
      </div>
    </section>
  )
}

function MadderCourt(props) {
  const {
    captureProps,
    calendarState,
    clockLabel,
    dateLabel,
    dailyPoem,
    ground,
    greeting,
    jalaliDateLabel,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    streakDays,
    todayItems
  } = props
  const featuredRooms = FEATURED_ROOMS.map((slug) => rooms.find((room) => room.slug === slug)).filter(Boolean)
  const quietRooms = rooms.filter((room) => !FEATURED_ROOMS.includes(room.slug))

  return (
    <section className="court-redesign court-redesign-madder" aria-label="The Court - Madder">
      <div className="madder-ticks" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <div className="madder-page">
        <div className="madder-frame" aria-hidden="true" />
        <div className="madder-khatam"><KhatamMark /></div>

        <header className="madder-header">
          <span>Life OS</span>
          <CourtNav navigate={navigate} />
          <div className="madder-date-stack">
            <time>{dateLabel}</time>
            <strong>{jalaliDateLabel}</strong>
          </div>
        </header>

        <section className="madder-greeting" aria-label="Court greeting">
          <h1>{greeting}, Xar.</h1>
          <p>Eleven days of study kept · two rooms saw work today</p>
        </section>

        <form className="madder-capture-pool" onSubmit={captureProps.handleSubmit}>
          <span className="madder-mic" aria-hidden="true"><Glyph name="mic" size={17} /></span>
          <CaptureFields {...captureProps} variant="madder" />
          <button className="madder-send" type="submit" disabled={!captureProps.body.trim() || captureProps.status === 'saving'}>
            <Glyph name="send" size={15} />
          </button>
        </form>

        <p className="madder-capture-hint">try - “exam on the 14th at 9, and I finished chapter four of The Blind Owl”</p>

        <MadderDayChannel clockLabel={clockLabel} todayItems={todayItems} calendarState={calendarState} />

        <section className="madder-doors" aria-label="Daily doors">
          {featuredRooms.map((room) => (
            <MadderDoor key={room.slug} room={room} onOpen={onOpenRoom} streakDays={streakDays} />
          ))}
        </section>

        <section className="madder-tiles" aria-label="Other rooms">
          {quietRooms.map((room) => (
            <MadderTile key={room.slug} room={room} onOpen={onOpenRoom} />
          ))}
        </section>

        <section className="madder-footer" aria-label="Filed and poem">
          <article>
            <SectionRule>Filed</SectionRule>
            {recentEntries.length ? (
              <ol className="recent-lines">
                {recentEntries.slice(0, 4).map((entry) => (
                  <RecentLine key={entry.id} entry={entry} />
                ))}
              </ol>
            ) : (
              <EmptyLine>No entries filed yet.</EmptyLine>
            )}
          </article>
          <PoemStrip dailyPoem={dailyPoem} compact variant="madder" />
        </section>
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
      <i aria-hidden="true"><Glyph name="chev" size={12} stroke={1.6} /></i>
    </button>
  )
}

function IndigoRecentChip({ entry }) {
  return (
    <span className="indigo-recent-chip" style={{ '--room-accent': entry.room.accent }}>
      <b><Glyph name={entry.glyph} size={14} /></b>
      <span>{entry.title}</span>
      <time>{entry.ago}</time>
    </span>
  )
}

function IndigoDraftRow({ icon, meta, room, roomName, title }) {
  return (
    <div className="indigo-draft-row" style={{ '--room-accent': room }}>
      <span className="indigo-draft-icon"><Glyph name={icon} size={15} /></span>
      <span className="indigo-draft-copy">
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
      <span className="indigo-draft-room">{roomName}</span>
      <button type="button" aria-label={`Remove ${title}`}>×</button>
    </div>
  )
}

function IndigoCapture({ captureProps }) {
  return (
    <form className="indigo-capture" onSubmit={captureProps.handleSubmit}>
      <div className="indigo-capture-copy">
        <span>exam on the 14th at 9, and buy Sara’s gift before her birthday<i aria-hidden="true" /></span>
        <kbd>⌘K</kbd>
      </div>
      <div className="indigo-capture-divider" />
      <p>Understood as</p>
      <div className="indigo-drafts">
        <IndigoDraftRow icon="event" title="FIN301 exam" meta="14 Jul · 09:00" room="#6fb3a6" roomName="Study" />
        <IndigoDraftRow icon="task" title="Buy Sara’s gift" meta="before 12 Aug" room="#d492ac" roomName="Relationships" />
      </div>
      <div className="indigo-capture-actions">
        <button type="submit">File both</button>
        <button type="button">Discard</button>
      </div>
    </form>
  )
}

function IndigoCourt(props) {
  const {
    captureProps,
    calendarState,
    clockLabel,
    dailyPoem,
    dateLabel,
    ground,
    greeting,
    jalaliDateLabel,
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    streakDays,
    todayItems,
    weekdayLabel
  } = props

  return (
    <section className="court-redesign court-redesign-indigo" aria-label="The Court - Indigo">
      <div className="indigo-page">
        <header className="indigo-header">
          <span>Life OS</span>
          <CourtNav navigate={navigate} />
          <i aria-hidden="true" />
          <time>{dateLabel}<strong>{jalaliDateLabel}</strong></time>
        </header>

        <div className="indigo-workspace">
          <aside className="indigo-rail">
            <section className="indigo-rail-greeting">
              <p>{greeting}, Xar.</p>
              <span>{weekdayLabel} · {clockLabel} · FIN301 in 11 days</span>
            </section>

            <IndigoCapture captureProps={captureProps} />

            <section className="indigo-today">
              <SectionRule right={weekdayLabel}>Full day</SectionRule>
              <CourtCalendarNote calendar={calendarState} />
              {todayItems.length ? (
                <ol className="today-lines">
                  {todayItems.slice(0, 6).flatMap((entry, index, items) => [
                    <TodayLine key={entry.id} entry={entry} />,
                    entry.done && !items[index + 1]?.done ? (
                      <li className="indigo-now-line" key={`${entry.id}-now`}>
                        <i /><Dia /><span>now · {clockLabel}</span><i />
                      </li>
                    ) : null
                  ])}
                </ol>
              ) : (
                !calendarState.loading && !calendarState.error ? <EmptyLine>{calendarDisplay(calendarState, { empty: 'No dated items today.' }).emptyMessage} <Link to="/today">Open Today</Link></EmptyLine> : null
              )}
            </section>

            <section className="indigo-streak">
              <StreakRing days={streakDays} of={14} />
              <div>
                <strong>{streakDays}-day study streak</strong>
                <span>FIN301 · 14 Jul · in 11 days</span>
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

            <PoemStrip dailyPoem={dailyPoem} compact variant="indigo" />
          </section>
        </div>
      </div>
    </section>
  )
}

// Rooms that already open somewhere; the rest stay plain tiles until their area exists.
const ROOM_DESTINATIONS = { study: 'Study Hub', career: 'JobMap', relationships: 'Cardiff Life', home: 'Budget' }

function ModernRoom({ room, onOpen }) {
  const destination = ROOM_DESTINATIONS[room.slug]
  const body = (
    <>
      <span className="modern-room-icon" aria-hidden="true"><Glyph name={room.motif} size={18} /></span>
      <span className="modern-room-copy">
        <strong>{room.displayName}</strong>
        <small>{destination ? `Open ${destination}` : room.count ? room.latest : room.blurb}</small>
      </span>
      <span className="modern-room-count" aria-label={`${room.count} filed`}>{room.count}</span>
    </>
  )
  return destination
    ? <button className="modern-room is-linked" style={room.style} type="button" onClick={() => onOpen(room)}>{body}</button>
    : <div className="modern-room" style={room.style}>{body}</div>
}

function ModernCourt(props) {
  const { captureProps, calendarState, dailyPoem, greeting, jalaliDateLabel, onOpenRoom, recentEntries, rooms, todayItems, weekdayLabel } = props

  return (
    <section className="modern-court" aria-label="Home">
      <header className="modern-court-heading">
        <p className="modern-eyebrow">{weekdayLabel} · {jalaliDateLabel}</p>
        <h1>{greeting}, Xar.</h1>
      </header>

      <form className="modern-card modern-capture" onSubmit={captureProps.handleSubmit}>
        <CaptureFields {...captureProps} variant="modern" />
      </form>

      <div className="modern-court-grid">
        <section className="modern-card" aria-labelledby="modern-today">
          <div className="modern-card-heading">
            <h2 id="modern-today">Today</h2>
            <Link to="/today">Open Today</Link>
          </div>
          <CourtCalendarNote calendar={calendarState} />
          {todayItems.length ? (
            <ol className="modern-today-list">
              {todayItems.map((entry) => (
                <li key={entry.id} style={{ '--room-accent': entry.room.accent }}>
                  <time>{entry.time}</time>
                  <p><Link to={entry.href}>{entry.title}</Link><small>{entry.room.displayName} · {entry.type}</small></p>
                </li>
              ))}
            </ol>
          ) : (
            !calendarState.loading && !calendarState.error ? <p className="modern-empty">{calendarDisplay(calendarState, { empty: 'No dated items today.' }).emptyMessage}</p> : null
          )}
        </section>

        <section className="modern-card" aria-labelledby="modern-filed">
          <div className="modern-card-heading">
            <h2 id="modern-filed">Recently filed</h2>
            <Link to="/ledger">Open Ledger</Link>
          </div>
          {recentEntries.length ? (
            <ol className="modern-filed-list">
              {recentEntries.slice(0, 5).map((entry) => (
                <li key={entry.id} style={{ '--room-accent': entry.room.accent }}>
                  <span aria-hidden="true"><Glyph name={entry.glyph} size={15} /></span>
                  <p>{entry.title}<small>{entry.type}</small></p>
                  <time>{entry.ago}</time>
                </li>
              ))}
            </ol>
          ) : <p className="modern-empty">No entries filed yet.</p>}
        </section>
      </div>

      <section aria-labelledby="modern-areas">
        <div className="modern-card-heading">
          <h2 id="modern-areas">Your areas</h2>
        </div>
        <div className="modern-rooms">
          {rooms.map((room) => <ModernRoom key={room.slug} room={room} onOpen={onOpenRoom} />)}
        </div>
      </section>

      <aside className="modern-card modern-poem" aria-label="Poem of the day">
        <div dir="rtl">{dailyPoem.lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
        <p className="modern-poem-credit" dir="auto">{dailyPoem.poet}</p>
        {dailyPoem.en ? <p className="modern-poem-en">{dailyPoem.en}</p> : null}
      </aside>
    </section>
  )
}

// The three ancient Court pages flow like any other page: they fill the window, their
// columns fold on a narrow one, and the page scrolls when it must. (They were once pinned
// to a fixed 1512 x 982 sheet and scaled, which made a small box with small text.)
// On a window larger than a laptop's the whole page is enlarged to match, so the text
// grows with the screen and the page still fits without scrolling.
const COURT_COMFORT = { width: 1360, height: 940 }
const LARGEST_COURT_ZOOM = 1.6

function courtZoom() {
  const width = document.documentElement.clientWidth
  if (width <= 1100) return 1
  const zoom = Math.min(width / COURT_COMFORT.width, window.innerHeight / COURT_COMFORT.height)
  return Math.min(LARGEST_COURT_ZOOM, Math.max(1, Math.round(zoom * 100) / 100))
}

function CourtStage({ children }) {
  const [zoom, setZoom] = useState(courtZoom)

  useEffect(() => {
    const fit = () => setZoom(courtZoom())
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return <div className="court-flow" style={{ '--court-zoom': zoom, zoom }}>{children}</div>
}

export default function TheCourt() {
  const navigate = useNavigate()
  const { ground, scheme } = useGround()
  const [body, setBody] = useState('')
  const [entryType, setEntryType] = useState('note')
  const [detailsDraft, setDetailsDraft] = useState({})
  const [status, setStatus] = useState('idle')
  const [submitError, setSubmitError] = useState('')
  const { entries, refetch } = useEntries('?limit=80')
  const todayKey = useLondonToday()
  const calendarState = useCalendar(todayKey, todayKey)

  const [now, setNow] = useState(() => new Date())
  const entryTypeOptions = useMemo(() => Object.entries(ENTRY_TYPES), [])
  const rooms = useMemo(() => buildRoomModel(entries, scheme), [entries, scheme])
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
        glyph: GLYPHS[entry.type] ? entry.type : 'note',
        title: entryTitle(entry),
        excerpt: entryExcerpt(entry),
        type: entryTypeLabel(entry),
        ago: relativeTime(entry.created_at),
        room
      }
    })
  }, [entries, rooms])
  const todayItems = useMemo(() => {
    const items = todayGroups(filterCalendarItems(calendarState.items, { choices: calendarState.choices }), todayKey).today
    return items.map((item) => {
      const area = calendarArea(item.area)
      const slug = { money: 'home', events: 'relationships', core: 'mind' }[item.area] || item.area
      const room = rooms.find(candidate => candidate.slug === slug) || rooms[0]
      return {
        id: item.id,
        title: `${item.meta?.savedSnapshot ? 'Saved copy · ' : ''}${item.choice === 'maybe' ? 'Maybe · ' : ''}${item.title}`,
        type: calendarKind(item.kind),
        time: itemTime(item),
        href: item.href || '/today',
        done: false,
        room: { ...room, displayName: area.label, accent: area.tone }
      }
    }).slice(0, 7)
  }, [rooms, calendarState.items, calendarState.choices, todayKey])

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
        calendarState.refetch()
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
    if (room.slug === 'relationships') {
      navigate('/cardiff-life')
    }
    if (room.slug === 'home') {
      navigate('/budget')
    }
    if (room.slug === 'career') {
      navigate('/jobmap')
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
    calendarState,
    clockLabel: clockLabelFor(now),
    dailyPoem: COURT_POEMS[ground] || COURT_POEMS.paper,
    dateLabel: dateLabelFor(now),
    ground,
    greeting: greetingFor(now),
    jalaliDateLabel: jalaliDateLabelFor(now),
    navigate,
    onOpenRoom,
    recentEntries,
    rooms,
    shortDateLabel: shortDateLabelFor(now),
    streakDays,
    todayItems,
    weekdayLabel: weekdayLabelFor(now)
  }

  if (ground === 'modern') {
    return <ModernCourt {...commonProps} />
  }

  if (ground === 'paper') {
    return <CourtStage><PaperCourt {...commonProps} /></CourtStage>
  }

  if (ground === 'indigo') {
    return <CourtStage><IndigoCourt {...commonProps} /></CourtStage>
  }

  return <CourtStage><MadderCourt {...commonProps} /></CourtStage>
}
