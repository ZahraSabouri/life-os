# Scheduled searches into JobMap

## Tech-only job search scope (9 October 2026)

Only add paid employee roles with core duties in software engineering, backend/full-stack/platform development, databases, data engineering, analytics, applied ML or data science. Technical support, QA/test automation and research qualify only with substantial advertised technical duties matching Zahra's saved CV. Exclude retail/store, hospitality, housekeeping, exam invigilation, general administration, reception, care, sales and generic income jobs. Evaluate duties, not the employer's industry. A saved reason must link specific advertised technical work to supported CV skills. Routine computer use and transferable communication skills are insufficient. Add nothing if no credible in-field vacancy qualifies; never broaden the field to fill a quota.

## Update both copies on every run

User instruction, 8 October 2026: scheduled searches and further development cover both apps:

- Standalone: `C:\Users\ctrlz\Documents\JobMap\Career Agent\JobMap App`
- Life OS: `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\jobmap`

Read `C:\Users\ctrlz\Documents\JobMap\AGENTS.md`, `Career Agent\AGENTS.md`, and each app's `AGENTS.md` and `SCHEDULED_SEARCH.md`. Follow Life OS root instructions when working there. Run all Node commands below separately in each app's own working directory.

Research once and compare findings with both collections. Save the same verified findings in each app's `data/discoveries` with the same unique `runId`; keep that runId when retrying. Dry-run each copy before queueing it. Vacancy IDs can differ: match canonical advert URLs and resolve `existingId` against the target collection, using a target-specific batch only when an identity resolution requires it. Never copy a workspace or data directory from one app over the other.

Inspect each copy's import log and inbox processed/failed folders. Report both results separately as queued, imported, unchanged or failed. If one fails, retain the batch, finish the other where possible, and report the remaining failure. Further development follows the shared procedure in `AGENTS.md`, including preserving Life OS hosting, relative paths and styles.

Do not archive jobs during routine searches. Both interfaces now use the shared personal workspace described below; a routine search still changes only vacancy evidence.

Run in `C:\Users\ctrlz\Documents\JobMap`. Read `Career Agent\AGENTS.md` first. Search current paid technical employee roles, prioritising part-time possibilities and retaining relevant full-time leads with their actual hours flagged. Use her saved skills and preferences from the app. Prioritise Cardiff, practical South Wales travel and genuine UK-remote employment. Research exact hours and on-site frequency; do not treat full-time, graduate, freelance or unpaid work as a current fit. Do not infer work permission or hiring chances from a score.

Use public employer careers pages and trustworthy public listings. The original cloud task used public sources only; keep that boundary for scheduled runs. Private Cardiff, email and LinkedIn account reviews are separate tasks. Retain every credible current technical employee opportunity found and verified in the run, with hours and material gaps flagged; do not limit the additions to a small shortlist. Do not submit applications or contact employers.

## Read the current collection

Read `data/workspace-connection.json` first. Read `data/jobs.json` and the owning app's `data/workspace/progress.json` to see the original jobs, added jobs, latest observations, personal progress and matching preferences. The Life OS local progress file is a historical snapshot. The optional local API at `http://127.0.0.1:47850/apps/jobmap/api/jobs` returns the merged view when accessible. Do not write directly to these data files. Scheduled runs use the file inbox so they also work when the app is closed or local network access is unavailable.

## Save findings

Create `data/discoveries/YYYY-MM-DD-HHMM.json` in the app folder. The file is a JSON object with a unique `runId` and a `jobs` array. Reuse that runId when retrying the same batch. Each job requires these string fields:

- `role`, `company`, `url`: actual vacancy and direct source link.
- `source`: e.g. Employer careers, Cardiff Jobshop, Student Futures or LinkedIn public listing.
- `description`: factual saved advert text or a clearly labelled factual summary. Never reconstruct missing requirements.
- `checked`: the actual verification date as YYYY-MM-DD.

Optional string fields: `location`, `salary`, `hours`, `deadline` (YYYY-MM-DD or empty), `advertisedOn` (original publication date as YYYY-MM-DD, only when explicitly supported by the source), `employment`, `stack`, `watch` (unresolved questions and the next action), `reason` (CV fit with supported evidence), `sourceDetail`, `availability` (open, closed or uncertain). Include only source-supported facts. Unknown values may be omitted. Do not use personal `notes`, `status`, `priority`, `saved` or follow-up fields in a batch.

For an already saved vacancy, provide `existingId` only after verifying that it is the same vacancy. A matching URL is deduplicated automatically, ignoring common tracking parameters. A matching company, role and location with a different link is returned for identity review. Resolve that result with a verified existingId or leave it for review; never bypass the check by changing the spelling.

Run `node queue-jobs.mjs data/discoveries/YYYY-MM-DD-HHMM.json --dry-run`, inspect the added, updated and skipped results, then run the same command without `--dry-run`. This validates and atomically queues the batch in `data/inbox/`. JobMap imports it while running or when next opened. The importer validates the entire batch before saving, keeps recovery copies and preserves all personal notes, stages, priorities and edits. New jobs enter the shortlist as To review. Existing archived or rejected jobs stay archived or rejected. A closed advert affects match ranking, not the user's application stage.

Check `data/workspace/import-log.md` and the processed/failed folders under `data/inbox/` for import results. The open app picks up saved changes when idle or refocused. If only queued, report queued, not imported. If saving fails, retain the batch and report the exact failure. An empty successful batch is valid when no new or materially changed vacancy qualifies. For an attended run with local API access, `import-jobs.mjs` can alternatively import immediately.

Keep run messages brief. Notify only for worthwhile new jobs, meaningful vacancy changes, failures or a required decision. Do not repeat unchanged leads or recreate an Excel tracker. Keep graduate searches and 2027 talent pools outside this routine unless Zahra changes the scope.

## Local operation

The computer must be awake and Codex running at the scheduled time. Open JobMap with Start JobMap.cmd to process any queued batches. No cloud endpoint or public exposure of JobMap is required. Cloud tasks cannot write directly to the local folder, so the former cloud shortlist is paused after the local replacement is configured.

The standalone app is at `http://127.0.0.1:47841/`. For the Life OS copy, use `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\Start Life OS.cmd` and `http://127.0.0.1:47850/jobmap`; its API is under `/apps/jobmap/api/`. Life OS starts the attached JobMap and its inbox poller. Do not run the copied `jobmap/launch.mjs`: it targets the standalone port. Leave a batch queued if its intended host is closed, and report that copy as queued.

## Job dates

The app records `addedOn` automatically on the day a vacancy is first imported or manually added, in Europe/London time. Do not supply or change it in discovery batches. `checked` is the verification date, not the publication date. Save `advertisedOn` only if the original advert or an explicitly identified source gives a publication date; mention that evidence in `sourceDetail`. A search-engine crawl date or the date an email arrived is not a publication date. Leave unknown publication and closing dates empty. Preserve the advertised closing date when an employer closes early and record closure in `availability` and `watch`.

## Shared workspace (12 October 2026)

Both interfaces share the standalone owning workspace through their configured local API. queue-jobs.mjs validates against that current workspace, and import-jobs.mjs uses its API. Save findings in both discovery folders and queue from each app as before. The owning service polls both inboxes, deduplicates the common runId and records a receipt in each app's processed/failed folder and import log. A batch already imported before the second queue is correctly reported unchanged in the shared workspace. Do not restore the Life OS historical progress file to resolve a mismatch. Check the shared API and each inbox receipt.

## Complete technical choice coverage (12 October 2026)

Zahra explicitly requested relevant full-time leads with hours flagged, followed by all possible technical choices and much more careful coverage of job resources. Treat the 20-hour preference as a fit flag and ranking factor, not a reason to omit a current technically relevant employee vacancy. Save credible current full-time, part-time and fixed-term employee roles; preserve the actual advertised hours and clearly say when reduced hours, travel, pay or a skill requirement needs discussion. Do not claim flexible working guarantees a 20-hour arrangement. Prefer accessible part-time leads in the ordering, but do not impose a shortlist quota or require a perfect technology match. Reasons must connect real advertised duties to supported CV experience and state important gaps. Continue excluding generic off-field work, freelance/self-employed engagements, unpaid work, closed new adverts, and future graduate/2027 campaigns.

Check sources directly as well as web indexes: NHS Jobs/Trac and NHS Wales employer boards (NWSSP, DHCW, Public Health Wales), university and local council boards, relevant local employers and recruiters, public LinkedIn/Indeed/Reed/CWJobs/Totaljobs, Work Hub, jobs.ac.uk, charity/tech-for-good sources and UK-remote employer boards. A healthcare post filed under Administrative Services or Primary Care Services can have core software duties; assess the advert. Review all still-open adverts found, not only the latest week. Keep a per-run source coverage and exclusion log with direct URLs, checked dates and access limits. Never describe a blocked or unchecked board as covered. Private accounts require their own authorised review. Research once, save the same findings and runId in both discovery folders, dry-run and queue each inbox, then verify both receipts and the shared live collection.
