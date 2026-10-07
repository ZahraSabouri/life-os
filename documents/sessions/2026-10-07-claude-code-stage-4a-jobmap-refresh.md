# 2026-10-07 · Claude Code · Stage 4a · CP1 and CP2 (JobMap: newest version, one workspace, new look)

## Goal
Xar saw a newer JobMap on her computer than the one inside Life OS. Bring the newest version in (job dates), and make JobMap look like the Study hub and follow the other styles.

## What I did
- **Found the newer version:** `Documents\JobMap\Career Agent\JobMap App`, updated on 6 and 7 October (its `UPDATE_REPORT_2026-10-07.md`). It is not a git repository. It was only read.
- **Code:** copied the newer files into `jobmap/`, keeping the Life OS copy's relative addresses. Added the "Job dates" sections to the Life OS README and scheduled-search notes.
- **Data:** the two copies had drifted. Both imported the same five search batches under different ids; Life OS alone had the 5 October batch (12 jobs) and one job she archived; the standalone alone had 3 jobs and the dates. `scripts/merge-jobmap-workspaces.mjs` merged them.
- **Look:** `jobmap/app/skin.css` (the Study hub's colours, fonts and shapes) on top of the untouched standalone stylesheet; Life OS now publishes the chosen style for framed apps and JobMap follows it.

## Files and commits
- `9adabbf` [4a-cp1] JobMap: the newest version (job dates) and one merged workspace
- `af45c22` [4a-cp1] JobMap page asks JobMap for its data again inside Life OS
- [4a-cp2] JobMap wears the Study hub's look and follows the Style menu (this commit, with the brief, STATUS, DECISIONS and this note)

## How I checked it
- `cd jobmap && npm test`: the four suites pass, before and after the restyle.
- Merge, dry run then real: 30 + 21 added jobs became 33 (7 held by both under the same id, 11 the same advert under different ids and kept once, 12 only in Life OS, 3 only in the standalone); 34 personal records; 10 imports; no conflicts.
- Live, through the API: 1,013 jobs, every one with an added date, no advert link twice, the archived job still archived and off the shortlist, shortlist 32, one application at Interview. Calendar: 9 career items, 118 in all, no repeated id.
- Pictures (headless Chrome, saves blocked) of the live JobMap in Modern, Madder, Indigo and Paper; on a private preview with a copy of the data: an opened job, the Add job dialog, phone width.
- **Not checked:** saving an edit in the new look (the pictures block saves); the standalone app, which was not run.

## Data touched
- `jobmap/data/workspace/progress.json`: revision 18 became 19 (merged). Copy of the whole data folder first: `../Life_OS_backups/jobmap-before-merge-2026-10-06T23-57-18-031Z/`; the previous workspace is also in `jobmap/data/workspace/backups/`.
- Copied in from the standalone: 4 search batch files (2 discoveries, 2 processed), 2 import-log lines.
- "Added" dates: the 11 jobs both copies imported show 1 October (when Life OS first had them), not 6 October (when the standalone imported the same batches). The 12 Life OS jobs show 5 October.
- Life OS was stopped for about ten seconds for the merge.

## Problems and surprises
- **My mistake, fixed within minutes:** the newer page file asks for `/api/...` from the site root; inside Life OS that reaches Life OS's own API, so JobMap showed "unauthorized" and no jobs. The Life OS copy needs `api/...` (relative). The difference was hidden in a long diff I had not read to the end. The page is now the standalone page plus that one change, checked line by line.
- The style comment in `skins.css` pointed at a file that did not exist (`lib/frameSkins.js`). It exists now.
- JobMap's tests leave folders under `jobmap/data/test-*`; I removed the ones my runs made.

## Small decisions I made, and questions for Xar
- The standalone workspace was the starting point of the merge, because its ids are the ones the recovered dates are keyed on.
- Modern in JobMap uses the Study hub's exact values, not the slightly different Modern palette of the Life OS boards, because she asked for it to look like part of the Study hub.
- **Question:** the scheduled search still delivers to the standalone JobMap. Shall it be pointed at the Life OS one (CP3 in the brief)? Otherwise the two drift apart again from the next run.

## Next step
Wait for her answer on CP3 and her check of the acceptance list in `briefs/stage-4a-jobmap-refresh.md`.
