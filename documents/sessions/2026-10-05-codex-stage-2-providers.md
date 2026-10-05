# 2026-10-05 · Codex · Stage 2 · CP1: read-only calendar providers

## Goal
Resume the interrupted Claude session at Xar's latest instruction: finish Calendar and Today before installing/migrating PostgreSQL. Record the order change and build a resumable brief.

## What I did
- Compared the pasted chat with the clean `main` checkout at `f156682`. STATUS still described Session 0, but the later conversation authorised starting work and then moved Calendar first. Claude's calendar workflow journal showed all five mapping tasks failed; there were no completed reports to reuse.
- Created `stage/2-calendar-today`, a two-checkpoint brief, and a new decision/roadmap entry. Kept the nested repository and PostgreSQL installation untouched.
- Added a shared civil-date utility, authenticated read-only calendar route, independent source providers and source status reporting. The providers use existing core reads, GET-only attached APIs and Cardiff's public research CSV; no source page is opened.
- Included configured budget-month starts, actual subscription recurrences, dated shopping/meal plans, shortlisted/applied job deadlines and explicit follow-ups, unfinished study starts and deadlines, explicit exams, dated core entries and annual birthdays.
- Preserved complete Cardiff source ID knowledge so the browser will not resurrect an old snapshot for an event cancelled or rescheduled outside the requested range.

## Files and commits
- The commit carrying this note: `[2-cp1] Add read-only calendar providers across attached apps`.
- `hosting/calendar/`, `hosting/calendar-route.mjs`, `hosting/app.mjs`, `code/life-os/shared/calendar.js`, the stage brief, ROADMAP and DECISIONS.

## How I checked it
- Shared-date, isolated HTTP-route and provider fixture tests: authentication, malformed and oversized ranges, DST/month edges, annual dates, recurrence anchors, source failures/timeouts, CSV quoting and GET-only requests. Tests import no production database module.
- Direct live provider reads: all seven source groups ready. October: 53 candidates (41 public Cardiff options before browser-choice filtering, 7 career deadlines, 4 renewals, 1 budget-month start). July–August confirms Study and core/birthday mapping, with 244 candidates.
- Source-file hashes checked before/after direct provider reads; all five protected files unchanged. Counts remain 7 entries, 1 person, 12 spaces.
- Final live routed checks and exact final test totals are recorded in the next CP2 note and STATUS, after the normal host restart.

## Data touched
No schema/data migration or source save. Made a SQLite backup including WAL through Node's SQLite backup API: `Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791206591099.db`. The existing full Session 0 backup remains. Normal server startup still reseeds spaces in its existing code; counts and entry/person content are checked after restart. Local verification hashes and scripts stay in ignored `.runtime/`.

## Problems and surprises
The previous status was stale relative to the pasted chat. Independent review caught missing-date defaults, a JavaScript array `entries` collision, nonexistent hrefs, long study spans, and stale Cardiff snapshots; these were corrected before committing. Browsers are not connected to CUA in this session, so visual phone/ground verification must remain explicit acceptance work.

## Small decisions and questions for Xar
Keep attached links at their supported app/section level; do not invent per-record deep links. Skip undated recurrence prose and ambiguous London clocks rather than choosing a time. Build a connections/installation guide alongside the calendar, without installing or authorising accounts.

## Next step
Finish CP2 in the same branch: Calendar/Today/Court UI, preserve `/ledger`, build and test, restart once, live smoke checks, source hashes, then a new session note and rewritten STATUS. Do not start PostgreSQL or native Study until Calendar feedback/acceptance is resolved.
