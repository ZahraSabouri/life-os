// A week looked back on, across every part of Life OS: what was planned and what happened in
// Study, Jobs, her own plans, Home and money, and the time she focused. The Study hub keeps
// its own Review, Progress and Analytics for study in depth; this is the whole week.
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isDateKey } from '../../../shared/calendar.js'
import { apiFetch } from '../lib/api.js'
import { addDays, formatCalendarDay } from '../lib/calendar.js'
import { useSetting } from '../lib/settings.js'
import { useLondonToday } from '../lib/useCalendar.js'
import { count, pounds } from './DayParts.jsx'
import AnalysisView from './AnalysisView.jsx'

const mondayOf = (date) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7))
// 75 -> "1 h 15", 40 -> "40 min"
const span = (minutes) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}` : `${minutes} min`)

function useReview(from, to) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [turn, setTurn] = useState(0)
  useEffect(() => {
    let off = false
    setState((current) => ({ ...current, loading: true, error: '' }))
    apiFetch(`/api/review?${new URLSearchParams({ from, to })}`)
      .then((data) => { if (!off) setState({ data, error: '', loading: false }) })
      .catch((failure) => { if (!off) setState({ data: null, error: failure.message, loading: false }) })
    return () => { off = true }
  }, [from, to, turn])
  // The parts are changed elsewhere; read again when the window is looked at again.
  useEffect(() => {
    const again = () => setTurn((value) => value + 1)
    window.addEventListener('focus', again)
    return () => window.removeEventListener('focus', again)
  }, [])
  return state
}

// "2 more than the week before". The words carry the direction; the mark only repeats it.
// `than` names what it is compared with: the whole week before, or the same days of it.
function Delta({ now, before, than, words = (value) => String(value) }) {
  if (before === null || before === undefined) return null
  const change = now - before
  return <p className="review-delta" data-direction={change > 0 ? 'up' : change < 0 ? 'down' : 'same'}>
    <span aria-hidden="true">{change > 0 ? '▲' : change < 0 ? '▼' : '='}</span>
    {change === 0 ? `the same as ${than}` : `${words(Math.abs(change))} ${change > 0 ? 'more' : 'less'} than ${than}`}
  </p>
}

// The four measures the tiles compare, summed over some days.
function measured(days) {
  const sum = (pick) => days.reduce((total, row) => total + pick(row), 0)
  return { cardsDone: sum((row) => row.study.cardsDone), focus: sum((row) => row.focus.total), sent: sum((row) => row.jobs.sent), plansDone: sum((row) => row.plans.done) }
}

// A part against its whole: the fill on a lighter track of the same colour. Over the whole, it says so in words.
function Meter({ part, whole, label }) {
  if (!(whole > 0)) return null
  const over = part > whole
  return <div className={`review-meter${over ? ' is-over' : ''}`} role="img" aria-label={label}>
    <span style={{ width: `${Math.min(100, Math.round((part / whole) * 100))}%` }} />
  </div>
}

function Tile({ label, value, unit, children, href, open }) {
  return <article className="day-panel review-tile">
    <header><h2>{label}</h2>{href ? <Link to={href}>{open}</Link> : null}</header>
    <p className="review-value">{value}{unit ? <small> {unit}</small> : null}</p>
    {children}
  </article>
}

function Tiles({ data, before, aims }) {
  const { totals, study, jobs, plans, home } = data
  // This week is not over: compare it with the week before up to the same weekday.
  const elapsed = data.today >= data.from && data.today < data.to ? data.days.filter((row) => row.date <= data.today).length : 0
  const was = before ? measured(elapsed ? before.days.slice(0, elapsed) : before.days) : null
  const than = elapsed ? `by ${formatCalendarDay(data.today, { weekday: 'long', day: undefined, month: undefined })} of the week before` : 'the week before'
  const month = home?.money ? formatCalendarDay(`${home.money.month}-01`, { weekday: undefined, day: undefined, month: 'long' }) : ''
  const focusParts = [['study', 'study'], ['jobs', 'jobs'], ['other', 'other things']].filter(([key]) => totals.focus[key] > 0).map(([key, name]) => `${name} ${span(totals.focus[key])}`)
  return <div className="review-tiles">
    <Tile label="Study cards done" value={totals.study.cardsDone} href="/study" open="Study hub">
      {study ? <>
        <Meter part={study.cardsDueDone} whole={study.cardsDue} label={`${study.cardsDueDone} of ${study.cardsDue} cards due this week are done`} />
        <p className="review-note">{study.cardsDue ? `${study.cardsDueDone} of the ${count(study.cardsDue, 'card')} due this week` : 'No card is due this week'}{totals.study.steps ? ` · ${count(totals.study.steps, 'step')} ticked` : ''}</p>
        {study.next ? <p className="review-note">{study.next.title}: {formatCalendarDay(study.next.date, { weekday: 'long' })}</p> : null}
      </> : <p className="review-note day-warn">The Study hub could not be read.</p>}
      <Delta now={totals.study.cardsDone} before={was?.cardsDone} than={than} />
    </Tile>
    <Tile label="Focused" value={span(totals.focus.total)} unit={aims.focusMinutesPerDay ? `of ${span(aims.focusMinutesPerDay * 7)}` : ''}>
      {aims.focusMinutesPerDay ? <Meter part={totals.focus.total} whole={aims.focusMinutesPerDay * 7} label={`${span(totals.focus.total)} focused of the ${span(aims.focusMinutesPerDay * 7)} aimed at this week`} /> : null}
      <p className="review-note">{focusParts.length ? focusParts.join(' · ') : 'No focus session yet this week. The Focus button is in the top bar.'}</p>
      {totals.study.plannedMinutes ? <p className="review-note">{span(totals.study.plannedMinutes)} of study is on the plan for the week</p> : null}
      <Delta now={totals.focus.total} before={was?.focus} than={than} words={span} />
    </Tile>
    <Tile label="Applications sent" value={totals.jobs.sent} unit={aims.applicationsPerWeek ? `of ${aims.applicationsPerWeek}` : ''} href="/jobmap" open="JobMap">
      {aims.applicationsPerWeek ? <Meter part={totals.jobs.sent} whole={aims.applicationsPerWeek} label={`${totals.jobs.sent} of the ${aims.applicationsPerWeek} applications aimed at this week`} /> : null}
      {jobs ? <p className="review-note">{totals.jobs.setAsideMinutes ? `${span(totals.jobs.setAsideMinutes)} set aside` : totals.jobs.setAside ? `time set aside on ${count(totals.jobs.setAside, 'day')}` : 'no time set aside'}{totals.focus.jobs ? ` · ${span(totals.focus.jobs)} focused` : ''} · {jobs.sentEver} sent in all</p>
        : <p className="review-note day-warn">JobMap could not be read.</p>}
      <Delta now={totals.jobs.sent} before={was?.sent} than={than} />
    </Tile>
    <Tile label="Your plans done" value={totals.plans.done} unit={`of ${totals.plans.made}`}>
      <Meter part={totals.plans.done} whole={totals.plans.made} label={`${totals.plans.done} of ${totals.plans.made} plans done`} />
      <p className="review-note">{plans?.open.count ? `${count(plans.open.count, 'plan')} left unticked on days that have gone` : totals.plans.made ? 'Nothing is left over from days that have gone' : 'No plan of your own this week'}{totals.notes ? ` · ${count(totals.notes, 'note')}` : ''}</p>
      <Delta now={totals.plans.done} before={was?.plansDone} than={than} />
    </Tile>
    <Tile label={home?.money ? `Spent in ${month}` : 'Home'} value={home?.money ? pounds(home.money.spentPence) : totals.home.ticked} unit={home?.money ? `of ${pounds(home.money.budgetPence)}` : 'ticked off'} href="/budget" open="Budget">
      {home ? <>
        {home.money ? <Meter part={home.money.spentPence} whole={home.money.budgetPence} label={`${pounds(home.money.spentPence)} of ${pounds(home.money.budgetPence)} spent`} /> : null}
        {home.money ? <p className={`review-note${home.money.leftPence < 0 ? ' day-warn' : ''}`}>{home.money.leftPence < 0 ? `Over the month's budget by ${pounds(-home.money.leftPence)}` : `${pounds(home.money.leftPence)} left for the month`}</p> : null}
        <p className="review-note">{count(totals.home.ticked, 'thing')} ticked off this week · {home.toBuy} still to buy</p>
      </> : <p className="review-note day-warn">Budget could not be read.</p>}
    </Tile>
  </div>
}

// The week day by day. Every number is in its own column with its own unit; only focus time has
// a bar, so one length means one thing.
function Days({ data }) {
  const longest = Math.max(1, ...data.days.map((row) => row.focus.total))
  const quiet = (value, shown = value) => (value ? shown : <span className="review-none" aria-label="none">·</span>)
  return <section className="day-panel review-days" aria-labelledby="review-days-heading">
    <header><h2 id="review-days-heading">Day by day</h2></header>
    <div className="review-scroll">
      <table>
        <thead><tr>
          <th scope="col">Day</th><th scope="col">Study on the plan</th><th scope="col">Cards done</th><th scope="col">Steps ticked</th><th scope="col" className="review-wide">Focused</th>
          <th scope="col">Applications</th><th scope="col">Plans done</th><th scope="col">Ticked off</th><th scope="col">Spent</th><th scope="col">Notes</th>
        </tr></thead>
        <tbody>
          {data.days.map((row) => {
            const ahead = row.date > data.today
            return <tr key={row.date} className={row.date === data.today ? 'is-today' : ahead ? 'is-ahead' : undefined}>
              <th scope="row"><Link to={`/today?date=${row.date}`}>{formatCalendarDay(row.date, { weekday: 'short', month: undefined })}</Link>{row.date === data.today ? <small> today</small> : null}</th>
              <td>{quiet(row.study.plannedMinutes, span(row.study.plannedMinutes))}</td>
              <td>{quiet(row.study.cardsDone || row.study.cardsDue, `${row.study.cardsDone}${row.study.cardsDue ? ` of ${row.study.cardsDue} due` : ''}`)}</td>
              <td>{quiet(row.study.steps)}</td>
              <td className="review-wide">{row.focus.total ? <span className="review-bar" title={`${span(row.focus.total)} focused: study ${span(row.focus.study)}, jobs ${span(row.focus.jobs)}, other ${span(row.focus.other)}`}><i style={{ width: `${Math.max(3, Math.round((row.focus.total / longest) * 100))}%` }} /><b>{span(row.focus.total)}</b></span> : quiet(0)}</td>
              <td>{quiet(row.jobs.sent)}</td>
              <td>{quiet(row.plans.made, `${row.plans.done} of ${row.plans.made}`)}</td>
              <td>{quiet(row.home.ticked)}</td>
              <td>{quiet(row.home.spentPence, pounds(row.home.spentPence))}</td>
              <td>{quiet(row.notes)}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </section>
}

function Slipped({ data }) {
  const late = data.study?.late ?? { count: 0, cards: [] }
  const open = data.plans?.open ?? { count: 0, plans: [] }
  const missed = data.jobs?.missed ?? { count: 0, jobs: [] }
  if (!late.count && !open.count && !missed.count) return <section className="day-panel review-slipped"><header><h2>What slipped</h2></header><p className="day-quiet">Nothing: no card is past its date, no plan is left over, no shortlisted job closed without an application.</p></section>
  return <section className="day-panel review-slipped" aria-labelledby="review-slipped-heading">
    <header><h2 id="review-slipped-heading">What slipped</h2></header>
    <div className="review-slipped-lists">
      {late.count ? <div><h3>{count(late.count, 'study card')} past {late.count === 1 ? 'its' : 'their'} date</h3>
        <ul className="day-list">{late.cards.map((card) => <li key={card.id}><Link to={card.href}>{card.title}</Link><small>was due {formatCalendarDay(card.due)}</small></li>)}</ul>
        {late.count > late.cards.length ? <p className="day-more">and {late.count - late.cards.length} more in the <Link to="/study">Study hub</Link></p> : null}</div> : null}
      {open.count ? <div><h3>{count(open.count, 'plan')} left unticked</h3>
        <ul className="day-list">{open.plans.map((plan) => <li key={plan.id}><Link to={plan.href}>{plan.title}</Link><small>{formatCalendarDay(plan.date)}</small></li>)}</ul>
        {open.count > open.plans.length ? <p className="day-more">and {open.count - open.plans.length} more</p> : null}</div> : null}
      {missed.count ? <div><h3>{count(missed.count, 'shortlisted job')} closed without an application</h3>
        <ul className="day-list">{missed.jobs.map((job) => <li key={job.id}><Link to={job.href}>{job.role}<em> · {job.company}</em></Link><small>closed {formatCalendarDay(job.deadline)}</small></li>)}</ul>
        {missed.count > missed.jobs.length ? <p className="day-more">and {missed.count - missed.jobs.length} more</p> : null}</div> : null}
    </div>
  </section>
}

// Eight weeks side by side, one small chart for each measure. The week being looked at is in the
// accent colour and the others step back, so the eye lands on "how does this week compare".
// A measure with an aim has its line; every column says its value when pointed at.
function Weeks({ title, weeks, pick, say = (value) => String(value), aim = 0, aimWords = '' }) {
  const values = weeks.map((week) => pick(week))
  const top = Math.max(1, aim, ...values)
  return <figure className="review-weeks">
    <figcaption><b>{title}</b>{aim ? <span>aim: {aimWords}</span> : null}</figcaption>
    <div className="review-columns" role="img" aria-label={`${title}, week by week: ${weeks.map((week, index) => `${formatCalendarDay(week.from, { weekday: undefined })} ${say(values[index])}`).join(', ')}`}>
      {aim ? <i className="review-aim" style={{ bottom: `${(aim / top) * 82}%` }} aria-hidden="true" /> : null}
      {weeks.map((week, index) => <div key={week.from} className={`review-column${week.current ? ' is-current' : ''}`} title={`Week of ${formatCalendarDay(week.from, { weekday: undefined })}: ${say(values[index])}`}>
        {week.current || values[index] === Math.max(...values) && values[index] > 0 ? <b>{say(values[index])}</b> : null}
        <span style={{ height: `${values[index] ? Math.max(3, (values[index] / top) * 82) : 0}%` }} />
      </div>)}
    </div>
    <div className="review-column-labels" aria-hidden="true">{weeks.map((week, index) => <span key={week.from}>{index === 0 || week.current || index === weeks.length - 1 ? formatCalendarDay(week.from, { weekday: undefined }) : ''}</span>)}</div>
  </figure>
}

function Aims({ aims, setAims }) {
  const [applications, setApplications] = useState('')
  const [focus, setFocus] = useState('')
  const [open, setOpen] = useState(false)
  function begin() { setApplications(aims.applicationsPerWeek ? String(aims.applicationsPerWeek) : ''); setFocus(aims.focusMinutesPerDay ? String(aims.focusMinutesPerDay / 60) : ''); setOpen(true) }
  function save(event) {
    event.preventDefault()
    const perWeek = Math.max(0, Math.min(200, Math.round(Number(applications)) || 0))
    const perDay = Math.max(0, Math.min(16, Number(focus) || 0))
    setAims({ applicationsPerWeek: perWeek, focusMinutesPerDay: Math.round(perDay * 60) })
    setOpen(false)
  }
  const said = [aims.applicationsPerWeek ? `${count(aims.applicationsPerWeek, 'application')} a week` : '', aims.focusMinutesPerDay ? `${span(aims.focusMinutesPerDay)} of focus a day` : ''].filter(Boolean)
  if (!open) return <p className="review-aims">{said.length ? <>You aim at {said.join(' and ')}. </> : <>No aim is set, so the figures only count. </>}<button type="button" onClick={begin}>{said.length ? 'Change' : 'Set what you aim at'}</button></p>
  return <form className="review-aims is-open" onSubmit={save}>
    <label>Applications a week<input type="number" min="0" max="200" step="1" value={applications} onChange={(event) => setApplications(event.target.value)} placeholder="5" /></label>
    <label>Hours of focus a day<input type="number" min="0" max="16" step="0.25" value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="3" /></label>
    <button type="submit">Keep</button>
    <button type="button" className="is-quiet" onClick={() => setOpen(false)}>Leave as it is</button>
    <span>Leave one empty for no aim.</span>
  </form>
}

function Progress({ data, current, aims, setAims }) {
  if (!data) return null
  const weeks = []
  for (let from = data.from; from <= data.to; from = addDays(from, 7)) {
    const days = data.days.filter((row) => row.date >= from && row.date <= addDays(from, 6))
    const sum = (pick) => days.reduce((total, row) => total + pick(row), 0)
    weeks.push({ from, current: from === current, sent: sum((row) => row.jobs.sent), focus: sum((row) => row.focus.total), cards: sum((row) => row.study.cardsDone), plans: sum((row) => row.plans.done) })
  }
  const study = data.study
  return <section className="day-panel review-progress" aria-labelledby="review-progress-heading">
    <header><h2 id="review-progress-heading">Eight weeks</h2></header>
    <Aims aims={aims} setAims={setAims} />
    <div className="review-weeks-grid">
      <Weeks title="Applications sent" weeks={weeks} pick={(week) => week.sent} aim={aims.applicationsPerWeek} aimWords={`${aims.applicationsPerWeek} a week`} />
      <Weeks title="Time focused" weeks={weeks} pick={(week) => week.focus} say={span} aim={aims.focusMinutesPerDay * 7} aimWords={`${span(aims.focusMinutesPerDay * 7)} a week`} />
      <Weeks title="Study cards done" weeks={weeks} pick={(week) => week.cards} />
      <Weeks title="Your plans done" weeks={weeks} pick={(week) => week.plans} />
    </div>
    {study?.cardsTotal ? <div className="review-semester">
      <p><b>This semester</b> {study.cardsDone} of {count(study.cardsTotal, 'study card')} done{study.next ? ` · ${study.next.title} on ${formatCalendarDay(study.next.date, { weekday: 'long' })}` : ''}</p>
      <Meter part={study.cardsDone} whole={study.cardsTotal} label={`${study.cardsDone} of ${study.cardsTotal} study cards done this semester`} />
    </div> : null}
  </section>
}

export default function ReviewView() {
  const today = useLondonToday()
  const [params, setParams] = useSearchParams()
  const asked = params.get('week')
  const from = mondayOf(isDateKey(asked) ? asked : today)
  const to = addDays(from, 6)
  const thisWeek = from === mondayOf(today)
  const review = useReview(from, to)
  const before = useReview(addDays(from, -7), addDays(from, -1))
  // Eight weeks ending with the one shown, for the longer view.
  const long = useReview(addDays(from, -49), to)
  // What she aims at, kept for the whole app: applications a week, minutes of focus a day.
  const [storedAims, setAims] = useSetting('targets', null)
  const aims = { applicationsPerWeek: Number(storedAims?.applicationsPerWeek) > 0 ? Number(storedAims.applicationsPerWeek) : 0, focusMinutesPerDay: Number(storedAims?.focusMinutesPerDay) > 0 ? Number(storedAims.focusMinutesPerDay) : 0 }
  const show = (monday) => setParams(monday === mondayOf(today) ? {} : { week: monday })
  // Two views of the same records: one week in words and tiles, or a longer stretch as data.
  const analysing = params.get('view') === 'analysis'
  const views = <nav className="analysis-views" aria-label="Which view">
    <button type="button" aria-pressed={!analysing} onClick={() => setParams(asked ? { week: asked } : {})}>The week</button>
    <button type="button" aria-pressed={analysing} onClick={() => setParams({ view: 'analysis' })}>Analysis</button>
  </nav>
  if (analysing) return <section className="today-layout unified-today day-page review-page" aria-label="Analysis of your days">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Analysis</h1><span /></div>
      <div className="today-date-stack"><time dateTime={today}>Your days as data</time></div>
    </header>
    {views}
    <AnalysisView today={today} />
  </section>
  const data = review.data
  const hub = (view) => `/study#/${view}${data?.study?.semesterId ? `?semester=${encodeURIComponent(data.study.semesterId)}` : ''}`

  return <section className="today-layout unified-today day-page review-page" aria-label="The week looked back on">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>{thisWeek ? 'This week' : 'The week'}</h1><span /></div>
      <div className="today-date-stack"><time dateTime={from}>{formatCalendarDay(from, { weekday: 'long' })} to {formatCalendarDay(to, { weekday: 'long', year: 'numeric' })}</time></div>
    </header>
    {views}
    <nav className="day-nav" aria-label="Choose a week">
      <button type="button" onClick={() => show(addDays(from, -7))}>‹ The week before</button>
      <button type="button" onClick={() => show(mondayOf(today))} aria-pressed={thisWeek}>This week</button>
      <button type="button" onClick={() => show(addDays(from, 7))} disabled={thisWeek}>The week after ›</button>
    </nav>
    {review.error ? <p className="form-error" role="alert">The week could not be read: {review.error}</p> : null}
    {!data && review.loading ? <p className="day-quiet" role="status">Gathering the week…</p> : null}
    {data ? <>
      <Tiles data={data} before={before.data} aims={aims} />
      <Days data={data} />
      <Slipped data={data} />
      <Progress data={long.data} current={from} aims={aims} setAims={setAims} />
      <div className="today-page-controls">
        <Link className="ghost-pill compact-pill" to="/today">Today</Link>
        <Link className="ghost-pill compact-pill" to={thisWeek ? '/planner' : `/planner?week=${from}`}>Plan this week</Link>
        <Link className="ghost-pill compact-pill" to={hub('review')}>Study hub: Review</Link>
        <Link className="ghost-pill compact-pill" to={hub('progress')}>Study hub: Progress</Link>
        <Link className="ghost-pill compact-pill" to={hub('analytics')}>Study hub: Analytics</Link>
      </div>
    </> : null}
  </section>
}
