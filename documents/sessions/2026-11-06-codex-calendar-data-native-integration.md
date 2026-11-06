# 2026-11-06 ? Codex ? Calendar data ? Native integration

## Goal
Integrate Xar's planning capture into existing app sections and one shared day. After rejecting the generic Ledger capture, Xar explicitly chose data integration now and app development later.

## What I did
- Saved native planned meals in Budget, keeping clock reservations as meal breaks.
- Updated the existing JobMap interview priority/preparation and career-profile goals; present matching preferences are unchanged.
- Connected added project hours to existing Study cards and open checklists. Added independent review using existing course resources, without reopening completed history or changing enrolment.
- Added two native owed communications, one linked to the existing person. Appointments own their follow-up context in Health.
- Added typed research workstreams and dated research tasks in academia; split future product tasks in the mind room.
- Retired the large catch-all note and archived superseded generic blocks. No deletion, app code, schema, automation or new feature implementation.

## Files and commits
Documentation checkpoint: `[calendar-data-cp2] Integrate plans into owning app sections`. Private payloads, snapshots, scripts, dumps and receipts are in `.runtime/calendar-plan-2026-11-06/` and `.runtime/native-plan-integration-2026-11-06/`.

## How I checked it
Live readback, existing My day model and independent mapping review passed: native meals, Study links and open steps, interview and People follow-up; no new timed conflicts. Compared unrelated core/communication records, Study progress/notes/checkmarks, official assessments, teaching timetable and Summer history. Budget stocks/spending/recipes/prior meals and other JobMap jobs/evidence unchanged. No build needed for data-only changes. Visual check unavailable: browser access host unavailable; native app access timed out.

## Data touched
Earlier capture: core 209 to 249; Autumn Study 109 to 110. Correction: core 249 to 267, 23 existing revisions and 18 additions; two owed communications; Study 110 to 111; Budget 116 to 117 (20 to 23 meals); JobMap 69 to 71. PostgreSQL custom dumps verified PGDMP before core/Study/Mail writes; Budget automatic backup compared exactly; full JobMap API backup retained. No direct database write or migration. Mail message imports during this time were outside this task.

## Problems and surprises
No general project/task relation API or separate future-start matching mode. Profile goals do not change matching or automation. Dated research task occurrences preserve their room without a source fix. Some room records still open in Ledger. These limitations remain future app work, as requested.

## Small decisions I made, and questions for Xar
Preserved unknown booking details/results/permission status and unconfirmed discussions. No messages sent or external bookings changed. Two older untracked documentation notes left untouched.

## Next step
Review My day and owning sections. Future task navigation/matching needs a later development request. Stage 7 CP5 remains the unrelated development next step.
