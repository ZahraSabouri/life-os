# 2026-11-01 · Codex · Documentation · Data structure explanation

## Goal

Explain the project's current data structure following the linked Excel dictionary.

## What I did

- Checked current status, the relevant brief and recent notes, Git state, the dictionary's sheet inventory, and current core/Study/Mail schemas and module readers.
- Explained the shared core and separately owned Study, Budget, JobMap, Mail and Cardiff data; SQL tables versus nested JSON collections; primary/foreign keys and linking tables; and the distinction between editable Study workspace state and projected card records.
- Included the current separation of source evidence from personal choices and the shared calendar's read adapters. Distinguished the implementation from the architecture's longer-term unified PostgreSQL plan.

## Files and commits

- This note and the STATUS date/latest-session list only. No app checkpoint, workbook edit, code change, commit or push. All existing changes preserved.

## How I checked it

Read-only inspection of source files and the XLSX package. The existing dictionary has 99 sheets, with 32 active SQL definition sheets and 16 retained legacy definition sheets. Rechecked core links, native Study record/workspace migrations and projections, JobMap merge precedence, Budget validation, Mail source/user fields and Cardiff browser choices. No app build or runtime/data-writing tests were needed for this explanation.

## Data touched

None. No app writes, imports, migrations, workbook changes or service changes.

## Problems and surprises

Workbook sheets include physical SQL tables, logical JSON collections and explanatory sheets. Their count is not a count of active SQL tables. Current storage remains mixed while the architecture describes a more unified target.

## Small decisions I made, and questions for Xar

Used plain examples and a small Study relationship diagram. No new design decision or approval is needed.

## Next step

Use the workbook's Schema, Tables and Relationships sheets to follow the explanation. App next steps remain as previously recorded.
