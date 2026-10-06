# Life OS: status

**Updated 6 October 2026 by Codex.** Branch: stage/3-study-hub; main untouched. Calendar implementation complete. Native Study CP1 built; CP2 import/recovery and CP3 richness/visual review are next. Xar directly authorised this order.

## Now
Active brief: briefs/stage-3-study-hub.md. Study supports general studying, dynamic semesters/modules and optional rescue/exam workflows. Native /study has cards/checklists/notes/evidence/hours, modules, board/list/week, materials/readers, timetable/assessments, focus/progress/rescue, notifications/preferences/search/import/export. Fresh lifeos/lifeos_test and restricted owner/app roles exist; Study owns its PostgreSQL schema. Existing core remains SQLite temporarily.

CP1: 66 safe fixtures, 2 real view-render checks, 8 guarded PostgreSQL checks; both official builds and current asset/routes checks pass. Blank page fixed (overview count/array mismatch), confirmed visually. Windows build script now stops on failed folder changes. Native production still empty before reviewed import. Latest preview: 352 records, 128 cards, 503 checklist items, 211 materials, 949 material links; zero conflicts.

## Exact next step
Save CP1, apply reviewed original-data import via API; verify repeat/source integrity and restore a dump into a fresh isolated target. Finish the rich studying tools Xar flagged: reasoned picks, pace/hour insights, connected focus workbench, editable practice tools, grouped shelves. Then responsive/grounds review. Source remains /study-legacy; no retirement/main merge until acceptance.

**Next prompt:** Continue Stage 3 from its latest note and brief, finishing import/recovery and rich feature parity without hardcoding a semester.

## How to see it
http://127.0.0.1:47850/study; /calendar, /today, /court and /ledger remain. Start Life OS.cmd starts the host; Build Life OS.cmd builds both apps.

## Waiting / limits
Xar acceptance pending. CUA opens main origin but blocks the separate test origin; synthetic saves stay on guarded lifeos_test. PWA/Career playbook, universal imports/core migration and off-laptop backups remain separate. No new-semester timetable supplied. Do not run hosting/app.test.mjs or old query tests (reseed live DB); original Study auto-saves on opening.

## Data
Latest source/core SQLite-aware backup: ../Life_OS_backups/study-2026-10-05/source-1791293355218; 211 files hash-verified, 140,141,241 bytes. Pre-schema dumps preserved. Source changed since yesterday; latest backed up, not reset. Core entry/person content/counts unchanged: 7 entries, 1 person, 12 spaces. No dummy production writes; private evidence/config ignored in .runtime.

## Last five sessions
- 2026-10-06 Codex Study CP1: sessions/2026-10-06-codex-stage-3-workspace.md.
- 2026-10-05 Codex Calendar final audit: sessions/2026-10-05-codex-stage-2-final-audit.md.
- 2026-10-05 Codex Calendar resumed: sessions/2026-10-05-codex-stage-2-resumed-review.md.
- 2026-10-05 Codex Calendar CP2: sessions/2026-10-05-codex-stage-2-calendar-today.md.
- 2026-10-05 Codex Calendar CP1: sessions/2026-10-05-codex-stage-2-providers.md.
