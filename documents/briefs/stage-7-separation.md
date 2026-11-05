# Stage 7: Code apart from data, and a clean version of Life OS on GitHub

**Status:** approved by Xar on 4 November 2026: still single-user; the core moves to PostgreSQL; MIT licence; all parts in the clean version (Life OS, JobMap, Budget, the Study app, Events). Where it goes: a new repository is recommended (the existing one's history holds her data); she confirms the name before CP6. Building.
**Branch:** `stage/7-separation`, from `main`.

## Goal
Life OS's functionality is generic code; everything that is Xar's (her records, mail, courses, jobs, budget, events research, notes, project documents, agent memory) lives outside it, in the database, the data folders, settings and private documents. A clean, professional version of the app is on GitHub with none of her data, with its own fresh history, a README, setup instructions and example data, and it runs from a fresh clone. Still single-user: no accounts or sign-in yet.

## Where it stands (checked 4 November)
- About 430 tracked files mention something personal: the project documents and agent files (`documents/`, `AGENTS.md`, `mail/*.md`), the Study app's courses and plans in code (`summer-rescue/`, `code/life-os/frontend/src/rooms/study-hub/data`), "Cardiff" across the frontend and hosting, the attached apps' research and fixtures (`cardiff-life/*.csv|md|json`, `budget-management/planning`, `recheck-*`, `jobmap/lib/legacy-dates.json`, `migration/*.json`).
- The existing GitHub repository (`ZahraSabouri/life-os`) holds all of that in its history too, so a clean version cannot be a branch of it: it needs a fresh history.
- The core is still the single-user SQLite file; Study and Mail are in PostgreSQL.

## The shape
1. **A privacy scan** that every published file must pass: generic patterns (email addresses, phone numbers, keys and tokens, home paths) plus her own markers (names, accounts, places, course codes, employers) read from a private, untracked list. It reports file and line, never the matched text.
2. **One configuration**: paths, ports, the database, the local key and the owner's choices (city, time zone, Gmail account number) come from config files with committed `.example` versions; no code names her, her machine or her folders.
3. **The core into PostgreSQL** (`core` schema, an owner column defaulting to `owner`), with backup, counts before and after and spot-checks; the SQLite file untouched until she accepts.
4. **Content out of code**: the Study hub's courses, cards and plans become data (with an example set for a fresh install); "Cardiff Life" becomes **Events**, with the city in settings (old addresses still work); the Guide, the Court's sample lines and labels are anyone's.
5. **The public version** is made by a command (`scripts/publish-public.mjs`) that copies an allow-list of generic files into a separate folder outside this one, adds the README, licence, example data and setup steps, runs the privacy scan (zero findings), the tests and the build there, and makes a fresh git history. This folder stays the private working copy, with its documents and history.
6. **The push**, after she has seen the public folder: to the GitHub repository she chooses.

## Checkpoints

### CP1: the privacy scan and the inventory
- [x] `scripts/privacy-scan.mjs`: tracked files (or any folder) against generic patterns and the private markers in `.private/markers.txt` (untracked); file and line only, never the text; exit code 1 on any finding.
- [x] The inventory of what holds personal content, by part, and what each becomes (code made generic, data moved out, private document, left out of the public version): `documents/briefs/stage-7-inventory.md`, written by `scripts/privacy-inventory.mjs` (203 private, 12 to configure, 158 to make generic on 4 November).
- **Commit:** `[7-cp1]`.

### CP2: one configuration
- [x] Every path, port, key and personal choice from config with a committed `.example`: no code names her, her machine or her folders. Done: `code/life-os/backend/src/paths.js` (data and backup folders, port, address from the environment, beside the app by default), `code/life-os/backend/.env.example` (every setting), `code/life-os/backend/postgres.example.json`; the scan finds no home folder left in code. Kept for later: Europe/London as the time zone everywhere (AGENTS rule; a setting when accounts come).

### CP3: the core into PostgreSQL
- [x] `core` schema with an owner column; a move with backup, counts and spot-checks; every reader and route on PostgreSQL; the SQLite file untouched. *(4 November: `migrations/core/0001_core.sql`, `scripts/move-core-to-postgres.mjs`; 226 rows in 12 tables compared value by value; the running app's answers compared with the old code's before the switch, row order included. Added within scope: `entries.seq` keeps the old order of entries made at the same moment, and `core.day_of()` keeps SQLite's day rule.)*

### CP4: content out of code
- [x] The Study hub's courses, cards and plans as data, with an example set; "Cardiff Life" as Events with a city setting; the Guide, labels and samples anyone's. *(5 November. Study: the semesters were already data since stage 3; the summer source files, their tests and scripts and the unused room copy went to `Life_OS_data/study/archive/summer-2026-source/`, and what was still summer-specific now comes from the semester's records (`semesterProfile.js`). Events: code in `events/`, research in the events data folder with `events-settings.json` (city, sources, links); old addresses redirect through `LIFE_OS_MOVED_ADDRESSES`; choices carried forward. Also, found on the way and done within scope: Budget's names and browser keys neutral (copied forward); JobMap ranks by the owner's places from its preferences (all 1,306 jobs keep their labels); mail/HARVEST.md general with `HARVEST.local.md` private. The example set for a fresh install is made in CP5. Left for CP5: the public README and .gitignore, rewording a frozen migration comment, and allowing the UK region table's mention of Cardiff as geography.)*

### CP5: the public version
- [ ] `scripts/publish-public.mjs` (allow-list, README, MIT licence, example data, setup), privacy scan zero, tests and build in the public folder, fresh history.

### CP6: the push, on her yes
- [ ] To the repository she names; the pushed tree scanned again.
