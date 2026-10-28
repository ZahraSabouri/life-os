# 2026-10-28 · Claude Code · JobMap · ideas from Dossier, and Life OS owns JobMap's data

## Goal
Her words (27 October): "upgrade jobmap app from this repository and integrate features (be very careful to not mess up with my preferences and current app) https://github.com/AienTech/dossier", then how to commit it and "professionally reference the thing". Mid-task: "we're talking about the jobmap inside life os, be careful!". Her answers: all four proposed features "and anything helpful", the Life OS copy only, commit and push. After her own changes appeared, she chose to make Life OS the owner of JobMap's data.

## What I did
- **Read Dossier (v1.9.2) in a scratch clone.** It is Next.js, PostgreSQL and paid AI APIs, licensed AGPL-3.0, so I **rebuilt four ideas in JobMap's own code** and copied none of it. Not taken: AI writing through a paid API, Gmail and Calendar sign-in, paid job-search APIs.
- **`lib/insights.mjs`** (new; reads only): how far each job got (stage, history, date applied, outcome); Progress figures; "Worth a look"; the advert's tech set against her skills (case-aware, the employer's own name left out); the Claude prompt.
- **`app/page.tsx`**: **Progress** under Applying; **Board** in Applications (List/Board, stage menu or drag, Undo, a Rejected column, the outcome on cards); **gaps** under Why this match; **Write it with Claude** in a job (Tailored CV, Cover letter, Email to send, Interview prep). That copies the prompt, opens claude.ai/new, and shows the prompt as a fallback.
- **Styles:** `app/globals.css`, plus a section in `hosting/skins/public/apps/jobmap.css` so each Life OS style draws the new pieces. Charts use one colour (the accent), with labels and a table view.
- **Her changes, found mid-session** (another session, now stopped): outcome, feedback, decided-on; Waiting on a reply, Interviews, Offers, Rejected; a documents filter; kept filters; All jobs lists live adverts only; "Life OS only" in `SCHEDULED_SEARCH.md`. I merged them with mine: Progress counts outcomes, and "Worth a look" waits 14 days, like "Waiting on a reply".
- **Found a blocker in her change:** the Life OS interface forwarded saves to the standalone server, which refused `outcome` ("Unsupported field"). She chose to **make Life OS the owner**. I rehearsed it on a private copy, then moved it live (see Data touched).
- **Credit:** the README Credits section, comments in the code, and the commit message.

## Files and commits
- `jobmap/lib/insights.mjs`, `jobmap/tests/insights.mjs` (new); `jobmap/app/{page.tsx,globals.css}`, `jobmap/package.json`, built `jobmap/dist/`; `hosting/skins/public/apps/jobmap.css`.
- Her files, committed with mine: `jobmap/lib/{matching,store}.mjs`, `jobmap/lib/types.ts`, `jobmap/tests/{priority,verify}.mjs`, `jobmap/SCHEDULED_SEARCH.md`, her parts of `page.tsx`.
- Records: `jobmap/{README,AGENTS,SCHEDULED_SEARCH}.md`, `AGENTS.md`, `documents/{DECISIONS,Life_OS_Plans_Inventory,STATUS}.md`, this note.
- Commits `[jobmap-dossier] …` and `Records: …` on `stage/4b-one-look`, pushed with the 12 earlier unpushed commits.

## How I checked it
- `npm test` in `jobmap/`: 8 of 8 files pass (new `tests/insights.mjs`: funnel, heard back, weeks, Worth a look order, outcomes, the 14 days, gaps, the prompt). `tsc --noEmit` clean. eslint 763 problems before and after; none new.
- Private copy on port 47899, owning its own folder like the live setup, restored from her backup: 1,195 jobs, 0 differences; outcome, feedback and decided-on save; a bad outcome is refused. In Chrome: Progress, gaps, the prompt copied (about 3,000 characters), claude.ai/new opened, a board move by menu and one by drag both saved, no sideways scroll at 390 px, no page errors.
- Live in Life OS with every save blocked: Modern light and dark, Madder, Paper. No page errors, no write attempts. Today still shows "jobs to apply for now".

## Data touched
- Backups: `Life_OS_backups/jobmap-2026-10-27-before-dossier-ideas.json` (revision 88); `Life_OS_backups/jobmap-move-2026-10-28/` (owner backup, every job, documents setting, both workspace folders, both connection files).
- **The move:** owner backup at revision 103 (1,195 jobs, 252 records, 228 added). `jobmap/data/workspace-connection.json` now names `Life_OS\jobmap` as owner (port 47852, inbox this folder only). I stopped the standalone (still revision 103 on disk) and Life OS's JobMap; Life OS restarted it as owner on the old 11 October snapshot (revision 41), and I restored the backup through `/api/restore`. Result: revision 42, 1,195 jobs, 0 missing, 0 differing, preferences and documents setting equal. JobMap's recovery copy of the old snapshot: `jobmap/data/workspace/backups/…-41-before-restore.json`.
- No job was edited in the live data. The board and outcome saves were tried on the private copy only.

## Problems and surprises
- Her other session edited `page.tsx`, `matching.mjs` and `store.mjs` while I was working, and rebuilt JobMap at 18:59, which put my unchecked features live early. Both sets of edits survived; I checked before going on.
- The live data moved from revision 88 to 103 (11 more jobs) during the session; the move used a fresh backup taken right at the switch.
- The Playwright MCP extension is still not installed; I used `playwright-core` from `summer-rescue`, as `scripts/guide-shots.mjs` does.

## Small decisions I made, and questions for Xar
- Progress reads her jobs and never saves. Board moves save like the Status menu, with Undo.
- The Claude prompt leaves out her notes and personal fields, and asks Claude to list gaps instead of inventing.
- **The Guide was not updated.** The Life OS frontend has Codex's uncommitted calendar changes, and building it would ship them.
- **The standalone's own connection still lists the Life OS inbox.** It is harmless while that server stays stopped. Changing it (or archiving the folder) touches the standalone, so it is her call.
- **Check the Codex "UK Tech Job Shortlist" task** runs in `Life_OS\jobmap` (its instructions now say so).

## Next step
Ask her to reload JobMap. Then: the Guide's JobMap pages, once Codex's calendar changes are committed; and her answer on the standalone folder and the Codex task.
