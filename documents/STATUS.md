# Life OS: status

**Updated 5 October 2026 by Codex.** Branch: `stage/2-calendar-today`, from `main` at `f156682`.

## Now
Xar's later Claude chat authorised starting work with a written brief and review afterward, then clarified **Calendar and Today first**. Claude stopped during mapping; the prior status still described Session 0. The order change is now recorded in ROADMAP and DECISIONS.

**Active brief:** `briefs/stage-2-calendar-today.md`.
- CP1 built: read-only providers, shared dates, authenticated calendar route, seven source statuses and complete Cardiff ID knowledge. 20 isolated tests pass; all seven sources ready on direct live reads; protected source hashes unchanged.
- CP2 in progress: Calendar, Today, Court strip, `/ledger`, helper tests and build. The live host still has its previous loaded code until the normal restart.

## Exact next step
Finish CP2; production build and helper tests, restart the host, check `/api/calendar` authentication/ranges and source counts, compare source hashes/core content, write a fresh session note and commit. Then Xar tests and accepts or reports edits. PostgreSQL foundation follows Calendar feedback; native Study follows the foundation.

**Next prompt:** Continue Life OS. Read STATUS and the Stage 2 brief, finish CP2 and verify it. Do not start PostgreSQL yet.

## How to see it
Life OS: http://127.0.0.1:47850/. Once CP2 is complete, use `/calendar`, `/today`, `/court`, and `/ledger`. Account connection and PostgreSQL self-install instructions: `CONNECTIONS_SETUP.md`.

## Waiting on Xar / known limits
- Hands-on Calendar/Today review after CP2; no browser is connected to CUA here, so visual phone/ground checks remain pending.
- PostgreSQL self-install/login check; no password reset or installation performed. Data folder and off-laptop backup destination remain undecided.
- Old `code/life-os/.git` remains Xar's Session 0 step. Keep agents opened at the root.
- Do not run existing `hosting/app.test.mjs` or backend query tests: they initialise the live core DB. New calendar tests use fixtures only.
- Study's legacy summer dates do not supply a new-semester timetable. Opening Study makes its original page save. Cardiff choices are browser/origin-specific.

## Data
No migration. Core: 7 entries, 1 person, 12 spaces. Attached source files unchanged by provider reads. Backup through SQLite including WAL: `../Life_OS_backups/calendar-2026-10-05/core-before-calendar-1791206591099.db`; full Session 0 backup preserved. Verification scripts/hashes stay in ignored `.runtime/`.

## Recent sessions
- 2026-10-05 · Codex · Stage 2 CP1: `sessions/2026-10-05-codex-stage-2-providers.md`.
- 2026-10-05 · Claude Code · Session 0: `sessions/2026-10-05-claude-code-session-0-setup.md`.
- 2026-10-05 · Claude Cowork · planning: `sessions/2026-10-05-claude-cowork-planning-and-workflow.md`.
- 2026-10-01 · attaching four apps: `MIGRATION_HANDOFF.md`.
