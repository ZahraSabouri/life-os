# Stage 7 inventory: what holds something personal, and what becomes of it

**Private.** Written by `node scripts/privacy-inventory.mjs` on 2026-11-04 from `scripts/privacy-scan.mjs` (generic patterns plus the owner's markers in `.private/markers.txt`). Paths and counts only. 373 tracked files hold something personal.

## Private, never in the public version (203 files)
Project memory and agent instructions, events research, one-off migrations, personal planning and receipts, and the course materials (also someone else's copyright). They stay in this working copy.

- **documents**: 122 files, 822 lines
- **code/life-os/frontend/public**: 53 files, 240 lines
- **budget-management**: 11 files, 153 lines: `Pictures to provide.md`, `START HERE.html`, `app/tools/import-morrisons-2026-09-08.cjs`, `planning/01-functional-upgrade-plan.md`, `planning/03-image-briefs.md`, `planning/build-review.py`, `planning/image-briefs.json`, `planning/image-studio.html`, `recheck-2026-09-25/before.json`, `reconcile-september.cjs`, `review-purchases.cjs`
- **migration**: 6 files, 126 lines: `budget-copy.log`, `cardiff-life-source.sha256`, `initial-copy.json`, `jobmap-copy.log`, `summer-rescue-real-copy.log`, `verification.json`
- **jobmap**: 3 files, 27 lines: `AGENTS.md`, `JOB_SOURCES.md`, `SCHEDULED_SEARCH.md`
- **mail**: 3 files, 17 lines: `AGENT-PROMPTS.md`, `CODEX-GATHER-PROMPT.txt`, `GATHER.md`
- **cardiff-life**: 2 files, 16 lines: `AGENTS.md`, `Codex Project Instructions — Cardiff Life.md`
- **scripts**: 2 files, 2 lines: `move-summer-life-data.mjs`, `move-summer-shopping-to-budget.mjs`
- **AGENTS.md**: 1 files, 19 lines: `AGENTS.md`

## Configure: a home folder, an address or a key in code (12 files)
CP2 moves these into configuration with a committed example.

- **jobmap**: 4 files, 15 lines: `app/page.tsx`, `dist/client/assets/index-ClABXpb-.js`, `dist/client/assets/index-DUc2qDGe.js`, `tests/verify.mjs`
- **code/life-os/frontend/src**: 2 files, 3 lines: `components/health/HealthFood.jsx`, `lib/useDayPage.js`
- **hosting**: 2 files, 14 lines: `app.mjs`, `health/food.mjs`
- **budget-management**: 1 files, 1 lines: `README.md`
- **cardiff-life**: 1 files, 22 lines: `README.md`
- **mail**: 1 files, 11 lines: `HARVEST.md`
- **summer-rescue**: 1 files, 2 lines: `public/study-assets-manifest.json`

## Make generic: names, places and courses in code (158 files)
CP4: courses and cards become data with an example set; "Cardiff Life" becomes Events with a city setting; tests and examples use made-up places; the Guide and labels are anyone's.

- **summer-rescue**: 49 files, 534 lines
- **code/life-os/frontend/src**: 43 files, 255 lines
- **hosting**: 23 files, 64 lines
- **budget-management**: 12 files, 23 lines: `app/dist/index.html`, `app/launch.ps1`, `app/server-v2.cjs`, `app/src/app.js`, `app/src/core.js`, `app/src/views.js`, `app/tests/budget-rollover.test.cjs`, `app/tests/connected.test.cjs`, `app/tests/fixtures/allocations-before-review.json`, `app/tests/fixtures/stock-before-review.json`, `app/tests/v2-editing.test.cjs`, `app/tools/allowance-and-spread.cjs`
- **jobmap**: 8 files, 18 lines: `README.md`, `lib/matching.mjs`, `tests/discovery.mjs`, `tests/inbox.mjs`, `tests/insights.mjs`, `tests/priority.mjs`, `tests/repeats.mjs`, `tests/workspace.mjs`
- **cardiff-life**: 5 files, 28 lines: `build_html.py`, `html_template.html`, `planner.js`, `tests/planner.test.cjs`, `university.js`
- **code/life-os/backend/src**: 4 files, 9 lines: `migrations/mail/0002_items.sql`, `modules/mail/integration.test.js`, `modules/mail/pages.test.js`, `modules/mail/router.js`
- **mail**: 4 files, 10 lines: `README.md`, `check-batch.mjs`, `example-batch-v2-kinds.json`, `example-batch-v2.json`
- **code/life-os/frontend/test**: 3 files, 16 lines: `calendar-views.test.js`, `calendar.test.js`, `inbox-render.test.jsx`
- **scripts**: 2 files, 18 lines: `guide-shots.mjs`, `mail-import.mjs`
- **.gitignore**: 1 files, 13 lines: `.gitignore`
- **README.md**: 1 files, 3 lines: `README.md`
- **code/life-os/shared/harvest.js**: 1 files, 5 lines: `code/life-os/shared/harvest.js`
- **code/life-os/shared/harvest.test.js**: 1 files, 5 lines: `code/life-os/shared/harvest.test.js`
- **code/life-os/shared/rooms.js**: 1 files, 1 lines: `code/life-os/shared/rooms.js`
