# Life OS: status

**Updated 14 November 2026 by Claude Code (Tasks, and the fresh plan).** Branch `stage/7-separation`; app http://127.0.0.1:47850. Main holds JobMap CP1 and stages 5?6, merged locally, not pushed. Standalone JobMap stays frozen.

## Now

- **14 November: Tasks in Life OS, and a fresh plan to 10 January.** Xar asked for a new plan (CMT309 studied week by week, then each question; MAT021 from 16 November; work; gym reset; research; applications) and for task management with checklists, including the July design's daily task cards. Built: any entry can carry steps; a Tasks page (Board and List; lanes Today, This week, Deep work, Backlog, Waiting, Rescue) gathering her tasks, Study hub cards and Waiting on you; the day's task cards on Today and every Court; paid work kept apart from job-application time. The plan is in the data: [the plan](PLAN_2026-11-16_to_2027-01-10.md), objectives in [TODO M](TODO.md). Commits `[tasks-cp1]`–`[tasks-cp3]`; [session](sessions/2026-11-14-claude-code-tasks-and-fresh-plan.md).

- **12 November data reconciliation:** verified source updates in Study, JobMap, Calendar and Inbox. Added two CV work blocks and rescheduled unfinished plans using their existing records. [Session](sessions/2026-11-12-codex-mail-and-planning-reconciliation.md).

- **12 November Study Hub update:** recorded both tests sat, report final checks, the December coursework focus and full attendance in the new module. Live readback verified Study revision 118 and 31 timetable sessions. [Session](sessions/2026-11-12-codex-study-coursework-focus.md).

**Stage 7, code apart from data** ([brief](briefs/stage-7-separation.md)): CP1?CP4 done; CP5, the public version, next. Single-user, MIT, all parts, fresh history, no personal data. Xar names the destination before push.
- CP1 privacy scan and inventory; CP2 shared configuration; CP3 core moved to PostgreSQL with all rows compared, old SQLite untouched.
- CP4 content out of code: scan down to four CP5 files. Summer sources archived with checksums; course content comes from records. `/events` replaces Cardiff Life with redirects/settings/choices preserved. Budget names/keys neutral; JobMap places preserve rankings. Mail uses HARVEST.md plus private HARVEST.local.md.
- **6 November planning correction:** native Budget meals, JobMap priority/goals, Study cards/blocks, People/Waiting on you, Health context and research workstreams saved. Generic duplicates retired, never deleted. Xar chose data integration only; no source/schema changes. [Session](sessions/2026-11-06-codex-calendar-data-native-integration.md).

- **7 November corrections:** morning sequence and person follow-up moved; project tasks aligned with live repository/report/board progress; deferred review moved after January; programme and travel/letter administration integrated. [Session](sessions/2026-11-07-codex-calendar-data-corrections.md). No app code changed.

- **7 November wake-up replan:** unfinished routine and meals shifted later, with two hours of interview preparation and a 90-minute project block. Groceries moved to the following day. [Session](sessions/2026-11-07-codex-calendar-data-wake-up-replan.md). Saved records and the reloaded My day were checked.

- **9 November appointment correction:** existing appointment updated from the confirmed call and its call task completed. Health and Calendar readback verified. Live interview time and joining link reported in chat. [Session](sessions/2026-11-09-codex-calendar-data-appointment-update.md).

## How to see what's new

Refresh the app. **Tasks** is in the top bar ([Tasks](http://127.0.0.1:47850/tasks)); the Court and Today carry the day's task cards; [Monday 16 November](http://127.0.0.1:47850/today?date=2026-11-16) shows the new plan's first day. The Guide has a Tasks chapter (`/guide/tasks`).

## Exact next step

0. Xar: follow the plan from Monday; on Monday ask the CMT309 module leader whether the deadline is 17 or 27 December (task on Monday's cards). Change anything in the app itself.
1. Development remains stage 7 CP5: "Continue stage 7: CP5, the public version." (Tasks is now in the code CP5 publishes.)
2. Cowork handoff: use mail/HARVEST.md v2 and HARVEST.local.md; prepare September weekly backfill, try on lifeos_test before import.
3. Task connections and date-aware job matching are backlog work, not implemented by this data update.

## Waiting on Xar

Accept core move/Study archive (old SQLite stays; deletion is hers); name the new GitHub repository; decide whether to remove empty cardiff-own-events setting. From 14 November: the CMT309 deadline answer (17 or 27 December); the MAT021 brief when it appears (if it is the 70% piece, move 24 November's Week 4 to it); ENCAP's agreed weekly hours; 12 tasks from the 7 November morning plan now wait in Rescue (tick, re-date or take off: hers to decide); export anything wanted from standalone Claude Design before it closes on 14 December.

## Known problems and limits

- Do not run hosting/app.test.mjs until fixed: two Study checks lack If-Match and its target is lifeos; its one 4 November write was refused.
- Older failures: date-dependent mail reading-room test; three Study checks (two toISOString uses, lazy route); eight browser checks need a server. Two Budget snapshot tests remain private.
- Saved Outlook archive has stand-in IDs and mostly 5,000-character text limits. Bash sandbox cannot reach PostgreSQL; use PowerShell. Check concurrent work/git status before commits.
- Slow first load: read together, the year-wide calendar (1.4 s alone) and the day (0.5 s alone) take 7 s or more; the day now allows 15 s per part so Study shows as loading, not "could not be read". The cause (each loading the whole Study workspace) is still there.
- General task relationships, contextual room navigation and future-start matching remain limited; career goals do not change matching/automation. The in-app browser works and My day was verified on 7 November; native desktop access failed on 6 November.

## Data

Read back 14 November (fresh plan): Study revision 119 → 120 (29 cards rewritten or added, 46 future blocks replaced by 50, history and all progress unchanged, MAT021 coursework assessment added); core 280 → 313 entries (33 added, 45 changed, 235 others compared equal); 5 work repeats then marked `work`. PostgreSQL dump verified before writing; evidence in `.runtime/fresh-plan-2026-11-14/`. Read back 9 November: core 276 entries, two existing entries updated and all others compared equal. PostgreSQL backup verified before guarded writes. Health and Calendar verified. Private evidence is in `.runtime/appointment-update-2026-11-09/`. Last verified 7 November: Autumn Study revision 112, JobMap 73, Budget 117. Earlier evidence remains in `.runtime/wake-up-replan-2026-11-07/` and `.runtime/calendar-corrections-2026-11-07/`. No migrations or direct database writes.

Last five sessions: [Tasks and the fresh plan](sessions/2026-11-14-claude-code-tasks-and-fresh-plan.md), [Mail and planning](sessions/2026-11-12-codex-mail-and-planning-reconciliation.md), [Coursework focus](sessions/2026-11-12-codex-study-coursework-focus.md), [Appointment update](sessions/2026-11-09-codex-calendar-data-appointment-update.md), [Wake-up replan](sessions/2026-11-07-codex-calendar-data-wake-up-replan.md).
