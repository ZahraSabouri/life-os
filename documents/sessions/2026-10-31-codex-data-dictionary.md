# 2026-10-31 · Codex · Documentation · Excel data dictionary

## Goal

Xar asked for an Excel data dictionary for the project's data structure.

## What I did

- Created `outputs/20261031-life-os-data-dictionary/Life_OS_Data_Dictionary.xlsx`, with 11 worksheets covering entities, SQL columns, registered entry details, nested Study/Budget/JobMap/Cardiff data, the Mail import contract, relationships and rules.
- Verified the implemented storage directly: 32 active tables / 322 columns, plus the separately labelled 16-table / 97-column retained Summer Rescue mirror. Documented all 51 core entry types. Current Study/Mail PostgreSQL and core SQLite are distinguished from the architecture's proposed unified data home.
- Included database types/nullability/defaults/keys, code constraints and source references. Open JSON paths are explicitly labelled as observations, with optionality and unobserved variants left unspecified. Dynamic map keys are placeholders. No personal record values, credentials or attachment bodies are included.
- Recorded the current JSON-order-preserving Study types, Hub IDs versus UUID row IDs, legacy Budget pounds versus newer pence, user overrides versus source evidence, and application references versus database foreign keys.

## Files and commits

- Requested workbook above, this note, and a short addition to STATUS. Documentation-only task; no app checkpoint, application code, migration or Git publication.
- Private extraction/builder/verification files and sheet previews: `.runtime/data-dictionary-20261031/`. Builder uses the bundled `@oai/artifact-tool` runtime, with its own dependency junction.
- Preserved the pre-existing Cardiff, Mail, scheduled-workflow and STATUS changes without staging or committing them.

## How I checked it

- Inspected SQLite through read-only connections and PostgreSQL inside a read-only repeatable-read transaction. Compared catalogs with migrations, the registry, validation code, type declarations and JSON Schema. Used shapes, not saved record contents, in the workbook.
- Recalculated the workbook and scanned for formula errors: none. Rendered and visually checked every worksheet. Filters, frozen header rows and identifier columns were included.
- Inspected the saved XLSX package: sheet/table counts, native filters and panes, cached summary totals, no error cells, complete SQL field identities and core-registry coverage, current `json` storage type, money units, and representative nested contracts/relationships. Detailed results are in `.runtime/data-dictionary-20261031/export-checks.json`.
- Existing Life OS and JobMap health endpoints responded. No app build, app tests, reseeding test, restart or data save was needed.

## Data touched

None. Database connections and saved workspaces were read only. No backups, imports, migrations or revisions were created.

## Problems and surprises

- The target architecture differs from current storage. The workbook documents the implementation and labels the retained mirror separately.
- Some nested JSON has no closed schema. Observed fields are not treated as exhaustive contracts or proof that a field is required.

## Small decisions I made, and questions for Xar

- Used one filtered dictionary per subject rather than a worksheet for every table. Included source paths because locating the implementation is part of this technical reference.
- No new decision is needed from Xar.

## Next step

Open the workbook's Overview, then filter the relevant dictionary by entity or field. Refresh it after schema or data-contract changes. The app's existing Sunday-reset next step remains unchanged.
