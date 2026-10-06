import { STUDY_MODULES } from '../data/studyModules'
import { session } from '../hub/session'
import {
  addDays,
  formatDate,
  getCardDate,
  isBetween,
  isOverdue,
  sortCards,
  sumHours,
} from '../utils/progress'
import { CardSummary } from './CardSummary'

function percent(done, total) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

function hours(value) {
  const number = Number(value || 0)
  return Number.isInteger(number) ? `${number}h` : `${number.toFixed(1)}h`
}

function ModuleCommandCard({ module, cards, referenceDate, onOpen, onOpenModuleView }) {
  const moduleCards = cards.filter((card) => card.moduleGroup === module.moduleGroup)
  const openCards = sortCards(moduleCards.filter((card) => !card.done))
  const dueSoonEnd = addDays(referenceDate, 7)
  const dueSoon = openCards.filter((card) => isBetween(getCardDate(card), referenceDate, dueSoonEnd))
  const overdue = openCards.filter((card) => isOverdue(card, referenceDate))
  const done = moduleCards.filter((card) => card.done).length
  const deadlineGates = moduleCards.filter((card) => card.deadlineDriven).length

  return (
    <article
      className="module-command-card clickable-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(module.viewId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(module.viewId)
        }
      }}
    >
      <div className="module-card-visual">
        <img src={(module.hero ?? module.visual).url} alt="" loading="lazy" />
      </div>
      <div className="module-card-body">
        <p className="eyebrow">{module.code}</p>
        <h2>{module.title}</h2>
        <p>{module.subtitle}</p>
        <div className="module-stat-row" aria-label={`${module.title} progress`}>
          <span>{moduleCards.length} cards</span>
          <span>{percent(done, moduleCards.length)}% done</span>
          <span>{deadlineGates > 0 ? `${deadlineGates} daily gates` : `${hours(sumHours(moduleCards, 'estimatedHours'))} planned`}</span>
          <span>{dueSoon.length} due next 7d</span>
          {overdue.length > 0 && <span className="danger">{overdue.length} overdue</span>}
        </div>
      </div>
      <div className="module-card-actions">
        <button type="button" className="primary-button" onClick={() => onOpen(module.viewId)}>
          Open workspace
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={(event) => {
            event.stopPropagation()
            onOpenModuleView('week', module.moduleGroup)
          }}
        >
          Week queue
        </button>
      </div>
    </article>
  )
}

function CompactQueue({ title, eyebrow, cards, empty, actions }) {
  return (
    <section className="hub-queue">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="mini-card-list">
        {cards.length > 0 ? (
          sortCards(cards).map((card) => <CardSummary key={card.id} card={card} compact {...actions} />)
        ) : (
          <p className="empty-state">{empty}</p>
        )}
      </div>
    </section>
  )
}

export function StudyHub({ cards, stats, referenceDate, actions, setActiveView, openModuleView }) {
  const openCards = cards.filter((card) => !card.done)
  const overdueCards = openCards.filter((card) => isOverdue(card, referenceDate))
  const todayCards = openCards.filter((card) => getCardDate(card) === referenceDate)
  const nextSevenEnd = addDays(referenceDate, 7)
  const nextCards = openCards.filter((card) => isBetween(getCardDate(card), referenceDate, nextSevenEnd))
  const openDeadlineGates = openCards.filter((card) => card.deadlineDriven).length

  return (
    <div className="study-hub">
      <section className="super-hero">
        <div className="super-hero-copy">
          <p className="eyebrow">{session.semester?.title}</p>
          <h2>The semester in one place</h2>
          <p>
            Every module with its cards, materials, notes and evidence, and the queue of what to do this week.
          </p>
          <div className="hub-command-strip" aria-label="Primary study commands">
            <button type="button" className="primary-button" onClick={() => setActiveView('dashboard')}>
              Planner dashboard
            </button>
            <button type="button" className="secondary-button" onClick={() => setActiveView('week')}>
              This week
            </button>
            <button type="button" className="secondary-button" onClick={() => setActiveView('progress')}>
              Progress
            </button>
            <button type="button" className="secondary-button" onClick={() => setActiveView('evidence')}>
              Evidence
            </button>
          </div>
        </div>
        <div className="super-hero-media" aria-label="Module resource previews">
          {STUDY_MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              className="preview-tile"
              onClick={() => setActiveView(module.viewId)}
              style={{ '--module-accent': `var(${module.accent})` }}
            >
              <img src={(module.hero ?? module.visual).url} alt="" loading="lazy" />
              <span>{module.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="hub-metrics" aria-label="Super app metrics">
        <article>
          <span>Open cards</span>
          <strong>{stats.notDone}</strong>
          <p>
            {openDeadlineGates > 0
              ? `${openDeadlineGates} deadline gates are tracked by evidence, not estimated hours.`
              : `${hours(stats.estimatedHours - stats.loggedHours)} estimated hours still unlogged.`}
          </p>
        </article>
        <article>
          <span>Due today</span>
          <strong>{todayCards.length}</strong>
          <p>{formatDate(referenceDate)} execution queue.</p>
        </article>
        <article>
          <span>Next 7 days</span>
          <strong>{nextCards.length}</strong>
          <p>Cards dated through {formatDate(nextSevenEnd)}.</p>
        </article>
        <article>
          <span>Overdue</span>
          <strong>{overdueCards.length}</strong>
          <p>Use Rescue Lane instead of silent drift.</p>
        </article>
      </section>

      <section className="module-command-grid" aria-label="Module workspaces">
        {STUDY_MODULES.map((module) => (
          <ModuleCommandCard
            key={module.id}
            module={module}
            cards={cards}
            referenceDate={referenceDate}
            onOpen={setActiveView}
            onOpenModuleView={openModuleView}
          />
        ))}
      </section>

      {STUDY_MODULES.length === 0 && (
        <section className="panel">
          <p className="eyebrow">Start here</p>
          <h2>Add your modules</h2>
          <p>This semester has no modules yet. Add them in Semester setup, then add cards to each one.</p>
          <button type="button" className="primary-button" onClick={() => setActiveView('setup')}>Open Semester setup</button>
        </section>
      )}

      <section className="hub-split">
        <CompactQueue
          eyebrow="Execute"
          title="Due today"
          cards={todayCards.slice(0, 5)}
          empty="No cards due today."
          actions={actions}
        />
        <CompactQueue
          eyebrow="Control"
          title="Overdue or at risk"
          cards={overdueCards.slice(0, 5)}
          empty="No overdue cards."
          actions={actions}
        />
      </section>

    </div>
  )
}
