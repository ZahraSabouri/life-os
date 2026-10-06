# Stage 3: Native Study Hub

**Status:** build authorised directly by Xar, 5 October 2026: finish Calendar, then Study Hub; reaffirmed after the usage reset. Visual acceptance stays separate.
**Branch:** `stage/3-study-hub`, created from main and fast-forwarded to the completed Calendar checkpoints; main remains unchanged.

## Goal
A native Study section inside Life OS supports every semester without code changes. It keeps Summer Rescue's useful study behavior, brings its real saved history and materials into PostgreSQL with a reviewed, repeatable import, and supplies Calendar/Today directly. Rescue is a mode; semesters and modules are data.

**Xar's reminder during this build:** the aim is studying generally, usable for all kinds of modules and students. The section supports readings, exercises, coursework, projects, assessments and self-directed study. Exam campaigns and rescue are optional workflows. New modules/semesters start empty and editable; imported campaign content never becomes a template or personal constant for everyone.

## Read first
AGENTS, STATUS, ROADMAP Stage 3, Architecture sections 3–6, 9–10 and 15; `2026-10-05-codex-stage-2-final-audit.md`; the feature inventory below; actual Summer Rescue state/card assembly rather than its incomplete SQLite mirror.

## Scope and transition
Native semesters, modules, cards, checklists, notes/evidence, logged hours/focus sessions, assessments, timetable sessions, materials/readers, overview/board/list/week/progress views, rescue, search, preferences and safe import/export. Timetable imports preserve dates, London times, recurrence and exclusions; unsupported input must be explained rather than guessed. Existing Summer Rescue stays at `/study-legacy` and its original document URLs stay available. Keep the source untouched until acceptance.

PostgreSQL is already running, with only the default database/role observed. Create fresh `lifeos` and `lifeos_test`, an owner role for schema work and a restricted app role for writes. Study owns schema `study`. Existing core SQLite data is not migrated in this stage; shared Calendar asks both core and Study. Broader Stage 1 core/import-worker/backup scheduling, account OAuth, university sign-in and actual new-semester content not supplied by Xar stay separate.

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
- [ ] Back up source JSON, SQLite via its backup API, assets/uploads/logs; `pg_dump` target before migration/import.
- [ ] Assemble actual client cards: baseCards → AML video-plan transformation → implicit resource links → saved overlays/added cards. Preserve hidden links and saved checklist/notes/evidence/hours.
- [ ] Preview/apply original semester modules/cards/materials/history/settings/notifications/snapshots, with source counts and field/content spot checks. Copy materials into native storage with integrity checks and preserved source URLs.
- [ ] Provide export/recovery; restore a dump into a fresh test target and compare counts/content.
- [ ] Native Study calendar provider replaces the old adapter when imported; no double counting, correct source links/date/time/completion rules.
- **Done when:** source records/materials are preserved and visible natively; repeat import is idempotent, edits survive, backup restore matches, source is unchanged.
- **Commit:** `[3-cp2] Import Study history and connect the shared calendar`.

### CP3: Timetable and final parity
- [ ] Manual timetable/assessments/materials inputs; validated JSON/CSV/ICS preview/apply with recurrence and exception handling.
- [ ] Schedule/day/week views and conflict/daily totals, true activity progress, timer execution context and rescue triage.
- [ ] Check every feature below; document any remaining parity explicitly, keep original accessible, and never silently replace the current plan with a newer private seed.
- [ ] Desktop/phone/all-ground visual review in an available browser; no connected browser means this stays pending, not passed.
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
Actual current-semester timetable/module content still needs user input/import; no dates are invented. Existing core remains SQLite temporarily and its broader PostgreSQL migration stays visible in STATUS. Browser visual QA remains pending if CUA has no browser. Importing a newer private seed is a separate decision, never an automatic source upgrade.
