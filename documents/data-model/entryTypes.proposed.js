// =============================================================================
// Life OS — PROPOSED expanded entry-type registry
// -----------------------------------------------------------------------------
// This is a *proposal* to merge into the canonical single source of truth at
//   code/life-os/shared/entryTypes.js
// It is a SUPERSET of the live file: every type that exists today is kept with
// the same shape; new types are added. Do NOT create a second live registry —
// review this, then extend the canonical file. The helper functions at the
// bottom are unchanged from the live file and included only so this file runs
// standalone for review (`node --check`, quick experiments).
//
// HARD CONSTRAINTS (respect these or you break validateDetails):
//   * A field's `type` must be one of: 'string' | 'number' | 'boolean'
//     | 'date' | 'enum'. No other field types exist in the validator.
//   * `enum` fields must declare `enum: [...]`. Optional: `required`, `default`.
//   * Dates are ISO strings. Time/placement of an entry on the calendar comes
//     from the entry row's own start_at/end_at/all_day columns, NOT from a
//     details field — date fields here are *semantic* (exam_date, finished_at).
//
// EXTRA TOP-LEVEL KEYS (safe): `rooms`, `desc`, `lenses` are advisory metadata
// for routing/UI. The validator ignores everything except `.fields` and
// `.archetype`, so these are backwards-compatible.
//
// `rooms` = which room(s) this type primarily lives in (see rooms.js).
// `lenses` = cross-cutting views it should surface in beyond its room.
// A type with no date never appears on the Calendar; a type whose archetype is
// 'commitment' with status !== 'done' surfaces in Today; anything favourited
// surfaces in Favorites — these are derived, not declared per-type.
// =============================================================================

export const ARCHETYPES = ['moment', 'commitment', 'workstream', 'collection', 'practice', 'anchor']

// Cross-cutting lenses (NOT rooms). Declared here so `lenses` values are checked
// by eye against one list. Today/Calendar/Favorites/Search are derived globally.
export const LENSES = ['today', 'calendar', 'favorites', 'inbox', 'map', 'gallery', 'people', 'search']

export const ENTRY_TYPES = {
  // ---- Universal capture types (belong to no single room) --------------------
  note: {
    archetype: 'moment', label: 'Note', icon: 'N', rooms: [], desc: 'A free thought, quickly captured.',
    fields: { body: { type: 'string' } }
  },
  task: {
    archetype: 'commitment', label: 'Task', icon: 'T', rooms: [], lenses: ['today', 'calendar'],
    desc: 'Something you must do. Dated via the entry start_at.',
    fields: { priority: { type: 'enum', enum: ['low', 'med', 'high'], default: 'med' } }
  },
  event: {
    archetype: 'moment', label: 'Event', icon: 'E', rooms: [], lenses: ['today', 'calendar', 'map'],
    desc: 'Something happening at a time (and maybe a place).',
    fields: { location: { type: 'string' } }
  },
  message: {
    archetype: 'commitment', label: 'Message', icon: 'Ms', rooms: ['relationships', 'career'], lenses: ['today', 'inbox'],
    desc: 'An email/message to send, reply to, or follow up on.',
    fields: {
      channel: { type: 'enum', enum: ['email', 'phone', 'whatsapp', 'other'], default: 'email' },
      direction: { type: 'enum', enum: ['reply', 'send', 'follow-up', 'waiting'], default: 'send' },
      contact: { type: 'string' }
    }
  },
  'voice-note': {
    archetype: 'moment', label: 'Voice note', icon: 'Vo', rooms: ['memories'], lenses: ['inbox'],
    desc: 'A spoken capture; audio lives in files, transcript here.',
    fields: { transcript: { type: 'string' } }
  },

  // ---- Study Hub -------------------------------------------------------------
  module: {
    archetype: 'workstream', label: 'Module', icon: 'Mo', rooms: ['study'], lenses: ['calendar'],
    desc: 'A taught course/module in a study campaign.',
    fields: { code: { type: 'string' }, title: { type: 'string' }, exam_date: { type: 'date' } }
  },
  'module-session': {
    archetype: 'moment', label: 'Study session', icon: 'St', rooms: ['study'], lenses: ['today', 'calendar'],
    desc: 'One block of revision/study, planned or logged.',
    fields: {
      module_code: { type: 'string' }, topic: { type: 'string' },
      planned_min: { type: 'number' }, done_min: { type: 'number' }
    }
  },
  assignment: {
    archetype: 'commitment', label: 'Assignment', icon: 'As', rooms: ['study'], lenses: ['today', 'calendar'],
    desc: 'A piece of coursework with a due date (entry start_at) and weight.',
    fields: { module_code: { type: 'string' }, title: { type: 'string' }, weight: { type: 'number' } }
  },

  // ---- Academia & Research ---------------------------------------------------
  'research-project': {
    archetype: 'workstream', label: 'Research project', icon: 'Rp', rooms: ['academia'],
    desc: 'An ongoing academic/research effort.',
    fields: {
      field: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'active', 'paused', 'done'], default: 'idea' }
    }
  },
  paper: {
    archetype: 'collection', label: 'Paper', icon: 'Pa', rooms: ['academia'],
    desc: 'An academic paper to read, cite, or write.',
    fields: {
      authors: { type: 'string' }, venue: { type: 'string' }, year: { type: 'number' },
      status: { type: 'enum', enum: ['to-read', 'reading', 'read', 'citing', 'writing'], default: 'to-read' },
      url: { type: 'string' }, doi: { type: 'string' }
    }
  },
  'academic-application': {
    archetype: 'workstream', label: 'Academic application', icon: 'Aa', rooms: ['academia'], lenses: ['today', 'calendar'],
    desc: 'PhD / scholarship / programme / grant application. deadline is a date field; entry start_at can mirror it.',
    fields: {
      kind: { type: 'enum', enum: ['phd', 'scholarship', 'programme', 'grant'], default: 'phd' },
      institution: { type: 'string' }, deadline: { type: 'date' },
      status: { type: 'enum', enum: ['researching', 'drafting', 'submitted', 'interview', 'offer', 'rejected'], default: 'researching' }
    }
  },

  // ---- Career & Professional -------------------------------------------------
  'job-application': {
    archetype: 'workstream', label: 'Job application', icon: 'J', rooms: ['career'], lenses: ['today', 'calendar'],
    desc: 'A job in the hiring pipeline. NOTE: job-hunt is a time-boxed workstream; the room outlives it.',
    fields: {
      company: { type: 'string' }, role: { type: 'string' },
      status: { type: 'enum', enum: ['found', 'applied', 'interview', 'offer', 'rejected'], default: 'found' },
      url: { type: 'string' }, deadline: { type: 'date' }, next_action: { type: 'string' }
    }
  },
  cv: {
    archetype: 'collection', label: 'CV / portfolio', icon: 'Cv', rooms: ['career'],
    desc: 'A version of your CV/portfolio; the file lives in files.',
    fields: { label: { type: 'string' }, target: { type: 'string' } }
  },

  // ---- Growth & Learning -----------------------------------------------------
  skill: {
    archetype: 'workstream', label: 'Skill', icon: 'Sk', rooms: ['growth', 'career'],
    desc: 'A skill you are building — language, accent, technical, creative. Tag professional to surface in Career.',
    fields: {
      area: { type: 'enum', enum: ['language', 'professional', 'creative', 'technical', 'other'], default: 'other' },
      level: { type: 'string' },
      status: { type: 'enum', enum: ['exploring', 'learning', 'practising', 'proficient'], default: 'exploring' }
    }
  },
  'practice-session': {
    archetype: 'moment', label: 'Practice', icon: 'Pr', rooms: ['growth'], lenses: ['today', 'calendar'],
    desc: 'One session practising a skill (e.g. British accent drills, language study).',
    fields: { focus: { type: 'string' }, minutes: { type: 'number' } }
  },
  course: {
    archetype: 'collection', label: 'Course', icon: 'Co', rooms: ['growth'],
    desc: 'An online/offline course you are taking.',
    fields: {
      provider: { type: 'string' }, url: { type: 'string' },
      status: { type: 'enum', enum: ['to-do', 'in-progress', 'done'], default: 'to-do' }
    }
  },

  // ---- Body & Health ---------------------------------------------------------
  workout: {
    archetype: 'moment', label: 'Workout', icon: 'W', rooms: ['body'], lenses: ['today', 'calendar'],
    desc: 'A logged or planned workout.',
    fields: { kind: { type: 'string' }, duration_min: { type: 'number' } }
  },
  'workout-plan': {
    archetype: 'workstream', label: 'Training plan', icon: 'Tp', rooms: ['body'],
    desc: 'An ongoing training programme.',
    fields: { goal: { type: 'string' }, days_per_week: { type: 'number' } }
  },
  routine: {
    archetype: 'practice', label: 'Routine', icon: 'Ro', rooms: ['body'], lenses: ['today'],
    desc: 'A recurring care routine — skincare, supplements time, sleep, etc.',
    fields: {
      kind: { type: 'enum', enum: ['skincare', 'supplement', 'sleep', 'mobility', 'other'], default: 'other' },
      cadence: { type: 'string' }, time_of_day: { type: 'string' }
    }
  },
  supplement: {
    archetype: 'practice', label: 'Supplement', icon: 'Su', rooms: ['body'],
    desc: 'A supplement/medication you take on a cadence.',
    fields: { name: { type: 'string' }, dose: { type: 'string' }, cadence: { type: 'string' } }
  },
  meal: {
    archetype: 'moment', label: 'Meal', icon: 'Me', rooms: ['body', 'home'], lenses: ['calendar'],
    desc: 'A meal — a saved recipe, a planned meal, or a logged one.',
    fields: {
      name: { type: 'string' },
      kind: { type: 'enum', enum: ['recipe', 'planned', 'logged'], default: 'planned' },
      calories: { type: 'number' }
    }
  },
  appointment: {
    archetype: 'commitment', label: 'Appointment', icon: 'Ap', rooms: ['body'], lenses: ['today', 'calendar', 'map'],
    desc: 'A medical/professional appointment. Dated via entry start_at; place via entry_places.',
    fields: {
      kind: { type: 'enum', enum: ['doctor', 'dentist', 'optician', 'therapy', 'other'], default: 'doctor' },
      provider: { type: 'string' }
    }
  },
  'medical-record': {
    archetype: 'collection', label: 'Medical record', icon: 'Md', rooms: ['body'],
    desc: 'A health document — result, prescription, letter. File lives in files.',
    fields: {
      kind: { type: 'enum', enum: ['result', 'prescription', 'letter', 'note'], default: 'note' },
      provider: { type: 'string' }
    }
  },
  measurement: {
    archetype: 'moment', label: 'Measurement', icon: 'Mx', rooms: ['body'],
    desc: 'A tracked health metric over time (weight, sleep, BP...).',
    fields: { metric: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' } }
  },

  // ---- Relationships ---------------------------------------------------------
  interaction: {
    archetype: 'moment', label: 'Interaction', icon: 'In', rooms: ['relationships'], lenses: ['today', 'calendar'],
    desc: 'A catch-up, call, meet or message with someone. Link the person via entry_people.',
    fields: {
      kind: { type: 'enum', enum: ['call', 'meet', 'message', 'gift', 'other'], default: 'meet' },
      summary: { type: 'string' }
    }
  },
  'gift-idea': {
    archetype: 'collection', label: 'Gift idea', icon: 'Gi', rooms: ['relationships'],
    desc: 'A gift idea for someone. Link recipient via entry_people.',
    fields: {
      occasion: { type: 'string' }, url: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'bought', 'given'], default: 'idea' }
    }
  },
  'important-date': {
    archetype: 'moment', label: 'Important date', icon: 'Id', rooms: ['relationships'], lenses: ['today', 'calendar'],
    desc: 'A recurring date to remember (anniversary etc.). Birthdays live on people.birthday.',
    fields: {
      kind: { type: 'enum', enum: ['anniversary', 'birthday', 'memorial', 'other'], default: 'other' },
      recurs: { type: 'boolean', default: true }
    }
  },

  // ---- Culture & Art ---------------------------------------------------------
  book: {
    archetype: 'collection', label: 'Book', icon: 'B', rooms: ['culture'],
    desc: 'A book to read or read.',
    fields: {
      author: { type: 'string' },
      status: { type: 'enum', enum: ['to-read', 'reading', 'read'], default: 'to-read' },
      rating: { type: 'number' }, started_at: { type: 'date' }, finished_at: { type: 'date' }
    }
  },
  movie: {
    archetype: 'collection', label: 'Film', icon: 'M', rooms: ['culture'],
    desc: 'A film to watch or watched.',
    fields: {
      director: { type: 'string' },
      status: { type: 'enum', enum: ['to-watch', 'watched'], default: 'to-watch' },
      rating: { type: 'number' }, watched_at: { type: 'date' }
    }
  },
  show: {
    archetype: 'collection', label: 'Series', icon: 'Se', rooms: ['culture'],
    desc: 'A TV series to watch or watching.',
    fields: {
      creator: { type: 'string' },
      status: { type: 'enum', enum: ['to-watch', 'watching', 'watched'], default: 'to-watch' },
      rating: { type: 'number' }
    }
  },
  performance: {
    archetype: 'moment', label: 'Performance', icon: 'Pf', rooms: ['culture'], lenses: ['calendar', 'map'],
    desc: 'A theatre/concert/opera to attend or attended. Venue via entry_places, date via start_at.',
    fields: {
      kind: { type: 'enum', enum: ['theatre', 'concert', 'opera', 'ballet', 'comedy', 'screening'], default: 'theatre' },
      venue: { type: 'string' },
      status: { type: 'enum', enum: ['want', 'booked', 'attended'], default: 'want' }
    }
  },
  exhibition: {
    archetype: 'moment', label: 'Exhibition', icon: 'Ex', rooms: ['culture'], lenses: ['calendar', 'map'],
    desc: 'A museum/gallery exhibition to visit or visited.',
    fields: {
      venue: { type: 'string' },
      status: { type: 'enum', enum: ['want', 'visited'], default: 'want' }
    }
  },

  // ---- Travel ----------------------------------------------------------------
  trip: {
    archetype: 'workstream', label: 'Trip', icon: 'Tr', rooms: ['travel'], lenses: ['calendar', 'map'],
    desc: 'A journey, planned or taken. Photos, places and events link to it via entry_links (part-of).',
    fields: {
      destination: { type: 'string' }, start: { type: 'date' }, end: { type: 'date' },
      status: { type: 'enum', enum: ['idea', 'planning', 'booked', 'ongoing', 'done'], default: 'idea' }
    }
  },
  destination: {
    archetype: 'collection', label: 'Destination', icon: 'De', rooms: ['travel'], lenses: ['map'],
    desc: 'Somewhere you want to go one day (wishlist).',
    fields: {
      country: { type: 'string' },
      kind: { type: 'enum', enum: ['city', 'nature', 'landmark', 'event', 'other'], default: 'city' },
      reason: { type: 'string' }
    }
  },

  // ---- Memories --------------------------------------------------------------
  memory: {
    archetype: 'moment', label: 'Memory', icon: 'My', rooms: ['memories'], lenses: ['calendar', 'gallery', 'map'],
    desc: 'A captured moment. Photos in files, place in entry_places, people in entry_people. taken_at seeds start_at.',
    fields: { caption: { type: 'string' }, taken_at: { type: 'date' } }
  },
  journal: {
    archetype: 'moment', label: 'Journal', icon: 'Ju', rooms: ['memories'], lenses: ['calendar'],
    desc: 'A diary/journal entry.',
    fields: { mood: { type: 'string' }, body: { type: 'string' } }
  },

  // ---- Home & Living ---------------------------------------------------------
  'shopping-item': {
    archetype: 'commitment', label: 'Shopping item', icon: 'Sh', rooms: ['home'], lenses: ['inbox'],
    desc: 'Something to buy. Group with category; a grocery run is a collection of these.',
    fields: {
      item: { type: 'string' }, quantity: { type: 'string' },
      category: { type: 'enum', enum: ['grocery', 'household', 'clothing', 'other'], default: 'grocery' },
      status: { type: 'enum', enum: ['needed', 'bought'], default: 'needed' }
    }
  },
  errand: {
    archetype: 'commitment', label: 'Errand', icon: 'Er', rooms: ['home'], lenses: ['today', 'map'],
    desc: 'An out-of-home chore. Place via entry_places.',
    fields: { what: { type: 'string' } }
  },
  'home-item': {
    archetype: 'collection', label: 'Home item', icon: 'Hi', rooms: ['home'],
    desc: 'Furniture/things for the home (wishlist or bought).',
    fields: {
      item: { type: 'string' }, room: { type: 'string' }, url: { type: 'string' },
      price: { type: 'number' },
      status: { type: 'enum', enum: ['wanted', 'bought'], default: 'wanted' }
    }
  },
  'house-listing': {
    archetype: 'workstream', label: 'House listing', icon: 'Hl', rooms: ['home'], lenses: ['map'],
    desc: 'A property in a house hunt. Place via entry_places.',
    fields: {
      address: { type: 'string' }, url: { type: 'string' }, price: { type: 'number' },
      bedrooms: { type: 'number' },
      status: { type: 'enum', enum: ['saved', 'viewing', 'applied', 'rejected'], default: 'saved' }
    }
  },
  'home-project': {
    archetype: 'workstream', label: 'Home project', icon: 'Hp', rooms: ['home'],
    desc: 'A decorating/improvement project for the home.',
    fields: {
      title: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'active', 'done'], default: 'idea' }
    }
  },

  // ---- Mind & Making (ideas, materials, writing, code) -----------------------
  idea: {
    archetype: 'collection', label: 'Idea', icon: 'Ix', rooms: ['mind'], lenses: ['inbox'],
    desc: 'A spark worth keeping.',
    fields: { area: { type: 'string' }, body: { type: 'string' } }
  },
  material: {
    archetype: 'collection', label: 'Material', icon: 'Ma', rooms: ['mind'],
    desc: 'An article/bookmark/interesting thing to keep.',
    fields: {
      url: { type: 'string' }, source: { type: 'string' }, note: { type: 'string' },
      status: { type: 'enum', enum: ['to-read', 'read', 'archived'], default: 'to-read' }
    }
  },
  writing: {
    archetype: 'workstream', label: 'Writing', icon: 'Wr', rooms: ['mind'],
    desc: 'A piece you are writing — blog, essay, creative.',
    fields: {
      kind: { type: 'enum', enum: ['blog', 'essay', 'creative', 'note'], default: 'blog' },
      status: { type: 'enum', enum: ['idea', 'draft', 'editing', 'published'], default: 'idea' },
      url: { type: 'string' }
    }
  },
  snippet: {
    archetype: 'collection', label: 'Snippet', icon: 'Sn', rooms: ['mind'],
    desc: 'A code snippet — the humble "little GitHub".',
    fields: { language: { type: 'string' }, code: { type: 'string' }, source_url: { type: 'string' } }
  },
  document: {
    archetype: 'collection', label: 'Document', icon: 'Dc', rooms: ['mind', 'home'],
    desc: 'An important admin/legal/reference document. File lives in files.',
    fields: { kind: { type: 'string' }, note: { type: 'string' } }
  },

  // ---- Style / Closet (later, slots in for free) -----------------------------
  'clothing-item': {
    archetype: 'collection', label: 'Clothing', icon: 'Cl', rooms: ['style'], lenses: ['gallery'],
    desc: 'A garment in the virtual closet. Photo in files.',
    fields: {
      category: { type: 'string' }, colour: { type: 'string' }, season: { type: 'string' }
    }
  },

  // ---- Anchors (shared entities referenced by many entries) -------------------
  place: {
    archetype: 'anchor', label: 'Place', icon: 'Pl', rooms: [], lenses: ['map'],
    desc: 'A location. Prefer the places table for real geo; this type is for capture.',
    fields: { name: { type: 'string', required: true }, notes: { type: 'string' } }
  },
  'person-link': {
    archetype: 'anchor', label: 'Person', icon: 'Pe', rooms: ['relationships'], lenses: ['people'],
    desc: 'A person captured inline. Prefer the people table; this is a capture bridge.',
    fields: { name: { type: 'string', required: true }, context: { type: 'string' } }
  }
}

// ---------------------------------------------------------------------------
// Helpers — identical to the live file. Kept so this file is self-contained.
// ---------------------------------------------------------------------------
export function typeExists(type) {
  return Object.hasOwn(ENTRY_TYPES, type)
}

export function archetypeOf(type) {
  return ENTRY_TYPES[type]?.archetype ?? null
}

export function typesByArchetype(archetype) {
  return Object.keys(ENTRY_TYPES).filter((type) => ENTRY_TYPES[type].archetype === archetype)
}

export function typesByRoom(roomSlug) {
  return Object.keys(ENTRY_TYPES).filter((type) => (ENTRY_TYPES[type].rooms || []).includes(roomSlug))
}

function isMissing(value) {
  return value === undefined || value === null || value === ''
}

function validateFieldValue(fieldName, schema, value) {
  if (isMissing(value)) {
    if (schema.required) return { error: `${fieldName} is required` }
    if ('default' in schema) return { value: schema.default }
    return { skip: true }
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') return { error: `${fieldName} must be a string` }
    return { value: value.trim() }
  }
  if (schema.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return { error: `${fieldName} must be a number` }
    return { value }
  }
  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') return { error: `${fieldName} must be true or false` }
    return { value }
  }
  if (schema.type === 'date') {
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return { error: `${fieldName} must be an ISO date string` }
    return { value: value.trim() }
  }
  if (schema.type === 'enum') {
    if (!schema.enum?.includes(value)) return { error: `${fieldName} must be one of: ${schema.enum.join(', ')}` }
    return { value }
  }
  return { error: `${fieldName} has unsupported field type: ${schema.type}` }
}

export function validateDetails(type, details = {}) {
  if (!typeExists(type)) return { ok: false, value: {}, errors: [`unknown entry type: ${type}`], stripped: [] }
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return { ok: false, value: {}, errors: ['details must be an object'], stripped: [] }
  }
  const fields = ENTRY_TYPES[type].fields || {}
  const stripped = Object.keys(details).filter((key) => !Object.hasOwn(fields, key))
  const value = {}
  const errors = []
  Object.keys(fields).forEach((fieldName) => {
    const result = validateFieldValue(fieldName, fields[fieldName], details[fieldName])
    if (result.error) { errors.push(result.error); return }
    if (!result.skip) value[fieldName] = result.value
  })
  return { ok: errors.length === 0, value, errors, stripped }
}
