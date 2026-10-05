# Life OS: status

**Updated 5 October 2026 by Codex.** Branch: `stage/2-calendar-today`. Checkpoints committed locally; Stage 2 awaits Xar's visual review and acceptance.

## Now
**Calendar and Today are built across the attached apps**, following Xar's later Claude chat: Calendar first, PostgreSQL afterward. The interrupted mapping jobs had failed; the stale Session 0 status has been replaced. Active brief: `briefs/stage-2-calendar-today.md`.

- CP1: read-only providers, shared London dates, authenticated `/api/calendar`, independent source statuses, catalogue-wide Cardiff IDs. Commit `a9d584a`.
- CP2: month/day/agenda, area switches, kind markers, Cardiff choices/Maybe, Today/week/attention and real Court strips. Ledger preserved at `/ledger`. Commit `8f90386`.
- Resumed review: restored the host after shutdown; fixed tablet navigation wrapping and false empty/zero summaries after failed calendar reads. Partial results are qualified; saved Cardiff copies are marked in the grid and Court too. Commit carrying this status: `[2-cp2] Fix Calendar status and tablet navigation`.
- Verified: **29 isolated tests**, both production builds, live API authentication/ranges, all seven source groups and four served pages/assets. **Browser visual/click/save checks remain unverified** because no browser is connected to CUA.

## Exact next step
Xar tries Calendar/Today using the acceptance checklist in the brief and reports edits or accepts Stage 2. Next agent checks this branch and the latest note, fixes feedback first, and completes browser/phone/ground checks when available. Stage 2 is not merged/accepted. After acceptance use WORKFLOW prompt 7, then plan/verify Stage 1a PostgreSQL, followed by native Study.

**Next prompt:** Review Life OS Stage 2 using its brief and latest session note; verify desktop/phone/all grounds and fix any Calendar/Today issues before stage acceptance. Do not migrate the database yet.

## How to see it
Host is running: http://127.0.0.1:47850/calendar and `/today`; `/court` has the new Today strips; `/ledger` keeps recent capture/history. Restart if needed with Start Life OS.cmd. Account setup and PostgreSQL self-install checklist: `CONNECTIONS_SETUP.md`.

## Waiting on Xar / known limits
- Visual review/acceptance; no real personal save was made for testing. Study has no saved October timetable to supply. Source links generally open their app/section.
- Today attention covers the last 350 days and next 14; Ledger the latest 100 entries. Cardiff choices belong to this browser/origin; removed listings show a marked saved copy.
- PostgreSQL self-install/login check, data-folder choice and off-laptop backups. Nothing installed, reset or connected. Old nested `.git` remains Xar's Session 0 step.
- Existing `hosting/app.test.mjs` and backend query tests still initialise the live DB; do not run them. New calendar tests use fixtures. Study's original page saves on opening. Existing sample Court door lines and automation folder targets remain foundation/housekeeping work.

## Data
No migration/import or agent save. Core entry/person content and counts unchanged: 7 entries, 1 person, 12 spaces. Resumed backup (WAL included, integrity checked): `../Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791209451106.db`; earlier and Session 0 backups preserved. Study's saved JSON changed at 14:17:56 UTC during review; its existing page auto-saves on opening, and user confirmation is pending. The other four protected files match the resumed baseline. A separate before/after live calendar read leaves all five files unchanged. Private evidence stays ignored in `.runtime/`.

## Last five sessions
- 2026-10-05 · Codex · Stage 2 resumed review: `sessions/2026-10-05-codex-stage-2-resumed-review.md`.
- 2026-10-05 · Codex · Stage 2 CP2: `sessions/2026-10-05-codex-stage-2-calendar-today.md`.
- 2026-10-05 · Codex · Stage 2 CP1: `sessions/2026-10-05-codex-stage-2-providers.md`.
- 2026-10-05 · Claude Code · Session 0: `sessions/2026-10-05-claude-code-session-0-setup.md`.
- 2026-10-05 · Claude Cowork · planning: `sessions/2026-10-05-claude-cowork-planning-and-workflow.md`.
