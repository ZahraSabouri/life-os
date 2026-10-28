# 2026-10-28 · Claude in Cowork · Mail and admin · planning

## Goal
Xar: "I need to admin my day better" (who to email, what is in her inboxes, Learning Central announcements, who to text, reply to, congratulate) and "I cannot do adding admin tasks daily". Explain what Life OS already has, then, from her answers, plan the part and set up the gathering.

## What I did
- Checked what exists (documents and code): Today's add line and the Life admin area, People with birthdays, the bell, the agents that already read her mail for Cardiff Life and JobMap, the Learning Central calendar link, and the Inbox lens planned as Later. Nothing tracks who she owes.
- Proposed a self-filling list of what she owes instead of an email section. Her answers: read mail inside Life OS, "but with things in notification and inbox digest and summaries and priorities"; sources Cardiff Outlook, Gmail, Learning Central directly and "EVERYTHING you have access to"; a scheduled task she runs herself, never on a timer; write the brief now.
- Wrote `mail/` (outside app code): `GATHER.md` (the authority for every gathering run), `mail-batch.schema.json` (version 1), `check-batch.mjs` and `check-batch.test.mjs`, `example-batch.json` (made-up), `sources.json` (hers, gitignored) and `sources.example.json`, `README.md`, `inbox/README.txt`.
- `.gitignore`: `mail/inbox/*` (except its README), `mail/digests/`, `mail/sources.json`, `mail/gather-log.md`, `mail/gather-state.json`, `mail/import-log.md`.
- Wrote `briefs/mail-and-admin.md`: schema `mail`, the importer, Waiting on you, reading mail, digests with Today, the bell, the calendar and an envelope by the bell, Write it with Claude and the Guide. Five checkpoints.
- Created the Claude scheduled task **Gather my inboxes** (`trig_01TUqLKocirb1zh7edWUMv9z`): no schedule, needs this computer, the Life_OS folder attached, approvals automatic, a phone notice when a run ends. It follows `mail/GATHER.md`. A first copy made without the folder attached was deleted before it ever ran.
- Updated DECISIONS, TODO (section W), the Plans Inventory and STATUS.

## Files and commits
- No commits (Cowork does not run git in the shared folder). New: everything under `mail/`, `briefs/mail-and-admin.md`, this note. Changed: `.gitignore`, `DECISIONS.md`, `TODO.md`, `Life_OS_Plans_Inventory.md`, `STATUS.md`. The next Windows session should commit them; `mail/sources.json` must stay out (it is ignored).

## How I checked it
- `mail-batch.schema.json` parses; `node mail/check-batch.mjs mail/example-batch.json` prints OK (7 messages, 5 actions, 4 sources).
- `node --test mail/check-batch.test.mjs`: 17 pass, 0 fail. The 14 refused cases: a missing digest, an unknown priority, a ref used twice, an undeclared source, an action pointing to a missing message, a security code in a text, a day that does not exist, an unknown field, a text over 20,000 characters, a non-https link, a read source without a window, a dedupeKey used twice, the same message twice, a malformed runId. Also: an empty batch accepted; a newsletter keeping its text noted but accepted.
- The brief's example counts read against `example-batch.json` (4 open actions, 1 already resolved; 3 due days).
- The gathering task has not been run: Xar runs it.

## Data touched
None. No app code, database or data file changed.

## Problems and surprises
- Gmail's connector is installed for Claude but not connected; Microsoft 365 is not installed and needs Cardiff's IT consent. So Outlook, Learning Central and Teams go through the built-in browser where she is signed in, until that changes.
- The Claude scheduled task "Cardiff job search" (daily 11:00) still tells its runs to deliver to both JobMap copies, which her 27 October decision ended. Not changed: told her.

## Small decisions I made, and questions for Xar
- The part is called Inbox, with Waiting on you · Mail · Digests; it gets an envelope beside the bell, not a word in the full top bar (her call; in the brief).
- Opening an unread message in a browser can mark it read; GATHER.md has the run mark exactly those unread again, the only change it may make.
- A run never copies codes, sign-in links or account numbers; the checker refuses a batch that looks like it holds a code.
- Questions in the brief: is Documents synced to OneDrive; how long to keep message text; drafts in Gmail or never; one gathering run for Cardiff Life and JobMap too, later.

## Next step
Later in the session Xar asked why the app was not built first; told her Cowork cannot reach PostgreSQL or the app on Windows. She approved the brief, to be built by Claude Code on Windows, and kept the gathering task ready. In Claude Code: "Continue Life OS: read STATUS.md, then do CP1 of briefs/mail-and-admin.md." Study work stays first this week.
