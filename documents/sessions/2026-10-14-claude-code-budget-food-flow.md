# 2026-10-14 · Claude Code · Budget fix · food you can use (CP1 to CP4)

## Goal
Xar's message of 14 October, 17:00 (all of it is quoted in `TODO.md` section R): a meal on the calendar opened Budget's first page instead of its card; Meals & recipes was not user-friendly and did not answer "what should I eat"; "Halloumi salad … ingredients linked. There is no recipe. There is nothing written"; the pre-written import notes; recipes and foods as entities and templates that "smartly show" from what is at home; research similar apps; act it out at lunchtime and when planning ahead; maybe a Health app; Food & supplies more accessible, and marking things finished "without dates … not necessarily today". Brief: `briefs/budget-food-flow.md`.

## What I did
- Used Budget with her data first (pictures before any change): the calendar's meals linked to `/budget`; Today's meals were plain text; the Halloumi salad card showed the import note, "Ingredients linked" and a focused date box; recipes had only an edit form; a recipe ingredient linked to one pack stopped matching when that pack was used; What's left was 101 large cards (about 16,700 pixels).
- Research (Grocy, SuperCook, Mealie, Paprika, Samsung Food, Mela, pantry apps); what was taken from each is in the brief.
- Budget (`food-domain.js`, `food-ui.js`, `food.css`, targeted edits elsewhere):
  - Meals & recipes: Now · Week · Recipes · Batches · Original calendar. Now opens on the current mealtime.
  - A new meal card, a recipe page, "Write how to make it" (a meal becomes a recipe), "Copy as a new recipe", "Recipes with it" on a food's page.
  - An ingredient linked to a pack also matches later packs of the same product (`ingredientMatcher` wrapped).
  - "Cook this now" takes what is at home before other plans (`cookFromHome`); planning ahead counts only what is free; "Add a meal" shows the recipes at the top with what each needs.
  - Food & supplies: What's left by place, "Finished", "Choose several", and "date not known" (`finishStock`, event flag `undated`), left out of the weekly and monthly history and the usage rates.
  - The address can name a meal (`?meal=`); a link or a page change closes an open dialog; a food's page opened from a card is no longer hidden behind it.
  - The app no longer writes notes of its own (three places).
- Life OS: the calendar and the day service give each meal its card link; Today and the Court link each meal and offer "What can I eat now?"; the strip above Budget names what is eaten, not the batch; Body & Health shows "Food today".
- Guide: five Budget steps, three "How do I" answers, six pictures; marks are now drawn inside an open dialog.

## Files and commits
- `[budget-food-cp1-3]` Budget: Now, recipes as templates, the meal card, finishing food without a date.
- `[budget-food-cp4]` Life OS: a meal opens its card; food on Today, the Court and Body & Health; the Guide.
- `[budget-food]` Records: her words, the brief, decisions, status, this note.

## How I checked it
- `node --test tests/*.test.cjs` in Budget: 188 passed (181 before, 7 new in `food-flow.test.cjs`). The recipe, meal and stock suites were also run with the new logic loaded (110 of 111; the one failure is a test that loads a script by a relative path from its folder).
- `node --test hosting/day/service.test.mjs hosting/calendar/calendar.test.mjs hosting/home/shopping.test.mjs`: 38 passed (two new checks for the meal link). `hosting/app.test.mjs` not run (it reseeds the core).
- On a private copy of Budget with a copy of her data (port 47871, saving): the link opens the avocado bowl; Halloumi salad → "Write how to make it" → a recipe whose ingredients name the products, the meal following it; "I ate it" on Tuna salad (13 Oct) used its stock on 13 October; two fridge things finished, date not known, not in the weekly history; "Cook this now" and the meal that gave way; a food's recipes; next week: Tuesday lunch from a recipe, the week's missing tomato on this week's list.
- Live, looking only: Today's meals and the calendar's avocado bowl open their cards; Body & Health; the strip; Modern light and dark, Paper, Madder.

## Data touched
- Budget revision 106 → 107 through its API: the import's notes cleared from 18 meals and 17 recipes; money, stock and lists compared equal before and after. Copy before: `.runtime/budget-food-2026-10-14/state-before-notes-r106-*.json`; Budget's own snapshot `budget-management/data/backups/state-r106-*.json`. Script: `.runtime/budget-food-2026-10-14/clear-import-notes.mjs`.
- No meal marked eaten, nothing finished, no list changed in her data: all trying was on the copy.

## Problems and surprises
- Recipes listed "everything at home" while a planned meal had set the ingredient aside; cooking it then showed it missing. Settled as: cooking now comes first, planning ahead respects plans (DECISIONS, 14 October).
- A modal dialog is drawn above anything added to the page, so the Guide's marks on dialog pictures were invisible until drawn inside the dialog.
- The browser tool of this session (Playwright through the Chrome extension) was not available; the project's own `playwright-core` was used.
- Another Claude Code session moved the study plan to start on 15 October during this one (`f5b77c8`); no files were shared.

## Small decisions I made, and questions for Xar
- No separate Health app: the food stays with the stock it needs; Body & Health shows it (DECISIONS).
- The bolognese batch's note ("Prepare three sauce portions…") was kept: it is a step of her plan, not a disclaimer.
- For her: the five meals of 12 to 14 October on Now ("Did you eat these?"), and "Eat soon", which lists fridge food from September that may be gone.

## Next step
Ask Xar to open Budget → Meals & recipes (or "What can I eat now?" on Today) and answer the open meals; then what she finds. Otherwise `STATUS.md`'s next step.
