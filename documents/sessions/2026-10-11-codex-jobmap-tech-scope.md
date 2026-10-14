# 2026-10-11 - Codex - JobMap scheduled search and scope correction

## Goal
Run the tech-only shortlist in both JobMaps and complete Zahra's previously requested correction of unrelated additions.

## What I did
- Imported one verified new Dataspire software vacancy into each app, using the same discovery runId: `2026-10-11-tech-only-a7d65c91`.
- Reversibly archived and unsaved the six exact off-field leads previously identified; no general archive sweep.
- Added the explicit tech-only restriction to both apps' search and maintenance guidance and the standalone workspace's root/career guidance.

## Files and commits
- JobMap AGENTS.md and SCHEDULED_SEARCH.md; discovery JSON and report; this session note and the JobMap entries in STATUS.md.
- No feature code changed. Existing modifications in Life OS AGENTS.md, stage-4a brief, JobMap guidance and earlier session notes were preserved. No commit includes those unrelated changes or private data.

## How I checked it
- Both queue dry-runs: one new role, no duplicate warnings. Same batch queued from each app's own directory.
- Both import logs, processed files and importRuns confirmed the addition; no pending or failed batches remained.
- All previous personal overrides, preferences, observations and custom records matched each app's automatic pre-import backup.
- The scope correction's API script verified source data, notes, dates and all unrelated progress were preserved.
- Both npm run check:parity commands passed (34 feature files; 1,065 records per app).

## Data touched
- JobMap only: 980 base + 85 custom = 1,065 records per copy. Verified revisions: standalone 28, Life OS 40.
- Six selected records are Archived and unsaved in each app; no records deleted. Life OS had already archived two but still had them saved.
- Pre-correction snapshots and verified results: each app's data/recovery/2026-10-09-tech-scope-correction/.
- Pre-import automatic backups are recorded in jobmap/data/discoveries/2026-10-11-tech-only-a7d65c91.md.

## Problems and surprises
- Standalone API was initially closed. Both normal launchers were run with --no-browser; both became available.
- Initial parity check caught the second copy still awaiting its poll. Subsequent processed/log checks and both parity checks confirmed completion.
- The new advert considers part-time work but states neither weekly hours nor Manchester visit frequency. Those remain explicit questions in JobMap. Publication and closing dates were unavailable and left unknown.

## Small decisions and questions
- Search used public sources only. No quota, generic income work, application submission or employer contact.
- No decision is required to complete this run.

## Next step
Continue scheduled searches within the tech-only scope and preserve each app's independent personal edits. Read the saved report before revisiting this run. Life OS stage 4b acceptance and unrelated work remain unchanged.
