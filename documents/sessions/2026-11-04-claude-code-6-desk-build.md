# 2026-11-04 · Claude Code · Stage 6 · planning, CP1 to CP6 (and a stage 5 fix)

## Goal
Xar, after stage 5: the Inbox still looked like a loaded mailbox; every email should be connected to what it is about; nothing useful missed; no assistant names or generic prompts; the app is a product for many people (accounts, networking later), not one person's handcraft. Design it as infrastructure, then build.

## What I did
- **`[5-fix]`** Removed from the Inbox: "Write it with Claude", the copy-a-prompt helper and its reply prompt, the "name Claude signs replies with" setting, the agent's name on harvest runs; the Guide's Inbox pages no longer name Claude, Codex, Cowork or the owner's accounts. JobMap's CV helper stays until the app's own drafting (her choice).
- **Analysis (read only):** her 1,171 stored messages are 74% noise and newsletters; about 360 are about things the app had no place for (orders ≈150, bills ≈65, tenancy ≈50, people ≈40, competitions ≈28, travel ≈24, application progress ≈22, official ≈12, account notices ≈18). Counts only; no content printed.
- **Proposal and prototype** (https://claude.ai/artifact/7RjsaJY8Trpf3GMeQj9tUy): five layers (sources, harvest automations, things and signals, one registry, places), the new kinds, accounts and network. Approved: Desk → Accounts → Network; all four families and more; domain colours on every style.
- **CP1** Kinds, areas `travel` and `people`, an opportunity's form, states per moving kind, reference and amount; eight domains (`domainOf`), a marked guess for unfiled mail (`guessDomain`); placeOf and partOf for the new kinds; `mail/example-batch-v2-kinds.json`; HARVEST.md.
- **CP2** `mail/0003_things.sql`: states, form, reference, amount, her domain, owner columns, `mail.item_events`, sender domains. The importer accumulates evidence, keeps a state a run leaves out, records each step; undo marks steps undone.
- **CP3** `GET /api/mail/desk`, `GET /api/mail/items/:id`; applications found in JobMap by advert or employer and role; `jobmapSuggestion`; taught senders.
- **CP4** The Desk (`InboxDesk.jsx`, `desk.css`, `DomainGlyph.jsx`), domain colours in `palettes.css`, Inbox tabs Desk · Waiting on you · Harvest log · Messages with old addresses redirected.
- **CP5** Messages say what they are about (filed or guessed), a Domain filter, file a sender under a domain; the Guide's Inbox chapter.

## Files and commits
`fbdafe2` [5-fix] · `1aee81f`, `596f5f1` [6-plan] · `124280e` [6-cp1] · `b0afa94` [6-cp2] · `081e283` [6-cp3] · `429fd74` [6-cp4] · `97e59be` [6-cp5] · [6-cp6] (this note). Codex committed `50c197d` and `4062724` on this branch meanwhile (its own study and JobMap updates).

## How I checked it
Unit suites 100 pass; mail integration and page suites on `lifeos_test` 45 pass (lifecycles, undo of a step, desk routes, taught senders, domain filters); bundled render tests 11 pass; production build passes. Headless Chrome, read only, with made-up things: the Desk on Madder, Modern light and Modern dark at 1360 and 400 pixels, the drawer, Messages; live pages (Inbox, Messages, Waiting on you, Harvest log, Today, Calendar, Guide, JobMap, Budget) without errors or overflow. Live: the Desk route answers (no things yet, 122 messages kept quiet this week); Messages guess a domain for about 90% of stored mail.

## Data touched
`mail/0003_things.sql` on `lifeos_test`, then `lifeos` after a dump (`Life_OS_backups/study-2026-11-04/`); live counts before and after unchanged (18 batches, 6 sources, 1,171 messages, 25 actions, 1,587 history, 0 items, 0 senders). Test batches on `lifeos_test` only. Life OS restarted with the launcher.

## Problems and surprises
- Bash heredocs here strip backslashes and choke on apostrophes; code is written with the file tools.
- Codex worked in the same folder and on this branch at the same time; its STATUS paragraphs are kept, its two untracked notes left for it.
- A naming clash (`ref` for both an item's batch ref and an order number) caught by the schema check; the field is `reference`.

## Small decisions I made, and questions for Xar
- The tab stays "Waiting on you" (the app's established name), not "To do".
- Domain colours: one bright set for dark styles, one deep set for light ones.
- A thing's domain: her choice, else a taught sender, else its kind, else its area.
- Question: should a guessed domain on Messages be confirmable in one click (it becomes a taught sender), or stay a quiet hint?

## Next step
Xar's look; Cowork switches Integrate to version 2 with the stage 6 kinds and prepares the backfill on `lifeos_test`; then plan stage 7 (Accounts) with her.
