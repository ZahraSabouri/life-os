# Health gym plans

Directly requested by Xar, 28 October 2026: “if health part isnt developed enough to contain gym plan, then do the coding and development and then implement the plan”. This supersedes accepting the Ledger/text-field workaround as the final implementation. The scope below implements that request without another approval round.

29 October follow-up: “why cant i see the pics anywhere# then”. Exercise pictures must be visible inside the plan and workouts, with a larger view, including the desk routine.

## Result

Health owns a readable, usable saved training plan: overview/goals, A/B templates, scheduled workouts, progressive phases and milestones, an optional desk routine and source references. A workout opens with separate exercises, technique instructions, target sets/reps, actual set/repetition/weight/hold tracking, rest timer and explicit progress/completion saves. Completed history survives reloads. Today and Calendar open the same workout records. No personal fitness content in app code.

## Checkpoints

- [x] CP1 Structured, validated plan/session/routine fields on existing core types; domain helpers and meaningful validation/logging/progression tests. No schema migration, destructive replacement or new database.
- [x] CP2 Health Gym page and structured workout UI, milestones/history, editable targets, explicit saves with stale-edit protection. Existing Health/programme/food/care features retained; mobile layout, errors and partial completion handled.
- [x] CP3 Back up and migrate only this session's previously imported plan/routine/20 workouts through guarded APIs. Keep IDs, dates, times, progress and original source text. Archive the generated Ledger workaround after native access is verified; no deletion. No study/job/Budget/JobMap changes.
- [x] CP4 Focused tests, isolated build and preserved live frontend; real browser walkthrough at desktop/mobile, logging/reload/409 checks on intercepted fixtures (no invented real progress). Update Guide, inventory, STATUS, TODO, DECISIONS and new session note; commit only own work.
- [x] Visible local pictures for every saved A/B exercise and all three desk movements; enlarge on desktop/phone, accessible descriptions, source credits, offline assets. Keep the latest Calendar/Inbox/Guide build intact.

## Boundaries

Two weekly gym reservations, protected days/evenings and Christmas recovery remain as chosen. Progression depends on actual readiness, with no guessed starting weights/machines, diagnoses or false completion. Original documents and historical text remain private/preserved. Six-month material is a review framework; no new calendar sessions beyond December. Current document statements are reference material, not fresh instructions.

## Acceptance

Open Health → Gym, see the actual saved plan and next workout, inspect A/B technique, open a scheduled workout, enter/retain set results, use the rest timer and save partial progress, then explicitly finish with actual duration. Undo a completed set and reopen a finished workout without data loss. On a stale save show a reload/retry path and retain unsaved draft values. No Ledger wall of text is required to use the plan.
