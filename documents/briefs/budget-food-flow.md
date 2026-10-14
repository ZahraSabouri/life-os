# Budget fix: food you can use (what to eat, recipes as templates, food at home)

Requested by Xar, 14 October 2026, 17:00 (her words are in `TODO.md` section R). A fix she asked for directly, inside the attached Budget app and the Life OS pages that show it. It does not start the native Budget migration (Roadmap stage 5).

## What was wrong, found by using it with her data (14 October, lunchtime)
- A meal on the Life OS calendar linked to `/budget`, so it opened Budget's first page. On Today and the Court a meal was plain text.
- "Halloumi salad" (14 October, lunch) has no recipe: its card showed "Ingredients linked", "0.25 packs" of two things, an import note ("From the shared two-week plan. Planned only; no food has been marked consumed.") and a date box. Nothing said how to make it. All 19 imported meals carry that note; the 17 recipes carry "Working recipe from the shared conversation…".
- A recipe could not be read: its only button opened the edit form.
- A recipe ingredient linked to one pack ("Tomatoes" → the tomato bought on 12 October) stops matching once that pack is used, so the recipe never counts as ready again. A recipe was a one-off, not a template.
- Nothing answered "what can I eat now?": the week grid shows a plan, and "Available ingredients" is a row of names.
- Food & supplies → What's left: 101 large cards in one column of about 16,700 pixels; finishing something needs one dialog per thing and a date.

## Research: what similar apps do, and what is taken
- **Grocy** (self-hosted stock + recipes): every recipe shows whether its ingredients are in stock; missing ones go to the shopping list in one click; a "due score" ranks recipes by how many of their ingredients are due soon or expired. Taken: the ranking by what is at home and by what should be used soon; one click for what is missing.
- **SuperCook**: recipes from the ingredients you have, and a separate list of recipes where one ingredient is missing. Taken: "Missing one thing" as its own group.
- **Mealie**: recipes, meal plan and shopping list as separate parts linked by the recipe's ingredients. Taken: the recipe as the thing a meal points to.
- **Paprika**: scaling servings; the recipe pinned while cooking. **Mela**: a cooking view, the steps beside the ingredients, the current step large. Taken: a recipe page with ingredients beside numbered steps, servings that scale.
- **Samsung Food**: search recipes by ingredients; cooking removes what was used. **Pantry apps** (KitchenPal, Pantry Check): marking something used up, which can put it on the list. Taken: "Finished" in one tap, for several things at once.

## Decisions (mine, to report to her)
- **Food stays in Budget**, with the stock, receipts and shopping lists it uses. Body & Health in Life OS (an area that already exists for appointments, training and plans) shows today's food and links to it. No separate Health app: it would split the stock that recipes need, which she said must stay linked. If she wants Health as its own part later, the food part moves as a whole.
- A recipe ingredient means a food: a product, a kind of food, or a name. A pack linked by hand is preferred while it lasts, and any pack of the same product counts after it.
- "Finished, date not known" keeps the day it was noted, carries a flag, and is left out of the day-by-day history and the rates worked out from it.
- The import notes are removed from her data through Budget's own API, with a copy first. The bolognese note ("Prepare three sauce portions…") is a step of her plan, not a disclaimer, and stays.

## CP1: A meal opens itself, and says what it is
- [x] Calendar, Today, the Court and the strip above Budget open the meal's own card (`/budget#/meals/week?m=…&meal=…`).
- [x] The meal card: what is in it (at home or not), how to make it (the recipe's steps, or "No method written yet" with "Write how to make it"), one main action ("I ate this"; the date is the meal's own day unless it is in the future), move to another day, change, skip.
- [x] Plain words for each state ("Ready to make", "Cook the chicken batch first", "Eaten").
- [x] The import notes removed from her meals and recipes; the app no longer writes notes of its own.

## CP2: Now, and recipes as templates
- [x] Meals & recipes opens on **Now**: this mealtime's plan, meals from earlier days still open ("Did you eat it?"), ready portions, and what you can cook from what is at home (ready / missing one / missing more; what to use soon first).
- [x] A recipe page: ingredients with what is at home, numbered steps, servings that scale; Cook it now, Plan it, Add what is missing, Edit, Copy as a new recipe; when it was eaten and when it is planned.
- [x] A meal can be saved as a recipe. Ingredients match by food, so a recipe stays usable after the pack it named is used.
- [x] A food's page lists the recipes that use it.

## CP3: Food & supplies
- [x] What's left grouped by place (fridge first), compact rows, what to use soon first; cards stay as a choice.
- [x] Select several → Finished (date not known / today / another day) or Thrown away. Planned meals that used them now say what they need.
- [x] "It's all gone" in the single-item dialog too.

## CP4: Life OS
- [x] Today and the Court: meals are links; "What can I eat now?" opens Now.
- [x] Body & Health shows today's food and links to Now and Recipes.
- [x] The Guide's Budget steps and pictures updated.

## Found while walking it, and done
- [x] "Add a meal" shows the recipes at the top, each with what it needs; it was hidden under "Recipe, servings and notes".
- [x] A link that names a meal, or moving to another page, closes a dialog left open; a food's page opened from inside a card is no longer hidden behind it.
- [x] "Tick what is gone" reads in dark mode (an outlined card, not a filled bar).
- [x] The Guide draws its numbered marks inside an open dialog (a modal dialog is above everything else on the page).

## Open after this fix
- The tomato bought 21 September and most of the fridge (bought 8 to 12 September) still count as at home; "Eat soon" lists them so she can mark what is gone. Nothing was marked for her.
- Four meals of 12 to 14 October are still "not marked yet": hers to answer on Now ("I ate it" / "I didn't").
- No label dates are recorded on anything at home, so "eat soon" works from the fridge and the day bought; a use-by date typed on a pack (Edit details) is used first.
- Recipes are still Budget's (Roadmap stage 5 makes them their own collection).

Verify each checkpoint: Budget build and tests (181 before), the Life OS tests that read Budget, a browser walk with her data that saves nothing, and the two walks she named (lunch from the fridge; planning ahead) on a copy.
