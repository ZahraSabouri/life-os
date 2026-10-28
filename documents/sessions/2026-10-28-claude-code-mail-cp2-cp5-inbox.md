# 2026-10-28 · Claude Code · Mail and admin · CP2 to CP5, the Inbox

## Goal
Xar: "go on and do the whole thing all at once and finish it and give me instructions for my agents". CP2 to CP5 of `briefs/mail-and-admin.md`, and the prompts her agents use to gather.

## What I did
- Built on `stage/mail-inbox` in a git worktree (`..\Life_OS-mail`), cut from `stage/4b-one-look`, because the Calendar session had uncommitted edits in Today, Calendar, the Guide and `main.jsx`. Once that session committed, merged into `stage/4b-one-look` with no conflicts.
- **Shared** (`code/life-os/shared/mail.js`): the add-line words (`parseOwe`), People name matching, the Waiting on you groups, birthday wishes, https-only text pieces, the Write it with Claude prompt.
- **Server:** `modules/mail/reads.js` (actions, messages with filters and search, a person, digests, calendar and bell rows); repository: hand-added actions, birthday rows when she acts, seen; router: `/actions`, `/summary`, `/birthdays`, `/messages`, `/people`, `/digests`. `hosting/mail/notices.mjs`: the bell lines and the calendar items, plugged into the notices and calendar services; a birthday today in the bell now leads to the wish; `desktop.mjs` `tell()` for "2 urgent things in your mail" (off with the bell's switch).
- **Pages:** `components/inbox/` (InboxView, InboxWaiting, InboxMail with the reader, InboxDigests with How to gather and the signing name, InboxPanel for Today, MailEnvelope by the bell), `lib/useMail.js`, `styles/inbox.css`. Route `/inbox` and `/inbox/:view`; Today's panel; Today's add line ("text Sam about Saturday" without a clock time goes to the Inbox); People shows what is open with each person and their last messages, and "Owe them a text".
- **Guide:** an Inbox chapter (four steps with pictures), three "How do I" answers, a row in "Where to add what". `scripts/guide-shots.mjs` takes the Inbox pictures only from a try-out: against the live port it refuses, so her mail never ends up in a picture. The four pictures (example batch) are in `guide-shots/`.
- **For her agents:** `mail/AGENT-PROMPTS.md`: the one-time setup, the Claude task (run now, or give it a schedule), the Codex/Claude Code prompt, the first-batch prompt, and what to expect.

## Files and commits
- `94a0fdc` [mail-cp2-cp5] Waiting on you, reading mail, digests with Today, the bell, the calendar and the envelope, Write it with Claude, and the Guide
- The merge of `stage/mail-inbox` into `stage/4b-one-look`, and a records commit (brief, TODO, Plans Inventory, STATUS, this note).

## How I checked it
- After the merge: `LIFE_OS_MAIL_TEST_DB=lifeos_test LIFE_OS_STUDY_TEST_DB=lifeos_test node --test mail/check-batch.test.mjs code/life-os/shared/mail.test.js code/life-os/backend/src/modules/mail/*.test.js hosting/mail/*.test.mjs hosting/notices/*.test.mjs hosting/calendar/*.test.mjs hosting/calendar-route.test.mjs hosting/day/*.test.mjs code/life-os/backend/src/modules/study/*.test.js code/life-os/frontend/test/*.test.js`: 181 pass. Frontend build passes.
- Rendering test (a body holding `<script>`, `<img onerror>` and `javascript:` stays text; only https links): `test/inbox-render.test.jsx`, 3 pass. Run it bundled from `code/life-os/frontend`: `node -e "require('esbuild').build({entryPoints:['test/inbox-render.test.jsx'],bundle:true,platform:'node',format:'esm',outfile:'test/.inbox-render.bundle.mjs',jsx:'automatic',alias:{'@shared':'../shared'},define:{'import.meta.env':'{}'},external:['react','react-dom','react-router-dom','node:*']})"`, then `node --test test/.inbox-render.bundle.mjs`, then delete the bundle.
- Walked in Chrome on a private try-out (port 47870, the worktree; `lifeos_test`; its own empty core database with three made-up people): the example gives 4 open actions and 1 done, plus the birthday wish; Jo urgent under Today, the brief under This week; Done, Tomorrow and Not needed survive a reload, with Undo; "text Sam about the museum" lands under Sam in People; search finds a word in a body; a newsletter with no text says so; Hide and Show hidden; Announcements filter; the digest; the Guide chapter; Today's panel (up to five); the envelope's count; the bell's mail lines and the birthday leading to the wish; calendar items on 29 and 30 October and 2 November; Today's add line ("17:30 call mum" stays a plan; "text Sam about Saturday" goes to the Inbox under Sam). Looked at in Modern light and dark, Madder, Indigo and Paper, and at 400 pixels (list and reader take turns, Back works, nothing wider than the screen). The top bar at 1920 to 900 in the four styles: the envelope adds no row at any width (at 1024 and below the bar already takes two rows, with or without it).

## Data touched
- `lifeos_test` only: test rows (soft-deleted before the try-out, so the pictures show the example alone; the app role cannot delete). The try-out's core database is the worktree's own, not hers.
- `lifeos`: not touched. `migrate.js lifeos`, the live build and the restart were blocked by this session's permission check, so they wait for her.
- `guide-shots/`: four Inbox pictures and their manifest entries added (example data only).

## Problems and surprises
- Grouping crashed for an empty "today" before the list loaded; guarded, with the page walked again.
- Today's add-line grid squeezed the Inbox's own add line; fixed. Plain buttons drew in the browser's white in Madder; given the style's look.
- Until the migration runs, `/api/mail` answers 503: the Inbox, Today's panel and the envelope say they could not be read, and the calendar lists "Mail and admin" as unavailable.
- `mail/GATHER.md` still says batches wait "until Life OS's Mail part exists". Left as it is (its rules are hers); it now means "until live import is on".

## Small decisions I made, and questions for Xar
- One commit for CP2 to CP5 (she asked for it all at once); the files overlap too much to split honestly.
- The envelope beside the bell, as the brief proposed (open question 3).
- A hand-added line from Today gets that day as its due day; from the Inbox it has none.
- Birthday wishes are "high"; Done lately keeps eight days.
- Open questions from the brief remain hers: OneDrive and processed batches, how long to keep text, drafts in Gmail, one gathering for everything.

## Next step
Xar (or an agent she approves): `node code/life-os/backend/src/migrate.js lifeos`, `Build Life OS.cmd`, restart Life OS. Then the one-time setup and the first gather in `mail/AGENT-PROMPTS.md`; the first batch on `lifeos_test`, then hers; then live import on. A review of the mail work (her review prompt) before she accepts.
