import { useMemo } from 'react'
import {
  addDays,
  formatDate,
  getCardDate,
  isOverdue,
  sortCards,
  sumHours,
  toDate,
} from '../utils/progress'
import {
  Diamond,
  Khatam,
  ManuscriptPage,
  Rubric,
  alpha,
  paletteFor,
} from './ManuscriptPrimitives'
import './campaign.css'

const MODULES = [
  { group: 'Applied ML', code: 'CMT307', color: 'aml' },
  { group: 'Time Series', code: 'MA4508', color: 'ts' },
  { group: 'MAT700', code: 'MAT700', color: 'mat' },
  { group: 'Group Project', code: 'CMT501', color: 'project' },
]

const BASE_PHASES = [
  { number: 'I', key: 'Phase 1', name: 'Foundations', note: 'labs runnable, notes indexed', weight: 0.2 },
  { number: 'II', key: 'Phase 2', name: 'Understand', note: 'closed-book concept work', weight: 0.35 },
  { number: 'III', key: 'Phase 3', name: 'Practice', note: 'worked examples, timed sections', weight: 0.25 },
  { number: 'IV', key: 'Phase 4', name: 'Mock', note: 'two full papers under the clock', weight: 0.12 },
  { number: 'V', key: 'Phase 5', name: 'Polish', note: 'error log + open-book pack', weight: 0.08 },
]

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function dateDiff(start, end) {
  const a = toDate(start)
  const b = toDate(end)
  if (!a || !b) return 0
  return Math.round((b - a) / 86400000)
}

function compactDate(value) {
  const date = toDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function hours(value) {
  const amount = Number(value || 0)
  return Number.isInteger(amount) ? `${amount}h` : `${amount.toFixed(1)}h`
}

function pageProps(props) {
  const campaignStart = props.schedule?.campaignStart || props.referenceDate
  const campaignEnd = props.schedule?.campaignEnd || props.referenceDate
  return {
    ground: props.ground,
    activeSection: 'Chronicle',
    referenceDate: props.referenceDate,
    campaignLabel: 'Summer Rescue',
    campaignMeta: {
      phase: 'the campaign',
      day: Math.max(1, dateDiff(campaignStart, props.referenceDate) + 1),
      total: Math.max(1, dateDiff(campaignStart, campaignEnd) + 1),
    },
    onGroundChange: props.onGroundChange,
    onNavigate: props.onNavigate,
    onOpenCommand: props.onOpenCommand,
    onOpenSettings: props.onOpenSettings,
    onOpenNotifications: props.onOpenNotifications,
    onAddCard: props.onAddCard,
  }
}

function buildPhases(cards, referenceDate, schedule, customPhases = []) {
  const start = schedule?.campaignStart || referenceDate
  const end = schedule?.campaignEnd || addDays(start, 45)
  const totalDays = Math.max(5, dateDiff(start, end) + 1)
  let cursor = start

  const extras = customPhases
    .filter((phase) => !BASE_PHASES.some((item) => item.key.toLowerCase() === String(phase).toLowerCase()))
    .map((phase, index) => ({
      number: String(index + 6),
      key: phase,
      name: phase.replace(/^phase\s*/i, '') || phase,
      note: 'custom campaign phase',
      weight: 1 / Math.max(customPhases.length + 5, 5),
    }))
  const definitions = [...BASE_PHASES, ...extras]
  const normaliser = definitions.reduce((sum, phase) => sum + phase.weight, 0)

  return definitions.map((definition, index) => {
    const remaining = Math.max(1, dateDiff(cursor, end) + 1)
    const days = index === definitions.length - 1
      ? remaining
      : Math.max(1, Math.round(totalDays * (definition.weight / normaliser)))
    const phaseStart = cursor
    const phaseEnd = index === definitions.length - 1 ? end : addDays(cursor, days - 1)
    cursor = addDays(phaseEnd, 1)
    const phaseCards = cards.filter((card) => card.phase === definition.key)
    const sealed = referenceDate > phaseEnd
    const ahead = referenceDate < phaseStart
    const elapsed = clamp((dateDiff(phaseStart, referenceDate) + 1) / Math.max(1, dateDiff(phaseStart, phaseEnd) + 1))
    return {
      ...definition,
      start: phaseStart,
      end: phaseEnd,
      span: `${compactDate(phaseStart)} – ${compactDate(phaseEnd)}`,
      cards: phaseCards,
      done: phaseCards.filter((card) => card.done).length,
      state: sealed ? 'sealed' : ahead ? 'ahead' : 'now',
      progress: sealed ? 1 : ahead ? 0 : elapsed,
      day: Math.max(1, dateDiff(phaseStart, referenceDate) + 1),
      of: Math.max(1, dateDiff(phaseStart, phaseEnd) + 1),
    }
  })
}

export function PhasesSurface(props) {
  const { cards, referenceDate, schedule, customPhases = [], onOpenSettings } = props
  const phases = useMemo(
    () => buildPhases(cards, referenceDate, schedule, customPhases),
    [cards, customPhases, referenceDate, schedule],
  )
  const current = phases.find((phase) => phase.state === 'now') ?? phases.at(-1)

  return (
    <ManuscriptPage {...pageProps(props)}>
      <section className="ms-campaign-heading">
        <h1>The campaign, cut into {phases.length} phases.</h1>
        <p>every leaf is written into a phase — the lanes only say when this week</p>
      </section>

      <div className="ms-phase-strip" style={{ '--phase-count': phases.length }} aria-label="Campaign phase timeline">
        {phases.map((phase, index) => (
          <div className="ms-phase-strip-item" key={phase.key}>
            <div className={`ms-phase-segment is-${phase.state}`}>
              <strong>{phase.number}</strong>
              {phase.state === 'now' && (
                <span className="ms-phase-now" style={{ left: `${phase.progress * 100}%` }}>
                  <Diamond size={8} color="var(--ms-gold)" />
                </span>
              )}
            </div>
            <span>{phase.span}</span>
            {index < phases.length - 1 && <Khatam className="ms-phase-joint" size={11} color="var(--ms-gold)" />}
          </div>
        ))}
      </div>

      <div className="ms-phase-body">
        <div className="ms-phase-rows" role="list">
          {phases.map((phase) => (
            <button
              type="button"
              className={`ms-phase-row is-${phase.state}`}
              key={phase.key}
              onClick={() => props.onNavigate?.('table', { phase: phase.key })}
              role="listitem"
            >
              <span className="ms-phase-number">{phase.number}</span>
              <strong>{phase.name}</strong>
              <span className="ms-phase-span">{phase.span}</span>
              <em>{phase.note}</em>
              {phase.state === 'now' ? (
                <span className="ms-phase-progress">
                  <i><b style={{ width: `${phase.progress * 100}%` }} /></i>
                  <small>day {Math.min(phase.day, phase.of)} of {phase.of}</small>
                </span>
              ) : (
                <small className="ms-phase-state">{phase.state === 'sealed' ? '◈ sealed' : 'ahead'}</small>
              )}
              <span className="ms-phase-count">{phase.cards.length} leaves</span>
            </button>
          ))}
        </div>

        <button type="button" className="ms-cut-phase" onClick={onOpenSettings}>
          <span><Diamond size={10} state="open" className="ms-diamond--dashed" /></span>
          <em>cut a new phase — name it in the campaign settings</em>
          <i />
          <small>joints follow the campaign dates</small>
        </button>

        <div className="ms-phase-notes">
          <article>
            <Rubric>When a phase seals</Rubric>
            <p>unfinished leaves are read aloud and re-written into the next phase or let go — nothing rolls over silently.</p>
          </article>
          <article>
            <Rubric>{current?.number || 'II'} · the vow</Rubric>
            <p>closed-book before open-book: no leaf seals without a from-memory proof. {current?.cards.length || 0} leaves; the descent stays visible.</p>
          </article>
        </div>
      </div>
    </ManuscriptPage>
  )
}

function cardDays(card, referenceDate) {
  const date = getCardDate(card)
  return date ? dateDiff(referenceDate, date) : null
}

function WatchRow({ card, referenceDate, actions, admin = false }) {
  const dueIn = cardDays(card, referenceDate)
  const urgent = dueIn != null && dueIn <= 7 && !card.done
  return (
    <button
      type="button"
      className={`ms-watch-row${card.done ? ' is-done' : ''}${urgent ? ' is-urgent' : ''}`}
      onClick={() => actions?.onOpen?.(card.id)}
    >
      {admin ? <span className="ms-watch-days">{dueIn == null ? '—' : `${dueIn}d`}</span> : null}
      <Diamond
        size={admin ? 6 : 13}
        color={card.done ? 'var(--ms-project)' : urgent ? 'var(--ms-red)' : undefined}
        state={card.done ? 'done' : urgent ? 'rescue' : 'open'}
      />
      <span className="ms-watch-title">{card.title}</span>
      {admin ? <small>{(card.tags ?? []).find((tag) => ['admin', 'health', 'date-watch'].includes(tag)) || card.moduleGroup}</small> : null}
      <time>{admin ? compactDate(card.dueDate) : card.status}</time>
    </button>
  )
}

export function WatchSurface(props) {
  const { cards, referenceDate, actions } = props
  const projectCards = sortCards(cards.filter((card) => card.moduleGroup === 'Group Project'))
  const adminCards = sortCards(cards.filter((card) =>
    ['Admin', 'Health'].includes(card.moduleGroup) || (card.tags ?? []).some((tag) => ['admin', 'health', 'date-watch'].includes(tag)),
  ))
  const projectDone = projectCards.filter((card) => card.done).length
  const projectDue = projectCards.map((card) => card.dueDate).filter(Boolean).sort().at(-1)
  const firstRisk = projectCards.find((card) => isOverdue(card, referenceDate) || card.status === 'Waiting / Blocked')

  return (
    <ManuscriptPage {...pageProps(props)}>
      <section className="ms-campaign-heading">
        <h1>The watch — what must not slip.</h1>
        <p>two vigils: the ship, and the life around the books</p>
      </section>

      <div className="ms-watch-grid">
        <article className="ms-watch-panel ms-project-ship">
          <header>
            <Rubric>Project ship</Rubric>
            <span>CMT501</span>
            <em>{projectDue ? `due ${compactDate(projectDue)} · ${Math.max(0, dateDiff(referenceDate, projectDue))} days` : 'no fixed due date'}</em>
          </header>
          <div className="ms-ship-progress">
            <i><b style={{ width: `${projectCards.length ? projectDone / projectCards.length * 100 : 0}%` }} /></i>
            <span>{projectDone} of {projectCards.length} aboard</span>
          </div>
          <div className="ms-watch-list">
            {projectCards.length ? projectCards.map((card) => (
              <WatchRow key={card.id} card={card} referenceDate={referenceDate} actions={actions} />
            )) : <p className="ms-empty-copy">No project leaves have been written.</p>}
          </div>
          <footer>{firstRisk ? firstRisk.title : 'the ship is clear of overdue or blocked leaves'}</footer>
        </article>

        <article className="ms-watch-panel ms-admin-watch">
          <header>
            <Rubric>Admin watch</Rubric>
            <em>sorted by days left</em>
          </header>
          <div className="ms-watch-list">
            {adminCards.length ? adminCards.map((card) => (
              <WatchRow key={card.id} card={card} referenceDate={referenceDate} actions={actions} admin />
            )) : <p className="ms-empty-copy">Nothing stands watch outside the study lanes.</p>}
          </div>
          <p>these leaves stand watch here so the desk stays clean. Open one to edit its date, proof, or state.</p>
        </article>
      </div>
      <p className="ms-watch-vow">the watch is read every Friday review — nothing on it may be older than seven days unseen</p>
    </ManuscriptPage>
  )
}

function collectDailyHours(cards) {
  const map = new Map()
  for (const card of cards) {
    for (const session of card.focusSessions ?? []) {
      const day = String(session.at || '').slice(0, 10)
      if (!day) continue
      map.set(day, (map.get(day) || 0) + Number(session.minutes || 0) / 60)
    }
  }
  return map
}

function streakFromHours(hoursByDay, referenceDate) {
  let cursor = referenceDate
  let streak = 0
  if (!(hoursByDay.get(cursor) > 0)) cursor = addDays(cursor, -1)
  while (hoursByDay.get(cursor) > 0) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function BurnChart({ cards, snapshots, schedule, referenceDate, moduleExamDates, ground }) {
  const pal = paletteFor(ground)
  const total = Math.max(1, cards.length)
  const start = schedule?.campaignStart || referenceDate
  const end = schedule?.campaignEnd || addDays(start, 45)
  const days = Math.max(1, dateDiff(start, end))
  const width = 620
  const height = 250
  const left = 34
  const top = 12
  const plotWidth = width - left - 12
  const plotHeight = height - top - 30
  const x = (date) => left + clamp(dateDiff(start, date) / days) * plotWidth
  const y = (remaining) => top + (1 - clamp(remaining / total)) * plotHeight
  const entries = Object.entries(snapshots ?? {})
    .filter(([date]) => date >= start && date <= end)
    .sort(([a], [b]) => a.localeCompare(b))
  const initial = { done: 0, total }
  const points = [[start, initial], ...entries]
    .filter(([date], index, list) => index === 0 || date !== list[index - 1][0])
    .map(([date, snapshot]) => `${x(date)},${y(Math.max(0, Number(snapshot.total ?? total) - Number(snapshot.done ?? 0)))}`)
    .join(' ')
  const remaining = cards.filter((card) => !card.done).length
  const todayX = x(referenceDate)
  const todayY = y(remaining)
  const exams = Object.entries(moduleExamDates ?? {}).map(([id, date]) => ({ id, date })).filter((item) => item.date)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="ms-burn-chart" role="img" aria-label={`${remaining} of ${total} leaves remain`}>
      {[0, 0.33, 0.66, 1].map((ratio) => {
        const value = Math.round(total * ratio)
        return (
          <g key={ratio}>
            <line x1={left} y1={y(value)} x2={width - 12} y2={y(value)} stroke={alpha(pal.ink, 0.08)} />
            <text x={left - 6} y={y(value) + 3} textAnchor="end">{value}</text>
          </g>
        )
      })}
      <line x1={x(start)} y1={y(total)} x2={x(end)} y2={y(0)} stroke={alpha(pal.ink, 0.3)} strokeDasharray="3 5" />
      {exams.map((exam) => (
        <rect key={exam.id} x={x(exam.date) - 4} y={y(0) + 8} width="8" height="8" transform={`rotate(45 ${x(exam.date)} ${y(0) + 12})`} fill="none" stroke="var(--ms-red)" />
      ))}
      {points && <polyline points={points} fill="none" stroke="var(--ms-gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      <rect x={todayX - 5} y={todayY - 5} width="10" height="10" rx="2" transform={`rotate(45 ${todayX} ${todayY})`} fill="var(--ms-gold)" />
      <text x={Math.min(todayX + 10, width - 190)} y={Math.max(todayY - 9, 12)}>day {Math.max(1, dateDiff(start, referenceDate) + 1)} · {remaining} leaves left</text>
      <text x={x(end)} y={y(0) + 26} textAnchor="end">the exams</text>
    </svg>
  )
}

function Heatmap({ cards, referenceDate }) {
  const hoursByDay = collectDailyHours(cards)
  const start = addDays(referenceDate, -62)
  const weeks = Array.from({ length: 9 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDays(start, week * 7 + day)
      return { date, value: hoursByDay.get(date) || 0 }
    }),
  )
  return (
    <div className="ms-heatmap" aria-label="Focus hours over the last nine weeks">
      <div className="ms-heat-labels"><span />{['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'].map((day) => <span key={day}>{day}</span>)}</div>
      {weeks.map((week, index) => (
        <div className="ms-heat-week" key={week[0].date}>
          <span>W{index + 1}</span>
          {week.map((day) => (
            <i key={day.date} title={`${formatDate(day.date)} · ${hours(day.value)}`} style={{ '--heat': clamp(day.value / 6) }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChronicleSurface(props) {
  const { cards, snapshots, referenceDate, schedule, moduleExamDates = {} } = props
  const hoursByDay = useMemo(() => collectDailyHours(cards), [cards])
  const streak = streakFromHours(hoursByDay, referenceDate)
  const evidenceCount = cards.reduce((total, card) => total + (card.evidenceEntries?.length || 0), 0)
  const lastEvidence = cards.flatMap((card) => (card.evidenceEntries ?? []).map((entry) => ({ ...entry, card })))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0]
  const moduleStats = MODULES.map((module) => {
    const moduleCards = cards.filter((card) => card.moduleGroup === module.group)
    return { ...module, hours: sumHours(moduleCards, 'actualHours'), planned: sumHours(moduleCards, 'estimatedHours') }
  })
  const maxHours = Math.max(1, ...moduleStats.map((item) => item.hours || item.planned))
  const totalLogged = sumHours(cards, 'actualHours')
  const total = cards.length
  const done = cards.filter((card) => card.done).length
  const campaignDays = Math.max(1, dateDiff(schedule?.campaignStart || referenceDate, schedule?.campaignEnd || referenceDate) + 1)
  const day = Math.max(1, dateDiff(schedule?.campaignStart || referenceDate, referenceDate) + 1)
  const week = Math.max(1, Math.ceil(day / 7))
  const totalWeeks = Math.max(1, Math.ceil(campaignDays / 7))

  return (
    <ManuscriptPage {...pageProps(props)}>
      <section className="ms-chronicle-heading">
        <h1>Week {week} of {totalWeeks}. The descent keeps its pace.</h1>
        <p>written by the tracker, read like a story</p>
      </section>
      <div className="ms-chronicle-grid">
        <article className="ms-chronicle-panel ms-descent-panel">
          <header><Rubric>The descent — {total} leaves to none</Rubric><span>gold = true · dashed = ideal</span></header>
          <BurnChart
            cards={cards}
            snapshots={snapshots}
            schedule={schedule}
            referenceDate={referenceDate}
            moduleExamDates={moduleExamDates}
            ground={props.ground}
          />
          <footer>
            <span className="ms-streak-ring" style={{ '--streak': `${Math.min(streak, 14) / 14 * 360}deg` }}><b>{streak}</b></span>
            <span>{streak} days unbroken</span>
            <i />
            <em>{evidenceCount} proofs sealed{lastEvidence ? ` · last — ${lastEvidence.text}` : ''}</em>
            <strong>{done} of {total} leaves kept</strong>
          </footer>
        </article>
        <article className="ms-chronicle-panel ms-water-panel">
          <header><Rubric>The watering record</Rubric><span>hue = focus hours kept</span></header>
          <Heatmap cards={cards} referenceDate={referenceDate} />
        </article>
        <article className="ms-chronicle-panel ms-mix-panel">
          <header><Rubric>Where the hours went</Rubric></header>
          <div className="ms-module-mix">
            {moduleStats.map((module) => {
              const value = module.hours || module.planned
              return (
                <div key={module.group} className={`is-${module.color}`}>
                  <span>{module.code}</span>
                  <i><b style={{ width: `${value / maxHours * 100}%` }} /></i>
                  <small>{hours(value)}</small>
                </div>
              )
            })}
          </div>
          <p>{hours(totalLogged)} logged · planned hours remain visible until the watering record begins</p>
        </article>
      </div>
      <p className="ms-chronicle-signoff">— set down in the chronicle, {formatDate(referenceDate)}, by the keeper of the study —</p>
    </ManuscriptPage>
  )
}
