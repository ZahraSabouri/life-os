# Research notes and design decisions

Reviewed 16 September 2026. These are first-party product/category references. Store pages were used to check category coverage, not to build a live product catalogue or compare current prices. No accounts, carts or purchases were used. Amazon remains a merchant/channel example; its catalogue was not needed to define the taxonomy.

## [Tesco — Food Cupboard](https://www.tesco.com/shop/en-GB/category/food-cupboard)

Separates pantry staples, cooking ingredients, sauces, rice/pasta and other departments. Supports separating fresh shopping from longer-lasting pantry purchases.

## [Lidl — Cleaning & Household](https://www.lidl.co.uk/c/cleaning-household/s10023353)

Presents cleaning and household ranges together. Supports dedicated household categories rather than treating every supermarket purchase as food.

## [ALDI — Sitemap](https://www.aldi.co.uk/SiteMap.html)

Lists fresh food, food cupboard, chilled food, home/cleaning and health/beauty. Useful coverage check for the proposed category list.

## [Morrisons — All products](https://groceries.morrisons.com/categories)

Distinguishes toiletries/beauty, health/medicines, household and food departments. Supports separate personal-care and medicine spending.

## [AnyList — Meal planning](https://www.anylist.com/meal-planning)

Connects recipes on a calendar to an ingredient shopping list; also allows meal notes. Adopt this connection, while retaining the planner’s exact stock allocations.

## [Pantry Check](https://pantrycheck.com/)

Describes per-item expiry tracking, categories/locations and restock suggestions. Adopt stock-aware planning with user-entered dates; do not invent food lifetimes.

## [YNAB — Goal tracking](https://www.ynab.com/features/goal-tracking)

Uses targets, progress and flexible timing. Adopt clear saving intentions and progress without claiming that a target means money has actually been saved.

## Our design choices

The separate category, merchant and stock-mode model is a recommendation for this app. The precise level-tracking flow, receipt accounting, preservation of original allocations and Too Good To Go unpacking are proposed designs, not claims that all researched apps implement them. Features were reviewed from published descriptions, not by hands-on testing of those services. Availability, offers and prices can change; none are imported as permanent facts.

The useful connection is a recipe-to-shopping workflow plus stock-aware restocking and visible financial intentions. Keep logging effort low: approximate levels are better than fake precision for a sauce bottle, while exact counts remain useful for eggs and capsules.
