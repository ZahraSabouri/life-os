# 2026-10-12 · Claude Code · Stage 2b · CP1 and CP2 (Today as the page to work from)

## Goal
Xar's request had two halves: a study plan for her three autumn modules entered into the Study hub, and then "a connection so I can access all of these from my day" (JobMap, the Study hub, the calendar, the shopping list, budget and recipes), with first pages she is happy with. Codex was already doing the first half when she gave me the same request, and she asked us to cooperate. This session did the second half's first two checkpoints.

## What I did
- **Did not enter a second study plan.** I had read all three module folders and the timetable and was about to write cards when I found Codex's prepared plan in `.runtime/study-plan-2026-10-12/`. I left the plan to Codex and gave it a cross-check from my own reading (`.runtime/study-plan-2026-10-12/NOTE-FROM-CLAUDE-CODE.md`): the test's scope as the formula sheet shows it, what is not on the sheet, where she is in the material, unofficial answers to the Week 2 practice sheet, and two things that would have shown wrong on the calendar. The shared hand-over file is `documents/COORDINATION_2026-10-12.md`.
- **Looked at the first pages** (Court in Modern and Madder, Today in Modern) and put four questions to her with drawn options. Her answers are in `DECISIONS.md` and the brief.
- **Wrote the brief:** `documents/briefs/stage-2b-my-day.md` (five checkpoints).
- **CP1, the day request:** `GET /api/day?date=…` (`hosting/day/service.mjs`). For one date it returns the Study hub's study blocks with the card each belongs to, and four panels: Study (today's cards with their steps, the next dated assessment and the days to it, cards done before it, cards past their date), Jobs (saved or applied jobs closing within seven days, follow-ups, interviews, counts), Home (shopping lists with what is still to buy, the day's meals, what is at home by place, the month's budget) and Notes (notes written that day, London time). It only reads. A source that cannot be read is named and the rest still answers; nothing about the failure reaches the browser.
- **The calendar:** a study card that starts and is due on the same day now shows once (`hosting/study/calendar.mjs`), not as "Start · title" plus the deadline.
- **CP2, the page:** Today (`frontend/src/components/TodayView.jsx`, `lib/day.js`, `lib/useDay.js`, `styles/day.css`) is rebuilt. A note line at the top; the day as a path in clock order with a "now" marker, each study block opened to its card, steps and "done when"; "Any time today"; a slim "Also today" row for renewals and deadlines; beside it Study, Jobs, Home and Notes; below, "Needs attention" and "Next six days" (first six, with "Show more"). Room names from the timetable are shortened ("Abacws 2.26") and their long web addresses dropped.
- The page is drawn only with the shared style tokens, so each style draws it with its own boxes, corners and type. Modern is the one designed and checked.

## Files and commits
- `[2b-cp1]` and `[2b-cp2]` on `stage/4b-one-look` (see "Small decisions": Codex asked for no branch switch today).
- New: `hosting/day/service.mjs`, `hosting/day/service.test.mjs`, `hosting/day/page.test.mjs`, `code/life-os/frontend/src/lib/day.js`, `lib/useDay.js`, `styles/day.css`, `documents/briefs/stage-2b-my-day.md`, this note.
- Changed: `hosting/app.mjs` (the route), `hosting/study/calendar.mjs` and its test, `frontend/src/components/TodayView.jsx`, `frontend/src/main.jsx`, `STATUS.md`, `DECISIONS.md`, `Life_OS_Plans_Inventory.md`, `COORDINATION_2026-10-12.md` (my section only).

## How I checked it
- `node --test hosting/day/service.test.mjs hosting/day/page.test.mjs hosting/study/calendar.test.mjs hosting/calendar/calendar.test.mjs hosting/calendar-route.test.mjs`: 37 run, 37 pass (11 new).
- Try-out (port 47860, the test database refreshed from live after Codex's import, copies of JobMap's and Budget's data): the request answered for 12 October with the 17:30 library block and its card (3 steps), the test in 11 days, 0 of 27 cards before it done, 7 jobs closing within a week, 24 things at home, October's £250.
- Pictures looked at by eye on the try-out: Modern at 1440 wide (twice, before and after fixes) and at 390 wide; Madder, Indigo and Paper at 1440 wide. Fixed from looking: an empty box under a card with no steps; section labels drawn in the heading face; a gap under the Study panel (the panels are now two columns that each keep their height); the figure "11" reading as "II" in the ancient styles' serif.
- Live, after the restart and the build: the page at 1440 in Modern, no page errors; the four panel links; the card link. **The note line was checked without saving:** the save request was caught in the test browser and answered there, so the right request is sent, the line clears and the note appears, and nothing went into her Ledger. A real note has not been saved from this page yet.
- **Not checked:** the other three styles beyond one picture each (they are CP5); Calendar and Court by eye after the build (the new styles are all named `day-…` and nothing else changed); a Cardiff event she has chosen appearing in the path (none today); a day with a shopping list or a planned meal on live (she has none; covered by tests only).

## Data touched
None of hers. The test database `lifeos_test` was replaced by a copy of the live Study data for the try-out (`.runtime/hub-dev/copy-live-to-test.mjs`). The try-out's copies of JobMap's and Budget's data were deleted afterwards, and the try-out build folder with them. Live Life OS was stopped and started once at 14:11 (one second).

## Problems and surprises
- **Two agents, one request.** Found by looking at what had changed in the project in the last hours before writing data. If I had entered my own plan she would have had every card twice.
- I created a branch before reading Codex's coordination file, which asks for no branch switch; removed it a minute later with nothing committed.
- "Open in Study hub" carries the card in the address, but the hub still asks "Which semester?" first unless "open the semester I used last" is ticked there.
- Budget counts a big shop over the months it feeds, with rules that live in its page code. Today therefore shows the month's budget and a link to "My month", not a "left to spend" figure of its own.
- This shell fails on long inline scripts that contain quotes; scripts were written to the scratch folder and run from there.

## Small decisions I made, and questions for Xar
- The stage is "2b" (Today belongs to Stage 2 of the Roadmap). Commits are on `stage/4b-one-look` for today; cut `stage/2b-my-day` from it once Codex has finished.
- Acting from the day comes in two steps: read and open first (done), ticking from the day next (CP3).
- Jobs are listed by closing date. JobMap's own priority order stays in JobMap.
- **For her:** (1) Should the 3 hours a day for job applications become real calendar blocks she can move, or a daily target in the Jobs panel? Codex's plan keeps suggested windows in `.runtime/study-plan-2026-10-12/job-reservations.json`, outside the app. (2) The Court's invented sample lines in the ancient styles ("FIN301…", "Admiral…"): remove them? (3) Light and dark: Madder and Indigo are dark by nature and Paper is light. Does each get a second version, or does the button apply to Modern only for now?

## Next step
CP3 in the brief: the card link opening the semester and the card straight away; ticking a card's step and a shopping item from Today, each through its owner's save rules, after a backup of both. Then CP4 (light and dark everywhere, Modern first).
