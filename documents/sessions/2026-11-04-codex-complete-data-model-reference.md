# 2026-11-04 · Codex · Complete data model reference

## Goal
Replace the overly basic explanation with a detailed document covering the app's data types, designs and structures, as Xar requested.

## What I did
- Created `outputs/20261104-data-model-reference/Life_OS_Complete_Data_Model_Reference.pdf`.
- Added 18 explanatory chapters, a linked contents page, domain diagrams, current versus candidate design distinctions, and complete technical appendices.
- Refreshed the schema read-only: 35 active SQL tables with 380 columns, plus 16 retained mirror tables with 97 columns; 49 database foreign keys and 126 indexes.
- Included all 51 registered entry types; 342 entry-detail definition rows including declared Health structures; 1,917 JSON/file-path definition rows; 123 Mail contract fields; 116 fields across six JobMap TypeScript contracts; 73 documented relationships; all catalogued key/check/FK definitions and indexes.
- Preserved earlier optional variants as labelled earlier definitions. Observed JSON paths are distinguished from declared requirements.
- Corrected misleading inherited descriptions for Mail state/ownership, legacy text identifiers, Study recipes and credits, retained imported properties, and trip date fields.

## Files and commits
- Final PDF above. Extraction, build, coverage and QA files are private under `.runtime/data-model-reference-20261104/`.
- Existing workbook and basic guide retained. No app code changes, commits or pushes.

## How I checked it
- Compared rendered catalog coverage with every extracted SQL column, index, entry definition, JSON row, import field, TypeScript field and relationship.
- Reopened final PDF: 319 pages, 20 portrait explanation pages and 299 landscape reference pages, 212 internal links, 785,899 bytes.
- Rendered all final pages with bundled Poppler. Inspected every explanation page and representative catalogue pages, including corrected sections and continued table headers.
- Automated text bounds and replacement-glyph checks across every page passed with no issues. Build and validation scripts assert coverage counts. No application tests were needed for this document-only task.

## Data touched
No writes to app data. SQLite opened read-only; PostgreSQL inspected within an explicit read-only repeatable-read transaction followed by rollback. JSON records were reduced to structural paths/types; personal values and credentials are excluded from the PDF.

## Problems and surprises
- Initial sandbox access to local PostgreSQL was denied. The same read-only extraction succeeded with the local-network sandbox escalation; automatic approval was not rejected.
- The previous dictionary predates Harvest/Desk and career-profile work, so it was used as an earlier-variant reference rather than the current schema authority.
- Existing unrelated Stage 6 and documentation edits were preserved.

## Small decisions I made and questions for Xar
- Kept a readable explanation first and placed exhaustive field detail in bookmarked appendices. This is a reference and design discussion document, not a completed data-quality or performance audit.

## Next step
Use the detailed reference to discuss desired data-model changes, then choose representative workflows and scope the actual analysis before implementation.
