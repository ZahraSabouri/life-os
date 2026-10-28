# 2026-10-28 · Claude Code · Calendar · CP1–CP3 (direct request)

## Goal
Her words: "I want everything to be in URL … so when I press back, I can go back, even if some pop-up window was open"; the calendar "quite simple … make it way more advanced"; see and move between months; open one day in a pop-up "and in that there should be different actions … mark things done, or add notes, or click on links … to that event or to the specific class in study hub". Then "go on" twice when the session paused. Brief written for it: `briefs/calendar-day-and-addresses.md`.

## What I did
- **The address helper** (`frontend/src/lib/addresses.js`): a page keeps what it shows in its address. A pop-up opened from the page is a step of Back (remembered as a "layer" with the address), so Back closes it and so does ×/Esc. One that came with a link or a reload is taken out of the address instead. Steps inside a pop-up (another day, a tab) change the address in place.
- **Calendar** (`CalendarView.jsx`, `lib/calendarViews.js`): `?month`, `?view=week|agenda|year`, `?week`, `?hide`, `?cardiff`, `?q`; the older `?date=` (Today, birthdays) still opens the day. Named month steps ("‹ September", "November ›"), Today, Go to (a month picker), Month / Week / List / Year, a search, ISO week numbers (open the week), keys (← → T M W L Y). Week is an hours grid with an all-day row, overlaps side by side and a line at now. List is the month day by day with "Open in …". Year is twelve months shaded by how full each day is. Each view's things are grouped by day once (a year is ~2,000 things).
- **The day pop-up** (`CalendarDay.jsx`): `?day=`, `&item=`, `&tab=`. It reuses Today's day (`useDayPage`, `DayPath`, `AddLine`), now reading only that day, with the calendar's filters. It has the day before and after, the tabs (The day, Study, Jobs, Home, Health), "Open as a page", "Plan the week" and Journal. Each thing has "Open in Study hub / Cardiff Life / JobMap / Budget …" and "Details and a note". A thing open shows when, where (links in a place work), its kind and part, and a card's steps to tick. For her own plans it has Done or Not done after all, Change, Move to another day and Take off the day; a job has "I applied"; every thing has a note about it.
- **Notes from the calendar:** the add line takes a note on any day there; "A note for the day" and "A note about it" do too. A note is a Life OS note entry dated to the day it is for (`start_at`), with `about` (the calendar item's id) and `about_title` (`shared/entryTypes.js`). The calendar treats a dated note as kind "note" (✎ on the month, not a plan; `hosting/calendar/mappers.mjs`). The day reads notes dated to it as well as notes written on it (`hosting/day/service.mjs`). `buildDay` leaves notes off the path. Long notes show their beginning with "Read all".
- **Other pop-ups in the address:** the Guide's large picture (`?picture=`); the Journal's Pages/Pictures (`?view=pictures`), Find (`?find=`) and large picture (`?picture=`).
- **The Guide:** the Calendar step re-marked for the new controls, a new step and picture "A day, open", and a "How do I" for it. Recipes in `scripts/guide-shots.mjs`; `calendar.jpg` and `calendar-day.jpg` retaken.
- Links: Planner's "The month" → `?month=`; Today's "Open calendar" for another day → that day open.

## Files and commits
- `19d8bd1` [calendar-cp1-2] The calendar in the address, with Week, List and Year, and a day that opens with everything on it
- `56ec837` [calendar-cp3] The Guide's and the Journal's pictures in the address; the Guide's Calendar for the new calendar
- `19c2f28` [calendar-cp3] A long note in the day shows its beginning, with "Read all"; the Guide's open-day picture without a mark below the fold
- Records: this note, `briefs/calendar-day-and-addresses.md` (in `19d8bd1`), STATUS, DECISIONS, the plans inventory.

## How I checked it
- Tests: frontend `node --test` on calendar-views (new, 9), calendar, courtClock, entryPatch, grounds, study, study-insights and study-workbench: 58 pass. Hosting: calendar, day/service, day/page and calendar-route: 40 pass (new cases for dated notes). Shared calendar: 3 pass. `hosting/app.test.mjs` was not run (it reseeds the core).
- Build: `npm run build` in the frontend; the live server serves it (`assets/index-…` matches).
- Walks with `playwright-core` and Chrome, every save caught in the browser. First on a Vite dev server proxied to the live API, then on the live app (Madder dark, Paper light at 390 px, Modern light). Back after Next month returns; opening a day, then a thing, then Back twice closes the thing, then the day. ← inside the pop-up changes the day; the tab is in the address; × and Esc close; a chip opens its thing; Week, List and Year each have their own address and Back walks through them; search and hidden areas stay in the address; the old `?date=` link opens the day and × takes it out. No page errors, no write attempts.
- The saves, caught and read: a note on 6 November from the add line and from "A note for the day" → `POST /api/entries {type:"note", start_at:"2026-11-06", all_day:true, details:{body}}`. A note about a Cardiff event adds `about:"events:cardiff:govcamp-cymru-2026", about_title`. Done on a day of the repeating "Job applications" makes that day an entry with `status:"done"` (the existing rule). Move to 30 October takes that day off and posts a plan on the 30th. `validateDetails('note', …)` keeps `about` and `about_title` and drops unknown fields.
- Guide: `?picture=calendar.jpg` opens large; Back, Esc and Close close it. Journal: `?view=pictures`, `?find=` survives a reload.

## Data touched
- None of hers. No save left the browser during the walks. Live frontend backed up before the build: `.runtime/calendar-plus-2026-10-28/dist-before/`.
- The server was not restarted by me. It was restarted by Codex at 20:52 (its save guards), after my backend edits were on disk, so it already runs them. They are additive: an optional `about`/`about_title` on notes, a note's kind, notes read by `start_at` first.

## Problems and surprises
- The session paused part-way; three other sessions committed meanwhile (Codex's study audit and December reset, Claude Code's mail CP1). None touched my files, and Codex's STATUS noted my uncommitted Calendar files and left them alone.
- My Python edits wrote Windows line endings (CRLF) into seven LF files; the first commits showed whole files changed. I redid my two unpushed commits with LF before anything else was committed on top. The Cardiff Life test change in the tree is another session's and was left alone.
- The Playwright MCP extension is still not installed; `playwright-core` from `summer-rescue` was used, as before.

## Small decisions I made, and questions for Xar
- **Notes are Life OS notes,** even about a JobMap job or a Cardiff event; those apps don't see them (they are listed in the Ledger and shown in the pop-up). Should a note about a job go into JobMap's own notes instead?
- **The four apps in frames keep their own addresses** (after `#`); I didn't change them. Cardiff Life can't open one event from a link yet, so "Open in Cardiff Life" opens its list. Changing that is in Cardiff Life's own code (another session's area).
- **Dropdown menus** (the bell, the style switch, the phone menu) are not in the address: they aren't pages, and Back closing them would mean a history step for each opening.
- **On a phone the month comes before the filters** on the Calendar now (the filters are long, and the month is what the page is for).
- A Cardiff event's Maybe / Plan to go stays in Cardiff Life (its choices live in that app's browser storage); the pop-up says so.

## Next step
Xar tries the acceptance list in `briefs/calendar-day-and-addresses.md` (Calendar → Next, Back; open a day; a class → Open in Study hub → Back; a note). Then, if she wants: "Open in Cardiff Life" straight to the event (Cardiff Life's code), and her answer on notes about jobs.
