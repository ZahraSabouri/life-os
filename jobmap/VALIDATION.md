# Verification — 14 September 2026

- Production build and TypeScript check pass.
- Automated checks pass for source completeness, matching, date boundaries, deadline conflicts, manual entries, duplicate links, status transitions, save conflicts, restart persistence, backup restoration and invalid input rejection.
- The original collection is unchanged: 980 unique records, 772 complete Student Futures adverts, 963 original links.
- Browser checks verified the 772-record source filter, original advert link, existing interview, shortlist changes, notes, next steps, calendar selection, follow-ups after reload, preferences and required add-job fields.
- Temporary browser-test notes, shortlist selection and follow-up date were cleared. The existing Sati Services interview was preserved.
- The final production page reported no browser console errors.

The saved collection dates from 13 September 2026. These checks establish local functionality and preservation of saved data; they do not verify live vacancy availability or predict hiring outcomes.

## Scheduled integration — 15 September 2026

- Local heartbeat `uk-tech-job-shortlist-jobmap` is active on Tuesday, Thursday, Saturday and Sunday at 15:00, using this computer's UK time zone. The old cloud task `6a4ac996f3688191b45adf95b504e7a6` was confirmed paused in ChatGPT.
- TypeScript, production build and all three test suites pass: original app checks, discovery import checks and inbox checks.
- A clearly named empty integration batch passed dry run, queuing and ingestion through the running service. No job records or personal edits changed; all 980 records and the existing interview were retained.
- Scheduled searches write to the local inbox. JobMap processes queued batches while running or when next opened. Unattended live research has not yet run under the replacement schedule.

## 9 October 2026: priority and parity

Both copies pass all five `npm test` suites, TypeScript and the production build. Shared feature code and vacancy evidence pass the parity check (1,064 records each at final check). The same compiled asset is served in both. Read-only headless Chrome checks show My priority selected by default, Pets at Home's 9 October deadline first, then the 11 October deadlines, with the availability warning in the row and details. Relative backup links resolve to the correct app API. No browser exceptions. Desktop and actual 390px phone screenshots inspected; no horizontal overflow. The browser helper failed to start, so the installed headless Chrome was used.

Standalone's pending five-job search imported successfully. The reviewed local API reconciliation added 56 missing source records (including one historical closed advert), preserving all existing personal overrides, preferences, added dates and original custom-job personal fields. Both original data/jobs.json files remain unchanged. Repeat reconciliation previews zero additions/updates and no conflicts. Recovery: `data/recovery/source-parity-2026-10-09T10-28-49-337Z/` in standalone, plus its server's before-restore backup.

Final check: an additional attended-search batch imported one vacancy into each app while this work was finishing. Both now have 1,064 records; standalone revision 21, Life OS revision 26. All 34 shared implementation files and underlying vacancy evidence match.
