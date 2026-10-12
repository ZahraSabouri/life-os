# 2026-10-12 · Claude Code · Study · review of Codex's autumn study plan

## Goal
Xar: "not sure if the codex study plan is perfect cuz it ran out of usage midway … just do a check on it, not writing it from scratch." Codex entered the plan at 14:00 and stopped before writing its session note, so this note also records what it did, taken from its own verification file.

## What Codex did (from `.runtime/study-plan-2026-10-12/verification.json` and its plan documents)
- Read the three module folders and the timetable under `…\Cardiff University\Data Science and Analytics\2. Autumn 2026`.
- Wrote the plan beside them, in `Study Plan 2026-10-12\`: `Autumn 2026 Study Plan.md` (the whole plan, day by day to the test and week by week to 27 December), `MAT022 Practice Papers.md` (two 50-minute papers with answers, for 20 and 21 October), and the same as data.
- Entered it into the Study hub's Autumn 2026 semester through the hub's own addresses, with revision checks:
  - 50 cards added (4 were there; 54 now). The 4 earlier cards, their notes and progress unchanged.
  - 159 study blocks in the semester's plan, each tied to a card. First 12 October, last 24 December; 217 hours.
  - The three modules given a description, assessment shape, aims and working rules.
  - One new assessment record, "MAT022 · In-class test 1", 23 October (no clock time: the notice gives none).
  - 29 materials added (the plan, the practice papers, lecture transcripts).
- Kept job applications out of the Study hub: 3 hours a day as suggested windows in `.runtime/study-plan-2026-10-12/job-reservations.json`.
- **Backup before the import:** `Life_OS_backups\study-2026-10-12\before-autumn-study-plan-1791809595380.dump` (1.0 MB). Hub state revision 3 before, 6 after. The summer semester and the 76 timetable sessions unchanged.

## What I checked
- **The practice papers' answers:** all ten questions recomputed by hand (sample statistics, the box-plot fences, both Bayes questions, the joint table, the density `k·x`, the geometric and binomial parts, the Poisson and exponential conversions, the Normal tails and the standard error). Every figure in the answer key is right.
- **The schedule against the timetable** (`scratchpad/plan-check.mjs`, reading the live semester): 159 blocks, none overlapping a class, none closer than 20 minutes to one, none overlapping another block, every block's card exists.
- **The cards:** all 50 have steps, a "done when" and linked sources. No card starts and is due on the same day in a way that would show twice on the calendar.
- **The scope it assumes for test 1** matches my own reading of the test materials: the formula sheet's seven distributions and the guide's four parts (plots, descriptive statistics, probability, random variables and distributions). It says plainly that this is inferred, and it carries the correction to the guide's Bayes line (the denominator needs the prior weights).
- **Workload:** about 3 hours on normal days and 2 on Thursdays and Fridays before the test (28 hours to 22 October, 25.5 of them Statistics), then 24.5 hours in a full week from 16 November when MAT021 starts. That is above the 3 hours a day she named, inside her "3 to 6".

## What I changed
- The older record "MAT022 in-class tests · Weeks 3 and 5" (no date) is now "MAT022 · In-class test 2 (Week 5, date not published)", through `PATCH /api/hub/assessments/…` with its revision (1 → 2; in the record's history, so it can be reverted). Today no longer lists both tests as undated beside a dated test 1. A later re-import from the university source may restore the old title.
- Nothing else in the plan.

## Not good enough yet (in `documents/TODO.md`, section A)
- The card "MAT022 · Confirm the Week 3 and Week 5 test dates" still names both weeks.
- Module pages have no drills or worked patterns.
- Thursday's job window is 18:45 to 21:45, after a practical that ends at 18:00. The times are proposals; she should move them.
- The practice papers have no question that shows a plot to read; plot reading is in the daily cards instead.
- Whether a calculator and the formula sheet are allowed, and the exact start time, are not published. The plan has cards for asking.

## Data touched
One assessment record renamed (above). No backup taken for it: one field of one record, kept in the record's history.

## Next step
None for the plan itself. The open items are in `documents/TODO.md`.
