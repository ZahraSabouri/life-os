# 2026-10-06 · Codex · Stage 3 · CP1

## Goal
Continue after the reset/shutdown: Calendar, then native Study. Xar reaffirmed general studying for all modules/students, and preserving Summer Rescue's rich tools.

## What I did
- Created Stage 3 from main, then fast-forwarded completed Calendar; main is untouched. Built native reusable semesters/modules, rich cards/checklists/notes/evidence/hours, materials/readers, focus/rescue/progress, timetable/assessments, notifications/preferences/search and safe import/export.
- Created fresh PostgreSQL project owner/app roles and databases; no cluster login/listener or data-directory changes. Backup-first numbered migrations, revisions/history and preview/apply protect writes.
- Source import uses actual transformed client cards/links plus saved overlays, rather than the incomplete SQLite mirror. All original folders remain.
- Fixed blank Study page (overview count treated as a list), added real view-render checks; fixed Windows build root path so a failed directory change cannot build the wrong app.
- Reviewed malformed imports, changed preview placement/windows, append-only refreshed feeds, full-size uploads and material/module ownership.

## Files and commits
Checkpoint: `[3-cp1] Build native Study workspace on PostgreSQL`. Code lives under backend/src/modules/study, frontend/src/components/study and hosting/study; configuration/private data stay ignored.

## How I checked it
66 safe fixtures; 2 SSR tests render every view empty/populated; 8 guarded app-role PostgreSQL checks pass (fresh-pool persistence, stale conflicts/history, parents, idempotency/backups, actual transaction rollback, soft-delete/export and denied DDL). Both official builds/current asset-route checks pass. CUA showed the corrected overview. Browser blocks the separate test origin, so production was not used for dummy UI saves.

## Data touched
Frozen 0001_study.sql applied to fresh lifeos/lifeos_test after dumps; test records soft-deleted by normal repository writes. Latest source/core SQLite-aware backup: ../Life_OS_backups/study-2026-10-05/source-1791293355218. Copied/verified 211 files, 140,141,241 bytes. Native production remains empty before CP2; latest preview: 352 records, 128 cards, 503 checks, 211 materials, 949 visible material links, zero conflicts. Source JSON changed since yesterday; latest version preserved/backed up, not reset. Core unchanged: 7 entries, 1 person, 12 spaces.

## Problems and decisions
Source reset normalizer is not reused. General study is the workspace; rescue/campaign content is editable data. Browser became available; isolated test origin remains blocked. PWA/Core and Career playbook keep their domain boundaries. Original pace formulas need editable targets rather than assumed exam dates. Xar's review found the new workspace needs more richness; CP3 will add reasoned study picks, plan/hour trends, connected focus workbench, practice editors and grouped shelves before calling parity done.

## Next step
Apply reviewed original-data import through the authenticated API; verify idempotency/source hashes/full dump restore, then finish richness and responsive browser review. No main merge/source retirement until Xar accepts.
