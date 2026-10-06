# Life OS: status

**Updated 6 October 2026 by Claude Code.** Branch: `stage/3-study-hub`; main untouched. Calendar is complete. Study CP1 and CP2 are done; CP3 is in progress. Xar authorised this order directly.

## Now
Active brief: `briefs/stage-3-study-hub.md`. What exists and how it is stored: `Study_and_Calendar_Backend.md`.

- **Backend for Calendar and Study:** complete as scoped, tested and running. Added today: bring back a removed record, put an earlier version back, per-record history, a daily database backup, and safe folder discovery.
- **Styles:** four for the whole app (Madder, Indigo, Paper, and the new Modern). The style menu is on every page. Court, Today, Calendar, Ledger and Study follow all four from one shared palette.
- **Not done:** Cardiff Life, Budget and JobMap have the style menu but keep their own look. Most Study views, dialogs and the timer have not been looked at in a browser yet.

## Exact next step
1. Xar answers the two questions under Waiting.
2. Finish the browser pass of the remaining Study views, dialogs, timer and workbench in all four styles, at desktop and phone width.
3. Make the three framed apps follow the four styles by applying the shared palette inside each frame from Life OS, without editing those apps.
4. Then close CP3 and ask Xar to accept Stage 3. No merge to main and no retiring Summer Rescue before that.

**Next prompt:** Continue Life OS: finish CP3 from the latest session note.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850. Study is at `/study`; the History view there lists removed records. `Build Life OS.cmd` rebuilds both apps. After backend changes, stop and start again.

## Waiting on Xar
- **Semesters.** Summer Rescue's plan is the semester now called "Imported Study plan" (4 Jul to 18 Aug), and it holds the four spring modules. Choose: rename it (for example "Spring 2026 and Summer Rescue"), or split it into a Spring semester and a Summer Rescue semester, which means copying the modules.
- **Module folders.** None is connected. Say which to connect, and whether to bring in what is already there (sizes are in the session note; the Team Project folder holds 61,000 files).
- Acceptance of Calendar's look, and of Stage 3 when CP3 closes.

## Known problems and limits
- Today's "Needs attention" lists about 118 overdue items from the summer plan. Marking that semester completed or archived hides them.
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.
- The original Study page saves when opened. Do not open it while checking that the source is unchanged.
- Run git from the project root. `code/life-os/` has a nested `.git` owned by another user.
- Separate, later work: sign-in, a backup copy off this laptop, the core's move to PostgreSQL, the import worker, PWA, the Career playbook.

## Data
Study is in PostgreSQL (`lifeos`, schema `study`): 2 semesters, 10 modules, 137 cards, 3 assessments, 81 sessions, 287 materials, 557 history rows, unchanged by this session. Files: `../Life_OS_data/study/materials`. Backups: `../Life_OS_backups/study-<date>/`, now with a daily dump. The Summer Rescue source and the four attached apps are untouched.

## Last five sessions
- 2026-10-06 CP3 styles and backend: `sessions/2026-10-06-claude-code-stage-3-skins-backend.md`
- 2026-10-06 CP2: `sessions/2026-10-06-codex-stage-3-import-recovery.md`
- 2026-10-06 CP1: `sessions/2026-10-06-codex-stage-3-workspace.md`
- 2026-10-05 Calendar audit: `sessions/2026-10-05-codex-stage-2-final-audit.md`
- 2026-10-05 Calendar resumed: `sessions/2026-10-05-codex-stage-2-resumed-review.md`
