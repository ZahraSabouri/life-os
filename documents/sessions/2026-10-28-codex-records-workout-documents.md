# 2026-10-28 · Codex · Records · apply workout documents

## Goal

Xar supplied Desktop workout.docx and “Exercise and Workout Options for Your Goals at Howard Gardens.pdf”: “can you also add/effect these”, then “go on”. Incorporate them into the two weekly gym reservations just saved through December. Preserve the study/job plan, free days and original documents.

## What I did

- Read current AGENTS/STATUS, latest reset note, Health brief/data shapes and git status/log. Others' existing frontend, shared-types, day/calendar and Cardiff test changes remain untouched. No new app code or build.
- Read all DOCX text/tables (464 paragraphs, no images) and all 12 PDF pages; rendered/inspected PDF table pages. Distinguished old embedded prompts, optional three/four-day examples and questions from the current instruction to apply the references.
- Preserved both originals and byte-identical private copies with SHA-256 provenance. Asked one current-limits clarification; response retained privately, without importing historical medical statements or creating clinical measurements.
- Checked primary ACSM 2026 resistance-training and NHS strength/neck/knee guidance. Used the supplied A/B foundation with gradual progression, conditional machine alternatives and no guessed starting load. Exercises have equipment, repetition guidance and plain technique steps, warm-up, rests and finishing/log instructions.
- Updated all 20 existing gym entries in place. Kept all dates/times/statuses. First A: Friday 30 October 08:30; first B: Sunday 1 November 13:15. These are planned reservations, not completed exercise or assumed aerobic minutes.
- Kept two weekly visits rather than the document's optional three/four-day pattern. Full-body strength sessions have at least 48 hours between them. On 23 December, the adjacent Christmas-week visit is light recovery because 22 December already has strength work; no work moved onto protected days.
- Saved one structured training plan, one undated optional desk routine and a readable combined reference note. Later exercise options, milestones and months 3–6 remain review material, with no dates added beyond December. Optional desk movement fits existing breaks, not new daily calendar blocks.

## Files and commits

Private work: `.runtime/workout-update-2026-10-28/` (source copies/hashes, extracted texts, update/readable-guide scripts, before/proposal/after/receipt, screenshots). Original Desktop files unchanged. Commit only this note, STATUS, TODO and DECISIONS as `Records: Apply workout references to planned gym sessions (Codex)` on `stage/4b-one-look`; no push.

## How I checked it

- Read-only dry run validates the API shapes without stripping fields; exactly 20 intended targets still equal the just-saved reset records; all remain planned. Conflicts/changed personal edits would stop instead of forcing a save.
- Backup made with VACUUM INTO; SQLite quick_check `ok`. API PATCH uses If-Match on the timestamp freshly read. New records use POST; no database-file edits.
- After saving: all 20 workout times/statuses/favourites retained; titles/details exactly match the proposal; all unrelated original entries unchanged. Complete Study state/workspace, Budget and JobMap compare unchanged. No workout, study tick or milestone newly completed. Source originals still match their recorded hashes.
- Chrome headless with playwright-core from summer-rescue, all browser mutations blocked: opened A, B and Christmas recovery in Health, first session on Today, and the readable Ledger guide. All exercise text/full guide present; screenshots inspected. Zero page errors and failed local responses. No code tests/build needed for personal-data edits.

## Data touched

- Core: 204→207 entries; 20 existing workouts updated; three undated records added (training plan, optional mobility routine, readable reference note); none removed/archived/completed. Nineteen planned strength sessions plus one optional recovery visit.
- Study stays revision 54, 72 cards/136 rules; Budget 110; JobMap 52/1,211 jobs. No Cardiff research or calendar-time changes.
- Backup: `../Life_OS_backups/core-2026-10-28/before-workout-documents-1793229635508.db`. Private `before.json`, `proposal.json`, `after.json`, `receipt.json`, source hashes/copies and browser results identify exact affected records. No raw personal documents, exercise logs or private clarification committed.

## Problems and surprises

- Initial dry-run comparison mistook schema key reordering for changed fields; corrected to structural equality before any write.
- Ledger displays no common note for structured workout-plan/routine entries. Added a normal body-area note holding the readable guide using existing APIs; did not change app code. Health already renders each session's exercises in full.
- Exact machine inventory and usable starting weights are still unknown. Their alternatives stay conditional; no illustrations or images requested by old embedded document text were generated.

## Small decisions I made, and questions for Xar

Kept the confirmed two-day pattern, used one-set options during deadline pressure, made progression conditional on actual completed comfortable sessions, and converted the adjacent 23 December visit to recovery. The hour remains reserved capacity, with actual duration/effort to be logged afterwards. Original source guidance and the broader research menu remain available without scheduling every option.

## Next step

Open Health → Exercise → Gym A/B, or the session from Today/Calendar. The Ledger's “Howard Gardens · Workout and desk-break guide” holds the readable overview and optional desk routine. After first sessions, record actual equipment/loads/repetitions/comfort and repeat the foundation when needed. Continue the university plan and Sunday reset unchanged.
