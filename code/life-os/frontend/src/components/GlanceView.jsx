// The week or the month as one picture, to take in at a glance and to keep: the week as a
// timetable (days across, hours down, every block in its colour, ticked ones marked) with the
// week's hours by module and area; the month as a grid of days with their hours and what is due.
// "Save as image" keeps it as a PNG.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isDateKey } from '../../../shared/calendar.js'
import { filterCalendarItems, formatCalendarDay } from '../lib/calendar.js'
import { addDays, monthPicture, mondayOf, weekPicture } from '../lib/glance.js'
import { useCalendar, useLondonToday } from '../lib/useCalendar.js'
import { useDayChecks } from '../lib/useDayChecks.js'

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
const GROUP_TOKENS = { Work: '--g-blue', Applications: '--g-coral', Research: '--g-rose', Health: '--m-spark', Events: '--g-sub', Career: '--g-blue', Study: '--g-sage', Other: '--g-sub' }
// Modules take colours no other group uses, in the order of their codes, so a module keeps its
// colour in the week and the month.
const MODULE_TOKENS = ['--g-sage', '--m-accent', '--g-acc', '--g-deep']

// The style's colours as plain values, so the saved picture has them too.
function useColours() {
  const [colours, setColours] = useState(null)
  useEffect(() => {
    const read = () => {
      const shell = document.querySelector('.app-shell') ?? document.documentElement
      const style = getComputedStyle(shell)
      const get = (name, fallback) => style.getPropertyValue(name).trim() || fallback
      setColours({ get, paper: get('--m-card-fill', '#ffffff'), ink: get('--m-ink', '#1d1d1f'), muted: get('--m-muted', '#6b6b6b'), line: get('--m-line', '#dddddd'), red: get('--m-red', '#b3261e'), accent: get('--m-accent', '#2f6f5e') })
    }
    read()
    const observer = new MutationObserver(read)
    const shell = document.querySelector('.app-shell')
    if (shell) observer.observe(shell, { attributes: true, attributeFilter: ['data-ground', 'data-mode'] })
    return () => observer.disconnect()
  }, [])
  return colours
}

function groupColour(colours, group, modules) {
  const code = /^([A-Z]{2,4}\d{3,4})/.exec(group)?.[1]
  if (code) return colours.get(MODULE_TOKENS[Math.max(0, modules.indexOf(code)) % MODULE_TOKENS.length], colours.accent)
  return colours.get(GROUP_TOKENS[group] ?? '--g-sub', colours.muted)
}
const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const cut = (text, chars) => (text.length > chars ? `${text.slice(0, Math.max(1, chars - 1)).trimEnd()}…` : text)
const fmtHours = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} h`

function WeekSvg({ picture, colours, today, title }) {
  const width = 1400
  const left = 56
  const top = 118
  const dayWidth = (width - left - 16) / 7
  const perHour = 46
  const hours = (picture.to - picture.from) / 60
  const gridBottom = top + hours * perHour
  const modules = [...new Set(picture.hours.map((entry) => /^([A-Z]{2,4}\d{3,4})/.exec(entry.group)?.[1]).filter(Boolean))].sort()
  const legendRows = Math.ceil(picture.hours.length / 4)
  const height = gridBottom + 70 + legendRows * 30
  const total = picture.hours.reduce((sum, entry) => sum + entry.hours, 0)
  const y = (minutes) => top + ((minutes - picture.from) / 60) * perHour
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={title} style={{ fontFamily: FONT }}>
    <rect width={width} height={height} fill={colours.paper} />
    <text x={left} y={36} fontSize="24" fontWeight="600" fill={colours.ink}>{title}</text>
    <text x={width - 16} y={36} fontSize="14" textAnchor="end" fill={colours.muted}>{fmtHours(Math.round(total * 10) / 10)} planned</text>
    {picture.days.map((day, index) => {
      const x = left + index * dayWidth
      const isToday = day.day === today
      const first = day.due[0]
      return <g key={day.day}>
        {isToday ? <rect x={x} y={52} width={dayWidth} height={gridBottom - 52} fill={colours.accent} opacity="0.07" /> : null}
        <text x={x + 8} y={74} fontSize="15" fontWeight="700" fill={isToday ? colours.accent : colours.ink}>{formatCalendarDay(day.day, { weekday: 'short', month: 'short' })}</text>
        <text x={x + 8} y={96} fontSize="12" fill={first ? colours.red : colours.muted}>{first ? cut(`${first.title}${day.due.length > 1 ? ` +${day.due.length - 1}` : ''}`, Math.floor(dayWidth / 6.6)) : day.jobs ? `${day.jobs} job${day.jobs === 1 ? '' : 's'} closing` : ' '}</text>
        <line x1={x} y1={52} x2={x} y2={gridBottom} stroke={colours.line} />
      </g>
    })}
    {Array.from({ length: hours + 1 }, (_, index) => <g key={index}>
      <line x1={left} y1={top + index * perHour} x2={width - 16} y2={top + index * perHour} stroke={colours.line} strokeDasharray={index === hours ? '' : '2 4'} />
      {index < hours ? <text x={left - 8} y={top + index * perHour + 14} fontSize="12" textAnchor="end" fill={colours.muted}>{clock(picture.from + index * 60)}</text> : null}
    </g>)}
    {picture.days.map((day, index) => day.blocks.map((block) => {
      const laneWidth = (dayWidth - 8) / block.lanes
      const x = left + index * dayWidth + 4 + block.lane * laneWidth
      const top_ = y(block.start) + 1
      const h = Math.max(16, y(block.end) - y(block.start) - 2)
      const fill = groupColour(colours, block.group, modules)
      const chars = Math.max(3, Math.floor((laneWidth - 10) / 6.4))
      const lines = h >= 44 ? 2 : 1
      return <g key={block.id} opacity={block.done ? 0.5 : 1}>
        <rect x={x} y={top_} width={laneWidth - 2} height={h} rx="5" fill={fill} fillOpacity="0.22" stroke={fill} strokeWidth="1.2" />
        <rect x={x} y={top_} width="3.5" height={h} rx="1.5" fill={fill} />
        <text x={x + 8} y={top_ + 14} fontSize="11.5" fontWeight="600" fill={colours.ink}>{block.done ? '✓ ' : ''}{cut(block.title, chars)}</text>
        {lines === 2 ? <text x={x + 8} y={top_ + 29} fontSize="10.5" fill={colours.muted}>{clock(block.start)}–{clock(block.end)}</text> : null}
      </g>
    }))}
    {picture.hours.map((entry, index) => {
      const col = index % 4
      const row = Math.floor(index / 4)
      const x = left + col * ((width - left - 16) / 4)
      const yy = gridBottom + 40 + row * 30
      const fill = groupColour(colours, entry.group, modules)
      return <g key={entry.group}>
        <rect x={x} y={yy - 12} width="14" height="14" rx="3" fill={fill} />
        <text x={x + 22} y={yy} fontSize="14" fill={colours.ink}>{entry.group}</text>
        <text x={x + 22 + Math.min(200, entry.group.length * 8.2) + 10} y={yy} fontSize="14" fontWeight="700" fill={colours.ink}>{fmtHours(entry.hours)}</text>
      </g>
    })}
  </svg>
}

function MonthSvg({ picture, colours, today, title, month }) {
  const width = 1400
  const left = 16
  const top = 96
  const cellWidth = (width - left * 2) / 7
  const cellHeight = 150
  const height = top + picture.weeks.length * cellHeight + 24
  const modules = [...new Set(picture.weeks.flat().flatMap((day) => day.hours.map((entry) => /^([A-Z]{2,4}\d{3,4})/.exec(entry.group)?.[1])).filter(Boolean))].sort()
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={title} style={{ fontFamily: FONT }}>
    <rect width={width} height={height} fill={colours.paper} />
    <text x={left} y={38} fontSize="24" fontWeight="600" fill={colours.ink}>{title}</text>
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, index) => <text key={name} x={left + index * cellWidth + 8} y={80} fontSize="13" fontWeight="700" fill={colours.muted}>{name}</text>)}
    {picture.weeks.map((week, row) => week.map((day, col) => {
      const x = left + col * cellWidth
      const yy = top + row * cellHeight
      const total = day.hours.reduce((sum, entry) => sum + entry.hours, 0)
      const isToday = day.day === today
      let barX = x + 8
      const barWidth = cellWidth - 16
      return <g key={day.day} opacity={day.inMonth ? 1 : 0.38}>
        <rect x={x + 2} y={yy + 2} width={cellWidth - 4} height={cellHeight - 4} rx="8" fill={isToday ? colours.accent : colours.paper} fillOpacity={isToday ? 0.08 : 1} stroke={isToday ? colours.accent : colours.line} />
        <text x={x + 10} y={yy + 24} fontSize="16" fontWeight="700" fill={isToday ? colours.accent : colours.ink}>{Number(day.day.slice(8))}</text>
        <text x={x + cellWidth - 10} y={yy + 24} fontSize="12" textAnchor="end" fill={colours.muted}>{total ? `${fmtHours(Math.round(total * 10) / 10)}${day.total ? ` · ${day.done}/${day.total} done` : ''}` : ''}</text>
        {total ? day.hours.map((entry) => {
          const w = Math.max(2, (entry.hours / Math.max(total, 10)) * barWidth)
          const rect = <rect key={entry.group} x={barX} y={yy + 34} width={w} height="9" rx="2" fill={groupColour(colours, entry.group, modules)} />
          barX += w + 1
          return rect
        }) : null}
        {day.hours.slice(0, 3).map((entry, index) => <text key={entry.group} x={x + 10} y={yy + 62 + index * 16} fontSize="11.5" fill={colours.ink}>{cut(`${entry.group} ${fmtHours(entry.hours)}`, Math.floor(cellWidth / 7))}</text>)}
        {day.due.slice(0, 2).map((due, index) => <text key={due} x={x + 10} y={yy + 116 + index * 15} fontSize="11.5" fontWeight="600" fill={colours.red}>{cut(`Due: ${due}`, Math.floor(cellWidth / 6.8))}</text>)}
        {day.jobs && day.due.length < 2 ? <text x={x + 10} y={yy + 116 + day.due.length * 15} fontSize="11" fill={colours.muted}>{day.jobs} job{day.jobs === 1 ? '' : 's'} closing</text> : null}
      </g>
    }))}
    <text x={width - left} y={38} fontSize="14" textAnchor="end" fill={colours.muted}>{month}</text>
  </svg>
}

// The picture as a PNG, drawn from the SVG on the page.
async function savePicture(svg, name) {
  const source = new XMLSerializer().serializeToString(svg)
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url })
    const scale = 2
    const canvas = Object.assign(document.createElement('canvas'), { width: svg.viewBox.baseVal.width * scale, height: svg.viewBox.baseVal.height * scale })
    const context = canvas.getContext('2d')
    context.scale(scale, scale)
    context.drawImage(image, 0, 0)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name })
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
  } finally { URL.revokeObjectURL(url) }
}

export default function GlanceView() {
  const [params, setParams] = useSearchParams()
  const today = useLondonToday()
  const view = params.get('view') === 'month' ? 'month' : 'week'
  const date = isDateKey(params.get('date') ?? '') ? params.get('date') : today
  const monday = mondayOf(date)
  const month = date.slice(0, 7)
  const from = view === 'week' ? monday : mondayOf(`${month}-01`)
  const to = view === 'week' ? addDays(monday, 6) : addDays(from, 41)
  const calendar = useCalendar(from, to)
  const checks = useDayChecks(from, to)
  const colours = useColours()
  const svgRef = useRef(null)
  const [saving, setSaving] = useState('')
  const items = useMemo(() => filterCalendarItems(calendar.items, { eventScope: 'going', choices: calendar.choices }), [calendar.items, calendar.choices])
  const week = useMemo(() => (view === 'week' ? weekPicture(items, monday, checks.checks) : null), [view, items, monday, checks.checks])
  const monthData = useMemo(() => (view === 'month' ? monthPicture(items, month, checks.checks) : null), [view, items, month, checks.checks])
  const title = view === 'week' ? `The week of ${formatCalendarDay(monday, { weekday: undefined, month: 'long', year: 'numeric' })}` : new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00Z`))
  const set = (next) => setParams({ ...(next.view ?? view) === 'month' ? { view: 'month' } : {}, ...(next.date ? { date: next.date } : date !== today ? { date } : {}) }, { replace: true })
  const step = (by) => set({ date: view === 'week' ? addDays(monday, by * 7) : `${new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1)).toISOString().slice(0, 7)}-01` })

  async function save() {
    if (!svgRef.current) return
    setSaving('saving')
    try { await savePicture(svgRef.current.querySelector('svg'), `life-os-${view}-${view === 'week' ? monday : month}.png`); setSaving('saved') } catch { setSaving('failed') }
    window.setTimeout(() => setSaving(''), 2500)
  }

  return <section className="today-layout unified-today day-page glance-page" aria-label="At a glance">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>{view === 'week' ? 'The week at a glance' : 'The month at a glance'}</h1><span /></div>
    </header>
    <nav className="glance-controls" aria-label="Which week or month">
      <div className="tasks-switch" role="group" aria-label="Week or month">
        <button type="button" aria-pressed={view === 'week'} onClick={() => set({ view: 'week' })}>Week</button>
        <button type="button" aria-pressed={view === 'month'} onClick={() => set({ view: 'month' })}>Month</button>
      </div>
      <div className="day-nav glance-steps">
        <button type="button" onClick={() => step(-1)}>‹ {view === 'week' ? 'The week before' : 'The month before'}</button>
        <button type="button" onClick={() => set({ date: today })} aria-pressed={view === 'week' ? monday === mondayOf(today) : month === today.slice(0, 7)}>{view === 'week' ? 'This week' : 'This month'}</button>
        <button type="button" onClick={() => step(1)}>{view === 'week' ? 'The week after' : 'The month after'} ›</button>
      </div>
      <button type="button" className="task-primary" onClick={save} disabled={!colours || calendar.loading || saving === 'saving'}>{saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : saving === 'failed' ? 'Could not save' : 'Save as image'}</button>
    </nav>
    {calendar.loading && !calendar.items.length ? <p className="day-quiet" role="status">Drawing the {view}…</p> : null}
    <div className="glance-frame" ref={svgRef}>
      {colours && week ? <WeekSvg picture={week} colours={colours} today={today} title={title} /> : null}
      {colours && monthData ? <MonthSvg picture={monthData} colours={colours} today={today} title={title} month={month} /> : null}
    </div>
    <p className="today-section-note">Ticked and done things are drawn faded with ✓. Click a day in the <Link to={`/calendar?date=${date}`}>calendar</Link> to open it; <Link to="/planner">plan the week</Link> to move things.</p>
  </section>
}
