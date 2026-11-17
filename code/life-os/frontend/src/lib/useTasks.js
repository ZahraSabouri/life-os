// Her tasks, read once per page and read again whenever any page saves one, so the Tasks
// page, Today, the Court and the day's path agree. Every change is sent with the version the
// page saw (If-Match), so a change made elsewhere is never written over.
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { moveTask, noteId, notesOf, stepId } from '@shared/tasks.js'

const CHANGED = 'life-os:tasks-changed'
export const tasksChanged = () => window.dispatchEvent(new Event(CHANGED))
const FILTER = encodeURIComponent(JSON.stringify({ types: ['task'] }))

export function useTasks() {
  const [state, setState] = useState({ tasks: [], loading: true, error: '' })
  const [turn, setTurn] = useState(0)
  const reload = useCallback(() => setTurn((value) => value + 1), [])
  useEffect(() => {
    let off = false
    apiFetch(`/api/entries?limit=5000&filter=${FILTER}`)
      .then((rows) => { if (!off) setState({ tasks: Array.isArray(rows) ? rows : [], loading: false, error: '' }) })
      .catch((failure) => { if (!off) setState((current) => ({ ...current, loading: false, error: failure.message })) })
    return () => { off = true }
  }, [turn])
  useEffect(() => {
    window.addEventListener(CHANGED, reload)
    return () => window.removeEventListener(CHANGED, reload)
  }, [reload])
  return { ...state, reload }
}

// A change to one task, guarded by the version the page read. When it changed elsewhere the
// save is refused and every page reads it again.
export async function saveTask(task, patch) {
  try {
    const saved = await apiFetch(`/api/entries/${encodeURIComponent(task.id)}`, {
      method: 'PATCH', body: JSON.stringify(patch), headers: task.updated_at ? { 'If-Match': task.updated_at } : {},
    })
    tasksChanged()
    return saved
  } catch (failure) {
    if (/changed/i.test(failure.message)) { tasksChanged(); throw new Error('It was changed somewhere else. The latest is shown now; try again.') }
    throw failure
  }
}

// Details are saved whole, so a change keeps every other detail as it was.
function withDetails(task, changes) {
  const details = { ...(task.details ?? {}), ...changes }
  for (const [key, value] of Object.entries(details)) if (value === undefined || value === null || value === '') delete details[key]
  return details
}
export const saveDetails = (task, changes) => saveTask(task, { details: withDetails(task, changes) })

const stepsOf = (task) => (Array.isArray(task.details?.steps) ? task.details.steps : [])
export const tickStep = (task, id, done) => saveDetails(task, { steps: stepsOf(task).map((step) => (step.id === id ? { ...step, done } : step)) })
export const addStep = (task, text) => saveDetails(task, { steps: [...stepsOf(task), { id: stepId(), text: String(text).trim(), done: false }] })
export const renameStep = (task, id, text) => saveDetails(task, { steps: stepsOf(task).map((step) => (step.id === id ? { ...step, text: String(text).trim() } : step)) })
export const dropStep = (task, id) => saveDetails(task, { steps: stepsOf(task).filter((step) => step.id !== id) })
export function moveStep(task, id, by) {
  const steps = [...stepsOf(task)]
  const from = steps.findIndex((step) => step.id === id)
  const to = from + by
  if (from < 0 || to < 0 || to >= steps.length) return Promise.resolve(task)
  const [step] = steps.splice(from, 1)
  steps.splice(to, 0, step)
  return saveDetails(task, { steps })
}

// Done, or to do again. What it was comes back for Undo.
export const setTaskDone = (task, done) => saveTask(task, { status: done ? 'done' : 'planned' })
export const putTaskAway = (task) => saveTask(task, { status: 'cancelled' })

// Moved to another day (shared/tasks.js says where each choice lands and records the move).
// The answer is the saved task; `undoMove` puts back its day and details as they were.
export const postponeTask = (task, { choice, day = '', why = '', today }) => saveTask(task, moveTask(task, { choice, day, why, today, now: new Date() }))
export const undoMove = (saved, before) => saveTask(saved, { start_at: before.start_at ?? null, end_at: before.end_at ?? null, all_day: Boolean(before.all_day), details: before.details ?? {} })

// The star: starred tasks come first in every list.
export const setTaskStar = (task, on) => saveTask(task, { favorite: Boolean(on) })

// A dated note on a task; `kind: 'done'` is "how it went", written when it is ticked done.
export function addTaskNote(task, { text = '', minutes = 0, kind = 'note' } = {}) {
  const words = String(text).trim()
  const spent = Math.round(Number(minutes) || 0)
  if (!words && !spent) return Promise.resolve(task)
  return saveDetails(task, { log: [...notesOf(task), { id: noteId(), at: new Date().toISOString(), kind, text: words, ...(spent > 0 ? { minutes: spent } : {}) }] })
}
export const dropTaskNote = (task, id) => saveDetails(task, { log: notesOf(task).filter((note) => note.id !== id) })

// Into a lane. Today also puts it on today's date, so it is on today's cards; the other lanes
// keep its day.
export function moveTaskLane(task, lane, today) {
  if (lane === 'done') return setTaskDone(task, true)
  const details = withDetails(task, { lane })
  const reopen = task.status === 'done' ? { status: 'planned' } : {}
  if (lane === 'today') return saveTask(task, { ...reopen, start_at: today, end_at: null, all_day: true, details })
  return saveTask(task, { ...reopen, details })
}

export async function createTask({ title, day = '', details = {} }) {
  const clean = withDetails({ details: {} }, details)
  const saved = await apiFetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify({ type: 'task', title: String(title).trim(), status: 'planned', ...(day ? { start_at: day, all_day: true } : {}), details: clean }),
  })
  tasksChanged()
  return saved
}

// Short names for the areas a task is filed under, and the colour of each on the calendar.
export const TASK_AREAS = [
  ['study', 'Study'], ['career', 'Work and career'], ['academia', 'Research'], ['body', 'Health'], ['admin', 'Admin'],
  ['home', 'Home'], ['travel', 'Travel'], ['relationships', 'People'], ['growth', 'Growth'], ['mind', 'Making'],
  ['culture', 'Culture'], ['memories', 'Memories'], ['style', 'Style'],
]
export const areaName = (slug) => TASK_AREAS.find(([key]) => key === slug)?.[1] ?? 'No area'
const TONES = { study: 'study', academia: 'study', career: 'career', body: 'body', home: 'home', admin: 'admin', relationships: 'relationships', travel: 'events', culture: 'events' }
export const areaTone = (slug) => TONES[slug] ?? 'core'
