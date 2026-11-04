# Stage 6: The Desk, so mail becomes things in their places

**Status:** approved by Xar on 4 November 2026 (order Desk → Accounts → Network; all four new families "and any necessary thing you think can be added"; JobMap's CV helper kept until the app's own drafting; domain colours on every style). Building.
**Branch:** `stage/6-desk`, from `stage/5-harvest` (stage 5 is waiting for acceptance and builds the store this stage extends; merge 5 before 6).
**Prototype:** https://claude.ai/artifact/7RjsaJY8Trpf3GMeQj9tUy (example data).

## Goal
The Inbox stops looking like a mailbox. What arrives becomes **things** with a type and a domain (Work, Learning, Social, Money, Home, Health, Travel, Admin), each in its own colour, with the one date that matters, where it lives in the app and the next step. Things move through their own **lifecycle** (an order is placed, dispatched, delivered; an application is received, tested, unsuccessful), recorded as events. Messages become evidence and a quiet archive. Nothing names an AI service; every new table carries an owner so Accounts (stage 7) does not redo them.

## Why
Xar, 4 November (DECISIONS). Her stored mail: 1,171 messages, 74% noise and newsletters; about 360 about things the app had no place for.

## The shape
- **Domains** (shared/harvest.js): `work, learning, social, money, home, health, travel, admin`, derived from a thing's kind and area; she can move a thing to another domain, and teach a sender's domain.
- **Kinds**, existing: vacancy, opportunity (now with a `form`: hackathon, competition, research, scholarship, volunteering, course, programme), event, announcement, material, offer, info. **New:** application, order, bill, payment, subscription, tenancy, booking, appointment, official, document, account, person.
- **State and lifecycle**: a thing has a `state` from its kind's list (order: ordered, dispatched, out-for-delivery, delivered, return-started, returned, refunded; application: applied, received, test, interview, offer, unsuccessful, withdrawn; bill: due, paid, overdue; subscription: active, renewing, cancelled; booking: booked, changed, cancelled; tenancy: notice, due, done). Each change the harvest brings is appended to `mail.item_events`, so the thing shows what happened and when.
- **Signals she accepts**: an application that becomes unsuccessful, or reaches a test or interview, offers the matching JobMap change; she presses it, and JobMap's own server makes it.
- **Where things show** (placeOf, partOf): new kinds on the Calendar and Today by their dates (a delivery today, a return window closing, a bill due, a renewal, a booking, an appointment, an official deadline); applications on JobMap's strip; money kinds on Budget's; home kinds on Budget's (home part) until Home exists; health on Health; travel, admin and people on the Desk.
- **The Desk** is the Inbox's first page: Now (due or closing within two days, or today), the domains with counts, a board of cards with filters, a drawer (facts, what happened, the messages behind it, the next step), Triage (one at a time: Keep →, Dismiss ←, Later ↓) and what was kept quiet (folded and noise counts, sender rules). Tabs: Desk · To do · Harvest log · Messages.
- **Messages** show what each message is about: its filed things' domains, or a guessed domain (marked as a guess) from sender rules and words; a domain filter.

## Not in scope
Accounts and sign-in (stage 7), network (stage 8), the app's own drafting (replaces JobMap's helper later), moving the core out of SQLite (stage 7).

## Checkpoints

### CP1: kinds, domains, states and the rule (no database)
- [ ] `mail/mail-batch.schema.json` (version 2, additive): the new kinds, areas `travel` and `people`, item `state`, `form`, `ref` (an order or booking number), `amountPence`, `currency`.
- [ ] `mail/check-batch.mjs`: a state must belong to its kind; a form only on an opportunity; a new kind in a fitting area.
- [ ] `code/life-os/shared/harvest.js`: `DOMAINS`, `domainOf`, `STATES`, `guessDomain(message)`, placeOf and partOf for the new kinds; tests.
- [ ] `mail/example-batch-v2.json` gains an order with its lifecycle, an application, a bill, a subscription, a booking, an appointment, an official letter, a person; `mail/HARVEST.md` explains kinds, states and repeated sends.
- **Verify:** `node --test mail/check-batch.test.mjs code/life-os/shared/harvest.test.js`. **Commit:** `[6-cp1]`.

### CP2: storing states and what happened
- [ ] `migrations/mail/0003_things.sql` (dump first): items gain `state`, `form`, `external_ref`, `amount_pence`, `currency`, `owner_id` and her `her_domain`; kinds and areas widened; `mail.item_events` (owner, item, at, state, note, messages, batch); senders gain `domain`.
- [ ] Importer: a new thing, or a changed state, appends an event; undo removes a run's events first.
- **Verify:** mail suites on `lifeos_test`; migrate `lifeos`. **Commit:** `[6-cp2]`.

### CP3: the Desk's server
- [ ] `GET /api/mail/desk`: Now, domains with counts, open things with domain, place and latest event, and what was kept quiet this week.
- [ ] `GET /api/mail/items/:id` with its events and messages; `PATCH` takes `her_domain`; senders take a domain.
- [ ] Applications found in JobMap (by link, else by employer and role); `POST /api/mail/items/:id/jobmap` makes the JobMap change through JobMap's own server.
- **Verify:** route tests on `lifeos_test`, places tests. **Commit:** `[6-cp3]`.

### CP4: the Desk
- [ ] Domain colours in `styles/palettes.css` for every style (deep on light, bright on dark).
- [ ] `InboxDesk.jsx`: Now, rail, board and filters, cards, drawer, Triage with keys and the ring, kept quiet; Inbox tabs Desk · To do · Harvest log · Messages.
- **Verify:** render tests; headless Chrome with example data at 1360 and 400 pixels, light and dark. **Commit:** `[6-cp4]`.

### CP5: everywhere else
- [ ] Messages: what each is about (filed or guessed), a domain filter.
- [ ] Calendar, Today and the parts' strips take the new kinds; the Guide's Inbox chapter.
- **Verify:** suites, build, browser. **Commit:** `[6-cp5]`.

### CP6: handover
- [ ] `mail/HARVEST.md` for the harvest (kinds, states, signals, sender domains); STATUS, session note, plans inventory.
- **Commit:** `[6-cp6]`.

## Data safety
As stage 5: a dump before each migration, imports never write her fields, test data on `lifeos_test` only, JobMap changed only through its own server and only when she presses.
