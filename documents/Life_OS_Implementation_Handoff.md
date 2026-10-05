# Life OS — Implementation Hand-off

> **Superseded as the build plan on 5 October 2026** by `ROADMAP.md`. Sessions 1–3 were built; what's left of sessions 4–7 and Briefs 7–12 is tracked in `Life_OS_Plans_Inventory.md` §5. These specs were written for SQLite; with PostgreSQL the ideas stand but the implementation details change. Kept as history.

**For Xar to hand to the local coder/implementer AI, one session at a time.**
Written 2026-07-06. Part A explains every document in one line. Part B is the rules the coder always follows. Part C is the work cut into session-sized pieces — give **one piece per session**, verify it runs, then give the next.

---

## Part A — What each document is (one line each)

**Direction & thinking (you read/edit these):**
- `Life_OS_Vision.md` — why the app exists and what it's for. The soul.
- `Life_OS_Blueprint.md` — early research + the first full proposal. Reference.
- `Life_OS_Architecture_And_Design_Direction.md` — the chosen shape: one shared engine + rich "rooms", hub-and-rooms navigation, and the design language.
- `Life_OS_Taxonomy.md` — the "house of the mind": how every life area is classified into rooms / entry-types / entities / lenses / tags, and how they link.

**Specs (the coder reads these):**
- `Life_OS_Data_Dictionary.md` — human-readable description of every table, entity, and entry type.
- `data-model/entryTypes.proposed.js` — the expanded entry-type registry, as code (superset of the live one).
- `data-model/rooms.js` — the room + lens definitions, as code.
- `data-model/schema.reference.sql` — the target database shape, as DDL.
- `data-model/README.md` — how to apply the data model safely (single source of truth, migrate-with-backup).

**Build briefs (the coder executes these):**
- `Life_OS_UI_Polish_Brief.md` — a ready frontend polish pass (theme/calendar/typography fixes).
- `Life_OS_AI_Build_Brief_3.md` — the Briefs 3–12 build sequence (engine → tags/spaces → people/links → boards → files → library → study → search → data-integrity).
- `Life_OS_AI_Build_Brief.md` / `_2.md` — earlier briefs, largely done; history.

**Note for the coder:** where the pieces below overlap Briefs 4–6 in `Brief_3.md`, **these pieces supersede them** — they carry the fuller taxonomy (49 types, 12 rooms, the Organisations/friendship entities). Briefs 7–12 continue as written and will consume the richer registry.

---

## Part B — Rules the coder follows every session
1. **Run first.** Start backend + frontend, confirm the previous session's work is actually there and working, before adding anything. Report what you find.
2. **Back up before schema/data changes.** Copy `backend/data/life-os.db` to a timestamped file outside the repo first. (Permanent rule: never lose data.)
3. **One canonical source.** The entry-type registry lives in `code/life-os/shared/entryTypes.js` only. Merge proposals into it; never create a second copy.
4. **Small commits, honest report.** Commit in the checkpoints each piece names. At the end, report what you built, what deviated and why, what broke.
5. **Validate before hand-back.** `npm run build` (frontend) clean; any new backend logic covered by a quick `node --test`.

---

## Part C — The sessions

### Session 1 — UI polish: make the app feel like one thing
**Read:** `Life_OS_UI_Polish_Brief.md` (self-contained).
**Do:** everything in it — kill the fixed-blue calendar (remove the `board-screen` palette override so every screen obeys Ground), keep the shared nav on all screens, render Persian+English dates integrated in each calendar cell, calm "today", fix overlaps, calm the capture hero, poem plumbing.
**Done when:** cycling Ground (madder→indigo→paper) re-themes the whole app incl. calendar; nav present everywhere; dual dates render; no overlaps at 1280px and 380px.
*Frontend only, no schema. If it feels large, do the brief's §1–2 (unification) as one commit and §3–7 as the next.*

### Session 2 — Expand the entry-type registry + Favorites
**Read:** `data-model/README.md`, `data-model/entryTypes.proposed.js`, Data Dictionary §7.
**Do:** merge the new entry types into `shared/entryTypes.js` (keep the field-type limits: string|number|boolean|date|enum; keep `validateDetails`). Add the advisory `rooms`/`desc` metadata and the `typesByRoom` helper. Add a `favorite INTEGER DEFAULT 0` column + index to `entries` (migration, backup first). In the capture type-picker, group types by their `rooms` so the list stays readable.
**Done when:** you can capture any of the new types and they validate; a bad enum 400s; an entry can be starred and read back as favourite.
**Commit:** registry merge · favorite migration · capture picker grouping.

### Session 3 — Rooms as Spaces (backend + filter engine)
**Read:** `data-model/rooms.js`, `data-model/schema.reference.sql` (spaces), Data Dictionary §5.
**Do:** add the `spaces` table (`is_room`, `slug`, `color`, `icon`, `filter`, `position`). Seed the 12 rooms from `rooms.js` (idempotent seed; editable/deletable). Build `buildEntriesQuery(filter)` in `backend/src/query.js` — a whitelist over `{types, archetypes, tags, rooms}` that only ever binds parameters (never string-concatenates). Extend `GET /api/entries` to accept a `space`/`room` slug or an inline filter.
**Done when:** `GET /api/entries?room=body` returns exactly the Body-room types; a `node --test` proves the filter and that there's no SQL-injection surface.
**Commit:** spaces table + seed · query builder + tests · entries filter endpoint.

### Session 4 — The Hub + a reusable Room shell (frontend)
**Read:** Architecture doc §2 & §6, `data-model/rooms.js`.
**Do:** rebuild the Court as the **hub** — a calm lobby with the capture box, a "today at a glance", and **room-doors** rendered from `ROOMS` (each with its accent + a live count/line). Build one reusable **RoomShell** (shared chrome: back-to-hub, room title + domain accent, room-level capture) and a **generic RoomView** that shows a room's filtered entries via the Session-3 API. Add a **Favorites** lens (filter `favorite=1`) as a simple view. Wire domain accents as CSS tokens layered over Ground (a room tints via accent, never overrides the background).
**Done when:** hub shows 12 doors; clicking one opens that room's filtered list in the shell; Favorites works; all three Grounds respected.
**Commit:** hub/room-doors · RoomShell + RoomView · Favorites lens · accent tokens.

### Session 5 — Tags with colour + chips
**Read:** `Brief_3.md` Brief 5 (§5.1, §5.4), Data Dictionary §5.
**Do:** `tags` gets a `color`; `routes/tags.js` (list with usage count, create with derived colour, friendly 409 on dupes). Extend `POST`/`PATCH /api/entries` to accept `tags: [names]` and sync `entry_tags` in a transaction. Return each entry's tags. In the UI, show small colour chips on entries and let capture add tags with autocomplete.
**Done when:** posting an entry with `['a','a','b']` yields two tags + correct joins; removing a tag on PATCH removes only that join.
**Commit:** tags API + migration · entry tag-sync · chips + autocomplete.

### Session 6 — Entities & the link web (backend)
**Read:** `data-model/schema.reference.sql` (entities + joins), Data Dictionary §3–4, `Brief_3.md` Brief 6.
**Do:** loosen `people` (birthday optional; add `relationship`, `avatar_file_id`). Add **`organisations`** (+ `routes/organisations.js`). Add the join/link tables: `person_links` (friendships/family), `person_organisations`, `entry_organisations`, plus the existing `entry_people`/`entry_places`. Build the uniform linking sub-resource API under entries (`POST/DELETE /api/entries/:id/people|places|organisations|links`). Add `GET /api/entries/:id` returning the entry **hydrated** (tags, people, places, orgs, links — both directions). Document the link direction convention (child→parent `part-of`).
**Done when:** you can link a person/place/org/entry and re-fetch to see it; unlinking removes only the join; deleting an entry cascades its joins. `node --test` on the hydration query.
**Commit:** people loosen + orgs · person_links/person_orgs · linking sub-resources · entry-detail hydration.
*Densest session — if needed, split: Organisations + people first, then the links + hydration.*

### Session 7 — Entities & links (UI)
**Read:** Architecture doc §4 (relationships), Taxonomy §4.
**Do:** an entry-detail view (modal or `/entry/:id`) to add/see people, place, org, and links (search-pickers with inline "create"). A person detail page showing that person's **whole thread** (their interactions, gifts, memories, trips, linked people & orgs). A simple **People** lens (the entity directory). Birthdays on the calendar click through to the person.
**Done when:** opening a person shows everything connected to them; adding a friendship link between two people persists and shows on both.
**Commit:** entry-detail linking UI · person page · People lens.

### Session 8+ — Continue the engine
**Read & execute** `Life_OS_AI_Build_Brief_3.md`, **Briefs 7 → 12** in order (boards/pipelines · files & photos · Library rooms · Study Hub re-home · search · migrations/backup/export). They now build on the expanded registry and entities from Sessions 2–7. Keep giving one brief per session, run-first, backup-first.

---

**Suggested order of value:** Session 1 (feels unified) → 2 → 3 → 4 (you can now see rooms) → 5 → 6 → 7 (entities come alive) → then Briefs 7–12. Reorder freely if your priorities shift — the engine makes each next room cheap.
