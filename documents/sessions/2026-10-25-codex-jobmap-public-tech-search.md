# 2026-10-25 · Codex · JobMap · public technical search

## Goal
Refresh current technical employee choices in both shared JobMap interfaces via the existing importer.

## What I did
Imported PHW Public Health Intelligence Analyst, Woodland Trust Dynamics 365 Developer and Starling Analytics Engineering Team Lead. Updated existing CPS Data Analyst with original recruiter link and publication date. Full-time hours and material gaps remain explicit. Read current public NHS, university, employer and job-board sources; documented pagination, failures, exclusions and unresolved candidates.

## Files and commits
Identical run batch/report, source evidence, held candidate and verification/parity JSON under both data/discoveries folders for 2026-10-25-public-tech-8f2d6a41. No app code changes or stage checkpoint commit; nothing published. Targeted JobMap STATUS entry preserves unrelated study work.

## How I checked it
Both dry-runs: 3 added, 1 updated, no skips/joins. Queued separately. Life OS processed receipt: imported; standalone separate receipt: already imported/unchanged. Both live APIs equal, 13 preservation checks pass. Both npm run check:parity commands PASS, 42 feature files, 1,173 records, no differences.

## Data touched
Shared owner revision 59 -> 60, visible jobs 1,170 -> 1,173. Recovery snapshot, API baseline and manifest: standalone data/recovery/2026-10-25-public-tech-8f2d6a41. Personal fields, old added dates and historical Life OS snapshot unchanged. No progress files or whole data folders copied.

## Problems and surprises
Initial verification was before polling and correctly showed queued. Kallidus original 106202 closes 29 October but dry-run proposed joining it to IMP-094. Historical URL redirects elsewhere, no saved body/reference: held rather than forcing a join. CWJobs/Totaljobs timed out, NWSSP/Work Hub blocked, embedded council/NHS boards only partly accessible. Coverage report names all limitations; this is not exhaustive internet coverage.

## Small decisions I made, and questions for Xar
Used current public-source boundary for the scheduled run. Did not access private accounts, archive, apply or send anything. No decision is needed to complete the verified import.

## Next step
Start from jobmap/data/discoveries/2026-10-25-public-tech-8f2d6a41.md. Resolve Kallidus vacancy identity before its 29 October deadline; follow retained original-link/eligibility candidates and inaccessible boards. PHW is the clearest new analytics lead, but full-time hours are not agreed at 20 hours.
