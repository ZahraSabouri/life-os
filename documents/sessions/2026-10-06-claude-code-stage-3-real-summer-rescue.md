# 2026-10-06 · Claude Code · Stage 3 · CP4: the real Summer Rescue becomes the Study hub

## Goal
Xar rejected the proposal in `2026-10-06-claude-code-stage-3-study-feedback.md` and corrected the direction: **the Study hub's structure is the Summer Rescue app's structure; the only difference is that new modules have no premade cards.** Bring the whole app and its data from the right folder; treat the summer cards, plans and evidence as her past entries; touch nothing in the Life OS frame; keep the calendar connection correct with nothing doubled. Modules do not span semesters, but a module can be duplicated with its planning into a new time frame.

## What I found
- **Everything so far was built from the wrong copy.** `summer-rescue-plan-app/` inside Life OS is a copy frozen on 6 July: saved state version 3, one card record, nothing done, a 391-byte log.
- **The real app** is `Documents\Apply\Applications\UK\Cardiff University\Data Science and Analytics\1. Spring 2026\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`, last saved 23 August: state version 9, 144 card records (141 done), 131 cards added by hand, 37 day logs, 36 snapshots, 183 resource progress records, 422 logged events, 394 study files. Its code is at commit `443a6d4` plus 15 uncommitted files, with about 90 source files the July copy lacks (Focus Room, Schedule, Review, Notes, Knowledge, rich text, catch-up, replan and more).
- Of the 131 hand-added cards, 102 are Health and 15 are Admin. These, with Job Hunt, the interview pages and the shopping list, are the "admin and health" Xar wants out of Study.
- The app reaches its server through one file, `src/utils/localStateFile.js` (`/api/state`, `/api/events`, `/api/resources`). Its built-in plan is imported by `App.jsx` and eight components. Both facts make CP5 and CP6 contained changes.

## What I did
- Copied the real app into `summer-rescue/` (647 files, 390 MB, plus `node_modules`): source, public files, study files, `local-data`. Left out: `.git`, build output, design tooling, the old `backup_*` files. The SQLite mirror was read through SQLite (integrity ok, counts equal). The original folder was only read; its state file hash is unchanged.
- Changed six absolute image and file addresses to use the app's base address. Built it for `/apps/summer-rescue/`.
- `hosting/app.mjs`: serves `summer-rescue/`; hands the app's local API only its own addresses. `Build Life OS.cmd` builds `summer-rescue`.
- Routes: `/study` shows the real app; the database-backed page is at `/study-native`; `/study-legacy` redirects to `/study`. Calendar links for database records go to `/study-native`.
- Marked the stale "Summer 2026" semester in the database as completed.
- Rewrote the plan in the brief as CP4 (done) to CP8; recorded the correction in `DECISIONS.md`; updated `README.md`.

## Files and commits
- The commit that adds this note: `[3-cp4] Make the real Summer Rescue the Study hub`

## How I checked it
- 96 server tests and 44 frontend tests pass (the isolated suites; nothing that touches real data).
- `GET /api/state` returns state version 9, revision 1062, 144 card records, 131 added cards.
- Life OS pages carry no security header from the app; `/court`, `/study`, `/study-native` answer 200.
- Headless Chrome with every save refused: `/study` shows the real app (132 of 166 cards complete, all its menus); Today's "Needs attention" shows 9 items, down from about 118.
- Calendar, next 60 days: 109 items, all seven sources ready, no repeated id, nothing with the same area, title and start twice. No study item dated before today.

## Data touched
- Read only: the original folder.
- New copy: `summer-rescue/local-data` (it will change as Xar uses the app; that is now the live Summer Rescue data).
- Database: one field, the "Summer 2026" semester's status, through the Study API.
- Untouched: `summer-rescue-plan-app/` (stale, no longer served), the Study database records, the other apps.

## Problems and surprises
- **Two stores until CP5.** Summer Rescue data lives in `summer-rescue/local-data` (the app's JSON file); this semester's timetable, assessments and materials live in PostgreSQL and show at `/study-native`. The database still holds the stale 6 July summer records, hidden from the calendar. Nothing was imported twice.
- The real app saves as soon as it is opened (day roll, notifications). That now writes to the Life OS copy, never to the original.
- Cards added in the Study hub before CP5 do not reach the Life OS calendar yet.
- `hosting/study/legacy.mjs` and `storage.mjs` still read the stale folder; they are replaced in CP5.
- `summer-rescue-plan-app/` and its nested `.git` can be deleted once Xar agrees; deleting is her step.

## Small decisions I made, and questions for Xar
- A new folder instead of overwriting the stale one, so nothing was replaced or deleted.
- `/study` opens the real app now, although it is not yet general, because that is the structure Xar asked for; the database page stays reachable so this semester's records are not lost from view.
- Deferred the real data's import into the database to CP5, when the app switches store, so the same records never exist in two live places.
- No questions that block CP5.

## Next step
CP5 in the brief: the adapter that lets the real app save into the Study database, starting with the round-trip test on the real state.
