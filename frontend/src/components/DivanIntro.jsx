import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGround } from '../lib/groundContext.jsx'
import { getPoemPool, pickPoem } from '../lib/poems.js'

export default function DivanIntro({ onEnter, skipKey }) {
  const { ground, cycleGround } = useGround()
  const [poem, setPoem] = useState(() => pickPoem())
  const [skipNextTime, setSkipNextTime] = useState(
    () => window.localStorage.getItem(skipKey) === 'true'
  )
  const poemCount = useMemo(() => getPoemPool().length, [])

  const handleEnter = useCallback(() => {
    if (skipNextTime) {
      window.localStorage.setItem(skipKey, 'true')
    } else {
      window.localStorage.removeItem(skipKey)
    }

    onEnter()
  }, [onEnter, skipKey, skipNextTime])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleEnter()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleEnter])

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
        <button className="ghost-pill" type="button" onClick={cycleGround}>
          Ground: {ground}
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
