# Life OS: status

**Updated 6 October 2026 (late) by Claude Code.** Branch: `stage/3-study-hub`; main untouched. Calendar is complete. Study: CP4 done; CP5 is next.

## Now
Active brief: `briefs/stage-3-study-hub.md` (CP4 to CP8). Latest note: `sessions/2026-10-06-claude-code-stage-3-real-summer-rescue.md`.

**Xar's direction (in `DECISIONS.md`):** the Study hub's structure is the Summer Rescue app's structure. The one difference: new modules have no premade cards. The summer cards, plans and evidence are her past entries, kept as editable data. Nothing is removed except the areas that are not study (Health, Admin, Job Hunt, interview, shopping). No work on the Life OS frame now; the calendar connection must be correct, with nothing doubled.

**What changed today**
- The real Summer Rescue (her university folder, 23 August) now runs inside Life OS as the Study hub, with its real data. Everything before was built from a copy frozen on 6 July.
- The database-backed page moved to `/study-native`. It holds this semester's timetable, assessments and materials.
- Today's "Needs attention" no longer lists the stale summer items.

## Exact next step
CP5: make the real app save into the Study database.
1. Read `summer-rescue/src/utils/localStateFile.js`, `src/state/useTrackerState.js` and `hosting/study/legacy.mjs`.
2. Write the adapter between the app's saved state and Study records, both directions, with a test that the real state survives the round trip unchanged.
3. Only then switch `/api/state`, import the real data once (updating the stale records in place), and retire `/study-native`.

**Next prompt:** Continue Life OS: do CP5 from the brief.

## How to see it
`Start Life OS.cmd`, then http://127.0.0.1:47850. **Study hub** opens the real Summer Rescue. This semester's database records: http://127.0.0.1:47850/study-native. After changing `summer-rescue/` or the frontend: `Build Life OS.cmd`. After changing `hosting/`: stop and start.

## Waiting on Xar
- Say when `summer-rescue-plan-app/` (the stale July copy, no longer served) can be deleted. Deleting is her step.
- Module folders: none is connected; say which to connect.
- Acceptance of Calendar's look.

## Known problems and limits
- **Two stores until CP5.** Summer Rescue data is in `summer-rescue/local-data`; this semester's records are in PostgreSQL. The database also still holds the stale July summer records, marked completed and hidden from the calendar.
- Cards added in the Study hub do not reach the Life OS calendar until CP5.
- The Study hub still has its built-in summer plan and menus for Life & Admin, Job Hunt and the interview. CP6 moves the plan into data and removes those menus.
- The Study hub saves when opened. It writes to the Life OS copy, never to the original in the university folder.
- Do not run `hosting/app.test.mjs` or the old query tests: they reseed the core database.
- Run git from the project root. `code/life-os/` and `summer-rescue-plan-app/` have nested `.git` folders.
- Separate, later work: sign-in, a backup copy off this laptop, the core's move to PostgreSQL, the import worker, PWA.

## Data
- Study hub: `summer-rescue/local-data` (state version 9, 144 card records, 141 done, 131 hand-added cards, 422 events) and `summer-rescue/public/study-assets` (394 files). Original, untouched: `Documents\Apply\…\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`.
- PostgreSQL (`lifeos`, schema `study`): 2 semesters, 8 modules, 123 cards, 3 assessments, 81 sessions, 287 materials. Removed and restorable: 14 cards, 2 modules, 8 materials. Backups: `../Life_OS_backups/study-<date>/`, with a daily dump.

## Last five sessions
- 2026-10-06 CP4, the real Summer Rescue: `sessions/2026-10-06-claude-code-stage-3-real-summer-rescue.md`
- 2026-10-06 Study feedback and a rejected proposal: `sessions/2026-10-06-claude-code-stage-3-study-feedback.md`
- 2026-10-06 CP3 styles and backend: `sessions/2026-10-06-claude-code-stage-3-skins-backend.md`
- 2026-10-06 CP2: `sessions/2026-10-06-codex-stage-3-import-recovery.md`
- 2026-10-06 CP1: `sessions/2026-10-06-codex-stage-3-workspace.md`
