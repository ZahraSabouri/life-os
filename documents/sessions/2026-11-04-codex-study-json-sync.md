# 2026-11-04 · Codex · Study Hub · Imported schedule reconciliation

## Goal
Apply Xar's newly imported Study Hub JSON throughout Life OS, preserving her progress and unrelated work.

## What I did
- Read the live Autumn workspace, revision 94. Its 72 cards already reflected the import, but its separate plan still held the previous task titles and times.
- Replaced the 17 linked schedule windows with the explicit `STUDY TIME` dates, clock times, titles and location in those imported cards. Did not infer times from estimates.
- Removed two stale Thursday blocks whose cards explicitly defer work to Saturday without specifying new clock times. Their Saturday card dates remain visible.
- Updated the plan's reset metadata and recorded the imported intensive schedule as an exception to the normal daily cap. All 115 other rules stayed identical.
- Calendar, Today, the Court, planner, reminders, Review and Analysis read this shared plan; no copies of the user's tasks or progress were created.

## Files and commits
- Private reconciliation, proposal, before/after snapshots, backup receipt and verification: `.runtime/study-sync-2026-11-04/`. These stay outside Git.
- Documentation checkpoint: `[study-sync-cp1]` on the existing branch. Unrelated mail, guide and documentation changes were preserved.

## How I checked it
- Dry run checked one existing rule per imported window, matching card dates, valid clocks, no overlap between imported study windows, and preservation of every unaffected rule.
- Guarded `PATCH /api/hub/plan` used both the state revision and the previous plan's SHA-256. Readback matched exactly.
- Live read-only API verification: 7 blocks Wednesday, 9 Thursday, 1 Friday; every calendar time, title, location and card link agrees with Today. No duplicate all-day deadlines for those cards. Deferred tasks show on Saturday.
- Review and Analysis both report 1,160 planned minutes over the three days. The current notices use the new task titles. Every calendar and day source reports ready.
- State including progress, checklists, notes and settings is byte-equivalent after JSON serialization, with revision still 94. All native Study records are unchanged.
- 48 tests passed across Study calendar, day, notices, review, analysis and Study tick/focus suites. `Build Life OS.cmd` built the host and Study Hub successfully (existing bundle-size warning).
- Browser: Today visibly shows reconstruction variance at 13:00–14:05, the previously ticked MLE step, and the remaining imported work; the week planner shows all new windows and Saturday deferrals. The Study Hub itself shows the same seven windows and a 7h 5m total, with its outer strip showing the same current and upcoming tasks. Checks used the computer-use skill and CUA, with no task controls pressed.

## Data touched
Only the Autumn hub plan, through the running Life OS server. Rules 134 → 132. Tracker state revision 94 → 94, added cards 72 → 72, progress overlays 21 → 21. Native records: 2 semesters, 7 modules, 110 cards, 7 assessments, 81 sessions and 3,309 materials unchanged. No schema changes.

Backup before the write: `Life_OS_backups/study-2026-11-04/before-study-json-schedule-sync-2026-11-04-1793798552181.dump`, verified to have the PostgreSQL custom-format header. The exact prior plan and state are also retained in the private before-write snapshot.

## Problems and surprises
- The import changed cards but does not import the separate schedule plan; this was a one-time reconciliation, not a change to future import behavior.
- Imported Friday card says exam at 14:00, while the saved assessment remains 14:10–15:00. Its text itself asks for official confirmation. Assessment times were preserved.
- Imported Friday preparation 09:00–11:45 overlaps the retained laboratory starting at 11:10. The last 30 minutes of that preparation window are food, packing and travel. Attendance was preserved.
- Initial API access needed the unsandboxed local-network tool permission. No automatic approval was rejected.
- The first verification assertion used `ok` instead of this API's `ready` source status; corrected the verifier, then all checks passed.
- The repository is on `stage/6-desk` with unrelated edits underway; STATUS's previous stage summary was stale. Added a scoped status update instead of replacing ongoing handover material.

## Small decisions I made, and questions for Xar
- Kept the imported intensive windows exactly, including evenings and totals above the normal cap, rather than redesigning the plan.
- Deferred cards without explicit new times stay untimed on their imported dates.
- Official exam start and Friday attendance remain the two things to confirm.

## Next step
Refresh Life OS. Confirm the official Friday start and whether the lab is still being attended before changing either saved record. For a later JSON import, check the separate plan as well as the card projection.
