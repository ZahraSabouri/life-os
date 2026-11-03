# 2026-10-31 · Codex · Documentation · Linked table dictionary

## Goal

Xar requested links between foreign keys and tables, a separate table on each sheet, and opening sheets explaining the general schema and individual tables.

## What I did

- Reorganised the existing workbook in place: `outputs/20261031-life-os-data-dictionary/Life_OS_Data_Dictionary.xlsx`.
- The first four sheets are Schema, Tables, Relationships and Guide. The Tables index explains the purpose, storage, key and definition count for each entity, with links to its definition.
- Each of the 94 detail sheets describes one database table or logical collection. Each of all 99 sheets contains exactly one native filtered Excel table. The 32 active SQL tables and 16 retained mirror tables are separately labelled. Registered core entry types and nested JSON stay with their owning entity.
- Added 1,361 native internal links: table index, schema groups, exact foreign-key targets, logical references, relationship map, table rules and return navigation. All 44 database foreign keys link to their exact referenced field as well as the parent table.
- Retained all 2,598 existing field definitions and 214 rules. Source references, evidence, nullability, defaults, units and user/source ownership remain available. General explanations distinguish SQL constraints from application references.

## Files and commits

- Workbook above, this new note, and the dictionary paragraph / latest-session list in STATUS. No app checkpoint, app code, migration, commit or push.
- Before-edit workbook and original builder retained privately in `.runtime/data-dictionary-20261031/`. Current builder, link manifest, export checks and previews are in the same folder.
- Preserved all pre-existing Cardiff, Mail and scheduled-workflow edits.

## How I checked it

- Read and rendered the existing workbook before reorganising it. Rendered the revised opening sheets and all entity sheets, reviewed the layouts and contact sheets.
- XLSX package checks pass: one native table and frozen headers per sheet, correct sheet order, native link labels and valid non-empty destinations, exact source/target fields for all 44 database foreign keys, no error cells, and complete original definition/rule preservation. Results: `.runtime/data-dictionary-20261031/linked-export-checks.json`.
- Reopened the final workbook through openpyxl in read-only-use analysis (no authoring/save). It recognises 99 sheets, one table on each, and all 1,361 native hyperlinks, including the checked `core.entry_people` → `core.entries.id` destination.
- Artifact Tool documents HYPERLINK but does not implement its calculation. Replaced those formulas with ordinary labels and added only the missing native OOXML hyperlink feature after Artifact Tool export. There are no unsupported formula caches in the delivered workbook.
- Desktop Excel click testing could not run: COM activation returned `0x80070520`, no usable logon session. Native links were checked through the exported format and an independent workbook reader; no desktop click-test success is claimed.

## Data touched

None. This revision reuses the previously verified structure snapshot. No database/workspace writes, imports, backups of application data, migrations or service changes.

## Problems and surprises

- The original subject-level sheets were too broad for the requested layout. Entity sheets and a linked index replace them.
- The spreadsheet engine's unsupported hyperlink formula required native Excel link metadata instead.

## Small decisions I made, and questions for Xar

- Interpreted one table per sheet as one database table or logical collection per detail sheet, and one native Excel table on every worksheet.
- Used native workbook links and consistent return navigation. No additional decision is needed.

## Next step

Open Schema or Tables and follow a blue link. A foreign-key row's Referenced table and Referenced field cells open the parent definition and exact field. The app's existing Sunday-reset next step remains unchanged.
