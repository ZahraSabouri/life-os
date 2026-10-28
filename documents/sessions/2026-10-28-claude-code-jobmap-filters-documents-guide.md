# 2026-10-28 · Claude Code · JobMap · missed deadlines, search and visa filters, PDFs, the Guide

## Goal
Her requests, "with the least amount of token usage":
- a way to close a job whose deadline passed while she was preparing it
- the new features, with screenshots, in the Guide
- more search filters (titles, regex, grouping by skills, years or titles)
- seeing PDFs in My documents
- mid-task: filters for visa sponsorship, British-citizens-only roles and part-time

## What I did
- **Missed deadline:** a job in To review, Check details or Preparing whose deadline passed (or whose advert closed) shows "Close it: missed the deadline". That sets the status to Archived and the outcome to the new "Missed deadline" (`lib/store.mjs` OUTCOMES), with Undo. Progress doesn't count it as sent.
- **Search:**
  - "Search in" covers everywhere, job titles, employers, or skills and advert text; `/…/` is a regular expression (`matchesSearch` in `lib/matching.mjs`).
  - "Group by" covers kind of job, main skill and years of experience (`titleFamily`, `mainSkill`, `yearsAsked`, `groupRows` in `lib/insights.mjs`).
  - These choices are kept with her other filters.
- **Visa and hours** (`visaWording`, `VISA_LABELS`; `visa` and `hours` in `selectJobs`):
  - the advert's own words are read as limited by nationality or clearance, says no sponsorship, sponsorship offered, or says nothing
  - "No nationality limit" hides the limited ones
  - the hours filter is part-time or within her hours, or full-time
  - jobs show a "Right to work" line, and a badge on the row for limited or sponsorship
  - of her open jobs: 33 limited, 129 no sponsorship, 31 sponsorship offered, 963 say nothing
- **Documents:** `GET /api/documents/file?path=…` (`server.mjs`) serves a file from her folder (PDF, pictures and text shown inline) and refuses paths outside the folder. My documents has "View" and a preview, and files kept with a job open the same way.
- **The Guide:**
  - six JobMap steps: Progress, board, gaps and Claude, search and filters, missed deadline, PDF
  - four questions
  - six recipes in `scripts/guide-shots.mjs`, all taken (99 of 99 pictures)
- **Layout:** Progress cards sit three across from about 1,000 px wide, and the toolbar wraps with search on its own row.

## How I checked it
- `npm test` in `jobmap/`: all files pass, with new cases in `tests/insights.mjs`.
- `tsc` is clean; eslint is unchanged at 763.
- The live JobMap server was restarted by Life OS (`/api/stop`, back at revision 42, 1,195 jobs). Her main CV is served as an inline PDF, and a path outside the folder is refused.
- Pictures looked at (search, PDF, missed deadline, Progress).
- `/today`, `/guide` and `/calendar` load with no page errors (saves blocked).

## Data touched
None. No job was changed; the screenshots block every save.

## Problems and surprises
- Another session was editing Life OS's frontend during this one (`DayParts.jsx`, `useDayPage.js`, `shared/entryTypes.js`, new `lib/addresses.js` and `lib/calendarViews.js`). Building the frontend for the Guide also built their unfinished changes, so they are live now. Those pages load without errors. I left their files uncommitted and untouched.

## Next step
When that session finishes, it should rebuild the frontend and commit its own files.
