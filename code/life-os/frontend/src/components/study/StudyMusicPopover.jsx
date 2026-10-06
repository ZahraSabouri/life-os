/* UI component transferred from Summer Rescue; the playlist is user settings data. */
import { useEffect, useRef, useState } from 'react'

import { safeMaterialUrl, youtubeEmbed } from '../../lib/study.js'

export function MusicPopover({ theme = 'light', url = '', onSetup }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDoc(event) {
      if (open && wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function toggle() {
    setOpen((value) => !value)
    setLoaded(true)
  }

  const playlistUrl = safeMaterialUrl(url)
  let embedSrc = youtubeEmbed(playlistUrl)
  try { const link = new URL(playlistUrl); const match = link.pathname.match(/^\/(playlist|album)\/([\w-]+)$/); if (link.hostname === 'open.spotify.com' && match) embedSrc = `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator${theme === 'dark' ? '&theme=0' : ''}` } catch { /* The original link can still be opened. */ }

  return (
    <div className="music-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-button"
        onClick={toggle}
        aria-label="Focus music"
        aria-expanded={open}
        title="Focus music"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V5l10-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="16" cy="16" r="3" />
        </svg>
      </button>
      {loaded && (
        <div className={`music-pop ${open ? 'is-open' : 'is-hidden'}`} role="dialog" aria-label="Focus music" aria-hidden={!open}>
          <div className="music-head">
            <strong>Focus soundtrack</strong>
            <span>Your focus soundtrack</span>
          </div>
          {embedSrc ? <iframe
            key={theme}
            className="spotify-embed"
            src={embedSrc}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            tabIndex={open ? 0 : -1}
            title="Focus playlist"
          /> : <div className="study-music-empty"><p>{playlistUrl ? "Open your music link below." : "Add your focus music link in preferences."}</p>{onSetup && <button type="button" onClick={onSetup}>Music preferences</button>}</div>}
          {playlistUrl && <a className="music-full-link" href={playlistUrl} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            Open full music link
          </a>}
        </div>
      )}
    </div>
  )
}
