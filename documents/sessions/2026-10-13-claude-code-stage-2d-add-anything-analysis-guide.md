# 2026-10-13 · Claude Code · Stage 2d · checkpoints 4 to 10

## Goal
Everything in Xar's messages of 12 October night and 13 October (quoted in `TODO.md` section N), and what was left on the earlier list. Brief: `briefs/stage-2d-everything-hers.md`.

## What I did
- Cardiff Life: an event of her own (add, change, remove), kept in Life OS, on the calendar.
- JobMap (both copies, parity PASS): her categories with a filter, the folder with her files, her own links.
- Today: "I applied" and "Rejected", saved by JobMap's own server, with an Undo that puts back the status and the date applied.
- Ledger: all entries, found by kind or words, changed in place, removed in two steps; a repeating plan changed in the week planner. One editor (`EntryEditor`) for any kind of entry.
- A fault found by her at 14:20: Life OS answered, Budget and JobMap did not load. Cause: a restart at 14:17 (not mine) adopted the old Budget and JobMap, which the old server then stopped. Fixed in the launcher and with a keeper in the server.
- Review → Analysis and the data as CSV and JSON.
- The Guide: 14 chapters, 42 steps, 42 pictures; a script that takes them.
- The bell: cards due tomorrow, cards waiting two days or more; notices through Windows when no tab is open.
- Budget: walked through read only; nothing changed.

## Files and commits
- `5d63c53` [2d-cp4] Cardiff Life: an event of her own
- `92590ab` [jobmap-cp6] JobMap: categories, folder, own links
- `ba42ba6` [2d-cp5] Today: mark a job applied or rejected
- `bd2b92b` [2d-cp6] Ledger: find, change, remove; repeating plans in place
- `cad27eb` [2d-cp7] Life OS keeps Budget and JobMap up
- `04f3ff2` [2d-cp8] Review: Analysis and the data as files
- `89ff31d` [2d-cp9] The Guide
- `8a627ff` [2d-cp10] The hub's reminders; notices through Windows

## How I checked it
- Tests: 88 pass in the set I run (`hosting/**/*.test.mjs` except `app.test.mjs`, the frontend's `entryPatch`, the core's `routines`), including new ones for own events, the job mark, the keeper, the analysis, the entry editor's rule and the Windows notices. JobMap: `npm test` and `check:parity` pass in both copies. Cardiff Life's own tests: 7 pass; 3 fail as they did before my change (they expect 30 events, the file has 42).
- As a user, in a headless browser: Cardiff Life's form and the JobMap fields on the try-out (JobMap on a copy); the job mark and its Undo on the try-out; the Ledger and planner editors with every write caught and printed; the Analysis page in Modern light, Modern dark and Madder, at 1440 and 400 pixels, and a CSV saved from it; the Guide page with all 42 pictures loading.
- Live, read only: each new page, the live analysis numbers, the live notices.
- The restart fix: stopped JobMap's Life OS interface on purpose; it came back by itself in about 12 seconds.
- One real Windows notification was sent as a test; Windows accepted it. I cannot see her screen, so whether it appeared is for her to say.

## Data touched
- Core database: backed up before the first use of the `cardiff-own-events` setting (`Life_OS_backups/core-2026-10-12/life-os-before-cardiff-own-events-1791840743492.db`). A test event was added, changed and removed on 12 October; the setting holds an empty list. No entry of hers was changed.
- JobMap: no job of hers was changed (revision 35 before and after). Copies of the changed code files before the change: `Life_OS_backups/jobmap-2026-10-12-kept/`.
- `guide-shots/`: 42 pictures and a manifest (3.6 MB), outside git.
- I removed `jobmap/data/test-workspace-*` (temporary folders JobMap's own test makes) without listing them first; they were test output, not her data, and I should have looked before removing.

## Problems and surprises
- The restart race above. It had been there all along and was lost by chance on 13 October.
- In the Life OS styles a text box of several lines was pill-shaped and cut its first line (Madder); fixed for every app inside.
- With the "?" added, the top bar wrapped in Madder at 1440 pixels; the date now gives way up to 1500 pixels. Under about 1280 pixels the bar is two lines, as before.
- Her activity data is young (no focus sessions yet, one application), so several analysis charts are nearly empty. They fill in as she uses the app.

## Small decisions I made, and questions for Xar
- Notices through Windows are on by default (she asked twice); one switch in the bell turns them off. Is that welcome?
- "Rejected" from the day is offered on interviews and follow-ups only; any status can be set in JobMap.
- Which part should the Guide go deeper into first?

## Second part of the day (her message: "do the parts that are not done or perfect"; "i need screenshots or infographics or more visuals"; "im not sure im understanding what you're talking about")
- `b955a66` [jobmap-cp7] real files kept with a job (both copies, parity PASS, JobMap's tests pass).
- `f83055c` [2d-cp11] "Change" on a plan on Today and in the planner (new `GET /api/entries/:id`); the top bar on one line down to 1110 pixels in all four styles; notices filed under "Life OS"; Cardiff Life's three stale tests.
- `dcd1f3c` [2d-cp12] the Guide: 15 chapters, 65 steps, 59 pictures (16 with numbered circles), 6 diagrams, "Retake the pictures".
- Checked: files on the try-out's copy of JobMap, reached through Life OS (add, open, a 3 MB file, reload, remove); "Change" on the live app with the write caught (the payload was right, nothing saved); the top bar measured at five widths in four styles; one real notice sent, and Windows listed it under "Life OS"; the retake route run from start to finish (59 pictures, 205 seconds, exit 0); the Guide page with every picture loading at 1440, 1180 and 400 pixels.
- Data touched: none of hers. One registry key for the notices' name (see DECISIONS). The live JobMap servers were restarted once, gracefully, to load the file routes (1,115 jobs before and after).
- Not done: people from the main app; notices when Life OS itself is not running; a job's files inside JobMap's backup file; the rest of the Guide listed in `TODO.md` section N.

## Next step
Ask her to read the Guide and say what is still unclear. Then the Guide's remaining pages (`TODO.md` section N), and people from the main app.
