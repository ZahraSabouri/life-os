# 2026-10-12 · Claude Code · Stage 2b · CP6 to CP9: every style's Court, the summer's life data, JobMap's own list, ticks, links

## Goal
Finish what Xar listed after the Modern Court ("it has turned out amazing … I want the [Court] to carry the day the way Modern does in [Madder], indigo, and paper"; the summer app keeps study only; plans for outings and people under an area), then answer what she raised while using it the same evening: jobs on the day she could not find in JobMap, shopping lists arranged several ways with real ticks and no forced prices, and links that lead to the exact thing.

## What I did
- **CP6.** The day on the Madder, Indigo and Paper Courts. An area and a note on every kind of entry, the area "Life admin", a page for every area (`/room/<name>`). Done entries stay on the calendar. The summer app's non-study data moved to Life OS entries.
- **CP7.** The Jobs panel had listed every shortlisted job closing within a week. The shortlist is filled by the scheduled searches (all 80 saved jobs), so four of the seven it showed were not on JobMap's first screen and she could not find them. The day now reads JobMap's own first list from one file, `hosting/career/first-screen.mjs`. While I was doing this the other Claude Code session changed JobMap's first screen from "Part-time leads" to "To apply"; the file follows whichever JobMap exports as `FIRST_SCREEN`.
- **A fault found by looking:** in Modern dark the Study panel said "could not be read" on two loads in three. Cause: JobMap now holds 1,067 jobs and ranking them took half a second on every request, for the day and for the calendar at once, which ran the day past its 2.5 s limit. The ranking is now kept per JobMap revision (day alone 0.28 s, day and calendar together 0.8 s), the limit is 6 s, and the page asks again by itself when a part fails.
- **Budget → Shopping** (`[budget-shopping]`): the squares are ticks (`tickListLine`: status `bought`, `ticked`, `gotOn`, no receipt); "Ticked off" section with "Clear these"; Arrange: By list, By category, By shop, By day, Everything; no "Price?"; a list's spending limit; an item's own shop and day; an item can move to another list; type and press Enter to add; "Add here" on each heading; a new list is for today.
- **CP8.** Ticks on the Court and Today (`POST /api/home/shopping/tick`). Every job on the day links to `/jobmap#job=<id>`; JobMap reads it (`[jobmap-cp5]`, both copies). `SubAppFrame` hands a changed fragment to a part that is already open. Jobs panel: "Closes today" first. "Recently filed" leaves out what was moved in from the summer app.
- **CP9.** Study links carry `semester`; the hub's gate opens it and the card opens. The words "Life OS" on the hub's save button lead to `/court`.
- Records: `TODO.md` (new sections J, K, L with her words), `STATUS.md`, `DECISIONS.md`, the brief.

## Files and commits
- `1fcbb5f`, `fa181ec` [2b-cp6] the day on every style's Court; areas; room pages; the summer's life data
- `3a28a52` [2b-cp7] `hosting/career/first-screen.mjs`, `hosting/day/service.mjs`, `hosting/calendar/mappers.mjs`, `DayParts.jsx`, `AreaToday.jsx`, `TheCourt.jsx`, `lib/useDay.js`
- `b501fca` [budget-shopping] `budget-management/app/src/{domain,product,product-dialogs}.js`, `product.css`, `tests/shopping-views.test.cjs`, `dist/index.html`
- `ab6c142` [jobmap-cp5] `jobmap/app/page.tsx`, `jobmap/lib/matching.mjs`, `jobmap/dist/client/*` (the standalone copy has the same two source files)
- `6a9ca23` [2b-cp8] `hosting/home/shopping.mjs`, `hosting/day/service.mjs`, `App.jsx`, `lib/useDayPage.js`, `DayParts.jsx`, `AreaToday.jsx`, `TheCourt.jsx`, `styles/day.css`, Budget quick add
- `0b3d58e` [2b-cp9] `hosting/study/calendar.mjs`, `hosting/day/service.mjs`, `summer-rescue/src/hub/HubGate.jsx`, `summer-rescue/src/App.jsx`, `App.css`
- All on `stage/4b-one-look`, my own paths only. Not mine and left unstaged: `AGENTS.md`, `briefs/stage-4a-jobmap-refresh.md`, `jobmap/SCHEDULED_SEARCH.md`, Codex's notes, `COORDINATION_2026-10-12.md`.

## How I checked it
- Tests: 70 pass (`node --test hosting/calendar/calendar.test.mjs hosting/day/service.test.mjs hosting/day/page.test.mjs hosting/home/shopping.test.mjs hosting/study/calendar.test.mjs hosting/calendar-route.test.mjs hosting/skins/modes.test.mjs hosting/skins/recolor.test.mjs code/life-os/backend/test/entryTypes.test.js`). Budget: 166 pass (163 before, 3 new). JobMap: `npm test`, `npx tsc --noEmit`, `npm run build` in both copies, same asset names, `check:parity` from both sides with no differences.
- On the live app with a headless browser, every save caught before it reached the part and answered as if it had worked, so nothing of hers was written:
  - Court in Modern light and dark, and at phone width (390 px): no sideways scroll, no page errors.
  - Budget Shopping in each arrangement, light and dark; a tick and its undo; quick add; "Add here" opens the form with the group filled in.
  - A job clicked on the Court opens that job's details in JobMap ("Data Manager (Neurological Data Platform)" from "Closes today"); the strip's link works while JobMap is already open.
  - A study item clicked on the Court opens the Autumn semester and the card "MAT022 · Library: diagnose the gaps and map Test 1" with no "Which semester?" page; "Life OS" on the hub's save button goes to `/court`.
- The tick address tried for real in two ways that change nothing: an item that is gone (404, "That item is no longer on the list") and an item already ticked (200, no save; Budget revision 100 before and after, state identical).

## Data touched
- **Core entries:** 140 added by `scripts/move-summer-life-data.mjs` (CP6), after two faulty runs that were undone (see below). Backups: `Life_OS_backups\summer-2026-not-study\core-before-1791819326918.db` and the kept-aside JSON beside it; Study dump `Life_OS_backups\study-2026-10-12\before-moving-summer-life-data-1791819326940.dump`.
- **Budget:** nothing written by me this evening. Its page as built before my change is kept at `Life_OS_backups\budget-2026-10-12\index-before-shopping-views.html`. Xar ticked seven items herself (revision 93 to 100).
- **JobMap:** code only. Standalone copy's previous `page.tsx`, `matching.mjs` and `dist/client` are in its `data/recovery/job-link-2026-10-12/`.
- **Study hub:** code only; rebuilt.

## Problems and surprises
- **I broke the Study hub page for about eight minutes** (about 18:05 to 18:13). I rebuilt it with `vite build --emptyOutDir=false` and left out `--base=/apps/summer-rescue/`, so the page asked for its files at the wrong address and stayed blank on a fresh load. I saw it only because I opened the page to check a link. Rebuilt with the command in `Build Life OS.cmd`. No data was involved; a hub tab already open kept working.
- **The summer move ran wrongly twice (CP6).** The entries list was capped at 100, so the count check failed after the entries were written and the second run added 52 duplicates. I raised the cap to 5000, removed all 190 faulty entries (found by their save time), added a mark on each entry (`Ref: summer-2026/<id>`) so a run can see what is already there, and ran it once: 140 added; a second run reports nothing to move.
- **Two sessions on one rule.** JobMap's first screen changed under me twice in an hour. The fix is structural: one exported `FIRST_SCREEN`, read by both.
- **The hub's own old tests fail** (they import `CAMPAIGN_START`, `PLAN_REVISION` and expect the title "Summer Rescue"). They were failing before today; they test the summer app, not the hub.
- **Xar: "i need you to use common sense making any of these changes!!"** She did not say which change. After it I read each changed page with her data and changed: `9 under "Apply now" in JobMap` to "9 jobs to apply for now"; the job closing today moved above the ones closing in six days; the summer's tasks out of "Recently filed"; one-step adding in Budget; ticked items limited to three on the Court.

## Small decisions I made, and questions for Xar
- A tick uses Budget's status `bought` with `ticked: true` and no receipt. The month's forecast therefore stops counting a ticked item's estimate; the balance never counted it.
- The fragment `#job=<id>` is used once and removed by JobMap, so the same link works again; a reload does not reopen the job.
- "Life OS" on the hub's save button is a link only inside Life OS; the hub opened on its own keeps the plain label.
- **Questions:** which change lacked common sense, if it is still there? "When I click on a schedule": which one did not respond? Should an unpriced shopping list count as its limit in the month's forecast? Twenty minutes for the design of section K.

## Next step
Write a short brief for TODO section K (progress, review, planner and focus across Life OS) and show it to Xar before any code. Small things that need no answer: ticking a study step from the day (through the hub's own save), job time as a repeating routine.
