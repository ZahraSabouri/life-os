// Budget and JobMap run as their own servers behind Life OS. If one stops answering (it
// crashed, or an earlier Life OS that was still shutting down took it with it), it is started
// again, so "Life OS is up but Budget does not load" mends itself.
//
// `start()` gives a handle ({ port, stop }), `alive(handle)` says whether it still answers,
// `onChange(handle | null)` tells the host which port to send requests to.
export function keepUp({ name, start, alive, onChange = () => {}, everyMs = 15_000, log = console, schedule = setInterval, unschedule = clearInterval }) {
  let handle = null
  let busy = null
  let stopped = false
  async function look() {
    if (stopped) return
    if (handle && await Promise.resolve(alive(handle)).catch(() => false)) return
    if (handle) { log.error(`${name} stopped answering; starting it again`); handle = null; onChange(null) }
    try {
      const started = await start()
      // Stopped while it was starting: do not leave a server behind.
      if (stopped) { await started?.stop?.().catch(() => {}); return }
      handle = started
      onChange(handle)
      log.log(`${name} ready (port ${handle.port})`)
    } catch (error) { log.error(`${name}: ${error.message}`) }
  }
  // One look at a time; a look asked for while one runs waits for that one.
  const check = () => (busy ??= look().finally(() => { busy = null }))
  const timer = schedule(check, everyMs)
  timer?.unref?.()
  return {
    first: check(),
    check,
    get handle() { return handle },
    async stop() {
      stopped = true
      unschedule(timer)
      await busy?.catch(() => {})
      const last = handle
      handle = null
      onChange(null)
      await last?.stop?.().catch(() => {})
    },
  }
}
