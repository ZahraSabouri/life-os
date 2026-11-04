# 2026-11-04 · Codex · JobMap · Interview and correspondence links

## Goal
Carry out Xar's direct request to add her confirmed interview to the calendar and existing job record, and connect its related emails. This is a personal data update, separate from the ongoing app stages.

## What I did
- Read the confirmation and three related Outlook messages through the computer-use skill and CUA. Matched the existing JobMap vacancy; no new job was created.
- Imported a validated, scoped version 2 batch through the running Life OS inbox after trying it on `lifeos_test`. Added two new messages and updated two existing messages in place, correcting the older summaries' subject, time and original mailbox links. Connected all four to one application item.
- Added one confirmed Career calendar event with the accepted slot, virtual location and links back to the job and correspondence. Kept the joining link explicitly pending.
- Updated the existing JobMap stage and outcome, appended notes, and added labelled links to the appointment, source emails and accepted booking. Did not infer a missing application submission date.

## Files and commits
Private source text, IDs, dates, URLs, before/after snapshots, reviewed batch, scripts, backup receipt and verification are in `.runtime/jobshop-interview-2026-11-04/`, outside Git. No app source was changed. Documentation checkpoint: `[jobmap-data-cp1]` on the existing branch.

## How I checked it
- Batch checker passed; test database importer accepted all four messages and the application item.
- Live readback: two existing message IDs preserved, two messages added, four unique messages linked, one application item found in JobMap, and no redundant stage-change suggestion after the JobMap update.
- Calendar has exactly one new timed Career event with the specified start/end. The day also lists the job under Interviews.
- All other JobMap jobs and all other core entries compared equal before and after; job count, preferences and original application date preserved. Mail actions unchanged.
- Browser: the calendar day visibly shows the interview and correct interval/location. JobMap's panel shows the Interview stage, Interview invited outcome, next step and all four original email links.
- No build or source tests were needed for this data-only update. Runtime validation, test import and live verification covered the changes.

## Data touched
One new core event; one existing job updated (revision 67 → 68); two messages added and two refreshed (1,171 → 1,173); one kept application item with all four messages. No new actions, schema changes, application submissions or external messages. Backups: full JobMap API export; a SQLite online backup of core checked with `PRAGMA quick_check`; the importer-created PostgreSQL custom-format dump, checked for `PGDMP`. Exact backup paths are in the private receipt.

## Problems and surprises
The original harvest had stand-in IDs and one approximate received time. Reusing its two existing identities avoided duplicates while replacing their links/content with what live Outlook showed. Exact submission time and the Teams joining link remain unknown. A syntax typo in the private verifier was corrected before its successful read-only run.

## Small decisions I made, and questions for Xar
Interpreted the request in the ongoing Life OS context as its Calendar and JobMap; the external Jobshop booking was already accepted and was not changed. Used the user-provided accepted-slot screenshot for the end time and platform, and the live confirmation for the start/date. No mailbox messages were sent or moved.

## Next step
Open the linked job's My application section or its calendar day. Add the actual Teams joining link when it arrives.
