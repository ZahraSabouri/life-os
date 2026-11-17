# 16 November 2026 · Codex · Evening reset and adaptive planning discussion

## Goal

Xar reported that none of the morning work had happened and she was getting ready for university. Reset today's flexible plan to start at 17:00 and finish by midnight; then discuss possible app development for days disrupted after detailed planning.

## What changed

| Time on Monday 16 November | Plan |
|---|---|
| 17:00–17:15 | CMT309: ask about the official deadline |
| 17:15–18:00 | CMT309 notebook setup and proforma |
| 18:00–19:15 | Week 1 computational thinking and Python basics |
| 19:15–19:50 | Dinner |
| 19:50–21:05 | Week 1 strings |
| 21:05–21:20 | Walk and break |
| 21:20–23:05 | ENCAP Student Developer: existing Phase 0 checklist |
| 23:05–23:25 | MAT700 result follow-up |
| 23:25–23:45 | MAT022 pass/resit/progression follow-up |
| 23:45–00:00 | Buffer, save work and close |

Overflow remains unfinished and scheduled: Ben's research enquiry Tuesday 12:00–12:15, MAT021 preparation Tuesday 12:45–13:10, internship shortlist Tuesday 20:55–21:40, and MAT021 lecture/coursework review Wednesday 18:55–19:45. The matching Ben reminder in Mail was snoozed to Tuesday. These slots were checked against the live calendar. Tuesday MAT021 preparation ends at the existing lecture's start, so it is a task to do already at class.

The missed lunch plan was taken off today's checklist without recording it done. Monday's paid-work occurrence was materialised at its new evening time using the existing routine link; the parent repeat and next Monday remain unchanged. The existing ENCAP checklist still belongs to Monday, with its evening slot and note corrected. The fixed 15:10–17:00 MAT021 lecture remains the official timetable record; no attendance claim was made.

## Verification and data

The live app was reachable at port 47850. A PostgreSQL custom-format dump was created before writes and its `pg_restore --list` output checked for core and Study table data. Changes used the owning APIs with core timestamps, the Study revision and plan hash, and the Mail action revision.

Readback verified 11 core updates, one work occurrence creation (338 → 339 entries), four Study block moves, one Study card's planning dates (revision 130 → 131), and the Mail reminder. All 327 unrelated core entries compared equal, as did the Study state except for the intended dates and normal update timestamp. Calendar contains every expected slot with no overlaps; all flexible timed blocks for today start at or after 17:00 and end by midnight. The Today API returns the three CMT309 blocks at their new times. Checklist completion and actual work logs were preserved.

Private proposal, pre-write snapshot, backup, write journal and verification: `.runtime/evening-reset-2026-11-16/`. No app source/schema changes, build or broad test run; this was a data-only replan. Existing uncommitted work was left in place. No messages were sent or applications submitted.

## Development proposal, not an approved implementation

The existing app has manual plan moves, repeating-plan occurrence overrides, task estimates/checklists and a Rescue lane. Its Study replan panel schedules exam cards against study capacity. Those pieces do not by themselves form a unified same-day recovery flow across core tasks, Study, work and fixed commitments.

Suggested first increment: a **Replan the rest of today** control on Today. Input a restart time, hard finish and optional energy level; preserve completed work and fixed commitments; show a preview of what stays, moves, splits or no longer fits; then apply with an undo record. A suggested default reserves 15–20% of the available window for disruption in addition to meals and essential travel. The percentage is a design proposal, not a measured claim or a preference Xar has selected.

Useful modes are a simple shift when everything still fits, a priority-based replan when it does not, and a minimum-day plan containing the most important one or two outcomes. Tasks need remaining effort and a resumable next step, independent from their calendar blocks. Deadlines and prerequisites should constrain overflow placement, while actual completion must never be inferred from a missed or elapsed time slot. Show one current task and what comes next, with flexible work ordered inside broad windows where exact times are unnecessary.

Start with a deterministic preview/apply/undo flow and a clear overflow list. Natural-language input and duration learning can be later additions if useful. No new feature was implemented or added to the approved stage scope in this session.

## Next step

Refresh Today and use the evening plan. Discuss the proposed recovery interaction with Xar before choosing a development scope. Stage 7 CP5 remains the separate existing development checkpoint.
