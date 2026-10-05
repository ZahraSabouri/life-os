# 2026-10-05 · Claude Code · Session 0 · setup

## Goal
Xar gave the Continue prompt. No brief exists yet and `STATUS.md` named Session 0 as the next step, so this session did Session 0 (prompt 1 in `WORKFLOW.md`): setup only, no app features.

## What I did
- **Reality check:** matched `STATUS.md`. `v2-subapps` level with GitHub, only the 5 October documents uncommitted, Life OS not running (last run 1 October).
- **Step 1:** marked the folder safe for git (it is owned by the Codex sandbox account), after checking that `.git/config` and the hooks held nothing unusual.
- **Step 2:** deleted the empty `.git/stale-index-lock-from-claude-2026-10-05`.
- **Step 3:** committed the planning documents exactly as Cowork wrote them.
- **Step 6, done early because the app was stopped:** copied the whole folder (without `node_modules` and `.git`) to `Projects\Life_OS_backups\full-2026-10-before-development`: 4,102 files, 1,365,155,925 bytes (1.27 GB). Beside it: a SHA-256 list of every file, SQLite-made snapshots of the two databases, and a README.
- **Step 7:** started Life OS (Xar asked for it, to test) and checked that all four apps open. Budget is still at revision 91: no real save through Life OS yet.
- **Step 4:** `main` fast-forwarded to `v2-subapps`, tagged `pre-development-2026-10`, both branches and the tag pushed. The working copy is on `main`.
- **Step 5 was not done:** Claude Code's permission check refused the move of `code/life-os/.git`. See below.
- Documents updated to match: `STATUS.md`, the branches in `README.md`, and the housekeeping lines in `ROADMAP.md` and `Life_OS_Plans_Inventory.md`.

## Files and commits
- `c9e2635` [session-0] Planning documents for the unified app, and the session workflow
- The commit that adds this note: [session-0] Session note, status and housekeeping after setup (tagged `pre-development-2026-10`)
- Outside git: `Projects\Life_OS_backups\`, and one `safe.directory` line in the Windows user's git settings.

## How I checked it
- **Backup:** robocopy reported 4,102 files copied, 0 failed, 12 folders skipped (8 `.git`, 4 `node_modules`). A script then compared file lists, sizes and SHA-256 for all 4,102 files: nothing missing, extra or different.
- **SQLite snapshots:** `PRAGMA integrity_check` ok, and every table's row count equals the source's.
- **App:** `/__life-os/health` lists the four apps, with Budget and JobMap running; every route answers 200. I rendered `/court`, `/study`, `/cardiff-life`, `/budget` and `/jobmap` in headless Chrome with a throwaway profile and looked at each screenshot: all show real data.
- **Core API:** 401 without the token, 200 with it; 7 entries and 1 person, the same as the database counts.
- **Tests:** `node --test code/life-os/backend/test/entryTypes.test.js`: 6 pass. The other two test files were not run (below).
- **GitHub:** an anonymous read is refused, so the repository is private. `git ls-remote` after the push shows `main`, `v2-subapps` and the tag on the same commit.

## Data touched
I edited no data. Backups: above.

Starting and opening the apps made them save, as they do when Xar opens them:
- **JobMap** imported the scheduled-search batch waiting in its inbox (`2026-10-05-morning.json`): 12 added, 0 updated, 0 skipped. Workspace revision 15 → 16; jobs shown 998 → 1,010.
- **Summer Rescue** rolled its day forward when its page was opened: 64 "overdue" notifications dated 5 October, a `2026-10-05` snapshot, and `referenceDate`. Compared key by key with the backup: all 89 earlier notifications and both earlier snapshots are unchanged, and cards, notes and resources are identical.
- **Core database:** every server start re-seeds the same 12 spaces.
- **Budget:** unchanged (revision 91, 86 automatic backups).

Counts for Stage 1a's "before": core `entries` 7, `people` 1, `spaces` 12, every other table 0. Summer Rescue's mirror at backup time: `cards` 128, `checklist_items` 460, `modules` 4, `phases` 3, `notifications` 89, `settings` 12.

## Problems and surprises
- **The `code/life-os/.git` move was refused** by Claude Code's permission check, as "irreversible local destruction". I didn't retry it. Checked beforehand: all 23 of its commits are in the main repository, and it has no stashes or extra branches, so moving it loses nothing. It is Xar's step now.
- **Two test files write to the real database.** `code/life-os/backend/test/query.test.js` inserts and deletes two entries in `life-os.db`; `hosting/app.test.mjs` opens it, and loading `db.js` re-seeds `spaces`. Not run. Stage 1a should give tests their own database (`lifeos_test`).
- **Opening Study is not read-only** (above). Stage 2's read-only adapter should read Summer Rescue through its API, not load its page.
- The core database had a 49 KB write-ahead log beside it although the app was stopped (the server was probably not stopped cleanly after 1 October), so `life-os.db` alone was not the whole database. The backup holds all three files and the snapshot.
- The core API token is the built-in default (there is no `backend/.env`). Fine while the server only listens on this laptop; change it before phone access.
- `jobmap/data/` holds 10 `test-*` folders left by JobMap's own tests in September. Untouched.

## Small decisions I made, and questions for Xar
- Ran Session 0 under the Continue prompt, because `STATUS.md` named it as the next step and there is no brief.
- Took the backup before the git steps: the app was stopped, and Xar wanted it started.
- Fast-forward merge (`main` was a straight ancestor). The tag sits on the session's last commit, so the tagged state includes this note and the new `STATUS.md`.
- Added the SHA-256 list, the SQLite snapshots and the README to the backup. Left Life OS running, because Xar is testing.
- **Questions:** will you move `code\life-os\.git` yourself, or tell an agent you allow it? Where should backups also go off the laptop?
- **Xar asked** whether an agent can pull her timetable and other data from SIMS and Learning Central while she is logged in. Not from a coding session: it sees files on the laptop, not her browser. The planned route stands (Stage 3: a calendar link for the timetable if Cardiff offers one, exported files for the rest). Worth checking whether the timetable page offers a calendar subscription.

## Next step
Xar: the first real Budget save, and the `.git` move. Then plan Stage 1a with Claude in Cowork (prompt 2 in `WORKFLOW.md`).
