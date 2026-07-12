import { useMemo, useState } from 'react'
import {
  ActionButton,
  Diamond,
  ManuscriptPage,
  ModuleSwitch,
  Rubric,
  moduleAccent,
  normaliseGround,
} from './ManuscriptPrimitives.jsx'
import './registry.css'

const CORE_MODULE_ORDER = ['Applied ML', 'Time Series', 'MAT700', 'Group Project']

const MODULE_DETAILS = {
  'Applied ML': { code: 'CMT307', name: 'Applied ML' },
  'Time Series': { code: 'MA4508', name: 'Time Series' },
  MAT700: { code: 'MAT700', name: 'Data Mining' },
  'Group Project': { code: 'CMT501', name: 'Team Project' },
  Admin: { code: 'ADMIN', name: 'Admin' },
  Health: { code: 'HEALTH', name: 'Health' },
  'Cross-module': { code: 'CROSS', name: 'Cross-module' },
  General: { code: 'GENERAL', name: 'General' },
}

const STATUS_ORDER = [
  'Today',
  'This Week',
  'Deep Work',
  'Backlog',
  'Waiting / Blocked',
  'Rescue Lane',
  'Done',
]

const STATUS_LABELS = {
  'Waiting / Blocked': 'Waiting',
  'Rescue Lane': 'Rescue Lane',
}

const DEFAULT_FILTERS = {
  search: '',
  module: 'all',
  phase: 'all',
  priority: 'all',
  status: 'all',
  slotType: 'all',
  tag: 'all',
  dateMode: 'all',
}

const REGISTRY_VIEWS = [
  { id: 'register', label: 'Register' },
  { id: 'board', label: 'Board' },
  { id: 'proofs', label: 'Proofs' },
]

const REGISTRY_TARGET = {
  register: 'table',
  board: 'board',
  proofs: 'evidence',
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function moduleName(card) {
  return card?.moduleGroup || card?.module || 'General'
}

function moduleInfo(name, index, ground) {
  const detail = MODULE_DETAILS[name] ?? {
    code: String(name)
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 7)
      .toUpperCase(),
    name,
  }

  return {
    id: name,
    number: toRoman(index + 1),
    code: detail.code,
    name: detail.name,
    accent: moduleAccent({
      id: slug(name),
      moduleGroup: name,
      label: detail.name,
    }, ground),
  }
}

function toRoman(value) {
  const pairs = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let remaining = value
  let result = ''
  for (const [amount, glyph] of pairs) {
    while (remaining >= amount) {
      result += glyph
      remaining -= amount
    }
  }
  return result
}

function modulesFor(cards, moduleOptions, ground) {
  const present = new Set(cards.map(moduleName))
  const ordered = unique([
    ...CORE_MODULE_ORDER,
    ...(moduleOptions ?? []),
    ...cards.map(moduleName),
  ]).filter((name) => present.has(name))

  return ordered.map((name, index) => moduleInfo(name, index, ground))
}

function cardDate(card) {
  return card?.dueDate || card?.startDate || ''
}

function dateValue(value) {
  if (!value) return Number.POSITIVE_INFINITY
  const parsed = Date.parse(String(value).slice(0, 10))
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

function shortDate(value) {
  if (!value) return '—'
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(parsed)
}

function dayName(value) {
  if (!value) return '—'
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(parsed)
}

function localDay(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function addDays(value, amount) {
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  parsed.setDate(parsed.getDate() + amount)
  return localDay(parsed)
}

function startOfWeek(value) {
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  const offset = parsed.getDay() === 0 ? -6 : 1 - parsed.getDay()
  parsed.setDate(parsed.getDate() + offset)
  return localDay(parsed)
}

function isRescue(card) {
  return card?.status === 'Rescue Lane' || (card?.tags ?? []).includes('rescue')
}

function isWaiting(card) {
  return card?.status === 'Waiting / Blocked'
}

function hasProof(card) {
  return Boolean(
    card?.evidenceEntries?.some((entry) => String(entry?.text ?? entry).trim()) ||
      String(card?.evidence ?? '').trim(),
  )
}

function cardSearchText(card) {
  return [
    card?.number,
    card?.title,
    card?.module,
    card?.moduleGroup,
    card?.phase,
    card?.priority,
    card?.status,
    card?.description,
    card?.evidenceRequirement,
    card?.doneCondition,
    ...(card?.tags ?? []),
    ...(card?.notes ?? []).map((note) => note?.text ?? ''),
    ...(card?.evidenceEntries ?? []).map((entry) => entry?.text ?? entry ?? ''),
  ]
    .join(' ')
    .toLowerCase()
}

function matchesFilters(card, filters, referenceDate, { ignoreStatus = false } = {}) {
  const search = String(filters.search ?? '').trim().toLowerCase()
  if (search && !cardSearchText(card).includes(search)) return false
  if (filters.module !== 'all' && moduleName(card) !== filters.module) return false
  if (filters.phase !== 'all' && card.phase !== filters.phase) return false
  if (filters.priority !== 'all' && card.priority !== filters.priority) return false
  if (!ignoreStatus && filters.status !== 'all' && card.status !== filters.status) return false
  if (filters.slotType !== 'all' && card.slotType !== filters.slotType) return false
  if (filters.tag !== 'all' && !(card.tags ?? []).includes(filters.tag)) return false

  const date = cardDate(card)
  if (filters.dateMode === 'today' && date !== referenceDate) return false
  if (filters.dateMode === 'week') {
    const start = startOfWeek(referenceDate)
    if (!date || date < start || date > addDays(start, 6)) return false
  }
  if (filters.dateMode === 'next7' && (!date || date < referenceDate || date > addDays(referenceDate, 7))) return false
  if (filters.dateMode === 'overdue' && (card.done || !date || date >= referenceDate)) return false
  if (filters.dateMode === 'no-date' && date) return false
  return true
}

function sortLedgerCards(cards, sortKey) {
  return [...cards].sort((left, right) => {
    if (sortKey === 'title') return String(left.title).localeCompare(String(right.title))
    if (sortKey === 'status') {
      const statusDelta = STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status)
      if (statusDelta) return statusDelta
    }
    const dateDelta = dateValue(cardDate(left)) - dateValue(cardDate(right))
    if (dateDelta) return dateDelta
    return Number(left.sortOrder ?? 9999) - Number(right.sortOrder ?? 9999)
  })
}

function openCardHandler(actions, onOpenCard) {
  return onOpenCard ?? actions?.onOpen ?? (() => {})
}

function RegistrySwitch({ activeId, onNavigate }) {
  return (
    <ModuleSwitch
      items={REGISTRY_VIEWS}
      activeId={activeId}
      onChange={(id) => onNavigate?.(REGISTRY_TARGET[id] ?? id)}
      label="Choose register view"
      className="ms-registry-switch"
    />
  )
}

function EmptyRegister({ children }) {
  return <p className="ms-registry-empty">{children}</p>
}

function LedgerRow({ card, module, actions, onOpenCard }) {
  const openCard = openCardHandler(actions, onOpenCard)
  const done = Boolean(card.done)
  const rescue = isRescue(card)
  const diamondState = done ? 'done' : rescue ? 'rescue' : isWaiting(card) ? 'waiting' : card.status === 'Today' ? 'today' : 'open'

  return (
    <div className={`ms-ledger-row${done ? ' is-done' : ''}${rescue ? ' is-rescue' : ''}`}>
      <label className="ms-ledger-lane-cell">
        <Diamond state={diamondState} color={module.accent} size="sm" />
        <span className="ms-visually-hidden">Lane for {card.title}</span>
        <select
          value={card.status}
          onChange={(event) => actions?.onStatusChange?.(card.id, event.target.value)}
          aria-label={`Lane for ${card.title}`}
        >
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>
          ))}
        </select>
      </label>
      <button type="button" className="ms-ledger-title" onClick={() => openCard(card.id)} title={card.title}>
        {card.title}
      </button>
      <span className="ms-ledger-module" style={{ color: module.accent }}>{module.code}</span>
      <time className="ms-ledger-date" dateTime={cardDate(card) || undefined}>{shortDate(cardDate(card))}</time>
      <label className="ms-ledger-hours" title={`${Number(card.actualHours ?? 0)}h logged / ${Number(card.estimatedHours ?? 0)}h estimated`}>
        <span className="ms-visually-hidden">Logged hours for {card.title}</span>
        <input
          type="number"
          min="0"
          step="0.25"
          value={Number(card.actualHours ?? 0)}
          onChange={(event) => actions?.onHoursChange?.(card.id, event.target.value)}
        />
        <small>/{Number(card.estimatedHours ?? 0)}</small>
      </label>
      <button
        type="button"
        className="ms-ledger-seal"
        onClick={() => openCard(card.id)}
        aria-label={hasProof(card) ? `Open sealed proof for ${card.title}` : `Add proof to ${card.title}`}
        title={hasProof(card) ? 'Proof sealed' : 'Proof awaiting'}
      >
        <Diamond state={hasProof(card) ? 'done' : 'open'} color={hasProof(card) ? undefined : module.accent} size="sm" />
      </button>
    </div>
  )
}

function WeekAhead({ cards, referenceDate }) {
  const start = startOfWeek(referenceDate)
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))

  return (
    <aside className="ms-ledger-week" aria-label="The week ahead">
      <Rubric tone="muted">The week ahead</Rubric>
      <div className="ms-ledger-week-list">
        {days.map((day) => {
          const dayCards = sortLedgerCards(cards.filter((card) => cardDate(card) === day), 'due')
          const hours = dayCards.reduce((sum, card) => sum + Number(card.estimatedHours ?? 0), 0)
          return (
            <div className="ms-ledger-week-day" key={day}>
              <div>
                <time className={day === referenceDate ? 'is-today' : ''} dateTime={day}>{dayName(day)}</time>
                <span>{hours % 1 === 0 ? hours : hours.toFixed(1)}h</span>
              </div>
              <p title={dayCards[0]?.title}>{dayCards[0]?.title ?? 'No dated cards'}</p>
            </div>
          )
        })}
      </div>
      <p className="ms-ledger-proof-total">{cards.filter(hasProof).length} proofs sealed this campaign</p>
    </aside>
  )
}

export function LedgerSurface({
  ground = 'paper',
  cards = [],
  referenceDate = localDay(new Date()),
  filters,
  setFilters,
  moduleOptions = [],
  phaseOptions = [],
  actions = {},
  onNavigate,
  onOpenCard,
  onAddCard,
  onGroundChange,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
}) {
  const safeGround = normaliseGround(ground)
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS)
  const [sortKey, setSortKey] = useState('due')
  const effectiveFilters = { ...DEFAULT_FILTERS, ...localFilters, ...(filters ?? {}) }
  const modules = useMemo(() => modulesFor(cards, moduleOptions, safeGround), [cards, moduleOptions, safeGround])
  const moduleMap = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules])
  const phases = unique([...phaseOptions, ...cards.map((card) => card.phase)])

  function updateFilter(key, value) {
    if (setFilters) setFilters((current) => ({ ...DEFAULT_FILTERS, ...(current ?? {}), [key]: value }))
    else setLocalFilters((current) => ({ ...current, [key]: value }))
  }

  const laneScopedCards = cards.filter((card) => matchesFilters(card, effectiveFilters, referenceDate, { ignoreStatus: true }))
  const visibleCards = sortLedgerCards(
    laneScopedCards.filter((card) => effectiveFilters.status === 'all' || card.status === effectiveFilters.status),
    sortKey,
  )
  const rescueCards = laneScopedCards.filter(isRescue)
  const moduleItems = [
    { id: 'all', label: 'All', count: cards.length },
    ...modules.map((module) => ({
      id: module.id,
      label: module.code,
      count: cards.filter((card) => moduleName(card) === module.id).length,
    })),
  ]

  return (
    <ManuscriptPage
      ground={safeGround}
      activeSection="ledger"
      onNavigate={onNavigate}
      onGroundChange={onGroundChange}
      onOpenCommand={onOpenCommand}
      onOpenSettings={onOpenSettings}
      onOpenNotifications={onOpenNotifications}
      referenceDate={referenceDate}
      campaignLabel="Summer Rescue"
      className="ms-registry-surface ms-ledger-surface"
    >
      <div className="ms-registry-content">
        <h1 className="ms-visually-hidden">The study ledger</h1>
        <div className="ms-ledger-toolbar">
          <ModuleSwitch
            items={moduleItems}
            activeId={effectiveFilters.module}
            onChange={(id) => updateFilter('module', id)}
            label="Filter ledger by chapter"
            className="ms-ledger-module-switch"
          />
          <div className="ms-ledger-tools">
            <label className="ms-ledger-search">
              <span className="ms-visually-hidden">Search ledger</span>
              <input
                type="search"
                value={effectiveFilters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="search the register"
              />
            </label>
            <label>
              <span>sorted by —</span>
              <select value={sortKey} onChange={(event) => setSortKey(event.target.value)} aria-label="Sort ledger">
                <option value="due">due date</option>
                <option value="title">title</option>
                <option value="status">lane</option>
              </select>
            </label>
            <label>
              <span>phase —</span>
              <select value={effectiveFilters.phase} onChange={(event) => updateFilter('phase', event.target.value)} aria-label="Filter by phase">
                <option value="all">all</option>
                {phases.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
              </select>
            </label>
            <ActionButton size="sm" variant="text" onClick={() => onAddCard?.()}>
              + add a leaf
            </ActionButton>
          </div>
        </div>

        <div className="ms-ledger-frame">
          <div className="ms-ledger-layout">
            <aside className="ms-ledger-lanes" aria-label="Card lanes">
              <Rubric tone="muted">The lanes</Rubric>
              <div className="ms-ledger-lane-list">
                {STATUS_ORDER.map((status) => {
                  const count = laneScopedCards.filter((card) => card.status === status).length
                  const rescue = status === 'Rescue Lane'
                  return (
                    <button
                      type="button"
                      key={status}
                      className={`${effectiveFilters.status === status ? 'is-active' : ''}${rescue ? ' is-rescue' : ''}`}
                      onClick={() => updateFilter('status', effectiveFilters.status === status ? 'all' : status)}
                    >
                      <Diamond state={rescue ? 'rescue' : status === 'Done' ? 'done' : 'open'} size="sm" />
                      <span>{STATUS_LABELS[status] ?? status}</span>
                      <i aria-hidden="true" />
                      <small>{count}</small>
                    </button>
                  )
                })}
              </div>
              <p className="ms-ledger-rescue-note">
                {rescueCards.length > 0
                  ? `${rescueCards.length} ${rescueCards.length === 1 ? 'card' : 'cards'} in the rescue lane — ${rescueCards[0].title}`
                  : 'the rescue lane is clear'}
              </p>
            </aside>

            <section className="ms-ledger-register" aria-label="Study card register">
              <div className="ms-ledger-head" aria-hidden="true">
                <span>Lane</span>
                <span>The card</span>
                <span>Chapter</span>
                <span>Due</span>
                <span>Hrs</span>
                <span>Seal</span>
              </div>
              <div className="ms-ledger-row-list" tabIndex="0">
                {visibleCards.map((card) => (
                  <LedgerRow
                    key={card.id}
                    card={card}
                    module={moduleMap.get(moduleName(card)) ?? moduleInfo(moduleName(card), modules.length, safeGround)}
                    actions={actions}
                    onOpenCard={onOpenCard}
                  />
                ))}
                {visibleCards.length === 0 && <EmptyRegister>No cards answer these filters.</EmptyRegister>}
              </div>
              <footer className="ms-ledger-register-foot">
                <span>{visibleCards.length} of {cards.length} shown</span>
                <i aria-hidden="true" />
                <span>register saved locally</span>
              </footer>
            </section>

            <WeekAhead cards={laneScopedCards} referenceDate={referenceDate} />
          </div>
        </div>

        <div className="ms-registry-view-row">
          <RegistrySwitch activeId="register" onNavigate={onNavigate} />
        </div>
      </div>
    </ManuscriptPage>
  )
}

function BoardCard({ card, module, actions, onOpenCard, referenceDate }) {
  const openCard = openCardHandler(actions, onOpenCard)
  const rescue = isRescue(card)
  const waiting = isWaiting(card)
  const today = card.status === 'Today'
  const overdue = Boolean(referenceDate && cardDate(card) && cardDate(card) < referenceDate)
  return (
    <article
      className={`ms-board-card${rescue ? ' is-rescue' : ''}${waiting ? ' is-waiting' : ''}${today ? ' is-today' : ''}`}
      style={{ '--module-accent': module.accent }}
    >
      <div className="ms-board-card-head">
        <button type="button" className="ms-board-card-title" onClick={() => openCard(card.id)}>
          {card.title}
        </button>
        <button
          type="button"
          className="ms-board-done"
          onClick={() => actions?.onToggleDone?.(card.id)}
          aria-label={`Mark ${card.title} done`}
          title="Mark done"
        >
          <Diamond state="open" color={module.accent} size="sm" />
        </button>
      </div>
      <div className="ms-board-card-meta">
        <label className="ms-board-lane">
          <Diamond state={rescue ? 'rescue' : waiting ? 'waiting' : today ? 'today' : 'open'} color={module.accent} size="sm" />
          <span className="ms-visually-hidden">Lane for {card.title}</span>
          <select
            value={card.status}
            onChange={(event) => actions?.onStatusChange?.(card.id, event.target.value)}
            aria-label={`Lane for ${card.title}`}
          >
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>)}
          </select>
        </label>
        <span className="ms-board-card-spacer" />
        {today && <span className="ms-board-today-mark">today</span>}
        {overdue && (
          <span className="ms-board-reschedule" aria-label="Reschedule overdue card">
            <button type="button" onClick={() => actions?.onReschedule?.(card.id, referenceDate)}>today</button>
            <button type="button" onClick={() => actions?.onReschedule?.(card.id, addDays(referenceDate, 1))}>+1</button>
          </span>
        )}
        <button type="button" className="ms-board-start" onClick={() => actions?.onStartSession?.(card.id)}>
          start
        </button>
        <span>{shortDate(cardDate(card))}{Number(card.estimatedHours ?? 0) ? ` · ${Number(card.estimatedHours)}h` : ''}</span>
      </div>
    </article>
  )
}

function BoardColumn({ module, cards, actions, onOpenCard, onAddCard, referenceDate }) {
  const openCards = sortLedgerCards(cards.filter((card) => !card.done), 'due')
  const done = cards.filter((card) => card.done).length
  const nearest = openCards.find((card) => cardDate(card))
  return (
    <section className="ms-board-column" aria-labelledby={`board-module-${slug(module.id)}`}>
      <header style={{ '--module-accent': module.accent }}>
        <span>{module.number}</span>
        <h2 id={`board-module-${slug(module.id)}`}>{module.name}</h2>
        <small>{openCards.length} open · {nearest ? `next ${shortDate(cardDate(nearest))}` : 'no due date'}</small>
      </header>
      <div className="ms-board-card-list" tabIndex="0">
        {openCards.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            module={module}
            actions={actions}
            onOpenCard={onOpenCard}
            referenceDate={referenceDate}
          />
        ))}
        {openCards.length === 0 && <EmptyRegister>No open leaves.</EmptyRegister>}
      </div>
      <footer>
        <button type="button" onClick={() => onAddCard?.(module.id)}>+ add a leaf</button>
        <i aria-hidden="true" />
        <span>{done} done</span>
      </footer>
    </section>
  )
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function BoardSurface({
  ground = 'paper',
  cards = [],
  referenceDate = localDay(new Date()),
  moduleOptions = [],
  actions = {},
  onNavigate,
  onOpenCard,
  onAddCard,
  onGroundChange,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
}) {
  const safeGround = normaliseGround(ground)
  const modules = useMemo(() => modulesFor(cards, moduleOptions, safeGround), [cards, moduleOptions, safeGround])
  const openCount = cards.filter((card) => !card.done).length
  const rescueCards = cards.filter((card) => !card.done && isRescue(card))
  const waitingCount = cards.filter((card) => !card.done && isWaiting(card)).length
  const boardWidth = modules.length <= 4 ? '100%' : `calc(${modules.length * 25}% + ${modules.length * 7.5 - 30}px)`
  const boardMinWidth = Math.max(4, modules.length) * 260 + (Math.max(4, modules.length) - 1) * 30

  return (
    <ManuscriptPage
      ground={safeGround}
      activeSection="ledger"
      onNavigate={onNavigate}
      onGroundChange={onGroundChange}
      onOpenCommand={onOpenCommand}
      onOpenSettings={onOpenSettings}
      onOpenNotifications={onOpenNotifications}
      referenceDate={referenceDate}
      campaignLabel="Summer Rescue"
      className="ms-registry-surface ms-board-surface"
    >
      <div className="ms-registry-content">
        <header className="ms-registry-title-row">
          <div>
            <h1>The board — every open leaf.</h1>
            <p>{openCount} open of {cards.length} · nearest dates first · move a lane without leaving the board</p>
          </div>
          <RegistrySwitch activeId="board" onNavigate={onNavigate} />
        </header>

        <div className="ms-board-viewport" aria-label="Open cards by chapter">
          <div
            className="ms-board-grid"
            style={{
              width: boardWidth,
              minWidth: `${boardMinWidth}px`,
              gridTemplateColumns: `repeat(${Math.max(1, modules.length)}, minmax(0, 1fr))`,
            }}
          >
            {modules.map((module) => (
              <BoardColumn
                key={module.id}
                module={module}
                cards={cards.filter((card) => moduleName(card) === module.id)}
                actions={actions}
                onOpenCard={onOpenCard}
                onAddCard={onAddCard}
                referenceDate={referenceDate}
              />
            ))}
          </div>
        </div>

        <footer className="ms-board-legend">
          <span className={rescueCards.length ? 'is-alert' : ''}>
            {rescueCards.length
              ? `${rescueCards.length} ${rescueCards.length === 1 ? 'leaf' : 'leaves'} in rescue — ${rescueCards[0].title}`
              : 'the rescue lane is clear'}
          </span>
          <i aria-hidden="true" />
          <span>gold ring = due today · ghosted = waiting on someone{waitingCount ? ` (${waitingCount})` : ''}</span>
        </footer>
      </div>
    </ManuscriptPage>
  )
}

function evidenceKind(text) {
  const value = String(text ?? '').toLowerCase()
  const extension = value.match(/\.([a-z0-9]{2,7})(?:\s|$|\?|#)/)?.[1]
  if (extension) return extension
  if (/gitlab|merge request|commit|branch/.test(value)) return 'gitlab'
  if (/https?:\/\//.test(value)) return 'link'
  if (/photo|image|sketch|screenshot/.test(value)) return 'photo'
  return 'note'
}

function proofName(text, fallback) {
  const line = String(text ?? '').trim().split(/\r?\n/)[0]
  if (!line) return fallback || 'Proof awaiting'
  return line.length > 92 ? `${line.slice(0, 89)}…` : line
}

function proofsForCard(card) {
  const entries = (card.evidenceEntries ?? [])
    .map((entry, index) => ({
      id: entry?.id ?? `${card.id}-proof-${index}`,
      text: String(entry?.text ?? entry ?? '').trim(),
      at: entry?.at ?? card.updatedAt ?? '',
    }))
    .filter((entry) => entry.text)

  if (entries.length === 0 && String(card.evidence ?? '').trim()) {
    entries.push({ id: `${card.id}-proof-legacy`, text: String(card.evidence).trim(), at: card.updatedAt ?? '' })
  }

  if (entries.length > 0) {
    return entries.map((entry) => ({
      ...entry,
      name: proofName(entry.text, card.evidenceRequirement),
      kind: evidenceKind(entry.text),
      sealed: true,
      card,
    }))
  }

  return [{
    id: `${card.id}-proof-awaiting`,
    text: card.evidenceRequirement ?? '',
    name: proofName(card.evidenceRequirement, 'Proof awaiting'),
    kind: evidenceKind(card.evidenceRequirement),
    sealed: false,
    at: cardDate(card),
    card,
  }]
}

function ProofRow({ proof, module, onOpenCard, actions }) {
  const openCard = openCardHandler(actions, onOpenCard)
  return (
    <article className={`ms-proof-row${proof.sealed ? ' is-sealed' : ' is-awaiting'}`}>
      <button
        type="button"
        className="ms-proof-seal"
        onClick={() => openCard(proof.card.id)}
        aria-label={proof.sealed ? `Open proof ${proof.name}` : `Add proof for ${proof.card.title}`}
      >
        <Diamond state={proof.sealed ? 'done' : 'rescue'} color={proof.sealed ? undefined : module.accent} size="md" />
      </button>
      <button type="button" className="ms-proof-copy" onClick={() => openCard(proof.card.id)}>
        <strong>{proof.name}</strong>
        <span>proves — {proof.card.title}</span>
      </button>
      <span className="ms-proof-kind" style={{ '--module-accent': module.accent }}>{proof.kind}</span>
      <time dateTime={proof.at || undefined}>{proof.at ? shortDate(proof.at) : proof.sealed ? 'saved' : 'awaiting'}</time>
    </article>
  )
}

export function ProofsSurface({
  ground = 'paper',
  cards = [],
  referenceDate = localDay(new Date()),
  moduleOptions = [],
  actions = {},
  onNavigate,
  onOpenCard,
  onAddCard,
  onGroundChange,
  onOpenCommand,
  onOpenSettings,
  onOpenNotifications,
}) {
  const safeGround = normaliseGround(ground)
  const modules = useMemo(() => modulesFor(cards, moduleOptions, safeGround), [cards, moduleOptions, safeGround])
  const proofs = useMemo(() => cards.flatMap(proofsForCard), [cards])
  const sealed = proofs.filter((proof) => proof.sealed).length
  const awaiting = proofs.length - sealed
  const awaitingProofs = proofs.filter((proof) => !proof.sealed)

  return (
    <ManuscriptPage
      ground={safeGround}
      activeSection="ledger"
      onNavigate={onNavigate}
      onGroundChange={onGroundChange}
      onOpenCommand={onOpenCommand}
      onOpenSettings={onOpenSettings}
      onOpenNotifications={onOpenNotifications}
      referenceDate={referenceDate}
      campaignLabel="Summer Rescue"
      className="ms-registry-surface ms-proofs-surface"
    >
      <div className="ms-registry-content">
        <header className="ms-registry-title-row">
          <div>
            <h1>The proofs — every done has a receipt.</h1>
            <p>{sealed} sealed this campaign · {awaiting} awaiting evidence</p>
          </div>
          <RegistrySwitch activeId="proofs" onNavigate={onNavigate} />
        </header>

        <div className="ms-proofs-register" tabIndex="0">
          <div className="ms-proofs-grid">
            {modules.map((module) => {
              const rows = proofs.filter((proof) => moduleName(proof.card) === module.id)
              if (rows.length === 0) return null
              return (
                <section className="ms-proof-module" key={module.id} aria-labelledby={`proof-module-${slug(module.id)}`}>
                  <header style={{ '--module-accent': module.accent }}>
                    <span>{module.number}</span>
                    <h2 id={`proof-module-${slug(module.id)}`}>{module.name}</h2>
                    <small>{rows.filter((proof) => proof.sealed).length} sealed · {rows.length} expected</small>
                  </header>
                  <div>
                    {rows.map((proof) => (
                      <ProofRow
                        key={proof.id}
                        proof={proof}
                        module={module}
                        onOpenCard={onOpenCard}
                        actions={actions}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
            {proofs.length === 0 && <EmptyRegister>No proof requirements have been recorded.</EmptyRegister>}
          </div>
        </div>

        <footer className="ms-proofs-foot">
          <span className={awaiting ? 'is-alert' : ''}>
            {awaiting
              ? `${awaiting} awaiting — ${awaitingProofs[0]?.card.title ?? 'open a card to add evidence'}`
              : 'every expected proof is sealed'}
          </span>
          <i aria-hidden="true" />
          <span>open any row to file, edit, or remove its proof</span>
          <ActionButton size="sm" variant="text" onClick={() => onAddCard?.()}>+ add a card</ActionButton>
        </footer>
      </div>
    </ManuscriptPage>
  )
}
