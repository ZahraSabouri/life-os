import { baseCards as legacyCards } from './baseCards.js'
import { CARD_STUDY_SEQUENCE } from './cardStudySequences.js'
import {
  INTENSIVE_PLAN_CARD_IDS_BY_DATE,
  INTENSIVE_PLAN_START,
  INTENSIVE_STUDY_CARDS,
} from './intensiveStudyPlan.js'
import { AML_MARATHON_CARDS } from './amlMarathonPlan.js'

export const CAMPAIGN_START = INTENSIVE_PLAN_START
export const HISTORY_SCHEDULE_START = '2026-07-16'
// Real confirmed exam dates, published on the Cardiff TimeEdit timetable
// 2026-08-06 (screenshot supplied by the user) — replaces the earlier
// worst-case-17-Aug placeholder for both modules. MAT700 is one day later
// and Time Series two days later than the worst case, but they land on
// consecutive days with only one evening between them, so Time Series still
// needs to be ready alongside MAT700, not after it.
export const MAT700_EXAM_DATE = '2026-08-18'
export const MAT700_EXAM_START = '13:30'
export const MAT700_EXAM_END = '15:30'
export const MAT700_EXAM_LOCATION = 'Muller Hall, All Nations Centre'
export const TIME_SERIES_EXAM_DATE = '2026-08-19'
export const TIME_SERIES_EXAM_START = '09:00'
export const TIME_SERIES_EXAM_END = '11:00'
export const TIME_SERIES_EXAM_LOCATION = 'Main Hall, All Nations Centre'
// Last full free day before the exam pair — one real day later than the old
// worst-case line (16 Aug) now that MAT700 is confirmed for 18 Aug, not 17.
export const READINESS_DEADLINE = '2026-08-17'
// Official resit assessment window (unchanged — this is the published
// period, not a specific exam date). Applied ML's own tail no longer starts
// here now that the real MAT700/Time Series dates are known — see
// AML_TAIL_START below.
export const EXAM_WINDOW_START = '2026-08-18'
export const EXAM_WINDOW_END = '2026-08-28'
// Applied ML's protected tail can't realistically start until both other
// exams are behind you: 18 Aug is MAT700's exam day (kept light either
// side of it — no new AML content, per §6/§15 sleep-and-recovery rules),
// 19 Aug is the Time Series exam morning plus a genuine recovery day after
// two major written exams in under 24 hours. Full-pace AML starts 20 Aug.
export const AML_TAIL_START = '2026-08-20'
// CMT307 (Applied ML) exam is confirmed for 26 August, so it gets its own,
// longer readiness line instead of sharing the TS/MAT700 deadline.
export const AML_READINESS_DEADLINE = '2026-08-25'
export const CAMPAIGN_END = AML_READINESS_DEADLINE
// The date this backlog-clear patch was written and applied — used as the
// floor for any exam card whose algorithmic date still falls in the past.
// Not a live "today"; a fixed anchor for this specific reset, same pattern
// as CAMPAIGN_START for the 3 Aug reset.
const BACKLOG_CLEAR_DATE = INTENSIVE_PLAN_START

// Time Series and MAT700 share one worst-case-anchored window (readiness by
// 16 Aug). Applied ML gets a longer window ending 25 Aug (confirmed exam 26
// Aug), so its daily pace is lighter and its own Phase 2 lands after the
// other two modules are already exam-ready.
const PHASE_WINDOWS_BY_MODULE = {
  // Applied ML is paused entirely during the 3-17 Aug Time Series/MAT700
  // crunch AND across the 18-19 Aug exam pair (see amlTailStudyRules) — it
  // gets zero protected time until AML_TAIL_START, so its cards must all
  // land inside that 6-day tail too, not spread from CAMPAIGN_START.
  'Applied ML': {
    'Phase 0': [AML_TAIL_START, '2026-08-22'],
    'Phase 1': ['2026-08-23', '2026-08-24'],
    'Phase 2': [AML_READINESS_DEADLINE, AML_READINESS_DEADLINE],
  },
  // Phase 0 re-anchored 2026-08-06 (BACKLOG_CLEAR_DATE): 3 days of Phase 0
  // (3-5 Aug) passed with essentially zero real progress logged against
  // either module. Re-dating individual overdue cards one at a time (tried
  // first) either missed cards the algorithm also placed in the past, or —
  // once a blanket "floor to today" safety net was added to catch those —
  // piled 10 different cards onto the single BACKLOG_CLEAR_DATE, which is
  // its own problem (max ~6 cards/day). Shifting Phase 0's START to today
  // instead lets spreadCardsAcrossWindow do what it already does correctly:
  // proportionally redistribute EVERY not-yet-progressed Phase 0 card across
  // the real remaining days (6-9 Aug), not just the ones that happened to
  // slip into the past. This is the same re-anchor pattern used for every
  // previous reset in this file (see capacity-crisis memory) — restart the
  // window, don't hand-patch individual dates.
  'Time Series': {
    'Phase 0': [BACKLOG_CLEAR_DATE, '2026-08-09'],
    'Phase 1': ['2026-08-10', '2026-08-13'],
    'Phase 2': ['2026-08-14', READINESS_DEADLINE],
  },
  MAT700: {
    'Phase 0': [BACKLOG_CLEAR_DATE, '2026-08-09'],
    'Phase 1': ['2026-08-10', '2026-08-13'],
    'Phase 2': ['2026-08-14', READINESS_DEADLINE],
  },
}

const RESET_PHASE = { 'Phase 2': 'Phase 0', 'Phase 3': 'Phase 1', 'Phase 4': 'Phase 2' }

function resetPhaseText(value) {
  return typeof value === 'string'
    ? value.replace(/Phase [234]/g, (phase) => RESET_PHASE[phase] ?? phase)
    : value
}

const SELECTED_TS_PAPER_NUMBERS = {
  'card-089': ['#4', '#2'],
  'card-092': ['#4', '#2'],
  'card-113': ['#6', '#3'],
  'card-116': ['#6', '#3'],
  'card-118': ['#7', '#4'],
}

function resetSelectedPaperText(cardId, value) {
  const replacement = SELECTED_TS_PAPER_NUMBERS[cardId]
  if (typeof value !== 'string' || !replacement) return value
  return value.replaceAll(replacement[0], replacement[1])
}

const AML_KEEP = new Set([
  1, 3, 5, 7, 8, 11, 14, 17, 20, 24, 26, 33, 36, 46,
  51, 56, 62, 65, 73, 76,
  88, 91, 98, 101, 115, 117,
])

// 2.5 / 12.5 / 21.5 (the Pack A/B/C mocks) are deliberately excluded from
// 2026-08-06 on: three separate compressed mocks squeezed into an already
// tight week cost more than they return, so they're replaced by ONE
// combined card — see tsCustomCards below.
//
// NOT cut, after testing: Pack F (44/47/47.5) was tried and reverted —
// removing it barely moved the total (fitCardsToTotal redistributes the
// *target* across whichever cards remain, and Time Series' target is
// already floor-bound by CARD_STUDY_SEQUENCE minimums, not by card count —
// see the capacity-note below scheduleAssumptions for the real, still-open
// gap this leaves). Cutting real exam content to force a calendar fit is a
// call worth making deliberately, not silently overnight.
const TIME_SERIES_KEEP = new Set([
  2, 9, 12, 15, 21, 25, 28, 31, 31.5, 34, 37, 40, 40.5, 44, 47, 47.5, 48,
  52, 55, 58, 63, 66, 74, 77,
  89, 92, 113, 116, 118,
])

const MODULE_SLOTS = {
  'Applied ML': 'AM / protected AML blocks',
  'Time Series': 'PM / protected Time Series blocks',
  MAT700: 'Protected MAT700 blocks',
}

// Card-work envelopes for the 3 August confirmed-exam-date reset. Time Series
// and MAT700 carry the same total hours as before, resplit across a
// compressed 14-day worst-case window (~3.5h/day and ~2.6h/day respectively,
// evenly paced — early Phase 0 cards are the still-undone foundation/tutorial
// work, so the backlog lands first automatically). Applied ML keeps its
// total too, but resplit across its own 23-day window to 25 Aug
// (~2.5h/day), freeing headroom during the TS/MAT700 crunch fortnight.
const PHASE_CAPACITY_HOURS = {
  'Applied ML': { 'Phase 0': 28, 'Phase 1': 17.5, 'Phase 2': 12.87 },
  // Rebalanced 2026-08-06 (second pass): all 18 selected legacy cards used
  // to land in Phase 0 (see TS_PACK_DEF_TO_PHASE1 above for why), so an
  // earlier attempt to shrink Phase 0's target did nothing — the real fix
  // was moving Pack D/E/F + the recall sheet (12 cards) to Phase 1, not
  // tuning a target no card actually needed. Phase 0 now covers only Packs
  // A-C (~6 cards) over its real 4-day window (6-9 Aug); its target drops
  // from 32 to 11h to match. Phase 1 absorbs the difference (14 -> 35h) on
  // top of its original 7 cards, over its unchanged 4-day window (10-13
  // Aug). Phase 2 (14-17 Aug, final recall/timed papers) is untouched.
  // Total content (56.5h) is unchanged — only WHEN it's due moved.
  'Time Series': { 'Phase 0': 11, 'Phase 1': 35, 'Phase 2': 10.5 },
  MAT700: { 'Phase 0': 18.5, 'Phase 1': 10.5, 'Phase 2': 8 },
}

// Estimates remain in real wall-clock hours; sequence steps are minimums.
// A factor of one means the app does not hide or invent any extra study time.
export const REALISM_FACTOR = 1

function dateRange(start, end) {
  const values = []
  const cursor = new Date(`${start}T12:00:00`)
  const finish = new Date(`${end}T12:00:00`)
  while (cursor <= finish) {
    values.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return values
}

function cleanMat700Text(value) {
  return String(value ?? '')
    .replace(/\s*\(insurance\)/gi, '')
    .replace(/insurance lane/gi, 'active study lane')
    .replace(/insurance/gi, 'revision')
}

function statusForDate(date) {
  if (date <= '2026-07-19') return 'This Week'
  return 'Backlog'
}

function spreadCardsAcrossWindow(cards, start, end) {
  const dates = dateRange(start, end)
  const totalHours = cards.reduce((sum, card) => sum + Number(card.estimatedHours || 0), 0) || 1
  let completedHours = 0

  return cards.map((card) => {
    const hours = Number(card.estimatedHours || 0)
    const startRatio = completedHours / totalHours
    const endRatio = (completedHours + hours) / totalHours
    const startIndex = Math.min(dates.length - 1, Math.floor(startRatio * dates.length))
    const endIndex = Math.min(
      dates.length - 1,
      Math.max(startIndex, Math.ceil(endRatio * dates.length) - 1),
    )
    const startDate = dates[startIndex]
    const dueDate = dates[endIndex]
    completedHours += hours

    return {
      ...card,
      sourceList: '3 August confirmed-exam-date reset',
      status: statusForDate(dueDate),
      startDate,
      dueDate,
      dueDateTime: `${dueDate} 18:15`,
      slotLabel: `${MODULE_SLOTS[card.moduleGroup] ?? 'Protected study blocks'} · ${startDate}${startDate === dueDate ? '' : ` to ${dueDate}`} (${hours}h)`,
      tags: [...new Set([...(card.tags ?? []), '25-july-reset'])],
    }
  })
}

// Found 2026-08-06, live in the app: EVERY selected legacy Time Series card
// is tagged "Phase 2" in baseCards.js, which RESET_PHASE maps to "Phase 0"
// universally — so all 18 Phase-0 cards (all of Packs A-F) were competing
// for the same 4 real days (6-9 Aug) once Phase 0's window got re-anchored
// to today. That's what put 4 cards on today alone and made a hand-written
// block title ("card-009...") show a different card's content underneath —
// the algorithm had no way to know Pack D/E/F were meant to come later.
// Packs D/E/F (plus the cross-pack recall sheet, card-048) move to Phase 1
// instead, where there's real room (8/10-13) — Phase 0 keeps only Packs
// A-C, which is what the day-blocked 6-9 Aug schedule can actually cover.
const TS_PACK_DEF_TO_PHASE1 = new Set([25, 28, 31, 31.5, 34, 37, 40, 40.5, 44, 47, 47.5, 48])

function selectedLegacyExamCards() {
  return legacyCards
    .filter((card) => {
      if (card.moduleGroup === 'Applied ML') return AML_KEEP.has(card.number)
      if (card.moduleGroup === 'Time Series') return TIME_SERIES_KEEP.has(card.number)
      return false
    })
    .map((card) => {
      const rebalanced = card.moduleGroup === 'Time Series' && TS_PACK_DEF_TO_PHASE1.has(card.number)
      const phase = rebalanced ? 'Phase 1' : (RESET_PHASE[card.phase] ?? card.phase)
      return {
      ...card,
      phase,
      phaseId: phase.toLowerCase().replace(/\s+/g, '-'),
      title: resetSelectedPaperText(card.id, resetPhaseText(card.title)),
      description: resetSelectedPaperText(card.id, resetPhaseText(card.description)),
      checklist: (card.checklist ?? []).map(resetPhaseText).map((item) => resetSelectedPaperText(card.id, item)),
      evidenceRequirement: resetSelectedPaperText(card.id, resetPhaseText(card.evidenceRequirement)),
      doneCondition: resetSelectedPaperText(card.id, resetPhaseText(card.doneCondition)),
      trackerNotes: [resetSelectedPaperText(card.id, resetPhaseText(card.trackerNotes)), 'Replanned on 3 August once the CMT307 exam date (26 Aug) was confirmed, while Time Series and MAT700 stay planned to the worst-case 17 Aug window start; preserving completed and partially logged work.']
        .filter(Boolean)
        .join(' '),
      }
    })
}

function fitCardsToTotal(cards, targetHours) {
  const minimums = cards.map((card) => {
    const plan = CARD_STUDY_SEQUENCE[card.id]
    const minutes = (plan?.steps ?? []).reduce((sum, step) => sum + Number(step.minutes || 0), 0)
    return minutes > 0 ? minutes / 60 : Number(card.estimatedHours || 0)
  })
  const minimumTotal = minimums.reduce((sum, hours) => sum + hours, 0)
  const spare = Math.max(0, targetHours - minimumTotal)
  const weights = cards.map((card) => Math.max(0.25, Number(card.estimatedHours || 0)))
  const weightTotal = weights.reduce((sum, hours) => sum + hours, 0) || 1

  return cards.map((card, index) => {
    const estimate = minimums[index] + spare * weights[index] / weightTotal
    return {
      ...card,
      // Round upward to the nearest five minutes so the displayed budget can
      // never be shorter than its own ordered study sequence.
      estimatedHours: Math.ceil((estimate - Number.EPSILON) * 12) / 12,
    }
  })
}

function fitExamCardsToTimetable(cards) {
  return Object.entries(PHASE_CAPACITY_HOURS).flatMap(([moduleGroup, phases]) =>
    Object.entries(phases).flatMap(([phase, targetHours]) =>
      fitCardsToTotal(
        cards.filter((card) => card.moduleGroup === moduleGroup && card.phase === phase),
        targetHours * REALISM_FACTOR,
      ),
    ),
  )
}

function makeCard({
  id,
  number,
  title,
  moduleGroup,
  phase,
  hours,
  description,
  checklist,
  evidence,
  done,
  priority = 'High',
  tags = [],
}) {
  return {
    id,
    number,
    sortOrder: number,
    title,
    module: moduleGroup,
    moduleGroup,
    phase,
    phaseId: phase.toLowerCase().replace(/\s+/g, '-'),
    sourceList: '25 July illness-recovery and interview reset',
    status: 'Backlog',
    priority,
    slotType: moduleGroup === 'MAT700' ? 'PM' : 'Flex',
    slotLabel: '',
    startDate: '',
    dueDate: '',
    dueDateTime: '',
    estimatedHours: hours,
    description,
    checklist,
    evidenceRequirement: evidence,
    doneCondition: done,
    trackerNotes: 'Created for the 3 August confirmed-exam-date reset.',
    tags: [...new Set(tags)],
  }
}

const MAT700_LECTURES = Array.from({ length: 7 }, (_, index) => {
  const lecture = index + 1
  return makeCard({
    id: `mat700-rebuild-l${lecture}`,
    number: 301 + index,
    title: `MAT700 L${lecture} — rebuild concepts, formula sheet, and question-bank recall`,
    moduleGroup: 'MAT700',
    phase: 'Phase 0',
    hours: 2.5,
    priority: 'Critical',
    description: `Relearn Lecture ${lecture} from near-zero familiarity. Use the local study notes and question bank; the output must be usable without rereading the whole lecture.`,
    checklist: [
      `Targeted skim of Lecture ${lecture} notes/slides`,
      'Write the formulas, definitions, and one worked pattern from memory',
      'Answer the linked question-bank prompts before checking solutions',
      'Record every failed step in the MAT700 error log',
    ],
    evidence: `L${lecture} one-page sheet + checked question-bank attempt`,
    done: `Lecture ${lecture} can be recalled and one representative problem can be solved without copying`,
    tags: ['exam', 'recovery', `lecture-${lecture}`, 'critical-path'],
  })
})

const MAT700_TUTORIAL_TASKS = [
  'Tutorial 1 — first attempt and correction',
  'Tutorial 2 — first attempt and correction',
  'Tutorial 3 — first attempt and correction',
  'Tutorial 1 — delayed closed-book repeat',
  'Tutorial 2 — delayed closed-book repeat',
  'Tutorial 3 — delayed closed-book repeat',
  'Tutorials 1–3 — timed mixed synthesis set',
]

const MAT700_TUTORIALS = MAT700_TUTORIAL_TASKS.map((task, index) => {
  const tutorial = index + 1
  return makeCard({
    id: `mat700-tutorial-${tutorial}`,
    number: 311 + index,
    title: `MAT700 ${task}`,
    moduleGroup: 'MAT700',
    phase: 'Phase 0',
    hours: 2,
    priority: 'Critical',
    description: 'The available Tutorials 1–3 and their worked solutions are the centre of MAT700 revision. Slides support the attempt; they do not replace it.',
    checklist: [
      'Attempt the core questions without the solution open',
      'Check every line against the worked solution',
      'Redo incorrect questions immediately from a blank page',
      'Add 2–3 recall prompts and one error-log entry',
    ],
    evidence: `${task} attempt + corrected redo`,
    done: 'Core questions are attempted, checked, corrected, and one failed question is successfully repeated',
    tags: ['exam', 'recovery', 'tutorial', 'worked-problems'],
  })
})

const MAT700_PHASE_3 = [
  ['mat700-template-a', 321, 'MAT700 timed templates — expected counts, TF-IDF, vectors, and Jaccard'],
  ['mat700-template-b', 322, 'MAT700 timed templates — graphs, distances, proofs, and kNN'],
  ['mat700-template-c', 323, 'MAT700 timed templates — Naive Bayes, PageRank, clustering, and k-means'],
  ['mat700-template-d', 324, 'MAT700 timed templates — softmax, metrics, experts, and boosting'],
].map(([id, number, title]) =>
  makeCard({
    id,
    number,
    title,
    moduleGroup: 'MAT700',
    phase: 'Phase 1',
    hours: 2,
    priority: 'Critical',
    description: 'Convert the rebuilt material into a repeatable exam answer under time pressure.',
    checklist: [
      'Write the procedure/formula from memory',
      'Complete at least two representative questions under time',
      'Mark strictly against the solution',
      'Repair the weakest template immediately',
    ],
    evidence: 'timed attempt + marked corrections + updated error log',
    done: 'the template can be started from memory and completed within the assigned time',
    tags: ['exam', 'recovery', 'timed', 'template'],
  }),
)

const MAT700_PHASE_4 = [
  makeCard({
    id: 'mat700-paper-a', number: 331, title: 'MAT700 mixed question-bank set A — timed and closed-book', moduleGroup: 'MAT700', phase: 'Phase 2', hours: 3,
    priority: 'Critical', description: 'Build a representative set from the real tutorials and question bank, sit it under exam conditions, then mark it strictly.',
    checklist: ['Two-hour timed attempt', 'Mark every question', 'Calculate topic-level score', 'Rank the top three repair needs'],
    evidence: 'timed mixed set + score + ranked repair list', done: 'set is completed, marked, and the next repair is unambiguous', tags: ['exam', 'recovery', 'question-bank'],
  }),
  makeCard({
    id: 'mat700-repair-a', number: 332, title: 'MAT700 weak-topic repair after mixed set A', moduleGroup: 'MAT700', phase: 'Phase 2', hours: 2,
    description: 'Repair only the failures exposed by mixed set A; no broad rereading.', checklist: ['Redo failed questions', 'Return to one targeted tutorial/lecture source', 'Repeat from blank', 'Update formula sheet'],
    evidence: 'corrected questions + error-log closure', done: 'the highest-value errors can be solved from a blank page', tags: ['exam', 'recovery', 'repair'],
  }),
  makeCard({
    id: 'mat700-paper-b', number: 333, title: 'MAT700 mixed question-bank set B — timed and closed-book', moduleGroup: 'MAT700', phase: 'Phase 2', hours: 3,
    priority: 'Critical', description: 'Second full simulation to prove the pass margin is repeatable.', checklist: ['Two-hour timed attempt', 'Mark strictly', 'Compare with mixed set A', 'Identify any repeated error'],
    evidence: 'timed mixed set + score comparison', done: 'a second marked set shows a credible pass path', tags: ['exam', 'recovery', 'question-bank'],
  }),
  makeCard({
    id: 'mat700-repair-b', number: 334, title: 'MAT700 final weak-topic repair', moduleGroup: 'MAT700', phase: 'Phase 2', hours: 2,
    description: 'Close repeated errors only. Protect recall and confidence.', checklist: ['Fix repeated errors', 'Redo one question per weak template', 'Check formula recall', 'Stop adding new material'],
    evidence: 'final corrected set', done: 'no repeated high-value error remains unaddressed', tags: ['exam', 'recovery', 'repair'],
  }),
  makeCard({
    id: 'mat700-final-recall', number: 335, title: 'MAT700 final formula, procedure, and error-log sweep', moduleGroup: 'MAT700', phase: 'Phase 2', hours: 1.5,
    priority: 'Critical', description: 'Final retrieval pass before the exam window. Recall first; check second.', checklist: ['Write core formulas from memory', 'Recite procedure triggers', 'Review only unresolved error-log lines', 'Prepare exam materials'],
    evidence: 'final closed-book recall sheet', done: 'the high-yield sheet can be reproduced without notes', tags: ['exam', 'recovery', 'final-recall'],
  }),
]

const MAT700_DIAGNOSTIC = makeCard({
  id: 'mat700-foundation-reset',
  number: 300,
  title: 'MAT700 foundation reset — build the pass specification',
  moduleGroup: 'MAT700',
  phase: 'Phase 0',
  hours: 1,
  priority: 'Critical',
  description: 'Set the working target, inventory the seven lectures/tutorials, and define the evidence needed for exam readiness. This is planning, not rumination.',
  checklist: [
    'Record the assessment scope and working target',
    'Inventory Lectures 1–7, Tutorials 1–3, solutions, and question banks',
    'Create one MAT700 error log',
    'Write the pass rule: tutorials first, timed retrieval, strict marking',
  ],
  evidence: 'MAT700 study dashboard + empty error-log template',
  done: 'all resources and the pass workflow are ready for Lecture 1',
  tags: ['exam', 'recovery', 'admin', 'critical-path'],
})

const MAT700_KEEP = new Set([
  'mat700-foundation-reset',
  ...Array.from({ length: 7 }, (_, index) => `mat700-rebuild-l${index + 1}`),
  'mat700-tutorial-1',
  'mat700-tutorial-2',
  'mat700-tutorial-3',
  'mat700-tutorial-7',
  'mat700-template-a',
  'mat700-template-b',
  'mat700-template-c',
  'mat700-template-d',
  'mat700-paper-a',
  'mat700-repair-a',
  'mat700-final-recall',
])

const mat700Cards = [
  MAT700_DIAGNOSTIC,
  ...MAT700_LECTURES,
  ...MAT700_TUTORIALS,
  ...MAT700_PHASE_3,
  ...MAT700_PHASE_4,
].filter((card) => MAT700_KEEP.has(card.id))

// Replaces card-002-mock (Pack A) + card-012-mock (Pack B) + card-021-mock
// (Pack C), removed from TIME_SERIES_KEEP above. Added 2026-08-06 as part of
// the backlog-clear reset: sortOrder 21.6 keeps it seated right after Pack
// C (card-021) in the queue, so it naturally lands after its own
// prerequisites without needing a hand-picked calendar date.
const tsCustomCards = [
  {
    ...makeCard({
      id: 'ts-pack-abc-mixed-selftest',
      number: 21.6,
      title: 'TS Packs A–C — combined mixed self-test (closed-book)',
      moduleGroup: 'Time Series',
      phase: 'Phase 0',
      hours: 1.5,
      priority: 'High',
      description: 'One combined closed-book paper mixing Pack A (smoothing), Pack B (stationarity/WSS), and Pack C (spectral/BLUP) questions. Run only once card-009, card-012, card-015 and card-021 each have real closed-book evidence logged — this diagnoses, it does not teach from scratch.',
      checklist: [
        'Confirm card-009, card-012, card-015 and card-021 each have closed-book evidence logged first — if not, do a short diagnostic (one definition + one calculation) instead of the full paper',
        'Sit one combined Pack A–C paper closed-book, compressed to ~70 min',
        'Reveal the marking guide and self-mark',
        'Classify each miss (recall / method-selection / calculation / notation) and log it',
      ],
      evidence: 'combined Pack A–C mock attempt + self-marked score + per-miss error classification',
      done: 'the combined paper is sat, marked, and every miss is classified in the error log',
      tags: ['exam', 'mock', 'merged-2026-08-06'],
    }),
    trackerNotes: 'Merges the three separate Pack A/B/C mocks into one combined self-test — decided 2026-08-06 to stop stacking compressed mock sessions into an already-tight week.',
  },
]

function phaseSpread(cards) {
  return ['Applied ML', 'Time Series', 'MAT700'].flatMap((moduleGroup) =>
    Object.entries(PHASE_WINDOWS_BY_MODULE[moduleGroup]).flatMap(([phase, [start, end]]) =>
      spreadCardsAcrossWindow(
        cards
          .filter((card) => card.moduleGroup === moduleGroup && card.phase === phase)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        start,
        end,
      ),
    ),
  )
}

// Superseded 21 Aug 2026 by the CMT307 Exam Marathon plan (aml-marathon-d0..d5,
// see amlMarathonPlan.js), which replaced the original S1-S4 session-based AML
// cards entirely. Excluded here the same way the pre-8-Aug Group Project cards
// are excluded via CAMPAIGN_START -- not deleted (still in baseCards.js for
// history), just kept out of the live card list so they cannot resurface with
// a stale due date. An earlier attempt deferred these via a state.json overlay
// (edits.dueDate pushed to 1 Sep) instead of excluding them at the source; that
// left them visible in the Applied ML view with a due date past the 26 Aug exam,
// which is what this exclusion actually fixes.
const SUPERSEDED_LEGACY_AML_IDS = new Set([
  'card-003', 'card-005', 'card-007', 'card-008', 'card-011', 'card-014', 'card-017', 'card-020',
  'card-024', 'card-026', 'card-033', 'card-036', 'card-046', 'card-051', 'card-056', 'card-062',
  'card-065', 'card-073', 'card-076', 'card-088', 'card-091', 'card-098', 'card-101', 'card-115',
  'card-117',
])

const previousPlanCandidates = [...selectedLegacyExamCards(), ...mat700Cards, ...tsCustomCards]
const legacyAmlCards = phaseSpread(
  fitExamCardsToTimetable(
    previousPlanCandidates.filter(
      (card) => card.moduleGroup === 'Applied ML' && !SUPERSEDED_LEGACY_AML_IDS.has(card.id),
    ),
  ),
)

const examCards = [...legacyAmlCards, ...INTENSIVE_STUDY_CARDS].map((card) => {
  if (card.moduleGroup !== 'MAT700') return card
  return {
    ...card,
    title: cleanMat700Text(card.title),
    description: cleanMat700Text(card.description),
    trackerNotes: cleanMat700Text(card.trackerNotes),
    tags: [...new Set((card.tags ?? []).filter((tag) => tag !== 'insurance').concat('active-exam'))],
    priority: card.priority === 'Low' || card.priority === 'Medium' ? 'High' : card.priority,
  }
})

function datedCard({
  id,
  number,
  title,
  moduleGroup,
  phase,
  startDate,
  dueDate,
  hours,
  priority,
  description,
  checklist,
  evidence,
  done,
  tags,
  slotLabel,
}) {
  return {
    ...makeCard({ id, number, title, moduleGroup, phase, hours, priority, description, checklist, evidence, done, tags }),
    status: statusForDate(dueDate),
    startDate,
    dueDate,
    dueDateTime: `${dueDate} 21:00`,
    slotType: moduleGroup === 'Group Project' ? 'Fixed' : 'Flex',
    slotLabel,
  }
}

const projectChecklist = [
  'Choose the highest-risk current team bottleneck; do not invent new scope',
  'Use each non-class block roughly as 75m backend/integration + 30m coordination/MR review + 15m evidence log',
  'Update GitLab issue/milestone/next action and save contribution evidence',
  'If a teammate fails: reduce scope, document the risk, and escalate instead of silently absorbing unlimited work',
]

const projectCards = [
  datedCard({
    id: 'project-capacity-w1', number: 201, title: 'CMT501 protected capacity — 16–19 July', moduleGroup: 'Group Project', phase: 'Phase 0', startDate: '2026-07-16', dueDate: '2026-07-19', hours: 5, priority: 'High',
    description: 'Generic capacity for the waste-management project. Work on the current bottleneck only; detailed project management stays in GitLab/the project app.', checklist: projectChecklist,
    evidence: 'GitLab activity + short contribution/risk note', done: 'the week’s protected blocks were used or deliberately released to exam study', tags: ['project', 'capacity', 'gitlab'], slotLabel: 'Thu class 3h + Sat 2h',
  }),
  datedCard({
    id: 'project-capacity-w2', number: 202, title: 'CMT501 minimum viable handoff - interview weekend', moduleGroup: 'Group Project', phase: 'Phase 0', startDate: '2026-07-25', dueDate: '2026-07-26', hours: 0.5, priority: 'High',
    description: 'Use one short handoff only: confirm the current blocker, owner, and next action before the Sati interview. Do not open a new technical branch or absorb unbounded rescue work.',
    checklist: ['Check the current highest-risk dependency in GitLab', 'Confirm its owner and next action', 'Leave one concise handoff/risk note; stop after 30 minutes'],
    evidence: 'one GitLab handoff or risk note', done: 'the current dependency has an owner and next action without consuming interview preparation', tags: ['project', 'capacity', 'gitlab', 'interview-weekend'], slotLabel: 'Sun 26 Jul 16:30-17:00',
  }),
  datedCard({
    id: 'project-internal-cutoff', number: 203, title: 'CMT501 integration surge — internal handoff by 2 August', moduleGroup: 'Group Project', phase: 'Phase 0', startDate: '2026-07-27', dueDate: '2026-08-02', hours: 12, priority: 'Critical',
    description: 'Protected surge toward the team’s 2 August internal deadline. Stabilise one integrated product on main; stop adding scope.', checklist: [...projectChecklist, 'Confirm backend, ML, database, frontend, and Docker integration path', 'Confirm a 20-minute demonstration plan and recording owner'],
    evidence: 'integrated-main evidence + demo readiness/risk note', done: 'the team has a runnable integration path and a bounded list for final submission', tags: ['project', 'deadline', 'integration'], slotLabel: 'Mon/Wed/Sat/Sun 2h blocks + Thu class 4h',
  }),
  datedCard({
    id: 'project-submit', number: 204, title: 'CMT501 finalisation and 20-minute team video — submit by 6 August', moduleGroup: 'Group Project', phase: 'Phase 1', startDate: '2026-08-03', dueDate: '2026-08-06', hours: 8, priority: 'Critical',
    description: 'Only integration, QA, recording, coversheet, and submission work. The team video is nominally 20 minutes and worth 60%.', checklist: ['Freeze scope', 'Run integrated demo from main', 'Verify claims against working functionality', 'Agree a per-segment script and do one timed run-through before recording', 'Record/review 20-minute video', 'Submit required files and preserve confirmation'],
    evidence: 'final video + coversheet + submission confirmation + contribution record', done: 'team submission is confirmed before the real deadline', tags: ['project', 'deadline', 'submission', 'fixed'], slotLabel: 'Mon/Wed protected blocks + Thu 10:00–14:00 class/submission window',
  }),
  // The individual reflective report is 40% of the module and was previously buried
  // in a single 3h "reserve". These three cards give it a real, staged lane —
  // outline+evidence while the project is fresh, a full draft, then finalise+submit —
  // so it cannot be crowded out by the team video and the exams. Dates target the
  // post-presentation window; the first card confirms the real deadline to shift to.
  datedCard({
    id: 'project-report-outline', number: 205, title: 'CMT501 reflective report — outline + evidence gather (start the 40%)', moduleGroup: 'Group Project', phase: 'Phase 1', startDate: '2026-08-07', dueDate: '2026-08-07', hours: 1.5, priority: 'High',
    description: 'The individual reflective report is worth 40% and is easy to under-serve after the team video. Start it while the project is fresh: confirm the real deadline, gather your evidence, and outline the 400/700/400 structure.', checklist: ['Confirm the official report deadline and word limit from the brief — do not assume', 'Archive your contribution evidence: issues, MRs, reviews, decisions, testing', 'Outline the 400/700/400 structure with bullet points per section', 'Note your 2–3 strongest reflection points (what you led; what you would do differently)'],
    evidence: 'report outline + organised contribution-evidence folder + confirmed deadline', done: 'the report is outlined against a confirmed deadline with evidence gathered', tags: ['project', 'report', 'evidence'], slotLabel: 'Fri 7 Aug 1.5h',
  }),
  datedCard({
    id: 'project-report-draft', number: 206, title: 'CMT501 reflective report — full first draft (~1,500 words)', moduleGroup: 'Group Project', phase: 'Phase 1', startDate: '2026-08-09', dueDate: '2026-08-10', hours: 2, priority: 'High',
    description: 'Get all ~1,500 words down from the outline. Draft first, polish later — a complete rough draft beats a perfect introduction.', checklist: ['Write the full draft to the 400/700/400 structure', 'Ground each claim in a specific piece of contribution evidence', 'Cover your role, the teamwork/process, what went well, and what you would change', 'Leave it to rest before the final polish'],
    evidence: 'complete ~1,500-word first draft', done: 'a full-length draft exists covering every required section', tags: ['project', 'report'], slotLabel: 'Sat 9 Aug 1.5h + Sun 10 Aug 0.5h',
  }),
  datedCard({
    id: 'project-report-submit', number: 207, title: 'CMT501 reflective report — finalise + SUBMIT (40%)', moduleGroup: 'Group Project', phase: 'Phase 2', startDate: '2026-08-11', dueDate: '2026-08-12', hours: 1.5, priority: 'Critical',
    description: 'Polish against the marking criteria and word limit, then submit the individual report and preserve the confirmation. Shift this date if the confirmed deadline differs.', checklist: ['Edit for clarity and cut to the word limit', 'Check the draft against the marking criteria / rubric', 'Proofread; verify formatting and any required coversheet', 'Submit and save the confirmation'],
    evidence: 'submitted report + submission confirmation', done: 'the 40% report is submitted and confirmed', tags: ['project', 'report', 'submission', 'deadline'], slotLabel: 'Mon 11 Aug 1h + Wed 12 Aug 0.5h',
  }),
]

// Corrected 2026-08-06: all nonessential work — including Job Hunt — pauses
// until all three exams are done, not just until the TS/MAT700 crunch ends.
// The two remaining maintenance weeks ("Set up Higherin", "Set up Bright
// Network") are REMOVED from the live plan entirely rather than dated —
// CAMPAIGN_END (= AML_READINESS_DEADLINE, 25 Aug) is the campaign's own
// hard boundary, and the honest "after exams" timing (after the 26 Aug
// CMT307 exam) falls outside it. Forcing a pre-26-Aug date would break the
// pause; extending CAMPAIGN_END would misrepresent what the campaign covers.
// They belong in a future "After Exams" reset once this campaign ends, not
// wedged into this one.
const JOB_MAINTENANCE_WEEKS = [
  ['2026-07-20', '2026-07-26', 'Improve one clean master CV', 'Remove repetition, strengthen outcomes and measurements, and lock one clean UK master CV.'],
  ['2026-07-27', '2026-08-02', 'Create two lightweight CV tracks', 'Create Software/Backend/Platform and Data/Analytics/ML variants while keeping roughly 80–85% shared.'],
]

const jobCards = JOB_MAINTENANCE_WEEKS.map(([startDate, dueDate, task, detail], index) => datedCard({
  id: `job-maintenance-week-${index + 1}`,
  number: 401 + index,
  title: `Job maintenance week ${index + 1} — ${task}`,
  moduleGroup: 'Job Hunt',
  phase: startDate < '2026-08-01' ? 'Phase 0' : startDate < '2026-08-10' ? 'Phase 1' : 'Phase 2',
  startDate,
  dueDate,
  hours: 2,
  priority: 'Medium',
  description: `Two-hour weekly ceiling, including a 25-minute urgent-role reserve. ${detail}`,
  checklist: [
    'Complete two usable 15-minute Student Futures scans without starting applications (30m total)',
    'Review accumulated agent, Student Futures, LinkedIn, and Indeed results once (20m)',
    `Complete the one weekly development task: ${task} (45m)`,
    'Use the 25m reserve only for a strong role closing within seven days; otherwise return it to study',
  ],
  evidence: 'one maintenance note + weekly development output + reserve used/released decision',
  done: 'the weekly system stopped at two hours and produced the single intended development output',
  tags: ['job-hunt', 'maintenance-mode', 'two-hour-cap'],
  slotLabel: 'Two 15m scans + one 20m review + one 45m build; 25m reserve stays unallocated',
}))

const jobSundayDates = JOB_MAINTENANCE_WEEKS
  .map(([, dueDate]) => dueDate)
  .filter((date) => new Date(`${date}T12:00:00`).getDay() === 0)

const interviewCards = [
  datedCard({
    id: 'interview-sati-role', number: 601, title: 'Sati interview - role, application, and company facts', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-25', dueDate: '2026-07-25', hours: 0.75, priority: 'Critical',
    description: 'Anchor every answer in the actual advert, application, and confirmed public facts. Separate what is confirmed from what you hope to learn; do not invent internal systems.',
    checklist: ['Confirm attendance has been sent', 'Read the advert and highlight duties, tools, learning outcomes, and requirements', 'Review the submitted CV and cover letter claim by claim', 'Write three confirmed Sati facts and three intelligent questions'],
    evidence: 'annotated advert/application + three fact-based questions', done: 'you can explain the role and your fit without guessing about Sati internals', tags: ['interview', 'sati', 'critical', 'application'], slotLabel: 'Sat 25 Jul 14:00-14:45',
  }),
  datedCard({
    id: 'interview-sati-technical', number: 602, title: 'Sati interview - technical fluency: Linux, networks, VMs, Docker', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-25', dueDate: '2026-07-25', hours: 1.25, priority: 'Critical',
    description: 'Build spoken troubleshooting fluency, not command-list memorisation. Explain what evidence each command gives and how servers, networks, virtualisation, containers, power, cooling, monitoring, and change control fit together.',
    checklist: ['Explain the twelve-step unavailable-service diagnosis aloud', 'Explain IP, DNS, gateway, ports, TCP/UDP, ping vs curl, and the core ports', 'Explain VM vs container, Type 1 vs Type 2 hypervisors, and snapshot vs backup', 'Explain the failed-container sequence and data-centre reliability layers'],
    evidence: 'one-page technical answer map + four spoken explanations', done: 'you can reason through an unfamiliar outage in plain English instead of reciting commands', tags: ['interview', 'linux', 'networking', 'docker', 'virtualisation'], slotLabel: 'Sat 25 Jul 15:00-16:15',
  }),
  datedCard({
    id: 'interview-sati-practical', number: 603, title: 'Sati interview - run one service-failure practical', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-25', dueDate: '2026-07-25', hours: 0.75, priority: 'High',
    description: 'Create, observe, stop, diagnose, restart, and verify a small service. The output is a troubleshooting narrative tied to real terminal evidence.',
    checklist: ['Start a local Python HTTP service or the optional nginx container', 'Confirm the process, listening port, and HTTP response', 'Stop it and capture the failed symptom', 'Diagnose, restart, verify, and write the evidence chain'],
    evidence: 'terminal transcript or screenshots + a 90-second spoken diagnosis', done: 'the service failure can be explained from symptom to verified recovery', tags: ['interview', 'practical', 'linux', 'docker'], slotLabel: 'Sat 25 Jul 16:30-17:15',
  }),
  datedCard({
    id: 'interview-sati-speaking', number: 604, title: 'Sati interview - introduction, motivation, and real STAR story', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-25', dueDate: '2026-07-25', hours: 1, priority: 'Critical',
    description: 'Prepare concise answers that sound like you. Use only a genuine troubleshooting incident and keep the result honest; placeholders are not interview-ready evidence.',
    checklist: ['Rehearse a 45-60 second introduction', 'Rehearse why Sati, why an internship now, and what you want to learn', 'Build one two-minute STAR-L troubleshooting story from a real incident', 'Prepare the availability answer and three questions to ask'],
    evidence: 'timed answer sheet + one genuine STAR-L story', done: 'core answers fit their time limits without being read word for word', tags: ['interview', 'speaking', 'star', 'availability'], slotLabel: 'Sat 25 Jul 19:00-20:00',
  }),
  datedCard({
    id: 'interview-sati-group', number: 605, title: 'Sati interview - group exercise rehearsal', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-26', dueDate: '2026-07-26', hours: 1.25, priority: 'Critical',
    description: 'Practise contributing early, building on others, separating immediate recovery from root cause, and summarising without dominating.',
    checklist: ['Rehearse the core answers aloud once', 'Run one 20-minute group incident scenario', 'Practise an early contribution, a build-on phrase, and a closing summary', 'Record one pace or clarity issue and repeat only that answer'],
    evidence: 'one timed rehearsal + one group-scenario reflection', done: 'you can enter, contribute, organise, and summarise a group discussion calmly', tags: ['interview', 'group-interview', 'rehearsal'], slotLabel: 'Sun 26 Jul 13:00-14:15',
  }),
  datedCard({
    id: 'interview-sati-logistics', number: 606, title: 'Sati interview - CV check, route, outfit, packing, and one-page sheet', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-26', dueDate: '2026-07-26', hours: 1.75, priority: 'Critical',
    description: 'Remove avoidable Monday stress. Lock the application claims, flexible ticket/Railcard, route, contact details, smart-casual outfit, packed bag, and a single page for Monday review.',
    checklist: ['Review the submitted CV and cover letter against likely questions', 'Confirm ticket conditions and the 26-30 Railcard in the app', 'Save route, address, interview email, and disruption contact details offline', 'Prepare outfit and pack ID, two CVs, notebook, pens, water, snack, charger, power bank, and umbrella if needed', 'Write the final one-page review sheet and stop technical preparation'],
    evidence: 'packed bag + laid-out outfit + offline route/ticket + one-page sheet', done: 'Monday requires only light review, dressing, live checks, and travel', tags: ['interview', 'travel', 'packing', 'critical'], slotLabel: 'Sun 26 Jul 14:30-16:15',
  }),
  datedCard({
    id: 'interview-sati-attend', number: 607, title: 'Sati interview day - travel, attend, debrief, and thank-you', moduleGroup: 'Interview Prep', phase: 'Phase 0', startDate: '2026-07-27', dueDate: '2026-07-27', hours: 5.5, priority: 'Critical',
    description: 'No new technical study. Review one page, check live rail and weather, travel with buffers, attend the 12:30 group interview, recover, record the facts, and send a concise thank-you.',
    checklist: ['Eat, shower, dress, and review one page only', 'Check live train status and weather before leaving Howard Gardens', 'Take the 11:13 direct train if operating; use the earlier/next permitted service if disruption changes the risk', 'Locate 8A Dunraven Place, wait nearby, and check in at 12:10-12:15', 'Attend the 12:30 group interview', 'Record questions, answers, names, hours/start-date information, and next steps', 'Send a concise thank-you later that day'],
    evidence: 'attendance + factual debrief + thank-you sent', done: 'the interview is attended on time and all useful follow-up information is preserved', tags: ['interview', 'travel', 'fixed', 'sati'], slotLabel: 'Mon 27 Jul 08:30-18:15 including travel and recovery',
  }),
]

const adminCards = [
  datedCard({
    id: 'admin-summer-assessment-confirmation', number: 501, title: 'ADMIN — confirm summer assessment entry and information channels', moduleGroup: 'Admin', phase: 'Phase 0', startDate: '2026-07-16', dueDate: '2026-07-16', hours: 0.5, priority: 'Critical',
    description: 'The current notice confirms the summer assessment window but does not state whether any registration action is required. Send one concise confirmation to the COMSC School Office.',
    checklist: ['Ask whether any MAT700 summer-assessment registration action is required', 'Ask where the CMT307, MA4508, and MAT700 date/time/location will be published', 'Ask how the MAT700 summer assessment mark will be recorded', 'Record the answer in the app; do not start a broad complaint thread'],
    evidence: 'sent confirmation message + reply/action logged', done: 'entry/action requirements and publication channels are confirmed or formally chased', tags: ['admin', 'exam', 'date-watch'], slotLabel: 'Thu 16 Jul 20:15–20:45',
  }),
  datedCard({
    id: 'admin-exam-logistics', number: 506, title: 'ADMIN — final exam logistics and materials lock', moduleGroup: 'Admin', phase: 'Phase 2', startDate: '2026-08-15', dueDate: '2026-08-15', hours: 1, priority: 'Critical',
    description: 'Lock confirmed dates, routes, permitted materials, IDs, calculator rules, and the order of post-exam recovery.',
    checklist: ['Confirm every date/time/location', 'Confirm AML open-book/no-internet requirements', 'Pack ID, stationery, calculator, water, and permitted AML materials', 'Plan travel arrival buffer', 'Write the next-exam-only warm-up order'],
    evidence: 'exam logistics sheet + packed materials checklist', done: 'no unresolved logistics remain before the exam window', tags: ['admin', 'exam', 'fixed', 'logistics'], slotLabel: 'Sat 15 Aug 20:00–21:00',
  }),
  datedCard({
    id: 'admin-verify-aml-handoff', number: 507, title: 'ADMIN — final check: exam-day logistics for both written exams', moduleGroup: 'Admin', phase: 'Phase 2', startDate: '2026-08-17', dueDate: '2026-08-17', hours: 0.25, priority: 'Critical',
    description: 'Both exam dates are now confirmed (MAT700 Tue 18 Aug 13:30, Muller Hall; Time Series Wed 19 Aug 09:00, Main Hall — both All Nations Centre). One last check the evening before, not a date-uncertainty check any more.',
    checklist: ['Re-confirm both times/locations against the official TimeEdit timetable (rooms occasionally move)', 'Confirm calculator, ID, and any permitted materials are packed for both days', 'Confirm the route/travel time to All Nations Centre', 'Check nothing else changed since the confirmation screenshot'],
    evidence: 'one recorded verification decision', done: 'both exam days have no unresolved logistics', tags: ['admin', 'exam', 'date-watch', 'critical-path'], slotLabel: 'Mon 17 Aug, short check-in',
  }),
]

export const rescueCards = [...examCards, ...projectCards, ...interviewCards, ...jobCards, ...adminCards, ...AML_MARATHON_CARDS]
  .filter((card) => !card.startDate || card.startDate >= CAMPAIGN_START)
  .sort((a, b) => {
    const dateA = a.dueDate || a.startDate || '9999-12-31'
    const dateB = b.dueDate || b.startDate || '9999-12-31'
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    return Number(a.sortOrder) - Number(b.sortOrder)
  })
  .map((card, index) => ({
    ...card,
    number: index + 1,
    sortOrder: index + 1,
  }))

export const campaignMeta = {
  title: 'Summer Rescue Campaign 2026',
  runway: `${CAMPAIGN_START} to ${CAMPAIGN_END}`,
  readinessDeadline: READINESS_DEADLINE,
  amlReadinessDeadline: AML_READINESS_DEADLINE,
  examWindowStart: EXAM_WINDOW_START,
  examWindowEnd: EXAM_WINDOW_END,
  mat700ExamDate: `${MAT700_EXAM_DATE} ${MAT700_EXAM_START}`,
  timeSeriesExamDate: `${TIME_SERIES_EXAM_DATE} ${TIME_SERIES_EXAM_START}`,
  generatedFrom: '8 August dual-module ten-day sprint: original-source Time Series and MAT700 coverage on 8–12 August, original questions/papers and repair on 13–17 August, then confirmed MAT700 (18 Aug), Time Series (19 Aug), and Applied ML (26 Aug) exams. Historical completed work remains preserved.',
  cardCount: rescueCards.length,
  projectInternalDeadline: '2026-08-02',
  projectSubmissionDeadline: '2026-08-06',
}

function rule({
  id,
  title,
  category,
  from = HISTORY_SCHEDULE_START,
  to = CAMPAIGN_END,
  weekdays = [1, 2, 3, 4, 5, 6, 7],
  start,
  end,
  location = 'Home',
  moduleGroup = '',
  countsToward = [],
  protected: isProtected = false,
  notes = '',
  cardId = '',
  cardIds = [],
}) {
  return {
    id,
    title,
    category,
    from,
    to,
    weekdays,
    start,
    end,
    location,
    moduleGroup,
    countsToward,
    protected: isProtected,
    checkable: false,
    notes,
    ...(cardId ? { cardId } : {}),
    ...(cardIds.length > 0 ? { cardIds } : {}),
  }
}

function oneOff(id, date, start, end, title, category, options = {}) {
  const weekday = ((new Date(`${date}T12:00:00`).getDay() + 6) % 7) + 1
  return rule({ id, title, category, from: date, to: date, weekdays: [weekday], start, end, ...options })
}

const academic = (moduleGroup) => ({ moduleGroup, countsToward: ['academic'], protected: true })
const project = { moduleGroup: 'Group Project', countsToward: ['academic', 'project'], protected: true }

const coreRoutineRules = [
  // A very small daily control loop. Actual time, percentage and notes are
  // logged in Today/Review, so a two-minute check-in still counts honestly.
  rule({ id: 'daily-admin-mon-thu', title: 'Daily admin check-in - log what you did', category: 'admin', weekdays: [1, 4], start: '21:45', end: '22:00', moduleGroup: 'Admin', protected: true }),
  rule({ id: 'daily-admin-tue-fri-sun', title: 'Daily admin check-in - log what you did', category: 'admin', weekdays: [2, 5, 7], start: '20:15', end: '20:25', moduleGroup: 'Admin', protected: true }),
  rule({ id: 'daily-admin-wed', title: 'Daily admin check-in - log what you did', category: 'admin', weekdays: [3], start: '20:30', end: '20:40', moduleGroup: 'Admin', protected: true }),
  rule({ id: 'daily-admin-sat', title: 'Daily admin check-in - log what you did', category: 'admin', weekdays: [6], start: '20:45', end: '20:55', moduleGroup: 'Admin', protected: true }),
  rule({ id: 'sleep', title: 'Sleep', category: 'sleep', start: '23:00', end: '07:00', countsToward: ['sleep'], protected: true }),
  rule({ id: 'morning-reset', title: 'Wash, dress, and room reset', category: 'routine', start: '07:00', end: '07:45', protected: true }),
  // AM serum rotation: Vitamin C Mon/Wed/Fri, Q10 serum Tue/Sat, none Thu/Sun — see night table below for the matching PM treatment.
  rule({ id: 'skincare-am-vitc', title: 'Skincare AM — cleanse, Vitamin C serum, SPF50', category: 'routine', weekdays: [1, 3, 5], start: '07:45', end: '08:00', protected: true }),
  rule({ id: 'skincare-am-q10', title: 'Skincare AM — cleanse, Q10 serum, SPF50', category: 'routine', weekdays: [2, 6], start: '07:45', end: '08:00', protected: true }),
  rule({ id: 'skincare-am-rest', title: 'Skincare AM — cleanse, moisturise, SPF50 (no serum today)', category: 'routine', weekdays: [4, 7], start: '07:45', end: '08:00', protected: true }),
  rule({ id: 'breakfast', title: 'Make and eat breakfast', category: 'meal', start: '08:00', end: '08:30', protected: true }),
  rule({ id: 'wind-down', title: 'Prepare tomorrow and wind down — no social media', category: 'recovery', start: '22:00', end: '22:45', protected: true }),
  // PM treatment rotation: Differin Mon/Thu/Sun, Activit Tue/Fri, Q10 recovery Wed, barrier recovery Sat.
  rule({ id: 'skincare-pm-differin', title: 'Skincare PM — cleanse, Differin (pea-sized), Q10 night cream', category: 'routine', weekdays: [1, 4, 7], start: '22:45', end: '23:00', protected: true }),
  rule({ id: 'skincare-pm-activit', title: 'Skincare PM — cleanse, Activit (azelaic/salicylic), Q10 night cream', category: 'routine', weekdays: [2, 5], start: '22:45', end: '23:00', protected: true }),
  rule({ id: 'skincare-pm-recovery', title: 'Skincare PM — recovery night: Q10 serum + Q10 night cream', category: 'routine', weekdays: [3], start: '22:45', end: '23:00', protected: true }),
  rule({ id: 'skincare-pm-barrier', title: 'Skincare PM — barrier night: Cicaplast Gel B5 + night cream if needed', category: 'routine', weekdays: [6], start: '22:45', end: '23:00', protected: true }),
  rule({ id: 'shower-tue', title: 'Shower, dry hair, and get ready', category: 'routine', weekdays: [2], start: '21:00', end: '22:00', protected: true }),
  rule({ id: 'shower-fri', title: 'Shower, dry hair, and get ready', category: 'routine', weekdays: [5], start: '20:30', end: '21:30', protected: true }),
  rule({ id: 'shower-sun', title: 'Shower, dry hair, and get ready', category: 'routine', weekdays: [7], start: '21:00', end: '22:00', protected: true }),
  rule({ id: 'mom-call', title: 'Short call with Mum', category: 'recovery', weekdays: [2], start: '20:30', end: '20:45' }),
  rule({ id: 'sister-call', title: 'Short family catch-up', category: 'recovery', weekdays: [5], start: '21:30', end: '22:00' }),
  rule({ id: 'friend-call', title: 'Weekly friend catch-up', category: 'recovery', weekdays: [7], start: '20:30', end: '21:00' }),
  rule({ id: 'laundry', title: 'Laundry load / collect', category: 'chores', weekdays: [3], start: '20:15', end: '20:30' }),
  // Paused from 3 August: all nonessential work pauses until the three exams are done, even a
  // 10-minute scan. Job Hunt resumes via JOB_MAINTENANCE_WEEKS below, dated
  // after the CMT307 exam (26 Aug).
  rule({ id: 'job-scan-mon', title: 'Student Futures — focused save/ignore scan', category: 'job', to: '2026-08-02', weekdays: [1], start: '20:45', end: '21:00', moduleGroup: 'Job Hunt', countsToward: ['job'] }),
  rule({ id: 'job-scan-thu', title: 'Student Futures — focused save/ignore scan', category: 'job', to: '2026-08-02', weekdays: [4], start: '20:45', end: '21:00', moduleGroup: 'Job Hunt', countsToward: ['job'] }),
]

const weekdayStudyRules = [
  // Monday — library + protected project block through 3 August.
  rule({ id: 'mon-commute-out', title: 'Travel to library', category: 'commute', to: READINESS_DEADLINE, weekdays: [1], start: '08:30', end: '09:00', location: 'Transit' }),
  rule({ id: 'mon-aml-1-launch', title: 'Applied ML — Lab 1 end-to-end + workflow page', category: 'study', from: '2026-07-20', to: '2026-07-20', weekdays: [1], start: '09:00', end: '11:00', location: 'Library', cardId: 'card-001', ...academic('Applied ML') }),
  rule({ id: 'mon-aml-1', title: 'Applied ML queue — lab/video/output', category: 'study', from: '2026-07-21', to: READINESS_DEADLINE, weekdays: [1], start: '09:00', end: '11:00', location: 'Library', ...academic('Applied ML') }),
  rule({ id: 'mon-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [1], start: '11:00', end: '11:15', location: 'Library' }),
  rule({ id: 'mon-mat-launch', title: 'MAT700 — foundation reset and pass specification', category: 'study', from: '2026-07-20', to: '2026-07-20', weekdays: [1], start: '11:15', end: '13:15', location: 'Library', cardId: 'mat700-foundation-reset', ...academic('MAT700') }),
  rule({ id: 'mon-aml-2', title: 'Applied ML queue — continue current card', category: 'study', from: '2026-07-21', to: READINESS_DEADLINE, weekdays: [1], start: '11:15', end: '13:15', location: 'Library', ...academic('Applied ML') }),
  rule({ id: 'mon-lunch', title: 'Make/eat packed lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [1], start: '13:15', end: '13:45', location: 'Library', protected: true }),
  rule({ id: 'mon-ts', title: 'Time Series queue — worked problems', category: 'study', to: READINESS_DEADLINE, weekdays: [1], start: '13:45', end: '15:45', location: 'Library', ...academic('Time Series') }),
  rule({ id: 'mon-break-2', title: 'Walk / reset', category: 'recovery', to: READINESS_DEADLINE, weekdays: [1], start: '15:45', end: '16:15', location: 'Outside' }),
  rule({ id: 'mon-project', title: 'CMT501 protected block — current bottleneck only', category: 'project', to: '2026-08-03', weekdays: [1], start: '16:15', end: '18:15', location: 'Library', ...project }),
  rule({ id: 'mon-final-aml', title: 'Applied ML final-drill queue', category: 'study', from: '2026-08-10', to: READINESS_DEADLINE, weekdays: [1], start: '16:15', end: '18:15', location: 'Library', ...academic('Applied ML') }),
  rule({ id: 'mon-commute-home', title: 'Travel home', category: 'commute', to: READINESS_DEADLINE, weekdays: [1], start: '18:15', end: '18:45', location: 'Transit' }),
  rule({ id: 'mon-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [1], start: '18:45', end: '19:15', protected: true }),

  // Tuesday — home study, walk, short family call, and shower.
  rule({ id: 'tue-ts-1', title: 'Time Series queue — concepts and examples', category: 'study', to: READINESS_DEADLINE, weekdays: [2], start: '08:30', end: '10:30', ...academic('Time Series') }),
  rule({ id: 'tue-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [2], start: '10:30', end: '10:45' }),
  rule({ id: 'tue-aml-1', title: 'Applied ML queue — continue current card', category: 'study', to: READINESS_DEADLINE, weekdays: [2], start: '10:45', end: '12:45', ...academic('Applied ML') }),
  rule({ id: 'tue-lunch', title: 'Make and eat lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [2], start: '12:45', end: '13:15', protected: true }),
  rule({ id: 'tue-mat-first', title: 'MAT700 study queue — tutorial-first', category: 'study', to: '2026-07-21', weekdays: [2], start: '13:15', end: '15:15', ...academic('MAT700') }),
  rule({ id: 'tue-aml-rebalance', title: 'Applied ML queue — lab/output catch-up', category: 'study', from: '2026-07-28', to: '2026-07-28', weekdays: [2], start: '13:15', end: '15:15', ...academic('Applied ML') }),
  rule({ id: 'tue-mat', title: 'MAT700 study queue — tutorial-first', category: 'study', from: '2026-08-04', to: READINESS_DEADLINE, weekdays: [2], start: '13:15', end: '15:15', ...academic('MAT700') }),
  rule({ id: 'tue-walk', title: 'Outside walk', category: 'recovery', to: READINESS_DEADLINE, weekdays: [2], start: '15:15', end: '15:45', location: 'Outside', protected: true }),
  rule({ id: 'tue-aml', title: 'Applied ML queue — active recall/output', category: 'study', to: READINESS_DEADLINE, weekdays: [2], start: '15:45', end: '17:45', ...academic('Applied ML') }),
  rule({ id: 'tue-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [2], start: '18:30', end: '19:00', protected: true }),

  // Wednesday — library; late block is date-specific below.
  rule({ id: 'wed-commute-out', title: 'Travel to library', category: 'commute', to: READINESS_DEADLINE, weekdays: [3], start: '08:30', end: '09:00', location: 'Transit' }),
  rule({ id: 'wed-aml', title: 'Applied ML queue', category: 'study', to: READINESS_DEADLINE, weekdays: [3], start: '09:00', end: '11:00', location: 'Library', ...academic('Applied ML') }),
  rule({ id: 'wed-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [3], start: '11:00', end: '11:15', location: 'Library' }),
  rule({ id: 'wed-ts', title: 'Time Series queue', category: 'study', to: READINESS_DEADLINE, weekdays: [3], start: '11:15', end: '13:15', location: 'Library', ...academic('Time Series') }),
  rule({ id: 'wed-lunch', title: 'Make/eat packed lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [3], start: '13:15', end: '13:45', location: 'Library', protected: true }),
  rule({ id: 'wed-mat', title: 'MAT700 study queue', category: 'study', to: READINESS_DEADLINE, weekdays: [3], start: '13:45', end: '15:45', location: 'Library', ...academic('MAT700') }),
  rule({ id: 'wed-break-2', title: 'Walk / reset', category: 'recovery', to: READINESS_DEADLINE, weekdays: [3], start: '15:45', end: '16:15', location: 'Outside' }),
  rule({ id: 'wed-commute-home', title: 'Travel home', category: 'commute', to: READINESS_DEADLINE, weekdays: [3], start: '18:15', end: '18:45', location: 'Transit' }),
  rule({ id: 'wed-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [3], start: '18:45', end: '19:15', protected: true }),

  // Friday — home study, walk, shower.
  rule({ id: 'fri-ts-1', title: 'Time Series queue', category: 'study', to: '2026-07-31', weekdays: [5], start: '08:30', end: '10:30', ...academic('Time Series') }),
  rule({ id: 'fri-aml-final', title: 'Applied ML final-drill queue', category: 'study', from: '2026-08-01', to: READINESS_DEADLINE, weekdays: [5], start: '08:30', end: '10:30', ...academic('Applied ML') }),
  rule({ id: 'fri-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [5], start: '10:30', end: '10:45' }),
  rule({ id: 'fri-aml', title: 'Applied ML queue', category: 'study', to: READINESS_DEADLINE, weekdays: [5], start: '10:45', end: '12:45', ...academic('Applied ML') }),
  rule({ id: 'fri-lunch', title: 'Make and eat lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [5], start: '12:45', end: '13:15', protected: true }),
  rule({ id: 'fri-mat', title: 'MAT700 study queue', category: 'study', to: READINESS_DEADLINE, weekdays: [5], start: '13:15', end: '15:15', ...academic('MAT700') }),
  rule({ id: 'fri-walk', title: 'Outside walk', category: 'recovery', to: READINESS_DEADLINE, weekdays: [5], start: '15:15', end: '15:45', location: 'Outside', protected: true }),
  rule({ id: 'fri-ts-2', title: 'Time Series queue — timed output', category: 'study', to: READINESS_DEADLINE, weekdays: [5], start: '15:45', end: '17:45', ...academic('Time Series') }),
  rule({ id: 'fri-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [5], start: '18:30', end: '19:00', protected: true }),

  // Saturday — library + grocery; late academic block is date-specific.
  rule({ id: 'sat-commute-out', title: 'Travel to library', category: 'commute', to: READINESS_DEADLINE, weekdays: [6], start: '08:30', end: '09:00', location: 'Transit' }),
  rule({ id: 'sat-aml', title: 'Applied ML queue', category: 'study', to: READINESS_DEADLINE, weekdays: [6], start: '09:00', end: '11:00', location: 'Library', ...academic('Applied ML') }),
  rule({ id: 'sat-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [6], start: '11:00', end: '11:15', location: 'Library' }),
  rule({ id: 'sat-ts', title: 'Time Series queue', category: 'study', to: READINESS_DEADLINE, weekdays: [6], start: '11:15', end: '13:15', location: 'Library', ...academic('Time Series') }),
  rule({ id: 'sat-lunch', title: 'Make/eat packed lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [6], start: '13:15', end: '13:45', location: 'Library', protected: true }),
  rule({ id: 'sat-mat', title: 'MAT700 study queue', category: 'study', to: READINESS_DEADLINE, weekdays: [6], start: '13:45', end: '15:45', location: 'Library', ...academic('MAT700') }),
  rule({ id: 'sat-break-2', title: 'Walk / reset', category: 'recovery', to: READINESS_DEADLINE, weekdays: [6], start: '15:45', end: '16:15', location: 'Outside' }),
  rule({ id: 'sat-commute-home', title: 'Travel home', category: 'commute', to: READINESS_DEADLINE, weekdays: [6], start: '18:15', end: '18:45', location: 'Transit' }),
  rule({ id: 'sat-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [6], start: '18:45', end: '19:15', protected: true }),
  rule({ id: 'sat-grocery', title: 'Weekly grocery shop', category: 'chores', to: READINESS_DEADLINE, weekdays: [6], start: '19:15', end: '20:45', location: 'Shops', protected: true }),

  // Sunday — home study, outside walk, optional high-quality job action.
  rule({ id: 'sun-ts', title: 'Time Series queue', category: 'study', to: READINESS_DEADLINE, weekdays: [7], start: '08:30', end: '10:30', ...academic('Time Series') }),
  rule({ id: 'sun-break-1', title: 'Break', category: 'recovery', to: READINESS_DEADLINE, weekdays: [7], start: '10:30', end: '10:45' }),
  rule({ id: 'sun-mat', title: 'MAT700 study queue', category: 'study', to: READINESS_DEADLINE, weekdays: [7], start: '10:45', end: '12:45', ...academic('MAT700') }),
  rule({ id: 'sun-lunch', title: 'Make and eat lunch', category: 'meal', to: READINESS_DEADLINE, weekdays: [7], start: '12:45', end: '13:15', protected: true }),
  rule({ id: 'sun-aml', title: 'Applied ML queue', category: 'study', to: READINESS_DEADLINE, weekdays: [7], start: '13:15', end: '15:15', ...academic('Applied ML') }),
  rule({ id: 'sun-walk', title: 'Outside walk', category: 'recovery', to: READINESS_DEADLINE, weekdays: [7], start: '15:15', end: '15:45', location: 'Outside', protected: true }),
  rule({ id: 'sun-dinner', title: 'Make and eat dinner', category: 'meal', to: READINESS_DEADLINE, weekdays: [7], start: '18:00', end: '18:30', protected: true }),
  // 2026-08-02 is the last day this historical AM/PM-mixed structure covers;
  // 'study' blocks stop here because 3–7 Aug uses the historical crunch rules
  // and 8–17 Aug uses the new dual-module rules. Meals/breaks/commute/project
  // for those weekday patterns are UNCHANGED and keep running to
  // READINESS_DEADLINE — only the study content underneath them moves.
].map((entry) => (
  entry.category === 'study' && entry.to >= CAMPAIGN_START ? { ...entry, to: '2026-08-02' } : entry
))

// Historical 3–7 August single-subject day-blocks, retained so past calendar
// and review evidence still match the plan that was active on those dates.
// Time Series is "main" on odd calendar dates, MAT700 on even dates (7 days
// each) — a deliberately simple rule to remember. Each day's main subject
// gets the long, deadline-pressure block; the other subject gets one short
// "keep-alive" touch so neither goes a week without being looked at (the
// user's own diagnosis: total silence on a subject creates dread, not
// relief). Applied ML is paused during the TS/MAT700 run — it has its own 20–25 Aug
// window below and doesn't need daily pressure yet.
//
// Built from the *actual* free gaps left once the old AM/PM study blocks
// above are capped, respecting every existing meal/break/commute/project/
// class time for that weekday. 5 dates (3, 5, 6, 8, 12 Aug) have a real fixed
// commitment (CMT501 project or class) eating into the afternoon, so their
// blocks are shorter that day — the schedule flexes around real deadlines
// rather than pretending they don't exist.
function crunchMainSubject(date) {
  return Number(date.slice(-2)) % 2 === 1 ? 'Time Series' : 'MAT700'
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

// One-main-module rule, corrected 2026-08-06: the non-main subject only gets
// a short closed-book retrieval touch, never a two-hour new-content block —
// so the keep-alive window is capped at 40 minutes from its start regardless
// of the (longer) end time still passed by older call sites. This also keeps
// every remaining crunch day at ~6-6.7h of study, under the 7h planned max.
function crunchStudyBlock(date, start, end, subject) {
  const isMain = subject === crunchMainSubject(date)
  const cappedEnd = isMain ? end : addMinutes(start, 40)
  return oneOff(
    `crunch-${date}-${subject === 'Time Series' ? 'ts' : 'mat'}-${start}`,
    date,
    start,
    cappedEnd,
    `${subject} — ${isMain ? "today's main deadline" : 'keep-alive retrieval (40 min)'}`,
    'study',
    academic(subject),
  )
}

const CRUNCH_DAY_RULES = [
  // Mon 3 Aug (TS main): CMT501 protected block runs 16:15-18:15, then
  // commute-home + dinner already fill the rest of the evening.
  crunchStudyBlock('2026-08-03', '09:00', '11:00', 'Time Series'),
  crunchStudyBlock('2026-08-03', '11:15', '13:15', 'Time Series'),
  crunchStudyBlock('2026-08-03', '13:45', '15:45', 'Time Series'),
  // Pack A mock exam: sat in the genuinely free 19:15-20:00 gap after
  // dinner, right after the Pack A card (card-002) that finishes that day.
  // Compressed to 45 of the paper's 60 suggested minutes — see the
  // TS_MOCK_EXAM_DAYS note below for why these six are shorter than the
  // papers' own suggested time.
  oneOff('crunch-2026-08-03-ts-mock-a', '2026-08-03', '19:15', '20:00', 'Pack A mock exam (compressed, 45 min) — reveal the marking guide and self-mark after', 'study', academic('Time Series')),

  // Tue 4 Aug (MAT700 main): normal Tuesday shape.
  crunchStudyBlock('2026-08-04', '08:30', '10:30', 'MAT700'),
  crunchStudyBlock('2026-08-04', '10:45', '12:45', 'MAT700'),
  crunchStudyBlock('2026-08-04', '13:15', '15:15', 'MAT700'),
  crunchStudyBlock('2026-08-04', '15:45', '18:00', 'Time Series'),
  // Pack B mock exam: the free 19:00-20:15 gap after dinner, right after
  // Pack B finishes (card-012).
  oneOff('crunch-2026-08-04-ts-mock-b', '2026-08-04', '19:00', '20:15', 'Pack B mock exam (compressed, 75 min) — reveal the marking guide and self-mark after', 'study', academic('Time Series')),

  // Wed 5 Aug (TS main): CMT501 protected block runs 16:15-18:15, then
  // commute-home + dinner already fill the rest of the evening.
  crunchStudyBlock('2026-08-05', '09:00', '11:00', 'Time Series'),
  crunchStudyBlock('2026-08-05', '11:15', '13:15', 'Time Series'),
  crunchStudyBlock('2026-08-05', '13:45', '15:45', 'Time Series'),
  // Pack C mock exam: the free 20:40-22:00 gap, right after Pack C
  // finishes (card-021).
  oneOff('crunch-2026-08-05-ts-mock-c', '2026-08-05', '20:40', '22:00', 'Pack C mock exam (compressed, 80 min) — reveal the marking guide and self-mark after', 'study', academic('Time Series')),

  // Thu 6 Aug (MAT700 main): CMT501 class runs 10:00-14:00 today. Corrected
  // 2026-08-06: Pack D mock cancelled — Packs A-C aren't even done yet, so
  // it was premature. Deliberately generic titles below (not naming a
  // specific card) — an earlier version named "card-009" here specifically,
  // which broke the moment the real due-card queue shifted under it (see
  // the TS_PACK_DEF_TO_PHASE1 rebalance above); the day's actual queue is
  // what the Today/Study Hub view shows, and that's the source of truth.
  // The freed evening slot goes to Time Series, not MAT700, even though
  // MAT700 is nominally "main" today — Time Series is the tighter-fitting
  // module (see the capacity note below scheduleAssumptions), so extra
  // bonus time earned from the class disruption goes where it's needed
  // more. Plain oneOff (not crunchStudyBlock) so it isn't auto-capped as a
  // "keep-alive" touch.
  crunchStudyBlock('2026-08-06', '08:30', '09:30', 'MAT700'),
  crunchStudyBlock('2026-08-06', '14:30', '16:30', 'MAT700'),
  crunchStudyBlock('2026-08-06', '16:45', '17:45', 'Time Series'),
  oneOff('crunch-2026-08-06-ts-evening', '2026-08-06', '18:45', '20:25', 'Time Series — extra evening block', 'study', academic('Time Series')),

  // Fri 7 Aug (TS main): corrected 2026-08-06 for a mandatory class until
  // 12:00 — no morning study, no compensating evening extension, no MAT700
  // block at all. 13:30 is the earliest study start, leaving room for
  // leaving class, travel, lunch and decompression (protected walk moves to
  // 15:30-16:00 that day — see scheduleExceptions). Two solid Time Series
  // blocks either side of it, ~3h50 total — a valid floor day, not a debt
  // day. No MAT700, no CMT307, no job hunting tonight.
  crunchStudyBlock('2026-08-07', '13:30', '15:30', 'Time Series'),
  crunchStudyBlock('2026-08-07', '16:30', '18:00', 'Time Series'),

]

function intensivePlanBlock(date, start, end, moduleGroup) {
  const cardIds = INTENSIVE_PLAN_CARD_IDS_BY_DATE[date]
  const cardId = moduleGroup === 'Time Series' ? cardIds?.timeSeries : cardIds?.mat700
  const moduleSlug = moduleGroup === 'Time Series' ? 'ts' : 'mat700'
  return oneOff(
    `intensive-${date}-${moduleSlug}-${start}`,
    date,
    start,
    end,
    `${moduleGroup} — work toward today's completion gate`,
    'study',
    { ...academic(moduleGroup), cardId },
  )
}

// 8–17 August: both urgent modules move every day. The cards define completion
// deadlines, not hour quotas; these blocks reserve usable study lanes around the
// existing meals, recovery, travel, and the final CMT501 report reserve.
const INTENSIVE_PLAN_RULES = [
  intensivePlanBlock('2026-08-08', '09:00', '11:00', 'Time Series'),
  intensivePlanBlock('2026-08-08', '11:15', '13:15', 'Time Series'),
  intensivePlanBlock('2026-08-08', '13:45', '15:45', 'MAT700'),
  intensivePlanBlock('2026-08-08', '16:15', '18:15', 'MAT700'),

  intensivePlanBlock('2026-08-09', '08:30', '10:30', 'Time Series'),
  intensivePlanBlock('2026-08-09', '10:45', '12:45', 'Time Series'),
  intensivePlanBlock('2026-08-09', '13:15', '15:15', 'MAT700'),
  intensivePlanBlock('2026-08-09', '15:45', '18:00', 'MAT700'),

  intensivePlanBlock('2026-08-10', '09:00', '11:00', 'Time Series'),
  intensivePlanBlock('2026-08-10', '11:15', '13:15', 'Time Series'),
  intensivePlanBlock('2026-08-10', '13:45', '15:45', 'MAT700'),
  intensivePlanBlock('2026-08-10', '16:15', '18:15', 'MAT700'),

  intensivePlanBlock('2026-08-11', '08:30', '10:30', 'Time Series'),
  intensivePlanBlock('2026-08-11', '10:45', '12:45', 'Time Series'),
  intensivePlanBlock('2026-08-11', '13:15', '15:15', 'MAT700'),
  intensivePlanBlock('2026-08-11', '15:45', '18:00', 'MAT700'),

  intensivePlanBlock('2026-08-12', '09:00', '11:00', 'Time Series'),
  intensivePlanBlock('2026-08-12', '11:15', '13:15', 'Time Series'),
  intensivePlanBlock('2026-08-12', '13:45', '15:45', 'MAT700'),
  intensivePlanBlock('2026-08-12', '19:15', '20:15', 'MAT700'),

  rule({ id: 'intensive-thu13-commute-out', title: 'Travel to library', category: 'commute', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '08:30', end: '09:00', location: 'Transit' }),
  intensivePlanBlock('2026-08-13', '09:00', '11:00', 'Time Series'),
  rule({ id: 'intensive-thu13-break-1', title: 'Break', category: 'recovery', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '11:00', end: '11:15', location: 'Library' }),
  intensivePlanBlock('2026-08-13', '11:15', '13:15', 'Time Series'),
  rule({ id: 'intensive-thu13-lunch', title: 'Make/eat packed lunch', category: 'meal', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '13:15', end: '13:45', location: 'Library', protected: true }),
  intensivePlanBlock('2026-08-13', '13:45', '15:45', 'MAT700'),
  rule({ id: 'intensive-thu13-break-2', title: 'Walk / reset', category: 'recovery', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '15:45', end: '16:15', location: 'Outside' }),
  intensivePlanBlock('2026-08-13', '16:15', '18:15', 'MAT700'),
  rule({ id: 'intensive-thu13-commute-home', title: 'Travel home', category: 'commute', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '18:15', end: '18:45', location: 'Transit' }),
  rule({ id: 'intensive-thu13-dinner', title: 'Make and eat dinner', category: 'meal', from: '2026-08-13', to: '2026-08-13', weekdays: [4], start: '18:45', end: '19:15', protected: true }),

  intensivePlanBlock('2026-08-14', '08:30', '10:30', 'Time Series'),
  intensivePlanBlock('2026-08-14', '10:45', '12:45', 'Time Series'),
  intensivePlanBlock('2026-08-14', '13:15', '15:15', 'MAT700'),
  intensivePlanBlock('2026-08-14', '15:45', '18:00', 'MAT700'),

  intensivePlanBlock('2026-08-15', '09:00', '11:00', 'Time Series'),
  intensivePlanBlock('2026-08-15', '11:15', '13:15', 'Time Series'),
  intensivePlanBlock('2026-08-15', '13:45', '15:45', 'MAT700'),
  intensivePlanBlock('2026-08-15', '16:15', '18:15', 'MAT700'),

  intensivePlanBlock('2026-08-16', '08:30', '10:30', 'Time Series'),
  intensivePlanBlock('2026-08-16', '10:45', '12:45', 'Time Series'),
  intensivePlanBlock('2026-08-16', '13:15', '15:15', 'MAT700'),
  intensivePlanBlock('2026-08-16', '15:45', '18:00', 'MAT700'),

  intensivePlanBlock('2026-08-17', '09:00', '11:00', 'Time Series'),
  intensivePlanBlock('2026-08-17', '11:15', '13:15', 'Time Series'),
  intensivePlanBlock('2026-08-17', '13:45', '15:45', 'MAT700'),
  intensivePlanBlock('2026-08-17', '16:15', '18:15', 'MAT700'),
]

// 18-19 August: the exam pair itself, added 2026-08-06 once both dates were
// confirmed (MAT700 Tue 18 Aug 13:30-15:30, Muller Hall; Time Series Wed 19
// Aug 09:00-11:00, Main Hall — both All Nations Centre). Deliberately light
// either side of each exam — no new content, no cramming the evening before
// a written exam — per the plan's own sleep/recovery rules. Applied ML does
// not start until AML_TAIL_START (20 Aug): 18-19 Aug are exam days, not
// study days, even though there's technically free calendar room in them.
const EXAM_PAIR_RULES = [
  oneOff('exam18-mat700-final-recall', MAT700_EXAM_DATE, '09:00', '12:00', 'MAT700 — final closed-book recall only (formulas, procedures, error log) — no new content', 'study', academic('MAT700')),
  oneOff('exam18-buffer', MAT700_EXAM_DATE, '12:00', '13:00', 'Lunch + calm buffer before the exam', 'meal', { protected: true }),
  oneOff('exam18-mat700-exam', MAT700_EXAM_DATE, MAT700_EXAM_START, MAT700_EXAM_END, `MAT700 EXAM — ${MAT700_EXAM_LOCATION}`, 'exam', { moduleGroup: 'MAT700', location: MAT700_EXAM_LOCATION, protected: true, countsToward: ['academic'] }),
  oneOff('exam18-recovery', MAT700_EXAM_DATE, '15:45', '16:30', 'Decompress — no debrief, no studying yet', 'recovery', { protected: true }),
  oneOff('exam18-ts-light', MAT700_EXAM_DATE, '17:00', '18:00', 'Time Series — light closed-book retrieval only (definitions/formulas) — no new content, exam is 09:00 tomorrow', 'study', academic('Time Series')),
  oneOff('exam18-dinner', MAT700_EXAM_DATE, '18:30', '19:00', 'Make and eat dinner', 'meal', { protected: true }),
  // No separate "early sleep" block: the normal Tuesday evening routine
  // (mom-call, shower, wind-down, skincare, sleep at 23:00) already runs
  // unmodified from 19:00 on — protecting rest here just means not stacking
  // any more study on top of it, not manufacturing an earlier bedtime that
  // fights every other routine that night.

  oneOff('exam19-commute-out', TIME_SERIES_EXAM_DATE, '08:30', '08:50', 'Travel to All Nations Centre — arrive with a buffer before 09:00', 'commute', { location: 'Transit' }),
  oneOff('exam19-ts-exam', TIME_SERIES_EXAM_DATE, TIME_SERIES_EXAM_START, TIME_SERIES_EXAM_END, `TIME SERIES EXAM — ${TIME_SERIES_EXAM_LOCATION}`, 'exam', { moduleGroup: 'Time Series', location: TIME_SERIES_EXAM_LOCATION, protected: true, countsToward: ['academic'] }),
  oneOff('exam19-lunch', TIME_SERIES_EXAM_DATE, '12:30', '13:00', 'Both written exams done — eat properly, no rushing', 'meal', { protected: true }),
  oneOff('exam19-recovery', TIME_SERIES_EXAM_DATE, '11:00', '12:30', 'Decompress — no debrief, no studying', 'recovery', { protected: true }),
  oneOff('exam19-recovery-2', TIME_SERIES_EXAM_DATE, '13:00', '15:00', 'Genuine recovery — no academic work', 'recovery', { protected: true }),
  // Applied ML's compressed 6-day tail (20-25 Aug, since 17-19 are no longer
  // free — see AML_TAIL_START) doesn't fit its content at the tail's own
  // pace even after the extra confirmed day helped Time Series. Rather than
  // force a full 8h AML day onto a genuine post-exam recovery afternoon, or
  // silently leave the gap unaddressed twice in one patch, this is a
  // deliberately gentle re-entry — 3h, not 8h — using real spare capacity
  // that would otherwise sit completely idle.
  oneOff('exam19-aml-gentle-start', TIME_SERIES_EXAM_DATE, '15:00', '18:00', 'Applied ML — gentle re-entry (not full pace yet)', 'study', academic('Applied ML')),
  oneOff('exam19-dinner', TIME_SERIES_EXAM_DATE, '18:30', '19:00', 'Make and eat dinner', 'meal', { protected: true }),
]

// 20-25 August: both written exams are behind you, so this tail is Applied
// ML only — a full single-subject day (it got zero time during the 3-19 Aug
// crunch and exam pair), through to the confirmed 26 Aug CMT307 exam.
const amlTailStudyRules = [
  rule({ id: 'tail-aml-1', title: "Applied ML — today's deadline", category: 'study', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '09:00', end: '11:00', ...academic('Applied ML') }),
  rule({ id: 'tail-break-1', title: 'Break', category: 'recovery', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '11:00', end: '11:15' }),
  rule({ id: 'tail-aml-2', title: "Applied ML — today's deadline", category: 'study', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '11:15', end: '13:15', ...academic('Applied ML') }),
  rule({ id: 'tail-lunch', title: 'Make and eat lunch', category: 'meal', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '13:15', end: '13:45', protected: true }),
  rule({ id: 'tail-aml-3', title: "Applied ML — today's deadline", category: 'study', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '13:45', end: '15:45', ...academic('Applied ML') }),
  rule({ id: 'tail-walk', title: 'Outside walk', category: 'recovery', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '15:45', end: '16:15', location: 'Outside', protected: true }),
  rule({ id: 'tail-aml-4', title: "Applied ML — today's deadline", category: 'study', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '16:15', end: '18:15', ...academic('Applied ML') }),
  rule({ id: 'tail-dinner', title: 'Make and eat dinner', category: 'meal', from: AML_TAIL_START, to: AML_READINESS_DEADLINE, weekdays: [1, 2, 3, 4, 5, 6, 7], start: '18:30', end: '19:00', protected: true }),
]

const oneOffStudyRules = [
  // Wednesdays: either exam queue or explicit project capacity.
  oneOff('wed-late-0715', '2026-07-15', '16:15', '18:15', 'Applied ML queue — continue current card', 'study', { location: 'Library', ...academic('Applied ML') }),
  oneOff('wed-late-0722', '2026-07-22', '16:15', '18:15', 'Time Series queue — continue current card', 'study', { location: 'Library', ...academic('Time Series') }),
  oneOff('wed-project-0729', '2026-07-29', '16:15', '18:15', 'CMT501 protected integration block', 'project', { location: 'Library', ...project }),
  oneOff('wed-project-0805', '2026-08-05', '16:15', '18:15', 'CMT501 finalisation block — no new scope', 'project', { location: 'Library', ...project }),
  oneOff('wed-project-0812', '2026-08-12', '16:15', '17:45', 'CMT501 evidence/report reserve — release if closed', 'project', { location: 'Library', ...project }),
  oneOff('wed-buffer-0812', '2026-08-12', '17:45', '18:15', 'Protected buffer', 'recovery', { location: 'Library' }),

  // Confirmed TimeEdit classes and the remaining study blocks around them.
  ...['2026-07-16', '2026-07-23'].flatMap((date, index) => [
    oneOff(`thu-aml-${index}`, date, '08:30', '09:30', 'Applied ML queue', 'study', academic('Applied ML')),
    oneOff(`thu-out-${index}`, date, '09:30', '10:00', 'Travel to Abacws', 'commute', { location: 'Transit' }),
    oneOff(`thu-class-${index}`, date, '10:00', '13:00', 'CMT501 class — TimeEdit confirmed', 'class', { location: 'Abacws 3.38', ...project }),
    oneOff(`thu-lunch-${index}`, date, '13:00', '13:30', 'Make/eat packed lunch', 'meal', { location: 'Campus', protected: true }),
    oneOff(`thu-ts-${index}`, date, '13:30', '15:30', 'Time Series queue', 'study', { location: 'Library', ...academic('Time Series') }),
    oneOff(`thu-break-${index}`, date, '15:30', '15:45', 'Break', 'recovery', { location: 'Campus' }),
    oneOff(`thu-mat-${index}`, date, '15:45', '17:45', 'MAT700 study queue', 'study', { location: 'Library', ...academic('MAT700') }),
    oneOff(`thu-home-${index}`, date, '17:45', '18:15', 'Travel home', 'commute', { location: 'Transit' }),
    oneOff(`thu-dinner-${index}`, date, '18:15', '18:45', 'Make and eat dinner', 'meal', { protected: true }),
  ]),
  oneOff('thu-0730-aml', '2026-07-30', '08:30', '09:30', 'Applied ML queue', 'study', academic('Applied ML')),
  oneOff('thu-0730-out', '2026-07-30', '09:30', '10:00', 'Travel to Abacws', 'commute', { location: 'Transit' }),
  oneOff('thu-0730-class-a', '2026-07-30', '10:00', '13:00', 'CMT501 class — TimeEdit confirmed', 'class', { location: 'Abacws 3.38', ...project }),
  oneOff('thu-0730-lunch', '2026-07-30', '13:00', '14:00', 'Lunch and campus gap', 'meal', { location: 'Campus', protected: true }),
  oneOff('thu-0730-class-b', '2026-07-30', '14:00', '15:00', 'CMT501 class — TimeEdit confirmed', 'class', { location: 'Campus', ...project }),
  oneOff('thu-0730-ts', '2026-07-30', '15:15', '17:15', 'Time Series queue', 'study', { location: 'Library', ...academic('Time Series') }),
  oneOff('thu-0730-mat', '2026-07-30', '17:15', '18:15', 'MAT700 study queue', 'study', { location: 'Library', ...academic('MAT700') }),
  oneOff('thu-0730-home', '2026-07-30', '18:15', '18:45', 'Travel home', 'commute', { location: 'Transit' }),
  oneOff('thu-0730-dinner', '2026-07-30', '18:45', '19:15', 'Make and eat dinner', 'meal', { protected: true }),
  // Thu 6 Aug: class/lunch/break/travel/dinner unchanged; the study blocks
  // that used to fill 08:30-09:30/14:30-16:30/16:45-17:45 are now built as
  // day-blocked MAT700-main/TS-keep-alive blocks in CRUNCH_DAY_RULES above.
  oneOff('thu-0806-out', '2026-08-06', '09:30', '10:00', 'Travel to Abacws', 'commute', { location: 'Transit' }),
  oneOff('thu-0806-class', '2026-08-06', '10:00', '14:00', 'CMT501 final class / submission window', 'class', { location: 'Abacws 3.38', ...project }),
  oneOff('thu-0806-lunch', '2026-08-06', '14:00', '14:30', 'Make/eat packed lunch', 'meal', { location: 'Campus', protected: true }),
  oneOff('thu-0806-break', '2026-08-06', '16:30', '16:45', 'Break', 'recovery', { location: 'Campus' }),
  oneOff('thu-0806-home', '2026-08-06', '17:45', '18:15', 'Travel home', 'commute', { location: 'Transit' }),
  oneOff('thu-0806-dinner', '2026-08-06', '18:15', '18:45', 'Make and eat dinner', 'meal', { protected: true }),
  // 13 August is fully rebuilt as a dual-module library day in
  // INTENSIVE_PLAN_RULES above; nothing is left to define here.

  // Saturday and Sunday fourth blocks.
  ...['2026-07-18', '2026-07-25', '2026-08-01'].map((date, index) => oneOff(`sat-project-${index}`, date, '16:15', '18:15', 'CMT501 protected block — current bottleneck only', 'project', { location: 'Library', ...project })),
  // 8 and 15 August use their fourth blocks for the same-day MAT700 gate.
  oneOff('sun-project-0802', '2026-08-02', '15:45', '17:45', 'CMT501 internal-handoff block — freeze scope', 'project', project),

  // Weekly maintenance review + one development task. The 30-minute urgent-role
  // reserve is deliberately left unallocated, keeping the hard ceiling at two hours.
  ...jobSundayDates.flatMap((date, index) => {
    const reviewStart = date >= EXAM_WINDOW_START ? '19:00' : '18:30'
    const reviewEnd = date >= EXAM_WINDOW_START ? '19:20' : '18:50'
    const buildEnd = date >= EXAM_WINDOW_START ? '20:05' : '19:35'
    return [
      oneOff(`sun-job-review-${index}`, date, reviewStart, reviewEnd, 'Review accumulated job leads once', 'job', { moduleGroup: 'Job Hunt', countsToward: ['job'], protected: true }),
      oneOff(`sun-job-build-${index}`, date, reviewEnd, buildEnd, 'Complete this week’s single job-development task', 'job', { moduleGroup: 'Job Hunt', countsToward: ['job'], protected: true }),
    ]
  }),
  oneOff('mat700-reset-block', '2026-07-16', '19:15', '20:15', 'MAT700 planning reset — build the pass specification', 'admin', { moduleGroup: 'MAT700', cardId: 'mat700-foundation-reset', protected: true }),
  oneOff('admin-summer-assessment-confirmation-block', '2026-07-16', '20:15', '20:45', 'Confirm summer assessment entry and publication channels', 'admin', { moduleGroup: 'Admin', cardId: 'admin-summer-assessment-confirmation', protected: true }),
  oneOff('admin-logistics-block', '2026-08-15', '21:00', '22:00', 'Final exam logistics and materials lock', 'admin', { moduleGroup: 'Admin', cardId: 'admin-exam-logistics', protected: true }),
]

// Meal blocks carry no explicit cardId, so resolveScheduledCard's moduleGroup+
// date matching auto-opens that day's food-plan card (Health) in the Today
// hour-by-hour view — same mechanism the study blocks already use.
export const scheduleRules = [...coreRoutineRules, ...weekdayStudyRules, ...CRUNCH_DAY_RULES, ...INTENSIVE_PLAN_RULES, ...EXAM_PAIR_RULES, ...amlTailStudyRules, ...oneOffStudyRules]
  .map((entry) => (entry.category === 'meal' && !entry.moduleGroup ? { ...entry, moduleGroup: 'Health' } : entry))
export const scheduleExceptions = [
  {
    date: '2026-07-25',
    removeRuleIds: ['sat-mat', 'sat-break-2', 'sat-commute-home', 'sat-dinner', 'sat-grocery', 'daily-admin-sat', 'sat-project-1'],
    blocks: [
      { id: 'sati-role-block', start: '14:00', end: '14:45', title: 'Sati - role, application, and company facts', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-role', protected: true },
      { id: 'sati-technical-block', start: '15:00', end: '16:15', title: 'Sati - Linux, networks, VMs, Docker, and data-centre fluency', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-technical', protected: true },
      { id: 'sati-sat-break', start: '16:15', end: '16:30', title: 'Break', category: 'recovery' },
      { id: 'sati-practical-block', start: '16:30', end: '17:15', title: 'Sati - practical service-failure drill', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-practical', protected: true },
      { id: 'sati-sat-home', start: '17:15', end: '17:45', title: 'Travel home', category: 'commute', location: 'Transit' },
      { id: 'sati-sat-dinner', start: '18:00', end: '18:30', title: 'Make and eat dinner', category: 'meal', protected: true },
      { id: 'sati-speaking-block', start: '19:00', end: '20:00', title: 'Sati - introduction, motivation, STAR story, and availability', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-speaking', protected: true },
      { id: 'daily-admin-sati-sat', start: '20:15', end: '20:25', title: 'Daily admin check-in - log what you did', category: 'admin', moduleGroup: 'Admin', protected: true },
    ],
  },
  {
    date: '2026-07-26',
    removeRuleIds: ['sun-ts', 'sun-break-1', 'sun-mat', 'sun-lunch', 'sun-aml', 'sun-walk', 'sun-dinner', 'sun-job-review-0', 'sun-job-build-0'],
    blocks: [
      { id: 'sati-sun-ts', start: '08:30', end: '10:00', title: 'Time Series queue - continue the active card', category: 'study', moduleGroup: 'Time Series', countsToward: ['academic'], protected: true },
      { id: 'sati-sun-break', start: '10:00', end: '10:15', title: 'Break', category: 'recovery' },
      { id: 'sati-sun-mat', start: '10:15', end: '12:15', title: 'MAT700 queue - foundation and tutorial-first work', category: 'study', moduleGroup: 'MAT700', countsToward: ['academic'], protected: true },
      { id: 'sati-sun-lunch', start: '12:15', end: '12:45', title: 'Make and eat lunch', category: 'meal', protected: true },
      { id: 'sati-group-block', start: '13:00', end: '14:15', title: 'Sati - answers aloud and group-exercise rehearsal', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-group', protected: true },
      { id: 'sati-logistics-block', start: '14:30', end: '16:15', title: 'Sati - CV check, route, outfit, packing, and one-page sheet', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-logistics', protected: true },
      { id: 'sati-sun-break-2', start: '16:15', end: '16:30', title: 'Break', category: 'recovery' },
      { id: 'sati-project-handoff', start: '16:30', end: '17:00', title: 'CMT501 minimum viable handoff only', category: 'project', moduleGroup: 'Group Project', cardId: 'project-capacity-w2', countsToward: ['academic', 'project'], protected: true },
      { id: 'sati-sun-grocery', start: '17:00', end: '18:00', title: 'Weekly grocery shop', category: 'chores', location: 'Shops', protected: true },
      { id: 'sati-sun-dinner', start: '18:00', end: '18:30', title: 'Make and eat dinner', category: 'meal', protected: true },
    ],
  },
  {
    date: '2026-07-27',
    removeRuleIds: ['mon-commute-out', 'mon-aml-1', 'mon-break-1', 'mon-aml-2', 'mon-lunch', 'mon-ts', 'mon-break-2', 'mon-project', 'mon-commute-home', 'job-scan-mon'],
    blocks: [
      { id: 'sati-light-review', start: '08:30', end: '08:50', title: 'Read the Sati one-page sheet once - no new study', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', protected: true },
      { id: 'sati-dress', start: '08:50', end: '09:20', title: 'Dress and final grooming', category: 'routine', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', protected: true },
      { id: 'sati-live-checks', start: '09:20', end: '09:40', title: 'Check live rail, weather, ticket, Railcard, and packed bag', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', protected: true },
      { id: 'sati-calm-buffer', start: '09:40', end: '10:20', title: 'Calm buffer - water, bathroom, no new preparation', category: 'recovery', protected: true },
      { id: 'sati-walk-central', start: '10:20', end: '10:50', title: 'Walk from Howard Gardens to Cardiff Central', category: 'commute', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: 'Transit', protected: true },
      { id: 'sati-station-buffer', start: '10:50', end: '11:13', title: 'Cardiff Central platform buffer', category: 'travel', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: 'Cardiff Central', protected: true },
      { id: 'sati-train-out', start: '11:13', end: '11:39', title: 'Direct train: Cardiff Central to Bridgend', category: 'travel', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: 'Train', protected: true },
      { id: 'sati-walk-bridgend', start: '11:39', end: '11:55', title: 'Walk to and locate 8A Dunraven Place', category: 'commute', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: 'Bridgend', protected: true },
      { id: 'sati-wait-nearby', start: '11:55', end: '12:10', title: 'Wait nearby; water and one calm breath', category: 'recovery', protected: true },
      { id: 'sati-check-in', start: '12:10', end: '12:30', title: 'Enter and check in', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: '8A Dunraven Place', protected: true },
      { id: 'sati-interview', start: '12:30', end: '14:00', title: 'Sati Data Centre Graduate Internship - group interview', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: '8A Dunraven Place', protected: true, notes: 'End time is an estimate; let the live interview determine the return.' },
      { id: 'sati-return', start: '14:00', end: '15:30', title: 'Flexible return to Cardiff', category: 'travel', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', location: 'Transit', protected: true },
      { id: 'sati-recover', start: '15:30', end: '16:00', title: 'Food and decompression', category: 'recovery', protected: true },
      { id: 'sati-debrief', start: '16:00', end: '16:20', title: 'Write factual interview debrief and next steps', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', protected: true },
      { id: 'sati-thank-you', start: '18:00', end: '18:15', title: 'Send concise Sati thank-you email', category: 'interview', moduleGroup: 'Interview Prep', cardId: 'interview-sati-attend', protected: true },
    ],
  },
  {
    date: '2026-07-28',
    ruleId: 'tue-aml-rebalance',
    replacement: { id: 'tue-ts-rebalance', start: '13:15', end: '15:15', title: 'Time Series queue - illness-reset catch-up', category: 'study', moduleGroup: 'Time Series', countsToward: ['academic'], protected: true },
  },
  {
    date: '2026-07-31',
    ruleId: 'fri-ts-2',
    replacement: { id: 'fri-mat-rebalance', start: '15:45', end: '17:45', title: 'MAT700 queue - rebuild catch-up', category: 'study', moduleGroup: 'MAT700', countsToward: ['academic'], protected: true },
  },
  // The 4/7/10/12/16 Aug exceptions that used to layer Applied ML into the
  // old AM/PM-mixed crunch fortnight are retired: Applied ML is paused
  // through the TS/MAT700 sprint, so there is nothing left
  // for them to replace.
  {
    // Fri 7 Aug corrected schedule (2026-08-06): the protected outside walk
    // (normally 15:15-15:45) collides with the new 13:30-15:30 Time Series
    // block, so it moves 15 minutes later to 15:30-16:00 — a real break
    // between the two study blocks that day. Not removed, just retimed.
    date: '2026-08-07',
    ruleId: 'fri-walk',
    replacement: { id: 'fri-walk-0807', start: '15:30', end: '16:00', title: 'Outside walk', category: 'recovery', location: 'Outside', protected: true },
  },
  {
    // Wed 5 Aug errands: routed through the day's existing commute/break
    // blocks instead of adding new ones — a closer library shortens the
    // morning trip enough to fit the print-shop stop, the midday outside
    // break covers Boots, and the evening commute home covers groceries.
    date: '2026-08-05',
    removeRuleIds: ['wed-commute-out', 'wed-break-2', 'wed-commute-home'],
    blocks: [
      { id: 'wed-0805-commute-out', start: '08:30', end: '09:00', title: 'Travel to library (closer branch) — collect printed formulas', category: 'commute', location: 'Transit' },
      { id: 'wed-0805-break-2', start: '15:45', end: '16:15', title: 'Walk / reset — via Boots (ketoconazole)', category: 'recovery', location: 'Outside' },
      { id: 'wed-0805-commute-home', start: '18:15', end: '18:45', title: 'Travel home — via grocery shop', category: 'commute', location: 'Transit' },
    ],
  },
  // Historical Pack A-C mock nights keep their already-lived ten-minute
  // sleep adjustment. The new sprint starts on 8 August and does not add
  // further compressed pack mocks or sleep cuts.
  ...['2026-08-03', '2026-08-04', '2026-08-05'].map((date) => ({
    date,
    ruleId: 'sleep',
    replacement: { id: `sleep-${date}`, start: '23:10', end: '07:00', title: 'Sleep', category: 'sleep', countsToward: ['sleep'], protected: true },
  })),
  // The 8/3 and 8/6 job-scan trim exceptions were removed 2026-08-06: Job
  // Hunt is now paused outright for the whole exam period (see
  // coreRoutineRules above), so there's nothing left for these to trim.
  {
    // Sat 8 Aug: keep the grocery trip workable after the first dual-module
    // sprint day, with the admin check-in immediately afterwards.
    date: '2026-08-08',
    removeRuleIds: ['sat-grocery', 'daily-admin-sat'],
    blocks: [
      { id: 'sat-0808-grocery', start: '19:15', end: '20:15', title: 'Weekly grocery shop (trimmed)', category: 'chores', location: 'Shops', protected: true },
      { id: 'daily-admin-sat-0808', start: '20:15', end: '20:25', title: 'Daily admin check-in - log what you did', category: 'admin', moduleGroup: 'Admin', protected: true },
    ],
  },
]

export const scheduleAssumptions = {
  sleep: '23:00–07:00 every day (a single 6-6.5h night is a contingency only, never consecutive, never the night before an exam)',
  academicCeiling: 'The 8–17 August plan is deadline-driven, not estimated-hour-driven. Each day has protected Time Series and MAT700 lanes, but completion is judged by the two evidence gates on that date rather than by a claimed hour total.',
  dualModuleDeadline: 'Both urgent modules move every day: 8–12 August completes original-source coverage; 13–17 August completes original questions, past papers, marking, and targeted repair.',
  locations: 'Library/uni at least every other day; home days include an outside walk',
  project: 'Generic capacity only; detailed waste-project management stays elsewhere',
  jobs: 'Paused entirely from 3 Aug until after the CMT307 exam (26 Aug) — resumes as JOB_MAINTENANCE_WEEKS from 27 Aug. Two 15-minute scans + 20-minute review + one 45-minute output when active; a 25-minute urgent reserve stays inside the hard 2-hour weekly cap',
  fallback: 'If overloaded: protect sleep, fixed class/exam, and both same-day evidence gates; shorten optional enrichment and repair only the errors that block the next gate.',
}
