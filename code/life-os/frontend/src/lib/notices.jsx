// Notices for the whole of Life OS: the bell in the top bar and, if she asks for it, a word
// from the computer itself a few minutes before something starts. The list comes from the
// host (/api/notices), which reads every part; what she has seen is kept as a setting.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from './api.js'
import { useSetting } from './settings.js'

const FIRED_KEY = 'life-os.notices.fired'      // what the computer has already said, per browser
const DESKTOP_KEY = 'life-os.notices.desktop'  // a copy of her choice that other code can read at once
const EMPTY = { notices: [], upcoming: [], today: '' }
const PREFS = { seen: {}, desktop: false, minutesBefore: 10, whenClosed: true }

export const NOTICE_GROUPS = [['now', 'On now'], ['soon', 'Within the hour'], ['today', 'Today'], ['late', 'Slipped'], ['ahead', 'Coming up']]

const canNotify = () => typeof Notification !== 'undefined'

// A word from the computer itself, when she has allowed it. `href` is where a click on it leads.
export function desktopNotice(title, body, { tag, onClick } = {}) {
  try {
    if (!canNotify() || Notification.permission !== 'granted' || window.localStorage.getItem(DESKTOP_KEY) !== '1') return false
    const notice = new Notification(title, { body, tag, icon: '/favicon.ico' })
    notice.onclick = () => { window.focus(); onClick?.(); notice.close() }
    return true
  } catch { return false }
}

function readFired() { try { return JSON.parse(window.localStorage.getItem(FIRED_KEY)) ?? {} } catch { return {} } }
function fire(id, today) {
  const fired = readFired()
  if (fired[id]) return false
  // Yesterday's are forgotten, so the list stays short.
  const kept = Object.fromEntries(Object.entries(fired).filter(([, date]) => date === today))
  try { window.localStorage.setItem(FIRED_KEY, JSON.stringify({ ...kept, [id]: today })) } catch { /* said once per visit at least */ }
  return true
}

const NoticesContext = createContext(null)
export const useNotices = () => useContext(NoticesContext)

export function NoticesProvider({ children }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(EMPTY)
  const [stored, setStored, loaded] = useSetting('notices', null)
  const prefs = useMemo(() => ({ ...PREFS, ...(stored && typeof stored === 'object' ? stored : {}) }), [stored])
  const [permission, setPermission] = useState(() => (canNotify() ? Notification.permission : 'unsupported'))
  const goTo = useRef(navigate)
  goTo.current = navigate

  const refetch = useCallback(() => {
    apiFetch('/api/notices').then((answer) => setData({ notices: answer.notices ?? [], upcoming: answer.upcoming ?? [], today: answer.today ?? '' })).catch(() => { /* the bell keeps what it had */ })
  }, [])
  // Read when the page opens, every five minutes, and when the window is looked at again.
  useEffect(() => {
    refetch()
    const timer = window.setInterval(refetch, 5 * 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') refetch() }
    window.addEventListener('focus', refetch)
    document.addEventListener('visibilitychange', onVisible)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refetch); document.removeEventListener('visibilitychange', onVisible) }
  }, [refetch])

  // One panel at a time: opening Focus shuts this one, and the other way round.
  useEffect(() => {
    const onPanel = (event) => { if (event.detail !== 'notices') setOpen(false) }
    window.addEventListener('life-os:panel', onPanel)
    return () => window.removeEventListener('life-os:panel', onPanel)
  }, [])
  const toggle = useCallback(() => setOpen((current) => { if (!current) { window.dispatchEvent(new CustomEvent('life-os:panel', { detail: 'notices' })); refetch() } return !current }), [refetch])

  const seen = prefs.seen ?? {}
  const unseen = useMemo(() => data.notices.filter((notice) => !seen[notice.id]), [data.notices, seen])

  const markSeen = useCallback((ids) => {
    if (!loaded || !ids.length) return
    const today = data.today || new Date().toISOString().slice(0, 10)
    // Kept for a fortnight, then forgotten.
    const since = new Date(Date.parse(`${today}T12:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
    const kept = Object.fromEntries(Object.entries(seen).filter(([, date]) => date >= since))
    setStored({ ...prefs, seen: { ...kept, ...Object.fromEntries(ids.map((id) => [id, today])) } })
  }, [loaded, data.today, seen, prefs, setStored])

  // Her choice to be told by the computer itself. The browser asks her once.
  const setDesktop = useCallback(async (wanted) => {
    let allowed = canNotify() ? Notification.permission : 'unsupported'
    if (wanted && allowed === 'default') { try { allowed = await Notification.requestPermission() } catch { allowed = 'denied' } }
    setPermission(allowed)
    setStored({ ...prefs, desktop: Boolean(wanted) && allowed === 'granted' })
  }, [prefs, setStored])
  const setWhenClosed = useCallback((wanted) => setStored({ ...prefs, whenClosed: Boolean(wanted) }), [prefs, setStored])
  const setMinutesBefore = useCallback((minutes) => setStored({ ...prefs, minutesBefore: Math.max(1, Math.min(60, Math.round(Number(minutes)) || 10)) }), [prefs, setStored])

  useEffect(() => { try { window.localStorage.setItem(DESKTOP_KEY, prefs.desktop ? '1' : '0') } catch { /* this visit only */ } }, [prefs.desktop])

  // The computer says it: a few minutes before a timed thing starts, and once a day what today asks for.
  useEffect(() => {
    if (!prefs.desktop || permission !== 'granted' || !data.today) return undefined
    const check = () => {
      const now = Date.now()
      // What Windows already showed while no tab was open is not said again.
      const told = new Set(data.told ?? [])
      for (const item of data.upcoming) {
        const wait = Date.parse(item.startsAt) - now
        if (wait <= prefs.minutesBefore * 60_000 && wait > -60_000 && !told.has(item.id) && fire(item.id, data.today)) {
          desktopNotice(item.title, wait > 60_000 ? `Starts at ${item.at}, in ${Math.round(wait / 60_000)} minutes` : `Starts now (${item.at})`, { tag: item.id, onClick: () => goTo.current(item.href || '/today') })
        }
      }
      const asked = data.notices.filter((notice) => ['today', 'late'].includes(notice.level) && !seen[notice.id])
      if (asked.length && !told.has(`summary:${data.today}`) && fire(`summary:${data.today}`, data.today)) {
        desktopNotice(`Life OS: ${asked.length} ${asked.length === 1 ? 'thing' : 'things'} for today`, asked.slice(0, 4).map((notice) => notice.title).join('\n'), { tag: `summary:${data.today}`, onClick: () => goTo.current('/today') })
      }
    }
    check()
    const timer = window.setInterval(check, 20_000)
    return () => window.clearInterval(timer)
  }, [prefs.desktop, prefs.minutesBefore, permission, data, seen])

  const value = useMemo(() => ({
    open, setOpen, toggle, notices: data.notices, unseen, seen, markSeen, refetch,
    desktop: prefs.desktop, minutesBefore: prefs.minutesBefore, permission, setDesktop, setMinutesBefore,
    whenClosed: prefs.whenClosed !== false, setWhenClosed,
  }), [open, toggle, data.notices, unseen, seen, markSeen, refetch, prefs.desktop, prefs.minutesBefore, prefs.whenClosed, permission, setDesktop, setMinutesBefore, setWhenClosed])
  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>
}
