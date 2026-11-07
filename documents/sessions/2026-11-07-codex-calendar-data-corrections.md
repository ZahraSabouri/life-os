# 2026-11-07 - Codex - Calendar data - Corrections

## Goal
Apply Xar's corrections within existing app features: change the morning order, move a person's follow-up to next week, align project work with actual progress, defer independent study until after January, and integrate university/travel administration. No app development.

## What I did
- Read the live project repository, open pull request, report editor and task board in the in-app browser. Shared data/EDA outputs exist in a pending-review pull request; modelling tasks remain To do and the report contains result placeholders. Replaced generic early report work with the real modelling stages and dependencies; kept the official submission deadline.
- Reordered breakfast, household preparation, shower/hair and interview preparation. Added an optional short closing-job review, with two native JobMap follow-ups.
- Moved the same person action and its time reservation to the following week, preserving the person link; deferred independent review to February using the same card identity.
- Broadened the existing marks inquiry, added one programme-progression inquiry, and reused an existing signed-letter enquiry for the revised travel workflow. Added a native planned trip and dated travel/admin tasks without guessing bookings or exact travel dates.
- Looked up the two calendar announcement labels. They are imported information, not attendance commitments; left them unchanged.

## Files and commits
- Documentation checkpoint: `[calendar-data-cp3] Correct schedule from live project progress`.
- Private evidence, previews, before/after snapshots, scripts, backups and verification: `.runtime/calendar-corrections-2026-11-07/`.
- No app source, schema, external project, application, email or booking changed. Earlier unrelated untracked notes were left alone.

## How I checked it
- Preview schema validation and overlap check; guarded API saves; readback comparing all unrelated entries/actions/jobs and all existing progress, notes, official assessments and completed-semester history.
- Verified the exact morning sequence in the visible DOM of My day; project block links to its real Study card. The in-app browser works now. Person follow-up appears once on the new effective date; independent study has no blocks before February; no new timed conflicts.
- Verification initially caught an empty `history` array that JobMap adds when first patching a job. Adjusted only the verifier to allow that normalisation; all preservation checks then passed. No build needed for data-only changes.

## Data touched
Core 267 to 276 (8 updated, 9 added); Autumn Study revision 111 to 112 (3 cards added, existing card identities/progress retained); JobMap 71 to 73 (two follow-ups only); three native actions updated and one created. Budget unchanged. PostgreSQL custom dump verified as PGDMP and JobMap full API backup retained before writes. Only server APIs wrote data; revision guards used throughout.

## Problems and surprises
Sandbox localhost access now requires escalation; the local API operations passed automatic review. An existing older letter enquiry was already present, so it was updated through personal fields instead of duplicated. Calendar announcement date bands can look like commitments even though their source labels identify them as announcements.

## Small decisions I made, and questions for Xar
Used Tuesday for the unavailable person's follow-up and 1 February as the provisional restart after January. Exact travel dates/destination, appointments, programme-credit rules and results remain undecided/unconfirmed and have tasks to resolve them. Nothing was sent or booked.

## Next step
Xar can use the corrected day. Keep future task-navigation/matching changes separate from these data-only requests. Stage 7 CP5 remains the unrelated development next step.
