// The mail part's lines for the bell and its items for the calendar. Read only.
import { addDays } from '../../code/life-os/shared/calendar.js'
import { priorityOf, titleOf, KIND_NAMES } from '../../code/life-os/shared/mail.js'

const text = (value, limit = 200) => String(value ?? '').trim().slice(0, limit)
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`
const dayOf = (row) => (row.status === 'snoozed' && row.snoozed_until ? row.snoozed_until : row.due) || ''

// today: urgent, and due today; late: past their day, and replies waiting three days or more;
// ahead: due tomorrow; and once per batch, the announcements it brought.
export function mailNotices({ actions = [], announcements = 0, batchId = null } = {}, today) {
  const tomorrow = addDays(today, 1)
  const notices = []
  for (const row of actions) {
    const day = dayOf(row)
    if (row.status === 'snoozed' && day > today) continue
    const waited = row.since ? Math.floor((Date.parse(`${today}T12:00:00Z`) - Date.parse(row.since)) / 86_400_000) : 0
    const level = day && day < today ? 'late' : row.kind === 'reply' && waited >= 3 ? 'late'
      : priorityOf(row) === 'urgent' || day === today ? 'today' : day === tomorrow ? 'ahead' : ''
    if (!level) continue
    const why = level === 'late' ? (day && day < today ? `Was due ${day}` : `Waiting ${waited} days`) : level === 'ahead' ? 'Due tomorrow' : day === today ? 'Due today' : 'Urgent'
    notices.push({ id: `mail:${row.id}:${level}`, level, area: row.area === 'relationships' ? 'relationships' : 'admin', title: text(titleOf(row)), detail: [why, row.person_name, KIND_NAMES[row.kind]].filter(Boolean).join(' · '), at: '', href: '/inbox' })
  }
  if (announcements > 0 && batchId) notices.push({ id: `mail:announcements:${batchId}`, level: 'today', area: 'admin', title: plural(announcements, 'new announcement'), detail: 'In your mail', at: '', href: '/inbox/mail?filter=announcement' })
  return notices
}

// Calendar items: an action with a day (kind deadline when the mail gave the date, reminder for hers).
export function mapMail(rows = []) {
  return rows.map((row) => ({
    id: `admin:mail:${row.id}`, area: row.area === 'relationships' ? 'relationships' : 'admin', kind: row.origin === 'gathered' ? 'deadline' : 'reminder',
    title: text(titleOf(row)), start: dayOf(row), end: null, all_day: true, href: '/inbox',
    meta: { source: 'mail', readonly: true, status: row.status, done: row.status === 'done', completed: row.status === 'done', type: row.kind },
  })).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.start))
}
