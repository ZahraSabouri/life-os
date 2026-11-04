# 2026-11-04 · Claude Code · Stage 5 · CP1 to CP8

## Goal
Build every checkpoint of `briefs/stage-5-harvest.md` in one sitting (Xar: "do these but all sessions"), using judgement beyond the brief where her original request asked for more ("use your own wisdom", "PRO MANAGEMENT. best filters").

## What I did
- **CP1** The v2 batch: `items[]` (vacancy, opportunity, event, announcement, material, offer, info), message `links[]`; the checker refuses chatty summaries, tracking/sign-in/unsubscribe/safe-link wrappers, items without a source, items on the wrong London day. One routing rule, `shared/harvest.js` (placeOf, partOf, dayLine, canonicalUrl, junkLink, originalLink). `mail/HARVEST.md` for the agents; app suggestions go to `mail/suggestions.md`.
- **CP2** `mail/0002_items.sql`: `mail.items`, message links, batch version, `mail.senders`; importer applies items, keeps her status, undo removes items first.
- **CP3** A "Came in" Calendar source; `PATCH /api/mail/items/:id`; Cardiff events start on Plan to go (Calendar, Today, Planner, Court; Cardiff Life's own strip keeps Maybe).
- **CP4** Places: vacancies and events found in JobMap and Cardiff Life by their page's address, read only. A "Came in" count in each part's strip (Study, JobMap, Cardiff Life, Budget's Offers) and on Health.
- **CP5** Inbox → Harvest log: sources panel, one page per day, the runs with Undo; Everything with filters and bulk Keep/Dismiss. Digests removed (its address leads to the log); the sign-off setting moved; the Guide updated.
- **CP6** Mail: filters (area, priority, led to, dates, not opened), folding per sender per day, sender rules fold/hide with the way back, bulk hide/show/opened, "Taken from this", real links, Gmail from the account setting, Outlook only with a real address.
- **CP7** Today shows what came in and what closes soon instead of the digest headline.
- **CP8** The importer recognises a stored message under another id (same source, minute, sender, subject), so the backfill updates the 1,171 messages instead of doubling them; `mail-import.mjs` refuses made-up batches for the live database; the checker accepts a byte-order mark; backfill procedure in `mail/HARVEST.md`.

## Files and commits
`39a69b8` [5-cp1] · `ed8dbbf` [5-cp2] · `642ca01` [5-cp3] · `6f21300` [5-cp4] · `81e5417` [5-cp5] · `e29e345` [5-cp6] · `7fb8360` [5-cp7] · [5-cp8] (this note).

## How I checked it
- Unit suites: 87 pass (checker, harvest rule, mail, places, notices, calendar). Mail integration and page suites on `lifeos_test`: 34 pass, including a 64-day weekly backfill and re-sent mail. Bundled render tests: 8 pass. Calendar frontend tests: 19 pass. Production build passes.
- Headless Chrome (the Guide's own browser), read only (every write blocked), with made-up items in place of the harvest reads: Study, JobMap, Cardiff Life, Budget, Health, the Harvest log (by day, Everything), Mail and Today at 1360 and 400 pixels: no errors, no overflow. Pictures in the session scratchpad only. Against live data, only errors and overflow were recorded; no pictures of her mail were kept.
- `scripts/mail-import.mjs lifeos_test` imported a made-up v2 file; `… lifeos` refused it. Live counts unchanged.

## Data touched
`mail/0002_items.sql` on `lifeos_test` and `lifeos`, each after a dump (`Life_OS_backups/study-2026-11-03/before-migration-*.dump`); live counts before and after: 18 batches, 6 sources, 1,171 messages, 25 actions, 1,587 history, then 0 items and 0 senders. Test batches on `lifeos_test` only (one dump in `Life_OS_backups/mail-2026-11-04/`). Life OS restarted several times with the launcher; Budget and JobMap came back each time.

## Problems and surprises
- Code written through shell scripts lost backslashes and `$` signs twice; caught by tests and the build, fixed with direct edits.
- A Guide edit broke the build with a straight apostrophe; the live app kept the previous build until it was fixed.
- The Playwright browser tool is not installed here; the repository's `playwright-core` with Chrome was used instead.

## Small decisions I made, and questions for Xar
- "Came in" lives inside each part's existing strip as a count that opens a list, rather than a second strip, so the framed parts keep their height.
- JobMap's and Cardiff Life's strips list only what is not there yet; what is there shows in the app itself.
- Outlook "open original" uses the stored address of the opened message instead of a separate id field.
- Question: once the backfill is in, should Today's "Came in" also show what came in yesterday when Today is opened before the morning harvest?

## Next step
Xar's look at the Harvest log and Mail; then Cowork switches Integrate to version 2 and prepares the backfill on `lifeos_test`.
