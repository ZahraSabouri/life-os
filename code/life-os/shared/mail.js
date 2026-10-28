// Mail and admin, the pieces both the server and the pages use: what she owes (the add-line
// words, the groups on Waiting on you, birthday wishes), and safe plain text for the reader.
export const PRIORITIES = ['urgent', 'high', 'normal', 'low']
export const KIND_NAMES = { reply: 'Reply', email: 'Email', text: 'Text', call: 'Call', read: 'Read', do: 'Do', decide: 'Decide', congratulate: 'Wish' }
export const RELATIONSHIP_KINDS = ['text', 'call', 'congratulate']
export const areaOf = (kind) => (RELATIONSHIP_KINDS.includes(kind) ? 'relationships' : 'admin')
export const priorityOf = (row) => row?.her_priority ?? row?.priority ?? 'normal'
export const titleOf = (row) => row?.her_title || row?.title || ''
const rank = (row) => PRIORITIES.indexOf(priorityOf(row))

const addDays = (day, count) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)

// "text Sam about Saturday", "call the GP surgery", "email the school office", "reply to Jo",
// "message Ana". The first word sets the kind; what follows names who (and what about).
const OWE_WORDS = { text: 'text', message: 'text', msg: 'text', call: 'call', ring: 'call', phone: 'call', email: 'email', 'e-mail': 'email', reply: 'reply', answer: 'reply' }
export function parseOwe(text) {
  const value = String(text ?? '').trim().replace(/\s+/g, ' ')
  const match = /^([a-z-]+)\s+(?:to\s+|back\s+)?(.+)$/i.exec(value)
  const kind = match && OWE_WORDS[match[1].toLowerCase()]
  if (!kind) return null
  const rest = match[2]
  const split = /^(.*?)\s+(about|re|regarding|for|to say|that|with)\s+(.+)$/i.exec(rest)
  const who = (split ? split[1] : rest).trim()
  return { kind, who, about: split ? split[3] : '', title: `${KIND_NAMES[kind]} ${kind === 'reply' ? `to ${rest}` : rest}`.replace(/\s+/g, ' ') }
}

// The people a "who" could mean: a full name or a first name she has typed, ignoring case.
export function peopleNamed(people, who) {
  const words = String(who ?? '').toLowerCase().split(' ').filter(Boolean)
  if (!words.length) return []
  return (people ?? []).filter((person) => {
    const name = String(person?.name ?? '').toLowerCase().trim()
    if (!name) return false
    const parts = name.split(/\s+/)
    return words.slice(0, parts.length).join(' ') === name || words[0] === parts[0]
  })
}

// Waiting on you: Today (due today or before, urgent, or a snooze that has run out), This week,
// Whenever; then Done lately (the last seven days). A snooze still running is in the week it ends.
export function groupActions(actions, today) {
  const groups = { today: [], week: [], whenever: [], done: [] }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(today ?? ''))) return groups
  const weekEnd = addDays(today, 6)
  for (const row of actions ?? []) {
    if (!row || row.deleted_at) continue
    if (row.status === 'done' || row.status === 'not-needed') {
      const when = String(row.done_at ?? row.updated_at ?? '').slice(0, 10)
      if (!when || when >= addDays(today, -7)) groups.done.push(row)
      continue
    }
    const waking = row.status === 'snoozed' && row.snoozed_until && row.snoozed_until > today ? row.snoozed_until : ''
    const due = waking || row.due || ''
    if (!waking && ((due && due <= today) || priorityOf(row) === 'urgent' || row.status === 'snoozed')) groups.today.push(row)
    else if (due && due <= weekEnd) groups.week.push(row)
    else groups.whenever.push(row)
  }
  const order = (a, b) => rank(a) - rank(b) || String(a.due ?? '9999').localeCompare(String(b.due ?? '9999')) || String(a.since ?? '').localeCompare(String(b.since ?? ''))
  for (const list of Object.values(groups)) list.sort(order)
  groups.done.sort((a, b) => String(b.done_at ?? b.updated_at ?? '').localeCompare(String(a.done_at ?? a.updated_at ?? '')))
  return groups
}

// On a person's birthday, a wish to send, worked out from People. A stored row (keyed by person
// and year) is there only once she has acted on it, and then wins.
export const birthdayKey = (personId, year) => `birthday:${personId}:${year}`
export function birthdayWishes(people, today, stored = []) {
  const byKey = new Map((stored ?? []).map((row) => [row.dedupe_key, row]))
  const monthDay = today.slice(5)
  const leap = (year) => new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1
  return (people ?? []).flatMap((person) => {
    const birthday = String(person?.birthday ?? '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return []
    const on = birthday.slice(5) === '02-29' && !leap(Number(today.slice(0, 4))) ? '02-28' : birthday.slice(5)
    if (on !== monthDay) return []
    const key = birthdayKey(person.id, today.slice(0, 4))
    return [byKey.get(key) ?? { id: key, origin: 'birthday', dedupe_key: key, kind: 'congratulate', area: 'relationships', person_id: String(person.id), person_name: person.name,
      title: `Wish ${person.name} a happy birthday`, why: 'It is their birthday today.', priority: 'high', due: today, status: 'open', revision: 0, virtual: true }]
  })
}

// Plain text as pieces: text, and https links only (shown as links, opened in a new tab).
export function textPieces(text) {
  const value = String(text ?? '')
  const pieces = []
  const pattern = /https:\/\/[^\s<>"')\]]+/g
  let at = 0
  for (const match of value.matchAll(pattern)) {
    const href = match[0].replace(/[.,;:!?]+$/, '')
    if (match.index > at) pieces.push({ text: value.slice(at, match.index) })
    pieces.push({ href })
    at = match.index + href.length
  }
  if (at < value.length) pieces.push({ text: value.slice(at) })
  return pieces
}

// Mail list filters, as the page offers them.
export const MAIL_FILTERS = [
  ['all', 'All'], ['needs-you', 'Needs you'], ['deadline', 'Deadlines'], ['announcement', 'Announcements'], ['conversation', 'Conversations'], ['other', 'Everything else'],
]
export const OTHER_CATEGORIES = ['fyi', 'newsletter', 'automated']

// A prompt for Write it with Claude: keep to what the message says, leave the sending to her.
export function replyPrompt({ action, message, name }) {
  const lines = [
    `Help me write ${action?.kind === 'email' && !message ? 'an email' : 'a reply'}${action?.person_name ? ` to ${action.person_name}` : message?.from_name ? ` to ${message.from_name}` : ''}.`,
    action ? `What I need to do: ${titleOf(action)}${action.why ? ` (${action.why})` : ''}.` : '',
    action?.her_note ? `My note: ${action.her_note}` : '',
    message ? `\nThe message${message.from_name ? ` from ${message.from_name}` : ''}${message.subject ? `, “${message.subject}”` : ''}:\n"""\n${message.body || message.summary || ''}\n"""` : '',
    '\nRules: keep to what the message says and what I tell you; do not invent facts, dates or promises. Short, warm and clear, in British English. If something is missing, ask me first.',
    name ? `Sign it ${name}.` : 'Leave the sign-off for me.',
    'Give me the text only. I will send it myself.',
  ]
  return lines.filter(Boolean).join('\n')
}
