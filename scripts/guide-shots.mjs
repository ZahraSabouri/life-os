// Takes the Guide's pictures from the running Life OS and puts them in guide-shots/ (which git
// leaves alone: they show her own records). Run it while Life OS is running, or press "Retake
// the pictures" on the Guide page, which runs it for her:
//
//   node scripts/guide-shots.mjs                 every picture
//   node scripts/guide-shots.mjs --only court.jpg,today.jpg
//   node scripts/guide-shots.mjs --base http://127.0.0.1:47860     (the try-out)
//
// It only looks: every request that would change something is answered inside the browser and
// never reaches Life OS. One recipe for each picture named in the Guide's words
// (code/life-os/frontend/src/guide/chapters.js); a picture whose recipe fails is reported and
// the rest are still taken. A recipe may draw numbered circles on its picture ("marks"): the
// Guide's words name them in the same order.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { CHAPTERS, GUIDE_IMAGES } from '../code/life-os/frontend/src/guide/chapters.js'

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
const notes = []
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

// ---- Numbered circles on a picture ---------------------------------------------------------
// Each mark is a place: a CSS selector, or "text:Words" for the first visible thing that starts
// with those words; "##2" after either picks the third match. Drawn at the place's top left
// corner, in the colour the Guide's legend uses, inside the page or the app's own frame.
const DRAW = (list) => {
  const seen = (element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth }
  const find = (spec) => {
    const [place, nth] = spec.split('##')
    const all = place.startsWith('text:')
      ? [...document.querySelectorAll('button, a, summary, h1, h2, h3, label, [role="tab"], span, b, strong, p')].filter((element) => { const words = element.textContent.trim().replace(/\s+/g, ' '); return words.startsWith(place.slice(5)) && words.length < place.length + 36 })
      : [...document.querySelectorAll(place)]
    return all.filter(seen)[Number(nth) || 0] ?? null
  }
  const missing = []
  list.forEach((spec, at) => {
    const element = spec ? find(spec) : null
    if (!element) { missing.push(at + 1); return }
    const box = element.getBoundingClientRect()
    const mark = document.createElement('div')
    mark.className = 'guide-mark'
    mark.textContent = String(at + 1)
    mark.style.cssText = `position:fixed;left:${Math.max(2, Math.min(innerWidth - 26, box.left - 9))}px;top:${Math.max(2, Math.min(innerHeight - 26, box.top - 9))}px;z-index:2147483647;width:24px;height:24px;border-radius:50%;background:#c2255c;color:#fff;font:700 13px/24px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 7px rgba(0,0,0,.4);pointer-events:none;letter-spacing:0`
    // An open modal dialog is drawn above everything else on the page, so its marks go inside it.
    ;(element.closest('dialog[open]') ?? document.body).appendChild(mark)
  })
  return missing
}
const CLEAR = () => document.querySelectorAll('.guide-mark').forEach((mark) => mark.remove())
async function withMarks(name, marks, on, shoot) {
  // The pointer is put aside, so nothing in the picture looks pointed at.
  await page.mouse.move(1, VIEW.height - 1).catch(() => {})
  if (!marks?.length) return shoot()
  const missing = await on.evaluate(DRAW, marks)
  if (missing.length) notes.push(`${name}: no place found for mark ${missing.join(', ')}`)
  await page.waitForTimeout(120)
  try { return await shoot() } finally { await on.evaluate(CLEAR).catch(() => {}) }
}
// The whole window as it stands.
async function view(name, { marks, on = page, tab = page } = {}) {
  await withMarks(name, marks, on, () => tab.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 88 }))
  taken[name] = { ...VIEW }
}
// One part of the page, with a little air round it, cut off at the height of the window.
async function part(name, locator, { pad = 10, maxHeight = VIEW.height - 20, marks, on = page } = {}) {
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
  await withMarks(name, marks, on, () => page.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 88, clip }))
  taken[name] = { width: clip.width, height: clip.height }
}
const panel = (label) => page.locator(`section.day-panel[aria-label="${label}"]`)
const block = (id) => page.locator('section.analysis-block', { has: page.locator(`#analysis-${id}`) })
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
const dayAfter = (count) => new Date(Date.parse(`${today}T12:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10)
// The apps inside, each in its own frame.
const hub = (wait = '.sidebar-head') => frameOf(/apps\/summer-rescue/, wait)
const cardiff = (wait = '#week-grid') => frameOf(/apps\/cardiff-life/, wait)
const budget = async () => { const frame = await frameOf(/apps\/budget/, 'body'); await settle(2000); return frame }
const jobmap = () => frameOf(/apps\/jobmap/, '.job-row')
const hubMenu = async (frame, words) => { await frame.locator('.sidebar-nav a, .sidebar-nav button').filter({ hasText: words }).first().click({ timeout: 8000 }); await settle(2200) }
const budgetMenu = async (frame, name) => { await frame.locator('nav button, nav a, aside button, aside a').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first().click({ timeout: 8000 }); await settle(1500) }

// Example records for pictures of pages that would otherwise be empty: answered inside this
// browser in place of the real list, so nothing is saved and nothing of hers is replaced.
async function withExamples(patterns, work) {
  const added = []
  for (const [pattern, answer] of patterns) { const handler = (route) => (route.request().method() === 'GET' ? answer(route) : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })); await context.route(pattern, handler); added.push([pattern, handler]) }
  try { return await work() } finally { for (const [pattern, handler] of added) await context.unroute(pattern, handler) }
}
const json = (value) => (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) })
const EXAMPLE_PEOPLE = [
  { id: 'p1', name: 'Sara', birthday: `1996-${dayAfter(9).slice(5)}`, relation: 'Friend', contact: 'sara@example.org', notes: 'Likes film cameras. Gift idea: a roll of Portra.' },
  { id: 'p2', name: 'Ben', birthday: `1994-${dayAfter(31).slice(5)}`, relation: 'Classmate', contact: '', notes: 'Statistics study partner.' },
  { id: 'p3', name: 'Maman', birthday: '1968-03-21', relation: 'Family', contact: '', notes: '' },
]
const EXAMPLE_PAGES = [
  { id: 'j1', type: 'journal', title: 'Walked along the Taff', start_at: today, all_day: true, created_at: `${today}T18:00:00.000Z`, details: { mood: 'Calm', body: 'Walked along the Taff after the lecture. The light on the water was gold, and the statistics finally made sense on the way home.' }, files: [{ id: 'example-1', mime_type: 'image/jpeg', size: 1 }, { id: 'example-2', mime_type: 'image/jpeg', size: 1 }] },
  { id: 'j2', type: 'journal', title: 'First mock done', start_at: dayAfter(-2), all_day: true, created_at: `${dayAfter(-2)}T20:00:00.000Z`, details: { mood: 'Proud', body: 'First mock done. Two questions wrong, both on conditional probability. Tomorrow: redo them by hand.' }, files: [] },
]
const examplePicture = async (route) => { const picture = await page.request.get(`${base}/intro-hero.jpg`); return route.fulfill({ status: 200, contentType: 'image/jpeg', body: await picture.body() }) }
const journalExamples = [['**/api/entries?limit=5000', json(EXAMPLE_PAGES)], ['**/api/files/example-*', examplePicture]]

const RECIPES = {
  // ---- Finding your way
  'topbar.jpg': async () => { await go('/court', '.court-topbar'); await part('topbar.jpg', page.locator('header.court-topbar'), { pad: 4, marks: ['text:Life OS', 'text:Court', 'text:Study hub', '.notice-bell', '.focus-button', '.guide-link', '.style-switch-trigger', 'text:Divan'] }) },
  // ---- Journal and People, with examples
  'journal.jpg': async () => { await go('/journal', '.journal-write'); await page.locator('.journal-write textarea').fill('Walked along the Taff after the lecture. The light on the water was gold.'); await page.locator('.journal-mood input').fill('Calm'); await part('journal.jpg', page.locator('.journal-write'), { pad: 14, marks: ['.journal-write input[type="date"]', '.journal-mood input', '.journal-write textarea', '.journal-add-pictures', '.journal-save'] }) },
  'journal-pages.jpg': () => withExamples(journalExamples, async () => { await go('/journal', '.journal-page'); await settle(1500); await part('journal-pages.jpg', page.locator('.journal-month').first()) }),
  'journal-pictures.jpg': () => withExamples(journalExamples, async () => { await go('/journal', '.journal-page'); await page.locator('.journal-tools button', { hasText: 'Pictures' }).click(); await settle(1500); await part('journal-pictures.jpg', page.locator('.journal-gallery')) }),
  'people.jpg': async () => { await go('/people', '.people-form'); await page.locator('.people-form input').first().fill('Sara'); await page.locator('.people-form input[type="date"]').fill('1996-03-14'); await page.locator('.people-form input').nth(2).fill('Friend'); await part('people.jpg', page.locator('.people-form').first(), { pad: 16, marks: ['.people-form input', '.people-form input[type="date"]', '.people-form input##2', '.people-form textarea'] }) },
  'people-list.jpg': () => withExamples([['**/api/people', json(EXAMPLE_PEOPLE)]], async () => { await go('/people', '.people-list'); await settle(800); await page.locator('#people-coming-heading').evaluate((element) => element.scrollIntoView({ block: 'start' })); await page.evaluate(() => window.scrollBy(0, -30)); await settle(300); await view('people-list.jpg') }),
  'calendar-add.jpg': async () => { await go('/calendar', '.calendar-explicit-capture'); await page.locator('.calendar-explicit-capture input').first().fill('Seminar: Bayesian methods'); await settle(300); await part('calendar-add.jpg', page.locator('.calendar-explicit-capture'), { pad: 14 }) },
  'strip.jpg': async () => { await go('/jobmap', '.area-today'); await settle(2500); await part('strip.jpg', page.locator('aside.area-today'), { pad: 4 }) },
  // ---- The Court
  'court.jpg': async () => { await go('/court', '.court-ahead'); await view('court.jpg', { marks: ['form.day-note', '.court-ahead'] }) },
  'court-add.jpg': async () => {
    await go('/court', 'form.day-note')
    await page.locator('form.day-note input').first().fill('17:30 library')
    await settle(500)
    await part('court-add.jpg', page.locator('form.day-note'), { pad: 14, marks: ['.day-add-kind', 'form.day-note input', '.day-add-filing', '.day-add-hint'] })
  },
  'court-repeat.jpg': async () => {
    await go('/court', 'form.day-note')
    await page.locator('form.day-note input').first().fill('18:00 gym')
    await page.locator('select[aria-label="Whether the plan comes round"]').first().selectOption('custom')
    await page.locator('.day-add-days button').first().waitFor()
    for (const index of [0, 2, 4]) await page.locator('.day-add-days button').nth(index).click()
    await settle(400)
    await part('court-repeat.jpg', page.locator('form.day-note'), { pad: 14 })
  },
  'court-ahead.jpg': async () => { await go('/court', '.court-ahead'); await part('court-ahead.jpg', page.locator('.court-ahead')) },
  // ---- Today
  'today.jpg': async () => { await go('/today', '.day-path'); await panel('Jobs').locator('.day-figure').waitFor({ timeout: 20_000 }).catch(() => {}); await settle(1500); await view('today.jpg', { marks: ['.day-nav', 'form.day-note', '.day-path', 'section.day-panel[aria-label="Study"]', 'section.day-panel[aria-label="Jobs"]'] }) },
  'today-path.jpg': async () => { await go('/today', '.day-path'); await settle(2500); await part('today-path.jpg', page.locator('.day-path'), { marks: ['.day-stop-time', '.day-card', 'text:Card done'] }) },
  'today-change.jpg': async () => {
    // The first day from today that has a plan of hers.
    for (let ahead = 0; ahead < 10; ahead += 1) {
      await go(`/today?date=${dayAfter(ahead)}`, '.day-path')
      await settle(2000)
      const change = page.locator('.day-stop-actions button', { hasText: 'Change' })
      if (!(await change.count())) continue
      const title = await page.locator('li.day-stop', { has: change.first() }).first().locator('.day-stop-title').innerText()
      await change.first().click()
      const stop = page.locator('li.day-stop', { hasText: title }).first()
      await stop.locator('.entry-editor').waitFor()
      await part('today-change.jpg', stop)
      return
    }
    throw new Error('no plan of hers in the next ten days')
  },
  'today-study.jpg': async () => { await go('/today', '.day-path'); await panel('Study').locator('.day-figure, .day-quiet').first().waitFor(); await part('today-study.jpg', panel('Study')) },
  'today-jobs.jpg': async () => { await go('/today', '.day-path'); await panel('Jobs').locator('.day-figure').waitFor({ timeout: 20_000 }); await part('today-jobs.jpg', panel('Jobs'), { pad: 14, marks: ['section.day-panel[aria-label="Jobs"] .day-figure', 'section.day-panel[aria-label="Jobs"] .day-list a', 'section.day-panel[aria-label="Jobs"] .day-mark'] }) },
  'today-home.jpg': async () => { await go('/today', '.day-path'); await panel('Home').locator('h3').first().waitFor({ timeout: 20_000 }); await part('today-home.jpg', panel('Home')) },
  // ---- Plan the week
  'planner.jpg': async () => { await go('/planner', '.planner-week'); await page.locator('.planner-chip').first().waitFor({ timeout: 20_000 }).catch(() => {}); await settle(); await view('planner.jpg', { marks: ['.planner-day.is-today', '.planner-day .planner-add', '.planner-more'] }) },
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
  'calendar.jpg': async () => { await go('/calendar', '.calendar-layout'); await settle(4000); await view('calendar.jpg', { marks: ['.calendar-view-controls', '.calendar-kind-legend'] }) },
  'room.jpg': async () => { await go('/room/home'); await settle(3000); await view('room.jpg') },
  'today-health.jpg': async () => { await go('/today', '.day-path'); await panel('Health').locator('.health-panel-figure').waitFor({ timeout: 20_000 }); await part('today-health.jpg', panel('Health')) },
  // Health. Nothing is saved: forms are opened, never sent.
  'health.jpg': async () => { await go('/health', '.health-moving'); await settle(1500); await view('health.jpg', { marks: ['.health-tabs', '.health-moving .review-value', 'text:Today', 'text:Coming up'] }) },
  'health-log.jpg': async () => {
    await go('/health?view=exercise&log=1', 'form.health-form'); await settle(800)
    await part('health-log.jpg', page.locator('form.health-form'), { marks: ['form.health-form select', 'form.health-form input[type="date"]', '.health-effort', 'form.health-form > label.health-choice', 'form.health-form textarea'] })
  },
  'health-programmes.jpg': async () => {
    await go('/health?view=exercise', '.health-programme'); await settle(800)
    await page.locator('.health-programme', { hasText: 'Couch to 5K' }).getByRole('button', { name: 'Start' }).click().catch(() => {}); await settle(500)
    await part('health-programmes.jpg', page.locator('.health-cards'))
  },
  'health-library.jpg': async () => {
    await go('/health?view=exercise', '.health-exercise'); await settle(500)
    await page.locator('.health-exercise-head', { hasText: 'Squat' }).first().click(); await settle(400)
    await page.locator('#health-library').evaluate((el) => el.scrollIntoView({ block: 'start' })); await settle(300)
    await view('health-library.jpg')
  },
  'health-food.jpg': async () => { await go('/health?view=food', '.health-recipe-list'); await settle(2500); await view('health-food.jpg', { marks: ['section[aria-labelledby="health-food-today"] h2', 'section[aria-labelledby="health-diet"] h2', 'section[aria-labelledby="health-mine"] h2', '#health-recipes'] }) },
  'health-recipe.jpg': async () => {
    await go('/health?view=food', '.health-recipe-list'); await settle(2500)
    await page.locator('.health-recipe-head').first().click(); await settle(600)
    await part('health-recipe.jpg', page.locator('.health-recipe-open'))
  },
  'health-eatwell.jpg': async () => { await go('/health?view=food', '#health-eating-well'); await settle(1500); await part('health-eatwell.jpg', page.locator('#health-eating-well + .health-grid')) },
  'health-care.jpg': async () => { await go('/health?view=care', 'section[aria-labelledby="health-appointments"]'); await settle(1200); await view('health-care.jpg') },
  'budget-week.jpg': async () => { await go('/budget#/meals/week'); const frame = await budget(); await frame.locator('.meal-week').scrollIntoViewIfNeeded().catch(() => {}); await settle(500); await view('budget-week.jpg', { on: frame, marks: ['.week-toolbar button', '.meal-note'] }) },
  'budget-batches.jpg': async () => { await go('/budget#/meals/prep'); const frame = await budget(); await view('budget-batches.jpg') },
  'budget-category-browse.jpg': async () => { await go('/budget#/food/cupboard'); const frame = await budget(); await view('budget-category-browse.jpg') },
  // ---- Review
  'review.jpg': async () => { await go('/review', '.review-tiles'); await settle(1500); await view('review.jpg', { marks: ['.analysis-views', '.day-nav', '.review-tiles'] }) },
  'review-days.jpg': async () => { await go('/review', '.review-days'); await part('review-days.jpg', page.locator('.review-days')) },
  'review-eight.jpg': async () => { await go('/review', '.review-progress'); await settle(2500); await part('review-eight.jpg', page.locator('.review-progress')) },
  // ---- Analysis
  'analysis-stats.jpg': async () => { await go('/review?view=analysis', '.analysis-block'); await view('analysis-stats.jpg', { marks: ['.analysis-range', '.analysis-table'] }) },
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
  'ledger.jpg': async () => { await go('/ledger', '.ledger-entry'); await view('ledger.jpg', { marks: ['.ledger-capture', '.ledger-find', '.ledger-entry-actions'] }) },
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
      await view(name, { tab })
    } finally { await other.close() }
  }])),
  // ---- Study hub
  'study.jpg': async () => { await go('/study'); const frame = await hub(); await settle(2000); await view('study.jpg', { on: frame, marks: ['.sidebar-semester-switch', 'text:Today', 'text:Add card', 'button[aria-label*="otif" i], button[title*="otif" i], button[aria-label*="eminder" i]'] }) },
  'study-addcard.jpg': async () => {
    await go('/study')
    const frame = await hub()
    await frame.locator('button', { hasText: 'Add card' }).first().click()
    await settle(1200)
    await view('study-addcard.jpg')
  },
  'study-schedule.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Schedule'); await view('study-schedule.jpg') },
  'study-planner.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Planner'); await view('study-planner.jpg') },
  'study-progress.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Progress'); await view('study-progress.jpg') },
  'study-module.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Foundations of Statistics'); await view('study-module.jpg') },
  'study-board.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Columns'); await view('study-board.jpg') },
  'study-review.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Review'); await view('study-review.jpg') },
  'study-analytics.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Analytics'); await view('study-analytics.jpg') },
  'study-rescue.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Rescue Lane'); await view('study-rescue.jpg') },
  'study-notes.jpg': async () => { await go('/study'); const frame = await hub(); await hubMenu(frame, 'Notes'); await view('study-notes.jpg') },
  'study-setup.jpg': async () => {
    await go('/study#/setup')
    const frame = await hub('.hub-records')
    // The heading of the first list, with its add button, clear of the hub's own bar at the top.
    await frame.locator('.hub-records h2').first().evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await settle(600)
    await view('study-setup.jpg')
  },
  // ---- Cardiff Life
  'cardiff.jpg': async () => { await go('/cardiff-life'); const frame = await cardiff(); await view('cardiff.jpg', { on: frame, marks: ['[data-view="week"]', '#week-label', '#add-own', '#show-options'] }) },
  'cardiff-add.jpg': async () => {
    await go('/cardiff-life')
    const frame = await cardiff('#add-own')
    await frame.locator('#add-own').click()
    await frame.locator('#own-form [name=name]').fill('Picnic in Bute Park')
    await settle(400)
    await part('cardiff-add.jpg', frame.locator('#own-dialog'))
  },
  'cardiff-detail.jpg': async () => {
    // An example of an event of hers, shown to this browser only: nothing is saved.
    const example = { event_id: 'own-example', name: 'Picnic in Bute Park (an example)', date: today, start_time: '13:00', end_time: '15:00', location: 'Bute Park, by the bridge', activity: 'social', organiser: 'Added by you', cost: 'Free', description: 'Bring a blanket.', source_url: '', status: 'upcoming', own: true, category: '', booking_required: '', experience: '', recurring: '', last_checked: '' }
    const serve = (route) => (route.request().method() === 'GET' ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, events: [example] }) }) : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    await context.route('**/apps/cardiff-life/api/own-events', serve)
    try {
      await go('/cardiff-life')
      const frame = await cardiff()
      await frame.locator('[data-detail="own-example"]').first().click()
      await settle(500)
      await part('cardiff-detail.jpg', frame.locator('#event-detail'))
    } finally { await context.unroute('**/apps/cardiff-life/api/own-events', serve) }
  },
  'cardiff-choices.jpg': async () => { await go('/cardiff-life'); const frame = await cardiff(); await frame.locator('[data-view="explore"]').click(); await settle(800); await view('cardiff-choices.jpg') },
  'cardiff-communities.jpg': async () => { await go('/cardiff-life'); const frame = await cardiff(); await frame.locator('[data-view="communities"]').click(); await settle(800); await view('cardiff-communities.jpg') },
  // ---- Budget
  'budget.jpg': async () => { await go('/budget'); const frame = await budget(); await view('budget.jpg', { on: frame, marks: ['text:My everyday', 'select', 'text:Add payment'] }) },
  'budget-shopping.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Shopping'); await view('budget-shopping.jpg', { on: frame, marks: ['text:My lists', 'text:By list', 'input[placeholder^="Add an item"]', 'text:Record what I bought'] }) },
  'budget-category.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Shopping'); await frame.locator('button', { hasText: /^\s*By category\s*$/ }).first().click(); await settle(1200); await view('budget-category.jpg') },
  'budget-receipts.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Shopping'); await frame.locator('button, [role="tab"]').filter({ hasText: /^\s*Receipts\s*$/ }).first().click(); await settle(1200); await view('budget-receipts.jpg') },
  'budget-catalogue.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Shopping'); await frame.locator('button, [role="tab"]').filter({ hasText: /^\s*Catalogue\s*$/ }).first().click(); await settle(1200); await view('budget-catalogue.jpg') },
  'budget-shops.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Shopping'); await frame.locator('button, [role="tab"]').filter({ hasText: /^\s*Shops\s*$/ }).first().click(); await settle(1200); await view('budget-shops.jpg') },
  'budget-history.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Weekly history'); await view('budget-history.jpg') },
  'budget-food.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Food & supplies'); await view('budget-food.jpg', { on: frame, marks: ['.food-place .food-group-head', 'text:Choose several', '.food-home-line .button##1'] }) },
  'budget-finish.jpg': async () => {
    await go('/budget#/food'); const frame = await budget()
    await frame.getByRole('button', { name: 'Choose several' }).click(); await settle(400)
    for (const box of (await frame.locator('.food-home-line input[type="checkbox"]').all()).slice(0, 2)) await box.check()
    await frame.getByRole('button', { name: 'Finished · date not known' }).click(); await settle(800)
    await view('budget-finish.jpg', { on: frame, marks: ['dialog[open] .segments', 'dialog[open] .food-when'] })
  },
  'budget-meals.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Meals & recipes'); await view('budget-meals.jpg', { on: frame, marks: ['.page-tabs .segments button', '.food-now-head .segments', '.food-meal-card .button.primary, .food-empty .button.primary'] }) },
  'budget-meal.jpg': async () => {
    await go('/budget#/meals/week'); const frame = await budget()
    await frame.locator('.meal-note.planned').first().click(); await settle(900)
    await view('budget-meal.jpg', { on: frame, marks: ['text:What is in it', 'text:How to make it'] })
  },
  'budget-recipe.jpg': async () => {
    await go('/budget#/meals/recipes'); const frame = await budget()
    await frame.locator('.food-recipe-title').first().click(); await settle(900)
    await view('budget-recipe.jpg', { on: frame, marks: ['dialog[open] .food-servings', 'dialog[open] .food-ingredients li', 'dialog[open] .food-steps, dialog[open] .food-empty-method'] })
  },
  'budget-money.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Money & saving'); await view('budget-money.jpg') },
  'budget-settings.jpg': async () => { await go('/budget'); const frame = await budget(); await budgetMenu(frame, 'Settings & backups'); await view('budget-settings.jpg') },
  // ---- JobMap
  'jobmap.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await view('jobmap.jpg', { on: frame, marks: ['text:All jobs', '.search-box', 'select[aria-label="Filter by source"]', 'select[aria-label="Sort jobs"]', '.scope-tabs', '.save-job'] }) },
  'jobmap-details.jpg': async () => {
    await go('/jobmap')
    const frame = await jobmap()
    await frame.locator('.job-row .job-open').first().click()
    await frame.locator('aside.detail').waitFor()
    await settle(600)
    await view('jobmap-details.jpg')
  },
  'jobmap-application.jpg': async () => {
    await go('/jobmap')
    const frame = await jobmap()
    await frame.locator('.job-row .job-open').first().click()
    const section = frame.locator('aside.detail details', { hasText: 'My application: files, folder and links' })
    if (!(await section.evaluate((element) => element.open))) await section.locator('summary').click()
    await part('jobmap-application.jpg', section, { pad: 14 })
  },
  'jobmap-add.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('button', { hasText: 'Add job' }).first().click(); await settle(800); await view('jobmap-add.jpg') },
  'jobmap-closing.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar .nav', { hasText: 'Closing this week' }).click(); await settle(1000); await view('jobmap-closing.jpg', { on: frame, marks: ['text:Closing this week', 'text:New this week', 'text:High priority', 'text:Closed adverts'] }) },
  'jobmap-repeats.jpg': async () => {
    await go('/jobmap')
    const frame = await jobmap()
    await frame.locator('.sidebar .nav', { hasText: 'Possible repeats' }).click()
    await settle(1000)
    await frame.locator('.job-row .job-open').first().click()
    await frame.locator('.listings.maybe').waitFor()
    await settle(600)
    await view('jobmap-repeats.jpg', { on: frame, marks: ['text:Possible repeats', '.listings.maybe .subtle', '.listings.maybe .listing-actions .text-button'] })
  },
  'jobmap-shortlist.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar button, .sidebar a', { hasText: 'Shortlist' }).first().click(); await settle(1000); await view('jobmap-shortlist.jpg') },
  'jobmap-documents.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar button', { hasText: 'My documents' }).click(); await frame.locator('.documents-list li, .documents-root').first().waitFor(); await settle(1200); await view('jobmap-documents.jpg', { on: frame, marks: ['.documents-root input', '.documents-main', '.documents-list', '.documents-applied'] }) },
  'jobmap-archive.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar button', { hasText: 'Archive' }).first().click(); await settle(1000); await view('jobmap-archive.jpg') },
  'jobmap-preferences.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar button, .sidebar a', { hasText: 'Preferences' }).first().click(); await settle(1000); await view('jobmap-preferences.jpg') },
  // The pictures of Progress, the board, gaps and Claude, search and groups, a missed deadline and a PDF. Each puts
  // back what it changed in this browser (List, no grouping, no filter), so the next picture starts as JobMap opens.
  'jobmap-progress.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar .nav', { hasText: 'Progress' }).click(); await frame.locator('.progress').waitFor(); await frame.locator('.attention').evaluate((list) => list.querySelectorAll('li:nth-child(n+3)').forEach((item) => { item.style.display = 'none' })); await settle(800); await view('jobmap-progress.jpg', { on: frame, marks: ['#attention-heading', '#funnel-heading', '#standing-heading', '#weeks-heading'] }) },
  'jobmap-board.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar .nav', { hasText: 'Applications' }).click(); await frame.locator('.scope-tabs button', { hasText: 'Board' }).click(); await frame.locator('.board').waitFor(); await settle(800); await view('jobmap-board.jpg', { on: frame, marks: ['.filter-group .scope-tabs', '.board-column h2', '.board-card select'] }); await frame.locator('.scope-tabs button', { hasText: 'List' }).click() },
  'jobmap-claude.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar .nav', { hasText: 'Applications' }).click(); await settle(800); await frame.locator('.job-row .job-open').first().click(); const help = frame.locator('aside.detail .claude-help'); await help.waitFor(); if (!(await help.evaluate((element) => element.open))) await help.locator('summary').click(); await frame.locator('aside.detail .match-details').evaluate((element) => element.scrollIntoView({ block: 'start' })); await settle(600); await view('jobmap-claude.jpg', { on: frame, marks: ['.gap-tags', '.claude-actions'] }) },
  'jobmap-search.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('select[aria-label="Group jobs by"]').selectOption('title'); await frame.locator('select[aria-label="Right to work"]').selectOption('open'); await settle(1000); await view('jobmap-search.jpg', { on: frame, marks: ['select[aria-label="Search in"]', 'select[aria-label="Group jobs by"]', 'select[aria-label="Right to work"]', 'select[aria-label="Hours"]'] }); await frame.locator('select[aria-label="Group jobs by"]').selectOption(''); await frame.locator('select[aria-label="Right to work"]').selectOption('') },
  'jobmap-missed.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar .nav', { hasText: 'Applications' }).click(); await settle(800); await frame.locator('.job-row', { has: frame.locator('.deadline.closed') }).filter({ hasText: /Preparing|Check details/ }).first().locator('.job-open').click(); await frame.locator('.deadline-close').waitFor(); await settle(600); await view('jobmap-missed.jpg', { on: frame, marks: ['.deadline-close button'] }) },
  'jobmap-pdf.jpg': async () => { await go('/jobmap'); const frame = await jobmap(); await frame.locator('.sidebar button', { hasText: 'My documents' }).click(); await frame.locator('.documents-list').waitFor(); const main = (await frame.locator('.documents-main .caption').first().textContent()) || ''; for (const folder of main.split('/').slice(0, -1)) { await frame.locator('.documents-folder', { hasText: folder }).first().click(); await settle(700) } await frame.locator('.documents-list li.is-main button', { hasText: 'View' }).click(); await frame.locator('.documents-preview iframe').waitFor(); await settle(3000); await view('jobmap-pdf.jpg') },
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
// A mark the words name but the page did not have is a picture that misleads: say so.
const expected = Object.fromEntries(CHAPTERS.flatMap((chapter) => chapter.steps).filter((step) => step.image && step.marks).map((step) => [step.image, step.marks.length]))
for (const note of notes) console.log(`  NOTE    ${note}`)

// The page reads this to know which pictures exist and when they were taken.
const manifestFile = path.join(out, 'manifest.json')
let before = {}
try { before = JSON.parse(fs.readFileSync(manifestFile, 'utf8')).shots ?? {} } catch { before = {} }
// A picture the Guide no longer names is taken away, so the folder holds only what is shown.
for (const name of Object.keys(before)) if (!GUIDE_IMAGES.includes(name) && /^[\w-]+\.jpg$/.test(name)) fs.rmSync(path.join(out, name), { force: true })
const shots = Object.fromEntries(Object.entries({ ...before, ...taken }).filter(([name]) => GUIDE_IMAGES.includes(name) && fs.existsSync(path.join(out, name))))
fs.writeFileSync(manifestFile, JSON.stringify({ takenAt: new Date().toISOString(), base, shots }, null, 2))
const size = Object.keys(shots).reduce((sum, name) => sum + fs.statSync(path.join(out, name)).size, 0)
console.log(`${Object.keys(taken).length} taken now, ${GUIDE_IMAGES.filter((name) => shots[name]).length} of ${GUIDE_IMAGES.length} in the Guide (${Object.keys(expected).length} with numbered marks), ${(size / 1_048_576).toFixed(1)} MB in ${out}`)
if (failed.length || notes.length) { if (failed.length) console.log(`Not taken: ${failed.join(', ')}`); process.exitCode = 1 }
