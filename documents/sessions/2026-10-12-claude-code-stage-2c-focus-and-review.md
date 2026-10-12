# 2026-10-12 · Claude Code · Stage 2c · CP0 to CP2: study ticks from the day, focus and sound everywhere, the week's review

## Goal
Xar said "go on" after the evening's report. Open at that point: ticking a study step from the day, job time as a routine, and her larger ask: progress, review, planner and the focus room with music for the whole of Life OS.

## What I did
- **Study ticks from the day (`[2b-cp10]`).** `hosting/study/hub/tick.mjs` makes the change the hub's own page makes (a step ticked, a card done), saves it through the hub's store with the revision that was read, redoes it once if the hub saved in between, and logs the hub's own event. The squares on the Court's Study panel and in Today's path are real; a study stop has "Card done" / "Not done after all".
- **Focus and sound for the whole app (`[2c-cp1]`).** A Focus button in the top bar of every page and style. Timer: what for, minutes, area; today's study cards and job applications offered; pause, finish now, stop without logging; the countdown in the top bar and the tab's title. On finishing: a done time block on the calendar, and for a study card a focus session on the card (`POST /api/day/study/focus`). Sound: saved YouTube and Spotify links (the hub's playlist first) in a corner player that stays on the page across pages.
- **Review (`[2c-cp2]`).** `GET /api/review?from&to` and the page `/review`: five figures, the week day by day, what slipped, links to the hub's own Review, Progress and Analytics.
- The tick squares had no border on the Madder, Indigo and Paper Courts (those styles strip buttons of theirs), so the shopping ticks of the afternoon were invisible there. Fixed.
- Paper's quiet Court header now shows Focus beside Style; the older styles' top bar keeps twelve entries on one line at 1440.
- Brief `briefs/stage-2c-focus-and-review.md`; `TODO.md`, `STATUS.md`, `DECISIONS.md` updated.

## Files and commits
- `6787f9e` [2b-cp10] `hosting/study/hub/tick.mjs` (+ test), `hosting/app.mjs`, `hosting/day/service.mjs`, `DayParts.jsx`, `lib/useDayPage.js`, `styles/day.css`
- `067ba54` [2b] the corrected time of the blank hub page in the records
- `f0cb63c` [2c-cp1] `lib/focus.jsx`, `lib/studyHub.js`, `components/FocusDock.jsx`, `styles/focus.css`, `CourtLayout.jsx`, `TheCourt.jsx`, `App.jsx`, `main.jsx`, `shared/entryTypes.js` (time block: `focus`, `minutes`), `tick.mjs` (`focusState`)
- `aea2f5c` [2c-cp2] `hosting/review/service.mjs` (+ test), `components/ReviewView.jsx`, `styles/review.css`, `styles/skins.css`, `hosting/home/shopping.mjs` (Budget's `forecast` exposed), nav entries
- All on `stage/4b-one-look`, my own paths only.

## How I checked it
- Tests: 80 pass (`node --test hosting/review/service.test.mjs hosting/study/hub/tick.test.mjs hosting/calendar/calendar.test.mjs hosting/day/service.test.mjs hosting/day/page.test.mjs hosting/home/shopping.test.mjs hosting/study/calendar.test.mjs hosting/calendar-route.test.mjs hosting/skins/modes.test.mjs hosting/skins/recolor.test.mjs code/life-os/backend/test/entryTypes.test.js`).
- **On the try-out (test database), for real, before live:**
  - A step ticked on the Court with a hub page open on the same card in a second tab: the hub page reloaded by itself and showed the tick; a step then ticked in the hub saved without a conflict; the Court showed it on its next look. Untick, "Card done", "Not done after all": all saved; the hub's event log holds each.
  - A one-minute focus session on a study card: the countdown followed through Today, Study hub, Budget, JobMap and Calendar; a reload in the middle kept the time; it ended by the clock, the calendar entry it wanted to save was caught in the browser (the try-out shares the real core database) and read correctly, and the hub got `focus_session.completed` with the card's hours.
  - The player: the same element stayed on the page across five pages (so the sound does not restart); hidden, it stayed on the page.
  - The Focus panel in each style, Modern dark and at 390 px: nothing outside the panel, no sideways scroll.
  - The Review page in each style, dark, 1180 px and 390 px; and with a fuller made-up week laid over the answer in the browser, to see the bars, the over-budget meter and the lists.
- **On live, changing nothing:** the two study addresses with a card that is gone (404), a step that is gone (404), nothing named (400), a step already as it is (200, no save; the semester's save count 8 before and after). A session started, walked through four pages and stopped without logging, with every write refused in the browser. Every page loaded fresh in Modern, Madder and Paper: no errors, nothing "could not be read".

## Data touched
- **Live:** none by me. No study state, entry, Budget or JobMap record was written. (Xar's own use during the evening: Budget revision 93 to 100 and two receipts.)
- **Test database:** refreshed from live four times (`copy-live-to-test.mjs`) and written to by the try-out runs.
- The try-out is stopped and its folders (`dist-next`, `.runtime/hub-dev/copies`) removed. `summer-rescue/dist-hub` was rebuilt for the try-out and left in place.

## Problems and surprises
- **The first version of the study tick would have caused the very clash it was meant to avoid.** It saved correctly, but an open hub page did not hear of it and its next save was refused (409). Two causes, both found only by trying it for real with two tabs: the hub puts the semester in its channel's name (`study-hub:<semester>:summer-rescue-tracker-state`; `hub/session.js` wraps `BroadcastChannel`), and I had also closed the channel straight after posting. Neither would have shown in a unit test.
- **Life OS was not running when I came back to it** after a break in the session (about 17:26 to 20:53): `launch.mjs --stop` reported it already stopped. I started it. I do not know when it stopped or why; the session's restart is the likeliest cause.
- **I guessed the clock in the earlier report.** The Study hub page was blank for four minutes (17:13 to 17:17), not "about fifteen around 18:00". The build files' times settle it; the records are corrected.
- Long edit scripts sent through the shell kept breaking on quotes. Scripts are written to a file first.
- The hub counts a focus session of one minute as a quarter of an hour on the card (its own rule; the Life OS timer follows it).

## Small decisions I made, and questions for Xar
- A session under a minute logs nothing. "Stop without logging" exists beside "Finish now".
- A time block the timer wrote is "time spent"; it is not counted as "time set aside" in the Jobs panel.
- The review's "plans left unticked" includes time set aside that was not ticked done (for example Monday's "Job applications").
- The comparison on the review's figures is with the same days of the week before while the week is running.
- **Questions:** her targets (applications a week, focus hours a day)? Should the hub's forest and levels exist outside study? Which of the two timers does she want to use for study?

## Next step
Repeating plans (job time ends on 25 October), then the week planner; both are in `briefs/stage-2c-focus-and-review.md` (CP4). Before that, ask her to try the acceptance list in the brief.
