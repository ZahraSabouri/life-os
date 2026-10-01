import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../lib/useEntries.js'

const STUDY_TYPES = new Set(['module', 'module-session', 'material', 'snippet', 'task'])

const MODULES = [
  {
    code: 'MAT700',
    title: 'Mathematical Methods for Data Mining',
    lane: 'Insurance lane: high-yield notes, question banks, formulas, and papers.',
    hero: '/module-heroes/mat700.svg',
    complete: 10,
    total: 24,
    logged: '21h',
    next: 'PageRank iteration',
    note: 'Rescue lane active - overdue cards jump tomorrow queue.',
    accent: 'var(--g-acc)'
  },
  {
    code: 'CMT307',
    title: 'Applied Machine Learning',
    lane: 'Notebook-first recovery, open-book command pack, and project evidence.',
    hero: '/module-heroes/aml.svg',
    complete: 7,
    total: 22,
    logged: '17h',
    next: 'leakage audit',
    note: 'Notebook evidence should attach to module sessions.',
    accent: 'var(--g-blue)'
  },
  {
    code: 'MA4508',
    title: 'Time Series',
    lane: 'Formula-first paper practice: packs, templates, R snippets, and mock mapping.',
    hero: '/module-heroes/time-series.svg',
    complete: 6,
    total: 22,
    logged: '12h',
    next: 'ARMA template drill',
    note: 'Templates and worked frames belong in materials.',
    accent: 'var(--g-sage)'
  }
]

const DUE_QUEUE = [
  {
    module: 'MAT700',
    title: 'PageRank iteration',
    meta: '45 min / trace on paper / evidence: worked trace',
    kind: 'Trace',
    accent: 'var(--g-acc)'
  },
  {
    module: 'CMT307',
    title: 'leakage audit',
    meta: '60 min / run notebook clean end-to-end',
    kind: 'Notebook',
    accent: 'var(--g-blue)'
  },
  {
    module: 'MA4508',
    title: 'ARMA template drill',
    meta: '40 min / closed book / evidence: filled answer frame',
    kind: 'Frame',
    accent: 'var(--g-sage)'
  }
]

function entryMatchesModule(entry, code) {
  const details = entry.details || {}
  const haystack = [
    entry.title,
    details.module_code,
    details.code,
    details.title,
    details.topic,
    details.source,
    details.note
  ].filter(Boolean).join(' ').toLowerCase()

  return haystack.includes(code.toLowerCase())
}

function countStudyEntries(entries) {
  return entries.filter((entry) => STUDY_TYPES.has(entry.type)).length
}

function moduleEvidence(entries, code) {
  return entries.filter((entry) => STUDY_TYPES.has(entry.type) && entryMatchesModule(entry, code))
}

export default function StudyLens() {
  const navigate = useNavigate()
  const { entries, error } = useEntries('?limit=100')
  const studyCount = useMemo(() => countStudyEntries(entries), [entries])
  const completedCards = MODULES.reduce((sum, module) => sum + module.complete, 0)
  const totalCards = MODULES.reduce((sum, module) => sum + module.total, 0)
  const progress = Math.round((completedCards / totalCards) * 100)
  const evidenceCount = entries.filter((entry) => (
    ['module-session', 'material', 'snippet'].includes(entry.type)
  )).length

  return (
    <section className="study-lens" aria-label="Study lens">
      <section className="study-hero" aria-labelledby="study-heading">
        <p className="capture-label">Summer Rescue Campaign 2026</p>
        <h1 id="study-heading">The study cockpit</h1>
        <p>
          Three modules, one ledger - every block should leave evidence as a module session,
          material, snippet, task, or note.
        </p>
        <div className="study-hero-progress">
          <div>
            <span>{completedCards} of {totalCards} cards complete</span>
            <strong>{progress}%</strong>
          </div>
          <progress value={completedCards} max={totalCards}>{progress}%</progress>
          <small>exams end 28 August - resit window</small>
        </div>
        <div className="study-actions">
          <button className="primary-pill" type="button" onClick={() => navigate('/court')}>
            Capture evidence
          </button>
          <button className="ghost-pill" type="button" onClick={() => navigate('/today')}>
            Today queue
          </button>
          <button className="ghost-pill" type="button" onClick={() => navigate('/calendar')}>
            Calendar
          </button>
        </div>
      </section>

      <section className="study-metrics" aria-label="Study metrics">
        <article>
          <span>{totalCards - completedCards}</span>
          <p>Cards remaining</p>
          <small>across three modules</small>
        </article>
        <article>
          <span>55</span>
          <p>Days to exams end</p>
          <small>28 August</small>
        </article>
        <article>
          <span>{evidenceCount}</span>
          <p>Evidence artefacts</p>
          <small>from the unified ledger</small>
        </article>
        <article>
          <span>{studyCount}</span>
          <p>Study ledger entries</p>
          <small>modules / sessions / materials</small>
        </article>
      </section>

      <section className="module-workspaces" aria-labelledby="modules-heading">
        <div className="section-heading">
          <h2 id="modules-heading">Module workspaces</h2>
          <span />
          <small>same ledger, study lens</small>
        </div>

        <div className="module-stack">
          {MODULES.map((module) => {
            const evidence = moduleEvidence(entries, module.code)
            const pct = Math.round((module.complete / module.total) * 100)

            return (
              <article className="module-row" key={module.code} style={{ '--module-accent': module.accent }}>
                <img src={module.hero} alt={`${module.title} visual`} />
                <div className="module-main">
                  <div className="module-line">
                    <span>{module.code}</span>
                    <span>{pct}% done</span>
                  </div>
                  <h3>{module.title}</h3>
                  <p>{module.lane}</p>
                  <div className="module-facts">
                    <span>{module.complete} of {module.total} cards</span>
                    <span>{module.logged} logged</span>
                    <span>next: {module.next}</span>
                    <span>{evidence.length} ledger links</span>
                  </div>
                  <progress value={module.complete} max={module.total}>{pct}%</progress>
                  <small>{module.note}</small>
                </div>
                <div className="module-actions">
                  <button className="primary-pill compact-pill" type="button" onClick={() => navigate('/court')}>
                    Capture
                  </button>
                  <button className="ghost-pill compact-pill" type="button" onClick={() => navigate('/today')}>
                    Queue
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="study-queues">
        <section className="study-queue-panel" aria-labelledby="due-heading">
          <div className="section-heading">
            <h2 id="due-heading">Due today</h2>
            <span />
          </div>
          <ol className="study-task-list">
            {DUE_QUEUE.map((item) => (
              <li key={`${item.module}-${item.title}`} style={{ '--item-accent': item.accent }}>
                <span />
                <div>
                  <p>{item.module} - {item.title}</p>
                  <small>{item.meta}</small>
                </div>
                <em>{item.kind}</em>
              </li>
            ))}
          </ol>
        </section>

        <section className="study-queue-panel" aria-labelledby="evidence-heading">
          <div className="section-heading">
            <h2 id="evidence-heading">Ledger evidence</h2>
            <span />
          </div>
          {error ? (
            <p className="form-error compact-error">{error}</p>
          ) : studyCount ? (
            <ol className="study-task-list">
              {entries.filter((entry) => STUDY_TYPES.has(entry.type)).slice(0, 5).map((entry) => (
                <li key={entry.id} style={{ '--item-accent': 'var(--g-blue)' }}>
                  <span />
                  <div>
                    <p>{entry.title || entry.type}</p>
                    <small>{entry.type} / {entry.status || 'open'}</small>
                  </div>
                  <em>{entry.archetype}</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">No study evidence filed yet.</p>
          )}
        </section>
      </section>
    </section>
  )
}
