# Stage 8: the task loop (moving, starring and noting tasks; replanning a day)

**Status:** approved by Xar on 17 November 2026 ("I want you to start coding for that"; replanning "is a priority … let's go on with that"). Building on the branch in use, `stage/7-separation`, because Tasks and the day checklist live there. Objectives: TODO section AB (AB1, AB2).

## Goal

When a day does not go as planned, the person using Life OS can move, star and note what they have to do in one or two taps wherever it shows, and can ask for the rest of the day to be replanned without AI: rules decide, a preview shows what would change, one undo takes it back.

## Rules for every checkpoint

- A thing is moved where it is kept: a Life OS task in the core, a Study card in the Study hub (its revision check), a "Waiting on you" item in Mail (snoozed to a day). Nothing is copied.
- Done is never guessed from the clock. A slot that has passed is not a finished task.
- Fixed things (classes, appointments, events) never move. A day of a repeating plan moves alone; the repeat is unchanged.
- Every change can be undone from the line that reports it.
- Words in the app are for a customer: plain, no developer notes.

## Checkpoints

### CP1: move, star and note a task (done 17 November)
- [x] Move menu on a task wherever it shows (Tasks board, the day checklist on Today, every Court and the calendar's day, the opened task): Later today · Tomorrow · Next week (Monday) · Pick a day · Someday. An optional reason (no time, blocked, not ready, no energy) is chosen before the destination; one tap is enough without one. The List view keeps its table; its rows open the task, which has the menu.
- [x] Each move is kept on the task (`details.moves`: when, from, to, why). "Moved 3×" shows beside it; from three moves the opened task suggests making it smaller, giving it a day that can be kept, or taking it off the list.
- [x] A star (`favorite`) on any task; starred tasks come first in every list of tasks and are marked.
- [x] Dated notes on a task (`details.log`): a note with optional minutes, shown newest first with the moves in the opened task. Ticking a task done offers "How did it go?" (in the opened task at once; from a card or the checklist through "Add how it went"), which can be skipped. The existing single note is labelled "About this task".
- [x] A "Waiting on you" item can be moved to a day (snoozed) from the checklist and the Tasks page.
- [x] Checks: shared rule tests (19, moves, log, where each choice lands, London time kept across the clock change); render tests (tasks 7, day 5); the core route test on `lifeos_test` saves and reads back star, moves and notes and refuses a bad note; the server restarted for the new fields; a headless walk of Tasks and Today in all four styles with saves answered in the browser, no page errors.
- [ ] Follow-up: the Guide step "Move it, star it, note it" is written; its picture (`tasks-actions.jpg`) is still to take with `scripts/guide-shots.mjs`.

### CP2: one model of a thing to do, and one-tap day actions
- [ ] Every movable thing on a day described the same way: fixed or movable (today only / any day), minutes and minutes left, can it be split and the smallest piece, earliest start, deadline, what it waits on, star, times moved. Study cards and "Waiting on you" items are read into it; each is still saved where it is kept.
- [ ] "Running late": +15, +30, +60 minutes moves the rest of the day's movable timed things and stops at the next fixed thing.
- [ ] Choose several things and move them together.
- [ ] A Study card can be moved from Life OS (the hub's revision check).

### CP3: "Replan the rest of today"
- [ ] A rule-based planner in `shared/` (no AI): free gaps between fixed things from a restart time to a finish time, a buffer kept, unfinished movable work ordered by slack before its deadline, then star, then priority, then what it waits on; split where allowed; what does not fit goes to the next days the same way, and anything that would now miss its deadline is named.
- [ ] A preview (stays, moves, split, tomorrow, does not fit, each with a reason), then apply, with one undo.
- [ ] A "minimum day" choice: only the one or two things that must happen.
- [ ] Tests built from the real rollovers of 16 and 17 November (`.runtime/evening-reset-2026-11-16/`, `.runtime/rollover-2026-11-17/`): their before-state as input, their checked result as what a good plan looks like.

### CP4: close the day, start the day
- [ ] At night: each unfinished thing with a suggested next step, accepted in one go. Missed days of a repeat are skipped, never piled up.
- [ ] In the morning: a short check of the day and its load.

### CP5: planned against actual
- [ ] Minutes planned and minutes taken (notes, focus sessions, ticks) per kind of work; a realistic load per weekday; the usual overrun; the buffer measured instead of guessed. Shown in Review and used by CP3 and CP4.

### CP6: notices with buttons, then a widget
- [ ] When a block ends, a computer notice with Done / Need 30 more / Move.
- [ ] Try the Windows 11 Widgets board (an installed web app's widget, built as an Adaptive Card): Now and Next with the same buttons.

## Later, not in this stage
AI turning spoken or typed words ("lost the morning, finish by midnight") into the planner's inputs. The planner itself stays rule-based so it never has to be thrown away.
