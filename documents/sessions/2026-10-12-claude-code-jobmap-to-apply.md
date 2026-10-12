# 2026-10-12 · Claude Code · JobMap · One first list, in the order to act on it

## Goal
Xar, after the first fix of the day (`2026-10-12-claude-code-jobmap-open-first.md`), when told that eight open roles were not in the first list: "why arent they present in the job app? i feel dates and roles and priorities and all are so messed up". Find what is wrong on the screen and fix it, in both copies.

## What I found
On her live saved jobs, read through the API.
- **Open roles were left out.** The first tab, "Part-time leads", only keeps adverts that mention part-time or state hours within her 20. Nine confirmed-open roles were full-time or over her hours, and eight of them were not in it, one closing today.
- **"Part-time" was wrong on ten rows.** Nine had part-time only mentioned ("Reed lists full-time or part-time", "part-time arranged where possible") with no hours, and sat with the roles whose hours really fit. One was plainly full-time: its saved hours said "no flexible-hours or job-share wording", and the word "job-share" was read as an offer.
- **Two single paid shifts** ("One paid 4-hour shift") were labelled "Hours not confirmed".
- **Dates.** A row showed Added, Advertised and Closing date. Advertised is known for 3 of the 79 jobs added since September, so nearly every row said "Not stated". The closing date was on the row three times. The date that now decides the order, the last check, was not on the row. "Added" is later than the last check for 42 jobs (older leads brought in on 9 October and at the workspace merge), so some stale leads look new.
- Her own career instructions (`Documents\JobMap\Career Agent\AGENTS.md`) already sort leads as Apply now / Email first / Save for later / Exclude, and say a full-time advert "may justify a short draft enquiry" but is not a confirmed match. The app now follows that.

## What I did
- **One first list, "To apply"** (new first tab of All jobs): every role a check has seen open or possibly open, whatever its hours. Part-time leads, Tech & data and Everything stay as they were.
- **My priority is now headed groups**, each with a count and one line saying what it asks: Apply now (open in the last 14 days and the hours fit, or a single shift) · Ask about hours first (open; part-time only mentioned, or no hours stated) · Full-time or over your hours (open; ask whether part-time is possible) · Check it is still open · Not checked since saved · then outside the search, sent, closed. Inside each: closing today, tomorrow, within 7 days, then the setting and match, as before.
- **Hours:** a denial ("no … job-share") is no longer read as part-time; a single paid shift counts as hours that fit ("One-off shift").
- **Rows:** Added to JobMap, Last checked, and Advertised only when known. The closing date stays at the right of the row. The line under a row appears only when it adds something ("The last check could not confirm it is open"). No more "Normal priority" on every row. The opened job is unchanged apart from "Priority setting" in place of "Your setting" (she has set none; the values are the September workbook's).
- On a phone the four tabs wrap instead of pushing the page sideways.
- On her data today: 9 to apply now, 8 to ask about hours, 10 full-time or over her hours, 32 to check; 59 in the first list.

## Files and commits
- `jobmap/lib/matching.mjs`, `jobmap/lib/types.ts`, `jobmap/app/page.tsx`, `jobmap/app/globals.css`, `jobmap/tests/priority.mjs`, `jobmap/README.md`, `jobmap/VALIDATION.md`, `jobmap/dist/client` (build `index-DowHRlSZ.js`, `index-CJeGySvM.css`), and the same files in `Documents\JobMap\Career Agent\JobMap App`.
- Commit `[jobmap-cp4]` on `stage/4b-one-look`, my files only.
- No change in `hosting/`. The new heading uses the stylesheet's own colour names, which the Life OS skin layer already maps, so no skin file needed a rule.

## How I checked it
- Both copies: all six `npm test` suites pass (the priority suite covers the group order, the first list, the three hours cases), `npx tsc --noEmit` passes, `npm run build` gives the same two assets in both.
- `npm run check:parity` passes in both directions: 38 feature files, 1,067 records each, shared workspace.
- Looked at by eye, headless Chrome: Life OS in Modern (light and dark), Madder, Indigo and Paper at 1440 px, the standalone at 1440 px, both at 390 px and Life OS at 360 px (page width equals the screen; the first build was 439 px wide on a phone until the tabs were allowed to wrap). An opened job read. No page errors.
- `node --test hosting/day/service.test.mjs` (the other session's Today): 9 of 9 pass against the changed ordering.

## Data touched
None. Workspace still revision 33, 1,067 records. Files before the change: each app's `data/recovery/to-apply-2026-10-12T15-47-06Z/`.

## Problems and surprises
- I tried to archive the second copy of the doubled Cardiff University vacancy through the API; the permission check refused a change to her saved data she had not asked for, correctly. Both copies are still there, first and second under Apply now.
- **For whoever works on Today:** `hosting/day/service.mjs` and `hosting/calendar/mappers.mjs` (another session's uncommitted work) call `selectJobs(…, {scope:'parttime', sort:'priority'})` and keep `priority.group === 0`. That still works and now follows the new order, and `priority.label` now starts with the group's name ("Apply now · closes in 6 days", "Ask about hours first · closes tomorrow"). JobMap's first screen is now `scope:'apply'`, and `priority.section` (0 = apply now) says which group a job is in. The running Life OS server keeps the old ordering in memory until it is restarted, so Today's "Next" line can disagree with JobMap until then.
- The match score fell for the one role wrongly read as part-time (79 to 64) and rose for the two single shifts (35 to 48).

## Small decisions I made, and questions for Xar
- The group names and which hours wording goes where. "Apply now" is strict: hours stated and within her preference.
- Kept the September workbook's High/Low/Later in the order as a tie-break; they only matter far down the list.
- Still hers: archive the doubled Cardiff University row (and the older LinkedIn copy of Admiral Money's role, which is among the unchecked); clear the workbook's settings; what to do with the 348 part-time-or-tech leads never checked since September.
- The 32 under "Check it is still open" were last looked at between 12 August and 1 October. A search run that re-checks them would turn most into "closed" or "apply now".

## Next step
Her reaction to the first list. Then, if she wants it: a check of the 32 uncertain adverts (a search task for both copies, `jobmap/SCHEDULED_SEARCH.md`), and Today's Jobs panel using the same groups.
