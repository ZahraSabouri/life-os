# Life OS — Stack Decision Notes

**Updated 2026-07-05.** Supersedes the 2026-07-02 version below (kept as history, not deleted — see "Superseded thinking"). As always: this is current best thinking, not a contract. Revisit anytime a good argument shows up.

## Decided (2026-07-05 conversation)

**Frontend:** React 19 + Vite, plain JavaScript. TypeScript deliberately not adopted on day one — add it incrementally once the shape of the data model settles, rather than fighting TS syntax while everything is still moving.

**Backend:** Hand-rolled Node.js + Express, not a packaged backend-as-a-service (PocketBase, Supabase, etc.). Reasoning: this is single-user, so "auth" is a token check, not a real user system — the plumbing PocketBase mainly saves you from writing (auth, admin UI) isn't needed here. Hand-rolling the small amount that's left (routes, queries, file uploads) is genuinely learnable in a weekend, keeps everything in one language across front and back, and means you own every line instead of running a binary you didn't build.

**Database:** SQLite, accessed via Node's **built-in `node:sqlite` module** (stabilized in Node 26 — no native compilation, no Visual Studio Build Tools needed on Windows, a real win over the older `better-sqlite3` route). WAL mode on. Files and photos live on disk as plain files; the database only stores a path and metadata — this is standard practice regardless of database engine, and it's why "SQLite can't hold all my files" isn't actually a concern: file storage capacity is a disk question, not a database-engine question.

*Why SQLite over Postgres, for the record:* SQLite runs in production at hundreds of GB / millions of rows (every iPhone Photos library, every browser history, a large share of 2026 indie SaaS via the "one SQLite file per tenant" pattern). A single person's life-entries table, even after years, is realistically tens of thousands of rows — nowhere near SQLite's ceiling. It gets genuinely weaker than Postgres for two things, neither of which applies yet: many independent processes writing concurrently over a network, and heavy vector/semantic search at scale (pgvector is more mature than SQLite's vector extensions today) — worth revisiting only if "ask questions about my life" search becomes a real priority. The insurance policy against being wrong: the Express API sits between the frontend and the database, so swapping the database later is a backend-internal change, not a rewrite.

**Hosting / networking:** Own laptop, for roughly the next year, as before. **Tailscale** (free personal tier) added to the plan specifically to solve phone-away-from-home access without opening router ports — a real gap plain local-server hosting had.

**AI capture layer: PARKED.** Deliberately not being designed or built right now. Two candidate directions stay alive for later, and are no longer ranked primary/secondary the way the 2026-07-02 version had them:
- An MCP server over the database, so Claude (already-paid Pro plan) becomes a capture interface directly — zero marginal API cost.
- An in-app capture box calling Gemini's free tier (Flash-Lite specifically now — Google tightened the free tier in April 2026, removing Pro models from free access, but Flash-Lite still gives ~1,000 requests/day, plenty for personal use).

Revisit once the spine (entries, capture-to-plain-note, intro + main page) actually exists and is being used daily.

## Coding approach
User wants to **pair** on this — write some code themselves, not have it fully handed over, not build it all solo either. Affects tool/library choices: prefer things with lots of examples and shallow learning curves over anything exotic, since AI-assisted pairing works best where there's a deep well of precedent to draw from.

## Open / still genuinely undecided
- TypeScript adoption timing (see above — no fixed date, just "when it earns it")
- Long-term entry taxonomy — the design prototype already explores six archetypes (Moment, Commitment, Workstream, Collection, Practice, Anchor) sitting above domain-specific types; not locked in
- The app's real name (still "Life OS" as working title)
- Whether Postgres ever becomes worth it (see SQLite reasoning above — revisit only if triggered by a real need, not preemptively)

---

## Superseded thinking (2026-07-02 version, kept as history)

The original notes below reflected the Blueprint's initial proposal — PocketBase + SQLite as the leading backend, Gemini free tier as the primary (not just candidate) AI path, and treated "grow the current tracker app vs. fresh app" as still open. That "grow the current app" question is now resolved: **Life OS is a fresh app**; the React fork under `code/life-os-app/` was UI/design scratch work only and isn't being built on top of.

> Goal: grow `summer-rescue-plan-app` into a personal life-management app (PWA on
> iPhone + laptop, later self-hosted), with AI-powered natural-language input.
>
> ### Decisions already made (2026-07-02)
> - Frontend stays React + Vite (current app grows; no fresh repo). *(Superseded — fresh app, see above.)*
> - Phone access via PWA ("Add to Home Screen" on iOS — no App Store needed).
> - Database style: relational (SQLite or Postgres). Not MongoDB, not Oracle.
> - AI input: capture box → LLM → structured JSON → one-tap confirm. Start on Gemini free tier. *(Superseded — parked, see above.)*
> - Core data design: one generic `entries` table/collection (type, title, dates, tags, location, files, links, details-JSON). *(Still holds — carried forward.)*
>
> ### Backend: still to decide — research checklist (2026-07-02)
> PocketBase vs. Supabase vs. custom Node/Express, evaluated via a toy "trips" app. *(Resolved 2026-07-05 — hand-rolled Express + SQLite, see "Decided" above. The toy-app research approach wasn't actually run; the decision came from reasoning through the single-user-auth trade-off directly.)*
>
> ### Open questions (2026-07-02)
> - Server plan: VPS (~£4/mo, always on) vs old machine at home. *(Resolved-ish — own laptop + Tailscale, see above.)*
> - Photo storage size expectations (phone photos ~3–5 MB each; 1,000 photos ≈ 4 GB). *(Still relevant — disk space to watch, not a database concern.)*
