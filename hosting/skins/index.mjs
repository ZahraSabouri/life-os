// One look for the apps Life OS shows in a frame (Study hub, JobMap, Budget, Cardiff Life).
//
// Each app keeps its own files. As its page is served, Life OS adds these to it:
//   boot.js        tells the page which style is chosen, and when it changes
//   palettes.css   the four styles' colours (the same file the Life OS pages use)
//   fonts.css      the shared fonts
//   shared.css     what every app takes from the style whatever its own CSS says
//   apps/<id>.css  that app's layer: its colours, type and shapes tied to the shared ones
//   apps/<id>.js   for an app that has one: what Life OS adds to its behaviour (Cardiff Life's
//                  address, so Back and a link can open one event)
// An app that writes its colours straight into its CSS (Budget, Cardiff Life) also has those
// colours rewritten as blends of the shared palette (recolor.mjs).
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createRecolor } from './recolor.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(here, 'public')
const MARK = 'data-life-os-skin'

// `anchors`: the app's own card, page, ink, accent, red, amber and blue, for recolouring.
// `spread`: see recolor.mjs (lower keeps more hues of the app's own).
export const SKINNED_APPS = {
  'study-hub': {},
  jobmap: {},
  budget: { anchors: { card: '#fffdf7', bg: '#f4f5ec', ink: '#263d33', accent: '#315b48', red: '#a44935', amber: '#9a6a1f', blue: '#3d5f8f' }, spread: 0.5 },
  'cardiff-life': { anchors: { card: '#fffefa', bg: '#f5f4ee', ink: '#263b35', accent: '#285d48', red: '#a44935', amber: '#8c5b12', blue: '#326b8c' }, spread: 0.24 },
}

const appScript = (app) => fs.existsSync(path.join(publicDir, 'apps', `${app}.js`))

export function skinTags(app) {
  return `<script ${MARK} src="/skins/boot.js"></script>`
    + `<link ${MARK} rel="stylesheet" href="/skins/palettes.css">`
    + `<link ${MARK} rel="stylesheet" href="/skins/fonts.css">`
    + `<link ${MARK} rel="stylesheet" href="/skins/shared.css">`
    + `<link ${MARK} rel="stylesheet" href="/skins/apps/${app}.css">`
    + (appScript(app) ? `<script ${MARK} defer src="/skins/apps/${app}.js"></script>` : '')
}

const recolorers = new Map()
const remembered = new Map()

// The page of a framed app, with the shared look added. Unknown pages are returned as they are.
export function skinHtml(html, app) {
  const config = SKINNED_APPS[app]
  if (!config) throw new Error(`No skin is defined for ${app}`)
  if (typeof html !== 'string' || html.includes(MARK)) return html
  const key = createHash('sha1').update(html).digest('hex')
  const earlier = remembered.get(app)
  if (earlier?.key === key) return earlier.html
  let out = html
  if (config.anchors) {
    if (!recolorers.has(app)) recolorers.set(app, createRecolor(config.anchors, { spread: config.spread }))
    const recolor = recolorers.get(app)
    out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_match, open, css, close) => open + recolor(css) + close)
  }
  const head = out.search(/<\/head>/i)
  if (head >= 0) out = out.slice(0, head) + skinTags(app) + out.slice(head)
  remembered.set(app, { key, html: out })
  return out
}

// Serves an app's own page file with the shared look added.
export function skinnedPage(file, app) {
  return async (_req, res, next) => {
    try {
      const html = await fs.promises.readFile(file, 'utf8')
      res.set('Cache-Control', 'no-store').type('html').send(skinHtml(html, app))
    } catch (error) {
      next(error)
    }
  }
}

// /skins/*: the shared files. `palettes` is the frontend's own palette file.
export function skinFiles(express, { palettes }) {
  const router = express.Router()
  const fresh = (res) => res.set('Cache-Control', 'no-cache')
  router.get('/palettes.css', (_req, res) => fresh(res).type('css').sendFile(palettes))
  router.use(express.static(publicDir, {
    index: false,
    setHeaders(res, filePath) {
      // Fonts never change; the small text files are checked again on each visit.
      res.setHeader('Cache-Control', /\.woff2$/.test(filePath) ? 'public, max-age=31536000, immutable' : 'no-cache')
    },
  }))
  router.use((_req, res) => res.status(404).type('text').send('No such skin file.'))
  return router
}
