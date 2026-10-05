# Life OS: status

**Updated 5 October 2026 by Claude Code (Session 0).** Branch: `main`, the same commit as `v2-subapps`, tagged `pre-development-2026-10`. Everything is committed and pushed.

## Now
- **Stage 0:** use Budget for October inside Life OS. Still waiting for Xar's first real save at `/budget` (the saved plan is at revision 91).
- **Session 0 (setup) is done, except one step** that is now Xar's: moving the old `code\life-os\.git` out (below).
- Development hasn't started. No brief exists yet.

## Next steps, in order
1. **Xar:** record October spending at `/budget` (not the old launcher).
2. **Xar:** move `code\life-os\.git` out (below). It doesn't block planning.
3. **Plan Stage 1a** (the PostgreSQL foundation) with Claude in Cowork: prompt 2 in `documents/WORKFLOW.md`. The brief goes in `documents/briefs/`.
4. **Xar approves the brief**; building starts with prompt 3 (Continue), on a branch `stage/1a-<name>` created from `main`.

**Next prompt:** prompt 2 (Plan a stage), with Claude in Cowork.

## How to see what's new
Nothing new in the app. Life OS was left running for Xar's testing: http://127.0.0.1:47850/ (**Stop Life OS.cmd** stops it). All four apps open. The backup is in `Projects\Life_OS_backups\`, with a README.

## Waiting on Xar
- The first real Budget save.
- **Moving `code\life-os\.git`.** Claude Code's permission check refused to let the agent move it, so it is Xar's step (agents: leave it unless Xar asks in that session). It is safe: all its commits are in the main repository. In PowerShell: `Move-Item "C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\code\life-os\.git" "C:\Users\ctrlz\Documents\Personal\Projects\Life_OS_backups\code-life-os-git"`
- Where backups should also go off the laptop (an external drive or cloud folder).

## Known problems
- Until that folder moves, an agent started inside `code/life-os` uses the old repository and misses `AGENTS.md`. Open agents at the `Life_OS` folder.
- **Don't run `code/life-os/backend/test/query.test.js` or `hosting/app.test.mjs` yet:** both write to the real core database. Stage 1a should give tests their own database.
- The core SQLite database is in WAL mode: copy it only through SQLite, or all three `life-os.db*` files together. It retires in Stage 1a.
- Opening Study makes Summer Rescue save (that day's notifications and snapshot), so even "just looking" changes its files.
- Court doors show sample text when a room is empty; the Relationships door opens Cardiff Life (Stage 1b).
- Codex automations still write to the old Cardiff Life and JobMap folders (`ROADMAP.md` §4).

## Data
- Budget: revision 91 (26 September), 86 automatic backups; October is configured (£250). Nothing saved through Life OS yet.
- JobMap: workspace revision 16 after today's inbox import (12 jobs added, 1,010 shown).
- Core database: 7 entries, 1 person, 12 spaces (test entries only).
- Last backup: 5 October, 13:15, the whole folder with Life OS stopped: `Projects\Life_OS_backups\full-2026-10-before-development` (4,102 files, 1.27 GB, every file hash-checked), plus SQLite snapshots. On this laptop only.

## Recent sessions
- 2026-10-05 · Claude Code · Session 0, setup: `sessions/2026-10-05-claude-code-session-0-setup.md`
- 2026-10-05 · Claude (Cowork) · planning the unified app and setting up the workflow: `sessions/2026-10-05-claude-cowork-planning-and-workflow.md`
- 2026-10-01 · Codex and Claude, sessions 2–7 · attaching the four apps: `MIGRATION_HANDOFF.md`
