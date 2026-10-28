# Life OS: status

**Updated 28 October 2026 by Claude Code** (mail CP1: the store and the importer; earlier the same day, JobMap and Cowork's mail plan). Branch `stage/4b-one-look`; `main` was last brought level with it on 16 October. Live: the Court, Today, Calendar, Review, Journal, People, Study hub, Cardiff Life, Budget, Health, JobMap, the Guide. The look (stage 4b) waits for Xar's detailed check. Earlier detail is in the session notes and in git (`88fd056`).

## Now
- **28 October, night (Claude Code): mail CP1, the store and the importer.** Cowork's mail plan committed (`[mail-plan]`). New: schema `mail` (batches, sources, messages, actions, history), `migrate.js` running Study then Mail, the importer (check, back up, apply in one transaction, log, undo the latest), `/api/mail` (status, scan, batches, undo) and the `mail/inbox/` watcher. On `lifeos_test` only: the example batch gives 7 messages, 4 open actions and 1 done; again changes nothing; undo puts back all 16 records. **Safety:** on her real database Life OS leaves `mail/inbox/` alone until the first real batch has been tried on `lifeos_test` and she has looked at it (`scripts/mail-import.mjs`). The `mail` schema is not on `lifeos` yet; the live server was not restarted (it would make another session's uncommitted Today and calendar edits live). Note: `sessions/2026-10-28-claude-code-mail-cp1-store-importer.md`.
- **28 October (Codex): university audit and Study Hub sync.** Verified saved hashes, all project originals and new MAT022 file URLs; saved current announcements; linked 35 existing cards. Fixed TSV discovery and the confirmed assessment countdown. Corrected project deadline to 13 Nov 23:59 and CMT309 portal deadline to 27 Dec 23:59, preserving the 17 Dec personal target and date conflict. Progress, notes, timetable and plan preserved. See `sessions/2026-10-28-codex-study-materials-audit.md`.
- **28 October evening (Claude in Cowork): mail and admin, planned.** Her ask: who to email, text, reply to or congratulate, what is in her inboxes and Learning Central, without typing it in. Her choice: read mail inside Life OS with digests, summaries, priorities and notices; gathered only when she runs it. Ready: `mail/GATHER.md` with its format and checker (17 tests pass), her sources, the Claude task **Gather my inboxes** (no schedule), and the brief `briefs/mail-and-admin.md`, approved by her the same evening, to be built by Claude Code on Windows. No app code yet. Note: `sessions/2026-10-28-claude-cowork-mail-planning.md`.
- **28 October (Claude, Cowork): university materials refresh.** Finished GPT's 27 October refresh. In her MAT022 folder now: the three Week 4 lecture PDFs (relabelled and corrected by the lecturer), the Week 4 lab, `how-to-use-formula-sheet-2.pdf` and `Test details.txt` in `Assessments\In-Class Test 2`, newer Week 1–2 unannotated slides saved beside the originals, and captions for 26–28 October. Test 2's formula sheet and exam-style questions are still to come. CMT309 unchanged; MAT021 empty. Summary: `2. Autumn 2026\Refresh 2026-10-28.md`. Note: `sessions/2026-10-28-claude-cowork-university-materials-refresh.md`.
- **28 October, later (Claude Code): JobMap filters, documents, the Guide.** A job whose deadline passed while being prepared closes with one button (outcome "Missed deadline"). Search in titles, employers or skills, or with `/regex/`, and group by kind of job, main skill or years of experience. A visa filter reads the advert's wording ("No nationality limit" hides citizens-only and clearance jobs), and an hours filter shows part-time or within her hours. PDFs open from My documents. The Guide has six new JobMap pages with pictures, and four questions. Another session's unfinished Today and calendar edits went live with the Guide build; they're uncommitted, so that session should rebuild and commit. Note: `sessions/2026-10-28-claude-code-jobmap-filters-documents-guide.md`.
- **28 October (Claude Code): JobMap.** New: **Progress** (Applying menu: worth a look, how far applications got, where they stand, 12 weeks); a **Board** in Applications; **gaps** in a job (advert tech not in her skills); **Write it with Claude** (tailored CV, cover letter, email, interview prep: copies a prompt, opens claude.ai). These are ideas from Dossier (github.com/AienTech/dossier, AGPL-3.0), rebuilt rather than copied, and credited in `jobmap/README.md`. Her own changes of 27 October are committed with them: outcome, feedback and decided-on apart from the stage; Waiting on a reply, Interviews, Offers and Rejected; a documents filter; All jobs shows live adverts only. **Life OS only from now on, and Life OS's JobMap owns its data** (her choice; moved through backup and restore, 1,195 jobs compared equal). Note: `sessions/2026-10-28-claude-code-jobmap-dossier-and-owner.md`.
- **28 October (Codex):** Cardiff research is live in both planners: 135 events, 87 communities, 10 opportunities and 76 saved teaching blocks. Calendar shows all researched options by default. Choices remain intentions only; Outlook backfill is explicitly partial. Note: `sessions/2026-10-28-codex-stage-4b-cardiff-sync-visibility.md` (Codex's files not yet committed).
- **26 October (Claude Code): the plan to 31 December.** Test 2 is **Friday 6 November, 14:10, Abacws 2.26**; the group project is due **Friday 13 November**; CMT309 coursework planned to finish by **17 December**; MAT021 starts 16 November. Job time stays 3 h every day. Note: `sessions/2026-10-26-claude-code-reset-plan-to-december.md`.

## Exact next step
1. Xar reloads JobMap once (open tabs hold the old revision), then tries Progress, Applications → Board, and Write it with Claude on one job.
2. Xar follows the study plan (Today shows each card's steps), with the weekly reset on Sundays.
3. Mail: a review of CP1 (Codex or a fresh Claude Code chat; the review prompt she has), then CP2 (Waiting on you). Study comes first this week; CP1 and CP2 give her the list she asked for.
4. New MAT022 materials are linked to this week’s cards. Check the Test 2 folder for its still-unpublished formula sheet and exam-style questions. Then `TODO.md` (B, C), and the look check when she gives it.

**Next prompt:** "Continue Life OS: read STATUS.md and check whether the MAT022 Test 2 formula sheet and exam-style questions have been released."

## How to see it
Top bar → JobMap → Progress (menu, Applying); Applications → Board; open a job → Why this match and Write it with Claude. Life OS starts with Windows; otherwise `Start Life OS.cmd`, then http://127.0.0.1:47850.

## Waiting on Xar
- Mail: connect Gmail in Claude's settings and be signed in to Cardiff Outlook and Learning Central in Claude's built-in browser, then run **Gather my inboxes** once (after the CP1 review); the first batch goes to `lifeos_test` first and waits for her OK. Is Documents synced to OneDrive?
- JobMap: the standalone `Documents\JobMap\Career Agent\JobMap App` is a frozen fallback. Archive it, or change its connection so it can never read Life OS's inbox? Either touches the standalone, so it is her call. Its server must stay stopped.
- JobMap: check the Codex "UK Tech Job Shortlist" task runs in `Life_OS\jobmap`.
- CMT309: due 17 or 27 December? The project brief and her part.
- Earlier, still open: Health's first use; the questions at the end of `TODO.md`; the Study hub acceptance list (7 October note); where the set-aside life data should live; which module folders to connect; moving `code\life-os\.git` herself; 14 "Possible repeats" in JobMap.

## Known problems and limits
- Mail: `lifeos_test` keeps the test runs' records (the app role cannot delete; undone ones are soft-deleted). The example's `runId` is marked undone there, so dropping `example-batch.json` again is a repeat; tests use their own copies.
- Another session has uncommitted Today, Planner and calendar edits (frontend and `hosting/day`, `hosting/calendar`); restarting Life OS makes the backend ones live.
- The Guide's JobMap pages don't cover Progress, the Board, gaps or Write it with Claude yet. Building the Life OS frontend now would ship Codex's uncommitted calendar changes.
- `jobmap/check-parity.mjs` and the reconcile scripts compare two copies and no longer apply.
- MAT022 Week 4 slides, the project brief and the Test 2 guide are in her folders since 28 October; the Week 4 practice sheet was never published (the lecturer is posting exam-style questions in the Test 2 folder instead), and the Test 2 formula sheet is still to come.
- The Playwright MCP extension is not installed; browser checks use `playwright-core` from `summer-rescue` with Chrome (as `scripts/guide-shots.mjs` does).
- Earlier limits: see `88fd056`, "Known problems and limits". Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.

## Data
- JobMap now: owned by `Life_OS\jobmap` (`data/workspace-connection.json`, port 47852), revision 42, 1,195 jobs. Backups: `Life_OS_backups/jobmap-2026-10-27-before-dossier-ideas.json`, `Life_OS_backups/jobmap-move-2026-10-28/` (owner backup at revision 103, every job, both workspace folders, both connection files).
- Cardiff research backups: `.runtime/cardiff-refresh-backups/`, `.runtime/cardiff-research-backups/`. Backups of 26 October (core, study, budget): see `sessions/2026-10-26-claude-code-reset-plan-to-december.md`.
- Study state revision 53 after materials sync (92 cards, 190 blocks; generated notices may save later revisions); Budget revision 109.

## Last five sessions
- 2026-10-28 Mail CP1, the store and the importer (Claude Code): `sessions/2026-10-28-claude-code-mail-cp1-store-importer.md`
- 2026-10-28 Study material, deadlines and reminders audit (Codex): `sessions/2026-10-28-codex-study-materials-audit.md`
- 2026-10-28 Mail and admin, planned (Claude in Cowork): `sessions/2026-10-28-claude-cowork-mail-planning.md`
- 2026-10-28 University materials refresh (Claude, Cowork): `sessions/2026-10-28-claude-cowork-university-materials-refresh.md`
- 2026-10-28 JobMap: missed deadlines, search and visa filters, PDFs, the Guide: `sessions/2026-10-28-claude-code-jobmap-filters-documents-guide.md`
