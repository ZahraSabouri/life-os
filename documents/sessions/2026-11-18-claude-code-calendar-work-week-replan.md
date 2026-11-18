# 2026-11-18 · Claude Code · Calendar data · work-week replan

## Goal
Xar (00:30, Wednesday 18 November): plan only, no code. Move Tuesday's unfinished items; give Wednesday and Thursday to the two ENCAP projects from her Trello boards (Proffiliadur, DigiGrid) so there is something to present at Friday's 9:00 meeting (about an hour); from Friday noon balance study, applications, next week's work planning, admin and a fun weekend, including time to clean and review the job adverts in Life OS; postpone the Schengen visa until her mother says whether she will be in Spain in mid-February; add Robbie's birthday party (6 December) and notes for the days she should be out of her room 10:00–17:00 (19, 20, 23, 26 November and "Friday 29th").

## What I did
- Tuesday 17: done items kept (Ben, MAT021 review/prep/lecture ticks, CMT309 setup tick, work block, admin, close-out). Unfinished: Gym A and the restart task, three Schengen tasks: moved (below).
- Wednesday 18: Proffiliadur cards in Trello order (email Fernando, architecture reading, trace, issues, the two copy fixes, colours, "dod"), dinner, DigiGrid architecture and wp-admin, close-out with hours. The MAT021 lecture and drop-in stay (recorded/optional). Wednesday's generic work repeat is cancelled for the day (marker).
- Thursday 19: after the CMT309 lecture and the appointment: DigiGrid backup, issues, content inventory, the Proffiliadur scope/READMEs card, catalogue review, redesign approach (the existing Thursday work block, renamed), phased plan to March. Thursday's job-search repeat is cancelled for the day (marker).
- Friday 20: Dawn's questions and what to bring (07:45–08:45), the meeting (09:00–10:00, new event), after-meeting notes/actions/update email/hours, "Ask Mum about mid-February" (13:45), applications 17:20–18:20, CMT309 Week 1 basics 19:15. Friday's two old ENCAP evening blocks cancelled (kept).
- Weekend: Saturday Gym A week 1, CMT309 strings and Week 2 lists, MAT021 review and coursework plan, Life OS job-advert cleaning, shortlist; Sunday applications, next week's ENCAP plan, CMT309 lab and Q1 writing, PhD positions review. Q1 tests to Wednesday 25 20:15, Q7 readings to Thursday 26 19:00; CMT309 Week 3 and Week 4 unchanged, so the order holds.
- Schengen: five tasks from Monday 23 20:40 to Wednesday 25 18:15, same order.
- Gym: every remaining session moved one slot (sessions, not dates); the last is Tuesday 12 January.
- Added: out-of-room notes on 19, 20, 23, 26 and 27 November; the meeting; Robbie's birthday party (all day, 6 December).
- Audio-codec research to Saturday 28 16:30; LaTeX CV template to Saturday 21; ENCAP milestone tasks re-dated to their cards.

## Files and commits
- Scripts and evidence: `.runtime/work-week-2026-11-18/` (inspect, apply, fix-repeats, snapshot, proposal, journal, verified, backup listing).
- [records] commit with this note and STATUS.

## How I checked it
Dry run with an overlap check against the live calendar and entry validation; then `--apply`: a PostgreSQL custom-format dump listed with `pg_restore --list` first; Study state and plan saved with their revision and plan hash; core writes with If-Match. Read-back: 31 patched entries equal to the patch, 314 others unchanged, 378 entries; Study revision 137 → 138 with 8 blocks and 8 cards moved; day ticks unchanged; every new block on the calendar. Two repeat days (Wednesday's research/PhD review, Saturday's research block) reappeared when their dated occurrences moved; cancelled markers added; final check: no overlaps 18–29 November.

## Data touched
Backup: `.runtime/work-week-2026-11-18/backups/planning-2026-11-18/before-work-week-replan-*.dump`. Core: 31 entries changed (two of them Friday's old ENCAP blocks, cancelled and kept), 35 created (4 of them cancelled repeat markers); 345 → 380 entries. Study: revision 138. Nothing deleted, nothing marked done.

## Problems and surprises
- She wrote "Friday 29th"; 29 November is a Sunday. The note is on Friday 27; move it if Sunday was meant.
- Moving a dated occurrence of a repeat brings the repeat's day back; a cancelled marker is needed (as Codex did on 17 November).

## Next step
Xar follows Wednesday–Friday; after Friday's meeting, Sunday 12:15 is for next week's work cards. Development (stage 8 CP2, then JobMap AC) resumes when she has usage.
