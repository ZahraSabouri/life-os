# 2026-10-13 · Codex · Budget requested fix · CP2

## Goal
Separate this week's shopping from undated wishes, and correct the main Budget interface after the user's objection to unsolicited AI-written food instructions.

## What I did
- Removed the food-use instruction cards and imported advice from the main meal page. My food plan now shows the user's dates and budget, with an editor for those settings. Existing recipes and meals remain saved and editable.
- Added list timing: Someday (no date), a week, or a specific day. Weekly lists store a week, not an invented shopping day; undated wishes do not affect monthly forecasts or appear as current Home shopping.
- Split the existing saved shopping data through Budget's API. Five existing planned items were moved with their IDs retained; three newly requested items were added to a weekly list. Eight previous ticks and all spending/stock/meal records were preserved. The completed source list is retained as Earlier purchases.
- A new plan now starts empty. The old personal allocation template is retained for legacy compatibility rather than used as a starting copy. Removed the fixed history cutoff from presentation and the personal allowance explanation; new allowances are entered by the user. Month choices use the current date and saved data.
- Recovery suggestions follow the selected data folder instead of looking in an unrelated workspace's backups.

## Files and commits
- `[budget-fix-cp2] Separate undated wishes and weekly shopping; keep plan UI generic`
- Brief: `documents/briefs/budget-fix-meal-workflow.md`, CP2.
- Targeted Budget domain, dialogs, presentation, server recovery path and built page; Home shopping/day services and related tests.

## How I checked it
- Budget build and JavaScript syntax check passed.
- Budget: 181 tests passed; Home/day/calendar: 37 tests passed.
- Existing catalogue-history test now declares its own tracking date; an added case verifies a new plan does not inherit that cutoff.
- Live browser: the shopping rail has the separate weekly and undated lists, the weekly list contains three requested items, Home's reminder contains only those three, and the main meal page has no imported food-use instructions.
- Isolated instance: Start with an empty plan, then reload. No stock, shopping, recipes, meals, spending or preset allowance appeared; the month selector followed the current date.
- Private before-state, preservation checks and screenshots: `.runtime/budget-shopping-2026-10-13/`.
- Original line endings retained. Diff checked with CRLF-aware whitespace checking.

## Data touched
- Budget revision 105 to 106, via its revision-checked API. Automatic prior-state snapshot retained in `budget-management/data/backups/` and a private before-copy in the task runtime folder.
- No changes to receipts, expenses, stock, consumption, recipes, meals, subscriptions or budget settings. Earlier ticks are retained.
- Only the isolated test instance was used to create a blank starting plan. No core database writes or standalone Budget data changes.

## Problems and surprises
- The earlier UI forced every list onto a day and presented an imported advice checklist as an app feature. Both were corrected.
- The first launcher restart report timed out during startup; the owning Life OS health endpoint and Budget state were then verified live and correct. No port or security settings changed.
- Account registration and multiple-account storage are separate work; this change makes the current interface and new-plan defaults generic, without claiming signup is implemented.

## Next step
Review Budget → Shopping and the list timing editor. Any further personal shopping or meal changes should be saved as records, without adding those details to shared UI defaults.
