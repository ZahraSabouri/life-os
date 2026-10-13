import test from 'node:test'
import assert from 'node:assert/strict'
import { createDesktopNotifier, toastScript, windowsToast } from './desktop.mjs'

const manual = { schedule: () => ({ unref() {} }), unschedule() {}, log: { error() {} } }
// Tuesday 13 October 2026, 16:20 in London.
const NOW = new Date('2026-10-13T15:20:00.000Z')
const data = () => ({
  today: '2026-10-13',
  upcoming: [
    { id: 'timed:block', title: 'MAT022 · Probability', startsAt: '2026-10-13T15:28:00.000Z', at: '16:28', href: '/study#/today?card=x' },   // in 8 minutes
    { id: 'timed:later', title: 'Job applications', startsAt: '2026-10-13T17:00:00.000Z', at: '18:00', href: '/today' },                    // in 100 minutes
    { id: 'timed:gone', title: 'Lecture', startsAt: '2026-10-13T15:10:00.000Z', at: '16:10', href: '/today' },                               // began ten minutes ago
  ],
  notices: [
    { id: 'study:due:2026-10-13', level: 'today', title: '2 study cards due today' },
    { id: 'job:closes:J1:2026-10-13', level: 'today', title: 'Closes today: Data Analyst' },
    { id: 'plans:late:2026-10-13', level: 'late', title: '1 plan left unticked from earlier days' },
    { id: 'study:test:t1:2026-10-13', level: 'ahead', title: 'In-class test 1 in 10 days' },
  ],
})

test('with no tab open it tells her once: what starts soon, and what today asks for', async () => {
  const shown = []
  const notifier = createDesktopNotifier({ ...manual, load: async () => data(), prefs: () => ({ seen: { 'job:closes:J1:2026-10-13': '2026-10-13' } }), browserSeenAt: () => 0, now: () => NOW, show: async (...words) => { shown.push(words) } })
  assert.equal(await notifier.tick(), 2)
  assert.deepEqual(shown, [
    ['MAT022 · Probability', 'Starts at 16:28, in 8 minutes', 'http://127.0.0.1:47850/study#/today?card=x'],
    // The one she has already seen in the bell is left out of the count.
    ['Life OS: 2 things for today', '2 study cards due today\n1 plan left unticked from earlier days', 'http://127.0.0.1:47850/today'],
  ])
  assert.equal(await notifier.tick(), 0)
  assert.deepEqual([notifier.told('2026-10-13'), notifier.told('2026-10-14')], [['timed:block', 'summary:2026-10-13'], []])
})

test('it keeps quiet while a tab is open, when she switched it off, and before eight in the morning', async () => {
  const shown = []
  const make = (extra) => createDesktopNotifier({ ...manual, load: async () => data(), now: () => NOW, show: async (...words) => { shown.push(words) }, ...extra })
  assert.equal(await make({ browserSeenAt: () => NOW.getTime() - 60_000 }).tick(), 0)
  assert.equal(await make({ prefs: () => ({ whenClosed: false }) }).tick(), 0)
  // 07:30 in London: a block that starts at 07:35 is told, the day's summary waits.
  const early = new Date('2026-10-13T06:30:00.000Z')
  const morning = make({ now: () => early, load: async () => ({ ...data(), upcoming: [{ id: 'timed:run', title: 'Run', startsAt: '2026-10-13T06:35:00.000Z', at: '07:35' }] }), prefs: () => ({ minutesBefore: 5 }) })
  assert.equal(await morning.tick(), 1)
  assert.deepEqual(shown, [['Run', 'Starts at 07:35, in 5 minutes', 'http://127.0.0.1:47850/today']])
  // A part that cannot be read: nothing is shown and nothing breaks.
  assert.equal(await make({ load: async () => { throw new Error('the day could not be read') } }).tick(), 0)
})

test('the notification is written for Windows with every character made safe', async () => {
  const script = toastScript('Dinner at Ben\'s <8pm> & after', 'Starts now\n"Bring wine"', 'http://127.0.0.1:47850/today?date=2026-10-13&x=1')
  assert.match(script, /<text>Dinner at Ben&apos;s &lt;8pm&gt; &amp; after<\/text><text>Starts now<\/text><text>&quot;Bring wine&quot;<\/text>/)
  assert.match(script, /launch="http:\/\/127\.0\.0\.1:47850\/today\?date=2026-10-13&amp;x=1"/)
  assert.equal(/LoadXml\('[^']*'\)/.test(script), true)
  // Filed under Life OS's own name, which it gives itself once.
  assert.equal(script.includes("AppUserModelId\\LifeOS.Notices' -Name DisplayName -Value 'Life OS'"), true)
  assert.equal(script.includes("CreateToastNotifier('LifeOS.Notices')"), true)
  // Asked of Windows through PowerShell, with the script encoded so no quoting can break it.
  const calls = []
  const show = windowsToast({ platform: 'win32', run: (command, args) => { calls.push([command, args]); return { on(event, done) { if (event === 'exit') setImmediate(() => done(0)) } } } })
  assert.equal(await show('Title', 'Body', 'http://127.0.0.1:47850/'), true)
  assert.deepEqual([calls[0][0], calls[0][1].slice(0, 5)], ['powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand']])
  assert.equal(Buffer.from(calls[0][1][5], 'base64').toString('utf16le'), toastScript('Title', 'Body', 'http://127.0.0.1:47850/'))
  assert.equal(await windowsToast({ platform: 'linux', run: () => { throw new Error('must not run') } })('a', 'b', 'c'), false)
})
