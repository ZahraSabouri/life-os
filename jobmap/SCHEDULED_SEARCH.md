# Scheduled searches into JobMap

Run all Node commands below with the working directory `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\jobmap`.

Run in `C:\Users\ctrlz\Documents\JobMap`. Read `Career Agent\AGENTS.md` first. Search only for current paid part-time employee work during Zahra's MSc. Use her saved skills and preferences from the app. Prioritise Cardiff, practical South Wales travel and genuine UK-remote employment. Research exact hours and on-site frequency; do not treat full-time, graduate, freelance or unpaid work as a current fit. Do not infer work permission or hiring chances from a score.

Use public employer careers pages and trustworthy public listings. The original cloud task used public sources only; keep that boundary for scheduled runs. Private Cardiff, email and LinkedIn account reviews are separate tasks. Find a small number of credible current opportunities, verify source pages and avoid arbitrary quotas. Do not submit applications or contact employers.

## Read the current collection

Read `data/jobs.json` and `data/workspace/progress.json` to see the original jobs, added jobs, latest observations, personal progress and matching preferences. The optional local API at `http://127.0.0.1:47850/apps/jobmap/api/jobs` returns the merged view when accessible. Do not write directly to these data files. Scheduled runs use the file inbox so they also work when the app is closed or local network access is unavailable.

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

## Job dates

The app records `addedOn` automatically on the day a vacancy is first imported or manually added, in Europe/London time. Do not supply or change it in discovery batches. `checked` is the verification date, not the publication date. Save `advertisedOn` only if the original advert or an explicitly identified source gives a publication date; mention that evidence in `sourceDetail`. A search-engine crawl date or the date an email arrived is not a publication date. Leave unknown publication and closing dates empty. Preserve the advertised closing date when an employer closes early and record closure in `availability` and `watch`.
