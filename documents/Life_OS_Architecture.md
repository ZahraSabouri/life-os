# Life OS — Architecture

**Written 5 October 2026 with Xar. Current thinking, not a contract.**

Decided in conversation on 5 October: **PostgreSQL from day one** (Xar's call), **one server program divided into a shared core plus modules**, **imports as the universal way in**, and **data protection built into the data layer**. This replaces the data-layer parts of the July documents: the "Database" paragraph in `Life_OS_Stack_Notes.md`, and the "model everything as entries if possible" rule in `Life_OS_Architecture_And_Design_Direction.md` §4 and Brief 3 §10.1. Their overall direction still stands: one app, rich rooms, a shared spine, nothing walled off.

Related: `ROADMAP.md` (the order), `DECISIONS.md` (the reasons), `Life_OS_Plans_Inventory.md` (everything planned).

---

## 1. The shape

```
   Laptop browser · iPhone (PWA later, through Tailscale)
                          │
        Life OS server — Node + Express, one program
  ┌───────────────────────┴────────────────────────────────┐
  │ CORE     entries · people · places · organisations ·   │
  │          links · tags · files · history · imports ·    │
  │          jobs · settings · spaces                      │
  │          services: calendar · Today · search · backup  │
  │                                                        │
  │ MODULES  study · career · money · home · events        │
  │          (later: any room that outgrows entries)       │
  └───────────┬──────────────────────────┬─────────────────┘
              │                          │
         PostgreSQL           data folder: files/ · inbox/ ·
   (schemas per area)                    backups/ · exports/
```

Everything runs as one program on one machine. Modules are folders in the same codebase, not separate servers. The usual name for this is a **modular monolith**: one program, cleanly divided inside.

## 2. Why this shape

- **One data home, one backup, one version of the truth.** Cross-area features (calendar, Today, search, links) become queries, not integrations to build and maintain.
- **Each area can still be as rich as a standalone app.** It owns its tables, routes and screens.
- **Simple to run on a laptop**, close to £0, and learnable while pairing.
- **It grows without rewrites.** A new module is added without touching the others; an outside tool connects through the import door or the API; anything that one day genuinely needs to run elsewhere (a heavy scraper, an AI worker) talks to the same API.

What we deliberately don't use, and what would change that:

| Tool | What it's for | Why not now | What would change it |
|---|---|---|---|
| Redis | shared cache, sessions and queues across many servers | one server; PostgreSQL answers in milliseconds; the server's memory is the cache | several server processes that need shared sessions or a hot cache |
| RabbitMQ or any message broker | messages between separate services | one program; background work lives in a PostgreSQL jobs table; outside agents use the inbox folder | separate services on separate machines that must talk asynchronously |
| MongoDB | flexible documents | PostgreSQL `jsonb` gives the same flexibility plus relations and transactions; two databases would mean two backups and two truths | nothing foreseen |
| Microservices | many teams deploying independently | one person; five disconnected stores is exactly what we're leaving behind | nothing foreseen for a personal app |
| A second database engine | special workloads | PostgreSQL covers full-text search (plus `pg_trgm`) and vectors (`pgvector`) | a workload PostgreSQL demonstrably can't serve |

**Rule:** no new infrastructure until one of these triggers actually happens. When one does, record it in `DECISIONS.md` first.

## 3. Database: PostgreSQL

**Setup (Stage 1a).** A native Windows service from the official installer, current stable major version, listening on localhost only. Databases `lifeos` and `lifeos_test`. Two roles: an owner that runs migrations, and an app role the server uses day to day (reads and writes data, can't change the schema). The data directory stays in PostgreSQL's default location, outside the project folder and outside any cloud-synced folder. Nothing but the PostgreSQL service touches the data directory.

**Schemas per area.** Each module gets its own PostgreSQL schema: `core`, `study`, `career`, `money`, `home`, `events`. A module owns its schema and reaches other areas only through the core (§4).

**Conventions** (for every table unless there's a written reason):
- Names in `snake_case`; table names plural.
- **IDs:** UUIDs (time-ordered `uuidv7()` if the installed version has it, otherwise `gen_random_uuid()`). Imported rows also keep their source's ID.
- **Time:** `timestamptz` stored in UTC and shown in Europe/London; all-day things use `date`. Persian (Solar Hijri) dates are a display layer.
- **Money:** `bigint` whole pence plus a currency code (default `GBP`). Never floating-point pounds.
- **Flexible detail:** `jsonb`, validated in code against the type registry. A field becomes a real column once it's queried or relied on.
- **Small fixed lists** (status, kind): `text` with a `CHECK` constraint rather than PostgreSQL enum types, so they're easy to change.
- **User content** carries `created_at`, `updated_at`, `revision` (an integer that goes up by one per change) and `deleted_at` (soft delete).
- **Imported content** also carries `source`, `source_id`, `import_batch_id` and field ownership (§6).
- Foreign keys always; cascading deletes only where a child can't exist without its parent (link rows, receipt lines).

**Migrations.** Numbered SQL files per schema (for example `core/0001_entries.sql`), applied in order by a small runner that records what has run, takes a `pg_dump` first, and stops at the first error. A migration that has run is never edited; a new one is added instead.

**Libraries (chosen in Stage 1a; prefer well-documented options with lots of examples):** `pg` (node-postgres) for the connection; plain SQL in each module's data layer, with a query builder only if it earns its place; for jobs, either a library built on PostgreSQL (`pg-boss` or `graphile-worker`) or a small jobs table of our own.

## 4. Core and modules

**The core** holds what every area shares:
- `entries` with the type registry (`shared/entryTypes.js`: 49 types, six archetypes) for the long tail of life: books, films, workouts, memories, ideas, appointments, trips and so on.
- The anchor entities `people`, `places`, `organisations`; `links` (anything to anything, with a typed relation and a direction, such as `part-of`, `prepares-for`, `about`); `tags`.
- `files` (metadata for everything on disk), `history` (before and after of every change), `import_batches`, `jobs`, `settings`, `spaces` (rooms as saved filters).
- The calendar, Today, search and backup **services**, which ask each module for its part.

**A module** (study, career, money, home, events, and later any room that outgrows entries) provides:
1. Its schema and migrations.
2. Its API routes under `/api/<module>/…`, always through its data layer.
3. A **calendar provider**: its dated items in the shared shape (§5).
4. A **Today provider**: what needs attention (overdue, due soon, follow-ups, renewals, low stock).
5. A **search provider**: a title, text and link for each searchable thing.
6. **Import formats**: one JSON Schema per format (plus a CSV column mapping) and a handler that matches, previews and applies (§6).
7. **Links** to core entities (a job to an organisation, an assessment to a module, a recipe to items), in the core `links` table or in its own join tables for heavy relations.
8. Its screens in the frontend, inside the shared room shell.

Modules never write to each other's tables. Anything cross-area goes through the core.

**Entry or its own tables?** A new kind of thing starts as an entry type: one line in the registry, its details in `jsonb`. It graduates to module tables when it needs line items, its own history, many-to-many relations or heavy querying. Study, Career, Money, Home and Events start as modules because their data already has that structure (receipts → lines → items → stock; semesters → modules → assessments; jobs with full adverts and provenance). Everything else starts as entries. When a module goes native, its old entry types (`module`, `assignment`, `job-application`, `shopping-item` and similar) are either retired or kept as quick-capture shortcuts that create module records; decide per module.

## 5. Calendar and Today

- The calendar asks every provider for a date range and merges the answers. Nothing is copied into a calendar table, so nothing can drift. Plain events (birthdays, appointments, trips) are entries and come from the core's own provider.
- **The shared item shape:** `id`, `area`, `kind`, `title`, `start` and `end` (or `all_day` with dates), optional `recurrence`, optional `location`, `href` back into the module.
- **Kinds** look different: **fixed** (lectures, exams), **plan** (study blocks, shopping trips), **deadline**, **reminder**. **Areas** are colour layers that switch on and off.
- **Recurrence** uses iCalendar rules (RRULE plus exceptions), so a timetable imported from `.ics` keeps its weekly pattern, reading weeks and cancellations.
- **Later, out:** a calendar feed (`.ics`) a phone calendar can subscribe to, once remote access exists.
- **Transition:** until a module is native, a temporary read-only adapter reads the attached app through its own API and acts as its provider.

## 6. Getting things in: imports, connectors and AI

There are three ways in for every area: **by hand** (always available), **by import**, and later **by built-in AI**. Everything that isn't typed by hand goes through one pipeline:

1. **Receive.** A file in `inbox/<area>/` (works even when the app is off, and agents need no network access), an upload in the app, or `POST /api/import` with the token.
2. **Validate** against the format's JSON Schema. A file that fails moves to `failed/` with a readable `.error.txt` beside it, and nothing is imported from it.
3. **Match** each record to what already exists, first by source ID, then by the format's de-duplication rule.
4. **Preview** what would change (new, changed, unchanged, conflicts) before anything is written. A trusted scheduled source may apply automatically, but is still logged.
5. **Apply** in one transaction, recording history.
6. **Log** the batch (source, time, counts). A whole batch can be undone.

**Field ownership.** Imported records separate the source's fields (an advert's salary, an event's time) from Xar's fields (status, notes, priority, choices). Imports update the source's fields and never touch Xar's. This is JobMap's rule, made universal.

**Instructions for your own AI.** Each format's JSON Schema also generates a downloadable instruction sheet: what to collect, the exact columns or fields, an example, and the rules. Because validation, instructions and documentation all come from one definition, they can't drift apart. Formats: CSV for flat lists, JSON for nested data, `.ics` for calendars, Excel (`.xlsx`) later.

**Connectors** are sources that run on a schedule as jobs: Cardiff SU events, specific Eventbrite organisers and venues, job boards, a timetable's `.ics` link. Each one produces the same import format and shows its status, last run and errors. Outside agents (Codex or Claude scheduled tasks) keep using the inbox folder.

**Built-in AI (later)** turns what Xar says, photographs (a receipt) or uploads (a module handbook) into the same import formats, shown as cards to confirm. Nothing is saved without confirmation. The candidate paths stay as in the Stack Notes: a free-tier model in the app, or an MCP server so Claude works through the same API and rules.

## 7. Background jobs

A `jobs` table in PostgreSQL, claimed with `FOR UPDATE SKIP LOCKED` and worked by the server itself: inbox scanning, connectors, import processing, thumbnails, backups, later AI calls. Jobs are visible (status, attempts, last error) and retried with growing gaps between attempts. Scheduled jobs catch up when the laptop wakes from sleep.

## 8. Search

PostgreSQL full-text search over what the providers return: an English configuration for English text, the `simple` configuration for Persian (PostgreSQL has no Persian stemmer), and `pg_trgm` for partial and fuzzy matches. Semantic search later with `pgvector` in the same database.

## 9. Files and the data folder

Files live on disk under the data folder (`files/<area>/…`); the database keeps their details (original name, path, size, type, SHA-256 hash, links to records). The hash gives integrity checks and de-duplication. Large existing media (study assets about 134 MB, Budget artwork about 540 MB) move in with their modules.

**The data folder** is one folder, outside the code and outside any cloud-synced folder (exact location chosen in Stage 1a), holding `files/`, `inbox/`, `backups/` and `exports/`. It's set by one setting, so a fresh start needs nothing more than an empty data folder and an empty database.

## 10. Protecting the data, including from AI agents

Built in from Stage 1, because it's cheap now and painful to add later:

- **One door.** Only the Life OS server writes to the database. Agents and scripts go through the API, the inbox, or a reviewed migration. Nobody edits data files by hand, regenerates them or replaces them wholesale.
- **Revisions.** Every record has a revision; a save based on an older revision is refused (409). Budget and JobMap already work this way.
- **History.** Every change through the data layer records before and after, so nothing an agent overwrites is lost for good. History also powers undo.
- **Soft delete.** Deleting hides a record (`deleted_at`); permanently removing it is a separate, deliberate step.
- **Field ownership** for imports (§6).
- **Backups.** A `pg_dump` (custom format) before every migration, import batch and module move, plus daily rolling copies (proposal: keep 14 daily and 8 weekly), together with the files folder. A second copy off the laptop (external drive or cloud) is part of the routine. Restoring into `lifeos_test` is practised, not assumed.
- **Counts at each move.** When an attached app's data moves into its native module: record counts before and after, spot-check a few records, and keep the source untouched until Xar accepts. Full hash manifests and automated verification reports are left for the late stages.
- **Git.** Commit before every agent session, keep each session's work in its own commits, and never overwrite uncommitted work.

**SQLite lessons, kept.** The July disk I/O error with WAL most likely came through the shared-folder link that Cowork agents use, where WAL's shared-memory file doesn't work. WAL also means that copying only the `.db` file can miss recent saves. Any SQLite file that remains (the core's old database until it moves, Summer Rescue's mirror) is read through SQLite itself, never copied as a bare file, and never opened by two programs across that shared-folder link.

## 11. Owning the data

- **Full export:** every table as JSON (and CSV where it's a simple table), plus the files and a README describing the formats. Importing an export restores it.
- **A database-level export:** `pg_dump` as plain SQL.
- No third-party analytics. Nothing leaves the machine unless Xar sends it.

## 12. Frontend

- One React + Vite app, plain JavaScript for now (TypeScript when it earns its place). Each module has a folder with its screens; shared components and design tokens live in one place.
- No iframes once a module is native.
- The grounds (madder / indigo / paper) set the world; each area has an accent colour that tints but never overrides the ground.
- Plain words on buttons and labels; the poetry lives in the atmosphere.
- Layouts that work at phone width, ready for the PWA.

## 13. Access and security

- **Now:** the server listens on localhost only; the API needs the single token; phone access later through Tailscale.
- **Later, with other users:** accounts and separating each person's data (in PostgreSQL, either an owner column with row-level security or one database per person), followed by a proper security review.

## 14. Other users, later

Two possible shapes, chosen in the late stages: each student runs their own private copy (a packaged installer or Docker Compose), or a hosted service with accounts. PostgreSQL supports both. What keeps both open now: personal constants live in settings, content lives in data, everything new starts empty, and imports are how a new person fills it.

## 15. The transition, module by module

Until a module is native, the attached app keeps its own server and storage and is shown in a frame; its temporary calendar adapter reads it through its API. Each move then goes:

1. Back up both sides.
2. List the attached app's features; build the native module until each one is checked off.
3. Move the data with counts before and after, plus spot checks.
4. Xar uses the native module while the attached one stays available but unused.
5. Xar accepts; the attached app leaves the navigation; its folder is archived later with a verified copy. Deleting anything is Xar's step.
