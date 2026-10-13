// The Guide: every part of Life OS explained with pictures taken from her own running app.
// The words are in guide/chapters.js; the pictures are made by scripts/guide-shots.mjs and
// served from /guide-shots/ (they show personal records, so they stay on this computer).
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHAPTERS } from '../guide/chapters.js'

function useShots() {
  const [state, setState] = useState({ loaded: false, shots: {}, takenAt: '' })
  useEffect(() => {
    let off = false
    fetch('/guide-shots/manifest.json', { cache: 'no-store' }).then((response) => (response.ok ? response.json() : null))
      .then((manifest) => { if (!off) setState({ loaded: true, shots: manifest?.shots ?? {}, takenAt: manifest?.takenAt ?? '' }) })
      .catch(() => { if (!off) setState({ loaded: true, shots: {}, takenAt: '' }) })
    return () => { off = true }
  }, [])
  return state
}

function Picture({ step, shot, stamp, onOpen }) {
  if (!shot) return <p className="guide-missing">The picture for this step has not been taken yet.</p>
  return <button type="button" className="guide-picture" onClick={() => onOpen(step)} title="Show it larger">
    <img src={`/guide-shots/${step.image}?v=${stamp}`} alt={`${step.title}: ${step.text}`} width={shot.width} height={shot.height} loading="lazy" />
  </button>
}

export default function GuideView() {
  const { loaded, shots, takenAt } = useShots()
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
  const taken = Object.keys(shots).length
  return <section className="today-layout unified-today day-page guide-page" aria-label="Guide">
    <header className="ledger-header">
      <div className="ledger-brandline"><h1>Guide</h1><span /></div>
      <div className="today-date-stack"><time>How each part works, with pictures of your own app</time></div>
    </header>
    <div className="guide-layout">
      <nav id="guide-chapters" className="day-panel guide-contents" aria-label="Chapters">
        <h2>Chapters</h2>
        <ol>{CHAPTERS.map((chapter) => <li key={chapter.id}><a href={`#${chapter.id}`}>{chapter.title}</a></li>)}</ol>
        <p>{!loaded ? 'Looking for the pictures…' : taken ? `Pictures taken ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(takenAt))}. They show your own records and stay on this computer.` : 'No pictures yet. An agent makes them with “node scripts/guide-shots.mjs” while Life OS is running.'}</p>
      </nav>
      <div className="guide-chapters">
        {CHAPTERS.map((chapter) => <section key={chapter.id} id={chapter.id} className="day-panel guide-chapter" aria-labelledby={`${chapter.id}-title`}>
          <header><h2 id={`${chapter.id}-title`}>{chapter.title}</h2><p>{chapter.intro}</p><a className="guide-up" href="#guide-chapters">↑ Chapters</a></header>
          <ol className="guide-steps">{chapter.steps.map((step, index) => <li key={step.image}>
            <div className="guide-words"><span aria-hidden="true">{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>
            {loaded ? <Picture step={step} shot={shots[step.image]} stamp={stamp} onOpen={setLarge} /> : null}
          </li>)}</ol>
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
