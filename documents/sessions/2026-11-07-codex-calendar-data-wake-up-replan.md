# 2026-11-07 - Codex - Calendar data - Wake-up replan

## Goal
Shift the unfinished day after Xar reported waking up later.

## What I did
- Moved the personal routine and meals later, preserving their order.
- Allocated two hours to interview preparation and 90 minutes to the linked project block.
- Moved groceries to the following day and kept a short optional job-review window.

## Files and commits
Documentation checkpoint `[calendar-data-cp4] Shift the day after late wake-up`. Private snapshots, preview, dump, journal and verification are in `.runtime/wake-up-replan-2026-11-07/`.

## How I checked it
Preview overlap checks, guarded API writes and exact readback passed. Reloaded My day in the in-app browser and confirmed the shifted routine, linked project block and two hours of interview preparation. All other entries and the complete Study progress state compared equal.

## Data touched
Fourteen existing core entries retimed and one Study schedule rule retimed. Core stays at 276 entries, Study state revision 112. A PostgreSQL custom dump was verified as PGDMP before writes. Data changes used server APIs and revision/hash guards.

## Problems and surprises
The browser runtime needed a fresh tab binding, then the page reloaded successfully.

## Small decisions I made, and questions for Xar
Used 12:40 as the new start. Moved groceries to Sunday, reduced the project reservation to 90 minutes and prioritised two hours of interview preparation within the shorter day.

## Next step
Use the updated day. The development next step is still stage 7 CP5.
