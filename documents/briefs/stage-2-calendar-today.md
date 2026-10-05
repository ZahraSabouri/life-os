# Stage 2: Calendar and Today across the attached apps

**Status:** implementation authorised by Xar in the interrupted Claude chat, 5 October 2026; awaiting hands-on acceptance.
**Branch:** `stage/2-calendar-today`

## Goal
One calendar and Today view show the dated things already held by Life OS, Study, Career, Money, Home and Cardiff Life. Each item keeps its source and opens the relevant section. This goes before the PostgreSQL foundation at Xar's request; it uses the existing stores through read-only providers.

## Read first
`AGENTS.md`, `STATUS.md`, `ROADMAP.md`, `Life_OS_Architecture.md` sections 5 and 15, the latest session note, and `hosting/app.mjs`. The pasted Claude conversation ends with Xar asking to finish the calendar today; Claude agreed to this order change but hit its limit during source mapping. Xar had already asked it to start building, document its work and leave a clear pickup point, overriding the ordinary brief-approval gate for this continuation.

## Scope
Core dated entries and birthdays; unfinished Study card starts/deadlines and explicitly configured exams; shortlisted/applied Career deadlines and explicit follow-ups; Money subscription renewals and budget month starts; dated Home shopping and meal plans; Events chosen Going or Maybe in this browser, with an optional available-events layer. Month grid, date/agenda detail, area switches, kind labels, source links, Today/this week/attention, and the Court's Today strip.

PostgreSQL installation/migration, native Study, account OAuth, timetable imports, automatic scheduling, editing attached records from Life OS, calendar export and a week grid remain later work. Keep the existing ledger accessible. Existing standalone pages may save when opened; loading the calendar must never open those pages.

## Checkpoints

### CP1: Shared dates and read-only calendar providers
- [x] Build authenticated `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` with independent source statuses and a bounded inclusive range.
- [x] Namespace stable item IDs and return `area`, `kind`, `title`, `start`, `end`, `all_day`, `href`, optional `location` and `meta`.
- [x] Preserve civil all-day dates; convert timed items to Europe/London dates correctly, including daylight saving. All-day ends are inclusive; timed ends exclusive.
- [x] Exclude missing/invalid dates and inactive records; expand actual subscription rules, without inventing dates from prose. Events remain candidates until browser choices filter them. `knownEventIds` includes the complete research catalogue to prevent stale snapshots for rescheduled/cancelled events.
- **Done when:** source fixture tests pass, unavailable sources leave other areas usable, and real API reads do not change attached state or revisions.
- **Verify:** `node --test code/life-os/shared/calendar.test.js hosting/calendar/*.test.mjs`; a separate router test with injected loaders; read-only live API smoke checks.
- **Commit:** `[2-cp1] Add read-only calendar providers across attached apps`

### CP2: Calendar, Today and the home strip
- [ ] Use the shared response in month/day/agenda views with area switches and fixed/plan/deadline/reminder styling.
- [ ] Read Cardiff choices without modifying localStorage; show Going and visibly tentative Maybe, and offer available events separately.
- [ ] Show Today, this week and relevant attention, with source links, clear loading/empty/error states, and core task completion through the existing API.
- [ ] Preserve Gregorian/Persian display, grounds, capture and existing ledger. Check desktop and phone-width layouts.
- **Done when:** `/calendar`, `/today` and `/court` use real provider data; filtering works; source failures and malformed browser choices are visible; the built pages work at phone width.
- **Verify:** frontend production build, pure frontend helper tests, browser checks of these three routes without opening Study or saving personal records.
- **Commit:** `[2-cp2] Connect Calendar and Today to all areas`

## Data safety
No schema or data migration, no source-file edits and no imported records. GET-only source requests. Fixture tests never import the production database module. Do not run the existing `hosting/app.test.mjs` or backend query suite, which initialise the real database. Before the normal host restart, snapshot the core via SQLite (including WAL) because its existing startup reseeds spaces; preserve the full Session 0 backup. Check attached state hashes/revisions before and after read-only API calls. Do not print personal records into logs or commit them.

## Acceptance checklist for Xar
1. Open `/calendar`. Move between months and select a day; English and Persian dates should remain visible.
2. Switch Study, Career, Money, Home, Events, Core and People layers on/off. Only the selected areas should appear.
3. Select Saved plans for Events; Going and Maybe reflect choices at this Life OS origin. Available options shows unchosen public events separately.
4. Open `/today`; compare Today, the next seven days and attention with the attached apps. Items open their source section. Completed or archived work should not demand attention.
5. Add an event with an explicit date if desired, and complete a core task if present. External items remain editable in their original apps.
6. Try Calendar and Today at phone width and with each ground. `/ledger` still shows recent captured entries.
7. Report edits before accepting Stage 2. PostgreSQL is the next foundation task; native Study follows it.

## Risks and open questions
The attached Study app is still a summer campaign; it cannot supply a new-semester timetable that has never been imported. Cardiff choices are specific to this browser/origin; missing or invalid saved choices must be reported. Most attached apps support section links rather than opening a specific record. Account connection instructions are in `../CONNECTIONS_SETUP.md`; no OAuth connection is implemented by this checkpoint.
