# 2026-10-29 · Claude Code · Mail and admin · going live, and the Guide's gaps

## Goal
Xar ran "Gather my inboxes" and said OK to the first batch after seeing it on `lifeos_test`; then "add anything existing in the app that isn't present in the guide to the guide".

## What I did
- **First batch, by the brief's data safety section:** checked (`check-batch.mjs`: OK), imported into `lifeos_test` (file left in place), showed her counts and the eight titles (no mail text). After her OK: `migrate.js lifeos` (dump first), `scripts/mail-import.mjs lifeos <file>` (dump first; the file moved to `processed/`), `--live on`. No restart was needed: the running server reads the switch on every scan; `/api/mail/status` showed `live: true` and the batch.
- **Live build:** another session (Codex, Health gym plans) had uncommitted frontend edits, so I built the committed code from a clean worktree. Building straight into `dist` failed partway after emptying it; I put the backup back at once (`.runtime/mail-2026-10-29/dist-before/`, 912 files; Life OS answered throughout from the restored copy), built into the scratchpad, and copied the build over `dist`. The Calendar session also published a build with the Inbox at her choice (`2c79d84`). Checked live with saves blocked in the browser: Waiting on you 8 lines, Mail 213 rows (105 noise hidden), 1 digest, Today's panel 5, no page errors.
- **The Guide's gaps since the full check of 15 October** (session notes and commits since then): Health, JobMap, the Calendar and the Inbox already had their pages. Added: Cardiff Life's "University first: opportunities and deadlines" and "Updates & backup" (export and import of choices, what to check, weekly research), "Available option" on the calendar, a "How do I" for university opportunities, the envelope among the top bar's marks (the bell's mark now skips the envelope, which shares its class), "Waiting on you" in Today's intro, and what People shows from the Inbox. The Study hub's countdown change (Codex, 28 October) only fixed an existing countdown; nothing to add.
- Pictures retaken from live Life OS (looking only): `topbar.jpg`, `cardiff-university.jpg`, `cardiff-updates.jpg`; every mark placed.

## Files and commits
- `[guide-gaps] The Guide: Cardiff Life's opportunities and updates, the envelope, Today's and People's mail` (only my lines in `chapters.js` and `guide-shots.mjs`; the other session's uncommitted lines in the same files left unstaged), with STATUS and this note.

## How I checked it
- `node mail/check-batch.mjs` on the batch: OK, 318 messages, 8 actions, 4 sources.
- `lifeos_test` then `lifeos` imports: 318 new messages, 8 new actions, 0 urgent; repeat-safe by runId.
- Live pages walked as above. The Guide's chapters load (7 Cardiff steps, 43 questions); `guide-shots.mjs --only` for the three pictures: taken, no missing marks.

## Data touched
- `lifeos`: schema `mail` added (dump `Life_OS_backups/study-2026-10-29/before-migration-1793255288077.dump`); first batch imported (dump `Life_OS_backups/mail-2026-10-29/before-mail-batch-1793255300600.dump`): 318 messages, 8 open actions. `.runtime/mail-import.json` live on.
- `lifeos_test`: the same batch (dump in `Life_OS_backups/mail-2026-10-29/`).
- `code/life-os/frontend/dist`: replaced by a build of the committed code; the earlier one in `.runtime/mail-2026-10-29/dist-before/`.

## Problems and surprises
- **My slip, fixed:** the build that was live at 00:23 already carried Codex's uncommitted native Gym (Health → Gym). My clean build of the committed code (06:30) put the Inbox live but took the Gym pages off for a few hours. Fixed by building from the working folder (the Gym, the Inbox and the Guide's new pages together), with the 06:30 build kept in `.runtime/mail-2026-10-29/dist-0630/`; checked live: Health → Gym shows "Open workout", the Inbox and the Guide's Cardiff steps, no page errors. That build also carries whatever Codex had in progress at the time (exercise pictures). Lesson: compare the live build with the new one before replacing it.
- Building directly into the live `dist` fails while the server is using it, after Vite has emptied the folder. Build elsewhere and copy over (or stop Life OS first).
- The batch: Cardiff Outlook and Learning Central were only partly read (previews only for some digests; Learning Central's recent activity stayed empty). The digest says so; their windows did not advance.
- `mail/GATHER.md`, `mail/AGENT-PROMPTS.md` and a new `mail/CODEX-GATHER-PROMPT.txt` were changed by another session (uncommitted); left as they are.

## Small decisions I made, and questions for Xar
- The Guide's words for the new steps appear with the next build; the pictures are already in `guide-shots/`.
- Question still open: is Documents synced to OneDrive? Processed batches keep the gathered mail text.

## Next step
Xar reloads Life OS and opens the envelope by the bell. The next gather is picked up by itself. A review of the mail work (her review prompt) before she accepts the brief.
