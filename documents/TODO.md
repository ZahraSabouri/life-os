# Life OS: to-do

**Written 12 October 2026 by Claude Code, at Xar's request.** One list of everything open, drawn from three places: what Xar said on 12 October (quoted), what the project's documents already aim for (`Life_OS_Vision.md`, `ROADMAP.md`, `Life_OS_Plans_Inventory.md`, `STATUS.md`), and what using the app showed. `STATUS.md` says where things stand today; this says what is left. Tick items here as they are done and add new ones where they belong.

Marks: `[x]` done · `[~]` partly · `[ ]` open · **(Xar)** needs her answer or is her step.

## The order of work
1. ~~E. Dark mode across the app~~ done 12 October (Modern, as she asked).
2. ~~A. The study plan's leftovers~~ checked and recorded 12 October; two small items left.
3. **B. The day reaches everything:** study blocks on the calendar, the card link, planning the day from Today, other days.
4. **C. Shopping, meals and money on the day.**
5. **D. The first pages.**
6. **F, G, H** as they come up; none blocks her this month except backups.

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
- [ ] **Study blocks on the Life OS calendar at their clock times.** Today they are in the hub's Schedule and on Today only; the calendar shows the card as an all-day line. This is the missing half of "connect Study hub to the calendar".
- [ ] **"Open in Study hub" opens that card.** Now it lands on the view used last, and on "Which semester?" in a fresh browser.
- [ ] **Plan the day from Today:** add something to do today, with or without a time ("library after class", "Lidl", "dinner"), and see it in the path. Today only takes a note. (Vision: effortless input. Inventory: "Day planning".)
- [ ] **Today for any day:** yesterday, tomorrow, a chosen date, so tomorrow can be planned the evening before. The calendar's day opens it.
- [ ] **Job-application time on the day.** Codex's plan keeps 3 hours a day in a file outside the app. **(Xar)** real calendar blocks she can move, or a daily target in the Jobs panel?
- [ ] **Jobs panel as a work list:** the next jobs to apply for in JobMap's own priority order (closing dates first), not only closing dates; "applied" marked from Today; this week's count against a target.
- [ ] Tick a step and mark a card done from Today, saved through the Study hub's own rules so an open hub tab loses nothing.
- [ ] A way back to the day inside each part (the top bar's Today exists; a "back to today" beside a card or job opened from the day would save a step).
- [ ] The Study hub has its own Today ("mission control") and Life OS has Today. Decide what each is for, or fold one into the other. **(Xar)**

## C. Shopping, meals and money on the day
> "I'm going to grocery shopping to Lidl. So I also need my grocery shopping list to be accessible, connected to the first page and to the whole app and the budget thing and recipe stuff, because then I'm going home to make dinner."

- [x] Home panel on Today: shopping lists with what is still to buy, the day's meals, what is at home by place, the month's budget (read only).
- [ ] **There is no shopping list in Budget.** Thirteen shopping items from the summer app are kept aside in the Study database. **(Xar)** bring them into a Budget shopping list?
- [ ] Add a shopping item from Today, and tick one as bought, saved through Budget's own rules.
- [ ] Tonight's dinner: Budget has no recipes saved (0) and one meal entry. Recipes need a way in that costs little (by hand, or "give this to your AI" import); then "what can I cook from what is at home" and "add what is missing to the list" (Budget can already make a list from a meal's missing items).
- [ ] "Left to spend this month" on Today, by Budget's own rule (a big shop is counted over the months it feeds). Today shows the month's budget and a link for now.
- [ ] After the shop: "Record the receipt" from Today's Home panel.
- [ ] The list on the phone at the shop: waits for F.
- [ ] Roadmap Stage 5: Money and Home rebuilt inside Life OS, recipes as their own collection, money in whole pence.

## D. The first pages
> "I'm not happy with any of the design versions' first pages, and I feel like we had some features like adding notes and stuff on the first pages that are now left alone."
> "all four should be amazing in their own designing context but for now let's focus the most on Modern."

- [x] Notes are no longer left alone: a note typed on Today, or on the Court, is on Today for that day.
- [ ] **The Court, in every style** (she keeps it; these are what is wrong with it):
  - [ ] Madder, Indigo and Paper show invented lines on the Study, Career and Body tiles ("FIN301 - three revision blocks left this week", "Admiral / Data Analyst - applied Tuesday", "Eleven days of study kept"). Roadmap 1b already says "the sample lines go". **(Xar)** confirm.
  - [ ] "Recently filed" shows agents' test entries ("test", "Aa", "Brief 4 Final Smoke Book", "Brief 3 PATCH smoke task"). **(Xar)** archive them? Deleting is her step.
  - [ ] The capture box says "Tell Life OS anything - it files itself after you confirm". Nothing files itself; it saves as the type chosen. Plain wording until AI capture exists.
  - [ ] Its "Today" box is a flat list where renewals outrank the lecture. Give it the same order as Today, or one line and a link.
  - [ ] Doors show 0 and a description for nine empty areas; Relationships opens Cardiff Life; there is no door for Money or Events (Roadmap 1b).
  - [ ] One file fails to load on the Court (a 404 in the browser).
- [ ] **(Xar)** Which page opens first when Life OS starts: the Court or Today?
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
- [ ] Git: cut `stage/2b-my-day`; nothing is pushed; Codex's uncommitted notes and JobMap files are still in the working tree.
- [ ] Do not run `hosting/app.test.mjs` until tests have their own database.

## H. Later, unchanged (Roadmap stages 4 to 7 and late stages)
- [ ] Career rebuilt inside Life OS; scheduled searches pointed at the Life OS inbox; both JobMap copies kept in step until then.
- [ ] Cardiff Life rebuilt, with connectors. Its research is from 1 October and the page itself warns it is over a week old.
- [ ] The other rooms (people, culture, body, travel, memories, mind, closet), tags, search in English and Persian, favourites, boards, photos.
- [ ] AI capture ("speak or type naturally"), voice, an MCP server over Life OS. Still the heart of the Vision; parked on purpose.
- [ ] Motion, a moodboard, the app's real name.

## Waiting on Xar, gathered
1. Job-application time: calendar blocks or a daily target? (B)
2. The 13 kept-aside shopping items into a Budget list? (C)
3. Remove the Court's invented lines; archive the agents' test entries? (D)
4. Which page opens first? (D)
5. The Study hub's own Today and Life OS's Today: one or two? (B)
