# Life OS: status

**Updated 9 October 2026 by Claude Code** (the look) and by Codex (JobMap search, see its note). Branch: `stage/4b-one-look` (cut from `stage/4a-jobmap-refresh`, which was cut from `stage/3-study-hub`); none pushed; main untouched. Calendar is complete. Study hub and JobMap are live. The look (sub-apps as parts of Life OS, every style a whole design) has had two passes and waits for Xar's detailed check.

## Now
Active brief: `briefs/stage-4b-one-look.md` (CP1 to CP3 done and live; her detailed check is next). Latest note on the look: `sessions/2026-10-09-claude-code-stage-4b-pages-and-court.md`.

**The look, what works right now**
- Budget, JobMap, Cardiff Life and the Study hub open under the Life OS top bar; the chosen part is marked there. The two floating buttons are gone.
- All four take their colours, typefaces, corners, boxes, buttons and menu from the chosen style. Changing the style from the top bar changes the open part at once.
- A style is a whole design: Madder (soft tiles, serif, small sans capitals), Indigo (outlined boxes, sans with serif headings, mono figures), Paper (ruled lines, no boxes, all serif), Modern (rounded cards, soft shadows).
- In the ancient styles every page's top bar is the Court's header. The ancient Court fills the window's width and scrolls if needed.
- The ancient Court flows: it fills any window, folds to one column on a phone, grows with its content, and is enlarged on screens bigger than a laptop's. On a phone the top bar folds behind a Menu button. Today, Calendar and Ledger draw their items, tags and panels with each ancient style's design. A check of 152 pages (every view, four styles) found five legibility problems, all fixed.

**JobMap, what works right now**
- Life OS → **JobMap** is the newest version: 1,020 currently imported jobs (checked 9 October), each showing when it was added to JobMap, when it was advertised and when it closes; sorting by newest added and recently advertised.
- It holds the jobs and choices from both places JobMap was used (the standalone app and Life OS), each vacancy once.
- It looks like the Study hub, and changes with the Style menu (Madder, Indigo, Paper, Modern) at once.

**Xar's direction (in `DECISIONS.md`):** the Study hub is the Summer Rescue app made general. Semesters are defined and chosen on entering; modules, cards and everything else are added, edited and removed as data; a new module has no premade cards. Life, health, admin, job hunt and shopping do not belong in it. It must reach the Life OS calendar with nothing doubled.

**What works right now**
- Life OS → **Study hub** opens on "Which semester?". Add, edit, remove or open a semester.
- **Autumn 2026** opens with its three modules in the menu, its 4 cards, its timetable on the Schedule page and its 76 files under each module's Materials tab.
- **Add card** saves to the Life OS database. A card with a date shows on the Life OS calendar once.
- **Semester setup** (bottom of the menu): add, edit, remove or duplicate a module. **Change semester** goes back to the list.
- **Summer 2026** is a past semester holding the summer's 33 study cards (29 done), notes, evidence and focus history, all still editable.
- The name is Study hub everywhere she sees it. Life & Admin, Admin & Dates, Job Hunt, the interview hub and Shopping are gone from the menus; their data is kept aside in the database.

## Exact next step
00. The look: Xar's detailed check (she announced one), then what it lists.
0. JobMap: 9 October search queued five jobs in both copies and one missing Six by Nico job in Life OS. Both hosts are closed; open each normal launcher and verify import logs and processed folders. Delivery is queued, not yet imported. Her UI acceptance checks remain outstanding.
1. Study hub: ask Xar to try the acceptance list at the end of the 7 October Study hub session note and collect what is wrong.
2. Add automated tests for `hosting/study/hub/` (store, card records, router, duplicate).
3. Clean-up listed under "Known problems and limits".

**Next prompt:** Continue Life OS: finish CP5 to CP8 from the brief, starting with tests for `hosting/study/hub/`.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850 → Study hub. After changing `summer-rescue/` or the frontend: `Build Life OS.cmd`. After changing `hosting/`: stop and start.

To try a change without touching her data: `node .runtime/hub-dev/copy-live-to-test.mjs` (makes `lifeos_test` a copy of the live Study data); build the Study hub with `--outDir dist-hub`, the main app with `--outDir dist-next`, JobMap with `--outDir dist/client-next`; then `node .runtime/hub-dev/dev-server.mjs` (port 47860: the whole app on the test database, with JobMap and Budget on fresh copies of their data). Skin files (`hosting/skins/public`, `palettes.css`) are read on every page load, so a change there needs only a refresh.

## Waiting on Xar
- JobMap scheduled-search destination decided on 8 October: update both copies. The existing automation now requires delivery and separate import checks for both; its cadence is unchanged. No answer on its destination is pending.
- Whether the Study hub stage can be merged into main ("nothing more on the Study Hub" on 7 October was not yet a formal acceptance).
- Her check of the Study hub (acceptance list in the session note).
- Where the set-aside life data should live later (133 cards, 13 shopping items, the interview hub).
- Module folders: none is connected; say which to connect.
- Moving `code\life-os\.git` out herself (an earlier automatic move was refused; it is her step).

## Known problems and limits
- **The look:** the page-by-page check measures legibility, not shapes; a box deep inside a part may still have the app's own corners or border in some style. Calendar and Ledger were not looked at by eye in each ancient style. On a laptop the ancient Court may scroll a little. Its own header has no links to the parts (they are reached through the room tiles).
- **JobMap:** the standalone app in `Documents\JobMap` was not changed: it keeps its blue look and lacks the 12 jobs only Life OS had. In Madder, Indigo and Paper the Study hub keeps its own look, so JobMap and the Study hub match each other only in Modern. Saving an edit in JobMap's new look was not tried by me (my pictures block saves).
- **A browser tab opened before the switch cannot save.** Refresh it.
- **Renaming a module** changes its title and menu name; cards keep the name it was created with in their Module field.
- **Classes and assessments** show in the hub but are not yet editable there (the addresses exist, the screen does not). The 5 university reminders that belong to no semester are on the calendar, not in the hub.
- **An exam date typed into the hub's settings** for a module that already has an assessment record would show twice on the calendar.
- **Duplicate module** was tried on the test copy only (see the session note); Xar has not used it yet.
- **Leftover summer wording inside pages:** Schedule totals say "Project" and "Job hunt"; Planner says "Exam window in 0 days" when no exam date is set; about 200 places in the page code still mention summer module names (harmless for other semesters, to be made general).
- **Schedule:** a class block squeezes its title into a narrow column at some window widths.
- **Uploaded files** (`/api/resources`) are still kept as files in `summer-rescue/local-data/resources`, shared by all semesters.
- **Not cleaned yet:** the old built-in plan files and the removed screens are still in `summer-rescue/src` (unused); the app's own tests (`summer-rescue`, `npm test`) were not run and many describe the old built-in plan; `hosting/study/legacy.mjs` and parts of `storage.mjs` still name the deleted July folder; `/study-native` still exists and calendar links for classes point to it; the folder and address are still `summer-rescue`.
- No automated tests yet for `hosting/study/hub/`.
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.
- Separate, later work: sign-in, a backup copy off this laptop, the core's move to PostgreSQL, the import worker, PWA.

## Data
- JobMap (`jobmap/data`, plain files): 980 jobs of the original collection and 40 added ones, 41 personal records, workspace revision 21 (verified 9 October). Six additions queued, not imported. Standalone: 1,002 jobs, revision 18, five additions queued. Existing personal data unchanged; search recovery snapshots in each app data/recovery/2026-10-09-current-jobs-735ca802/. Copy from before the merge: `../Life_OS_backups/jobmap-before-merge-2026-10-06T23-57-18-031Z/`.
- PostgreSQL (`lifeos`, schema `study`), live records: 2 semesters, 7 modules, 42 cards, 6 assessments, 81 sessions, 76 materials; 2 hub workspaces, 426 hub events. Removed and restorable: 132 cards, 7 modules, 219 materials (the stale July import and the 4 autumn cards that moved into the hub).
- Summer 2026's workspace also keeps what is not study (`set_aside`): 133 cards, 100 schedule rules, the interview module, 6 notes, 13 shopping items.
- The app's old saved file (`summer-rescue/local-data/summer-rescue-tracker-state.json`) is no longer read or written. Copy: `../Life_OS_backups/study-hub-switch-2026-10-07/`.
- Database dumps before each step of the switch: `../Life_OS_backups/study-2026-10-06/before-migration-*`, `before-summer-rescue-*`, `before-adopting-cards-*`.
- Original app, untouched: `Documents\Apply\…\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`.

## Last five sessions
- 2026-10-09 The look, second pass: `sessions/2026-10-09-claude-code-stage-4b-pages-and-court.md`
- 2026-10-09 JobMap search (queued in both): `sessions/2026-10-09-codex-jobmap-search.md`
- 2026-10-08 One look: `sessions/2026-10-08-claude-code-stage-4b-one-look.md`
- 2026-10-08 JobMap maintenance: `sessions/2026-10-08-codex-jobmap-both-copies.md`
- 2026-10-07 JobMap refresh: `sessions/2026-10-07-claude-code-stage-4a-jobmap-refresh.md`
