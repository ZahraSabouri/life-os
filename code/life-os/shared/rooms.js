export const ROOMS = [
  {
    slug: 'study',
    name: 'Study Hub',
    icon: 'St',
    accent: '#2f8f83',
    blurb: 'Modules, campaigns, revision, evidence.',
    filter: { rooms: ['study'], types: ['module', 'module-session', 'assignment'] },
    build: 'built'
  },
  {
    slug: 'academia',
    name: 'Academia & Research',
    icon: 'Ac',
    accent: '#3a5ba0',
    blurb: 'Research projects, papers, PhD & scholarship applications.',
    filter: { rooms: ['academia'], types: ['research-project', 'paper', 'academic-application'] },
    build: 'planned'
  },
  {
    slug: 'career',
    name: 'Career & Professional',
    icon: 'Cr',
    accent: '#4b4fbf',
    blurb: 'Job hunt, CV, professional growth. (Job-hunt is a workstream that retires.)',
    filter: { rooms: ['career'], types: ['job-application', 'cv'], tags: ['professional'] },
    build: 'planned'
  },
  {
    slug: 'growth',
    name: 'Growth & Learning',
    icon: 'Gr',
    accent: '#4f9d4f',
    blurb: 'Skills, languages, accent, courses, deliberate practice.',
    filter: { rooms: ['growth'], types: ['skill', 'practice-session', 'course'] },
    build: 'planned'
  },
  {
    slug: 'body',
    name: 'Body & Health',
    icon: 'Bo',
    accent: '#d97a5b',
    blurb: 'Training, routines, appointments, meals, supplements, records.',
    filter: { rooms: ['body'], types: ['workout', 'workout-plan', 'routine', 'supplement', 'meal', 'appointment', 'medical-record', 'measurement'] },
    build: 'planned',
    note: 'Sub-areas (Training / Care / Medical / Nutrition) can split into their own rooms later; for now one room, many types.'
  },
  {
    slug: 'relationships',
    name: 'Relationships',
    icon: 'Re',
    accent: '#c76b8e',
    blurb: 'People, catch-ups, gifts, important dates. Built on the People entity.',
    filter: { rooms: ['relationships'], types: ['interaction', 'gift-idea', 'important-date', 'person-link'] },
    build: 'planned',
    note: 'This room is a view over the first-class People entity + everything linked to a person.'
  },
  {
    slug: 'culture',
    name: 'Culture & Art',
    icon: 'Cu',
    accent: '#8a5cc4',
    blurb: 'Books, films, series, theatre, concerts, exhibitions - wishlist + diary.',
    filter: { rooms: ['culture'], types: ['book', 'movie', 'show', 'performance', 'exhibition'] },
    build: 'planned'
  },
  {
    slug: 'travel',
    name: 'Travel',
    icon: 'Tv',
    accent: '#3f8fbf',
    blurb: 'Trips planned and taken, and a wishlist of destinations.',
    filter: { rooms: ['travel'], types: ['trip', 'destination'] },
    build: 'planned'
  },
  {
    slug: 'memories',
    name: 'Memories',
    icon: 'Mm',
    accent: '#9aa46a',
    blurb: 'Photos, journal, voice notes - moments tied to time and place.',
    filter: { rooms: ['memories'], types: ['memory', 'journal', 'voice-note'] },
    build: 'planned'
  },
  {
    slug: 'home',
    name: 'Home & Living',
    icon: 'Ho',
    accent: '#c79a3f',
    blurb: 'Lists, errands, groceries, house-hunting, furniture, home projects.',
    filter: { rooms: ['home'], types: ['shopping-item', 'errand', 'home-item', 'house-listing', 'home-project', 'document'] },
    build: 'planned'
  },
  {
    slug: 'mind',
    name: 'Mind & Making',
    icon: 'Mi',
    accent: '#b3746a',
    blurb: 'Ideas, saved materials, writing, code snippets, documents.',
    filter: { rooms: ['mind'], types: ['idea', 'material', 'writing', 'snippet', 'document'] },
    build: 'planned'
  },
  {
    slug: 'style',
    name: 'Style / Closet',
    icon: 'Sy',
    accent: '#7d7fa6',
    blurb: 'The virtual closet - clothes photographed, outfits assembled.',
    filter: { rooms: ['style'], types: ['clothing-item'] },
    build: 'later'
  }
]

// Added 12 October 2026 (Xar: "assign them to a day under, I don't know, admin or anything").
ROOMS.push({
  slug: 'admin',
  name: 'Life admin',
  icon: 'Ad',
  accent: '#8a6d3b',
  blurb: 'Errands, paperwork, appointments, bookings, things to sort out.',
  filter: { rooms: ['admin'], types: [] },
  build: 'built'
})

export const LENSES = [
  { slug: 'today', name: 'Today', kind: 'spine', desc: 'Open commitments + today\'s dated entries, from every room.' },
  { slug: 'calendar', name: 'Calendar', kind: 'spine', desc: 'Everything dated, colour-layered by room.' },
  { slug: 'capture', name: 'Capture', kind: 'spine', desc: 'One box; AI/parse routes it to the right room.' },
  { slug: 'search', name: 'Search / Ask', kind: 'spine', desc: 'One index over the whole life.' },
  { slug: 'favorites', name: 'Favorites', kind: 'lens', desc: 'Anything you star, from anywhere. Powered by entries.favorite.' },
  { slug: 'inbox', name: 'Inbox', kind: 'lens', desc: 'Captured-but-unfiled and things awaiting a decision.' },
  { slug: 'map', name: 'Map', kind: 'lens', desc: 'Entries with a place. Powered by the Places entity.' },
  { slug: 'gallery', name: 'Gallery', kind: 'lens', desc: 'Entries with photos, by time and place.' },
  { slug: 'people', name: 'People', kind: 'lens', desc: 'The People entity directory; each person\'s whole history.' }
]

export function roomBySlug(slug) {
  return ROOMS.find((room) => room.slug === slug) ?? null
}
