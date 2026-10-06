# 2026-10-07 · Claude Code · Stage 3 · CP5 to CP8 (Study hub live on the database)

## Goal
Xar needs to add cards for her autumn modules inside the Study hub and see them on the Life OS calendar, with nothing doubled. Make the Summer Rescue app the general Study hub (semesters and modules as data, nothing premade, no life or admin areas, not called Summer Rescue) and switch her live app to it.

## What I did
- **One workspace per semester.** The app still saves its whole state in one request, now with `?semester=<id>`; the server keeps it in `study.hub_workspaces` (with earlier copies in `hub_versions` and the app's event log in `hub_events`). After every save the cards are written as ordinary Study records, so the calendar reads them like any other record.
- **Entry screen.** The app opens on a list of semesters (add, edit, remove, open). The app's code loads only after a semester is open, because its lists (modules, prepared cards, schedule) are worked out once at load. Each semester has its own browser storage.
- **Modules as data.** Module definitions live on the module records. Semester setup adds, edits, removes and duplicates them. A module with no picture gets a plain one.
- **Not study, not here.** Life & Admin, Admin & Dates, Job Hunt, the interview hub, Shopping, the weekly routine cards and the intro screen are out. The import keeps their data aside in the semester's workspace.
- **Wording.** Study hub everywhere; Cardiff links replaced by "Change semester"; exam dates and countdown come from the semester (no countdown when no date is known); the greeting no longer names a person.
- **Her data.** Summer brought in as a past semester from the app's last saved file. The 4 autumn cards that were plain records moved into the hub.

## Files and commits
- `732f3a8` [3-cp5] Study hub: semesters and modules as data, saved in the Life OS database
- This note, STATUS, the brief and DECISIONS: the commit after it.
- Server: `hosting/study/hub/` (`store`, `router`, `cards`, `duplicate`, `study-only`), `hosting/app.mjs`, `hosting/study/runtime.mjs`, `hosting/study/calendar.mjs`, migrations `0002_hub.sql` and `0003_hub_state_keeps_order.sql`, `code/life-os/backend/src/migrate.js`, `repository.js` (`syncProjected`).
- App: `summer-rescue/src/hub/` (`session.js`, `HubGate.jsx`, `SemesterSetup.jsx`, `hub.css`), `src/data/plan.js`, `studyModules.js`, `knowledgeSeeds.js`, `constants.js`, `App.jsx`, `state/`, `utils/examDates.js`, `utils/localStateFile.js`.
- Scripts: `scripts/bring-in-summer-rescue.mjs`, `scripts/adopt-study-cards.mjs`.

## How I checked it
- 93 Study and calendar tests pass (`node --test` on the files under `code/life-os/backend/src/modules/study/` and `hosting/study/`, `hosting/calendar/`, `hosting/calendar-route.test.mjs`). `hosting/app.test.mjs` and the old query tests were not run (they write to the real core database).
- Rehearsal on a copy of the live data in `lifeos_test`, on a private server (port 47860), driven in headless Chrome: opened Autumn 2026, visited all 16 views, opened a module's Materials tab, added a card, went back to Summer 2026. No page errors. Calendar on the copy: 60 study items, no repeated id, no repeated title and start, nothing from the finished summer.
- Earlier the same night, on an empty test semester: add a semester, add a module, add a card; the card reached the calendar once.
- After the switch, on the live server: the semester list shows inside Life OS; calendar 1 October to 30 November has 116 items, 58 from Study, no repeated id and no repeated area, title and start.
- **Not checked:** duplicate module (never run); a save conflict between two tabs in the browser; the app's own tests in `summer-rescue` (not run, many describe the old built-in plan); phone width; the four Life OS styles.

## Data touched
- Live database `lifeos`, each step after a dump in `../Life_OS_backups/study-2026-10-06/`:
  - Migrations 0002 and 0003 (three new tables).
  - Summer import: reused the "Summer 2026" semester; removed its 331 stale July records (114 cards, 5 modules, 211 materials, 1 progress), all restorable; added 4 modules, 33 cards (29 done), 3 exam dates, 426 events. Kept aside: 133 cards, 100 schedule rules, 1 module, 6 notes, 13 shopping items.
  - Autumn: 4 plain cards added to the hub, their plain records removed (restorable).
- Counts now: 2 semesters, 7 modules, 42 cards, 6 assessments, 81 sessions, 76 materials.
- `lifeos_test` was replaced by a copy of the live Study data for the rehearsal, then migrated and imported the same way.
- The app's old saved file and event log were copied to `../Life_OS_backups/study-hub-switch-2026-10-07/` and are no longer written.

## Problems and surprises
- The first try-out showed a semester with 4 cards instead of 33 and no modules: the error screen imported the storage key from the state file, which loaded the semester's lists before a semester was open. Fixed, and the app now refuses to open a semester if that ever happens again.
- Git Bash rewrites `--base=/apps/summer-rescue/` into a Windows path. Build from `Build Life OS.cmd`, or with `MSYS_NO_PATHCONV=1`.
- The live server was already stopped when I came to stop it.
- The brief asked for an adapter that turns the saved state into records and back. I kept the state whole and derive the records one way instead (see DECISIONS). The round-trip test in the brief therefore does not exist.

## Small decisions I made, and questions for Xar
- Reloading the page stays in the semester; coming into the Study hub afresh shows the list, unless "open the semester I used last" is ticked.
- A module can only be removed when it has no cards left.
- The 5 university reminders that belong to no semester stayed plain records (on the calendar, not in the hub). Should they join Autumn 2026 as "General" cards?
- Where should the set-aside life data live later?

## Acceptance list for Xar
1. Study hub opens on "Which semester?" with Autumn 2026 and Summer 2026.
2. Autumn 2026: three modules in the menu; each has its cards and Materials; Schedule shows this week's classes.
3. Add card (module, due date) → it is on the board, and on the Life OS calendar on that date, once.
4. Tick it done → it leaves the calendar.
5. Semester setup: add a module of your own; it appears in the menu, empty.
6. Summer 2026: the summer's cards, notes, evidence and focus history are there; no Health, Admin, Job Hunt or Shopping.
7. Change semester returns to the list.

## Next step
Run "Duplicate module" on `lifeos_test` and fix what breaks, then write tests for `hosting/study/hub/`. The clean-up list is in STATUS under "Known problems and limits".
