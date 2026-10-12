# Stage 2c: focus, review, progress and planning for the whole of Life OS

**Written 12 October 2026 (evening) by Claude Code.** Follows `stage-2b-my-day.md`. Branch: `stage/4b-one-look`.

## Goal
What the Study hub has for study cards only (a focus room with music and video, a review of the day, progress, analytics, a planner) exists one level up, for everything Life OS holds: study, job applications, her own plans, home and money. Nothing is taken out of the Study hub.

## What Xar said (12 October)
> "it had amazing features, like kind of like tracking the progress and stuff in the study hub. We would call those … analytics or progress or planner, review and stuff. I need all those perfect … features inside the whole LifeOS app, not necessarily inside the study hub."

> "maybe we need the focus room or study room to be part of the LifeOS app, or live music, or … YouTube player."

> "i need you to use common sense making any of these changes!!"

## What already existed and is reused
- The Study hub's Focus Room, card timer, music popover (one Spotify playlist) and floating YouTube player: inside the hub's frame, so they stop when she leaves the hub.
- The hub's event log (`study.hub_events`): a card done, a step ticked, a focus session finished. The hub's Review, Progress and Analytics read it.
- The day's request (`/api/day`), the calendar, JobMap's `applied` dates, Budget's lists, receipts and month rule (`forecast`), the core's entries.

## How it works
- **One part owns each record.** A focus session on a study card is saved on the card by the hub's own rule and logged in the hub's own event log; it is also a done block on the Life OS calendar. A look back counts it once.
- **Focus and sound live in the layout**, above the pages, so they survive moving from page to page. The running session is kept in the browser (`life-os.focus`), so a reload or a second tab carries on from the clock.
- **The review only reads.** `GET /api/review?from&to` gathers each part's own records by day.

## Checkpoints

### CP0: Ticking a study step from the day (done 12 October; committed as `[2b-cp10]`)
- [x] `hosting/study/hub/tick.mjs`: the hub's own change (`toggleChecklistItem`, `toggleDone`), its store, its revision check, its event. `POST /api/day/study`.
- [x] An open hub tab is told on the hub's per-semester channel (`study-hub:<semester>:summer-rescue-tracker-state`) and reloads.

### CP1: Focus for the whole app (done 12 October)
- [x] Focus button in every page's top bar, in every style (`components/FocusDock.jsx`, `lib/focus.jsx`, `styles/focus.css`).
- [x] Timer: what for (today's study cards and job applications are offered), minutes, under which area. Pause, finish now, stop without logging. Countdown in the top bar and the tab's title.
- [x] On finishing: a done `time-block` entry (`focus: true`, `minutes`), and for a study card `POST /api/day/study/focus` (the hub's `logFocusSession` rule; the event carries `from: 'life-os'`).
- [x] Sound: saved YouTube and Spotify links, her hub playlist first; a player in the corner that stays on the page across pages; hidden, it keeps playing.
- **Commit:** `f0cb63c` `[2c-cp1]`

### CP2: Review of a week (done 12 October)
- [x] `hosting/review/service.mjs` and `/review` (`components/ReviewView.jsx`, `styles/review.css`): five figures compared with the week before (up to the same weekday while the week runs); day by day; what slipped; links to the hub's own Review, Progress and Analytics.
- [x] Drawn by the charting rules in use (one accent colour, text in text colours, one bar per row and only for focus time, a meter for a part of a whole, words beside every colour).
- **Commit:** `aea2f5c` `[2c-cp2]`

### CP3: The Court without the day's path (done 12 October night)
- [x] Xar: "remove today from court and keep in the today tab." The path (the day hour by hour) is off the Court in all four styles. The add line and the Study, Jobs, Home and Notes panels stay, three across (Indigo keeps Notes in its rail).
- **Commit:** `44b9817` `[2c-cp3]`

### CP4: Notices for the whole app (done 12 October night)
- [x] Xar: "we also need a sorta notification for the whole app, not just study."
- [x] `hosting/notices/service.mjs`, `GET /api/notices` (read only): on now, within the hour, today, slipped, coming up; from the day, the calendar, her plans and Budget's month.
- [x] The bell and its list in every page's top bar (`components/NoticeBell.jsx`, `lib/notices.jsx`); seen marks kept.
- [x] "Also tell me on this computer": a notification before a timed thing starts (5 to 30 minutes, her choice), once a day for what today asks for, and when a focus session ends. Off until she switches it on; Life OS must be open in a tab.
- [x] A settings table in the core (`settings`, one row per key; `GET`/`PUT /api/settings/:key`; `shared/settings.js`). Kept there: `notices` (seen, her choice), `sound` (saved links), `targets` (her aims).
- **Commit:** `43b19f1` `[2c-cp4]`

### CP5: Repeating plans and the week planner (done 12 October night)
- [x] `shared/routines.js`: an entry of kind `repeat` (title, weekdays, clock time or any time, first day, last day). Its days are worked out for the calendar, the day, the review and the notices; a day becomes a real entry (carrying `details.routine`) only when she acts on it. ("routine" was already the body room's care routine, so the kind is `repeat`.)
- [x] The add line has "repeat": once, every day, weekdays, one weekday, chosen days; an optional last day.
- [x] `/planner` (`components/PlannerView.jsx`, `lib/plans.js`): seven days side by side; add to a day, tick, take off, move by dragging or from a menu; one day of a repeating plan handled by itself; the list of repeating plans with Stop and Remove.
- [x] `scripts/job-time-as-repeating-plans.mjs`: the study plan's reserved job hours from 26 October to 27 December as eight repeating plans.
- [x] The host shares one read of Study, JobMap and Budget among requests that arrive together; the calendar gives a part eight seconds and the page asks again when a part is missing.
- **Commit:** `d9e8c25` `[2c-cp5]`

### CP6: Eight weeks and her aims (done 12 October night)
- [x] Review: four small charts over eight weeks, the semester's cards as a meter, and aims (applications a week, hours of focus a day) she sets there.
- **Commit:** `fef0ecf` `[2c-cp6]`

### Open after CP6
- [ ] Marking a job "applied" from the day (JobMap owns the record; needs JobMap's own save).
- [ ] The hub's forest, levels and strict guard for sessions outside study, if she wants them there.
- [ ] Notices when Life OS is not open in any tab (needs something running in the background: an installed page or a small helper).
- [ ] The Study hub's own unread reminders shown in the Life OS bell.
- [ ] Editing a repeating plan (its days or time) instead of stopping it and making another.
- [ ] The top bar holds thirteen entries; gather the parts under one.

## Data safety
- CP0 and CP1 write to the Study hub only through the hub's store and revision check. Tried for real on the try-out (test database) with a hub page open beside the Court, both ways, before going live. On live the addresses were tried only in ways that change nothing.
- CP1's calendar entry goes through the core's own `/api/entries`. On the try-out it was caught in the browser (the try-out shares the real core database).
- CP2 reads only.

## Tests
`hosting/study/hub/tick.test.mjs` (7), `hosting/review/service.test.mjs` (3). The set that is safe to run: see the session note.

## Acceptance checklist for Xar
1. Top bar → **Focus**. Pick today's card or type anything, press Start. The time counts down in the top bar. Open the Study hub, Budget, JobMap: it is still counting.
2. In Focus, press **Play** beside "Focus playlist". A small player appears in the corner; press play in it. Move between pages: it keeps playing. **Hide** it: the sound goes on, and ♪ shows beside the time.
3. Let a session end, or press **Finish now**: the time is on today's calendar as done. For a study card, open the card in the hub: the session and the hours are there.
4. On the Court, tick a step of today's study card. Open the card in the hub: the step is ticked.
5. Top bar → **Review**: this week's five figures, the days, what slipped. "The week before" shows last week.

## Risks and open questions
- **Targets.** "Applications sent: 0" says nothing about whether that is on track. A weekly target (hers to set) would make it a meter.
- **Two timers.** The hub's Focus Room and the Life OS timer both exist. A study session can be run in either; both end up on the card. If she prefers one, the other can point to it.
- **The top bar is full** (twelve entries). The next addition needs the parts gathered under one entry.
- **Sound in the browser only.** Clearing the browser's data loses the saved links.
