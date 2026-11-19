# Life OS: the work plan (from 19 November 2026)

**What this is:** one place for everything Xar asked for on 16–19 November, where each piece stands, and the order to do the rest in. Her words are quoted in [TODO.md](TODO.md) sections AB (Life OS) and AC (JobMap); this file is the plan. Read with [STATUS.md](STATUS.md) (today's state) and the briefs it names. Update the "Where it stands" column and tick the plan as work is done.

## Where each point stands

| Her point (TODO) | Where it stands |
|---|---|
| Task management: postpone, highlight, notes (AB1) | **Done**, 17 November, stage 8 CP1. Move menu, star, dated notes, "how did it go", "moved 3×". Dismiss on things waiting on you, 19 November. |
| Replanning a day without AI (AB2) | **In progress.** Stage 8 CP1 done. CP2 half built (see below). CP3–CP6 not started. Brief: [stage-8-task-loop.md](briefs/stage-8-task-loop.md). |
| Deep analysis: integrity, connections, production readiness (AB3) | Not started. It is the audit map (plan step 4). |
| Semesters in the Study hub (AB4) | **Answered.** One Study hub; it already switches semesters ("Change semester"). `/study-native` is the stage 3 rebuild nothing links to. Left: check in the audit that Today and Tasks follow the chosen semester. |
| Autumn study apps (HTML files) (AB5) | Written down, not started (plan step 12). |
| Two focus systems kept separate, one reward count in Review (AB6) | Her decision recorded (DECISIONS, 17 November). Not built (plan step 9). |
| Eight views of one day (AB7) | Recorded. Today stays visible in the calendar; each view gets its own job (plan steps 4 and 11). |
| `dist-next` and the 42 Budget test folders (AB8) | **Done**, 17 November; the test now cleans up after itself. |
| A plan for cleaning the whole app (AB9) | Not started (plan steps 4, 5, 7). Found so far: `/study-native`, the unused `TodayTasks` component, the old SQLite file, 76 `.runtime` folders. |
| Loading speed (AB10) | Measured 17 November, causes known (STATUS), not started (plan step 6). |
| Focus room: more features, more beautiful, not tied to a task (AB11) | Not started (plan step 9). |
| Map, data, decisions, foundations; research on GitHub and frameworks (AB12) | Not started (plan steps 4, 5, 8). |
| Documents tidy (AB13) | Not started (plan step 3). |
| JobMap fixes (AC1–AC6) | **Done**, 19 November: Expired status, many jobs at once, closing/added/status filters, when a job starts and ends, Dismiss. Brief: [jobmap-part-1.md](briefs/jobmap-part-1.md). |

Also done in these days (data, at her request): the 18 November work-week replan, the 19 November weekend push to Monday, the dissertation-progression record (a Waiting task with its next actions and the full note), 604 archived adverts set to Expired, the scheduled search able to save a job's start and end.

### Stage 8 CP2: what is built and what is left
- **Built, tested, committed as work in progress (not live):** `code/life-os/shared/dayplan.js` (a day's things as one model; `planLate` for Running late; 4 tests in `backend/test/dayplan.test.js`); `createStudyMove` in `hosting/study/hub/tick.mjs` with the route `POST /api/day/study/move` in `hosting/app.mjs` (a one-day Study block's rule moves with the plan-hash check; card dates on the old day follow; answers what puts it back).
- **Left:** `shiftPlan` in `frontend/src/lib/plans.js` (a plan moved by minutes, repeat days included); on the day checklist the "Running late +15 / +30 / +60" buttons with one Undo, "Choose several" with a bar (Tomorrow, Next week, a day), and a Move menu on Study blocks and cards; render tests; restart, build, a headless walk with saves blocked; tick CP2 in the brief.

## The plan, in order

One session = one checkpoint, ending with something to see or read. Research is a few direct searches in the session, not the multi-agent research workflow (it used up her limit on 17 November).

### A. Finish replanning (her priority)
1. **Stage 8 CP2, finish** — Running late, choose several and move, Study block move. *1 session.* Prompt: "Finish CP2".
2. **Stage 8 CP3** — "Replan the rest of today": a restart and finish time, a preview (stays, moves, split, tomorrow), apply with one Undo, a "minimum day". Tested against the real replans of 16–19 November in `.runtime/` (before and after). *1–2 sessions.* Prompt: "Continue stage 8: CP3".

### B. Bearings
3. **Documents tidy (AB13)** — a short guide to which file says what; the overlapping architecture documents merged into one current one, the rest marked history; ROADMAP matching reality; future plans kept, nothing deleted. *1 session.* Prompt: "Tidy the documents".

### C. Foundations
4. **Audit map (AB3, AB4, AB7, AB9, AB12)** — one document: every page, data store, request and background job; what it is for, what links to it, its tests; a proposed keep / merge / retire / fix; the production-readiness verdict; whether Today and Tasks follow the chosen semester; what each view of a day is for. Read-only. *1–2 sessions.* Prompt: "Start the audit map".
5. **Her decisions** — she marks each audit row. Deleting stays hers. *About 30 minutes of hers.*
6. **Loading speed (AB10)** — a short research note (caching, Next.js, a separate server: what would really help), then the fixes in order of effect: the Study summary prepared once per save; the Court asks only for today; JobMap sends open jobs; the page code split per page; compressed fonts; long caching for files that never change. Timings before and after. *1–2 sessions.* Prompt: "Make Life OS fast".
7. **Cleaning (AB9)** — carry out her decisions from step 5. *1 session.*
8. **Consistent infrastructure (AB12)** — a research note on how well-built apps of this kind are organised (one database with a part per module, shared rules for saving, tests on a test database, login), then a staged plan: Budget and JobMap data into PostgreSQL, the framed apps brought into the main app one at a time, tests that never touch live data, real login. Each move is its own stage. *1 session to plan, then a stage each.*

### D. Features on the cleaner base
9. **Focus room (AB11, AB6)** — research on good focus apps (focus for anything, not a task), a design for her approval, then the build; one reward count across Life OS Focus and the Study hub's focus, shown in Review; the two stay separate. *1 session to design, 1–2 to build.*
10. **Stage 8 CP4–CP6** — close the day at night and a morning check; planned against actual time; notifications with buttons, then a Windows widget. *3 sessions.*
11. **Views of a day (AB7)** — each view given its own job from the audit; today visible in the calendar. *1 session.*
12. **Autumn study apps (AB5)** — find the HTML files, list what each does, choose per app: open inside the Study hub or rebuild its parts as cards. *1 session to plan; building later.*
13. **Stage 7 CP5–CP6** — the clean public version after the cleaning; she names the new GitHub repository. *1–2 sessions.*

## Decisions only Xar can make
- Keep / merge / retire for each audit row (step 5).
- Whether Budget and JobMap move into PostgreSQL (step 8).
- The focus room design (step 9).
- The public repository's name, and whether stage 7 CP5 waits for the cleaning (step 13).
