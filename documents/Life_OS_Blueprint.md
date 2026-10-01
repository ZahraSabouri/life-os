# Life OS — The Blueprint
**Version 1.0 · 2 July 2026 · for Xar**

This is the founding document for your personal life-management app: what you want, what the world's best apps teach us, the skeleton I propose, the stack, the design language, and exactly where to start tomorrow. Everything here is a proposal to react to — disagree freely, that's what a blueprint is for.

---

## 1. What you actually asked for (vision inventory)

Distilled from everything you've described, in your own intent:

**The one-sentence version:** a single private app, on phone and laptop, where you can *say or type anything about your life* and it lands in the right place automatically — then shows it back to you beautifully.

**The domains you listed:**

| Domain | What you described |
|---|---|
| Time | Giant calendar: seminars, trips, travel to Iran, birthdays, "dates I must remember", free days vs study days |
| Study | The kind of planning this tracker does (phases, cards, evidence, progress) |
| Memories | Photo uploads tied to moments/places — beach in Cardiff, Welsh historical sites, London, workouts |
| Tasks | To-do lists, everyday tasks |
| Home | Shopping list, grocery list |
| Places | Saved locations |
| Career | Job hunting pipeline, PhD applications, research, skill expansion |
| Body | Workout planning + tracking |
| Mind | Books read, movies watched, blogging/writing, interesting materials saved, voice notes, art |
| Code | Snippets / "little GitHub" |
| Style | Virtual closet — pick outfits from your own clothes |

**Your two hard requirements:**
1. **Input friction ≈ zero.** Every tool you tried died because entering data cost too much. The AI capture layer is not a feature — it *is* the product.
2. **Design that makes you excited to open it.** Sophisticated, not busy; fascinating, not complicated. Fonts, colors, motion all matter.

**Your constraints:** solo user, student budget (£0 now, <£5/mo later), iPhone + Windows laptop, possibly a home/VPS server later, ~1 hour blocks around an MSc.

---

## 2. What the best existing apps teach us

I looked at the tools you named plus the niche leaders per domain. The pattern is brutal and consistent: **apps win on capture speed and die on input friction.**

**Todoist — the most important lesson, and fresh proof you're right.** In January 2026 Todoist shipped **Ramble**: you speak naturally, an LLM (Gemini 2.5 Flash) turns rambling speech into structured tasks with dates, priorities and projects ([TechCrunch](https://techcrunch.com/2026/01/21/todoists-app-now-lets-you-add-tasks-to-your-to-do-list-by-speaking-to-its-ai/), [Todoist docs](https://www.todoist.com/help/articles/dictate-to-add-tasks-with-ramble-P1Raq7vVF)). Their classic magic — typing "dentist tomorrow 3pm #health p1" and having everything parsed — was already the gold standard of quick add. **Steal:** natural-language-first capture, parse-then-confirm. **Avoid:** their limitation — it only produces *tasks*. Yours produces any entry type.

**Google Calendar / iOS Calendar.** Steal: *layers* (toggleable calendars — Study, Career, Trips, Birthdays as colored layers over one grid), month/week/agenda views, recurring events done right. Avoid: events are dead ends — no photos, notes, or links hanging off them. In your app a calendar item is a full entry that can hold the photos from that trip.

**Trello (and your own tracker).** Steal: the card as a satisfying unit of work; drag between columns; checklists. Your Summer Rescue app already proves you like working this way — keep boards as a *view*, available for any project-like collection (job pipeline: Found → Applied → Interview → Offer).

**Jira.** One lesson only: **this is your anti-goal.** Configurable everything = a second job administering your tool. Every time we design a feature, we ask "is this becoming Jira?" and cut.

**Evernote.** The cautionary tale: capture-everything with no structure becomes a landfill you never open. **Steal:** capture anything, including web clips and voice. **Avoid:** structureless notes. Your fix is that AI assigns type + tags at capture time, so nothing lands unstructured.

**Notion.** Steal: "everything is a database with views" — philosophically your entries-core. Avoid: blank-page paralysis and setup burden; you'd spend a month building the workspace instead of living in it. Your app ships with the structure *pre-decided*.

**Microsoft To Do.** Steal: "My Day" — a deliberately small daily view that resets, low-pressure. Maps to the Today view you already have in the tracker.

**Niche leaders worth borrowing from per module (later):** Goodreads (reading log + shelves) but private; Letterboxd (movie diary — the *diary* framing is the good part); Strava/Hevy (workout logging: templates + streaks + personal records); Whering-style closet apps (photograph clothes, generate outfits — validation your closet idea is real); Teal/Huntr (job trackers: pipeline + per-application notes + deadline nudges); Zotero (research: save source + cite + annotate); Day One (journaling: "On This Day" resurfacing — pure joy feature, cheap to build once photos have dates).

---

## 3. The skeleton — my proposal

You guessed the core might be the calendar. Close — but here's the sharper version:

> **The core is the Entry. The calendar is a lens.**

Everything you listed — an exam, a photo from Barry Island, a book, a job application, a pair of jeans, a voice note — is an **entry**: one universal record with a type, dates, tags, places, people, files, links, and type-specific fields. You never "go to the books module to add a book"; you capture, and the entry *appears* in the Books lens, the calendar (if dated), the gallery (if it has photos), and search.

**The three layers:**

```
┌──────────────────────── CAPTURE ───────────────────────────┐
│  One box, always one tap away. Type / dictate / photo.     │
│  AI parses → typed draft entries → you confirm (one tap).  │
└────────────────────────────┬────────────────────────────────┘
┌────────────────────────── CORE ─────────────────────────────┐
│  entries (id, type, title, status, start/end/all-day,      │
│    tags[], places[], people[], files[], links[],           │
│    details JSON per type, created/updated)                  │
│  + people (birthdays!)  + places  + collections             │
│  Entries can link to entries (trip ⇄ photos ⇄ packing list)│
└────────────────────────────┬────────────────────────────────┘
┌────────────────────────── LENSES ───────────────────────────┐
│  Today      – your mission control (proven in the tracker)  │
│  Calendar   – month/week/agenda, toggleable layers          │
│  Boards     – kanban over any collection (jobs, projects)   │
│  Library    – typed shelves: books, movies, materials, code │
│  Gallery    – photos by time and place                      │
│  Map        – entries with places                           │
│  Search/Ask – find anything; later, ask questions           │
└──────────────────────────────────────────────────────────────┘
```

**Spaces** (Study, Career, Body, Mind, Home, Travel, Style) are just saved filters over the same core — a sidebar of colored contexts, not separate mini-apps. This is the difference between "each module costs a weekend" and "each module costs months."

**People are first-class.** Birthdays, "dinner with Sara", gift ideas, who was on that trip — a tiny `people` table makes half your calendar wishes and your photo memories dramatically better.

**The capture loop in detail (your killer feature):**
1. One input box, global hotkey on desktop, home-screen shortcut on phone. Voice = iPhone's built-in dictation (free, on-device) or Web Speech API.
2. Text goes to Gemini Flash with a strict JSON schema of actions: `create_event`, `add_task`, `log_workout`, `add_book`, `save_place`, `add_to_list`, `create_person`, …
3. App renders draft cards: "📅 Dinner with Sara, Fri 7pm · ✅ Buy train ticket · 📚 Started *Deep Learning*". One tap: confirm all. Tap a card to fix a detail.
4. Nothing auto-commits without the confirm — trust is what keeps you using it.
5. Fallback: every lens still has a manual "+" form. AI is the fast path, never the only path.

**What stays out (v1 discipline):** code hosting (use real Git; self-host Gitea later and link it), blogging *publishing* (write in the app, publish elsewhere later), the closet (needs the photo pipeline mature — it's a Phase 4 treat, and a great one).

---

## 4. Stack — modern where it pays, boring where it protects you

Your Oracle instinct is exactly right in spirit: age is not a criterion, fitness is. (Oracle itself is enterprise licensing + DBA overhead for zero benefit to a solo app — SQLite, also "old", is the single most deployed database on Earth and is *perfect* here. Old ≠ bad, and new ≠ good.)

**Frontend — modern, familiar:**
- **React 19 + Vite** (you know it; nothing in 2026 obsoletes it for this)
- **TanStack Router + TanStack Query** — the modern, type-safe routing/data layer this project deserves (a real upgrade over the tracker's hash routing)
- **TypeScript from day one** — a multi-year project without types becomes unmaintainable; this is non-negotiable modern hygiene
- Styling: your **design-token CSS approach scaled up** (you clearly have taste — the tracker's token system is professional-grade) or Tailwind v4 if you want speed; either is respectable
- **PWA** (manifest + service worker + offline cache) for the iPhone install

**Backend — the decision matrix, eyes open:**

| Option | What it is | Modern? | Fit for you |
|---|---|---|---|
| **PocketBase** ⭐ | One free Go binary: SQLite + auth + file storage + realtime + admin UI. v0.36 in 2026, runs in 50–100 MB RAM, backup = copy a folder ([docs](https://pocketbase.io/docs/going-to-production/), [FAQ](https://pocketbase.io/faq/)) | Modern *architecture* (2022-born), boring to operate | **Best fit.** £0, self-host path matches your server plan, file storage built in for photos |
| Supabase | Hosted Postgres + auth + storage, free tier | Yes | Good if you never want to run a server; cloud-dependent |
| Convex | Reactive backend — queries auto-update live across devices ([comparison](https://merginit.com/blog/24082025-sync-engines-guide-electricsql-convex-zero)) | Very | Gorgeous DX, but cloud-only and vendor-shaped — weaker "own it forever" story |
| Local-first sync (Zero, ElectricSQL, PowerSync, TinyBase) | The 2026 frontier: device-local DB syncing via CRDTs/replication ([2026 comparison](https://trybuildpilot.com/648-electric-sql-vs-powersync-vs-zero-2026), [awesome-local-first](https://github.com/alexanderop/awesome-local-first/blob/main/README.md)) | Bleeding edge | Philosophically *ideal* for a life OS (offline-first, instant), but you'd spend your year fighting sync plumbing instead of shipping modules |

**My recommendation:** **PocketBase + SQLite now**, PWA offline caching for read access on the go, and revisit local-first in a year if offline *writes* on the train become a real pain. You get 90% of the modern experience with 10% of the risk. Design one thin `api/` layer in the app so the backend is swappable — that keeps the local-first door open.

**AI layer:**
- **Gemini Flash free tier** for parsing — roughly 1,000–1,500 requests/day free depending on model (limits shift, check [AI Studio](https://ai.google.dev/gemini-api/docs/rate-limits)); one person's life logging won't dent it. £0.
- Voice: iPhone dictation / Web Speech API → text → same pipeline. £0. (Todoist's Ramble runs on exactly this model class — you're building the same tech for yourself, free.)
- Later: an **MCP server over PocketBase** so Claude on your Pro plan can read/write your life data conversationally ("plan my week", "add this syllabus to the calendar") with zero API cost.
- Later: embeddings for semantic search over materials/notes (Gemini embedding API also has a free tier).
- Never: Selenium against chat websites — brittle, ToS-violating, misery.

---

## 5. Design language — "fabulous, efficient, not busy"

You already have proof of taste: the tracker's warm-paper/espresso themes, Fraunces + Manrope + Space Grotesk, one confident accent. The life OS deserves its **own identity** — related sophistication, different soul.

**Direction to explore (working name for the language: *Field Notes*):** the app should feel like a beautiful private journal that happens to be intelligent — not a dashboard, not a SaaS tool. Calm surfaces, generous whitespace, editorial serif for moments ("Good morning, Xar", trip titles), crisp sans for UI, tabular numerals for data. One accent per Space (Study teal, Career indigo, Body coral, Mind amber…) so *color = context* everywhere: calendar layers, tags, board columns.

**Principles to hold:**
1. **Content is the decoration.** Your photos, your handwriting-like notes, your streaks are the visual richness; the chrome stays quiet.
2. **Motion = meaning, never noise.** Confirm-capture gets a satisfying settle animation; views transition softly; celebrations for milestones (you liked the confetti). All under `prefers-reduced-motion` discipline.
3. **Dark mode is a first-class theme from day one**, not an afterthought.
4. **Design tokens before any screen.** Colors, type scale, spacing, radii, shadows, motion durations as CSS variables — every future module inherits beauty for free.
5. **References to study:** Things 3 (calm task perfection), Linear (motion + polish), Family/Amie (playful calendars), Day One (memories done warmly). Screenshot what you love into a moodboard folder.

**On "a month of design first":** don't. A month of Figma before code is how solo projects die. Do a **one-week design sprint** (moodboard → tokens → paper sketches of Capture, Today, Calendar → one polished mock of a single screen), then design *in code* alongside building — a living `/styleguide` page in the app itself. You'll make better decisions with real data on real screens, and the app stays your single source of design truth.

---

## 6. Roadmap (exam-safe)

Hard rule: **the Summer Rescue campaign owns your focus until the exams end (~28 Aug).** Life OS is an evenings/rest-day hobby until September — and that's an advantage: July–August is exactly the right amount of time for the thinking phase.

| Phase | When | Ship |
|---|---|---|
| **0 · Foundations** | Jul–Aug (light, ~2–3 hrs/wk) | Backend decision via the toy-app test (see §7) · design sprint week · entry-type list finalized · name picked · repo + PocketBase running |
| **1 · The spine** | Sept | Capture box (text) → AI parse → confirm loop · entries core · Today + Calendar lenses · people + birthdays · PWA on your phone |
| **2 · Daily life** | Oct–Nov | Voice capture · lists (shopping/grocery) · photos + Gallery · places + Map · tasks matured |
| **3 · The collections** | Dec–Feb | Books · movies · job/PhD pipeline (board lens) · workouts · writing · materials + voice notes |
| **4 · The delights** | Mar+ | Closet · "On This Day" memories · MCP server for Claude · semantic search · code snippets/Gitea link |

Milestone test for Phase 1: *"Dinner with Sara Friday 7pm, buy her a gift, and I finished chapter 3 of Deep Learning"* — spoken once, three correct entries, under 15 seconds. When that works, you'll never go back to other apps.

---

## 7. Start tomorrow — the actual checklist

1. **Make the new home** (30 min): create a `Life_OS` project folder (separate from this Cardiff one), new Cowork project pointed at it, new git repo. I'll draft the project instructions for the new Cowork project when you're ready — say the word.
2. **The toy-app test** (one evening): download PocketBase, `./pocketbase serve`, admin UI opens → create a `trips` collection with a photo field → 20-line JS page that lists trips → open it from your iPhone on the same Wi-Fi. If that evening feels good (my bet: it will), the backend decision is made.
3. **Paper before pixels** (1–2 evenings): write the v1 list of entry types and their extra fields (10–15 types max). This one page *is* the data model. Bring it to me and we'll pressure-test it together.
4. **Moodboard** (ongoing, fun): a folder of screenshots — apps, posters, fonts, colors that make you feel what you want this app to feel like.
5. **Name it.** "Life OS" is the category, not the name. Something yours — you'll open it every day for years.

Then in September, we build the spine.

---

## Sources
- [TechCrunch — Todoist Ramble launch](https://techcrunch.com/2026/01/21/todoists-app-now-lets-you-add-tasks-to-your-to-do-list-by-speaking-to-its-ai/) · [Todoist Ramble docs](https://www.todoist.com/help/articles/dictate-to-add-tasks-with-ramble-P1Raq7vVF) · [Todoist Quick Add](https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz)
- [PocketBase — going to production](https://pocketbase.io/docs/going-to-production/) · [PocketBase FAQ](https://pocketbase.io/faq/) · [Self-hosting guide](https://1vps.com/self-hosted-app/pocketbase)
- [Sync engines compared: ElectricSQL vs Convex vs Zero](https://merginit.com/blog/24082025-sync-engines-guide-electricsql-convex-zero) · [ElectricSQL vs PowerSync vs Zero (2026)](https://trybuildpilot.com/648-electric-sql-vs-powersync-vs-zero-2026) · [awesome-local-first](https://github.com/alexanderop/awesome-local-first/blob/main/README.md)
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Free tier breakdown 2026](https://www.aifreeapi.com/en/posts/gemini-api-free-tier-rate-limits)
