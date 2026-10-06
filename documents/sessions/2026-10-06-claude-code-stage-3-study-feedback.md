# 2026-10-06 · Claude Code · Stage 3 · Xar's feedback on Study, audit and proposal

## Goal
Xar reviewed native Study and gave three corrections. Check each against the app as built, fix what she named outright, and bring back a plan for the rest before changing anything structural (she asked to discuss before large deletions or rewrites).

## Xar's three points
1. **Study is a general study app, not her autumn-2026 tracker.** Semesters are defined by the user and chosen on entering Study; no import wording in the chooser. Health and Admin leave Study. Find the other awkward leftovers.
2. **Entering Study still feels like another app.** It needs base-level UI work from the documents and plans, not a recolour.
3. **Study must not plan the study by itself.** It offers tools (tasks, checklists, notes, focus) and module detail (classes, exams, coursework, projects, group projects, timetable). Nothing designed around her modules. Every item can be added, read, edited and removed. Feeds (JSON and others) come later.

## What I did
- Read the brief, the latest note, the Study frontend, the Study schema, and one GET of the workspace. Looked at Court, Calendar and Study in headless Chrome (modern and madder) with every non-GET request refused; no page tried to save.
- **Removed Health and Admin from Study** through the Study API: 14 cards and the two groups. They were summer-plan buffer days and checkpoints, with no logged hours or notes.
- **Renamed the semester "Imported Study plan" to "Summer 2026"** (a placeholder; Xar can rename it in the semester editor).
- Recorded the direction in `DECISIONS.md`, the hold on CP3 in the brief, and rewrote `STATUS.md`. No code changed.

## What I found
**Left over from the import**
- "Cross-module" is still a module (1 card). 5 cards have no module and no semester; they are university admin reminders, not study (two are dated 9 and 12 October, so I left them).
- Raw JSON of the old campaign settings under Settings; "Preserved notifications"; "Preserved snapshots"; an "Original Study" button on every page.
- Session kinds in the data (`teaching`, `university-period`) don't match the form (`class`, `study`, `project`, `exam`, `routine`). The three assessments have no type.

**Summer Rescue's method built into the structure**
- Task columns Today / This Week / Deep Work / Backlog / Waiting / Blocked / Rescue Lane / Done. They look editable in Preferences, but `lib/study.js` and `lib/studyInsights.js` depend on those exact names, so renaming one breaks the logic.
- Every task has Phase, Study slot (AM / PM / Light/Eve / Fixed / Flex), Slot details, Done when, Evidence to produce and an Evidence list.
- Modules have Study rules, Practice prompts, Methods and answer frames, and effort-share targets.
- Whole views: Planner, Evidence, Rescue.

**The app planning for the user**
- "Why this next?" (`studyFocusPicks`), "Needs attention", the pace line with cards per day, the effort balance.
- 109 "overdue" items and 109 notifications from a semester that ended on 18 August.

**Missing for a general study app**
- Choosing a semester on entry: today it is a dropdown that also offers "All semesters", and it opened on the summer plan because that was the last saved choice.
- A module page organised as classes, assessments, tasks, notes, materials: today a module is a filter over the card list.
- Notes of their own: today only inside a task, or one text box per module.
- Editable lists for kinds of class and kinds of assessment.
- Editing a repeating class as a series: each occurrence is a separate record.
- A module belongs to exactly one semester (a year-long module does not fit).

**Not one app**
- `/study` is routed outside `CourtLayout` (`App.jsx`), so the Life OS header disappears. Study brings its own sidebar, logo, top bar, buttons and dialogs: 170 KB of Summer Rescue CSS (`summer-rescue-transferred.css`, `summer-rescue-native.css`). Only the colours are shared (`study-skin.css`).
- There are no shared building blocks anywhere: Court, Calendar and Study each style their own buttons, cards and dialogs. The "reusable room shell" in the July plan (Inventory §5: "arrives with the first native module") was never built.
- Visible breakage on the Overview: the "Now and next" block is misplaced, and the "Done" label on a card wraps one letter per line.

**The storage underneath is sound.** Semesters, modules, cards, assessments, sessions and materials are separate tables with revisions, history and restore. Semesters can already be defined. The problems are in the vocabulary and the screens, plus three real gaps (notes, type lists, series).

## Proposal (not started; needs Xar's answers)
1. **One frame for the whole app.** Build the Life OS frame and a small set of shared building blocks once (header and navigation, room layout with its section menu, button, field, dialog, card, table, empty state), all reading the four styles. Move Study into it. The Summer Rescue styling goes; Study's behaviour stays.
2. **Study's structure made general.** A semester chooser on entry. A module page with Classes, Assessments, Tasks, Notes, Materials. Simple tasks: To do / Doing / Done, plus the user's own labels. Editable kinds of class and assessment. A notes table (one numbered migration). Remove Planner, Evidence, Rescue, "Why this next?", effort targets and the pace line. A semester past its end date stops raising overdue items.
3. **The summer data fitted to that shape, nothing lost.** Phase, slot, evidence, study rules, prompts and answer frames stay in each record and show as plain notes on the task or module.
4. Later, as Xar said: feeds and imports so items need not be typed.

Kept as they are: timetable, assessments, materials and the reader, focus timer, history and restore, import and export, the Calendar connection, all data.

## Files and commits
- The commit that adds this note: [3-cp3] Record Xar's Study feedback, remove Health and Admin, hold CP3

## How I checked it
- Counts before: 2 semesters, 10 modules, 137 cards, 3 assessments, 81 sessions, 287 materials. After: 2, 8, 123, 3, 81, 287.
- `GET /api/study/deleted` lists the 14 cards and 2 modules (and the 8 materials removed earlier today).
- `GET /api/calendar` for October: 84 items, all seven sources ready.
- No tests run: no code changed.

## Data touched
- Soft-removed through the API, each with its revision, each recorded in history: 8 Health cards, 6 Admin cards, the Health and Admin modules. Restore from Study > History.
- One semester title changed: "Imported Study plan" to "Summer 2026".
- Latest daily dump before this: `../Life_OS_backups/study-2026-10-06/daily-1791299450106.dump`.

## Problems and surprises
- The 6 October "keep Summer Rescue's design" instruction and "one general, unified app" pull in opposite directions; this feedback settles it for the frame and look.
- "Lanes are editable data" in `Study_and_Calendar_Backend.md` is only half true (see above).

## Questions for Xar
1. Remove Planner, Evidence, Rescue, "Why this next?", effort targets and the pace line completely?
2. Turn the summer plan's special fields into ordinary notes on each task and module?
3. Do any modules run across two semesters (a dissertation, a year-long project)?
4. Order: the shared frame first, then Study's structure?
5. The 5 university admin reminders with no module: leave for now, or remove from Study too?

## Next step
Xar answers the questions. Then write the plan into the brief as new checkpoints and build step 1. Do not continue the old CP3 "parity" items.
