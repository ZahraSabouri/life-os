# 2026-11-19 · Claude Code · JobMap · part 1

## Goal
"Start JobMap part 1" (TODO AC): Expired, acting on several adverts at once, closing-date filters, search and status filtering; plus her new point: "in 'waiting on you' i need another option like dismiss. not only 'done'".

## What I did
- JobMap store and server: `Expired` in STATUSES and in the archive group; `patchMany` and `POST /api/jobs/bulk` (≤500 jobs, one revision check and one save; returns each job's earlier values for Undo; status history kept).
- JobMap selection: `CLOSES_FILTERS`, `ADDED_FILTERS`, `closesMatch`, `addedMatch`; a chosen status finds every job with it from any view; "Closing date passed" finds closed adverts from All jobs.
- JobMap page: Status, Closing date and Date added filters beside the search in every view (the Applications-only status filter replaced), saved with the other filters; a tick box per row, "Choose all in this list", and a bar (Archive, Mark expired, Set status, Set priority, Shortlist, Clear) with Undo; "Mark it expired" on a passed closing date. Styles in `app/globals.css` and the Life OS skin sheet `hosting/skins/public/apps/jobmap.css`.
- Life OS: Dismiss (status `not-needed`) on things waiting on you: Inbox list (also in its compact form), the bell (was "Not needed"), Tasks cards and the day's checklist; Undo where the page offers it; Guide wording updated.

## Files and commits
- [jobmap-cp1] commit with the code, tests, brief, TODO, STATUS and this note.

## How I checked it
- `node --test tests/filters.mjs`: 5 pass; `npm test` (JobMap): exit 0. Type check: the same 6 errors before and after (existing, unrelated).
- Life OS render tests: tasks 7, day 5, inbox 11 pass.
- Built JobMap and Life OS; restarted Life OS (and with it JobMap); `POST /api/jobs/bulk` answers (a stale revision refused, nothing written).
- Headless walk with every save answered in the browser: All jobs 1,714; closes today 8, this week 55, passed 71; added this week 235; status Archived 612, Expired 0, Applied 4; the bar appears with two jobs chosen; Tasks shows Dismiss on all 8 things waiting on you, Inbox Waiting 8; no page errors. Madder style looked at; the bar now uses the style's panel colours.

## Data touched
None.

## Small decisions I made, and questions for Xar
- "Mark it expired" also records the outcome Missed deadline, as the old "Close it" button did.
- Question: should the 612 archived adverts (562 of them Missed deadline) become Expired?

## Next step
JobMap part 2 (start and end dates of the job, more tests and UX), or stage 8 CP2–CP3 (replanning), in Xar's order.
