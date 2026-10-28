# Life OS: status

**Updated 28 October 2026 by Claude Code** (JobMap: ideas from Dossier, and Life OS owns JobMap's data; Codex's Cardiff line of the same day kept). Branch `stage/4b-one-look`; `main` was last brought level with it on 16 October. Live: the Court, Today, Calendar, Review, Journal, People, Study hub, Cardiff Life, Budget, Health, JobMap, the Guide. The look (stage 4b) waits for Xar's detailed check. Earlier detail is in the session notes and in git (`88fd056`).

## Now
- **28 October (Claude Code): JobMap.** New: **Progress** (Applying menu: worth a look, how far applications got, where they stand, 12 weeks); a **Board** in Applications; **gaps** in a job (advert tech not in her skills); **Write it with Claude** (tailored CV, cover letter, email, interview prep: copies a prompt, opens claude.ai). These are ideas from Dossier (github.com/AienTech/dossier, AGPL-3.0), rebuilt rather than copied, and credited in `jobmap/README.md`. Her own changes of 27 October are committed with them: outcome, feedback and decided-on apart from the stage; Waiting on a reply, Interviews, Offers and Rejected; a documents filter; All jobs shows live adverts only. **Life OS only from now on, and Life OS's JobMap owns its data** (her choice; moved through backup and restore, 1,195 jobs compared equal). Note: `sessions/2026-10-28-claude-code-jobmap-dossier-and-owner.md`.
- **28 October (Codex):** Cardiff research is live in both planners: 135 events, 87 communities, 10 opportunities and 76 saved teaching blocks. Calendar shows all researched options by default. Choices remain intentions only; Outlook backfill is explicitly partial. Note: `sessions/2026-10-28-codex-stage-4b-cardiff-sync-visibility.md` (Codex's files not yet committed).
- **26 October (Claude Code): the plan to 31 December.** Test 2 is **Friday 6 November, 14:10, Abacws 2.26**; the group project is due **Friday 13 November**; CMT309 coursework planned to finish by **17 December**; MAT021 starts 16 November. Job time stays 3 h every day. Note: `sessions/2026-10-26-claude-code-reset-plan-to-december.md`.

## Exact next step
1. Xar reloads JobMap once (open tabs hold the old revision), then tries Progress, Applications → Board, and Write it with Claude on one job.
2. Xar follows the study plan (Today shows each card's steps), with the weekly reset on Sundays.
3. Next agent session: fit any new MAT022 or CMT309 materials into this week's cards (`t2-reg1` to `t2-reg4`, `proj-start`). Then `TODO.md` (B, C), and the look check when she gives it.

**Next prompt:** "Continue Life OS: read STATUS.md, then fit any new MAT022 or CMT309 materials into this week's cards."

## How to see it
Top bar → JobMap → Progress (menu, Applying); Applications → Board; open a job → Why this match and Write it with Claude. Life OS starts with Windows; otherwise `Start Life OS.cmd`, then http://127.0.0.1:47850.

## Waiting on Xar
- JobMap: the standalone `Documents\JobMap\Career Agent\JobMap App` is a frozen fallback. Archive it, or change its connection so it can never read Life OS's inbox? Either touches the standalone, so it is her call. Its server must stay stopped.
- JobMap: check the Codex "UK Tech Job Shortlist" task runs in `Life_OS\jobmap`.
- CMT309: due 17 or 27 December? The project brief and her part.
- Earlier, still open: Health's first use; the questions at the end of `TODO.md`; the Study hub acceptance list (7 October note); where the set-aside life data should live; which module folders to connect; moving `code\life-os\.git` herself; 14 "Possible repeats" in JobMap.

## Known problems and limits
- The Guide's JobMap pages don't cover Progress, the Board, gaps or Write it with Claude yet. Building the Life OS frontend now would ship Codex's uncommitted calendar changes.
- `jobmap/check-parity.mjs` and the reconcile scripts compare two copies and no longer apply.
- The Week 4 MAT022 slides, hw4 and the project brief were not in her folders on 26 October; their cards point to "Current materials.md" and Learning Central.
- The Playwright MCP extension is not installed; browser checks use `playwright-core` from `summer-rescue` with Chrome (as `scripts/guide-shots.mjs` does).
- Earlier limits: see `88fd056`, "Known problems and limits". Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.

## Data
- JobMap now: owned by `Life_OS\jobmap` (`data/workspace-connection.json`, port 47852), revision 42, 1,195 jobs. Backups: `Life_OS_backups/jobmap-2026-10-27-before-dossier-ideas.json`, `Life_OS_backups/jobmap-move-2026-10-28/` (owner backup at revision 103, every job, both workspace folders, both connection files).
- Cardiff research backups: `.runtime/cardiff-refresh-backups/`, `.runtime/cardiff-research-backups/`. Backups of 26 October (core, study, budget): see `sessions/2026-10-26-claude-code-reset-plan-to-december.md`.
- Study state revision 50 (92 cards, 190 blocks); Budget revision 109.

## Last five sessions
- 2026-10-28 JobMap: ideas from Dossier, and Life OS owns JobMap's data: `sessions/2026-10-28-claude-code-jobmap-dossier-and-owner.md`
- 2026-10-28 Cardiff research sync and Calendar visibility (Codex): `sessions/2026-10-28-codex-stage-4b-cardiff-sync-visibility.md`
- 2026-10-26 JobMap: the KPMG check: `sessions/2026-10-26-claude-code-jobmap-kpmg-check.md`
- 2026-10-26 The reset after Test 1 and the plan to 31 December: `sessions/2026-10-26-claude-code-reset-plan-to-december.md`
- 2026-10-25 JobMap public technical search (Codex): `sessions/2026-10-25-codex-jobmap-public-tech-search.md`
