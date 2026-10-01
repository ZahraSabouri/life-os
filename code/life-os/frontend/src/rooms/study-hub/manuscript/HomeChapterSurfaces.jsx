import { useMemo } from 'react'
import { campaignMeta as DEFAULT_CAMPAIGN_META } from '../data/baseCards.js'
import { STUDY_MODULES } from '../data/studyModules.js'
import { buildStreak, buildTodayPicks } from '../utils/insights.js'
import { resolveSchedule } from '../utils/history.js'
import {
  deriveStats,
  formatDate,
  getCardDate,
  getWeekDays,
  isCurrentWeek,
  isOverdue,
  sortCards,
  sumHours,
  toDate,
  todayString,
} from '../utils/progress.js'
import {
  ActionButton,
  Diamond,
  DottedLeader,
  Khatam,
  ManuscriptPage,
  ProgressBar,
  Rubric,
  StreakRing,
  moduleAccent,
  normaliseGround,
} from './ManuscriptPrimitives.jsx'

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function hours(value) {
  const amount = Math.round(number(value) * 10) / 10
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}h`
}

function dayDiff(from, to) {
  const start = toDate(from)
  const end = toDate(to)
  if (!start || !end) return null
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function moduleMatchesCard(module, card) {
  if (!module || !card) return false
  const moduleKeys = [module.id, module.viewId, module.moduleGroup, module.label, module.title, module.code]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
  const cardKeys = [card.moduleId, card.moduleKey, card.moduleGroup, card.module, card.moduleCode]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
  return moduleKeys.some((key) => cardKeys.includes(key))
}

function cardsForModule(cards, module) {
  return asArray(cards).filter((card) => moduleMatchesCard(module, card))
}

function resolveModule(modules, activeModule) {
  if (activeModule && typeof activeModule === 'object') return activeModule
  if (activeModule) {
    const key = String(activeModule).toLowerCase()
    const match = modules.find((module) =>
      [module.id, module.viewId, module.moduleGroup, module.label, module.title, module.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase() === key),
    )
    if (match) return match
  }
  return modules[0] ?? null
}

function moduleExamDate(module, moduleExamDates, schedule) {
  if (!module) return ''
  return (
    moduleExamDates?.[module.id] ||
    moduleExamDates?.[module.viewId] ||
    moduleExamDates?.[module.moduleGroup] ||
    module.examDate ||
    (module.id === 'team-project' ? schedule?.campaignEnd : '') ||
    ''
  )
}

function moduleRoman(index) {
  const values = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return values[index] ?? String(index + 1)
}

function cardState(card, referenceDate) {
  if (card.done) return 'done'
  if (card.status === 'Rescue Lane' || (card.tags ?? []).includes('rescue') || isOverdue(card, referenceDate)) {
    return 'rescue'
  }
  if (card.status === 'Waiting / Blocked') return 'waiting'
  if (card.status === 'Today' || getCardDate(card) === referenceDate) return 'today'
  return 'open'
}

function evidenceLabel(card) {
  if (card.evidence?.trim?.()) return card.evidence.trim()
  if (card.evidenceEntries?.length) return card.evidenceEntries[0]?.text || 'evidence kept'
  return card.evidenceRequirement || 'proof not named yet'
}

function dominantPhase(cards) {
  const counts = new Map()
  for (const card of cards) {
    if (!card?.phase || card.done) continue
    counts.set(card.phase, (counts.get(card.phase) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

function campaignContext(cards, referenceDate, schedule) {
  const plan = resolveSchedule(schedule)
  const elapsed = dayDiff(plan.campaignStart, referenceDate)
  const duration = dayDiff(plan.campaignStart, plan.campaignEnd)
  return {
    plan,
    meta: {
      phase: dominantPhase(cards),
      day: elapsed == null ? null : clamp(elapsed + 1, 1, Math.max(1, (duration ?? 0) + 1)),
      total: duration == null ? null : Math.max(1, duration + 1),
    },
  }
}

function campaignLabel() {
  return DEFAULT_CAMPAIGN_META?.title || 'Study campaign'
}

function mergeTodayCards(cards, referenceDate) {
  const explicit = sortCards(
    cards.filter(
      (card) => getCardDate(card) === referenceDate || card.status === 'Today',
    ),
  )
  const fallback = buildTodayPicks(cards, referenceDate, true, 3).picks.map((item) => item.card)
  const merged = new Map(explicit.map((card) => [card.id, card]))
  for (const card of fallback) {
    if (merged.size >= Math.max(3, explicit.length)) break
    merged.set(card.id, card)
  }
  return [...merged.values()]
}

function timerMatches(card, activeTimerCard) {
  if (!card || !activeTimerCard) return false
  const activeId = typeof activeTimerCard === 'object' ? activeTimerCard.id : activeTimerCard
  return card.id === activeId
}

function TimerGlyph() {
  return (
    <svg className="ms-hourglass" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12M6 21h12M7 3c0 5 4 6 5 9-1 3-5 4-5 9M17 3c0 5-4 6-5 9 1 3 5 4 5 9" />
    </svg>
  )
}

function FolioCard({ card, referenceDate, activeTimerCard, onOpenCard, onStartTimer, ground }) {
  const active = timerMatches(card, activeTimerCard)
  const state = cardState(card, referenceDate)
  const accent = moduleAccent({ id: card.moduleId, moduleGroup: card.moduleGroup }, ground)
  return (
    <article className={`ms-folio-card is-${state}${active ? ' is-running' : ''}`}>
      <Diamond state={state} color={accent} />
      <div className="ms-folio-card__body">
        <button type="button" className="ms-title-button" onClick={() => onOpenCard?.(card.id)}>
          {card.title}
        </button>
        <p className="ms-proof-line">proof — {evidenceLabel(card)}</p>
        {active && (
          <p className="ms-running-line">
            <TimerGlyph />
            <span>{activeTimerCard?.timerLabel || activeTimerCard?.elapsedLabel || 'the hourglass is running'}</span>
          </p>
        )}
      </div>
      <div className="ms-folio-card__meta">
        <span style={{ color: accent }}>{card.moduleCode || card.moduleGroup || card.module}</span>
        <span>{card.slotType || 'Flex'} · {hours(card.estimatedHours)}</span>
        {!card.done && onStartTimer && (
          <button type="button" onClick={() => onStartTimer(card.id)}>
            {active ? 'resume' : 'start'}
          </button>
        )}
      </div>
    </article>
  )
}

function ChapterRow({
  module,
  index,
  cards,
  referenceDate,
  examDate,
  ground,
  active,
  onNavigate,
}) {
  const done = cards.filter((card) => card.done).length
  const logged = sumHours(cards, 'actualHours')
  const next = sortCards(cards.filter((card) => !card.done))[0]
  const days = dayDiff(referenceDate, examDate)
  const accent = moduleAccent(module, ground)
  return (
    <section className={`ms-chapter-row${active ? ' is-active' : ''}`} style={{ '--ms-module-accent': accent }}>
      <div className="ms-chapter-row__heading">
        <span className="ms-chapter-number">{moduleRoman(index)}</span>
        <button type="button" onClick={() => onNavigate?.(module.viewId || module.id)}>
          {module.label || module.title}
        </button>
        <span className="ms-chapter-code">{module.code}</span>
        <span className="ms-chapter-count">{done}/{cards.length} · {hours(logged)}</span>
        <span className="ms-chapter-exam">
          {examDate ? `${module.id === 'team-project' ? 'due' : 'exam'} ${formatDate(examDate)}` : 'date not set'}
          {days != null ? ` · ${days}d` : ''}
        </span>
      </div>
      <div className="ms-chapter-row__progress">
        <div className="ms-chapter-tiles" aria-label={`${done} of ${cards.length} cards complete`}>
          {cards.map((card) => (
            <Diamond
              key={card.id}
              state={cardState(card, referenceDate)}
              color={accent}
              size="sm"
              label={`${card.title}: ${cardState(card, referenceDate)}`}
            />
          ))}
          {cards.length === 0 && <span className="ms-empty-inline">no leaves yet</span>}
        </div>
        <p>next — {next?.title || 'the chapter is clear'}</p>
      </div>
    </section>
  )
}

function WaterClock({ modules, moduleExamDates, schedule, referenceDate }) {
  const plan = resolveSchedule(schedule)
  const dates = modules
    .map((module) => moduleExamDate(module, moduleExamDates, plan))
    .filter(Boolean)
  const end = [plan.campaignEnd, plan.examWindowStart, ...dates].filter(Boolean).sort().at(-1)
  const totalDays = Math.max(1, dayDiff(plan.campaignStart, end) ?? 1)
  const position = (date) => clamp(((dayDiff(plan.campaignStart, date) ?? 0) / totalDays) * 100, 1.5, 98.5)
  const todayPosition = position(referenceDate)

  return (
    <div className="ms-water-clock-scroll" aria-label="Campaign water clock">
      <div className="ms-water-clock">
        <span className="ms-water-clock__line" />
        <span className="ms-water-clock__elapsed" style={{ width: `${todayPosition}%` }} />
        <span className="ms-water-clock__today" style={{ left: `${todayPosition}%` }}>
          <Diamond state="today" size="sm" />
          <small>today</small>
        </span>
        {modules.map((module, index) => {
          const examDate = moduleExamDate(module, moduleExamDates, plan)
          if (!examDate) return null
          return (
            <span
              key={module.id || module.viewId}
              className={`ms-water-clock__mark ms-water-clock__mark--${index % 3}`}
              style={{ left: `${position(examDate)}%` }}
            >
              <Khatam size={12} />
              <small>{module.code} · {formatDate(examDate)}</small>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function TimerDial({ card }) {
  const size = 84
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const actual = number(card?.actualHours)
  const estimate = Math.max(actual, number(card?.estimatedHours), 1)
  const progress = clamp(actual / estimate, 0, 1)
  const label = card?.timerLabel || card?.elapsedLabel || (actual ? hours(actual) : 'ready')
  return (
    <span className="ms-timer-dial" role="img" aria-label={`${card?.title || 'Focus block'}: ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="ms-timer-dial__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circumference * progress} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <strong>{label}</strong>
    </span>
  )
}

function DeskBench({
  cards,
  stats,
  referenceDate,
  activeTimerCard,
  onOpenCard,
  onStartTimer,
}) {
  const streak = buildStreak(cards, referenceDate)
  const weekDays = getWeekDays(referenceDate)
  const weekRows = weekDays.map((day) => {
    const dayCards = cards.filter((card) => getCardDate(card) === day)
    const logged = sumHours(dayCards, 'actualHours')
    const planned = sumHours(dayCards, 'estimatedHours')
    return { day, logged, planned, value: logged || planned }
  })
  const maxHours = Math.max(1, ...weekRows.map((row) => row.value))
  const banked = sumHours(cards.filter((card) => isCurrentWeek(getCardDate(card), referenceDate)), 'actualHours')
  const target = sumHours(cards.filter((card) => isCurrentWeek(getCardDate(card), referenceDate)), 'estimatedHours')
  const evidence = cards.filter((card) => card.evidence?.trim?.() || card.evidenceEntries?.length).length

  return (
    <aside className="ms-desk-bench ms-scroll-region" aria-label="Current block and weekly record">
      <Rubric tone="muted">Current block</Rubric>
      {activeTimerCard ? (
        <div className="ms-current-block">
          <TimerDial card={activeTimerCard} />
          <div>
            <button type="button" className="ms-title-button" onClick={() => onOpenCard?.(activeTimerCard.id)}>
              {activeTimerCard.title}
            </button>
            <div className="ms-inline-actions">
              <ActionButton size="sm" variant="primary" onClick={() => onStartTimer?.(activeTimerCard.id)}>
                Continue
              </ActionButton>
              <ActionButton size="sm" variant="secondary" onClick={() => onOpenCard?.(activeTimerCard.id)}>
                Open
              </ActionButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="ms-current-block ms-current-block--empty">
          <TimerDial />
          <p>Choose a leaf from today’s folio to begin the hourglass.</p>
        </div>
      )}

      <div className="ms-week-water">
        <Rubric tone="muted">The week’s water</Rubric>
        {weekRows.map((row) => (
          <div className="ms-week-water__row" key={row.day}>
            <time dateTime={row.day}>{formatDate(row.day).slice(0, 3)}</time>
            <ProgressBar value={row.value} max={maxHours} tone={row.day === referenceDate ? 'gold' : 'ink'} />
            <span>{hours(row.value)}</span>
          </div>
        ))}
        <p className="ms-week-water__summary">
          <em>banked {hours(banked)} of {hours(target)}</em>
          <span>{stats?.overdueCards?.length ? `${stats.overdueCards.length} to mend` : 'on pace'}</span>
        </p>
      </div>

      <div className="ms-streak-summary">
        <StreakRing value={streak.current} max={Math.max(14, streak.longest || 0)} />
        <p>
          <strong>{streak.current} days unbroken</strong>
          <span>{evidence} proofs kept</span>
        </p>
      </div>
    </aside>
  )
}

export function DeskSurface({
  ground = 'paper',
  onGroundChange,
  onNavigate,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
  onAddCard,
  onOpenCard,
  onStartTimer,
  cards = [],
  stats,
  referenceDate,
  schedule,
  modules = STUDY_MODULES,
  activeModule,
  activeTimerCard,
  moduleExamDates = {},
}) {
  const resolvedGround = normaliseGround(ground)
  const referenceDay = referenceDate || todayString()
  const safeCards = asArray(cards)
  const safeModules = asArray(modules).length ? modules : STUDY_MODULES
  const currentModule = resolveModule(safeModules, activeModule)
  const derivedStats = useMemo(
    () => stats ?? deriveStats(safeCards, referenceDay, true),
    [referenceDay, safeCards, stats],
  )
  const todayCards = useMemo(
    () => mergeTodayCards(safeCards, referenceDay),
    [referenceDay, safeCards],
  )
  const { plan, meta } = useMemo(
    () => campaignContext(safeCards, referenceDay, schedule),
    [referenceDay, safeCards, schedule],
  )
  const completedToday = todayCards.filter((card) => card.done).length
  const toWrite = todayCards.length - completedToday
  const folioHours = sumHours(todayCards, 'actualHours')
  const folioTarget = sumHours(todayCards, 'estimatedHours')
  const rescueCard = sortCards(
    safeCards.filter(
      (card) => !card.done && (card.status === 'Rescue Lane' || isOverdue(card, referenceDay)),
    ),
  )[0]

  return (
    <ManuscriptPage
      ground={resolvedGround}
      activeSection="Desk"
      onGroundChange={onGroundChange}
      onNavigate={onNavigate}
      onOpenCommand={onOpenCommand}
      onOpenSettings={onOpenSettings}
      onOpenNotifications={onOpenNotifications}
      referenceDate={referenceDay}
      campaignLabel={campaignLabel()}
      campaignMeta={meta}
      className="ms-home-surface"
    >
      <div className="ms-desk-grid">
        <section className="ms-desk-folio ms-scroll-region" aria-labelledby="ms-today-folio">
          <Rubric id="ms-today-folio">Today’s folio</Rubric>
          <h1>{completedToday} blocks kept,<br />{toWrite} to write.</h1>
          <div className="ms-folio-list">
            {todayCards.map((card) => (
              <FolioCard
                key={card.id}
                card={card}
                referenceDate={referenceDay}
                activeTimerCard={activeTimerCard}
                onOpenCard={onOpenCard}
                onStartTimer={onStartTimer}
                ground={resolvedGround}
              />
            ))}
            {todayCards.length === 0 && (
              <div className="ms-empty-state">
                <p>The folio is clear.</p>
                <ActionButton variant="secondary" size="sm" onClick={() => onAddCard?.()}>
                  Add a leaf
                </ActionButton>
              </div>
            )}
          </div>
          <div className="ms-folio-total">
            <em>the folio so far</em>
            <DottedLeader />
            <span>{hours(folioHours)} of {hours(folioTarget)}</span>
          </div>
          {rescueCard && (
            <button type="button" className="ms-red-margin" onClick={() => onOpenCard?.(rescueCard.id)}>
              In red — {rescueCard.title}.
            </button>
          )}
        </section>

        <section className="ms-desk-chapters" aria-labelledby="ms-four-chapters">
          <div className="ms-section-heading">
            <Rubric tone="muted" id="ms-four-chapters">The chapters</Rubric>
            <span>{derivedStats.done} of {derivedStats.total} leaves · every tile a card</span>
          </div>
          <div className="ms-chapter-list ms-scroll-region">
            {safeModules.map((module, index) => (
              <ChapterRow
                key={module.id || module.viewId || module.moduleGroup}
                module={module}
                index={index}
                cards={cardsForModule(safeCards, module)}
                referenceDate={referenceDay}
                examDate={moduleExamDate(module, moduleExamDates, plan)}
                ground={resolvedGround}
                active={currentModule && (currentModule.id || currentModule.viewId) === (module.id || module.viewId)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
          <div className="ms-desk-water-clock">
            <WaterClock
              modules={safeModules}
              moduleExamDates={moduleExamDates}
              schedule={plan}
              referenceDate={referenceDay}
            />
          </div>
        </section>

        <DeskBench
          cards={safeCards}
          stats={derivedStats}
          referenceDate={referenceDay}
          activeTimerCard={activeTimerCard}
          onOpenCard={onOpenCard}
          onStartTimer={onStartTimer}
        />
      </div>
    </ManuscriptPage>
  )
}

function ChapterWorkRow({ card, referenceDate, activeTimerCard, ground, onOpenCard, onStartTimer }) {
  const active = timerMatches(card, activeTimerCard)
  const state = cardState(card, referenceDate)
  const accent = moduleAccent({ id: card.moduleId, moduleGroup: card.moduleGroup }, ground)
  return (
    <article className={`ms-work-row is-${state}${active ? ' is-running' : ''}`}>
      <Diamond state={state} color={accent} />
      <div className="ms-work-row__body">
        <button type="button" className="ms-title-button" onClick={() => onOpenCard?.(card.id)}>
          {card.title}
        </button>
        <p>proof — {evidenceLabel(card)}</p>
        {active && (
          <span className="ms-running-line">
            <TimerGlyph /> the hourglass is running
          </span>
        )}
      </div>
      <div className="ms-work-row__meta">
        <span>{card.slotLabel || card.slotType || formatDate(getCardDate(card))}</span>
        <span>{card.done ? `${hours(card.actualHours)} laid down` : hours(card.estimatedHours)}</span>
        {!card.done && onStartTimer && (
          <button type="button" onClick={() => onStartTimer(card.id)}>
            {active ? 'resume' : 'start'}
          </button>
        )}
      </div>
    </article>
  )
}

function resourceKind(resource) {
  if (resource.type) return String(resource.type).toLowerCase()
  const source = resource.path || resource.url || ''
  return source.split(/[?#]/)[0].split('.').at(-1)?.toLowerCase() || 'file'
}

function groupResources(resources) {
  const groups = new Map()
  for (const resource of resources) {
    const group = resource.group || 'The shelf'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(resource)
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
}

function ResourceGroup({ group, resourceProgress, onResourceOpen, onResourceReviewedToggle }) {
  return (
    <section className="ms-resource-group">
      <h3>{group.name}</h3>
      <ul>
        {group.items.map((resource) => {
          const reviewed = Boolean(resourceProgress?.[resource.id])
          return (
            <li key={resource.id}>
              <Diamond state={reviewed ? 'done' : 'open'} size="sm" />
              <button type="button" onClick={() => onResourceOpen?.(resource.id)}>
                {resource.title}
              </button>
              <DottedLeader />
              <span className="ms-resource-kind">{resourceKind(resource)}</span>
              {onResourceReviewedToggle && (
                <label className="ms-resource-reviewed">
                  <input
                    type="checkbox"
                    checked={reviewed}
                    onChange={() => onResourceReviewedToggle(resource.id)}
                  />
                  <span>reviewed</span>
                </label>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function ChapterSurface({
  ground = 'paper',
  onGroundChange,
  onNavigate,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
  onAddCard,
  onOpenCard,
  onStartTimer,
  cards = [],
  stats,
  referenceDate,
  schedule,
  modules = STUDY_MODULES,
  activeModule,
  activeTimerCard,
  moduleExamDates = {},
  resourceProgress = {},
  onResourceOpen,
  onResourceReviewedToggle,
  onResourceUpload,
  onReviewOpen,
}) {
  const resolvedGround = normaliseGround(ground)
  const referenceDay = referenceDate || todayString()
  const safeCards = asArray(cards)
  const safeModules = asArray(modules).length ? modules : STUDY_MODULES
  const module = resolveModule(safeModules, activeModule)
  const { plan, meta } = useMemo(
    () => campaignContext(safeCards, referenceDay, schedule),
    [referenceDay, safeCards, schedule],
  )

  if (!module) {
    return (
      <ManuscriptPage
        ground={resolvedGround}
        activeSection="Chapters"
        onGroundChange={onGroundChange}
        onNavigate={onNavigate}
        onOpenCommand={onOpenCommand}
        onOpenSettings={onOpenSettings}
        onOpenNotifications={onOpenNotifications}
        referenceDate={referenceDay}
        campaignLabel={campaignLabel()}
        campaignMeta={meta}
      >
        <div className="ms-empty-state ms-empty-state--page">No study chapter is available.</div>
      </ManuscriptPage>
    )
  }

  const moduleCards = sortCards(cardsForModule(safeCards, module))
  const openCards = moduleCards.filter((card) => !card.done)
  const done = moduleCards.length - openCards.length
  const logged = sumHours(moduleCards, 'actualHours')
  const examDate = moduleExamDate(module, moduleExamDates, plan)
  const days = dayDiff(referenceDay, examDate)
  const resources = asArray(module.resources)
  const resourceGroups = groupResources(resources)
  const accent = moduleAccent(module, resolvedGround)
  const surfaceStats = stats?.byModule?.find?.((entry) => entry.label === module.moduleGroup)

  return (
    <ManuscriptPage
      ground={resolvedGround}
      activeSection="Chapters"
      onGroundChange={onGroundChange}
      onNavigate={onNavigate}
      onOpenCommand={onOpenCommand}
      onOpenSettings={onOpenSettings}
      onOpenNotifications={onOpenNotifications}
      referenceDate={referenceDay}
      campaignLabel={campaignLabel()}
      campaignMeta={meta}
      className="ms-chapter-surface"
    >
      <div className="ms-chapter-masthead" style={{ '--ms-module-accent': accent }}>
        <div>
          <Rubric tone="gold">Chapter {moduleRoman(Math.max(0, safeModules.indexOf(module)))}</Rubric>
          <div className="ms-chapter-title-line">
            <h1>{module.title || module.label}</h1>
            <span>{module.code}</span>
            <em>{module.subtitle}</em>
          </div>
        </div>
        <p className="ms-chapter-deadline">
          <strong>{examDate ? `${module.id === 'team-project' ? 'due' : 'exam'} ${formatDate(examDate)}` : 'date not set'}</strong>
          <span>{days != null ? `${days} days` : 'set it in settings'} · {done} of {moduleCards.length} leaves · {hours(surfaceStats?.logged ?? logged)} laid down</span>
        </p>
      </div>
      <div className="ms-chapter-progress-line">
        <ProgressBar value={done} max={Math.max(1, moduleCards.length)} label={`${done} of ${moduleCards.length} cards complete`} />
        <span>{moduleCards.length ? Math.round((done / moduleCards.length) * 100) : 0}% written</span>
      </div>

      <div className="ms-chapter-grid">
        <section className="ms-chapter-work" aria-labelledby="ms-chapter-work-heading">
          <Rubric tone="muted" id="ms-chapter-work-heading">The work — nearest first</Rubric>
          <div className="ms-work-list ms-scroll-region">
            {moduleCards.map((card) => (
              <ChapterWorkRow
                key={card.id}
                card={card}
                referenceDate={referenceDay}
                activeTimerCard={activeTimerCard}
                ground={resolvedGround}
                onOpenCard={onOpenCard}
                onStartTimer={onStartTimer}
              />
            ))}
            {moduleCards.length === 0 && <p className="ms-empty-state">No leaves have been written for this chapter.</p>}
          </div>
          <div className="ms-chapter-work__footer">
            <ActionButton
              variant="primary"
              onClick={() => onAddCard?.({ moduleId: module.id, moduleGroup: module.moduleGroup })}
            >
              Add a leaf
            </ActionButton>
            <em>or capture it from the Court with the chapter name first</em>
          </div>
        </section>

        <aside className="ms-chapter-shelf" aria-labelledby="ms-chapter-shelf-heading">
          <div className="ms-section-heading">
            <Rubric tone="muted" id="ms-chapter-shelf-heading">The shelf</Rubric>
            <span>{resources.length} volumes</span>
          </div>
          <div className="ms-resource-groups ms-scroll-region">
            {resourceGroups.map((group) => (
              <ResourceGroup
                key={group.name}
                group={group}
                resourceProgress={resourceProgress}
                onResourceOpen={onResourceOpen}
                onResourceReviewedToggle={onResourceReviewedToggle}
              />
            ))}
            {resources.length === 0 && <p className="ms-empty-state">The shelf is waiting for its first volume.</p>}
          </div>
          <div className="ms-shelf-footer">
            {onResourceUpload && (
              <button type="button" className="ms-resource-drop" onClick={() => onResourceUpload(module)}>
                add or drop a file to shelve it in this chapter
              </button>
            )}
            <div>
              <button type="button" onClick={() => resources[0] && onResourceOpen?.(resources[0].id)} disabled={!resources.length}>
                Open the reader <span aria-hidden="true">›</span>
              </button>
              <button
                type="button"
                onClick={() => (onReviewOpen ? onReviewOpen(module.id) : onNavigate?.('evidence'))}
              >
                Review proofs
              </button>
            </div>
          </div>
        </aside>
      </div>
    </ManuscriptPage>
  )
}
