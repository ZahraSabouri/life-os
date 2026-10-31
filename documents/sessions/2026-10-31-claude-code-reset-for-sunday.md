# 2026-10-31 · Claude Code · Records · reset for tomorrow

## Goal
Xar, Friday evening: "reset everything for tomorrow again :D", then "go on" (read on Saturday afternoon, so tomorrow is Sunday 1 November). Start the plan again from tomorrow, inside her rules of 28 October.

## What I did
- Read the 28 October reset's decisions and method, the calendar from 26 October, the plan's blocks to 13 November, the ticks and events, gym bookings, bell, classes, and her Test 2 folder. No tick, focus session or day log since 26 October, so nothing to credit and nothing marked done.
- `.runtime/study-plan-2026-10-31/reset.mjs` (private, like the last one): no flag reads, checks and prints; `--apply` backs up and saves through the guarded plan and state routes.
- **Moved 8 blocks, removed 1, left 127 alone.** The three cards left from Thursday 29 October and what they pushed:
  - Sunday 1 November: MLE/MAP 09:00–10:30 (new), z-tests 10:40–12:10, Gym B 13:15, t-tests 14:30–15:45, project brief 16:10–17:10, weekly reset 17:20 (5.75 h).
  - Tuesday 3 November: Regression 1 09:00–10:30, Colab setup 10:40–11:10, then her class, gym and the evening's blocks as they were (5.67 h).
  - Sunday 8 November: Python basics 10:40–11:40, strings 14:30–15:30, collections 15:40–17:10. This uses that day's catch-up hour, which is removed (5.5 h).
- MLE/MAP goes first because it comes first in the course and in hw3; Regression 1 moves to Tuesday so topics still run in order before Regression 2 on Wednesday. Python waits until after Test 2 because Statistics comes first through 13 November and the eve of the test stays light.
- **The Test 2 formula sheet** (`formula-sheet-2.pdf`, in her folder since 30 October 17:18): the card "What to memorise and what the sheet supplies" now points to it instead of saying to look for it. The official exam-style questions are still not in the folder.

## Files and commits
- `Records: reset for Sunday 1 November; Test 2 formula sheet linked` (this note, DECISIONS, my lines in STATUS). The script, before, proposal and receipt are in `.runtime/study-plan-2026-10-31/`.

## How I checked it
- The script refuses to save unless: nothing on a Monday or Saturday; nothing past 18:00 on a Friday or Sunday; at most 6 hours a day and 90 minutes a block; no moved block overlaps a class, gym, plan or chosen event; every other card and block is exactly as it was; ticks unchanged; nothing left on past days. All pass.
- After saving: ticks identical, the saved plan equals the proposal, Today for 1 November lists its four MAT022 cards, and the bell's "3 study cards past their date" is gone.

## Data touched
- Study only, revision 57 → 58. Backup: `Life_OS_backups/study-2026-10-31/before-reset-2026-10-31-1793454654789.dump`; `before.json` beside the script.
- Not touched: Gym, jobs, Budget, Inbox, Cardiff Life, core entries.

## Problems and surprises
- The overlap check first stopped on a Cardiff event (a walk on Sunday). Researched events are options until chosen, and none is chosen in those days, so the check now counts only chosen ones.
- Three days of planned work did not happen on top of the earlier gap, and the only space before Test 2 is tight: Sunday and Tuesday are near the six-hour limit. There is no spare room left this week except Saturday and Monday, which she keeps free.

## Small decisions I made, and questions for Xar
- Kept Saturday and Monday free and Sunday's evening free, as decided on 28 October.
- Left Gym A of 30 October as it is: there is no log, and I cannot tell whether she went. If she went, she logs it; if not, Skip in Health → Gym. Its own note says to repeat missed foundation work rather than jump ahead, and A comes round again on Tuesday.
- Jobs stay paused 1–6 November (her rule), so I did not plan anything for the Cardiff University research assistant job closing Monday 2 November. Her call.

## Next step
Sunday 1 November: Today from 09:00. The 17:20 weekly reset checks sources and moves the next week.
