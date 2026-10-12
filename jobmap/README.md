# JobMap

JobMap now runs inside Life OS: double-click **Start Life OS.cmd** in the Life_OS folder and open **JobMap** (or go to http://127.0.0.1:47850/jobmap). Life OS starts and stops JobMap's own server for you; the old Start JobMap.cmd is no longer used.

- **All jobs:** review potential part-time leads, tech and data roles, or the complete collection. Sort by match, location, application effort, deadline or your own priority.
- **Shortlist:** star the jobs you want to keep close.
- **Applications:** manage enquiries, preparation, submitted applications, interviews and offers.
- **Follow-ups:** add a follow-up date and a next step inside any job.
- Open a job to change its status, notes, priority and dates, read its full saved advert or open the original link. Text fields save automatically. Wait for **Saved locally** before closing.
- **Preferences:** edit your matching skills, role focus and preferred hours. Download or restore a full workspace backup here.

The app runs on this computer. It does not submit applications or contact employers. The local Codex scheduled search can add and refresh verified jobs through the importer described in SCHEDULED_SEARCH.md. Original adverts may require a Cardiff or job-board login. The initial collection was saved on 13 September 2026.

Matching is an explainable review aid based on the July 2026 UK CV skills, advertised role, location, hours, and known constraints. It does not infer hiring probability, sponsorship, legal work permission or an exact commute. “Easier to apply” ranks only the application steps captured in the advert. Missing source evidence stays unknown.

The original Excel files remain unchanged. There are 980 imported records: 772 Student Futures adverts and 208 records from the supplied workbook. 963 have saved original links; the other 17 can have links added in Edit details. Related records are retained rather than silently merged.

## Scheduled searches

Scheduled searches leave a batch file in `data/inbox/`, so a run does not depend on the app being open or local network access. While JobMap is running it checks that folder every minute, imports anything it finds and moves the file to `data/inbox/processed/`. New jobs arrive with the status **To review**.

Your own status, notes, priority and dates are never overwritten. When a scheduled check revisits an advert you already hold, only the advert's own details change — salary, hours, deadline, description — and your edits stay on top.

A batch that cannot be read is left in `data/inbox/failed/` with a short `.error.txt` beside it, and nothing is imported from it. Every import, good or bad, is written to `data/workspace/import-log.md`. The **Import history** is also visible at `http://127.0.0.1:47850/apps/jobmap/api/inbox`.

Batches are ignored a second time, so re-running a search or re-copying a file changes nothing.

## Local files

`data/jobs.json` is the unchanged source collection. Read `data/workspace-connection.json` to locate the owning workspace: its `data/workspace/progress.json` holds the current edits, added jobs and preferences for both interfaces. The connected Life OS app retains its old local progress file as a historical snapshot. Recent recovery copies are in the owner's `data/workspace/backups/`. The app also retains unsaved text drafts in this browser if a save fails. These drafts are removed after a successful save.

Use Download backup for a separate copy containing the original jobs and your progress. Moving the entire owning app folder preserves its source, progress and recent recovery files; update the connected interface's connection to that new location. Keep backups somewhere you can recover if this computer is lost.

Use **Stop JobMap.cmd** to stop the background service. Starting again reuses an existing JobMap service safely. The service listens only on this computer's loopback address.

## Maintenance

Node.js is required (already installed on this computer). Daily use needs neither npm installation nor an internet connection, except to open employer websites.

Run `npm run build` to rebuild the local interface, `npm test` for data/persistence/matching checks, and `npx tsc --noEmit` to check types. `node launch.mjs --no-browser` starts without opening a browser. `node launch.mjs --stop` stops the service.

The local build uses Vite and React. The existing Sites/Vinext scaffold is retained for development, with the same page component, but no site has been registered or published. Private files are excluded from source-control defaults.

The active local search is **UK Tech Job Shortlist — JobMap**, running Tuesday, Thursday, Saturday and Sunday at **3 pm UK time**. Keep the computer awake and Codex running. The former ChatGPT cloud shortlist is paused.

## Job dates

Each job shows Added to JobMap, Advertised and Closing date in the list and detail panel. Use Newest added or Recently advertised to sort; unknown dates sort last. Advertised and Closing date can be corrected under Edit details. Added dates are automatic and stay unchanged when a job is refreshed.

The original collection uses its documented saved date, 13 September 2026. Dates for 19 previously imported jobs were recovered from consecutive progress snapshots and completed import runs (see lib/legacy-dates.json); the London calendar date is used. Other missing dates remain unknown. Existing workbook dates are retained separately unless verified as publication dates. Backups preserve dates alongside application progress.

## My priority

My priority is the default sort. It ranks jobs still worth pursuing before applications already sent and closed adverts. Within current paid part-time possibilities, saved deadlines today, tomorrow and the next 7 days lead, earliest first. For equal urgency, your High/Normal/Low/Later setting comes next, followed by match, shortlist and the next known deadline. Jobs with full-time or excessive hours needing agreement, and graduate/unpaid/freelance leads, sit lower. Unknown deadlines do not acquire invented urgency. Follow-ups retain their own due-date order.

Each row explains its priority; an opened job explains the assessment and your personal setting. The order updates on a new London calendar day and when the window regains focus. Closing soon also puts closed adverts after open ones.

Both app copies use identical feature code and relative API/asset paths. Run `npm run check:parity -- "<other JobMap folder>"` after shared changes or source reconciliation. It checks implementation, the shared workspace connection, vacancy evidence and personal choices. Source differences require deliberate, backed-up reconciliation; never overwrite a workspace with the other copy.

To reconcile older source differences, start each normal host, then preview `node reconcile-sources.mjs http://127.0.0.1:47841/api http://127.0.0.1:47850/apps/jobmap/api`. After reviewing the plan, add `--apply`. It uses the two local APIs, snapshots both proposed workspaces, keeps each server's recovery backup, rejects equally dated conflicting evidence and preserves all existing personal fields. It carries over saved historical closed records for collection parity; routine searches still skip new closed adverts. A repeat preview should contain no additions or updates.

## One workspace in both apps (12 October 2026)

Standalone JobMap and JobMap inside Life OS now use one saved workspace. Stars, notes, archive choices, application stages, dates, added jobs and matching preferences saved in either interface appear in both. Each tab can still use its own search, view and sort. Life OS retains its shared styles.

`data/workspace-connection.json` in each app identifies the owning app folder and local API. The standalone server is the only writer to that workspace; Life OS forwards its API requests and starts the owner automatically when necessary. Revision checks protect simultaneous edits. Existing open tabs refresh their records on the usual idle/focus poll. Stopping the Life OS JobMap interface leaves the owner's workspace available.

The owning workspace is `data/workspace/progress.json` under the standalone app. The Life OS copy's old progress file is retained as a pre-connection snapshot and is no longer active. Read the connection before reading saved progress; queue-jobs and import-jobs resolve it automatically. Back up from either interface to export the same current workspace. Moving a connected app requires updating its connection or restoring its exported backup into a reviewed independent installation.

Search findings and inbox receipts stay in each app's own folders. The owner polls both inboxes; duplicate runIds change the workspace once, and each queued file gets its own processed/failed receipt and import log entry. Scheduled searches must continue saving and validating findings for both copies. A repeated batch reported as unchanged is already in their shared workspace.

The initial merge used `reconcile-workspace.mjs` through revision-protected APIs, with recovery snapshots of both originals and the proposed merge. It combines compatible explicit choices, preserves notes and activity, uses the first known Added date across the apps, and refuses conflicting explicit values. It does not copy either progress file over the other. Original per-copy dates remain in the recovery snapshots.
