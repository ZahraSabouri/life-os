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
