// Health → Exercise: log or plan a session, a session's own card, programmes that put their
// sessions on the calendar, the exercise library, and what was done week by week.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays } from '../../lib/calendar.js'
import { formatCalendarDay } from '../../lib/calendar.js'
import { clockOf } from '../../lib/day.js'
import { startOf } from '../../lib/useHealth.js'
import { ACTIVITIES, EFFORTS, SOURCES, activity } from '../../../../shared/health/guidance.js'
import { EXERCISES, MUSCLE_GROUPS, PLACES, exercise } from '../../../../shared/health/exercises.js'
import { PROGRAMMES, programmeSession, scheduleProgramme } from '../../../../shared/health/programmes.js'
import { dayOf, isDone, isSkipped, sessionCounts, weekStart } from '../../../../shared/health/week.js'
import { Meter, SessionLine, Source, minutesText } from './parts.jsx'

const WEEKDAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']]
const clockIn = (entry) => (String(entry?.start_at ?? '').length > 10 ? clockOf(entry.start_at) : '')

// Log what was done, or plan a session for a day; the same form changes one already saved.
function SessionForm({ page, entry, mode, onDone, pick }) {
  const d = entry?.details ?? {}
  const first = { kind: d.kind ?? 'walk', title: entry?.title ?? '', day: entry ? dayOf(entry) : mode === 'plan' ? addDays(page.today, 1) : page.today, time: clockIn(entry), minutes: String(d.duration_min ?? 30), effort: d.effort ?? activity(d.kind ?? 'walk').effort, strength: d.strength ?? Boolean(activity(d.kind ?? 'walk').strength), exercises: d.exercises ?? '', note: d.note ?? '' }
  const [form, setForm] = useState(first)
  const [state, setState] = useState({ saving: false, error: '' })
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  useEffect(() => { if (pick) setForm((current) => ({ ...current, exercises: `${current.exercises.trim() ? `${current.exercises.trim()}\n` : ''}${pick.line}` })) }, [pick])
  const chooseKind = (kind) => setForm((current) => ({ ...current, kind, effort: activity(kind).effort, strength: Boolean(activity(kind).strength) }))
  async function save(event) {
    event.preventDefault()
    const minutes = Number(form.minutes)
    if (!(minutes > 0 && minutes <= 1440)) { setState({ saving: false, error: 'Say how many minutes' }); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.day)) { setState({ saving: false, error: 'Choose the day' }); return }
    setState({ saving: true, error: '' })
    // Minutes by effort: kept as they were for a programme's session unless the minutes or the effort changed.
    const same = entry && Number(d.duration_min) === minutes && (d.effort ?? activity(d.kind).effort) === form.effort
    const effortMinutes = same && (d.moderate_min !== undefined || d.vigorous_min !== undefined) ? { moderate_min: d.moderate_min ?? 0, vigorous_min: d.vigorous_min ?? 0 }
      : { moderate_min: form.effort === 'moderate' ? minutes : 0, vigorous_min: form.effort === 'vigorous' ? minutes : 0 }
    const body = {
      title: form.title.trim() || activity(form.kind).label, start_at: startOf(form.day, form.time), all_day: !form.time,
      details: { ...d, kind: form.kind, duration_min: minutes, effort: form.effort, ...effortMinutes, strength: form.strength, exercises: form.exercises.trim(), note: form.note.trim(), area: 'body' },
    }
    try {
      const saved = entry ? await page.change(entry.id, body) : await page.create({ type: 'workout', status: mode === 'log' ? 'done' : 'planned', ...body })
      setState({ saving: false, error: '' })
      onDone(saved)
    } catch (failure) { setState({ saving: false, error: `Not saved: ${failure.message}` }) }
  }
  return <form className="entry-editor health-form" onSubmit={save} aria-label={entry ? 'Change the session' : mode === 'log' ? 'Log a session' : 'Plan a session'}>
    <label><span>What</span><select value={form.kind} onChange={(event) => chooseKind(event.target.value)}>{ACTIVITIES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}</select></label>
    <label><span>Name it (optional)</span><input value={form.title} onChange={(event) => set('title', event.target.value)} placeholder={activity(form.kind).label} maxLength={200} /></label>
    <label><span>Day</span><input type="date" value={form.day} onChange={(event) => set('day', event.target.value)} /></label>
    <label><span>Time (optional)</span><input type="time" value={form.time} onChange={(event) => set('time', event.target.value)} /></label>
    <label><span>Minutes</span><input type="number" min="1" max="1440" step="1" value={form.minutes} onChange={(event) => set('minutes', event.target.value)} /></label>
    <fieldset className="entry-editor-wide health-effort"><legend>How hard</legend>
      {EFFORTS.map((e) => <label key={e.key} className="health-choice"><input type="radio" name="effort" checked={form.effort === e.key} onChange={() => set('effort', e.key)} /><span><b>{e.label}</b> {e.test}{e.counts ? '' : ' Not counted towards the 150 minutes.'}</span></label>)}
    </fieldset>
    <label className="entry-editor-wide health-choice"><input type="checkbox" checked={form.strength} onChange={(event) => set('strength', event.target.checked)} /><span>It worked my muscles (weights, bands, body-weight exercises, yoga): it counts as a strength day.</span></label>
    <label className="entry-editor-wide"><span>Exercises, one a line (optional; choose from the library below)</span><textarea rows={3} value={form.exercises} onChange={(event) => set('exercises', event.target.value)} placeholder={'Squat · 3 × 10 · 20 kg\nPlank · 3 × 30 seconds'} /></label>
    <label className="entry-editor-wide"><span>Note (optional)</span><input value={form.note} onChange={(event) => set('note', event.target.value)} maxLength={2000} placeholder="Felt strong; knee a bit sore" /></label>
    {state.error ? <p className="entry-editor-wide entry-editor-error" role="alert">{state.error}</p> : null}
    <p className="entry-editor-wide entry-editor-actions">
      <button type="submit" className="entry-editor-save" disabled={state.saving}>{state.saving ? 'Saving…' : entry ? 'Save the changes' : mode === 'log' ? 'Save: I did this' : 'Put it on the calendar'}</button>
      <button type="button" onClick={() => onDone(null)}>Cancel</button>
    </p>
  </form>
}

// One exercise from the library: how to do it.
function ExerciseCard({ item, onAdd, open, onToggle }) {
  return <li className={`health-exercise${open ? ' is-open' : ''}`}>
    <button type="button" className="health-exercise-head" aria-expanded={open} onClick={onToggle}>
      <b>{item.name}</b><small>{[MUSCLE_GROUPS.find((g) => g.key === item.group)?.label, item.equipment, item.dose].filter(Boolean).join(' · ')}</small>
    </button>
    {open ? <div className="health-exercise-body">
      <ol>{item.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
      {item.tip ? <p className="health-small">{item.tip}</p> : null}
      <p className="health-small">{item.places.map((p) => PLACES.find((x) => x.key === p)?.label).join(', ')}{item.source ? <> · <Source source={SOURCES[item.source]} /></> : null}</p>
      {onAdd ? <button type="button" className="ghost-pill compact-pill" onClick={() => onAdd(item)}>Add to the session</button> : null}
    </div> : null}
  </li>
}

// A session on its own: when, how long, what it counts for, its steps, and what to do with it.
function SessionCard({ page, entry, onEdit, onClose }) {
  const d = entry.details ?? {}, counts = sessionCounts(entry), done = isDone(entry)
  const plan = d.programme ? programmeSession(d.programme, d.session) : null
  const [sure, setSure] = useState(false)
  const [open, setOpen] = useState('')
  const act = (patch) => page.change(entry.id, patch).catch(() => {})
  return <section className="day-panel health-session" aria-labelledby="health-session">
    <header><h2 id="health-session">{entry.title || activity(d.kind).label}</h2><button type="button" className="ghost-pill compact-pill" onClick={onClose}>Close</button></header>
    <p className="health-small">{[formatCalendarDay(dayOf(entry), { weekday: 'long', month: 'long' }), clockIn(entry), activity(d.kind).label, done ? 'done' : isSkipped(entry) ? 'skipped' : 'planned'].filter(Boolean).join(' · ')}</p>
    <p className="health-counts">{minutesText(counts.total)}{counts.counted ? ` · counts ${minutesText(counts.counted)} towards the week's 150` : ' · not counted towards the 150 minutes'}{counts.strength ? ' · a strength day' : ''}</p>
    {plan ? <ol className="health-steps">{plan.steps.map((step, i) => <li key={i}>{step}</li>)}</ol> : null}
    {plan && !['run', 'walk'].includes(plan.kind) ? <ul className="health-exercise-list">{plan.exercises.map((id) => { const item = exercise(id); return item ? <ExerciseCard key={id} item={item} open={open === id} onToggle={() => setOpen(open === id ? '' : id)} /> : null })}</ul> : null}
    {d.exercises ? <pre className="health-exercises-text">{d.exercises}</pre> : null}
    {d.note ? <p>{d.note}</p> : null}
    <p className="entry-editor-actions">
      {done ? <button type="button" onClick={() => act({ status: 'planned' })}>Not done after all</button> : <button type="button" className="entry-editor-save" onClick={() => act({ status: 'done' })}>Done</button>}
      <button type="button" onClick={onEdit}>Change</button>
      {!done ? <button type="button" onClick={() => act({ status: 'skipped' })}>Skip it</button> : null}
      {sure ? <button type="button" className="is-sure" onClick={() => page.remove(entry.id).then(onClose).catch(() => {})}>Remove for good</button> : <button type="button" onClick={() => setSure(true)}>Remove</button>}
    </p>
  </section>
}

// A programme: what it is, and starting it on chosen days (or how far along it is, and stopping it).
function ProgrammeCard({ page, plan }) {
  const mine = page.entries.filter((e) => e.type === 'workout' && e.details?.programme === plan.id)
  const ahead = mine.filter((e) => !isDone(e) && !isSkipped(e)).sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
  const doneCount = mine.filter(isDone).length
  const sessions = plan.sessions()
  const [form, setForm] = useState({ open: false, start: addDays(page.today, 1), days: plan.days, time: '' })
  const [state, setState] = useState({ busy: false, done: 0, error: '', sure: false })
  async function start() {
    let schedule
    try { schedule = scheduleProgramme(plan.id, { start: form.start, days: form.days }) } catch (failure) { setState((s) => ({ ...s, error: failure.message })); return }
    setState({ busy: true, done: 0, error: '', sure: false })
    try {
      for (const [n, { date, session }] of schedule.entries()) {
        await page.create({ type: 'workout', title: session.title, status: 'planned', start_at: startOf(date, form.time), all_day: !form.time,
          details: { kind: session.kind, duration_min: session.minutes, moderate_min: session.moderate, vigorous_min: session.vigorous, strength: session.strength, exercises: session.exercises.map((id) => exercise(id)?.name).filter(Boolean).join('\n'), programme: plan.id, session: session.key, area: 'body' } })
        setState((s) => ({ ...s, done: n + 1 }))
      }
      setState({ busy: false, done: 0, error: '', sure: false })
      setForm((f) => ({ ...f, open: false }))
    } catch (failure) { setState({ busy: false, done: 0, error: `Stopped part way: ${failure.message}. The sessions already added are on the calendar.`, sure: false }) }
  }
  async function stop() {
    setState({ busy: true, done: 0, error: '', sure: false })
    try { for (const e of ahead) await page.remove(e.id); setState({ busy: false, done: 0, error: '', sure: false }) } catch (failure) { setState({ busy: false, done: 0, error: failure.message, sure: false }) }
  }
  const next = ahead[0]
  return <article className="day-panel health-programme">
    <header><h2>{plan.name}</h2></header>
    <p>{plan.say}</p>
    <p className="health-small">{plan.weeks} weeks · {plan.perWeek} a week · {sessions.length} sessions · by {plan.by} · <Source source={SOURCES[plan.source]} /></p>
    {ahead.length || doneCount ? <>
      <Meter part={doneCount} whole={sessions.length} label={`${doneCount} of ${sessions.length} done`} />
      <p className="review-note">{doneCount} of {sessions.length} done{next ? <> · next: <Link to={`/health?view=exercise&entry=${encodeURIComponent(next.id)}`}>{next.title}</Link>, {formatCalendarDay(dayOf(next), { weekday: 'long' })}</> : ''}</p>
      {ahead.length ? (state.sure ? <p className="entry-editor-actions"><button type="button" className="is-sure" disabled={state.busy} onClick={stop}>Take its {ahead.length} planned sessions off the calendar</button><button type="button" onClick={() => setState((s) => ({ ...s, sure: false }))}>Keep them</button></p>
        : <p className="entry-editor-actions"><button type="button" onClick={() => setState((s) => ({ ...s, sure: true }))}>Stop the programme</button></p>) : null}
    </> : form.open ? <div className="entry-editor health-form">
      <label><span>Start on</span><input type="date" value={form.start} onChange={(event) => setForm((f) => ({ ...f, start: event.target.value }))} /></label>
      <label><span>At (optional)</span><input type="time" value={form.time} onChange={(event) => setForm((f) => ({ ...f, time: event.target.value }))} /></label>
      <fieldset className="entry-editor-wide"><legend>On these days</legend><span className="day-add-days" role="group">{WEEKDAYS.map(([n, label]) => <button key={n} type="button" aria-pressed={form.days.includes(n)} onClick={() => setForm((f) => ({ ...f, days: f.days.includes(n) ? f.days.filter((x) => x !== n) : [...f.days, n] }))}>{label}</button>)}</span></fieldset>
      <p className="entry-editor-wide health-small">{form.days.length ? `${form.days.length} a week: the ${sessions.length} sessions take about ${Math.ceil(sessions.length / form.days.length)} weeks.` : 'Choose at least one day.'}{plan.id === 'c25k' && form.days.length > 3 ? ' The NHS plan leaves a rest day between runs.' : ''}</p>
      <p className="entry-editor-wide entry-editor-actions"><button type="button" className="entry-editor-save" disabled={state.busy || !form.days.length} onClick={start}>{state.busy ? `Adding ${state.done} of ${sessions.length}…` : `Put the ${sessions.length} sessions on the calendar`}</button><button type="button" onClick={() => setForm((f) => ({ ...f, open: false }))}>Cancel</button></p>
    </div> : <p className="entry-editor-actions"><button type="button" className="entry-editor-save" onClick={() => setForm((f) => ({ ...f, open: true }))}>Start</button></p>}
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
  </article>
}

export default function HealthExercise({ page }) {
  const { params, setParams, today } = page
  const entryId = params.get('entry')
  const entry = page.entries.find((e) => e.id === entryId)
  const mode = params.get('log') ? 'log' : params.get('plan') ? 'plan' : params.get('edit') ? 'edit' : ''
  const close = () => setParams({ view: 'exercise' })
  const [words, setWords] = useState('')
  const [group, setGroup] = useState('')
  const [place, setPlace] = useState('')
  const [open, setOpen] = useState('')
  const [pick, setPick] = useState(null)
  const shown = EXERCISES.filter((x) => (!group || x.group === group) && (!place || x.places.includes(place)) && (!words.trim() || `${x.name} ${x.equipment} ${x.steps.join(' ')}`.toLowerCase().includes(words.trim().toLowerCase())))
  // What was done, week by week, newest first.
  const history = useMemo(() => {
    const weeks = new Map()
    for (const e of page.entries.filter((x) => x.type === 'workout' && isDone(x))) {
      const key = weekStart(dayOf(e))
      if (!weeks.has(key)) weeks.set(key, [])
      weeks.get(key).push(e)
    }
    return [...weeks].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).map(([from, rows]) => ({ from, rows: rows.sort((a, b) => dayOf(b).localeCompare(dayOf(a))), minutes: rows.reduce((n, e) => n + sessionCounts(e).counted, 0), strength: new Set(rows.filter((e) => sessionCounts(e).strength).map(dayOf)).size }))
  }, [page.entries])
  const upcoming = page.week.planned.filter((row) => row.day >= today)
  return <>
    <div className="health-actions entry-editor-actions">
      <button type="button" className="entry-editor-save" onClick={() => setParams({ view: 'exercise', log: '1' })}>Log a session</button>
      <button type="button" onClick={() => setParams({ view: 'exercise', plan: '1' })}>Plan a session</button>
    </div>
    {mode === 'log' || mode === 'plan' ? <SessionForm key={mode} page={page} mode={mode} pick={pick} onDone={(saved) => setParams(saved ? { view: 'exercise', entry: saved.id } : { view: 'exercise' })} /> : null}
    {entry && mode === 'edit' ? <SessionForm key={`edit-${entry.id}`} page={page} entry={entry} mode="edit" pick={pick} onDone={() => setParams({ view: 'exercise', entry: entry.id })} /> : null}
    {entry && mode !== 'edit' ? <SessionCard page={page} entry={entry} onEdit={() => setParams({ view: 'exercise', entry: entry.id, edit: '1' })} onClose={close} /> : null}
    {entryId && !entry && !page.loading ? <p className="day-quiet">That session is no longer here.</p> : null}

    <div className="health-grid">
      <section className="day-panel" aria-labelledby="health-this-week">
        <header><h2 id="health-this-week">This week</h2><Link to="/health">The week</Link></header>
        <p className="review-value">{page.week.minutes}<small> of 150 active minutes · {page.week.strengthDays} of 2 strength days</small></p>
        {page.week.sessions.length ? <ul className="day-list">{page.week.sessions.map((row) => <SessionLine key={row.entry.id} row={row} page={page} today={today} />)}</ul> : <p className="day-quiet">Nothing logged or planned this week yet.</p>}
        {upcoming.length ? null : <p className="day-more"><Link to="/health?view=exercise&plan=1">Plan a session</Link></p>}
      </section>
      <section className="day-panel" aria-labelledby="health-history">
        <header><h2 id="health-history">Week by week</h2></header>
        {history.length ? <ul className="day-list health-history">{history.map((w) => <li key={w.from}><span>{formatCalendarDay(w.from, { weekday: undefined })} week</span>
          <Meter part={w.minutes} whole={150} label={`${w.minutes} of 150 minutes`} />
          <small>{minutesText(w.minutes)} counted · {w.strength} strength {w.strength === 1 ? 'day' : 'days'} · {w.rows.length} {w.rows.length === 1 ? 'session' : 'sessions'}</small></li>)}</ul>
          : <p className="day-quiet">Sessions you log show here, a week at a time.</p>}
      </section>
    </div>

    <h2 className="health-section-head" id="health-programmes">Programmes</h2>
    <p className="health-small">A programme puts each of its sessions on the calendar on the days you choose. Each session opens with its steps; tick it done when it is.</p>
    <div className="health-cards">{PROGRAMMES.map((plan) => <ProgrammeCard key={plan.id} page={page} plan={plan} />)}</div>

    <h2 className="health-section-head" id="health-library">Exercises</h2>
    <div className="health-filters">
      <label><span>Find</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="Squat, plank, stretch…" /></label>
      <label><span>Works</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="">Everything</option>{MUSCLE_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}</select></label>
      <label><span>Where</span><select value={place} onChange={(event) => setPlace(event.target.value)}><option value="">Anywhere</option>{PLACES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
    </div>
    <ul className="health-exercise-list">{shown.map((item) => <ExerciseCard key={item.id} item={item} open={open === item.id} onToggle={() => setOpen(open === item.id ? '' : item.id)}
      onAdd={mode ? (x) => setPick({ line: `${x.name} · ${x.dose}`, at: Date.now() }) : null} />)}</ul>
    {!shown.length ? <p className="day-quiet">No exercise matches. Clear the search or the filters.</p> : null}
    <p className="health-small">How-to words are written for Life OS. For videos, the NHS has free workouts: <Source source={SOURCES.fitnessStudio} />. If something hurts, stop; if you have a health condition, ask your GP before starting something new.</p>
  </>
}
