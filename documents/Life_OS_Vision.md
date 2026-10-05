# Life OS — The Vision
**A living document. Started 2 July 2026, last updated 5 October 2026. Nothing in here is final — this project will be rethought, reshaped, and rewritten many times over the years it grows.**

---

## 1. Why this project exists

I (Xar) have spent years trying life-management tools — calendars, to-do apps, note apps, trackers — and every one of them failed me the same way: **inputting my life into them costs more than they give back.** Labels, forms, fields, categories… the maintenance becomes a job. So the tools go stale, and I stop opening them.

The conclusion: no off-the-shelf app will ever fit me, because they're built for millions of people. So I'm building one app, for one person, shaped exactly around my life — and I'll grow it for the next year, or years, into my ultimate tool.

## 2. The dream, in one paragraph

One private app I can open on my phone or my laptop, where I can *tell it things* — spoken or typed, naturally, the way I'd tell a friend — and it understands and files them: an event onto the calendar, a task onto a list, a book onto my shelf, a photo into my memories. Minimal manual data entry. And when I open it, it's beautiful — so beautiful and pleasant that I'm genuinely excited to use it every day.

## 3. The two qualities everything else serves

1. **Effortless input.** This is the heart of the whole project and the reason every previous tool failed. An AI layer should let me talk to the app and have it update itself — instead of me assigning labels and filling forms. Intelligence over administration.
2. **Design that thrills me.** Fonts, colors, animations — all of it matters. Fabulous, efficient, sophisticated. Not busy, not ugly, not too simple. Complicated and fascinating at the same time. If it doesn't excite me, it failed, no matter how functional it is.

## 4. The life it should hold — domains so far

**This list is open. It will grow, shrink, merge, and change many times. These are the areas I've thought of *so far*, not the boundaries of the app.**

- **Time & planning** — a giant calendar holding every kind of date: seminars I want to attend, trips, traveling back to Iran, birthdays of many people, deadlines, appointments, dates I simply must remember. Plus day planning: study days, free days, what a day is *for*.
- **Study** — the kind of planning my Summer Rescue tracker does now: structured study campaigns, progress, evidence, phases. Since October 2026 this is bigger: my whole degree, semester by semester, with the uni timetable, modules, assessments and exams, materials from Learning Central, and study cards. A rescue campaign becomes a mode I switch on near exams, not the whole thing.
- **Memories & photos** — uploading pictures of my life: a beachside in Cardiff, a historical or nature site in Wales, a day in London, a workout — moments tied to places and times that I can revisit.
- **Everyday tasks** — to-do lists that actually get used.
- **Home & errands** — shopping lists, grocery lists.
- **Money** (added October 2026): my monthly allowance, spending, saving goals and renewals. My Budget app ("Everyday") does this now, together with my kitchen: stock, usual buys, receipts, meals and recipes. Inside Life OS it splits into Money and Home, and recipes become their own collection.
- **Events and community** (added October 2026): finding events, groups and places to meet people and build a fuller life in Cardiff. My Cardiff Life app does this now, fed by scheduled searches.
- **Places** — locations I want to save.
- **Career** — job hunting (a real pipeline, not scattered tabs), PhD applications, research work, expanding my skills. My JobMap app is that pipeline now.
- **Body** — workout plans, workout tracking.
- **Mind & culture** — books I read, movies I watch, blogging and writing, art, interesting materials I find and want to keep, voice notes.
- **Code** — my snippets and code, maybe something like a little GitHub inside the app (or connected to it).
- **Style** — a closet: my clothes photographed, so I can pick outfits when going out.
- **Travel** — planning and remembering trips (overlaps with calendar, places, photos — how these connect is an open design question).
- **…and whatever comes next.** New domains will appear as my life changes. The app's architecture should make adding one cheap, not a project.

## 5. Where it runs

- **Phone + laptop, via the browser.** iPhone can't sideload apps like Android's .apk, so the likely path is a web app installed through Safari (PWA) — but if a better approach appears, we switch.
- **Hosting: on my own system for now.** I won't pay for a server for roughly the next six months — that's my current situation, not a law. It runs on my own machine; later maybe a home server or a cheap VPS, whenever it makes sense and I can afford it.
- **Cost: as close to £0 as possible.** I'm a student. AI usage, hosting, everything — free tiers and owned hardware first. This constraint will loosen when my situation changes.

## 6. The intelligence layer

The app should feel *a bit intelligent*. Current thinking (all revisable):

- A capture point where I speak or type naturally → an AI parses it into structured things → I confirm → the app updates. The confirm step matters: I want speed, not surprises.
- Budget reality: no paid subscriptions for tokens right now. Candidate paths — Gemini's free API tier, very cheap pay-per-use models, clipboard handoff to my existing Claude Pro / ChatGPT Plus plans, an MCP bridge so Claude itself can operate on my data, or local models someday. Selenium-driving a chat website is a last resort and probably a dead end — but nothing is banned from discussion.
- Later, more intelligence: asking the app questions about my own life, search that understands meaning, suggestions. Open territory.
- **October 2026:** the first step is the import door (section 9): ready instructions for the AI I already pay for, and the files I bring back. In-app AI comes after that and writes through the same door.

## 7. Current leanings (not decisions)

Everything in this section is a *lean* — the current best guess, held loosely, expected to be revisited:

- **Updated 5 October 2026, the stack:** React + Vite (plain JavaScript for now), a Node + Express server built as one program with a shared core and a module for each big area, and **PostgreSQL** as the database (my decision). No Redis, RabbitMQ or MongoDB unless a real need appears. The PocketBase and SQLite thinking below is history. Details in `Life_OS_Architecture.md`.
- **Updated 5 October 2026, the shape of the data:** entries stay for the lighter things (books, workouts, memories, ideas). The big areas (Study, Career, Money, Home, Events) get their own tables in the same database, all connected through the calendar, links and search.
- **Updated 5 October 2026, the process:** my summer exams are over. The order now is a foundation, the calendar across everything, then Study, Career, Money & Home and Cardiff Life rebuilt inside Life OS one by one, then everything else. See `ROADMAP.md`.
- **Shape of the data:** one flexible core record ("entry") that every domain shares, with views/lenses over it (calendar, gallery, boards, shelves, map). Attractive because it makes new domains cheap. *But* whether the core is entries, or the calendar, or something else entirely — still an open conversation.
- **Stack:** React + Vite (+ probably TypeScript) frontend; PocketBase + SQLite as the leading backend candidate (single free binary, file storage, runs on my machine); alternatives like Supabase, Convex, local-first sync engines stay on the table. Old tools aren't excluded for being old (Oracle was my example — probably wrong for this, but the principle stands: fitness decides, not fashion).
- **Design direction:** journal-like calm, editorial typography, one accent color per life-area, meaningful motion, dark mode. To be developed properly in a design phase.
- **Process:** roughly — a period of design/thinking first, then build a small spine (capture + one or two views), then grow domain by domain. Exact phases flexible; my Cardiff exams (until late Aug 2026) take priority until they're done.

## 8. One app, not a box of apps (October 2026)

Over the summer I built separate apps for the things I needed most: Summer Rescue for my exams, Budget ("Everyday") for money and my kitchen, JobMap for my job search, and Cardiff Life for events. On 1 October I attached all four to Life OS so I could open everything from one place. That was a first step, not the goal.

What I want is one unified app. Not a big app holding mini apps, but one app where everything belongs to the same life: the uni timetable, a study deadline, a job follow-up, a planned shop and an event I want to go to all sit on the same calendar and in the same Today. Each part can still feel rich and complete, the way Study Hub did, but they share one calendar, one way of adding things, one search and one place where my data lives. Each attached app keeps working until its new version inside Life OS does everything it did, and only then does the old one retire.

Home should show my day first, strongly, and still keep the doors to the rooms below it, with clearer wording. The poetry belongs in the look and feel; buttons and labels should say plainly what they do.

## 9. Getting my life in: three doors (October 2026)

Effortless input is still the point. Every part of the app should have the same three ways in:

1. **By hand.** Adding or editing anything myself is always possible and never a dead end.
2. **By import.** The app gives me ready instructions to hand to my own AI or agent ("collect my new modules and exams", "find this week's events", "turn this receipt into rows"), and I bring back a CSV, Excel or JSON file, for example every week. Scheduled agents and connectors (job searches, Cardiff SU, Eventbrite, web pages, a timetable calendar link) can drop files in by themselves. The app shows me what will change before anything is saved, never overwrites what I edited myself, and lets me undo an import.
3. **By built-in AI, later.** When it makes sense to pay for tokens, the app itself turns what I say or photograph into the same kind of import, with a confirm step. Until then, the AI I already pay for does the thinking.

## 10. Beyond me, someday (October 2026)

Right now Life OS is highly personal, and it's only for me. One day I'd like other students to be able to make it their own: each with their own private copy, starting empty and filling it through the same imports, with the modules and exams from their own uni, their own shops and budget, their own job search. A bigger idea for that future is a browser inside the app where a student logs into Learning Central, checks their email and courses, and saves material straight into Study. Presenting Life OS at Cardiff University is an idea for the end of my degree, parked for now.

None of this is for now. Other users, accounts and user tests come in the last stages. The one thing I do now is keep my personal details out of the code, which I need anyway: next semester's modules or next year's budget shouldn't need a code change.

## 11. Open questions (the honest list)

- What is the true core: entries? calendar? capture? something not yet imagined? *(October 2026: one app, with Today and the calendar tying every area together; entries plus a module for each big area underneath.)*
- Which backend — and does the answer change when I eventually get a server? *(October 2026: PostgreSQL.)*
- How exactly does the AI layer work at £0, and which fallback when free tiers shift? *(October 2026: first through imports, using instructions for the AI I already pay for.)*
- How much offline capability does the phone need when the laptop is the server?
- How do overlapping domains (travel ⇄ calendar ⇄ photos ⇄ places) connect without duplication?
- What's the app's name?
- How much design upfront vs designing while building?
- What does v1 actually contain — the smallest version I'd genuinely use daily? *(October 2026: see `ROADMAP.md`.)*
- What should the home screen say, and which poetic names stay?
- Where do Money and Events sit among the rooms?
- One day, should other students run their own copies, or use a hosted version?

## 12. How this document should be treated

This is a snapshot of my thinking, not a contract. Update it when the thinking changes. Keep old ideas in a graveyard section or git history rather than pretending they never existed — the point is to *grow* the idea, and growth means change.

**Related files:** `Life_OS_Blueprint.md` (research + one detailed proposal from Claude — useful reference, equally non-binding). Since October 2026: `ROADMAP.md` (where we are and the current order), `Life_OS_Architecture.md` (how it's built), `DECISIONS.md` (what we chose and why), `Life_OS_Plans_Inventory.md` (everything planned so far, with its status).
