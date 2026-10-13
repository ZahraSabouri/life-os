// The Guide. Its first page finds things: a search, "How do I…?" answers, and the parts of
// Life OS in groups. Each part has a page of its own (/guide/<part>) with its steps, pictures,
// and buttons that go to the place a step is about. The words are in guide/chapters.js; the
// pictures are served from /guide-shots/.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CHAPTERS, GROUPS, GUIDE_IMAGES, PART_OPENS, STEP_OPENS, TASKS } from '../guide/chapters.js'
import { apiFetch } from '../lib/api.js'
import { useFocus } from '../lib/focus.jsx'
import { useNotices } from '../lib/notices.jsx'
import { FIGURES } from './GuideFigures.jsx'

const PART = Object.fromEntries(CHAPTERS.map((chapter) => [chapter.id, chapter]))
const READ_KEY = 'life-os.guide.read'

function useShots() {
  const [state, setState] = useState({ loaded: false, shots: {}, takenAt: '' })
  const read = useCallback(() => fetch('/guide-shots/manifest.json', { cache: 'no-store' }).then((response) => (response.ok ? response.json() : null))
    .then((manifest) => setState({ loaded: true, shots: manifest?.shots ?? {}, takenAt: manifest?.takenAt ?? '' }))
    .catch(() => setState({ loaded: true, shots: {}, takenAt: '' })), [])
  useEffect(() => { read() }, [read])
  return { ...state, read }
}
// Which parts she has read, kept in this browser.
function useRead() {
  const [read, setRead] = useState(() => { try { return JSON.parse(window.localStorage.getItem(READ_KEY) ?? '{}') ?? {} } catch { return {} } })
  const toggle = (id) => setRead((current) => { const next = { ...current, [id]: !current[id] }; try { window.localStorage.setItem(READ_KEY, JSON.stringify(next)) } catch { /* this visit only */ } return next })
  return [read, toggle]
}
// A button that goes to the place: a page of the app, or one of the top bar's two panels.
function useOpen() {
  const navigate = useNavigate()
  const focus = useFocus()
  const notices = useNotices()
  return (target) => {
    if (target === 'panel:focus') focus?.setOpen(true)
    else if (target === 'panel:notices') notices?.setOpen(true)
    else navigate(target)
  }
}
function Go({ to, primary = false }) {
  const open = useOpen()
  if (!to) return null
  return <button type="button" className={`guide-go${primary ? ' is-primary' : ''}`} onClick={() => open(to[0])}>{to[1]} <span aria-hidden="true">→</span></button>
}

function Picture({ name, title, text, shots, stamp, onOpen, small = false }) {
  const shot = shots[name]
  if (!shot) return null
  return <button type="button" className={`guide-picture${small ? ' is-small' : ''}`} onClick={() => onOpen({ image: name, title })} title="Show it larger">
    <img src={`/guide-shots/${name}?v=${stamp}`} alt={text ? `${title}: ${text}` : title} width={shot.width} height={shot.height} loading="lazy" />
  </button>
}

// One "How do I…?": the question, and under it the steps, the pictures and the way there.
function Task({ task, shots, stamp, onOpen, open = false }) {
  return <details className="guide-task" id={`how-${task.id}`} open={open}>
    <summary>{task.q}</summary>
    <div className="guide-task-body">
      <ol>{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <div className="guide-task-side">
        <Go to={task.open} primary />
        <Link className="guide-more" to={`/guide/${task.part}`}>More about {PART[task.part].title}</Link>
      </div>
      {task.images.some((name) => shots[name]) ? <div className="guide-task-pictures">{task.images.map((name) => <Picture key={name} name={name} title={task.q} shots={shots} stamp={stamp} onOpen={onOpen} small />)}</div> : null}
    </div>
  </details>
}

function Home({ shots, stamp, onOpen, read }) {
  const [words, setWords] = useState('')
  const asked = words.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const has = (text) => asked.every((word) => text.toLowerCase().includes(word))
  const tasks = asked.length ? TASKS.filter((task) => has(`${task.q} ${task.steps.join(' ')} ${PART[task.part].title}`)) : TASKS
  const steps = asked.length ? CHAPTERS.flatMap((chapter) => chapter.steps.filter((step) => has(`${step.title} ${step.text} ${(step.marks ?? []).join(' ')} ${chapter.title}`)).map((step) => ({ chapter, step }))).slice(0, 12) : []
  const done = CHAPTERS.filter((chapter) => read[chapter.id]).length
  return <>
    <section className="day-panel guide-find" aria-label="Find something in the Guide">
      <label><span>What do you want to do?</span><input type="search" value={words} onChange={(event) => setWords(event.target.value)} placeholder="birthday, picture, repeat, CV, shopping, timer…" autoFocus /></label>
      {asked.length ? <p className="guide-found" role="status">{tasks.length || steps.length ? `${tasks.length} ${tasks.length === 1 ? 'answer' : 'answers'}${steps.length ? ` and ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}` : ''}` : 'Nothing has those words. Try one word, such as “picture”.'}</p> : null}
    </section>
    <section className="day-panel" aria-labelledby="guide-how-heading">
      <header><h2 id="guide-how-heading">How do I…?</h2><p>Press a question for its steps, a picture, and a button that takes you there.</p></header>
      <div className="guide-tasks">{tasks.map((task) => <Task key={task.id} task={task} shots={shots} stamp={stamp} onOpen={onOpen} open={asked.length > 0 && tasks.length <= 2} />)}</div>
      {steps.length ? <><h3 className="guide-sub">Also in the parts</h3><ul className="guide-step-links">{steps.map(({ chapter, step }) => <li key={`${chapter.id}-${step.title}`}><Link to={`/guide/${chapter.id}#${step.image ?? step.figure}`}>{step.title}</Link><small>{chapter.title}</small></li>)}</ul></> : null}
    </section>
    {asked.length ? null : <section className="day-panel" aria-labelledby="guide-parts-heading">
      <header><h2 id="guide-parts-heading">Every part of Life OS</h2><p>{done ? `You have read ${done} of ${CHAPTERS.length}.` : 'Each part has a page of its own, with pictures.'}</p></header>
      {GROUPS.map(([name, ids]) => <div key={name} className="guide-group">
        <h3 className="guide-sub">{name}</h3>
        <ul className="guide-parts">{ids.map((id) => { const chapter = PART[id]; const first = chapter.steps.find((step) => step.image && shots[step.image]); return <li key={id}>
          <Link to={`/guide/${id}`} className="guide-part-card">
            {first ? <img src={`/guide-shots/${first.image}?v=${stamp}`} alt="" loading="lazy" /> : <span className="guide-part-blank" aria-hidden="true" />}
            <b>{chapter.title}{read[id] ? <i title="Read">✓</i> : null}</b>
            <span>{chapter.intro}</span>
            <small>{chapter.steps.length} {chapter.steps.length === 1 ? 'step' : 'steps'}{TASKS.some((task) => task.part === id) ? ` · ${TASKS.filter((task) => task.part === id).length} how-to` : ''}</small>
          </Link>
        </li> })}</ul>
      </div>)}
    </section>}
  </>
}

function PartPage({ chapter, shots, stamp, onOpen, read, toggleRead }) {
  const at = CHAPTERS.indexOf(chapter)
  const [before, after] = [CHAPTERS[at - 1], CHAPTERS[at + 1]]
  const tasks = TASKS.filter((task) => task.part === chapter.id)
  const location = useLocation()
  useEffect(() => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
    if (target) target.scrollIntoView({ block: 'start' })
    else window.scrollTo(0, 0)
  }, [chapter.id, location.hash])
  return <>
    <nav className="guide-crumbs" aria-label="Where you are in the Guide"><Link to="/guide">Guide</Link><span aria-hidden="true">›</span><b>{chapter.title}</b><span className="guide-count">Part {at + 1} of {CHAPTERS.length}</span></nav>
    <section className="day-panel guide-chapter" aria-labelledby="guide-part-title">
      <header><h2 id="guide-part-title">{chapter.title}</h2><p>{chapter.intro}</p><div className="guide-part-actions"><Go to={PART_OPENS[chapter.id]} primary /></div></header>
      <ol className="guide-steps">{chapter.steps.map((step, index) => {
        const Figure = step.figure ? FIGURES[step.figure] : null
        return <li key={step.image ?? step.figure} id={step.image ?? step.figure}>
          <div className="guide-words"><span aria-hidden="true">{index + 1}</span><div>
            <h3>{step.title}</h3><p>{step.text}</p>
            {step.marks?.length ? <ol className="guide-marks" aria-label="The numbers on the picture">{step.marks.map((mark, number) => <li key={mark}><i aria-hidden="true">{number + 1}</i><span>{mark}</span></li>)}</ol> : null}
            {STEP_OPENS[step.image] ? <p className="guide-step-go"><Go to={STEP_OPENS[step.image]} /></p> : null}
          </div></div>
          {Figure ? <Figure /> : <Picture name={step.image} title={step.title} text={step.text} shots={shots} stamp={stamp} onOpen={onOpen} />}
        </li>
      })}</ol>
    </section>
    {tasks.length ? <section className="day-panel" aria-labelledby="guide-part-how">
      <header><h2 id="guide-part-how">How do I…?</h2></header>
      <div className="guide-tasks">{tasks.map((task) => <Task key={task.id} task={task} shots={shots} stamp={stamp} onOpen={onOpen} />)}</div>
    </section> : null}
    <nav className="guide-turn" aria-label="Other parts">
      {before ? <Link to={`/guide/${before.id}`}><small>‹ Before</small><b>{before.title}</b></Link> : <span />}
      <button type="button" className="guide-read" aria-pressed={Boolean(read[chapter.id])} onClick={() => toggleRead(chapter.id)}>{read[chapter.id] ? '✓ Read' : 'Mark as read'}</button>
      {after ? <Link to={`/guide/${after.id}`} className="is-next"><small>Next ›</small><b>{after.title}</b></Link> : <span />}
    </nav>
  </>
}

// Taking the pictures again is a maintainer's job: shown only when the address asks for it
// (/guide?maintain), never to someone using the app.
function Maintain({ onDone, shots, takenAt }) {
  const [state, setState] = useState({ running: false, said: '' })
  useEffect(() => {
    if (!state.running) return undefined
    const timer = window.setInterval(() => apiFetch('/api/guide/status').then((status) => { if (!status.running) { setState({ running: false, said: `${status.pictures} pictures taken${status.lastExit ? '; some could not be' : ''}.` }); onDone() } }).catch(() => {}), 4000)
    return () => window.clearInterval(timer)
  }, [state.running, onDone])
  const start = () => apiFetch('/api/guide/retake', { method: 'POST', body: '{}' }).then(() => setState({ running: true, said: '' })).catch((failure) => setState({ running: false, said: failure.message }))
  return <p className="guide-maintain">Maintenance: {GUIDE_IMAGES.filter((name) => shots[name]).length} of {GUIDE_IMAGES.length} pictures{takenAt ? `, taken ${new Date(takenAt).toLocaleString('en-GB')}` : ''}. <button type="button" onClick={start} disabled={state.running}>{state.running ? 'Taking the pictures…' : 'Retake the pictures'}</button> {state.said}</p>
}

export default function GuideView() {
  const { loaded, shots, takenAt, read: readShots } = useShots()
  const { chapter: partId } = useParams()
  const location = useLocation()
  const [read, toggleRead] = useRead()
  const [large, setLarge] = useState(null)
  const stamp = encodeURIComponent(takenAt)
  const chapter = partId ? PART[partId] : null
  const maintain = useMemo(() => new URLSearchParams(location.search).has('maintain'), [location.search])
  useEffect(() => {
    if (!large) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setLarge(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [large])
  return <section className="today-layout unified-today day-page guide-page" aria-label="Guide">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Guide</h1><span /></div>
      <div className="today-date-stack"><time>{chapter ? chapter.title : 'How to do everything in Life OS'}</time></div>
    </header>
    {partId && !chapter ? <p className="day-quiet">That part of the Guide does not exist. <Link to="/guide">Back to the Guide</Link></p> : null}
    {loaded ? (chapter ? <PartPage chapter={chapter} shots={shots} stamp={stamp} onOpen={setLarge} read={read} toggleRead={toggleRead} /> : partId ? null : <Home shots={shots} stamp={stamp} onOpen={setLarge} read={read} />) : <p className="day-quiet" role="status">Opening the Guide…</p>}
    {maintain ? <Maintain onDone={readShots} shots={shots} takenAt={takenAt} /> : null}
    {large ? <div className="guide-large" role="dialog" aria-modal="true" aria-label={large.title} onClick={() => setLarge(null)}>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={`/guide-shots/${large.image}?v=${stamp}`} alt={large.title} />
        <figcaption><b>{large.title}</b><button type="button" onClick={() => setLarge(null)} autoFocus>Close</button></figcaption>
      </figure>
    </div> : null}
  </section>
}
