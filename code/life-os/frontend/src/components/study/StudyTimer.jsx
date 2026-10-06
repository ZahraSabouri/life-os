import { useEffect, useRef, useState } from 'react'
import { dataOf, localClock, minutesToLog, timerElapsed, timerRemaining, titleOf } from '../../lib/study.js'
import StudyDialog from './StudyDialog.jsx'

const MODES = { focus: 'Focus', short: 'Short break', long: 'Long break' }
const DEFAULT_TIMER = { mode: 'focus', durations: { focus: 25, short: 5, long: 15 }, remainingSeconds: 1500, running: false, elapsedMs: 0, completedSessions: 0, cardId: null }
export function makeTimer(value = {}) {
  const durations = Object.fromEntries(Object.keys(MODES).map(mode => [mode, Math.max(1, Math.min(120, Number(value.durations?.[mode]) || DEFAULT_TIMER.durations[mode]))]))
  return { ...DEFAULT_TIMER, ...value, mode: MODES[value.mode] ? value.mode : 'focus', durations }
}
function format(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
function chime() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext
    if (!Audio) return
    const context = new Audio(), oscillator = context.createOscillator(), gain = context.createGain()
    oscillator.connect(gain); gain.connect(context.destination); oscillator.frequency.value = 660
    gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6)
    oscillator.start(); oscillator.stop(context.currentTime + 0.65); oscillator.onended = () => context.close()
  } catch { /* The timer still works when audio is unavailable. */ }
}
export default function StudyTimer({ setting, cards, sessions, focusedCardId, open, setOpen, onSaveTimer, onLogFocus, onRestartCue }) {
  const [timer, setTimer] = useState(() => makeTimer(dataOf(setting)))
  const [selectedCardId, setSelectedCardId] = useState(focusedCardId || dataOf(setting).cardId || '')
  const [now, setNow] = useState(Date.now()), [busy, setBusy] = useState(false), [error, setError] = useState(''), [restartCue, setRestartCue] = useState('')
  const completing = useRef(false), timerRef = useRef(timer)
  timerRef.current = timer
  useEffect(() => { setTimer(makeTimer(dataOf(setting))) }, [setting?.id, setting?.revision])
  useEffect(() => { if (focusedCardId) setSelectedCardId(focusedCardId) }, [focusedCardId])
  useEffect(() => { const handle = setInterval(() => setNow(Date.now()), 1000); const refresh = () => setNow(Date.now()); window.addEventListener('focus', refresh); return () => { clearInterval(handle); window.removeEventListener('focus', refresh) } }, [])
  const cardId = selectedCardId || timer.cardId
  const card = cards.find(row => row.id === cardId)
  const remaining = timerRemaining(timer, now)
  const boundaries = sessions.filter(row => row.start_at && Date.parse(row.end_at || row.start_at) >= now && !['cancelled', 'archived'].includes(row.status)).sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at)).slice(0, 2)
  async function save(next) {
    await onSaveTimer({ ...next, key: 'focusTimer' })
    setTimer(next)
  }
  async function logSegment(current) {
    if (current.mode !== 'focus' || !current.cardId) return
    const minutes = minutesToLog(timerElapsed(current))
    if (minutes > 0) await onLogFocus(current.cardId, minutes, current.segmentId || current.deadlineAt || crypto.randomUUID())
  }
  async function finish() {
    if (completing.current) return
    completing.current = true; setBusy(true); setError('')
    try {
      const current = timerRef.current
      await logSegment(current)
      const count = (Number(current.completedSessions) || 0) + (current.mode === 'focus' ? 1 : 0)
      const nextMode = current.mode === 'focus' ? (count % 4 === 0 ? 'long' : 'short') : 'focus'
      await save({ ...current, mode: nextMode, completedSessions: count, remainingSeconds: current.durations[nextMode] * 60, running: false, elapsedMs: 0, segmentStartedAt: null, deadlineAt: null, segmentId: null })
      chime()
    } catch (cause) { setError(`The block ended, but its log could not be saved: ${cause.message}`) } finally { setBusy(false); completing.current = false }
  }
  useEffect(() => { if (timer.running && remaining === 0 && !error) finish() }, [timer.running, remaining, error])
  async function action(kind, value) {
    if (busy) return
    setBusy(true); setError('')
    try {
      let next = { ...timerRef.current }
      if (next.running) {
        await logSegment(next)
        next = { ...next, remainingSeconds: timerRemaining(next), running: false, elapsedMs: 0, segmentStartedAt: null, deadlineAt: null, segmentId: null }
      }
      if (kind === 'toggle' && !timerRef.current.running) {
        const duration = next.remainingSeconds || next.durations[next.mode] * 60
        const started = Date.now()
        next = { ...next, cardId: cardId || null, running: true, remainingSeconds: duration, segmentStartedAt: new Date(started).toISOString(), deadlineAt: new Date(started + duration * 1000).toISOString(), segmentId: crypto.randomUUID() }
      }
      if (kind === 'mode') next = { ...next, mode: value, remainingSeconds: next.durations[value] * 60 }
      if (kind === 'reset') next = { ...next, remainingSeconds: next.durations[next.mode] * 60 }
      if (kind === 'duration') next = { ...next, durations: { ...next.durations, [value.mode]: value.minutes }, remainingSeconds: value.mode === next.mode ? value.minutes * 60 : next.remainingSeconds }
      if (kind === 'preset') { const durations = value === '50-10' ? { focus: 50, short: 10, long: 20 } : { focus: 25, short: 5, long: 15 }; next = { ...next, durations, remainingSeconds: durations[next.mode] * 60 } }
      if (kind === 'card') next.cardId = value || null
      await save(next)
      if (kind === 'card') setSelectedCardId(value || '')
    } catch (cause) { setError(cause.message) } finally { setBusy(false) }
  }
  return <>
    <button type="button" className="study-timer-trigger" onClick={() => setOpen(true)} aria-label="Open study focus timer">{timer.running ? `${MODES[timer.mode]} ${format(remaining)}` : 'Focus timer'}</button>
    {open && <StudyDialog title={card ? `Focus: ${titleOf(card)}` : 'Focus timer'} wide onClose={() => setOpen(false)}>
      <div className="study-focus-room"><section className="study-focus-controls">
        <label>Card<select value={cardId || ''} disabled={busy || timer.running} onChange={e => action('card', e.target.value)}><option value="">Unassigned timer</option>{cards.filter(row => dataOf(row).done !== true).map(row => <option key={row.id} value={row.id}>{titleOf(row)}</option>)}</select></label>
        <div className="study-actions">{Object.entries(MODES).map(([mode, label]) => <button type="button" key={mode} aria-pressed={mode === timer.mode} disabled={busy} onClick={() => action('mode', mode)}>{label}</button>)}</div>
        <output className="study-timer-face" aria-label={`${MODES[timer.mode]}, ${format(remaining)} remaining`}>{format(remaining)}</output>
        <div className="study-actions"><button type="button" className="study-primary" disabled={busy} onClick={() => action('toggle')}>{busy ? 'Saving…' : timer.running ? 'Pause & log' : 'Start'}</button><button type="button" disabled={busy} onClick={() => action('reset')}>Log & reset</button></div>
        <p className="study-muted">Focus time is logged to its card. Timer settings and the deadline survive reload; sleep time is capped at the block’s end.</p>
        <div className="study-actions"><button type="button" disabled={busy} onClick={() => action('preset', '25-5')}>25 / 5</button><button type="button" disabled={busy} onClick={() => action('preset', '50-10')}>50 / 10</button></div>
        <div className="study-form-row">{Object.entries(MODES).map(([mode, label]) => <label key={mode}>{label} minutes<input type="number" min="1" max="120" value={timer.durations[mode]} disabled={busy} onChange={e => { const minutes = Number(e.target.value); if (minutes >= 1 && minutes <= 120) action('duration', { mode, minutes }) }} /></label>)}</div>
        <p>{timer.completedSessions || 0} completed focus blocks</p>
        {error && <div className="study-error" role="alert"><p>{error}</p>{timer.running && remaining === 0 && <button type="button" disabled={busy} onClick={finish}>Retry logging</button>}</div>}
      </section><aside className="study-focus-brief">
        {card && <><p className="study-eyebrow">Finish when</p><h3>{dataOf(card).doneCondition || 'No finish condition recorded.'}</h3><p>{dataOf(card).evidenceRequirement}</p></>}
        <p className="study-eyebrow">Schedule boundaries</p>{boundaries.length ? boundaries.map(row => <p key={row.id}><strong>{localClock(row.start_at)} · {titleOf(row)}</strong>{dataOf(row).location && <span> · {dataOf(row).location}</span>}</p>) : <p className="study-muted">No upcoming timetable boundary is recorded.</p>}
        {card && <form className="study-form" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await onRestartCue(card.id, restartCue.trim()); setRestartCue('') } catch (cause) { setError(cause.message) } finally { setBusy(false) } }}><label>Make restarting easy<textarea placeholder="One exact next move for your future self" value={restartCue} onChange={e => setRestartCue(e.target.value)} /></label><button type="submit" disabled={busy || !restartCue.trim()}>Save restart note</button></form>}
      </aside></div>
    </StudyDialog>}
  </>
}
