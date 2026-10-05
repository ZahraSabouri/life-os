# Life OS — Roadmap (scratchpad)

**Rewritten 5 October 2026 with Xar.** This is a scratchpad, not a schedule or a contract. The order is current best thinking and will change as the app and life change. Rewrite it freely; old versions live in git history.

Companion documents:
- `Life_OS_Vision.md` — why the app exists and what it should become.
- `Life_OS_Architecture.md` — how it's built (PostgreSQL, a shared core plus modules, imports, data protection).
- `DECISIONS.md` — what we chose, when and why.
- `Life_OS_Plans_Inventory.md` — everything planned so far, with its status, so nothing from the earlier plans gets lost.
- `STATUS.md` — where things stand right now and the next step; `sessions/` — one note per session; `briefs/` — one plan per stage.
- `WORKFLOW.md` — how the work runs, with Xar's prompts.

---

## 1. Where we are (5 October 2026)

**The core Life OS app** (`code/life-os/`: Express + SQLite via `node:sqlite`, React + Vite):
- **Built:** the entries engine with 49 entry types and six archetypes (`shared/entryTypes.js`); a favourites column; rooms as saved filters (`spaces` table, 12 rooms seeded, `GET /api/entries?room=`); a capture form driven by the type registry; Today with task completion; a month calendar with Persian and English dates and birthdays; people with birthdays; the Court (home) with 12 room doors in four wings; three grounds (madder / indigo / paper); the Divan intro with poems.
- **Not built yet:** tags, places / organisations / links in use, the shared room shell, boards, files and photos, search, export and backup, a settings/data page, the AI capture layer (parked on purpose).
- The core database holds only a handful of test entries. The engine has never carried real life yet.
- A fully redesigned "manuscript" Study Hub sits unused in `frontend/src/rooms/study-hub/`.

**Four apps attached on 1 October**, each unchanged, shown full-screen inside Life OS, each with its own storage:

| Area | Attached app | Address | Its data lives in |
|---|---|---|---|
| Study | Summer Rescue | `/study` | `summer-rescue-plan-app/local-data/` (JSON state, progress log, SQLite mirror), uploaded files, study assets |
| Career | JobMap | `/jobmap` | `jobmap/data/` (jobs, workspace, inbox); its own server on port 47852 |
| Money & Home | Budget Management ("Everyday") | `/budget` | `budget-management/data/state.json`, backups, artwork; its own server on port 47851 |
| Events | Cardiff Life | `/cardiff-life` | `cardiff-life/` research files; Xar's choices in browser storage |

The five stores remain separate during the transition. Stage 2 adds read-only calendar providers over them; their native replacements still follow the foundation work.

**Known issues and loose ends**
- The core SQLite database file is still in WAL mode (the setting is stored inside the file). Copy it only through SQLite, never by copying `life-os.db` alone, or recent saves can be missed. It retires in Stage 1a when the core moves to PostgreSQL.
- The Court's room doors show made-up sample lines ("FIN301 - three revision blocks left this week", "Admiral / Data Analyst - applied Tuesday") when a room is empty. The Relationships door opens Cardiff Life, which is the wrong home for it.
- No real save has been made through Life OS's Budget yet (the move deliberately didn't make one). Budget's last save was 26 September (revision 91) in both the old and the new copy, so nothing has split.
- Summer Rescue's module pages, exam dates and materials are written into its code for the four summer modules; a new module can only be added as a label on cards.
- Summer Rescue's own GitHub repository has newer commits than the copy inside Life OS (noted in session 7). Check them before Stage 3.
- Codex automations still write to old folders: the Cardiff Life searches and the "UK Tech Job Shortlist" for JobMap.
- `v2-subapps` was merged into `main` on 5 October (tag `pre-development-2026-10`). The old nested `.git` folders are still on disk.

## 2. Direction

**One app, not a box of apps.** Life OS becomes one program with one database and one way of moving around. Each attached app keeps working until it has been rebuilt inside Life OS as a native section and Xar has accepted the new one; only then is the attached version retired.

- **The calendar ties everything together.** Every area puts its dated things on one calendar and into Today.
- **Home leads with Today**, strongly, with the room doors below, in clearer wording.
- **Three ways in, everywhere:** by hand; by import (ready instructions for your own AI, scheduled agents, connectors); later by built-in AI.
- **Other users come in the late stages.** The only rule that anticipates them now is "no personal content in code", which Xar needs anyway: next semester's modules shouldn't need a code change.

## 3. The order

**5 October update from the later Claude Code conversation:** Xar asked to finish Calendar and Today first, and authorised starting the work with a documented brief and review afterward. The active brief is `briefs/stage-2-calendar-today.md`, branch `stage/2-calendar-today`. PostgreSQL is postponed until after this calendar checkpoint; Xar intends to install it herself. Next: accept Calendar/Today, finish the Stage 1a foundation, then build native Study (Stage 3). Stage numbers remain stable. The PostgreSQL design decision still holds; there is no database migration in Stage 2.

Each stage is cut into sessions small enough to finish and verify. Every stage gets a brief in `briefs/` before building starts. Every session: run first, back up first, end with something runnable, write a session note and update `STATUS.md` (see `AGENTS.md` and `WORKFLOW.md`).

### Stage 0 — Use Budget for October (now)
- Record October spending in Life OS at `/budget`. Don't use the old `Start Budget Management.cmd` any more: it edits the old folder.
- After the first real save, confirm it landed in `Life_OS\budget-management\data\state.json` (revision 92) and that a new backup file appeared in `budget-management\data\backups\`.

**Done when:** a real save is confirmed in the Life OS copy.

### Stage 1 — Foundation

**1a. The data foundation: PostgreSQL** (likely two or three sessions)
- Install PostgreSQL (current stable major) as a Windows service, listening on localhost only. Databases `lifeos` and `lifeos_test`; an owner role for migrations and an app role for everyday use. Data directory outside the project and outside any cloud-synced folder.
- Restructure the backend into a shared core plus modules (`Life_OS_Architecture.md` §4), with all SQL inside data-access layers and a migration runner over numbered SQL files.
- Conventions from the start: UUID ids; `created_at`, `updated_at`, `revision`, `deleted_at` on user content; provenance columns for imported rows; money as whole pence; `timestamptz` in UTC.
- Change history: every write through the data layer records before and after.
- Revision checks: a save based on an older copy is refused (409).
- Core links (anything to anything) and organisations, because Career and Study need them.
- Move the core's existing SQLite data (entries, people, spaces) into PostgreSQL. Read it through SQLite so the WAL contents come along; record counts before and after; keep the SQLite file archived, untouched.
- Backups: `pg_dump` before every migration and import, plus daily rolling copies; the files folder backed up too; one real restore into `lifeos_test`.
- Choose the data folder location (files, inbox, backups, exports).

**Done when:** the core runs on PostgreSQL; counts match; an edit shows in the history; a stale save is refused; a backup has been restored into the test database.

**1b. Home and navigation**
- Home leads with Today (today, this week, what needs attention), with the room doors below. Today starts with core entries and grows in Stage 2.
- Doors show real data or an honest empty state; the sample lines go.
- Add doors for Money and Events (Cardiff Life); Relationships stops opening Cardiff Life. Where the new doors sit among the four wings is Xar's call.
- Wording review together: plain words for actions and labels; the poetry stays in the atmosphere (Divan, grounds, poems). Decide which names stay poetic ("The Court", the wings, "Ground").
- Personal constants (university, time zone, currency, week start, Persian calendar on/off, default monthly allowance) live in settings data, not code.

**Done when:** Home answers "what's my day?" at a glance and every door leads somewhere real.

**1c. The import pipeline** (can run after Stage 2 if the calendar feels more urgent; must be done before Stage 3)
- A jobs table and a worker inside the server; the inbox folder layout (`inbox/<area>/`, `processed/`, `failed/` with an error note beside each failed file).
- Import batches: validate, preview, apply, log, undo.
- Import formats defined as JSON Schemas that also generate the downloadable "give this to your AI" instructions.
- One small real format end to end to prove it (proposal: tasks or calendar items).

**Done when:** a file dropped in the inbox shows as a preview, can be applied, appears in the app and in the history, and can be undone.

### Stage 2 — Calendar and Today across everything
- The calendar item shape every area provides: area, kind (**fixed** / **plan** / **deadline** / **reminder**), title, start and end or all-day, an optional recurrence rule, a link back. Kinds look different; areas are colour layers that switch on and off.
- Temporary read-only adapters for the attached apps, through their own APIs:
  - Study (Summer Rescue): card start and due dates, module exam dates.
  - Career (JobMap): deadlines, applied dates, follow-ups and next steps.
  - Money & Home (Budget): subscription renewals (`nextDue`), budget month starts, shopping trips that have dates.
  - Events (Cardiff Life): events marked Plan to go or Maybe. These choices live in browser storage, so this adapter reads them in the browser (same origin as Life OS).
- Today: dated items for today and this week, plus what needs attention (overdue, follow-ups due, renewals coming up).

**Done when:** each area's dated items appear on the calendar and in Today with the right kind and colour, the layers toggle, and nothing is written back to the attached apps.

### Stage 3 — Study, rebuilt natively (Summer Rescue retires)
- Structure: semester → modules → timetable sessions, assessments (type, weight, due date, result), materials (files and links, per module and per card), cards.
- Cards keep Summer Rescue's behaviour: lanes and status, checklist, evidence, notes, logged hours, priority, estimate, start and due dates, "why it matters", "done when", per-card references with an inline video/PDF player.
- Progress log, focus timer, celebrations. **Rescue mode** is something you switch on near exams, not the whole section.
- Inputs: the timetable via a calendar subscription (.ics) if Cardiff's timetable offers one, otherwise CSV, with recurrence and exceptions (reading week, cancelled lectures); modules and assessments through import formats with AI instructions; materials dropped in from Learning Central downloads.
- Before starting: list every Summer Rescue feature and check it off as it's ported; check Summer Rescue's newer GitHub commits.
- Bring in Summer Rescue's data (cards, progress log, resources, uploads, study assets) with counts before and after.
- The manuscript designs are a visual reference for later; the designer notes' gaps stay on the list.

**Done when:** this semester's modules, timetable and assessments are in without code changes and show on the calendar; Summer Rescue's history is visible; counts match; Xar accepts it and Summer Rescue leaves the navigation.

### Stage 4 — Career, rebuilt natively (JobMap retires)
- Jobs, shortlist, applications and their stages, follow-ups and next steps, notes and priority, preferences and explainable matching, the discovery inbox and import history.
- Companies become shared Organisations; deadlines and follow-ups feed the calendar.
- Scheduled searches point at the Life OS inbox: Claude's "Cardiff job search to JobMap" and Codex's "UK Tech Job Shortlist".
- Bring in JobMap's data (jobs, workspace, notes, statuses, import log) with counts. Imports never overwrite Xar's own fields.

**Done when:** all jobs and Xar's edits are present, counts match, a scheduled batch imports correctly, and Xar accepts it.

### Stage 5 — Money & Home, rebuilt natively (the attached Budget retires)
- **Money:** monthly allowance, spending, adjustments and money-back, saving goals and intentions, subscriptions and renewals, category targets.
- **Home** (kitchen and household): items and the usual-buys catalogue, shops, shopping lists, receipts with their lines, stock lots and stock events, meals, and **recipes as their own collection**, linked to items.
- Keep Budget's rules (see `budget-management/README.md`): allowance and overspending carried forward, a big stock-up counted across the months it feeds, older catalogue observations never becoming new spending, plans and subscriptions as forecasts until paid.
- Money as whole pence everywhere (Budget currently mixes pounds and pence).
- Inputs: receipts through import (for example a photo → your AI → CSV), lists by hand.
- Bring in `state.json`, its backups, the browser-data keys and the artwork, with counts.

**Done when:** October onwards matches the attached app to the penny, stock and receipts line up, counts match, and Xar accepts it.

### Stage 6 — Cardiff Life, rebuilt natively, with connectors
- Events, communities, sources and provenance, Maybe / Plan to go choices and notes (moved from browser storage into the database), the week planner, overlap notices.
- Connectors feeding the import pipeline: Cardiff SU, Eventbrite (its official API only returns events for a known organiser, venue or event ID, so discovery needs an agent or scraper), other sites. Check each site's terms.
- Replace the Codex Cardiff Life searches with Life OS connectors, or point them at the Life OS inbox.

**Done when:** events and choices live in the database, connectors run on schedule, and nothing writes to the old Cardiff Life folder any more.

### Stage 7 — The rest of the house
The rooms and engine pieces from the July plans, in an order chosen when we get here: people and links, tags, search (English and Persian), photos and Memories, Culture & Library, Body & Health, Travel, Relationships, Academia & Research, Growth & Learning, Mind & Making, the Closet, boards, export/import and the data page, AI capture, voice, PWA and Tailscale. The full list with statuses is in `Life_OS_Plans_Inventory.md`.

## 4. Alongside (housekeeping, whenever convenient)
- Repoint the Codex automations to the Life OS folders (Cardiff Life searches; UK Tech Job Shortlist).
- Decide what to do with the old nested `.git` folders. `code/life-os/.git` is redundant (all its commits are in the main repository) and waits to be moved to `Life_OS_backups`: Xar's step, see `STATUS.md`.
- Archive each original standalone folder with a verified copy once its native replacement is accepted. Deleting anything is Xar's step.
- `Documents\JobMap` also holds the Excel workbooks, `Career Agent\AGENTS.md`, the scheduled-search playbook and notes used by the scheduled task; give them a home before archiving.
- Run `node --test hosting/app.test.mjs` on Windows, once tests have their own database (Stage 1a): today it opens the real one and re-seeds its spaces.

## 5. Late stages (not now)
- Other users: per-person copies or a hosted version, accounts, onboarding, user tests, packaging.
- Security hardening beyond the single token and Tailscale.
- Full verification tooling (hash manifests, automated count reports) beyond the counts taken at each move.
- The in-app browser for Learning Central (log in, email, courses, saving material into Study). The hardest idea on the list; it may need a desktop wrapper or a browser extension.
- Built-in AI paid with tokens.
- Presenting Life OS at Cardiff.
