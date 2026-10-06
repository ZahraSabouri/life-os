// The open semester's modules. They are records the owner adds, edits and removes;
// none is written into the app.
import { openSemester } from '../hub/session.js'

const session = openSemester()

const VIEWER_BY_TYPE = { pdf: 'frame', html: 'frame', htm: 'frame', md: 'markdown', txt: 'text', csv: 'text', ipynb: 'notebook', mp4: 'video', webm: 'video', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image' }

// A file or link kept for a module in the Life OS materials list, in the shape the module
// pages read.
function materialResource(row, module) {
  const data = row.data ?? {}
  const type = String(data.type ?? '').toLowerCase()
  const viewer = ['frame', 'youtube', 'video', 'image', 'markdown', 'text', 'notebook'].includes(data.viewer) ? data.viewer : VIEWER_BY_TYPE[type] ?? 'file'
  return {
    id: `material-${row.id}`,
    moduleKey: module.id,
    group: data.group || 'Materials',
    title: row.title || data.fileName || 'Material',
    path: data.relativePath || data.fileName || '',
    type: (type || 'file').toUpperCase(),
    viewer,
    url: data.url || '',
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    priority: data.priority === 'high' ? 'high' : 'normal',
    materialId: row.id,
  }
}

const ACCENTS = ['--chart-aml', '--chart-ts', '--chart-project', '--chart-mat700', '--chart-interview']

// A module without a picture of its own gets a plain one with its code or name on it.
function plainPicture(module, index) {
  const hue = (index * 67 + 168) % 360
  const words = String(module.code || module.label || module.title || '').slice(0, 14).replace(/[<>&]/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 42% 40%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 48% 26%)"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="40" y="310" font-family="Georgia, serif" font-size="64" fill="rgba(255,255,255,0.92)">${words}</text></svg>`
  return { url: `data:image/svg+xml,${encodeURIComponent(svg)}`, plain: true }
}

// Pictures that ship with the app are addressed from wherever the app is served.
function picture(value) {
  if (!value?.url) return null
  return value.url.startsWith('/module-heroes/') ? { ...value, url: `${import.meta.env.BASE_URL}${value.url.slice(1)}` } : value
}

export const STUDY_MODULES = session.modules.map((module, index) => {
  const own = Array.isArray(module.resources) ? module.resources : []
  const kept = session.materials.filter((row) => row.module_id === module.rowId && row.data?.url).map((row) => materialResource(row, module))
  const hero = picture(module.hero) ?? picture(module.visual) ?? plainPicture(module, index)
  return {
    ...module,
    accent: String(module.accent ?? '').startsWith('--') ? module.accent : ACCENTS[index % ACCENTS.length],
    hero,
    visual: picture(module.visual) ?? hero,
    resources: [...own, ...kept],
  }
})

export const STUDY_MODULE_MAP = Object.fromEntries(STUDY_MODULES.map((module) => [module.id, module]))

export const moduleForGroup = (moduleGroup) => STUDY_MODULES.find((module) => module.moduleGroup === moduleGroup) ?? null
export const moduleForView = (viewId) => STUDY_MODULES.find((module) => module.viewId === viewId) ?? null
