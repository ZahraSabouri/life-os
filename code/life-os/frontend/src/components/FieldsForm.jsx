import { ENTRY_TYPES } from '@shared/entryTypes.js'

function buildTypeGroups() {
  const groups = new Map()

  Object.entries(ENTRY_TYPES).forEach(([type, config]) => {
    const rooms = Array.isArray(config.rooms) && config.rooms.length ? config.rooms : ['general']

    rooms.forEach((room) => {
      const current = groups.get(room) || []
      current.push([type, config])
      groups.set(room, current)
    })
  })

  return Array.from(groups.entries()).map(([room, types]) => ({ room, types }))
}

const TYPE_GROUPS = buildTypeGroups()

function valueFor(details, name, schema) {
  if (details[name] !== undefined) return details[name]
  if ('default' in schema) return schema.default
  return schema.type === 'boolean' ? false : ''
}

export default function FieldsForm({ details, onChange, type, skip = [] }) {
  const fields = ENTRY_TYPES[type]?.fields || {}
  const fieldEntries = Object.entries(fields).filter(([name]) => !skip.includes(name))

  if (!fieldEntries.length || type === 'note') return null

  function updateField(name, schema, rawValue) {
    let value = rawValue

    if (schema.type === 'number') {
      value = rawValue === '' ? '' : Number(rawValue)
    }

    if (schema.type === 'boolean') {
      value = Boolean(rawValue)
    }

    onChange({
      ...details,
      [name]: value
    })
  }

  return (
    <div className="details-fields" aria-label={`${ENTRY_TYPES[type].label} fields`}>
      {fieldEntries.map(([name, schema]) => {
        const label = name.replaceAll('_', ' ')
        const value = valueFor(details, name, schema)

        if (schema.type === 'enum') {
          return (
            <label key={name}>
              <span>{label}</span>
              <select
                value={value}
                onChange={(event) => updateField(name, schema, event.target.value)}
              >
                {schema.enum.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          )
        }

        if (schema.type === 'boolean') {
          return (
            <label className="inline-check detail-check" key={name}>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => updateField(name, schema, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          )
        }

        return (
          <label key={name}>
            <span>{label}{schema.required ? ' *' : ''}</span>
            <input
              type={schema.type === 'number' ? 'number' : schema.type === 'date' ? 'date' : 'text'}
              value={value}
              onChange={(event) => updateField(name, schema, event.target.value)}
            />
          </label>
        )
      })}
    </div>
  )
}

export { TYPE_GROUPS }
