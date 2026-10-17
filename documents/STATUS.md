# Life OS: status

**Updated 9 October 2026 by Claude Code** (the look); JobMap account search imported 15 October by Codex; GitHub refs verified 15 October; tech-only correction completed 11 October (see session notes). Branch: `stage/4b-one-look` (cut from `stage/4a-jobmap-refresh`, which was cut from `stage/3-study-hub`). 16 October (Claude Code, at Xar's request "push everything to the main branch"): `main` fast-forwarded to `stage/4b-one-look`, Health and Codex's notes included, and both pushed to GitHub; work goes on on `stage/4b-one-look` and is brought to `main` the same way. Calendar is complete. Study hub and JobMap are live. The look (sub-apps as parts of Life OS, every style a whole design) has had two passes and waits for Xar's detailed check.

## Now
**17 October, 16:40 (Claude Code): JobMap shows one job once, and its menu has more in it.** Her words: `TODO.md` section U. The CTR job was in JobMap twice (Cardiff University's site and jobs.ac.uk); 12 such listings are now joined (1,171 → 1,160 jobs shown, none deleted; Today says 5 to apply, not 6). Imports and "Add job" join repeats by themselves; 14 uncertain listings wait under "Possible repeats" for her. New menu: Closing this week, New this week, High priority, Applying, Tidy up (Possible repeats, Closed adverts, Archive), My categories, Back up & restore. Both copies changed and built; owner restarted; parity PASS both ways; tests PASS; looked at in all five styles; Guide steps and pictures updated. Backup before: `../Life_OS_backups/jobmap-2026-10-17-before-repeats.json` (revision 45). Note: `sessions/2026-10-17-claude-code-jobmap-one-job-once.md`.

**17 October, 16:00 (Claude Code): the study plan in emergency mode, from Sunday 18 to Test 1 (Friday 23).** Her words: `TODO.md` section T. Nothing had been marked done since 14 October, so every Test 1 card is still ahead. Statistics only, at most six hours a day (her three to six), blocks of 90 minutes at most with breaks, evenings free: Sunday 6 h, Monday 6, Tuesday 5.8 (Mock A), Wednesday 5.3 (Mock B, and 30 minutes for Thursday's practical), Thursday 2, Friday a 30-minute warm-up. Classes: she goes to the CMT309 practical on Thursday and the MAT022 lecture on Friday (the test); the other five that week are marked as not attended (status cancelled, `attendance: not-going`, a note; kept). Job time Sunday to Thursday cancelled (kept); Friday evening stays. The CMT309 catch-up moves after the test (Saturday 24, Monday 26). Test 1 covers up to Week 2 and the empirical rule must be memorised (16 October lecture transcript); the formula sheet is given. The new files (sol-extra-1, sol1 and sol2, the 16 October slides, the formula sheet) are on the cards; a note "Test 1 week: what matters" is on the Study hub's Notes page (MAT022). Blocks from Saturday 24 on are unchanged. Backups: `Life_OS_backups/core-2026-10-17/life-os-before-emergency-plan-1792248250345.db`, `study-2026-10-17/before-emergency-plan-1792248250368.dump`; script: `.runtime/study-plan-2026-10-17/emergency.mjs`.

**17 October (Codex): JobMap public search retry completed.** Nine technical employee leads added; Cardiff University vacancy 200 closes 27 October (corrected from 6 November). Shared JobMap revision 43, 1,166 records; both inbox receipts verified and both parity checks passed. Personal data preserved. Coverage limits and pending adverts: `jobmap/data/discoveries/2026-10-17-public-tech-e4387c9a.md`; session: `sessions/2026-10-17-codex-jobmap-public-search-retry.md`.

**15 to 16 October (Claude Code): Health, a part of its own** (her words: `TODO.md` section S; brief `briefs/health-part.md`; note `sessions/2026-10-16-claude-code-health-part.md`). Live:
- **Health** in the top bar and behind the Court's Body & Health tile: This week (active minutes against the UK's 150, strength days against 2, today's sessions, meals, 5 A Day and drinks, what is coming up), Exercise (log or plan a session with the NHS talk test; Couch to 5K exactly as the NHS plan, Strength at home, Gym starter, Brisk walks, each put on the calendar on chosen days; 43 exercises with how-to; week by week), Food (diet and the 14 UK allergens; 36 UK recipes checked against Budget's food at home, "Add to my recipes" into Budget, missing things to the shopping list; Eatwell Guide, 5 A Day, intakes, a label checker), Appointments & tests (calendar and bell, results and letters, measurements, where to get help).
- Today has a Health panel; the calendar a Health area; the bell names appointments today and tomorrow and sessions planned today. Budget opens a recipe from a link (`?recipe=`).
- The Guide: a Health chapter, six answers, and what else it did not cover (Today's Health panel, Budget's week and batches, the other Food & supplies views); 91 pictures retaken.
- The top bar stays on one line at every width tested in all four styles (it wrapped at two widths before).
- Nothing was entered for her: no session, appointment, diet or recipe. Checked: Health 7 and 2 tests, Life OS 44, core types 6, Budget 188; walked on the try-out with every core save answered in the browser.

**14 October, 18:00 (Claude Code): food you can use, in Budget and on the day** (her words and what each became: `TODO.md` section R; brief `briefs/budget-food-flow.md`; note `sessions/2026-10-14-claude-code-budget-food-flow.md`). Live:
- A meal on the calendar, Today, the Court, the strip above Budget and Body & Health opens its own card (`/budget#/meals/week?m=…&meal=…`); before, it opened Budget's first page.
- Budget → Meals & recipes opens on **Now**: this mealtime's plan with its one action, "Did you eat these?" for meals still open (recorded on their own day), cooked portions, recipes ranked by what is at home (everything / missing one / more; food to eat soon first), and "Eat soon". Week shows what the week's meals still need. Recipes can be read, scaled, copied, cooked now or planned. A meal with no method has "Write how to make it" and becomes a recipe; a food's page lists its recipes; an ingredient means the food, not one pack.
- Food & supplies → What's left: by place, the fridge first, compact rows, "Finished" on each and "Choose several"; "date not known" stays out of the day-by-day history.
- The import's notes are gone from 18 meals and 17 recipes (Budget revision 106 → 107, through its API; copy `.runtime/budget-food-2026-10-14/state-before-notes-r106-*.json` and Budget's own `data/backups/state-r106-*`).
- Checked: 188 Budget tests and 38 Life OS tests; both of her scenarios (lunch from the fridge, planning the week) on a copy of her data with saving; every link looked at live in Modern light and dark, Paper and Madder. Guide: five Budget steps, three "How do I" answers, six pictures retaken.

**14 October, 17:00 (Claude Code): the study plan starts tomorrow, 15 October** ("update the plan again and make it start from tomorrow"). Today has no study. Today's two Statistics blocks moved into Thursday; Thursday to Monday were set by hand to use every gap between classes, lunch and job time. With a day fewer before the mocks, five blocks are shorter (the diagnostic 30 minutes; the repair, the annotated slides and the lab transfer 50; the Mock A preparation 60), and the CMT309 Week 1 redo moves to Sunday 25 October. The mocks, the Test 1 week and everything after 25 October are unchanged. Backup: `Life_OS_backups/study-2026-10-14/before-study-plan-from-tomorrow-1791993870360.dump`; script: `.runtime/study-plan-2026-10-14/from-tomorrow.mjs`.

**14 October, 13:30 (Claude Code): the study plan rebuilt from today, around her days.** Her words: "reset the whole study plan, that if I'm starting from today. But it still should be a perfect plan", both modules with MAT022 first, job applications too, uni Thursday and Friday, Saturday and Sunday free until 18:00, uni every day from the week after. Codex's cards are kept; their blocks are laid out again around classes (20 minutes to get there), job time (10 minutes' break), lunch and dinner, and a daily amount: MAT022 about 14 to 17 hours a week to Test 1 (Friday 23 October), CMT309 2 to 2.5; mocks Tuesday 20 and Wednesday 21. After 25 October 129 of 133 blocks stay; 4 Saturday-evening CMT309 blocks move to Tuesday evenings. 17 new MAT022 files in Materials (extra1, Week 2 annotated slides, 13 lab datasets) with three new cards; the three module folders are watched for new files; a weekly "new files" block on Fridays from 30 October. CMT309 practicals from 15 October start at 16:20 in Queen's Buildings S/3.20 (Learning Central announcement), which is also a note of hers on the hub's Notes page under "Announcements". Notices: the hub's stored notifications cleared; the job time of 12 and 13 October (before she started) cancelled, not removed; the portfolio date-watch card says what to do. Backups: `Life_OS_backups/study-2026-10-14/before-study-rebuild-from-today-1791980592778.dump`, `before-notices-reset-1791980775101.dump`, `core-2026-10-14/life-os-before-notices-reset-1791980775077.db`. Scripts: `.runtime/study-plan-2026-10-14/rebuild.mjs`, `notices-reset.mjs`.

**14 October, 12:33 (Claude Code): the study plan starts today**, the day Xar starts using the app ("reset everything from today … only in the study hub"). The three Statistics cards of 12 and 13 October that were not done, and the Statistics cards up to 19 October, were laid out again in order from today in free time; the mocks (20, 21 October), the last two days, the Python and OR cards, classes and job time are unchanged. Cards dated before today moved to today; the hub's day markers start today. No card or block is before today; card progress is untouched. Backup: `Life_OS_backups/study-2026-10-14/before-study-reset-from-today-1791977620168.dump`; script: `.runtime/study-plan-2026-10-12/reset-from-today.mjs`.

**14 October (Claude Code, stage 2e):** Journal with pictures and People in the top bar; the Guide in parts (a finder, 25 answers, 17 part pages, 76 pictures); JobMap → My documents (her Apply folder, main CV) and no account block; the four apps look like sections of Life OS; Life OS starts with Windows; the app's words written for customers. Notes: `sessions/2026-10-14-claude-code-stage-2e-customers-journal-people-guide.md`; lists of what is left: `TODO.md` sections O and P.

**13 October afternoon (Claude Code):** a job keeps real files (JobMap → a job → My application → Add files); "Change" on a plan on Today and in the planner; the top bar stays on one line down to 1110 pixels; Windows notices are filed under "Life OS"; the Guide has 59 pictures, numbered circles, six diagrams and "Retake the pictures". Commits `[jobmap-cp7]`, `[2d-cp11]`, `[2d-cp12]`.

**13 October (Claude Code, stage 2d: everything hers):** brief `briefs/stage-2d-everything-hers.md`, note `sessions/2026-10-13-claude-code-stage-2d-add-anything-analysis-guide.md`, her words in `TODO.md` section N. Live and committed on `stage/4b-one-look` (`[2d-cp4]` to `[2d-cp10]`, `[jobmap-cp6]`):
- **Add, change, remove by hand** where only agents and files could before: Cardiff Life events of her own; JobMap categories, application folder and own links on every job; the Ledger changes or removes any entry; a repeating plan is changed in the week planner. (Study hub classes, tests and materials: 12 October night.)
- **Today:** "I applied" / "Rejected" on a job, saved by JobMap, with Undo.
- **Review → Analysis:** a longer stretch of days as data, with the rows as CSV or JSON.
- **Guide** (the ? in the top bar): 42 pictures of her own app in 14 chapters; `node scripts/guide-shots.mjs` retakes them into `guide-shots/` (not in git).
- **Notices:** the Study hub's own reminders are in the bell; with no tab open Windows shows them while Life OS runs.
- **Restart fault fixed:** Life OS keeps Budget and JobMap up and a restart no longer loses them (`hosting/keep-up.mjs`, `launch.mjs`).
- **Not yet:** the Guide in more depth for the four apps inside; "Change" on a single plan on Today; a real file kept with a job; notices when Life OS itself is not running.

**13 October (Codex, Budget correction):** shopping supports undated wishes, weeks and specific days. The user's wishes and this week's essentials are separated; only the weekly essentials appear in current Home shopping. The imported food-use instruction cards are gone; My food plan is editable settings. New plans start empty, with dates/settings derived from the user rather than the old personal template. Build, 181 Budget tests and 37 Home/day/calendar tests passed; live and isolated-start browser checks passed. See `sessions/2026-10-13-codex-budget-generic-shopping.md` (CP2). This does not implement student account registration.

**12 October night (Codex, requested Budget fix):** the attached Budget app now connects pasted/itemised receipts, recipe stock links, preparation batches and eating. The supplied food plan is saved; preparation uses ingredients once, later meals use ready portions, and history distinguishes the two. Estimated/unidentified payments stay visible for review. Build and 177 tests passed; browser consumption checks used an isolated copy. See `sessions/2026-10-12-codex-budget-meal-workflow.md` and `briefs/budget-fix-meal-workflow.md`. Her payment details, physical freezer counts and package dates remain to confirm; native Budget migration is not started.

**Today, 12 October (Claude Code):** the Court and Today are the pages to work from and are live. Brief: `briefs/stage-2b-my-day.md` (CP1 to CP9 done). Notes: the five `sessions/2026-10-12-claude-code-stage-2b-*.md`. Codex entered the autumn study plan the same afternoon; a second Claude Code session reworked JobMap's first list; the three were coordinated in `COORDINATION_2026-10-12.md` and by messages.

**What works right now** (12 October night; notes `sessions/2026-10-12-claude-code-stage-2c-focus-and-review.md` and `…-stage-2c-notices-planner-progress.md`)
- **The Court** (all four styles): a line that adds a plan, a note or something to buy, for any day and under any area, once or repeating; and Study, Jobs, Home and Notes with today's content. The day hour by hour is on Today only (her choice, 12 October night).
- **Jobs** shows what JobMap's own first list shows: what closes today first, then the next in JobMap's order, "9 jobs to apply for now". Clicking a job opens that job in JobMap.
- **Shopping:** the squares are ticks, on the Court, on Today and in Budget. A tick asks for no price and does not touch the budget. Budget → Shopping arranges the same items by list, category, shop, day or all together; typing an item and pressing Enter adds it; a list can have a spending limit.
- **Study:** clicking a study item opens its card in the Study hub, in the right semester, without the "Which semester?" page.
- **Every area has a page** (Relationships, Travel, Life admin and the rest): what is coming up, what has no day, what is done. A plan such as "picnic with Ben, Saturday" goes on its day under its area.
- **The summer app's life and admin data** is out of the Study hub and in Life OS as done entries (history on the calendar).
- "Life OS" in the top bar leads to the first page from everywhere; inside the Study hub the words "Life OS" on the save button do too.
- Inside the Study hub, JobMap, Budget and Cardiff Life, a strip under the top bar says what today holds for that part; its first line links to the thing it names.
- **Study steps:** the squares beside a card's steps are ticks on the Court and on Today; a study stop has "Card done". Saved in the Study hub by its own rule; an open hub tab follows.
- **Focus** (top bar, every page and style): a timer for anything, counting in the top bar and the tab's title across pages and parts; when it ends the time is on the calendar as done and, for a study card, on the card. **Sound:** saved YouTube and Spotify links in a small corner player that keeps playing from page to page. Brief: `briefs/stage-2c-focus-and-review.md`.
- **Review** (top bar): the week's five figures against the week before, the week day by day, what slipped.
- **Notices** (the bell, every page): what is on now, soon, asked of today, slipped and close ahead, from every part; optional notifications on the computer.
- **Repeating plans:** the add line has "repeat"; job time runs to 27 December as repeating plans.
- **Plan the week** (Today → Plan the week, or Calendar → Week): seven days side by side; her own plans can be added, ticked, taken off and moved.
- **Review:** also eight weeks of charts and what she aims at.
- ~~Not yet: marking a job "applied" from the day; notices with the browser closed; editing a repeating plan in place.~~ All three done 13 October (see the top of this section).
- **Known fault of the evening:** the Study hub page was blank for about four minutes (17:13 to 17:17, by the build files' own times) after a rebuild without its address setting. Rebuilt correctly; an open hub tab was not affected. The right command is in `Build Life OS.cmd`.

**Today, what works right now**
- Top bar → Today. The day is a path in clock order with a "now" marker: classes, and the Study hub's study blocks, each opened to its card, steps and "done when". Under it: "Any time today", and one slim row for renewals and deadlines.
- Beside it, four panels with real content: Study (days to the next test, cards done before it, today's cards), Jobs (saved jobs closing in the next seven days, interviews, follow-ups), Home (shopping list, today's meals, what is at home, the month's budget), Notes.
- The line at the top adds to the day: a plan ("17:30 library" goes at 17:30; "Lidl" is for any time) or a note. Her own plans have "Done" and "Take off the day".
- The day before, the day after or any date opens the same page for that day; the calendar's day has "Open this day".
- The calendar shows the Study hub's study blocks at their clock times.
- Designed and checked in Modern, at laptop and phone width. Madder, Indigo and Paper draw it with their own boxes and type and are readable; their own designs of it are still to do.
- **Light and dark:** in Modern the top bar has a Light/Dark button on every page; it turns the whole app dark, the Study hub, JobMap, Budget and Cardiff Life included. The other three styles keep their one look (her choice).
- **Not yet:** ticking a study step from Today (it opens the card in the hub instead).
- **Everything still open is in `TODO.md`** (one list, by her objectives).

Active brief: `briefs/stage-4b-one-look.md` (CP1 to CP3 done and live; her detailed check is next). Latest note on the look: `sessions/2026-10-09-claude-code-stage-4b-pages-and-court.md`.

**The look, what works right now**
- Budget, JobMap, Cardiff Life and the Study hub open under the Life OS top bar; the chosen part is marked there. The two floating buttons are gone.
- All four take their colours, typefaces, corners, boxes, buttons and menu from the chosen style. Changing the style from the top bar changes the open part at once.
- A style is a whole design: Madder (soft tiles, serif, small sans capitals), Indigo (outlined boxes, sans with serif headings, mono figures), Paper (ruled lines, no boxes, all serif), Modern (rounded cards, soft shadows).
- In the ancient styles every page's top bar is the Court's header. The ancient Court fills the window's width and scrolls if needed.
- The ancient Court flows: it fills any window, folds to one column on a phone, grows with its content, and is enlarged on screens bigger than a laptop's. On a phone the top bar folds behind a Menu button. Today, Calendar and Ledger draw their items, tags and panels with each ancient style's design. A check of 152 pages (every view, four styles) found five legibility problems, all fixed.

**JobMap, what works right now**
- 15 October authorised account/public review (Codex): 21 new technical employee leads and one original-advert update. Both APIs verified at 1,148 records, shared revision 41; standalone imported, Life OS processed as already imported/no change. Both parity checks pass, personal choices preserved. Hours and skill gaps are explicit; this was partial source/mail coverage, with limits and follow-up leads in `jobmap/data/discoveries/2026-10-15-account-tech-e81b3a6d.md`. Session: `sessions/2026-10-15-codex-jobmap-account-search.md`.
- 13 October public search (Codex): eight new technical choices imported once; both APIs verified at 1,123 records, revision 37. Standalone receipt: 8 added; Life OS receipt: repeated/no change, with the same eight visible. Both parity checks passed; prior personal data unchanged. All eight are full-time with hours and gaps flagged. Coverage/access limits and recovery details: sessions/2026-10-13-codex-jobmap-public-tech.md and jobmap/data/discoveries/2026-10-13-public-tech-74c2a901.md.
- The later 12 October broader public review added 39 technical employee choices (Cardiff NHS Senior Developer plus 38 expanded leads) and updated 11 adverts. That run brought both interfaces to 1,106 records at shared revision 35; all 38 new entries appear in To apply. Full-time hours and material gaps are flagged; the 20-hour preference and all existing personal progress are preserved. Source register: `jobmap/JOB_SOURCES.md`; exact coverage, receipts and limits: `sessions/2026-10-12-codex-jobmap-complete-choices.md`. Earlier Gmail/application updates remain in their own note; no new private-account review is claimed.
- Searches are tech/data only. On 11 October one Dataspire software role was imported into each copy; six previously identified off-field leads were archived and unsaved reversibly. Personal progress was preserved. Details: `sessions/2026-10-11-codex-jobmap-tech-scope.md`.
- Both JobMap interfaces show the same 1,148 records and shared feature code (parity checked 15 October, shared revision 41). **All jobs opens on "To apply"**: every role a check has seen open, whatever its hours, under headings in the order to act on them: Apply now (open in the last 14 days and the hours fit), Ask about hours first, Full-time or over your hours, Check it is still open. Before the later broad search on 12 October: 9, 8, 10 and 32. Inside each, imminent deadlines first, then the setting and match. Rows show Added and Last checked. Part-time leads, Tech & data and Everything are the other tabs. Details: `sessions/2026-10-12-claude-code-jobmap-to-apply.md`. Today's "next job" reads this same order (`priority.section`, `scope: 'apply'`) and catches up when Life OS is restarted.
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
000. `TODO.md`, in its order: the rest of section B (the card link, with a Study hub rebuild when she is not in it; ticking a step from Today; job-application time once she has answered), then C (shopping and meals). Brief: `briefs/stage-2b-my-day.md`.
00. The look: Xar's detailed check (she announced one), then what it lists.
0. JobMap: the shared-workspace fix is live. Refresh both existing tabs once. Stars, archives, notes, stages, dates and preferences are shared; use each app's parity check after future changes. Read the connection before inspecting saved progress.
1. Study hub: ask Xar to try the acceptance list at the end of the 7 October Study hub session note and collect what is wrong.
2. Add automated tests for `hosting/study/hub/` (store, card records, router, duplicate).
3. Clean-up listed under "Known problems and limits".

**Next prompt:** Continue Life OS: finish CP5 to CP8 from the brief, starting with tests for `hosting/study/hub/`.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850 → Study hub. After changing `summer-rescue/` or the frontend: `Build Life OS.cmd`. After changing `hosting/`: stop and start.

To try a change without touching her data: `node .runtime/hub-dev/copy-live-to-test.mjs` (makes `lifeos_test` a copy of the live Study data); build the Study hub with `--outDir dist-hub`, the main app with `--outDir dist-next`, JobMap with `--outDir dist/client-next`; then `node .runtime/hub-dev/dev-server.mjs` (port 47860: the whole app on the test database, with JobMap and Budget on fresh copies of their data). Skin files (`hosting/skins/public`, `palettes.css`) are read on every page load, so a change there needs only a refresh.

## Waiting on Xar
- Health (16 October): her own first use: My diet on Food, a session or a programme on Exercise, an appointment if one is booked. Whether Review should count active minutes too.
- Food (14 October): on Budget → Meals & recipes → Now, "Did you eat these?" for five meals of 12 to 14 October, and "Eat soon", which lists fridge food from September that may be gone.
- Six questions gathered at the end of `TODO.md` (job-application time; the 13 kept-aside shopping items; the Court's invented lines and the agents' test entries; which page opens first; the two Today pages).
- JobMap scheduled-search destination decided on 8 October: update both copies. The existing automation now requires delivery and separate import checks for both; its cadence is unchanged. No answer on its destination is pending.
- Whether the Study hub stage can be merged into main ("nothing more on the Study Hub" on 7 October was not yet a formal acceptance).
- Her check of the Study hub (acceptance list in the session note).
- Where the set-aside life data should live later (133 cards, 13 shopping items, the interview hub).
- Module folders: none is connected; say which to connect.
- Moving `code\life-os\.git` out herself (an earlier automatic move was refused; it is her step).

## Known problems and limits
- **The look:** the page-by-page check measures legibility, not shapes; a box deep inside a part may still have the app's own corners or border in some style. Calendar and Ledger were not looked at by eye in each ancient style. On a laptop the ancient Court may scroll a little. Its own header has no links to the parts (they are reached through the room tiles).
- **JobMap:** both interfaces share vacancy evidence and personal progress. The standalone keeps its blue look; Life OS uses the shared skins. A tab can select its own view/search/sort; it refreshes shared changes on idle/focus. The old Life OS progress file is historical. Deadline urgency uses saved dates, and uncertain availability is shown for checking.
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
- University sources refreshed 11 October: 18 new material files and 8 caption TXT files in the existing Cardiff Autumn folder. New MAT022 test date (23 October) is saved in `.runtime/university-imports/2026-10-11/calendar-updates.json`; app import remains pending because Life OS was not running. Details: `sessions/2026-10-11-codex-university-materials-refresh.md`.
- 12 October afternoon: the seven July test entries deleted from the core (copy: `../Life_OS_backups/core-2026-10-12/`; the Ledger then held nothing, then 14 job time blocks for 12 to 25 October). Budget revision 92 to 93: one list, "To buy (from the summer list)", 13 items (Budget's own copy: `budget-management/data/backups/state-r92-…json`). Summer 2026 workspace: `set_aside.shoppingList` removed after a dump (`../Life_OS_backups/study-2026-10-12/before-moving-summer-shopping-…dump`); it still keeps aside 131 cards, 100 schedule rules, the interview module and 6 notes.
- JobMap: one active standalone owning workspace, connected from both app data/workspace-connection.json files. Verified 15 October at revision 41, 980 original + 168 added = 1,148 records. This attended run added 21 and updated one via both inboxes; the second receipt correctly reports already imported/no change. Existing personal data and Life OS historical progress are unchanged. Both parity checks pass. Run backup: standalone data/recovery/2026-10-15-account-tech-e81b3a6d/. Receipt/preservation evidence: jobmap/data/discoveries/2026-10-15-account-tech-e81b3a6d-verification.json. Initial shared-workspace reconciliation remains documented in sessions/2026-10-12-codex-jobmap-shared-workspace.md.
- PostgreSQL (`lifeos`, schema `study`), live records: 2 semesters, 7 modules, 42 cards, 6 assessments, 81 sessions, 76 materials; 2 hub workspaces, 426 hub events. Removed and restorable: 132 cards, 7 modules, 219 materials (the stale July import and the 4 autumn cards that moved into the hub).
- Summer 2026's workspace also keeps what is not study (`set_aside`): 133 cards, 100 schedule rules, the interview module, 6 notes, 13 shopping items.
- The app's old saved file (`summer-rescue/local-data/summer-rescue-tracker-state.json`) is no longer read or written. Copy: `../Life_OS_backups/study-hub-switch-2026-10-07/`.
- Database dumps before each step of the switch: `../Life_OS_backups/study-2026-10-06/before-migration-*`, `before-summer-rescue-*`, `before-adopting-cards-*`.
- Original app, untouched: `Documents\Apply\…\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`.

## Last five sessions
- 2026-10-17 JobMap: one job shown once (12 repeats joined, imports join them), and more in the menu: `sessions/2026-10-17-claude-code-jobmap-one-job-once.md`
- 2026-10-16 Health, a part of its own; the Guide made whole; main brought level and pushed: `sessions/2026-10-16-claude-code-health-part.md`
- 2026-10-15 GitHub main update guidance: published stage branch verified at `1fa4d12`, main at `f156682`, zero behind/84 ahead; `git push origin stage/4b-one-look:main` prepared for Xar. Agent pushed nothing; uncommitted edits remain local: `sessions/2026-10-15-codex-github-main-update.md`
- 2026-10-15 GitHub publication review: `stage/4b-one-look` is local with 84 commits beyond GitHub `main`; only `main`, `v1-pre-subapps` and `v2-subapps` are online. Publish command prepared for Xar; no push or commit performed. Uncommitted edits remain local: `sessions/2026-10-15-codex-github-branch-publication.md`
- 2026-10-15 JobMap signed-in account/public review: 21 additions, one update, both receipts and parity verified; coverage limits recorded: `sessions/2026-10-15-codex-jobmap-account-search.md`
- 2026-10-14 Food you can use: Now, recipes as templates, a meal opens its card, finished without a date: `sessions/2026-10-14-claude-code-budget-food-flow.md`
- 2026-10-12 JobMap: 39 broader technical choices added, 11 source updates, shared receipts/preservation and full source register: `sessions/2026-10-12-codex-jobmap-complete-choices.md`
- 2026-10-12 JobMap: one first list, "To apply", in headed groups; hours and row dates put right: `sessions/2026-10-12-claude-code-jobmap-to-apply.md`
- 2026-10-12 JobMap: My priority puts roles confirmed open first: `sessions/2026-10-12-claude-code-jobmap-open-first.md`
- 2026-10-12 The Court as the working first page; today in every part; shopping and job time (2b CP5): `sessions/2026-10-12-claude-code-stage-2b-the-court-unified.md`
- 2026-10-12 Light and dark, the to-do list, the day's connections (2b CP3, CP4): `sessions/2026-10-12-claude-code-stage-2b-dark-and-connections.md`
- 2026-10-12 Check of Codex's autumn study plan: `sessions/2026-10-12-claude-code-study-plan-check.md`
- 2026-10-12 Today as the page to work from (2b CP1, CP2): `sessions/2026-10-12-claude-code-stage-2b-my-day.md`
- 2026-10-12 JobMap shared saved workspace: `sessions/2026-10-12-codex-jobmap-shared-workspace.md`
- 2026-10-12 JobMap search review, no new qualifying additions: `sessions/2026-10-12-codex-jobmap-search.md`
- 2026-10-11 University materials and captions: `sessions/2026-10-11-codex-university-materials-refresh.md`
- 2026-10-11 JobMap tech-only search and correction: `sessions/2026-10-11-codex-jobmap-tech-scope.md`
- 2026-10-09 JobMap priority and source parity: `sessions/2026-10-09-codex-jobmap-priority.md`
