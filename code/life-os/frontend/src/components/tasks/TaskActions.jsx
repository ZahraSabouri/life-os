// The quick things that can be done to a task wherever it shows: move it to another day (with a
// reason, if one is wanted), star it so it comes first, and the same move for a thing waiting on
// her (snoozed to that day). The menu opens in place, under the button, so it is never cut off.
import { useState } from 'react'
import { MOVE_REASONS, nextMonday } from '@shared/tasks.js'
import { addDays, formatCalendarDay } from '../../lib/calendar.js'

// The choices the menu offers: "Later today" only for something that is for today (or late);
// "Someday" only for her own tasks, since a thing waiting on her always comes back on a day.
export function moveChoices({ day = '', today, waiting = false }) {
  const list = []
  if (!waiting && (!day || day <= today)) list.push(['later', 'Later today'])
  list.push(['tomorrow', 'Tomorrow'], ['week', `Next week · ${formatCalendarDay(nextMonday(today), { weekday: 'short' })}`])
  if (!waiting) list.push(['someday', 'Someday'])
  return list
}

// The day a choice means, for a thing that is only ever moved to a day.
export function dayOfChoice(choice, today, picked = '') {
  if (choice === 'tomorrow') return addDays(today, 1)
  if (choice === 'week') return nextMonday(today)
  if (choice === 'day') return picked
  return ''
}

// Words for the line that reports a move: "Moved to tomorrow", "Moved to Mon 23 Nov".
export function movedWords(choice, today, picked = '') {
  if (choice === 'later') return 'Moved to later today'
  if (choice === 'someday') return 'Moved to someday'
  const day = dayOfChoice(choice, today, picked)
  return `Moved to ${day === addDays(today, 1) ? 'tomorrow' : formatCalendarDay(day, { weekday: 'short' })}`
}

export function MoveMenu({ title, day = '', today, waiting = false, busy = false, onMove, label = 'Move' }) {
  const [open, setOpen] = useState(false)
  const [why, setWhy] = useState('')
  const [picked, setPicked] = useState('')
  function choose(choice) {
    setOpen(false)
    onMove({ choice, day: choice === 'day' ? picked : '', why: waiting ? '' : why })
    setWhy('')
    setPicked('')
  }
  return <>
    <button type="button" className="task-move-button" aria-expanded={open} disabled={busy} onClick={() => setOpen(!open)}
      aria-label={`${label}: ${title}`}>{label}{open ? ' ▴' : ' ▾'}</button>
    {open ? <div className="task-move-menu" role="group" aria-label={`Move “${title}” to`} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      {waiting ? null : <div className="task-move-why" role="group" aria-label="Why, if you like">
        <span>Why, if you like</span>
        {MOVE_REASONS.map((reason) => <button key={reason.id} type="button" aria-pressed={why === reason.id} onClick={() => setWhy(why === reason.id ? '' : reason.id)}>{reason.label}</button>)}
      </div>}
      <div className="task-move-to">
        {moveChoices({ day, today, waiting }).map(([id, words]) => <button key={id} type="button" className="task-move-choice" onClick={() => choose(id)}>{words}</button>)}
        <span className="task-move-day">
          <input type="date" min={addDays(today, 1)} value={picked} onChange={(event) => setPicked(event.target.value)} aria-label="Another day" />
          <button type="button" className="task-move-choice" disabled={!picked} onClick={() => choose('day')}>Move there</button>
        </span>
        <button type="button" className="task-move-cancel" onClick={() => setOpen(false)}>Keep it here</button>
      </div>
    </div> : null}
  </>
}

export function StarButton({ on, title, busy = false, onToggle }) {
  return <button type="button" className={`task-star${on ? ' is-on' : ''}`} aria-pressed={Boolean(on)} disabled={busy} onClick={onToggle}
    aria-label={on ? `Take the star off: ${title}` : `Star it, first in every list: ${title}`} title={on ? 'Starred: first in every list' : 'Star it: first in every list'}>{on ? '★' : '☆'}</button>
}
