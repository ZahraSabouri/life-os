# 2026-10-28 - Codex - Stage 4b - Cardiff sync and visibility fix

## Goal
Finish the direct user request to publish all researched Cardiff options in Life OS, prioritise university opportunities and teaching, and diagnose why events appeared missing.

## What I did
- Synced the stale Life OS research catalogue through a guarded research-only publisher. Each run checks destination hashes, preserves stable IDs/provenance/first_seen, backs up, rebuilds with Life OS's own display code and verifies parity.
- Added the university priority panel, separate stage deadlines, explicit coverage and saved-timetable projection with email corrections and overlap warnings. Retained the hosted planner's own-event controls and browser planning storage.
- Main Calendar had defaulted to saved plans/maybe, hiding researched candidates. It now starts with all researched options and labels unselected items Available option. The Cardiff navigation badge explicitly says saved.
- University research is prioritised in all three saved automations. Daily Outlook remains 09:00; Thursday/Friday schedules remain 09:00. Both build and sync are required in every research update.
- Completed the three event additions verified on 27 October; on 28 October corrected one open grant's official eligibility/deadline and retained two closed opportunities from backfill. Private findings remain in local research files.
- Excluded research/evidence/generated output from git while retaining all local files and backups.

## Files and commits
- This direct-fix follow-up is committed with the Cardiff code, tests, workflow instructions, Calendar visibility change, .gitignore and STATUS.md on stage/4b-one-look. No push.
- Standalone sync_life_os.py and tests/test_sync.py remain in the standalone project; research is synced, display code is not overwritten.
- Concurrent JobMap changes are outside this commit.

## How I checked it
- Windows Vite production build passed and was published with a dist backup on 27 October.
- node --test test/calendar.test.js from the frontend: 9 passed.
- Python unittest discovery in standalone Cardiff Life: 7 passed, including concurrent-edit sync protection.
- Planner syntax and generated HTML checks passed; 135 valid unique event IDs, 134 dated records, seven activity categories, no external runtime assets.
- Build outputs: 135 events, 87 communities, 10 opportunities, 76 saved teaching blocks, 22 ranked occurrences in 11 report groups.
- Both copies have byte-identical managed research files; receipt cardiff-life/research-sync-state.json records backup and hashes.
- Live Calendar API returned the new dated options with candidate=true; browser reload verified All researched options as default. Hosted Cardiff page displayed the priority panel, saved timetable date, new options and teaching conflicts.

## Data touched
- Research only. Core database, personal events, saved Maybe/Plan choices and core teaching records were not written.
- Initial research backups: .runtime/cardiff-refresh-backups/20261026-151615.
- Latest source/display backup: .runtime/cardiff-refresh-backups/20261028-124011.
- Latest guarded research sync backup: .runtime/cardiff-research-backups/20261028-124012-186081.
- Frontend backup/build: .runtime/cardiff-visibility-20261027.
- Local research remains present after removing it from git tracking. A fresh checkout needs local inputs restored before build.

## Problems and surprises
- Missing events had two causes: a stale hosted catalogue (42 versus 132 initially) and the main Calendar's saved-only default.
- Initial 30-day Outlook backfill remains partial. Last-complete checkpoint remains null; no clean mailbox scan claimed.
- Teaching uses a saved export, with verified corrections applied to its projection; gaps do not prove availability.
- Several updates were interrupted across dates. Source check dates record actual research, not the final build.
- No broad test suite or database-reseeding hosting test was run.

## Small decisions I made, and questions for Xar
- Visibility does not imply intention, booking or attendance. Preserved the storage key and all stable event IDs.
- Direct user-requested fix, not acceptance of the stage 4b visual design or approval for a new stage.
- No decision required to use the refreshed planners.

## Next step
Continue the daily university search and incomplete older newsletter backfill, then build and sync. Stage 4b's existing user acceptance and other agents' study/JobMap work remain unchanged.
