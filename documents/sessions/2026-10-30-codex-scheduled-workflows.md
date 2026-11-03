# 2026-10-30 · Codex · Scheduled workflow consolidation

## Goal
Implement Xar's approved consolidation of overflowing scheduled work, preserving existing requirements, sources and personal data. Xar clarified that signed-in services must use Codex's browser and that this is maintenance, not an instruction to run the research jobs now.

## What I did
- Created `C:\Users\ctrlz\Documents\Scheduled Workflows` with config, common/focused instructions, 26 source channels/groups, requirements mapping and a dependency-free Node helper.
- Existing scheduler IDs now provide daily intake 08:30; academic materials Mon/Wed/Fri 09:30; jobs Mon/Thu 11:00; events Thursday 12:00. All Europe/London, independent local runs, gpt-6.1-sol/medium. Paused the original duplicate Outlook heartbeat; no task deleted. Lifestyle feed disabled in config with no extra automation created.
- Consolidated repeated mailbox/timetable checks into intake, retained broad discovery through source rotation/cursors, and shortened saved prompts to 87–105 words. Four active definitions schedule 13 runs/week instead of 22.
- Added compact multi-domain handoffs, per-worker fingerprints/consumption, partial checkpoints, access-only status, backoff, run leases, recorded budgets, evidence checks, 7/3/1-day alert dedupe, material hashes and daily summary files.
- Updated mail source scope/routes and GATHER/CODEX prompt authority; added a current scheduler note to standalone Cardiff Life AGENTS/README, preserving prior text. Updated the two existing planner builders/templates to show daily intake and the combined event workflow accurately, then regenerated their HTML. No event research records changed.

## Files and commits
Operational folder above; root brief `documents/briefs/scheduled-workflows-2026-10-30.md`, this note and STATUS scheduler paragraph. No commit/push: existing mail instructions and Cardiff planner test changes predated this session and remain preserved, with new operational code outside this repository.

## How I checked it
- Eight focused Node tests passed, covering incomplete checkpoints/access-only, service backoff, canonical multi-domain identity, run overlap/budget boundaries, evidence-backed independent acknowledgement, actual SHA-256 material changes, alert delivery milestones and safe references.
- Offline replay of three existing validated mail batches produced 197 canonical handoff records; immediate replay produced zero new batches/items/actions. This did not re-import mail or contact a source.
- Local-only material baseline hashed 998 existing files; no academic file was modified or downloaded. CLI output is bounded, with full inventories retained in reports.
- Both planner builds and generated-file checks pass: 149 events, 90 communities, 11 opportunities and 76 teaching projections preserved. All source research file hashes compare equal before/after the schedule-display refresh; existing personal choices remain untouched.
- Read back all five scheduler TOML definitions: four ACTIVE cron tasks, one PAUSED heartbeat, no old target chat on the active tasks. App tool accepted each update.
- In Codex's in-app browser, Outlook, Learning Central, LinkedIn Saved and Gmail were already authenticated. Gmail connector profile independently matched the expected account. These are access-only checks, not completed source scans. Intranet/Teams were not tested and independent scheduled-run session inheritance is unverified. Chrome native automation could not verify its URL safely and was stopped; it is not the configured route.

## Data touched
Only new scheduler runtime copies/checkpoints in the external folder and specified instruction/doc edits. No app database/API writes, mail import/activation changes, original mail state reset, workbook edits, JobMap imports, study-plan changes, event research edits or browser saved-state changes. Existing live mail importer remains as configured by the earlier authorised session.

Original scheduler/instruction backups with SHA-256 manifest: `Scheduled Workflows/backups/2026-10-30T16-09-18-906Z/`. Full setup/scheduler readback reports are under the external reports folder. Actual token figures are null, not estimated.

## Problems and surprises
Initial access investigation took too long; Xar redirected work to scheduler maintenance. Browser access works through Codex's in-app browser without an Outlook connector. One setup snippet mixed CommonJS require and top-level await; corrected to ESM and verified. Source collection and cross-run browser access remain to be proven by the first scheduled run; no false completeTo was created.

## Next step
Observe the first daily intake on Saturday 31 October at 08:30, checking one brief, correct in-app account access, read-only operation, honest partial scopes and saved continuation. Compare real usage after several runs before claiming a savings percentage. Resume the app's existing Health/Calendar/Study priorities separately.
