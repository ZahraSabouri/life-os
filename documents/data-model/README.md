# Life OS — `data-model/` (the usable data structures)

> **Note, 5 October 2026.** These files describe the July SQLite schema for the entries engine. The database is moving to PostgreSQL (Stage 1a in `../ROADMAP.md`): the type registry and the rooms still apply, the SQL will be rewritten. See `../Life_OS_Architecture.md`.

This folder turns the architecture into **artifacts a code assistant can build the database and the app from**. It is the bridge between the thinking docs (`../Life_OS_Taxonomy.md`, `../Life_OS_Architecture_And_Design_Direction.md`) and the running code in `../../code/life-os/`.

Everything here is a **proposal to merge deliberately**, not a script to run blind. The live database holds real data — permanent rule #5 (never lose data) governs everything below.

## What's in here

| File | What it is | How to use it |
|---|---|---|
| `entryTypes.proposed.js` | The **expanded entry-type registry** — a superset of the live `code/life-os/shared/entryTypes.js`. Same shape, more types, plus advisory `rooms`/`lenses`/`desc` metadata. | Review, then **merge new types into the canonical file**. Do not create a second live registry — Brief 4's whole point is one shared source imported by backend + frontend. |
| `rooms.js` | The **room + lens definitions** — the areas of life and the cross-cutting views. | Seed the `spaces` table (rooms are spaces with `is_room=1`) and render the hub's room-doors. |
| `schema.reference.sql` | The **target schema** as DDL — the data dictionary in SQL form, incl. the entity tables and the new links. | The shape to migrate toward, via numbered migrations, with a backup first. Not a drop-and-replace. |

## The model in one breath

One universal **`entries`** table (a `type` from the registry + a derived `archetype` + a JSON `details` validated against that type's fields). Around it sit **anchor entities** — **People, Places, Organisations** — each defined once and **tangled into everything** through join tables (`entry_people`, `entry_places`, `entry_organisations`) and entity-to-entity links (`person_links` for friendships/family, `person_organisations`, `entry_links` for the general graph). **Tags** and **Spaces/Rooms** slice the entries; **Collections** give boards/shelves; **Files** carry photos/documents; **FTS** makes it all searchable.

That's the "specific yet tangled" web: a person is a precise, first-class thing, and it threads through events, interactions, gifts, trips, memories, and other people.

## The rules that keep it clean

1. **Registry is the source of truth for types.** Type-specific fields live in `entries.details` (JSON), validated by `validateDetails`. Only promote something to a real column when you query/sort/join on it.
2. **Field types are limited to** `string | number | boolean | date | enum`. The validator supports no others. Adding a new field type means changing the validator too — avoid unless necessary.
3. **Archetype is derived server-side** from the registry. Never trust a client-sent archetype.
4. **Rooms are filters, not folders.** An entry can be in several rooms/lenses at once. Never give a room its own private store — that's the silo trap.
5. **Filters are a closed JSON vocabulary** (`types/archetypes/tags/rooms`), applied by a whitelisted query builder that only ever binds parameters. Never store or execute SQL text from a filter.
6. **Links have a documented direction.** Convention: child points to parent (`part-of`). Every lens that walks the graph depends on this being consistent.
7. **Migrate safely.** Numbered, once-only migrations; each in a transaction; a backup of `life-os.db` taken first. SQLite can't do `ADD COLUMN IF NOT EXISTS` — check `PRAGMA table_info` in the runner.

## How this maps onto the Brief 3–12 plan

This isn't a new plan — it's the **content** those briefs build. Concretely:
- **Brief 4** (registry/archetypes): replace its starter type list with the fuller set in `entryTypes.proposed.js` (still ~one file; the extra types are ~cheap lines). Add the `favorite` flag to entries here too.
- **Brief 5** (tags/spaces): seed `spaces` from `rooms.js`; add `is_room`/`slug`/`color` to the spaces shape.
- **Brief 6** (people/places/links): extend with **Organisations**, **`person_links`** (friendships), and **`person_organisations`** — the entity depth Xar asked for.
- **Brief 7** (collections), **8** (files), **11** (search): unchanged in shape; `schema.reference.sql` shows where they land.
- The **rooms** graduate from filtered lists (shared room-shell) to bespoke UIs one at a time — not all at once.

## Open decisions flagged in the code
- `person_links`: one symmetric row vs two directional rows (recommend: one row, symmetric in UI).
- Whether `place`/`person-link` entry *types* stay, now that Places/People are full entities (they're capture bridges — keep for the AI capture layer, resolve to real entities on confirm).
- Room granularity for **Body & Health** (one room vs splitting Training/Care/Medical/Nutrition later).
