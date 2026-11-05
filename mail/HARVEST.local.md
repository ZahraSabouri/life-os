# Harvest: this installation (private)

Read with `mail/HARVEST.md`, which points here. Where the two differ, this page wins for this Life OS. Split out of HARVEST.md on 2026-11-05 (stage 7), word for word.

## Events handoff

- **Events:** hand each event to the Cardiff events workflow (its saved handoffs, in the scheduled tasks' own folder), which verifies it and adds it to `cardiff-life/events.csv` by Cardiff Life's own rules. The item keeps the organiser's event page as its `url`.
- Never write `cardiff-life/*.csv` yourself (the events research folder here is `cardiff-life/`, set as LIFE_OS_EVENTS_DIR).

## The September backfill (once, on Xar's yes)

Life OS already holds 1,171 messages from earlier gathers. The backfill rebuilds 1 September to 3 November as the app's own record, day by day, without reading the mailboxes again.

1. **Read from what is saved:** `mail/archive/` and `harvest/raw/`. Do not open Gmail, Outlook or Learning Central for it.
2. **Use the sources Life OS already has**, with their ids: `cardiff-outlook`, `gmail`, `learning-central`, `teams`, `student-intranet`, `timetable`. Give each a label in words ("Cardiff Outlook", "Gmail", "Learning Central"): a batch's label replaces the stored one. A web scout's finds use their own source (for example `web-jobs`, `web-events`, kind `other`).
3. **The same message is recognised** by its source and id; failing that, by the same source, the same minute, the same sender address and the same subject. So a message stored earlier under a stand-in id is updated, not added again, and keeps the provider's id from then on. Keep `receivedAt` to the minute as the mailbox shows it.
4. **Oldest first, one batch per week** (1 to 7 September first), each under 10 MB and 2,000 messages. Every item says its own `day`, so a week's batch still gives one log page per day.
5. **Try every batch on `lifeos_test` first:** `node scripts/mail-import.mjs lifeos_test <file>`. Then, with Xar's yes, `node scripts/mail-import.mjs lifeos <file>` (it takes a backup first), or drop the files in `mail/inbox/` one at a time, oldest first, waiting for each receipt in `mail/import-log.md`.
6. Outlook messages from the saved archive have no message address, so they show no "Open in Outlook" link. Their text is what the archive kept (often cut at 5,000 characters): send `textComplete: false` for those.
7. Report counts before and after (Mail → the Harvest log's sources, or the receipt lines). A made-up batch (its agent says "not real mail" or "for tests") is refused by the live import.
