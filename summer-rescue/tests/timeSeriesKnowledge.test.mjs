import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { applyCardStudySequences } from '../src/data/cardStudySequences.js'
import { rescueCards } from '../src/data/summerRescuePlan.js'
import { STUDY_MODULE_MAP } from '../src/data/studyModules.js'
import { parseNoteBundle } from '../src/utils/knowledge.js'

const bundlePaths = [
  'src/data/knowledge/ts-foundations.md',
  'src/data/knowledge/ts-spectral.md',
  'src/data/knowledge/ts-arma.md',
  'src/data/knowledge/ts-drills.md',
]

async function loadTimeSeriesNotes() {
  const sources = await Promise.all(bundlePaths.map((path) => readFile(path, 'utf8')))
  return sources.flatMap((source) => parseNoteBundle(source, { moduleId: 'time-series' }))
}

const timeSeriesCards = applyCardStudySequences(rescueCards)
  .filter((card) => card.moduleGroup === 'Time Series')

test('Time Series knowledge bundles form a complete, unique exam-oriented set', async () => {
  const notes = await loadTimeSeriesNotes()
  const ids = notes.map((note) => note.id)

  assert.ok(notes.length >= 55, `expected at least 55 Time Series notes, found ${notes.length}`)
  assert.equal(new Set(ids).size, ids.length, 'Time Series note ids must be unique')

  for (const requiredId of [
    'ts-l1-overview',
    'ts-arima-sarima',
    'ts-acf-pacf',
    'ts-aic-model-choice',
    'ts-ssa',
  ]) {
    assert.ok(ids.includes(requiredId), `missing required Time Series note ${requiredId}`)
  }
})

test('every live Time Series card has a bounded study sequence and a matching checklist', () => {
  assert.equal(timeSeriesCards.length, 10)

  for (const card of timeSeriesCards) {
    const steps = card.studySequence?.steps ?? []
    assert.ok(steps.length > 0, `${card.id} is missing its study sequence`)
    assert.equal(card.checklist.length, steps.length, `${card.id} checklist/step count differs`)
    assert.deepEqual(
      card.checklist,
      steps.map((step) => step.checklistText ?? step.label),
      `${card.id} checklist does not mirror the ordered study sequence`,
    )
    assert.equal(card.deadlineDriven, true, `${card.id} is a daily completion gate`)
    assert.equal(card.estimatedHours, 0, `${card.id} does not invent an hour quota`)
    assert.equal(card.studySequence.totalMinutes, 0, `${card.id} sequence stays deadline-driven`)
  }
})

test('every Time Series card note and resource reference resolves', async () => {
  const notes = await loadTimeSeriesNotes()
  const noteIds = new Set(notes.map((note) => note.id))
  const resourceIds = new Set(STUDY_MODULE_MAP['time-series'].resources.map((resource) => resource.id))

  for (const card of timeSeriesCards) {
    for (const step of card.studySequence.steps) {
      for (const noteId of step.noteIds ?? []) {
        assert.ok(noteIds.has(noteId), `${card.id} references missing note ${noteId}`)
      }
      for (const resourceId of step.resourceIds ?? []) {
        assert.ok(resourceIds.has(resourceId), `${card.id} references missing resource ${resourceId}`)
      }
    }
  }
})

test('the question phase covers every supplied past paper and the official mock', () => {
  const expectedRun = [
    ['ts-intensive-day-7', '2015', '2016'],
    ['ts-intensive-day-8', '2017', '2018'],
    ['ts-intensive-day-9', '2019', '2020'],
    ['ts-intensive-day-10', 'official mock', 'official mock'],
  ]

  for (const [cardId, first, second] of expectedRun) {
    const card = timeSeriesCards.find((candidate) => candidate.id === cardId)
    assert.ok(card, `missing question card ${cardId}`)
    const text = `${card.title}\n${JSON.stringify(card.studySequence)}`
    assert.match(text, new RegExp(first, 'i'))
    assert.match(text, new RegExp(second, 'i'))
  }

  const mock = timeSeriesCards.find((card) => card.id === 'ts-intensive-day-10')
  assert.match(mock.studySequence.steps[0].instruction, /2-hour, three-question conditions/i)
})

test('the intensive cards and memory notes preserve lecture-supported boundaries', async () => {
  const armaDay = timeSeriesCards.find((card) => card.id === 'ts-intensive-day-2')
  const armaText = JSON.stringify(armaDay.studySequence)
  assert.match(armaText, /three distinct conclusions/i)
  assert.match(armaText, /causality/i)
  assert.match(armaText, /invertibility/i)

  const questionDays = timeSeriesCards.filter((card) => card.dueDate >= '2026-08-13')
  assert.ok(questionDays.every((card) => /original|official|source/i.test(JSON.stringify(card.studySequence))))

  const notes = await loadTimeSeriesNotes()
  const memoryNote = notes.find((note) => note.id === 'ts-short-long-range')
  assert.match(memoryNote.body, /stationary process/i)
  assert.match(memoryNote.body, /do not (?:apply|classify).*random walk/i)
})
