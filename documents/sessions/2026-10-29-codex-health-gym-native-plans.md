# 2026-10-29 · Codex · Health · native gym plans and workout logging

## Goal

Xar rejected the Ledger/text-field workaround and its screenshot: “if health part isnt developed enough to contain gym plan, then do the coding and development and then implement the plan”. Build the missing Health workflow and implement her supplied references there. This is direct development authorisation. The request began late on 28 October; the client date advanced to 29 October while work continued.

## What I did

- Read current AGENTS, STATUS, latest Calendar/Inbox notes, the Health brief and existing data/UI. Checked status/log and ownership: concurrent Calendar, shell, skins, JobMap and mail edits existed, later staged by another session. Kept them separate.
- Added validated structured plan/session/routine fields to existing core types. Plan content remains personal API data: no goals, exercise prescriptions, dates or equipment inventory hardcoded in app code. No new tables/schema/database.
- Added **Health → Gym**, also linked from Health's week/exercise screens. It contains overview/goals, next workout, A/B templates with expandable technique, scheduled workouts, readiness phases, milestones/history, optional desk routine and source/options pages. Overview is editable.
- Workout screens have separate exercises and set rows, actual repetitions/weight/hold time, editable targets/rests, optional added sets, a rest timer, actual duration/comfort/note, start/save/finish/reopen and reversible skip/restore. Previous completed results appear by exercise. Unrelated programmes/library stay on Exercise rather than filling the open workout screen.
- Drafts survive reload in this browser; saves check the timestamp originally loaded. A 409 retains the draft and offers an explicit latest-version reload. Actual finish requires exercise time and at least one actual set (recovery-only sessions need actual time). Unchecked sets remain unchecked. Core POST/PATCH also refuse a generic Done that would invent a structured workout completion. Today/Health offer “Log sets”.
- Migrated the existing plan, routine and 20 workouts through guarded APIs; all IDs, times/statuses, original text and other personal fields retained. No new entries/progress. Archived the generated Ledger guide only after native access passed; replaced its visible wall of text with a short Health pointer, preserving the complete former body in its note and backup.
- Updated Guide instructions, two screenshot recipes/pictures and the plans inventory. No source DOCX/PDF edited, no medical/biometric facts inferred, no new workout dates. Two-day pattern and Christmas recovery remain.
- Xar then asked “why cant i see the pics anywhere# then”. Added a general local picture library: five public-domain photo pairs and thirteen original paired movement diagrams (including the easier heel tap). All 14 distinct prescribed exercises and all three desk movements now show pictures without opening technique; tap to enlarge. Phone enlargements stack the two views. Source credits/references and accessible descriptions are included. No picture requires an external server. Documents themselves contained no embedded exercise pictures; these are newly supplied visuals, not extracted figures or new document instructions.

## Files and commits

Own code: shared health/training.js and tests; core entry-type/route validation; Health GymPlans UI, Health week/exercise/view/parts, useHealth, styles, generic structured-field preservation, renderer tests, API safety tests, Health Guide chapter and screenshot recipes. Own documents: this note, `briefs/health-gym-plans.md`, STATUS, TODO, DECISIONS and inventory.

Checkpoint commit: `[health-gym-cp1] Native gym plans and workout logging (Codex)` on `stage/4b-one-look`. Personal data, source copies, build/backup artifacts and screenshots remain ignored. No push.

## How I checked it

- **25 focused tests pass:** 19 domain/core API/old Health/entry-patch/picture tests, plus six server-render tests. Checks include nested data roundtrip, invalid/duplicate/negative/unsafe input, partial finish, actual minutes, prior results, old clients, POST/PATCH completion protection, escaping source text, structured fields retained by generic forms, native controls without raw source blocks, “Log sets”, local image existence/descriptions, movement lookup and visible picture controls. No reseeding app/query tests run.
- **Intercepted browser workflow passes:** overview/technique, start, move while retaining reservation length and sets, skip/restore, repetitions/weight (including zero), save/reload, unsaved draft restore, forced stale-save refusal/reload, rest timer, partial finish/reopen, milestones/history, mobile overflow and themes. Nine fixture writes; **zero real test writes**. Existing four generic programmes/library still available.
- **Production build passes.** To avoid shipping concurrent source edits or the pending Inbox, archived commit `83a8f47` into an isolated workspace. Its compiled index/assets matched the installed `index-JgdiF6ap.js` / `index-BfQSQm9g.css` exactly. Applied only Health changes and the Health Guide hunk, built and published new assets with an index/hash concurrency guard. Existing assets/fonts retained. Original distribution preserved. Fonts are absent from the Git archive, so Vite warned about runtime-resolved fonts; the live font files were retained and browser responses pass. Existing large-chunk warning remains.
- **Live Chrome passes:** native overview/workouts/progress/routine/references, A/B structured screen, Today → actual workout link, phone width and Madder. Zero page errors/failed local responses; no browser save left the intercepted walk. Every scheduled workout remains projected at the exact same time with its Health link. Two Guide pictures retaken.
- **Picture/build follow-up:** a subsequent Calendar/Mail publication replaced the frontend; another session then restored working-tree Gym/pictures. The publish hash guard correctly refused to overwrite that newer build. Verified `f8673e4` reproduced the intervening Calendar build exactly, then retained the newer committed Calendar/Inbox/Guide when finishing phone enlargement. All tracked frontend/shared deviations were checked as this session's Health files before the final separate-output build. Atomic guarded publication passed; original and intervening distributions preserved (`dist-before/`, `dist-calendar-before/`, `dist-with-mail-before/`). Final assets: `index-B__VcqDE.js`, `index-CVDpl1AB.css`. No mail migration/import was performed by this session; the other session's authorised activation stays live.
- **Picture Chrome checks pass in isolated and final live app:** all 15 A/B template occurrences and all three desk movements load real local images; each A/B workout has pictures for every exercise; enlarge, Escape/Close and phone overflow pass. Reviewed the full diagram contact sheet and desktop/phone screenshots. No real data writes. Final readback: 207 core entries, every one of the 20 gym records exactly unchanged by this picture follow-up. Guide screenshots retaken: 108/108 present.
- Final snapshot after restart matches saved entries; Study/workspace, Budget and JobMap compare exactly unchanged. All 20 workouts remain planned; every set has blank actual values/false completion. Backup SQLite quick_check `ok`. No newly completed milestones.

## Data touched

- Core remains **207 entries**. Structured fields added to one existing training plan, one routine and 20 workouts. One generated guide archived; none deleted. Original fields and source text retained; only the generated plan title shortened. No exercise completion, changed gym times or extra calendar commitments.
- Study stays revision 54, 72 cards/136 rules; Budget 110; JobMap 52/1,211 jobs. No Cardiff research changes.
- Core backup via **VACUUM INTO**: `../Life_OS_backups/core-2026-10-29/before-native-gym-1793232712707.db`.
- Private run folder: `.runtime/health-gym-2026-10-29/`: before/proposal/after/applied receipts, build-scope/published manifests, baseline and Health distributions, `dist-before/`, browser results/screenshots and one-off scripts. Source originals/copies/hashes remain in the prior private workout folder. PostgreSQL unchanged; no migration/mail import enabled.

## Problems and surprises

- The earlier data-only import was not an adequate gym product. A native interface was required; acknowledged and replaced it rather than asking Xar to accept the workaround.
- A timer initially displayed 91 seconds from a stale clock sample; fixed its start timestamp. An async milestone test needed to wait for the saved checked state. Both then passed. The first mobile workout still included the unrelated catalogue; restricted that to the Exercise overview and repeated the checks.
- Other sessions staged many unrelated files, including Guide changes, and subsequently committed them. Commit preparation includes only this session's paths and checks that the remaining Guide diff is Health-only. Cardiff test/mail prompt edits remain with their owners.
- Server restart necessarily loads the checkout's existing backend code. This session changed no mail migration/import flag. Another session later activated mail with its own backups/authorisation, recorded in its 29 October note. The final picture frontend retains that latest Calendar/Inbox/Guide plus Health.

## Small decisions I made, and questions for Xar

Kept existing core storage/IDs and timing. Technique is expandable, with pictures visible beforehand. Actual sets are distinct from planned targets; dates never silently increase weights or completion. Source document text remains private/preserved and old embedded prompts are not fresh instructions. Optional routine has no forced daily schedule. Picture matching is a general exercise-name catalogue, not personal prescription data in code; unrecognised custom exercises get no misleading image. Photo provenance/licence is in `src/assets/exercises/README.md`. No outstanding decision blocks the native implementation; actual equipment/load choices remain hers when training.

## Next step

Reload Life OS → Health → Gym → Open workout. Use How to do it, enter only actual sets, Save progress, then Finish with actual duration. Xar can assess the new Health workflow. Continue the study plan and Sunday reset unchanged. Mail activation/review and the concurrent Calendar/shell work remain separate.
