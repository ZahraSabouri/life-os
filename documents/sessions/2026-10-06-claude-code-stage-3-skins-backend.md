# 2026-10-06 · Claude Code · Stage 3 · CP3 (in progress)

## Goal
Continue from where Codex stopped mid-CP3. During the session Xar added: a style menu on every page, a fourth modern style unified across the app, then "finish the backend for Calendar and Study thoroughly today" and a report on data structure and functions.

## What I did
- Found Codex's CP3 work uncommitted (about 8,000 lines), never built into the running app and never looked at in a browser. Committed it as it stood before changing anything.
- **Styles.** Added the `modern` style and a shared palette per style (`frontend/src/styles/skins.css`). The style menu (`StyleSwitch.jsx`) is in the header of Court, Today, Calendar, Ledger, Study and the intro, and bottom-left over each framed app. Under modern the Court is a new responsive home (`ModernCourt` in `TheCourt.jsx`) with the shared header. Study reads the shared palette in all four styles (`study-skin.css`); its own light/dark switch is gone.
- **Study layout fixes.** Long module names stretched the sidebar past its column, covering the page on desktop and leaking onto the phone screen. Summary tiles used Summer Rescue's twelve-tile grid for five tiles.
- **Backend, new.** Restore a removed record; put an earlier version back; per-record history; removed-records list (History view shows both). Daily database dump at start and every 24 hours, never pruned. Folder discovery made safe (below). `GET /api/study/backups`, `POST /api/study/discovery/preview`.
- **Report:** `documents/Study_and_Calendar_Backend.md`.

## Files and commits
- `6f455f9` [3-cp3] Work in progress: Summer Rescue design transfer, folder discovery, focus workbench (Codex's work, saved)
- `46f965e` [3-cp3] Add the modern skin, a style menu on every page, and Study in all four styles
- This session's last commit: [3-cp3] Restore and roll back Study records, daily backups, safe folder discovery

## How I checked it
- 140 isolated tests pass: `node --test code/life-os/shared/calendar.test.js hosting/calendar-route.test.mjs hosting/calendar/*.test.mjs hosting/study/*.test.mjs code/life-os/frontend/test/*.test.js code/life-os/backend/src/modules/study/{schema,router,repository}.test.js`. Study render test: 2 pass. Frontend build passes.
- Guarded PostgreSQL suite on `lifeos_test`: 9 pass, including the new revert and restore (`LIFE_OS_STUDY_TEST_DB=lifeos_test node --test code/life-os/backend/src/modules/study/integration.test.js`). Synthetic records only.
- Live, read-only: calendar for October returns 84 unique items, all seven sources ready, no malformed items; bad ranges give 400, no token gives 401.
- Browser: headless Chrome through playwright-core with every non-GET request blocked. Looked at Study Overview and History (desktop and 390 px) in all four styles, the phone menu, the modern Court, Today and Calendar, and the style menu on the Madder Court and over Cardiff Life. Not looked at: the other Study views, dialogs, timer, workbench.
- Not run: `hosting/app.test.mjs` and the old query tests (they reseed the core).

## Data touched
- No Study records changed. Counts identical before and after both restarts: 2 semesters, 10 modules, 137 cards, 3 assessments, 81 sessions, 287 materials, 1 progress, 4 settings, 557 history rows.
- The server restarted twice. The first automatic daily dump was written: `../Life_OS_backups/study-2026-10-06/daily-1791299450106.dump` (347 KB).
- No folder was connected; `.runtime/study-folders.json` does not exist.
- 8 materials removed earlier today (13:39 UTC) are listed under Removed records and can be brought back.

## Problems and surprises
- Connecting the seven folders as planned would have been harmful. Sizes of supported files: CMT309 6, MAT021 4, MAT022 95 (122 MB), MAT700 218 (355 MB), CMT307 324 (535 MB), MAT508 175 (380 MB), CMT501 Team Project 61,047 (4.3 GB, mostly image datasets). The old code would have brought all of it into Materials and copied the whole material store to backups before every 30-second scan that added anything.
- `code/life-os/` has its own nested `.git` folder owned by the Codex sandbox user. Running git from inside it fails; run git from the project root.
- The Playwright connector needs a browser extension that is not installed; headless Chrome worked instead.
- Opening the original Study page was avoided throughout (it saves on open).

## Small decisions I made, and questions for Xar
- Discovery brings in new files only unless asked (recorded in DECISIONS). Confirm, and say which folders to connect.
- Study's separate light/dark switch was removed for one unified style. Say if you want a dark modern style as a fifth.
- **Semesters.** Xar asked for Summer Rescue and Spring in the semester chooser. Today there are two semesters: "Autumn 2026" and "Imported Study plan" (4 Jul to 18 Aug), which is the Summer Rescue plan and holds the four spring modules. A module belongs to one semester, so Spring and Summer Rescue cannot be separate semesters sharing those modules without a choice: rename the one semester, or split it and copy the modules.
- Today's "Needs attention" shows about 118 overdue items from the summer plan. Setting that semester to completed or archived hides them from Calendar and Today; that is Xar's edit.

## Next step
Get Xar's answer on semesters and on which folders to connect. Then finish the visual pass of the remaining Study views, dialogs and timer in all four styles, and make Cardiff Life, Budget and JobMap follow the four styles (the plan was to apply the shared palette inside each frame from Life OS, without editing those apps).
