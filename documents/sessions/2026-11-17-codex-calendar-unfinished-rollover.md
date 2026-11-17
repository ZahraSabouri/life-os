# 17 November 2026 · Codex · Unfinished-work rollover

## Goal

Xar: “move everything undone from yesterday to next days even if things need replanning”. Yesterday was Monday 16 November in Europe/London. Scope: existing Life OS tasks, calendar and linked Study planning data.

## What changed

- Moved all unfinished Monday items: the three CMT309 blocks and their cards, Proffiliadur baseline/setup, its 1 h 45 min work capacity, and the close-out. No open flexible Monday item remains.
- Preserved the live completed state of MAT700 and MAT022 follow-ups, dinner, the walk and Monday's lecture tick. The cancelled deadline enquiry and lunch, and archived Time Series block, remained closed.
- CMT309: setup Tuesday 20:55–21:40; Week 1 basics Wednesday 20:25–21:40; strings Thursday 19:00–20:15; collections Friday 08:45–10:15; lab Saturday 10:45–12:00; Q1 write Saturday 13:30–15:00; Q1 tests Sunday 15:15–17:15; Week 3 Monday 23 November 18:30–20:30. Week 4 still follows on Tuesday 24 November. Every block's duration and checklist/progress were preserved. The internal 16 December submission target is unchanged.
- ENCAP: baseline/setup Tuesday 17:00–18:45; trace Tuesday 18:45–19:00 and Wednesday 13:45–15:30; tests/READMEs Wednesday 15:30–16:45 and Thursday 20:30–21:15; copy fixes Thursday 21:15–22:15 and Friday 18:00–20:00; handoff Friday 20:15–21:15. Milestone notes now state the sequence. This reserves 9 h 45 min within the existing initial 10-hour scenario; the initial hours check remains required, and no paid time was logged. If blocked by access or hours, the Friday package reports completed evidence and remaining work.
- The missed Monday work occurrence moved to Thursday. A cancelled occurrence marker on Monday prevents the routine regenerating the missed block; future repeats remain unchanged.
- Close-out moved to Tuesday 21:50–22:05. Internship shortlist moved to Saturday 15:15–16:00, and audio-codec research to Saturday 16:30–18:00. Regular Thursday/Sunday application blocks, MAT021 teaching and coursework, gym and the health appointment remain in place.

## How checked

Read live API records, Study state/revision, day checks and the two-week calendar before planning. The live state differed from the previous session: follow-ups were completed, the deadline enquiry cancelled, notebook setup moved to 17:00, and Study revision was 136. Used those current records.

Validated entry details and checked proposed intervals against the calendar, reserving a buffer through 12:30 for Thursday's appointment whose end is not recorded. Rechecked records/revisions immediately before writing. Created and verified a PostgreSQL custom-format dump listing core and Study data, then used owning APIs with timestamp/revision/plan-hash guards.

Readback passed: 9 core entries updated; 3 created (the cancelled repeat marker and 2 Friday work blocks); 340 → 343 core entries; all 331 unrelated existing entries equal; 8 Study blocks moved and 8 cards' planning dates updated; Study revision 136 → 137. All day ticks, actual logs, completion status and checklist progress preserved. All expected slots returned by Calendar; Monday has zero Study blocks and zero unfinished non-repeat core entries. No new overlaps. Planned work this week totals 585 minutes.

## Files, data and limits

Private scripts, snapshot, proposal, backup, write journal, readback and verification: `.runtime/rollover-2026-11-17/`. Updated the plan document and current status. No app source/schema changes, messages, applications or work logs. No broad build/test run for this data-only update. Existing uncommitted project work was retained; no mixed commit made.

## Next step

Refresh Today/Calendar. Begin the postponed Proffiliadur baseline in Tuesday's 17:00 work block and CMT309 setup at 20:55. The agreed work hours and setup access remain to verify through the existing checklist. Development remains the separate stage 7 CP5 task.
