# 2026-10-17 · Claude Code · JobMap fix · one job shown once, and more in the menu

## Goal
Her words (section U of `TODO.md`): "why are there duplicate job entities for the same job in the app? fix that." (with a screenshot of the Cardiff University CTR job listed twice), and, mid-task, "also, i need more options in the menu in the left side".

## What I did
- **Why it happened:** the CTR job came in twice: on 5 October from Cardiff University's own vacancy site, on 9 October from jobs.ac.uk. The importer only matched the same link, or the exact same employer + title + place. The employer was "Cardiff University - Centre for Trials Research" on one and "Cardiff University" on the other, so it was added again.
- **One rule for "same job"** (`lib/matching.mjs`: `employerKey`, `roleKey`, `placesOf`, `sameVacancy`, `repeatsOf`). Same employer (before " - " or "(", without Ltd/Group/UK), same title (reference numbers dropped), places that can be the same (a region includes its towns, two towns are different, UK-wide fits any), closing dates within 3 days.
- **Joining, not deleting** (`lib/store.mjs`: `all()`, `jobs()`, `join`, `separate`; override fields `sameAs`, `notSame`). A joined listing is kept, hidden from `jobs()` and shown on the kept job as `alsoListed`. Her work from both comes together (star, further status, higher priority, earliest dates, both notes, categories, links). The server copies kept files first (`files.copy`). `POST /api/jobs/:id/join` and `/separate` were added. Backups and restores now cover every listing, `store.all()`.
- **Imports and "Add job" join repeats themselves** (`lib/discovery.mjs`, `store.add`). One match: the listing is added as joined and reported under `joined`. Two or more: skipped for review as before.
- **In the page:** "Also listed on" with a link and "Not the same job" on a job; "This may be the same job as …" with "Same job, show once" and "Different jobs"; the row says "· also jobs.ac.uk".
- **Menu:** Closing this week, New this week, High priority; Applying (Applications, Follow-ups); Tidy up (Possible repeats, Closed adverts, Archive); My categories once she has any; Back up & restore. The sidebar is wider on big screens (240px) so the names fit on one line, and it scrolls when the window is short. Section names take each Life OS style's label font (`hosting/skins/public/apps/jobmap.css`).
- **Her data:** joined 12 listings by hand after reading them (11 pairs; the CTR job is one). Sadler Recruitment's two "Senior Software Engineer" jobs are different roles (pay, place, stack), so they are marked as different.
- The Guide: "Quick views in the menu", "One job on two sites", the question "The same job shows twice"; JobMap and Today pictures retaken.

## Files and commits
- Both JobMap copies: `lib/{matching,store,discovery,inbox,files}.mjs`, `lib/types.ts`, `server.mjs`, `app/{page.tsx,globals.css}`, `tests/{repeats,discovery}.mjs`, `package.json`, `SCHEDULED_SEARCH.md`; built `dist/`.
- Life OS: `hosting/skins/public/apps/jobmap.css`, `code/life-os/frontend/src/guide/chapters.js`, `scripts/guide-shots.mjs`, records.

## How I checked it
- `npm test` in both copies: all seven test files PASS (new `tests/repeats.mjs`). `tsc --noEmit` clean. eslint shows the same 11 findings as before the change, none new.
- A private JobMap on a copy of her data (port 47899, scratch folder): every menu view, joining the CTR pair (2 → 1, "also jobs.ac.uk"), separating, Back up & restore, a 400px window. No page errors.
- Live, with saves blocked in the browser: JobMap inside Life OS in Modern light and dark, Madder, Indigo, Paper. Two fixes after looking: the box was an oval in Madder, and labels wrapped.
- `npm run check:parity` from both copies: PASS, 1,160 = 1,160.
- Today's strip: "5 to apply for now" (was 6). The Guide's JobMap part shows the new steps.

## Data touched
- Backup before: `../Life_OS_backups/jobmap-2026-10-17-before-repeats.json` (JobMap's own backup, revision 45, 191 added jobs, 196 overrides). JobMap also kept its automatic copy before each save.
- Through JobMap's API: 11 joins and 1 "different jobs", revision 45 → 57. Records shown 1,171 → 1,160; records kept 1,171 (none deleted).
- Owner server restarted (`/api/stop`, restarted by Life OS's JobMap on the next request) to load the new code.

## Problems and surprises
- A search run added 5 jobs at 15:59 while I was reading (revision 44 → 45); it had finished before I changed anything.
- The base collection has regional graduate postings with one title per region (Stantec, DWP). The place rule keeps these apart. Three Stantec "SE England" postings with the same date still look alike, so they wait under "Possible repeats".

## Small decisions I made, and questions for Xar
- The job kept is the one with her work on it, or else the employer's own advert; the other's link is under "Also listed on".
- Kept for her: 14 listings under "Possible repeats" (Stantec regional postings, Third Bridge, Martin Veasey, Peaple Talent).
- Nothing pushed (one request, one push).

## Next step
None required. If she wants it: go through "Possible repeats" with her, or archive old "Closed adverts" (397).
