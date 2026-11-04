# Life OS: status

**Updated 4 November 2026 by Claude Code.** Branch: `stage/7-separation` (from `main`, which holds JobMap CP1 and stages 5 and 6, merged locally, not pushed); local app http://127.0.0.1:47850. Standalone JobMap remains frozen.

## Now

**Stage 7, code apart from data, is under way** ([brief](briefs/stage-7-separation.md)): still single-user; a clean version of the app (MIT, all parts, none of Xar's data, fresh history) goes to a new GitHub repository she names before the push.
- CP1: `scripts/privacy-scan.mjs` and the [inventory](briefs/stage-7-inventory.md).
- CP2: one configuration (data and backup folders, port, address, keys from settings; `.env.example`, `postgres.example.json`).
- **CP3 (done): the core runs on PostgreSQL.** Entries, people, rooms, settings and pictures' rows are in schema `core` of `lifeos` (migration `core/0001_core.sql`, owner column on every table). The move (`scripts/move-core-to-postgres.mjs`) backed up both sides, copied in one transaction and compared all 226 rows value by value. Before switching, the new code's answers were compared with the running app's for every entry, list, filter, People, settings and the calendar: identical, row order included. The SQLite file is untouched (same bytes after the switch) and nothing reads it.
- Next: CP4, content out of code (Study's courses as data, "Cardiff Life" as Events for any city, the Guide and samples anyone's).

**Accepted 4 November ("yes to all"):** JobMap CP1, stage 5 Harvest and stage 6 the Desk ([session](sessions/2026-11-04-claude-code-6-desk-build.md)); the September backfill may go live once each batch passes on `lifeos_test`.

**Codex, 4 November:** interview update in JobMap and the calendar ([session](sessions/2026-11-04-codex-jobmap-interview-links.md)); the imported study windows drive the schedule everywhere ([session](sessions/2026-11-04-codex-study-json-sync.md)): confirm Friday's 14:00 versus 14:10 exam start; the [data model reference](../outputs/20261104-data-model-reference/Life_OS_Complete_Data_Model_Reference.pdf) (stage 7 has since added schema `core`).

## How to see what's new

Nothing looks different, which is the point: open Today, Calendar, People and Journal as usual. Everything you add or change is now saved in PostgreSQL.

## Exact next step

1. Claude Code: stage 7 CP4. Prompt: "Continue stage 7: CP4, content out of code."
2. Xar, when convenient: tell Cowork "Stage 6 import is live. Switch Integrate to mail/HARVEST.md (version 2, with the stage 6 kinds and states) and prepare the September backfill as weekly batches; try each on lifeos_test and show me before importing." (The 14:00 batch today already brought the first item.)

## Waiting on Xar

- Accepting the core's move: the old file `code/life-os/backend/data/life-os.db` stays until then; deleting it is your step.
- The name of the new GitHub repository (asked before CP6).
- JobMap's CV and cover-letter helper stays until the app's own drafting (her choice, 4 November).

## Known problems and limits

- `hosting/app.test.mjs`: its two Study checks fail since the hub began requiring If-Match (28 October); its core checks now use `lifeos_test`. Its Study part still points at `lifeos`, so don't run it until it is fixed (it ran once on 4 November: the one write it tried was refused, nothing changed).
- The privacy scan still finds "Cardiff" in the events code and a name in one script message: CP4's work.
- The saved Outlook archive has stand-in ids (no "Open in Outlook" for September and October) and text cut at 5,000 characters for most. Gmail's extract is held in a Cowork browser tab, not saved.
- The Bash tool's sandbox cannot reach PostgreSQL (use PowerShell); a stray `.git` folder in `code/life-os` makes git refuse there (run git from the root). Codex and Claude Code work in this folder at the same time: check `git status` before committing.

## Data

Core: `lifeos.core` 209 entries, 2 people, 13 rooms, 2 settings, no pictures; backups in `Life_OS_backups/core-2026-11-04/` (SQLite copy and dump) and `study-2026-11-04/before-migration-*.dump`. `lifeos_test.core` holds a trial copy. Mail: 19 batches, 1,173 messages, 1 item (the 14:00 batch on 4 November). Migrations applied to both databases after dumps: `mail/0002`, `mail/0003`, `core/0001`.

Last five sessions: [Stage 6 build](sessions/2026-11-04-claude-code-6-desk-build.md), [JobMap interview](sessions/2026-11-04-codex-jobmap-interview-links.md), [Study sync](sessions/2026-11-04-codex-study-json-sync.md), [Stage 5 build](sessions/2026-11-04-claude-code-5-harvest-build.md), [Stage 5 planning](sessions/2026-11-03-claude-code-5-planning.md).
