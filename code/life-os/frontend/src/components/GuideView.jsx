// The Guide: every part of Life OS explained with pictures taken from her own running app, and
// with diagrams the page draws. The words are in guide/chapters.js; the pictures are made by
// scripts/guide-shots.mjs and served from /guide-shots/ (they show personal records, so they
// stay on this computer). "Retake the pictures" asks the server to run that script.
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHAPTERS, GUIDE_IMAGES } from '../guide/chapters.js'
import { apiFetch } from '../lib/api.js'
import { FIGURES } from './GuideFigures.jsx'

function useShots() {
  const [state, setState] = useState({ loaded: false, shots: {}, takenAt: '' })
  const read = useCallback(() => fetch('/guide-shots/manifest.json', { cache: 'no-store' }).then((response) => (response.ok ? response.json() : null))
    .then((manifest) => setState({ loaded: true, shots: manifest?.shots ?? {}, takenAt: manifest?.takenAt ?? '' }))
    .catch(() => setState({ loaded: true, shots: {}, takenAt: '' })), [])
  useEffect(() => { read() }, [read])
  return { ...state, read }
}

// Asks the server to take the pictures again, and follows it until it has finished.
function useRetake(onDone) {
  const [state, setState] = useState({ running: false, error: '', done: '' })
  useEffect(() => {
    let off = false
    apiFetch('/api/guide/status').then((status) => { if (!off && status.running) setState({ running: true, error: '', done: '' }) }).catch(() => {})
    return () => { off = true }
  }, [])
  useEffect(() => {
    if (!state.running) return undefined
    const timer = window.setInterval(() => {
      apiFetch('/api/guide/status').then((status) => {
        if (status.running) return
        setState({ running: false, error: status.lastExit ? 'Some pictures could not be taken; the others are new.' : '', done: `${status.pictures} pictures taken.` })
        onDone()
      }).catch(() => {})
    }, 4000)
    return () => window.clearInterval(timer)
  }, [state.running, onDone])
  const start = () => apiFetch('/api/guide/retake', { method: 'POST', body: '{}' })
    .then(() => setState({ running: true, error: '', done: '' }))
    .catch((failure) => setState({ running: false, error: failure.message, done: '' }))
  return { ...state, start }
}

function Picture({ step, shot, stamp, onOpen }) {
  if (!shot) return <p className="guide-missing">The picture for this step has not been taken yet. “Retake the pictures”, under the chapters, takes it.</p>
  return <button type="button" className="guide-picture" onClick={() => onOpen(step)} title="Show it larger">
    <img src={`/guide-shots/${step.image}?v=${stamp}`} alt={`${step.title}: ${step.text}`} width={shot.width} height={shot.height} loading="lazy" />
  </button>
}

export default function GuideView() {
  const { loaded, shots, takenAt, read } = useShots()
  const retake = useRetake(read)
  const [large, setLarge] = useState(null)
  const location = useLocation()
  const stamp = encodeURIComponent(takenAt)
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [location.hash, loaded])
  useEffect(() => {
    if (!large) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setLarge(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [large])
  const taken = GUIDE_IMAGES.filter((name) => shots[name]).length
  const when = takenAt ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(takenAt)) : ''
  return <section className="today-layout unified-today day-page guide-page" aria-label="Guide">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Guide</h1><span /></div>
      <div className="today-date-stack"><time>How each part works, with pictures of your own app</time></div>
    </header>
    <div className="guide-layout">
      <nav id="guide-chapters" className="day-panel guide-contents" aria-label="Chapters">
        <h2>Chapters</h2>
        <ol>{CHAPTERS.map((chapter) => <li key={chapter.id}><a href={`#${chapter.id}`}>{chapter.title}</a></li>)}</ol>
        <div className="guide-pictures-note">
          <p>{!loaded ? 'Looking for the pictures…' : taken ? `${taken} of ${GUIDE_IMAGES.length} pictures, taken ${when}. They show your own records and stay on this computer.` : 'No pictures yet.'}</p>
          <button type="button" onClick={retake.start} disabled={retake.running}>{retake.running ? 'Taking the pictures…' : 'Retake the pictures'}</button>
          <p>{retake.running ? 'About five minutes. It only looks at the app and changes nothing; you can go on using Life OS.' : retake.error ? retake.error : retake.done ? retake.done : 'Use this after a page has changed, so the pictures match what you see.'}</p>
        </div>
      </nav>
      <div className="guide-chapters">
        {CHAPTERS.map((chapter) => <section key={chapter.id} id={chapter.id} className="day-panel guide-chapter" aria-labelledby={`${chapter.id}-title`}>
          <header><h2 id={`${chapter.id}-title`}>{chapter.title}</h2><p>{chapter.intro}</p><a className="guide-up" href="#guide-chapters">↑ Chapters</a></header>
          <ol className="guide-steps">{chapter.steps.map((step, index) => {
            const Figure = step.figure ? FIGURES[step.figure] : null
            return <li key={step.image ?? step.figure}>
              <div className="guide-words"><span aria-hidden="true">{index + 1}</span><div>
                <h3>{step.title}</h3><p>{step.text}</p>
                {step.marks?.length ? <ol className="guide-marks" aria-label="The numbers on the picture">{step.marks.map((mark, at) => <li key={mark}><i aria-hidden="true">{at + 1}</i><span>{mark}</span></li>)}</ol> : null}
              </div></div>
              {Figure ? <Figure /> : loaded ? <Picture step={step} shot={shots[step.image]} stamp={stamp} onOpen={setLarge} /> : null}
            </li>
          })}</ol>
        </section>)}
      </div>
    </div>
    {large ? <div className="guide-large" role="dialog" aria-modal="true" aria-label={large.title} onClick={() => setLarge(null)}>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={`/guide-shots/${large.image}?v=${stamp}`} alt={large.title} />
        <figcaption><b>{large.title}</b><button type="button" onClick={() => setLarge(null)} autoFocus>Close</button></figcaption>
      </figure>
    </div> : null}
  </section>
}
