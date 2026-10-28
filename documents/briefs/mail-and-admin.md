# Mail and admin: what's in her inboxes, and who she owes

**Status:** written 28 October 2026 by Claude in Cowork from Xar's answers that day · approved by Xar on 28 October 2026 (to be built by Claude Code on Windows) · built 28 October 2026; waiting for Xar to put it live and accept it
**Branch:** keep building on the branch STATUS.md names (today `stage/4b-one-look`, as Health did). If stage 4b has been accepted and merged by then, cut `stage/mail-inbox` from `main`.
**Checkpoint commits:** `[mail-cp<n>] <summary>`

## Her words
> "I need to admin my day better by keeping the track of who I should email, what are in my email inboxes, what are the announcements in the Learning Central, who I should text, who I should reply to … who I should, like, congratulate their birthday and stuff … I still feel like I didn't wrap my head good around my emails and stuff. And I cannot do adding admin tasks daily."

Asked what shape she wants, she chose to read her mail inside Life OS, "but with things in notification and inbox digest and summaries and priorities". Sources: "Cardiff Outlook, Gmail, Learning Central directly, EVERYTHING you have access to. you can make a scheduled task for gathering them but leave the running to me (i run it whenever i want instead of it being scheduled)". Then: write the brief now.

## Goal
At the end, Life OS has an **Inbox** part. She runs "Gather my inboxes" when she wants; an agent reads Cardiff Outlook, Gmail, Learning Central and Teams, never changes them, and leaves a batch in `mail/inbox/`. Life OS imports it and shows: **Waiting on you** (who she owes a reply, an email, a text, a call or birthday wishes, and what she must read, do or decide, each with why, since when and a suggested priority), **Mail** (every gathered message, readable in the app, with its summary and priority, filtered and searchable, one click from the original), and **Digests** (each run's summary and what could not be read). The most pressing lines reach Today, the bell, Windows notices, the calendar and each person's page. She never has to type an email in; texts and calls are one short line, birthdays come by themselves.

## What already exists (checked 28 October)
- Today's add line saves a plan or note for any day under any area, including **Life admin** (`code/life-os/frontend/src/lib/day.js`, `parsePlan`). By hand only.
- **People** (`code/life-os/backend/src/routes/people.js`, core SQLite): name, birthday, relation, contact (free text), notes. Birthdays are on the calendar and in the bell. Nothing about who is waiting on her.
- The **bell** and Windows notices (`hosting/notices/service.mjs`, `desktop.mjs`) gather lines from every part.
- Agents already read her mail through narrow lenses: Codex's daily 09:00 Cardiff Outlook search for university opportunities (Cardiff Life), and the job searches' email pass (JobMap). Nothing looks for what she owes.
- Learning Central: due dates can come in through its calendar link (`documents/CONNECTIONS_SETUP.md`); announcements are covered nowhere. The Learning Central in-app browser stays a late idea.
- The plans already had a slot: the **Inbox** lens, "things awaiting a decision (that email to answer)" (`Life_OS_Taxonomy.md`, `Life_OS_Plans_Inventory.md`), marked Later.
- **Written today, outside app code**, in `mail/`: `GATHER.md` (the instructions every gathering run follows), `mail-batch.schema.json` (the batch format, version 1), `check-batch.mjs` (its checker, no packages) with `check-batch.test.mjs` (17 tests, passing), `example-batch.json` (made-up data), `sources.json` (her four sources; personal, not in git) and `sources.example.json`. `.gitignore` keeps `mail/inbox/*`, `mail/digests/`, `sources.json` and the gather log and state out of git. And a Claude scheduled task, **Gather my inboxes**, with no schedule: she runs it.

## Read first
`AGENTS.md`; `documents/STATUS.md`; `mail/README.md`, `mail/GATHER.md`, `mail/mail-batch.schema.json`, `mail/example-batch.json`; `documents/Life_OS_Architecture.md` §3, §4, §6, §10; the Health brief (`briefs/health-part.md`) as the model of a new part; `jobmap/lib/inbox.mjs` as the model of a file inbox (settling time, poll, processed and failed, the import log); `hosting/notices/service.mjs`; `hosting/calendar/`; `code/life-os/backend/src/migrate.js` and `migrations/study/`; `components/PeopleView.jsx`, `NoticeBell.jsx`, `CourtLayout.jsx`, `TodayView.jsx`, `DayParts.jsx`; JobMap's "Write it with Claude" in `jobmap/app/page.tsx`.

## In scope
- A PostgreSQL schema `mail` with numbered migrations, and `migrate.js` taught to run more than one schema.
- The importer for `mail/inbox/`, with preview counts, the import log, undo of the latest batch, and field ownership.
- The Inbox part at `/inbox`: Waiting on you · Mail · Digests.
- Hand-added actions (text, call, email, reply) from the Inbox and from Today's add line; birthday wishes made from People.
- Today's panel, the bell, a Windows notice for urgent things, calendar items for actions with a day, and each person's page.
- Write it with Claude for a reply, as JobMap does it.
- The Guide's chapter, with pictures taken from the example batch only.

## Not in scope
- Sending, replying, drafting, deleting, archiving or filing anything in a real mailbox. Life OS and the gathering run only read. (Drafts are an open question below.)
- Life OS signing in to Gmail or Microsoft itself (OAuth, IMAP). Reading is as fresh as the last gathering run. A live connection would be its own brief.
- WhatsApp and phone texts: no safe route to read them; a text she owes is one line by hand.
- Moving Cardiff Life's or JobMap's email passes into this one (open question 5).
- Changing `mail/GATHER.md`'s rules without her. The builder may fix a mistake in the format or checker, with a test, and says so in the session note.

## The data (schema `mail`)
Conventions from the Architecture §3: uuid ids, `timestamptz` in UTC shown in Europe/London, `text` + `CHECK` for small lists, `revision`, `created_at`, `updated_at`, `deleted_at` on everything she can change.

- `mail.batches`: `run_id` (unique), file name, `gathered_at`, agent, imported at, status (`applied`, `undone`), counts (new, updated, unchanged for messages and actions), the batch's `sources` and `digest` as `jsonb`, the backup file.
- `mail.sources`: the source `id` from the batch (text key), label, kind, last status, coverage and window, last batch. Source fields only.
- `mail.messages`: unique on (`source_id`, `source_message_id`). **Source fields:** thread, kind, received at, from name and address, to and cc (`jsonb`), subject, course, folder, unread and replied at the source, attachments (`jsonb`), link, text, text complete, summary, category, priority, priority reason, deadline, first and last batch. **Her fields:** `her_priority`, `seen_at` (opened in Life OS), `hidden_at`, `pinned`.
- `mail.actions`: origin (`gathered`, `hers`, `birthday`), `dedupe_key` (unique), kind (`reply`, `email`, `text`, `call`, `read`, `do`, `decide`, `congratulate`), area (`admin`, or `relationships` for `text`, `call` and `congratulate`), person name, person address, `person_id` (a core `people.id`, kept as text: people live in the core's SQLite for now, so there is no foreign key), message ids, since, due. **Source fields:** title, why, priority, due, message ids, `resolved_at_source`, `resolved_note`. **Her fields:** status (`open`, `done`, `snoozed`, `not-needed`), `snoozed_until`, `done_at`, `done_by` (`her` or `source`), `her_priority`, `her_title`, `her_note`, `reopened` (true once she reopens something a batch closed).
- `mail.history`: table, record id, batch id (or null for her own change), before and after (`jsonb`), at. Every change goes through it; undo uses it.
- The effective priority everywhere is `her_priority ?? priority`; the effective title `her_title ?? title`.

## How a batch is applied
1. **Receive.** Life OS looks at `mail/inbox/` on start, every 60 seconds while it runs, and when she presses "Look now". It ignores `*.part` files and anything changed in the last 5 seconds (as JobMap's inbox does).
2. **Check** with `checkBatch` from `mail/check-batch.mjs` (import it; do not copy it). A failure moves the file to `mail/inbox/failed/` with `<file>.error.txt` beside it, listing every problem in plain words. A `run_id` already applied is moved to `processed/` and logged as a repeat.
3. **Back up**: a `pg_dump` of `lifeos` before the first write of each batch (`postgresBackup`, generalised from its `study-` folder name; label `mail`).
4. **Apply in one transaction**, recording history:
   - Sources: upsert.
   - Messages, matched on (source, sourceId): new ones inserted; existing ones get the source fields only. Her fields are never written by an import.
   - Actions, matched on `dedupeKey`: new ones inserted as `open` (or as `done` with `done_by = 'source'` if they arrive already resolved); existing ones get the source fields only. If `resolvedAtSource` is true and the action is `open` and not `reopened`, it becomes `done` with `done_by = 'source'` and the note shown ("Done: you replied on 27 October"). An action missing from a later batch is left as it is: a batch is not a full mirror.
   - People: an action's person is matched to a core person when the address appears in that person's `contact` (ignoring case), otherwise when exactly one person has that name (ignoring case). Life OS never creates a person from mail.
5. **Log** the batch (counts, sources' status) to `mail.batches` and a line in `mail/import-log.md` (gitignored). Move the file to `processed/`. The server log carries counts only, never subjects, names or text.
6. **Undo** (latest applied batch only): put back every record it changed as it was before, remove what it added (soft delete), mark the batch `undone`. Refused, with the reason, if she has changed one of those records since; the page says which.

## Checkpoints

### CP1: the store and the importer
- [x] `migrate.js` runs each folder under `src/migrations/` (study, then mail) with that schema's own `schema_migrations`; Study's behaviour and checks are unchanged (its tests pass).
- [x] `migrations/mail/0001_mail.sql`: the tables above, grants for the app role, indexes (received at, source, category, effective priority, status and due).
- [x] `code/life-os/backend/src/modules/mail/`: repository (revision checks, 409 on a stale save, history), importer (the six steps above), router under `/api/mail` (`GET /status` with the last batch, what is waiting and failed; `POST /scan`; `GET /batches`; `POST /batches/:id/undo`).
- [x] `hosting/mail/inbox.mjs`: the folder watcher, started with Life OS and stopped with it.
- [x] Keep `mail/check-batch.test.mjs` passing and run it with the other tests.
- **Done when:** on `lifeos_test`, `example-batch.json` dropped in `mail/inbox/` is applied (7 messages, 4 open actions and 1 already done); dropping it again changes nothing; a copy with one priority changed updates that one record; a broken copy lands in `failed/` with a readable note; undo puts everything back.
- **Verify:** the new tests; Study's tests; `node code/life-os/backend/src/migrate.js lifeos_test --check` then a real run on `lifeos_test`; the counts above read back through `/api/mail`.
- **Commit:** `[mail-cp1] Mail schema, importer and the inbox folder`
- **Done 28 October (Claude Code).** Added for the data safety section: on `lifeos`, Life OS leaves `mail/inbox/` alone until `.runtime/mail-import.json` says `{"live": true}`; `scripts/mail-import.mjs` tries a batch on `lifeos_test` (the file stays put), imports it into `lifeos` only once that run is on `lifeos_test`, and switches live import on. The `mail` schema is not yet on `lifeos` (run `migrate.js lifeos` before the first real import). Run the tests with `LIFE_OS_MAIL_TEST_DB=lifeos_test node --test code/life-os/backend/src/modules/mail/integration.test.js mail/check-batch.test.mjs`.

### CP2: Waiting on you
- [x] `/inbox` (the part's first page), in the Life OS look. Open actions grouped **Today** (due today or earlier, and urgent), **This week**, **Whenever**; then **Done lately** (folded). Each line: what kind (a small mark, not only colour), the title, the person, why, since when, due, the effective priority.
- [x] On each line: **Done**, **Tomorrow**, **Next week**, **Not needed**, **Open the email** (the message's link, new tab), change priority, a note. Undo for a few seconds after each.
- [x] An add line on this page: "text Sam about Saturday", "call the GP surgery", "email the school office", "reply to Jo". The first word sets the kind; a name matched to People sets the person (and if two match, she picks). Saved as origin `hers`.
- [x] Today's add line: a plan without a clock time that starts with text, call, email, message or reply (to) is saved as one of these, and the hint says so before Enter. With a clock time it stays a plan, as now.
- [x] **Birthdays:** on a person's birthday, "Wish <name> a happy birthday" (kind `congratulate`) is in Waiting on you, worked out from People, not imported. A row is stored only when she acts on it, keyed by person and year, so ticking it once is enough.
- [x] **People:** each person's card shows what is open with them, and the last few messages from them, each leading to the Inbox; "Owe them a text" adds one.
- **Done when:** with the example batch on the try-out, the four open actions sit in the right groups; Done, Tomorrow and Not needed survive a reload; a hand-added "text Sam" appears under Sam in People; a test person whose birthday is today shows the wish.
- **Verify:** tests for the add-line words, the grouping, the birthday item and the person matching; the page walked on the try-out with every save caught; looked at in Modern light and dark, Madder, Indigo and Paper, and at 400 pixels.
- **Commit:** `[mail-cp2] Waiting on you: gathered, hers and birthdays`

### CP3: reading mail
- [x] `/inbox/mail`. Source chips (All and each source, with its colour) and filters: **Needs you**, **Deadlines**, **Announcements**, **Conversations**, **Everything else** (fyi, newsletters, automated; noise only with "Show noise"); **Unread at source**; **Show hidden**. A search over subject, sender, summary and text (PostgreSQL full text with the `simple` configuration so Persian works, plus `ILIKE` for short words).
- [x] The list, by day: priority mark, sender, subject, the summary on one line, time, source.
- [x] The reader: subject; from, to, cc; when; source and course; the summary in its own box with the priority and why (she can change the priority); the text as **plain text only** (never HTML; `white-space: pre-wrap`; `dir="auto"` so Persian reads right to left); only `https://` links clickable, opening in a new tab with `rel="noopener noreferrer"`; attachment names; **Open in Outlook / Gmail / Learning Central / Teams**; **I need to reply** (a hand action tied to this message); **Hide**. Opening a message sets `seen_at`.
- [x] At phone width the list and the reader are two views with Back.
- **Done when:** every example message reads well in all four styles; a long text, a Persian text and a message with no text (a newsletter) all look right; search finds a word in a body; Hide and Show hidden work.
- **Verify:** tests for the filters and search query; a rendering test that a body holding `<script>` or HTML shows as text; looked at as in CP2.
- **Commit:** `[mail-cp3] Read gathered mail in Life OS`

### CP4: digests, Today, the bell and the calendar
- [x] `/inbox/digests`: each batch newest first: when, the headline, what needs her, deadlines, each source's lines and its status (read, partly read, not reachable, and why), counts, and Undo on the latest. At the top: "Last gathered <when>" and **How to gather** (CP5's Guide page).
- [x] Today: a **Waiting on you** panel: the five most pressing open actions with Done and Tomorrow, the latest headline, "last gathered", and a link to the Inbox. If nothing has been gathered for three days, one quiet line says so (not in the bell: she runs it when she wants).
- [x] The bell (a `mail` provider in `hosting/notices/service.mjs`): **today**: urgent actions and actions due today; **late**: actions past their day, and replies waiting three days or more; **ahead**: due tomorrow; once per batch, "<n> new announcements" when Learning Central or the school sent any. Birthdays already in the bell lead to the wish.
- [x] A Windows notice (through `desktop.mjs`) when an applied batch brings urgent actions: "2 urgent things in your mail". Off with the bell's existing switch.
- [x] The calendar: open actions with a due day are items (kind `deadline` when the mail gave the date, `reminder` for her own), area `admin` or `relationships`, done ones shown done, each leading to the action.
- [x] The top bar: an envelope beside the bell, with the count of open urgent and high actions, leading to `/inbox`. No new word in the top bar. Measure the top bar at the eight widths in the four styles, as Health did.
- **Done when:** the example batch gives a digest page, Today's panel, the right bell lines, three calendar items (29 and 30 October and 2 November in the example) and the envelope's count.
- **Verify:** tests for the notices and calendar items; looked at as in CP2.
- **Commit:** `[mail-cp4] Digests, Today, the bell, the calendar and the envelope`

### CP5: Write it with Claude, how to gather, and the Guide
- [x] **Write it with Claude** on a reply or email action and in the reader, as in JobMap: a prompt from the message (the text, who it is from, her note) with the rule to keep to what the message says and to leave the sending to her; it is copied and claude.ai opens; "Nothing is sent until you send it". Her name for signing comes from settings, never from code.
- [x] **How to gather**, a Guide page: in the Claude app, open the scheduled task "Gather my inboxes" and run it; or copy the one-line prompt for Codex or any AI ("Gather my inboxes: follow mail/GATHER.md in the Life_OS folder"), with a Copy button on the Digests page; what each source needs once (connectors in Claude's settings, being signed in to the built-in browser).
- [x] The Guide's chapter for the Inbox (the three pages, the add line, birthdays, Today's panel, the bell, the envelope) and its "How do I" answers. **Pictures only from the example batch on the try-out**, never from her real mail.
- **Done when:** a prompt copies and claude.ai opens; the Guide shows the chapter with its pictures.
- **Commit:** `[mail-cp5] Write it with Claude, how to gather, and the Guide`
- **CP2 to CP5 done 28 October (Claude Code), at Xar's request "do the whole thing all at once".** Built in one go on `stage/mail-inbox` (a worktree, because another session had uncommitted edits in the same files), one commit `[mail-cp2-cp5]`, merged into `stage/4b-one-look`. Walked on a private try-out (example batch, test database, an empty core database): every "Done when" above checked. Kept from the plan: the envelope beside the bell (open question 3). Added: `mail/AGENT-PROMPTS.md` (the prompts for her agents). Not done here: `migrate.js lifeos`, the live build and the restart. The session's permission check blocked them, so they wait for Xar (STATUS.md). The render test runs bundled: see the session note.

## Data safety
- Nothing existing changes: a new schema, and the core's `people` only read (CP2's "Owe them a text" writes to `mail.actions`, not to `people`).
- `migrate.js` takes its dump before the migration; each batch takes one before it writes; undo is tested before the first real batch.
- The first real batch goes into `lifeos_test` first; she looks at it; then the same file into `lifeos`. Record its counts in the session note.
- Mail text is personal: it stays in PostgreSQL (outside synced folders) and in the gitignored `mail/inbox/`. No subjects, names or text in logs, tests, the Guide or session notes. Tests and pictures use `example-batch.json` only.
- Do not run `hosting/app.test.mjs` or the old query tests (they reseed the core database; STATUS.md).

## Tests
`node --test` for: the checker (`mail/check-batch.test.mjs`, already written: 14 refused variants, the example and an empty batch accepted, a note for a newsletter with text); the importer (new, unchanged, updated; her fields kept; a source-resolved action closed; a reopened one left open; a repeat `run_id`; a failed file with its note; `.part` ignored; undo, and undo refused after her change); person matching; the add-line words; the birthday item; the notices and calendar items; the reader showing HTML as text. All against `lifeos_test`.

## Acceptance checklist for Xar
1. Make sure you are signed in to Cardiff Outlook and Learning Central in Claude's built-in browser, and connect Gmail in Claude's settings (Connectors). Then run **Gather my inboxes** from your scheduled tasks.
2. Read the digest it ends with. It should name every source and say plainly which it could not read.
3. Open Life OS → the envelope by the bell. **Waiting on you** lists who you owe and why, most pressing first.
4. Tick one Done, move one to Tomorrow, mark one Not needed. Reload: they stay.
5. Type "text <a friend's name> about the weekend". It appears under them in People.
6. Open **Mail**, pick Learning Central, read an announcement. Open one email in Outlook from its button.
7. Search for a word you know is in an email.
8. Look at Today's panel, the bell, and the calendar for anything with a day.
9. Run the gather again a day later. What you replied to in the meantime should show as done by itself; nothing you ticked should come back.
10. Open **Digests**: both runs are there.

## Risks and open questions
1. **Is Documents synced to OneDrive?** If it is, gathered batches in `Life_OS\mail\inbox\processed\` would sync with their mail text. Then either move the mail inbox outside Documents or have the importer strip `text` from a processed file after it is applied. (Her call; until answered, keep as written.)
2. **How long to keep message text.** Proposal: keep everything for now (it is small); a setting later.
3. **The envelope** beside the bell, rather than a word in the top bar (the top bar has 13 entries and no room). Proposal, her call.
4. **Drafts.** Gmail's connector can save a draft without sending it. A "draft my replies" option would let the gathering run leave drafts in Gmail for her to send. That breaks GATHER.md's "never draft" rule, so only if she says so.
5. **One gathering for everything.** Later, one run could also feed Cardiff Life's university opportunities and JobMap's application emails, replacing their separate mail passes. Proposal for later.
6. **Reaching the sources.** Cardiff's Microsoft 365 connector needs its IT's consent (unknown), so Outlook, Learning Central and Teams will usually go through the browser, which is slower and can stop (as Codex's did on 12 October). Each run says what it could not read; nothing pretends.
7. **Read state.** Opening an unread message in a browser can mark it read; GATHER.md has the run mark exactly those unread again. Worth checking after the first run.
8. **Order.** Test 2 is 6 November and the group project is due 13 November; Study comes first. CP1 and CP2 give her the list she asked for; CP3 to CP5 can follow.
