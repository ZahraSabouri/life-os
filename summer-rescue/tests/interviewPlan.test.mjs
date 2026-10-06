import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { applyCardStudySequences } from '../src/data/cardStudySequences.js'
import {
  rescueCards,
  scheduleExceptions,
  scheduleRules,
} from '../src/data/summerRescuePlan.js'
import { STUDY_MODULE_MAP } from '../src/data/studyModules.js'
import { parseNoteBundle } from '../src/utils/knowledge.js'
import { expandScheduleForDate, findScheduleConflicts } from '../src/utils/schedule.js'

const interviewCards = applyCardStudySequences(rescueCards)
  .filter((card) => card.moduleGroup === 'Interview Prep')
const interviewModule = STUDY_MODULE_MAP.interview

// The Sati interview happened on 27 July 2026 (see the schedule-level test
// below, which still covers it via scheduleRules/scheduleExceptions — those
// aren't campaign-start-filtered). Since the 3 August reset moved
// CAMPAIGN_START past that date, these one-off interview cards correctly
// roll off the live rescueCards catalogue, same as every other retired
// historical card across past resets.
test('Sati interview hub has a bounded 6h45 preparation plan plus the interview day', { skip: 'interview cards retired from rescueCards after the 3 Aug reset moved CAMPAIGN_START past 27 Jul' }, () => {
  assert.equal(interviewCards.length, 7)

  const preparationCards = interviewCards.filter((card) => card.id !== 'interview-sati-attend')
  const preparationMinutes = preparationCards
    .reduce((sum, card) => sum + card.studySequence.totalMinutes, 0)
  assert.equal(preparationMinutes, 405)
  assert.equal(interviewCards.find((card) => card.id === 'interview-sati-attend').studySequence.totalMinutes, 330)

  for (const card of interviewCards) {
    assert.ok(card.studySequence.steps.length > 0, `${card.id} has no ordered study sequence`)
    assert.equal(card.checklist.length, card.studySequence.steps.length, `${card.id} checklist drift`)
    assert.ok(card.studySequence.totalMinutes <= card.estimatedHours * 60, `${card.id} exceeds its card budget`)
  }
})

test('every Sati note and material reference resolves and every listed material is used', { skip: 'interview cards retired from rescueCards after the 3 Aug reset moved CAMPAIGN_START past 27 Jul' }, async () => {
  const source = await readFile('src/data/knowledge/interview-sati.md', 'utf8')
  const notes = parseNoteBundle(source, { moduleId: 'interview' })
  const noteIds = new Set(notes.map((note) => note.id))
  const resourceIds = new Set(interviewModule.resources.map((resource) => resource.id))
  const usedResources = new Set()

  assert.deepEqual(
    notes.map((note) => note.id),
    ['sati-confirmed-facts', 'sati-technical', 'sati-speaking', 'sati-group', 'sati-travel', 'sati-one-page'],
  )

  for (const card of interviewCards) {
    for (const step of card.studySequence.steps) {
      for (const noteId of step.noteIds ?? []) {
        assert.ok(noteIds.has(noteId), `${card.id} references missing note ${noteId}`)
      }
      for (const resourceId of step.resourceIds ?? []) {
        assert.ok(resourceIds.has(resourceId), `${card.id} references missing resource ${resourceId}`)
        usedResources.add(resourceId)
      }
    }
  }

  assert.deepEqual([...usedResources].sort(), [...resourceIds].sort())
})

test('interview weekend retains exams and Monday is a collision-free travel/interview day', () => {
  const saturday = expandScheduleForDate(scheduleRules, scheduleExceptions, '2026-07-25')
  const sunday = expandScheduleForDate(scheduleRules, scheduleExceptions, '2026-07-26')
  const monday = expandScheduleForDate(scheduleRules, scheduleExceptions, '2026-07-27')

  assert.equal(saturday.filter((block) => block.category === 'study').reduce((sum, block) => sum + block.durationMinutes, 0), 240)
  assert.equal(sunday.filter((block) => block.category === 'study').reduce((sum, block) => sum + block.durationMinutes, 0), 210)
  assert.equal(monday.some((block) => block.category === 'study'), false)
  assert.equal(findScheduleConflicts(monday).length, 0)

  assert.deepEqual(
    monday
      .filter((block) => ['sati-walk-central', 'sati-train-out', 'sati-check-in', 'sati-interview'].includes(block.id))
      .map((block) => [block.id, block.start, block.end]),
    [
      ['sati-walk-central', '10:20', '10:50'],
      ['sati-train-out', '11:13', '11:39'],
      ['sati-check-in', '12:10', '12:30'],
      ['sati-interview', '12:30', '14:00'],
    ],
  )
})

test('interview notes distinguish confirmed facts from unknown internal details', async () => {
  const source = await readFile('src/data/knowledge/interview-sati.md', 'utf8')
  assert.match(source, /confirmed.*labelled inference.*unknown/is)
  assert.match(source, /does \*\*not\*\* reveal the internship's internal systems/i)
  assert.match(source, /No new study on Monday/i)
  assert.match(source, /planned outbound train/i)
})
