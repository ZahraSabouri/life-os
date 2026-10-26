# Life OS: status

**Updated 26 October 2026, 17:40, by Claude Code** (the KPMG check in JobMap; before that, the reset after Test 1 and the plan to 31 December). Branch `stage/4b-one-look`; `main` was last brought level with it on 16 October. Live: the Court, Today, Calendar, Review, Journal, People, Study hub, Cardiff Life, Budget, Health, JobMap, the Guide. The look (stage 4b) waits for Xar's detailed check. This page was rewritten to under a page; the earlier detail is in the session notes and in git (`88fd056`).

## Now
- **26 October (Claude Code): the reset and the plan to 31 December.** Test 2 is **Friday 6 November, 14:10, Abacws 2.26** (Weeks 3 and 4 only: MLE and MAP, hypothesis tests, regression); the group project is due **Friday 13 November** (LaTeX); the **CMT309 coursework** (eight notebooks, 100%) is planned to finish by **17 December** (the portal says 27 December, 23:59); MAT021 teaching starts 16 November. The Study hub has 71 new cards and 174 blocks from Tuesday 27 October: minute by minute to 13 November, then one card per module per week, a Sunday weekly reset and a Saturday catch-up. Job time stays 3 h every day (her answer). Today has job time only, with the four roles to apply to first. Done or removed: the Test 1 week's cards (done), 32 old-plan cards (deleted, no progress), past job time (done), 25 closed saved jobs (archived in JobMap). Budget: all food and drink used up, November starts at £0 counted. Note: `sessions/2026-10-26-claude-code-reset-plan-to-december.md`.
- **26 October (Codex, no note yet):** Cardiff Life's research synced from the standalone at 15:16; both have 132 events, and the live page shows them. The Life OS copy's changed files (`cardiff-life/`) are not committed.
- **26 October, 17:40 (Claude Code): KPMG check.** Of the seven KPMG roles she pasted, five are filled or withdrawn and the London 2027 graduate programmes are gone. Added to JobMap (both interfaces, To review, post-MSc targets): Senior Software Engineer - Tax Technology (regional, reposted today) and Data Architect, Audit Central (London, a stretch). Note: `sessions/2026-10-26-claude-code-jobmap-kpmg-check.md`.
- **Windows start works:** `Life OS.vbs` in the Startup folder; on 26 October the server was up 28 seconds after sign-in. Silent, at her choice.

## Exact next step
1. Xar follows the plan from Tuesday 27 October (Today shows each card's steps), with the weekly reset on Sundays.
2. Next agent session: when the Week 4 MAT022 slides, hw4 or the project brief appear in her folders, name them on their cards (`t2-reg1` to `t2-reg4`, `proj-start`); after a Codex materials refresh, check Test 2's scope and formula sheet.
3. Then `TODO.md` in its order (B, C), and the look check when she gives it.

**Next prompt:** "Continue Life OS: read STATUS.md, then fit any new MAT022 or CMT309 materials into this week's cards."

## How to see it
Top bar → Today (the day after shows tomorrow's cards); Study hub → This Week; Calendar → Week. Life OS starts with Windows; otherwise `Start Life OS.cmd`, then http://127.0.0.1:47850.

## Waiting on Xar
- CMT309: is the coursework due on 17 or 27 December? (card for 29 October).
- The project brief and her part (card for 1 November).
- Earlier, still open: Health's first use; the questions at the end of `TODO.md`; the Study hub acceptance list (7 October note); where the set-aside life data should live; which module folders to connect; moving `code\life-os\.git` herself; 14 "Possible repeats" in JobMap.

## Known problems and limits
- The Week 4 MAT022 slides, hw4 and the project brief were not in her folders on 26 October; their cards point to "Current materials.md" and Learning Central. MAT021's weekly topics are a guess from its module description.
- The calendar shows an assessment of kind "test" at its end time, like a deadline; Test 2 is kind "exam", so it shows at 14:10–15:00.
- The Playwright MCP extension is not installed; browser checks use `playwright-core` from `summer-rescue` with Chrome (as `scripts/guide-shots.mjs` does).
- Earlier limits (the look's check, JobMap tabs, Study hub classes not editable in the hub, leftover summer wording, `/study-native`): see `88fd056`, "Known problems and limits".
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.

## Data
- Backups of 26 October: `Life_OS_backups/core-2026-10-26/life-os-before-reset-1793031126456.db`, `Life_OS_backups/study-2026-10-26/before-reset-1793031126481.dump`, `.runtime/budget-reset-2026-10-26/state-before-r108.json`, `.runtime/study-plan-2026-10-26/jobmap-archived.json`. Scripts: `.runtime/study-plan-2026-10-26/reset.mjs`, `.runtime/budget-reset-2026-10-26/reset.cjs`.
- Now: Study state revision 50 (92 cards, 190 blocks); Budget revision 109; JobMap revision 87, 1,184 jobs, parity with the standalone passes.

## Last five sessions
- 2026-10-26 JobMap: the KPMG check: `sessions/2026-10-26-claude-code-jobmap-kpmg-check.md`
- 2026-10-26 The reset after Test 1 and the plan to 31 December: `sessions/2026-10-26-claude-code-reset-plan-to-december.md`
- 2026-10-25 JobMap public technical search (Codex): `sessions/2026-10-25-codex-jobmap-public-tech-search.md`
- 2026-10-18 JobMap public technical search (Codex): `sessions/2026-10-18-codex-jobmap-public-tech-search.md`; the same day Claude Code's Test 1 week records (commits `3ebfc12` to `88fd056`)
- 2026-10-17 JobMap: one job shown once, more in the menu: `sessions/2026-10-17-claude-code-jobmap-one-job-once.md`
