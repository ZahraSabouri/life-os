// Takes the Guide's pictures from the running Life OS and puts them in guide-shots/ (which git
// leaves alone: they show her own records). Run it while Life OS is running:
//
//   node scripts/guide-shots.mjs                 every picture
//   node scripts/guide-shots.mjs --only court.jpg,today.jpg
//   node scripts/guide-shots.mjs --base http://127.0.0.1:47860     (the try-out)
//
// It only looks: every request that would change something is answered inside the browser and
// never reaches Life OS. One recipe for each picture named in the Guide's words
// (code/life-os/frontend/src/guide/chapters.js); a picture whose recipe fails is reported and
// the rest are still taken.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { GUIDE_IMAGES } from '../code/life-os/frontend/src/guide/chapters.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'summer-rescue/package.json'))
const { chromium } = require('playwright-core')
const args = process.argv.slice(2)
const option = (name, fallback) => { const at = args.indexOf(name); return at >= 0 && args[at + 1] ? args[at + 1] : fallback }
const base = option('--base', 'http://127.0.0.1:47850')
const only = option('--only', '').split(',').map((name) => name.trim()).filter(Boolean)
const out = path.join(root, 'guide-shots')
const VIEW = { width: 1360, height: 900 }
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
async function open(ground = 'modern', mode = 'light') {
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 })
  context.setDefaultTimeout(12_000)
  await context.addInitScript(([g, m]) => { try { localStorage.setItem('life-os.ground', g); localStorage.setItem('life-os.mode', m); localStorage.setItem('life-os.skip-intro', 'true') } catch { /* a page without storage */ } }, [ground, mode])
  // Looking only: nothing that would change her records leaves the browser.
  await context.route('**/*', (route) => (['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })))
  return context
}
const context = await open()
const page = await context.newPage()
const taken = {}
const failed = []
const settle = (ms = 900) => page.waitForTimeout(ms)
const go = async (route, wait) => { await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' }); if (wait) await page.locator(wait).first().waitFor(); await settle() }
const frameOf = async (pattern, wait) => {
  for (let i = 0; i < 40; i += 1) {
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame() && pattern.test(candidate.url()))
    if (frame) { if (wait) await frame.locator(wait).first().waitFor({ timeout: 20_000 }); await settle(1200); return frame }
    await page.waitForTimeout(250)
  }
  throw new Error(`no frame for ${pattern}`)
}
// The whole window as it stands.
async function view(name, target = page) {
  await target.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 88 })
  taken[name] = { ...VIEW }
}
// One part of the page, with a little air round it, cut off at the height of the window.
async function part(name, locator, { pad = 10, maxHeight = VIEW.height - 20 } = {}) {
  const target = locator.first()
  await target.waitFor()
  await target.evaluate((element) => element.scrollIntoView({ block: 'start', inline: 'nearest' }))
  await page.evaluate(() => window.scrollBy(0, -16))
  await page.waitForTimeout(350)
  const box = await target.boundingBox()
  if (!box) throw new Error('nothing to take a picture of')
  const x = Math.max(0, Math.floor(box.x - pad))
  const y = Math.max(0, Math.floor(box.y - pad))
  const clip = { x, y, width: Math.min(VIEW.width - x, Math.ceil(box.width + pad * 2)), height: Math.min(VIEW.height - y, maxHeight, Math.ceil(box.height + pad * 2)) }
  await page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 88, clip })
  taken[name] = { width: clip.width, height: clip.height }
}
const panel = (label) => page.locator(`section.day-panel[aria-label="${label}"]`)
const block = (id) => page.locator('section.analysis-block', { has: page.locator(`#analysis-${id}`) })

const RECIPES = {
  // ---- Finding your way
  'topbar.jpg': async () => { await go('/court', '.court-topbar'); await part('topbar.jpg', page.locator('header.court-topbar'), { pad: 4 }) },
  'strip.jpg': async () => { await go('/jobmap', '.area-today'); await settle(2500); await part('strip.jpg', page.locator('aside.area-today'), { pad: 4 }) },
  // ---- The Court
  'court.jpg': async () => { await go('/court', '.court-ahead'); await view('court.jpg') },
  'court-add.jpg': async () => {
    await go('/court', 'form.day-note')
    await page.locator('form.day-note input').first().fill('17:30 library')
    await settle(500)
    await part('court-add.jpg', page.locator('form.day-note'))
  },
  'court-ahead.jpg': async () => { await go('/court', '.court-ahead'); await part('court-ahead.jpg', page.locator('.court-ahead')) },
  // ---- Today
  'today.jpg': async () => { await go('/today', '.day-path'); await settle(2500); await view('today.jpg') },
  'today-path.jpg': async () => { await go('/today', '.day-path'); await settle(2500); await part('today-path.jpg', page.locator('.day-path')) },
  'today-study.jpg': async () => { await go('/today', '.day-path'); await panel('Study').locator('.day-figure, .day-quiet').first().waitFor(); await part('today-study.jpg', panel('Study')) },
  'today-jobs.jpg': async () => { await go('/today', '.day-path'); await panel('Jobs').locator('.day-figure').waitFor({ timeout: 20_000 }); await part('today-jobs.jpg', panel('Jobs')) },
  'today-home.jpg': async () => { await go('/today', '.day-path'); await panel('Home').locator('h3').first().waitFor({ timeout: 20_000 }); await part('today-home.jpg', panel('Home')) },
  // ---- Plan the week
  'planner.jpg': async () => { await go('/planner', '.planner-week'); await page.locator('.planner-chip').first().waitFor({ timeout: 20_000 }).catch(() => {}); await settle(); await view('planner.jpg') },
  'planner-menu.jpg': async () => {
    await go('/planner', '.planner-week')
    const more = page.locator('.planner-more').first()
    await more.waitFor({ timeout: 20_000 })
    await more.click()
    await part('planner-menu.jpg', page.locator('section.planner-day', { has: page.locator('.planner-actions') }))
  },
  'planner-repeating.jpg': async () => {
    await go('/planner', '.planner-repeating')
    const change = page.locator('.planner-repeating button', { hasText: 'Change' }).first()
    await change.waitFor({ timeout: 20_000 })
    await change.click()
    await part('planner-repeating.jpg', page.locator('.planner-repeating'))
  },
  // ---- Calendar
  'calendar.jpg': async () => { await go('/calendar', '.calendar-layout'); await settle(4000); await view('calendar.jpg') },
  // ---- Review
  'review.jpg': async () => { await go('/review', '.review-tiles'); await settle(1500); await view('review.jpg') },
  'review-days.jpg': async () => { await go('/review', '.review-days'); await part('review-days.jpg', page.locator('.review-days')) },
  'review-eight.jpg': async () => { await go('/review', '.review-progress'); await settle(2500); await part('review-eight.jpg', page.locator('.review-progress')) },
  // ---- Analysis
  'analysis-stats.jpg': async () => { await go('/review?view=analysis', '.analysis-block'); await view('analysis-stats.jpg') },
  'analysis-burn.jpg': async () => { await go('/review?view=analysis', '.analysis-block'); await part('analysis-burn.jpg', block('burn')) },
  'analysis-hours.jpg': async () => {
    await go('/review?view=analysis', '.analysis-block')
    await block('weekdays').evaluate((element) => element.scrollIntoView({ block: 'start' }))
    await page.evaluate(() => window.scrollBy(0, -16))
    await settle(400)
    await view('analysis-hours.jpg')
  },
  'analysis-jobs.jpg': async () => { await go('/review?view=analysis', '.analysis-block'); await part('analysis-jobs.jpg', block('jobs')) },
  'analysis-files.jpg': async () => { await go('/review?view=analysis', '.analysis-block'); await part('analysis-files.jpg', block('files')) },
  // ---- Ledger
  'ledger.jpg': async () => { await go('/ledger', '.ledger-entry'); await view('ledger.jpg') },
  'ledger-change.jpg': async () => {
    await go('/ledger', '.ledger-entry')
    await page.selectOption('.ledger-find select', 'time-block').catch(() => {})
    await settle(400)
    const entry = page.locator('.ledger-entry').first()
    await entry.locator('.ledger-entry-actions button', { hasText: 'Change' }).click()
    await part('ledger-change.jpg', entry)
  },
  // ---- Focus and notices
  'focus.jpg': async () => { await go('/today', '.day-path'); await page.locator('.focus-button').first().click(); await settle(700); await part('focus.jpg', page.locator('#focus-panel')) },
  'notices.jpg': async () => { await go('/today', '.day-path'); await settle(3000); await page.locator('.notice-bell').first().click(); await settle(700); await part('notices.jpg', page.locator('#notice-panel')) },
  // ---- Styles
  'styles.jpg': async () => {
    await go('/court', '.court-topbar')
    await page.locator('.style-switch-trigger').first().click()
    await settle(500)
    const menu = await page.locator('.style-switch-menu').first().boundingBox()
    const clip = { x: Math.max(0, Math.floor(menu.x - 260)), y: 0, width: Math.min(VIEW.width - Math.max(0, Math.floor(menu.x - 260)), Math.ceil(menu.width + 290)), height: Math.ceil(menu.y + menu.height + 16) }
    await page.screenshot({ path: path.join(out, 'styles.jpg'), type: 'jpeg', quality: 88, clip })
    taken['styles.jpg'] = { width: clip.width, height: clip.height }
    await page.keyboard.press('Escape')
  },
  ...Object.fromEntries([['style-madder.jpg', 'madder', 'light'], ['style-indigo.jpg', 'indigo', 'light'], ['style-paper.jpg', 'paper', 'light'], ['style-dark.jpg', 'modern', 'dark']].map(([name, ground, mode]) => [name, async () => {
    const other = await open(ground, mode)
    try {
      const tab = await other.newPage()
      await tab.goto(`${base}/court`, { waitUntil: 'domcontentloaded' })
      await tab.locator('.court-ahead').first().waitFor({ timeout: 20_000 })
      await tab.waitForTimeout(1500)
      await view(name, tab)
    } finally { await other.close() }
  }])),
  // ---- Study hub
  'study.jpg': async () => { await go('/study'); await frameOf(/apps\/summer-rescue/, '.sidebar-head'); await settle(2000); await view('study.jpg') },
  'study-semester.jpg': async () => { await go('/study'); const hub = await frameOf(/apps\/summer-rescue/, '.sidebar-head'); await part('study-semester.jpg', hub.locator('.sidebar-head'), { pad: 14 }) },
  'study-setup.jpg': async () => {
    await go('/study#/setup')
    const hub = await frameOf(/apps\/summer-rescue/, '.hub-records')
    // The heading of the first list, with its add button, clear of the hub's own bar at the top.
    await hub.locator('.hub-records h2').first().evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await settle(600)
    await view('study-setup.jpg')
  },
  // ---- Cardiff Life
  'cardiff.jpg': async () => { await go('/cardiff-life'); await frameOf(/apps\/cardiff-life/, '#week-grid'); await view('cardiff.jpg') },
  'cardiff-add.jpg': async () => {
    await go('/cardiff-life')
    const cardiff = await frameOf(/apps\/cardiff-life/, '#add-own')
    await cardiff.locator('#add-own').click()
    await cardiff.locator('#own-form [name=name]').fill('Picnic in Bute Park')
    await settle(400)
    await part('cardiff-add.jpg', cardiff.locator('#own-dialog'))
  },
  'cardiff-detail.jpg': async () => {
    // An example of an event of hers, shown to this browser only: nothing is saved.
    const example = { event_id: 'own-example', name: 'Picnic in Bute Park (an example)', date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()), start_time: '13:00', end_time: '15:00', location: 'Bute Park, by the bridge', activity: 'social', organiser: 'Added by you', cost: 'Free', description: 'Bring a blanket.', source_url: '', status: 'upcoming', own: true, category: '', booking_required: '', experience: '', recurring: '', last_checked: '' }
    const serve = (route) => (route.request().method() === 'GET' ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, events: [example] }) }) : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    await context.route('**/apps/cardiff-life/api/own-events', serve)
    try {
      await go('/cardiff-life')
      const cardiff = await frameOf(/apps\/cardiff-life/, '#week-grid')
      await cardiff.locator('[data-detail="own-example"]').first().click()
      await settle(500)
      await part('cardiff-detail.jpg', cardiff.locator('#event-detail'))
    } finally { await context.unroute('**/apps/cardiff-life/api/own-events', serve) }
  },
  // ---- Budget
  'budget.jpg': async () => { await go('/budget'); await frameOf(/apps\/budget/, 'body'); await settle(2500); await view('budget.jpg') },
  'budget-shopping.jpg': async () => {
    await go('/budget')
    const budget = await frameOf(/apps\/budget/, 'body')
    await settle(2000)
    const entry = budget.locator('button, a, [role="tab"]').filter({ hasText: /^\s*Shopping/i }).first()
    await entry.click({ timeout: 8000 })
    await settle(1500)
    await view('budget-shopping.jpg')
  },
  // ---- JobMap
  'jobmap.jpg': async () => { await go('/jobmap'); await frameOf(/apps\/jobmap/, '.job-row'); await view('jobmap.jpg') },
  'jobmap-details.jpg': async () => {
    await go('/jobmap')
    const jobmap = await frameOf(/apps\/jobmap/, '.job-row')
    await jobmap.locator('.job-row .job-open').first().click()
    await jobmap.locator('aside.detail').waitFor()
    await settle(600)
    await view('jobmap-details.jpg')
  },
  'jobmap-application.jpg': async () => {
    await go('/jobmap')
    const jobmap = await frameOf(/apps\/jobmap/, '.job-row')
    await jobmap.locator('.job-row .job-open').first().click()
    const section = jobmap.locator('aside.detail details', { hasText: 'My application: files, folder and links' })
    if (!(await section.evaluate((element) => element.open))) await section.locator('summary').click()
    await part('jobmap-application.jpg', section, { pad: 14 })
  },
}

const missing = GUIDE_IMAGES.filter((name) => !RECIPES[name])
if (missing.length) console.log(`No recipe yet for: ${missing.join(', ')}`)
const wanted = (only.length ? only : GUIDE_IMAGES).filter((name) => RECIPES[name])
for (const name of wanted) {
  try {
    await RECIPES[name]()
    console.log(`  taken   ${name}  ${taken[name].width}×${taken[name].height}`)
  } catch (error) {
    failed.push(name)
    console.log(`  FAILED  ${name}: ${String(error.message).split('\n')[0].slice(0, 160)}`)
  }
}
await browser.close()

// The page reads this to know which pictures exist and when they were taken.
const manifestFile = path.join(out, 'manifest.json')
let before = {}
try { before = JSON.parse(fs.readFileSync(manifestFile, 'utf8')).shots ?? {} } catch { before = {} }
const shots = Object.fromEntries(Object.entries({ ...before, ...taken }).filter(([name]) => fs.existsSync(path.join(out, name))))
fs.writeFileSync(manifestFile, JSON.stringify({ takenAt: new Date().toISOString(), base, shots }, null, 2))
const size = Object.keys(shots).reduce((sum, name) => sum + fs.statSync(path.join(out, name)).size, 0)
console.log(`${Object.keys(taken).length} taken now, ${Object.keys(shots).length} of ${GUIDE_IMAGES.length} in the Guide, ${(size / 1_048_576).toFixed(1)} MB in ${out}`)
if (failed.length) { console.log(`Not taken: ${failed.join(', ')}`); process.exitCode = 1 }
