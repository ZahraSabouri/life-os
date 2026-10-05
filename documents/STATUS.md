# Life OS: status

**Updated 5 October 2026 by Claude (Cowork).** Branch: `v2-subapps`. The 5 October documents aren't committed yet (Session 0 does it).

## Now
- **Stage 0:** use Budget for October inside Life OS. Waiting for Xar's first real save at `/budget`.
- Development hasn't started. The workflow is ready: the session routine in `AGENTS.md`, Xar's guide and prompts in `documents/WORKFLOW.md`, this page, `documents/sessions/` and `documents/briefs/`.

## Next steps, in order
1. **Xar:** record October spending at `/budget` (not the old launcher).
2. **Session 0** on Windows (Codex or Claude Code): prompt 1 in `documents/WORKFLOW.md` (git tidy-up, commit the documents, full backup, check the app and the Budget save).
3. **Plan Stage 1a** (the PostgreSQL foundation) with Claude in Cowork: prompt 2. The brief goes in `documents/briefs/`.
4. **Xar approves the brief**; building starts with prompt 3 (Continue).

**Next prompt:** prompt 1 (Session 0), in Codex or Claude Code opened at the `Life_OS` folder.

## How to see what's new
Nothing to run yet. Read `documents/WORKFLOW.md`.

## Waiting on Xar
- The first real Budget save.
- Where backups should also go off the laptop (an external drive or cloud folder), as well as `Life_OS_backups` next to the project.

## Known problems
- The core SQLite database is in WAL mode: copy it only through SQLite. It retires in Stage 1a.
- Court doors show sample text when a room is empty; the Relationships door opens Cardiff Life (Stage 1b).
- `.git/stale-index-lock-from-claude-2026-10-05` (empty) to delete from Windows (Session 0).
- `code/life-os/.git` is a redundant old repository; an agent started inside `code/life-os` would use it and miss `AGENTS.md` (Session 0 moves it out).
- Codex automations still write to the old Cardiff Life and JobMap folders (`ROADMAP.md` §4).

## Data
- Budget: revision 91 (26 September) in both the old and the Life OS copy, so nothing has split. October is configured (£250).
- Last backups: the data copies taken while attaching the apps (`migration/backups/`, 1 October). Next: a full backup in Session 0.

## Recent sessions
- 2026-10-05 · Claude (Cowork) · planning the unified app and setting up the workflow: `sessions/2026-10-05-claude-cowork-planning-and-workflow.md`
- 2026-10-01 · Codex and Claude, sessions 2–7 · attaching the four apps: `MIGRATION_HANDOFF.md`
