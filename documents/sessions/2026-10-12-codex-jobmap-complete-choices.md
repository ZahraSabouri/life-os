# 12 October 2026 · Codex · JobMap · broader technical choices and source register

## Goal
Fix missed current technical opportunities after Zahra authorised relevant full-time employee leads with hours flagged, and give the complete discussed source list.

## What I did
- Saved the Cardiff NWSSP Senior Developer, then imported 38 additional technical employee leads and 11 source updates using the same expanded runId in both apps.
- Checked original employer descriptions, dynamic public feeds and full location arrays; retained older still-open roles and technology/leadership stretches with explicit gaps.
- Added JOB_SOURCES.md to each app and JobMap Job Sources.md at the standalone workspace root. The register distinguishes discussed sources from actual per-run coverage.
- Kept the detailed source/access/exclusion log with the discovery batch. Updated the existing automation's broad scope and removed remaining small-shortlist wording from both scheduled-search guides.

## Files and commits
- Both apps: JOB_SOURCES.md, SCHEDULED_SEARCH.md and private discoveries/receipts for 2026-10-12-coverage-nhs-b7e2a41f and 2026-10-12-coverage-expanded-c8a61d4f.
- Life OS session record: documents/sessions/2026-10-12-codex-jobmap-complete-choices.md.
- Existing shared workspace implementation checkpoint: 698f6ee. This research pass changes no feature code or styles. Unrelated existing changes were preserved.

## How I checked it
- Both importer dry-runs: 38 additions, 11 updates, no identity warnings/skips.
- Both processed receipts and import logs: standalone imports once, Life OS receipt reports already imported/no change in the owning shared workspace.
- Both live APIs equal: 1,106 records, revision 35. All 38 new entries appear in the actual To apply query.
- Before/after API backups: original source records, existing custom records, overrides, notes/stages/choices and matching preferences preserved; new records have only the normal saved flag. Maximum hours remains 20.
- npm run check:parity passes in both directions: 38 shared feature files, 1,106 records, shared workspace, no differences. No frontend changes, so no rebuild was required.

## Data touched
Through each app's validated inbox and owning service only. Expanded-run backup and assertion evidence: standalone data/discoveries/2026-10-12-coverage-expanded-c8a61d4f-evidence/. No progress file, entire data folder, original CV or workbook was copied over another app. NHS added one at revision 34; expanded run added 38 and updated 11 at revision 35.

## Problems and surprises
- NHS software can be filed under Primary Care Services; PHW bioinformatics software/analysis appears under Health Science Services. Categories did not establish fit.
- Creditsafe's working current board is creditsafecareers.com; the old domain failed. Four current Cardiff data/Python integration choices were missing.
- Directory listings can outlive adverts: Monmouthshire QA closed 6 October, Principality capability lead is unavailable, LDMS Oracle is closed, and six Starling references were withdrawn.
- LDMS's real company search returned OK:false; Browne Jacobson timed out and Ogi returned a JavaScript shell. Those are access limits, not complete coverage.
- Council syndication's 5 November date was unlabelled; left the deadline unknown and asked for original confirmation. RWS counterpart identity remains unproved; no duplicate added or blind update.
- The first preservation assertion incorrectly compared new default saved flags with an old override map. Corrected the check to verify every existing override unchanged and only expected new-record saved flags. The first To apply verification call used the wrong helper argument order; corrected to the actual exported signature. Final assertions all pass.

## Small decisions I made, and questions for Xar
- Treated 20 hours as a fit/ranking flag; preserved full-time hours, skill gaps and payroll/location questions. Did not assume hybrid working permits 20 hours.
- Saved senior/platform stretches without claiming they are strong accessible fits. Retained employee arrangements with unresolved details as explicit questions; excluded actual unpaid/freelance/generic work.
- No application, message or enquiry sent. No personal archive/stage changes. No additional approval is needed for the completed import.

## Next step
Use the actual coverage log to follow up blocked source indexes, council person-spec/closing details, ambiguous RWS identity, and previously uncertain adverts. A private-account review is separate from public coverage. Do not repeat/import either runId with changed findings; use a new supplemental run for new evidence. Existing automation remains Tue/Thu/Sat/Sun at 15:00.
