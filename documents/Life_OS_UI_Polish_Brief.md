# Life OS — UI Polish Brief (the "make what exists feel unified" pass)

**Written 2026-07-06.** A single, self-contained brief for the local coding agent on Xar's Windows machine. It is **not** part of the Brief 3–12 data-structure sequence — it's a parallel polish pass on the UI that already ships, driven entirely by Xar's direct feedback on the running app. **Run this before resuming the data-structure briefs**, or interleave it — it touches only the frontend (`code/life-os/frontend`), no schema, no backend, no AI.

The spirit: the app already looks good (Xar's words), but it currently *feels like several screens*, not one thing. The calendar in particular breaks the illusion — it ignores the theme system and drops the shared navigation. This brief closes those seams and cleans up the small typographic and layout roughness. Nothing here is a redesign; the structural rethink lives in the separate architecture report.

---

## Where things stand (read before touching anything)

I read the current frontend directly. The relevant facts:

- **Theming ("Ground") works and defaults to `madder`.** `groundContext.jsx` sets `data-ground` on the `.app-shell`, `App.jsx` reads it, and the three palettes live in `tokens.css` as `:root` (madder default), `.app-shell[data-ground='indigo']`, and `.app-shell[data-ground='paper']`. Cycling is wired to the nav button.
- **`CourtLayout.jsx` hides the shared nav on `/calendar` and `/today`.** It sets `isBoardRoute` true for those two routes and renders the topbar/nav only when `!isBoardRoute`. So on the calendar there is **no way to switch Ground or navigate** without the browser back button.
- **The calendar forces its own dark-indigo palette regardless of Ground.** `tokens.css` has a block `.court-screen.board-screen { --g-bg:#111527; --g-bg2:#171b2c; ... }` (around line 540). `CourtLayout` adds `board-screen` on the calendar/today routes. That override **replaces the Ground tokens locally**, which is exactly the "fixed bluish colour on top of the app that has three colours" Xar described. This is the single most important fix in this brief.
- **The Persian date is not actually shown inside each calendar cell.** `CalendarView.jsx` renders only `<span>{day.date.getDate()}</span>` (the Latin number); the Persian day is only in the `title=` tooltip. The CSS that *would* style an in-cell `<small>` exists but is dead (`.calendar-board-layout .calendar-weekdays small { display:none }`, and no `<small>` is rendered in the day cell). So "calendar has both Persian and English dates" is true only in the weekday header row, not in the day cells. Xar wants both, integrated, inside each cell.
- **Today's cell fills solid with the accent.** `.calendar-board-layout .today-day { background: var(--g-acc); }` — on the forced-indigo board that reads as a jarring block. Combined with the palette override, "click today and it's just dark blue" makes sense.
- **The month controls are absolutely positioned above the grid** (`.calendar-board-controls { position:absolute; top:-3.05rem }`) and the legend uses a `padding-top: 5.1rem` hack to line up with the grid. These are the fragile bits most likely to produce the "lines going into each other" Xar mentioned at narrow widths.
- **The capture hero** ("Capture first. Structure after.") lives in `TheCourt.jsx` with an arch motif (`.court-capture-hero.capture-arch`). Xar finds it messy.

### 0. Verify first
Start backend (`cd backend && npm.cmd run dev`) and frontend (`cd frontend && npm.cmd run dev`). Walk: intro → Court → capture a note → Calendar → Today → cycle Ground on the Court. Confirm the current behaviour matches the notes above (especially: Ground button missing on calendar, calendar looks blue whatever the Ground). Report anything that differs before you start — the code may have moved since I read it.

---

## 1. Ground: correct default, correct cycle, reachable everywhere

**Default and order.** Confirm `groundContext.jsx` initialises to `'madder'` when `localStorage['life-os.ground']` is empty, and that `cycleGround()` advances **madder → indigo → paper → madder**. If either is off, fix it. (Madder is the "matter" Xar means — it's the intended default.)

**Reachable everywhere.** The Ground control must be available on every in-app screen, including the calendar and today. See §2 — the fix is to stop hiding the nav on board routes. Do not add a second, separate Ground button; keep one control in one shared place.

---

## 2. Kill the fixed-blue calendar — make every screen obey Ground *(highest priority)*

Two changes, both about one principle: **there is one theme system, and every screen lives inside it.**

**2.1 Remove the board palette override.** Delete the token overrides inside `.court-screen.board-screen` in `tokens.css` — the `--g-bg`, `--g-bg2`, `--g-ink`, `--g-acc`, `--g-sub`, `--g-line`, `--g-panel`, `--g-accsoft`, `--g-shadow`, `--g-muted`, `--g-faint`, `--g-hairline`, `--g-wash`, `--g-coral`, `--g-rose`, `--g-sage`, `--g-blue`, `--g-deep` lines in that block. Keep any *layout* properties that block also sets (`min-height`, `margin`, etc.) — only strip the colour tokens so the screen inherits whatever `data-ground` is active. After this, the calendar in `madder` should be warm red, in `paper` should be light, in `indigo` should be the dark blue — because the user chose it, not because the calendar forces it.

**2.2 Any other hardcoded hex in the calendar path.** Grep the calendar CSS for literal colours (`#`, `rgba(233, 220, 192`, `rgba(0,0,0`, etc.) used for surfaces/borders/text and replace with the Ground tokens (`--g-wash`, `--g-hairline`, `--g-ink`, `--g-faint`, `--g-panel`…). Example already spotted: `.calendar-board-layout .calendar-day { background: rgba(233,220,192,0.022) }` — that's a paper-tinted wash baked in; use `var(--g-wash)` so it re-tints per Ground. The rule of thumb: **no raw colour literals in component CSS; everything routes through a `--g-*` token.**

**2.3 Keep the shared nav on board routes.** In `CourtLayout.jsx`, stop hiding the topbar when `isBoardRoute`. The calendar and today should keep the same wordmark + date + nav (Court · Today · Calendar · Study hub · Ground · Divan) as every other screen, so the app reads as one continuous surface. If the board layouts need more width, let the nav stay and adjust the board's own max-width/margins rather than removing the nav. If `board-screen` no longer carries a palette, consider whether the class is still needed at all — if it only ever set colours, remove it and the `isBoardRoute` branch; if it still does layout, keep it for layout only.

**Acceptance for §2:** on the calendar and today, the Ground button is present, and cycling madder → indigo → paper visibly re-themes the *entire* calendar (background, cells, text, today, chips) with no blue leaking through in madder/paper. Persist across refresh.

---

## 3. The calendar's dual dates — Persian + English, integrated inside each cell

Xar specifically loves the bilingual calendar and wants it kept — but the two scripts should feel like one designed unit inside each day cell, not an awkward stack.

**3.1 Actually render the Persian day in the cell.** In `CalendarView.jsx`, inside the `<time>` of each day, render the Persian numeral alongside the Latin one:

```jsx
<time dateTime={day.key}>
  <span>{day.date.getDate()}</span>
  <small lang="fa" dir="rtl">{PERSIAN_DAY_FORMATTER.format(day.date)}</small>
</time>
```

**3.2 Style the pair as one integrated element.** In `tokens.css`, for `.calendar-board-layout .calendar-day time`:
- Drop the monospace font (`ui-monospace,…`) — it fights the app's editorial type. Use the app's UI/number font.
- Lay the Latin number and Persian number as a small stacked or inline pair with clear hierarchy: the Latin day slightly larger and in `--g-ink`/`--g-sub`; the Persian day smaller, in `--g-faint`, using the poem/serif font (`--font-poem`) so it reads as a quiet companion, not competing. Tune size/line-height so they sit tight together (this is the "cube of each day" feel Xar wants). Keep the whole cluster top-left, aligned.
- Make sure the `.calendar-board-layout .calendar-weekdays small { display:none }` rule doesn't also hide the in-cell Persian day — that rule targets the weekday header row; the day-cell `<small>` is a different element, but verify it isn't caught by a broader selector.
- The weekday header already shows English + Persian short names; align its typographic treatment with the new in-cell treatment so the whole calendar shares one bilingual style.

**Acceptance for §3:** every day cell shows both the Gregorian and Jalali day number, visually harmonised (one clearly primary, one a quiet secondary), in the app's fonts, re-tinting correctly per Ground.

---

## 4. "Today" — a calm marker, not a solid block

Replace `.today-day { background: var(--g-acc) }` with a lighter treatment that reads as "this is today" without shouting: e.g. a soft ring/border in `--g-accsoft`, the day number in `--g-acc`, and at most a very low-opacity accent wash (`color-mix(in srgb, var(--g-acc) 12%, transparent)`) as the cell background. It must look intentional in all three Grounds — check madder (gold on warm red), paper (rust on cream), indigo (gold on navy). The point: today should feel gently highlighted and part of the same surface, not a foreign colour dropped on top.

---

## 5. Fix the overlaps and fragile layout hacks

Xar reports lines running into each other. Hunt and fix, testing at a few widths (a laptop width ~1280–1440px, and a narrow ~380px phone width, since this is a PWA):

- **`.calendar-board-controls`** is `position:absolute; top:-3.05rem`. On narrower widths this can collide with the header/title. Prefer placing Prev/Next in normal flow (e.g. in the month section header row, flex-aligned right) so it can never overlap. If you keep it absolute, guarantee clearance.
- **`.calendar-legend { padding-top: 5.1rem }`** is a magic number aligning the legend to the grid. If it drifts, the legend collides with the header. Prefer aligning via the grid (`align-items`/grid rows) rather than a hardcoded pad.
- **`.calendar-brandline span`** (the 1px hairline that stretches between the wordmark and the title) — verify it doesn't overrun into text at any width; give it real min/max bounds.
- Audit the Court's `.court-main-grid` panels (Today / Recently filed / poem) for the same class of overlap at narrow widths.
- General rule: replace absolute-position + magic-number alignment with flex/grid flow wherever it's cheap. Report any overlap you couldn't cleanly resolve.

---

## 6. The capture hero — calmer, clearer hierarchy

Xar finds "Capture first. Structure after." messy. Don't remove it — refine it. This one is partly taste, so make a *conservative* improvement and leave it easy to iterate:

- Establish one clear vertical rhythm: small eyebrow label ("Capture") → the headline → the input, with generous, even spacing. Right now the arch motif, the label, the headline and the textarea can feel crowded.
- Make sure the arch/`::before` decoration sits *behind* and doesn't crowd or clip the text at any width (check the overlap point again here).
- Keep the headline in the editorial serif; keep the input calm. If the headline competes with the input for attention, quiet the headline (size/weight/opacity) so the input is clearly the thing you act on — capture is the point, the slogan is atmosphere.
- Do **not** redesign the Court's overall structure here (that's the architecture report's job). This is purely making the existing hero breathe.

Report back with a screenshot-in-words (or actual screenshot if you can) of the before/after so Xar can react.

---

## 7. Poem of the day

Xar noted the design-folder versions got everything right *except* the poem-of-the-day, and wants that adjusted in the current Court too. The poem system is: `frontend/src/lib/poems.js` (has a `FALLBACK_POEM` and reads `window.POEMS_DB` from `frontend/public/poems-data.js`), rendered by `TheCourt.jsx` in `.court-poem`. The design-zip copies live under `design-explorations/`.

**This item needs Xar's specific intent before you change content** — which poem/behaviour he wants. So do only the safe, mechanical part now and flag the rest:
- Confirm which source is actually feeding the Court (`public/poems-data.js` vs the fallback), and make sure the couplet-picking logic in `poems.js` isn't showing the placeholder `FALLBACK_POEM` ("A private ledger opens here / Capture first. Structure after.") when a real poem DB exists.
- Ensure the Persian couplet renders correctly RTL with the poem font and its poet attribution.
- **Leave a clear note in your report** asking Xar whether he wants (a) a specific poem/poet, (b) a curated set, or (c) different behaviour (e.g. rotate daily by date, not per-load). Don't guess the literary content.

---

## 8. Validation & commits
- `npm.cmd run build` in `frontend` succeeds with no new warnings you introduced.
- Manual pass in all three Grounds on Court, Today, Calendar, Study: no raw-blue leak, nav present everywhere, today reads calm, dual dates render, no overlaps at ~1280px and ~380px.
- Commit in small checkpoints, one concern each: (1) board palette removal + nav-on-board, (2) dual-date rendering + typography, (3) today marker, (4) overlap/layout fixes, (5) capture hero, (6) poem plumbing. Small commits keep this revertible (permanent rule #5: don't lose work).

## 9. Do-not
- No schema, backend, or AI changes — frontend only.
- No new domains, routes, or "modules" — that's the architecture report's territory, still under discussion.
- Don't invent new colours; everything routes through the existing `--g-*` Ground tokens.
- Don't touch Study Hub's visual design — Xar loves it; it's the reference, not a target.
- Don't rewrite the Court's structure; only calm the hero.

## 10. Report back
Honest report: what you fixed, what deviated and why, any overlap you couldn't resolve cleanly, and the two flagged questions for Xar (poem content; whether removing `board-screen` entirely is safe once its palette is gone). Screenshots welcome.
