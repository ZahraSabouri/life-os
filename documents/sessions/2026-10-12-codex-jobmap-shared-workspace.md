# 2026-10-12 - Codex - JobMap shared workspace fix

## Goal
Make standalone JobMap and Life OS JobMap show the same saved content and keep future personal edits aligned.

## What I did
- Connected both interfaces to one owning workspace through installation data/workspace-connection.json files. The standalone service is its only writer; Life OS forwards its JobMap API calls and can start the owner automatically.
- Reconciled explicit choices field by field through the revision-protected restore API. No conflicting values were found. Preserved all notes, priorities, application information, preference values and activity events from both originals.
- Combined the 55 additional Life OS stars and six additional archives. Twelve differing Added dates now use the first known JobMap import date; both originals retain their per-copy dates in recovery snapshots.
- Kept discoveries and inbox receipts separate. The owner polls both inboxes and imports each runId once. Queue/import helpers resolve the current owning workspace instead of the old Life OS progress file.
- Parity now checks the shared connection and personal choices as well as code and vacancy evidence.
- Corrected static response Content-Length in both JobMap servers, preventing conflicting HTTP headers when Life OS adds its shared styles. Life OS hosting and skin code were retained.

## Files and commits
- Shared server, launch/import/queue/parity helpers, workspace connection and merge modules, reconciliation command, workspace integration tests, package test script and README in both apps.
- JobMap maintenance/search guidance and the JobMap entries in Life OS status were updated. Earlier unrelated documentation changes were preserved and excluded from the code commit.
- Code checkpoint: [jobmap-cp2] Share saved workspace between both JobMap interfaces.

## How I checked it
- All six npm test suites passed in each copy; TypeScript checks and both production builds passed.
- Shared integration checks passed again after the HTTP fix: Life OS-only startup, bidirectional saved edits/preferences, simultaneous-save revision protection, no second owner, both inbox receipts, one import per runId, service restart, and valid static HTTP headers.
- Both parity commands passed: 38 shared feature files, 1,066 records, sharedWorkspace true, no differences.
- Live API workspaces are identical, all five views and seven sort orders agree, and all 162 originally saved personal values, including activity histories were verified preserved. Browser-style HTML requests confirm the Life OS skin loads and built assets match.
- Both inboxes have no pending batches. The two JobMap services were restarted; the rest of Life OS was left running.

## Data touched
- One owning progress file, modified through its API with an automatic before-restore backup. Shared revision 30: 980 original + 86 added = 1,066 jobs, 79 starred, 12 archived, 49 default part-time results, 78 visible shortlist jobs and 1 application.
- Before-0.json, before-1.json, proposed.json, review.json and verification.json are kept in each app's data/recovery/shared-workspace-2026-10-12T11-07-20-272Z/.
- The Life OS historical data/workspace/progress.json (revision 41) remains unchanged and is no longer active. No progress file or data folder was copied over the other.
- Installation connection files identify the owner and both inboxes; they are private data, excluded from Git. Affected Life OS code was also backed up before porting.

## Problems and surprises
- The first page check lacked the browser Accept header needed for skin injection. The corrected request then exposed the HTTP header conflict; the targeted JobMap response fix resolves it.
- Existing Life OS documentation modifications remain present. This task did not accept a design stage or change unrelated modules.

## Small decisions and questions
- Shared data is the durable fix for repeated drift. Life OS retains its style integration, and tabs can independently choose views/search/sorts.
- No user decision is pending for this fix. Refresh existing tabs once; later saved changes arrive through their normal idle/focus refresh.

## Next step
Continue tech-only searches against the shared collection, save findings in both discovery folders and verify each inbox receipt. Keep future shared code changes in both apps and run full parity.
