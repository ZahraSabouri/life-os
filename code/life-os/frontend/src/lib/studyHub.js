// The Study hub's tabs tell each other about a save on a channel of their semester
// (useTrackerState.js; hub/session.js puts the semester in the channel's name) and reload when
// they hear of a newer one. Life OS speaks on the same channel after it saves something of the
// hub's (a ticked step, a focus session), so an open hub tab's next save is not refused.
// One channel per semester is kept open: one closed straight after posting can lose its message.
const channels = new Map()

export function tellStudyHub(semesterId, saved) {
  try {
    if (!channels.has(semesterId)) channels.set(semesterId, new BroadcastChannel(`study-hub:${semesterId}:summer-rescue-tracker-state`))
    channels.get(semesterId).postMessage({ revision: saved.revision, writerId: saved.writerId })
  } catch { /* no such channel in this browser: a hub tab shows the change on its next load */ }
}
