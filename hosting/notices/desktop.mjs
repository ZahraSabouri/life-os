// Notices when no Life OS tab is open. The browser tells her itself while a tab is open; when
// none is, the server (which is still running) asks Windows to show the same things: a timed
// thing a few minutes before it starts, and once a day what today asks for. What it has told is
// handed to the browser, so opening a tab does not say it twice.
import { spawn } from 'node:child_process'
import { CALENDAR_TIME_ZONE } from '../../code/life-os/shared/calendar.js'

const xml = (value) => String(value ?? '').replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char])
// Windows files a notification under an app it knows by an id. Life OS gives itself one, with
// its own name, in her own part of the registry (one key, made the first time a notice is
// shown; removing the key undoes it). Without it the notices are filed under "Windows PowerShell".
export const APP = 'LifeOS.Notices'
const APP_KEY = `HKCU:\\SOFTWARE\\Classes\\AppUserModelId\\${APP}`

// The PowerShell that shows one notification. Clicking it opens `url` in her browser.
export function toastScript(title, body, url) {
  const lines = String(body ?? '').split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3)
  const toast = `<toast activationType="protocol" launch="${xml(url)}"><visual><binding template="ToastGeneric"><text>${xml(String(title).slice(0, 120))}</text>${lines.map((line) => `<text>${xml(line.slice(0, 160))}</text>`).join('')}</binding></visual></toast>`
  return [
    `if (-not (Test-Path '${APP_KEY}')) { New-Item -Path '${APP_KEY}' -Force | Out-Null }`,
    `if ((Get-ItemProperty -Path '${APP_KEY}' -Name DisplayName -ErrorAction SilentlyContinue).DisplayName -ne 'Life OS') { New-ItemProperty -Path '${APP_KEY}' -Name DisplayName -Value 'Life OS' -PropertyType String -Force | Out-Null }`,
    '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
    '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null',
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    `$xml.LoadXml('${toast.replaceAll("'", "''")}')`,
    '$toast = New-Object Windows.UI.Notifications.ToastNotification $xml',
    `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${APP}').Show($toast)`,
  ].join('\n')
}

// Asks Windows to show it. Resolves true when Windows took it; never throws.
export function windowsToast({ run = spawn, platform = process.platform } = {}) {
  return (title, body, url) => new Promise((resolve) => {
    if (platform !== 'win32') { resolve(false); return }
    try {
      const child = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', Buffer.from(toastScript(title, body, url), 'utf16le').toString('base64')], { windowsHide: true, stdio: 'ignore' })
      child.on('error', () => resolve(false))
      child.on('exit', (code) => resolve(code === 0))
    } catch { resolve(false) }
  })
}

const LONDON_HOUR = new Intl.DateTimeFormat('en-GB', { timeZone: CALENDAR_TIME_ZONE, hour: '2-digit', hourCycle: 'h23' })
export const BROWSER_OPEN_MS = 6 * 60_000   // a tab asks for the notices every five minutes
export const SUMMARY_FROM_HOUR = 8

// `load()` gives what the bell shows ({ today, notices, upcoming }); `prefs()` her choices;
// `browserSeenAt()` when a tab last asked for the notices; `show(title, body, url)` shows one.
export function createDesktopNotifier({ load, prefs = () => ({}), browserSeenAt = () => 0, show, origin = 'http://127.0.0.1:47850', now = () => new Date(), everyMs = 30_000, schedule = setInterval, unschedule = clearInterval, log = console } = {}) {
  let told = { day: '', ids: new Set() }
  let busy = null
  const once = (id, day) => {
    if (told.day !== day) told = { day, ids: new Set() }
    if (told.ids.has(id)) return false
    told.ids.add(id)
    return true
  }
  async function look() {
    const chosen = { whenClosed: true, minutesBefore: 10, seen: {}, ...prefs() }
    if (chosen.whenClosed === false) return 0
    const moment = now()
    if (moment.getTime() - browserSeenAt() < BROWSER_OPEN_MS) return 0
    const data = await load()
    if (!data?.today) return 0
    let shown = 0
    const before = Math.max(1, Math.min(60, Number(chosen.minutesBefore) || 10)) * 60_000
    for (const item of Array.isArray(data.upcoming) ? data.upcoming : []) {
      const wait = Date.parse(item.startsAt) - moment.getTime()
      if (!(wait <= before && wait > -60_000) || !once(item.id, data.today)) continue
      await show(item.title, wait > 60_000 ? `Starts at ${item.at}, in ${Math.round(wait / 60_000)} minutes` : `Starts now (${item.at})`, `${origin}${item.href || '/today'}`)
      shown += 1
    }
    const asked = (Array.isArray(data.notices) ? data.notices : []).filter((notice) => ['today', 'late'].includes(notice.level) && !chosen.seen?.[notice.id])
    if (asked.length && Number(LONDON_HOUR.format(moment)) >= SUMMARY_FROM_HOUR && once(`summary:${data.today}`, data.today)) {
      await show(`Life OS: ${asked.length} ${asked.length === 1 ? 'thing' : 'things'} for today`, asked.slice(0, 3).map((notice) => notice.title).join('\n'), `${origin}/today`)
      shown += 1
    }
    return shown
  }
  const tick = () => (busy ??= look().catch((error) => { log.error(`Notices: ${error.message}`); return 0 }).finally(() => { busy = null }))
  const timer = schedule(tick, everyMs)
  timer?.unref?.()
  return {
    tick,
    // One notice now (an applied mail batch with urgent things), unless she has turned them off.
    async tell(title, body, href = '/today') {
      if ({ whenClosed: true, ...prefs() }.whenClosed === false) return false
      await show(title, body, `${origin}${href}`)
      return true
    },
    // What it has shown today, for the browser to leave alone.
    told: (day) => (told.day === day ? [...told.ids] : []),
    stop() { unschedule(timer) },
  }
}
