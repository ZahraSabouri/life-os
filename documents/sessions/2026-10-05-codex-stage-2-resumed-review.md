# 2026-10-05 · Codex · Stage 2 · CP2 resumed review

## Goal
Resume after Xar shut the computer down, verify the saved checkpoints, and finish concrete Calendar/Today issues before visual acceptance.

## What I did
- Confirmed branch `stage/2-calendar-today` and both saved commits survived, with no initial uncommitted changes. Restored the host using `node launch.mjs --no-browser` after a SQLite-aware backup.
- Fixed primary navigation at 761–1400px: wordmark/date occupy the first row, and navigation wraps on the second. Phone layout stays governed by its existing rules.
- Fixed misleading error displays: Calendar and Today show Loading/Unavailable instead of zero counts or clear-schedule messages after failed reads. Partial-source counts say loaded, and empty panels explain unchecked dates. Core failure affects every area because core entries can belong to any area.
- Marked saved Cardiff copies in month chips and Court titles, alongside the existing agenda verification note. Month day badges and accessible labels also distinguish unknown/partial totals.
- Requested visual feedback from Xar. No connected CUA browser is available, so desktop/phone/all-ground visual checks remain pending. Stage 2 is not accepted, merged or pushed; PostgreSQL/account work has not started.

## Files and commits
- Existing `a9d584a` — `[2-cp1] Add read-only calendar providers across attached apps`.
- Existing `8f90386` — `[2-cp2] Connect Calendar and Today to all areas`.
- Commit carrying this note — `[2-cp2] Fix Calendar status and tablet navigation`.
- Calendar display helper, CalendarItems/View, TodayView, TheCourt, fixture tests, tokens.css, brief and STATUS.

## How I checked it
- **29 isolated tests passed**: `node --test code/life-os/shared/calendar.test.js hosting/calendar-route.test.mjs hosting/calendar/*.test.mjs code/life-os/frontend/test/calendar.test.js`.
- **Both production builds passed** through the existing `Build Life OS.cmd`, using the previously required sandbox escalation for Vite configuration access. Summer Rescue retains its existing large-chunk warning.
- Live `/api/calendar`: all seven source groups ready; 53 October candidates and 244 July–August candidates; authentication and invalid-range checks pass. Candidates include public Cardiff options before browser-choice filtering.
- `/calendar`, `/today`, `/court` and `/ledger` serve the current build and its three referenced assets. The compiled bundle contains the latest partial-results message.
- Core content/counts and four attached files match the pre-launch baseline. Study changed during the interval; investigation is recorded below. An independent immediate before/after API read left all five protected files unchanged.
- `git diff --check` passes. No existing live-database-initialising tests were run.

## Data touched
No agent source save, import or migration. The normal server startup reseeds existing spaces. Core counts remain 7 entries, 1 person and 12 spaces; entry/person content matches the resumed baseline.

SQLite backup, including WAL and integrity/count checks: `../Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791209451106.db`. Earlier calendar and full Session 0 backups remain intact. Original `.runtime/calendar-state-before.json` was preserved rather than reset after detecting the Study change.

## Problems and surprises
The final whole-session hash check detected a Study JSON change at 14:17:56.919 UTC; its SQLite mirror changed immediately afterward. Calendar's source adapter sends GET `/api/state`, whose existing handler only reads the file. Only the existing PUT handler saves JSON and mirrors SQLite. The Study hook automatically saves roughly 800ms after loading, with a new export timestamp and daily snapshot; the Vite build has no state-writing hook. Current `exportedAt` matches that save, while `state.updatedAt` predates the resumed baseline and the progress log has no new event. This is consistent with opening Study, but user confirmation is pending and there is no request log proving who triggered it. The old progress NDJSON does not contain full state snapshots, so the previous payload cannot be reconstructed from it; export-metadata-only changes cannot be proved. No file was restored or overwritten. Separate live calendar reads did not change any protected source file.

Visual layout, clicks and personal save behaviour remain unverified because no browser is connected. The CSS correction is based on the actual grid/minimum-width rules and compiled successfully; it still needs visual review.

## Small decisions I made, and questions for Xar
Kept these repairs within CP2's existing layout/error-state scope. Used conservative source totals and marked saved copies rather than implying all dates are known. Asked Xar whether she opened/edited Study and to review Calendar/Today filters, Agenda and grounds.

## Next step
Read STATUS and this note, check the branch and address Xar's visual feedback first. Confirm the Study save's context if she replies. Complete desktop/phone/all-ground checks when a browser is available. After Xar accepts Stage 2, follow WORKFLOW prompt 7 before the PostgreSQL foundation. Leave the existing PostgreSQL data directory and nested `.git` untouched.
