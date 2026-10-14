# Stage 4a: JobMap refresh (newest version, one workspace, the Study hub's look)

**Status:** asked for by Xar on 7 October 2026 and built the same day · waiting for her check
**Branch:** `stage/4a-jobmap-refresh` (cut from `stage/3-study-hub`)

## Goal
The JobMap inside Life OS is the newest JobMap (each job shows when it was added, when it was advertised and when it closes), holds every job and every personal choice from both places JobMap was used, and looks like part of the Study hub, following the Life OS Style menu. This is the attached JobMap brought up to date; rebuilding Career natively is still Stage 4 in `../ROADMAP.md`.

## Read first
`jobmap/README.md`, `jobmap/SCHEDULED_SEARCH.md`, `jobmap/lib/store.mjs`, `hosting/jobmap.mjs`, `code/life-os/frontend/src/styles/skins.css`, and the standalone app's `UPDATE_REPORT_2026-10-07.md` in `Documents\JobMap\Career Agent\JobMap App`.

## In scope / not in scope
- In: the Life OS copy of JobMap (`jobmap/`), its data, its look; publishing the chosen style to framed apps. From 8 October: scheduled-search delivery and shared JobMap development maintain both app copies, as Xar instructed.
- Not in: the looks of Budget, Cardiff Life and the Study hub; the native Career rebuild. The earlier standalone-read-only and automation exclusions were superseded by Xar's 8 October maintenance instruction.

## Checkpoints

### CP1: The newest version, one workspace
- [x] The newer code copied in: job dates (`lib/job-dates.mjs`, `lib/legacy-dates.json`), store, discovery, matching, server, launcher, page, tests. Kept from the Life OS copy: addresses relative to where the app is served (`vite.local.config.ts` and the `api/…` addresses in `app/page.tsx`), and its own README wording.
- [x] `scripts/merge-jobmap-workspaces.mjs` merges the standalone workspace into the Life OS one after copying the data aside. A vacancy both held under different ids is kept once; jobs only Life OS held are carried over with what was saved about them; personal fields that disagree stop the merge.
- **Done when:** JobMap in Life OS shows the three dates on every job, no advert link twice, and nothing she saved is missing.
- **Verify:** JobMap's four test suites; counts before and after; the list of carried-over jobs; the calendar.
- **Commit:** `9adabbf`, `af45c22`.

### CP2: The Study hub's look and the Style menu
- [x] `jobmap/app/skin.css` comes after the standalone stylesheet and changes colour, type and shape only: the Study hub's colours, fonts (copied into `jobmap/public/fonts`), corners and shadows. The standalone stylesheet is untouched, so a newer JobMap can be dropped in again.
- [x] Life OS publishes the chosen style's colours for framed apps (`frontend/src/lib/frameSkins.js`, from `styles/skins.css`); `jobmap/public/skin-boot.js` puts them on the page. Modern is the Study hub's look; Madder, Indigo and Paper use the Life OS colours.
- **Done when:** JobMap looks like the Study hub, and changes with the Style menu without a reload.
- **Verify:** pictures of the live JobMap in the four styles; an opened job, a dialog and phone width on a private preview.
- **Commit:** `[4a-cp2] JobMap wears the Study hub's look and follows the Style menu`.

### CP3: Scheduled searches maintain both copies (configured 8 October 2026)
- [x] Xar decided to update both apps during scheduled searches and further development. The existing automation now names both absolute app paths, compares both collections, dry-runs and queues each batch separately, and checks each copy's import result. Its schedule is unchanged.
- [x] Persistent instructions are present in both apps and in the standalone workspace and career guidance. Shared development must preserve Life OS integration and personal workspace data.
- **Verified:** automation update succeeded and saved fields were checked; both app paths and the shared search procedure were checked. Application code and data were not changed.
- **Next scheduled run:** confirm actual queue/import outcomes separately in both copies. This configuration check does not claim a job-search batch was delivered during this session.
- The earlier scope excluding standalone writes and automation settings is superseded by Xar's 8 October instruction for this maintenance work. The previous merge command is not a routine replacement for delivering findings to both inboxes.

## Data safety
Both copies receive scheduled findings through their own validated inboxes; personal workspace files are never copied over each other. For a separate reconciliation, before the merge the whole Life OS JobMap data folder is copied to `../Life_OS_backups/jobmap-before-merge-<time>/`, and the previous workspace is also kept in JobMap's own backups list. The merge refuses to run while JobMap is running.

## Tests
`cd jobmap && npm test` (four suites: verify, discovery, inbox, dates). The merge checks its result with JobMap's own workspace validation and for repeated advert links.

## Acceptance checklist for Xar
1. Life OS → JobMap: 1,013 jobs. Each row shows "Added to JobMap", "Advertised" and "Closing date". The sort menu has "Newest added" and "Recently advertised".
2. Shortlist 32, Applications 1; the Site Reliability job you archived is under Archive.
3. Open a job → Edit details: the advertised date can be typed in.
4. It looks like the Study hub. Style → Madder, Indigo or Paper: JobMap changes with it at once.

## Risks and open questions
- Scheduled delivery is configured for both apps; check actual outcomes at the next scheduled run.
- In Madder, Indigo and Paper the Study hub itself keeps its own look, so JobMap and the Study hub only match each other in Modern.
