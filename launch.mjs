import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { openSync, closeSync } from 'node:fs'

const root = path.dirname(fileURLToPath(import.meta.url))
const runtime = path.join(root, '.runtime')
const serviceFile = path.join(runtime, 'service.json')
const port = Number(process.env.LIFE_OS_PORT || 47850)
const url = `http://127.0.0.1:${port}`

async function health() {
  try {
    const response = await fetch(`${url}/__life-os/health`, { signal: AbortSignal.timeout(1000) })
    if (!response.ok) return null
    const value = await response.json()
    return value.app === 'life-os' && path.resolve(value.root) === root ? value : null
  } catch { return null }
}

function openBrowser() {
  if (process.argv.includes('--no-browser')) return
  const child = process.platform === 'win32'
    ? spawn('rundll32.exe', ['url.dll,FileProtocolHandler', `${url}/`], { detached: true, stdio: 'ignore', windowsHide: true })
    : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [`${url}/`], { detached: true, stdio: 'ignore' })
  child.on('error', () => console.log(`Open ${url}/ in your browser.`))
  child.unref()
}

// Starting with Windows: a small file in the user's Startup folder that runs this launcher,
// without a window, when they sign in. Then Life OS (and its notices) is there without being
// opened by hand. "off" removes the file; nothing else is changed.
const startupFile = () => path.join(process.env.APPDATA ?? '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'Life OS.vbs')
async function startWithWindows(choice) {
  if (process.platform !== 'win32' || !process.env.APPDATA) { console.log('Starting with the computer is only set up on Windows.'); return }
  const file = startupFile()
  if (choice === 'on') {
    const quote = (value) => `""${value}""`
    const line = `CreateObject("WScript.Shell").Run "${quote(process.execPath)} ${quote(path.join(root, 'launch.mjs'))} --no-browser", 0, False`
    await fs.writeFile(file, `' Starts Life OS, without a window, when you sign in to Windows.\r\n${line}\r\n`, 'utf8')
    console.log('Life OS will start when you sign in to Windows.')
  } else if (choice === 'off') {
    await fs.rm(file, { force: true })
    console.log('Life OS will not start by itself.')
  } else {
    console.log(await fs.access(file).then(() => 'Life OS starts when you sign in to Windows.', () => 'Life OS does not start by itself.'))
  }
}

async function main() {
  const asked = process.argv.indexOf('--start-with-windows')
  if (asked >= 0) { await startWithWindows(process.argv[asked + 1]); return }
  if (process.argv.includes('--stop')) {
    if (!await health()) { console.log('Life OS is already stopped.'); return }
    const saved = JSON.parse(await fs.readFile(serviceFile, 'utf8'))
    const response = await fetch(`${url}/__life-os/stop`, {
      method: 'POST', headers: { 'x-life-os-control': saved.controlToken },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error('Could not stop this Life OS service safely.')
    // The port closes before the old server has stopped Budget and JobMap. A start made in
    // that gap would adopt them and lose them a moment later, so wait for the process itself.
    const gone = () => { try { process.kill(saved.pid, 0); return false } catch (error) { return error.code !== 'EPERM' } }
    for (let i = 0; i < 150; i++) {
      if (!await health() && (!Number.isInteger(saved.pid) || gone())) { console.log('Life OS stopped.'); return }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error('Life OS is still finishing requests. Retry Stop Life OS shortly.')
  }
  if (await health()) { console.log(`Life OS already running: ${url}/`); openBrowser(); return }
  // Never reuse an unrelated listener or silently change the stable origin.
  const net = await import('node:net')
  await new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', () => reject(new Error(`Port ${port} is occupied. Stop the conflicting app first.`)))
    probe.listen(port, '127.0.0.1', () => probe.close(resolve))
  })
  await fs.mkdir(runtime, { recursive: true })
  const controlToken = randomUUID()
  const log = openSync(path.join(runtime, 'server.log'), 'a')
  const child = spawn(process.execPath, [path.join(root, 'hosting/server.mjs')], {
    cwd: root, detached: true, windowsHide: true, stdio: ['ignore', log, log],
    env: { ...process.env, LIFE_OS_PORT: String(port), LIFE_OS_CONTROL_TOKEN: controlToken },
  })
  closeSync(log)
  let childError
  child.on('error', error => { childError = error })
  child.unref()
  await fs.writeFile(serviceFile, JSON.stringify({ pid: child.pid, url, controlToken }, null, 2))
  for (let i = 0; i < 100; i++) {
    if (childError) throw childError
    if (await health()) { console.log(`Life OS ready: ${url}/`); openBrowser(); return }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Life OS did not start. See ${path.join(runtime, 'server.log')}`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
