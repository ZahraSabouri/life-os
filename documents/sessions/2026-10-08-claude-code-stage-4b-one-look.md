# 2026-10-08 · Claude Code · Stage 4b · CP1 (one look: frame, shared skins, design per style)

## Goal
Xar: the sub-apps still look like separate apps; fix the skins and designs, carefully, looking at the result myself each time. During the work she added: a style must change the design, not only the colours; and the ancient Court pages are fixed boxes with small text while other pages do not follow their design.

## What I did
- Looked first: pictures of the main pages and of every sub-app as they were. Entering a sub-app replaced the Life OS top bar with a full-screen separate page; Budget and Cardiff Life had their own colours and fonts.
- Asked her three questions (frame, Court page, logos); her answers are in the brief.
- Built one skin system (see `briefs/stage-4b-one-look.md`, "How it works"): `palettes.css` holds colours and design per style; `hosting/skins/` adds the shared files to each sub-app's page as it is served and rewrites written-in colours.
- Read the three ancient Court pages and wrote each style's design from them: Madder draws soft translucent tiles with serif text and small sans capitals; Indigo is a desk of outlined boxes in a sans with serif headings and mono figures; Paper is a page of ruled lines with no boxes, all in the serif; Modern has rounded cards with soft shadows.
- Sub-apps now sit under the Life OS top bar. In the ancient styles the top bar carries the Court's header.
- The ancient Court fills the window's width.

## Files and commits
- [4b-cp1] One look: the sub-apps under the Life OS top bar, one skin system, a design per style
- New: `hosting/skins/` (`index.mjs`, `recolor.mjs`, `recolor.test.mjs`, `public/boot.js`, `shared.css`, `fonts.css`, `fonts/`, `apps/*.css`), `frontend/src/styles/palettes.css`, `summer-rescue/src/utils/lifeOsStyle.js`.
- Changed: `hosting/app.mjs`, `proxy.mjs`, `budget.mjs`, `jobmap.mjs`; frontend `App.jsx`, `CourtLayout.jsx`, `TheCourt.jsx`, `styles/skins.css`; Study hub `App.jsx`, `FocusRoomTab.jsx`; JobMap `index.html`, `local/main.tsx` (back to the standalone's), its build.
- Removed: `frontend/src/lib/frameSkins.js`, `jobmap/app/skin*.css`, `jobmap/public/fonts`, `jobmap/public/skin-boot.js` (their job moved to `hosting/skins/`).

## How I checked it
- `node --test`: 102 pass (9 new for the colour rewriter, plus the Study and calendar tests). JobMap's four suites pass.
- A private try-out of the whole app (port 47860; test database; copies of JobMap's and Budget's data, deleted afterwards), driven in headless Chrome:
  - Top bar from part to part: the right item is marked each time; inside each part the chosen style, its typeface and its background are the expected ones.
  - Budget: side menu to Shopping, the Add payment dialog. JobMap: opened a job and starred it (saved into the copy). Study hub: the Add card dialog, the board.
  - Changing the style from the top bar while inside Budget: the part followed at once (Paper, then Indigo).
  - Phone width: Cardiff Life in Madder.
  - No page errors.
- Pictures looked at: Budget in Modern, Madder and Paper; Study hub in Indigo and Madder; Cardiff Life in Indigo, Modern and (phone) Madder; Today in Indigo; Court in Madder at 1920 wide. After the switch, the live app: JobMap in Modern, Cardiff Life in Paper.
- **Not looked at:** most inner pages of each part in each style; Calendar and Ledger in the ancient styles; the Study hub's Focus Room tab; Budget in Indigo and JobMap in Paper beyond their first screen.

## Data touched
None. Life OS was restarted once for the switch.

## Problems and surprises
- The shared palette file first also matched the Study hub's own `.app-shell` element inside its frame and gave its menu the Madder colours in every style. The Life OS pages are now addressed as `.app-shell[data-ground]`.
- The Study hub turns off drawn small capitals (`font-synthesis: none`); the shared file turns that one back on.
- Git Bash rewrites paths that start with a slash in command arguments; `MSYS_NO_PATHCONV=1` is needed for those.
- My first design for the ancient styles was wrong (square boxes and capitals for all three). Looking at each Court page corrected it.

## Small decisions I made, and questions for Xar
- Modern uses the main app's colours everywhere, so the Study hub and JobMap changed very slightly in Modern (a touch lighter, flat buttons instead of the gradient).
- Buttons in the ancient styles are small capitals in the label face; in Paper the main button is outlined in ink, not filled.
- Which pages look wrong to her (CP2), and whether the phone top bar should become a compact menu.

## Next step
CP2 from the brief: go page by page through each part in each style, starting with whatever she reports. Then CP3, the flowing Court.
