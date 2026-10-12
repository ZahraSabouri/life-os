# 2026-10-12 · Claude Code · JobMap · My priority puts roles confirmed open first

## Goal
Xar: "I feel like the priorities are a bit messed up in the job app. I need to immidiately apply for the roles available soooo#" (the message was cut off there). Find what is wrong with the order in JobMap and fix it in both copies.

## What I found
Read her live saved jobs through the API and ran the app's own ordering on them.
- **The order never looked at whether a role is open.** Of the 50 rows "All jobs · Part-time leads · My priority" showed first, 18 were checked and found open, 5 were uncertain, and 27 had not been checked since the 13 September import (adverts from August and early September). One of those, rated "Later", sat at number 2 because its saved deadline was near.
- **The High/Normal/Low/Later settings are not hers.** The workspace holds no priority she set (0 overrides). All 51 "High" jobs come from the September workbook and none is confirmed open; every one of the 87 jobs added since is "Normal". So that setting says nothing about today.
- Left as it is and reported to her: the same vacancy saved twice from two sites (Cardiff University's Professional Specialist; Admiral Money's Senior Software Engineer); 9 confirmed-open roles that are full-time or over her hours, 8 of which "Part-time leads" leaves out by design, one of them closing today (Data Manager, Swansea University); a weak match that leads because it closes tomorrow (Lead Site Reliability Engineer).

## What I did
- `assessPriority` now also rates availability, and the order uses it second, after the kind of role and before the deadline: **confirmed open** (an "open" check in the last 14 days), then **to check** (an uncertain check, or an "open" one older than 14 days), then **not checked since it was saved**. Inside each, the 9 October rule is unchanged: closing today, tomorrow, within 7 days, then her setting, match, shortlist. Sent and closed jobs are not reordered by it.
- Each row now says which it is: "Apply now", "Apply now · closes tomorrow", "Check it is still open", "Open on 17 Sept; check again", "Not checked since 13 Sept". Rows whose hours need agreement say "Hours need agreement · open when checked on 9 Oct". The opened job explains it in a sentence.
- The line above the list counts them: "16 confirmed open, ready to apply."
- Same change in both copies; README's "My priority" section updated in both.

## Files and commits
- `jobmap/lib/matching.mjs`, `jobmap/lib/types.ts`, `jobmap/app/page.tsx`, `jobmap/tests/priority.mjs`, `jobmap/README.md`, `jobmap/VALIDATION.md`, `jobmap/dist/client` (new build `index-BgJjJGY4.js`), and the same files in `Documents\JobMap\Career Agent\JobMap App` (not a git repository).
- Commit `[jobmap-cp3]` on `stage/4b-one-look`, my files only. Codex's uncommitted files (`AGENTS.md`, `jobmap/AGENTS.md`, `jobmap/SCHEDULED_SEARCH.md`, the 4a brief, its session notes, the coordination file) were left as they are.

## How I checked it
- Both copies: all six `npm test` suites pass (priority has 15 new assertions for the open-first order), `npx tsc --noEmit` passes, `npm run build` gives the same asset in both.
- `npm run check:parity` passes in both directions: 38 feature files, 1,067 records each, shared workspace.
- Both servers serve the new build without a restart (`:47841` and Life OS `/apps/jobmap/`). Headless Chrome screenshots of both at 1440 px: the 16 confirmed-open roles lead, each row carries its line. Life OS was looked at in Madder; the row line uses the existing caption style, so nothing new needed skinning.
- The new order on her data, Part-time leads: 16 apply now, 6 to check, 12 not checked, then 16 whose hours need agreement.

## Data touched
None. No saved job, star, status or setting was changed; the workspace is still revision 33 with 1,067 records. Before changing files, copies of the standalone's five files and of both built `dist/client` folders went to each app's `data/recovery/priority-2026-10-12T15-24-12Z/`.

## Problems and surprises
- Her message ended mid-sentence ("soooo#"), so the rest of what she wanted is not known. I acted on the part that was clear, "the roles available".
- STATUS said 1,066 jobs at revision 30; the live workspace is 1,067 at revision 33.
- Another Claude Code session committed `[2b-cp5]` on the same branch while I was reading; no overlap with JobMap.

## Small decisions I made, and questions for Xar
- 14 days as the age after which an "open" check asks for another look. One number, `OPEN_CHECK_DAYS` in `lib/matching.mjs`.
- Kept the 9 October structure: part-time possibilities before hours needing agreement, so a confirmed-open full-time role still sits below an unchecked part-time one.
- Kept "deadline before fit" among the confirmed-open roles.
- Questions for her: (1) Should the September workbook's High/Low/Later be cleared, so the setting only ever means hers? (2) Should confirmed-open full-time roles show in the first list? (3) Archive the second copy of the two doubled vacancies? (4) The 12 unchecked part-time leads from September: have a search check them, or archive them?

## Next step
Hear the rest of her sentence and her answers to the four questions. If she wants the unchecked September leads verified, that is a search task for both copies (see `jobmap/SCHEDULED_SEARCH.md`).
