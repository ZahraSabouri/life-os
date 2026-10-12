# 2026-10-12 · Claude Code · Stage 2c · CP3 to CP6: the Court without the day, notices, repeating plans, the week planner, eight weeks

## Goal
Xar: "go ahead and implement what's left. we also need a sorta notification for the whole app, not just study. then also remove today from court and keep in the today tab." What was left: job time as a repeating plan, the week planner, progress over more than a week.

## What I did
- **CP3.** The day's path is off the Court in all four styles. `DayPanels` takes a layout; the Court's panels stand three across (Study and Notes, Jobs, Home); Indigo keeps Notes in its rail.
- **CP4.** Notices: `hosting/notices/service.mjs` (`GET /api/notices`), the bell and its list, seen marks, the computer's own notifications as her choice. A `settings` table in the core with `GET`/`PUT /api/settings/:key`; the sound links moved there.
- **CP5.** Repeating plans (`shared/routines.js`, entry kind `repeat`), "repeat" on the add line, acting on one day of a repeating plan from Today and the planner; `/planner`; `scripts/job-time-as-repeating-plans.mjs` run on live; the host shares concurrent reads.
- **CP6.** Review: eight weeks in four small charts, the semester's cards, and her aims.
- The top bar stays on one line down to 1280 px (the date gives way below 1420; before today the menu already took a second row below 1400).

## Files and commits
- `44b9817` [2c-cp3] `TheCourt.jsx`, `DayParts.jsx`, `styles/day.css`
- `43b19f1` [2c-cp4] `hosting/notices/service.mjs` (+ test), `shared/settings.js`, `backend/src/routes/settings.js`, `backend/src/migrations.sql`, `lib/settings.js`, `lib/notices.jsx`, `components/NoticeBell.jsx`, `lib/focus.jsx`, `styles/focus.css`, `styles/skins.css`, `hosting/app.mjs`
- `d9e8c25` [2c-cp5] `shared/routines.js`, `backend/test/routines.test.js`, `shared/entryTypes.js`, `hosting/calendar/mappers.mjs` (+ test), `hosting/day/service.mjs`, `hosting/review/service.mjs`, `hosting/app.mjs`, `lib/plans.js`, `lib/day.js`, `lib/useDayPage.js`, `lib/useCalendar.js`, `components/PlannerView.jsx`, `styles/planner.css`, `scripts/job-time-as-repeating-plans.mjs`
- `fef0ecf` [2c-cp6] `components/ReviewView.jsx`, `styles/review.css`
- All on `stage/4b-one-look`, my own paths only.

## How I checked it
- Tests: 91 pass (the earlier set plus `hosting/notices/service.test.mjs` and `code/life-os/backend/test/routines.test.js`).
- **Try-out, with every write caught in the browser and read back** (the try-out shares the real core database):
  - The bell: today's four real notices, grouped; "seen" on one, then all; opening Focus shuts it. With notifications granted and a made-up class six minutes ahead: one notification for the class, one for the day's summary, none twice after twenty more seconds; nothing said before she switches it on.
  - The planner: add to a day with and without a clock time; tick; move by menu and by dragging (the clock time is kept); one day of a repeating plan ticked (one entry with `details.routine`) and moved (a cancelled mark for its own day and a plain plan on the new one); a repeating plan made from the line ("every Mon and Fri at 17:45 to 20:45, from today until Fri 13 Nov"); Stop and Remove.
  - The eight-week charts with made-up weeks: column heights and the aim's line measured on the page share one scale.
  - Every new piece in each style, Modern dark, and at 390 px: nothing outside its box, no sideways scroll.
- **Live:** every page loaded fresh in Modern light and dark, Madder, Indigo and Paper: no errors, nothing "could not be read", bell and Focus on every page. Seven requests of a page fired together four times: all parts present, 0.3 to 0.9 s for the lot (before the shared reads, parts went missing).
- **The job-time script:** previewed without writing, then written, then run again (made nothing). Checked against the study plan's file: each of its 77 days has exactly one job block at the reserved clock time (14 single, 63 from repeating plans), none on other days.

## Data touched
- **Core database (live):** a `settings` table added (empty; nothing was written to it by me). Eight entries of kind `repeat` added by `scripts/job-time-as-repeating-plans.mjs`. Entries before: 154; after: 162.
- **Backups:** `Life_OS_backups\core-2026-10-12\life-os-before-settings-table-1791837510337.db` and `…\life-os-before-repeating-job-time-1791838394185.db` (whole copies made by SQLite, 154 entries each).
- Study, Budget, JobMap: nothing written.
- The try-out is stopped; `dist-next` and `.runtime/hub-dev/copies` removed.

## Problems and surprises
- **"routine" was taken.** The body room already has an entry kind `routine` (a care routine). My first version reused the name and was silently overridden by the existing definition; a test caught it. The kind is `repeat`.
- **A week showed no study blocks for a moment.** With the bell added, one page load asks the host for the day, two calendar ranges, the notices and (on Review) three reviews; each read Study, JobMap (5 MB) and Budget for itself and one timed out. Requests that arrive together now share one read of each part; the calendar gives a part 8 s; `useCalendar` asks again when a part is missing; the planner says when a part could not be read.
- **Friday's job hour changes on 20 November** (17:45 until 13 November, 18:45 from the 20th), because MAT021 teaching starts on the 16th. The repeating plans follow the study plan's file, so this is kept.
- Reading "remove today from court" narrowly (the path, not the panels) is my judgement; it is recorded as a question in `TODO.md`.

## Small decisions I made, and questions for Xar
- A day of a repeating plan that goes by untouched just lapses; it is not listed as "left unticked".
- A repeating plan with a clock time is time set aside (it can be ticked); without one it is a thing to do that day.
- The bell does not count the day's whole timetable, only what is on now or starts within the hour.
- Nothing asks for notification permission until she ticks "Also tell me on this computer".
- **Questions:** did she mean the Study, Jobs, Home and Notes panels to leave the Court too? Which notices are noise? What does she aim at (set on Review)?

## Next step
Ask her to use it for a day. Then: marking a job "applied" from the day (through JobMap's own save), editing a repeating plan in place, and thinning the top bar.
