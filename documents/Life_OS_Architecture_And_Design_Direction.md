# Life OS — Architecture & Design Direction

**A thinking document · written 2026-07-06 · for Xar**

This is the "how should the whole thing be shaped" report you asked for — the counterpart to the UI Polish Brief. It is a *proposal to react to*, not a plan you've signed. Per the project rules, everything here is current best thinking, held loosely; the domain groupings and the revised sequence are a scratchpad to rewrite freely, not a contract. Where I recommend, I say so; where it's your call, I flag it.

It answers the question underneath your feedback: **the Court dumps every kind of thing into one flat feed (note, event, task, workout, book, movie), and that's the wrong structure for an app that wants to contain many rich sub-apps.** You want each domain to feel like a complete, standalone, sophisticated app — Study Hub is your proof it's possible — while still being one integrated Life OS where a study exam shows up on the calendar and a job deadline shows up in Today. This report designs that.

Structure:
1. The core question — two architectures, and which I recommend
2. The information architecture — hub-and-rooms
3. Classifying the domains into rooms
4. How rooms stay connected without becoming silos
5. What this means for the Brief 3–12 plan
6. Design direction — making rooms feel standalone *and* unified
7. Open decisions for you

---

## 1. The core question: one engine, or many apps?

You said something that sounds like a contradiction with the plan we just wrote. The Brief 3–12 set is built on "one shared engine, thin lenses over it — **don't** build fifteen separate modules." Your new feedback is "I need it to *have all those apps inside it*; Study Hub should feel like a standalone, fully-featured app." So — which is it?

You asked me to lay out both models honestly, then recommend. Here they are.

### Model A — One engine, rich rooms *(recommended)*
One shared data core (the `entries` engine from Brief 4: entries, archetypes, tags, links, people, places, files, search). On top of it, each domain gets its **own richly-designed "room"** — a full-screen experience with its own layout, interactions and personality, like Study Hub. The room *feels* like a standalone app. Underneath, everything it stores is just entries in the one database, so it can share and cross-reference with every other room for free.

The key reframe: **"standalone app" is an experience decision; "shared engine" is a data decision. They are not in tension — they live at different layers.** A room can be as bespoke and beautiful as a dedicated app while its data lives in the common core.

### Model B — Separate apps, linked at the edges
Each domain is genuinely its own app: its own data model, possibly its own storage, its own backend logic, stitched to the others only at explicit seams (e.g. Study exports exam dates to Calendar via an integration). Maximally independent; each room can diverge without constraint.

### The trade-off

| | Model A — one engine, rich rooms | Model B — separate apps |
|---|---|---|
| Cross-domain links (exam→calendar, job→today, photo→place) | **Free** — same table, `entry_links` ties anything to anything | Expensive — every link is an integration you build and maintain |
| Cost of a new domain | A registry entry + a room UI | A whole new app: schema, storage, backend, sync |
| "Feels like a standalone app" | **Yes** — rooms are as bespoke as you design them | Yes |
| Search across your whole life | One index over one store | Federated search across N stores — hard |
| Risk of the Evernote-landfill / fifteen-weekends trap | Low — data is unified, only UI is per-room | **High** — the exact failure the Blueprint warns against |
| Solo-maintainer, £0, many years | **Sustainable** | Punishing over time |
| Data ownership / "move it forever" | One export, one DB | N exports, N formats |

### What the field does
The 2026 super-app consensus is unambiguous and it's **Model A's shape**: a shared core (identity, data, notifications, search) with modular, independently-evolving services on top — a hybrid, not a monolith and not N separate apps ([DashDevs](https://dashdevs.com/blog/super-app-architecture-future-digital-ecosystems/), [super-apps.ai](https://super-apps.ai/blog/enterprise-super-app-architectures-containerization-and-modular-design-patterns-for-2026/)). The one place enterprise advice diverges — "each service gets its own database" — is a *team-scale* concern (independent deploy, blast-radius isolation). For a **single-user app**, per-service databases are pure cost and they're the silo trap; you want one store, modular UI. So: take the industry's shared-core + modular-rooms shape, drop the per-service-DB part that only makes sense for big teams.

### Recommendation
**Model A, unambiguously** — and note it *is* the Brief 3–12 engine, not a departure from it. The thing to change is not the engine; it's the **layer above** it. Today there's no "room" concept — there's a Court that lists everything and a couple of lenses. The fix is to add a real hub-and-rooms structure and to hold each room to Study-Hub-grade design. Your instinct ("each domain should feel like its own app") and the Blueprint's rule ("don't duplicate data per module") are both right, because they're about different layers. The only genuine mistake would be duplicating *data* per domain; giving each domain a *rich UI* is the goal, not the mistake.

One honest caution, said once: even with a shared engine, a dozen richly-designed rooms is a lot of surface for one person over years. So the discipline is **build rooms one at a time, to a high bar, reusing shared parts** — Study Hub is the template — not all rooms at once, half-finished. The engine is what makes each *next* room cheap; the design bar is what makes each room *worth* opening.

---

## 2. The information architecture: hub-and-rooms

The Court's current job — "show me everything I captured" — is the wrong job for a home screen in a many-domain app. A flat feed of note+event+task+workout+book+movie is the Evernote landfill in miniature: everything at once, so nothing has a home.

The pattern that fits is **hub-and-spoke** (in personal-app language: **hub-and-rooms**). In this model the hub is a calm home that *routes you into* rooms; each room is a focused world; and a small set of **shared services live at the hub and cut across every room** — search, capture, navigation, the day view ([Interaction Design Foundation](https://www.interaction-design.org/literature/article/show-me-the-way-to-go-anywhere-navigation-for-mobile-applications), [Smashing Magazine](https://www.smashingmagazine.com/2014/10/wayfinding-for-the-mobile-web/)). The benefit is exactly what you're missing: focus and low noise, because each screen is about one thing.

So Life OS splits cleanly into two kinds of surface:

**The spine (shared, cross-cutting — always one tap away, present in every room):**
- **Capture** — the one input box. Type/dictate anything; it becomes an entry in whichever room it belongs to. This is the heart of the Vision and it's *global*, not owned by any room.
- **Today** — your mission-control day view: today's dated entries and open commitments, pulled from every room. (Amie and Sunsama both prove the day-view-as-home model; Amie's natural-language quick-add is the same capture ethos — [efficient.app](https://efficient.app/compare/sunsama-vs-notion).)
- **Calendar** — the timeline lens over everything dated, from every room, with per-domain colour layers.
- **Search / Ask** — one index over your whole life (Brief 11), reachable by `/` or `⌘K` from anywhere.
- **Ground** — the global theme (madder/indigo/paper), and eventually settings/backup.

**The rooms (bespoke, domain-owned — each a "standalone app" experience):**
- Study Hub · Library · Career/Pipeline · Body · Memories · Home/Lists · Places · (later: Closet, Code, Writing…)

The **hub** (what the Court should become) is a quiet home that does three things: greets you, surfaces the spine (a capture affordance, "what's today", a search entry), and presents the **rooms as a set of doors** — a grid or rail of beautiful room-cards, each carrying its domain colour and a live glimpse: "Study — 3 sessions today", "Library — reading *Deep Learning*", "Career — 2 deadlines this week". Clicking a door takes you *into* that room's full world. The hub is a lobby, not a landfill.

The mental model: **the spine is the building's corridors and utilities; the rooms are the rooms.** You're always in the same building (one theme, one nav grammar, one capture box), but each room is its own place.

---

## 3. Classifying the domains into rooms

The Vision lists many domains. Flattened into one feed they're chaos; grouped into rooms they're an app. Here's a **proposed** grouping — current thinking, fold in changes freely; the Vision explicitly says the domain list is open.

Two organising ideas do the work together:
- **Archetypes** (Brief 4: moment, commitment, workstream, collection, practice, anchor) decide *how a thing behaves and which shared lens it appears in*.
- **Rooms** decide *where you go to live in a domain*. A room is usually one Space (saved filter, Brief 5) given a bespoke UI.

| Room | Vision domains it holds | Dominant archetypes | Standalone-app it replaces |
|---|---|---|---|
| **Study Hub** | Study campaigns, modules, revision sessions, evidence | workstream, practice, moment | your exam tracker (already built — the template) |
| **Library** | Books, movies, saved materials/bookmarks, code snippets | collection | Goodreads, Letterboxd, Pocket, a snippet vault |
| **Career** | Job hunting pipeline, PhD applications, research, skills | workstream, commitment | Teal/Huntr job trackers |
| **Body** | Workout plans + tracking, health | practice, moment | Strava/Hevy |
| **Memories** | Photos tied to moments/places, journaling, voice notes | moment, collection | Day One, Apple Photos |
| **Home** | Shopping lists, grocery, errands, everyday tasks | commitment, collection | Todoist, a list app |
| **Places** | Saved locations, the map | anchor, moment | a saved-places map |
| **Closet** *(later)* | Photographed clothes, outfits | collection | Whering-style closet apps |
| **Calendar** *(spine, not a room)* | Every dated thing from every room | — | Google/Amie calendar |
| **People** *(cross-cutting anchor)* | Birthdays, "dinner with Sara", gift ideas | anchor | contacts + reminders |

Notes on the classification:
- **Calendar, Today, Search, Capture are spine, not rooms** — they aggregate *across* rooms, so they can't belong to one. This is the cleanest line in the whole design: if a surface is about one domain, it's a room; if it's about all domains at once, it's spine.
- **People is a cross-cutting anchor**, not a room of its own (yet) — people thread through Memories, Calendar and Career. A person's detail page is a small shared view, not a big room. (Matches Brief 6.)
- **Some Vision domains collapse into a room** rather than getting their own: journaling + voice notes + photos → **Memories**; shopping + grocery + errands + everyday tasks → **Home**. Resist one-room-per-noun; group by "where would I go to do this."
- **Rooms can be added cheaply** because each is (a Space filter) + (a bespoke UI) over the same engine. That's the Model A payoff made concrete: Closet later is a registry type + a room, not a new app.

The number to hold in your head: roughly **6–8 rooms + a 4-part spine**, not fifteen modules. That's rich enough to feel like many apps, small enough for one person to make each one beautiful.

---

## 4. How rooms stay connected without becoming silos

This is the part Model B can't do cheaply and Model A gives you for free. Because every room writes to the same `entries` engine, cross-room behaviour is just data, not integration:

- **Study exam → Calendar & Today.** A module's `exam_date` is a dated entry; it appears on the Calendar and in Today automatically. You don't "sync" — it was never separate.
- **Job application → Today & Calendar.** A `job-application` entry with a `next_action` date surfaces in Today and on the timeline while living on the Career pipeline board. (Brief 7's payoff.)
- **Photo → Memories, Places, Calendar.** A photo's EXIF date makes it a dated memory; its GPS makes/links a place; it shows in Memories, on the Map, and on "On This Day" (Brief 8).
- **Book finished → timeline.** A `finished_at` puts the book on the calendar the day you finished it, while it lives on the Library shelf (Brief 9).
- **A person → everywhere they appear.** "Dinner with Sara" (Calendar), her birthday (Today), the trip photos she's in (Memories) all resolve to one person via `entry_people` (Brief 6).

The connective tissue is four engine features, all already in the Brief 3–12 plan: **the shared entry + archetype registry (4), tags + Spaces (5), links + people + places (6), and search (11).** Rooms are the *views*; these are the *nervous system*. "Write once, appear everywhere" is the whole reason to build on one engine.

The rule that keeps it clean: **rooms never own data exclusively.** An entry can be in Study *and* on the Calendar *and* in a person's history at once. If you ever feel tempted to give a room its own private store "just for this domain," that's the silo trap — push back on it (a bespoke `details` schema on the shared entry is almost always enough).

---

## 5. What this means for the Brief 3–12 plan

Good news: **you don't throw the plan away.** Model A *is* that engine. Briefs 4 (registry/archetypes), 5 (tags/Spaces), 6 (links/people/places), 7 (boards), 8 (files), 11 (search) are precisely the shared core and the connective tissue this architecture needs. They stay.

What this report *changes* is smaller and mostly about framing and one added layer:

1. **Rename "lens" → "room" where a surface is domain-owned, and hold rooms to Study-Hub design grade.** The plan sometimes treats Library/Boards/etc. as thin lenses. Reframe the domain-owned ones as rooms with real design budgets; keep Today/Calendar/Search as spine lenses.
2. **Insert a "hub + room-shell" layer.** Before or alongside the domain rooms, build: (a) the hub that replaces the flat Court — greeting, capture, today-glance, and the room-doors grid; (b) a reusable **room shell** (shared chrome: back-to-hub, room title + domain accent, room-level capture, consistent nav) that every room inherits so they feel like one family while their interiors differ. This is the single most important structural addition, and it's what makes "standalone yet unified" real. *(The UI Polish Brief already does the prerequisite: unify theming and nav across screens.)*
3. **Sequence rooms one at a time, highest-value first.** Study Hub (Brief 10) is done-ish and is the template — treat it as the reference the room shell is extracted *from*. Then the rooms Xar will open daily.

Here is a **proposed** Now / Next / Later — explicitly a rewritable scratchpad, not a schedule you've signed, and it respects the hard rule that Cardiff exams own your focus until ~end of Aug 2026 (Life OS is evenings/rest-days until then):

- **Now (finish the foundation):** the UI Polish Brief (unify theme + nav, fix the calendar), then the engine keystones — Brief 4 registry/archetypes, Brief 5 tags/Spaces. Extract the **room shell** from Study Hub. Rebuild the Court as the **hub** (room-doors, not a feed).
- **Next (the first two or three rooms + the tissue):** Brief 6 links/people/places (the nervous system) → then rooms in value order — likely **Library** and **Career**, reusing boards (Brief 7) and the room shell. Keep Calendar/Today/Search as the maturing spine.
- **Later:** Memories + the photo pipeline (Brief 8) and its Map/On-This-Day delights, Body, Home/Lists polished into a real room, Closet, Code, Writing. Then the big parked chapter — **the AI capture layer** (the actual heart of the Vision), now that the registry, links and search give it a well-defined target.

If any of that ordering is wrong for how your life actually goes, we rewrite it — that's what this section is for.

---

## 6. Design direction — standalone *and* unified

You care deeply about how it feels, and "working but ugly is not done." The design challenge here is a specific one: **how do rooms feel like distinct, fully-featured apps while the whole thing still feels like one Life OS?** The answer is a small set of shared grammars, and one deliberate axis of per-room difference.

### 6.1 The two-layer colour system — Ground × Domain
You already have **Ground** (madder / indigo / paper): the *world's mood*, chosen by you, global. Layer on top a **domain accent per room** (semantic colour = context, the standard design-system practice — [designsystems.surf](https://designsystems.surf/articles/color-in-design-systems), [imperavi](https://imperavi.com/blog/designing-semantic-colors-for-your-system/)):

- Study — teal · Career — indigo · Body — coral · Memories — sage/rose · Home — amber · Places — a stone/blue · Library — a violet. (These map onto the `--g-coral/rose/sage/blue` tokens already in `tokens.css`; formalise them as domain tokens.)
- **Ground sets background, ink and overall temperature; the domain accent tints the room** — the room's header, its active states, its calendar layer, its tag chips. So Study feels teal-ish *within* whatever Ground you've chosen, and on the calendar a Study item is teal, a Career item indigo — colour tells you which room a thing came from, everywhere it appears.
- Critical rule (the bug the UI Polish Brief fixes): **no room ever overrides Ground.** A room expresses itself through its *accent*, never by swapping the background palette. That's how the calendar stopped being "fixed blue."

### 6.2 Shared grammar (what makes it one app)
Every room inherits, from the **room shell**:
- The same chrome: wordmark, live date, the primary nav, the Ground control, a consistent "← Hub/Court" affordance, and the global capture + search.
- The same **type roles**: editorial serif (Fraunces-family) for moments and titles/greetings; a crisp sans (Manrope/Space Grotesk) for UI; tabular numerals for data; the poem/serif for quiet bilingual companions (like the Persian dates). One type system, used the same way in every room.
- The same **motion language**: soft view transitions, a satisfying settle on capture-confirm, milestone celebrations — all under `prefers-reduced-motion`. Motion means something; it's never decoration.
- The same spacing/radius/shadow tokens. A room can't invent its own metrics; it composes shared ones.

### 6.3 Deliberate difference (what makes a room feel standalone)
Within that shared shell, a room owns its **interior layout and its signature interaction** — this is where "it feels like a whole app" comes from:
- **Study Hub** — campaign/phase board, module heroes, progress rings, evidence. (Your existing design — the north star.)
- **Library** — cover-grid shelves for books/movies; a reading-list for materials; a monospace, copy-to-clipboard list for snippets. Feels like Goodreads-meets-Letterboxd, privately.
- **Career** — a pipeline kanban (Found→Applied→Interview→Offer) with per-application detail and deadline nudges. Feels like a job tracker.
- **Body** — workout templates, streaks, personal records. Feels like a training log.
- **Memories** — a warm time-and-place gallery, "On This Day," journaling. Feels like Day One.
- **Home** — fast, low-pressure lists that reset. Feels like a good to-do app.

The formula: **shared shell + one bespoke interior + one domain accent = a room that reads as its own app but wears the same clothes as the rest of Life OS.**

### 6.4 The hub's visual job
The hub (new Court) should feel like a calm, beautiful lobby: a warm greeting ("Good morning, Xar"), a single capture affordance, a quiet "today at a glance," and the **room doors** — cards carrying each room's accent, an icon, and one live line of content. It is the least busy screen in the app, on purpose — it's a place to choose from, not to read. (Notion's move of Home into a calm, sectioned launcher is the same instinct — [Notion](https://www.notion.com/help/navigate-with-the-sidebar).)

### 6.5 References to steal from (per room, later)
Amie/Sunsama (calendar-first, natural-language capture, day-planning) for the spine; Things 3 (calm task perfection) for Home; Linear (motion + polish) for the overall feel; Day One (warm memories, "On This Day") for Memories; Goodreads/Letterboxd (private) for Library; Teal/Huntr for Career. Screenshot what you love into a moodboard as you go.

---

## 7. Open decisions for you
None of these block the UI Polish Brief; they shape the rooms work.

1. **Confirm Model A** (one engine, rich rooms). I'm confident, but it's your app — if you still feel pulled toward truly separate apps, we should talk before building the room shell, because the shell assumes the shared engine.
2. **Room priority.** After the hub + shell, which room first — Library, Career, or Memories? (My lean: whichever you'd open *daily* soonest; Library is the cheapest to make gorgeous, Career is the most useful right now, Memories is the most delightful.)
3. **The domain accent palette.** Are the colour assignments in §6.1 close to what you feel, or do you have strong associations (e.g. Study shouldn't be teal)? Colour-per-domain is load-bearing, so it's worth getting the feelings right early.
4. **Hub content.** Beyond room-doors + capture + today-glance, does the hub show anything else (a poem, an "On This Day," a streak)? Easy to add, worth deciding what earns the calm.

---

## Sources
- Super-app / shared-core-vs-modules architecture: [DashDevs — Super App Architecture 2026](https://dashdevs.com/blog/super-app-architecture-future-digital-ecosystems/) · [super-apps.ai — Enterprise Super App Architectures 2026](https://super-apps.ai/blog/enterprise-super-app-architectures-containerization-and-modular-design-patterns-for-2026/) · [NimbleAppGenie — Super App Architecture guide](https://www.nimbleappgenie.com/blogs/super-app-architecture/)
- Hub-and-spoke information architecture / wayfinding: [Interaction Design Foundation — Navigation for Mobile Applications](https://www.interaction-design.org/literature/article/show-me-the-way-to-go-anywhere-navigation-for-mobile-applications) · [Smashing Magazine — Wayfinding for the Mobile Web](https://www.smashingmagazine.com/2014/10/wayfinding-for-the-mobile-web/)
- Semantic / domain colour systems: [designsystems.surf — Color in Design Systems](https://designsystems.surf/articles/color-in-design-systems) · [Imperavi — Designing semantic colors](https://imperavi.com/blog/designing-semantic-colors-for-your-system/)
- Comparable apps' navigation: [Efficient App — Sunsama vs Notion](https://efficient.app/compare/sunsama-vs-notion) · [Notion — Navigate with the sidebar](https://www.notion.com/help/navigate-with-the-sidebar)
- Internal: `Life_OS_Vision.md`, `Life_OS_Blueprint.md`, `Life_OS_AI_Build_Brief_3.md` (Briefs 3–12), current `code/life-os` frontend.
