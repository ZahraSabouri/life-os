# Stage 2b: My day (Today rebuilt as the page you work from)

**Status:** asked for by Xar on 12 October 2026; direction chosen by her the same day (four answers below); CP1 and CP2 done and live that day · CP3 next
**Branch:** CP1 and CP2 are committed on `stage/4b-one-look`, because Codex asked for no branch switch during its study-plan work that day (`documents/COORDINATION_2026-10-12.md`). Cut `stage/2b-my-day` from it at the next session.

## Goal
One page from which Xar runs her day. It shows the day in time order and lets her reach what each part of it needs: the study card for a study block, the jobs that are due, the shopping list, tonight's meal, the month's budget, and today's notes. The Study hub, JobMap and Budget stop being places she has to go and look in; the day brings their current content to her and opens each one at the right place.

## What Xar said (12 October)
- "I look at Life OS and see it has lots of features for planning days, but JobMap isn't like that. We want to connect JobMap to Study hub, to the Life OS calendar."
- "I'm not happy with any of the design versions' first pages."
- "We had some features like adding notes on the first pages that are now left alone."
- "There is this Job app that is separate somewhere for itself, and this Study hub that is separate somewhere else. I want a connection so I can access all of these from my day."
- "I need my grocery shopping list to be accessible, connected to the first page and to the whole app and the budget thing and recipe stuff."
- Her four answers:
  1. **The Court stays as it is. Today is rebuilt as the working page.**
  2. **Layout:** "a combo of this path + glance and your four panels": the day as a path in time order, with Study, Jobs, Home and Notes as four panels beside it.
  3. **Styles:** "all four should be amazing in their own designing context but for now let's focus the most on Modern." And: "just like Study hub that's got a dark and light mode, I want that button to be universal and everywhere in the app."
  4. **Phone:** "for now I won't use the app [at the shop] but we definitely need to develop the app and all parts of it for phone access and it should be responsive. That is not our priority yet."

## What is wrong with the first pages now (looked at on 12 October)
- The Court and Today both list today's dated things, and neither lets her work from them. A renewal has the same weight as a lecture, and five "all day" rows come before the one timed thing.
- What matters in each area is behind a door: which card to study and its steps, which jobs are due, what to buy, what is for dinner. The page shows a title and a link.
- A note typed on the Court is filed in the Ledger and never seen again on the day it was written.
- In the ancient styles the Court's Study, Career and Body tiles show invented lines ("FIN301 - three revision blocks left this week", "Admiral / Data Analyst - applied Tuesday", "Eleven days of study kept"). Not part of this stage (the Court stays), listed under open questions.

## What already exists and is reused
- `/api/calendar` gathers dated things from every area: core entries, birthdays, Study (classes, assessments, cards), JobMap (deadlines of saved or applied jobs, follow-ups), Budget (renewals, budget months, shopping lists with a date, planned meals) and Cardiff events. JobMap and the Study hub are therefore already connected to the calendar. What is missing is their content, and a page that uses it.
- The Study hub keeps its study blocks (with clock times and the card each belongs to) in the semester's plan. They are shown only on the hub's own Schedule page; the calendar does not carry them.

## How it works
- **One request for what the calendar does not carry:** `GET /api/day?date=YYYY-MM-DD` (`hosting/day/`). It returns the day's study blocks with their cards, and the four panels: Study (today's cards with their steps, the next dated assessment, progress towards it), Jobs (saved or applied jobs due within a week, follow-ups, interviews), Home (shopping lists with their items, today's meals, what is at home by place, the month's budget) and Notes (notes written that day). It only reads. Each source that cannot be read is named, and the rest still shows.
- **The page** (`frontend/src/components/TodayView.jsx`, `styles/day.css`): a quick note line; the path (timed things in order with a "now" marker, each study block opened to its card; then things for any time today; then a slim "also today" row for renewals and deadlines); the four panels; "Needs attention" and "Next six days" kept below.
- **Drawn with the shared style tokens** (`--m-*` in `palettes.css`), so each style draws the page with its own boxes, type and corners. Modern is designed and checked by eye first.
- **Acting from the day comes in two steps.** First (CP2): read, and open the owning part at the right place. Then (CP3): tick a step or a shopping item on the day itself, through the owning part's own save rules.

## In scope / not in scope
- In: the Today page, the day request, notes on the day, a light/dark button everywhere (Modern first), the three other styles' designs of Today, one-day study cards shown once on the calendar.
- Not in: changing the Court (her answer); phone access and sign-in (wanted, later stage); rebuilding JobMap or Budget natively (Roadmap stages 4 and 5); writing to the Study hub's saved plan (Codex's import of 12 October owns it).

## Checkpoints

### CP1: The day request (done 12 October)
- [x] `hosting/day/service.mjs`: study blocks for a date from each active semester's plan (the Study hub's own expansion rule, `summer-rescue/src/utils/schedule.js`), joined to their cards; the Study, Jobs, Home and Notes panels; source statuses.
- [x] `GET /api/day` in `hosting/app.mjs`.
- [x] `hosting/study/calendar.mjs`: a card whose start and due date are the same day shows once.
- **Done when:** the request answers for today on the try-out with real blocks, cards, jobs and budget content, and a missing source is named instead of breaking the rest.
- **Verify:** `node --test hosting/day/ hosting/study/calendar.test.mjs hosting/calendar/`; the request on the try-out (port 47860).
- **Commit:** `[2b-cp1] The day request: study blocks, and the Study, Jobs, Home and Notes panels`

### CP2: Today as the working page (Modern) (done 12 October)
- [x] The path, the four panels, the note line, and the kept lists, as described above. A "now" line sits between what is over and what is ahead.
- [x] Each panel opens its part: Study hub, JobMap, Budget, Ledger. A study block's card link carries the card (`/study#/today?card=…`). *The hub still asks "Which semester?" first unless "open the semester I used last" is ticked: moved to CP3.*
- **Done when:** on the try-out, in Modern at laptop and phone width, the page shows today's classes and study blocks in order, the card and steps of a study block, the jobs due this week, the shopping list or a plain "no list yet", and a note typed there appears under Notes at once.
- **Verify:** pictures looked at by eye (Modern at 1440 and 390 wide; the other three styles for legibility only); no page errors; `npm run build` for the frontend.
- **Commit:** `[2b-cp2] Today is the page to work from: the day's path with Study, Jobs, Home and Notes`

### CP3: Acting from the day
- [ ] "Open in Study hub" from Today opens the semester and the card straight away (the hub's entry screen accepts the semester from the address).
- [ ] Tick a card's step and mark a card done from Today (through the Study hub's saved state, with its revision check; an open Study hub tab must not lose work).
- [ ] Tick a shopping item as bought, and add an item, from Today (through Budget's own save).
- [ ] Job-application time on the day (needs Xar's answer: see open questions).
- **Done when:** a tick on Today is there when the owning part is opened, and the other way round.

### CP4: Light and dark everywhere (done 12 October)
- [x] One light/dark button in the top bar of every page and every part (`ModeSwitch.jsx`). The choice is one saved value for the whole app (`life-os.mode`); a style lists the versions it has (`GROUND_MODES` in `lib/grounds.js`) and shows its own when it lacks the chosen one.
- [x] Modern dark: one palette in `palettes.css`, plus the four fixed colours Modern had in `skins.css`. The framed parts get it through `hosting/skins/public/boot.js`, which now writes the chosen light or dark on their page as well as the style.
- [x] The Study hub's own light/dark follows it (it reads the palette's `--m-scheme`).
- [x] **Xar, 12 October: "we only need the dark mode for the modern skin."** No second version of Madder, Indigo or Paper; the button does not show in them.
- **Verified:** on the try-out, every page and part looked at in Modern dark (Court, Today, Calendar, Ledger, Study hub's Today, Budget, JobMap, Cardiff Life); the button pressed while inside each part, both ways; the three other styles unchanged with dark chosen and no button; live after the build, pressed and reloaded. 13 tests (`hosting/skins/modes.test.mjs`, `recolor.test.mjs`).
- **Not looked at in dark:** dialogs, drawers and deeper pages inside the parts.
- **Commit:** `[2b-cp4] Light and dark: one button everywhere, Modern dark across every part`

### CP5: Today in Madder, Indigo and Paper
- [ ] Each designed from that style's Court page (not a recolour), looked at by eye, shown to Xar.

## Data safety
- CP1 and CP2 only read. The one write is a note, through the existing `/api/entries`, as the Court already does.
- The try-out uses the test Study database and copies of JobMap's and Budget's data. Its notes go to the real core database (the try-out shares it), so no test note is typed there.
- CP3 writes through the Study hub's and Budget's own save rules and needs a backup of both before its first run.

## Tests
`hosting/day/service.test.mjs` (blocks for a date, cards joined, each panel, a failing source), and one more case in `hosting/study/calendar.test.mjs` (one-day card shown once). Run with `node --test`.

## Acceptance checklist for Xar
1. Top bar → Today. The day is in time order: classes and study blocks with clock times, a "now" marker, then anything for any time today.
2. A study block shows its card: title, steps, hours, "done when". "Open in Study hub" opens the hub.
3. Study panel: the test and how many days are left, and how many of the cards before it are done.
4. Jobs panel: the saved or applied jobs due in the next seven days, soonest first.
5. Home panel: the shopping list with its items (or "No shopping list yet" with a button to make one), today's meals, what is at home, the month's budget.
6. Type a note and press Enter: it appears under Notes at once, and in the Ledger.
7. Renewals and other all-day things sit in one slim row, not at the top.

## Risks and open questions
- **Job-application time has no home.** Codex's plan keeps suggested daily windows (3 h) in a file outside the app, because job hunting does not belong in the Study hub. Should they become real calendar blocks she can move, or a daily target shown in the Jobs panel? Xar's choice.
- **The month's spending figure.** Budget counts a big stock-up over the months it feeds. Today shows the month's budget and links to "My month"; it does not compute "left to spend" itself until it can use Budget's own rule.
- **Recipes:** Budget's recipe list is empty (0 recipes, 1 meal entry). The Home panel shows planned meals; recipes appear once there are some.
- **The Court's invented sample lines** in the ancient styles should go; her answer keeps the Court as it is, so this needs her word.
- **A shopping list on the phone** waits for phone access.
