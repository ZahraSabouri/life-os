# Stage 5: Harvest, so mail becomes the app's own data

**Status:** approved by Xar on 3 November 2026 (after review against the code; see "What changed from the draft"). Building.
**Branch:** `stage/5-harvest`, created from `stage/jobmap-workflow` at `fe8e792` (main plus JobMap CP1 only), not from `main`: the live app runs from this folder, and branching from `main` would have put pre-CP1 JobMap files back under the running app while Xar is still reviewing CP1. If CP1 changes before it is merged, rebase this branch onto the result.

## Goal

Mail, Learning Central, job boards and event sites are where most of Xar's life arrives. Today Life OS shows mail as a copy of her inbox plus one chat-like digest per run. At the end of this stage, what is harvested appears **in its place, in the app's own voice**: a thing to do in Waiting on you and the Calendar, a dated course item in the Calendar, an offer on the Budget page, and vacancies and events linked to where they live in JobMap and Cardiff Life. A **Harvest log** shows what came in, one page per day back to 1 September, as a factual record. The original email stays readable inside Life OS (summary, cleaned text, its real links), and "open original" either works or is not shown.

## Read first

`AGENTS.md`, `documents/STATUS.md`, `documents/briefs/mail-and-admin.md` (the mail stage this extends), `mail/GATHER.md`, `mail/mail-batch.schema.json`, `mail/check-batch.mjs`, `code/life-os/backend/src/modules/mail/` (repository, importer, reads, router), `hosting/mail/inbox.mjs`, `hosting/calendar/` (service, loaders, mappers), `code/life-os/frontend/src/components/inbox/`, `jobmap/SCHEDULED_SEARCH.md`, `cardiff-life/AGENTS.md`.

## The shape

### Principles (Xar, 3 November: "sensibility and integrity of the data structure, actions that make sense, reusable by an automated machine")
1. **Each part stays the only writer of its own data.** The Life OS server writes only the mail store (PostgreSQL schema `mail`), in one transaction per batch, with history and undo. It never writes JobMap's, Cardiff Life's or Budget's files.
2. **One way in.** Version 2 of the existing mail batch (`life-os.mail-batch`), dropped in the existing `mail/inbox/`, checked by the same `mail/check-batch.mjs`, applied by the same importer. Version 1 batches keep working.
3. **Things to do are actions; everything else is an item.** Anything Xar must do (reply, pay, apply, submit, decide) is an `actions[]` row, as now: it is already on Waiting on you, the Calendar, Today and the bell. What came in (a vacancy, an event, an announcement, a material, an offer, a dated fact) is a new `items[]` row. An item can point at the action it led to.
4. **"Where it went" is checked, not claimed.** An item's place in JobMap or Cardiff Life is found by matching its link against those apps' own data at read time (read only, through the loaders the Calendar already uses), so the log never says something is somewhere it is not.
5. **One routing rule, in one file.** `code/life-os/shared/harvest.js` says, for an item, where it shows. The checker, the server, the pages and the agents' instructions all use it.

### The v2 batch, in short (full rules in `mail/HARVEST.md`, written in CP1)
- Everything in v1, with `version: 2`. The `digest` becomes optional and is no longer shown as a headline.
- `messages[]` gains `links[]` (`{href, text}`, real destinations only: no tracking, sign-in or unsubscribe links) and an optional `webId` (Outlook's own item id, from the address of the opened message, so "Open in Outlook" can work). `text` (up to 20,000 characters) is the cleaned text: quotes, signatures and footers removed. Automated mail and newsletters may keep text and links when an item cites them (job alerts are exactly that).
- `items[]`: `ref`, `key` (stable dedupe key `<source>:<original id>:<slug>`), `area` (`admin | academic | jobs | research | events | money | perks | health | home`), `kind` (`event | vacancy | opportunity | announcement | material | offer | info`), `title`, `summary` (at most 300 characters, neutral and factual, never "you should…"), `day` (the London day it came in), optional `start`, `end`, `allDay`, `deadline` (closes, ends or is due), `location`, `url`, `course`, `organiser`, `employer`, `salary`, `cost`, `tags[]`, and `messageRefs[]`/`actionRefs[]` pointing at the batch's own messages and actions. Web finds (the scouts) have no message and say where they were found (`foundAt: {url, checkedAt}`).

### Where things show (the routing rule)

| What came in | Stored as | Shows in |
|---|---|---|
| Anything she must do by a day (incl. bills: "Pay …") | `mail.actions` (as now) | Waiting on you, Calendar (Life admin), Today, the bell |
| Academic announcement or material with a day; opportunity with a deadline; dated info | `mail.items` | Calendar layer "Came in" (in the item's area); Harvest log |
| Event | `mail.items` | Harvest log, linked to the Cardiff Life event when the link matches. Calendar only through Cardiff Life, and the Calendar's Cardiff filter now starts on **Plan to go** (Xar's answer 1) |
| Vacancy, research post | `mail.items` | Harvest log, linked to the JobMap job when the link matches; Today when it closes within 7 days |
| Offer, perk | `mail.items` | **Offers list at the top of the Budget page** in Life OS, with end dates, Keep and Dismiss (Xar's answer 2, see below); Today on its last 2 days |
| Undated announcement, info | `mail.items` | Harvest log; Mail |

**Offers (Xar's answer 2, decided 3 November):** they live on the Budget page, but Life OS stores them. Budget's only way in is a save of its whole `state.json` (the file she has been burned by), and an offer is not yet a money record. When Budget becomes a native module, offers move into it with a reviewed migration.

**Gmail account (Xar's answer 3):** a setting, `mail-gmail-account`, default `1`. "Open in Gmail" is built from the stored Gmail message id: `https://mail.google.com/mail/u/<n>/#all/<id>`.

**Outlook:** "Open in Outlook" only when a message has a `webId`. The ids stored so far are Life OS's own stand-ins, so older Outlook messages show no link rather than a broken one.

### Reaching JobMap and Cardiff Life (agents' side, unchanged tools)
- Vacancies found in mail are queued for JobMap by the Integrate agent with `jobmap/queue-jobs.mjs` (dry run, then queue), its documented and validated route. The batch's item carries the advert link, and Life OS finds the job by that link.
- Events found in mail are handed to the Cardiff events workflow (its saved handoffs), which verifies them and adds them to `events.csv` under Cardiff Life's own rules.

### The scheduled tasks after this stage (Cowork, not app code)
1. **Harvest inboxes** (daily, early): Gmail, Cardiff Outlook, Learning Central, timetable, intranet. Reads only what is new and saves raw files to `harvest/raw/<source>/<YYYY-MM-DD>.json` (private, ignored by git), with full cleaned text, real links and Outlook `webId`s.
2. **Scout jobs** (Mon and Thu) and 3. **Scout events** (Thu and Sun): web only, raw files.
4. **Integrate** (daily, after 1; and after 2 and 3): no browsing. Turns new raw files into v2 batches for `mail/inbox/`, queues vacancies for JobMap, hands events to Cardiff Life, and checks the receipts. The instructions live in `Documents\Scheduled Workflows\instructions\`, maintained in Cowork.

## In scope / not in scope
- **In:** the v2 format and checker, `mail.items` and its import and undo, the routing rule, the Calendar "Came in" layer and the Plan-to-go default, place matching for JobMap and Cardiff Life, the Offers list, the Harvest log, the Mail reading-room additions, Today's "Came in" lines, backfill readiness.
- **Not in:** AI inside the app; sending, replying or changing anything in mailboxes; booking or applying; writing to JobMap, Cardiff Life or Budget data; People suggestions from mail (mail never creates a person); a Study-hub panel for announcements (they are in the log, Mail and, when dated, the Calendar; a hub panel is a later stage); area chips on every list in the app (only the log and Mail get them).

## Checkpoints

### CP1: the v2 format, its checker and the routing rule (no database)
- [ ] `mail/mail-batch.schema.json`: version 1 or 2; v2 adds `items[]`, `messages[].links[]`, `messages[].webId`; `digest` optional in v2.
- [ ] `mail/check-batch.mjs`: v2 cross-checks: item refs and keys unique; `messageRefs`/`actionRefs` resolve; `day` is a real day; links and item `url`s are https and not tracking, sign-in or unsubscribe links; area and kind are a known pair; text kept for automated mail and newsletters only when an item cites the message; summaries that talk to her ("you should…") are refused. v1 rules unchanged.
- [ ] `code/life-os/shared/harvest.js`: areas, kinds, `placeOf(item, today)`, `dayLine(counts)` (the log's factual line), `canonicalUrl`, `isJunkLink`, `gmailLink`, `outlookLink`; `code/life-os/shared/harvest.test.js`.
- [ ] `mail/example-batch-v2.json` (made up, several days) and `mail/HARVEST.md` (the format, the voice, the routing rule, for the agents).
- [ ] `.gitignore`: `/harvest/`.
- **Done when:** the v2 example passes, every broken copy is refused with a plain reason, and the v1 example still passes.
- **Verify:** `node --test mail/check-batch.test.mjs code/life-os/shared/harvest.test.js code/life-os/shared/mail.test.js`.
- **Commit:** `[5-cp1] Harvest batch v2: format, checker and routing rule`

### CP2: storing items, with import and undo
- [ ] `code/life-os/backend/src/migrations/mail/0002_items.sql`: `mail.items` (source fields; her fields `status` new/kept/dismissed and `seen_at`; revision; soft delete; unique live `dedupe_key`; indexes on day, kind and deadline); `mail.messages` gains `links jsonb` and `web_id text`; `mail.batches` gains `version`; `mail.history` accepts `items`; grants.
- [ ] `repository.js` (columns and her fields for items), `importer.js` (items applied after messages and actions; source fields only, her status kept; counts; undo covers items first), `hosting/mail/inbox.mjs` (the receipt line counts items).
- [ ] Migrate `lifeos_test`, then `lifeos` (`migrate.js` dumps first). Restart Life OS.
- **Done when:** a v2 batch imports on `lifeos_test`, a repeat changes nothing, a changed item updates without touching her status, undo removes it, and a v1 batch still imports.
- **Verify:** `LIFE_OS_MAIL_TEST_DB=lifeos_test node --test code/life-os/backend/src/modules/mail/integration.test.js` (PowerShell: the Bash sandbox can't reach PostgreSQL), plus CP1's tests.
- **Commit:** `[5-cp2] Harvest items stored, imported and undone with their batch`

### CP3: places inside Life OS: the Calendar
- [ ] `reads.js`: dated items for a stretch; `hosting/mail/notices.mjs`: `mapHarvest` (only what `placeOf` sends to the Calendar); `hosting/app.mjs`: a "Came in" source in the Calendar service.
- [ ] The Calendar's Cardiff filter starts on Plan to go (`frontend/src/lib/calendarViews.js`).
- [ ] `PATCH /api/mail/items/:id` for her fields, with the revision check (409).
- **Done when:** a dated course item from a test batch is on the Calendar on its day, an undated one is not, an event is not (except through Cardiff Life), and the Calendar opens on Plan to go.
- **Verify:** `node --test hosting/mail/notices.test.mjs`, the bundled `frontend/test/calendar-views.test.js`, the mail tests, the build.
- **Commit:** `[5-cp3] Harvested dates on the Calendar; Cardiff events start on Plan to go`

### CP4: places outside Life OS: JobMap, Cardiff Life, Budget
- [ ] `hosting/mail/places.mjs`: matches vacancy and research items to JobMap jobs, and event items to Cardiff Life events, by canonical link (read only, the Calendar's loaders); gives `{app, href}` or "not there yet".
- [ ] `GET /api/mail/items` (filters: day, area, kind, open offers) with places attached.
- [ ] `frontend/src/components/inbox/BudgetOffers.jsx` above Budget's frame on `/budget`: offers not yet ended, soonest first, Keep and Dismiss.
- [ ] `mail/HARVEST.md`: how Integrate queues JobMap (`queue-jobs.mjs`) and hands events to Cardiff Life.
- **Done when:** a test vacancy whose link is in JobMap shows "In JobMap" with a working link, an unknown one shows "Not in JobMap yet", and a test offer is on the Budget page and can be dismissed.
- **Verify:** `node --test hosting/mail/places.test.mjs`, the mail tests on `lifeos_test`, the build, the browser.
- **Commit:** `[5-cp4] Harvested vacancies and events linked to JobMap and Cardiff Life; Offers on the Budget page`

### CP5: the Harvest log, replacing Digests
- [ ] `reads.js` and `router.js`: `GET /api/mail/days` (London days with counts by kind and source) and `GET /api/mail/days/:day` (that day's items by area with their places, its messages count, and the runs that brought them, with undo on the latest).
- [ ] `frontend/src/components/inbox/InboxLog.jsx` at `/inbox/log` (the Digests tab becomes "Harvest log"; `/inbox/digests` goes there). One day at a time, newest first, back to the first harvested day; the day's factual line, then items grouped by area, each linking to its place; area chips. "How to gather" moves into a quiet section at the end.
- [ ] The Guide's Inbox page (`frontend/src/guide/chapters.js`).
- **Done when:** the test batches give one page per day, each reading like a record, and the old digests' runs are still listed with their sources.
- **Verify:** the mail tests on `lifeos_test` (days), `frontend/test/inbox-render.test.jsx` (bundled), the build, the browser.
- **Commit:** `[5-cp5] The Harvest log: one page per day, in place of Digests`

### CP6: Mail as a reading room
- [ ] `reads.messages`: area (through its items), date range and "has a deadline" filters; newsletters and automated mail folded to one line per sender per day.
- [ ] The reader: "Taken from this" (its items and actions, each with where it went), the cleaned text, its real links; "Open in Gmail" from the setting, "Open in Outlook" only with a `webId`, otherwise nothing.
- [ ] The Gmail account setting on the Mail page (`mail-gmail-account`, default 1).
- **Done when:** a Gmail message opens with a `u/1` link, an Outlook message without a `webId` shows no link, and twenty job alerts from one sender fold to one line.
- **Verify:** `frontend/test/inbox-render.test.jsx`, the mail page tests, the build, the browser.
- **Commit:** `[5-cp6] Mail as a reading room: filters, folding, what was taken, working links`

### CP7: "Came in" on Today
- [ ] `/api/mail/summary`: `cameIn` (items that came in today, vacancies and opportunities closing within 7 days, offers in their last 2 days) in place of the digest headline.
- [ ] `InboxPanel.jsx`: the "Came in" lines in place of the headline.
- **Done when:** Today shows factual "Came in" lines and no chat headline.
- **Verify:** the mail page tests, `frontend/test/inbox-render.test.jsx`, the build, the browser.
- **Commit:** `[5-cp7] Today: what came in, in place of the digest headline`

### CP8: ready for the backfill
- [ ] `scripts/mail-import.mjs` takes v2 (tried on `lifeos_test` first, as now).
- [ ] A made-up backfill spanning several weeks, on `lifeos_test`: one log page per day; re-sending a message already stored (same source and id) updates it rather than duplicating it; a repeat changes nothing.
- [ ] `mail/HARVEST.md`: the backfill procedure for Cowork (from `mail/archive/` and `harvest/raw/`, one batch per day or per week, oldest first).
- [ ] **Waiting on Xar and Cowork:** the real 1 September to 3 November backfill, made by Cowork's Integrate run and imported only after Xar says yes.
- **Verify:** the full mail suite on `lifeos_test`, the build; Xar in the browser.
- **Commit:** `[5-cp8] Ready for the September backfill`

## Data safety
- `migrate.js` dumps before each migration; `postgresBackup` before each batch (as now). Record message, action and item counts before and after each live step.
- Never run `hosting/app.test.mjs` (it reseeds core). Never write JobMap's, Cardiff Life's or Budget's files. Imports never write her fields.
- `harvest/`, `mail/archive/`, `mail/inbox/*` and personal mail stay out of git.
- Test batches go to `lifeos_test` only; the live inbox gets real batches only from the agents.

## Tests
`node --test` for `mail/`, `code/life-os/shared/`, `hosting/mail/`; `LIFE_OS_MAIL_TEST_DB=lifeos_test` for the mail integration and page tests (run in PowerShell); bundled frontend tests as in the mail session notes; `Build Life OS.cmd` (or `npm run build` in `code/life-os/frontend`).

## Acceptance checklist for Xar
1. Inbox → Harvest log: one page per day, factual, each item linked to where it is.
2. Calendar: dated course items under "Came in"; Cardiff events only those marked Plan to go (the filter can still show all).
3. Budget: the Offers list at the top, with end dates; Dismiss one.
4. Inbox → Mail: filter by area and dates; job alerts folded; open a Gmail message and use Open in Gmail.
5. Today: "Came in" lines, no chat headline.

## What changed from the draft (agreed 3 November)
- Deadlines are actions in the mail store, not core entries: core entries are SQLite with no deadline or plan type, and one import must stay one transaction with one undo.
- Events reach the Calendar through Cardiff Life's Plan to go (already read by the Calendar), not through a new core entry the server can't see. Cardiff Life has no import; its events workflow adds verified events.
- JobMap gets vacancies through its own `queue-jobs.mjs` (Integrate agent), not from the Life OS server; Life OS checks where they landed.
- Budget has no import or pending list; offers are stored by Life OS and shown on the Budget page; bills are "Pay …" actions.
- No second format or folder: v2 of the mail batch. Each item says its own day, so the log reads by day however files are split.
- Dropped: People suggestions, area chips on every list, a separate Today card (Today's existing panel changes instead).
- Backfill: the saved Outlook archive has stand-in ids (no working Outlook links for September and October) and text cut at 5,000 characters for most messages; Gmail's extract is not saved yet. CP8 makes the app ready; the real backfill is Cowork's, on Xar's yes.

## Risks and open questions
- The backfill can only be as full as the saved archive; older Outlook messages will have summaries and partial text, and no Outlook link.
- Matching places by link depends on the agents keeping real advert and event links; tracking links are refused by the checker for that reason.
- The Bash tool's sandbox can't reach PostgreSQL on this computer; run database tests in PowerShell.
