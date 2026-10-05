# Life OS: status

**Updated 5 October 2026 by Codex.** Branch: `stage/2-calendar-today`. Calendar implementation complete; Xar directly authorised native Study next. Visual acceptance remains pending.

## Now
**Calendar and Today are built across the attached apps**, following Xar's later Claude chat: Calendar first, PostgreSQL afterward. The interrupted mapping jobs had failed; the stale Session 0 status has been replaced. Active brief: `briefs/stage-2-calendar-today.md`.

- CP1: read-only providers, shared London dates, authenticated `/api/calendar`, independent source statuses, catalogue-wide Cardiff IDs. Commit `a9d584a`.
- CP2: month/day/agenda, area switches, kind markers, Cardiff choices/Maybe, Today/week/attention and real Court strips. Ledger preserved at `/ledger`. Commit `8f90386`.
- Resumed review: restored the host after shutdown; fixed tablet navigation wrapping and false empty/zero summaries after failed calendar reads. Partial results are qualified; saved Cardiff copies are marked in the grid and Court too. Commit carrying this status: `[2-cp2] Fix Calendar status and tablet navigation`.
- Final audit: Court clock/greeting/dates now agree with the London schedule on any device timezone. **31 isolated tests**, both production builds and live routed Calendar/build checks pass. **Browser visual/click/save checks remain unverified** because no browser is connected to CUA.

## Exact next step
Create the Stage 3 native Study brief/branch and continue the build, as Xar explicitly requested. PostgreSQL 18.6 is already running locally; only its default database/role exists. Use fresh project databases/roles, preserve the SQLite core, and keep Summer Rescue available during parity/migration. Calendar feedback can still be fixed; Stage 2 is not merged or marked visually accepted.

**Next prompt:** Continue native Study Hub from its Stage 3 brief and latest session note. Back up before schema/import work, preserve source data, and keep each checkpoint runnable and documented.

## How to see it
Host is running: http://127.0.0.1:47850/calendar and `/today`; `/court` has the new Today strips; `/ledger` keeps recent capture/history. Restart if needed with Start Life OS.cmd. Account setup and PostgreSQL self-install checklist: `CONNECTIONS_SETUP.md`.

## Waiting on Xar / known limits
- Visual review/acceptance; no real personal save was made for testing. Study has no saved October timetable to supply. Source links generally open their app/section.
- Today attention covers the last 350 days and next 14; Ledger the latest 100 entries. Cardiff choices belong to this browser/origin; removed listings show a marked saved copy.
- PostgreSQL verified via its client; installation/login is no longer a blocker. The broader core foundation, data-folder/off-laptop backup choices and nested `.git` housekeeping remain separate work.
- Existing `hosting/app.test.mjs` and backend query tests still initialise the live DB; do not run them. New calendar tests use fixtures. Study's original page saves on opening. Existing sample Court door lines and automation folder targets remain foundation/housekeeping work.

## Data
No migration/import or agent save. Core entry/person content and counts unchanged: 7 entries, 1 person, 12 spaces. Resumed backup (WAL included, integrity checked): `../Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791209451106.db`; earlier and Session 0 backups preserved. Study's saved JSON changed at 14:17:56 UTC during review; its existing page auto-saves on opening, and user confirmation is pending. The other four protected files match the resumed baseline. A separate before/after live calendar read leaves all five files unchanged. Private evidence stays ignored in `.runtime/`.

## Last five sessions
- 2026-10-05 · Codex · Calendar final audit: `sessions/2026-10-05-codex-stage-2-final-audit.md`.
- 2026-10-05 · Codex · Stage 2 resumed review: `sessions/2026-10-05-codex-stage-2-resumed-review.md`.
- 2026-10-05 · Codex · Stage 2 CP2: `sessions/2026-10-05-codex-stage-2-calendar-today.md`.
- 2026-10-05 · Codex · Stage 2 CP1: `sessions/2026-10-05-codex-stage-2-providers.md`.
- 2026-10-05 · Claude Code · Session 0: `sessions/2026-10-05-claude-code-session-0-setup.md`.
