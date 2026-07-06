export const ARCHETYPES = ['moment', 'commitment', 'workstream', 'collection', 'practice', 'anchor']

export const ENTRY_TYPES = {
  note: {
    archetype: 'moment',
    label: 'Note',
    icon: 'N',
    fields: {
      body: { type: 'string' }
    }
  },
  event: {
    archetype: 'moment',
    label: 'Event',
    icon: 'E',
    fields: {
      location: { type: 'string' }
    }
  },
  task: {
    archetype: 'commitment',
    label: 'Task',
    icon: 'T',
    fields: {
      priority: { type: 'enum', enum: ['low', 'med', 'high'], default: 'med' }
    }
  },
  workout: {
    archetype: 'moment',
    label: 'Workout',
    icon: 'W',
    fields: {
      kind: { type: 'string' },
      duration_min: { type: 'number' }
    }
  },
  book: {
    archetype: 'collection',
    label: 'Book',
    icon: 'B',
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
    fields: {
      name: { type: 'string', required: true },
      notes: { type: 'string' }
    }
  },
  'person-link': {
    archetype: 'anchor',
    label: 'Person',
    icon: 'Pe',
    fields: {
      name: { type: 'string', required: true },
      context: { type: 'string' }
    }
  },
  'job-application': {
    archetype: 'workstream',
    label: 'Job application',
    icon: 'J',
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
    fields: {
      module_code: { type: 'string' },
      topic: { type: 'string' },
      planned_min: { type: 'number' },
      done_min: { type: 'number' }
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
