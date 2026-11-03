# Scheduled workflow consolidation

Directly approved by Xar on 30 October 2026 after reviewing the existing five tasks: one shared daily intake, dedicated academic materials, twice-weekly job discovery, one weekly event discovery, lifestyle feed paused. The follow-up explicitly selects Codex's own signed-in browser, with login handled by Xar, rather than requiring unavailable connectors.

Scope is operational scheduling and local helper/instruction files. No app feature development, database migration, research search, application, booking or personal-state change.

- [x] Preserve all original scheduler definitions and affected instructions with hashes.
- [x] Consolidate useful rules and source coverage into focused instructions and a shared source registry.
- [x] Implement compact handoffs, stable source identity/fingerprints, independent consumption, source retry gates, run leases/budgets, file hashes, completion evidence and reporting.
- [x] Test source partial checkpoints, cooldowns, idempotence, overlapping runs, evidence requirements, file hashes and alert milestones; replay already saved validated mail without importing it.
- [x] Update existing scheduler IDs to four independent local workflows; pause the duplicate Outlook follow-up; read back the saved definitions.
- [x] Preserve mail read-only handling, all Gmail categories, JobMap Life OS/workbook routing, study state and Cardiff planner/sync safeguards.

Authority and reviewable artifacts: `C:\Users\ctrlz\Documents\Scheduled Workflows\README.md`, `config.json`, `sources.json`, `instructions/`, `hub.mjs`, `REQUIREMENTS.md` and private reports/backups. The external folder keeps personal runtime state out of the application repository. App builds/tests are not needed for this scheduler-only change; never run the reseeding host test.

First scheduled execution remains to be observed. Browser access was verified in this chat, not assumed to be inherited by independent runs. Real per-run token savings remain unmeasured; budget limits on model-wide tool/time use are cooperative, not a platform token cap.
