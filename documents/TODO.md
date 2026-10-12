# Life OS: to-do

**Written 12 October 2026 by Claude Code, at Xar's request.** One list of everything open, drawn from three places: what Xar said on 12 October (quoted), what the project's documents already aim for (`Life_OS_Vision.md`, `ROADMAP.md`, `Life_OS_Plans_Inventory.md`, `STATUS.md`), and what using the app showed. `STATUS.md` says where things stand today; this says what is left. Tick items here as they are done and add new ones where they belong.

Marks: `[x]` done · `[~]` partly · `[ ]` open · **(Xar)** needs her answer or is her step.

## The order of work
1. ~~E. Dark mode across the app~~ done 12 October (Modern, as she asked).
2. ~~A. The study plan's leftovers~~ checked and recorded 12 October; two small items left.
3. **B. The day reaches everything:** done 12 October except two things: ticking a study step from the day, and job time as a repeating routine.
4. **C. Shopping, meals and money on the day:** the list is added to and ticked from anywhere, and Budget arranges it by list, category, shop or day (12 October). Next: recipes and tonight's meal, "left to spend".
5. **D. The first pages:** all four Courts carry the day (12 October). Next: her style-by-style review of the Court's own design.
6. **F, G, H** as they come up; none blocks her this month except backups.
7. **I. Applying now:** the first list shows every open role in the order to act on it (12 October). Next: re-check the 32 uncertain adverts; her three answers.
8. **K. Progress, review and focus for the whole of Life OS** (new, 12 October evening): not started. The largest open piece; needs a short design with her before code.
9. **L. Everything leads somewhere:** the five links she named work (12 October evening). Continue as she finds dead spots.

---

## A. The study plan
> "make a thorough plan for studying all of them … the priority is Statistics and Data Science … input that plan into the app … just like we had a plan in the summer rescue … look at my uni schedule and consider that I'm gonna take a lot of time applying for jobs … my exam is in ten days … document this thoroughly"
> "not sure if the codex study plan is perfect cuz it ran out of usage midway … just do a check on it"

- [x] The three module folders and the timetable read; a Statistics-first plan to 27 December (Codex, 12 October). 50 cards, 159 study blocks, 3 hours of study on a normal day, 3 hours a day kept for job applications.
- [x] Entered into the Study hub's Autumn 2026 semester, with the test on 23 October as its own record. Backup before it: `Life_OS_backups\study-2026-10-12\`.
- [x] **Checked (Claude Code, 12 October).** Every answer in the two practice papers recomputed: all correct. All 50 cards have steps and a "done when", and each is tied to a study block. No block overlaps a class or sits closer than 20 minutes to one. The three modules have their description, assessment shape and aims. The plan's scope for test 1 matches what the formula sheet and its guide cover, and it carries the correction to the guide's Bayes line.
- [x] The old record "MAT022 in-class tests · Weeks 3 and 5" (no date) renamed to test 2, so the day no longer reports both tests as undated.
- [x] A record of the import in the project (Codex ran out before writing its note): `sessions/2026-10-12-claude-code-study-plan-check.md`.
- [ ] The card "MAT022 · Confirm the Week 3 and Week 5 test dates" is half out of date (test 1 is confirmed). Reword it to test 2 when card edits from outside the hub exist (B6).
- [ ] Module pages have no drills or worked patterns yet (the summer modules had them). For MAT022: a Bayes table, "which distribution is this?", reading a plot in five steps.
- [ ] **(Xar)** Only she can find out, and the plan has cards for them: is a calculator allowed, is the formula sheet handed out, the exact start time on the 23rd, the date of test 2, and joining a project group of five.
- [ ] After each mock (20 and 21 October): the plan says to repair the two largest errors; nothing in the app prompts that yet (see B6, marking a card done).

## B. One day that reaches everything
> "I look at Life OS and see it has lots of features for planning days, but JobMap isn't like that. We want to connect JobMap to Study Hub, to the Life OS calendar."
> "there is this Job app that is separate somewhere for itself, and this Study hub that is separate somewhere else. I want a connection so I can access all of these from my day."
> Layout: "a combo of this path + glance and your four panels." The Court stays; "Rebuild Today."

- [x] Today rebuilt: the day as a path in clock order with a "now" marker; Study, Jobs, Home and Notes beside it (12 October, Modern).
- [x] One request that gathers a day's study blocks and the four panels (`/api/day`).
- [x] A study card that starts and is due on one day shows once on the calendar.
- [x] **Study blocks on the Life OS calendar at their clock times** (12 October). A card with blocks is shown by them; the block on its due date carries the deadline; a card without blocks keeps its all-day line.
- [x] **A study item opens its own card in the Study hub** (12 October evening). The link names the card and its semester; the hub opens that semester without asking "Which semester?" and opens the card. From the Court, Today, the strip above the hub, and the calendar. The Study hub was rebuilt for it.
- [x] **Plan the day from Today** (12 October): one line, Plan or Note. "17:30 library" is placed at 17:30, "Lidl" is for any time that day; a hint says what will be saved. Her own plans can be ticked off or taken off the day.
- [x] **Today for any day** (12 October): the day before, today, the day after, or a date; the calendar's day has "Open this day".
- [ ] Plans typed in words without a clock ("library after class") are kept as any-time plans. Placing them after a class, or by dragging, would be the next step in making input effortless.
- [ ] Moving a plan to another time or day from Today (now: take it off and add it again, or edit it in the Ledger).
- [x] The Court and Today add things with the same line (12 October).
- [x] **Job-application time on the day, both ways** (her answer, 12 October): as time blocks on the calendar and in the day's path (she can tick each off or take it off the day), and as the day's target in the Jobs panel ("3 h set aside today", "sent this week"). Blocks exist for 12 to 25 October, from the windows the study plan reserved.
- [ ] Job time is 14 single blocks. Make it a repeating routine (a weekly pattern with exceptions), so it need not be added again after 25 October and one change moves every week.
- [~] **Jobs panel as a work list** (12 October evening): what closes today is said first, whatever its group; then the next jobs in JobMap's own order with JobMap's words ("Apply now · closes in 6 days"); "9 jobs to apply for now"; the other groups counted. Each job opens that job in JobMap. Still open: marking "applied" from the day; this week's count against a target.
- [x] **The day reads JobMap's own first list, from one place** (`hosting/career/first-screen.mjs`, JobMap's `FIRST_SCREEN`). Her words: "Data Manager (Neurological Data Platform) · Swansea University doesnt exist in the job app. where is it … not only that one!" The panel had listed everything the scheduled searches shortlisted (80 jobs she never chose); it now lists what JobMap lists, and the calendar shows a closing date only for those.
- [x] The Study panel no longer says "could not be read" on some loads: ranking 1,067 jobs on every request took half a second and timed the day out; it is now worked out once per JobMap save, and the page asks again by itself when a part fails.
- [ ] Tick a step and mark a card done from Today, saved through the Study hub's own rules so an open hub tab loses nothing.
- [x] **Today in every part** (her answer, 12 October: "good to have today in all sub apps"): a strip under the top bar inside the Study hub, JobMap, Budget and Cardiff Life says what today holds for that part and leads back to the whole day.
- [x] The Study hub keeps its own Today (her answer: "sometimes one only wants to see what to study for today"); Life OS's day is the whole day.

## C. Shopping, meals and money on the day
> "I'm going to grocery shopping to Lidl. So I also need my grocery shopping list to be accessible, connected to the first page and to the whole app and the budget thing and recipe stuff, because then I'm going home to make dinner."

- [x] Home panel on Today: shopping lists with what is still to buy, the day's meals, what is at home by place, the month's budget (read only).
- [x] The 13 shopping items from the summer app are on a Budget shopping list, "To buy (from the summer list)", and are gone from the study data (12 October; `scripts/move-summer-shopping-to-budget.mjs`).
- [x] Something to buy is added from the Court or Today ("To buy": "eggs, 2 kg rice, onions x3"), onto Budget's list by Budget's own rules (`hosting/home/shopping.mjs`).
- [x] **Tick a thing off from the day** (12 October evening): the squares on the Court and Today are real ticks. Budget's rule for a tick: the item leaves "to buy", no price is asked, no receipt is made, nothing reaches the balance or the cupboard. What was ticked today stays in sight, struck through, and can be put back.
- [~] The summer list holds things like a bicycle and bedsheets beside shampoo. An item can now have its own shop and day and be moved to another list; a list still needs a date (Budget's own rule). A "sometime" list without a date is open.

> "On the budget app, I need to be able to create different shopping lists … One of them should be, like, in shopping list based on categories, another one should be based on the date, something for all shopping, based on the shop, etc"
> "I don't think I will be able to provide an approximate budget on everything I'm planning to [buy] … sometimes there is an estimation or just, like, the project limit. And see these checkboxes that are not checkable and cannot be marked … I should be able to kind of track the items, but not necessarily put the price, or kind of track them in the main hub budget." (12 October evening)

- [x] **Budget → Shopping, arranged five ways** (12 October evening): By list, By category, By shop, By day, Everything. The same items, nothing copied; the choice is remembered. Each heading has "Add here" (the category, shop or day is filled in).
- [x] **The squares in Budget are ticks.** Ticked items stay under "Ticked off", struck through, until cleared or put back. She ticked seven off the same evening.
- [x] **No price is asked for.** "Price?" beside each item is gone; the total counts the items that have a price and says prices are optional. A list can carry a spending limit instead ("Edit list").
- [x] **Type an item and press Enter** adds it; "Add with details" keeps the full form. A new list is for today, not the first of the month.
- [ ] The month's forecast does not use a list's limit yet (it still adds up priced items only). Decide with her whether an unpriced list should count as its limit.
- [ ] Moving an item between groups by dragging; ticking several at once.
- [ ] **(Xar)** She wrote "use common sense making any of these changes" while these went live and did not say which change. I made the wording and the one-step actions plainer afterwards; ask her what it was if it is still there.

- [ ] Tonight's dinner: Budget has no recipes saved (0) and one meal entry. Recipes need a way in that costs little (by hand, or "give this to your AI" import); then "what can I cook from what is at home" and "add what is missing to the list" (Budget can already make a list from a meal's missing items).
- [ ] "Left to spend this month" on Today, by Budget's own rule (a big shop is counted over the months it feeds). Today shows the month's budget and a link for now.
- [ ] After the shop: "Record the receipt" from Today's Home panel.
- [ ] The list on the phone at the shop: waits for F.
- [ ] Roadmap Stage 5: Money and Home rebuilt inside Life OS, recipes as their own collection, money in whole pence.

## D. The first pages
> "I'm not happy with any of the design versions' first pages, and I feel like we had some features like adding notes and stuff on the first pages that are now left alone."
> "all four should be amazing in their own designing context but for now let's focus the most on Modern."

- [x] Notes are no longer left alone: a note typed on Today, or on the Court, is on Today for that day.
- [x] **The Court, in every style** (12 October): her words on the Modern Court, "it has turned out amazing … I want the [Court] to carry the day the way Modern does in [Madder], indigo, and paper." All four do: the add line, the path, and Study, Jobs, Home and Notes.
  - [x] Invented lines removed in all four styles (12 October). Every room says what is true of it today (Study, Career, Home) or what it is for. The rooms not built yet (journal, relationships, gym and the rest) are kept, as she asked: "those are for our further developments, so keep them."
  - [x] The seven July test entries deleted (her answer; a copy of the core database first). "Recently filed" kept and made useful: each row opens its entry, a plan shows the day it is for, a row can be removed for good (asked twice). It lists what she filed herself: bulk time blocks and what was moved in from the summer app are left out.
  - [x] Every style: the add line (Plan, Note, To buy, a day, an area); the full form for the other 46 kinds is kept under "File something else".
  - [x] Every style: the Court carries the day itself, with "The whole day" leading to Today.
  - [x] Every area opens: Study, Career and Home open their parts; every other area opens its own page (`/room/<name>`) with what is coming up, what has no day yet, and what is done. Still: no door for Money or Events (Roadmap 1b).
  - [ ] One file fails to load on the Court (a 404 in the browser).
- [x] The Court opens first, with today in it (her answer, 12 October).
- [ ] The greeting's name ("Xar") is written in the page code. It belongs in settings (code rule: no personal content in code).
- [ ] A core entry can now be deleted (`DELETE /api/entries/:id`). The Ledger page itself has no remove or edit yet.
- [ ] Today designed for Madder, Indigo and Paper, each from its own Court (now they only draw it with their own boxes and type).
- [ ] The Court's own design reviewed with her style by style, since "not happy with any".
- [ ] The look's open items from 9 October: her detailed check; shapes deep inside the parts; Calendar and Ledger by eye in the ancient styles; the ancient Court's header has no links to the parts.
- [ ] Wording review and personal constants in settings, not code (Roadmap 1b).

## E. Light and dark everywhere
> "just like study hub that's got a dark and light mode, I want that button to be universal and everywhere in the app not just study hub."
> "one thing that is missing and we talked about is the dark mode all across the app."
> "btw we only need the dark mode for the modern skin"

- [x] One light/dark button in the top bar of every page and every part (12 October). It shows in Modern; Madder, Indigo and Paper keep their one look and show no button.
- [x] **Modern dark**, everywhere: Court, Today, Calendar, Ledger, Study hub, JobMap, Budget, Cardiff Life. Each looked at by eye; the button pressed while inside each part.
- [x] The Study hub's own light and dark follows the button.
- [x] Not wanted (her answer): a dark Paper, a light Madder or Indigo.
- [ ] Modern dark, the inner pages nobody has looked at yet: dialogs and drawers in each part, the Study hub's Focus Room, Budget's meal planner and receipts, JobMap's Preferences. Report anything unreadable.

## F. Phone
> "we definitely need to develop the app and all parts of it for phone access and it should be responsive. That is not our priority yet."

- [~] Pages at phone width: Today and the top bar's menu fold to one column. Court, Calendar, Ledger and each part still to be looked at on a phone.
- [ ] Reaching Life OS from the phone: sign-in, a safe way in from outside (Tailscale), an installable page (Roadmap, late stages).

## G. Never losing data, and the foundations (from the documents)
- [ ] A backup copy off this laptop (STATUS: "separate, later work"). The one item here that matters this month.
- [ ] The core (notes, tasks, people) from SQLite to PostgreSQL, with history and refused stale saves (Roadmap 1a).
- [ ] Tests for `hosting/study/hub/` (store, card records, router, duplicate).
- [ ] The import pipeline with "give this to your AI" instructions (Roadmap 1c).
- [ ] Study hub leftovers from the summer: "Hour-by-hour protected routines, study, project, and job blocks" and "days to exam window" wording; about 200 summer names in page code; classes and assessments not editable in the hub; the folder and address still called `summer-rescue`. The hub's own old tests fail (they ask for the summer app's names: `CAMPAIGN_START`, `PLAN_REVISION`, the title "Summer Rescue"); they need rewriting for the hub.
- [ ] Acceptances waiting on her: the Study hub (to merge into main), the look (her detailed check), Calendar and Today.
- [ ] Git: cut `stage/2b-my-day` (all of 12 October is on `stage/4b-one-look`); nothing is pushed; Codex's uncommitted notes and JobMap files are still in the working tree.
- [ ] Do not run `hosting/app.test.mjs` until tests have their own database.

## H. Later, unchanged (Roadmap stages 4 to 7 and late stages)
- [ ] Career rebuilt inside Life OS; scheduled searches pointed at the Life OS inbox; both JobMap copies kept in step until then.
- [ ] Cardiff Life rebuilt, with connectors. Its research is from 1 October and the page itself warns it is over a week old.
- [ ] The other rooms (people, culture, body, travel, memories, mind, closet), tags, search in English and Persian, favourites, boards, photos.
- [ ] AI capture ("speak or type naturally"), voice, an MCP server over Life OS. Still the heart of the Vision; parked on purpose.
- [ ] Motion, a moodboard, the app's real name.

## I. Applying for the roles that are open, now
> "I feel like the priorities are a bit messed up in the job app. I need to immidiately apply for the roles available soooo#" (12 October; the message was cut off)

- [x] **My priority puts roles confirmed open first** (12 October, both JobMap copies).
- [x] **Nothing open is left out** (12 October). All jobs opens on "To apply": every role a check has seen open, whatever its hours, under headings: Apply now, Ask about hours first, Full-time or over your hours, Check it is still open.
- [x] **Hours read properly** (12 October): "part-time mentioned" without hours is no longer "apply now"; "no job-share wording" is not part-time; a single paid shift fits.
- [x] **Dates on a row** (12 October): Added and Last checked, Advertised only when known, the closing date once. No "Not stated" on every row.
- [ ] "Added to JobMap" is later than the last check for 42 jobs (older leads brought in on 9 October and at the merge), so the "Newest added" sort shows stale leads as new. The stored dates are true to when each copy received the job; decide with her what "added" should mean.
- [ ] The 32 under "Check it is still open" were last looked at between 12 August and 1 October. A search run that re-checks them (both copies) would settle most.
- [ ] **(Xar)** High/Low/Later on the first 980 jobs come from the September workbook, not from her (she has set none). Clear them, so the setting only means hers?
- [x] The open full-time roles are in the first list, under their own heading (12 October; her question "why arent they present in the job app?").
- [ ] **(Xar)** Cardiff University's Professional Specialist is saved twice, from two sites, and shows as the first two rows of Apply now. Archive the jobs.ac.uk copy? (I did not: it is her saved data. One click: open it, "Archive this job".) The same for the older LinkedIn copy of Admiral Money's Senior Software Engineer.
- [ ] **(Xar)** Leads from September never checked since (348 that are not outside the search): they are out of the first list now, under the other tabs. Have a search check the likeliest, or leave them?
- [x] The same list on the day (12 October evening): Life OS reads JobMap's first screen through `FIRST_SCREEN` (exported by JobMap, both copies) and shows its groups. A job on the day opens that job in JobMap (`#job=<id>`).

## J. Life beyond study: admin, outings, people
> "I want the file, the cards and everything on the summer app to be preserved if they are about studying. If not, I want all of them to be gone, even sections related to those … Admin tasks are fine to remain, but all of them should be done … they can come up in my calendar when I'm looking at the history … the admining stuff should be transferred to another part rather than the Study Hub."
> "if I'm putting time to go on a date or go see Ben, or go outside Cardiff, picnic and stuff, I need to be able to make those tasks or make those notes and … assign them to a day under, I don't know, admin or anything."

- [x] **The summer app's life and admin data moved out of Study** (12 October): 18 admin tasks, 12 home chores, 5 health tasks, 98 meals (under Body & Health) and 7 career and interview notes are Life OS entries now, each marked with where it came from. All are done, so they show as history on the calendar. The routine rules are kept in a file. The Study hub's Summer 2026 holds study only. Backups first: `Life_OS_backups\summer-2026-not-study\`.
- [x] **A plan or a note for any day, under any area**: the add line has "for" (a day) and "under" (an area: Relationships, Travel, Life admin, Body and the rest). "Picnic with Ben, Saturday" under Relationships is on that day's path, on the calendar, and on the Relationships page.
- [x] **A page for every area**, and a new area, "Life admin".
- [x] Done things stay on the calendar, marked done.
- [ ] A person as more than an area: "see Ben" tied to Ben's own page (people exist in the core; the add line does not link to them yet).
- [ ] Repeating plans ("every Sunday, laundry"): the same need as job time (B).
- [ ] Editing a plan after it is made (its time, day, area, words) without the Ledger.

## K. Progress, review and focus for the whole of Life OS
> "it had amazing features, like kind of like tracking the progress and stuff in the study hub. We would call those … analytics or progress or planner, review and stuff. I need all those perfect … features inside the whole LifeOS app, not necessarily inside the study hub."
> "maybe we need the focus room or study room to be part of the LifeOS app, or live music, or … YouTube player."

Not started. The Study hub has all of these for study cards only: Review (a day looked back on), Planner (a week laid out), Progress, Analytics, the Focus Room with its timer, and the music and video players. Nothing is removed from the hub; the same things are wanted one level up.

- [ ] **A short design with her first** (one page, in `briefs/`): what "progress" counts outside study (jobs sent, plans kept, things ticked, money against budget), and what a week's review asks.
- [ ] **Review for the whole day and week:** what was planned and what happened, across study blocks, job time, her own plans, shopping and notes. The day page already holds every piece; it needs the look back.
- [ ] **Progress and analytics across parts:** study (from the hub), applications sent per week against a target (JobMap), plans done against plans made (core), spending against the month (Budget).
- [ ] **A planner for the week** in Life OS: the week's study blocks, job time and her own plans together, movable. The calendar's week view is the natural place.
- [ ] **Focus as part of Life OS:** a timer that can be started on anything (a study card, a job application, a plan), with the hub's music and video player in the top bar so it keeps playing from page to page. The hub's player lives inside its frame today and stops when she leaves the hub.

## L. Everything leads somewhere
> "everything should be clickable in the LifeOS in the study hub. When I click on a schedule, when I click on LifeOS, it should redirect to the main URL for LifeOS. I'm not seeing this happening."
> "when you click on [Life OS] … Click on the name above. It should, like directly direct to the main page, main URL. And if you click on a specific job role … on the today page … I should be able to kind of be directed to the same component … in the job map app." (12 October evening)

- [x] "Life OS" in the top bar leads to the first page from every page and every part (it was plain text until 12 October afternoon; a page left open since before needs one reload).
- [x] Inside the Study hub, the words "Life OS" on its save button lead to the Life OS first page; the rest of the button still saves.
- [x] A job named anywhere on the day opens that job in JobMap.
- [x] A study item opens its own card in the hub (see B).
- [x] A shopping list on the day opens Budget's Shopping; the strip above each part links its first line to the thing it names.
- [x] A link to another view of a part that is already open now moves the part there (before, it was lost).
- [ ] Not yet clickable, found while testing: the "Next boundary" tile on the hub's Today; a single shopping item (to its line in Budget); a meal; "At home" by place; the Notes panel rows open the Ledger, which has no single-entry page.
- [ ] **(Xar)** "When I click on a schedule": which schedule did not respond? The hub's hour-by-hour blocks open their cards for me; say where it failed.

## Waiting on Xar, gathered
1. Nothing is waiting on her from 12 October's six questions; all were answered that day.
2. ~~The summer study data that is not study~~ answered and done 12 October (section J).
3. Job time after 25 October: keep adding two weeks at a time, or make it a repeating routine?
4. Her detailed check of the look, and of the new Court.
5. JobMap, three questions in section I: the doubled vacancy, the September workbook's settings, the never-checked September leads.
6. "Use common sense": which change did she mean (section C)?
7. "When I click on a schedule": where (section L)?
8. Section K needs twenty minutes of her time for the design before any code.

