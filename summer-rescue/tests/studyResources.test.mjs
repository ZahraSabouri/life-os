import assert from 'node:assert/strict'
import test from 'node:test'

import { STUDY_MODULES } from '../src/data/studyModules.js'

test('module resource catalogues exclude campaign-planning files', () => {
  const resources = STUDY_MODULES.flatMap((module) => module.resources)
  const planningResources = resources.filter((resource) =>
    /\.md$/i.test(resource.path ?? '') && (
      ['Study plan', 'Planning'].includes(resource.group) ||
      resource.tags?.includes('plan') ||
      /Summer_Rescue_Campaign_2026[\\/]Module_Plans/i.test(resource.path ?? '') ||
      /exam plan|homework plan|planning guardrails|priority map|pack map/i.test(resource.title ?? '')
    ),
  )

  assert.deepEqual(
    planningResources.map((resource) => resource.title),
    [],
  )

  const retainedMarkdown = resources
    .filter((resource) => /\.md$/i.test(resource.path ?? ''))
    .map((resource) => resource.title)
    .sort()

  assert.deepEqual(retainedMarkdown, [
    'Sati final one-page cue sheet',
    'Sati interview preparation pack',
    'Stopped-service diagnosis drill',
  ])
})

test('Time Series learning-material PDFs are labelled as original class materials without changing their ids', () => {
  const timeSeries = STUDY_MODULES.find((module) => module.id === 'time-series')
  const lectureOne = timeSeries.resources.find(
    (resource) => resource.path === 'Learning Materials/ma3508_lecture1.pdf',
  )

  assert.ok(lectureOne)
  assert.equal(lectureOne.id, 'timeSeries-lecture-notes-lecture-1-learning-material-notes')
  assert.equal(lectureOne.group, 'Original class materials')
  assert.equal(lectureOne.title, 'Lecture 1 original class material')
  assert.match(lectureOne.description, /add your own progress, notes, and questions/i)
  assert.doesNotMatch(lectureOne.title, /notes/i)
})
