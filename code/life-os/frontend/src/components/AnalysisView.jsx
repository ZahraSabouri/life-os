// The Review page's second view: a longer stretch of days looked at as data. Summary
// statistics, plan against done, the shape of a week, hours of the day, each module, the job
// pipeline, where money went, how two measures move together, and the rows themselves as files.
// One accent colour carries every mark; numbers and names stay in the text colours.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isDateKey } from '../../../shared/calendar.js'
import { apiFetch, apiDownload } from '../lib/api.js'
import { addDays, formatCalendarDay } from '../lib/calendar.js'
import { count, pounds } from './DayParts.jsx'

const mondayOf = (date) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7))
const span = (minutes) => (minutes >= 60 ? `${Math.floor(minutes / 60)} h${Math.round(minutes % 60) ? ` ${Math.round(minutes % 60)}` : ''}` : `${Math.round(minutes)} min`)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const RANGES = [[4, '4 weeks'], [8, '8 weeks'], [12, '12 weeks'], [26, '26 weeks']]
const shortDay = (date) => formatCalendarDay(date, { weekday: undefined })
// A value in its unit, as words: minutes as hours, pence as pounds, a count as it is.
const said = (value, unit, exact = true) => (unit === 'min' ? span(value) : unit === 'pence' ? pounds(Math.round(value)) : exact || Number.isInteger(value) ? String(value) : value.toFixed(1))

function useAnalysis(from, to) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  useEffect(() => {
    let off = false
    setState((current) => ({ ...current, loading: true, error: '' }))
    apiFetch(`/api/review/analysis?${new URLSearchParams({ from, to })}`)
      .then((data) => { if (!off) setState({ data, error: '', loading: false }) })
      .catch((failure) => { if (!off) setState({ data: null, error: failure.message, loading: false }) })
    return () => { off = true }
  }, [from, to])
  return state
}

function Block({ id, title, lead, children }) {
  return <section className="day-panel analysis-block" aria-labelledby={`analysis-${id}`}>
    <header><h2 id={`analysis-${id}`}>{title}</h2>{lead ? <p>{lead}</p> : null}</header>
    {children}
  </section>
}

// The numbers behind a chart, for reading exactly and for a screen reader.
function AsTable({ columns, rows, label = 'The numbers' }) {
  return <details className="analysis-numbers"><summary>{label}</summary>
    <div className="review-scroll"><table><thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, at) => (at === 0 ? <th key={at} scope="row">{value}</th> : <td key={at}>{value}</td>))}</tr>)}</tbody></table></div>
  </details>
}

// ---- Summary statistics -------------------------------------------------------------------
function Stats({ data }) {
  return <Block id="stats" title="Summary statistics" lead={`Each measure over the ${count(data.elapsedDays, 'day')} so far in this stretch (days still to come are left out). The deviation is the sample standard deviation.`}>
    <div className="review-scroll"><table className="analysis-table">
      <thead><tr><th scope="col">Measure</th><th scope="col">Total</th><th scope="col">Mean a day</th><th scope="col">Median</th><th scope="col">Std. dev.</th><th scope="col">Most in a day</th><th scope="col">Days with any</th></tr></thead>
      <tbody>{data.stats.map((row) => <tr key={row.id} className={row.total ? undefined : 'is-empty'}>
        <th scope="row">{row.label}</th>
        <td>{said(row.total, row.unit)}</td><td>{said(row.mean, row.unit, false)}</td><td>{said(row.median, row.unit, false)}</td><td>{said(row.sd, row.unit, false)}</td>
        <td>{row.max ? <>{said(row.max, row.unit)} <small>{shortDay(row.maxDate)}</small></> : '·'}</td>
        <td>{row.active} <small>of {row.n}</small></td>
      </tr>)}</tbody>
    </table></div>
  </Block>
}

// ---- Plan against done ----------------------------------------------------------------------
function BurnUp({ data }) {
  const points = data.burnUp
  const top = Math.max(1, ...points.map((point) => point.due), ...points.map((point) => point.done ?? 0))
  const lastDue = points.at(-1)?.due ?? 0
  if (!lastDue && !points.some((point) => point.done)) return <Block id="burn" title="Study: plan against done" lead="No study card is due in these days, and none was done."><p className="day-quiet">Give cards a due date in the Study hub and this fills in.</p></Block>
  const [W, H, L, R, T, B] = [640, 220, 34, 96, 12, 24]
  const x = (index) => L + (points.length > 1 ? (index / (points.length - 1)) * (W - L - R) : 0)
  const y = (value) => T + (H - T - B) * (1 - value / top)
  const line = (pick) => points.map((point, index) => (pick(point) === null ? '' : `${index === 0 || pick(points[index - 1]) === null ? 'M' : 'L'}${x(index).toFixed(1)},${y(pick(point)).toFixed(1)}`)).join(' ')
  const done = points.filter((point) => point.done !== null)
  const today = points.findIndex((point) => point.date === data.today)
  const lastDone = done.at(-1)
  const behind = lastDone ? points[done.length - 1].due - lastDone.done : 0
  return <Block id="burn" title="Study: plan against done" lead={`Cards due and cards done, added up day after day. ${lastDone ? (behind > 0 ? `By today the plan asks for ${points[done.length - 1].due} and ${lastDone.done} ${lastDone.done === 1 ? 'is' : 'are'} done: ${behind} behind.` : behind < 0 ? `By today ${lastDone.done} are done against ${points[done.length - 1].due} due: ${-behind} ahead.` : `By today done and due are level at ${lastDone.done}.`) : ''}`}>
    <ul className="analysis-legend"><li><i className="is-plan" /> Due by then (the plan)</li><li><i className="is-done" /> Done</li></ul>
    <svg className="analysis-lines" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cards due and done, added up: ${lastDue} due by ${shortDay(points.at(-1).date)}, ${lastDone?.done ?? 0} done so far`}>
      {[0, top / 2, top].map((tick) => <g key={tick}><line x1={L} x2={W - R} y1={y(tick)} y2={y(tick)} className="analysis-grid" /><text x={L - 6} y={y(tick) + 3} textAnchor="end" className="analysis-tick">{Math.round(tick)}</text></g>)}
      {today >= 0 ? <g><line x1={x(today)} x2={x(today)} y1={T} y2={H - B} className="analysis-today" /><text x={x(today) - 5} y={T + 9} textAnchor="end" className="analysis-tick">today</text></g> : null}
      <path d={line((point) => point.due)} className="analysis-line is-plan" />
      <path d={line((point) => point.done)} className="analysis-line is-done" />
      {lastDone ? <circle cx={x(done.length - 1)} cy={y(lastDone.done)} r="4" className="analysis-dot" /> : null}
      <text x={x(points.length - 1) + 8} y={y(lastDue) + 4} className="analysis-label">{lastDue} due</text>
      {lastDone ? <text x={x(done.length - 1) + 8} y={y(lastDone.done) + (Math.abs(y(lastDone.done) - y(lastDue)) < 14 && done.length === points.length ? 16 : 4)} className="analysis-label is-strong">{lastDone.done} done</text> : null}
      <text x={L} y={H - 7} className="analysis-tick">{shortDay(points[0].date)}</text>
      <text x={W - R} y={H - 7} textAnchor="end" className="analysis-tick">{shortDay(points.at(-1).date)}</text>
      {points.map((point, index) => <rect key={point.date} x={x(index) - (W - L - R) / points.length / 2} y={T} width={Math.max(1, (W - L - R) / points.length)} height={H - T - B} className="analysis-hit"><title>{`${formatCalendarDay(point.date)}: ${point.due} due by then${point.done === null ? '' : `, ${point.done} done`}`}</title></rect>)}
    </svg>
    <AsTable columns={['Week of', 'Due by its end', 'Done by its end']} rows={points.filter((point, index) => index === points.length - 1 || new Date(`${point.date}T12:00:00Z`).getUTCDay() === 0).map((point) => [shortDay(mondayOf(point.date)), point.due, point.done ?? '·'])} />
  </Block>
}

// ---- Columns: one value for each of a few named things (weekdays, weeks) -----------------------
function Columns({ title, note, items, say = String }) {
  const top = Math.max(1, ...items.map((item) => item.value))
  const best = Math.max(...items.map((item) => item.value))
  // With one column picked out (this week), the others step back; otherwise every column is the measure.
  return <figure className={`review-weeks analysis-columns${items.some((item) => item.current) ? ' has-emphasis' : ''}`}>
    <figcaption><b>{title}</b>{note ? <span>{note}</span> : null}</figcaption>
    <div className="review-columns" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} role="img" aria-label={`${title}: ${items.map((item) => `${item.label} ${say(item.value)}`).join(', ')}`}>
      {items.map((item) => <div key={item.label} className={`review-column${item.current ? ' is-current' : ''}`} title={`${item.title ?? item.label}: ${say(item.value)}`}>
        {item.value > 0 && (item.value === best || item.current) ? <b>{say(item.value)}</b> : null}
        <span style={{ height: `${item.value ? Math.max(3, (item.value / top) * 82) : 0}%` }} />
      </div>)}
    </div>
    <div className="review-column-labels analysis-all-labels" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-hidden="true">{items.map((item) => <span key={item.label}>{item.label}</span>)}</div>
  </figure>
}

function WeekShape({ data }) {
  const rows = data.weekdays
  const mean = (row, key) => (row.days ? row[key] / row.days : 0)
  const of = (key, title) => rows.map((row, index) => ({ label: WEEKDAYS[index], title: `${title} on a ${WEEKDAYS[index]} (${count(row.days, 'day')})`, value: Math.round(mean(row, key) * 10) / 10 }))
  const rate = rows.map((row, index) => ({ label: WEEKDAYS[index], title: `${WEEKDAYS[index]}: ${row.plansDone} of ${row.plansMade} plans done`, value: row.plansMade ? Math.round((row.plansDone / row.plansMade) * 100) : 0 }))
  return <Block id="weekdays" title="The shape of your week" lead="The mean for each weekday over the days so far. A weekday that has not come round yet shows nothing.">
    <div className="review-weeks-grid">
      <Columns title="Study on the plan" note="mean a day" items={of('studyPlanned', 'Study on the plan')} say={span} />
      <Columns title="Time focused" note="mean a day" items={of('focus', 'Time focused')} say={span} />
      <Columns title="Plans done" note="% of those made" items={rate} say={(value) => `${value}%`} />
      <Columns title="Spent" note="mean a day" items={of('spentPence', 'Spent')} say={(value) => pounds(Math.round(value))} />
    </div>
    <AsTable columns={['Weekday', 'Days', 'Study on the plan', 'Focused', 'Cards done', 'Applications', 'Plans done', 'Spent']} rows={rows.map((row, index) => [WEEKDAYS[index], row.days, span(row.studyPlanned), span(row.focus), row.cardsDone, row.sent, `${row.plansDone} of ${row.plansMade}`, pounds(row.spentPence)])} label="The totals behind these means" />
  </Block>
}

// ---- Hours of the day: one hue, pale to full, for minutes in that hour of that weekday ----------
const GRIDS = [['planned', 'Study on the plan'], ['jobs', 'Time set aside for jobs'], ['focus', 'Time focused']]
function Hours({ data }) {
  const totals = Object.fromEntries(GRIDS.map(([key]) => [key, data.hours[key].flat().reduce((sum, value) => sum + value, 0)]))
  const [chosen, setChosen] = useState('')
  const key = chosen || GRIDS.find(([name]) => totals[name] > 0)?.[0] || 'planned'
  const grid = data.hours[key]
  const weeks = Math.max(1, data.days.length / 7)
  const used = grid[0].map((_unused, hour) => grid.some((row) => row[hour] > 0))
  const first = Math.min(8, used.indexOf(true) === -1 ? 8 : used.indexOf(true))
  const last = Math.max(21, used.lastIndexOf(true))
  const hours = Array.from({ length: last - first + 1 }, (_unused, index) => first + index)
  const top = Math.max(1, ...grid.flat())
  const name = GRIDS.find(([id]) => id === key)[1]
  const busiest = grid.flatMap((row, weekday) => row.map((value, hour) => ({ value, weekday, hour }))).sort((a, b) => b.value - a.value)[0]
  return <Block id="hours" title="Hours of the day" lead={totals[key] ? `${name}: ${span(totals[key] / weeks)} a week on average. The fullest hour is ${WEEKDAYS[busiest.weekday]} ${String(busiest.hour).padStart(2, '0')}:00.` : `${name}: nothing in these days yet.`}>
    <div className="analysis-choose" role="group" aria-label="What the grid shows">{GRIDS.map(([id, label]) => <button key={id} type="button" aria-pressed={id === key} onClick={() => setChosen(id)}>{label}{totals[id] ? '' : ' (none yet)'}</button>)}</div>
    <div className="review-scroll"><table className="analysis-heat" aria-label={`${name}, minutes a week by weekday and hour`}>
      <thead><tr><th />{hours.map((hour) => <th key={hour} scope="col">{hour % 2 === 0 ? String(hour).padStart(2, '0') : ''}</th>)}</tr></thead>
      <tbody>{grid.map((row, weekday) => <tr key={weekday}><th scope="row">{WEEKDAYS[weekday]}</th>
        {hours.map((hour) => { const value = row[hour]; return <td key={hour} title={`${WEEKDAYS[weekday]} ${String(hour).padStart(2, '0')}:00 to ${String(hour + 1).padStart(2, '0')}:00: ${value ? `${span(value / weeks)} a week on average (${span(value)} in all)` : 'nothing'}`}>
          <i style={value ? { background: `color-mix(in srgb, var(--m-accent) ${Math.round(14 + 86 * (value / top))}%, var(--m-card-fill, transparent))` } : undefined} className={value ? undefined : 'is-none'} /></td> })}
      </tr>)}</tbody>
    </table></div>
    <p className="analysis-ramp" aria-hidden="true"><span>less</span><i style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--m-accent) 14%, var(--m-card-fill, transparent)), var(--m-accent))' }} /><span>more · up to {span(top / weeks)} a week in one hour</span></p>
    <AsTable columns={['Weekday', ...hours.map((hour) => `${String(hour).padStart(2, '0')}h`)]} rows={grid.map((row, weekday) => [WEEKDAYS[weekday], ...hours.map((hour) => (row[hour] ? Math.round(row[hour] / weeks) : '·'))])} label="Minutes a week, hour by hour" />
  </Block>
}

// ---- Rows with a bar: a name, a length, its value ----------------------------------------------
function Bars({ rows, say = String, of = null }) {
  const top = Math.max(1, ...rows.map((row) => row.value))
  return <ul className="analysis-bars">{rows.map((row) => <li key={row.label} title={row.title ?? `${row.label}: ${say(row.value)}`}>
    <span>{row.label}{row.note ? <small> {row.note}</small> : null}</span>
    <i><b style={{ width: `${row.value ? Math.max(0.6, (row.value / top) * 100) : 0}%` }} /></i>
    <em>{say(row.value)}{of && row.value !== undefined && of > 0 && row.share !== false ? <small> {Math.round((row.value / of) * 100)}%</small> : null}</em>
  </li>)}</ul>
}

function Modules({ data }) {
  if (!data.modules) return <Block id="modules" title="Each module"><p className="day-quiet day-warn">The Study hub could not be read.</p></Block>
  if (!data.modules.length) return <Block id="modules" title="Each module"><p className="day-quiet">No module is open in the Study hub.</p></Block>
  return <Block id="modules" title="Each module" lead="Every card of the open semester, by module. “On the plan” is study time in the stretch of days shown.">
    <div className="review-scroll"><table className="analysis-table">
      <thead><tr><th scope="col">Module</th><th scope="col" className="analysis-meter-cell">Cards done</th><th scope="col">Late</th><th scope="col">Due in these days</th><th scope="col">No date</th><th scope="col">On the plan</th><th scope="col">Next test or deadline</th></tr></thead>
      <tbody>{data.modules.map((row) => <tr key={row.id || row.title}>
        <th scope="row">{row.code ? <>{row.code} <small>{row.title}</small></> : row.title}</th>
        <td className="analysis-meter-cell"><span className="review-meter" role="img" aria-label={`${row.done} of ${row.cards} done`}><span style={{ width: `${row.cards ? Math.round((row.done / row.cards) * 100) : 0}%`, minWidth: row.done ? undefined : 0 }} /></span><small>{row.done} of {row.cards}</small></td>
        <td className={row.late ? 'day-warn' : undefined}>{row.late || '·'}</td><td>{row.dueInRange || '·'}</td><td>{row.undated || '·'}</td><td>{row.plannedMinutes ? span(row.plannedMinutes) : '·'}</td>
        <td>{row.nextTest ? <>{row.nextTest.title} <small>{formatCalendarDay(row.nextTest.date)}</small></> : '·'}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="day-more"><Link to="/study#/analytics">The Study hub’s own Analytics</Link> goes deeper into study.</p>
  </Block>
}

function Jobs({ data }) {
  const jobs = data.jobs
  if (!jobs) return <Block id="jobs" title="The job pipeline"><p className="day-quiet day-warn">JobMap could not be read.</p></Block>
  const listed = jobs.steps[0].count
  const by = Object.fromEntries(jobs.steps.map((step) => [step.id, step.count]))
  const rate = by.saved ? Math.round((by.applied / by.saved) * 100) : 0
  return <Block id="jobs" title="The job pipeline" lead={`From everything JobMap lists to an offer, as it stands today. ${by.applied} applied for against ${by.saved} on the shortlist${by.saved ? ` (${rate}%)` : ''}; ${jobs.rejected} rejected, ${jobs.archived} archived.`}>
    <Bars rows={jobs.steps.map((step) => ({ label: step.label, value: step.count }))} of={listed} />
    <h3>Where leads come from</h3>
    <div className="review-scroll"><table className="analysis-table">
      <thead><tr><th scope="col">Source</th><th scope="col">Leads</th><th scope="col">Seen open</th><th scope="col">Shortlisted</th><th scope="col">Shortlisted of leads</th><th scope="col">Applied for</th></tr></thead>
      <tbody>{jobs.sources.map((row) => <tr key={row.source}><th scope="row">{row.source}</th><td>{row.total}</td><td>{row.open || '·'}</td><td>{row.saved || '·'}</td><td>{row.total ? `${Math.round((row.saved / row.total) * 100)}%` : '·'}</td><td>{row.applied || '·'}</td></tr>)}</tbody>
    </table></div>
    <div className="review-weeks-grid">
      <Columns title="Closing dates ahead" note="not applied for · this week first" items={jobs.closing.map((week, index) => ({ label: shortDay(week.from), title: `Week of ${shortDay(week.from)}: ${week.count} close, ${week.saved} of them on the shortlist`, value: week.count, current: index === 0 }))} />
      <Columns title="Leads added to JobMap" note="week by week" items={jobs.found.map((week, index) => ({ label: shortDay(week.from), title: `Week of ${shortDay(week.from)}`, value: week.count, current: index === jobs.found.length - 1 }))} />
    </div>
    <p className="day-more">{jobs.withDeadline} of {listed} leads carry a closing date. <Link to="/jobmap">Open JobMap</Link></p>
  </Block>
}

function Money({ data }) {
  const money = data.money
  if (!money) return <Block id="money" title="Where money went"><p className="day-quiet day-warn">Budget could not be read.</p></Block>
  if (!money.receipts) return <Block id="money" title="Where money went"><p className="day-quiet">No receipt in these days. Add one in Budget and it shows here by kind and by shop.</p></Block>
  const kinds = money.byCategory.slice(0, 10)
  const restKinds = money.byCategory.slice(10)
  const lineTotal = money.byCategory.reduce((sum, row) => sum + row.pence, 0)
  return <Block id="money" title="Where money went" lead={`${pounds(money.totalPence)} on ${count(money.receipts, 'receipt')} in these days: ${pounds(Math.round(money.totalPence / money.receipts))} a receipt on average.`}>
    <div className="analysis-two">
      <div><h3>By kind of thing</h3><Bars rows={[...kinds.map((row) => ({ label: row.name, note: row.group, value: row.pence })), ...(restKinds.length ? [{ label: `${restKinds.length} more kinds`, value: restKinds.reduce((sum, row) => sum + row.pence, 0) }] : [])]} say={pounds} of={lineTotal} /></div>
      <div><h3>By shop</h3><Bars rows={money.byShop.map((row) => ({ label: row.name, note: count(row.receipts, 'receipt'), value: row.pence }))} say={pounds} of={money.totalPence} /></div>
    </div>
    <p className="day-more">Kinds add up the lines of each receipt, so discounts taken off a whole receipt are not in them. <Link to="/budget">Open Budget</Link></p>
  </Block>
}

function Relations({ data }) {
  const strength = (r) => (Math.abs(r) < 0.2 ? 'no clear link' : `${Math.abs(r) < 0.5 ? 'a weak' : Math.abs(r) < 0.8 ? 'a moderate' : 'a strong'} ${r > 0 ? 'positive' : 'negative'} link`)
  return <Block id="relations" title="Two measures together" lead="Pearson’s r between two measures over the days so far: 1 means they rise together, −1 that one rises as the other falls, 0 no straight-line link. It says nothing about cause, and under about 30 days it can easily be chance.">
    <ul className="analysis-relations">{data.relations.map((row) => <li key={`${row.a.id}-${row.b.id}`}>
      <span>{row.a.label} <i aria-hidden="true">×</i> {row.b.label}</span>
      {row.r === null ? <em>{row.why === 'too-few-days' ? `needs 10 days; there are ${row.n} so far` : 'one of them has not varied yet'}</em> : <em><b>r = {row.r.toFixed(2)}</b> over {count(row.n, 'day')}: {strength(row.r)}</em>}
    </li>)}</ul>
  </Block>
}

const FILES = [
  ['days', 'Days', 'One row for each day, one column for each measure.'],
  ['tidy', 'Days, tidy', 'One row for each day and measure: date, measure, value.'],
  ['jobs', 'Jobs', 'Every lead in JobMap with its status, source, dates and your categories.'],
  ['cards', 'Study cards', 'Every study card with its module, status and dates.'],
  ['json', 'This page', 'Everything shown here, as JSON.'],
]
function TakeData({ from, to }) {
  const [state, setState] = useState({ busy: '', error: '' })
  async function take(format) {
    setState({ busy: format, error: '' })
    try { await apiDownload(`/api/review/analysis/export?${new URLSearchParams({ from, to, format })}`); setState({ busy: '', error: '' }) } catch (failure) { setState({ busy: '', error: `The file could not be made: ${failure.message}` }) }
  }
  return <Block id="files" title="Take the data" lead="The numbers behind this page as files, for a spreadsheet or your own analysis. Days cover the stretch shown; jobs and study cards are all of them.">
    <ul className="analysis-files">{FILES.map(([format, name, what]) => <li key={format}>
      <button type="button" disabled={Boolean(state.busy)} onClick={() => take(format)}>{state.busy === format ? 'Making…' : `${name} (${format === 'json' ? 'JSON' : 'CSV'})`}</button><span>{what}</span>
    </li>)}</ul>
    {state.error ? <p className="day-quiet day-warn" role="alert">{state.error}</p> : null}
    <p className="analysis-code">The CSV files open in Excel, Numbers, Google Sheets, Python or R. Time is in whole minutes and money in pence. In the days files, <code>elapsed</code> is 0 for a day still to come.</p>
  </Block>
}

export default function AnalysisView({ today }) {
  const thisWeek = mondayOf(today)
  const [weeks, setWeeks] = useState(8)
  const [custom, setCustom] = useState(null)
  const from = custom?.from ?? addDays(thisWeek, -(weeks - 1) * 7)
  const to = custom?.to ?? addDays(thisWeek, 6)
  const valid = isDateKey(from) && isDateKey(to) && from <= to && to <= addDays(from, 189)
  const analysis = useAnalysis(valid ? from : addDays(thisWeek, -49), valid ? to : addDays(thisWeek, 6))
  const data = analysis.data
  const unread = useMemo(() => (data?.sources ?? []).filter((source) => source.status === 'unavailable').map((source) => source.label), [data])
  return <>
    <div className="analysis-range" role="group" aria-label="The stretch of days">
      {RANGES.map(([value, label]) => <button key={value} type="button" aria-pressed={!custom && weeks === value} onClick={() => { setCustom(null); setWeeks(value) }}>{label}</button>)}
      <label>from <input type="date" value={from} max={to} onChange={(event) => setCustom({ from: event.target.value, to })} /></label>
      <label>to <input type="date" value={to} min={from} onChange={(event) => setCustom({ from, to: event.target.value })} /></label>
      <span>{valid ? `${shortDay(from)} to ${formatCalendarDay(to, { weekday: undefined, year: 'numeric' })}` : 'Choose a first day not after the last, at most 190 days apart.'}</span>
    </div>
    {analysis.error ? <p className="form-error" role="alert">The analysis could not be made: {analysis.error}</p> : null}
    {!data && analysis.loading ? <p className="day-quiet" role="status">Gathering the days…</p> : null}
    {data ? <div className={`analysis-page${analysis.loading ? ' is-loading' : ''}`}>
      {unread.length ? <p className="day-quiet day-warn" role="status">Could not be read just now, so its numbers are missing: {unread.join(', ')}.</p> : null}
      <Stats data={data} />
      <BurnUp data={data} />
      <WeekShape data={data} />
      <Hours data={data} />
      <Modules data={data} />
      <Jobs data={data} />
      <Money data={data} />
      <Relations data={data} />
      <TakeData from={data.from} to={data.to} />
    </div> : null}
  </>
}
