# 2026-11-03 · Codex · JobMap workflow · CP1

## Goal

Push the reviewed local main to GitHub, then begin the agreed JobMap development plan with profile evidence and requirements review.

## What I did

- Pushed main with a normal fast-forward and verified GitHub main at `029d2c7633d6fbc02dc0be7e4602543987d0c116` using an authenticated `git ls-remote` read. Created `stage/jobmap-workflow` from that published commit.
- Added My profile: sourced examples, goals, explicit save, recovery drafts, JSON preparation instructions and an additive import preview that preserves conflicts.
- Added a requirements/evidence section inside each job. It quotes saved advert lines and distinguishes importance, listed skills, sourced examples, learning, known gaps and unknowns. Ambiguous alternatives and extra conditions remain explicit; the bounded extraction is described honestly.
- Added optional private profile storage and read/save routes, with both workspace and profile version guards. Existing backups include the profile; old backups load without writing defaults. Existing job matching and priority rules are unchanged.
- Deployed the tested client and restarted only JobMap after exporting and verifying a full backup. Retained old assets for open tabs and published the new index after its assets/API were ready. Life OS remained running.

## Files and commits

`[jobmap-workflow-cp1] Add sourced profiles and requirements review` on `stage/jobmap-workflow`. Source, tests, documentation and the exact built JS/CSS referenced by the tracked client index are included. Personal data and preview evidence are ignored. The new development checkpoint is not merged into main or pushed; user acceptance remains open.

## How I checked it

- Full existing JobMap suites and nine new tests pass: profile validation, additive conflicts/deduplication, incomplete draft recovery, essential/desirable/negative wording, unknown versus supported evidence, conditions/alternatives, bounds, backup/reopen and isolated HTTP/version/origin checks.
- TypeScript no-emit, focused ESLint and production build pass. Fixed the existing date-sort fixture to use a fixed reference date; its saved advert closed on 2 November and the real clock otherwise excluded all rows. No matching behaviour was changed.
- Six isolated browser flows pass: manual save, evidence/source display, recovery after reload, reviewed import, all four actual Life OS styles, and phone width. Browser checks caught and fixed collapsing examples, unstable field labels and an early-open loading race.
- The browser access host was unavailable. Used the repository's installed headless Chrome/Playwright test harness with disposable preview state instead; no user browser session or mailbox was used.
- Read-only final check through Life OS's actual JobMap iframe passes on desktop/phone: profile visible, requirements visible, no page errors, no overflow and no attempted writes. Live records remain equal after navigation.

## Data touched

No live personal records changed. JobMap revision remains 67; 1,306 jobs compare equal, as do preferences, full backup progress, source/workspace/connection files and checked Budget/Cardiff data files. The main Life OS process is unchanged. The profile starts empty; user evidence is added only when the user explicitly saves it.

Verified full backup, previous client build, hashes, deployment receipt and screenshots are kept privately in `.runtime/jobmap-workflow-cp1/`. Tests use isolated fixtures. The frozen standalone and scheduled searches were untouched.

## Problems and surprises

An unrelated `documents/briefs/stage-5-harvest-draft.md` appeared during development and was left untouched and unstaged. Existing generated JobMap client files are tracked; the new index is committed with its exact corresponding code assets, without private data.

## Small decisions I made, and questions for Xar

CP1 keeps the existing score/priority behaviour. Reconcile graduate/later-start treatment explicitly with the newer search scope in the later ranking checkpoint. Requirement extraction is deliberately conservative and incomplete; it never certifies proficiency or eligibility. No additional model service or dependency was introduced.

## Next step

Refresh Life OS → JobMap, open My profile and try an example or reviewed CV-derived JSON import, then inspect a job's Requirements and evidence. Accept or adjust CP1 before scoping application packs and independent review.
