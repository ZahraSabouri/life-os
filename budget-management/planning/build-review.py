from pathlib import Path
import json, csv, html, re, argparse
from urllib.parse import quote

parser=argparse.ArgumentParser(description='Rebuild the planning review and image briefs. Does not modify the app or image files.')
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1])
parser.add_argument('--asset-root',type=Path,default=Path(__file__).resolve().parents[1])
args=parser.parse_args()
OUT=args.output
ASSET_ROOT=args.asset_root
sample_paths=sorted((ASSET_ROOT/'assets/images/generated/s01-visual-direction-sampler').rglob('*.png'))
sample_count=len(sample_paths)
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'planning').mkdir(exist_ok=True)
(OUT/'assets/images').mkdir(parents=True, exist_ok=True)
(OUT/'data').mkdir(exist_ok=True)

groups = [
 ('Fresh food','grocery',[
  ('Fruit & vegetables','Fresh fruit, salad, vegetables, herbs','count or measured'),
  ('Milk & alternatives','Milk, oat drink, other milk alternatives','level or measured'),
  ('Eggs & dairy','Eggs, cheese, yoghurt, butter','count or measured'),
  ('Bread & bakery','Bread, wraps, croissants, bakery items','count'),
  ('Meat, fish & plant proteins','Chicken, mince, fish, tofu','count or measured'),
  ('Fresh convenience food','Chilled ready meals, sandwiches, prepared salads','count')]),
 ('Pantry & freezer','grocery',[
  ('Rice, pasta & wrappers','Rice, pasta, noodles, rice paper','measured or level'),
  ('Cooking oils & fats','Sunflower oil, olive oil, cooking spray','level'),
  ('Sauces & condiments','Soy sauces, hot sauce, ketchup, dressings','level'),
  ('Spices & baking','Spices, salt, flour, sugar, baking supplies','level or measured'),
  ('Tins, jars & pulses','Tinned tuna, beans, lentils, tinned fruit','count'),
  ('Breakfast & spreads','Cereal, oats, honey, jam, peanut butter','level or measured'),
  ('Frozen food','Frozen vegetables, frozen fruit, frozen meals','count or measured')]),
 ('Snacks & drinks at home','grocery',[
  ('Snacks & treats','Crisps, biscuits, chocolate, sweets, snack bars','count'),
  ('Tea, coffee & soft drinks','Tea, coffee, juice, soft drinks, bottled water','count or level')]),
 ('Household','other',[
  ('Paper & toilet rolls','Toilet paper, kitchen roll, tissues','count'),
  ('Cleaning products','Kitchen spray, bathroom cleaner, floor cleaner','level'),
  ('Laundry','Detergent capsules, laundry liquid, fabric conditioner','count or level'),
  ('Dishwashing','Washing-up liquid, dishwasher tablets, rinse aid','count or level'),
  ('Household consumables','Sponges, scourers, bin bags, foil, food bags','count')]),
 ('Personal care & beauty','other',[
  ('Hand, body & oral care','Hand wash, body wash, toothpaste, deodorant','level or count'),
  ('Hair care','Shampoo, conditioner, styling products','level'),
  ('Skincare & creams','Hand cream, moisturiser, cleanser, sunscreen','level'),
  ('Makeup & fragrance','Makeup, perfume, cosmetics','level or durable'),
  ('Personal hygiene','Period products, razors, cotton pads','count')]),
 ('Health & medicines','other',[
  ('Medicines & first aid','Medicines, plasters, first-aid supplies','count or level'),
  ('Health services & wellbeing','Appointments, health purchases, optional supplements','none or count')]),
 ('Clothes & accessories','other',[
  ('Clothing','Tops, trousers, coats, underwear','durable'),
  ('Footwear & accessories','Shoes, bags, belts, jewellery','durable')]),
 ('Eating out & social','other',[
  ('Restaurant meals','Lunch or dinner in a restaurant','none'),
  ('Takeaway & delivery','Delivered meals, takeaway food','none'),
  ('Coffee & snacks out','Cafe drinks, a snack bought to eat out','none'),
  ('Drinks, parties & entertainment','Drinks out, party spending, tickets, alcohol at home','none or count')]),
 ('Too Good To Go','grocery',[
  ('Too Good To Go bags','Surprise bags and other Too Good To Go purchases','bundle')]),
 ('Subscriptions','other',[
  ('AI & software','ChatGPT, other AI tools, software subscriptions','none'),
  ('Media & storage','Streaming, music, cloud storage','none'),
  ('Learning & memberships','Learning platforms, clubs, other memberships','none')]),
 ('Transport & cycling','other',[
  ('Travel & fares','Bus, train, taxi, travel tickets','none'),
  ('Bike & cycling equipment','Bicycle, helmet, lights, lock','durable'),
  ('Repairs & maintenance','Bike repair, servicing, replacement parts','none or durable')]),
 ('Home, tech & longer-lasting purchases','other',[
  ('Kitchen equipment','Frying pan, kettle, storage containers','durable'),
  ('Home & furnishings','Bedding, lamps, furniture, home accessories','durable'),
  ('Electronics & accessories','Devices, chargers, headphones','durable'),
  ('Study & stationery','Books, notebooks, pens, course supplies','durable or count')]),
 ('Other & to review','other',[
  ('Gifts & giving','Presents, donations, celebrations','none or durable'),
  ('Fees, delivery & adjustments','Delivery charges and receipt-level charges','none'),
  ('Uncategorised','New items waiting for your choice','none'),
  ('Opening spending','The existing £125 before 10 September summary','none')])
]
categories=[]
for group,pool,items in groups:
    for name,examples,mode in items:
        categories.append(dict(id=re.sub('[^a-z0-9]+','-',name.lower()).strip('-'),group=group,name=name,examples=examples,budget_pool='unresolved' if name=='Uncategorised' else pool,suggested_tracking=mode))
assert len({c['id'] for c in categories})==len(categories)
with (OUT/'planning/category-taxonomy.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=list(categories[0]));w.writeheader();w.writerows(categories)
(OUT/'planning/category-taxonomy.json').write_text(json.dumps({'status':'Proposed; not installed in the app','categories':categories},indent=2,ensure_ascii=False),encoding='utf-8')

sources=[
 ('Tesco — Food Cupboard','https://www.tesco.com/shop/en-GB/category/food-cupboard','Separates pantry staples, cooking ingredients, sauces, rice/pasta and other departments. Supports separating fresh shopping from longer-lasting pantry purchases.'),
 ('Lidl — Cleaning & Household','https://www.lidl.co.uk/c/cleaning-household/s10023353','Presents cleaning and household ranges together. Supports dedicated household categories rather than treating every supermarket purchase as food.'),
 ('ALDI — Sitemap','https://www.aldi.co.uk/SiteMap.html','Lists fresh food, food cupboard, chilled food, home/cleaning and health/beauty. Useful coverage check for the proposed category list.'),
 ('Morrisons — All products','https://groceries.morrisons.com/categories','Distinguishes toiletries/beauty, health/medicines, household and food departments. Supports separate personal-care and medicine spending.'),
 ('AnyList — Meal planning','https://www.anylist.com/meal-planning','Connects recipes on a calendar to an ingredient shopping list; also allows meal notes. Adopt this connection, while retaining the planner’s exact stock allocations.'),
 ('Pantry Check','https://pantrycheck.com/','Describes per-item expiry tracking, categories/locations and restock suggestions. Adopt stock-aware planning with user-entered dates; do not invent food lifetimes.'),
 ('YNAB — Goal tracking','https://www.ynab.com/features/goal-tracking','Uses targets, progress and flexible timing. Adopt clear saving intentions and progress without claiming that a target means money has actually been saved.')
]

briefs=[]
def brief(id,title,section,priority,ratio,subject,purpose,extra=''):
    subject=subject.replace('unbranded ','').replace('without writing','with optional handwritten words')
    scene=section=='Section banners' or id in ['S01','S06']
    composition=('A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. ' if scene else 'Keep one clear main subject, with supporting details and enough breathing room to work in a small card. ')
    prompt=(f'Generate an image for my personal budget, shopping and meal-planning app. Subject: {subject}. '
       'I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. '
       f'This image will support {purpose}. Target aspect ratio: {ratio}. '+composition+
       'Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. '+extra)
    deliverable='One image file for this subject; variations are optional.'
    if id=='S01': deliverable=f'Already supplied: {sample_count} sample images. Choose a favourite; generating more is optional.';priority='Already supplied'
    elif id=='S02': deliverable='Three sample images: fresh groceries, household cleaning and personal care, in one coherent style.';priority='Suggested next'
    elif id=='S03': deliverable='Two sample images: one oil or soy-sauce bottle, and one egg or chicken-portion card.';priority='Suggested next'
    elif id=='S04': deliverable='One or two meal pictures for recipes you would actually like to use.';priority='Suggested next'
    elif id=='S05': deliverable='Optional: one recipe infographic image. An existing infographic you like is also useful.';priority='Optional later'
    elif id=='S06': deliverable='Optional: one money-themed sample image. Your existing scenes already provide mood references.';priority='Optional later'
    elif id=='S07': deliverable='Optional: one four-panel oil-bottle study, or four separate state images.';priority='Optional later'
    elif id=='S08': deliverable='No new image needed. Codex checks the supplied images at small sizes and on different backgrounds.';priority='Codex task'
    slug=id.lower()+'-'+re.sub('[^a-z0-9]+','-',title.lower()).strip('-')
    folder='assets/recipes/inbox/' if id=='S05' or section=='Infographic concepts' else f'assets/images/generated/{slug}/'
    briefs.append(dict(id=id,title=title,section=section,priority=priority,ratio=ratio,purpose=purpose,deliverable=deliverable,folder=folder,reference='Attach the sampler variant you prefer, such as v0503; no final style has been locked.',filename=slug+'-v01.png',prompt=prompt))

styles=[
 ('Visual direction sampler','a cosy Cardiff-inspired scene connecting groceries, meal planning, shopping, subscriptions and saving','choosing the overall look before generating an asset library','You already have useful samples; run this only if you want another direction. Keep the charming branded bags, printed details and screens if they suit the scene.'),
 ('Category illustration family','fresh groceries, household cleaning and personal care as three related category illustrations','choosing a recognisable family of category artwork','Generate the three subjects as separate images with a consistent viewpoint and visual weight. Branded packaging is welcome if I want it; a neutral version is another option.'),
 ('Ingredient card style','soy sauce, eggs, chicken portions and rice paper as individual ingredient-card studies','choosing between photography-like food, illustration and stylised objects','Try distinct treatments in separate images. Leave enough margin for rounded card crops.'),
 ('Recipe cover style','an adaptable bowl meal made with rice or noodles and vegetables','choosing recipe cover artwork','Compare a top-down composition and an angled composition. A recipe title or handwritten annotation is welcome if I like it.'),
 ('Recipe infographic style','a simple meal moving from ingredients to preparation to plated food','choosing the visual language for recipe infographics','Explore panel rhythm and pictorial steps. Include titles, ingredients and steps from the recipe I provide. Ask for missing recipe details instead of inventing quantities, nutritional values or cooking safety instructions.'),
 ('Budget artwork mood','a British-pound coin motif, a small jar and a growing collection of coins','choosing calm, encouraging money artwork','Keep the mood practical and friendly, without luxury imagery or exaggerated financial success.'),
 ('Stock lifecycle visuals','one unbranded oil bottle unopened, opened, partly full and nearly empty','choosing a visual aid for long-lasting supplies','The app will show the real status as text. Do not imply that an estimated illustration measures the exact contents.'),
 ('Accessibility and crop trial','the selected category illustration style applied to food, household supplies and a bicycle','checking readability on light and dark surfaces and small cards','Make separate variants with clear silhouettes and sufficient contrast. The artwork must remain understandable without relying only on colour.')
]
for n,(title,subject,purpose,extra) in enumerate(styles,1):brief(f'S{n:02}',title,'Sample pictures — choose a look','Optional','4:3' if n==4 else '2:3' if n==5 else '1:1',subject,purpose,extra)
briefs[-1].update(folder='',filename='',reference='Codex will check your existing images after you choose a direction.',prompt='No image generation needed. Codex will check crop, contrast and readability using your supplied files.')
category_art=[('Fresh food','a small collection of fresh vegetables, an egg and milk'),('Pantry staples','rice, pasta and a jar of pantry ingredients'),('Cooking oils and sauces','an oil bottle and two distinct sauce bottles'),('Frozen food','a reusable freezer container with frozen vegetables'),('Snacks and drinks','a modest snack and a cup'),('Household supplies','toilet roll, a spray bottle and laundry capsules'),('Dishwashing and laundry','washing-up liquid, a sponge and a detergent container'),('Personal care','hand wash, shampoo and a small cream jar'),('Beauty and skincare','a moisturiser jar and simple cosmetics'),('Health and first aid','a plain medicine box and a plaster, without dosage text'),('Clothes and accessories','a folded top, a shoe and a bag'),('Eating out and social','a cafe cup, a plate and two glasses'),('Too Good To Go','an unbranded surprise food bag with varied food peeking out'),('Subscriptions and AI tools','a small recurring-calendar motif and an abstract software-tool symbol'),('Transport and cycling','a bicycle with a helmet'),('Home and longer-lasting purchases','a small lamp, a cooking pan and headphones')]
for n,(title,subject) in enumerate(category_art,1):brief(f'C{n:02}',title,'Category artwork','After style choice','1:1',subject,'a shopping or spending category card','Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.')
items=[('Sunflower oil','one unbranded sunflower oil bottle'),('Soy sauces','two unbranded bottles suggesting different soy sauces'),('Rice paper','a small stack of round rice-paper sheets'),('Eggs','a half-dozen eggs in a simple carton'),('Milk and oat drink','an unbranded milk bottle and an oat-drink carton'),('Bread and bakery','bread slices and a small bakery roll'),('Chicken portions','two clearly separated uncooked chicken portions on a plain tray'),('Rice and pasta','dry rice and pasta in simple storage jars'),('Toilet rolls','a small set of toilet rolls'),('Laundry capsules','a sealed container of laundry capsules, presented as a cleaning product'),('Hand wash and washing-up liquid','two clearly different unbranded pump or squeeze bottles'),('Shampoo and conditioner','two unbranded hair-care bottles')]
for n,(title,subject) in enumerate(items,1):brief(f'I{n:02}',title,'Item artwork','Optional later','1:1',subject,'an optional stock card image','This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.')
recipes=[('Rice-paper meal','a rice-paper meal with an adaptable vegetable filling'),('Pasta meal','a simple pasta plate with sauce and vegetables'),('Noodle bowl','a noodle bowl with greens and an optional protein'),('Egg-based breakfast','an egg-based breakfast with toast'),('Rice bowl','a rice bowl with vegetables and an optional protein'),('Tuna or bean lunch','a simple lunch bowl with either tuna or beans, chosen before generation'),('Tray meal','a simple oven-tray meal with vegetables and an optional protein'),('Leftovers lunch','an appetising lunch assembled from a small set of leftovers')]
for n,(title,subject) in enumerate(recipes,1):brief(f'R{n:02}',title,'Recipe covers','After recipe choice','4:3',subject,'a recipe cover in the future recipe library','Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.')
budget_art=[('Monthly overview','a calm arrangement of a notebook, a few coins and a calendar'),('Savings goal','a modest savings jar with visible progress'),('Upcoming bills','a small calendar and a neutral recurring-payment motif'),('Shopping list ready','a shopping bag and a simple checklist motif without writing'),('Nothing needed','a neatly stocked shelf with a calm feeling of having enough'),('Use what you have','a small selection of pantry ingredients becoming one meal'),('Goal reached','a small, restrained celebration around a savings jar'),('Category to review','an unlabelled item beside a gentle question-mark motif')]
for n,(title,subject) in enumerate(budget_art,1):brief(f'B{n:02}',title,'Budget and empty states','Optional later','4:3',subject,'a supporting budget or empty-state illustration','A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.')
infographics=[('A week from the pantry','choosing existing ingredients, choosing meals, then listing missing items'),('Opening a long-lasting item','an unopened bottle becoming an in-use bottle, then a low-stock bottle'),('Batch cooking and leftovers','one preparation session becoming several distinct meal containers'),('A mixed shopping trip','one receipt connected to food, cleaning and personal-care items'),('Too Good To Go unpacking','one surprise food bag becoming separate food items with a place to store them'),('Freezer portions','a larger food purchase divided into clearly separated portions and containers'),('A gentle weekly review','checking purchases, checking supplies, choosing meals and reviewing one saving goal'),('Compare pack sizes','two differently sized packages with space for app-rendered unit-price comparisons')]
for n,(title,subject) in enumerate(infographics,1):brief(f'F{n:02}',title,'Infographic concepts','After workflow approval','2:3',subject,'an optional illustrated explanation of an approved workflow','Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.')
heroes=[('Plan the week','an inviting table with a small shopping list, pantry ingredients and a calendar motif'),('Your pantry','a tidy realistic shelf with a manageable assortment of food'),('Your everyday essentials','a small organised collection of home and personal-care supplies'),('Save for what matters','a bicycle in the background and a modest savings jar in the foreground')]
for n,(title,subject) in enumerate(heroes,1):brief(f'H{n:02}',title,'Section banners','Lowest priority','16:9',subject,'an optional wide section banner','Keep one side quiet for a heading rendered by the app. The app must still work well without this banner.')
assert len(briefs)==64
(OUT/'planning/image-briefs.json').write_text(json.dumps(briefs,ensure_ascii=False,indent=2),encoding='utf-8')
with (OUT/'planning/image-manifest.csv').open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=['id','title','section','priority','ratio','purpose','deliverable','folder','reference','filename']);w.writeheader();w.writerows({k:v for k,v in b.items() if k!='prompt'} for b in briefs)

plan='''# Budget Management — functional upgrade plan

Status: **proposal for review; no feature implementation in this stage**. Prepared 16 September 2026. The current app is copied into the permanent folder and remains usable. The agreed receipt model is **one shopping trip with item-level details**.

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

Keep a loopback-only local app and the existing URL while the upgrade is implemented. The primary project is `C:\\Users\\ctrlz\\Documents\\BudgetManagement\\app`. Keep the original copy and a dated data export for rollback. No cloud publication is part of this plan.

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
'''

research='''# Research notes and design decisions

Reviewed 16 September 2026. These are first-party product/category references. Store pages were used to check category coverage, not to build a live product catalogue or compare current prices. No accounts, carts or purchases were used. Amazon remains a merchant/channel example; its catalogue was not needed to define the taxonomy.

'''
for title,url,note in sources:research+=f'## [{title}]({url})\n\n{note}\n\n'
research+='''## Our design choices

The separate category, merchant and stock-mode model is a recommendation for this app. The precise level-tracking flow, receipt accounting, preservation of original allocations and Too Good To Go unpacking are proposed designs, not claims that all researched apps implement them. Features were reviewed from published descriptions, not by hands-on testing of those services. Availability, offers and prices can change; none are imported as permanent facts.

The useful connection is a recipe-to-shopping workflow plus stock-aware restocking and visible financial intentions. Keep logging effort low: approximate levels are better than fake precision for a sauce bottle, while exact counts remain useful for eggs and capsules.
'''

images='''# Images — what to make and what to send

**Give me image files. You do not need to write prompts or development documentation.** I provide the prompts, turn your preferences into design notes, and implement the interface. Your optional written feedback can be as simple as “I like the paper texture in this one.”

“Style exploration” meant **sample pictures to help us choose a look**. The page now calls these **Sample pictures — choose a look**. A sample can be a finished scene, a set of related objects or a recipe picture. It does not have to be a formal style guide.

## Your existing images already count

Your S01 folder already contains __SAMPLE_COUNT__ images. S01 is marked **Already supplied**. You can stop generating S01 now unless you want another option. No image has been moved, renamed or declared approved on your behalf.

Suggested reference: **s01-visual-direction-sampler-v0503.png** — tactile paper collage, sage green, cream, warm brown, a cosy Cardiff setting and recognisable shopping details. **v0502** is a warmer photographic alternative. These are recommendations; your final choice remains open. The gallery in START HERE shows the actual files.

## The next small batch

| Brief | What to give me | Needed now? |
|---|---|---|
| S01 — Overall look | Already supplied. Tell me which existing variant you prefer. | No more images needed. |
| S02 — Category family | Three sample images: fresh groceries, household cleaning and personal care. | Suggested next. |
| S03 — Item cards | Two sample images: an oil/soy-sauce bottle and eggs/chicken portions. | Suggested next. |
| S04 — Recipe covers | One or two meal pictures for recipes you actually want. | Suggested next. |
| S05 — Infographics | An existing recipe infographic you like, or one new example. | Optional. |
| S06 — Money mood | One money-themed picture, if you want to explore this separately. | Optional; existing scenes already help. |
| S07 — Bottle states | One four-panel picture or four images: unopened, in use, low and finished. | Optional. |
| S08 — Small-size checks | Nothing to generate. Codex tests crops, contrast and readability using your supplied images. | My task. |

You do not have to finish all sample briefs before development. The 64-entry library is a menu of future possibilities. Generate the subjects you care about first.

## How to use a prompt

1. Copy a prompt from the page into ChatGPT.
2. Attach whichever existing sampler image you want it to follow. The prompt suggests v0503, but you can choose any variant or ask for a change.
3. Ask ChatGPT to generate the image. For example: “Use this reference, but make three separate category pictures for groceries, cleaning and personal care.”
4. Save the generated pictures under `assets/images/generated/`, using a folder for the brief. Your existing nested version folders are fine. Alternatively, put files in `assets/images/inbox/`.
5. Tell me the folder path and, if useful, your favourite filename or one thing to change. I will review the images and write the design documentation.

Example: `assets/images/generated/s02-category-illustration-family/s02-category-illustration-family-v01/s02-groceries-v0101.png`. Name the companion images `s02-cleaning-v0101.png` and `s02-personal-care-v0101.png`. You do not need to reorganise the S01 files you already made. Recipe infographics can go in `assets/recipes/inbox/`.

## The details you like are welcome

**Merchant logos, branded shopping bags, product labels, handwritten notes, receipts, app screens on a laptop, prices, dates and example balances can all appear in decorative images.** They help tell the story in your current pictures. A small personal signature or watermark is optional if you like it. There is no blanket ban on these details in the revised prompts.

| Image use | What works well |
|---|---|
| Welcome scene or wide banner | A rich Cardiff room, plants, shopping bags, a bike, receipts, screens and printed details, like your S01 samples. |
| Category or item card | A clear main subject with some character; branding and labels can stay. A simpler composition makes the subject easier to recognise at a small size. |
| Recipe picture or infographic | A title, ingredient names and step labels are welcome. Use the real recipe text you provide; keep an editable text version for the working app. |
| Live balance, price comparison, shopping checkbox or navigation button | Implemented as real interface text and controls. A number printed on an illustrated receipt remains part of the picture and never changes your budget. |

The difference is about how the image will be used. Decorative screen content is a picture; the actual app needs clickable controls and up-to-date values. You do not need to remove the cute details from your existing pictures.

## Files and quality

- Keep the original image files. PNG, JPEG and WebP are all useful. Transparency is optional; your warm backgrounds can remain.
- Square images suit categories and items; 4:3 suits recipe covers; 16:9 suits banners; 2:3 suits longer infographics. Aim for roughly 1024 pixels or more on the short side where practical. We can decide final crops later.
- Use brief IDs and variant names so we can discuss a specific file. The manifest has a **What to give me** field and a suggested folder for every entry.
- Generated packaging is a visual reference. Product size, stock levels and actual costs come from your entries, not from text inside the picture.
- For recipe infographics, keep the recipe text if available. I can help turn it into structured ingredients and steps; you only need to review any uncertain details.
- This gallery lists files found when the page was rebuilt. Adding files to a folder does not automatically install them into the current app or refresh the gallery. Tell me when a new batch is ready.

## Optional feedback — one sentence is enough

“Use v0503's texture, but keep v0502's lighting.”

“I like this category set; make the cleaning bottle easier to recognise.”

“Please use this infographic style for my recipes.”

## Prompt library

'''.replace('__SAMPLE_COUNT__',str(sample_count))
for b in briefs:
    images+=f"### {b['id']} — {b['title']}\n\n{b['section']} · {b['priority']} · {b['ratio']}\n\n**What to give me:** {b['deliverable']}\n\nSuggested folder: `{b['folder']}`\n\nSuggested filename: `{b['filename']}`\n\n{b['reference']}\n\n"
    images+=("No generation prompt needed. I will test the images you supply.\n\n" if b['id']=='S08' else b['prompt']+'\n\n')

(OUT/'planning/01-functional-upgrade-plan.md').write_text(plan,encoding='utf-8')
(OUT/'planning/02-research-notes.md').write_text(research,encoding='utf-8')
(OUT/'planning/03-image-briefs.md').write_text(images,encoding='utf-8')
(OUT/'data/README.md').write_text('''# Data status

Reserved for the proposed local-data implementation. The current app still saves live entries in browser localStorage at http://127.0.0.1:47831/.

The relocation includes a point-in-time JSON export in ../backups. It is not an automatic live database. Do not assume copying this empty data folder backs up later browser edits. Use Backup & plan → Download backup until local file persistence is implemented.
''',encoding='utf-8')
(OUT/'assets/images/README.md').write_text('''# Image handoff

Give me image files; no prompts or development documentation are required from you. S01 already has useful images. Choose a favourite and then try S02 (three category samples), S03 (two item samples) or S04 (one or two recipe pictures). S05–S07 are optional; S08 is a check for Codex, not an image assignment.

Keep your existing generated/<brief>/<version>/ folder structure, or put new pictures in inbox. Recipe infographics belong in ../recipes/inbox. Tell me the path and your favourite filename. I will review them and write the design notes.

Logos, product labels, handwritten words, receipts, screens and example numbers are welcome in decorative scenes. Actual app balances and controls will be implemented separately so they remain editable.

See ../../planning/image-manifest.csv and ../../planning/03-image-briefs.md. The current app does not yet install images automatically. The review gallery is a snapshot of files present when it was rebuilt.
''',encoding='utf-8')
(OUT/'README.md').write_text('''# BudgetManagement — your permanent project folder

Open **START HERE.html** for the upgrade plan, category examples and a searchable library of 64 flexible image prompts. This stage prepares the plan and image briefs; the functional upgrade has not been implemented.

Double-click **Start Budget Management.cmd** to run the existing planner. It uses http://127.0.0.1:47831/ and the same browser storage as before. Use the same browser/profile for the same saved entries. **Stop Budget Management.cmd** stops the local server.

## What is here

- `app/`: working copy of the current local app, source, tests and original launchers.
- `planning/`: detailed functional plan, first-party research, category CSV/JSON, image prompts and manifest.
- `assets/images/generated/`: your existing image batches and version folders; `inbox/`: a simple alternative for new candidates; `approved/`: chosen assets after review.
- `assets/recipes/inbox/`: existing recipe infographics you want to supply.
- `backups/`: exported browser-data snapshots. They are snapshots, not live storage.
- `data/`: reserved for the planned future local database.
- `archive/original-codex-project/`: preserved copy of the original Codex workspace, including original artifacts and source history.
- `archive/copy-manifest.json`: copy verification record.

The original source at `C:\\Users\\ctrlz\\Documents\\Codex\\2026-09-12\\do-you-have-the-latest-budget` remains intact. Continue future development in this folder. The app includes historical cloud-hosting metadata for provenance; this relocation does not publish or sync the app to a cloud service.

## Current storage limitation

The current live entries still belong to the browser, not the app folder. A separate JSON backup is exported during relocation. Continue using Backup & plan → Download backup for new changes; future local-file persistence is phase 1 of the proposed upgrade. Do not use the archived app as another editing copy.

## Next step

Your S01 pictures already count as style samples. Choose a favourite, then try S02–S04 if you want category, item or recipe examples. Send image files and optional short feedback; Codex supplies prompts and development documentation. Decorative logos, labels, receipts and example screen content are welcome. Implement features only after this review stage.
''',encoding='utf-8')
(OUT/'Start Budget Management.cmd').write_text('@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\\launch.ps1"\r\nif errorlevel 1 pause\r\n',encoding='ascii')
(OUT/'Stop Budget Management.cmd').write_text('@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\\launch.ps1" -Stop\r\nif errorlevel 1 pause\r\n',encoding='ascii')

# A dependency-free review portal: no network assets, no application data writes.
def render_md(text):
    out=[]; lines=text.splitlines(); i=0; in_list=False
    while i<len(lines):
        line=lines[i]
        if line.startswith('|'):
            if in_list:out.append('</ul>');in_list=False
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                if not re.match(r'^\|[- :|]+\|$',lines[i]):rows.append([x.strip() for x in lines[i].strip('|').split('|')])
                i+=1
            out.append('<div class="table-wrap"><table>'+''.join('<tr>'+''.join(('<th>' if n==0 else '<td>')+inline(c)+('</th>' if n==0 else '</td>') for c in row)+'</tr>' for n,row in enumerate(rows))+'</table></div>');continue
        if line.startswith('- ') or re.match(r'^\d+\. ',line):
            if not in_list:out.append('<ul>');in_list=True
            out.append('<li>'+inline(re.sub(r'^(?:- |\d+\. )','',line))+'</li>')
        else:
            if in_list:out.append('</ul>');in_list=False
            if line.startswith('#'):
                level=min(len(line)-len(line.lstrip('#')),3)
                out.append(f'<h{level}>'+inline(line.lstrip('# '))+f'</h{level}>')
            elif line.strip():out.append('<p>'+inline(line)+'</p>')
        i+=1
    if in_list:out.append('</ul>')
    return '\n'.join(out)
def inline(text):
    text=html.escape(text)
    text=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<a href="\2" target="_blank" rel="noopener">\1</a>',text)
    text=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',text)
    return re.sub(r'`([^`]+)`',r'<code>\1</code>',text)

categories_html=''.join('<tr>'+''.join('<td>'+html.escape(c[k])+'</td>' for k in ['group','name','examples','budget_pool','suggested_tracking'])+'</tr>' for c in categories)
prompt_cards=''
for b in briefs:
    fields=f'<div class="deliverable"><strong>What to give me</strong><p>{html.escape(b["deliverable"])}</p></div>'
    if b['folder']: fields+=f'<p class="muted"><strong>Save in:</strong> <code>{html.escape(b["folder"])}</code><br>Version subfolders are welcome.</p>'
    prompt_part='' if b['id']=='S08' else f'<details><summary>{"Optional: generate another sample" if b["id"]=="S01" else "Copy this prompt into ChatGPT"}</summary><p class="muted">{html.escape(b["reference"])}</p><textarea aria-label="Prompt {b["id"]}" readonly>{html.escape(b["prompt"])}</textarea><button class="copy">Copy prompt</button><small>Example filename: {html.escape(b["filename"])}</small></details>'
    prompt_cards+=f'<article class="prompt" data-id="{b["id"]}" data-section="{html.escape(b["section"])}"><div class="card-top"><span class="tag">{b["id"]} · {html.escape(b["priority"])}</span><span class="muted">{html.escape(b["ratio"])}</span></div><h3>{html.escape(b["title"])}</h3>{fields}{prompt_part}</article>'

def sample_figure(path,caption,featured=False):
    url=quote(path.relative_to(ASSET_ROOT).as_posix())
    label=path.stem.rsplit('-',1)[-1]
    return f'<figure class="sample {"featured" if featured else ""}"><a href="{url}" target="_blank" rel="noopener"><img src="{url}" loading="lazy" width="1200" height="1200" alt="Your S01 visual sample {html.escape(label)}"></a><figcaption><strong>{html.escape(label)}</strong> · {html.escape(caption)}<small>{html.escape(path.name)}</small></figcaption></figure>'
featured_gallery=''
for suffix,caption in [('v0503.png','Suggested reference: paper collage, sage, cream and warm brown. Your final choice is still open.'),('v0502.png','Alternative reference: warm evening light and a photographic room scene.')]:
    match=next((p for p in sample_paths if p.name.endswith(suffix)),None)
    if match:featured_gallery+=sample_figure(match,caption,True)
full_gallery=''.join(sample_figure(p,'Existing sample — click to inspect the original.') for p in sample_paths)
portal='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Budget Management · Upgrade plan</title><style>
:root{--ink:#182b2a;--muted:#657773;--accent:#21634f;--paper:#f5f4ed;--line:#dce2d9}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.65}a{color:#24664e}button,input,select,textarea{font:inherit}button{cursor:pointer}header{background:#173f34;color:#fff;padding:44px max(5vw,20px)}header p{max-width:800px;color:#d9e6dc}header h1{font-size:clamp(2rem,4vw,3.4rem);letter-spacing:-.045em;line-height:1.1;margin:12px 0}.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-size:.76rem;font-weight:700;color:#cce6a1}.status{display:inline-block;background:#eaf0d7;color:#314d33;padding:6px 13px;border-radius:20px;font-size:.8rem;font-weight:650}nav{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:0;background:#f5f4edf5;backdrop-filter:blur(8px);padding:13px max(5vw,20px);border-bottom:1px solid var(--line);z-index:3}nav button{border:0;border-radius:8px;padding:10px 16px;background:transparent;color:#526860;font-weight:600}nav button.active{background:#dce8df;color:#183f30}main{max-width:1250px;padding:32px 24px 70px;margin:auto}.panel[hidden]{display:none}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card,.prompt{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px}.card h3,.prompt h3{line-height:1.3;margin:13px 0}.big{font-size:2rem;font-weight:700;letter-spacing:-.04em;color:var(--accent)}.muted{color:var(--muted);font-size:.88rem}h2{font-size:1.6rem;line-height:1.3;letter-spacing:-.025em;margin-top:36px}h3{font-size:1.1rem}p{max-width:950px}li{margin:8px 0}.flow{padding:23px;background:#e8ecdf;border-radius:12px;font-weight:600;margin:24px 0;word-spacing:4px}.callout{border-left:4px solid #d2aa53;background:#fff8e7;padding:18px 23px;margin:24px 0}.reading{background:#fff;padding:clamp(20px,4vw,48px);border:1px solid var(--line);border-radius:14px}.reading h1{font-size:1.9rem}.reading h2{border-top:1px solid var(--line);padding-top:28px}.table-wrap{overflow:auto;max-width:100%;margin:22px 0}table{border-collapse:collapse;width:100%;font-size:.88rem;text-align:left}th,td{padding:13px 14px;border:1px solid var(--line);vertical-align:top}th{background:#eaf0e9;color:#335345}td{min-width:150px}code{font-family:Consolas,monospace;font-size:.87em;overflow-wrap:anywhere;background:#f1f3ef;padding:2px 4px;border-radius:3px}.toolbar{display:flex;gap:12px;margin:24px 0;flex-wrap:wrap}.toolbar input{flex:1;min-width:200px}.toolbar input,.toolbar select{padding:11px 14px;border:1px solid #b9c8bc;border-radius:8px;background:#fff;color:var(--ink)}.prompt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.tag{color:#24664e;background:#e8f0e8;padding:4px 8px;border-radius:6px;font-size:.75rem;font-weight:650}.prompt textarea{width:100%;height:230px;resize:vertical;border:1px solid var(--line);border-radius:8px;padding:13px;background:#f9faf7;font-size:.88rem;line-height:1.6;margin:14px 0 8px}.prompt summary{color:#23684e;cursor:pointer;font-weight:600}.copy{padding:8px 14px;background:var(--accent);color:#fff;border:0;border-radius:6px}.prompt small{display:block;overflow-wrap:anywhere;margin-top:10px;color:var(--muted)}.links{display:flex;gap:18px;flex-wrap:wrap}.folder{white-space:pre-wrap;background:#173f34;color:#dfedde;border-radius:12px;padding:24px;font:14px/1.9 Consolas,monospace;overflow-wrap:anywhere}.notice{font-size:.85rem;color:#637366}.step{color:var(--accent);font-weight:700}button:focus-visible,a:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #daac47;outline-offset:3px}.prompt[hidden]{display:none}@media(max-width:760px){.grid,.prompt-grid{grid-template-columns:1fr}header{padding-top:28px}nav{position:relative;padding:12px}nav button{padding:9px 11px;font-size:.87rem}main{padding:20px 14px}.reading{padding:21px}.card,.prompt{padding:20px}td{min-width:140px}}@media print{nav,.toolbar,.copy{display:none}.panel[hidden]{display:block}header{color:#000;background:white}.reading{border:0;padding:0}.prompt-grid{display:block}.prompt{break-inside:avoid}.prompt details{display:block}body{background:white}}
</style></head><body><header><div class="eyebrow">Your next chapter · local and personal</div><h1>Budget Management</h1><p>A connected plan for your shopping, supplies, meals and money — with enough detail to help, and less effort to keep it up to date.</p><span class="status">Plan & image briefs first · features not yet implemented</span></header><nav aria-label="Review sections"><button class="active" data-panel="overview">Start here</button><button data-panel="plan">Functional plan</button><button data-panel="categories">Categories</button><button data-panel="images">Image workshop</button><button data-panel="research">Research</button><button data-panel="files">Folder & next steps</button></nav><main>
<section class="panel" id="overview"><div class="grid"><article class="card"><div class="big">One receipt</div><h3>Every item finds its place</h3><p>Milk, oil, toilet rolls and shampoo can share a receipt while keeping their own categories and stock behaviour.</p></article><article class="card"><div class="big">Use over time</div><h3>An oil bottle is not one meal</h3><p>Track bottles by approximate level or exact volume. Keep exact counts for eggs, portions, rolls and capsules.</p></article><article class="card"><div class="big">Save with a plan</div><h3>See the next choice clearly</h3><p>Check planned purchases, upcoming subscriptions, pantry meals and saving intentions before spending.</p></article></div><div class="flow">Check stock → Plan meals & purchases → Shop → Record one receipt → Use & restock → Review</div><h2>The first usable upgrade</h2><p>Start with dependable local saving, editable categories and items, shopping lists, itemised receipts and sensible stock tracking. Then add recipes, ingredient reservations, leftovers, subscriptions and saving goals. Add approved images after choosing a coherent style.</p><div class="callout"><strong>Your budget rules stay intact.</strong> £225 per budgeted month, the £125 September opening record, grocery ceilings and overspending carry-forward. The original food and household allocations remain preserved.</div><h2>What to do now</h2><ol><li>Review the functional plan and categories. They are proposals, not features already in your app.</li><li>Try image briefs <strong>S01–S04</strong>. Pick a visual direction before generating the full library.</li><li>Put image candidates in <code>assets/images/inbox</code> and existing recipe infographics in <code>assets/recipes/inbox</code>.</li><li>Return with the changes you want. Implementation follows your review.</li></ol><p class="notice">This review portal is a standalone document. It does not access or change your live planner data.</p></section>
<section class="panel" id="plan" hidden><div class="links"><a href="planning/01-functional-upgrade-plan.md">Detailed plan (Markdown)</a></div><article class="reading">__PLAN__</article></section>
<section class="panel" id="categories" hidden><h2>Categories that match your real shopping</h2><p>__COUNT__ proposed categories in 13 groups. A shop or website is a separate field. Tracking mode is an item default, and you can change it.</p><div class="links"><a href="planning/category-taxonomy.csv">Download category CSV</a><a href="planning/category-taxonomy.json">Category JSON</a></div><div class="toolbar"><input id="category-search" aria-label="Search proposed categories" placeholder="Try oil, hand wash, AI, bike…"></div><p class="notice">Grocery/other indicates the proposed budget pool. Too Good To Go and snacks at home default to groceries for review; undecided items stay visibly uncategorised.</p><div class="table-wrap"><table id="category-table"><thead><tr><th>Group</th><th>Category</th><th>Your examples</th><th>Budget pool</th><th>Suggested tracking</th></tr></thead><tbody>__CATEGORIES__</tbody></table></div></section>
<section class="panel" id="images" hidden>
<h2>Images: what to make and send</h2><div class="callout"><strong>You supply pictures. I supply prompts, design notes and development.</strong><p>“Style exploration” simply meant a few sample pictures to help us choose a look. You do not need to write a document or invent your own prompts. A filename and a short comment are enough.</p></div>
<div class="grid"><article class="card"><span class="step">1 · Copy a prompt</span><h3>Use one of the briefs below</h3><p>Paste it into ChatGPT and attach your preferred existing sampler as a reference. Change any details you like.</p></article><article class="card"><span class="step">2 · Save the pictures</span><h3>Your current folders are fine</h3><p>Keep using <code>assets/images/generated/&lt;brief&gt;/&lt;version&gt;/</code>, or use <code>assets/images/inbox/</code>.</p></article><article class="card"><span class="step">3 · Tell me what you like</span><h3>No documentation required</h3><p>Send the folder path and an optional comment such as “this texture, but brighter.” I will turn that into implementation notes.</p></article></div>
<h2>S01 is already supplied</h2><p><strong>__SAMPLE_COUNT__ images found in your S01 folder.</strong> They already do the job of exploring the overall look. You can choose a favourite and move on; generating more is optional.</p><div class="reference-grid">__FEATURED_GALLERY__</div><p class="notice">v0503 is my suggested starting point, with v0502 as an alternative. Your final choice is still open. Click a picture to inspect its original file.</p><details class="gallery-details"><summary>See all __SAMPLE_COUNT__ existing S01 samples</summary><div class="sample-grid">__FULL_GALLERY__</div></details>
<h2>Keep the details that made your pictures cute</h2><p>Branded bags, product labels, receipts, handwritten words, laptop screens, prices, dates and example balances are welcome in decorative scenes. A small personal signature or watermark is optional too.</p><div class="table-wrap"><table><thead><tr><th>Where the image goes</th><th>What to include</th></tr></thead><tbody><tr><td>Welcome scene or banner</td><td>A rich Cardiff setting and the shopping, money and lifestyle details you liked in S01.</td></tr><tr><td>Category or item card</td><td>A recognisable main subject, with branding or labels if you like. Leave enough space for the object to read at a small size.</td></tr><tr><td>Recipe or infographic</td><td>Titles, ingredients and step labels from your chosen recipe. We will also keep editable recipe text in the app.</td></tr><tr><td>Actual balance or clickable control</td><td>Built as real app text and controls. The number on an illustrated receipt is decoration and never changes your budget.</td></tr></tbody></table></div>
<h2>Your next image options</h2><p><strong>S02:</strong> three category samples. <strong>S03:</strong> two item samples. <strong>S04:</strong> one or two recipe pictures. Pick whichever is useful first. S05–S07 are optional; S08 is a check for me to do with the images you supply.</p>
<details><summary>Full instructions, file examples and optional feedback</summary><article class="reading">__IMAGE_GUIDE__</article></details><div class="links"><a href="planning/03-image-briefs.md">Instructions &amp; prompts (Markdown)</a><a href="planning/image-manifest.csv">What to supply for each brief (CSV)</a></div>
<div class="toolbar"><input id="image-search" aria-label="Search image briefs" placeholder="Search subject or brief ID…"><select id="image-filter" aria-label="Filter image brief type"><option value="next">Suggested next: S02–S04</option><option value="all">All 64 briefs</option>Sample pictures — choose a look</option>Category artwork</option>Item artwork</option>Recipe covers</option>Budget and empty states</option>Infographic concepts</option>Section banners</select></div><p id="image-count" class="muted" aria-live="polite">3 of 64 briefs · suggested next batch</p><div class="prompt-grid">__PROMPTS__</div>
</section>
<section class="panel" id="research" hidden><article class="reading">__RESEARCH__</article></section>
<section class="panel" id="files" hidden><h2>Your permanent home</h2><p><code>C:\\Users\\ctrlz\\Documents\\BudgetManagement</code></p><div class="folder">BudgetManagement/
  START HERE.html
  Start Budget Management.cmd
  Stop Budget Management.cmd
  app/                         Current app + source + tests
  planning/                    Upgrade plan, taxonomy, image briefs
  assets/images/generated/     Keep your current image batches here
  assets/images/inbox/         Put candidate images here
  assets/images/approved/
  assets/recipes/inbox/        Put recipe infographics here
  backups/                    Exported saved-entry snapshots
  data/                       Reserved for future local data
  archive/original-codex-project/
  archive/copy-manifest.json</div><div class="callout"><strong>Current entries still live in the browser.</strong> The folder contains an exported snapshot, not automatic live storage. Keep using the same browser and <a href="http://127.0.0.1:47831/">local planner address</a>. Local file persistence is planned for the first implementation phase.</div><h3>Run the existing planner</h3><p>Double-click <strong>Start Budget Management.cmd</strong> in this folder. The local address remains <code>http://127.0.0.1:47831/</code>. Use the root launcher for this working copy, rather than a launcher in the archive.</p><h3>Review before implementation</h3><p>Confirmed: itemised receipts and plan/image briefs first. Suggested choices to review: Too Good To Go and at-home snack budget pools, long-lasting-item tracking, a saving intention, the budget horizon after February, and a visual direction.</p><p class="notice">The original Codex folder is retained. Historical cloud metadata is archived for provenance; no cloud publication or sync is part of this relocation.</p></section>
</main><script>
function openPanel(id){if(!document.getElementById(id)?.classList.contains('panel'))return;document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.panel===id);b.setAttribute('aria-pressed',String(b.dataset.panel===id))});document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==id);window.scrollTo({top:0,behavior:'instant'})}
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>openPanel(button.dataset.panel)));
if(location.hash)openPanel(location.hash.slice(1));
document.querySelector('#category-search').addEventListener('input',event=>{const term=event.target.value.toLowerCase();document.querySelectorAll('#category-table tbody tr').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(term))});
function filterImages(){const term=document.querySelector('#image-search').value.toLowerCase(),section=document.querySelector('#image-filter').value;let count=0;document.querySelectorAll('.prompt').forEach(card=>{const matches=section==='all'||(section==='next'?['S02','S03','S04'].includes(card.dataset.id):card.dataset.section===section);card.hidden=!(card.textContent.toLowerCase().includes(term)&&matches);if(!card.hidden)count++});document.querySelector('#image-count').textContent=count+' of 64 briefs'+(section==='next'?' · suggested next batch':'')}
document.querySelector('#image-search').addEventListener('input',filterImages);document.querySelector('#image-filter').addEventListener('change',filterImages);
filterImages();
document.querySelectorAll('.copy').forEach(button=>button.addEventListener('click',async()=>{const text=button.parentElement.querySelector('textarea');try{await navigator.clipboard.writeText(text.value);button.textContent='Copied'}catch(error){text.focus();text.select();button.textContent='Selected — press Ctrl+C'}setTimeout(()=>button.textContent='Copy prompt',2500)}));
</script></body></html>'''
portal=portal.replace('__PLAN__',render_md(plan)).replace('__COUNT__',str(len(categories))).replace('__CATEGORIES__',categories_html).replace('__PROMPTS__',prompt_cards).replace('__RESEARCH__',render_md(research)).replace('__IMAGE_GUIDE__',render_md(images.split('## Prompt library')[0]))
portal=portal.replace('__SAMPLE_COUNT__',str(sample_count)).replace('__FEATURED_GALLERY__',featured_gallery).replace('__FULL_GALLERY__',full_gallery)
portal=portal.replace('>Image workshop</button>','>Images: what to do</button>')
portal=portal.replace('Try image briefs <strong>S01–S04</strong>. Pick a visual direction before generating the full library.','Your <strong>S01 images are already supplied</strong>. Choose a favourite, then try S02–S04 for category, item or recipe samples. <button class="guide-link" data-panel="images">See your images &amp; next steps</button>')
portal=portal.replace('Put image candidates in <code>assets/images/inbox</code> and existing recipe infographics in <code>assets/recipes/inbox</code>.','Save pictures in your existing <code>assets/images/generated/</code> structure or in <code>assets/images/inbox/</code>. Send image files and optional short feedback; I write the prompts and development notes.')
portal=portal.replace('</style>','''.reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.sample{margin:0;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;min-width:0}.sample img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}.sample figcaption{padding:14px;font-size:.88rem;line-height:1.55}.sample small{display:block;color:var(--muted);font-size:.72rem;overflow-wrap:anywhere;margin-top:6px}.sample-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}.sample-grid figcaption{font-size:.75rem}.gallery-details{margin:20px 0}summary{cursor:pointer;color:var(--accent)}.deliverable{background:#f1f5ed;border-radius:8px;padding:13px 16px;margin:15px 0}.deliverable p{margin:5px 0 0;font-size:.9rem}.prompt .muted code{display:inline;overflow-wrap:anywhere}#images>.links{margin-top:20px}#images .prompt-grid{align-items:start}@media(max-width:760px){.reference-grid{grid-template-columns:1fr}.sample-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card-top{flex-wrap:wrap}}@media(max-width:390px){.sample-grid{grid-template-columns:1fr}}</style>''')
portal=portal.replace('</style>','.guide-link{border:0;border-bottom:1px solid currentColor;color:var(--accent);padding:0 2px;background:transparent;font-weight:600}</style>')
(OUT/'START HERE.html').write_text(portal,encoding='utf-8')
print(json.dumps({'categories':len(categories),'briefs':len(briefs),'files':len(list(OUT.rglob('*.*'))),'output':str(OUT)},indent=2))
