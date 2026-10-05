# Life OS — Build Briefs 3–12: the data-structure decade

> **History, not instructions (5 October 2026).** The current plan is `../ROADMAP.md`; the status of every July brief is in `../Life_OS_Plans_Inventory.md` §5. The specs here were written for SQLite and an entries-only data model; see `../Life_OS_Architecture.md`.

**Written 2026-07-06.** This file is a *sequence of ten briefs*, meant to be executed one at a time by a local coding agent on Xar's Windows machine, in order. It is the successor to `Life_OS_AI_Build_Brief_2.md`. Read the "Where things actually stand" section below before starting Brief 3 — it's grounded in the real current code, which I read and cross-checked file by file, not in what Brief 2 *assumed* would exist.

The bias of this set, by Xar's explicit request, is **data-structure and backend design**. The reasoning is sound: this is a many-year, many-domain app, and the cost of getting the entry model, the type taxonomy, tags, links, files, and migrations right *now* is a weekend; the cost of getting them wrong is a rewrite every time a new domain arrives. Screens are cheap once the spine is right. So most of these briefs spend their weight on schemas, registries, validation, and the API surface — with just enough UI each time to prove the structure works against real data on a real screen (the project's "every session ends with something runnable" rule still holds).

## How to use this file

Each brief is self-contained enough to hand to the agent alone, but they assume the previous brief landed. **Before starting any brief, do what the memory note says: re-run the app and confirm the previous brief's work is actually there and working** — don't trust that it was done. Commit in the small checkpoints each brief specifies. After each brief, report back honestly (what you built, what deviated and why, what broke) the way Brief 2's executor was asked to.

One naming decision carried through all ten: the shared **source of truth for entry types/archetypes lives in one place and is imported by both backend and frontend** (Brief 4 builds it). Every later brief leans on that. Don't fork it into two copies.

---

## Where things actually stand right now (read before Brief 3)

I read `code/life-os/` directly. Honest state, corrected against Brief 2's assumptions:

**Backend — mostly matches Brief 2, one gap.** `backend/src/db.js` no longer forces WAL (good — the recurring bug is fixed, and `PRAGMA foreign_keys = ON` is set). `routes/entries.js` has the grown-up `POST /` (validates `type` against `note|task|event`, accepts `start_at`/`end_at`/`all_day`/`status`/`details`) and a `GET /` that does both the recent-list and the `from`/`end` date-range query. `routes/people.js` exists with `POST`/`GET` (it *requires* birthday — noted, see Brief 6). Both routers are wired in `server.js` behind the bearer-token check. **The gap: there is no `PATCH /:id` on entries.** Brief 2 §2.1 asked for it; it wasn't built. That means task-completion has no endpoint to call yet.

**Frontend — partially matches Brief 2, two real gaps.** `react-router-dom` is in and `App.jsx` routes `/` (Divan), `/court` (The Court), `/calendar` (CalendarView), with a `*` redirect. `CalendarView.jsx` (~374 lines), `birthdays.js`, `DivanIntro.jsx`, `TheCourt.jsx`, `lib/api.js`, `lib/poems.js` all exist. **But:**

1. **There is no `TodayView` and no `/today` route.** Brief 2 §5 was not built.
2. **There is no shared `CourtLayout`.** The Court and the Calendar each hand-roll their own top nav. Brief 2 §3's shared-layout refactor didn't happen. There's also no `groundContext.jsx` and no `useEntries.js` hook.
3. **Ground theming is inert.** This is the one that contradicts Brief 2's own belief. The three palettes (`madder` default, `indigo`, `paper`) *do* exist in `tokens.css` as `.app-shell[data-ground='…']` blocks. **But nothing in the JS ever sets `data-ground`, and every "Ground" nav button is `aria-disabled="true"` in both `TheCourt.jsx` and `CalendarView.jsx`.** So cycling themes does nothing today. Brief 2 wrote "Ground is now real (already built) — no question mark there anymore"; that was wrong. It's built in CSS and dead in JS.

**Net:** the capture-to-list spine and a month calendar are real and persist to SQLite. Task completion, the Today landing page, a shared layout, and *working* theme-switching are not. Brief 3 closes exactly that gap before we build anything new on top — you don't pour the second storey on an unfinished first one.

**Data model as it exists:** the full Brief-1 schema is in `migrations.sql` — `entries`, `tags`, `entry_tags`, `people`, `entry_people`, `places`, `entry_places`, `files`, `entry_links`. Only `entries` and `people` are used by any endpoint. The join tables and `tags`/`places`/`files` are empty scaffolding. Briefs 5–8 bring them to life. That's the point of this set.

---

# Brief 3 — Close the loop (finish what Brief 2 left half-built)

**Goal:** everything Brief 2 promised is actually working before we design anything new. Small brief on purpose. No new domains.

### 3.0 Verify first
Start the backend (`cd backend && npm run dev`) and frontend (`cd frontend && npm run dev`). Confirm: intro → Court → capture a note → it lands in "Recently filed" → refresh, still there → Calendar loads the current month. If any of that is broken, fix it before adding anything — report what you found.

### 3.1 Backend: the missing `PATCH /api/entries/:id`
Add to `routes/entries.js`. Accept a partial body and update only the fields present, always bumping `updated_at`. For now allow patching `status`, `title`, `start_at`, `end_at`, `all_day`, `details`. Reuse the existing `cleanOptional*` helpers and the `ENTRY_TYPES` guard isn't needed here (type changes are out of scope for this brief). 404 if the id doesn't exist; 400 on a bad date. Return the full updated, serialized row.

```js
const selectEntryById = db.prepare(`SELECT * FROM entries WHERE id = ?`)
const updateEntry = db.prepare(`
  UPDATE entries
     SET title = ?, status = ?, start_at = ?, end_at = ?, all_day = ?, details = ?, updated_at = ?
   WHERE id = ?
`)

router.patch('/:id', (req, res) => {
  try {
    const existing = selectEntryById.get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })

    // start from the existing row, override only provided keys
    const b = req.body ?? {}
    const title    = 'title'   in b ? cleanOptionalString(b.title)            : existing.title
    const status   = 'status'  in b ? cleanOptionalString(b.status)           : existing.status
    const startAt  = 'start_at'in b ? cleanOptionalDate(b.start_at,'start_at'): existing.start_at
    const endAt    = 'end_at'  in b ? cleanOptionalDate(b.end_at,'end_at')    : existing.end_at
    const allDay   = 'all_day' in b ? (b.all_day ? 1 : 0)                     : existing.all_day
    const details  = 'details' in b && b.details && typeof b.details === 'object' && !Array.isArray(b.details)
      ? JSON.stringify(b.details) : existing.details
    const now = new Date().toISOString()

    updateEntry.run(title, status, startAt, endAt, allDay, details, now, req.params.id)
    res.json(serializeEntry(selectEntryById.get(req.params.id)))
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
```

### 3.2 Frontend: the shared `useEntries` hook
Both The Court's "Recently filed" and the coming Today view fetch recent entries. Pull that into `frontend/src/lib/useEntries.js`: a hook that fetches via the existing `apiFetch`, exposes `{ entries, loading, error, refetch }`, and optionally takes a query string (`?limit=10` or `?from=…&end=…`). Refactor `TheCourt.jsx` to consume it instead of its inline fetch. Don't change The Court's visible behavior.

### 3.3 Frontend: `GroundProvider` — make theming actually work
This is the real fix, not cosmetic. Create `frontend/src/lib/groundContext.jsx`:

- Holds `ground` state, initialised from `localStorage['life-os.ground']`, defaulting to `'madder'`.
- `cycleGround()` advances `madder → indigo → paper → madder` and persists to `localStorage`.
- A `useEffect` sets `document.querySelector('.app-shell')?.setAttribute('data-ground', ground)` — or better, lift the attribute onto the shell in `App.jsx` by reading the context there. Simplest correct approach: `App.jsx`'s `.app-shell` div gets `data-ground={ground}` directly from the context.
- Export `GroundProvider` and a `useGround()` hook. Wrap `<BrowserRouter>`'s children in `GroundProvider` in `App.jsx`.

Then in **both** `TheCourt.jsx` and `CalendarView.jsx`, replace the `aria-disabled` "Ground" button with a live one: `onClick={cycleGround}`, label `Ground: {ground}`. Delete the `aria-disabled` attribute. Verify by clicking it on each page and watching the palette change and persist across a refresh.

### 3.4 Frontend: shared `CourtLayout` + the Today view
Build `frontend/src/components/CourtLayout.jsx`: the shared topbar (wordmark, live date, nav row: **Today · Calendar · Study hub (still inert) · Ground: {ground} · Divan**, plus a "← Court" link when the route isn't `/court`) and an `<Outlet />`. Move the nav out of `TheCourt` and `CalendarView` into this layout — **one nav bar, not three**. Re-parent the routes so `/court`, `/calendar`, `/today` render inside `CourtLayout`; keep `/` (Divan) full-bleed outside it.

Build `frontend/src/components/TodayView.jsx` at `/today` per Brief 2 §5: fetch entries where `start_at` is today (via `useEntries` with `?from=<today>&end=<today>`); render `task`-type entries with a checkbox that calls `PATCH /api/entries/:id` `{ status: status === 'done' ? 'open' : 'done' }` and refetches; render `event`-type plainly; below, reuse `useEntries` to show "Recently filed".

### 3.5 Validation & commits
Backend starts clean; `PATCH` updates and 404s correctly. `npm run build` in frontend succeeds. Smoke test: Court → Calendar → Today (tick a task, refresh, still done) → cycle Ground on every page and confirm it persists across navigation and reload. Commit in four checkpoints: PATCH endpoint · useEntries + Ground context · CourtLayout · TodayView.

### 3.6 Do-not
No new tables, no new domains, no AI. This brief only finishes Brief 2.

---

# Brief 4 — The entry taxonomy: archetypes + a shared type registry

**This is the keystone of the whole set.** Everything after it — tags, boards, library, study hub, search — is easier or harder depending on whether this is right. Spend real care here. Nothing in this brief ships a big new screen; it ships *the vocabulary the app thinks in*.

### 4.0 The idea, stated plainly
Right now an entry's `type` is a free string validated against `note|task|event`. That won't scale to books, workouts, job applications, clothes, places, movies, module-revision-sessions. But a flat list of 30 types is also wrong — it makes every lens special-case every type. The Stack Notes already flag the design prototype's answer: **a small set of archetypes above the domain-specific types.** Six, from the prototype:

- **Moment** — something that happened or will happen at a point/span in time and is "done" by occurring. (event, appointment, seminar, a logged workout, a photo-memory, a movie watched.)
- **Commitment** — something *you* must act on; has an open/done lifecycle. (task, errand, deadline, a job application's next action.)
- **Workstream** — an ongoing effort with progress and sub-parts. (a study campaign, a job hunt, a research project, learning a skill.)
- **Collection** — a shelf/set of like things. (books, movies, saved materials, code snippets, a wardrobe, a shopping list.)
- **Practice** — a recurring habit tracked over time. (workouts as a routine, journaling, a revision cadence, reading streak.)
- **Anchor** — a stable reference entity other entries hang off. (a person is *almost* this; a place; a recurring context like a module or a trip.)

The insight that makes this cheap instead of expensive: **lenses render by archetype, not by domain type.** The calendar shows anything with a date (mostly Moments/Commitments). Boards show Workstreams and their child Commitments. Library shows Collections. Today shows open Commitments and today's Moments. A new domain type (say "recipe") just declares its archetype and its extra fields, and it appears in the right lenses *for free*. That is the entire economic argument of the app (Blueprint §3), made concrete.

**Hold this loosely (per project rule): the six archetypes are the prototype's current best guess, not gospel.** If while building you find two collapse into one, or one is missing, say so in your report. Don't silently deviate; do raise it.

### 4.1 The registry — one file, two consumers
Create `code/life-os/shared/entryTypes.js` (a new top-level `shared/` dir importable by both backend and frontend — configure the frontend Vite alias / relative import so it can reach it; if the tooling makes cross-dir import painful, fall back to a `backend/src/shared/entryTypes.js` and a build step or a copy, but *prefer one real shared file* and document how each side imports it). Shape:

```js
// The six archetypes — the top-level shape every lens reasons about.
export const ARCHETYPES = ['moment', 'commitment', 'workstream', 'collection', 'practice', 'anchor']

// The domain-specific types. Each maps to exactly one archetype and declares
// the extra fields it stores inside entries.details (validated in 4.3).
// `fields` is a tiny schema: name -> { type, required?, enum?, default? }.
export const ENTRY_TYPES = {
  note:      { archetype: 'moment',     label: 'Note',        icon: '✎', fields: { body: { type: 'string' } } },
  event:     { archetype: 'moment',     label: 'Event',       icon: '📅', fields: { location: { type: 'string' } } },
  task:      { archetype: 'commitment', label: 'Task',        icon: '✓', fields: { priority: { type: 'enum', enum: ['low','med','high'], default: 'med' } } },
  workout:   { archetype: 'moment',     label: 'Workout',     icon: '🏋', fields: { kind: { type: 'string' }, duration_min: { type: 'number' } } },
  book:      { archetype: 'collection', label: 'Book',        icon: '📖', fields: { author: { type: 'string' }, status: { type: 'enum', enum: ['to-read','reading','read'], default: 'to-read' }, rating: { type: 'number' } } },
  // …the full v1 list lives here. Keep it to ~12–15 types (Blueprint §7.3).
}

export function typeExists(t) { return Object.hasOwn(ENTRY_TYPES, t) }
export function archetypeOf(t) { return ENTRY_TYPES[t]?.archetype ?? null }
export function typesByArchetype(a) { return Object.keys(ENTRY_TYPES).filter(t => ENTRY_TYPES[t].archetype === a) }
```

Populate the full v1 list, but **do not gold-plate** — 12 to 15 types, drawn from what the Vision actually names (note, event, task, workout, book, movie, place, person-link, job-application, material/bookmark, snippet, shopping-item, module-session for study). Anything speculative (recipes, clothes) can wait — adding one later is a one-line registry edit, which is the whole point.

### 4.2 Schema: add `archetype` to entries
New migration (Brief 12 builds a real migration runner; until then, extend `migrations.sql` idempotently). Add `archetype TEXT` to `entries`. Backfill existing rows: for every row, set `archetype = archetypeOf(type)` — write a tiny one-off script `backend/scripts/backfill-archetype.js` that reads distinct types and updates. Going forward, `POST /api/entries` sets `archetype` automatically from the registry — the client sends `type`, the server derives `archetype`; never trust a client-sent archetype.

Also add an index: `CREATE INDEX IF NOT EXISTS idx_entries_archetype ON entries(archetype);` and `CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);` — lenses will filter on these constantly.

### 4.3 Validation: details against the per-type schema
This is the structural payoff. In `entries.js`, replace the loose "details is any object" check with validation against `ENTRY_TYPES[type].fields`:

- Unknown keys in `details`: allow but ignore, or reject? **Choose reject-with-warning-off, i.e. strip unknown keys** so the store stays clean — but log which keys were stripped in dev. (Rationale: the AI capture layer later will send messy JSON; silently keeping junk turns `details` into Evernote-landfill, the exact anti-pattern in Blueprint §2.)
- Missing `required` field → 400 with a clear message.
- Wrong type (string where number expected) → 400.
- `enum` violation → 400.
- Apply `default`s for absent optional fields.

Write this as a pure function `validateDetails(type, details) -> { ok, value, errors }` in `shared/entryTypes.js` so the **frontend can pre-validate before POSTing** (instant feedback) and the backend can enforce (trust boundary). Same function, both sides — this is the reason the registry is shared.

Update `POST` and `PATCH` to run it. `POST` now also requires `type` to be a real registry key (`typeExists`), replacing the hard-coded `note|task|event` set.

### 4.4 A thin proof-of-structure UI
Don't build a new lens. Just prove the taxonomy works: on The Court's capture panel, add a small type picker (a row of the registry's icons/labels) so a capture can be filed as any registered type, and when a non-note type is chosen, reveal its declared `fields` as inputs (generated from the registry — a tiny `<FieldsForm type=…>` that iterates `ENTRY_TYPES[type].fields`). Submitting posts `type` + `details`, server validates, it appears in "Recently filed" with its icon. That single generated form is the visible proof that "new domain = registry edit, no new UI" is real.

### 4.5 Validation & commits
`validateDetails` unit-tested (a plain `node --test` file in `backend/` — e.g. required-missing, enum-violation, unknown-key-stripped, defaults-applied). Backfill script run; every existing entry has a correct `archetype`. `POST` a `book` with `{author, status}` works; `POST` a `book` with `status: 'nonsense'` 400s. Frontend builds; the generated fields form renders for at least three types. Commit: registry + validateDetails (+ tests) · migration + backfill · POST/PATCH validation · capture type-picker UI.

### 4.6 Do-not / forward-flags
No per-type bespoke screens yet (that's Library/Boards later — they'll read the registry). No AI. **Flag in your report:** did any archetype feel wrong or missing while you populated the type list? That's the single most valuable feedback this brief can produce.

---

# Brief 5 — Tags and Spaces (saved filters over the core)

**Goal:** bring the dormant `tags`/`entry_tags` tables to life, and introduce **Spaces** — the Blueprint's "Study / Career / Body / Mind / Home / Travel" contexts — not as separate mini-apps but as *saved filters* over the one entries table. This is the mechanism that lets the app have "modules" without the cost of modules.

### 5.1 Tags backend
New `routes/tags.js`:
- `GET /api/tags` — list all tags with a usage count (`LEFT JOIN entry_tags GROUP BY`), ordered by count desc then name.
- `POST /api/tags` — `{ name, color? }`. Normalise name (trim, lowercase for uniqueness but store display case; or just lowercase-canonical — pick one and document it). `color` is an optional hex; if absent, deterministically derive one from the name hash so tags are colored without manual work (color = context, Blueprint §5). Reject duplicates (the `UNIQUE` constraint already exists) with a friendly 409 returning the existing tag.
- Add `color TEXT` to the `tags` table via migration.

Tag *assignment* lives on entries, not on a separate call where possible:
- Extend `POST /api/entries` and `PATCH /api/entries/:id` to accept `tags: ['study','urgent']` (array of tag *names*). Server upserts each tag (create if missing), then syncs `entry_tags` for that entry (insert missing, delete removed on PATCH). Wrap the multi-statement sync in a transaction (`db.exec('BEGIN')`/`COMMIT`, or node:sqlite's transaction helper if available) so a half-applied tag set can't happen.
- `GET /api/entries` now returns each entry's `tags: [{name,color}]` (a second query keyed by the fetched ids, or a grouped join — avoid N+1: fetch entries, then one `WHERE entry_id IN (…)` for their tags).

### 5.2 Spaces — saved filters as first-class config
A Space is a named, colored, saved query. Don't overbuild it into a rules engine. New table:

```sql
CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  filter TEXT NOT NULL DEFAULT '{}',  -- JSON: the saved query
  position INTEGER NOT NULL DEFAULT 0, -- sidebar order
  created_at TEXT NOT NULL
);
```

The `filter` JSON is a small, closed vocabulary the entries query understands — **not** arbitrary SQL (never store executable query text). v1 filter keys: `types: []`, `archetypes: []`, `tags: []` (AND semantics across keys, OR within a key), maybe `status: []`. Example Study space: `{ "tags": ["study","cardiff"], "archetypes": ["commitment","workstream","practice"] }`.

`routes/spaces.js`: `GET`/`POST`/`PATCH`/`DELETE`. Seed three sensible starter spaces on first run (Study, Career, Body) via an idempotent seed script — but make them fully editable/deletable, they're not sacred.

### 5.3 The entries query gains a filter layer
Generalise `GET /api/entries` to accept the same filter vocabulary as query params or a `spaceId` (server loads that space's `filter` and applies it). Build the WHERE clause **from a whitelist**, binding parameters — never string-concatenate user input into SQL. Put this in a small `buildEntriesQuery(filter) -> { sql, params }` helper in `backend/src/query.js`; Brief 11 (search) will extend the same helper rather than a second query path.

### 5.4 UI: a Spaces rail + tag chips
Add a left rail (or a row under the topbar on mobile) in `CourtLayout` listing spaces as colored pills; clicking one navigates to `/court?space=<id>` (or a `/space/:id` route) whose entry list is filtered. Show tags as small colored chips on each entry in the lists, and let the capture form add tags (free-text with autocomplete from `GET /api/tags`). Keep it calm — chips are small, color is the only decoration (content-is-decoration, Blueprint §5).

### 5.5 Validation & commits
Tag upsert is idempotent and transactional (posting an entry with `['a','a','b']` yields two tags, correct joins). Deleting a tag from an entry via PATCH removes only that join, not the tag globally. A Space filter returns exactly the entries it should (write a `node --test` against a seeded fixture). No SQL-injection surface: confirm `buildEntriesQuery` only ever binds. Commit: tags API + migration · entry tag-sync · spaces API + seed · query layer · UI rail/chips.

### 5.6 Do-not / forward-flags
Don't build tag *hierarchies* or tag merging yet (flag as future). Spaces are filters, not folders — resist any request to make an entry "belong to" one space exclusively; entries are multi-context by design.

---

# Brief 6 — People and Places as first-class, and the links that tie entries together

**Goal:** turn `people`, `places`, `entry_people`, `entry_places`, and `entry_links` from empty scaffolding into a real relational layer. This is what makes "who was on that trip", "dinner with Sara", "photos from Barry Island", and "this task belongs to that job application" possible — and it's mostly pure data-structure work.

### 6.1 People grow up
The current `people` table is `(id, name, birthday, notes)` and the route *requires* birthday — too strict (you know people whose birthday you don't have). Migration adds: `relationship TEXT` (friend/family/colleague/…), `avatar_file_id TEXT` (nullable, links to `files` once Brief 8 exists), and keeps `birthday` optional. Loosen `routes/people.js`: `name` required, everything else optional (fix the current `birthday is required` 400). Add `PATCH /:id` and `GET /:id` (a person's detail, including their linked entries — see 6.3).

Gift ideas / per-person notes: don't make a new table. A gift idea is just an **entry** of type `note`/`task` linked to the person via `entry_people`. This is the archetype system paying off — "Anchor" people accrete entries around them.

### 6.2 Places
Bring `places` to life with `routes/places.js`: `GET`/`POST`/`PATCH`. Fields already exist (`name, lat, lng, notes`). Don't build geocoding now (no paid API; flag Nominatim/OpenStreetMap free tier as a later option). A place is created either manually or (later) from an entry's location. Add `place_kind TEXT` (home/uni/cafe/landmark/…) for the eventual Map lens legend.

### 6.3 The linking API — the actually-important part
Three join tables, one consistent pattern. Rather than three bespoke endpoints, add a small, uniform sub-resource API under entries:

- `POST /api/entries/:id/people` `{ person_id, role? }` → inserts into `entry_people`. `DELETE /api/entries/:id/people/:personId`.
- `POST /api/entries/:id/places` `{ place_id }` / `DELETE …`.
- `POST /api/entries/:id/links` `{ to_entry_id, relation }` / `DELETE …`. `entry_links` is directional with a `relation` string (e.g. `part-of`, `about`, `packing-for`). Enforce that both entries exist (foreign keys are ON, but return a clean 400 rather than a raw FK error).

`GET /api/entries/:id` (new — a single-entry detail endpoint) returns the entry *hydrated*: its tags, its linked people (name + role), its places, and its links (both outgoing and incoming, so "what packs into this trip" and "what is this task part of" both resolve). Keep hydration to one extra query per relation keyed by id — no N+1.

Decision to make explicit in your report: **incoming vs outgoing links.** A trip links to its photos (`trip --part-of--> ...` no; photos --part-of--> trip). Pick a convention (child points to parent via `part-of`) and document it in a comment at the top of `entry_links` usage, because every lens that walks the graph depends on the direction being consistent.

### 6.4 UI: proof, not a full People lens
On an entry's detail (a modal or a `/entry/:id` route — your call, keep it small), show and allow adding: people (autocomplete from `GET /api/people`, with an inline "create person" fallback), a place, and a link to another entry (search-picker). On the Calendar's birthday panel, make each birthday click through to that person's detail showing their linked entries. **No standalone People or Map page yet** — those are later lenses; this brief builds the *relations*, not their dedicated views.

### 6.5 Validation & commits
Linking a person to an entry and re-fetching the entry shows them; unlinking removes only the join. Creating a person with no birthday works now. Deleting an entry doesn't orphan joins (add `ON DELETE CASCADE` in the migration for the join tables, or delete joins in the entry-delete handler — pick one, cascade is cleaner). `node --test` for the hydration query. Commit: people migration + loosened API · places API · linking sub-resources · entry-detail hydration · UI.

### 6.6 Do-not / forward-flags
No contact import, no social features, no map rendering (flag Map lens as later). Don't let "person" become a CRM — it's an Anchor for memories and plans, nothing more.

---

# Brief 7 — Collections and the Boards lens (kanban over anything)

**Goal:** the `Collection` archetype and a real **Boards** lens — kanban columns over any project-like set. The first real board is the **job/PhD pipeline** (Found → Applied → Interview → Offer), which the Vision explicitly wants. This is where ordering/position data structures get designed properly, because getting drag-ordering wrong is a classic pain.

### 7.1 Collections table
```sql
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'board',   -- 'board' | 'shelf' | 'list'
  archetype TEXT,                        -- what it mostly holds, for lens routing
  columns TEXT DEFAULT '[]',             -- JSON: ordered column defs for boards
  config TEXT DEFAULT '{}',              -- JSON: per-kind extras
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_entries (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  column TEXT,             -- which board column this entry sits in
  position TEXT NOT NULL,  -- fractional index (see 7.3) — TEXT, not INTEGER
  PRIMARY KEY (collection_id, entry_id)
);
```

A board's `columns` JSON is an ordered list like `[{"id":"found","label":"Found"},{"id":"applied","label":"Applied"},…]`. A card's `column` references one of these ids; a card without a column shows in a backlog.

### 7.2 The ordering decision — fractional indexing
Store `position` as a **string fractional index** (e.g. the `fractional-indexing` approach: keys like `"a0"`, `"a1"`, `"a0V"` that always have room to insert between two neighbours). Reason: with integer positions, moving one card between two others forces renumbering a whole column (many writes, race-prone). With fractional keys, a move is a *single* write — compute a key between the two neighbours. Implement a tiny `midpoint(a, b)` helper (there's a well-known ~40-line algorithm; write it, don't add a dependency unless one is trivially vendorable). This same ordering primitive will serve the Library shelves and any future reorderable list — build it once in `backend/src/ordering.js`.

### 7.3 Boards API
`routes/collections.js`:
- `GET /api/collections?kind=board` and `GET /api/collections/:id` (hydrated: columns + entries grouped by column, each column's entries sorted by `position`).
- `POST /api/collections` (create a board with columns).
- `POST /api/collections/:id/entries` `{ entry_id, column, before?, after? }` — adds an entry to the board, computing `position` from the before/after neighbours.
- `PATCH /api/collections/:id/entries/:entryId` `{ column?, before?, after? }` — the move operation: change column and/or recompute position. One row updated.
- `DELETE …/entries/:entryId`.

Job applications: a job application is an **entry** of type `job-application` (archetype `commitment` or its own — decide in Brief 4's registry) with `details` like `{ company, role, url, next_action, deadline }`. The board is just a collection over those entries. The pipeline stage = the board column. This means a job application also shows up on the calendar (via its `deadline`/`next_action` date) and in Today — for free, because it's an entry. That cross-lens payoff is the thing to verify.

### 7.4 UI: the Boards lens
New `/boards` route and `BoardView.jsx`: columns as vertical lists of cards, drag-and-drop between/within columns (use the native HTML5 drag events or a small well-supported lib — `@dnd-kit/core` is the sane 2026 choice; if you add it, note it in the report and keep it isolated to this view). On drop, call the PATCH move with computed neighbours; optimistic update, reconcile on response. Cards show title + a couple of `details` fields + tag chips. A "+ card" per column creates an entry and adds it. Respect all three grounds.

### 7.5 Validation & commits
Moving a card is exactly one DB write (log the SQL in dev to prove it). Reordering never renumbers siblings. A job-application entry appears both on its board and (if it has a dated `next_action`) on the calendar/Today. `node --test` for `midpoint` (including the hard cases: insert at start, at end, between adjacent keys). Commit: collections schema + ordering primitive (+tests) · boards API · board UI · job-pipeline seed.

### 7.6 Do-not / forward-flags
One board kind for now (kanban). No swimlanes, no WWIP limits, no board templates gallery — this-is-becoming-Jira is the anti-goal (Blueprint §2). Flag: shelves reuse `collections` with `kind='shelf'` in Brief 9 — don't duplicate the table.

---

# Brief 8 — Files and photos: the upload pipeline

**Goal:** the `files` table and a real upload endpoint, on-disk storage, thumbnails, and photos attached to entries — the substrate for the Gallery lens and person avatars. Backend-heavy, and it touches the "don't lose my data" rule hard, so be careful.

### 8.1 Storage layout (decide once, document it)
Files live on disk, DB stores metadata + path (Stack Notes §Database — standard practice). Layout under `backend/data/files/` (gitignored already via `backend/data/*`), sharded by date to avoid one giant directory: `files/2026/07/<uuid>.<ext>`. Thumbnails alongside: `files/2026/07/<uuid>.thumb.webp`. Store the *relative* path in the DB (portable if the folder moves — supports the "move my data forever" rule).

### 8.2 Upload endpoint
`multer` is already a dependency (installed in Brief 1, unused). `routes/files.js`:
- `POST /api/entries/:id/files` (multipart) — accepts one or more files, validates mime (images first: jpeg/png/webp/heic; reject executables), size cap (e.g. 25 MB, configurable), writes to the sharded path, generates a thumbnail (use `sharp` — the standard Node image lib; it's a native dep but prebuilt binaries install cleanly on Windows now, unlike the SQLite situation — confirm it installs before committing to it; if it fights you, fall back to storing originals only and flag thumbnails as TODO). Inserts a `files` row and returns it. Also extracts EXIF (see 8.3).
- `GET /api/files/:id` — streams the file (with correct content-type; support a `?thumb=1` variant). This route needs the auth check like everything else — but note images in `<img src>` can't send an Authorization header easily; decide the pattern now: either a short-lived signed query token per file URL, or serve files behind the same Tailscale-only boundary and relax auth for `GET /api/files/:id` specifically. **Pick the signed-token approach** — it's the honest one and it generalises when the app leaves localhost. Document it.

### 8.3 EXIF → dates and places (structural, high-value)
When an uploaded image has EXIF `DateTimeOriginal`, use it to set the parent entry's `start_at` if the entry doesn't already have one — a beach photo *becomes* a dated memory automatically (this is what powers Day One-style "On This Day" later, Blueprint §2/§6). If EXIF has GPS, create-or-match a `place` and link it. This is the AI-free version of "effortless input" — the photo carries its own metadata; the app just reads it. Use a small EXIF reader (`exifr` is good and pure-JS — no native build). Keep it best-effort: no EXIF, no problem.

### 8.4 Files table usage + entry hydration
`files` already has `(id, entry_id, path, mime_type, size, created_at)`. Add `width`, `height`, `thumb_path`, `taken_at` (EXIF date), and reuse for avatars (a person's `avatar_file_id` from Brief 6). Extend the entry-detail hydration (Brief 6.3) to include `files: [{id, thumb_url, url, width, height}]`.

### 8.5 UI: attach + a minimal gallery strip
On entry capture/detail, allow dropping/selecting images; show thumbnails. Add a first-cut `/gallery` route showing all image-bearing entries as a time-ordered thumbnail grid (clicking opens the entry). This is the seed of the Gallery lens — keep it a grid, no albums/faces/editing.

### 8.6 Backups — because this brief creates irreplaceable data
Photos are the one kind of data you can't recreate. Before this brief is "done", write `backend/scripts/backup.js`: copies `data/life-os.db` **and** `data/files/` to a timestamped folder outside the repo (e.g. a sibling `Life_OS_backups/<ISO-timestamp>/`), and document running it. This is a stopgap until Brief 12's proper backup system — but you don't merge an irreplaceable-data feature without *a* backup path. (Ties to permanent rule #5.)

### 8.7 Validation & commits
Upload an image → thumbnail generated → served via signed URL → thumbnail visible in the gallery → EXIF date set the entry's `start_at` → refresh, persists → file physically present under the sharded path. Delete an entry → its files' rows cascade *and* the physical files are removed (don't leak orphaned files on disk — handle this in the delete path explicitly; a DB cascade won't touch the filesystem). Run the backup script, confirm it copies both DB and files. Commit: storage + upload endpoint · thumbnails + EXIF · serving + signed URLs · gallery grid · backup script.

### 8.8 Do-not / forward-flags
No image editing, no albums, no face detection, no cloud storage. Flag Gallery-lens polish (map view of photos, On-This-Day) as later. Watch disk space (Stack Notes: ~4 GB per 1000 phone photos) — mention it, don't solve it.

---

# Brief 9 — The Library lens: typed shelves (books, movies, materials, snippets)

**Goal:** the `Collection`-archetype domain types get their home — a **Library** of shelves. Mostly this is registry detail-schemas (Brief 4) plus a shelf view reusing `collections` (`kind='shelf'`, Brief 7). Little new backend; lots of "does the taxonomy actually hold real domains" pressure-testing.

### 9.1 Registry detail-schemas for the shelf types
In `shared/entryTypes.js`, flesh out the `fields` for:
- `book` — `author, status[to-read|reading|read], rating, started_at, finished_at, cover_file_id`.
- `movie` — `director, status[to-watch|watched], rating, watched_at`.
- `material` (a saved article/bookmark/interesting thing) — `url, source, note, archived[bool]`.
- `snippet` (code) — `language, code, source_url`. (The "little GitHub" wish, Vision §Code — the humble version: a searchable snippet shelf, not a git host. Flag real-git-later.)

Each is archetype `collection`. Status lifecycles (to-read → reading → read) are just `status` on the entry, so Today/Calendar can surface "currently reading" and a finished_at date lands on the timeline.

### 9.2 Shelves = collections, reused
No new tables. A shelf is a `collections` row with `kind='shelf'` and an `archetype`/type filter, or an explicit membership set — decide: **auto-shelves** (a shelf is a saved filter like "all `book` entries", overlapping Spaces) vs **manual shelves** ("my 2026 reading"). Support both cheaply: a shelf's `config` says `{ "auto": { "types": ["book"] } }` for auto, or uses `collection_entries` for manual curation. Most shelves are auto (every book on the Books shelf without lifting a finger — effortless input again). Manual shelves reuse the Brief 7 membership + ordering.

### 9.3 External metadata — design now, fetch later
When you add a book, you want the cover and author without typing them. Design the seam: a `details.external_ref` field (`{ source: 'openlibrary', id: '…' }`) and a *stubbed* `enrichEntry(type, query)` function that later calls a free API (Open Library for books, TMDB free tier for movies) to fill fields. **Build the stub and the field, not the network call** — this brief proves the data shape; a later brief (or the AI layer) wires the fetch. Keeps to £0 and avoids committing to an API before it's needed.

### 9.4 UI: the Library lens
`/library` route: a shelf switcher (Books, Movies, Materials, Snippets) and, per shelf, a view suited to the type — books/movies as a cover grid (cover from `files` or a placeholder), materials as a reading list, snippets as a monospace list with copy-to-clipboard and syntax-tinted blocks. Reuse the generated `<FieldsForm>` from Brief 4 for adding items. All three grounds respected.

### 9.5 Validation & commits
Adding a `book` with a status shows it on the Books shelf; marking it `read` with a `finished_at` makes it appear on the calendar that day. An auto-shelf updates when a new matching entry is captured (no manual add). Snippet copy-to-clipboard works. Commit: registry schemas · shelf logic (auto + manual) · external-ref stub · library UI.

### 9.6 Do-not / forward-flags
No real external API calls (stub only). No git hosting. No e-reader/PDF viewing. Flag: the closet/wardrobe type (Vision §Style) slots in here trivially later as another `collection` type with photo fields — a good "the structure paid off" demo, but not now.

---

# Brief 10 — Study Hub: the exam tracker, rebuilt as a lens on the new engine

**Goal:** bring the working Study Hub design into Life OS as a real lens — but modeled on *this app's* structure (entries, archetypes, collections, links), not the old tracker's bespoke shape. Xar's reasoning is decisive here: this isn't a one-off for the August exams, it's a **recurring need every semester** (new modules, new campaigns, possibly three more exam seasons), so it must be a *reusable pattern over the engine*, not a hardcoded 2026 screen. The existing design in `design-explorations/study hub…` and the retired `code/life-os-app` fork (modules CMT307 / Time Series / MAT700) is the visual and behavioural reference — reuse the look; re-home the data.

### 10.1 Model study on the existing archetypes (no bespoke tables if avoidable)
Map the tracker's concepts onto the engine:
- A **campaign** (e.g. "Summer Rescue 2026", later "Autumn 2026") = a `collection` with `kind='campaign'` (or a `Workstream` entry — pick the one that composes best; a collection is likely cleaner because it holds many entries and has phases as columns). It carries the term, date window, and phase definitions in `config`/`columns`.
- A **module** (CMT307, …) = an entry of type `module`, archetype `workstream`, `details: { code, title, exam_date, credits }`, linked to the campaign collection.
- A **study/revision session** = an entry of type `module-session` (from Brief 4's registry), archetype `moment` (it happened at a time) or `commitment` (planned but not done) — support both states via `status`. `details: { topic, planned_min, done_min }`, dated, linked to its module via `entry_links` (`part-of`).
- **Evidence** (the tracker's proof-of-work) = files (Brief 8) or notes linked to a session/module. Reuse `entry_links`/`files`, don't invent an evidence table.
- **Phases** = the campaign board's columns (reuse Brief 7 boards) or a `phases` array in `config`.
- **Progress** = computed, not stored: derive % from sessions done vs planned, or evidence collected, at query time. Storing progress invites drift; compute it.

The test of this design: **next semester, Xar creates a new campaign, adds three new module entries, and the whole Study Hub works with zero code changes.** If achieving that requires a study-specific table, that's acceptable — but try hard to express it in the engine first, and in your report state honestly which concepts needed bespoke storage and why. This is exactly the "add it to the structure we want, not the structure it already has" instruction.

### 10.2 What (little) new backend is needed
Likely just: the `module` and `module-session` types in the registry (Brief 4), a `kind='campaign'` for collections, and a **progress endpoint** `GET /api/collections/:id/progress` that computes per-module and overall completion from linked sessions/evidence. Possibly a convenience `GET /api/study/current` that returns the active campaign hydrated (modules, their sessions, progress) so the screen is one fetch. Prefer computing over storing.

### 10.3 UI: port the working screen onto the new data
Rebuild the Study Hub screen in the app's component system (`/study` route, reachable from the topbar's currently-inert "Study hub" link — wire it up now), matching the existing design's visual language (it's already in the Divan/Court language per Brief 2 §8). Read the design files directly for fidelity. Data comes entirely from the engine endpoints above. Reuse: boards (phases), the generated fields form (add a module/session), files (evidence), calendar (exam dates and planned sessions already show up because they're dated entries). The Study Hub should feel like *the tracker*, but every number on it is derived from entries you could also see on the calendar and Today.

### 10.4 Migrate the real 2026 data
Seed the current campaign for real so it's usable immediately for the August exams: create the "Summer Rescue 2026" campaign, the three modules with their real exam dates, and whatever phase structure the existing tracker uses. A one-off `backend/scripts/seed-study-2026.js`. This is the thing Xar will actually open daily until end of August — make it real, not lorem-ipsum.

### 10.5 Validation & commits
The Study Hub renders the three modules with live progress derived from linked sessions. Adding a session updates progress and appears on the calendar. Creating a *second* campaign (a throwaway "Test Autumn") and adding a module to it works with no code change — delete the test after. Exam dates show on the calendar. Commit: study registry types + campaign kind · progress endpoint · study UI · 2026 seed.

### 10.6 Do-not / forward-flags
Don't recreate the old tracker's internal architecture — re-home its *behaviour* onto entries. Don't hardcode "three modules" or "2026" anywhere; everything is data. Flag: spaced-repetition / smarter revision scheduling as a later intelligence feature, not now.

---

# Brief 11 — Search and the "Ask" foundation

**Goal:** make everything findable. A unified full-text search over all entries, and the query substrate that a later "ask my life" intelligence layer will sit on. Backend-heavy; the payoff is that as the app fills with years of data, nothing gets lost (the Evernote-landfill failure mode, prevented).

### 11.1 SQLite FTS5 over entries
`node:sqlite` ships FTS5. Create a virtual table indexing the searchable text of entries (`title`, `details` flattened to text, tag names, linked people names). Keep it in sync with triggers or on write in the API layer (triggers are more robust — an entry written by any path stays indexed). Migration:

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
  entry_id UNINDEXED, title, body, tags, people,
  tokenize = 'unicode61 remove_diacritics 2'
);
```

Populate on insert/update/delete of entries and their tags/people links. `remove_diacritics` matters here — Xar's data mixes English with Persian/Urdu; test that search handles non-Latin script gracefully (FTS5 unicode61 does reasonable things; verify with a Persian title).

### 11.2 The search endpoint
`GET /api/search?q=…` → ranked results (FTS5 `bm25()` ordering), each result a lightweight entry summary with a snippet (`snippet()` function) and its archetype/type so the UI can icon it. Combine with the Brief 5 filter vocabulary: `GET /api/search?q=sara&types=event` searches within a filter. Reuse `buildEntriesQuery` — search is a filter with a text predicate, not a separate subsystem.

### 11.3 Reserve the semantic-search seam (design, don't build)
Stack Notes flag that semantic search is the one place SQLite is weaker and it's explicitly "later, if it becomes a priority". So: add a nullable `embedding BLOB` column to entries and a stubbed `embedText()` that returns null for now. Design the interface so that when the free Gemini embedding tier is wired (or a local model), semantic ranking slots in beside FTS5 (hybrid: FTS5 for exact, cosine for meaning). **Do not** call any embedding API in this brief (£0 rule, and it's premature). Just leave the door open at the schema level so adding it later isn't a migration scramble.

### 11.4 UI: a command-style search
A global search (keyboard shortcut `/` or `⌘K`) opening an overlay: type, see ranked results grouped by archetype, Enter to open. This is the "one input, always a tap away" ethos applied to *retrieval* (the capture box is its input twin). Keep it fast and calm.

### 11.5 Validation & commits
Searching a word in a book's title, a person's name on a linked event, and a tag all return the right entries, ranked sensibly. A Persian-script title is findable. Editing an entry updates its search result; deleting removes it (triggers verified). `node --test` over a seeded corpus. Commit: FTS5 table + sync triggers · search endpoint (+ filter combine) · embedding column stub · search UI.

### 11.6 Do-not / forward-flags
No LLM calls, no embeddings computed, no natural-language "ask" yet — this builds the retrieval floor the Ask feature will stand on. Flag the AI capture + Ask layer (Gemini free tier / MCP-over-DB, Stack Notes) as the big next chapter once the spine is this complete.

---

# Brief 12 — Data integrity: real migrations, versioned backups, full export/import

**Goal:** the safety and ownership layer, serving two permanent rules — #3 "I own and can move my data and code forever" and #5 "don't lose my data." Until now migrations were idempotent `CREATE IF NOT EXISTS` blocks and backups were an ad-hoc script. As the schema and the data both get valuable, that's not enough. This brief makes changes safe and data portable. **Fittingly last**, because it protects everything the previous nine built.

### 12.1 A real migration runner
Replace the "one big `migrations.sql` run every boot" with versioned, ordered, once-only migrations:
- `backend/migrations/0001_init.sql`, `0002_archetype.sql`, `0003_tags_color.sql`, … (retro-fit the changes the earlier briefs made into numbered files).
- A `schema_migrations` table recording which have run. On boot, `db.js` runs any unapplied migration in order, inside a transaction each, and records it. Never re-runs an applied one.
- This makes schema changes auditable and reversible-ish, and kills the class of bug where an `ALTER` runs twice or in the wrong order. Document how to write the next migration.

### 12.2 Automatic backups before destructive operations
Generalise Brief 8's backup script into `backend/src/backup.js`:
- A timestamped copy of `life-os.db` (and optionally `files/`) to `Life_OS_backups/` outside the repo.
- **Call it automatically before running any migration** (so a bad migration can't destroy data — restore is a file copy) and before any bulk-delete/import operation.
- Keep the last N backups, prune older (configurable). A tiny scheduled option can come later; manual + auto-before-risky is enough now.
- Verify the WAL-avoidance from Brief 2 still holds so backups are consistent single-file copies (it does — no WAL means `life-os.db` is self-contained; note this is *why* the WAL decision matters for backups, closing that loop).

### 12.3 Full export / import — the ownership guarantee
`GET /api/export` → a single JSON (or a zip: `data.json` + a `files/` folder) containing every table's rows and the file blobs. This is the "move my data forever" promise made real — Xar can take this anywhere, and it's a human-readable record. `POST /api/import` → restores from such an export into an empty DB (with a backup taken first, per 12.2). Version the export format (`{ "format": 1, … }`) so future imports can adapt.

Also a lighter `GET /api/entries/export.csv` for the spreadsheet-minded — entries flattened — because sometimes you just want to open your life in a table.

### 12.4 UI: a Settings/Data page
A small `/settings` route: cycle Ground (finally a home for it beyond the nav), download an export, run a backup, see the current schema version and last backup time. Nothing fancy — a plain, trustworthy utility page. The emotional job of this page is *confidence*: Xar has been burned by corruption before (permanent rule #5), and seeing "last backup: 5 minutes ago, export your data here" is what earns daily trust.

### 12.5 Validation & commits
Migrations run once and only once (boot twice, second boot applies nothing). A deliberately-bad migration leaves a restorable backup. Export → wipe a scratch DB → import → data identical (round-trip test in `node --test`). CSV opens in a spreadsheet. Commit: migration runner · auto-backup · export/import · settings page.

### 12.6 Do-not / forward-flags
No cloud sync, no encryption-at-rest yet (flag both — encryption matters once this leaves the laptop via Tailscale). No multi-device conflict resolution (single-user, single-writer — the local-first sync question stays parked, Stack Notes).

---

## After these ten — what the app is, and what's genuinely next

If all ten land, Life OS has: a validated entry engine with archetypes and a shared type registry; tags and Spaces; first-class people, places, and inter-entry links; boards with proper ordering; a photo pipeline with EXIF-driven auto-dating; a Library of shelves; a reusable Study Hub that's real for the August exams and every semester after; full-text search with a semantic seam reserved; and a migration/backup/export layer that keeps the data safe and portable. That is a genuinely complete *spine* — every domain in the Vision now has somewhere to live, and adding a new one is a registry edit plus maybe a lens, not a project.

The one deliberately-parked chapter, now standing on a foundation solid enough to deserve it, is **the AI capture layer** — the actual heart of the Vision ("effortless input *is* the product"). With the registry, `validateDetails`, links, and search all in place, the AI's job is now well-defined and small: turn natural language into registry-valid draft entries with tags/people/dates, show them as confirm-cards, and write them through the exact same validated endpoints a human uses. That's the next brief set. It was right to park it until the structure it writes into actually exists — which, after these ten, it will.

**Two things to decide with Xar before that next set:** which AI path to start with (Gemini free tier in-app vs an MCP server over the DB so Claude Pro becomes the capture surface at zero marginal cost — Stack Notes keeps both alive), and whether TypeScript adoption earns its keep now that the data model has stopped moving (it will have, by Brief 4 — this is close to the moment the Stack Notes named for "when it earns it"). Neither is assumed here; both are real forks worth a straight conversation.
