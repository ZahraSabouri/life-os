# 2026-10-09 · Codex · JobMap priority and source parity

## Goal
Improve My priority in both apps so approaching deadlines are visible, and align shared source records and features.

## What I did
- Replaced manual P1–P4-only sorting with explainable priority groups: current paid part-time possibilities, hours needing agreement, roles outside the current search, applications already sent, then closed adverts. Deadlines today, tomorrow and the next 7 days lead within each group; personal priority, match, shortlist and deadline break ties.
- Made My priority the default. Rows and details explain the assessment. London-day rollover/refocus recomputes order. Closing soon moves closed adverts lower.
- Flagged advertised part-time hours above the saved preference even when the advert says part-time.
- Unified relative API/asset paths and feature code across the standalone and hosted app. Added a parity checker and preview-first API source reconciliation utility.
- Started standalone safely, which imported its pending five-job batch. Reviewed and backfilled 56 missing historical source records through its revision-protected restore API; no existing personal field was merged or overwritten. Life OS was already running and had processed additional imports during this task.

## Files and commits
Shared changes: app/page.tsx, lib/matching.mjs, lib/types.ts, package.json, tsconfig.json, vite.local.config.ts, tests/priority.mjs, check-parity.mjs, reconcile-sources.mjs, README.md, VALIDATION.md. Same built asset in both apps. Existing AGENTS/search/brief changes were retained; unrelated look work was completed independently on the same branch during this task and is preserved.

## How I checked it
Both apps: all five npm test suites, npx tsc --noEmit and npm run build passed. Both-direction parity checks pass. Actual browser checks show Pets at Home's closing-today record first, followed by the 11 October jobs; detail warning and correct relative backup routes confirmed; no exceptions. Desktop and true 390px phone screenshots inspected (content width 390px). Repeat reconciliation previews no additions/updates/conflicts.

## Data touched
Standalone search import: 1,002 to 1,007 records, revision 18 to 19. Reviewed reconciliation: 1,007 to 1,063, revision 19 to 20. Life OS unchanged by reconciliation: 1,063 records, revision 25. Both underlying original collections remain untouched. Existing overrides, preferences, custom-job personal fields and added dates verified preserved. Source snapshots and reviewed plan: standalone data/recovery/source-parity-2026-10-09T10-28-49-337Z; automatic before-restore backup retained. Affected code backed up under each app's data/recovery/priority-2026-10-09T10-22-57-536Z.

## Problems and surprises
The sandbox command/browser helper could not start (setup refresh error). Approved native commands and installed headless Chrome completed the work. No blocked action remains. Personal choices differ between apps, so filtered/shortlist counts can differ despite identical vacancy evidence and features.

## Small decisions I made, and questions for Xar
Kept current scope filters and manual priority choices, used saved availability evidence, introduced no new priority dashboard or invented deadline. Closed historical records remain available for source parity while routine searches retain their existing closed-vacancy exclusion. No background synchronisation service was added; maintenance instructions and a parity check enforce verification during future authorised updates.

## Next step
Refresh either JobMap and use My priority. Future shared changes or searches must pass both app checks and the parity command. Life OS look/Study acceptance remains Xar's separate check.

Final live check: one additional attended-search batch imported into both copies while this task was finishing. Both now have 1,064 records, standalone revision 21 and Life OS revision 26. All 34 shared implementation files and vacancy evidence pass parity; both final type checks/builds pass and serve index-CLU6ef4Z.js. The reviewed reconciliation itself remains the 56-record operation described above.
