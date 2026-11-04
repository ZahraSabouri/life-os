# Life OS: status

**Updated 4 November 2026 by Claude Code.** Branch: `stage/6-desk` (from `stage/5-harvest`, which is from `stage/jobmap-workflow`); local app http://127.0.0.1:47850, restarted on the new code. Standalone JobMap remains frozen.

## Now

**Stage 6, the Desk, is built, CP1 to CP6** ([brief](briefs/stage-6-desk.md), [session](sessions/2026-11-04-claude-code-6-desk-build.md), [prototype](https://claude.ai/artifact/7RjsaJY8Trpf3GMeQj9tUy)). Mail becomes things, each in its domain (Work, Learning, Social, Money, Home, Health, Travel, Admin) and its own colour on every style. New kinds: application, order, bill, payment, subscription, tenancy, booking, appointment, official letter, document, account notice, person, and opportunities by form. Things move through states, and what happened is kept. Inbox opens on the **Desk** (Now, domains, cards, a drawer, Triage); **Messages** say what each is about (filed, or a marked guess). Applications offer the matching JobMap change. The app names no assistant and hands out no prompts (`[5-fix]`). The Desk fills when the first version 2 batch arrives; today it shows what was kept quiet this week.

**Stage 5 Harvest** (built, waiting for acceptance) is the store and the one way in this builds on ([brief](briefs/stage-5-harvest.md)).

**Requested interview update (Codex, 4 November):** one confirmed Career calendar event, the existing JobMap record updated, and four related Outlook emails connected. Backed up and verified in the running app; source details and links stay private ([session](sessions/2026-11-04-codex-jobmap-interview-links.md)). The meeting joining link has yet to arrive.

**Study JSON sync (Codex, 4 November):** the imported cards' 17 explicit study windows now drive the shared schedule across Today, Calendar, Court, planner, notices, Review and Analysis. Two stale Thursday blocks were removed because their cards defer to Saturday. Progress and native Study records unchanged; backup taken, 48 tests and both builds passed ([session](sessions/2026-11-04-codex-study-json-sync.md)). Confirm Friday's imported 14:00 exam start versus saved 14:10, and preparation overlapping the 11:10 lab.

**Data structure discussion (Codex):** the [complete technical reference](../outputs/20261104-data-model-reference/Life_OS_Complete_Data_Model_Reference.pdf) explains actual types, structures and design options ([note](sessions/2026-11-04-codex-complete-data-model-reference.md)). Stage 6 has since added `mail.item_events`, item states and sender domains (migration `mail/0003_things.sql`).

## Exact next step

1. Xar opens Inbox (the Desk is empty until a version 2 batch arrives; Messages already show guessed domains, about 90% of messages from September onward) and reads the Guide's Inbox chapter.
2. Tell Cowork: "Stage 6 import is live. Switch Integrate to mail/HARVEST.md (version 2, with the stage 6 kinds and states) and prepare the September backfill as weekly batches; try each on lifeos_test and show me before importing."
3. Then stage 7, Accounts: plan it with Xar first.

## Waiting on Xar

- Acceptance of stages 5 and 6 and of JobMap CP1; the yes for the real backfill; merging `stage/jobmap-workflow`, `stage/5-harvest`, `stage/6-desk` into `main`, in that order.
- JobMap's CV and cover-letter helper stays until the app's own drafting (her choice, 4 November).

## Known problems and limits

- The saved Outlook archive has stand-in ids (no "Open in Outlook" for September and October) and text cut at 5,000 characters for most. Gmail's extract is held in a Cowork browser tab, not saved.
- Guessed domains are word guesses: a sender taught in Messages fixes them for good. The Guide's Inbox pictures need retaking.
- The Bash tool's sandbox cannot reach PostgreSQL (use PowerShell); a stray `.git` folder in `code/life-os` makes git refuse there (run git from the root). Codex and Claude Code worked in this folder at the same time on 4 November: check `git status` before committing.
- Never start the frozen standalone JobMap or run `hosting/app.test.mjs` (it reseeds core).

## Data

Live mail store unchanged by stages 5 and 6: 1,171 messages, 18 batches, 25 actions, 1,587 history rows, 0 items, 0 sender rules. Migrations `mail/0002_items.sql` and `mail/0003_things.sql` applied to `lifeos_test` and `lifeos` after dumps (`Life_OS_backups/study-2026-11-03/`, `study-2026-11-04/`). Test data went to `lifeos_test` only.

Last five sessions: [Stage 6 build](sessions/2026-11-04-claude-code-6-desk-build.md), [JobMap interview](sessions/2026-11-04-codex-jobmap-interview-links.md), [Study sync](sessions/2026-11-04-codex-study-json-sync.md), [Stage 5 build](sessions/2026-11-04-claude-code-5-harvest-build.md), [Stage 5 planning](sessions/2026-11-03-claude-code-5-planning.md).
