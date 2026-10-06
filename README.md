# Life OS

Personal life-management app — private, single-user, built to grow over the next year+.
Start here: `documents/Life_OS_Vision.md` for the why, `documents/ROADMAP.md` for where things stand and what's next, `documents/Life_OS_Architecture.md` for how it's built, `documents/DECISIONS.md` for what was chosen and why, `documents/Life_OS_Plans_Inventory.md` for everything planned so far, `documents/STATUS.md` for the current state and next step, and `documents/WORKFLOW.md` for how the work runs (with the prompts to use). Coding agents: read `AGENTS.md` first (Claude Code loads it through `CLAUDE.md`).

**Nothing in this folder structure is a fixed contract.** It's organized for clarity today; reshape it whenever it stops fitting.

## Run it

Double-click **Start Life OS.cmd**. It starts one local server and opens http://127.0.0.1:47850/. **Stop Life OS.cmd** stops it. After changing frontend code, run **Build Life OS.cmd** and reload; after changing anything in `hosting/`, stop and start again.

## What's inside

Life OS is the core app plus four apps that used to run on their own. Each keeps its own interface and its own way of saving; Life OS shows it full-screen with a small "← Life OS" button to come back. They're being rebuilt one by one as native parts of Life OS (see `documents/ROADMAP.md`); until each one is, it runs as it is.

| App | Open it at | Folder | How it runs |
|---|---|---|---|
| Life OS (Court, calendar, today, capture) | `/` | `code/life-os/` | Express + SQLite backend, Vite + React frontend |
| Study hub (the Summer Rescue app) | `/study` | `summer-rescue/` | built files + its own local API, inside the Life OS server. `summer-rescue-plan-app/` is an out-of-date July copy, no longer served |
| Cardiff Life (events and communities) | `/cardiff-life` | `cardiff-life/` | one generated HTML page, served as-is |
| Budget Management ("Everyday") | `/budget` | `budget-management/` | its own server, started by Life OS on a private port |
| JobMap (jobs and applications) | `/jobmap` | `jobmap/` | its own server, started by Life OS on a private port |

## Layout

- **`code/life-os/`** — the core app: `backend/`, `frontend/`, `shared/`.
- **`hosting/`** — the single server. `app.mjs` decides which app answers which address; `budget.mjs` and `jobmap.mjs` start those apps and forward to them through `proxy.mjs`.
- **`launch.mjs`** and the **`.cmd`** files — start, stop and build.
- **`summer-rescue/`, `cardiff-life/`, `budget-management/`, `jobmap/`** — the four apps. Each has its own README.
- **`scripts/`, `migration/`** — the one-time copy scripts and the records (hashes, logs, counts) showing each copy matched its original.
- **`documents/`** — living docs: vision, blueprint, architecture, data model, handoff notes. Read these before big decisions.

## What git holds, and what it doesn't

Git holds the code and documents. **Personal data stays on this computer and is not on GitHub**, so it needs its own backup:

- `code/life-os/backend/data/` — the Life OS database
- `summer-rescue/local-data/` — study progress; `summer-rescue/public/study-assets/` — lecture material (~365 MB)
- `budget-management/data/`, `backups/`, `browser-data/`, `archive/`, the two receipt review reports — the live plan and its history; `assets/images/` — artwork (~540 MB)
- `jobmap/data/` — the job collection, your notes and statuses, the search inbox
- `migration/backups/` — data copies taken before each app was attached
- `code/life-os/frontend/public/fonts/` and `study-assets/` — large local media

The full list is in `.gitignore`.

## Setting up a fresh copy

Needs Node.js 22.13 or newer.

1. `npm install` in `code/life-os/backend`, `code/life-os/frontend` and `summer-rescue`. Budget Management and JobMap need no install to run.
2. Run **Build Life OS.cmd**.
3. Put the personal data folders listed above back from your backup. Without them the apps start empty.
4. **Start Life OS.cmd**.

## Branches

- **`main`** — accepted work. Each stage is built on its own branch (`stage/<id>-<name>`) and merged here when Xar accepts it (see `documents/WORKFLOW.md`).
- **`v2-subapps`** — the whole project folder, with the four apps attached (1 October 2026). Merged into `main` on 5 October 2026 (tag `pre-development-2026-10`).
- **`v1-pre-subapps`** — Life OS as it was just before the apps were attached (only `code/life-os`, at the repository root).
