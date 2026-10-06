# Study Hub and Calendar: data structure and functions

**Written 6 October 2026 (Claude Code), from the code as it runs.** A reference for Xar and for any agent picking this up. Where this and the code disagree, the code wins; update this file when the structure changes.

## 1. Where the data lives

| What | Where | Notes |
|---|---|---|
| Study records | PostgreSQL 18, database `lifeos`, schema `study` | Only the Life OS server writes to it. Test database: `lifeos_test`. |
| Study files (PDFs, notebooks, uploads) | `../Life_OS_data/study/materials/` | Outside git. Files are only ever added, never overwritten. |
| Backups | `../Life_OS_backups/study-YYYY-MM-DD/` | Database dumps and file snapshots. Nothing prunes them. |
| Folder connections | `.runtime/study-folders.json` | Which module watches which folder. Outside git. |
| Core entries and people | SQLite `code/life-os/backend/data/life-os.db` | Still SQLite until the core moves (Stage 1a). |
| Calendar | no storage of its own | Read fresh from seven sources on every request. |

## 2. Study: the tables

Eight record tables share one shape, plus two bookkeeping tables.

`study.semesters`, `modules`, `cards`, `assessments`, `sessions` (timetable), `materials`, `progress`, `settings`

| Column | Type | Meaning |
|---|---|---|
| `id` | uuid | Stable identity. Imports derive it from the source so repeats match. |
| `title` | text | Up to 2000 characters. |
| `status` | text | One of: active, planned, in-progress, done, completed, archived, draft, pending, cancelled, booked, missed, blocked. |
| `semester_id`, `module_id`, `card_id` | uuid, nullable | Parents. A module's semester and a card's module must agree; a child inherits what it leaves blank. |
| `start_date`, `end_date` | date | Civil dates (no time zone). End cannot precede start. |
| `start_at`, `end_at` | timestamptz | Exact times in UTC; shown in Europe/London. |
| `data` | jsonb object | Everything specific to the record type (below). Up to 2 MB. |
| `provenance` | jsonb object | Where an imported record came from: `source`, `source_id`. Unique per table. |
| `revision` | integer | Goes up by one on every save. A save must quote the current one. |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | `deleted_at` set means removed (hidden, still stored). |

`study.history`: one row per save: `entity`, `record_id`, `action` (create, update, delete, import), `before_data`, `after_data` (full copies of the record), `actor`, `created_at`. Written in the same transaction as the save.

`study.import_batches`: one row per applied import: `source`, `fingerprint` (unique together), `record_count`, `result`.

### What goes in `data`

- **Semester:** free-form details. Dates live in `start_date` / `end_date`.
- **Module:** `code`, `objectives`, `operatingRules`, `note`, drills and recipes, resources. Nothing about a module is hardcoded.
- **Card (a piece of work):** `lane` (Today, This Week, Deep Work, Backlog, Waiting / Blocked, Rescue Lane, Done), `done`, `completedAt`, `phase`, `priority`, `slotType`, `slotLabel`, `estimatedHours`, `actualHours`, `description`, `why`, `doneCondition`, `evidenceRequirement`, `tags`, `dueTime`, `checklist` (`id`, `text`, `done`), `notes` and `evidenceEntries` (`id`, `at`, `text`), `focusSessions` (`id`, `at`, `minutes`), `activity` (`id`, `at`, `action`), links to materials.
- **Assessment:** `type` (exam, coursework, project), `weight`, `result`. An exam uses start and end times; coursework uses the due time.
- **Timetable session:** `category` (lecture, lab, study, reading), `location`, `description`; for an imported series: `sourceRule`, `sourceSeries`, exclusions.
- **Material:** `url` (a `/study-files/` path or an http(s) link), `fileName`, `type`, `mime`, `viewer`, `size`, `sha256`, `group`, `description`, `tags`, `reviewed`, `lastOpenedAt`; for a discovered file: `relativePath`, `discovery`, `previousMaterialId`.
- **Setting:** `key` (unique among live settings). In use: `preferences` (lanes, priorities, slots, sidebar, read notifications), `focusTimer`, and three preserved from Summer Rescue: `notifications`, `snapshots`, `sourceArchive`.

Lanes, priorities and slots are editable lists in preferences, not fixed in code.

## 3. Study: what the API does

All under `/api/study`, with the bearer token, on 127.0.0.1 only.

| Request | Does |
|---|---|
| `GET /workspace` | Every live record, the latest 100 history rows, import batches. One consistent snapshot. |
| `GET /export` | Everything, including removed records and all history, as a file. |
| `POST /<type>` | Create. |
| `PATCH /<type>/<id>` with `revision` | Change. A stale revision gets 409 and the current record; nothing is overwritten. |
| `DELETE /<type>/<id>` with `revision` | Remove (soft). Refused while live records still point at it. |
| `GET /deleted` | Removed records, newest first. *(new)* |
| `POST /<type>/<id>/restore` with `revision` | Bring a removed record back. Refused if its parent is still removed. *(new)* |
| `GET /<type>/<id>/history` | Up to 50 saved versions of one record. *(new)* |
| `POST /<type>/<id>/revert` with `revision`, `history_id` | Put an earlier version back, as a new save. *(new)* |
| `POST /imports/<format>/preview`, then `/apply` | Formats: `ics`, `csv`, `json`, `manual` (a repeating session), `legacy` (Summer Rescue). Apply needs a matching preview from the last 30 minutes, backs up first, and writes all or nothing. Repeats add nothing; a record you changed is reported as a conflict, never overwritten. |
| `POST /uploads` | Save a file (up to 25 MB) and its material record. |
| `GET /discovery` | Folder connections and their last scan. |
| `POST /discovery/preview` | Count what a folder holds. Reads names and sizes only. *(new)* |
| `POST /discovery/configure` | Connect a module to a folder. Watches for new files only, unless `include_existing` is true. |
| `POST /discovery/scan` | Scan now (it also runs every 30 seconds while the app is running). |
| `GET /backups` | Latest dumps, count and size. *(new)* |

**Timetable import** understands weekly and daily repeats, counts and end dates, excluded dates, cancelled and moved occurrences, London clock time across the clock change, and all-day spans. Anything it cannot represent is refused with a reason instead of guessed.

**Folder discovery** copies a new file into Study storage once it has stopped changing, links it to the module, and leaves the original where it is. A changed file becomes a new unreviewed version. It skips hidden files, links, files over 100 MB, any folder holding more than 500 items, and refuses to bring in part of a folder with more than 10,000 items.

**Protection:** revisions on every save; history on every save; soft delete with restore; a database dump before every import and migration and once a day; a file snapshot before imports; the app's database role cannot change the schema.

## 4. Calendar

`GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` (up to one year). Read-only: it cannot save to any source.

Returns `items`, `sources` and `knownEventIds`.

**An item:** `id` (unique, built from its source), `area`, `kind`, `title`, `start`, `end`, `all_day`, `href` (where to open it), optional `location`, and `meta` (source details, `readonly`).

- `kind` is one of: **fixed** (a class, an exam, an event), **deadline**, **plan** (work you scheduled), **reminder**.
- `start` and `end` are a date for all-day items or a UTC instant for timed ones. All-day ends are inclusive.

**The seven sources**

| Source | Area | Read from | Gives |
|---|---|---|---|
| core | Life OS | SQLite entries | dated entries that are not finished |
| people | Relationships | SQLite people | birthdays, each year |
| study | Study | native Study (PostgreSQL) | card starts and deadlines, assessments, timetable |
| career | Career | JobMap, `GET /api/jobs` | application deadlines, explicit follow-ups |
| money | Money | Budget, `GET /api/state` | subscription renewals, budget month starts |
| home | Home | the same Budget read | dated shopping and meals |
| events | Cardiff events | `cardiff-life/events.csv` | events, with your saved choices applied in the browser |

Each source has 2.5 seconds. One that fails or returns something unexpected is marked `unavailable` with a plain message, and the others still load. Study leaves out done and cancelled work and anything under a finished or archived semester or module. Today and the Court read the same endpoint.

## 5. Known limits

- The API token is a fixed development value and the server only listens on this computer. Proper sign-in is Stage 1 work.
- Each Study page refresh loads the whole workspace (about 1.5 MB now). Fine locally; worth splitting when the phone uses it.
- History keeps a full copy before and after each save, so it grows with use. Nothing trims it.
- Backups stay on this laptop. A second copy elsewhere is still to set up.
- Core entries and people are still in SQLite.
