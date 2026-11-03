# 2026-11-03 · Claude Code · Stage 5 · planning

## Goal
Check Cowork's draft Harvest brief against the real code, propose changes, and with Xar's agreement turn it into the approved `stage-5-harvest.md` with concrete checkpoints.

## What I did
- Read the mail module, the core database, the Calendar service and mappers, the Inbox pages, and how JobMap, Cardiff Life, Budget and the Study hub take data in.
- Found that the draft assumed things that do not exist: core entries are SQLite with no `deadline` or `plan` type; Cardiff Life has no import (agents keep `events.csv`; Plan to go lives in the browser, and the Calendar already reads it); Budget has no import or pending list (only a whole-state save); the Study hub has no announcement queue; Mail already has most of the reading-room filters. JobMap's inbox needs its own `queue-jobs.mjs` batches.
- Proposed one way in (v2 of the mail batch), actions for things to do and items for what came in, all in the mail store; JobMap and Cardiff Life keep their own routes; places checked by link. Xar left the route to me on data integrity and reuse; recorded in DECISIONS.
- Wrote `briefs/stage-5-harvest.md` (eight checkpoints with files, tables and tests), removed the draft, pointed the runbook at the new name.
- Found Codex's JobMap CP1 staged but not committed (its note said committed): the two built files its client page names are ignored by `/dist/` and had not been force-added. With Xar's OK, committed exactly that work plus those two files as `fe8e792`.

## Files and commits
- `fe8e792` [jobmap-workflow-cp1] Add sourced profiles and requirements review (Codex's work, committed for it)
- `[5-plan]` Stage 5 brief approved (this note, the brief, DECISIONS, STATUS, runbook)

## How I checked it
Read-only: the code paths above; a read-only count of the mail store (797 Gmail, 355 Outlook, 19 Learning Central messages; 18 batches; 25 actions, 13 with a day); the shape of stored ids (Gmail ids are real Gmail ids; Outlook ids are Life OS stand-ins); the Outlook archive's fields (260 messages, text cut at 5,000 characters, 23 with full text and links).

## Data touched
None. No migration, no import, no app restart.

## Problems and surprises
- The Bash tool's sandbox cannot reach PostgreSQL here; database work runs in PowerShell.
- `stage/5-harvest` starts from `stage/jobmap-workflow`, not `main`, so the running app keeps JobMap CP1.

## Small decisions I made, and questions for Xar
- Offers: stored by Life OS, shown on the Budget page (reasons in DECISIONS).
- Dropped from this stage: People suggestions, area chips everywhere, a Study-hub announcements panel.

## Next step
CP1 of `briefs/stage-5-harvest.md`.
