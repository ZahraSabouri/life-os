# Study Hub → Manuscript redesign — notes for the designer

The Study Hub has been re-skinned to the 42-page manuscript design and wired to the real,
working app (all three grounds: paper / madder / indigo). This doc lists the places where
the design either **doesn't exist yet** or **needs rework**, so the designer can produce
the missing/updated pieces. Everything below is currently **functional** — these are
design gaps, not broken logic (except where noted).

---

## A. The Card, Opened — needs a usability rework (highest priority)

The card was built to match `study-leaf.jsx`, but in use it's confusing compared to the
original Summer Rescue card. Requests:

1. **Plainer labels.** The poetic verbs are unclear. Please confirm final wording — proposed:
   - "Seal the proof" → **Mark done** (it toggles the card's done state)
   - "Move lane" → **Change status / lane** (Today · This Week · Deep Work · Backlog · Rescue · Waiting · Done)
   - "Start the glass" → **Start timer** (opens the Hourglass focus timer on this card)
   - "Split the leaf" → currently unimplemented (no "split a task" feature exists). Decide: design it, or drop it.
   - "back to the board ↩", "the shelf", "proofs", "leaf" — decide whether to keep the metaphor or use plain words (References, Evidence, Card).
2. **Fonts & density.** The card should read as easily as the Summer Rescue card — revisit
   type scale, line spacing, and the two-column balance so it's comfortable to use, not just pretty.
3. **References must be listed per card and openable.** In Summer Rescue every card listed
   *its own* references, and Applied ML cards embedded a **YouTube player**. The redesign's
   "From the shelf" is wired to the wrong link field, so most cards show nothing and clicking
   does nothing. Design needed for: (a) the per-card reference list, (b) the inline video/PDF
   reader/player, (c) the "attach a reference" affordance. *(Engineering will re-wire the data;
   design should show what the reference list + embedded player look like on each ground.)*
4. **Inline editing** of steps / evidence / notes (currently a prompt dialog) — design the
   inline edit affordance (click-to-edit row).
5. The extra editing the design omitted but the app needs a home for: full **detail editing**
   (title, chapter, phase, lane, priority, slot, estimate, start/due dates, "why it matters",
   "done-when"). Currently in an "Edit details" inline form — design a proper version.

## B. Surfaces / views with NO design page (need designs)

Re-homed functionally where possible, but no manuscript design exists:

1. **Planner / Dashboard** — pace, pipeline, week-at-a-glance planning controls. Partially
   overlaps Desk + Chronicle; no page of its own.
2. **Rescue Lane** as a dedicated page — currently expressed only as red-ink marginalia +
   a "Rescue" status on board cards. Decide if a standalone lane page is wanted.
3. **Settings / data panel** — local-file save, JSON export/import, backup handle, autosave
   banner. Design only gives a small "settings" affordance; the real panel is un-designed.
4. **Command palette (⌘K)** — design shows only "search ⌘K"; the full palette UI is un-designed.
5. **Import-preview dialog** — no design.
6. **Celebration** moment — README calls it a future "gold-leaf" moment; un-designed.
7. **Study Hub intro** (Cardiff) — kept per request, still in the old Summer Rescue style;
   a manuscript-grounds intro is a design opportunity.
8. **"New Chapter"** design exists (`study-new-chapter.jsx`) but the app has **no** create-a-module
   feature — reverse gap; left unimplemented unless module creation is wanted.
9. **Week grid** — the old 7-day Week view folds into Ledger; flag if a distinct week layout is wanted.

## C. Overlays / controls functional but not fully in the design

- **Music player** — the design mentions a "music chip" on the Hourglass; there's no standalone
  music component, so the old MusicPopover sits in the bottom-right control dock. Needs a design.
- **Settings / search** triggers currently live in the bottom-right dock alongside the Hourglass
  and Herald triggers. The 42 pages don't show where these live on each surface — please place them.

## D. Behaviour notes (already implemented, for reference)

- Study follows the app-wide 3-ground system (`madder / indigo / paper`); the header diamond
  switcher drives the global Ground. On **paper** the switcher swatches were cream-on-cream
  (invisible) — now given outlines + hover + tooltips.
- The Study manuscript page renders at its native 1512×982 layout (no scale transform) — the
  earlier scale-to-fit was removed at the user's request.
- **The Court** (Life OS hub) now uses a ground-coloured mat instead of black letterbox bars,
  and the **paper Court** now shows a "◆ GROUND" switcher (it was previously hidden).
- "THE COURT" breadcrumb in the Study header navigates back to the Court.
