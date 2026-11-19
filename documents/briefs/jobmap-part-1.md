# JobMap part 1: expired adverts, many at once, date and status filters

**Status:** approved by Xar on 19 November 2026 ("Start JobMap part 1"); built the same day. Objectives: TODO section AC (AC1–AC6).

## Scope (done)
- **Expired** status (`lib/store.mjs` STATUSES; kept with the archive via `OVER` in `lib/matching.mjs`). A passed closing date offers "Mark it expired" (Expired, outcome Missed deadline).
- **Many jobs at once:** `POST /api/jobs/bulk` (`store.patchMany`): up to 500 jobs, one revision check, one save and one recovery copy; answers each job's earlier values, which Undo sends back. Page: a tick box on each row, "Choose all in this list", then Archive, Mark expired, Set status, Set priority, Shortlist.
- **Filters in every view:** Status (finds every job with it, whatever the view), Closing date (today, tomorrow, this week to Sunday, next 7 or 30 days, passed, none), Date added (today, this week from Monday, last 7 or 30 days). Kept with the other saved filters.
- **Life OS:** Dismiss (status `not-needed`, kept, with Undo) on things waiting on you in the Inbox list, the bell, the Tasks page and the day's checklist.
- **Checks:** `tests/filters.mjs` (in `npm test`); the whole JobMap suite passes; Life OS render tests (tasks, day, inbox); a headless walk of JobMap and Tasks with saves answered in the browser; the Madder style looked at.

## Part 2 (next)
- The job's start date and possible end date (new fields, read from the advert where it says, by hand otherwise) with filters ("starts after September 2027", "fits the summer").
- More tests and a walk of JobMap as she uses it; fix what gets in the way.
- Xar's answer: should the 612 archived adverts (562 of them Missed deadline) become Expired? A data change, backed up first, through the new many-jobs save.
