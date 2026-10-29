# 2026-10-29 · Claude Code · Calendar · CP4–CP6 (direct request)

## Goal
Her words, after the first Calendar session: "elevate ux, cover uncovereds and test and finish the thing and push it to main branch", then "go on" twice when the session paused. Asked mid-way how to publish (the branch now carries the mail session's Inbox), she chose "Everything, Inbox too". Brief: `briefs/calendar-day-and-addresses.md` (CP4–CP6).

## What I did
- **Cardiff Life opens one event.** `hosting/skins/public/apps/cardiff-life.js`, added to its page as it is served (`skins/index.mjs` tags an app's own script when there is one). `#event=<id>` opens the event through Cardiff Life's own click handling; `#view=` names its part; opening an event is a step Back closes; the address is written only when it and the page disagree. Cardiff Life's files, and so Codex's research sync and hashes, are untouched. Calendar items link to their event (`mappers.mjs` `cardiffEventHref`; `lib/calendar.js` `withEventLinks` for an older server's answer).
- **JobMap in its own address.** `jobmap/app/page.tsx`: `#view=…&tag=…&job=…`. A job opened there is a step (closing it is Back); one job to another changes the address in place; views are steps; `#job=` links still open one. Built (`jobmap/dist`, committed as JobMap's sessions do).
- **Panels and menus.** `usePanel` in `lib/addresses.js`: the bell, Focus, the style menu and the phone menu are `?panel=`, one at a time; Back or Esc closes; a click elsewhere closes in place (a step back then would undo the click's own navigation); a page chosen from the phone menu takes the menu's place in history. `App.jsx`: the framed apps' address mirror keeps the search part.
- **The helper reads the address as it is that moment** (`window.location` and the router's `history.state.usr`), not as last drawn: closing a panel and opening a day in one click no longer reopened the panel.
- **Esc reaches only what is on top:** the panels leave Esc to an open day.
- **Week:** a thing widens into free columns beside it (`span`).
- **Easier to use:** drag her own one-day plans to another day in Month or Week, with an Undo toast (`undoMove`). "+" on a day, and a click on an empty hour in Week, open the day with the add line ready (with the time). Undo after Done, Take off the day and Move (`undoStatus`): at the day's foot in the pop-up, under the add line on Today and the Court. Swipe between days on a phone. Closing a day gives the day the focus and marks it for a moment. List starts at today ("Show the N earlier days").
- **Calendar sources:** a failed source is named by its own label; "Mail and admin" (`admin`) is a calendar area, so mail's dated things show and can be hidden.
- Guide: the Calendar steps describe "+", the hour click, dragging, Undo, swiping and Cardiff; `calendar.jpg` and `calendar-day.jpg` retaken.

## Files and commits
- `f8673e4` [calendar-cp4-5] Back works inside Cardiff Life and JobMap and for every panel; drag plans between days, add at an hour, and Undo
- Records: this note, STATUS, DECISIONS, the plans inventory (the commit after it).
- Pushed: `stage/4b-one-look`, and `main` brought level with it (see How I checked it).

## How I checked it
- Tests: frontend `node --test test/*.test.js` 59 pass (new: the widening, Cardiff links from an older answer). Hosting calendar, day, calendar-route and skins: 53 pass (new: an event's link). Shared calendar 3. JobMap `npm test` (8 files) pass, `tsc --noEmit` clean. Not run: `hosting/app.test.mjs` (reseeds the core).
- Walks with Chrome (`playwright-core` from `summer-rescue`), every save caught in the browser, first on a Vite dev server proxied to the live API (a scratch server served Cardiff Life's page with the new script), then on the live app after publishing:
  - "+" puts the cursor in the day's add line; Esc gives the day the focus and marks it.
  - A drag of "Job applications" to the next day in Week: dragstart, dragover, drop; the toast "Moved … to Friday 30 October. Undo"; it sent the day's cancellation and the new plan; Undo sent the plan taken off and the day back to "to do".
  - Done in the day, then Undo: the bar and the reversing save.
  - An hour in Week opens the day with "09:00 " in the add line. List starts at Today.
  - Bell, then Focus (one replaces the other), Back closes; bell then a day clicked: the bell closes, the day opens; style menu and Back; phone menu, Back; a page from the menu, then Back, does not reopen the menu.
  - The bell over an open JobMap job keeps the job open (`/jobmap?panel=notices#job=…`); Esc closes the bell, Back the job.
  - JobMap: open a job → Back; views → Back; a `#job=` link, then Esc.
  - Cardiff Life: a calendar link opens the event; Esc; an event clicked → Back; Explore → an event → Close → Back; from the calendar's pop-up "Open in Cardiff Life" → the event → Back to the same day and item.
  - The first session's walks again (views, Back, search, the old `?date=` link; the Guide's and Journal's pictures): unchanged.
  - Today, the Inbox, Health → Gym, the Court and the Planner load with no page errors.
- The only console errors are the Inbox's 503s (live mail storage waits for its migration).

## Data touched
- None of hers: every walk caught its saves in the browser. Backups of the live builds before publishing: `.runtime/calendar-plus-2026-10-28/jobmap-client-before/` and `.runtime/calendar-plus-2026-10-29/dist-before/`.
- Published: JobMap's build, and the Life OS frontend with everything on the branch (her choice), including the mail session's Inbox and Codex's Health → Gym (already live, not yet committed by Codex). The mail migration was not run.
- The Life OS server was restarted at 00:11, not by me (Codex's Health work, it seems), after my server-side edits were on disk; they are live with it.

## Problems and surprises
- Four sessions shared the folder: the mail session merged `stage/mail-inbox` here and asked me not to deploy its work or migrate for it (its own permission check had stopped it); I asked her and she chose to publish. Codex's Health session built the frontend at 00:23 without my changes and the Inbox, and has uncommitted Health files, `entries.js` and `safety-guards.test.mjs` in the tree: left alone, not committed. `chapters.js` held both their Guide steps and mine: I staged only my two lines.
- Two bugs of my own were found by the walks and fixed: a stale address read in one click (the bell reopened when a day was clicked) and Esc closing both a panel and the day under it (three steps back). The drop handlers now exist before a drag starts.
- My scratch proxy needed the live origin: the live server refuses foreign origins (403), as it should.

## Small decisions I made, and questions for Xar
- A page chosen from the phone menu replaces the menu's step, so Back goes to the page before.
- Dragging is for her own plans of one day that are not done; a trip or other plan over several days is moved with Change. Phones move with "Move to" in the day (dragging needs a mouse).
- Budget's smaller dialogs are still not in its address (its views and meal and recipe cards are).
- Still open from the first session: should a note about a JobMap job go into JobMap's own notes?

## Next step
Xar reloads and tries the acceptance list (brief, items 1–9). The mail migration and first batch stay with her (`mail/AGENT-PROMPTS.md`).
