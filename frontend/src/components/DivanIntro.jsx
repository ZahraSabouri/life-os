import { useEffect, useMemo, useState } from 'react'

const FALLBACK_POEM = {
  poet: 'Life OS',
  lines: [
    'A private ledger opens here.',
    'Capture first. Structure after.'
  ],
  en: ''
}

function poemPool() {
  return Array.isArray(window.POEMS_DB) && window.POEMS_DB.length
    ? window.POEMS_DB
    : [FALLBACK_POEM]
}

function normalizePoem(poem) {
  if (!poem || !Array.isArray(poem.lines) || poem.lines.length === 0) {
    return FALLBACK_POEM
  }

  if (poem.lines.length <= 2) {
    return poem
  }

  const coupletCount = Math.max(1, Math.floor(poem.lines.length / 2))
  const index = Math.floor(Math.random() * coupletCount) * 2

  return {
    ...poem,
    lines: poem.lines.slice(index, index + 2)
  }
}

function pickPoem() {
  const pool = poemPool()
  return normalizePoem(pool[Math.floor(Math.random() * pool.length)])
}

export default function DivanIntro({ onEnter, skipKey }) {
  const [poem, setPoem] = useState(() => pickPoem())
  const [skipNextTime, setSkipNextTime] = useState(
    () => window.localStorage.getItem(skipKey) === 'true'
  )
  const poemCount = useMemo(() => poemPool().length, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleEnter()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function handleEnter() {
    if (skipNextTime) {
      window.localStorage.setItem(skipKey, 'true')
    } else {
      window.localStorage.removeItem(skipKey)
    }

    onEnter()
  }

  return (
    <main className="divan-screen">
      <div className="ornament-field" aria-hidden="true">
        <span className="ornament-ring ornament-ring-one" />
        <span className="ornament-ring ornament-ring-two" />
        <span className="ornament-diamond ornament-diamond-one" />
        <span className="ornament-diamond ornament-diamond-two" />
        <span className="ornament-diamond ornament-diamond-three" />
        <span className="ornament-diamond ornament-diamond-four" />
      </div>

      <div className="corner-stamp" aria-hidden="true">
        <span>LIFE OS</span>
        <small>a private ledger</small>
      </div>

      <section className="poem-stage" aria-label="Divan intro poem">
        <div className="poem-lines" lang="fa" dir="rtl">
          {poem.lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <p className="poet-name">{poem.poet}</p>
        {poem.en ? <p className="poem-translation">{poem.en}</p> : null}
      </section>

      <div className="intro-controls">
        <button className="primary-pill" type="button" onClick={handleEnter}>
          Enter
        </button>
        <button className="ghost-pill" type="button" onClick={() => setPoem(pickPoem())}>
          New poem
        </button>
        <label className="skip-control">
          <input
            type="checkbox"
            checked={skipNextTime}
            onChange={(event) => setSkipNextTime(event.target.checked)}
          />
          <span>Skip intro next time</span>
        </label>
      </div>

      <p className="divan-foot">divan / {poemCount} poems offline / the door of life os</p>
    </main>
  )
}
