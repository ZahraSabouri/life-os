# 2026-10-08 - Codex - JobMap - Both copies

## Goal
Follow Xar's instruction to update the standalone and Life OS JobMap apps during scheduled searches and further development.

## What I did
- Updated the existing UK Tech Job Shortlist - JobMap automation to compare and deliver findings to both copies, retaining its schedule, active state and target chat.
- Added persistent AGENTS.md instructions at the standalone root and in both app folders, plus a pointer in Career Agent/AGENTS.md. Both search guides now require separate dry runs, queues and result checks.
- Recorded the decision and resolved the pending search-destination question in STATUS and the Stage 4a brief. Shared development must retain Life OS paths, hosting, style integration and unrelated work.

## Files and commits
- Standalone AGENTS.md, Career Agent/AGENTS.md, app AGENTS.md and SCHEDULED_SEARCH.md.
- Life OS jobmap/AGENTS.md and SCHEDULED_SEARCH.md, documents/STATUS.md, DECISIONS.md, briefs/stage-4a-jobmap-refresh.md and this note.
- No application code changed. No commit created for these maintenance notes on the existing stage/4b-one-look branch.

## How I checked it
- Both app directories exist; source jobs, importer modules and queue script have matching SHA-256 hashes. The progress files differ, so whole-workspace copying would overwrite distinct user data.
- Read back both instruction files and search guides and verified the saved automation still has its original schedule, status and target chat, with both app paths in the new prompt.
- No new job batch was created or imported. Actual unattended delivery will be checked by the next scheduled run. No build or application tests were needed for instruction-only edits.

## Data touched
None. Existing style changes on stage/4b-one-look were left intact. Previous versions of edited documentation were copied to the standalone outputs/jobmap-maintenance-before-2026-10-08 folder.

## Problems and surprises
The prior STATUS snapshot said stage/4a-jobmap-refresh; Git is on stage/4b-one-look with unfinished style changes. This maintenance task preserves those changes and does not accept or complete that stage.

## Small decisions I made, and questions for Xar
Research once, import separately with the same runId, and preserve each workspace's personal edits. Vacancy IDs may differ, so identity resolution is checked against the target collection. No pending decision about search destination remains.

## Next step
On the next scheduled job search, verify both queues/import logs and report any per-copy failure. Continue the current style work using its own brief; earlier JobMap UI acceptance checks remain outstanding.