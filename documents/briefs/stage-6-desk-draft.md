# Stage 6 (draft): The Desk, so mail becomes things in their places

**Status: DRAFT, written 4 November 2026 by Claude Code. Not approved.** Clickable prototype and the full plan: https://claude.ai/artifact/7RjsaJY8Trpf3GMeQj9tUy (example data). Xar approves, changes or rejects it before any app code.

## Why
Xar, 4 November: the Inbox still reads like a loaded mailbox; every email should be connected to what it is about; nothing useful should be missed; the app must be a product for many people, not one person's handcraft. Her stored mail (1,171 messages, Sep to Nov) is 74% noise and newsletters; about 360 messages are about things the app has no place for (keyword estimates: orders and deliveries ≈150, bills and banking ≈65, tenancy ≈50, people ≈40, competitions ≈28, travel ≈24, application progress ≈22, official ≈12, account notices ≈18).

## The shape
1. **Things and signals.** Every message becomes zero or more typed things and signals (a change to a thing already known: application unsuccessful, parcel delivered, event cancelled). The stage 5 item becomes the general thing: owner, type, facts, dates, a lifecycle (new, kept, done, over), evidence messages, visibility. Signals are suggestions she accepts; they never overwrite her choices.
2. **New types**, each with a domain and a home: order/delivery/return (Home), bill/payment/subscription (Money, matched to Budget), tenancy (Home), person (Social, suggested for People), opportunity beyond jobs: hackathon, competition, research post, scholarship, volunteering, online course (Work, Learning), booking/trip (Travel), application progress (Work, moving the JobMap stage on her yes), official letter and document (Admin), account notice (Admin, quiet). The core already has trip, appointment, document, errand and house-listing entry types; reuse them.
3. **Rules it learns.** Her corrections become rules (this sender is Work; fold; hide; always accept deliveries). Stage 5's sender rules grow into these.
4. **The Desk** replaces the message list as the Inbox's first page: Now (due or closing within two days, or today), domains in their own colours with counts, cards with the one date that matters, where the thing lives and the next step, a drawer with what happened and the evidence messages, Triage (one at a time, Keep, Dismiss, Later, with keys). Messages become a quiet archive tab; noise is a number, not a list.
5. **Owner-ready from the start.** Every new table has an owner column; nothing new is written for one person or names an AI service.

## After this stage (proposed order)
- **Stage 7, Accounts:** sign-in and sessions; owners on every record with database-enforced separation; the core moved from its single-user SQLite file into PostgreSQL; sources, schedules and settings per account; course content out of the code (`rooms/study-hub/data`); "Cardiff Life" becomes Events with a city setting.
- **Stage 8, Network:** follow and connect; share a thing (an event, an opportunity, a list); who among connections is going; privacy settings first.

## Questions for Xar
1. Approve the Desk as the next stage, with owner-ready tables, and accounts after it?
2. Which new types first?
3. JobMap's CV and cover-letter helper (copies a prompt for an AI chat): remove now, or keep until the app has its own drafting?
4. The prototype's look (domain colours on a cool neutral ground): right direction, or keep closer to the burgundy and gold grounds?

## Checkpoints
Written once approved.
