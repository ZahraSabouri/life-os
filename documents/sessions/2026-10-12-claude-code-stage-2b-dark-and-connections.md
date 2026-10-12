# 2026-10-12 · Claude Code · Stage 2b · CP4 and part of CP3 (dark mode; the to-do list; the day's connections)

## Goal
Xar, in the afternoon: check Codex's study plan without rewriting it; "make a new thorough todo list" from the documented aims, what she raised that day and what using the app shows; "start doing the coding and implementation steps". Then: "one thing that is missing and we talked about is the dark mode all across the app", "reread and double check [my objectives]", and "we only need the dark mode for the modern skin".

## What I did
- **Check of the study plan:** in `sessions/2026-10-12-claude-code-study-plan-check.md`. Sound; one out-of-date record renamed.
- **The to-do list:** `documents/TODO.md`. Every point she made on 12 October is quoted at the head of the section it belongs to (A study plan, B the day reaches everything, C shopping and meals, D the first pages, E light and dark, F phone), followed by the documents' open aims (G foundations, H later rooms) and her six open questions.
- **Walked through the app as a user** in a private browser (`scratchpad/walk.mjs`): every main page, the Study hub's views after opening the semester, Budget, JobMap, Cardiff Life. Findings are in the to-do list; the ones that matter most: the card link from Today does not open the card; the Court's "Recently filed" holds seven test entries from July and nothing real; one file fails to load on the Court; the Study hub says "days to exam window · unconfirmed" although test 1 is confirmed.
- **CP4, light and dark:** one saved choice for the whole app, apart from the style; a button in the top bar of every page and part, shown in a style that has both versions. Modern dark is one palette plus the four fixed colours Modern had. The framed parts are told the choice by `hosting/skins/public/boot.js`; the Study hub's own light and dark follows. After her message, the button is hidden in Madder, Indigo and Paper and no second version of them is planned.
- **CP3, the parts that only touch the core and the calendar:**
  - **A line on Today that adds to the day.** "Plan" or "Note". A plan with a clock time ("17:30 library", "Library 17:30-18:30", "dinner at 8pm") is saved as an event at that time; without one ("Lidl") as a task for any time that day. A hint under the line says what will be saved before Enter. Both are ordinary Life OS entries, so they are on the calendar and in the Ledger.
  - **Her own plans can be ticked off ("Done", tasks) or taken off the day.** Nothing is deleted: the entry's status becomes `done` or `cancelled`.
  - **Today for any day:** the day before, today, the day after, or a date (`/today?date=2026-10-13`). The calendar's day has "Open this day". On another day the "now" line and the attention lists are left out, and a note cannot be added (a note belongs to the day it is written).
  - **Study blocks on the calendar at their clock times** (`hosting/study/calendar.mjs`). A card with blocks is shown by them; the block on its due date carries the deadline, so an unfinished one still comes up under "Needs attention"; a card without blocks keeps its all-day line. A light `plan()` read was added to the hub store for this.

## Files and commits
- `b753018` [2b-cp4] Light and dark: one button everywhere, Modern dark across every part
- `[2b-cp3]` Plan the day from Today, any day, and study blocks on the calendar
- New: `frontend/src/components/ModeSwitch.jsx`, `hosting/skins/modes.test.mjs`, `documents/TODO.md`, two session notes.
- Changed: `frontend/src/lib/grounds.js`, `groundContext.jsx`, `App.jsx`, `CourtLayout.jsx`, `TheCourt.jsx`, `TodayView.jsx`, `CalendarView.jsx`, `lib/day.js`, `styles/palettes.css`, `skins.css`, `day.css`; `hosting/skins/public/boot.js`, `hosting/study/calendar.mjs`, `hosting/study/hub/store.mjs`, `hosting/calendar/mappers.mjs`, `hosting/app.mjs`; tests in `hosting/day/page.test.mjs` and `hosting/study/calendar.test.mjs`.
- Still on `stage/4b-one-look`; `stage/2b-my-day` has not been cut (Codex's uncommitted files are still in the working tree).

## How I checked it
- Tests: 53 run, 53 pass (16 new this session: light and dark rules and palette completeness; the one-line plan reader on 16 typed examples; own plans and study blocks in the day's path; study blocks on the calendar across the clock change).
- **Dark, on the try-out:** pictures looked at of Court, Today, Calendar, Ledger, the Study hub's Today, Budget, JobMap and Cardiff Life in Modern dark. The button pressed while inside each of the four parts, both ways, and the page asked what it drew (dark `rgb(18, 25, 22)`, light `rgb(244, 242, 234)`). Madder, Indigo and Paper with dark chosen: unchanged, no button. Live after the build: pressed, reloaded, stays dark.
- **Plans, on the try-out, with every save caught in the test browser** (the try-out shares the real Ledger): "Library 17:05-17:25" and "Lidl" typed; the requests were an event at 16:05Z to 16:25Z and an all-day task for the date; both appeared in the path; "Done" and "Take off the day" sent `done` and `cancelled`; the path returned to what it was.
- **Other days and the calendar:** tomorrow from the day chooser showed the 09:00 and 10:45 study blocks and the 13:10 lecture; the calendar's 13 October lists the two blocks at their times where it listed the two cards as all-day lines; "Open this day" leads to `/today?date=2026-10-13`. Live after the restart: the same two blocks from `/api/calendar`.
- **Not checked:** a real plan or note saved from Today on live (no test entry was put in her Ledger); dark inside dialogs, drawers and deeper pages of the parts; the new line and day chooser in Madder, Indigo and Paper by eye; phone width for the new controls.

## Data touched
- One Study assessment record renamed (see the study-plan note). Nothing else.
- `lifeos_test` replaced twice by a copy of the live Study data for the try-out. Live Life OS stopped and started once at 15:45 (one second).

## Problems and surprises
- The laptop restarted at 15:15; Life OS was started again at 15:23 (by her).
- A reading taken right after pressing the light/dark button still showed the old colour: the page fades over 0.45 seconds. Not a fault.
- A downscaled picture made the Court's type menu look white in dark; asking the page showed it was drawn dark.
- "Open in Study hub" from Today needs a change inside the Study hub and a rebuild of it. A rebuild replaces the files a hub tab she has open may still ask for, so it waits for a moment she is not in the hub.

## Small decisions I made, and questions for Xar
- A plan with a time is saved as an event, one without as a task, both as ordinary entries. "Take off the day" sets the status to `cancelled` because the core has no delete.
- The line remembers whether she last used Plan or Note.
- The block on a card's due date is drawn as the deadline, so "Needs attention" keeps working without an extra all-day line.
- **Asked by her, answered in my reply:** what "Recently filed" on the Court is for and why it looks broken. It lists the newest entries saved through Life OS's own capture box; the seven in it are tests from 6 and 11 July (five made by agents, named "Brief … smoke …"), and its rows do nothing when clicked. It will now fill with what she adds on Today. Whether to archive the seven is her call.
- Her six open questions are at the end of `documents/TODO.md`.

## Next step
`documents/TODO.md`, section B: the card link (with a Study hub rebuild, when she is not in it), ticking a card's step from Today, job-application time once she has answered. Then section C: a shopping list, starting with her answer about the 13 kept-aside items.
