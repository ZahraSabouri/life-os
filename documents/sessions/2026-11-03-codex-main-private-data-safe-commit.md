# 2026-11-03 · Codex · Main · Private-data-safe consolidation

## Goal

Xar explicitly requested that all pending work reach main, while personal data stays uncommitted and the local application remains live.

## What I did

- Reviewed pending Cardiff planner, mail instruction and documentation changes, and the existing 13-commit difference from local main. The latter contains application code, tests, exercise assets and development notes, not live database/workspace files.
- Extended root ignore rules for loose mail JSON, archives, checkpoint exports, output workbooks, personal application-update notes, local environment files and additional database backup formats. Files remain on disk.
- Replaced the detailed personal schedule in STATUS with a concise technical handover. Preserved the previous STATUS in the ignored audit folder. Old session notes remain untouched.
- Prepared an explicit safe staging list and a staged-content audit. No broad forced add, data migration, import activation, application submission or external publication.

## Files and commits

Maintenance commit: `[maintenance] Preserve pending work and protect private data`. Existing stage history is retained. Main is advanced only after confirming it is an ancestor, then selected at the same tree so the live application's files are not rolled back during switching. No push.

## How I checked it

- Frontend production build passes with output redirected to the ignored audit folder. The initial sandboxed config read was denied; the authorised build succeeded. The served build was not replaced.
- 69 checks pass across Cardiff planner, mail batch validation, shared training, Budget income/month handling, day/calendar and isolated stale-save guards. The reseeding host test was not run.
- Read-only live endpoint checks cover the host, Study, JobMap and Budget. The baseline records the host process identity and hashes of private files, core table contents and API responses for comparison after consolidation.
- Git whitespace, ignore coverage and staged path/content checks pass. Final branch/working-tree and unchanged-data checks accompany completion; results remain in the ignored audit folder.

## Data touched

None. Private files, records, attachments and workbook outputs stay in their existing locations. Audit evidence is under `.runtime/git-main-2026-11-03/`, which is ignored. No database copy, restart or reset was performed.

## Problems and surprises

The existing ignore rules missed loose mail exports and checkpoint copies. Some pending notes record personal applications, so those remain local alongside the workbook outputs. Existing development history is retained; this is not a rewrite or purge of old repository history.

## Small decisions I made, and questions for Xar

Treat "live" as keeping the existing local services and data available. Commit to local main without pushing. Keep private outputs rather than include them merely to clear the untracked list. No product or stage acceptance is inferred.

## Next step

Continue using the local application. Review the JobMap integration proposal before authorising implementation. A future remote publication is a separate action.
