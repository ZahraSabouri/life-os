import assert from 'node:assert/strict'
import test from 'node:test'

import { attachCardResourceLinks } from '../src/data/cardResources.js'
import { applyCardStudySequences } from '../src/data/cardStudySequences.js'
import {
  INTENSIVE_PLAN_CARD_IDS_BY_DATE,
  INTENSIVE_PLAN_END,
  INTENSIVE_PLAN_START,
  INTENSIVE_READING_END,
  INTENSIVE_REVIEW_START,
  INTENSIVE_STUDY_CARDS,
  INTENSIVE_STUDY_SEQUENCES,
} from '../src/data/intensiveStudyPlan.js'
import { STUDY_MODULES } from '../src/data/studyModules.js'
import {
  AML_READINESS_DEADLINE,
  CAMPAIGN_END,
  CAMPAIGN_START,
  EXAM_WINDOW_START,
  MAT700_EXAM_DATE,
  READINESS_DEADLINE,
  TIME_SERIES_EXAM_DATE,
  rescueCards,
  scheduleExceptions,
  scheduleRules,
} from '../src/data/summerRescuePlan.js'
import {
  migrateTrackerState,
  PLAN_REVISION,
  TRACKER_STATE_VERSION,
} from '../src/state/trackerStateMigration.js'
import {
  expandScheduleRange,
  findScheduleConflicts,
  minutesBetween,
  summariseDay,
} from '../src/utils/schedule.js'

function moduleResources(moduleGroup) {
  return STUDY_MODULES.find((module) => module.moduleGroup === moduleGroup)?.resources ?? []
}

test('the 8-17 August calendar gives both urgent modules a protected lane every day', () => {
  const days = expandScheduleRange(scheduleRules, scheduleExceptions, CAMPAIGN_START, CAMPAIGN_END)
  assert.equal(CAMPAIGN_START, '2026-08-08')
  assert.equal(READINESS_DEADLINE, '2026-08-17')
  assert.equal(days.length, 18)

  for (const day of days) {
    const summary = summariseDay(day.blocks)
    assert.equal(findScheduleConflicts(day.blocks).length, 0, `conflict on ${day.date}`)
    assert.equal(summary.sleepMinutes, 480, `sleep on ${day.date}`)
    assert.ok(summary.academicMinutes <= 510, `bounded academic load on ${day.date}`)
  }

  const sprintDays = days.filter((day) => day.date <= READINESS_DEADLINE)
  assert.equal(sprintDays.length, 10)
  for (const day of sprintDays) {
    const expectedIds = INTENSIVE_PLAN_CARD_IDS_BY_DATE[day.date]
    const study = day.blocks.filter((block) => block.category === 'study')
    const timeSeries = study.filter((block) => block.moduleGroup === 'Time Series')
    const mat700 = study.filter((block) => block.moduleGroup === 'MAT700')
    assert.equal(timeSeries.length, 2, `two Time Series lanes on ${day.date}`)
    assert.equal(mat700.length, 2, `two MAT700 lanes on ${day.date}`)
    assert.ok(timeSeries.every((block) => block.cardId === expectedIds.timeSeries))
    assert.ok(mat700.every((block) => block.cardId === expectedIds.mat700))
  }
})

test('the frozen intensive plan has two deadline-driven cards per day and no hour quotas', () => {
  assert.equal(INTENSIVE_PLAN_START, '2026-08-08')
  assert.equal(INTENSIVE_READING_END, '2026-08-12')
  assert.equal(INTENSIVE_REVIEW_START, '2026-08-13')
  assert.equal(INTENSIVE_PLAN_END, '2026-08-17')
  assert.equal(INTENSIVE_STUDY_CARDS.length, 20)

  for (const date of Object.keys(INTENSIVE_PLAN_CARD_IDS_BY_DATE)) {
    const cards = INTENSIVE_STUDY_CARDS.filter((card) => card.dueDate === date)
    assert.deepEqual(cards.map((card) => card.moduleGroup).sort(), ['MAT700', 'Time Series'])
    assert.ok(cards.every((card) => card.startDate === date))
    assert.ok(cards.every((card) => card.deadlineDriven === true))
    assert.ok(cards.every((card) => card.estimatedHours === 0))
    assert.ok(cards.every((card) => card.sourcePolicy === 'original-only'))
    assert.ok(cards.every((card) => /daily completion gate/i.test(card.slotLabel)))
  }

  assert.ok(INTENSIVE_STUDY_CARDS.filter((card) => card.dueDate <= INTENSIVE_READING_END)
    .every((card) => card.tags.includes('reading-phase') && card.phase === 'Phase 0'))
  assert.ok(INTENSIVE_STUDY_CARDS.filter((card) => card.dueDate >= INTENSIVE_REVIEW_START)
    .every((card) => card.tags.includes('question-phase') && card.phase === 'Phase 1'))
  assert.match(INTENSIVE_STUDY_CARDS.find((card) => card.id === 'ts-intensive-day-1').title, /L3-L4/)
  assert.match(INTENSIVE_STUDY_CARDS.find((card) => card.id === 'mat700-intensive-day-5').title, /L6.*L7/i)
  assert.match(INTENSIVE_STUDY_CARDS.find((card) => card.id === 'ts-intensive-day-10').title, /official mock/i)
  assert.match(INTENSIVE_STUDY_CARDS.find((card) => card.id === 'mat700-intensive-day-10').title, /2025 paper/i)
})

test('every intensive card has a complete sequence and only original or verified-aligned resources', () => {
  const enriched = attachCardResourceLinks(applyCardStudySequences(INTENSIVE_STUDY_CARDS), STUDY_MODULES)
  for (const card of enriched) {
    const sequence = INTENSIVE_STUDY_SEQUENCES[card.id]
    assert.ok(sequence, `sequence for ${card.id}`)
    assert.ok(sequence.concepts.length >= 4, `concept coverage for ${card.id}`)
    assert.ok(sequence.steps.length >= 3, `execution steps for ${card.id}`)
    assert.deepEqual(card.checklist, sequence.steps.map((step) => step.checklistText ?? step.label))
    assert.equal(card.studySequence.totalMinutes, 0, `no implicit hour quota for ${card.id}`)

    const resources = new Map(moduleResources(card.moduleGroup).map((resource) => [resource.id, resource]))
    assert.ok(card.resourceIds.length > 0, `resources for ${card.id}`)
    for (const resourceId of card.resourceIds) {
      const resource = resources.get(resourceId)
      assert.ok(resource, `${resourceId} exists for ${card.id}`)
      // Generated HTML is excluded by default (see cardResources.js's sourcePolicy
      // handling) unless it's a "mastery guide" or "mock exam" — those are rebuilt
      // and verified page-by-page against the same original lecture PDFs these
      // cards already point to, so they count as aligned-with-source, not a
      // heuristic AI match. Anything else generated (formula sheets, question
      // banks not yet rebuilt to that standard) must still not appear here.
      const isVerifiedMasteryGuide =
        resource.type === 'HTML' &&
        ['mastery guide', 'mock exam'].some((tag) => (resource.tags ?? []).includes(tag))
      assert.ok(
        resource.type !== 'HTML' || isVerifiedMasteryGuide,
        `${resourceId} is either non-HTML or a verified mastery guide/mock exam`,
      )
      if (!isVerifiedMasteryGuide) {
        assert.doesNotMatch(resource.url ?? '', /\.html(?:$|[?#])/i, `${resourceId} does not open HTML`)
      }
    }
  }
})

test('live exam-module cards use the new plan and the countdown opens on the first real exam', () => {
  assert.equal(EXAM_WINDOW_START, '2026-08-18')
  assert.equal(MAT700_EXAM_DATE, '2026-08-18')
  assert.equal(TIME_SERIES_EXAM_DATE, '2026-08-19')
  assert.equal(AML_READINESS_DEADLINE, '2026-08-25')
  assert.equal(CAMPAIGN_END, AML_READINESS_DEADLINE)

  const timeSeries = rescueCards.filter((card) => card.moduleGroup === 'Time Series')
  const mat700 = rescueCards.filter((card) => card.moduleGroup === 'MAT700')
  assert.equal(timeSeries.length, 10)
  assert.equal(mat700.length, 10)
  assert.ok([...timeSeries, ...mat700].every((card) => card.id.includes('intensive-day-')))
  assert.ok([...timeSeries, ...mat700].every((card) => card.dueDate <= READINESS_DEADLINE))

  const appliedMl = rescueCards.filter((card) => card.moduleGroup === 'Applied ML')
  assert.ok(appliedMl.length > 0)
  assert.ok(appliedMl.every((card) => card.startDate >= '2026-08-20'))
  assert.ok(appliedMl.every((card) => card.dueDate <= AML_READINESS_DEADLINE))
  assert.ok(rescueCards.every((card) => !/39|resit|reassess/i.test(
    `${card.title} ${card.description} ${card.trackerNotes} ${(card.tags ?? []).join(' ')}`,
  )))
})

test('daily administration, project scope and paused job hunting remain bounded', () => {
  const days = expandScheduleRange(scheduleRules, scheduleExceptions, CAMPAIGN_START, CAMPAIGN_END)
  for (const day of days) {
    const admin = day.blocks.filter((block) => block.id.startsWith('daily-admin-'))
    assert.equal(admin.length, 1, `daily admin on ${day.date}`)
    assert.ok(minutesBetween(admin[0].start, admin[0].end) <= 15)
  }

  const sprintDays = days.filter((day) => day.date <= READINESS_DEADLINE)
  assert.equal(sprintDays.flatMap((day) => day.blocks).filter((block) => block.category === 'job').length, 0)
  assert.ok(sprintDays.flatMap((day) => day.blocks)
    .filter((block) => block.category === 'project')
    .every((block) => minutesBetween(block.start, block.end) <= 120))
  assert.equal(rescueCards.filter((card) => card.moduleGroup === 'Job Hunt').length, 0)
  assert.ok(rescueCards.some((card) => card.id === 'project-report-submit' && card.dueDate === '2026-08-12'))
  assert.ok(rescueCards.every((card) => !card.id.startsWith('admin-date-watch-')))
})

test('the 8 August migration preserves live work and materialises retired base-card history', () => {
  const live = {
    version: 8,
    cards: {
      'card-001': {
        status: 'Done', done: true, actualHours: 1.25, progressPercent: 100,
        activity: [{ id: 'a1', action: 'Marked done', at: '2026-07-22T14:29:20.495Z' }],
      },
      'card-002': {
        status: 'Done', done: true, actualHours: 3.25, progressPercent: 30,
        notes: [{ id: 'n2', at: '2026-08-06T17:02:32.141Z', text: 'Keep TS evidence' }],
        activity: [{ id: 'a2', action: 'Marked done', at: '2026-08-06T20:00:00.000Z' }],
      },
      'mat700-foundation-reset': { status: 'Done', done: true, actualHours: 1 },
      'project-submit': { status: 'Done', done: true, actualHours: 2 },
      'admin-date-watch-2': { status: 'Done', done: true, actualHours: 0.25 },
      'empty-old-card': { status: 'Backlog', done: false },
    },
    addedCards: [],
    dayLogs: { '2026-08-06': { note: 'Preserve this real day' } },
    resourceProgress: { original: { progressPercent: 40 } },
    shoppingList: [{ id: 'milk', text: 'Milk', category: 'groceries', done: false }],
    settings: {
      planRevision: '2026-08-03-confirmed-exam-date-reset-v1',
      campaignStart: '2026-08-03',
      campaignEnd: '2026-08-25',
      examWindowStart: '2026-08-17',
      referenceDate: '2026-08-08',
      moduleExamDates: { aml: '2026-08-26' },
    },
  }

  const migrated = migrateTrackerState(live)
  assert.equal(migrated.version, TRACKER_STATE_VERSION)
  assert.equal(migrated.settings.planRevision, PLAN_REVISION)
  assert.equal(migrated.settings.campaignStart, '2026-08-08')
  assert.equal(migrated.settings.examWindowStart, '2026-08-18')
  assert.deepEqual(migrated.settings.moduleExamDates, {
    aml: '2026-08-26',
    'time-series': '2026-08-19',
    mat700: '2026-08-18',
  })
  assert.equal(migrated.cards['card-002'].actualHours, 3.25)
  assert.equal(migrated.cards['card-002'].notes[0].text, 'Keep TS evidence')
  assert.equal(migrated.cards['empty-old-card'], undefined)
  assert.deepEqual(migrated.dayLogs['2026-08-06'], { note: 'Preserve this real day', blocks: {} })
  assert.equal(migrated.resourceProgress.original.progressPercent, 40)
  assert.equal(migrated.shoppingList[0].text, 'Milk')
  assert.deepEqual(
    migrated.addedCards.filter((card) => card.tags.includes('pre-8-august-plan')).map((card) => card.id).sort(),
    ['admin-date-watch-2', 'card-002', 'mat700-foundation-reset', 'project-submit'],
  )
  assert.deepEqual(migrateTrackerState(migrated), migrated)
})

test('a fresh tracker starts with the three confirmed exam dates', () => {
  const migrated = migrateTrackerState(null)
  assert.equal(migrated.version, TRACKER_STATE_VERSION)
  assert.equal(migrated.settings.planRevision, PLAN_REVISION)
  assert.equal(migrated.settings.examWindowStart, '2026-08-18')
  assert.deepEqual(migrated.settings.moduleExamDates, {
    aml: '2026-08-26',
    'time-series': '2026-08-19',
    mat700: '2026-08-18',
  })
})
