# Life OS — Build Brief 2 (expanded): past the first page

> **History, not instructions (5 October 2026).** The current plan is `../ROADMAP.md`; the status of every July brief is in `../Life_OS_Plans_Inventory.md` §5.

**Rewritten 2026-07-06.** This replaces the earlier version of this file — that one was never actually acted on. What actually got built since Build Brief 1 is a bit different from what either brief expected, so this version is grounded in the real current code, which I read and partly re-ran before writing this.

---

## 0. Where things actually stand right now

I looked at `code/life-os/` directly rather than assuming a brief was followed. Here's the honest state:

**What exists and is good:** the Express + `node:sqlite` backend, the Divan intro and The Court capture screens from Build Brief 1 — plus more than that brief asked for. Whoever built this also went back to the design source and pulled out a **three-way theme system** ("Ground": `madder` = the maroon default, `indigo` = a dark navy palette, `paper` = a cream/light palette — all real palettes from the design export, wired into `tokens.css` via `.app-shell[data-ground='...']` and a `cycleGround()` control), and a **"Poem of the day"** section on The Court using a deterministic date-seeded pick (`lib/poems.js` → `poemForDate()`). Both are nice, faithful, unprompted extensions. Keep both — don't rip them out to match an older brief literally.

**What's still missing, i.e. what didn't happen:** the Calendar, People, and entry-type work from the previous version of this brief was never built — `backend/src/routes/entries.js` is still the Build-Brief-1 version (plain notes only, no dates, no `people` table wired up, no router in the frontend).

**A bug recurred:** `backend/src/db.js` still forces `PRAGMA journal_mode = WAL;`, which is the exact thing flagged and fixed in the previous version of this brief — it's back, unfixed, in whatever produced the current code. See §1 — fixing it for real this time includes a guard so it can't silently come back a third time.

**Answering the direct question — is there backend work left, or can we move past the first page?** Both, and they're not actually separable: nothing past The Court can be more than a second empty page without the backend changes in §2, because there's no way yet to store a dated task, an event, or a person. So this brief does the backend work and the next two real pages (Calendar, Today) together, in that order, as one build.

---

## 1. Fix first, properly this time: WAL mode

Same bug as before, same fix — delete the forced WAL pragma from `backend/src/db.js`, don't replace it with anything, rely on SQLite's default journal mode. See the reasoning in [[life_os_sqlite_wal_gotcha]] / the git history of this file if you want the full explanation; short version: WAL needs shared-memory file locking that breaks on some filesystems (including, plausibly, a OneDrive-synced Documents folder), a single-user app never needed WAL's concurrency benefit anyway, and default journal mode is the safe, portable, "just works everywhere" choice.

**This time, also add a comment directly above the line you remove**, explaining why, so a future rebuild doesn't silently re-add it:

```js
// Deliberately NOT using WAL journal mode: it needs shared-memory file
// locking that fails on some filesystems (confirmed: throws a SQLite disk
// I/O error when this project's folder is accessed through certain mounts,
// plausibly relevant if Documents is OneDrive-synced). This is a
// single-user app with at most two occasional writers — WAL's whole
// benefit (concurrent readers during a write) isn't needed here. Don't
// re-add WAL without confirming the deployment filesystem actually
// supports it.
```

Verify: backend starts with no error, a `POST`/`GET` round-trip on `/api/entries` still works. Commit this alone, first.

---

## 2. Backend — entries grow up, people arrive

### 2.1 `backend/src/routes/entries.js`

- `POST /`: accept `start_at`, `end_at`, `all_day`, `status` alongside the existing `type`, `title`, `details`. Validate `type` against `['note', 'task', 'event']` for now — reject anything else with 400.
- `GET /`: keep the existing `limit`-based recent list (The Court depends on it — don't break it). Add optional `from` / `end` ISO-date query params that filter by `start_at` falling in that range — this is what Calendar and Today will call.
- **New:** `PATCH /:id` — accepts `{ status }`, updates just that field plus `updated_at`, returns the updated row. This is what task-completion checkboxes will call. 404 if the id doesn't exist.

### 2.2 `backend/src/routes/people.js` (new file)

- `POST /` — body `{ name, birthday, notes }`. `birthday` stored as plain `TEXT`; don't overthink the format, ISO `YYYY-MM-DD` is fine, placeholder year is fine if the real birth year isn't known.
- `GET /` — list everyone.

Wire it in `server.js`: `app.use('/api/people', peopleRouter)`, inside the existing token-auth block.

---

## 3. Frontend — routing and a shared layout

Screen count is growing past what a boolean `useState` in `App.jsx` can reasonably hold. Introduce `react-router-dom`:

```powershell
cd code/life-os/frontend
npm install react-router-dom
```

**Keep the `ground` theme state exactly where it is conceptually (lifted, backed by `localStorage`)** but it now needs to reach multiple routed pages, not just two sibling components — wrap it in a small context instead of passing it down as props route-by-route:

`frontend/src/lib/groundContext.jsx` (new) — a `GroundProvider` holding `ground`/`cycleGround` (the same logic currently inline in `App.jsx`), exposed via a `useGround()` hook.

**Two layout shapes**, matching what the design source actually does:
- The Divan intro (`/`) is full-bleed with no shared chrome — just the corner stamp, exactly as now.
- Everything else (Court, Calendar, Today, and eventually Study Hub) shares the same topbar pattern already visible in both `TheCourt.jsx` and the design source's Study Hub screen: wordmark, live date, a nav row, and — on any page that isn't Court — a "← Court" back-link (the design source uses exactly this on its Study Hub screen).

Build `frontend/src/components/CourtLayout.jsx`: renders that shared topbar plus `<Outlet />` for the page content. Nav row: **Today · Calendar · Study hub (still inert) · Ground: {ground} · Divan**, plus "← Court" instead of a redundant "Court" pill when the current route isn't `/court`.

Routes in `App.jsx` (or a new `AppRoutes.jsx` if that's cleaner):
- `/` → Divan intro (unchanged behavior — skip-intro preference, Enter navigates to `/court`)
- `/court` → `CourtLayout` wrapping `TheCourt` (drop `TheCourt`'s own hand-rolled nav bar now that `CourtLayout` provides it — don't have two nav bars)
- `/calendar` → `CourtLayout` wrapping the new `CalendarView`
- `/today` → `CourtLayout` wrapping the new `TodayView`

Leave **Study hub** and the **Poem** shortcut exactly as inert/local as they are now. "Ground" is now real (already built) — no question mark there anymore, that one's resolved.

**Small DRY note:** both The Court's "Recently filed" and the new Today view need to fetch/display recent entries. Pull the fetch logic (the `apiFetch` helper and the entries-fetching `useState`/`useEffect` pair currently inline in `TheCourt.jsx`) into a small shared hook, e.g. `frontend/src/lib/useEntries.js`, and use it from both places instead of copy-pasting.

---

## 4. Frontend — Calendar

New `frontend/src/components/CalendarView.jsx`. Scope: **one month grid, nothing more** (no week/agenda view yet).

- 7-column month grid, current month on load, prev/next controls.
- `GET /api/entries?from=<first-of-month>&end=<last-of-month>`, place `task`/`event` entries on their `start_at` day as small chips. Multiple per day just stack.
- A "+ Add" control opening a small inline form: title, date, all-day checkbox, type (task/event). Posts, then refetches the visible month.
- An "Upcoming birthdays" panel: `GET /api/people`, show whoever's birthday (month+day only, ignoring year) falls in the next 30 days, soonest first. Write the "days until next birthday" logic as a small pure function in `frontend/src/utils/birthdays.js` — you'll want this exact calculation again later, keep it out of the component.
- A small "+ Add person" form near the birthdays panel (name, birthday, optional notes) — no separate People page yet.
- Use the existing tokens/ground system — it's fine for Calendar to look plainer than Divan/Court, it doesn't need the same ornamental density, but it must still respond to all three ground themes correctly (test by cycling Ground while on this page).

---

## 5. Frontend — Today

New `frontend/src/components/TodayView.jsx`. This is the Blueprint's "mission control" — deliberately small.

- Fetch entries where `start_at` is today (`GET /api/entries?from=<today-00:00>&end=<today-23:59>`).
- For `task`-type entries, render a checkbox reflecting `status` (`open`/`done`); toggling calls `PATCH /api/entries/:id` with the flipped status and updates the list optimistically (or just refetch — either is fine at this size).
- For `event`-type entries, render them plainly (no checkbox — events aren't "completed").
- Below that, reuse the shared entries hook from §3 to show the same "Recently filed" list that's on The Court — Today is meant to be a daily landing point, recent activity belongs here too.

---

## 6. Validation

1. Backend starts with no PRAGMA error.
2. `POST /api/entries` with `type: 'event'` + `start_at` works; shows up via the `from`/`end` filtered `GET`.
3. `PATCH /api/entries/:id` with `{ status: 'done' }` updates and returns the row; 404 on a bogus id.
4. `POST` / `GET /api/people` round-trips.
5. `npm run build` in `frontend/` succeeds.
6. Manual smoke test end to end: intro → Court → Calendar (add an event, see it land on the right day, refresh, still there) → add a person with a birthday inside 30 days, see it in the birthdays panel → Today (see today's task/event, tick a task done, refresh, still done) → cycle Ground on every page and confirm it stays consistent while navigating.
7. Commit in checkpoints: WAL fix, backend routes, routing/layout scaffold, Calendar, Today. Five small commits, not one.

Report back honestly, the way this brief did for you: what you built, what deviated and why, anything that broke.

---

## 7. Do-not list

- Still no AI capture layer.
- No Boards, Gallery, Library, Map, Ask, or a full People lens — Calendar + inline birthdays, Today, that's it.
- No wiring "Study hub" nav to real behavior yet (see §8 — it's coming, deliberately not in this brief).
- No week/agenda calendar view.
- No TypeScript.
- No file/photo uploads.
- No changes to `code/life-os-app/`.

---

## 8. What's next after this, flagged early on purpose: Study Hub is a real decision point

The design export (`Intro and main page design.zip`) includes a fourth screen beyond the three covered so far: **"Study Hub"** — "Summer Rescue Campaign 2026 / The study cockpit," reachable via a "← Court" back-link, styled in the same language as Divan/Court. It isn't a generic placeholder — it's a redesign of the actual MSc exam tracker (CMT307, Time Series, MAT700 — the same three modules from the retired `code/life-os-app` fork) into the new visual language.

That makes it different from the other lenses in one important way: it's tied to a real, time-sensitive need (exams run to roughly end of August 2026), and it isn't a small build — porting it means bringing across module/campaign data, evidence tracking, and progress views, not just a new screen against the existing entries API.

**This is worth a real decision, not an assumption, before the next brief gets written:** does Study Hub jump the queue ahead of further general-purpose lenses (Boards for the job pipeline, Library for books, etc.) because the exam deadline makes it more urgent right now, or does it stay a later, dedicated undertaking on its own? Worth a straight answer before I write the next one.
