# 2026-10-12 · Claude Code · Stage 2b · CP5 (the Court as the working first page; today in every part)

## Goal
Xar, after the morning's work: "i still cannot see any meaningful changes for what i asked you initially in case of unifying all apps and making it genuinely functioning as a life os." With six answers: delete the test entries and improve "Recently filed"; job time both ways; move the 13 shopping items to Budget and out of the summer data; do what is best about the invented lines; the Court opens first with today in it ("why are you stuck to these … borders?"); today in every part.

## What I did
- **Shared day pieces.** What Today was built from is now `components/DayParts.jsx` (the add line, the day's path, the Study, Jobs, Home and Notes panels) and `lib/useDayPage.js` (one reading of a day and everything that adds to it). Today, the Court and the strip inside each part use them.
- **The Court, Modern:** greeting with one line of what the day holds; the add line (Plan, Note, To buy); the day's path in short form beside Study, Jobs, Home and Notes; "Recently filed"; "File something else" (the full form for every kind of entry, kept, closed by default); the areas, where Study, Career and Home say what today holds and an empty area shows no "0".
- **"Recently filed":** rows open their entry in the Ledger; a plan shows the day it is for; a row can be removed for good after a second press; time blocks are left out of it and out of the area counts.
- **Today in every part:** `components/AreaToday.jsx`, between the top bar and the part. Study hub: the next study block and its steps, the days to the next test. JobMap: what closes today, how many more this week, time set aside, sent this week. Budget: things to buy, tonight's meal, the month's budget. Cardiff Life: what she chose for today.
- **Things to buy from anywhere:** `hosting/home/shopping.mjs` and `POST /api/home/shopping`. It loads Budget's own rule files, makes the change with Budget's `addListLine` and `ensureShop`, and saves through Budget's own address with its revision check (one retry if Budget was saved in between). A thing already on the list is not added twice. "6 eggs", "rice x2", "500 g mince" set a quantity.
- **Job time:** a new kind of entry, "Time block" (`time-block`, with an `area`). The calendar draws it in its area's colour; the day shows it with "Done" and "Take off the day"; the Jobs panel shows the hours set aside today and how many applications were sent this week.
- **Deleting an entry:** `DELETE /api/entries/:id` (refused when the entry has files).
- **The other styles' Courts:** the twelve invented room lines, Madder's "Eleven days of study kept…", its three "4 open · exam 14 Jul" lines and Indigo's two "FIN301 in 11 days" lines are replaced by what is true today, or by what the room is for.

## Files and commits
- `[2b-cp5]` The Court is the working first page; today in every part; shopping and job time reach the day
- New: `frontend/src/components/DayParts.jsx`, `AreaToday.jsx`, `lib/useDayPage.js`; `hosting/home/shopping.mjs` and its test; `scripts/move-summer-shopping-to-budget.mjs`.
- Changed: `TheCourt.jsx`, `TodayView.jsx`, `CourtLayout.jsx`, `lib/day.js`, `styles/day.css`, `styles/skins.css`; `shared/entryTypes.js`; `backend/src/routes/entries.js`; `hosting/app.mjs`, `hosting/day/service.mjs`, `hosting/calendar/mappers.mjs`; tests; `TODO.md`, `STATUS.md`, `DECISIONS.md`, the brief.

## How I checked it
- Tests: 66 run, 66 pass (13 new: the shopping change against Budget's own rules; job time and the week's count; one read of entries for notes and job time; her time blocks in the path; several things to buy in one line).
- **Try-out** (test database refreshed from live; copies of JobMap's and Budget's data): the Court showed the day and the four panels; "eggs, 2 kg rice, onions x3" under "To buy" really went onto a list in the Budget copy and showed in the Home panel; "eggs" again answered "already there"; a plan typed on the Court sent the right request (caught, since the try-out shares the real Ledger); each part showed its strip with the part filling the rest of the window; Madder and Paper had no invented line left, Indigo two (its capture mock-up). The shopping move was rehearsed there twice: 13 moved, then nothing to move.
- **Live, after one restart (16:10) and the build:** the Court's heading read "MAT022 · In-class test 1 · in 11 days · 1 job to apply for today · 13 things to buy"; the day listed the lecture, the library block, and for any time the portfolio card, "Job applications" (Career) and the summer list (Home); tomorrow listed two study blocks, the lecture and "Job applications 15:45 to 18:45"; JobMap's strip named the job closing today. No page errors, no failed requests. The live Court looked at by eye in Modern at 1440.
- **Not checked:** a plan, a note or something to buy typed by her on live (the checks above caught or used copies; the live writes were the three data moves below); removing a row from "Recently filed" in the browser (the delete address was used seven times by script); the new Court and the strip in dark, at phone width, and in Madder, Indigo and Paper by eye beyond the text check; the strip above the Study hub when its own side menu is collapsed.

## Data touched (live, each after a copy)
- **Core:** copy `Life_OS_backups\core-2026-10-12\life-os-before-removing-tests-1791817859387.db` (read through SQLite, 7 entries). Then the seven July test entries deleted through `DELETE /api/entries/:id`: "test", "Aa", "Brief 4 Final Smoke Book", "Brief 4 Valid Book", "Brief 3 PATCH smoke task", "Brief 2 API smoke event", "Smoke test capture". Ledger: 7, then 0.
- **Budget:** revision 92 to 93. One list added, "To buy (from the summer list)", dated 12 October, 13 items (shampoo, bin liners, a bag, perfume, cream, washing-machine pods, bicycle, cutting board, ice bar, bedsheets, inositol, niacinamide, hand bag). Budget's own copy before the save: `budget-management\data\backups\state-r92-1791817877542.json`.
- **Study database:** dump `Life_OS_backups\study-2026-10-12\before-moving-summer-shopping-1791817876734.dump`. Then `set_aside.shoppingList` (13 items) removed from the Summer 2026 workspace, with a `moved` line saying where it went. Still kept aside there: 131 cards, 100 schedule rules, 11 exceptions, the interview module, 6 notes.
- **Core again:** 14 time blocks "Job applications" added for 12 to 25 October (12 October for any time; the rest at the hours the study plan reserved).
- `lifeos_test` replaced by a copy of live Study data for the try-out.

## Problems and surprises
- Budget's rules run in their own sandbox, so their results could not be compared directly in tests; a plain copy is compared instead. My first test fixture was not a state Budget accepts (its categories need a pool); the fixture was corrected, not the rule.
- A named category that was empty made a thing land with no category at all; fixed before anything was saved.
- The 14 time blocks first showed as 14 rows in "Recently filed" and as "14" on the Mind tile; both now leave time blocks out.
- An open Budget tab must be reloaded once: Budget refuses a save from a tab that has not seen revision 93.

## Small decisions I made, and questions for Xar
- The summer items are things like a bicycle and bedsheets, not groceries. They are on their own list rather than mixed into a shop list, dated 12 October because Budget requires a date.
- Job time was added for two weeks, not to 27 December, so she can see it and change her mind before 60 more are laid down.
- "Take off the day" on a time block sets it to `cancelled`; "Done" hides it and the Jobs panel still counts it as time set aside that day.
- The Court's full capture form is kept, closed, under "File something else".
- **For her:** where the rest of the summer's kept-aside data should go (131 life and admin cards, 100 schedule rules, the interview module, 6 notes), since she wants the study part to hold only study.

## Next step
`documents/TODO.md`: the same working Court for Madder, Indigo and Paper, each in its own design; the card link with a Study hub rebuild at a moment she is not in it; ticking a study step and a thing to buy from the day; job time as a repeating routine.
