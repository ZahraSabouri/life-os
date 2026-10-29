# Calendar: the day pop-up, more views, and everything in the address

**Status:** direct request from Xar, 28 October 2026 (no separate approval asked; see Goal) · CP1–CP3 done on 28 October · CP4–CP6 (her "elevate ux, cover uncovereds and test and finish the thing and push it to main branch") done on 29 October · waiting for her check
**Branch:** `stage/4b-one-look` (where the other direct requests of this week went; the folder is shared with other sessions, so no branch switch)

## Goal
Her words (28 October): "I want everything to be in URL … so when I press back, I can go back, even if some pop-up window was open"; "my biggest problem is the calendar … see different months, go to next months or previous months … make it way more advanced"; "open one day, and a pop-up window should open … mark things done, or add notes, or click on links … it takes me there to that event or to the specific class in study hub … any sort of features and functionalities … in the pop-up window".

At the end: the Calendar's month, view, filters, search, the open day and the thing open in it are all in the address, so Back undoes the last step and a link or reload opens the same view. The Calendar has clear month steps, Go to, Month / Week (by the hour) / List / Year, a search, week numbers and keys. A day opens in a pop-up with everything on it and what can be done from there. Other pop-ups of Life OS itself (the Guide's and the Journal's large pictures) are in the address too.

## Read first
`code/life-os/frontend/src/lib/addresses.js` (how a pop-up becomes a step of Back), `lib/calendarViews.js`, `components/CalendarView.jsx`, `components/CalendarDay.jsx`, `lib/useDayPage.js`, `components/DayParts.jsx`; `hosting/calendar/mappers.mjs` (mapEntries), `hosting/day/service.mjs` (notesDay).

## In scope / not in scope
- In: the Calendar page; the day pop-up; notes on any day and about one thing; the Journal's and the Guide's pictures, the Journal's Pages/Pictures and Find; the Guide's Calendar words and pictures.
- Not in (CP1–CP3): the four apps in frames; dropdown menus; Cardiff Life opening one event. **All three covered in CP4–CP5**, apart from Budget's smaller dialogs (its views and meal and recipe cards were already in its address).

## Checkpoints

### CP1: The calendar in the address, with four views
- [x] `?month=`, `?view=week|agenda|year`, `?week=`, `?hide=`, `?cardiff=`, `?q=`; the older `?date=` link still opens the day. Month steps named by the month ("‹ September", "November ›"), Today, Go to (a month picker), Month / Week / List / Year, a search, ISO week numbers that open the week, keys (← → T M W L Y).
- [x] Week: an hours grid with an all-day row, things side by side where they overlap, a line at the time now. List: the month day by day, each with "Open in …". Year: twelve small months shaded by how full each day is.
- **Done when:** Back after Next month shows the month before; each view is one address.
- **Verify:** `node --test test/calendar-views.test.js` in the frontend; the look-only walk (every save caught in the browser).
- **Commit:** `[calendar-cp1-2] …` (with CP2: the page and the pop-up build together)

### CP2: The day pop-up
- [x] `?day=` opens it, `&item=` a thing in it, `&tab=` Study, Jobs, Home or Health of that day. The day before/after (‹ › or the arrow keys), Close (×, Esc, a click outside, or Back).
- [x] The day in time order (Today's own path): tick study steps and "Card done", Done / Change / Take off the day on her own plans, "Open in Study hub / Cardiff Life / JobMap / Budget …", and "Details and a note".
- [x] A thing open: when, where (links in a place are links), its kind and part, the card's steps; Done or Not done after all, Change, Move to another day, Take off the day; "I applied" on a job; a note about it.
- [x] Notes: the add line takes a note for any day in the pop-up; "A note for the day" and "A note about it" keep a note entry dated to the day (`start_at`), with `about` (the calendar item's id) and `about_title`. On the calendar it is a "note" (✎ on the day), not a plan; the day reads notes dated to it as well as notes written on it.
- **Done when:** a day opens, its things open inside it, and Back closes first the thing, then the day.
- **Verify:** `node --test hosting/calendar/calendar.test.mjs hosting/day/` and the frontend tests; the saves caught in the browser and read (the request bodies are in the session note).

### CP3: Other pop-ups in the address; the Guide
- [x] Guide: `?picture=` shows a picture large; Back, Esc and Close close it. Journal: `?view=pictures`, `?find=`, `?picture=`.
- [x] The Guide's Calendar chapter: new marks for the calendar, a step and a picture for the open day, a "How do I" for it. Recipes in `scripts/guide-shots.mjs`.
- **Commit:** `[calendar-cp3] …`

### CP4: What was left out (29 October)
- [x] Cardiff Life: `#event=<id>` opens that event and `#view=` its part; opening an event is a step Back closes. Added as the page is served (`hosting/skins/public/apps/cardiff-life.js`, tagged by `skins/index.mjs` for an app that has a script), so Cardiff Life's own files and Codex's research sync are untouched. Calendar items link to their event (`hosting/calendar/mappers.mjs`; `lib/calendar.js` `withEventLinks` for older answers).
- [x] JobMap: its view, category and open job in its own address (`#view=…&tag=…&job=…`, `jobmap/app/page.tsx`); Back closes a job opened there and walks back through views; `#job=` links still open one.
- [x] The bell, Focus, the style menu and the phone menu: `?panel=` (`usePanel` in `lib/addresses.js`); one at a time; Back or Esc closes; a click elsewhere closes in place; a page chosen from the phone menu takes the menu's place in history. The framed apps' address mirror keeps the search part (`App.jsx`).
- [x] Week: a thing widens into free columns beside it (`span`).
- [x] A failed source is named by its own label; "Mail and admin" is an area of the calendar.

### CP5: Easier to use
- [x] Drag her own one-day plans to another day (Month and Week), with Undo (`undoMove` in `lib/plans.js`).
- [x] "+" on a day, and a click on an empty hour in Week, open the day with the add line ready (the time filled in).
- [x] Undo after Done, Take off the day and Move: at the foot of the day, and under the add line on Today and the Court (`undoStatus`).
- [x] On a phone, swipe sideways in the day. Closing a day puts the focus back on it and marks it for a moment. List starts at today ("Show the earlier days").
- [x] Esc belongs to what is on top: a panel under an open day leaves it to the day. Two things done in one click (a panel closing as a day opens) read the address as it is that moment.

### CP6: Checked and pushed
- [x] Tests, the walks with every save caught (see the session note), the Guide's words; `main` brought level with this branch and pushed.

## Data safety
No data was changed while building: every walk ran with saves caught in the browser. The new fields are optional (`about`, `about_title` on a note); notes written before keep working (read by the day they were written). No migration.

## Tests
`code/life-os/frontend`: `node --test test/calendar-views.test.js test/calendar.test.js` and the other frontend tests. `hosting`: `node --test calendar/calendar.test.mjs day/service.test.mjs day/page.test.mjs calendar-route.test.mjs`. Never `hosting/app.test.mjs`.

## Acceptance checklist for Xar
1. Calendar: "November ›", then the browser's Back: October again. Try Week, List, Year, and Go to.
2. Click a day: it opens over the month. Back closes it.
3. In the day, click a class's title: its details. "Open in Study hub" goes there; Back comes back to the same day and class.
4. Tick a step, mark one of your plans Done, write "A note about it" and "A note for the day": the day shows ✎ on the month.
5. On a phone: the month shows counts; a tap opens the day full screen.
6. Week: drag "Job applications" to the next day; "Undo" at the foot takes it back. Click an empty hour: the day opens with that time in the add line.
7. In a day, Done on one of your plans, then "Undo" at the foot of the day.
8. A Cardiff event → "Open in Cardiff Life": that event opens; Back returns to the same day.
9. JobMap: open a job, then Back; the bell, then Back. On a phone, Menu then Back.

## Risks and open questions
- A note is a Life OS note even when it is about a JobMap job or a Cardiff event; those apps do not see it. Should a note about a job go into JobMap's own notes instead? (Her call.)
- In Week, a day with many overlapping things gets narrow columns.
- Cardiff Life: "Open in Cardiff Life" opens its list, not the event; opening one event needs a change in that app.
