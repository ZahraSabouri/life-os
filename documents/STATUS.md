# Life OS: status

**Updated 3 November 2026 by Codex.** Branch: `stage/jobmap-workflow`; local app http://127.0.0.1:47850. Standalone JobMap remains frozen.

## Now

**JobMap CP1 is live:** My profile keeps sourced experience/project examples, goals and recovery drafts. A reviewed JSON import adds examples without replacing conflicting content. Each opened job has Requirements and evidence, quoting saved advert wording beside supported, partial or unknown evidence. Existing matching, priorities, application progress and documents are preserved. [Brief](briefs/stage-jobmap-workflow.md) · [Session](sessions/2026-11-03-codex-jobmap-workflow-cp1.md).

**GitHub main published:** the previously reviewed work is pushed and independently verified at `029d2c7`. New JobMap development is committed separately on its stage branch, awaiting Xar's check. This does not imply acceptance of unrelated stages or UI reviews.

Health, Budget, Study, Calendar and Inbox remain available. Scheduled workflow authority stays in the external Scheduled Workflows folder. Current personal schedules and records stay in the live app and local notes; data, mail exports, application-update notes and workbook outputs remain excluded from git.

## Exact next step

Refresh Life OS → JobMap → My profile. Add one sourced example, or use Build or update from my CV to prepare and review a profile JSON. Open a job and inspect Requirements and evidence. The profile starts empty: no CV was sent or personal claims filled automatically.

**Next prompt:** "Review JobMap CP1, then scope application packs and independent review."

## Waiting and limits

- CP1 acceptance; other existing feature/UI issues remain in TODO and their briefs. One unrelated new stage-5 planning draft was preserved, unstaged.
- Requirement extraction is bounded and based on explicit text/skill names; it is not a full AI assessment. Read the complete advert. Existing graduate/later-start ranking treatment needs a separate scoped update.
- Never start the frozen standalone JobMap or run `hosting/app.test.mjs`, which reseeds core. Personal changes use owning APIs and revision checks.

## Verification and data

Full JobMap suites, nine new profile/API tests, TypeScript, focused lint and production build pass. Six fixture browser flows cover save/import/recovery, four styles and phone width. A final read-only live iframe check has no errors, overflow or writes. Full JobMap backup verified before its server restart: revision 67 and 1,306 jobs, all personal progress/preferences and checked private files compare equal. Life OS's main process stayed up. Evidence is private under `.runtime/jobmap-workflow-cp1/`.

Last five technical sessions: [JobMap CP1](sessions/2026-11-03-codex-jobmap-workflow-cp1.md), [main consolidation](sessions/2026-11-03-codex-main-private-data-safe-commit.md), [data explanation](sessions/2026-11-01-codex-data-structure-explanation.md), [linked dictionary](sessions/2026-10-31-codex-data-dictionary-links.md), [dictionary](sessions/2026-10-31-codex-data-dictionary.md).
