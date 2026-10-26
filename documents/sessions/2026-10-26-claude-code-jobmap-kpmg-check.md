# 2026-10-26 · Claude Code · JobMap · KPMG check

## Goal
Her words: "do a sort of assessment and research on these and kpmg in general and if they're useful add them to the job map and life os app". "These" were seven KPMG vacancies from a ChatGPT summary she pasted, said to be current on 26 October 2026.

## What I did
- Checked each pasted vacancy against KPMG's own sites. Five are gone: the London Senior Software Engineer (109337) and Data & Analytics Implementation (109055) pages error and are in neither KPMG listing; the Senior Data Analyst and Senior AI Engineer pages say "Sorry, this position has been filled"; both London 2027 graduate programmes are no longer listed. Only the regional Senior Software Engineer is live, reposted on LinkedIn today.
- Read KPMG's whole UK listing (239 vacancies) and its experienced-hire site (195), and screened every technical title. One new in-field role: Data Architect, Audit Central (London, LinkedIn, today).
- Added two jobs to the shared JobMap, both To review and tracked as post-MSc / sponsor targets: Senior Software Engineer - Tax Technology (regional; strong C#/.NET, Angular, REST, messaging match; Azure, AKS and IaC gaps) and the Data Architect (a stretch). Full-time hours, location, the Student-visa limit on permanent full-time work and gaps are written into each record.
- KPMG in general: KPMG LLP is an A-rated Skilled Worker sponsor (register of 26 October); KPMG sponsors graduates only on London programmes; no technology vacancy in Cardiff; about 200 more UK jobs put at risk in September 2026.
- Logged 24 rejected KPMG adverts in `screened-out.md`; appended the two jobs to `Cardiff_Job_Map.xlsx`; wrote the run's source log.

## Files and commits
- This note and `STATUS.md`: one "Records" commit.
- Not in git (personal data): `jobmap/data/discoveries/2026-10-26-1725-kpmg.json` and `-sources.md`, the same pair in the standalone's `data/discoveries`, and the batch and source log in `JobMap/Career Agent/Scheduled search/batches/`.

## How I checked it
- `queue-jobs.mjs --dry-run` in both apps: 2 added, 0 updated, 0 skipped. Queued in both.
- Receipts: standalone "2 added"; Life OS "already imported, no change" (the shared workspace imports one runId once). No failed files.
- Both live APIs: revision 87, 1,184 jobs, the two KPMG jobs present and To review.
- `npm run check:parity` from both apps: no differences, 1,184 records each.
- Workbook dry run then append: rows 316-317, nothing skipped.

## Data touched
- JobMap shared workspace revision 86 → 87, jobs 1,182 → 1,184, through the importer only. No personal fields changed, nothing archived.
- Workbook backup before the append: the scratchpad copy `Cardiff_Job_Map-before-kpmg.xlsx` (session scratch folder); `screened-out.md` backed up the same way.

## Problems and surprises
- The pasted summary was out of date on the day it claimed: five of its seven links are dead or filled.
- kpmgcareers.co.uk refuses the web fetch tool (HTTP 500), so its pages were read with curl. LinkedIn rate-limited the engineer advert (429); its body was read through the web fetch tool and saved as a labelled summary, not verbatim.
- openpyxl is not installed in her Windows Python; the workbook tool ran from a scratch virtual environment instead of installing anything globally.

## Small decisions I made, and questions for Xar
- Kept the Data Architect as a stretch, because the search rules ask for every credible in-field role with gaps stated.
- Did not save the Glasgow 2027 graduate programme: 2027 graduate campaigns are outside JobMap's routine scope, and KPMG says it cannot sponsor graduates outside London. If she wants a 2027 graduate track, that is her decision.
- Did not add anything to Today or the plan: both roles are post-MSc targets, not this week's applications.

## Next step
Nothing pending from this run. If she wants KPMG followed, check kpmgcareers.co.uk for a London Tax Technology engineer repost and for a KPMG copy of the Data Architect advert.
