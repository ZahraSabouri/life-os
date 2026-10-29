// A focus timer and a sound player for the whole of Life OS. They live above the pages (in the
// layout), so a timer keeps counting and a playlist keeps playing from the Court to Today to
// the Study hub, Budget and JobMap. The Study hub keeps its own Focus Room for study cards.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePanel } from './addresses.js'
import { apiFetch } from './api.js'
import { desktopNotice } from './notices.jsx'
import { useSetting } from './settings.js'
import { safeMaterialUrl, youtubeEmbed } from './study.js'
import { tellStudyHub } from './studyHub.js'

const SESSION_KEY = 'life-os.focus'
const SOUND_KEY = 'life-os.sound'
// The first saved sound is the focus playlist the Study hub already plays.
const FIRST_SOUNDS = [{ id: 'focus-playlist', name: 'Focus playlist', url: 'https://open.spotify.com/playlist/17SpQk7uL2G63B6HjXILkz' }]

// Where the time goes: the calendar's areas, in plain words.
export const FOCUS_AREAS = [['study', 'Study'], ['career', 'Jobs'], ['home', 'Home'], ['money', 'Money'], ['relationships', 'People'], ['events', 'Events'], ['core', 'Something else']]

function read(key, fallback) {
  try { return JSON.parse(window.localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function write(key, value) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* kept for this visit only */ }
}

export function clockOfMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

// A link she pasted, as something that can be played inside the page; null when it cannot.
export function soundEmbed(url) {
  const safe = safeMaterialUrl(url)
  if (!safe || safe.startsWith('/')) return null
  try {
    const link = new URL(safe)
    const host = link.hostname.toLowerCase().replace(/^(www|m|music)\./, '')
    // A live stream or a short has its id in the path.
    const inPath = host === 'youtube.com' ? link.pathname.match(/^\/(?:live|shorts)\/([\w-]{6,})/)?.[1] : null
    const youtube = inPath ? `https://www.youtube-nocookie.com/embed/${inPath}` : youtubeEmbed(host === 'youtube.com' ? safe.replace(/\/\/(m|music)\./, '//www.') : safe)
    if (youtube) return { kind: 'YouTube', src: `${youtube}${youtube.includes('?') ? '&' : '?'}autoplay=1`, video: true }
    const spotify = host === 'open.spotify.com' ? link.pathname.match(/^\/(?:intl-[a-z]+\/)?(playlist|album|track|episode|show)\/([\w-]+)/) : null
    if (spotify) return { kind: 'Spotify', src: `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`, video: false }
  } catch { /* not a link */ }
  return null
}

// Three soft notes when a session ends. Allowed because she pressed Start on this page.
function chime() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext
    const context = new Audio()
    for (const [index, pitch] of [660, 880, 990].entries()) {
      const at = context.currentTime + index * 0.34
      const tone = context.createOscillator()
      const gain = context.createGain()
      tone.frequency.value = pitch
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)
      tone.connect(gain).connect(context.destination)
      tone.start(at)
      tone.stop(at + 0.32)
    }
    window.setTimeout(() => context.close().catch(() => {}), 1600)
  } catch { /* no sound on this machine */ }
}

const FocusContext = createContext(null)
export const useFocus = () => useContext(FocusContext)

export function FocusProvider({ children }) {
  // Open is in the address (?panel=focus), so Back closes the panel.
  const [open, setOpen] = usePanel('focus')
  const opener = useRef(setOpen)
  opener.current = setOpen
  // { what, area, card: { semesterId, hubCardId } | null, minutes, startedAt, endsAt | null, left | null }
  // Running: `endsAt` is the moment it ends. Paused: `left` is what remains.
  const [session, setSession] = useState(() => read(SESSION_KEY, null))
  const [now, setNow] = useState(() => Date.now())
  const [last, setLast] = useState(null)
  // Her saved sound links are a setting of the whole app. What an earlier version kept in this
  // browser is used until she changes the list, which saves it as the setting.
  const [storedSound, setStoredSound] = useSetting('sound', null)
  const sound = useMemo(() => {
    const here = read(SOUND_KEY, null)
    return { list: Array.isArray(storedSound?.list) ? storedSound.list : Array.isArray(here?.list) ? here.list : FIRST_SOUNDS }
  }, [storedSound])
  // What is playing is not restored after a reload: a browser will not start sound by itself.
  const [playing, setPlaying] = useState(null)
  // The small player in the corner can be hidden; the sound goes on.
  const [playerShown, setPlayerShown] = useState(true)
  const play = useCallback((id) => { setPlaying(id); if (id) setPlayerShown(true) }, [])
  const finishing = useRef(false)

  const running = Boolean(session?.endsAt)
  const left = session ? (session.endsAt ? Math.max(0, session.endsAt - now) : session.left ?? 0) : 0

  // One panel at a time: the address holds one, so opening the notices shuts this one.

  // Another Life OS tab started, paused or ended the session.
  useEffect(() => {
    const onStorage = (event) => { if (event.key === SESSION_KEY) { setSession(read(SESSION_KEY, null)); setNow(Date.now()) } }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!running) return undefined
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  // The tab's title counts down, so the time is in sight on any page and in the tab strip.
  useEffect(() => {
    if (!session) return undefined
    const title = document.title
    document.title = `${session.endsAt ? clockOfMs(left) : 'Paused'} · ${session.what}`
    return () => { document.title = title }
  }, [session, left])

  const store = useCallback((next) => { write(SESSION_KEY, next); setSession(next) }, [])

  const start = useCallback(({ what, area = 'core', card = null, minutes }) => {
    const length = Math.max(1, Math.min(600, Math.round(Number(minutes)) || 25))
    const at = Date.now()
    setLast(null)
    store({ what: String(what).trim().slice(0, 200) || 'Focus', area, card, minutes: length, startedAt: at, endsAt: at + length * 60_000, left: null })
    setNow(at)
  }, [store])

  const pause = useCallback(() => { if (session?.endsAt) store({ ...session, endsAt: null, left: Math.max(0, session.endsAt - Date.now()) }) }, [session, store])
  const resume = useCallback(() => { if (session && !session.endsAt) { const at = Date.now(); store({ ...session, endsAt: at + (session.left ?? 0), left: null }); setNow(at) } }, [session, store])
  const cancel = useCallback(() => { store(null); setLast({ what: session?.what ?? '', minutes: 0, note: 'Stopped. Nothing was logged.' }) }, [session, store])

  // The session ends: by the clock, or because she pressed "Finish now". The time worked is
  // logged as a done block on the calendar and, for a study card, on the card in the Study hub.
  const finish = useCallback(async (byClock = false) => {
    if (finishing.current) return
    const current = read(SESSION_KEY, null)
    // Only one tab logs it: the one that still finds the session and takes it away.
    if (!current || current.startedAt !== session?.startedAt) { setSession(current); return }
    finishing.current = true
    write(SESSION_KEY, null)
    setSession(null)
    const end = Date.now()
    const remaining = current.endsAt ? Math.max(0, current.endsAt - end) : current.left ?? 0
    const worked = Math.round((current.minutes * 60_000 - remaining) / 60_000)
    if (byClock) { chime(); desktopNotice('Focus session finished', `${current.minutes} min on ${current.what}`, { tag: `focus:${current.startedAt}` }) }
    try {
      if (worked < 1) { setLast({ what: current.what, minutes: 0, note: 'Under a minute: nothing was logged.' }); return }
      await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify({
        type: 'time-block', title: current.what, status: 'done',
        start_at: new Date(current.startedAt).toISOString(), end_at: new Date(end).toISOString(),
        details: { area: current.area, focus: true, minutes: worked },
      }) })
      let onCard = ''
      if (current.card?.hubCardId && current.card.semesterId) {
        try {
          const saved = await apiFetch('/api/day/study/focus', { method: 'POST', body: JSON.stringify({ semester: current.card.semesterId, card: current.card.hubCardId, minutes: worked }) })
          tellStudyHub(current.card.semesterId, saved)
          onCard = ' It is on the card in the Study hub too.'
        } catch (failure) { onCard = ` The Study hub did not take it (${failure.message}); it is on your calendar.` }
      }
      setLast({ what: current.what, minutes: worked, note: `${worked} min on “${current.what}” logged.${onCard}` })
      // The pages read again when the window is looked at again; this is that signal.
      window.dispatchEvent(new Event('focus'))
    } catch (failure) {
      setLast({ what: current.what, minutes: worked, note: `${worked} min on “${current.what}” could not be logged: ${failure.message}`, failed: true })
    } finally { finishing.current = false }
  }, [session])

  useEffect(() => { if (running && left === 0) { opener.current(true); finish(true) } }, [running, left, finish])

  const addSound = useCallback((name, url) => {
    const safe = safeMaterialUrl(url)
    if (!safe || safe.startsWith('/')) return 'That is not a link.'
    const embed = soundEmbed(safe)
    const id = `sound-${Date.now().toString(36)}`
    setStoredSound({ list: [...sound.list, { id, name: String(name).trim().slice(0, 80) || (embed ? `${embed.kind} link` : 'Link'), url: safe }] })
    return ''
  }, [sound, setStoredSound])
  const removeSound = useCallback((id) => { setStoredSound({ list: sound.list.filter((item) => item.id !== id) }); setPlaying((current) => (current === id ? null : current)) }, [sound, setStoredSound])

  const value = useMemo(() => ({
    open, setOpen, toggle: () => setOpen(!open),
    session, running, left, last, start, pause, resume, cancel, finish: () => finish(false),
    sounds: sound.list, playing, play, playerShown, setPlayerShown, addSound, removeSound,
  }), [open, setOpen, session, running, left, last, start, pause, resume, cancel, finish, sound, playing, play, playerShown, addSound, removeSound])

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
}
