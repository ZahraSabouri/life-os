# Life OS — Data Dictionary

**A living reference · written 2026-07-06 · mirrors `data-model/`**

The authoritative, human-readable description of every table, column, entity, and entry type. The machine version lives in `data-model/` (`entryTypes.proposed.js`, `rooms.js`, `schema.reference.sql`); this document explains and indexes it. When they disagree, the code is truth and this doc is stale — fix it.

The whole model rests on two ideas: **one universal `entries` record** for everything you capture, and a small set of **first-class anchor entities** (People, Places, Organisations) that are defined once and referenced everywhere. Everything else — tags, rooms, collections, files, search — is machinery around those two.

---

## 1. Core: `entries`

Every captured thing is one row here. Its `type` names a registry key; its `archetype` (derived from the registry) decides how lenses treat it; its type-specific data lives in `details` as validated JSON.

| Column | Type | Meaning |
|---|---|---|
| `id` | TEXT PK | uuid |
| `type` | TEXT | registry key (see §7). Defaults `note`. |
| `archetype` | TEXT | `moment` \| `commitment` \| `workstream` \| `collection` \| `practice` \| `anchor`. Derived server-side from the registry — never client-set. |
| `title` | TEXT | display title |
| `status` | TEXT | entry-level lifecycle for commitments: `open` \| `done` \| `archived` |
| `start_at` | TEXT | ISO. **Presence puts the entry on the Calendar.** |
| `end_at` | TEXT | ISO end/span |
| `all_day` | INTEGER | 0/1 |
| `favorite` | INTEGER | **NEW.** 0/1 star → the Favorites lens |
| `details` | TEXT | JSON, validated against the type's registry `fields` |
| `created_at` / `updated_at` | TEXT | ISO timestamps |

Indexes: `type`, `archetype`, `start_at`, `favorite`.

**Rule:** type-specific attributes live in `details`, not as columns. Promote to a column only when you must query/sort/join on it.

---

## 2. Archetypes (behaviour, not storage)

The six shapes above domain types. They decide which lens a thing appears in, so a new type inherits behaviour for free.

| Archetype | Means | Appears in |
|---|---|---|
| `moment` | happened/will happen at a point in time; "done" by occurring | Calendar (if dated), Today (if today) |
| `commitment` | you must act on it; open→done lifecycle | Today (while open), Calendar (if dated) |
| `workstream` | ongoing effort with progress/sub-parts | Boards; its dated children hit Calendar/Today |
| `collection` | a shelf/set of like things | Library/room shelves |
| `practice` | a recurring habit tracked over time | Today (cadence), streak views |
| `anchor` | a stable entity others hang off | is/【links to】People, Places, Organisations |

---

## 3. Anchor entities — *defined once, tangled into everything*

This is the "deep entity" layer. An entity is a precise, first-class thing; join tables thread it through the whole app.

### `people`
| Column | Type | Meaning |
|---|---|---|
| `id` | TEXT PK | |
| `name` | TEXT NOT NULL | |
| `birthday` | TEXT | optional ISO (drives birthday reminders) |
| `relationship` | TEXT | headline label: friend/family/colleague/partner |
| `avatar_file_id` | TEXT → files | optional portrait |
| `notes` | TEXT | |

### `places`
`id`, `name`, `place_kind` (home/uni/cafe/venue/landmark…), `lat`, `lng`, `notes`. Powers the Map lens.

### `organisations` *(NEW)*
`id`, `name`, `kind` (company/university/venue/clinic/publisher…), `url`, `place_id` → places, `notes`. Job/academic applications, performances, appointments and medical records point at an org defined once and reused.

---

## 4. The relationship web (join & link tables)

The reason the entities feel "specific yet tangled." Every join is `ON DELETE CASCADE` so deleting an entry never orphans a link.

| Table | Connects | Carries | Answers |
|---|---|---|---|
| `entry_people` | entry ↔ person | `role` (attendee/recipient/subject…) | "who was on that trip", "whose gift is this" |
| `person_links` | person ↔ person | `relation` (friend/family/partner…), `since` | **friendships & family — the person-to-person web** |
| `person_organisations` | person ↔ org | `role` (works-at/studies-at…) | "Sara works at X", "my supervisor at Cardiff" |
| `entry_places` | entry ↔ place | — | "photos from Barry Island", "appointments at the clinic" |
| `entry_organisations` | entry ↔ org | `role` (employer/host/venue/provider) | "applications to DeepMind", "shows at the Millennium Centre" |
| `entry_links` | entry ↔ entry | `relation`, directional | "what packs into this trip", "what is this task part of" |

**Link direction convention:** the child points to the parent — a photo `part-of` a trip; a task `part-of` a workstream. Keep it consistent everywhere.

**`entry_links` relation vocabulary (closed set, extend deliberately):** `part-of`, `about`, `prepares-for`, `follows-up`, `references`, `inspired-by`.

---

## 5. Slicing: tags, spaces, rooms

- **`tags`** (`id`, `name` unique, `color`) + **`entry_tags`** join. Free-form cross-cutting labels; colour derived from the name if unset.
- **`spaces`** = saved filters. A **room** is a space with `is_room=1`, a `slug` (from `rooms.js`), an accent `color`, an `icon`, and a `filter`. `position` orders them.
- **`filter`** JSON is a **closed vocabulary**: `{ types:[], archetypes:[], tags:[], rooms:[] }` — AND across keys, OR within a key. Applied by a whitelisted query builder that only binds parameters. **Never** store or run SQL text.

Rooms ↔ types are listed in `rooms.js` and §7's `Rooms` column.

---

## 6. Collections, files, search

- **`collections`** (`kind`: board/shelf/list/campaign; `columns` JSON; `config` JSON) + **`collection_entries`** (`column`, `position` as a **string fractional index** so a move is one write). Powers boards (job pipeline, study phases) and manual shelves.
- **`files`** (`path` relative & date-sharded, `thumb_path`, `mime_type`, `size`, `width`, `height`, `taken_at`). `entry_id` nullable so a file can be a person's avatar. **EXIF `taken_at` seeds the parent entry's `start_at`** — a photo becomes a dated memory automatically.
- **`entries_fts`** — FTS5 virtual table over title/body/tags/people, tokenizer `unicode61 remove_diacritics 2` so **mixed English + Persian/Urdu** search works. Kept in sync by triggers.

---

## 7. The entry-type registry (the domain vocabulary)

49 types today — and adding one is a one-line registry edit, so this list is **illustrative and living**, not fixed. Grouped by room. `A` = archetype (m=moment, c=commitment, w=workstream, k=collection, p=practice, a=anchor). Fields are the keys inside `details`; only `string|number|boolean|date|enum` exist.

**Universal (no single room):** `note` (m: body) · `task` (c: priority) · `event` (m: location) · `message` (c: channel, direction, contact) · `voice-note` (m: transcript)

**Study Hub:** `module` (w: code, title, exam_date) · `module-session` (m: module_code, topic, planned_min, done_min) · `assignment` (c: module_code, title, weight)

**Academia & Research:** `research-project` (w: field, status) · `paper` (k: authors, venue, year, status, url, doi) · `academic-application` (w: kind, institution, deadline, status)

**Career & Professional:** `job-application` (w: company, role, status, url, deadline, next_action) · `cv` (k: label, target)

**Growth & Learning:** `skill` (w: area, level, status) · `practice-session` (m: focus, minutes) · `course` (k: provider, url, status)

**Body & Health:** `workout` (m: kind, duration_min) · `workout-plan` (w: goal, days_per_week) · `routine` (p: kind[skincare/supplement/sleep/…], cadence, time_of_day) · `supplement` (p: name, dose, cadence) · `meal` (m: name, kind[recipe/planned/logged], calories) · `appointment` (c: kind, provider) · `medical-record` (k: kind, provider) · `measurement` (m: metric, value, unit)

**Relationships:** `interaction` (m: kind, summary) · `gift-idea` (k: occasion, url, status) · `important-date` (m: kind, recurs)

**Culture & Art:** `book` (k: author, status, rating, started_at, finished_at) · `movie` (k: director, status, rating, watched_at) · `show` (k: creator, status, rating) · `performance` (m: kind[theatre/concert/opera/…], venue, status) · `exhibition` (m: venue, status)

**Travel:** `trip` (w: destination, start, end, status) · `destination` (k: country, kind, reason)

**Memories:** `memory` (m: caption, taken_at) · `journal` (m: mood, body)

**Home & Living:** `shopping-item` (c: item, quantity, category, status) · `errand` (c: what) · `home-item` (k: item, room, url, price, status) · `house-listing` (w: address, url, price, bedrooms, status) · `home-project` (w: title, status)

**Mind & Making:** `idea` (k: area, body) · `material` (k: url, source, note, status) · `writing` (w: kind, status, url) · `snippet` (k: language, code, source_url) · `document` (k: kind, note)

**Style / Closet (later):** `clothing-item` (k: category, colour, season)

**Anchor capture bridges:** `place` (a: name*, notes) · `person-link` (a: name*, context) — thin capture types that resolve to the real Places/People entities on confirm.

*required field.

---

## 8. Cross-cutting lenses (spine, not rooms)

`today` · `calendar` · `capture` · `search/ask` (spine) · `favorites` · `inbox` · `map` · `gallery` · `people` (lenses). They aggregate across every room, so they belong to no domain. Defined in `rooms.js`.

---

## 9. Change log
- **2026-07-06** — first dictionary. Expanded registry to 49 types across 12 rooms; added `entries.favorite`; added Organisations entity, `person_links` (friendships), `person_organisations`. Aligns with Briefs 4–12; folds Xar's "deep entity" direction into the anchor layer.
