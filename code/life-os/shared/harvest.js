// What a harvest brings besides mail and things to do: things (a vacancy, an application, an order,
// a bill, an event, a booking…), each with a kind, an area, a domain and, for kinds that move, a
// state; and the one rule for where each shows. The batch checker, the server, the pages and the
// harvest's instructions (mail/HARVEST.md) all go by this file. Nothing here is about one person.
import { addDays, dateKey, isDateKey } from './calendar.js'

export const AREAS = ['admin', 'academic', 'jobs', 'research', 'events', 'people', 'money', 'perks', 'health', 'home', 'travel']
export const AREA_NAMES = { admin: 'Admin', academic: 'Study', jobs: 'Jobs', research: 'Research', events: 'Events', people: 'People', money: 'Money', perks: 'Perks', health: 'Health', home: 'Home', travel: 'Travel' }
export const KINDS = ['vacancy', 'application', 'opportunity', 'event', 'announcement', 'material', 'offer', 'bill', 'payment', 'subscription', 'order', 'tenancy',
  'booking', 'appointment', 'official', 'document', 'account', 'person', 'info']
const KIND_WORDS = {
  vacancy: ['vacancy', 'vacancies'], application: ['application', 'applications'], opportunity: ['opportunity', 'opportunities'], event: ['event', 'events'],
  announcement: ['announcement', 'announcements'], material: ['material', 'materials'], offer: ['offer', 'offers'], bill: ['bill', 'bills'], payment: ['payment', 'payments'],
  subscription: ['subscription', 'subscriptions'], order: ['order', 'orders'], tenancy: ['housing matter', 'housing matters'], booking: ['booking', 'bookings'],
  appointment: ['appointment', 'appointments'], official: ['official letter', 'official letters'], document: ['document', 'documents'], account: ['account notice', 'account notices'],
  person: ['person', 'people'], info: ['note', 'notes'],
}
export const KIND_NAMES = Object.fromEntries(KINDS.map((kind) => [kind, KIND_WORDS[kind][0].replace(/^./, (letter) => letter.toUpperCase())]))

// The areas a kind can belong to; a kind not listed here can be in any area.
const KIND_AREAS = {
  vacancy: ['jobs', 'research'], application: ['jobs', 'research', 'academic'], material: ['academic'], offer: ['perks', 'money', 'home', 'health'],
  bill: ['money', 'home', 'health', 'admin'], payment: ['money'], subscription: ['money'], order: ['home', 'money'], tenancy: ['home'], booking: ['travel', 'events', 'health'],
  appointment: ['health', 'admin', 'academic'], official: ['admin'], document: ['admin', 'academic', 'health', 'home'], account: ['admin'], person: ['people', 'jobs', 'academic'],
}
export const fitsArea = (kind, area) => KINDS.includes(kind) && AREAS.includes(area) && (!KIND_AREAS[kind] || KIND_AREAS[kind].includes(area))

// What an opportunity is, when it is not a job.
export const FORMS = ['hackathon', 'competition', 'research', 'scholarship', 'volunteering', 'course', 'programme', 'other']
export const FORM_NAMES = { hackathon: 'Hackathon', competition: 'Competition', research: 'Research post', scholarship: 'Scholarship', volunteering: 'Volunteering', course: 'Course', programme: 'Programme', other: 'Opportunity' }

// The stages a thing moves through, for kinds that move. Each change a harvest brings is kept as an
// event, so a thing can show what happened and when.
export const STATES = {
  vacancy: ['open', 'closed'],
  application: ['applied', 'received', 'test', 'interview', 'offer', 'unsuccessful', 'withdrawn'],
  event: ['on', 'changed', 'cancelled'],
  order: ['ordered', 'dispatched', 'out-for-delivery', 'delivered', 'return-started', 'returned', 'refunded', 'cancelled'],
  bill: ['due', 'paid', 'overdue'],
  payment: ['paid', 'refunded', 'failed'],
  subscription: ['active', 'renewing', 'cancelled', 'ended'],
  booking: ['booked', 'changed', 'cancelled'],
  appointment: ['booked', 'changed', 'cancelled', 'done'],
  tenancy: ['notice', 'due', 'done'],
  official: ['received', 'due', 'done'],
}
export const fitsState = (kind, state) => Boolean(STATES[kind]?.includes(state))
export const stateName = (state) => String(state ?? '').replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase())

// The eight domains of a life, each with its own colour (--d-<domain> in styles/palettes.css). A
// thing's domain comes from its kind when the kind says it, else from its area; she can move a
// thing (her_domain) or teach a sender's domain, and those win.
export const DOMAINS = ['work', 'learning', 'social', 'money', 'home', 'health', 'travel', 'admin']
export const DOMAIN_NAMES = { work: 'Work', learning: 'Learning', social: 'Social', money: 'Money', home: 'Home', health: 'Health', travel: 'Travel', admin: 'Admin' }
const KIND_DOMAIN = {
  vacancy: 'work', application: 'work', material: 'learning', offer: 'money', bill: 'money', payment: 'money', subscription: 'money', order: 'home', tenancy: 'home',
  booking: 'travel', appointment: 'health', official: 'admin', document: 'admin', account: 'admin', person: 'social',
}
const AREA_DOMAIN = { academic: 'learning', jobs: 'work', research: 'work', events: 'social', people: 'social', money: 'money', perks: 'money', home: 'home', health: 'health', travel: 'travel', admin: 'admin' }
export function domainOf(item, { senderDomain = '' } = {}) {
  const chosen = item?.her_domain || senderDomain
  if (DOMAINS.includes(chosen)) return chosen
  return KIND_DOMAIN[item?.kind] ?? AREA_DOMAIN[item?.area] ?? 'admin'
}

// A message nothing was filed from yet: its domain guessed from words in its subject, sender and
// summary, marked as a guess. A sender's taught domain comes first; more specific words before
// general ones (an application update is Work even when it mentions an event).
const GUESSES = [
  ['work', /application (received|update|status|unsuccessful)|thank you for (applying|your application)|interview|assessment cent|online test|shortlisted|\bjobs?\b|vacanc|hiring|career|graduate (scheme|programme)|internship|recruit|\bphd\b|studentship|research (post|assistant|associate)/i],
  ['home', /\border\b|dispatched|delivered|delivery|shipped|parcel|tracking|courier|return (label|request)|tenancy|landlord|letting|accommodation|inspection/i],
  ['travel', /booking|reservation|flight|train\b|journey|e-?ticket|itinerary|hotel|railcard|check-?in/i],
  ['health', /appointment|\bgp\b|\bnhs\b|prescription|dentist|vaccin|pharmacy|clinic|optician/i],
  ['money', /invoice|receipt|payment|statement|\bbank\b|direct debit|\bbill\b|subscription|renew|free trial|refund|% off|\bsale\b|discount|voucher|promo|cashback/i],
  ['admin', /\bvisa\b|\bbrp\b|ukvi|home office|hmrc|council tax|tv licen|dvla|electoral|national insurance|verify|verification|password|sign-?in|security (alert|code)|new device/i],
  ['learning', /module|lecture|coursework|assignment|\bexam\b|timetable|seminar|tutor|dissertation|enrol|coursera|udemy|datacamp|certificate|course\b/i],
  ['social', /\bevents?\b|webinar|workshop|meet-?up|festival|social\b|society|talk\b|conference|volunteer|invit|connect(ion)?\b/i],
]
export function guessDomain(message, { senderDomain = '' } = {}) {
  if (DOMAINS.includes(senderDomain)) return { domain: senderDomain, guessed: false }
  const text = `${message?.subject ?? ''} ${message?.from_name ?? ''} ${message?.from_address ?? ''} ${message?.summary ?? ''}`
  const found = GUESSES.find(([, pattern]) => pattern.test(text))
  return found ? { domain: found[0], guessed: true } : { domain: '', guessed: true }
}

// The calendar area a thing's area is drawn in.
export const CALENDAR_AREA = { admin: 'admin', academic: 'study', jobs: 'career', research: 'career', events: 'events', people: 'relationships', money: 'money', perks: 'money', health: 'body', home: 'home', travel: 'admin' }

// A day as it is, a time as its London day.
const dayOf = (value) => (typeof value === 'string' && value ? dateKey(value) : '')
// The day an item belongs on: when it starts, else when it closes. Batch items say start; stored ones start_at or start_day.
export const itemDate = (item) => [item?.start ?? item?.start_at ?? item?.start_day, item?.deadline].map(dayOf).find(isDateKey) ?? ''

// Where a thing shows. Events reach the calendar only through Events (Plan to go), vacancies and
// applications through JobMap, offers through the Offers list; a thing that led to something to do
// is on the calendar as that action, not twice. Today gets what is close: each kind has its window,
// in days, counted on the thing's start or its deadline, whichever is still ahead.
const ON_CALENDAR = ['announcement', 'material', 'info', 'opportunity', 'application', 'order', 'bill', 'subscription', 'tenancy', 'booking', 'appointment', 'official', 'document']
const TODAY_WINDOW = { vacancy: 7, opportunity: 7, official: 7, document: 7, bill: 3, tenancy: 3, offer: 2, order: 2, subscription: 2, booking: 2, appointment: 2, application: 2 }
export function placeOf(item, today = '') {
  const kind = item?.kind
  const led = (item?.action_ids ?? item?.actionRefs ?? []).length > 0
  // Once an order has arrived, only its return window still matters.
  const arrived = kind === 'order' && ['delivered', 'return-started'].includes(item?.state)
  const days = [arrived ? null : item?.start ?? item?.start_at ?? item?.start_day, item?.deadline].map(dayOf).filter(isDateKey)
  const window = TODAY_WINDOW[kind]
  const close = Boolean(window && isDateKey(today) && days.some((day) => day >= today && day <= addDays(today, window - 1)))
  const over = ['cancelled', 'withdrawn', 'refunded', 'returned', 'ended', 'paid', 'done', 'closed'].includes(item?.state)
  return {
    calendar: ON_CALENDAR.includes(kind) && Boolean(itemDate(item)) && !led && item?.state !== 'cancelled',
    linkTo: ['vacancy', 'application'].includes(kind) ? 'jobmap' : kind === 'event' ? 'events' : null,
    offers: kind === 'offer',
    today: close && !over,
  }
}

// The part of Life OS a thing belongs to, for the "Came in" line on that part's page: offers to
// Budget, vacancies, applications and job or research opportunities to JobMap, events to Events,
// the rest by area. Travel, admin and people have no part of their own yet: they are on the Desk.
export const PARTS = { study: 'Study', jobmap: 'JobMap', events: 'Events', budget: 'Budget', health: 'Health' }
export function partOf(item) {
  const { kind, area } = item ?? {}
  if (kind === 'offer') return 'budget'
  if (['vacancy', 'application'].includes(kind) || (kind === 'opportunity' && ['jobs', 'research'].includes(area))) return 'jobmap'
  if (kind === 'event') return 'events'
  if (['person', 'account', 'official', 'booking'].includes(kind)) return null
  if (area === 'academic') return 'study'
  if (area === 'health') return 'health'
  if (['money', 'perks', 'home'].includes(area)) return 'budget'
  return null
}

// What JobMap should say for an application's state (its statuses: hosting/career/mark.mjs), and
// whether to offer her that change: only when JobMap knows the job and says something else.
export const JOBMAP_STATUS = { applied: 'Applied', received: 'Applied', test: 'Applied', interview: 'Interview', offer: 'Offer', unsuccessful: 'Rejected', withdrawn: 'Archived' }
export function jobmapSuggestion(item) {
  const status = item?.kind === 'application' ? JOBMAP_STATUS[item.state] : null
  if (!status || !item.place?.id || item.place.status === status) return null
  return { job: item.place.id, status, from: item.place.status ?? '' }
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
// own address; a course site and Teams as stored. Otherwise nothing, never a broken link.
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
// can be called "We Are Riverford".)
const CHATTY = /^(you|you'll|you're|you've|your|i|i'm|i've|we|let's|don't forget|remember|make sure)\b|\b(you should|you need to|you might|you may want|you could|i recommend|i suggest|i think|worth a look|don't miss)\b/i
export const chatty = (text) => CHATTY.test(String(text ?? '').trim())
