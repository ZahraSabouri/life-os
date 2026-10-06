# Life OS: status

**Updated 6 October 2026 (evening) by Claude Code.** Branch: `stage/3-study-hub`; main untouched. Calendar is complete. Study CP1 and CP2 are done. **CP3 is on hold:** Xar reviewed Study and changed its direction.

## Now
Active brief: `briefs/stage-3-study-hub.md`. Xar's feedback, the audit and the proposal: `sessions/2026-10-06-claude-code-stage-3-study-feedback.md`.

Xar's three corrections (also in `DECISIONS.md`):
1. Study is a general study app for anyone, not her own tracker. Semesters are defined by the user and chosen on entry. Nothing that isn't studying lives there.
2. Study must feel part of Life OS through base-level UI work (one frame, shared building blocks), not a recolour.
3. Study must not plan the study by itself. It offers tools and module detail; every item can be added, read, edited and removed.

Done so far: Health and Admin removed from Study (14 cards, 2 groups, restorable), the semester "Imported Study plan" renamed "Summer 2026". No code changed.

## Exact next step
1. **Xar answers the five questions** at the end of the session note.
2. Write the agreed plan into the brief as new checkpoints (shared frame; general Study structure; summer data fitted to it).
3. Build the shared frame first, unless Xar chooses another order. Build into the running app only when a step is complete on screen.

Do **not** continue the old CP3 items (Summer Rescue parity, restyling the views one by one, skinning the framed apps).

**Next prompt:** Continue Life OS: my answers on Study are [answers]. Write the plan into the brief and start its first checkpoint.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850. Study is at `/study`. Health and Admin are gone from the module list; removed records are under Study > History. Nothing else looks different yet.

## Waiting on Xar
- The five questions in the session note.
- Module folders: none is connected; say which to connect (sizes are in `sessions/2026-10-06-claude-code-stage-3-skins-backend.md`).
- Acceptance of Calendar's look.

## Known problems and limits
- Study still opens on the summer semester and shows 109 "overdue" items from it. Marking that semester completed hides them; the plan fixes it for every past semester.
- Study Overview: the "Now and next" block is misplaced and the "Done" label wraps. Both go away with the shared frame.
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.
- The original Study page saves when opened. Do not open it while checking that the source is unchanged.
- Run git from the project root. `code/life-os/` has a nested `.git` owned by another user.
- Separate, later work: sign-in, a backup copy off this laptop, the core's move to PostgreSQL, the import worker, PWA, the Career playbook.

## Data
Study is in PostgreSQL (`lifeos`, schema `study`): 2 semesters, 8 modules, 123 cards, 3 assessments, 81 sessions, 287 materials. Removed and restorable: 14 cards, 2 modules, 8 materials. Files: `../Life_OS_data/study/materials`. Backups: `../Life_OS_backups/study-<date>/`, with a daily dump. The Summer Rescue source and the four attached apps are untouched.

## Last five sessions
- 2026-10-06 Study feedback, audit and proposal: `sessions/2026-10-06-claude-code-stage-3-study-feedback.md`
- 2026-10-06 CP3 styles and backend: `sessions/2026-10-06-claude-code-stage-3-skins-backend.md`
- 2026-10-06 CP2: `sessions/2026-10-06-codex-stage-3-import-recovery.md`
- 2026-10-06 CP1: `sessions/2026-10-06-codex-stage-3-workspace.md`
- 2026-10-05 Calendar audit: `sessions/2026-10-05-codex-stage-2-final-audit.md`
