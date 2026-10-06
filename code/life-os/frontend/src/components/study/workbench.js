import { cardChecklist, dataOf, textEntries, titleOf } from '../../lib/study.js'

export function linkedMaterials(card, materials = []) {
  const ids = new Set(Array.isArray(dataOf(card).resourceIds) ? dataOf(card).resourceIds : [])
  return materials.filter(material => ids.has(material.id))
}

export function workbenchData(card, change, action, { at = new Date().toISOString(), id = crypto.randomUUID() } = {}) {
  const data = dataOf(card)
  return { ...data, ...change, activity: [...(Array.isArray(data.activity) ? data.activity : []), { id, at, action }] }
}

export function toggledChecklist(card, checkId, checked) {
  return cardChecklist(card).map(row => row.id === checkId ? { ...row, done: checked } : row)
}

export function appendedEntry(card, field, text, { at = new Date().toISOString(), id = crypto.randomUUID() } = {}) {
  const trimmed = String(text).trim()
  if (!trimmed) return textEntries(card, field)
  return [...textEntries(card, field), { id, text: trimmed, at }]
}

export const OPAQUE_TOOL = Symbol('original practice value')
export const NEW_TOOL = Symbol('new practice value')
export function newPracticeTool() { return { id: crypto.randomUUID(), title: '', detail: '', output: '', [NEW_TOOL]: true } }
export function practiceRows(value, prefix = 'tool') {
  return (Array.isArray(value) ? value : []).map((row, index) => {
    if (typeof row === 'string') return { id: `${prefix}:${index}`, title: row, detail: '', output: '' }
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { id: `${prefix}:${index}`, title: '', detail: '', output: '', [OPAQUE_TOOL]: row }
    return { ...row, id: row.id || `${prefix}:${index}`, title: String(row.title || row.name || row.prompt || ''), detail: String(row.detail || row.description || ''), output: String(row.output || '') }
  })
}

export function moduleToolsData(original, { drills, recipes, effortTargetPercent, targetHours }) {
  const number = (value, field, maximum = Infinity) => {
    if (value === '' || value == null) return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) throw new Error(`${field} must be between 0 and ${maximum === Infinity ? 'a finite number' : maximum}.`)
    return parsed
  }
  const preserve = rows => practiceRows(rows).filter(row => !row[NEW_TOOL] || row.title.trim() || row.detail.trim() || row.output.trim()).map(row => {
    if (Object.hasOwn(row, OPAQUE_TOOL) && !row.title.trim() && !row.detail.trim() && !row.output.trim()) return row[OPAQUE_TOOL]
    const result = { ...row }; delete result[OPAQUE_TOOL]; delete result[NEW_TOOL]; return result
  })
  return { ...original, drills: preserve(drills), recipes: preserve(recipes),
    effortTargetPercent: number(effortTargetPercent, 'Effort share', 100), targetHours: number(targetHours, 'Study hour target') }
}

export function materialShelves(materials) {
  const shelves = new Map()
  for (const material of materials) {
    const group = dataOf(material).group || 'Other materials'
    if (!shelves.has(group)) shelves.set(group, [])
    shelves.get(group).push(material)
  }
  return [...shelves].sort(([a], [b]) => a.localeCompare(b)).map(([group, rows]) => ({ group, materials: rows, reviewed: rows.filter(row => dataOf(row).reviewed).length }))
}

export function materialViewer(material) {
  const data = dataOf(material), url = String(data.url || '')
  return data.viewer === 'pdf' || /\.pdf(?:[?#]|$)/i.test(url) ? 'frame' : data.viewer === 'ipynb' || /\.ipynb(?:[?#]|$)/i.test(url) ? 'notebook' : data.viewer || 'file'
}

export function initialSemester(workspace, today) {
  const semesters = workspace.semesters || [], preferences = dataOf((workspace.settings || []).find(row => dataOf(row).key === 'preferences'))
  if (Object.hasOwn(preferences, 'selectedSemesterId') && (preferences.selectedSemesterId === '' || semesters.some(row => row.id === preferences.selectedSemesterId))) return preferences.selectedSemesterId
  const current = semesters.find(row => !['archived', 'cancelled', 'completed', 'done'].includes(row.status) && row.start_date && row.end_date && row.start_date <= today && row.end_date >= today)
  if (current) return current.id
  return semesters.some(row => row.id === preferences.activeSemesterId) ? preferences.activeSemesterId : ''
}

export function moduleTitle(module) {
  const title = titleOf(module), code = String(dataOf(module).code || '').trim()
  return code && !title.toLowerCase().includes(code.toLowerCase()) ? `${code} · ${title}` : title
}
