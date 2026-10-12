# Life OS: to-do

**Written 12 October 2026 by Claude Code, at Xar's request.** One list of everything open, drawn from three places: what Xar said on 12 October (quoted), what the project's documents already aim for (`Life_OS_Vision.md`, `ROADMAP.md`, `Life_OS_Plans_Inventory.md`, `STATUS.md`), and what using the app showed. `STATUS.md` says where things stand today; this says what is left. Tick items here as they are done and add new ones where they belong.

Marks: `[x]` done · `[~]` partly · `[ ]` open · **(Xar)** needs her answer or is her step.

## The order of work
1. ~~E. Dark mode across the app~~ done 12 October (Modern, as she asked).
2. ~~A. The study plan's leftovers~~ checked and recorded 12 October; two small items left.
3. **B. The day reaches everything:** mostly done 12 October. Next: the card link (with a Study hub rebuild), ticking a study step from the day, job time as a repeating routine.
4. **C. Shopping, meals and money on the day:** the list exists and is added to from anywhere (12 October). Next: ticking as bought, recipes and tonight's meal, "left to spend".
5. **D. The first pages:** the Modern Court is the working first page (12 October). Next: the same for Madder, Indigo and Paper, each in its own design.
6. **F, G, H** as they come up; none blocks her this month except backups.
7. **I. Applying now:** the order is fixed (12 October). Next: her four answers.

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
- [ ] **"Open in Study hub" opens that card.** Now it lands on the view used last, and on "Which semester?" in a fresh browser. Needs a change inside the Study hub and a rebuild of it, at a moment she is not using it (a rebuild can break a hub tab that is open).
- [x] **Plan the day from Today** (12 October): one line, Plan or Note. "17:30 library" is placed at 17:30, "Lidl" is for any time that day; a hint says what will be saved. Her own plans can be ticked off or taken off the day.
- [x] **Today for any day** (12 October): the day before, today, the day after, or a date; the calendar's day has "Open this day".
- [ ] Plans typed in words without a clock ("library after class") are kept as any-time plans. Placing them after a class, or by dragging, would be the next step in making input effortless.
- [ ] Moving a plan to another time or day from Today (now: take it off and add it again, or edit it in the Ledger).
- [x] The Court and Today add things with the same line (12 October).
- [x] **Job-application time on the day, both ways** (her answer, 12 October): as time blocks on the calendar and in the day's path (she can tick each off or take it off the day), and as the day's target in the Jobs panel ("3 h set aside today", "sent this week"). Blocks exist for 12 to 25 October, from the windows the study plan reserved.
- [ ] Job time is 14 single blocks. Make it a repeating routine (a weekly pattern with exceptions), so it need not be added again after 25 October and one change moves every week.
- [ ] **Jobs panel as a work list:** the next jobs to apply for in JobMap's own priority order (closing dates first), not only closing dates; "applied" marked from Today; this week's count against a target.
- [ ] Tick a step and mark a card done from Today, saved through the Study hub's own rules so an open hub tab loses nothing.
- [x] **Today in every part** (her answer, 12 October: "good to have today in all sub apps"): a strip under the top bar inside the Study hub, JobMap, Budget and Cardiff Life says what today holds for that part and leads back to the whole day.
- [x] The Study hub keeps its own Today (her answer: "sometimes one only wants to see what to study for today"); Life OS's day is the whole day.

## C. Shopping, meals and money on the day
> "I'm going to grocery shopping to Lidl. So I also need my grocery shopping list to be accessible, connected to the first page and to the whole app and the budget thing and recipe stuff, because then I'm going home to make dinner."

- [x] Home panel on Today: shopping lists with what is still to buy, the day's meals, what is at home by place, the month's budget (read only).
- [x] The 13 shopping items from the summer app are on a Budget shopping list, "To buy (from the summer list)", and are gone from the study data (12 October; `scripts/move-summer-shopping-to-budget.mjs`).
- [x] Something to buy is added from the Court or Today ("To buy": "eggs, 2 kg rice, onions x3"), onto Budget's list by Budget's own rules (`hosting/home/shopping.mjs`).
- [ ] Tick a thing as bought from the day. In Budget "bought" means a receipt (money and stock), so a tick on the day should be "in the basket" until the receipt is recorded.
- [ ] The summer list holds things like a bicycle and bedsheets beside shampoo. Budget needs lists that are not one shopping trip ("sometime"), without a date.
- [ ] Tonight's dinner: Budget has no recipes saved (0) and one meal entry. Recipes need a way in that costs little (by hand, or "give this to your AI" import); then "what can I cook from what is at home" and "add what is missing to the list" (Budget can already make a list from a meal's missing items).
- [ ] "Left to spend this month" on Today, by Budget's own rule (a big shop is counted over the months it feeds). Today shows the month's budget and a link for now.
- [ ] After the shop: "Record the receipt" from Today's Home panel.
- [ ] The list on the phone at the shop: waits for F.
- [ ] Roadmap Stage 5: Money and Home rebuilt inside Life OS, recipes as their own collection, money in whole pence.

## D. The first pages
> "I'm not happy with any of the design versions' first pages, and I feel like we had some features like adding notes and stuff on the first pages that are now left alone."
> "all four should be amazing in their own designing context but for now let's focus the most on Modern."

- [x] Notes are no longer left alone: a note typed on Today, or on the Court, is on Today for that day.
- [~] **The Court, in every style** (Modern done 12 October; the others partly):
  - [~] Invented lines removed (12 October). Every room now says what is true of it today (Study, Career, Home) or what it is for. Left: Indigo's capture box is still a mock-up of AI capture ("FIN301 exam", "Buy Sara's gift", "File both").
  - [x] The seven July test entries deleted (her answer; a copy of the core database first). "Recently filed" kept and made useful: each row opens its entry, a plan shows the day it is for, a row can be removed for good (asked twice), and bulk time blocks are left out.
  - [x] Modern: the capture box is replaced by the add line (Plan, Note, To buy); the full form for the other 46 kinds is kept under "File something else". The other styles still have their own capture boxes.
  - [x] Modern: the Court carries the day itself (the path, and Study, Jobs, Home and Notes), with "The whole day" leading to Today. The other styles still show their own short list.
  - [~] Modern: Study, Career and Home tiles say what today holds; an empty area shows no "0". Still: Relationships opens Cardiff Life; no door for Money or Events (Roadmap 1b).
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
- [ ] Study hub leftovers from the summer: "Hour-by-hour protected routines, study, project, and job blocks" and "days to exam window" wording; about 200 summer names in page code; classes and assessments not editable in the hub; the folder and address still called `summer-rescue`.
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

- [x] **My priority puts roles confirmed open first** (12 October, both JobMap copies): "Apply now" for an open check in the last 14 days, then "Check it is still open", then "Not checked since 13 Sept". Deadlines lead inside each. The line above the list counts the roles ready to apply for.
- [ ] **(Xar)** The rest of her sentence: what else about the order feels wrong.
- [ ] **(Xar)** High/Low/Later on the first 980 jobs come from the September workbook, not from her (she has set none). Clear them, so the setting only means hers?
- [ ] **(Xar)** 9 confirmed-open roles are full-time or over her hours; 8 of them are not in "Part-time leads" (they are in Shortlist, under "Hours need agreement"). Show them in the first list?
- [ ] **(Xar)** Two vacancies are saved twice, from two sites (Cardiff University's Professional Specialist; Admiral Money's Senior Software Engineer). Archive the second copy of each?
- [ ] **(Xar)** 12 part-time leads from September were never checked. Have a search check them, or archive them?
- [ ] The same order on Today's Jobs panel (B: "Jobs panel as a work list"). It now only lists closing dates.

## Waiting on Xar, gathered
1. Nothing is waiting on her from 12 October's six questions; all were answered that day.
2. The summer study data still keeps aside what is not study: 131 life and admin cards, 100 schedule rules, the interview module, 6 notes. She said the study part "has nothing to do with anything other than studying". Where do these go: Life OS tasks and notes, or an archive file?
3. Job time after 25 October: keep adding two weeks at a time, or make it a repeating routine?
4. Her detailed check of the look, and of the new Court.
5. JobMap, four questions in section I: the September settings, full-time roles in the first list, the doubled vacancies, the unchecked September leads.

