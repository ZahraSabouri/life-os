# Life OS — Plans Inventory

**Everything planned or imagined for Life OS so far, with its status, so nothing from the earlier plans gets lost.** Compiled 5 October 2026 from the Vision, Blueprint, July architecture and Taxonomy, the Data Dictionary and `data-model/` files, the Implementation Handoff, Build Briefs 1–3, the UI Polish Brief, the Study Redesign Designer Notes, the Stack Notes, the Migration Handoff, the code itself, and the 5 October conversation.

Update statuses as things change, and add new ideas freely. A thing being listed here is not a promise to build it.

**Status words:** **Built** (works in the core app) · **Attached** (works through an attached app, to be rebuilt natively) · **Partly** · **Planned** (has a place in `ROADMAP.md`) · **Later** (kept, no stage yet) · **Parked** (deliberately on hold) · **Idea** (mentioned, not yet shaped) · **Open** (a question to decide)

---

## 0. Principles carried forward

These come from the Vision, the Blueprint and the July architecture, and still judge every feature:
- **Effortless input is the point.** Every feature is judged by whether it reduces or adds friction.
- **It must be beautiful.** "Working but ugly" is not done (visual matching comes after functionality, not instead of it).
- **It's mine.** Single user for now, private data, no third-party analytics, data and code movable forever.
- **Near £0** while a student: own-machine hosting, free tiers, AI already paid for.
- **Don't lose data.** Backups before anything destructive; versioned code.
- **Not Jira:** no configuration burden; structure is pre-decided, not built by the user.
- **Not an Evernote landfill:** everything captured lands somewhere structured.
- **Breadth in the data, restraint in the bespoke interface:** adding a type is cheap; a rich room is built one at a time, to a high bar.
- **Nothing is fixed:** documents are living snapshots, and decisions can be superseded with a record of why.

## 1. Areas: rooms and sections

| Area | What it holds | Status | Roadmap | Notes |
|---|---|---|---|---|
| **Study** | semesters, modules, timetable, assessments and exams, materials, study cards, sessions, progress, focus timer, rescue mode | Native Study CP1/CP2 built; richness/acceptance pending | Stage 3 | Renamed from "Summer Rescue" to Study, for the whole degree. Keeps Summer Rescue's behaviour; manuscript visuals later |
| **Career & Professional** | jobs, shortlist, applications, follow-ups, CV, professional skills | Attached (JobMap; its data owned by Life OS from 28 October; Progress, board, advert gaps and Claude prompts added 28 October) | Stage 4 | The job hunt is a workstream that retires; the room is professional life |
| **Money** | monthly allowance, spending, adjustments, saving goals, renewals, category targets | Attached (Budget) | Stage 5 | New since July (the Taxonomy had left finance out) |
| **Home & Living** | kitchen (stock, usual buys, shopping lists, receipts, meals, recipes), errands, house-hunting, furniture, home projects, home documents | Kitchen part attached (Budget); the rest Later | Stage 5, then later | Recipes become their own collection |
| **Events & community** (Cardiff Life) | events, communities, Maybe / Plan to go choices, week planner, sources | Attached | Stage 6 | Connectors: Cardiff SU, Eventbrite, web pages, agents. Its name may change if it ever serves other cities |
| **Academia & Research** | research projects, papers, PhD and scholarship applications | Later | Stage 7 | |
| **Growth & Learning** | skills, languages, accent practice, courses, practice logs | Later | Stage 7 | |
| **Body & Health** | workouts and plans, routines (skincare, supplements, sleep), meals, appointments, medical records, measurements | Later | Stage 7 | Training / care / medical / nutrition can split into their own rooms later |
| **Relationships** | people, catch-ups, gifts, important dates, messages to answer | Later | Stage 7 | A view over the People entity and everything linked to a person |
| **Culture & Art** | books, films, series, theatre, concerts, exhibitions | Later | Stage 7 | A wishlist and a diary in one |
| **Travel** | trips planned and taken, a destination wishlist | Later | Stage 7 | Ties calendar, places, people and photos around a journey |
| **Memories** | photos, journal, voice notes | Later | Stage 7 | Needs the photo pipeline |
| **Mind & Making** | ideas, saved materials, writing, code snippets, documents | Later | Stage 7 | Blogging: write here, publish elsewhere |
| **Style / Closet** | clothes photographed, outfits | Later | Stage 7 | After photos are mature |

**The four wings on the home screen today:** The Desk (Study, Academia, Career) · The Self (Growth, Body, Style) · The World (Relationships, Travel, Home) · The Soul (Culture, Memories, Mind). **Open:** where Money and Events sit.

New areas are welcome at any time (finance details, faith, volunteering, pets, a side project…). Each starts as entry types plus a saved filter and becomes a room or module only when it earns it.

## 2. Entry types (live registry: 49 types, six archetypes)

**Health, 15 October 2026:** Body & Health became the Health part (`/health`): This week against the UK guideline (150 active minutes, 2 strength days), Exercise (log and plan sessions, 4 programmes including the NHS Couch to 5K, 43 exercises with how-to), Food (diet and the 14 allergens, 36 UK recipes checked against Budget's food at home and added to its recipes, Eatwell Guide, 5 A Day, reference intakes, a label checker), Appointments & tests (calendar and bell, results, measurements). Health panel on Today, figures on the Court's tile, a Health area on the calendar. See `briefs/health-part.md`. Measurements over time (charts), a watch or phone feeding steps, and Review counting active minutes are later.

**Budget food, 14 October 2026:** Meals & recipes opens on Now (this mealtime's plan, meals still to mark, cooked portions, recipes ranked by what is at home and what should be eaten soon). Recipes can be read, scaled, copied, and are templates (ingredients name the food). A meal without a recipe can be written down and becomes one; a food's page lists its recipes. Food & supplies lists what is at home by place and marks several things finished, with or without a day. A meal on the calendar, Today, the Court and Body & Health opens its own card. See `briefs/budget-food-flow.md`. Recipes are still Budget's, not yet their own Stage 5 collection.

**Budget correction, 13 October 2026:** the attached app supports undated, weekly and dated lists. Wishlist items stay out of current Home shopping and monthly shopping forecasts. Imported food-use advice cards were removed; plan settings remain editable. New plans start empty rather than from the personal legacy template. Current interface checks passed; student signup/account storage remains separate future work. See `briefs/budget-fix-meal-workflow.md`, CP2.

**Attached Budget update, 12 October 2026:** receipt pasting/review and replacing a simple estimated payment; pending-payment review; recipes linked to stock; planned preparation batches and their later meals; fridge/freezer portions; ingredients used once at preparation, portions reduced when eaten; preparation and eating shown separately in history. Built in the attached app and checked in the browser with an isolated data copy; user review and actual stock/payment details remain open. See `briefs/budget-fix-meal-workflow.md`. This does not change the native Stage 5 migration status.

Archetypes: **moment**, **commitment**, **workstream**, **collection**, **practice**, **anchor**. Source: `code/life-os/shared/entryTypes.js`.

- **General:** note, event, task
- **Study:** module, module-session, assignment
- **Academia:** research-project, paper, academic-application
- **Career:** job-application, cv, message (also Relationships), skill (also Growth)
- **Growth:** practice-session, course
- **Body:** workout, workout-plan, routine, supplement, meal (also Home), appointment, medical-record, measurement
- **Relationships:** person-link, interaction, gift-idea, important-date
- **Culture:** book, movie, show, performance, exhibition
- **Travel:** trip, destination, place (also Home)
- **Memories:** memory, journal, voice-note
- **Home:** shopping-item, errand, home-item, house-listing, home-project
- **Mind:** idea, material, snippet, writing, document (also Home)
- **Style:** clothing-item

When Study, Career, Money, Home and Events become modules with their own tables, their entry types are either retired or kept as quick-capture shortcuts that create module records (decided per module; see `Life_OS_Architecture.md` §4).

## 3. Views across everything (the spine and the lenses)

**Stage 2 update, 5 October 2026:** Calendar and Today across the attached apps are implemented on `stage/2-calendar-today`, awaiting Xar's visual review/acceptance. Month/day/agenda, area filters, kind styling, the Court Today strips and a preserved `/ledger` are built. Sources are read-only; subscription renewals expand their stored rules. Native timetable recurrence, imports and external-account sync remain later work. The rows below retain the original core baseline; the current checkpoint detail is in `briefs/stage-2-calendar-today.md` and STATUS.

| View | Status | Notes |
|---|---|---|
| **Home** (the Court) | Built: 12 doors in four wings, three grounds, greeting, poem | Stage 1b: Today first, doors below, real data or honest empty states, wording review, Money and Events doors |
| **Today** | Built: shared day/week/attention across attached apps, core task completion. **12 October: rebuilt as the page to work from** (the day's path with study blocks and their cards; Study, Jobs, Home and Notes panels; a note line), live in Modern | Stage 2b (`briefs/stage-2b-my-day.md`): acting from the day, light and dark everywhere, the three other styles' designs |
| **Day planning** | Idea | From the Vision: marking what a day is for (study day, free day) |
| **Calendar** | Built: Month (week numbers), Week by the hour, List and Year; named month steps, Go to, search, keys; Persian/English dates, birthdays, attached providers, kinds and area switches; everything in the address, so Back works (28 October). A day opens over it with Today's day, "Open in …", Done/Change/Move/Take off, study ticks, "I applied", and notes for a day or about one thing (`briefs/calendar-day-and-addresses.md`); visual acceptance pending | Cardiff Life opening one event from a link; dragging things between days on the calendar itself; an `.ics` feed out |
| **Capture** | Partly: a form driven by the type registry | The type picker isn't grouped by room yet. AI capture is Parked |
| **Search / Ask** | Later | PostgreSQL full-text search, English and Persian, a ⌘K palette; asking questions about your life after that |
| **Favorites** | Partly: the `favorite` column and index exist | No star in the interface and no Favorites view yet |
| **Inbox** | Built 28 October (`briefs/mail-and-admin.md`, CP1 to CP5); waiting to go live and for her acceptance. Gathered by her agents (`mail/GATHER.md`, `mail/AGENT-PROMPTS.md`) | Waiting on you (replies, emails, texts, calls, birthday wishes, things to read, do or decide), Mail (gathered messages read in the app, with summaries and priorities), Digests; Today, bell, calendar, People. Captured-but-unfiled things can join later |
| **Map** | Later | Entries with a place |
| **Gallery** | Later | Entries with photos, by time and place |
| **People** | Later | The directory, plus each person's whole thread |

## 4. Entities and links

| Piece | Status | Notes |
|---|---|---|
| People | Built (basic): name and birthday; birthdays on the calendar | Later: optional birthday, relationship, avatar, person-to-person links (friend, family, partner, mentor), a person page with their whole thread |
| Places | Table exists, unused | Later: the Map; photos' GPS creating and linking places |
| Organisations | Planned: Stage 1a (core) and Stage 4 (companies) | Later: universities, venues, clinics, publishers |
| Links between anything (`part-of`, `prepares-for`, `about`…) | Table exists, unused | Planned: Stage 1a |
| Tags with colour, chips and autocomplete | Table exists, unused | Later |
| Spaces (rooms as saved filters) | Built | 12 rooms seeded; `GET /api/entries?room=` |

## 5. The July engine plan, piece by piece

The July plan was Implementation Handoff sessions 1–7, then Brief 3's Briefs 7–12. Those specs were written for SQLite; with PostgreSQL the ideas stand but the implementation details change.

| Piece | Status | Where it goes now |
|---|---|---|
| UI polish: one theme system, shared nav, bilingual calendar cells, calmer today, poem plumbing (session 1) | Built | — |
| Expanded registry (49 types) and favourites column (session 2) | Built; picker grouping and favourites view not built | Later |
| Rooms as spaces and the filter engine (session 3) | Built | — |
| Hub with room doors, the reusable room shell, a generic room view, the Favorites lens (session 4) | Partly: doors built | Stage 1b (home); the room shell arrives with the first native module (Stage 3) |
| Tags (session 5, Brief 5) | Later | Stage 7 |
| Entities and links backend: loosened people, organisations, person links, linking API, hydrated entry detail (session 6, Brief 6) | Partly | Links and organisations in Stage 1a; the rest Stage 7 |
| Entities and links interface: entry detail, person page, People lens (session 7) | Later | Stage 7 |
| Boards with drag ordering (Brief 7) | Later | Possibly Stage 4 for the application pipeline |
| Files and photos: upload, EXIF dates and places, gallery strip, backups (Brief 8) | Planned in part | The files core comes with Study materials (Stage 3); photos later |
| Library shelves, external metadata later (Brief 9) | Later | Stage 7 |
| Study re-home onto entries (Brief 10) | Superseded | Stage 3 builds Study as a module with its own tables |
| Search with a semantic seam (Brief 11) | Later | PostgreSQL full-text search and `pg_trgm`; `pgvector` later |
| Migration runner, automatic backups, full export/import, a settings/data page (Brief 12) | Planned | Runner and backups in Stage 1a; export and the data page soon after |

## 6. Input and intelligence

| Piece | Status | Notes |
|---|---|---|
| Add and edit by hand everywhere | Partly | Core forms exist; the attached apps have their own |
| The import pipeline: inbox, validate, preview, apply, undo, log | Planned: Stage 1c | JobMap's inbox is the working model |
| Downloadable "give this to your AI" instructions per format | Planned: from Stage 1c | Generated from each format's JSON Schema |
| Formats: CSV, JSON, `.ics`; Excel later | Planned | |
| Connectors: scheduled job searches | Attached (Claude and Codex tasks feeding JobMap's inbox) | Stage 4: point them at the Life OS inbox |
| Connectors: Cardiff Life searches (SU, Eventbrite wider Cardiff) | Attached (Codex tasks writing to the old Cardiff Life folder) | Stage 6 |
| Connectors: a timetable's `.ics` link | Planned: Stage 3 | If Cardiff's timetable offers one (Open) |
| Receipt photo → your AI → CSV | Idea | Stage 5 |
| AI capture in the app: speak or type naturally → draft entries → confirm cards | Parked | Still the heart of the Vision; it writes through the import pipeline. Candidates: a free-tier model, or an MCP server so Claude is the capture surface. July milestone test: one spoken sentence ("Dinner with Sara Friday 7pm, buy her a gift, and I finished chapter 3 of Deep Learning") → three correct entries in under 15 seconds. One capture point always within reach: a global hotkey on the laptop, a home-screen shortcut on the phone |
| Voice input (iPhone dictation, Web Speech API) | Later | |
| An MCP server over Life OS | Later | |
| Asking questions about my life, semantic search, suggestions | Later | |
| The Learning Central in-app browser (log in, email, courses, save material into Study) | Idea, late stage | The hardest item: may need a desktop wrapper or a browser extension |
| Built-in AI paid with tokens | Late stage | When finances allow |

## 7. Design and feel

| Piece | Status | Notes |
|---|---|---|
| Grounds: madder, indigo, paper | Built | Each ground sets the whole world |
| An accent colour per area | Partly (on the doors) | Study teal, Career indigo, Body coral, Memories sage, Home amber, Culture violet… |
| The Divan intro with the poem talisman; poems data | Built | `code/life-os/frontend/public/poems-data.js`; the original in the preserved folder's `assets/poems/` |
| Persian and English dates | Built (calendar) | |
| Typography: an editorial serif (Fraunces family) with a crisp sans (Manrope / Space Grotesk) and tabular numbers | Partly | |
| Motion with meaning: soft transitions, a satisfying settle on confirm, celebrations, respect for reduced motion | Later | |
| Plain words on actions, poetry in the atmosphere | Principle (5 October) | |
| Design explorations in the preserved folder: Court Designs (4 pages + engine), Intro Page (poem talisman demo), Study Room Designs (42 pages, 3 grounds), Old (intro and main page studies) | Reference | `Life_OS_preserved_2026-10-01/design-explorations/` |
| The manuscript Study Hub (built, unused) | Reference | `code/life-os/frontend/src/rooms/study-hub/` |
| Study designer-notes gaps: plainer card labels; per-card references with an inline video/PDF player; inline editing; full detail editing; a Planner/Dashboard; a Rescue lane page; a settings/data panel; the command palette; an import preview; a celebration moment; the Study intro; "New Chapter" (creating a module); a week grid; the music player; where settings and search controls live | Planned for behaviour in Stage 3; visuals later | `Study_Redesign_Designer_Notes.md` |
| Matching every section to the Life OS design | Later | After functionality; beauty is still non-negotiable |
| A moodboard; the app's real name | Open | "Life OS" is still a working title |

## 8. Platform

| Piece | Status | Notes |
|---|---|---|
| Hosting on Xar's laptop: one host on port 47850; Start / Stop / Build `.cmd` | Built | |
| PostgreSQL | Planned: Stage 1a | |
| PWA on the iPhone | Later | |
| Tailscale for access away from home | Later | |
| A calendar feed (`.ics`) the phone can subscribe to | Idea | |
| Offline reading on the phone | Idea | |
| A home server or a cheap VPS | Later | When the budget allows |

## 9. Delights for later

On This Day · streaks and milestones · trip threads that gather events, places, people and photos · a person's whole thread · house-hunting on the map · closet outfits · code snippets with a "little GitHub" or a self-hosted Gitea link · blogging drafts · a poem a day.

## 10. Housekeeping and cutover

| Item | Status |
|---|---|
| Claude scheduled task "Cardiff job search to JobMap" pointed at the Life OS inbox | Done (1 October) |
| Codex "UK Tech Job Shortlist — JobMap" (Tue/Thu/Sat/Sun 3 pm): its instructions say Life OS only from 27 October, and Life OS owns the data from 28 October; check the task itself runs in `Life_OS\jobmap` | To check |
| Codex Cardiff Life searches (SU, Thursday 09:00; Eventbrite wider Cardiff, Friday 09:00; a paused Outlook search) still write to `Documents\Cardiff Life` | To do |
| Merge `v2-subapps` into `main` | Done (5 October, tag `pre-development-2026-10`) |
| Old nested `.git` folders (`code/life-os`, `summer-rescue-plan-app`, `budget-management/app`) | Open: keep or remove. `code/life-os/.git` is redundant and waits to be moved to `Life_OS_backups` (Xar's step, see `STATUS.md`) |
| Summer Rescue's own GitHub repository has newer commits than the Life OS copy | Check before Stage 3 |
| Archive the original folders (`Documents\Cardiff Life`, `Documents\BudgetManagement` and the older `Budget Management`, `Documents\JobMap\Career Agent\JobMap App`) once their replacements are accepted | Later; deleting is Xar's step |
| A home for the rest of `Documents\JobMap` (Excel workbooks, `Career Agent\AGENTS.md`, the scheduled-search playbook, notes) | Open |
| Run `node --test hosting/app.test.mjs` on Windows | To do, once tests have their own database (Stage 1a): today it opens the real one |

## 11. Open questions

- The app's real name.
- Home wording: which names stay poetic ("The Court", "Divan", the wings, "Ground") and which become plain.
- Where Money and Events sit among the wings.
- The exact data folder location, and whether `Documents` is synced by OneDrive or another service.
- The PostgreSQL version and installer; which jobs library (or our own table).
- Whether Cardiff's timetable offers an `.ics` subscription.
- The terms of Cardiff SU and other sites for automated collection.
- When TypeScript earns its place.
- The first AI path: a free-tier model in the app, or an MCP server for Claude.
- Recurrence details: reading weeks, cancelled or moved lectures.
- Per module: retire its entry types or keep them as quick-capture shortcuts.
- How good Persian search is with the `simple` configuration.
- The accent colour for each area (July architecture, open decision 3).
- What else Home shows besides Today and the doors: a poem, On This Day, a streak (July architecture, open decision 4).
- Room count and grouping: should any rooms merge or split; is Relationships a room or only the People view (Taxonomy, open questions 1–2).
- Person-to-person links stored once (symmetric) or twice (directional) (Taxonomy, open question 3).
- How AI capture splits one sentence across several areas (Taxonomy, open question 5).
- Other users, one day: their own copies, or a hosted version?
