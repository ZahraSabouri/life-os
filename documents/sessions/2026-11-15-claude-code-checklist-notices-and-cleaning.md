# 2026-11-15 · Claude Code · The day's checklist, notices, and clearing out what is over

## Goal
Xar, 14 November night: "the app's not usable at all!": tests for how Study hub cards appear and their look; everything about a thing visible when it is opened on the calendar; a checklist for every day; a picture of the week and the month; a much better experience overall. Then: a notice for an event did not open the event; better handling of notices, "especially handling the old notifs"; every checklist before today marked done; "notifications still suck in a way"; and "a cleaning in the plans and data and all sorts of passed deadlines and events and job etc". Each objective is quoted in `TODO.md` section N.

## What I did
- **The day's checklist (`[day-cp1]`):** Today, every Court and the calendar's day show one list of everything in the day in time order, each line ticked where it is kept; what keeps no done-state of its own (a class, a study block, a session, a day of a repeating plan) keeps a tick for the day (`hosting/day/checks.mjs`, setting `checks-YYYY-MM-DD`). Study hub cards fold to one line that opens to their steps. The top line says "Now · until 12:00" while a thing is under way and "Next" before it starts (this session).
- **A thing, opened:** `hosting/thing.mjs` reads the whole record (core entries and repeats, Study cards, sessions and assessments, JobMap, Events); the calendar's pop-up shows its notes, description, steps, staff, room, files and links.
- **Pictures:** `/glance`, the week as a timetable and the month as a grid, hours by module and area, "Save as image".
- **Notices (`[day-cp1]`, `[day-cp3]`):** a click goes where it leads; an event's address (`/events#event=…`) opens the event in Events; old notices keep a stable name so what was seen stays seen; Inbox things more than a week late fold into one line; Slipped folds; Done, Not needed, Hide, Clear slipped. Only her own events and the ones she chose in Events are told about: her choices are copied from the browser to the setting `event-choices` (a browser with none never overwrites). Jobs closing today in one line; renewals and the budget month in words.
- **Study hub (`[day-cp2]`):** with every exam behind, the countdown points at the next coursework due.
- **Today's Study panel:** "This week" listed cards already started but due in December; it is now headed "Started, due later".
- **Past days:** every plan and tick before 15 November marked done, at her request (`.runtime/past-days-done-2026-11-15/`).
- **Clearing out (data only, through the APIs, `.runtime/cleaning-2026-11-15/`):** inventory → plan → apply → verify. JobMap: 562 adverts whose deadline passed while still To review, Check details or Preparing → Archived with outcome "Missed deadline" (58 of them she had saved); the Cardiff Integration Developer follow-up date (passed) cleared, the application stays Applied. Inbox: 9 things over → Not needed (past mid-module feedback windows, the WMC Hackathon, the finished MAT022 module's group and reading tasks, a duplicate "Read the CMT309 coursework questions"); "Ask Ben" snoozed to Monday 16 November. Study: the MAT022 final group project → done (Blackboard receipt of 13 November 21:25). Core: the Diwali party and the blood test → done; five gym sessions from before the restart → archived.

## Files and commits
- `8874037` [day-cp1] A checklist for every day, everything about a thing, the week and month as pictures, notices that lead somewhere
- `536fe0b` [day-cp2] The Study hub counts to what is next, not to a past exam; the Guide follows the checklist
- `9ac213e` [day-cp3] Notices only about her events; closings in one line; renewals say what they are
- [day-cp4] (this note): "Now" in the checklist, the Study panel heading, the calendar-day picture recipe, TODO N ticked, STATUS.

## How I checked it
Frontend unit tests 62 pass; render tests: checklist 5, Tasks 4, Study 2, Inbox 11 (training-render cannot run under the render runner: it imports SVG files by URL). Hosting tests for notices, day, checks, things and mail pass; Events 13; Study hub suite as before (11 known failures). In a headless browser with her real data (saves answered inside the browser): the bell after the cleaning holds 9 notices (1 on now, 3 today, 1 slipped, 4 coming up), each leading somewhere; the checklist's top line reads "Now · until 12:00". Guide pictures retaken: notices, today, today-tasks, court, court-tasks, calendar-day.

## Data touched
PostgreSQL dump `before-cleaning-1794743597436.dump` (PGDMP header checked) and JobMap's own backup at revision 104, both before any write. JobMap revision 104 → 667 (563 changes; the first run stopped at about the 108th when JobMap briefly refused; `resume.mjs` re-read the revision, skipped what was done and finished with no refusals). Afterwards: no job open past its deadline, 1,054 open with a deadline ahead, no passed follow-ups. Inbox: 10 changes, 25 open or snoozed left. Study: one assessment. Core: 7 entries. Nothing deleted. Journal: `.runtime/cleaning-2026-11-15/journal.json`.

## Problems and surprises
- The bell, the pop-ups and Windows told her about every event in the Events catalogue, because her choices lived only in her browser.
- The calendar-day picture waited for the old path list, which the checklist replaced.
- The empty `.git` folder in `code/life-os` (5 October, owned by the Codex sandbox) makes git complain when run from inside it; the project's repository is the root.

## Small decisions I made, and questions for Xar
- What is over is archived or put Not needed, never deleted; the 58 saved adverts that closed are archived with the rest (still found under Archived in JobMap).
- Left open for her to decide: "Complete Jobshop onboarding for the Student Developer role" (shown as slipped), the two PayPal lines in Waiting on you, the Cardiff Student Developer setup lines.

## Next step
Xar uses the plan from Monday 16 November. Development: stage 7 CP5, the public version.
