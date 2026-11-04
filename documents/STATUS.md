# Life OS: status

**Updated 4 November 2026 by Claude Code.** Branch: `stage/5-harvest` (from `stage/jobmap-workflow`, so JobMap CP1 stays live); local app http://127.0.0.1:47850, restarted on the new code. Standalone JobMap remains frozen.

## Now

**Requested interview update (Codex, 4 November):** one confirmed Career calendar event, the existing JobMap record updated, and four related Outlook emails connected. Backed up and verified in the running app; source details and links stay private ([session](sessions/2026-11-04-codex-jobmap-interview-links.md)). The meeting joining link has yet to arrive.

**Study JSON sync (Codex, 4 November):** the imported cards' 17 explicit study windows now drive the shared schedule across Today, Calendar, Court, planner, notices, Review and Analysis. Two stale Thursday blocks were removed because their cards defer to Saturday. Progress and native Study records unchanged; backup taken, 48 tests and both builds passed ([session](sessions/2026-11-04-codex-study-json-sync.md)). Confirm Friday's imported 14:00 exam start versus saved 14:10, and preparation overlapping the 11:10 lab. Current checkout is `stage/6-desk`; unrelated work below is preserved.

**Stage 5 Harvest is built, CP1 to CP8** ([brief](briefs/stage-5-harvest.md), [session](sessions/2026-11-04-claude-code-5-harvest-build.md)). One way in for everything harvested (mail batch version 2, `mail/HARVEST.md`); things to do are actions, what came in are items, and each shows in its place:
- **Inbox → Harvest log** in place of Digests: the sources, one page per day, and **Everything** (filters, Keep/Dismiss for several).
- **Inbox → Mail** as a reading room: area, priority, what it led to, dates, not opened; newsletters and folded senders one line a day; fold or hide a sender; several at once; what was taken; working Gmail links (account 1, in the log's Settings).
- **"Came in"** on the Calendar, on Today, and in the strip of Study, JobMap, Cardiff Life, Budget (the Offers list) and Health. Cardiff events reach the Calendar once marked Plan to go.

Nothing harvested shows yet: no version 2 batch has arrived. The strips stay hidden until one does.

**JobMap CP1** (Codex) is committed as `fe8e792` and still waits for Xar's check.

## Exact next step

1. Xar looks at Inbox → Harvest log and Mail (filters, fold a newsletter sender, the Settings), and the Calendar's Cardiff filter.
2. Tell Claude in Cowork "stage 5 import is live": it switches the Integrate task to version 2 (`mail/HARVEST.md`) and prepares the September backfill, oldest week first, tried on `lifeos_test`.
3. Xar says yes before the backfill goes into the live database.

**Next prompt (Cowork):** "Stage 5 import is live. Switch Integrate to mail/HARVEST.md and prepare the September backfill as weekly batches; try each on lifeos_test and show me before importing."

## Waiting on Xar

- Acceptance of stage 5 (the brief's checklist) and of JobMap CP1.
- Yes for the real backfill. Then merging `stage/jobmap-workflow` and `stage/5-harvest` into `main` (in that order).

## Known problems and limits

- Saved Outlook archive: stand-in ids, so September and October Outlook messages show no "Open in Outlook"; text cut at 5,000 characters for most. Gmail's extract is held in a Cowork browser tab, not saved.
- The Guide's Inbox pictures show the old Digests page until they are retaken (Guide → Retake the pictures).
- The Bash tool's sandbox cannot reach PostgreSQL; database work runs in PowerShell. A stray `.git` folder in `code/life-os` (owned by Codex's sandbox account) makes git refuse there: run git from the project root.
- Never start the frozen standalone JobMap or run `hosting/app.test.mjs` (it reseeds core).

## Data

Live mail store unchanged by this stage's work: 1,171 messages, 18 batches, 25 actions, 1,587 history rows, 0 items, 0 sender rules. Migration `mail/0002_items.sql` applied to `lifeos_test` and `lifeos` after dumps (`Life_OS_backups/study-2026-11-03/`). Test data went to `lifeos_test` only.

Last five sessions: [Stage 5 build](sessions/2026-11-04-claude-code-5-harvest-build.md), [Stage 5 planning](sessions/2026-11-03-claude-code-5-planning.md), [JobMap CP1](sessions/2026-11-03-codex-jobmap-workflow-cp1.md), [main consolidation](sessions/2026-11-03-codex-main-private-data-safe-commit.md), [data explanation](sessions/2026-11-01-codex-data-structure-explanation.md).
