# Budget Management — functional upgrade plan

Status: **historical design proposal**. Version 2 has now been implemented; see [current release notes](05-v2-release-notes.md) for the delivered scope. The agreed receipt model is one shopping trip with item-level details.

## 1. What the next app should do

Connect planning, buying, owning and using things, without asking you to record every drop of oil. A normal week should look like: check what is already at home → choose meals and other purchases → build one or more shopping lists → record the actual receipt → put the purchased items into stock → cook or use them → review spending and saving intentions.

The next app should answer: What can I spend after my plans? What do I already own? What is running low? What should I use soon? What can I cook? Which planned purchases can wait?

## 2. Existing rules that remain authoritative

- September 2026–February 2027 each has a £225 base allowance. The assumed £125 opening-spending entry dated 9 September leaves £100 before later September purchases.
- October–February retain the £125 grocery ceiling inside the £225 total. September keeps a shared balance. Proposed new categories do not silently change these amounts.
- Actual overspending carries into later months. Unspent monthly allowance does not automatically increase the next allowance. Months after February have no allowance configured yet; extending the budget calendar is an explicit future setting.
- Preserve all original food quantities, units, allocation months, deadlines, opening rules, scheduled dates and used records. Original monthly divisions remain visible in an allocation view.
- Existing purchases, notes, meals and backups must migrate. Unclear old data is retained with a review flag, not guessed into a different meaning.

## 3. A small set of connected screens

| Screen | What it should help you do |
|---|---|
| Today & this week | See available money, upcoming purchases/subscriptions, meals, low stock and things to use soon. |
| Shopping | Create lists and planned trips; add any item; compare an estimate with available money; record the actual receipt. |
| Food & supplies | See all stock or original allocations; add items; open, use part, mark low, finish, waste or restock. |
| Meals & recipes | Plan several entries per day, keep recipes, reserve ingredients, create a missing-ingredients list, record cooking and leftovers. |
| Money | View actual spending, category breakdowns, upcoming commitments, subscriptions, carry-forward and saving goals. |
| Settings & backups | Manage categories, shops, units and defaults; import/export; view saving status and restore backups. |

Keep the shared month selector. Week views may cross month boundaries, but each paid purchase belongs to its actual date and budget month. Use progressive detail: name, category and price first; stock details only for items that you want to track.

## 4. Categories, shops and tracking are separate

`category-taxonomy.csv` and `.json` contain the proposed two-level list and your examples. Categories answer **what it was for**. Shops answer **where you bought it**. Channels answer **in store, online, delivery or collection**. Tracking describes **what happens after purchase**.

Tesco, Lidl, Aldi, Morrisons, Amazon and any custom merchant are shop values. An Amazon shampoo purchase remains Hair care; a bicycle bought online remains Bike & cycling equipment. The same category works in every shop.

You can add, rename, archive and reorder categories. Archive rather than delete categories with history. Renaming updates the display without rewriting amounts; moving an old purchase between the grocery and other budget pools previews affected grocery balances. The total monthly spend never changes just because a category changes.

Pending categorisation is a real state. A purchase can be saved to Uncategorised, counted in total spending immediately and reviewed later. Show the unresolved amount beside grocery reporting rather than silently assuming it is all groceries. The September opening record stays separate from newly itemised shopping.

At-home snacks and pantry food are proposed to count toward groceries; eating out and parties do not. Too Good To Go stays its own visible category and is proposed to count toward groceries. These are reviewable defaults, not installed rules. Storage life is item-specific: fresh milk and UHT milk can share a spending category but have different storage/opening details.

## 5. Shopping trips and receipts

### Planning a trip

Create a trip or list with name, planned date, optional shop/channel and notes. Each line has an item name, category, quantity, unit, optional package size, estimated line cost and priority (needed, useful, optional). Optional recipe or low-stock links explain why it is on the list. Typing should suggest existing items and previous prices without forcing a match.

Show **estimated total**, **items without prices**, and **projected remaining money**. Blank prices are unknown, not £0. Plans do not become actual spending or inventory. A bicycle can stay on a wish list instead of appearing in this week's essentials.

### Buying and checking out

Start from a planned trip or add an unplanned receipt. Confirm purchase date/shop, bought quantities, actual line totals, substitutions, discounts and charges. Mark unbought lines as kept for later or cancelled. A quick entry can be a single line; detail can be added later.

Show one receipt total and a category split. Require line totals plus charges minus discounts to reconcile with the paid receipt total; any unresolved difference stays visible and prevents a supposedly reconciled receipt. Prices are entered in pounds and stored as integer pence. A receipt-level discount is apportioned deterministically across eligible lines so pennies still sum exactly.

Saving a receipt is one atomic operation: add paid receipt and lines, close matching planned lines, and optionally create stock lots. The receipt itself is a container, not another expense in addition to its lines. A stable checkout ID makes double-click/retry safe. Undo reverses the whole checkout, including stock additions, if no later action has depended on them; otherwise offer a reviewed correction with linked history.

Edits and refunds preserve the original history with linked adjustments. A return asks whether stock also needs removal; it must not silently remove already-used stock. Partial purchases and refunds need explicit penny and quantity tests. Currency is GBP initially. Mixed foreign-currency receipts wait for an agreed conversion rule.

### Example — illustrative amounts only

One trip could contain milk £1.50, eggs £2.00, oil £2.50, toilet rolls £3.00, shampoo £2.00 and snacks £1.00: £12.00 paid once. Groceries total £7.00, household £3.00 and personal care £2.00. These figures demonstrate the split and are not researched supermarket prices.

### Too Good To Go

Record the paid bag cost once in its own category, with merchant and collection date/time. Contents may remain unknown until collection. An **Unpack bag** action creates linked stock items without adding another purchase. If you allocate cost among contents, allocated pennies plus any unallocated amount must equal the bag cost. Never treat an advertised retail value as verified money saved.

## 6. Stock that behaves like the real item

| Tracking mode | Examples | Normal actions |
|---|---|---|
| Exact count or portion | Eggs, laundry capsules, toilet rolls, chicken portions | Use 1 or a chosen number; reserve for meals; retain the remainder. |
| Exact weight or volume | A known 1 L oil bottle, rice, a weighed ingredient | Use a chosen amount, e.g. 15 mL; optionally switch to an approximate level. |
| Approximate level | Oil, soy sauce, shampoo, hand wash, cleaning spray | Unopened → in use → roughly half → low → finished. No daily measurement required. |
| Durable item | Bicycle, pan, clothing, electronics | Bought/owned, returned, repaired or replaced. No “eat/use up” control. |
| No stock | Restaurant, drinks out, subscription, transport fare | Expense or commitment only. |

Expiry is a separate property, not a tracking mode. Milk can be measured and perishable; oil can be level-tracked and long-lasting. Distinguish best-before, use-by and opened-on dates. Read dates and instructions from the actual item; do not invent a safe lifetime or medical guidance. Medicine inventory does not become a dosage or adherence system.

Keep individual lots: two oil bottles can have different purchase dates, sizes, opening status, locations and remaining amounts. A restock adds a new lot rather than resetting an old one. An approximate level is visibly an estimate and does not pretend to be a precise millilitre measurement. “Finished” sets a lot to zero; “used some” retains it. Waste is distinct from consumption, and neither records a second expense.

For existing oil bottles with unknown size, preserve the original quantity/unit and add optional tracking metadata. Do not infer that every existing bottle is 1 L from an example. Keep existing allocation deadlines; a default tracking-mode recommendation must not move portions between months.

Add/edit fields: item name, category, tracking mode, starting and remaining quantity, package size if known, location, purchase/opening dates, optional label dates, low-stock threshold, notes and optional image reference. Defaults should be reusable per item; corrections should be easy and reversible. Prevent negative stock and incompatible units.

## 7. Meals and recipes

Use a recipe library with title, servings/yield, ingredients, quantities/units, steps, prep/cook time, effort, tags, source attribution, notes and an optional image/infographic. Start with user-entered recipes and pasted text for review. An image never replaces editable recipe text; inferred ingredients from an image require confirmation.

Meal entries can be recipes, free text, leftovers, eating out or a Too Good To Go meal. Allow multiple entries and portions in breakfast, lunch, dinner and snack slots. Moving or cancelling a planned meal releases its ingredient reservations. Copying a week copies plans, not past cooking/consumption records.

Planning reserves compatible stock; it does not consume it. Show available, reserved and missing amounts. **Add missing ingredients to shopping** aggregates compatible units and does not add duplicates already planned for the same need. Use g↔kg and mL↔L conversions; do not convert grams into “chicken portions” or spoons without an explicit conversion.

**Cook meal** previews which lots and original allocations will be consumed, then records actual amounts and leftovers. A batch recipe consumes ingredients once; its extra servings become leftover lots. Eating those leftovers does not consume the original ingredients again. Do not reserve future-month portions silently: show a conflict and let the user decide whether to move an allocation.

Recipe costs are estimates based on known ingredient costs. If some are missing or only approximate, show a partial/estimated cost instead of £0 or false precision. Packaging use-by dates and the user's storage notes stay visible when choosing ingredients.

## 8. Budget tools that help you save

The top-level distinction must remain clear:

1. **Actual balance** = monthly base − carried overspend − paid spending (plus linked refunds under the agreed transaction rule).
2. **After planned spending** = actual balance − unpurchased plans due this month − unpaid subscription commitments not already linked to those plans.
3. **After your saving intention** = that projected balance − the amount you choose to leave unspent this month.

Planned purchases and saving intentions are forecasts, not transactions. Buying a planned item replaces its estimate with its actual paid amount; it must not remain deducted as a second commitment. Category targets are divisions of the existing total, not extra allowances. Any target total over £225 needs a visible explanation.

Saving tools to implement: a user-chosen monthly “leave unspent” target; clear weekly spending pace; a wish list with goal amount and optional date; upcoming subscription totals; price history and valid unit-price comparisons; low-stock and duplicate-purchase notices; cook-from-stock suggestions; and a weekly review of actual spending, unused plans, stock waste and progress.

Goal progress is based on explicitly recorded amounts, not assumed bank transfers or the difference between an advertised and paid price. An unspent allowance is a potential surplus, not proof of money saved. For the first release, goals remain separate from the £225 spending allowance and do not create new spending power. Funding purchases from accumulated savings needs a separately agreed rule before implementation; no silent exception to carry-forward.

Subscriptions hold name, category, cost, interval, next due date, optional trial/renewal date and status. They create visible commitments, not paid expenses until confirmed. Editing or cancelling a reminder in this app does not cancel the real service. No bank connection, auto-payment or background notification service is assumed.

Weekly pace uses the actual days left and explicitly selected commitments. Label it a guide, not a guarantee. Do not encourage avoiding necessary food or medicines to hit a target. Use neutral messages such as “£8 planned, £6 available after your target — review one item.”

## 9. Proposed technical design

Keep a loopback-only local app and the existing URL while the upgrade is implemented. The primary project is `C:\Users\ctrlz\Documents\BudgetManagement\app`. Keep the original copy and a dated data export for rollback. No cloud publication is part of this plan.

The current version saves live entries in browser localStorage. A copied app folder does not contain that live database. A dated JSON export is saved in `backups` during this relocation. The first implementation phase should add a local persistence API so the authoritative data can live in this folder, with browser storage only a recovery cache.

Suggested first storage design: versioned `data/state.json`, atomic temporary-file replacement, a previous-good snapshot and dated backups. All writes should be serialised. The server verifies Host/Origin, accepts JSON with a bounded body, validates the full schema, and uses a revision token to reject stale tabs. Read failures must show recovery choices rather than overwrite with defaults. Test Windows file replacement and permissions. If receipt volume later warrants SQLite, migrate with an export and verification rather than changing the foundation prematurely.

On first local-data startup, if the disk file is absent, offer the current browser plan for import and preserve both copies before writing. If both exist, compare revision/history and ask which to use; never silently overwrite a newer one. Keep status explicit: Saved locally, Saving, Conflict or Save failed. Backups are tested by restoring into an isolated test data directory.

| Entity | Proposed fields / role |
|---|---|
| Category | Stable ID, parent/group, label, grocery/other/unresolved pool, archived flag, optional illustration key. |
| Merchant | ID, name, optional common channel; no required external account. |
| Item | ID, name, aliases, default category, tracking mode, unit, optional package size, optional image key. |
| Stock lot | Item ID, original allocation link where applicable, amounts or estimated level, location, dates, status, receipt line link. |
| Stock event | Lot ID, action, amount/level, date, reason, linked meal or correction; reconstructable history. |
| Shopping plan / line | Planned date/shop, item/category, estimate or unknown price, quantity, priority, status, origin recipe/low-stock link. |
| Receipt / line | Stable receipt and checkout IDs, date/shop/channel, paid totals, categories, quantities, discounts/fees, plan/stock links. |
| Recipe / ingredient | Servings, steps, ingredients, quantities, optional item matches, cost confidence, attribution and image references. |
| Meal entry / reservation | Day/slot, recipe or note, portions, planned/cooked/skipped state, lot reservations and cooking event links. |
| Budget / subscription / goal | Existing monthly rules plus user-defined targets, due commitments and explicitly recorded goal progress. |

Refactor business operations into pure, testable functions. Add separate modules for categories, receipts, stock and meal planning; do not keep growing one large dialog file. The current offline React runtime can remain during the first stages. Schema version 4 is proposed for the next feature upgrade, not written in this planning stage. Legacy expense records become single-line receipts without losing IDs, amounts, date or original category text. The original allocation model is bridged, not discarded.

## 10. Delivery order and acceptance gates

| Phase | Implement | Done when |
|---|---|---|
| 0 — Prepared now | Research, folder copy, exported backup, taxonomy, plan and image briefs. | Current app launches from the new folder; copied sources match; documents clearly separate proposed from live features. |
| 1 — Foundation | Versioned local data, recovery/conflict handling; category/shop/item management; legacy import. | Reopen in the chosen browser; restore a backup; keep every original amount/allocation; create and archive a category safely. |
| 2 — Shopping & stock | Lists, estimates, mixed receipts, partial checkout, item/lot creation; level/count/volume/durable tracking; Too Good To Go unpacking. | Enter the £12 mixed example once; totals reconcile; oil remains in use after partial consumption; receipts cannot double-save. |
| 3 — Meals & recipes | Recipe CRUD, servings, reservations, missing-ingredient lists, cooking/leftovers. | Two meals cannot reserve the same last egg; cancelling releases it; leftovers do not double-consume; original month locks remain effective. |
| 4 — Money & saving | Category reports/targets, commitments, subscriptions, saving intentions, wish lists and weekly review. | A paid subscription is counted once; unknown prices stay unknown; removing/adjusting a receipt recalculates future carry-forward. |
| 5 — Visual polish | Approved artwork, recipe covers/infographics, image management and responsive finishing. | All core flows work with images missing; labels stay accessible; approved files map to manifest IDs; layouts work at phone and desktop widths. |

The first usable upgrade is phases 1–2. It directly solves the inability to add shopping/items/categories and the oil-bottle problem. Phases 3–4 deepen the connections after those records are dependable. Art does not block functional work, and a style decision precedes bulk asset production.

## 11. Required regression scenarios

- Legacy plan + £125 opening record upgrades once; repeated load/import does not duplicate it; deleting it stays deleted.
- September's opening £125 plus later £120 still produces £20 carry-forward and October £205.
- All original food/household allocations and historical used/scheduled dates survive migration exactly.
- Uncategorised lines count in total spending but remain visibly unresolved in grocery reporting.
- A receipt with food, household and beauty lines counts once; penny discounts, delivery and partial refunds reconcile.
- Double click, retry, reload during save and two tabs cannot duplicate or lose checkout/state.
- A planned trip changes forecasts only; partial checkout retires only bought lines and creates only bought stock.
- Oil may be opened/half/low without being finished; a second bottle is a separate lot; exact and estimated measurements are not confused.
- Two eggs reserved for one meal cannot be reserved for another; cooking/undo/leftover actions preserve quantity totals.
- TGTG payment counts once; unpacked contents add stock, not additional spending.
- Subscription dates crossing months or years, annual costs, cancellation and confirmed payment do not create duplicates.
- Corrupt/old/future-schema backups, missing images, failed writes, and budget gaps show a clear recovery or limitation.

## 12. Review points before implementation

Confirmed: itemised receipts; plan/image briefs first; permanent home under BudgetManagement. Suggested defaults remain reviewable: TGTG and at-home snacks count as groceries, level tracking is the default for long-lasting liquids, and goals do not change the existing allowance formula. Before phase 4, choose a saving intention and whether the budget should extend beyond February. Before phase 5, choose the first visual direction and a few real recipes. These decisions do not require generating the whole artwork library now.

Not included in the first implementation: live supermarket price scraping, online checkout, bank connections, automatic receipt OCR, medication dosing, automatic AI recipe generation, phone/cloud sync or paid image services. These are possible later projects, not implied working features.
