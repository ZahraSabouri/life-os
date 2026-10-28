# Life OS JobMap only, and it owns its data (27–28 October 2026)

Zahra, 27 October: "we only will work on the life os job map from now on". Develop, search into and queue only `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\jobmap`. On 28 October, at her choice, the saved workspace moved here: `data/workspace-connection.json` names this folder as the owner, served by the JobMap server Life OS starts (http://127.0.0.1:47852; public at http://127.0.0.1:47850/apps/jobmap/api/). The move used JobMap's own backup and restore, and all 1,195 jobs compared equal afterwards (backups in `Life_OS_backups/jobmap-move-2026-10-28/`).

- The standalone `JobMap\Career Agent\JobMap App` is a frozen fallback as of 28 October (revision 103). Do not start its server, run its scripts or write to it: its own connection still lists this folder's inbox, so a running standalone would import Life OS batches into the old workspace. Archiving or deleting it is her step.
- `check-parity.mjs`, `reconcile-sources.mjs` and `reconcile-workspace.mjs` compare two copies and no longer apply. The copies differ on purpose.
- The sections below about maintaining both copies and the shared workspace are superseded. Their data rules still hold: never copy progress files, preserve her edits, respect revision checks.
- Ideas from Dossier (https://github.com/AienTech/dossier, AGPL-3.0) were written again, not copied; credit is in README.md. Keep it that way: copying its code would bring its licence with it.

# JobMap: two maintained copies (superseded 27 October 2026)

## Tech-only job search scope (9 October 2026)

Only add paid employee roles with core duties in software engineering, backend/full-stack/platform development, databases, data engineering, analytics, applied ML or data science. Technical support, QA/test automation and research qualify only with substantial advertised technical duties matching Zahra's saved CV. Exclude retail/store, hospitality, housekeeping, exam invigilation, general administration, reception, care, sales and generic income jobs. Evaluate duties, not the employer's industry. A saved reason must link specific advertised technical work to supported CV skills. Routine computer use and transferable communication skills are insufficient. Add nothing if no credible in-field vacancy qualifies; never broaden the field to fill a quota.

User instruction, 8 October 2026: scheduled searches, manual vacancy updates and further JobMap development must cover both apps.

- Standalone: `C:\Users\ctrlz\Documents\JobMap\Career Agent\JobMap App`
- Life OS: `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\jobmap`

Read `C:\Users\ctrlz\Documents\JobMap\AGENTS.md` for the shared maintenance procedure and `C:\Users\ctrlz\Documents\JobMap\Career Agent\AGENTS.md` for career guidance. Follow the Life OS root instructions when working there.

For searches, research once, compare both collections and deliver the findings through each app's own discovery inbox, using the same runId. Dry-run and queue separately in each app folder; verify import results separately. Match vacancies by canonical URL, because custom IDs may differ. Preserve personal edits and dates. Do not copy progress.json or replace data folders.

For development, port shared changes to both copies and verify both. Inspect differences first, retain Life OS's relative API/asset paths and hosting/style integration, and preserve unrelated existing changes. Do not declare both updated when one is blocked. Read SCHEDULED_SEARCH.md for the detailed batch workflow.

After shared development or vacancy reconciliation, run `npm run check:parity -- "<other JobMap folder>"` from both apps. Feature code, underlying vacancy evidence and the active personal workspace must agree. Do not copy personal overrides to resolve a source mismatch.

## Shared workspace (12 October 2026)

Zahra requested that both JobMap apps show the same saved content. Both interfaces now use one owning workspace, configured in each app's data/workspace-connection.json. The standalone server owns the active progress; the Life OS interface forwards its API requests. Personal choices no longer remain independent. Stars, archives, notes, priorities, application progress, dates and preferences are shared. The Life OS old progress file is a retained historical snapshot, not the active collection. Read the connection before reading progress, and use the APIs or existing importer for changes. Never copy a progress file or data folder over the other copy.

The initial reconciliation is field-aware, keeps backups of both originals, retains compatible explicit choices, and refuses conflicting values. Shared development still covers both app copies and retains Life OS styles. Search findings still go into each discovery and inbox folder using one runId; the owner polls both inboxes and imports each run once, with separate receipts. Check both inbox receipts and the shared live data. Parity now includes the shared connection and personal choices.

## Complete technical choice coverage (12 October 2026)

Zahra explicitly requested relevant full-time leads with hours flagged, followed by all possible technical choices and much more careful coverage of job resources. Treat the 20-hour preference as a fit flag and ranking factor, not a reason to omit a current technically relevant employee vacancy. Save credible current full-time, part-time and fixed-term employee roles; preserve the actual advertised hours and clearly say when reduced hours, travel, pay or a skill requirement needs discussion. Do not claim flexible working guarantees a 20-hour arrangement. Prefer accessible part-time leads in the ordering, but do not impose a shortlist quota or require a perfect technology match. Reasons must connect real advertised duties to supported CV experience and state important gaps. Continue excluding generic off-field work, freelance/self-employed engagements, unpaid work, closed new adverts, and future graduate/2027 campaigns.

Check sources directly as well as web indexes: NHS Jobs/Trac and NHS Wales employer boards (NWSSP, DHCW, Public Health Wales), university and local council boards, relevant local employers and recruiters, public LinkedIn/Indeed/Reed/CWJobs/Totaljobs, Work Hub, jobs.ac.uk, charity/tech-for-good sources and UK-remote employer boards. A healthcare post filed under Administrative Services or Primary Care Services can have core software duties; assess the advert. Review all still-open adverts found, not only the latest week. Keep a per-run source coverage and exclusion log with direct URLs, checked dates and access limits. Never describe a blocked or unchecked board as covered. Private accounts require their own authorised review. Research once, save the same findings and runId in both discovery folders, dry-run and queue each inbox, then verify both receipts and the shared live collection.
