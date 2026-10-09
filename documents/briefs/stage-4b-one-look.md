# Stage 4b: One look (the sub-apps as parts of Life OS; every style a whole design)

**Status:** asked for by Xar on 8 October 2026; CP1 live that day, CP2 and CP3 live on 9 October · waiting for her detailed check
**Branch:** `stage/4b-one-look` (cut from `stage/4a-jobmap-refresh`)

## Goal
Study hub, JobMap, Budget and Cardiff Life look like big parts of one app, not like separate apps. And a style (Madder, Indigo, Paper, Modern) is a whole design, not a colour change: each ancient style follows its own Court page.

## What Xar said (8 October)
- The sub-apps "should all look like different big components of the main app".
- "In different skins only colours change, while a skin like Indigo had a different style and design."
- The ancient Court pages are "fixed squares" with small text; their design is good, but the other pages in those styles do not follow it.
- Her choices: the Life OS top bar on every page, each part keeps its own side menu drawn the same way; logos inside the parts removed, names kept as headings ("we can roll back"); the Court made responsive and beautiful, scrolling allowed.

## How it works
- **One file holds the styles:** `code/life-os/frontend/src/styles/palettes.css`. First each style's colours, then each style's design: typefaces, corners, how a box, a button, a label and the chosen menu item are drawn, and whether there are soft shadows. The Life OS pages read it; the framed apps are served the same file.
- **The framed apps keep their own files.** As a page is served, Life OS adds the shared skin files to it (`hosting/skins/`): `boot.js` (which style is chosen, and when it changes), `palettes.css`, `fonts.css`, `shared.css` (what every app takes whatever its own CSS says) and `apps/<id>.css` (that app's named parts tied to the shared design).
- **Budget and Cardiff Life write colours straight into their CSS** (Budget: about 600). Those are rewritten, as the page is served, into blends of the shared palette (`hosting/skins/recolor.mjs`, with tests), so they follow every style, dark ones included.
- **The frame:** a sub-app page is the Life OS top bar with the app filling the rest (`SubAppFrame` inside `CourtLayout`). The two floating buttons are gone.

## Checkpoints

### CP1: The shared skin system and the frame
- [x] `palettes.css` with colours and design per style; `hosting/skins/` (files, page rewriting for static and forwarded apps, colour rewriter with 9 tests).
- [x] Layers for the four apps; JobMap's folder is back to the standalone app's files plus relative addresses.
- [x] Sub-app pages under the Life OS top bar; in the ancient styles the top bar carries the Court's header (small spaced capitals, chosen page underlined).
- [x] The Study hub's light or dark follows the style; its own switch is hidden inside Life OS.
- [x] The ancient Court fills the window's width and scrolls if needed, instead of a fixed box.
- **Verify:** done on a private try-out of the whole app (test database, copies of JobMap and Budget data): moving between parts from the top bar, a dialog in each part, a save in JobMap, changing style while inside a part, phone width; then pictures of the live app.

### CP2: Page by page (done 9 October)
- [x] Every view of every part in each style (152 pages) checked on the try-out for text that is hard to read and for bright boxes left in a dark style; five findings fixed in the layers. *Shapes are not measured by that check: an inner box may still have the app's own corners in some style.*
- [x] Today, Calendar and Ledger in the ancient styles: tags and buttons take the style's corners and faces; Madder draws items as soft tiles, Indigo outlines panels, Paper keeps ruled lines. *Looked at: Today in Madder and Indigo.*
- [x] Phone: the menu folds behind one button.

### CP3: The ancient Court as a flowing page (done 9 October; Xar: "responsive and beautiful")
- [x] The three Court designs flow: the fixed 1512 by 982 sheet is gone (the pages underneath were already responsive), the frame grows with the content, the page is enlarged on screens bigger than a laptop's, and it folds to one column on a phone.

## Data safety
No data is changed by this stage. The try-out server (`.runtime/hub-dev/dev-server.mjs`) uses the test database and fresh copies of JobMap's and Budget's data, deleted afterwards.

## Tests
`node --test hosting/skins/recolor.test.mjs`. The existing Study, calendar and JobMap tests still pass.

## Acceptance checklist for Xar
1. Open Budget, JobMap, Cardiff Life and the Study hub from the top bar: the top bar stays, the chosen part is marked, and each part's colours, type and menu look like the rest of Life OS.
2. Style → Madder, Indigo, Paper, Modern while inside a part: it changes at once, and each style changes type, corners, boxes and buttons, not only colours.
3. Court in an ancient style: it fills the window's width; the text is larger on a wide window.
4. Tell me which pages still look wrong; CP2 is that list.

## Risks and open questions
- The rule that gives boxes each style's corners is broad (by class name). Something that should stay round may be squared, or the reverse; such cases are fixed in that app's layer.
- Rolling back the removed logos: delete the `html[data-life-os-frame] ...` lines in the four layer files.
