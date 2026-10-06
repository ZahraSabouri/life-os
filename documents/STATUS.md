# Life OS: status

**Updated 7 October 2026 (just after midnight) by Claude Code.** Branch: `stage/3-study-hub`, not pushed; main untouched. Calendar is complete. Study: the Study hub is live on the database; clean-up and acceptance remain.

## Now
Active brief: `briefs/stage-3-study-hub.md` (CP5 to CP8). Latest note: `sessions/2026-10-07-claude-code-stage-3-study-hub-live.md`.

**Xar's direction (in `DECISIONS.md`):** the Study hub is the Summer Rescue app made general. Semesters are defined and chosen on entering; modules, cards and everything else are added, edited and removed as data; a new module has no premade cards. Life, health, admin, job hunt and shopping do not belong in it. It must reach the Life OS calendar with nothing doubled.

**What works right now**
- Life OS → **Study hub** opens on "Which semester?". Add, edit, remove or open a semester.
- **Autumn 2026** opens with its three modules in the menu, its 4 cards, its timetable on the Schedule page and its 76 files under each module's Materials tab.
- **Add card** saves to the Life OS database. A card with a date shows on the Life OS calendar once.
- **Semester setup** (bottom of the menu): add, edit, remove or duplicate a module. **Change semester** goes back to the list.
- **Summer 2026** is a past semester holding the summer's 33 study cards (29 done), notes, evidence and focus history, all still editable.
- The name is Study hub everywhere she sees it. Life & Admin, Admin & Dates, Job Hunt, the interview hub and Shopping are gone from the menus; their data is kept aside in the database.

## Exact next step
1. Ask Xar to try the acceptance list at the end of the session note and collect what is wrong.
2. Test "Duplicate module" end to end on `lifeos_test` (it is written and wired, never run).
3. Add automated tests for `hosting/study/hub/` (store, card records, router, duplicate).
4. Clean-up listed under "Known problems and limits".

**Next prompt:** Continue Life OS: finish CP5 to CP8 from the brief, starting with the duplicate-module test.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850 → Study hub. After changing `summer-rescue/` or the frontend: `Build Life OS.cmd`. After changing `hosting/`: stop and start.

To try a change without touching her data: `node .runtime/hub-dev/copy-live-to-test.mjs` (makes `lifeos_test` a copy of the live Study data), build with `--outDir dist-hub`, then `node .runtime/hub-dev/dev-server.mjs` (port 47860, test database).

## Waiting on Xar
- Her check of the Study hub (acceptance list in the session note).
- Where the set-aside life data should live later (133 cards, 13 shopping items, the interview hub).
- Module folders: none is connected; say which to connect.
- Moving `code\life-os\.git` out herself (an earlier automatic move was refused; it is her step).

## Known problems and limits
- **A browser tab opened before the switch cannot save.** Refresh it.
- **Renaming a module** changes its title and menu name; cards keep the name it was created with in their Module field.
- **Classes and assessments** show in the hub but are not yet editable there (the addresses exist, the screen does not). The 5 university reminders that belong to no semester are on the calendar, not in the hub.
- **An exam date typed into the hub's settings** for a module that already has an assessment record would show twice on the calendar.
- **Duplicate module** has never been run end to end.
- **Leftover summer wording inside pages:** Schedule totals say "Project" and "Job hunt"; Planner says "Exam window in 0 days" when no exam date is set; about 200 places in the page code still mention summer module names (harmless for other semesters, to be made general).
- **Schedule:** a class block squeezes its title into a narrow column at some window widths.
- **Uploaded files** (`/api/resources`) are still kept as files in `summer-rescue/local-data/resources`, shared by all semesters.
- **Not cleaned yet:** the old built-in plan files and the removed screens are still in `summer-rescue/src` (unused); the app's own tests (`summer-rescue`, `npm test`) were not run and many describe the old built-in plan; `hosting/study/legacy.mjs` and parts of `storage.mjs` still name the deleted July folder; `/study-native` still exists and calendar links for classes point to it; the folder and address are still `summer-rescue`.
- No automated tests yet for `hosting/study/hub/`.
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.
- Separate, later work: sign-in, a backup copy off this laptop, the core's move to PostgreSQL, the import worker, PWA.

## Data
- PostgreSQL (`lifeos`, schema `study`), live records: 2 semesters, 7 modules, 42 cards, 6 assessments, 81 sessions, 76 materials; 2 hub workspaces, 426 hub events. Removed and restorable: 132 cards, 7 modules, 219 materials (the stale July import and the 4 autumn cards that moved into the hub).
- Summer 2026's workspace also keeps what is not study (`set_aside`): 133 cards, 100 schedule rules, the interview module, 6 notes, 13 shopping items.
- The app's old saved file (`summer-rescue/local-data/summer-rescue-tracker-state.json`) is no longer read or written. Copy: `../Life_OS_backups/study-hub-switch-2026-10-07/`.
- Database dumps before each step of the switch: `../Life_OS_backups/study-2026-10-06/before-migration-*`, `before-summer-rescue-*`, `before-adopting-cards-*`.
- Original app, untouched: `Documents\Apply\…\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`.

## Last five sessions
- 2026-10-07 Study hub live on the database: `sessions/2026-10-07-claude-code-stage-3-study-hub-live.md`
- 2026-10-06 CP4, the real Summer Rescue: `sessions/2026-10-06-claude-code-stage-3-real-summer-rescue.md`
- 2026-10-06 Study feedback and a rejected proposal: `sessions/2026-10-06-claude-code-stage-3-study-feedback.md`
- 2026-10-06 CP3 styles and backend: `sessions/2026-10-06-claude-code-stage-3-skins-backend.md`
- 2026-10-06 CP2: `sessions/2026-10-06-codex-stage-3-import-recovery.md`
