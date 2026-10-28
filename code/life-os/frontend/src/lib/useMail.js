// Reading the mail part. Every page that shows it (the Inbox, Today's panel, the envelope,
// People) reads again when any of them saves, so they agree.
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './api.js'

const CHANGED = 'life-os:mail-changed'
export const mailChanged = () => window.dispatchEvent(new Event(CHANGED))

export function useMail(path, { every = 0 } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [turn, setTurn] = useState(0)
  const reload = useCallback(() => setTurn((value) => value + 1), [])
  useEffect(() => {
    if (!path) return undefined
    let off = false
    apiFetch(path).then((data) => { if (!off) setState({ data, loading: false, error: '' }) })
      .catch((failure) => { if (!off) setState((current) => ({ ...current, loading: false, error: failure.message })) })
    return () => { off = true }
  }, [path, turn])
  useEffect(() => {
    window.addEventListener(CHANGED, reload)
    const timer = every ? window.setInterval(reload, every) : 0
    return () => { window.removeEventListener(CHANGED, reload); if (timer) window.clearInterval(timer) }
  }, [reload, every])
  return { ...state, reload }
}

// A change to one of her fields, with the revision she saw; tells every reader afterwards.
export async function saveAction(row, fields) {
  const saved = row.virtual
    ? await apiFetch('/api/mail/birthdays', { method: 'POST', body: JSON.stringify({ person_id: row.person_id, person_name: row.person_name, day: row.due, ...fields }) })
    : await apiFetch(`/api/mail/actions/${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ revision: row.revision, ...fields }) })
  mailChanged()
  return saved
}

export async function addOwed(body) {
  const saved = await apiFetch('/api/mail/actions', { method: 'POST', body: JSON.stringify(body) })
  mailChanged()
  return saved
}

export const london = (iso, options = { day: 'numeric', month: 'short' }) => (iso ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', ...options }).format(new Date(iso)) : '')
export const londonTime = (iso) => london(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const addDay = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
