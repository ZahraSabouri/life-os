// A domain's mark: a small line drawing on a tint of the domain's colour (--d-<domain>, styles/palettes.css).
const PATHS = {
  work: <><path d="M4 8h16v11H4zM9 8V5h6v3" /></>,
  learning: <><path d="M3 9l9-4 9 4-9 4-9-4zm4 2v5c3 2 7 2 10 0v-5" /></>,
  social: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 19c1-3 3-5 6-5s5 2 6 5M15 15c3 0 5 1.5 6 4" /></>,
  money: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  home: <><path d="M4 11l8-6 8 6v8H4z" /><path d="M10 19v-5h4v5" /></>,
  health: <><path d="M12 19s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.5C19 14.5 12 19 12 19z" /></>,
  travel: <><path d="M3 13l18-7-5 14-3-6-6-1z" /></>,
  admin: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h7" /></>,
}

export default function DomainGlyph({ domain, size = 'md' }) {
  return <span className={`desk-glyph is-${size}`} style={{ '--c': `var(--d-${domain}, var(--m-accent))` }} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">{PATHS[domain] ?? PATHS.admin}</svg>
  </span>
}
