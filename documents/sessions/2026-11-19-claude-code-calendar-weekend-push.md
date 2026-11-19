# 2026-11-19 · Claude Code · Calendar data · weekend push and dissertation record

## Goal
Xar: "push everything to next monday" — clarified: "postpone everything (obviously other than my doctors appointment and events) that we planned for after the ENCAP meeting for after monday". Also: add her dissertation-progression record (Cardiff MSc, 19 November) somewhere in Life OS.

## What I did
- Everything flexible from Friday 20 10:00 to Sunday 22 moved to Monday 23 and after. Fixed choices: MAT021 coursework plan Monday 08:00 (before the 09:00 coursework block; due 1 December), Ask Mum Monday 12:40, Friday's after-meeting notes/hours and next week's ENCAP planning inside Monday's work block (its repeat day cancelled by a marker), this week's PhD review cancelled (the weekly one on Wednesday 25 covers it; kept).
- A small planner in the script placed the rest into free time from Monday (weekdays 08:30–21:45, weekends 10:00–19:30, 10 minutes between things): groceries Monday 17:10, MAT021 write-up and review, weekly reset, Life OS adverts, applications and shortlist (Friday 27). The CMT309 chain from Friday onward (35 one-off blocks) was laid again in order into its own slots and the free time; it ends 21 December (was 23 December). Card dates follow (start = first block, due never earlier than before).
- Gym: every session one slot later again (Gym A week 1 is Tuesday 24). All-day tasks moved (gym restart Tuesday 24, LaTeX CVs 28 and 29 November). Weekend repeats (daily admin ×3, groceries, Sunday job search) skipped by markers.
- Dissertation record: task "Dissertation progression · a written decision from Dr Cooper and the missing results" (Study, high, Waiting lane, Wednesday 25, the eight next actions as steps, the open cases in its note) and a note of 19 November with the full record, linked to the task.

## How I checked it
Dry run with overlap checks and entry validation; `--apply` after a PostgreSQL dump (listed with `pg_restore --list`); Study state and plan with revision and plan hash; core writes with If-Match. Read-back: 26 changed entries equal to their patches, all others unchanged (380 → 389), Study revision 140 with 38 blocks moved, ticks unchanged, every moved block on the calendar, the skipped repeat days gone, no flexible plan left from Friday 10:00 to Sunday. One overlap 20 November–23 December, between two existing entries (MAT021 drop-in and a MAT021 group-coursework drop-in notice, Wednesday 25 12:00).

## Data touched
Backup and evidence: `.runtime/push-2026-11-19/`. The dissertation record's source text is kept there too (`dissertation.md`, private, not in git).

## Next step
Xar follows Monday 23 onward. If Dr Cooper has not replied by Wednesday 25, the task says to follow up.
