# Mail

How Life OS gets Xar's mail, announcements and "who do I owe a reply" without her typing any of it.

- **GATHER.md**: the instructions an agent follows when she asks it to gather her inboxes. The Claude scheduled task "Gather my inboxes" points here; Codex or any other AI can be given the same file.
- **mail-batch.schema.json**: the format of what a run leaves for Life OS (version 1).
- **check-batch.mjs**: checks a batch against that format. `node mail/check-batch.mjs <file>`. Its tests: `node --test mail/check-batch.test.mjs`.
- **example-batch.json**: made-up example data, for tests and the Guide's pictures. Not real mail.
- **sources.json**: her mailboxes and how to reach them (personal, not in git). **sources.example.json** is the shareable version.
- **inbox/**: batches waiting for Life OS. **digests/**: each run's digest as a page. **gather-log.md**, **gather-state.json**: the agent's own record of what it has read. All personal, none in git.

The Mail part of Life OS that reads these batches is planned in `documents/briefs/mail-and-admin.md`.
Rules that never bend: a run only reads; it never sends, deletes, moves or files mail, and never writes to Life OS's database.
