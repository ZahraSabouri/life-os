# Life OS: status

**Updated 3 November 2026 by Claude Code.** Branch: `stage/5-harvest` (from `stage/jobmap-workflow`, so JobMap CP1 stays live); local app http://127.0.0.1:47850. Standalone JobMap remains frozen.

## Now

**Stage 5 Harvest is approved and building:** [brief](briefs/stage-5-harvest.md). One way in for everything harvested (v2 of the mail batch); things to do become actions, everything else becomes items, and each shows in its place: the Calendar, the Budget page's Offers, links into JobMap and Cardiff Life, a Harvest log by day, and Mail as a reading room. Why it is shaped this way: [DECISIONS, 3 November](DECISIONS.md).

**JobMap CP1** (Codex) is committed as `fe8e792` on `stage/jobmap-workflow` and still waits for Xar's check ([session](sessions/2026-11-03-codex-jobmap-workflow-cp1.md)). The commit had not been made; it is now, with the two built files its page needs.

## Exact next step

CP1 to CP6 are done (`[5-cp1]` format and routing rule; `[5-cp2]` items stored; `[5-cp3]` Calendar "Came in" layer and Plan to go; `[5-cp4]` places in JobMap and Cardiff Life and a "Came in" count on each part; `[5-cp5]` the Harvest log with Everything; `[5-cp6]` Mail as a reading room: area, priority, what it led to, dates, not opened; newsletters and folded senders one line a day; fold or hide a sender; several hidden or marked opened at once; what was taken; working Gmail links from the account setting, Outlook links only when real). Next: CP7, "Came in" on Today. Xar added on 3 November: a "Came in" strip on each part's page, the sources panel on the log, sender rules in Mail, app suggestions to `mail/suggestions.md` (in the brief).

**Next prompt:** "Read AGENTS.md and documents/STATUS.md, then do the next unchecked checkpoint of documents/briefs/stage-5-harvest.md on branch stage/5-harvest."

## Waiting on Xar

- JobMap CP1 review (Life OS → JobMap → My profile; a job's Requirements and evidence).
- Stage 5 checkpoints as they land; the real September to November backfill only on her yes (Cowork makes it).

## Known problems and limits

- Saved Outlook archive: stand-in ids (no working Outlook links for September and October) and text cut at 5,000 characters for most messages. Gmail's extract is held in a Cowork browser tab, not saved.
- The Bash tool's sandbox cannot reach PostgreSQL; database work runs in PowerShell.
- Never start the frozen standalone JobMap or run `hosting/app.test.mjs` (it reseeds core).

## Data

Mail store: 1,171 messages (797 Gmail, 355 Outlook, 19 Learning Central), 18 batches, 25 actions, 1,587 history rows; unchanged by migration `mail/0002_items.sql` (dumps in `Life_OS_backups/study-2026-11-03/`). No items yet: they arrive with the first v2 batch.

Last five sessions: [Stage 5 planning](sessions/2026-11-03-claude-code-5-planning.md), [JobMap CP1](sessions/2026-11-03-codex-jobmap-workflow-cp1.md), [main consolidation](sessions/2026-11-03-codex-main-private-data-safe-commit.md), [data explanation](sessions/2026-11-01-codex-data-structure-explanation.md), [linked dictionary](sessions/2026-10-31-codex-data-dictionary-links.md).
