# Budget fix: receipts, recipes and meal preparation

User-requested fix, 12 October 2026. Applies to the attached Budget app used through Life OS. This does not start or accept the native Budget migration.

## CP1: A usable shopping-to-meal-to-consumption flow

- [x] Read the supplied conversation and the signed-in receipt; inspect the actual owning saved state and preserve existing entries.
- [x] Paste receipt text into an editable draft; keep categories, amounts and stock choices reviewable before saving.
- [x] Replace a simple estimated payment with an itemised receipt without a second charge; retain the old record for recovery.
- [x] Show unrecorded estimated payments separately with a provisional balance.
- [x] Connect recipe ingredients to cupboard stock, preserve product-type links, support optional ingredients and prefer exact ingredients over loose pantry matches.
- [x] Plan a preparation batch and its later meals before cooking. Preparing consumes ingredients once and creates ready portions; eating consumes those portions.
- [x] Support fridge/freezer portions, user-entered storage dates, protected undo, editing a planned batch and skipping its linked meals.
- [x] Distinguish preparation from eating in consumption history and direct linked history edits to their owning meal.
- [x] Verify the build, full domain/persistence suite and the browser flow on an isolated data copy.

Acceptance of the interface remains the user's review. Unidentified earlier payments, actual remaining freezer quantities and missing package label dates require source information, not inferred data.
