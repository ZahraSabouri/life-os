// What a harvest brings besides mail and things to do: items (a vacancy, an event, an announcement,
// a material, an offer, a dated note), and the one rule for where each shows. The batch checker,
// the server, the pages and the agents' instructions (mail/HARVEST.md) all go by this file.
import { addDays, dateKey, isDateKey } from './calendar.js'

export const AREAS = ['admin', 'academic', 'jobs', 'research', 'events', 'money', 'perks', 'health', 'home']
export const AREA_NAMES = { admin: 'Admin', academic: 'Study', jobs: 'Jobs', research: 'Research', events: 'Events', money: 'Money', perks: 'Perks', health: 'Health', home: 'Home' }
export const KINDS = ['vacancy', 'opportunity', 'event', 'announcement', 'material', 'offer', 'info']
const KIND_WORDS = {
  vacancy: ['vacancy', 'vacancies'], opportunity: ['opportunity', 'opportunities'], event: ['event', 'events'], announcement: ['announcement', 'announcements'],
  material: ['material', 'materials'], offer: ['offer', 'offers'], info: ['note', 'notes'],
}
export const KIND_NAMES = Object.fromEntries(KINDS.map((kind) => [kind, KIND_WORDS[kind][0].replace(/^./, (letter) => letter.toUpperCase())]))

// The areas a kind can belong to; a kind not listed here can be in any area.
const KIND_AREAS = { vacancy: ['jobs', 'research'], material: ['academic'], offer: ['perks', 'money', 'home', 'health'] }
export const fitsArea = (kind, area) => KINDS.includes(kind) && AREAS.includes(area) && (!KIND_AREAS[kind] || KIND_AREAS[kind].includes(area))

// The calendar area an item's area is drawn in.
export const CALENDAR_AREA = { admin: 'admin', academic: 'study', jobs: 'career', research: 'career', events: 'events', money: 'money', perks: 'money', health: 'body', home: 'home' }

// A day as it is, a time as its London day.
const dayOf = (value) => (typeof value === 'string' && value ? dateKey(value) : '')
// The day an item belongs on: when it starts, else when it closes. Batch items say start; stored ones start_at or start_day.
export const itemDate = (item) => [item?.start ?? item?.start_at ?? item?.start_day, item?.deadline].map(dayOf).find(isDateKey) ?? ''

// Where an item shows. Events reach the calendar only through Cardiff Life (Plan to go), vacancies
// through JobMap, offers through the Offers list; Today gets what closes within a week (offers:
// their last two days). Things she must do are actions, not items, and are not decided here.
export function placeOf(item, today = '') {
  const kind = item?.kind
  const deadline = isDateKey(dayOf(item?.deadline)) ? dayOf(item.deadline) : ''
  const open = deadline && (!isDateKey(today) || deadline >= today)
  const within = (days) => Boolean(open && isDateKey(today) && deadline <= addDays(today, days - 1))
  return {
    calendar: ['announcement', 'material', 'info', 'opportunity'].includes(kind) && Boolean(itemDate(item)),
    linkTo: kind === 'vacancy' ? 'jobmap' : kind === 'event' ? 'cardiff-life' : null,
    offers: kind === 'offer',
    today: ['vacancy', 'opportunity'].includes(kind) ? within(7) : kind === 'offer' ? within(2) : false,
  }
}

// The part of Life OS an item belongs to, for the "Came in" line on that part's page: offers to
// Budget, vacancies and job or research opportunities to JobMap, events to Cardiff Life, the rest
// by area. Admin has no part of its own: it is on Waiting on you and in the Harvest log.
export const PARTS = { study: 'Study', jobmap: 'JobMap', 'cardiff-life': 'Cardiff Life', budget: 'Budget', health: 'Health' }
export function partOf(item) {
  const { kind, area } = item ?? {}
  if (kind === 'offer') return 'budget'
  if (kind === 'vacancy' || (kind === 'opportunity' && ['jobs', 'research'].includes(area))) return 'jobmap'
  if (kind === 'event') return 'cardiff-life'
  if (area === 'academic') return 'study'
  if (area === 'health') return 'health'
  if (['money', 'perks', 'home'].includes(area)) return 'budget'
  return null
}

// The log's factual line for a day: "12 messages, 2 to do, 3 vacancies, 1 event". Never advice.
export function dayLine({ messages = 0, actions = 0, kinds = {} } = {}) {
  const plural = (count, [one, many]) => `${count} ${count === 1 ? one : many}`
  const parts = []
  if (messages) parts.push(plural(messages, ['message', 'messages']))
  if (actions) parts.push(`${actions} to do`)
  for (const kind of KINDS) if (kinds[kind]) parts.push(plural(kinds[kind], KIND_WORDS[kind]))
  return parts.length ? parts.join(', ') : 'Nothing came in.'
}

// One address for one page, so an advert or an event found twice is known as the same one.
// JobMap's own rule (jobmap/lib/discovery.mjs), with more tracking keys removed.
const TRACKING_KEY = /^(utm_.+|trk|trackingId|refId|gh_src|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_hsenc|_hsmi|mkt_tok|ref_src|aff_platform)$/i
export function canonicalUrl(raw) {
  try {
    const url = new URL(raw)
    url.hash = ''
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    url.pathname = url.pathname.replace(/\/$/, '')
    for (const key of [...url.searchParams.keys()]) if (TRACKING_KEY.test(key)) url.searchParams.delete(key)
    url.searchParams.sort()
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

// A link that is not a destination: a wrapper or redirect, a sign-in, an unsubscribe or a
// preferences page. Returns the reason, or '' for a real link.
export function junkLink(raw) {
  let url
  try { url = new URL(raw) } catch { return 'is not a full link' }
  const host = url.hostname.toLowerCase()
  const where = `${host}${url.pathname}`.toLowerCase()
  if (url.protocol !== 'https:') return 'is not https'
  if (/safelinks\.protection\.outlook\.com$/.test(host)) return 'is an Outlook safe-link wrapper; keep the address inside it'
  if ((host === 'google.com' || host === 'www.google.com') && url.pathname === '/url') return 'is a Google redirect; keep the address inside it'
  if (/^(accounts\.google\.com|login\.microsoftonline\.com|login\.live\.com)$/.test(host) || /\/(log-?in|sign-?in|signon|sso|oauth2?)(\/|$)/.test(url.pathname.toLowerCase())) return 'is a sign-in page'
  if (/unsubscribe|opt-?out|manage[-_]?preferences|email-?preferences|subscription-?center/.test(where)) return 'is an unsubscribe or preferences page'
  if (/^(click|clicks|links?|email|e|t|track|tracking|trk)\.[^.]+\.[a-z.]+$/.test(host) && /\/(c|ls|ss|e|wf|click|track)\//.test(url.pathname.toLowerCase())) return 'is a tracking redirect'
  return ''
}

// The original in her own mailbox. Gmail from its message id and the account she is signed in as
// (setting mail-gmail-account, default 1); Outlook only when the stored link is the opened message's
// own address; Learning Central and Teams as stored. Otherwise nothing, never a broken link.
export const GMAIL_ACCOUNT_KEY = 'mail-gmail-account'
export function gmailLink(messageId, account = 1) {
  const index = Number.isInteger(Number(account)) && Number(account) >= 0 && Number(account) < 10 ? Number(account) : 1
  return /^[0-9a-f]{12,20}$/i.test(String(messageId ?? '')) ? `https://mail.google.com/mail/u/${index}/#all/${String(messageId).toLowerCase()}` : null
}
export const outlookLink = (link) => (/^https:\/\/outlook\.(office|office365|live)\.com\/mail\/(?:[^?#]*\/)?id\/AA[A-Za-z0-9%_+/=-]{20,}/.test(String(link ?? '')) ? link : null)
export function originalLink(message, { gmailAccount = 1 } = {}) {
  const kind = message?.source_kind ?? message?.kind
  if (kind === 'gmail') return gmailLink(message.source_message_id ?? message.sourceId, gmailAccount)
  if (kind === 'outlook') return outlookLink(message.link)
  return /^https:\/\//.test(String(message?.link ?? '')) ? message.link : null
}

// A summary that talks to her instead of recording what came in. (Titles are left alone: an event
// can be called "We Are Cardiff".)
const CHATTY = /^(you|you'll|you're|you've|your|i|i'm|i've|we|let's|don't forget|remember|make sure)\b|\b(you should|you need to|you might|you may want|you could|i recommend|i suggest|i think|worth a look|don't miss)\b/i
export const chatty = (text) => CHATTY.test(String(text ?? '').trim())
