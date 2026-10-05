# Life OS — Decisions

A history of what we chose, when and why. Newest first. A decision here means "the best idea at the time", not a contract: when one changes, add a new entry and mark the old one as superseded instead of deleting it.

---

## 5 October 2026 — Calendar first (Xar with Claude Code; resumed by Codex)

- Xar asked Claude Code to start work from the plan, write down what it did and leave a brief and precise pickup point for review afterward. This authorises building the documented calendar scope without another brief-approval question for this continuation. Stage acceptance still belongs to Xar.
- Xar then clarified that Calendar and Today should be finished first. Claude agreed to move those ahead of PostgreSQL, but its session ended during read-only mapping. Stage 2 now comes before Stage 1a; PostgreSQL remains the intended core database, followed by native Study. This supersedes the initial order in item 6 below for these next steps.
- Xar said she would install PostgreSQL herself and might need help with the password. No installation, password reset or reuse of the July cluster is authorised by the calendar continuation. Give an interactive installation checklist and verify the chosen server before foundation work.
- Account connections remain important. Assistant connectors and native Life OS OAuth are separate: connecting a provider to an assistant does not connect the app. Setup guidance lives in `CONNECTIONS_SETUP.md`.

## 5 October 2026 — the unified app (Xar with Claude, in Cowork)

1. **One app, not a box of apps.** The four attached apps are rebuilt one by one as native sections of Life OS. Each attached version keeps running until its replacement is accepted. *Why:* Xar wants one app whose parts share a calendar and work together, not a large app holding mini apps. The July architecture already argued for one engine.
2. **Home leads with Today, strongly, and keeps the room doors below it,** with the wording reviewed. *Refines* July's "the hub is a calm lobby of doors". Claude proposed Today alone with the doors moved into the navigation; Xar chose to keep the doors.
3. **The calendar ties everything together.** Every area provides its dated items. Kinds look different (fixed / plan / deadline / reminder); areas are colour layers.
4. **Three ways in for every area:** by hand; by import (files made with ready instructions for your own AI, scheduled agents, connectors such as Cardiff SU, Eventbrite and web pages, calendar subscriptions); later by built-in AI. *Why:* effortless input at £0, using AI subscriptions Xar already has; it's also the foundation the in-app AI will write through.
5. **Study keeps Summer Rescue's behaviour; the manuscript designs are a visual reference for later.** *Why:* in use, the manuscript card was harder to work with than Summer Rescue's (`Study_Redesign_Designer_Notes.md` §A). Summer Rescue becomes **Study**, covering the whole degree; "rescue" becomes a mode.
6. **Order:** Stage 0 (use Budget now) → Foundation → Calendar and Today across all apps → Study → Career → Money & Home → Cardiff Life → the rest of the July plans. *Why:* Study is needed now, and the attached Summer Rescue can't hold a new semester without code changes. Career is the next most important to Xar. Budget is needed right now but already works as it is inside Life OS, and it's the most intricate, so it's rebuilt once the patterns are proven. Cardiff Life is the least urgent.
7. **Database: PostgreSQL from day one.** Xar's decision. Claude recommended SQLite (a single file, nothing to run) with written triggers for moving to PostgreSQL; Xar chose PostgreSQL. *What it gives:* `jsonb`, full-text search and `pgvector` in one engine, real types, mature tooling, a direct path to a hosted multi-user version, and Xar's own DBA experience. *Costs accepted:* a service to run, dump-based backups, major-version upgrades. *Supersedes:* SQLite via `node:sqlite` (5 July).
8. **A modular monolith; no Redis, RabbitMQ or MongoDB.** One server program with a shared core and a module per big area; background jobs in a PostgreSQL table; outside agents feed an inbox folder. New infrastructure only when a written trigger happens (`Life_OS_Architecture.md` §2). *Why:* Xar asked for a structure that can last and grow without unnecessary tools.
9. **Entries for the long tail, module tables for the heavy areas.** Study, Career, Money, Home and Events get their own tables; everything else starts as an entry type and graduates when it needs structure. *Supersedes in part:* "model everything as entries if possible" (July architecture §4, Brief 3 §10.1). *Why:* budget, study and job data have real structure (and the migration notes warned against flattening it), while still needing to connect through the calendar, links and search.
10. **Budget splits into Money and Home; recipes become their own collection.**
11. **Data protection lives in the data layer from the start:** one write door, revisions, change history, soft delete, field ownership for imports, and backups before every risky step. *Why:* AI agents have overwritten edits before, and Xar has lost data to file corruption.
12. **Counts at each module move; the rest of the verification comes later.** Xar preferred to leave hashing and count checks for the late stages; Claude argued that the moment each app's data moves is when data is most likely to be lost; Xar agreed to keep before/after counts at each move.
13. **Other users come in the late stages.** No accounts, onboarding or user tests until then. One rule now: no personal content in code. Modules, exams, budget months and shops are data.
14. **Presenting at Cardiff is parked.**
15. **The Learning Central in-app browser is a late-stage idea.** It's the hardest item on the list (embedding, university login). Until then, materials come in as downloaded files and through imports.
16. **Money is stored as whole pence** in every new table.
17. **Eventbrite constraint noted:** its official API removed public event search (December 2019, fully closed February 2020); only lookups by organiser, venue or event ID remain. Event discovery needs an agent or scraper.
18. **Plain words on actions and labels; the poetry lives in the atmosphere.** *Why:* the manuscript card's poetic verbs were unclear in use.
19. **The workflow: the repository remembers, not the chat.** `STATUS.md` (rewritten every checkpoint), one note per session in `sessions/` (never edited), one brief per stage in `briefs/` with checkpoints and an acceptance checklist. Claude in Cowork plans and reviews; Codex or Claude Code builds on Windows, one agent at a time; a branch per stage, merged and tagged when Xar accepts it. `MIGRATION_HANDOFF.md` is frozen as history. Details: `WORKFLOW.md`, `AGENTS.md`.

## 1 October 2026 — attaching the apps (Codex and Claude, sessions 2–7)

- Keep the original Life OS folder untouched as `Life_OS_preserved_2026-10-01`; work in a fresh `Life_OS` copy.
- Attach Summer Rescue (`/study`), Cardiff Life (`/cardiff-life`), Budget Management (`/budget`) and JobMap (`/jobmap`) unchanged, behind one local host on port 47850, each shown full-screen with a "← Life OS" pill. Visual matching deferred.
- The git repository becomes the whole `Life_OS` folder (branch `v2-subapps`; `v1-pre-subapps` keeps the earlier state). Personal data stays out of git.
- Details: `MIGRATION_HANDOFF.md`.

## 12 July 2026 — the Study Hub manuscript redesign

- The Study Hub was re-skinned to the 42-page manuscript design, inside Life OS. *Superseded:* on 1 October `/study` began showing Summer Rescue instead, and on 5 October the native Study section was set to keep Summer Rescue's behaviour (decision 5 above). The redesign stays as a visual reference.

## 6 July 2026 — architecture, taxonomy and the WAL bug

- **Model A: one engine, rich rooms.** Hub-and-rooms navigation and a shared spine (Capture, Today, Calendar, Search). *Still holds,* refined by 5 October decisions 2 and 9.
- **Twelve rooms** in the taxonomy; people, places and organisations as anchor entities; links between anything; lenses across rooms. *Still holds* as the long-term map, with Money and Events added on 5 October.
- **Domain accent colours** layered over the grounds; a room never overrides the ground. *Still holds.*
- **No forced WAL in SQLite** after a disk I/O error. *Becomes moot for the core* once it moves to PostgreSQL; the lesson still applies to any SQLite file that remains.
- The implementation plan (Implementation Handoff sessions 1–7, then Briefs 7–12). *Superseded as the build plan* by `ROADMAP.md` on 5 October; sessions 1–3 were built, the rest is tracked in `Life_OS_Plans_Inventory.md`.

## 5 July 2026 — the stack

- React 19 + Vite, plain JavaScript; TypeScript when it earns its place. *Still holds.*
- A hand-rolled Node + Express backend instead of PocketBase. *Still holds.*
- SQLite through Node's built-in `node:sqlite`. *Superseded* on 5 October 2026 by PostgreSQL.
- The AI capture layer is parked. Candidates: a free-tier model in the app, or an MCP server so Claude becomes the capture surface. *Still parked;* imports with instructions for your own AI are now the first step.
- Hosting on Xar's own laptop; Tailscale for phone access away from home. *Still holds.*
- Life OS is a fresh app, not a fork of Summer Rescue. *Still holds;* Summer Rescue's behaviour is carried into the native Study section.

## 2 July 2026 — the beginning

- The Vision and the Blueprint: effortless input, design that thrills, private and owned, as close to £0 as possible. An entries core with lenses over it. PocketBase as the leading backend candidate (*superseded* on 5 July).
