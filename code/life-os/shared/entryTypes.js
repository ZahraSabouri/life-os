export const ARCHETYPES = ['moment', 'commitment', 'workstream', 'collection', 'practice', 'anchor']

export const ENTRY_TYPES = {
  note: {
    archetype: 'moment',
    label: 'Note',
    icon: 'N',
    rooms: [],
    desc: 'A free thought, quickly captured.',
    fields: {
      body: { type: 'string' }
    }
  },
  event: {
    archetype: 'moment',
    label: 'Event',
    icon: 'E',
    rooms: [],
    desc: 'Something happening at a time, maybe in a place.',
    fields: {
      location: { type: 'string' }
    }
  },
  task: {
    archetype: 'commitment',
    label: 'Task',
    icon: 'T',
    rooms: [],
    desc: 'Something you must do. Dated via entry start_at.',
    fields: {
      priority: { type: 'enum', enum: ['low', 'med', 'high'], default: 'med' }
    }
  },
  workout: {
    archetype: 'moment',
    label: 'Workout',
    icon: 'W',
    rooms: ['body'],
    desc: 'A logged or planned workout.',
    fields: {
      kind: { type: 'string' },
      duration_min: { type: 'number' }
    }
  },
  book: {
    archetype: 'collection',
    label: 'Book',
    icon: 'B',
    rooms: ['culture'],
    desc: 'A book to read or read.',
    fields: {
      author: { type: 'string' },
      status: { type: 'enum', enum: ['to-read', 'reading', 'read'], default: 'to-read' },
      rating: { type: 'number' }
    }
  },
  movie: {
    archetype: 'collection',
    label: 'Movie',
    icon: 'M',
    rooms: ['culture'],
    desc: 'A film to watch or watched.',
    fields: {
      director: { type: 'string' },
      status: { type: 'enum', enum: ['to-watch', 'watched'], default: 'to-watch' },
      rating: { type: 'number' },
      watched_at: { type: 'date' }
    }
  },
  place: {
    archetype: 'anchor',
    label: 'Place',
    icon: 'P',
    rooms: ['travel', 'home'],
    desc: 'A location you want to remember.',
    fields: {
      name: { type: 'string', required: true },
      notes: { type: 'string' }
    }
  },
  'person-link': {
    archetype: 'anchor',
    label: 'Person',
    icon: 'Pe',
    rooms: ['relationships'],
    desc: 'A person captured inline. Prefer the people table.',
    fields: {
      name: { type: 'string', required: true },
      context: { type: 'string' }
    }
  },
  'job-application': {
    archetype: 'workstream',
    label: 'Job application',
    icon: 'J',
    rooms: ['career'],
    desc: 'A job in the hiring pipeline.',
    fields: {
      company: { type: 'string' },
      role: { type: 'string' },
      status: { type: 'enum', enum: ['found', 'applied', 'interview', 'offer', 'rejected'], default: 'found' }
    }
  },
  material: {
    archetype: 'collection',
    label: 'Material',
    icon: 'Ma',
    rooms: ['mind'],
    desc: 'An article/bookmark/interesting thing to keep.',
    fields: {
      url: { type: 'string' },
      source: { type: 'string' },
      note: { type: 'string' }
    }
  },
  snippet: {
    archetype: 'collection',
    label: 'Snippet',
    icon: 'S',
    rooms: ['mind'],
    desc: 'A code snippet to keep.',
    fields: {
      language: { type: 'string' },
      code: { type: 'string' },
      source_url: { type: 'string' }
    }
  },
  'shopping-item': {
    archetype: 'commitment',
    label: 'Shopping item',
    icon: 'Sh',
    rooms: ['home'],
    desc: 'Something to buy.',
    fields: {
      item: { type: 'string' },
      quantity: { type: 'string' },
      status: { type: 'enum', enum: ['needed', 'bought'], default: 'needed' }
    }
  },
  module: {
    archetype: 'workstream',
    label: 'Module',
    icon: 'Mo',
    rooms: ['study'],
    desc: 'A taught course/module in a study campaign.',
    fields: {
      code: { type: 'string' },
      title: { type: 'string' },
      exam_date: { type: 'date' }
    }
  },
  'module-session': {
    archetype: 'moment',
    label: 'Study session',
    icon: 'St',
    rooms: ['study'],
    desc: 'One block of revision/study, planned or logged.',
    fields: {
      module_code: { type: 'string' },
      topic: { type: 'string' },
      planned_min: { type: 'number' },
      done_min: { type: 'number' }
    }
  }
  ,message: {
    archetype: 'commitment',
    label: 'Message',
    icon: 'Ms',
    rooms: ['relationships', 'career'],
    desc: 'An email/message to send, reply to, or follow up on.',
    fields: {
      channel: { type: 'enum', enum: ['email', 'phone', 'whatsapp', 'other'], default: 'email' },
      direction: { type: 'enum', enum: ['reply', 'send', 'follow-up', 'waiting'], default: 'send' },
      contact: { type: 'string' }
    }
  },
  'voice-note': {
    archetype: 'moment',
    label: 'Voice note',
    icon: 'Vo',
    rooms: ['memories'],
    desc: 'A spoken capture; audio lives in files, transcript here.',
    fields: { transcript: { type: 'string' } }
  },
  assignment: {
    archetype: 'commitment',
    label: 'Assignment',
    icon: 'As',
    rooms: ['study'],
    desc: 'A piece of coursework with a due date and weight.',
    fields: { module_code: { type: 'string' }, title: { type: 'string' }, weight: { type: 'number' } }
  },
  'research-project': {
    archetype: 'workstream',
    label: 'Research project',
    icon: 'Rp',
    rooms: ['academia'],
    desc: 'An ongoing academic/research effort.',
    fields: {
      field: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'active', 'paused', 'done'], default: 'idea' }
    }
  },
  paper: {
    archetype: 'collection',
    label: 'Paper',
    icon: 'Pa',
    rooms: ['academia'],
    desc: 'An academic paper to read, cite, or write.',
    fields: {
      authors: { type: 'string' },
      venue: { type: 'string' },
      year: { type: 'number' },
      status: { type: 'enum', enum: ['to-read', 'reading', 'read', 'citing', 'writing'], default: 'to-read' },
      url: { type: 'string' },
      doi: { type: 'string' }
    }
  },
  'academic-application': {
    archetype: 'workstream',
    label: 'Academic application',
    icon: 'Aa',
    rooms: ['academia'],
    desc: 'PhD / scholarship / programme / grant application.',
    fields: {
      kind: { type: 'enum', enum: ['phd', 'scholarship', 'programme', 'grant'], default: 'phd' },
      institution: { type: 'string' },
      deadline: { type: 'date' },
      status: { type: 'enum', enum: ['researching', 'drafting', 'submitted', 'interview', 'offer', 'rejected'], default: 'researching' }
    }
  },
  cv: {
    archetype: 'collection',
    label: 'CV / portfolio',
    icon: 'Cv',
    rooms: ['career'],
    desc: 'A version of your CV/portfolio; the file lives in files.',
    fields: { label: { type: 'string' }, target: { type: 'string' } }
  },
  skill: {
    archetype: 'workstream',
    label: 'Skill',
    icon: 'Sk',
    rooms: ['growth', 'career'],
    desc: 'A skill you are building.',
    fields: {
      area: { type: 'enum', enum: ['language', 'professional', 'creative', 'technical', 'other'], default: 'other' },
      level: { type: 'string' },
      status: { type: 'enum', enum: ['exploring', 'learning', 'practising', 'proficient'], default: 'exploring' }
    }
  },
  'practice-session': {
    archetype: 'moment',
    label: 'Practice',
    icon: 'Pr',
    rooms: ['growth'],
    desc: 'One session practising a skill.',
    fields: { focus: { type: 'string' }, minutes: { type: 'number' } }
  },
  course: {
    archetype: 'collection',
    label: 'Course',
    icon: 'Co',
    rooms: ['growth'],
    desc: 'An online/offline course you are taking.',
    fields: {
      provider: { type: 'string' },
      url: { type: 'string' },
      status: { type: 'enum', enum: ['to-do', 'in-progress', 'done'], default: 'to-do' }
    }
  },
  'workout-plan': {
    archetype: 'workstream',
    label: 'Training plan',
    icon: 'Tp',
    rooms: ['body'],
    desc: 'An ongoing training programme.',
    fields: { goal: { type: 'string' }, days_per_week: { type: 'number' } }
  },
  routine: {
    archetype: 'practice',
    label: 'Routine',
    icon: 'Ro',
    rooms: ['body'],
    desc: 'A recurring care routine.',
    fields: {
      kind: { type: 'enum', enum: ['skincare', 'supplement', 'sleep', 'mobility', 'other'], default: 'other' },
      cadence: { type: 'string' },
      time_of_day: { type: 'string' }
    }
  },
  supplement: {
    archetype: 'practice',
    label: 'Supplement',
    icon: 'Su',
    rooms: ['body'],
    desc: 'A supplement/medication you take on a cadence.',
    fields: { name: { type: 'string' }, dose: { type: 'string' }, cadence: { type: 'string' } }
  },
  meal: {
    archetype: 'moment',
    label: 'Meal',
    icon: 'Me',
    rooms: ['body', 'home'],
    desc: 'A meal - a saved recipe, a planned meal, or a logged one.',
    fields: {
      name: { type: 'string' },
      kind: { type: 'enum', enum: ['recipe', 'planned', 'logged'], default: 'planned' },
      calories: { type: 'number' }
    }
  },
  appointment: {
    archetype: 'commitment',
    label: 'Appointment',
    icon: 'Ap',
    rooms: ['body'],
    desc: 'A medical/professional appointment.',
    fields: {
      kind: { type: 'enum', enum: ['doctor', 'dentist', 'optician', 'therapy', 'other'], default: 'doctor' },
      provider: { type: 'string' }
    }
  },
  'medical-record': {
    archetype: 'collection',
    label: 'Medical record',
    icon: 'Md',
    rooms: ['body'],
    desc: 'A health document.',
    fields: {
      kind: { type: 'enum', enum: ['result', 'prescription', 'letter', 'note'], default: 'note' },
      provider: { type: 'string' }
    }
  },
  measurement: {
    archetype: 'moment',
    label: 'Measurement',
    icon: 'Mx',
    rooms: ['body'],
    desc: 'A tracked health metric over time.',
    fields: { metric: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' } }
  },
  interaction: {
    archetype: 'moment',
    label: 'Interaction',
    icon: 'In',
    rooms: ['relationships'],
    desc: 'A catch-up, call, meet or message with someone.',
    fields: {
      kind: { type: 'enum', enum: ['call', 'meet', 'message', 'gift', 'other'], default: 'meet' },
      summary: { type: 'string' }
    }
  },
  'gift-idea': {
    archetype: 'collection',
    label: 'Gift idea',
    icon: 'Gi',
    rooms: ['relationships'],
    desc: 'A gift idea for someone.',
    fields: {
      occasion: { type: 'string' },
      url: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'bought', 'given'], default: 'idea' }
    }
  },
  'important-date': {
    archetype: 'moment',
    label: 'Important date',
    icon: 'Id',
    rooms: ['relationships'],
    desc: 'A recurring date to remember.',
    fields: {
      kind: { type: 'enum', enum: ['anniversary', 'birthday', 'memorial', 'other'], default: 'other' },
      recurs: { type: 'boolean', default: true }
    }
  },
  show: {
    archetype: 'collection',
    label: 'Series',
    icon: 'Se',
    rooms: ['culture'],
    desc: 'A TV series to watch or watching.',
    fields: {
      creator: { type: 'string' },
      status: { type: 'enum', enum: ['to-watch', 'watching', 'watched'], default: 'to-watch' },
      rating: { type: 'number' }
    }
  },
  performance: {
    archetype: 'moment',
    label: 'Performance',
    icon: 'Pf',
    rooms: ['culture'],
    desc: 'A theatre/concert/opera to attend or attended.',
    fields: {
      kind: { type: 'enum', enum: ['theatre', 'concert', 'opera', 'ballet', 'comedy', 'screening'], default: 'theatre' },
      venue: { type: 'string' },
      status: { type: 'enum', enum: ['want', 'booked', 'attended'], default: 'want' }
    }
  },
  exhibition: {
    archetype: 'moment',
    label: 'Exhibition',
    icon: 'Ex',
    rooms: ['culture'],
    desc: 'A museum/gallery exhibition to visit or visited.',
    fields: {
      venue: { type: 'string' },
      status: { type: 'enum', enum: ['want', 'visited'], default: 'want' }
    }
  },
  trip: {
    archetype: 'workstream',
    label: 'Trip',
    icon: 'Tr',
    rooms: ['travel'],
    desc: 'A journey, planned or taken.',
    fields: {
      destination: { type: 'string' },
      start: { type: 'date' },
      end: { type: 'date' },
      status: { type: 'enum', enum: ['idea', 'planning', 'booked', 'ongoing', 'done'], default: 'idea' }
    }
  },
  destination: {
    archetype: 'collection',
    label: 'Destination',
    icon: 'De',
    rooms: ['travel'],
    desc: 'Somewhere you want to go one day.',
    fields: {
      country: { type: 'string' },
      kind: { type: 'enum', enum: ['city', 'nature', 'landmark', 'event', 'other'], default: 'city' },
      reason: { type: 'string' }
    }
  },
  memory: {
    archetype: 'moment',
    label: 'Memory',
    icon: 'My',
    rooms: ['memories'],
    desc: 'A captured moment.',
    fields: { caption: { type: 'string' }, taken_at: { type: 'date' } }
  },
  journal: {
    archetype: 'moment',
    label: 'Journal',
    icon: 'Ju',
    rooms: ['memories'],
    desc: 'A diary/journal entry.',
    fields: { mood: { type: 'string' }, body: { type: 'string' } }
  },
  errand: {
    archetype: 'commitment',
    label: 'Errand',
    icon: 'Er',
    rooms: ['home'],
    desc: 'An out-of-home chore.',
    fields: { what: { type: 'string' } }
  },
  'home-item': {
    archetype: 'collection',
    label: 'Home item',
    icon: 'Hi',
    rooms: ['home'],
    desc: 'Furniture/things for the home.',
    fields: {
      item: { type: 'string' },
      room: { type: 'string' },
      url: { type: 'string' },
      price: { type: 'number' },
      status: { type: 'enum', enum: ['wanted', 'bought'], default: 'wanted' }
    }
  },
  'house-listing': {
    archetype: 'workstream',
    label: 'House listing',
    icon: 'Hl',
    rooms: ['home'],
    desc: 'A property in a house hunt.',
    fields: {
      address: { type: 'string' },
      url: { type: 'string' },
      price: { type: 'number' },
      bedrooms: { type: 'number' },
      status: { type: 'enum', enum: ['saved', 'viewing', 'applied', 'rejected'], default: 'saved' }
    }
  },
  'home-project': {
    archetype: 'workstream',
    label: 'Home project',
    icon: 'Hp',
    rooms: ['home'],
    desc: 'A decorating/improvement project for the home.',
    fields: {
      title: { type: 'string' },
      status: { type: 'enum', enum: ['idea', 'active', 'done'], default: 'idea' }
    }
  },
  idea: {
    archetype: 'collection',
    label: 'Idea',
    icon: 'Ix',
    rooms: ['mind'],
    desc: 'A spark worth keeping.',
    fields: { area: { type: 'string' }, body: { type: 'string' } }
  },
  writing: {
    archetype: 'workstream',
    label: 'Writing',
    icon: 'Wr',
    rooms: ['mind'],
    desc: 'A piece you are writing.',
    fields: {
      kind: { type: 'enum', enum: ['blog', 'essay', 'creative', 'note'], default: 'blog' },
      status: { type: 'enum', enum: ['idea', 'draft', 'editing', 'published'], default: 'idea' },
      url: { type: 'string' }
    }
  },
  document: {
    archetype: 'collection',
    label: 'Document',
    icon: 'Dc',
    rooms: ['mind', 'home'],
    desc: 'An important admin/legal/reference document.',
    fields: { kind: { type: 'string' }, note: { type: 'string' } }
  },
  'clothing-item': {
    archetype: 'collection',
    label: 'Clothing',
    icon: 'Cl',
    rooms: ['style'],
    desc: 'A garment in the virtual closet.',
    fields: {
      category: { type: 'string' },
      colour: { type: 'string' },
      season: { type: 'string' }
    }
  }
}

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
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { error: `${fieldName} must be a number` }
    }
    return { value }
  }

  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') return { error: `${fieldName} must be true or false` }
    return { value }
  }

  if (schema.type === 'date') {
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      return { error: `${fieldName} must be an ISO date string` }
    }
    return { value: value.trim() }
  }

  if (schema.type === 'enum') {
    if (!schema.enum?.includes(value)) {
      return { error: `${fieldName} must be one of: ${schema.enum.join(', ')}` }
    }
    return { value }
  }

  return { error: `${fieldName} has unsupported field type: ${schema.type}` }
}

export function validateDetails(type, details = {}) {
  if (!typeExists(type)) {
    return {
      ok: false,
      value: {},
      errors: [`unknown entry type: ${type}`],
      stripped: []
    }
  }

  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {
      ok: false,
      value: {},
      errors: ['details must be an object'],
      stripped: []
    }
  }

  const fields = ENTRY_TYPES[type].fields || {}
  const fieldNames = Object.keys(fields)
  const stripped = Object.keys(details).filter((key) => !Object.hasOwn(fields, key))
  const value = {}
  const errors = []

  fieldNames.forEach((fieldName) => {
    const result = validateFieldValue(fieldName, fields[fieldName], details[fieldName])

    if (result.error) {
      errors.push(result.error)
      return
    }

    if (!result.skip) {
      value[fieldName] = result.value
    }
  })

  return {
    ok: errors.length === 0,
    value,
    errors,
    stripped
  }
}
