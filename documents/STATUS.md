# Life OS: status

**Updated 7 November 2026 by Codex (personal data corrections only).** Branch `stage/7-separation`; app http://127.0.0.1:47850. Main holds JobMap CP1 and stages 5?6, merged locally, not pushed. Standalone JobMap stays frozen.

## Now

**Stage 7, code apart from data** ([brief](briefs/stage-7-separation.md)): CP1?CP4 done; CP5, the public version, next. Single-user, MIT, all parts, fresh history, no personal data. Xar names the destination before push.
- CP1 privacy scan and inventory; CP2 shared configuration; CP3 core moved to PostgreSQL with all rows compared, old SQLite untouched.
- CP4 content out of code: scan down to four CP5 files. Summer sources archived with checksums; course content comes from records. `/events` replaces Cardiff Life with redirects/settings/choices preserved. Budget names/keys neutral; JobMap places preserve rankings. Mail uses HARVEST.md plus private HARVEST.local.md.
- **6 November planning correction:** native Budget meals, JobMap priority/goals, Study cards/blocks, People/Waiting on you, Health context and research workstreams saved. Generic duplicates retired, never deleted. Xar chose data integration only; no source/schema changes. [Session](sessions/2026-11-06-codex-calendar-data-native-integration.md).

- **7 November corrections:** morning sequence and person follow-up moved; project tasks aligned with live repository/report/board progress; deferred review moved after January; programme and travel/letter administration integrated. [Session](sessions/2026-11-07-codex-calendar-data-corrections.md). No app code changed.

## How to see what's new

Open [7 November My day](http://127.0.0.1:47850/today?date=2026-11-07). Morning order and the linked project card were verified in the in-app browser. Owning sections remain Study, JobMap, Budget, Health, People/Waiting on you, research, mind and travel/admin. The large catch-all capture stays retired.

## Exact next step

1. Development remains stage 7 CP5: "Continue stage 7: CP5, the public version."
2. Cowork handoff: use mail/HARVEST.md v2 and HARVEST.local.md; prepare September weekly backfill, try on lifeos_test before import.
3. Task connections and date-aware job matching are backlog work, not implemented by this data update.

## Waiting on Xar

Accept core move/Study archive (old SQLite stays; deletion is hers); name the new GitHub repository; decide whether to remove empty cardiff-own-events setting.

## Known problems and limits

- Do not run hosting/app.test.mjs until fixed: two Study checks lack If-Match and its target is lifeos; its one 4 November write was refused.
- Older failures: date-dependent mail reading-room test; three Study checks (two toISOString uses, lazy route); eight browser checks need a server. Two Budget snapshot tests remain private.
- Saved Outlook archive has stand-in IDs and mostly 5,000-character text limits. Bash sandbox cannot reach PostgreSQL; use PowerShell. Check concurrent work/git status before commits.
- General task relationships, contextual room navigation and future-start matching remain limited; career goals do not change matching/automation. The in-app browser works and My day was verified on 7 November; native desktop access failed on 6 November.

## Data

Read back 7 November: core 276 entries including archived captures; Autumn Study revision 112; JobMap 73; Budget unchanged at 117. One native owed action added, three updated; mail-message counts not refreshed. Private evidence/backups: .runtime/calendar-corrections-2026-11-07/; earlier native integration and capture receipts remain. PostgreSQL dump and JobMap API backup verified before writes. No migrations or direct database writes.

Last five sessions: [Schedule corrections](sessions/2026-11-07-codex-calendar-data-corrections.md), [Native integration](sessions/2026-11-06-codex-calendar-data-native-integration.md), [Stage 6](sessions/2026-11-04-claude-code-6-desk-build.md), [Interview](sessions/2026-11-04-codex-jobmap-interview-links.md), [Study](sessions/2026-11-04-codex-study-json-sync.md).
