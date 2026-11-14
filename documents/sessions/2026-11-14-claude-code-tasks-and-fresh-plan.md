# 2026-11-14 · Claude Code · Tasks, and the fresh plan

## Goal
Xar, 14 November: a fresh plan for the CMT309 coursework (studying every session of the coding class before its assignment), the new module MAT021 from 16 November, 5–20 hours of work, a reset gym plan, research and thesis time, and job applications for after September 2027; and in the code, task management with checklists in the main app, and the parts of her July designs that were never built, starting with cards for daily tasks. Her objectives are quoted in `TODO.md` section M.

## What I did
- **Tasks (`[tasks-cp1]`, `[tasks-cp2]`):** any entry can carry `steps`; a task has `lane`, `slot`, `estimate`, `due` and `proof` (`shared/tasks.js`). `/tasks` (Board and List, the July board and ledger) gathers her tasks, the Study hub's cards for now (from the day) and Waiting on you, each ticked where it is kept; drag between lanes; a dialog to open a task and change its steps; a new-task form after the design's "new leaf". The day's task cards (the design's "Today's folio") on Today and all four Courts; a task on the day's path shows its steps. Lanes: Today, This week, Deep work, Backlog, Waiting, Rescue (slipped more than two days). Every change is sent with If-Match.
- **Fixes found while looking with her data:** the Jobs panel counted the work shifts as application time (now `work: true` on time blocks and repeats, passed through repeats, the calendar and the day); old late chores filled Today (now Rescue); her tasks were listed twice on Today; Study showed "could not be read" when the day and the year's calendar were read together (day parts now get 15 s).
- **The plan (data only, through the APIs):** `.runtime/fresh-plan-2026-11-14/` prepare → apply → verify. Study hub: CMT309 Week 1–10 cards dated and given steps, each before its question (Q1, Q2, Q3, Q6, Q8, Q9, Q7, Q10), submission on 22 December; MAT021 Individual Coursework card and assessment (1 December 09:30) and Friday write-ups. Core: ENCAP work repeats (Mon, Tue, Wed), two application blocks (Thu, Sun) replacing ten repeats, research Saturdays to 9 January with tasks and steps, PhD-review checklists, gym restarted at week 1 (15 old sessions put away, 15 new), CV and admin tasks moved out of the new blocks. No clash on any day from 15 November to 10 January. `documents/PLAN_2026-11-16_to_2027-01-10.md` explains it.
- **Guide:** a Tasks chapter (five pictures), the Court's tasks, Today's marks; pictures retaken.

## How I checked it
Unit and render tests: shared/backend 21 + day 20 + frontend 62 + tasks render 4 + study render 2, all pass. Headless Chrome on a private try-out and on the live app with every save answered in the browser: Tasks, Today and the Court in Modern, Paper, Madder and Indigo, no page errors. Data: verified PGDMP dump before writing; readback compared every card, rule and created entry with the proposal, her Study progress and all past blocks unchanged, 235 unrelated core entries unchanged.

## Data touched
Study revision 119 → 120; one assessment added, one assessment and two modules patched. Core 280 → 313 entries (33 added, 45 changed), then 5 work repeats marked `work`. Nothing deleted: superseded records archived or taken off. Life OS restarted three times with the launcher (new entry rules, the work flag, the day's time limit).

## Problems and surprises
- Every gym session since 30 October was still "planned": the restart begins at foundation week 1.
- An older record still shows 17 December for CMT309 (Today's Study panel said "33 days to … 17 Dec"); the portal says 27 December. Left as data; Monday's first task asks the module leader.
- Inbox actions cannot be given a date by the app (only her fields), so the ENCAP onboarding actions stay as they are on the Tasks page (Backlog) rather than being duplicated as tasks.
- Codex was running, but nothing in the project changed for 50 minutes before or during my writes; a scheduled task had staged (not applied) the MAT021 date at 17:00, which this plan applied.
- The standalone Claude Design closes by 14 December 2026; the July design boards are in `code/life-os/frontend/design-*.png`.

## Small decisions I made, and questions for Xar
Submission on 22 December, not the old 15 December target, because studying every week first needs the time. Work at about 7 hours (inside her 5–20) until the hours are agreed. Applications cut from about 15 hours of evening blocks to 4. Gym on Tuesday after the lecture and Saturday morning. Stale tasks of 7 November are left for her in Rescue.

## Next step
Xar follows the plan and changes it in the app. Development: stage 7 CP5.
