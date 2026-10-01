// Portal host for the Study Hub room.
//
// The room's stylesheet is scoped under `.study-room`, and dark mode is driven by
// a `data-theme` attribute on the room root. React portals that mount to
// `document.body` would land OUTSIDE that scope and lose all styling + theming.
// So the room registers its root node here, and portaled surfaces (drawers,
// dialogs, confetti) mount into it instead — inheriting the scope and theme.
//
// A module singleton (rather than context) is used so the retarget is a drop-in
// swap of the createPortal target and never trips the rules-of-hooks in
// components that early-return before their portal call.

let host = null

export function setStudyPortalHost(node) {
  host = node
}

export function getStudyPortalHost() {
  if (host) return host
  return typeof document !== 'undefined' ? document.body : null
}
