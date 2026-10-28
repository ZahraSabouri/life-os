# 2026-10-28 · Codex · Study Hub · materials and notifications audit

## Goal
Verify Claude’s module refresh and make the related local material, Study Hub, deadlines and reminders current.

## What I did
- Verified 34 recent manifest hashes, project originals, CMT309 package counts and 53 native file URLs. Saved live MAT022/CMT309 announcements and portal deadline evidence. Corrected stale index wording and added a project submission checklist.
- Fixed TSV discovery; the WAND dataset now appears in Study Hub. Linked 35 existing Test 2 and project cards to published materials, preserving progress and checklist IDs. Replaced unpublished hw4/future-lecture instructions with current sources.
- Patched both stale module overview summaries and three assessments through the server API: project due 13 Nov 23:59; Test 2 guide/coverage; CMT309 portal date 27 Dec 23:59. Preserved 17 Dec as the personal target and an explicit conflict with the older calendar.
- Fixed the countdown to read official upcoming assessments without writing a duplicate module date. Built only summer-rescue with --base=/apps/summer-rescue/, preserving the main frontend build and others’ pending work.

## Files and commits
Own code: hosting/study/discovery.mjs and test; summer-rescue/src/utils/assessmentTargets.js and test; examDates.js; App.jsx. Personal exports/scripts are in .runtime/university-audit-2026-10-28 and source folders, outside git.

## How I checked it
Discovery/notices: 22 passed, one skipped (host cannot make symlinks). Assessment-target/notification tests: 5 passed. Study build passed. Native URLs return byte-identical files; assessment calendar has each item once. Future-date notices include Test 2 and project. Live browser confirms the named Test 2 countdown and current module summary; screenshot saved as .runtime/university-audit-2026-10-28/study-hub-verified.png.

## Data touched
Study state revision 52 to 53 (opening the app generated notice saves after the initial revision-50 audit). 35 card definitions, three assessment records and discovered materials. Card count 92 and planned blocks 190 unchanged; cards overlays, notes, ticks, plan and sessions compare equal. PostgreSQL backup: ../Life_OS_backups/study-2026-10-28/before-university-audit-1793210251083.dump, PGDMP verified. Build backup: .runtime/university-audit-2026-10-28/study-dist-before/.

## Problems and surprises
TSV had been skipped. The Study countdown ignored native assessments and called the official test unconfirmed. A temporary plain Vite build used the root base; rebuilt immediately with the required subpath before handoff. CMT309’s date conflict remains explicit. Test 2 formula sheet and practice questions remain unpublished. Folder discovery already contains many generated Study App source assets; this audit preserved those records.

## Small decisions I made, and questions for Xar
Kept existing 17 December finish target while displaying the live 27 December portal deadline. No notification preference changed; actual Windows toast delivery was not triggered.

## Next step
Use the linked cards; check the Test 2 folder for formula sheet/practice release. Ask the lecturer which CMT309 date is authoritative.
