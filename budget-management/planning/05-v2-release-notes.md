# Version 2 — implemented release

Prepared 17 September 2026. This supersedes the earlier plan-only status. The implementation was tested separately from the personal plan before installation.

## Implemented

- A redesigned Home, Shopping, Food & supplies, Meals & recipes, Money & saving, and Settings interface; desktop and narrow-screen layouts.
- User artwork across folders, an artwork chooser, category/item image variety and cropped details for money, household, meals and other views. Original files stay unchanged.
- Editable categories with grocery/other/pending pools and archive/restore; separate merchant and purchase channel fields.
- Shopping lists, priority, quantity, unknown or estimated totals, pasted item lists, favourites and a receipt-derived catalogue.
- Itemised mixed receipts with discounts, charges, partial checkout, exact penny reconciliation, linked refunds, corrections and stock creation. Receipt totals count once.
- Separate stock lots, pack-to-stock quantities, count/portion and weight/volume use, approximate bottle levels, durable belongings, returns, waste, label dates and low-stock reminders.
- Too Good To Go as its own category, with one paid bag and a separate unpack-to-stock action.
- Free-text meals, an optional recipe library, servings, compatible ingredient reservations, missing-ingredient lists, cooking, leftovers, moving/skipping meals and copying a week. Original allocations and calendar remain available.
- Actual spending, carry-forward, category reporting/targets, monthly saving intentions, explicit goal contributions, subscription commitments and payment confirmation.
- Local disk saving with revision protection, automatic snapshots, JSON export/import preview, visible save errors and last-action undo.

## Preserved

Original resource quantities, month allocations, used/scheduled dates, expenses and budget settings are retained during migration. The £225 default, September opening £125 and total-overspend rule remain. Historical receipt observations are a catalogue only; importing them does not invent new spending.

## Practical boundaries

Recipe pictures and recipes can be added later. Ingredient matching uses names and compatible units; approximate bottles require manual usage. Price history shows paid totals and prices per purchased unit; unknown pack sizes are not converted into misleading comparisons. Label dates come from the user.

This release does not connect to banks, place orders, scrape live supermarket prices, read receipt photos, generate recipes, sync to phones/cloud, or send background reminders. Shop names and units are entered directly. The earlier design plan remains a reference for later refinements, not a claim that every proposed detail is present.

## Validation

Automated checks cover the original carry-forward rules and migration, mixed receipts, discounts, partial purchases, pack quantities, bottle levels, refunds/receipt correction, subscription dates, ingredient reservations/cooking and local persistence/backup/conflict handling. Browser checks cover the real forms, reload persistence, image loading and responsive layout. Test purchases are confined to the staging data folder and are not installed.
