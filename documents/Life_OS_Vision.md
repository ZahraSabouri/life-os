# Life OS — The Vision
**A living document. Started 2 July 2026. Nothing in here is final — this project will be rethought, reshaped, and rewritten many times over the years it grows.**

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
- **Study** — the kind of planning my Summer Rescue tracker does now: structured study campaigns, progress, evidence, phases.
- **Memories & photos** — uploading pictures of my life: a beachside in Cardiff, a historical or nature site in Wales, a day in London, a workout — moments tied to places and times that I can revisit.
- **Everyday tasks** — to-do lists that actually get used.
- **Home & errands** — shopping lists, grocery lists.
- **Places** — locations I want to save.
- **Career** — job hunting (a real pipeline, not scattered tabs), PhD applications, research work, expanding my skills.
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

## 7. Current leanings (not decisions)

Everything in this section is a *lean* — the current best guess, held loosely, expected to be revisited:

- **Shape of the data:** one flexible core record ("entry") that every domain shares, with views/lenses over it (calendar, gallery, boards, shelves, map). Attractive because it makes new domains cheap. *But* whether the core is entries, or the calendar, or something else entirely — still an open conversation.
- **Stack:** React + Vite (+ probably TypeScript) frontend; PocketBase + SQLite as the leading backend candidate (single free binary, file storage, runs on my machine); alternatives like Supabase, Convex, local-first sync engines stay on the table. Old tools aren't excluded for being old (Oracle was my example — probably wrong for this, but the principle stands: fitness decides, not fashion).
- **Design direction:** journal-like calm, editorial typography, one accent color per life-area, meaningful motion, dark mode. To be developed properly in a design phase.
- **Process:** roughly — a period of design/thinking first, then build a small spine (capture + one or two views), then grow domain by domain. Exact phases flexible; my Cardiff exams (until late Aug 2026) take priority until they're done.

## 8. Open questions (the honest list)

- What is the true core: entries? calendar? capture? something not yet imagined?
- Which backend — and does the answer change when I eventually get a server?
- How exactly does the AI layer work at £0, and which fallback when free tiers shift?
- How much offline capability does the phone need when the laptop is the server?
- How do overlapping domains (travel ⇄ calendar ⇄ photos ⇄ places) connect without duplication?
- What's the app's name?
- How much design upfront vs designing while building?
- What does v1 actually contain — the smallest version I'd genuinely use daily?

## 9. How this document should be treated

This is a snapshot of my thinking, not a contract. Update it when the thinking changes. Keep old ideas in a graveyard section or git history rather than pretending they never existed — the point is to *grow* the idea, and growth means change.

**Related files:** `Life_OS_Blueprint.md` (research + one detailed proposal from Claude — useful reference, equally non-binding).
