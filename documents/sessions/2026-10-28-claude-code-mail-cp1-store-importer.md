# 2026-10-28 · Claude Code · Mail and admin · CP1, the store and the importer

## Goal
Commit Claude in Cowork's mail plan on its own, then CP1 of `briefs/mail-and-admin.md` only, tested on `lifeos_test`, with the live importer unable to take a real batch before Xar has seen it there.

## What I did
- Checked git ignores `mail/sources.json` and `mail/inbox/*` (its README kept). Committed Cowork's files on their own: everything in `mail/`, `.gitignore`, the brief, the mail-planning note, and STATUS, DECISIONS, TODO and the Plans Inventory. The university-materials refresh note (also Cowork, also uncommitted) went in too, because STATUS's diff already carried its lines.
- `migrate.js`: runs Study, then every other folder under `src/migrations/`, each recorded in its own `<schema>.schema_migrations`; a new schema gets that table in the same transaction as its first file. One dump before anything runs. `postgresBackup` takes a folder name (`study-<day>` by default, `mail-<day>` for mail).
- `migrations/mail/0001_mail.sql`: batches, sources, messages, actions, history, as in the brief; unique keys only among records not removed (so a batch can bring back something an undo removed); indexes on received at, category, effective priority, status and due, and person; the app role cannot change history.
- `modules/mail/`: `repository.js` (every write recorded in history with the revision; her fields only through `patchHers`, 409 on a stale revision, 400 for a source field; reopening something a batch closed sets `reopened`), `importer.js` (the brief's six steps; `checkBatch` imported from `mail/check-batch.mjs`; person matching by address in contact, else a name only one person has; undo of the latest batch, refused with the list when she has changed any of it), `router.js` (`GET /status`, `POST /scan`, `GET /batches`, `POST /batches/:id/undo`).
- `hosting/mail/inbox.mjs`: the watcher (on start, every 60 s, on scan; `*.part` and files younger than 5 s skipped; processed/ and failed/ with `<file>.error.txt` listing every problem; a database outage leaves the file waiting). Started in `hosting/app.mjs`, closed in `server.mjs`. The server log and `mail/import-log.md` carry counts only.
- **Data safety:** on `lifeos`, the watcher leaves `mail/inbox/` alone until `.runtime/mail-import.json` says `{"live": true}`. A try-out reads only a folder it is given, never the real inbox. `scripts/mail-import.mjs lifeos_test <file>` tries a batch (the file stays put); `… lifeos <file>` refuses unless that `runId` is applied on `lifeos_test`, backs up, imports and moves the file to processed/; `… lifeos --live on` then lets Life OS import by itself. People are read from the core database read-only.

## Files and commits
- `0b2b16e` [mail-plan] Mail and admin: gathering instructions, format, checker and brief
- [mail-cp1] Mail schema, importer and the inbox folder (this session's code, brief tick, TODO, STATUS and this note)

## How I checked it
- `node --test mail/check-batch.test.mjs`: 17 pass.
- `LIFE_OS_MAIL_TEST_DB=lifeos_test node --test code/life-os/backend/src/modules/mail/integration.test.js`: 8 pass: person matching; the example applied (7 messages new, 5 actions new: 4 open, 1 done by the source, one backup); the same run again is a repeat with no backup; one priority changed updates one message only; a broken copy and a non-JSON file go to failed/ with notes, a `.part` file is left; her priority and note survive an import that changes the source priority; a source-resolved action closes; a reopened one stays open; a stale save is 409; undo refused after her change, refused for an older batch, and a batch that added 16 records is fully removed.
- Through `/api/mail` on `lifeos_test` with the real `mail/example-batch.json` in a temporary folder: scan gave 7 messages and 5 actions new; status showed the batch and the counts; dropping it again was a repeat; undo put back 16 records and marked the batch undone.
- `node scripts/mail-import.mjs lifeos mail/example-batch.json`: refused ("try this batch on lifeos_test first"), exit 1.
- Study: unit tests 27 pass (1 opt-in skipped); `LIFE_OS_STUDY_TEST_DB=lifeos_test` integration 9 pass. `migrate.js lifeos_test --check`: nothing to run; `migrate.js lifeos --check`: only `mail/0001_mail.sql` waiting.
- `hosting/app.mjs` loads. Not run: `hosting/app.test.mjs` (it reseeds the core database).

## Data touched
- `lifeos_test` only: `mail/0001_mail.sql` applied after a dump (`Life_OS_backups/study-2026-10-28/before-migration-1793210973681.dump`; the migration's dump keeps the Study folder name). Test records left there (soft-deleted where undone); the example's runId is marked undone. Study integration took its own `lifeos_test` dump and removed its fixtures.
- `lifeos`: not touched (only `--check`). No mail read; no real batch exists.

## Problems and surprises
- `code/life-os` holds a broken nested `.git` (git commands from inside it fail); git runs from the root. Already on her list.
- Another session changed `PlannerView.jsx`, `TodayView.jsx`, `main.jsx`, `calendar.test.mjs` and added calendar files while this one ran, on top of the earlier uncommitted Today and calendar edits. Left alone. I did not restart Life OS: that would make that session's `hosting/day` and `hosting/calendar` edits live.

## Small decisions I made, and questions for Xar
- A batch's run already seen, even if undone, counts as a repeat (an undone batch is gathered again with a new run).
- A source record is updated every batch (its status and last batch change); messages and actions only when a source field differs.
- An import fills a missing `person_id` but never replaces one.
- Undo is limited to the newest batch of all, not the newest still applied.

## Next step
Review CP1 (the review prompt). Before the first real batch: `node code/life-os/backend/src/migrate.js lifeos` (it dumps first), then restart Life OS once the other session's calendar work is committed. Then CP2, Waiting on you.
