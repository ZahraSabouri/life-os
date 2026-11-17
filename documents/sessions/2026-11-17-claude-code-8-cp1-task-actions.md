# 2026-11-17 · Claude Code · Stage 8 · CP1 (move, star and note a task)

## Goal
Xar's thirteen points of 16–17 November (TODO AB) recorded in her words; stage 8 briefed; its first checkpoint built: tasks can be moved, starred and noted wherever they show. Also the cleanup she asked for by name (`dist-next`, the 42 Budget test folders).

## What I did
- TODO section AB with each point quoted; the order of work updated.
- Brief `briefs/stage-8-task-loop.md` (CP1–CP6: task actions; one model and one-tap day actions; "replan the rest of today"; close and start the day; planned against actual; notices with buttons and a Windows widget).
- Shared rules (`code/life-os/shared/tasks.js`): `moveTask` (where later today, tomorrow, next week, a day and someday land; London clock time kept for timed tasks; lanes the day decides let go; the move recorded), `cleanMoves`, `cleanLog`, starred first in `compareTasks`. The task type accepts `moves` and `log` (`shared/entryTypes.js`).
- Pages: `tasks/TaskActions.jsx` (move menu, star); the Tasks board cards, the day checklist (Today, every Court, the calendar's day) and the opened task carry them; the opened task has a notes timeline (notes, "how it went", moves; minutes) and asks "How did it go?" when ticked done; "Waiting on you" items move by snoozing; Undo after every change. Guide: a "Move it, star it, note it" step in the Tasks chapter.
- Cleanup: `code/life-os/frontend/dist-next` (try-out build copy, 188 MB, git-ignored, rebuilt when the try-out runs) and 42 `budget-management/app/tests/storage-test-*` folders (throwaway data of `v2-storage.test.cjs`, git-ignored) deleted; the test now removes its own folder.
- Codex's uncommitted records of 4–17 November committed on their own first.

## Files and commits
- `be0dcf3` [records] Codex's session notes and records, 4-17 November
- [8-cp1] Move, star and note a task wherever it shows (this session's code, tests, brief, TODO, STATUS, DECISIONS and this note)

## How I checked it
- `node --test test/tasks.test.js` (backend): 19 pass; with `entryTypes`, `query`, `routines`: 34 tests, none failing.
- `LIFE_OS_CORE_DATABASE=lifeos_test node --test test/core.integration.test.js` (PowerShell): pass, now including a save and read-back of star, moves and notes, and a refused bad note.
- Render tests: `node scripts/test-tasks-render.mjs` 7 pass; `… test/day-render.test.jsx` 5 pass.
- Budget `tests/v2-storage.test.cjs`: pass, and no folder left behind after two runs.
- Server restarted (`launch.mjs --stop`, `--no-browser`) before building, so the new fields are not stripped. `npm run build` into the live app.
- Headless walk (saves answered in the browser) of /tasks and /today in Modern, Paper, Indigo and Madder: 34 own cards with star and Move, the menu open on a board card and a checklist row, the opened task; no page errors. One fix made: the menu was cut off in the narrow board lanes; it now wraps.

## Data touched
None of Xar's data was changed. The route test wrote only to `lifeos_test`. Deleted only git-ignored generated folders (above).

## Problems and surprises
- `tasks/TodayTasks.jsx` is imported nowhere: the day checklist replaced it on 15 November. Left in place (its render test still runs) and listed for the cleaning plan.
- `/study-native` is the stage 3 rebuild replaced at `[3-cp4]`, not a second semester: the Study hub already switches semesters ("Change semester"). Recorded in TODO AB4.
- The deep-research run for this request hit the usage limit (76 of 101 agents failed); its extracted claims are unverified and were not used as facts.

## Small decisions I made, and questions for Xar
- Moves and notes live on the task itself, not as separate entries (one guarded save; they move with the task).
- "Someday" clears the day and puts the task in Backlog; "Later today" keeps today and sets the afternoon or evening.
- The List view's rows open the task, where the menu is, rather than carrying their own.
- For Xar: should stage 7 CP5 wait for the audit map, as recommended?

## Next step
Stage 8 CP2: one model of a thing to do; running late +15/30/60; move several at once; move a Study card through the hub's revision check. Retake the Guide picture `tasks-actions.jpg` with `scripts/guide-shots.mjs` when the next page change is done.
