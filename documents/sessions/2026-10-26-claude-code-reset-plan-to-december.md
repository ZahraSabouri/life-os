# 2026-10-26 · Claude Code · Records · the reset after Test 1, and the plan to 31 December

## Goal
Her words (26 October, from about 15:30): "lets work on new weeks and months until the end of december"; "I had this exam last week and now I wanna get ready for the next exam and all other things that are coming like even events and stuff … look at jobs, events, uni materials and exams and coursework and homework and project, reset the app based on that and make a fire plan for everything … reset and start freshly for the next months expenses on the budget app"; "for the statistics next exam … I absolutely need to study better"; "reset the app and mark undone tasks done and remove the ones that cannot be done (like a task that was for applying a job or sth)"; "thoroughly and carefully make new tasks and plans"; "I need the app to run on the windows startup"; "pay attention to the python project"; "Cardiff life app is updated but the life os Cardiff life hasn't"; "cardiff life and budget app (… empty cupboards since i used everything i had) and job app and even materials of modules … are gonna change daily … so we cannot have tightest fix plan". Mid-session: "clearest image of most urgent upcoming events exams and works and applies and attendences … in the coming week as the first thing"; "havent studied cmt309 at all"; "and also empty today"; "only job applying for today".

Her answers to four questions: job time stays 3 h every day; she has a project group; all food and drink is finished (toiletries, cleaning things and tools stay); Life OS keeps starting silently.

## What I did
- **The coming week, first** (given in the conversation): classes with rooms, the careers fair (Tue 27, 11:00), the school CV session (Thu 29, 13:10), the CMT309 practical's real room (Queen's Buildings South S/3.20, 16:20), job deadlines (Cardiff University systems support 27 Oct; HMRC and Public Health Wales 29 Oct; Line-Up 31 Oct; JOMEC research assistant 2 Nov), Test 2 on Fri 6 Nov, the project on Fri 13 Nov, the CMT309 coursework.
- **Facts found in her files**: Test 2 is **Friday 6 November** (syllabus updated 22 October; the app still said "date not published"); it covers **Weeks 3 and 4 only** (the lecturer, 12 October lecture); Week 4 is regression; Test 1 was 20% (23 October lecture); the project brief is given out from the first Week 4 lecture (today); the project must be in LaTeX. The "Python project" is the CMT309 coursework released 19 October: eight notebooks, 100%, 26–35 h by the module's estimate; the portal says 27 December 23:59, the school calendar 17 December; AI-written answers are not allowed.
- **Study hub** (script `.runtime/study-plan-2026-10-26/reset.mjs`): the 16 Test 1 week cards and three custom cards (Test 2 date confirmed, group joined, coursework instructions saved) marked done; 32 cards deleted, none with progress (the test-eve and test-day cards, two optional lab cards, and every later card of the 12 October plan for CMT309, MAT022 and MAT021). 71 new cards and 174 blocks from Tuesday 27 October to Thursday 31 December:
  - to 6 Nov: Test 2, lecture by lecture (19, 20, 21 October, then the Week 4 regression lectures), hw3 problem by problem, the Week 3 lab, a timed mixed set, a repair, a 50-minute practice test with marking, two office-hours visits, final review, warm-up; CMT309 from zero (set-up, Weeks 1–3); the project's start.
  - to 13 Nov: the project to submission a day early; CMT309 Weeks 4–6 and coursework Q1–Q3.
  - 14 Nov–18 Dec: one CMT309 card and one MAT021 card a week (Q6, Q8, Q7, Q9, Q10 alongside Weeks 7–10; MAT021's topics from its module description), the coursework finished and submitted by 17 December.
  - 19–31 Dec: a buffer before the portal deadline, MAT021 coursework and review, "Plan January". Nothing on 24–27 December.
  - Every Sunday a weekly reset (the old weekly-files card, rewritten); every Saturday from 14 Nov a catch-up block that is free if nothing slipped. A note on the hub's Notes page: "The plan from 27 October: how it works". Two cards without blocks: ask whether CMT309 is due 17 or 27 December (29 Oct); redo Test 1's lost marks when they come back.
  - Assessments: Test 1 done (20%); Test 2 dated 6 Nov 14:10–15:00 with its coverage and rules (kind "exam", so the calendar shows its time); the project notes LaTeX; the CMT309 record renamed "Coursework (eight notebooks, 100%)" with the portal date.
- **Core**: 8 past entries still open marked done (job time 14–17 and 23–25 October; "Maybe: see a friend", 14 Oct). Added: the careers fair (Tue 27, 11:00–12:50) and the school CV session (Thu 29, 13:10–14:00) as optional plans; today's task "Job time today: apply to these first". Job time's repeating plans unchanged (her answer). Today has no study.
- **JobMap**: the CTR "Preparing" job (closed 18 October, not applied) and the 24 saved jobs whose closing dates passed without an application archived (revision 61 → 86). The Sati interview (a live application awaiting an outcome) is untouched.
- **Budget** (script `.runtime/budget-reset-2026-10-26/reset.cjs`, Budget's own rules): 19 meals still "planned" for 12–25 October skipped; 162 food and drink items (59 bought, 103 from the September stock-up) used up today; the 8 September Morrisons stock-up spread over 2 months instead of 6, so November starts at £0 counted (was £26.03). 42 non-food things kept. November's £250 budget unchanged.
- **Windows start**: already working (`Life OS.vbs` in Startup; the server started at 13:20:01, 28 seconds after sign-in). Left silent at her choice.
- **Cardiff Life**: already level when checked: Codex's sync at 15:16 today brought the Life OS copy from 42 to 132 events, the same as the standalone; the live page shows the new events. Nothing changed by me.

## Files and commits
- `cb44380` Codex's note of 25 October (its own commit).
- This note, `STATUS.md` (rewritten under a page), `TODO.md` section V, `DECISIONS.md` (26 October): one "Records" commit.
- Scripts and backups are under `.runtime/` and `../Life_OS_backups/` (not in git).

## How I checked it
- The reset script checks before saving: no block today or before; inside 08:30–21:00 on weekdays and 09:00–18:00 at weekends; at most 90 minutes a block, 10 minutes between blocks, a 45-minute lunch between 12:15 and 14:00, at most six hours a day; no overlap with classes (20 minutes' travel each side), her own plans, the new careers events or job time (each repeating plan expanded day by day, 10 minutes each side); every minute-by-minute card's steps add up to its block; every file a card names exists; no deleted card has progress. After saving: every block has its card, deleted cards are gone, done cards are done, nothing today. Study state revision 49 → 50.
- In the real app (headless Chrome through `playwright-core`; the Playwright MCP extension is not installed): Today shows the lecture, job time and the apply list only; Tuesday 27 shows the new cards with their steps; Friday 6 November shows the warm-up, the lab, Test 2 at 14:10–15:00 and job time; the Study panel says "11 days to MAT022 · In-class test 2"; Budget → Food & supplies shows 17 non-food things and no food. No page errors.
- JobMap: `check-parity.mjs` against the standalone: no differences; both interfaces 1,182 jobs at revision 86.
- Budget: `validateV4` before and after; no food left except durable things; expenses unchanged.

## Data touched
- Backups: `Life_OS_backups/core-2026-10-26/life-os-before-reset-1793031126456.db` (VACUUM INTO), `Life_OS_backups/study-2026-10-26/before-reset-1793031126481.dump`; `.runtime/study-plan-2026-10-26/before.json` (state, plan, assessments, the core entries changed); `.runtime/budget-reset-2026-10-26/state-before-r108.json` (plus Budget's own snapshot); `.runtime/study-plan-2026-10-26/jobmap-archived.json` (the 24 archived jobs).
- Study hub: 53 → 92 cards, 158 → 190 blocks (16 past blocks of done cards kept as history). Core: 8 entries to done, 3 added. JobMap: 25 jobs archived. Budget: revision 108 → 109.

## Problems and surprises
- The calendar puts an assessment of kind "test" at its end time (a deadline); Test 2 first showed at 15:00. Its kind is now "exam", which the calendar draws at its own time.
- Budget: skipping a preparation batch also skips the meals made from it, so the script checks each meal again before skipping it.
- JobMap's write requests need the `X-JobMap-Client: workspace-v1` header.
- The Week 4 slides, hw4 and the project brief were not in her folders yet; those cards point to "Current materials.md" and Learning Central.
- `cardiff-life/` holds Codex's uncommitted sync changes of today, with no session note yet; left as they are.
- STATUS.md was 39 KB; it is rewritten to under a page as AGENTS.md asks. The earlier detail is in the session notes and in git (`88fd056`).

## Small decisions I made, and questions for Xar
- Up to 13 November the cards are minute by minute; after that, one card per module per week, because the materials and dates are not out yet and change daily (her words). The Sunday reset and the Saturday catch-up are how the plan moves.
- With 3 h of job time every day, study is 2–6 h a day (about 22–27 h a week); the day before the test is light.
- Test 1's study cards were marked done (Test 1 is over), not deleted; the foundations Test 2 needs come back on Tuesday's first card.
- Food and drink only were finished; the "Used up" date is today (the real days are not known).
- The CMT309 cards say what to study and in what order and never contain answers: the coursework does not allow AI-written work.
- Question: is the CMT309 deadline 17 or 27 December? (her card on 29 October)

## Next step
She follows the plan from Tuesday 27 October. The next agent session: when Week 4 MAT022 materials, hw4 or the project brief appear in her folders, name them on their cards (`t2-reg1` to `t2-reg4`, `proj-start`); after Test 2, check the week's blocks against what the project actually needs.
