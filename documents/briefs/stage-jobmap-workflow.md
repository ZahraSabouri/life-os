# JobMap: profile, assessment and application workflow

**Authorised:** 3 November 2026. After reviewing the repository comparison and integration plan, Xar asked to publish main and proceed with JobMap development. Work starts with the proposed profile/assessment increment. This does not close unrelated stage acceptance checks.

**Branch:** `stage/jobmap-workflow`, from published main `029d2c7`.

## Scope and sequence

### CP1: Profile evidence and requirements review

- [x] Add a private, optional, versioned profile containing goals and sourced experience/project/skill examples. Existing matching preferences remain intact.
- [x] Support manual editing and a reviewed additive JSON import with explicit conflicts; provide instructions for preparing evidence with the user's existing AI workflow.
- [x] Show requirements and quoted advert wording beside linked profile evidence, distinguishing essential, desirable, mentioned and explicitly unnecessary skills. A listed skill alone is not documented experience; absence is unknown, not incapability.
- [x] Keep current ranking, personal priorities, sources, status, notes, dates and attachments intact. Do not change graduate handling in this checkpoint: reconcile the newer search scope explicitly in a later ranking checkpoint.
- [x] Validate through isolated store/API tests, old-backup compatibility, failed/stale writes, build/type checks and browser checks at desktop/phone sizes. Back up before deploying the server change; compare live data before/after.
- [x] Record results, commit `[jobmap-workflow-cp1] ...` and update STATUS. User acceptance remains open.

**CP1 verification:** full JobMap suites pass, including nine new profile/requirements/API tests. TypeScript, focused lint and the preview production build pass. Six fixture browser flows and a read-only live Life OS iframe check pass, including all four styles and phone width. Live JobMap stays at revision 67 with 1,306 jobs; source/workspace files, all job records, preferences and backup progress compare equal. No personal evidence was filled or sent to an external service. See the 3 November CP1 session note.

Later checkpoints, separately scoped after feedback: application packs and independent review; interviews and source-linked mail suggestions; focused learning and selective research adapters. No job search, mail scan, application, message or new AI service is part of CP1.

## Implementation and safety

Extend the current React UI and JobMap server. The server remains the only workspace writer. Optional profile data is included in existing backups and guarded by the workspace revision; loading old workspaces never writes a default profile. Requirement reviews are computed from the currently opened saved advert and profile, so no stale generated assessment is presented as current. Extraction limits and ambiguous wording remain visible. Profile claims and all third-party text are data, never executable instructions.

The reviewed upstream workflow informs the design; no upstream code is copied in CP1. Keep source/fixture material generic and personal evidence under ignored runtime/data paths. Never run or write to the frozen standalone app. Never run the reseeding host test.

## Acceptance

1. Open JobMap → My profile. Add a sourced example, save, reopen and find it retained.
2. Import a prepared profile: inspect additions/conflicts before applying; existing examples are preserved.
3. Open a saved job. Read the requirement wording, importance and supporting evidence; unsupported and ambiguous requirements stay explicit.
4. Existing filters, priorities, applications, documents, backup/restore, navigation and Life OS styles still work.
