// Small things Life OS remembers for the whole app, each under a short key: her targets, what
// she has already seen of the notices, her saved sound links. One row per key in the core.
// The rules for a key and its value live here so the route and its tests share them.

export const SETTING_KEY = /^[a-z][a-z0-9-]{0,40}$/
export const SETTING_MAX_BYTES = 256 * 1024

// Returns the value as JSON text, or throws with a plain reason.
export function settingText(key, value) {
  if (typeof key !== 'string' || !SETTING_KEY.test(key)) throw Object.assign(new Error('A setting\'s name is lowercase letters, digits and dashes'), { status: 400 })
  if (value === undefined) throw Object.assign(new Error('Send the value to keep'), { status: 400 })
  let text
  try { text = JSON.stringify(value) } catch { throw Object.assign(new Error('The value cannot be kept'), { status: 400 }) }
  if (text === undefined) throw Object.assign(new Error('The value cannot be kept'), { status: 400 })
  if (new TextEncoder().encode(text).length > SETTING_MAX_BYTES) throw Object.assign(new Error('The value is too large to keep as a setting'), { status: 413 })
  return text
}

export function settingValue(text) {
  try { return JSON.parse(text) } catch { return null }
}
