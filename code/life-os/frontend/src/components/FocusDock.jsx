// The Focus button in the top bar of every page, and the panel it opens: a timer for anything
// (a study card, job applications, a plan) and a sound player (a playlist, a live stream, a
// video) that keeps playing from page to page.
import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../lib/api.js'
import { clockOfMs, FOCUS_AREAS, soundEmbed, useFocus } from '../lib/focus.jsx'
import { useLondonToday } from '../lib/useCalendar.js'

const LENGTHS = [25, 50, 90]

export function FocusButton({ className = '' }) {
  const focus = useFocus()
  if (!focus) return null
  const label = focus.session ? `${focus.running ? clockOfMs(focus.left) : 'Paused'}` : 'Focus'
  return (
    <button
      type="button"
      className={`focus-button${focus.session ? ' is-running' : ''} ${className}`.trim()}
      onClick={focus.toggle}
      aria-expanded={focus.open}
      aria-controls="focus-panel"
      title={focus.session ? `Focus: ${focus.session.what}` : 'Focus timer and sound'}
    >
      <span className="focus-button-mark" aria-hidden="true" />
      <span className="focus-button-label">{label}</span>
      {focus.playing ? <span className="focus-button-sound" aria-label="Sound is playing">♪</span> : null}
    </button>
  )
}

// What today holds that a session could be for: the study cards of the day, and job applications.
function useTodayPicks(open) {
  const today = useLondonToday()
  const [picks, setPicks] = useState([])
  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    apiFetch(`/api/day?${new URLSearchParams({ date: today })}`).then((day) => {
      if (cancelled) return
      const cards = [...(day.blocks ?? []).map((block) => block.card), ...(day.study?.today ?? [])].filter((card) => card && !card.done && card.hubCardId)
      const seen = new Set()
      const study = cards.filter((card) => !seen.has(card.id) && seen.add(card.id)).slice(0, 3)
        .map((card) => ({ what: card.title, area: 'study', card: { semesterId: card.semesterId, hubCardId: card.hubCardId } }))
      const next = day.jobs?.closing?.[0] ?? day.jobs?.next?.[0]
      setPicks([...study, { what: next ? `Apply: ${next.role}` : 'Job applications', area: 'career', card: null }])
    }).catch(() => { if (!cancelled) setPicks([{ what: 'Job applications', area: 'career', card: null }]) })
    return () => { cancelled = true }
  }, [open, today])
  return picks
}

function Timer({ focus }) {
  const picks = useTodayPicks(focus.open && !focus.session)
  const [what, setWhat] = useState('')
  const [area, setArea] = useState('study')
  const [card, setCard] = useState(null)
  const [minutes, setMinutes] = useState(25)
  const session = focus.session

  if (session) {
    const total = session.minutes * 60_000
    return <section className="focus-part" aria-label="Timer">
      <p className="focus-clock" role="timer" aria-live="off">{clockOfMs(focus.left)}</p>
      <p className="focus-what"><b>{session.what}</b><span>{FOCUS_AREAS.find(([id]) => id === session.area)?.[1] ?? ''} · {session.minutes} min{focus.running ? '' : ' · paused'}</span></p>
      <div className="focus-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.round(((total - focus.left) / total) * 100))}%` }} /></div>
      <div className="focus-actions">
        {focus.running ? <button type="button" onClick={focus.pause}>Pause</button> : <button type="button" className="is-primary" onClick={focus.resume}>Go on</button>}
        <button type="button" onClick={focus.finish}>Finish now</button>
        <button type="button" className="is-quiet" onClick={focus.cancel}>Stop without logging</button>
      </div>
      <p className="focus-note">When it ends, the time is put on your calendar as done{session.card ? ' and on the card in the Study hub' : ''}.</p>
    </section>
  }

  function begin(event) {
    event.preventDefault()
    if (!what.trim()) return
    focus.start({ what, area, card, minutes })
    setWhat(''); setCard(null)
  }
  return <section className="focus-part" aria-label="Timer">
    <form onSubmit={begin}>
      <label className="focus-field"><span>What are you working on?</span>
        <input value={what} onChange={(event) => { setWhat(event.target.value); setCard(null) }} placeholder="A card, an application, anything" maxLength={200} />
      </label>
      {picks.length ? <div className="focus-picks" role="group" aria-label="From today">
        {picks.map((pick) => <button type="button" key={`${pick.area}:${pick.what}`} className={what === pick.what ? 'is-chosen' : undefined} onClick={() => { setWhat(pick.what); setArea(pick.area); setCard(pick.card) }}>{pick.what}</button>)}
      </div> : null}
      <div className="focus-row">
        <div className="focus-lengths" role="group" aria-label="Minutes">
          {LENGTHS.map((length) => <button type="button" key={length} aria-pressed={minutes === length} className={minutes === length ? 'is-chosen' : undefined} onClick={() => setMinutes(length)}>{length}</button>)}
          <input type="number" min="1" max="600" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} aria-label="Minutes" />
          <span>min</span>
        </div>
        <label className="focus-under"><span>under</span>
          <select value={area} onChange={(event) => { setArea(event.target.value); setCard(null) }}>{FOCUS_AREAS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        </label>
      </div>
      <button type="submit" className="focus-start" disabled={!what.trim() || !(minutes >= 1)}>Start</button>
    </form>
    {focus.last ? <p className={`focus-note${focus.last.failed ? ' is-warn' : ''}`} role="status">{focus.last.note}</p> : null}
  </section>
}

function Sound({ focus }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [problem, setProblem] = useState('')
  function add(event) {
    event.preventDefault()
    const failed = focus.addSound(name, url)
    setProblem(failed)
    if (!failed) { setName(''); setUrl('') }
  }
  return <section className="focus-part" aria-label="Sound">
    <h3>Sound</h3>
    <ul className="focus-sounds">
      {focus.sounds.map((item) => {
        const playable = soundEmbed(item.url)
        const on = focus.playing === item.id
        return <li key={item.id} className={on ? 'is-on' : undefined}>
          <span><b>{item.name}</b><small>{playable ? playable.kind : 'Opens in a new tab'}</small></span>
          {on ? <button type="button" onClick={() => focus.setPlayerShown(!focus.playerShown)}>{focus.playerShown ? 'Hide player' : 'Show player'}</button> : null}
          {playable ? <button type="button" onClick={() => focus.play(on ? null : item.id)}>{on ? 'Stop' : 'Play'}</button> : <a href={item.url} target="_blank" rel="noreferrer">Open</a>}
          <button type="button" className="is-quiet" aria-label={`Remove ${item.name}`} onClick={() => focus.removeSound(item.id)}>×</button>
        </li>
      })}
    </ul>
    <form className="focus-add" onSubmit={add}>
      <input value={url} onChange={(event) => { setUrl(event.target.value); setProblem('') }} placeholder="Paste a YouTube or Spotify link" aria-label="Link" />
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (optional)" aria-label="Name" maxLength={80} />
      <button type="submit" disabled={!url.trim()}>Add</button>
    </form>
    {problem ? <p className="focus-note is-warn" role="alert">{problem}</p> : null}
  </section>
}

export function FocusPanel() {
  const focus = useFocus()
  const panel = useRef(null)
  useEffect(() => {
    if (!focus?.open) return undefined
    const onKey = (event) => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) focus.setOpen(false) }
    const onDown = (event) => { if (panel.current && !panel.current.contains(event.target) && !event.target.closest?.('.focus-button')) focus.setOpen(false, { inPlace: true }) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown) }
  }, [focus])
  if (!focus) return null
  return (
    <aside id="focus-panel" ref={panel} className={`focus-panel${focus.open ? ' is-open' : ''}`} aria-label="Focus" inert={!focus.open}>
      <header><h2>Focus</h2><button type="button" className="is-quiet" onClick={() => focus.setOpen(false)} aria-label="Close">×</button></header>
      <Timer focus={focus} />
      <Sound focus={focus} />
    </aside>
  )
}

// The small player in the corner of the window. It stays on the page from one Life OS page to
// the next, so the sound goes on; hidden, it is moved out of sight and keeps playing.
export function FocusPlayer() {
  const focus = useFocus()
  const current = focus?.sounds.find((item) => item.id === focus.playing)
  const embed = current ? soundEmbed(current.url) : null
  if (!embed) return null
  return (
    <aside className={`focus-player${embed.video ? ' is-video' : ''}${focus.playerShown ? '' : ' is-hidden'}`} aria-label="Player" inert={!focus.playerShown}>
      <header>
        <b>{current.name}</b>
        <button type="button" onClick={() => focus.setPlayerShown(false)} title="The sound goes on. Bring it back from Focus.">Hide</button>
        <button type="button" onClick={() => focus.play(null)}>Stop</button>
      </header>
      <iframe key={current.id} src={embed.src} title={current.name} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
    </aside>
  )
}
