# Stage 3: Native Study Hub

**Status:** build authorised directly by Xar, 5 October 2026: finish Calendar, then Study Hub; reaffirmed after the usage reset. Visual acceptance stays separate.
**Branch:** `stage/3-study-hub`, created from main and fast-forwarded to the completed Calendar checkpoints; main remains unchanged.

## Goal
A native Study section inside Life OS supports every semester without code changes. It keeps Summer Rescue's useful study behavior, brings its real saved history and materials into PostgreSQL with a reviewed, repeatable import, and supplies Calendar/Today directly. Rescue is a mode; semesters and modules are data.

**Xar's reminder during this build:** the aim is studying generally, usable for all kinds of modules and students. The section supports readings, exercises, coursework, projects, assessments and self-directed study. Exam campaigns and rescue are optional workflows. New modules/semesters start empty and editable; imported campaign content never becomes a template or personal constant for everyone.

## Read first
AGENTS, STATUS, ROADMAP Stage 3, Architecture sections 3–6, 9–10 and 15; `2026-10-05-codex-stage-2-final-audit.md`; the feature inventory below; actual Summer Rescue state/card assembly rather than its incomplete SQLite mirror.

## Scope and transition
**6 October user correction:** preserve Summer Rescue's actual design/style and reuse its code/components wherever useful. Transfer its sidebar/topbar, source light/dark palette and rich workspaces instead of applying the manuscript shell to Study. Native data/API and reusable semesters/modules remain. Add trusted automatic discovery for the existing Cardiff module-material folders; connect the seven identified Spring/Autumn directories, preserve originals/versions and provide folder controls.

Native semesters, modules, cards, checklists, notes/evidence, logged hours/focus sessions, assessments, timetable sessions, materials/readers, overview/board/list/week/progress views, rescue, search, preferences and safe import/export. Timetable imports preserve dates, London times, recurrence and exclusions; unsupported input must be explained rather than guessed. Existing Summer Rescue stays at `/study-legacy` and its original document URLs stay available. Keep the source untouched until acceptance.

PostgreSQL 18.6 is running. Fresh `lifeos`/`lifeos_test` and owner/app roles are configured outside git. Study owns schema `study`; existing core SQLite remains during transition. Shared Calendar asks both core and native Study. Broader Stage 1 core/import-worker/backup scheduling and external-account connections stay separate. Existing newer autumn records were preserved alongside the legacy import; no current-semester content was invented.

## Data/API contract
- Tables: `study.semesters`, `modules`, `cards`, `assessments`, `sessions`, `materials`, `progress`, `settings`, plus module history/import batches.
- Record envelope: UUID `id`; `title`, `status`; nullable `semester_id`, `module_id`, `card_id`; civil `start_date`, `end_date`; UTC `start_at`, `end_at`; validated `data`/`provenance` JSON; `revision`, `created_at`, `updated_at`, `deleted_at`.
- Rich card fields stay in `data`: source lane/phase, priority, slot, estimate, description, why/done-when, tags, checklist with stable IDs, notes/evidence/activity/focus sessions, logged hours and material links. Module resources, objectives, rules and notes are data, never hardcoded module names.
- `GET /api/study/workspace` and `/export` return entity arrays/history. `POST /api/study/<entity>` creates; `PATCH` and soft-delete require the current revision. Every write records history transactionally. Stale saves return 409 and do not alter records.
- `POST /api/study/imports/<format>/preview|apply` validates and previews first. Apply rechecks the source/fingerprint/reviewed preview, backs up, and writes atomically. Existing provenance matches are skipped; conflicts never overwrite user edits. UUID references are stable across repeat imports.

## Checkpoints

### CP1: Native persistence and reusable Study workspace
- [x] Numbered Study schema, backup-first runner, separate owner/app roles and local configuration kept outside git.
- [x] Validated module API, revision checks, history and soft-delete, tested against `lifeos_test` rather than production.
- [x] Native route/room shell; semesters/modules/cards with dynamic creation, editing, filters, lanes/checklists/notes/evidence/hours and materials; source remains accessible.
- [x] Focus timer/logging, rescue workflow and native views with honest empty/error states and ground tokens. Responsive visual/richness review remains CP3.
- **Done when:** new semesters/modules/cards persist across restart, stale updates fail, native Study is usable without an iframe or personal constants in code.
- **Verify:** fixture/integration tests, both builds and live read-only route checks; synthetic writes only on `lifeos_test`.
- **Commit:** `[3-cp1] Build native Study workspace on PostgreSQL`.

### CP2: Preserve and import the real Study data
- [x] Back up source JSON, SQLite via its backup API, assets/uploads/logs; `pg_dump` before migration/import. Native material snapshots now precede new imports too.
- [x] Actual client cards/links plus saved overlays assembled; removed resource links, stable checks and rich saved work retained.
- [x] Reviewed API import: 352 original records, 128 cards, 503 checks, 211 materials, 949 material links; repeat adds zero. All material ownership retained. Existing autumn data preserved.
- [x] Full export and actual fresh-target dump/file restore: all database content and 289 file hashes match.
- [x] Native Study replaces the old Calendar adapter; service validates its shape. 25 targeted tests/live seven-source checks pass; IDs/links have no duplicates.
- **Done when:** source records/materials are preserved and visible natively; repeat import is idempotent, edits survive, backup restore matches, source is unchanged.
- **Commit:** `[3-cp2] Import Study history and connect the shared calendar`.

### CP3: Timetable and final parity
**Closed unfinished on 6 October (late); replaced by CP4 to CP8 below.** Xar's correction (`../DECISIONS.md`, newest entry): the Study hub is the Summer Rescue app itself, the real one from her university folder, made general. Everything in CP1 to CP3 was built from a copy frozen on 6 July. The unticked items below and the parity ledger further down are not to be continued; the page they describe now lives at `/study-native` and retires in CP5.

**6 October scope changes, all asked for directly by Xar during the Claude Code session:** (1) a style menu on every page; (2) a fourth, modern style for the whole app, unified rather than different per area; (3) backend for Calendar and Study finished first, styles second; (4) a report on data structure and functions (`../Study_and_Calendar_Backend.md`). Folder discovery now watches for new files only unless the existing files are asked for (decision recorded in DECISIONS).
- [x] Transfer original Summer Rescue design/components and native reusable data. Sidebar overflow and summary tiles fixed. Study's own light/dark switch is replaced by the four Life OS styles (Xar: one unified design); the saved `theme` preference is left in the data, unused.
- [x] Automatic trusted module-folder resource discovery: supported new files appear while host runs; repeat scans skip linked content; changed versions and personal edits remain; original files untouched. 14 tests. **No folder is connected yet:** the seven candidates hold about 10,700 files (table in the 6 October Claude Code session note), so connecting them is Xar's choice per module.
- [x] Manual timetable/assessments/materials inputs; validated JSON/CSV/ICS preview/apply with recurrence and exception handling (built in CP1/CP2, 21 import and timetable tests).
- [ ] Schedule/day/week views and conflict/daily totals, true activity progress, timer execution context and rescue triage.
- [ ] Check every feature below; document any remaining parity explicitly, keep original accessible, and never silently replace the current plan with a newer private seed.
- [ ] Desktop/phone/all-ground visual review in an available browser. Partly done 6 October with headless Chrome, saves blocked: Overview and History at desktop and phone width in all four styles, the phone menu, and the style menu on Court, Today, Calendar and a framed app. Not yet looked at: the other eleven Study views, dialogs, the focus timer and workbench.
- [x] Added: restore a removed record, put an earlier version back, per-record history, removed-records list, daily database backup, folder preview. Tested on `lifeos_test` (9 guarded checks).
- [ ] Added, not done: Cardiff Life, Budget and JobMap follow the four styles. They have the style menu but keep their own look.
- **Done when:** Study is reusable for the next semester and its recorded study features/data work through the native module; Xar can review it before retirement of the source.
- **Commit:** `[3-cp3] Complete Study planning and import workflows`.

### CP4: The real Summer Rescue is the Study hub
- [x] The real app and its data (23 August) copied from the university folder into `summer-rescue/`; the original is only read. Six absolute image and file addresses changed so it runs under `/apps/summer-rescue/`; nothing else in it was edited.
- [x] Life OS serves it at `/study`. Its local API is handed only the addresses it owns, because it sets "never show in a frame" headers on everything it sees.
- [x] The database-backed page moved to `/study-native`; calendar links follow it. The stale summer copy in the database is marked completed so it stops raising overdue items.
- **Done when:** the Study hub button opens the real app with the real progress; Calendar and Today are unchanged apart from losing the stale overdue items.
- **Commit:** `[3-cp4] Make the real Summer Rescue the Study hub`.

### CP5: One store: the app saves into the Study database
The app talks to its server through one file (`src/utils/localStateFile.js`): `/api/state`, `/api/events`, `/api/resources`. Answer those from PostgreSQL instead of the JSON file.
- [ ] A server adapter between the app's saved state and Study records (cards, modules, materials, settings, progress events), in both directions. Test: the real state, turned into records and back, comes out identical.
- [ ] The app's own revision check on save (409 on a stale tab) keeps working; every change still lands in Study history.
- [ ] Bring the real data in once, updating the stale 6 July records in place by their source id so nothing appears twice. Health, Admin, the shopping list, Job Hunt and the interview items are not brought into Study; they stay in the saved source for a later home.
- [ ] The autumn records already in the database (timetable, assessments, materials) show in the same app. `/study-native` and its components are removed.
- **Done when:** `/study` reads and writes only the database; counts match the source; a restart keeps everything; the JSON file is no longer written.
- **Verify:** round-trip test, counts before and after, a backup first, the calendar duplicate check.
- **Commit:** `[3-cp5] Run the Study hub on the Study database`.

### CP6: Nothing premade: the plan becomes data
- [ ] `App.jsx` and the eight components that import `src/data/*` take modules, cards, study sequences, schedule rules, exam dates and knowledge notes from the chosen semester instead.
- [ ] Semesters: define, choose on entering Study, mark as past. "Summer 2026" becomes a past semester holding everything that used to be in code, editable like anything else.
- [ ] Modules: add, edit and remove, with all their detail. A new module starts empty.
- [ ] The areas that are not study leave Study's menus (Life & Admin, Admin & Dates, Job Hunt, Sati Interview, Shopping). Their data is kept.
- **Done when:** a new semester with a new module works without touching code, and the summer semester looks and behaves as it does today.
- **Commit:** `[3-cp6] Move the built-in plan into data and add semesters`.

### CP7: Duplicate a module into a new time frame
- [ ] Copies the module with its cards, checklists, study sequences, notes, resource links, classes and assessments into a chosen semester. Every date shifts by the chosen offset. Progress is cleared in the copy (done, logged hours, evidence, focus sessions).
- **Done when:** a duplicated module is independent: editing either one leaves the other unchanged.
- **Commit:** `[3-cp7] Duplicate a module into a new time frame`.

### CP8: Calendar and acceptance
- [ ] Calendar and Today read the one store: active semesters only, each thing once; a link opens the item in `/study`.
- [ ] Xar's acceptance checklist, rewritten for the app as it then is. No merge to main before that.
- **Commit:** `[3-cp8] Connect the Study hub to the calendar`.

## Source feature inventory and parity ledger
Inventory of both checked-out source and five cached newer commits (`6360120` → `9bba45f`). No source checkout/reset/fetch needed.

| Feature | Native verification required |
|---|---|
| Overview, today/next/week queues, module objectives/rules/drills/recipes/scratchpad | Dynamic module/workspace data; source notes preserved |
| Cards: title/module/phase/priority/slot/start/due/estimate/description/why/done-when/tags | Edit every field; custom cards, reset/soft-delete, single/bulk reschedule |
| Lanes/status/done; checklist, notes/evidence and hours/focus sessions | Stable checklist IDs; add/edit/remove/tick; logged work survives restart |
| Planner, board, table, week, analytics, progress, evidence, rescue/project/admin | Native useful views, shared filter/search and honest empty states |
| Module/card resources, upload, groups/search/pinned/recent/reviewed | All resource links preserved, including hidden implicit links |
| PDF/HTML/YouTube/video/image/Markdown/text/code/notebook reader; print/new-tab | Safe URLs; preserve local asset routes; appropriate readers/fallbacks |
| Focus/short/long timer, pause/log/reset/custom durations/chime/long break | Wall-clock timer and actual logged focus; reduced-motion celebration |
| Notifications/read-all, themes/intro/mobile/preferences, command search | Persisted preferences/history; Life OS grounds and accessible controls |
| Export/import preview, pre-import backups/reset/recovery, save status | Preview fingerprint/revision checks; real restore; no destructive reset |
| Newer schedule recurrence/exclusions, conflicts, totals, execution context | Generic sessions, bounded recurrence and explicit source provenance |
| Newer focus room/restart cue, one-card rescue triage, true activity streak | Preserve recorded activity; no false streak from opening the page |
| Newer PWA install and JobHuntPlaybook | PWA is later core work; job playbook belongs to Career. Keep accessible in source and record these domain boundaries |

Source labels: Today, This Week, Deep Work, Backlog, Waiting / Blocked, Rescue Lane, Done; priority Critical/High/Medium/Low; slots AM/PM/Light/Eve/Fixed/Flex. These defaults are editable data/settings, not hardcoded personal modules or phases.

## Data safety and known counts
The current source has 128 cards. Raw seed/mirror has 460 checklist rows, but client transformations yield 503 before the current overlay and 952 implicit resource edges. There are 211 resource definitions and 211 asset files (140,141,241 bytes); the SQLite resource tables are empty and cannot be the migration source. Inspect saved overlays/uploads/module notes/progress/snapshots/notifications directly. A newer private plan has different cards/schedule rules: never substitute it silently.

Do not import the legacy normalizer that resets on version/planResetId mismatch. Do not call source database health (it seeds), or open the source page while asserting read-only hashes. Backups use SQLite/pg_dump, not bare database copies. Only server/reviewed migration writes data. Preserve source paths, attachments, browser-local data and original folders; do not delete them or touch PostgreSQL's data directory.

## Acceptance checklist
1. Open Study; existing cards/materials/history should be visible, and original Study remains linked.
2. Add a semester/module without code changes; create/edit a card, checklist, note, evidence and dates. Reload and verify the result.
3. Log a focus session, use rescue and filter/board/progress views. Saved work and completion remain visible.
4. Open materials and upload/link one if desired; source files remain accessible.
5. Add/import an assessment or timetable via preview. Dated items appear once in Calendar/Today and link back to native Study.
6. Check phone width/all grounds; report edits before accepting or retiring Summer Rescue.

## Risks
Existing autumn timetable/module content is preserved; further content must come from supplied sources, never guessed dates. Existing core remains SQLite temporarily and its broader PostgreSQL migration stays visible in STATUS. Browser visual QA remains pending if CUA has no browser. Importing a newer private seed is a separate decision, never an automatic source upgrade.
