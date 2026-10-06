# 2026-10-06 · Codex · Stage 3 · CP2

## Goal
Bring preserved Summer Rescue into native Study without overwriting newer records; verify recovery and Calendar integration.

## What I did
- Applied reviewed API import: 352 original records, including 128 cards, 503 stable checks, 211 materials, 949 retained links. Removed resource links stay removed; full saved archive/settings/history remain.
- Separately existing autumn records retained. Current active aggregate: 2 semesters, 10 modules, 132 cards, 2 assessments, 81 sessions, 289 materials. Fixed verification's empty-destination assumption: imported provenance checked separately; all nonlegacy records compared before/after.
- Repeat adds zero. Added complete native material backup before new imports and reusable database/file restore verifier.
- Fixed shared Calendar service accepting only legacy shape; native timetable/deadlines now reach the provider and link to native editors without counting legacy twice.

## Files and commits
Checkpoint `[3-cp2] Import Study history and connect the shared calendar`: Calendar service/fixture, Study backup/runtime/restore script, docs. Private evidence ignored.

## How I checked it
- Actual dump restored into fresh lifeos_restore_1791293948649_653e49fa; all 11 Study tables' counts/content hashes match. No clean/drop; target preserved.
- Material snapshot materials-1791293939474-fd32cbd3: 289 files, 273,790,274 bytes, copied to separate restore; all hashes match.
- 25 targeted shared/native Calendar tests pass. Live seven-source October and July/August checks pass after attached sources started; Study contributes 28/242 items. Unique IDs, kinds/native links, auth/range checked.
- Import/read checks leave five protected source files/core entry/person content/counts unchanged (7/1/12). CUA shows imported native modules/cards. No dummy production saves.

## Data touched
Target/source backups preceded import. Latest source/core snapshot: ../Life_OS_backups/study-2026-10-06/source-1791293828585. Dump: ../Life_OS_backups/study-2026-10-06/restore-verification-1791293938602.dump. File snapshot/restore beside it. Source unedited, standalone preserved. Existing autumn data's authorship was not inferred.

## Problems / decisions
Browser blocks separate test origin; synthetic writes stay on guarded lifeos_test. Immediate post-restart Calendar check saw attached sources starting; final ready checks pass. CP3 will initially focus the current dated semester while retaining All semesters and preserving the old plan.

## Next step
Finish richer reasoned planning/progress, connected workbench, practice tools and shelves; responsive/ground browser review. No main merge/source retirement before acceptance.
