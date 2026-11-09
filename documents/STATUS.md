# Life OS: status

**Updated 9 November 2026 by Codex (personal data corrections only).** Branch `stage/7-separation`; app http://127.0.0.1:47850. Main holds JobMap CP1 and stages 5?6, merged locally, not pushed. Standalone JobMap stays frozen.

## Now

**Stage 7, code apart from data** ([brief](briefs/stage-7-separation.md)): CP1?CP4 done; CP5, the public version, next. Single-user, MIT, all parts, fresh history, no personal data. Xar names the destination before push.
- CP1 privacy scan and inventory; CP2 shared configuration; CP3 core moved to PostgreSQL with all rows compared, old SQLite untouched.
- CP4 content out of code: scan down to four CP5 files. Summer sources archived with checksums; course content comes from records. `/events` replaces Cardiff Life with redirects/settings/choices preserved. Budget names/keys neutral; JobMap places preserve rankings. Mail uses HARVEST.md plus private HARVEST.local.md.
- **6 November planning correction:** native Budget meals, JobMap priority/goals, Study cards/blocks, People/Waiting on you, Health context and research workstreams saved. Generic duplicates retired, never deleted. Xar chose data integration only; no source/schema changes. [Session](sessions/2026-11-06-codex-calendar-data-native-integration.md).

- **7 November corrections:** morning sequence and person follow-up moved; project tasks aligned with live repository/report/board progress; deferred review moved after January; programme and travel/letter administration integrated. [Session](sessions/2026-11-07-codex-calendar-data-corrections.md). No app code changed.

- **7 November wake-up replan:** unfinished routine and meals shifted later, with two hours of interview preparation and a 90-minute project block. Groceries moved to the following day. [Session](sessions/2026-11-07-codex-calendar-data-wake-up-replan.md). Saved records and the reloaded My day were checked.

- **9 November appointment correction:** existing appointment updated from the confirmed call and its call task completed. Health and Calendar readback verified. Live interview time and joining link reported in chat. [Session](sessions/2026-11-09-codex-calendar-data-appointment-update.md).

## How to see what's new

Open [Health appointments](http://127.0.0.1:47850/health?view=care) for the corrected appointment. The earlier [7 November My day](http://127.0.0.1:47850/today?date=2026-11-07) replan remains. Owning sections include Study, JobMap, Budget, Health and People/Waiting on you. The large catch-all capture stays retired.

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

Read back 9 November: core 276 entries, two existing entries updated and all others compared equal. PostgreSQL backup verified before guarded writes. Health and Calendar verified. Private evidence is in `.runtime/appointment-update-2026-11-09/`. Last verified 7 November: Autumn Study revision 112, JobMap 73, Budget 117. Earlier evidence remains in `.runtime/wake-up-replan-2026-11-07/` and `.runtime/calendar-corrections-2026-11-07/`. No migrations or direct database writes.

Last five sessions: [Appointment update](sessions/2026-11-09-codex-calendar-data-appointment-update.md), [Wake-up replan](sessions/2026-11-07-codex-calendar-data-wake-up-replan.md), [Schedule corrections](sessions/2026-11-07-codex-calendar-data-corrections.md), [Native integration](sessions/2026-11-06-codex-calendar-data-native-integration.md), [Stage 6](sessions/2026-11-04-claude-code-6-desk-build.md).
