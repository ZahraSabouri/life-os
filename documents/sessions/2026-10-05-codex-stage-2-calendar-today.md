# 2026-10-05 · Codex · Stage 2 · CP2: Calendar and Today

## Goal
Finish the Calendar-first continuation authorised in Xar's interrupted Claude chat, make it runnable, and leave a precise review/pickup point.

## What I did
- Connected Calendar to the shared read-only providers: month grid, selected day, agenda, area switches, kind markers and source links. Preserved Gregorian/Persian dates and the three grounds. Events have Saved plans, Going-only and available-options filters; Maybe is visible in grid and lists.
- Made Today show the day, next six days and attention: unfinished core tasks/Study deadlines, explicit follow-ups, coming deadlines and renewals. Core task Done uses the existing PATCH API; external records open their source apps.
- Updated the Court Today strips in every ground to provider data, with source errors/loading/empty states. Preserved recent capture history at `/ledger`, including linked entry anchors and an explanation for links outside the latest 100 entries.
- Added safe browser-choice reads, complete-catalogue de-duplication, clearly marked snapshots for truly missing public listings, overnight/DST handling and date refresh across London midnight. Nothing writes Cardiff choices.
- Added `CONNECTIONS_SETUP.md`: assistant connectors versus future native Life OS OAuth, verified university calendar export routes and a PostgreSQL self-install checklist. No accounts were authorised and no PostgreSQL installation/reset occurred.
- Left the host running with the new API and built frontend at port 47850.

## Files and commits
- `a9d584a` — `[2-cp1] Add read-only calendar providers across attached apps`.
- The commit carrying this note — `[2-cp2] Connect Calendar and Today to all areas`.
- Frontend components, calendar helpers/hook/tests, App/CourtLayout routes, CSS, connection guide, stage brief, inventory and STATUS.

## How I checked it
- **26 isolated tests passed**: `node --test code/life-os/shared/calendar.test.js hosting/calendar-route.test.mjs hosting/calendar/*.test.mjs code/life-os/frontend/test/calendar.test.js`.
- **Full Windows build passed** using `Build Life OS.cmd`, both core and Summer Rescue. Initial sandbox execution failed on Vite ancestor-directory access; the identical existing build ran successfully outside the sandbox. The attached Study bundle retains its existing large-chunk warning.
- Normal stop/start via `node launch.mjs --stop`, then `node launch.mjs --no-browser`. No Study document was opened.
- **Live API**: all seven source groups ready; October 53 candidates, July–August 244; correct item shape/unique IDs/supported href routes. Unauthenticated requests return 401; invalid ranges return 400. Public Cardiff candidates are filtered by browser choices before display.
- **Live built routes**: `/calendar`, `/today`, `/court`, `/ledger` all serve the exact current dist index and three referenced JS/CSS assets.
- **Data invariants**: five protected source-file hashes unchanged, core entries/people content hashes unchanged; counts remain 7 entries, 1 person, 12 spaces. Pre-restart SQLite backup passes `PRAGMA quick_check` with matching counts.
- Independent code review found and corrected stale rescheduled snapshots, overnight snapshots, missing-date defaults, long Study spans and unsupported hrefs. Final review found no remaining concrete code blocker. `git diff --check` passes.

## Data touched
No migration, imports or personal save. The normal core server restart reseeds existing spaces as before; entry/person content and table counts remain unchanged. Backup from CP1 remains at `../Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791206591099.db`; Session 0 full backup preserved. Local verification scripts/hashes are ignored under `.runtime/`.

## Problems and limits
No browser is available in CUA, so visual desktop/phone/ground QA and actual click/save behaviour remain unverified. CSS and compile checks cannot replace that acceptance check. No real personal event or task was created/changed to test writes. Attention is bounded to the last 350 days and next 14; old overdue work remains in its source. Most attached source links open an app section, not a particular record. Legacy Study has no saved October timetable/exam data to invent. Existing query/app test suites remain unsafe for the real core DB and were not run.

## Small decisions and questions for Xar
Use explicit title/date event capture; preserve source edit workflows; distinguish planned attendance from fixed event time. Keep stage numbering while moving Calendar ahead of the foundation. Current implementation is ready for Xar's edits and visual review, not marked accepted or merged into main.

## Exact next step
Xar opens `/calendar` and `/today` and follows the brief's acceptance checklist, including phone width and all grounds. Next agent reads STATUS and this note, checks the branch and fixes reported Calendar issues first. If accepted, use WORKFLOW prompt 7 to merge/tag/push Stage 2; then plan/verify PostgreSQL Stage 1a and native Study afterward. Preserve the July PostgreSQL directory and nested `.git`; no database/account work is implied by Calendar acceptance alone.
