# Life OS: status

**Updated 5 November 2026 by Claude Code.** Branch: `stage/7-separation` (from `main`, which holds JobMap CP1 and stages 5 and 6, merged locally, not pushed); local app http://127.0.0.1:47850. Standalone JobMap remains frozen.

## Now

**Stage 7, code apart from data** ([brief](briefs/stage-7-separation.md)): still single-user; a clean version of the app (MIT, all parts, none of Xar's data, fresh history) goes to a new GitHub repository she names before the push. CP1 to CP4 done; CP5 (the public version) next.
- CP1: the privacy scan and the [inventory](briefs/stage-7-inventory.md). CP2: one configuration (`.env.example`).
- CP3: the core runs on PostgreSQL (schema `core`; 226 rows moved and compared; the SQLite file untouched, nothing reads it).
- **CP4 (done 5 November): content out of code.** The scan now finds 4 files, all CP5's to handle (from 164).
  - **Study:** the summer course files, their tests and scripts and an unused copy of the app moved to `Life_OS_data/study/archive/summer-2026-source/` (100 files, checksums); the app takes what was summer-specific from the semester's records. Your autumn semester is unchanged, minus two summer leftovers (an empty split panel, a "Data Mining" tile).
  - **Events** (was Cardiff Life): `/events`; old addresses redirect; the page reads its city and sources from `cardiff-life/events-settings.json`, so it looks as before; your Thursday research sync still works (a shim keeps `build_html.py` there). Your Maybe/Plan-to-go choices are copied to the new key the first time you open Events or the Calendar; the old copy stays.
  - **Budget:** neutral names; your browser's safety copies are copied to the new key name, never removed.
  - **JobMap:** location ranking comes from your places in Matching (written once through JobMap's API): all 1,306 jobs rank as before.
  - **Mail:** `mail/HARVEST.md` is the general format; your sources, the events handoff and the backfill are in `mail/HARVEST.local.md`, which it tells agents to read.

## How to see what's new

Top bar: "Events" instead of "Cardiff Life" (the page itself is the same). JobMap → Matching shows your places. Everything else looks as it did.

## Exact next step

1. Claude Code: stage 7 CP5. Prompt: "Continue stage 7: CP5, the public version."
2. Xar, when convenient: tell Cowork "Stage 6 import is live. Switch Integrate to mail/HARVEST.md (version 2) and read mail/HARVEST.local.md too; prepare the September backfill as weekly batches; try each on lifeos_test and show me before importing."

## Waiting on Xar

- Accepting the core's move (the old `code/life-os/backend/data/life-os.db` stays until then; deleting it is your step), and the Study archive (its originals are in git history too).
- The name of the new GitHub repository (asked before CP6).
- The old setting `cardiff-own-events` (an empty list) is left in place; removing it is your step.

## Known problems and limits

- `hosting/app.test.mjs`: its two Study checks fail since the hub began requiring If-Match (28 October); its Study part still points at `lifeos`, so don't run it until fixed (it ran once on 4 November; its one write was refused).
- The mail "reading room" test depends on the date (it fails with and without stage 7's changes); the Study app has 3 older failing checks (two `toISOString` uses, a lazy-route path) and 8 browser checks that need a test server.
- Two Budget tests use real budget snapshots and stay private; a made-up version is a follow-up.
- The saved Outlook archive has stand-in ids and text cut at 5,000 characters for most.
- The Bash tool's sandbox cannot reach PostgreSQL (use PowerShell); run git from the root. Codex and Claude Code work here at the same time: check `git status` before committing.

## Data

Core: `lifeos.core` 209 entries, 2 people, 13 rooms, 3 settings (`notices`, `cardiff-own-events`, now `own-events` when used). Backups: `Life_OS_backups/core-2026-11-04/`, `core-2026-11-05/` (notices before its one event id was renamed), `jobmap-2026-11-05/` (preferences before places). JobMap workspace revision 69. Mail: 19 batches, 1,173 messages, 1 item. Migrations on both databases: `mail/0002`, `mail/0003`, `core/0001`.

Last five sessions: [Stage 6 build](sessions/2026-11-04-claude-code-6-desk-build.md), [JobMap interview](sessions/2026-11-04-codex-jobmap-interview-links.md), [Study sync](sessions/2026-11-04-codex-study-json-sync.md), [Stage 5 build](sessions/2026-11-04-claude-code-5-harvest-build.md), [Stage 5 planning](sessions/2026-11-03-claude-code-5-planning.md).
