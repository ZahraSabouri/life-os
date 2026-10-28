# Prompts for your agents: gathering your mail into Life OS

Your agents gather; Life OS reads what they leave. Every run follows `mail/GATHER.md`: it **reads** Cardiff Outlook, Gmail, Learning Central and Teams, **changes nothing** in them, and leaves one batch file in `mail/inbox/`. Life OS takes it in within a minute and shows it in the Inbox (the envelope beside the bell).

## Once, before the first run

1. In the Claude app: **Settings → Connectors → Gmail → Connect**.
2. In Claude's own browser, sign in to **Cardiff Outlook** (outlook.office.com), **Learning Central**, and **Teams** if you want chats read. Tick "stay signed in".
3. Run it once (below), then give an agent this, so the first batch is checked on the test database before your real one:

   > I ran "Gather my inboxes" and a batch is waiting in mail/inbox/. Following the data safety section of briefs/mail-and-admin.md: import it into lifeos_test first (`node scripts/mail-import.mjs lifeos_test mail/inbox/<file>`), then show me the counts and a few example lines. Keep any mail text out of your notes and messages. Wait for my OK. Then back up and import the same file into my real database (`node scripts/mail-import.mjs lifeos mail/inbox/<file>`), switch live import on (`node scripts/mail-import.mjs lifeos --live on`), restart Life OS, and record the counts in your session note.

After that, every batch is taken in by itself.

## Claude app (the task is already made)

The scheduled task **Gather my inboxes** exists, with no schedule. To run it: open **Scheduled tasks**, choose it, press **Run now**.

To have it run by itself, open it, choose a schedule, and leave the prompt as it is. Suggested: **weekdays at 08:30**, and **Sunday at 18:00** before the weekly reset. The computer must be on and the Claude app open.

If you ever need to make the task again, use this prompt, with the Life_OS folder attached and "needs this computer" on:

```
Gather my inboxes: follow mail/GATHER.md in the Life_OS folder exactly. Read only: never send, reply, draft, delete, move, file or mark anything, except marking unread again what you opened that was unread. Leave the batch in mail/inbox/ (write <runId>.json.part, check it with node mail/check-batch.mjs, then rename it to .json), the digest in mail/digests/, and end with the digest in under 15 lines. Never copy codes, sign-in links or account numbers.
```

## Codex (or Claude Code)

Open Codex (or Claude Code) in the `Life_OS` folder and give it:

```
Gather my inboxes: follow mail/GATHER.md in the Life_OS folder exactly. Read only. Use the sources in mail/sources.json; for Outlook, Learning Central and Teams use a browser where I am signed in. Check the batch with node mail/check-batch.mjs before renaming it from .part to .json. Do not touch Life OS's database or any other folder. End with the digest.
```

To schedule it in Codex, make an automation with that prompt in the `Life_OS` folder (for example weekdays at 08:30).

## What to expect

- Each run ends with a short digest and says plainly which source it could not read. Nothing pretends.
- In Life OS: **Inbox → Waiting on you** (who you owe), **Mail** (every message, read in the app), **Digests** (each run, with Undo on the latest). Today shows the five most pressing; the bell and the calendar show what has a day.
- What you tick Done, move or mark Not needed stays that way; a later run never brings it back. What you replied to in the meantime closes by itself.
- If a batch is refused, it is in `mail/inbox/failed/` with a note beside it saying what to fix.
