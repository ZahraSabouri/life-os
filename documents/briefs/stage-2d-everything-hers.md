# Stage 2d · Everything hers: add anything by hand, analyse it, and a guide

**Written 13 October 2026 by Claude Code, after the work, from Xar's messages of 12 October night and 13 October.** Her words are in `TODO.md` section N; this brief says what each of them became and what is left.

## What she asked
1. The Court and Today must be genuinely different pages.
2. Review "can get even more analytical"; she is a data science student and wants "to use the data in all sorts of ways".
3. The Study hub opens the current semester by default, with a way back to choosing one.
4. A guide that explains every part with pictures of the app, built step by step.
5. To add by hand anything her agents or files add: in the Study hub, in Cardiff Life, everywhere.
6. JobMap: notes, categories, attachments or a folder address, applied or rejected, on any job; and the same freedom on "any entity I have on this app".
7. To work as a user would, including what she does not spell out; and to assess and use all four apps inside, not one.
8. What was left on the earlier list: mark a job applied from the day, change a repeating plan in place, the Study hub's reminders in the bell, notices with the browser closed.

## What was built
| Checkpoint | What | Where |
|---|---|---|
| `[2d-cp1]` | The Court looks ahead ("Ahead"); Today is the day | `components/TheCourt.jsx`, `lib/day.js` |
| `[2d-cp2]` | The hub opens the running semester; "Change semester" | `summer-rescue/src/hub/` |
| `[2d-cp3]` | Study hub: classes, tests, materials by hand | `summer-rescue/src/hub/SemesterRecords.jsx` |
| `[2d-cp4]` | Cardiff Life: an event of her own | `hosting/cardiff/own-events.mjs`, `cardiff-life/planner.js` |
| `[jobmap-cp6]` | JobMap: categories, folder, own links (both copies) | `jobmap/lib/store.mjs`, `matching.mjs`, `folders.mjs`, `app/page.tsx` |
| `[2d-cp5]` | Today: "I applied" / "Rejected" with Undo | `hosting/career/mark.mjs`, `components/DayParts.jsx` |
| `[2d-cp6]` | Ledger: find, change, remove; repeating plans changed in place | `components/EntryEditor.jsx`, `lib/entryPatch.js` |
| `[2d-cp7]` | Budget and JobMap kept up; restart race fixed | `hosting/keep-up.mjs`, `launch.mjs` |
| `[2d-cp8]` | Review → Analysis, and the data as files | `hosting/review/analysis.mjs`, `components/AnalysisView.jsx` |
| `[2d-cp9]` | The Guide and its pictures | `src/guide/chapters.js`, `components/GuideView.jsx`, `scripts/guide-shots.mjs` |
| `[2d-cp10]` | The hub's reminders in the bell; notices through Windows | `hosting/notices/desktop.mjs`, `hosting/day/service.mjs` |

## Rules kept
- One part owns each answer: JobMap saves its own jobs (the day only carries her click), Budget was read and not changed, the analysis uses the review's loaders.
- Nothing of hers was changed while trying things: try-outs ran on copies or with every write caught in the browser; the core database was backed up before the one new setting.
- Every change was read with her real records, in more than one style, before it went live.

## What is left
- The Guide's remaining pages: the Study hub's review, analytics, focus room, notes and a module's page; Budget's catalogue, shops and weekly history; JobMap's archive and follow-ups.
- People (add, change) from the main app.
- Notices when Life OS itself is not running (it would have to start with Windows).
- A job's files inside JobMap's own backup file.

## Added the same afternoon, from her next message
| Checkpoint | What | Where |
|---|---|---|
| `[jobmap-cp7]` | Real files kept with a job | `jobmap/lib/files.mjs`, `store.mjs`, `server.mjs`, `app/page.tsx` |
| `[2d-cp11]` | "Change" on a plan where it is shown; top bar on one line; notices named Life OS | `components/ChangePlan.jsx`, `styles/skins.css`, `hosting/notices/desktop.mjs` |
| `[2d-cp12]` | The Guide: 59 pictures, numbered circles, 6 diagrams, "Retake the pictures" | `src/guide/chapters.js`, `components/GuideFigures.jsx`, `scripts/guide-shots.mjs`, `hosting/guide.mjs` |
