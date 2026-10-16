# 2026-10-16 · Claude Code · Health part · CP1 to CP6, the Guide, main

## Goal
Xar, 15 October: "now work on more details for the health mini app, exercises, dietry and recipes and even gather stuff from the internet and work a uk kinda style"; then, while it was being built: "add anything new or non existent in the guide, to the guide" and "in the end push everything to the main branch bc im seeing they're pushed to a specific branch but it's not main branch". Her 14 October words about health (appointments, tests, gym sessions, exercises, recipes) are part of it. Brief: `briefs/health-part.md`; her words: `TODO.md` section S.

## What I did
- Research (NHS, GOV.UK, Food Standards Agency, NHS Healthier Families; BBC sites refused the research tool): the activity guideline and talk test, the whole Couch to 5K plan, the NHS strength exercises, the Eatwell Guide, 5 A Day, fluids, reference intakes, free sugars, salt, fibre, traffic-light bands, the 14 allergens, 196 NHS recipes. Sources are named beside each figure in `shared/health/guidance.js`.
- Content (`code/life-os/shared/health/`): guidance, 43 exercises, 4 programmes (Couch to 5K exactly as the NHS plan), 36 UK recipes (British, Welsh, cheap; 29 linked to a similar NHS recipe), whole-word matching against food at home (a "Raspberry oat drink" is neither oats nor raspberries), the week's measures.
- Life OS: `/health` with This week, Exercise, Food, Appointments & tests; the top bar; `/room/body` and the Court's tile go there; Today's Health panel; the Court tile's figures; the calendar's Health area and links; the bell for appointments and sessions; `workout` and `appointment` entry types widened (no database change); `/api/health/food` (Budget's rules, as shopping does).
- Budget: a recipe opens from `?recipe=`; Recipes points to the UK recipes; an ingredient keeps the recipe's amount beside her unit.
- The Guide: Health chapter (8 steps), six answers, both figures; and the gaps found by checking every chapter against the app: Today's Health panel, Budget's week and batches, the other Food & supplies views, the calendar's and the bell's lines, the top bar's narrow-window words. 91 pictures retaken; marks now drawn on visible things.
- The top bar: Style and Light/Dark drop their words and the date gives way up to 1700 pixels, and the ancient styles' capitals are a little tighter below 1280: one line at 1110 to 1920 in all four styles.
- Git: my work committed in parts, Codex's three session notes committed apart, `main` fast-forwarded to `stage/4b-one-look`, both pushed to GitHub.

## Files and commits
- `[health-cp1-5]` the Health part (content, server, pages, links, Budget's recipe link, the top bar).
- `[health-cp6]` the Guide.
- `[health]` records; Codex's notes of 15 October in a commit of their own.

## How I checked it
- `node --test code/life-os/shared/health/health.test.js` 7 passed; `hosting/health/food.test.mjs` 2; day, calendar, shopping and bell 44; core entry types 6; Budget 188. Not run: `hosting/app.test.mjs` and the old query tests (they reseed the core).
- The UK recipes against her real Budget data (a copy): only "Scrambled eggs with mushrooms and tomato" is all at home; matching mistakes found this way and fixed (oat drink, olives as greens, 2 cloves read as 2 bulbs).
- The whole part walked on the try-out (`node .runtime/hub-dev/dev-server.mjs 47860`): log a 35-minute walk, start Couch to 5K (27 sessions), open run 1 with its NHS steps, add a UK recipe (into Budget's copy), vegetarian without milk (23 of 36 set aside, with reasons), a label (6 g saturates is red), a dentist appointment, a weight. The try-out uses the real core database, so every core save was answered inside the browser; none reached her records.
- Looked at in Modern light and dark, Madder, Indigo, Paper and at 400 pixels; top bar measured at eight widths in four styles, before and after.
- Live, looking only: Health, Food with her Budget, a recipe link into Budget, the Guide.

## Data touched
- None of hers. No session, appointment, measurement, diet or recipe was saved to her live data. The try-out's Budget copy got one recipe; it is thrown away when the try-out starts again.

## Problems and surprises
- The try-out server shares the live core database (only Study, JobMap and Budget are copies). Noted here; walking anything that saves to the core needs the in-browser answers used this time.
- Codex was answering the same GitHub request in its own conversation, where she had asked it not to push; it prepared `git push origin stage/4b-one-look:main` for her. She asked me to push, so I did, with that same normal fast-forward and no force.
- Adding Health made the ancient styles' top bar wrap at three widths; fixed with the rest.

## Small decisions I made, and questions for Xar
- In DECISIONS (15 October): Health a part of Life OS; food still Budget's; the UK content shipped with the app and chosen from, never put into her records; a vigorous minute counted as two; `main` brought level at her request.
- For her: whether Review should count active minutes; whether she wants measurements as a chart.

## Next step
Ask her to open Health: set My diet, try "Log a session", and start a programme if she wants one. Then what she finds.
