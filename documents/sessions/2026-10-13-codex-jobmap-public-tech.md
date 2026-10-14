# 2026-10-13 · Codex · JobMap · Public search

## Goal
Run the scheduled public technical vacancy search with full-time possibilities retained and verified separately in both JobMap inboxes.

## What I did
- Added eight verified vacancies: Cardiff Met Tester; RiDC Senior Researcher; UKCF Data and Insight Manager; two distinct Cardiff Babylab research adverts; SQL Cockpit Senior Data Engineer, Full-Stack Developer and Developer Relations Engineer.
- Read original adverts and research person specifications. Preserved full-time hours, unknowns, publication provenance, deadlines and material CV gaps.
- Recorded the actual coverage, stale/blocked pages, exclusions and unresolved leads in both discovery reports. No private accounts were accessed.
- Kept the nine jobs from the earlier 13:46 run; deduplicated against the shared 1,115-record baseline.

## Files and commits
- Both apps: `data/discoveries/2026-10-13-public-tech-74c2a901.json` and matching `.md` report.
- No app code or commit. Existing unrelated Life OS changes, including concurrent Guide work, were left alone.

## How I checked it
- Both queue-jobs dry-runs: 8 added, no updates or skips.
- Standalone processed receipt at 14:27:48 UTC: 8 added.
- Life OS processed receipt at 14:28:48 UTC: already imported, no change.
- No failure receipt for this run in either folder.
- Both live APIs: HTTP 200, revision 37, 1,123 records, every new vacancy URL exactly once.
- Both `npm run check:parity -- <peer>`: PASS, 40 shared feature files, no differences.
- Baseline comparison: prior preferences, overrides, custom jobs and observations unchanged.

## Data touched
Only source findings through each inbox; the owner imported once. Backup: standalone `data/recovery/2026-10-13-public-tech-74c2a901/progress-before.json`. The Life OS old progress snapshot was not written. Eight records have added date 13 October; unknown publication/deadline values remain blank.

## Problems and surprises
Many index results were stale. Saga, Monmouthshire testing and NBN looked current in secondary directories but had closed on original adverts. The actual SQL Cockpit employer domain contains a hyphen. Cardiff Council returned a dynamic shell; RCT entry needs correction. Full limits and retained candidates are in the report, not described as completed board coverage.

## Small decisions I made, and questions for Xar
All new roles are full-time; no 20-hour arrangement is promised. Babylab's PhD-or-industrial-equivalence route and other requirements are explicit stretch flags. No user decision is needed to complete this import.

## Next step
Use the retained coverage log for the next public pass, especially unresolved primary pages, council access and further NHS data/analytics and general-board pagination. Do not reimport this run or merge personal progress files. Continue Life OS's existing Guide stage independently.
