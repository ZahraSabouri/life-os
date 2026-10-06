import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { CardList, StudyOverview, StudyBoard, StudyTable, StudyWeek, StudyProgress, StudyEvidence, StudyRescue, StudySchedule, StudyAssessments } from '../src/components/study/StudyViews.jsx'

const noop = () => {}
const module = { id: 'module', title: 'Research methods', status: 'active', data: { code: 'RES', objectives: ['Evaluate a source'], operatingRules: ['Save your evidence'], note: 'Open questions' } }
const card = { id: 'card', module_id: module.id, title: 'Compare two sources', status: 'planned', start_date: '2026-10-05', end_date: '2026-10-05', data: { lane: 'Today', estimatedHours: 1, actualHours: 0.5, checklist: [{ id: 'check', text: 'Record the comparison', done: true }], notes: [{ text: 'Check assumptions' }], evidenceEntries: [{ text: 'Saved comparison' }], focusSessions: [{ minutes: 30, at: '2026-10-05T09:00:00Z' }] } }
const session = { id: 'session', title: 'Reading session', status: 'planned', start_at: '2026-10-05T09:00:00Z', end_at: '2026-10-05T10:00:00Z', data: { category: 'reading' } }
const assessment = { id: 'assessment', title: 'Research portfolio', status: 'planned', end_at: '2026-10-05T15:00:00Z', data: { type: 'project', weight: 30 } }
const views = { CardList, StudyOverview, StudyBoard, StudyTable, StudyWeek, StudyProgress, StudyEvidence, StudyRescue, StudySchedule, StudyAssessments }
for (const populated of [false, true]) {
  test(`Study views render a ${populated ? 'populated general-study' : 'new empty'} workspace`, () => {
    const props = { cards: populated ? [card] : [], modules: populated ? [module] : [], parents: [], sessions: populated ? [session] : [], assessments: populated ? [assessment] : [], progress: [], settings: [], today: '2026-10-05', lanes: ['Today', 'Done'], onOpen: noop, onDone: noop, onFocus: noop, onLane: noop, onEdit: noop, onSelectModule: noop, onReschedule: noop, onOpenCard: noop }
    for (const [name, Component] of Object.entries(views)) {
      const markup = renderToStaticMarkup(<Component {...props} />)
      assert.ok(markup.length, `${name} must render useful content`)
      assert.ok(!markup.includes('[object Object]'), `${name} must display values`)
    }
    if (populated) {
      assert.match(renderToStaticMarkup(<StudyOverview {...props} activeModule={module} />), /Open questions/)
      assert.match(renderToStaticMarkup(<StudySchedule {...props} />), /Research portfolio/)
    }
  })
}
