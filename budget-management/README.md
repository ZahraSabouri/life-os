# Everyday — Budget Management 2

Your permanent project is **C:\Users\ctrlz\Documents\BudgetManagement**.

Double-click **Start Budget Management.cmd** in this folder. It starts the local server and opens **http://127.0.0.1:47831/**. Use **Stop Budget Management.cmd** when you want to stop it. Node.js is required and is already installed on this computer. Opening the built HTML directly is not supported: use the launcher.

## Your first few minutes

1. **Shopping → Usual buys**: your Lidl receipt catalogue is ready. Star favourites, correct uncertain receipt names, paste a new list, or add an item.
2. **Shopping → My lists**: plan a trip with estimated prices. **Record what I bought** saves one itemised receipt, its spending and the purchased stock together. Partial trips leave the rest on your list.
3. **Food & supplies**: use quantities for portions, eggs or capsules; use **Open / About half / Running low / Finished** for bottles. The original allocation view preserves your earlier schedule.
4. **Money & saving**: see actual spending separately from shopping plans, renewals and your saving intention. Record goal contributions only when you have put the money aside.
5. **Meals & recipes**: a quick note such as “eggs on toast” works immediately. Recipes, ingredients and artwork are optional. Recipe plans reserve compatible stock; cooking consumes it once and can create leftovers.

## Budget rules

- The default for a new budget month is £225. Your existing configured months and any custom limits are preserved.
- September 2026 has the existing £125 assumed pre-10 September spending record. With no other spending, that leaves £100.
- Total overspending is deducted from later configured allowances. Unspent allowance does not automatically increase the next month.
- Existing October–February grocery ceilings are preserved. Add later months through **Money & saving → Monthly allowance**; £225 is prefilled.
- Saving goals are records of progress, not extra allowance or bank transfers. Plans and subscriptions are forecasts until paid.

## What is stored here

- `app/`: source, offline React runtime, built app, launcher and automated tests.
- `data/state.json`: the live saved plan, with a revision number.
- `data/backups/`: automatic previous-state copies, created before saved changes.
- `data/usual-purchases/`: 100 catalogue entries and evidence from eight supplied Lidl receipts. Eleven repeat purchases start as favourites. Historical receipts are not automatically added to live spending or stock.
- `assets/images/generated/`: all your original artwork and subfolders. The app also uses cropped windows into complex images; originals remain intact.
- `planning/`: the earlier research/briefs, current release notes and the image studio.
- `backups/`: earlier exported browser plans.
- `archive/`: the preserved original project and a dated copy of files replaced by this upgrade.

The folder is now the primary store. Browser storage is a recovery cache and retains the old plan separately. Export portable copies through **Settings & backups → Export everything**. An older app copy must not edit the new data file.

## Restore and recovery

For a normal restore, choose **Settings & backups → Restore a backup** and inspect the preview before saving. Both exported JSON and automatic wrapped snapshots are accepted. A previous-good disk copy is kept before replacement.

If the saved file is damaged, the app leaves it untouched. Stop the app, copy `data/state.json` somewhere safe, and replace it with a known-good `data/backups/state-r…json` snapshot. Start again. For an exported unwrapped JSON backup, first preserve and rename the damaged file, start the app, then use the import control after choosing a starting copy. Do not delete old backups during recovery.

## Artwork and future recipes

Your selected S01 v05 direction guides the colours, texture and layout. Artwork from different S01/S02 subfolders and the main generated folder is used throughout. Choose pictures in item, stock, recipe and goal editors, or browse everything in Settings. New files are discovered when the app reloads. Image text is decoration; the live app figures are shown separately.

There is no recipe-writing requirement before using the planner. The library and ingredient/cooking flow are ready for recipes later. Keep future source material in `assets/recipes/inbox/`.

## Development

From `app/`, run `node build.cjs` after editing source, then restart the local server and refresh the browser. Run `node --test tests/*.test.cjs` for domain and persistence checks. No npm install or internet connection is needed to run the app.
