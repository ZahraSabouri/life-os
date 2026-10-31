# 2026-10-31 · Codex · Records · Sunday reset and next week's attendance

## Goal

Xar: “reset again for tomorrow”. Client date: Saturday 31 October; tomorrow: Sunday 1 November. Follow-up: “i will only go to two of my classes next week on thursday. will be home for work or library all other days”. Keep the prior protected time and honest progress.

## What I did

- Read AGENTS, STATUS, decisions, reset method, recent notes and scripts; checked Git and live services. Claude Code had already saved the Sunday reset at revision 58 (`dba98c6`). Verified that work instead of duplicating it or claiming its earlier eight moves.
- Independently checked the whole saved plan to 31 December: all cards/blocks, progress, 83 source files, detailed minutes, boundaries, breaks, class/exam travel, expanded job/research repeats, gym and lunch. Found Tuesday's lunch clash and asked about it. Her attendance clarification removed the class/travel conflict; **no early-lunch exception was used**.
- Applied her attendance choice to **2–8 November only**. Archived five personal teaching occurrences (Monday/Tuesday/Wednesday MAT022 lectures, Friday lab and containing lecture), recording her reason. All 76 timetable records and original titles/times/rooms/source metadata remain; none deleted or falsely called university-cancelled. Thursday's CMT309 lecture/practical remain. **Friday's Test 2 remains 14:10–15:00, Abacws 2.26**, as a distinct assessment.
- Moved eight existing study blocks earlier on Tuesday/Wednesday. Kept every study card and block; no extra study load. Tuesday now finishes 17:50, Wednesday 16:25. The 20-minute Wednesday clarification card now explicitly supports home/library; an office-hours visit is optional, and no message is sent.
- Updated the existing Study hub how-it-works note and attendance assumptions. Monday/Saturday, Friday/Sunday evenings and 24–27 December stay protected; two weekly gym slots and job pauses stay as chosen. Tomorrow's saved schedule is unchanged.

## Tomorrow and next week

Sunday: 09:00–10:30 MLE/MAP; 10:40–12:10 z-tests/confidence intervals; lunch 12:15–13:00; Gym B 13:15–14:15; 14:30–15:45 t-tests; 16:10–17:10 project brief/group part; weekly reset 17:20–17:50. 345 study minutes; evening free.

Tuesday: Regression 09:00, Colab 10:40, chi-squared 11:20; lunch 12:50–13:35; ANOVA 13:45; existing Gym A 15:30; lab practice 16:50–17:50. Wednesday: regression 09:00/10:40, lab 11:50; lunch 12:35–13:20; practice test 13:30, clarification 14:40, mark/repair 15:10–16:25. Thursday: 09:00 lecture (Sir Martin Evans C/-1.04), 16:20 practical (Queen's South S/3.20), two hours of light review. Friday: short warm-up and Test 2. Monday/Saturday free.

## Files and commits

This note, DECISIONS, TODO and only my STATUS content: `Records: Reset next week around Thursday classes (Codex)`. No app-code/build/restart/push. Existing scheduled-workflow STATUS paragraph is preserved unstaged; Cardiff code/instructions/tests, workflow files and mail prompts remain with their owners.

## How I checked it

- Read-only initial comparison matched revision 58's saved proposal and preserved progress; verified its backup's PGDMP header.
- New dated `reset.mjs`: no flag reads/checks/prints every day; `--apply` backs up, uses revision-checked session PATCH, guarded plan PATCH and state PUT with writer ID, then re-reads. Exact saved plan/state, preserved overlays/progress/settings/history, detailed step totals and all 83 paths pass. Every future block has its card; all day/break/lunch/travel/holiday/6-hour/90-minute checks pass. No plan deletes or new completion.
- API calendar readback shows exactly two teaching occurrences next week, both Thursday, and Test 2 once on Friday. Original metadata retained; all other sessions/assessments identical. Core entries exactly unchanged.
- Headless Chrome via playwright-core from summer-rescue: Today for Sunday, Tuesday, Wednesday, Thursday, Test 2 and project day; Study hub This Week and Calendar Week. Skipped lectures absent from the relevant days; Thursday classes/test present. Zero page errors/failed local responses, no browser writes. Initial browser test sampled before data loaded; changed the test to wait and repeated successfully.

## Data touched

Study revision **58 → 59**. **72 cards/135 blocks → 72/135**; eight blocks move earlier. Five of 76 session records archived, none deleted. One card's title/instructions and the existing planning note updated; all progress preserved. Core stays 207, all 20 gym records unchanged. No Budget, JobMap, Inbox or Cardiff writes.

New PostgreSQL backup (PGDMP verified): `Life_OS_backups/study-2026-10-31/before-attendance-reset-20261031-1793455666390.dump`. Private before/proposal/receipt/readback/checks/screenshots: `.runtime/study-plan-2026-10-31-codex-check/`. Receipt complete, all post-save checks pass. Earlier 31 October reset backup retained.

## Small decisions and questions

“Next week” is Monday 2–Sunday 8 November. Only Thursday teaching attendance changes; Friday's assessment is retained. Free teaching hours create breathing room, not more work. No earlier-lunch exception, inferred studying, gym completion, group role or sent message. The unlogged 30 October gym remains for Xar to record or skip herself.

## Next step

Open Today for Sunday 1 November, or Study hub → This Week / Calendar → Week. Follow the week and log actual completion. Project role/check-ins, CMT309's deadline conflict and future MAT021 dates remain the existing unknowns; no new answer is needed for this reset.
