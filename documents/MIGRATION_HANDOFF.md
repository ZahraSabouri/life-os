# Consolidating the local apps into Life OS

> **Frozen on 5 October 2026.** This is the history of the sessions that attached the four apps (1 to 8). The current state is in `STATUS.md`, session notes are in `sessions/`, and the way of working is in `WORKFLOW.md`.


Assessment: 1 October 2026. Proposed sequence, not a fixed roadmap.

## User's current request

Bring the entire functionality and existing data of Summer Rescue, Budget Management, JobMap, and the Event/Cardiff Life app into Life OS. Keep existing module interfaces initially; visual matching is deferred. The eventual result must run independently of the standalone source folders, which the user intends to delete later. Do not delete anything as part of this assessment.

Work in small sessions, alternating Codex and Claude Code. Keep discovery cheap: read this handover and relevant project notes before inspecting only the code needed for the current module. This session performed documentation and file-location checks only; no implementation, database inspection, browser export, or runtime verification.

The user confirmed the scope: Cardiff Life, Summer Rescue, JobMap and Budget Management, all into the existing Life OS app. All five were located. No additional Event app is required.

## Located projects and documented storage

Paths below are relative to `C:\Users\ctrlz\Documents`.

- Destination candidate: `Personal\Projects\Life_OS\code\life-os`. Its README describes Express + SQLite and Vite + React. `backend\data\life-os.db`, `-wal`, and `-shm` exist. Confirm the current runnable app and completed features before planning schema changes. Root README refers to an older `life-os-app` layout; July build briefs are proposals/history, not proof of completion.
- Summer Rescue: `Personal\Projects\Life_OS\summer-rescue-plan-app`. README documents primary JSON state, typed NDJSON progress history, SQLite mirror, uploaded resources, curated study assets, browser recovery copies, and export/import. `local-data` state, log and database exist. Determine whether Life OS already includes some study features and which copy has the latest user data before importing.
- Budget: `BudgetManagement` is the permanent project according to its README; `Budget Management` also exists and must not be assumed authoritative. Live state is `data\state.json`; include backups, purchase references, receipt evidence and original artwork. Preserve receipt/stock relationships, allocations, portions, money rules and uncertain item identities. Older catalogue observations must not become new spending.
- Jobs: `JobMap\Career Agent\JobMap App`. Include `data\jobs.json`, `data\workspace\progress.json`, recovery copies, discovery batches, inbox/processed/failed files and import history. Review relevant application files elsewhere under JobMap separately. Preserve personal notes, priorities, stages, follow-ups, preferences, deduplication and import behaviour. Scheduled tasks may still target the old folder; inspect their current configuration at cutover.
- Events: `Cardiff Life`. Include `events.csv`, `events.md`, `communities.md`, `history.md` and weekly-planner functionality. Personal choices/notes are separately stored in browser localStorage: use **Updates & backup → Export my choices** in the browser where the user actually used the app. Preserve event/community IDs, source provenance and the distinction between listing availability and personal plans. Current automation status was not verified.

## Proposed session sequence

1. Confirm app identities, launchers and authoritative data copies. Run Life OS to establish what already works. Create a concise module checklist and inventory of data, assets, external file links and scheduled writers.
2. Make recoverable backups and browser exports. Use consistent SQLite snapshots or stop writers before copying; copying only an active `.db` file can miss WAL changes. Record file hashes and meaningful record counts before import. Avoid edits in both old and new versions during final cutover.
3. Prepare Life OS module routes, owned storage, shared file handling, backup/restore and one launcher. Prefer the existing Life OS backend. Keep specialized module data structures where needed; do not flatten accounting or study history into generic entries and lose behaviour. Shared calendar/search can be added through explicit mappings.
4. Migrate one complete module per session: proposed order is Cardiff Life as a small pilot, Summer Rescue, Budget Management, then JobMap. Split any module into import and interface sessions if needed, with explicit completion criteria. Use repeatable imports with source-ID mappings to prevent duplicates.
5. For each module verify imported records and files, representative workflows, saving/restart, backup/restore, and preserved calculations/history. Record failures and exact checks; do not declare success from a build alone.
6. Repoint scheduled writers/import queues, resource links and launchers to Life OS. Verify the app works while the original folders are temporarily unavailable. Archive originals with a verified recovery copy; deletion is a later user-directed step after normal use and acceptance.

## Session continuity

One agent edits at a time. At each handover update this file with: completed work, changed files/commit, migration run and source snapshot, checks/results, known problems and the next bounded task. Do not rely on either agent's conversational memory. Store any detailed module notes separately and link them here.

## Original next prompt (superseded, see end of file)

“Read AGENTS.md and documents/MIGRATION_HANDOFF.md. Prepare the migration foundation: confirm the current Life OS app and authoritative source copies, establish a runnable baseline, and create the backup/export and module completion checklists. Read only relevant handovers and necessary code. Preserve all data and current interfaces. Do not migrate a module or delete standalone apps yet. Update the handover for Claude/Codex.”

## Session log

### Sessions 2–3 (Codex, then Claude): Summer Rescue attached as a sub-app — DONE

User direction (supersedes the pilot order above): keep the old Life OS folder intact, work in a fresh copy, attach each app unchanged as a sub-app (only host/URL fixes), one app at a time.

- Original folder preserved as `Personal\Projects\Life_OS_preserved_2026-10-01` (1,877 files hash-verified unchanged). Working copy is `Personal\Projects\Life_OS`.
- Single host: `hosting/server.mjs` + `hosting/app.mjs` (Express, port 47850, `127.0.0.1`). Start/Stop via `Start Life OS.cmd` / `Stop Life OS.cmd` (`launch.mjs`). Health: `/__life-os/health` lists sub-apps.
- Summer Rescue lives at `Life_OS\summer-rescue-plan-app`, built with `--base=/apps/summer-rescue/` and served there; its original local API (`localTrackerApi`) is mounted first so saved resource URLs keep working. Only change to its code: absolute `/asset` paths became `import.meta.env.BASE_URL` (App.jsx, AppIntro.jsx).
- Life OS `/study` route now shows Summer Rescue in a full-screen same-origin iframe (replacing the redesigned Study Hub room, which still exists in the preserved copy and under `frontend/src/rooms/study-hub`, unused). Hash deep links are mirrored to `/study#/...` (polling, because the sub-app uses replaceState) so reloads restore the view. Verified by Claude: `/study#/time-series` reload restores Time Series.
- Session 3 addition (user-approved): a small Life OS-owned "← Life OS" pill bottom-left above the frame, navigating to `/court`. Summer Rescue untouched.
- Verification: 19 tests pass (Codex), 208 study resources respond, saving/uploads/restart pass, no console errors. Data backups in `migration/backups/` (git-ignored). `migration/verification.json` holds hashes and counts.
- Build note: `node_modules` are Windows builds. Rebuild with `Build Life OS.cmd` on Windows. Agents in a Linux VM must copy `frontend` (without node_modules) plus `code/life-os/shared` to a scratch dir, `npm ci`, build there, and copy `dist` back. Never move `dist` away before the new build succeeds.

### Pattern for the next sub-apps
Same recipe: copy the app folder into `Life_OS\<app>`, serve its UI under `/apps/<id>/` and its API/data routes through `hosting/app.mjs` (mounted before Life OS's `/api`), add a Life OS route that frames it with the back pill, add it to the health `subapps` list and the Court navigation, back up its data first, and verify saves land in the copy inside `Life_OS`, not the standalone folder.

### Session 4 (Claude): Cardiff Life attached as a sub-app — DONE

- Source `Documents\Cardiff Life` (13 files) backed up to `migration/backups/cardiff-life-source-2026-10-01` and copied to `Life_OS\cardiff-life`; hashes in `migration/cardiff-life-source.sha256`. Source left untouched. User confirmed there is no browser data to export yet.
- Host: `hosting/app.mjs` serves it statically at `/apps/cardiff-life/` (`.md`/`.csv` as text/plain, like opening locally) and lists it in health `subapps`.
- Frontend: `StudyRoute` generalised into `SubAppFrame({ route, documentPath, title })` in `App.jsx`; new `/cardiff-life` route; "Cardiff Life" button in `CourtLayout` nav; the Court's Relationships room opens it (`TheCourt.jsx onOpenRoom`).
- Verified in browser: page loads in the frame, tabs work, localStorage works in the frame (key prefix `cardiff-life-choices-`, no clash), back pill works, Summer Rescue still works, no console errors. Cardiff Life has no hash routing, so reload returns to My week (same as the original).
- **Open item:** the Codex scheduled searches (`cardiff-life-su-university` Thu 09:00, `cardiff-life-eventbrite-wider-cardiff` Fri 09:00, paused Outlook) still update `Documents\Cardiff Life`. Repoint them to `Personal\Projects\Life_OS\cardiff-life` in Codex, and re-copy any files they changed in the meantime, before deleting the old folder.
- Restarting the server: run `Stop Life OS.cmd` then `Start Life OS.cmd` (needed after `hosting/` changes; frontend rebuilds only need a page reload).

### Session 5 (Claude): Budget Management attached as a sub-app — DONE

- Source `Documents\BudgetManagement` (1,525 files, 646 MB, excluding `_to_delete`) copied with robocopy (`scripts/copy-budget.cmd`, log `migration/budget-copy.log`) to `Life_OS\budget-management`. Sizes match for every file; data/ and app/ hashes match (`migration/budget-management-data-app.sha256`). Source unchanged. Live state at copy time: revision 91 (saved 26 Sep), 110 expenses.
- How it runs: Budget keeps its own unchanged server (`app/server-v2.cjs`). `hosting/budget.mjs` starts it as a child of Life OS on private port 47851 (env points data/art dirs at the copy), stops it through its own `/__planner/stop` (waits for in-flight saves), and refuses to reuse a server from a different folder. `hosting/app.mjs` forwards `/apps/budget/*` to it, keeping its checks: local host only, same-origin only (Origin rewritten to the private address after that check). Health lists `budget` with `running`.
- Only code change in the app: 11 root-absolute URLs made relative (`/api/…`, `/art/…`, `/guide.html`) in `src/product.js`, `src/product-dialogs.js` and `dist/index.html`. `node build.cjs` reproduces dist exactly, so src and dist stay in sync.
- Frontend: `/budget` route via `SubAppFrame`, "Budget" nav button, Court Home room opens it.
- Browser data: `Transfer Budget browser data.cmd` (`scripts/transfer-budget-browser-data.mjs`) briefly listens on the old addresses, saves that browser's storage to `budget-management/browser-data/origin-<port>-<time>.json`, then opens `/__life-os/budget-browser-import`, which adds missing keys at the Life OS address and never overwrites. Run on 1 Oct in Chrome: :47831 had the old pre-v2 plan plus 2 safety copies (13/4/12 expenses), :47841 had the disk cache (rev 91) and a layout setting. All 5 added in Chrome (confirmed by user). The app's "old version spending" check reads these keys, so it keeps working.
- Verified in browser: loads with real data (rev 91, 110 expenses, 374 artwork files), `#/money` deep link survives reload, images and guide load, a deliberate stale-revision PUT returned 409 and wrote nothing (proves saves reach the planner through the proxy), Life OS `/api` still requires its token. A real save was not made, to leave your data untouched.
- Do not run the old `Start Budget Management.cmd` any more: it edits the old folder's data, not Life OS's.
- Not run: `hosting/app.test.mjs` (Windows-only node_modules, and it opens the real Life OS database). Run on Windows: `node --test hosting/app.test.mjs`.

### Session 6 (Claude): JobMap attached as a sub-app — DONE

- Source `Documents\JobMap\Career Agent\JobMap App` (27,884 files incl. node_modules, 653 MB) copied with robocopy (`scripts/copy-jobmap.cmd`, log `migration/jobmap-copy.log`) to `Life_OS\jobmap`. No failures; the 188 files outside node_modules/.next/.wrangler hash-match (`migration/jobmap-source.sha256`). Source unchanged. `data/` also backed up to `migration/backups/jobmap-data-before-first-life-os-run`.
- How it runs: JobMap's own `server.mjs` is started by Life OS (`hosting/jobmap.mjs`) on private port 47852 and stopped through its own `/api/stop`. Its 1-minute inbox poller now watches `Life_OS\jobmap\data\inbox`. The shared proxy moved to `hosting/proxy.mjs` (Budget uses it too). JobMap's CSP said `frame-ancestors 'none'`; the proxy changes only that to `'self'` so Life OS can show it.
- Changes to JobMap: 9 `/api/` fetches made relative in the built JS and `app/page.tsx`; `/assets` and `/favicon.svg` made `./` in `dist/client/index.html`; `base:'./'` added to `vite.local.config.ts` for future builds (not rebuilt here, Windows-only node_modules). README and SCHEDULED_SEARCH.md in the copy now point at the Life OS paths/addresses.
- First run imported the 5 queued scheduled-search batches that were waiting in the inbox (980 → 998 jobs, workspace revision 10 → 15), into the copy only.
- Browser data: JobMap only keeps unsaved text drafts (`jobmap-draft:*`) at 127.0.0.1:47841. The 1 Oct export of that address (saved with Budget's browser data) held no JobMap keys, so there was nothing to move.
- Frontend: `/jobmap` route, "JobMap" nav button, Court Career room opens it.
- Verified in browser: loads with real data, Life OS framing allowed, backup download works through the proxy, a stale-revision PATCH returned 409 and changed nothing, Budget still works after the proxy refactor.
- Scheduled writers: Claude scheduled task "Cardiff job search to JobMap" (Mon/Wed/Fri) repointed, with the user's approval, to `Life_OS\jobmap\data\inbox`, and `Career Agent\Scheduled search\PLAYBOOK.md` inbox/log paths updated (old copy in `migration/backups/PLAYBOOK.before-jobmap-move.md`). Its last run (21 Sep) had failed, before this change. **Still to repoint in Codex:** the "UK Tech Job Shortlist — JobMap" search (Tue/Thu/Sat/Sun 3 pm), which works in the old JobMap App folder.
- Do not use the old `Start JobMap.cmd` any more. Before deleting `Documents\JobMap`, note that only the `JobMap App` folder moved: the Excel workbooks, `Career Agent\AGENTS.md`, the Scheduled search playbook/batches and `!UK` notes still live there and are used by the scheduled task.

### All four apps attached
Remaining cutover work before deleting originals: repoint the Codex automations (Cardiff Life searches, JobMap shortlist), use Life OS normally for a while, then archive the originals with a verified copy. Later: shared search/calendar across modules and matching the Life OS design.

### Session 7 (Claude): everything put under version control and pushed — DONE

- The git repository is now the `Life_OS` folder itself (it used to cover only `code/life-os`). Same GitHub repository, `ZahraSabouri/life-os` (private); earlier history is kept, and the core app's move into `code/life-os/` is recorded as pure renames.
- Branches: `v2-subapps` is this version, one commit per step (restructure, documents, each of the four apps, host and launcher, Life OS shell, docs). `v1-pre-subapps` is Life OS as it was before any app was attached, including the Study Hub changes that had been sitting uncommitted. `main` on GitHub was not touched; merge `v2-subapps` into it when ready.
- Code only. Personal data and large media are ignored (see the README section "What git holds, and what it doesn't" and `.gitignore`), so GitHub is not a backup of the data. Exceptions tracked on purpose: Cardiff Life's research files (they are the app's content), Budget's `app/dist` and three older plan snapshots its tests read, and JobMap's `dist/client` (the hand-edited build, the only one confirmed working).
- `.gitignore` gained a Budget Management section and `*.bak-*`. The root README was rewritten for the new layout. No app code or data was changed. Budget's test suite was run (163 pass); `hosting/app.test.mjs` was not, because it opens the real database.
- The old nested repositories are still on disk and were not altered: `code/life-os/.git` (now redundant; git commands run inside `code/life-os` still go to it), `summer-rescue-plan-app/.git` (its own GitHub repository, which has newer commits than this copy) and `budget-management/app/.git`. Remove or keep them as you prefer; the root repository ignores them.
- The folder is owned by the Codex sandbox account, so git refuses to run in it for the normal Windows user until it is marked safe: `git config --global --add safe.directory C:/Users/ctrlz/Documents/Personal/Projects/Life_OS`.

### Session 8 (Claude in Cowork, 5 Oct): planning the unified app — DONE (documents only)

- No code or data changed. Read every document in `documents/` (here and in the preserved copy), the git history and the relevant code, then talked the direction through with Xar.
- Agreed: one unified app (the attached apps are rebuilt one by one as native sections); Home leads with Today and keeps the room doors below; the calendar ties every area together; three ways in (by hand, import with AI instructions and connectors, built-in AI later); Study keeps Summer Rescue's behaviour; **PostgreSQL from day one** (Xar's decision); a modular monolith with no Redis/RabbitMQ/MongoDB; counts at each module move; other users in the late stages. Full list: `DECISIONS.md` (5 October).
- Order: Stage 0 use Budget now → 1 Foundation (PostgreSQL, home, import pipeline) → 2 Calendar and Today across all apps → 3 Study → 4 Career → 5 Money & Home → 6 Cardiff Life → 7 the rest. See `ROADMAP.md`.
- New: `ROADMAP.md`, `Life_OS_Architecture.md`, `DECISIONS.md`, `Life_OS_Plans_Inventory.md`. Updated: `Life_OS_Vision.md`, `Life_OS_Stack_Notes.md`, the root `AGENTS.md` (rules for agents at the top) and `README.md`. Short dated notes added at the top of the July architecture, Taxonomy, Implementation Handoff, Data Dictionary, `data-model/README.md` and the three build briefs. All uncommitted: commit them from Windows.
- Facts checked: Budget's last save is revision 91 (26 Sept) in both the old and the Life OS copy, so October isn't recorded anywhere yet and nothing has split; October 2026 is configured in Budget (£250 total). The core SQLite database file is in WAL mode (header bytes 18–19 = 2). Summer Rescue's module pages, exam dates and materials are hard-coded for the four summer modules.
- Mishap, fixed: a `git status` run from the Cowork VM left an empty `.git/index.lock` that it couldn't remove across the shared-folder link. It was renamed to `.git/stale-index-lock-from-claude-2026-10-05` so git works again; that empty file can be deleted from Windows. `AGENTS.md` now tells Cowork agents not to run git in the shared folder.

## Next prompt

Superseded: see the "Next prompt" in `STATUS.md`.
