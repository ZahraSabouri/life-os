# Life OS — The Taxonomy (the House of the Mind)

**A living document · written 2026-07-06 · for Xar**

This is the thinking behind the data model — how everything in your life is classified so it stays *rich and complete* without becoming a mess. It sits above the `Life_OS_Data_Dictionary.md` (the formal reference) and `data-model/` (the code). Per the project rules, the room list and groupings are current best thinking held loosely — fold in changes freely; nothing here is signed.

It exists to answer the worry underneath your feedback: you want Life OS to be *"a whole complete house of my mind"* — every domain, even ones you haven't named yet — and for each to feel like its own full app, yet all deeply linked. The danger is the opposite of thin: fifteen half-built silos. This taxonomy is how you get breadth **and** coherence.

---

## 1. The one principle that makes breadth safe

**Breadth belongs in the data. Restraint belongs in the bespoke UI.**

Adding a *kind of thing* you track (a type) or a *link* between things costs one line — so the data model should be as complete as your life, greedily. Adding a *bespoke room UI* costs weeks — so rooms are built one at a time, to a high bar, reusing a shared shell.

So when a new part of your life appears — skincare, house-hunting, theatre, a language — the question is never "do we build a new app?" It's "which existing room does this type live in, and what does it link to?" Almost always the answer is cheap. That's what lets the house have infinite rooms without you having to furnish them all at once.

---

## 2. The five layers (what is a "thing" in Life OS)

Everything you capture resolves into exactly one of these. Knowing which is which is the whole discipline.

1. **Entry** — a thing you captured. One universal record. *(a task, a workout, a book, a job application, a memory.)* This is 95% of what you create.
2. **Entity (anchor)** — a stable, first-class *subject* that entries and other entities point at: **a Person, a Place, an Organisation.** Defined once, referenced forever. (Your latest insight — §4.)
3. **Room** — an *area of life* you go into, with its own home. Technically a saved filter over entries, given a bespoke UI. ~12 of these. *(Study, Body & Health, Culture, Relationships…)*
4. **Lens** — a *way of viewing across all rooms*: Today, Calendar, Search, Favorites, Inbox, Map, Gallery, People. Owned by no domain.
5. **Tag** — a free-form cross-cutting label you invent on the fly (`urgent`, `cardiff`, `professional`).

**The decision rule when something new shows up:**
- Is it a *subject* other things relate to? → **Entity** (person/place/org).
- Is it a *thing I track*? → **Entry** of some **type** (add the type to the registry; pick its room).
- Is it an *area I'd want a dedicated home for*? → **Room** (usually it already exists; if truly new, start it as a filter, not an app).
- Is it a *view across everything*? → **Lens**.
- Is it just a *slice I want to name*? → **Tag**.

Example — *"I need socks."* → an **entry** of type `shopping-item` (category clothing), in the **Home** room, maybe tagged `errand`. Not a new anything. That's the system working.

---

## 3. The house — rooms and what lives in them

Twelve rooms, grouped from everything you named (and a few you didn't). Each is a filter over the shared engine; `build` is intent, not a promise. Full type lists are in the Data Dictionary §7; here's the shape and the reasoning.

| Room | Holds | Why it's one room |
|---|---|---|
| **Study Hub** *(built)* | modules, study sessions, assignments | your exam engine; the reference every other room's shell is extracted from |
| **Academia & Research** | research projects, papers, PhD/scholarship applications | scholarly work outlives coursework and job-hunting; deserves its own home |
| **Career & Professional** | job applications, CV, professional skills | **job-hunt is a workstream that retires** — the room is "professional life", not "UK job hunt 2026" |
| **Growth & Learning** | skills, languages, British accent, courses, practice logs | self-directed learning ≠ academia ≠ career; it's *you improving you* |
| **Body & Health** | workouts, training plans, routines (skincare/supplements/sleep), meals, appointments, medical records, measurements | one room, many types; **skincare is a `routine`, not a room** — care/training/medical/nutrition are sub-areas that can split later |
| **Relationships** | people, catch-ups, gifts, important dates | a VIEW over the People entity + everything linked to a person (§4) |
| **Culture & Art** | books, films, series, theatre, concerts, exhibitions | art is *consumption + outings*, not just books/films — a wishlist and a diary in one |
| **Travel** | trips (planned & taken), a destination wishlist | ties calendar + places + memories together around a journey |
| **Memories** | photos, journal, voice notes | moments tied to time and place; the warm heart of the app |
| **Home & Living** | shopping/grocery, errands, house-hunting, furniture, home projects, documents | "running and building a home" — far more than a shopping list |
| **Mind & Making** | ideas, saved materials, writing, code snippets, documents | where you keep and make — the thinking/creative room |
| **Style / Closet** *(later)* | clothes, outfits | slots in for free as photo-bearing collection types |

**On growing past twelve.** New areas (Finance, Faith, Volunteering, Pets, a Side-project…) are welcome — each arrives as a filter first. The Vision says the domain list is open; this table is a snapshot, not a fence.

---

## 4. Entities: specific, yet tangled into everything *(your insight, made the backbone)*

You noticed the most important thing in the whole design: a **Person** can be defined once and then linked to events, relationships, friendships, the calendar — anything. You want that depth *everywhere*. It's now the backbone.

Life OS has three **anchor entities**, each defined once and threaded through the whole app:

- **People** — the richest. A person links to: events & interactions (`entry_people`), gifts and important dates, memories they're in, trips they came on — and crucially **to other people** (`person_links`: friend, family, partner, mentor) and **to organisations** (`person_organisations`: "Sara works at DeepMind", "my Cardiff supervisor"). Open a person and you see their whole thread through your life.
- **Places** — a location defined once (`places`), linked to any entry (`entry_places`): the beach in Barry, the clinic, the theatre. Powers the Map lens. Photos carry GPS that creates/links places automatically.
- **Organisations** — companies, universities, venues, clinics, publishers. Applications, performances, appointments, papers all point at an org reused across entries (`entry_organisations`).

And entries link to entries (`entry_links`, directional): a photo is `part-of` a trip; a task `prepares-for` an interview; a note is `about` a paper.

**Why this is the right kind of deep.** Nothing is duplicated — a person, a place, an org, a fact exists in exactly one spot and everything else *refers* to it. That's what makes the web feel alive instead of tangled-in-the-bad-way: change Sara's job once and it's right everywhere; delete a trip and its links fall away cleanly (cascade), but the photos and people survive. "Specific yet tangled" = **normalised entities + rich links**, which is exactly the schema in `data-model/schema.reference.sql`.

This is also *the* argument for one shared engine over separate apps: these cross-entity links are free when everything is one database, and nearly impossible when each domain is its own silo.

---

## 5. The magical links (a map of what connects to what)

You listed many of these; here they are as a reference. All are "free" because they're the same engine:

- **Anything dated → Calendar & Today.** Exams, deadlines, appointments, trips, performances, interactions.
- **Photos → Memories + Places + Calendar.** EXIF date and GPS auto-file a photo as a dated, located memory.
- **Shopping/errands/house-hunting → Home**, and dated ones → Today/Calendar; house-listings → Map.
- **Workouts/meals/supplements/appointments → Body & Health**, linked to each other; appointments → Calendar & Map.
- **Skills/languages/accent → Growth**, tagged `professional` also surface in Career.
- **People → everywhere.** Birthdays → Today/Calendar; a person → their interactions, gifts, memories, trips, and other people.
- **Job/PhD applications → their room's board**, with deadlines → Calendar/Today, linked to the Organisation.
- **Books/films/theatre/museums → Culture**, finished/attended dates → Calendar; venues → Places/Map.
- **Trips → the connective tissue of Travel**: gather events, places, people and photos under one `part-of` parent.

The rule that keeps this clean: **an entry is never owned by one room.** It can be in Study *and* on the Calendar *and* in a person's history at once. If you ever feel the urge to wall a domain off with its own private store, that's the silo trap — resist it.

---

## 6. Cross-cutting lenses (the spine)

These view *across* rooms, so they live in the top-level navigation, not inside a domain:

- **Capture** — one box; type or speak anything; it's routed to the right room. The heart of the Vision.
- **Today** — open commitments + today's moments, from every room.
- **Calendar** — everything dated, colour-layered by room.
- **Search / Ask** — one index over the whole life (English + Persian).
- **Favorites** — anything you star, from anywhere (a flag on entries).
- **Inbox** — captured-but-unfiled and things awaiting a decision (that email to answer).
- **Map** — entries with a place.
- **Gallery** — entries with photos.
- **People** — the entity directory; each person's whole history.

---

## 7. How a new part of the house gets added (the cheap path)

When life brings something new — say you take up pottery, or start therapy, or begin investing:
1. **Name the entities** it introduces, if any (a new Organisation? a Person?). Add to the entity tables — usually nothing new is needed.
2. **Add the type(s)** to the registry (`entryTypes.proposed.js` → merged into the live file): archetype + a few fields. One-line-ish.
3. **Point it at a room** (existing, almost always) via the type's `rooms` hint / the room's filter.
4. **Note the links** it wants (to people, places, calendar).
5. Only if it truly deserves a dedicated home *and* you'll open it often — **promote it to a bespoke room**, reusing the shared room-shell.

Steps 1–4 are minutes. Step 5 is the rare, deliberate investment. That asymmetry is the design.

---

## 8. Open questions for you
1. **Room count.** Twelve feels right to me for "complete but sane." Any that should merge (Academia into Career? Growth into Academia?) or split (Body ↔ Health)? Your call — the data doesn't care; it's only about where *you'd want to go*.
2. **Relationships as a full room** vs. just the People lens — I made it a room because you called it "a big thing." Agree?
3. **Person↔person links**: store one symmetric row per friendship, or two directional rows? (I lean symmetric.)
4. **Finance / money** — you didn't mention it (student budget), so I left it out. Add a room later, or keep money out of Life OS entirely?
5. **AI capture routing** — when you speak "book theatre tickets for Sara's birthday and add socks to the list", the AI must split that into a `performance` + an `important-date`/person link + a `shopping-item`, across three rooms. The registry + entities are what make that well-defined. Worth confirming this is the capture behaviour you picture.
