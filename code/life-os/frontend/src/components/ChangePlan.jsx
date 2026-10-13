// "Change" on one of her own plans, where the plan is shown (the day, the week planner). It
// reads the whole entry and opens the editor on it. One day of a repeating plan opens the
// repeating plan itself, and says so: the change reaches every day still to come.
import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import EntryEditor from './EntryEditor.jsx'

// `entry` is { id, routine } as the day and the calendar give it (lib/day.js: ownEntry).
export default function ChangePlan({ entry, onSaved, onCancel }) {
  const id = entry.routine ? entry.routine.id : entry.id
  const [state, setState] = useState({ entry: null, error: '' })
  useEffect(() => {
    let off = false
    setState({ entry: null, error: '' })
    apiFetch(`/api/entries/${encodeURIComponent(id)}`)
      .then((found) => { if (!off) setState({ entry: found, error: '' }) })
      .catch((failure) => { if (!off) setState({ entry: null, error: failure.message === 'not found' ? 'This plan is no longer there.' : failure.message }) })
    return () => { off = true }
  }, [id])
  if (state.error) return <p className="change-plan-note day-warn" role="alert">It could not be opened: {state.error} <button type="button" className="day-mark" onClick={onCancel}>Close</button></p>
  if (!state.entry) return <p className="change-plan-note" role="status">Opening…</p>
  return <div className="change-plan">
    {entry.routine ? <p className="change-plan-note">This is one day of a repeating plan. Changing it here changes every day of it still to come; to change only this day, use “Take off the day” and add a plan for the day.</p> : null}
    <EntryEditor entry={state.entry} onSaved={onSaved} onCancel={onCancel} />
  </div>
}
