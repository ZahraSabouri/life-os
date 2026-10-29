# Life OS: status

**Updated 29 October 2026 by Claude Code** (the Calendar finished and pushed; Codex's Health → Gym of the same night kept). Branch `stage/4b-one-look`, and `main` level with it; running at http://127.0.0.1:47850 (Budget 47851, JobMap 47852). Standalone JobMap is frozen.

## Now

**Calendar, finished and live** (her "elevate ux, cover uncovereds … push it to main"): everything is in the address and Back works, now also inside **Cardiff Life** ("Open in Cardiff Life" opens the event itself) and **JobMap** (an open job, its views), and for the bell, Focus, the style menu and the phone menu. **Drag her own plans** to another day (Month or Week) with **Undo**; **"+"** on a day and a **click on an empty hour** in Week add with the time filled in; Undo after Done, Take off the day and Move; swipe between days on a phone; List starts at today. [Session](sessions/2026-10-29-claude-code-calendar-cover-and-elevate.md), [brief](briefs/calendar-day-and-addresses.md).

**Inbox (published at her choice, not yet working):** the Inbox pages, Today's "Waiting on you" and the envelope are live but say they cannot read mail, and the Calendar says "Mail and admin" could not be read, until the mail schema migration and a first real batch on `lifeos_test` (see `mail/AGENT-PROMPTS.md`, the 28 October Inbox notes). Nobody has migrated or enabled it.

**Health → Gym (Codex, live):** her plan, A/B technique templates, scheduled workouts with set/repetition/weight logging, rest timer, move, skip and reopen; all 20 gym slots kept; nothing marked done. Codex's files are not committed yet. [Session](sessions/2026-10-29-codex-health-gym-native-plans.md), [brief](briefs/health-gym-plans.md).

**Study/reset:** 72 cards/136 blocks through 31 December. Test 2: 6 November (20%); project: 13 November 23:59 (60%); CMT309 cautious finish 17 December, portal 27 December; MAT021 starts 16 November. Mondays/Saturdays, Friday/Sunday evenings and 24–27 December protected. Cardiff research 149 events/90 communities/11 opportunities; Outlook backfill partial.

## Exact next step

1. Xar reloads Life OS and tries the Calendar checklist (brief, items 1–9): Next month then Back; drag "Job applications" in Week and Undo; "Open in Cardiff Life" then Back; a JobMap job then Back.
2. **Health → Gym → Open workout**; first session Friday 30 October 08:30. Log only actual work.
3. Study via Today/Study hub → Week; check the Test 2 formula sheet and questions.

**Next prompt:** "Check the newly released Test 2 material and adjust my plan around what I actually completed."

## Waiting and limits

- Xar: run the mail migration and first batch when ready; should a note about a JobMap job go into JobMap's own notes?; project part/check-ins; CMT309's 17/27 December; chosen events. MAT021 dates unknown.
- Calendar limits: Budget's smaller dialogs are not in its address; dragging needs a mouse (phones use "Move to"); a plan over several days moves with Change.
- Existing issues: false hub "Studied today"; test plus containing lecture; generic `test` kind at end time. Earlier acceptance/Guide/JobMap questions remain in TODO. Health machine inventory and starting loads unknown; no auto-progression.
- Don't run `hosting/app.test.mjs` (it reseeds the core). Browser checks use `playwright-core` from `summer-rescue`.

## Data and latest sessions

Core **207 entries**; Study 54; Budget 110; JobMap 52/1,211 jobs. The Calendar sessions changed no data (saves caught in the browser); builds backed up in `.runtime/calendar-plus-2026-10-28/` and `-29/`. Native-gym backup: Codex's session. No schema migration.

Last five: Calendar finished (29 Oct, Claude Code); native Gym (29 Oct, Codex); Inbox CP2–CP5 (28 Oct); Calendar/day addresses (28 Oct); workout-document import (28 Oct). Notes in `documents/sessions/`.
