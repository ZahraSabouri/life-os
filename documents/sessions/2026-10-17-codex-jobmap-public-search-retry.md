# 2026-10-17 · Codex · JobMap · Public search retry

## Goal
Resume the interrupted public technical-employee search and update both JobMap interfaces while preserving all personal state.

## What I did
- Added nine verified technical employee leads; corrected Cardiff University vacancy 200 from 6 November to 27 October.
- Read original employer/recruiter bodies, reviewed four Sadler directory pages, deduplicated alternate listings, and documented pending/blocked sources. All new leads are full-time, with reduced hours unagreed.
- Saved identical run 2026-10-17-public-tech-e4387c9a and report in both discovery folders; dry-ran and queued separately.

## Files and commits
- jobmap/data/discoveries/2026-10-17-public-tech-e4387c9a.json, .md and -verification.json.
- No app-code changes or code checkpoint commit. Private discovery files were not published.

## How I checked it
Both dry-runs: nine additions, one update, zero skipped. Life OS inbox imported; standalone inbox has a separate already-imported/no-change processed receipt. Both live APIs agree. Both npm run check:parity commands passed: 41 feature files, 1,166 records, no differences. All 13 preservation and content checks passed.

## Data touched
Shared owner revision 42 → 43; 1,157 → 1,166 records. Backup under C:\Users\ctrlz\Documents\JobMap\Career Agent\JobMap App\data\recovery\2026-10-17-public-tech-e4387c9a. Historical Life OS progress unchanged by hash. No progress or whole data folder copied across apps. Notes, stars, stages, priorities, dates and preferences preserved.

## Problems and surprises
Several Sadler adverts repeat the same work. Later public requests were rate-limited; unresolved bodies and identities remain in the report. The university's jobs.ac.uk placement date was 16 October, but original employer publication was 9 October. Its deadline materially changed. Private accounts were not reviewed in this public-source retry.

## Small decisions I made, and questions for Xar
Kept every verified distinct in-scope finding, with no quota; did not import unsupported candidates or duplicate agency listings. No decision required from Xar for this import.

## Next step
Continue the explicit pending list in the coverage report when sources are accessible; check the current collection before adding anything. No application, messaging or registration is authorised by this run.
