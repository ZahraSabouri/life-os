# 2026-10-09 · Claude Code · Stage 4b · CP2 and CP3 (page by page; the flowing Court)

## Goal
Xar: "go ahead and do what's not done yet". That was the four open items of the 8 October note: the inner pages of each part, Today/Calendar/Ledger in the ancient styles, the ancient Court as a flowing page, and the phone top bar.

## What I did
- **The ancient Court flows.** The three Court pages had been written as flowing, responsive pages; a later layer pinned them onto a fixed 1512 by 982 sheet. I took the pinning away (`CourtStage` is now a plain wrapper) and removed its 28 rules from `tokens.css`. On a wide window the pages were also pinned to the window's height, so the frame stopped short of long content; they now grow with what they hold. On a window larger than a laptop's the whole page is enlarged to match (up to 1.6 times), so the text grows with the screen.
- **Phone:** the top bar's menu folds behind one "Menu" button; choosing a page closes it.
- **Today, Calendar and Ledger in the ancient styles:** tags and buttons take the style's corners and faces. Madder turns each item into a soft tile, Indigo outlines its panels, Paper keeps ruled lines.
- **Page by page:** a check walked 152 pages (every view of the four parts, in the four styles) on the try-out and measured two things a look would catch: text hard to read against what is behind it, and bright boxes left in a dark style. Five real findings, all fixed in the layers: a faint label in Budget's meal planner; Cardiff Life's notice unreadable in Madder and Indigo; a white marker, a faint line and faint bar labels in the Study hub.

## Files and commits
- [4b-cp2] The Court flows, the phone menu folds, boards and inner pages follow each style
- `frontend/src/components/TheCourt.jsx`, `CourtLayout.jsx`, `styles/skins.css`, `styles/tokens.css`; `hosting/skins/public/apps/budget.css`, `cardiff-life.css`, `study-hub.css`; the brief, STATUS, DECISIONS, this note.

## How I checked it
- Court: pictures on the try-out of Paper at 1440 by 900, Madder at 1920 by 1080, Indigo at 1366 by 768, and Madder, Paper and Indigo at phone width. Indigo fits a 1366 by 768 window without scrolling; Paper at 1440 by 900 scrolls a little for its poem.
- The 152-page check: no page errors; findings listed above. The check counts gold buttons on the red ground as "bright boxes"; those are meant.
- By eye: Today in Madder, Today in Indigo at phone width, the Study hub's board in Paper, Budget's stock page in Indigo.
- Live, after building the main app: Cardiff Life in Indigo (the notice is readable), Budget at phone width in Modern (folded menu).
- Tests: 39 run and pass (colour rewriter, calendar, Study router). No hosting code changed, so the app was not restarted.
- **Not checked:** shapes on every inner page by eye (the check measures legibility, not whether a box has the right corners); Calendar and Ledger by eye in each ancient style; JobMap's Preferences dialog picture was taken but not looked at; the Study hub's Focus Room tab.

## Data touched
None. The try-out used the test database and fresh copies of JobMap's and Budget's data, deleted afterwards.

## Problems and surprises
- The Court "rebuild" turned out to be an un-pinning: the responsive pages were already there underneath.
- CSS `zoom` enlarges the page but `100vh` inside it stays the real window height, so heights are divided by the zoom (`--court-zoom`).

## Small decisions I made, and questions for Xar
- On a laptop the Court is at its designed text size and may scroll a little; on larger screens it is enlarged until it fills the window. Tell me if you want it larger on a laptop too (it would scroll more).
- The ancient Court's own header has Today, Calendar, Search and Style only; the parts are reached through the room tiles. Should it carry the same full menu as the other pages?

## Next step
Her detailed pass, as she announced; then whatever it lists. The open items of the Study hub and JobMap briefs are unchanged.
