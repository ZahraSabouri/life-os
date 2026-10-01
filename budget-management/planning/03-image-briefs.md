# Images — what to make and what to send

**Give me image files. You do not need to write prompts or development documentation.** I provide the prompts, turn your preferences into design notes, and implement the interface. Your optional written feedback can be as simple as “I like the paper texture in this one.”

“Style exploration” meant **sample pictures to help us choose a look**. The page now calls these **Sample pictures — choose a look**. A sample can be a finished scene, a set of related objects or a recipe picture. It does not have to be a formal style guide.

## Your existing images already count

Your S01 folder already contains 24 images. S01 is marked **Already supplied**. You can stop generating S01 now unless you want another option. No image has been moved, renamed or declared approved on your behalf.

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

### S01 — Visual direction sampler

Sample pictures — choose a look · Already supplied · 1:1

**What to give me:** Already supplied: 24 sample images. Choose a favourite; generating more is optional.

Suggested folder: `assets/images/generated/s01-visual-direction-sampler/`

Suggested filename: `s01-visual-direction-sampler-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a cosy Cardiff-inspired scene connecting groceries, meal planning, shopping, subscriptions and saving. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing the overall look before generating an asset library. Target aspect ratio: 1:1. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. You already have useful samples; run this only if you want another direction. Keep the charming branded bags, printed details and screens if they suit the scene.

### S02 — Category illustration family

Sample pictures — choose a look · Suggested next · 1:1

**What to give me:** Three sample images: fresh groceries, household cleaning and personal care, in one coherent style.

Suggested folder: `assets/images/generated/s02-category-illustration-family/`

Suggested filename: `s02-category-illustration-family-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: fresh groceries, household cleaning and personal care as three related category illustrations. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing a recognisable family of category artwork. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Generate the three subjects as separate images with a consistent viewpoint and visual weight. Branded packaging is welcome if I want it; a neutral version is another option.

### S03 — Ingredient card style

Sample pictures — choose a look · Suggested next · 1:1

**What to give me:** Two sample images: one oil or soy-sauce bottle, and one egg or chicken-portion card.

Suggested folder: `assets/images/generated/s03-ingredient-card-style/`

Suggested filename: `s03-ingredient-card-style-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: soy sauce, eggs, chicken portions and rice paper as individual ingredient-card studies. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing between photography-like food, illustration and stylised objects. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Try distinct treatments in separate images. Leave enough margin for rounded card crops.

### S04 — Recipe cover style

Sample pictures — choose a look · Suggested next · 4:3

**What to give me:** One or two meal pictures for recipes you would actually like to use.

Suggested folder: `assets/images/generated/s04-recipe-cover-style/`

Suggested filename: `s04-recipe-cover-style-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an adaptable bowl meal made with rice or noodles and vegetables. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing recipe cover artwork. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Compare a top-down composition and an angled composition. A recipe title or handwritten annotation is welcome if I like it.

### S05 — Recipe infographic style

Sample pictures — choose a look · Optional later · 2:3

**What to give me:** Optional: one recipe infographic image. An existing infographic you like is also useful.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `s05-recipe-infographic-style-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a simple meal moving from ingredients to preparation to plated food. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing the visual language for recipe infographics. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Explore panel rhythm and pictorial steps. Include titles, ingredients and steps from the recipe I provide. Ask for missing recipe details instead of inventing quantities, nutritional values or cooking safety instructions.

### S06 — Budget artwork mood

Sample pictures — choose a look · Optional later · 1:1

**What to give me:** Optional: one money-themed sample image. Your existing scenes already provide mood references.

Suggested folder: `assets/images/generated/s06-budget-artwork-mood/`

Suggested filename: `s06-budget-artwork-mood-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a British-pound coin motif, a small jar and a growing collection of coins. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing calm, encouraging money artwork. Target aspect ratio: 1:1. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Keep the mood practical and friendly, without luxury imagery or exaggerated financial success.

### S07 — Stock lifecycle visuals

Sample pictures — choose a look · Optional later · 1:1

**What to give me:** Optional: one four-panel oil-bottle study, or four separate state images.

Suggested folder: `assets/images/generated/s07-stock-lifecycle-visuals/`

Suggested filename: `s07-stock-lifecycle-visuals-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: one oil bottle unopened, opened, partly full and nearly empty. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support choosing a visual aid for long-lasting supplies. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. The app will show the real status as text. Do not imply that an estimated illustration measures the exact contents.

### S08 — Accessibility and crop trial

Sample pictures — choose a look · Codex task · 1:1

**What to give me:** No new image needed. Codex checks the supplied images at small sizes and on different backgrounds.

Suggested folder: ``

Suggested filename: ``

Codex will check your existing images after you choose a direction.

No generation prompt needed. I will test the images you supply.

### C01 — Fresh food

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c01-fresh-food/`

Suggested filename: `c01-fresh-food-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small collection of fresh vegetables, an egg and milk. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C02 — Pantry staples

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c02-pantry-staples/`

Suggested filename: `c02-pantry-staples-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: rice, pasta and a jar of pantry ingredients. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C03 — Cooking oils and sauces

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c03-cooking-oils-and-sauces/`

Suggested filename: `c03-cooking-oils-and-sauces-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an oil bottle and two distinct sauce bottles. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C04 — Frozen food

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c04-frozen-food/`

Suggested filename: `c04-frozen-food-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a reusable freezer container with frozen vegetables. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C05 — Snacks and drinks

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c05-snacks-and-drinks/`

Suggested filename: `c05-snacks-and-drinks-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a modest snack and a cup. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C06 — Household supplies

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c06-household-supplies/`

Suggested filename: `c06-household-supplies-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: toilet roll, a spray bottle and laundry capsules. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C07 — Dishwashing and laundry

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c07-dishwashing-and-laundry/`

Suggested filename: `c07-dishwashing-and-laundry-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: washing-up liquid, a sponge and a detergent container. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C08 — Personal care

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c08-personal-care/`

Suggested filename: `c08-personal-care-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: hand wash, shampoo and a small cream jar. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C09 — Beauty and skincare

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c09-beauty-and-skincare/`

Suggested filename: `c09-beauty-and-skincare-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a moisturiser jar and simple cosmetics. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C10 — Health and first aid

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c10-health-and-first-aid/`

Suggested filename: `c10-health-and-first-aid-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a plain medicine box and a plaster, without dosage text. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C11 — Clothes and accessories

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c11-clothes-and-accessories/`

Suggested filename: `c11-clothes-and-accessories-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a folded top, a shoe and a bag. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C12 — Eating out and social

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c12-eating-out-and-social/`

Suggested filename: `c12-eating-out-and-social-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a cafe cup, a plate and two glasses. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C13 — Too Good To Go

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c13-too-good-to-go/`

Suggested filename: `c13-too-good-to-go-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an surprise food bag with varied food peeking out. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C14 — Subscriptions and AI tools

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c14-subscriptions-and-ai-tools/`

Suggested filename: `c14-subscriptions-and-ai-tools-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small recurring-calendar motif and an abstract software-tool symbol. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C15 — Transport and cycling

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c15-transport-and-cycling/`

Suggested filename: `c15-transport-and-cycling-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a bicycle with a helmet. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### C16 — Home and longer-lasting purchases

Category artwork · After style choice · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/c16-home-and-longer-lasting-purchases/`

Suggested filename: `c16-home-and-longer-lasting-purchases-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small lamp, a cooking pan and headphones. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a shopping or spending category card. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Use recognisable shopping details, including branded bags or product labels if useful. The category name will also appear as readable text in the app.

### I01 — Sunflower oil

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i01-sunflower-oil/`

Suggested filename: `i01-sunflower-oil-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: one sunflower oil bottle. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I02 — Soy sauces

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i02-soy-sauces/`

Suggested filename: `i02-soy-sauces-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: two bottles suggesting different soy sauces. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I03 — Rice paper

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i03-rice-paper/`

Suggested filename: `i03-rice-paper-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small stack of round rice-paper sheets. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I04 — Eggs

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i04-eggs/`

Suggested filename: `i04-eggs-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a half-dozen eggs in a simple carton. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I05 — Milk and oat drink

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i05-milk-and-oat-drink/`

Suggested filename: `i05-milk-and-oat-drink-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an milk bottle and an oat-drink carton. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I06 — Bread and bakery

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i06-bread-and-bakery/`

Suggested filename: `i06-bread-and-bakery-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: bread slices and a small bakery roll. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I07 — Chicken portions

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i07-chicken-portions/`

Suggested filename: `i07-chicken-portions-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: two clearly separated uncooked chicken portions on a plain tray. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I08 — Rice and pasta

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i08-rice-and-pasta/`

Suggested filename: `i08-rice-and-pasta-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: dry rice and pasta in simple storage jars. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I09 — Toilet rolls

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i09-toilet-rolls/`

Suggested filename: `i09-toilet-rolls-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small set of toilet rolls. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I10 — Laundry capsules

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i10-laundry-capsules/`

Suggested filename: `i10-laundry-capsules-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a sealed container of laundry capsules, presented as a cleaning product. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I11 — Hand wash and washing-up liquid

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i11-hand-wash-and-washing-up-liquid/`

Suggested filename: `i11-hand-wash-and-washing-up-liquid-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: two clearly different pump or squeeze bottles. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### I12 — Shampoo and conditioner

Item artwork · Optional later · 1:1

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/i12-shampoo-and-conditioner/`

Suggested filename: `i12-shampoo-and-conditioner-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: two hair-care bottles. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional stock card image. Target aspect ratio: 1:1. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. This is a generic illustration, not evidence of brand, package size or remaining quantity. Keep chemicals visually distinct from food.

### R01 — Rice-paper meal

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r01-rice-paper-meal/`

Suggested filename: `r01-rice-paper-meal-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a rice-paper meal with an adaptable vegetable filling. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R02 — Pasta meal

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r02-pasta-meal/`

Suggested filename: `r02-pasta-meal-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a simple pasta plate with sauce and vegetables. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R03 — Noodle bowl

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r03-noodle-bowl/`

Suggested filename: `r03-noodle-bowl-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a noodle bowl with greens and an optional protein. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R04 — Egg-based breakfast

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r04-egg-based-breakfast/`

Suggested filename: `r04-egg-based-breakfast-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an egg-based breakfast with toast. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R05 — Rice bowl

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r05-rice-bowl/`

Suggested filename: `r05-rice-bowl-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a rice bowl with vegetables and an optional protein. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R06 — Tuna or bean lunch

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r06-tuna-or-bean-lunch/`

Suggested filename: `r06-tuna-or-bean-lunch-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a simple lunch bowl with either tuna or beans, chosen before generation. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R07 — Tray meal

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r07-tray-meal/`

Suggested filename: `r07-tray-meal-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a simple oven-tray meal with vegetables and an optional protein. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### R08 — Leftovers lunch

Recipe covers · After recipe choice · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/r08-leftovers-lunch/`

Suggested filename: `r08-leftovers-lunch-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an appetising lunch assembled from a small set of leftovers. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a recipe cover in the future recipe library. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Before generating, let me choose the actual recipe and ingredients. Do not add ingredients that contradict that recipe. This artwork is illustrative, not a record of a cooked meal.

### B01 — Monthly overview

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b01-monthly-overview/`

Suggested filename: `b01-monthly-overview-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a calm arrangement of a notebook, a few coins and a calendar. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B02 — Savings goal

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b02-savings-goal/`

Suggested filename: `b02-savings-goal-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a modest savings jar with visible progress. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B03 — Upcoming bills

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b03-upcoming-bills/`

Suggested filename: `b03-upcoming-bills-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small calendar and a neutral recurring-payment motif. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B04 — Shopping list ready

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b04-shopping-list-ready/`

Suggested filename: `b04-shopping-list-ready-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a shopping bag and a simple checklist motif with optional handwritten words. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B05 — Nothing needed

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b05-nothing-needed/`

Suggested filename: `b05-nothing-needed-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a neatly stocked shelf with a calm feeling of having enough. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B06 — Use what you have

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b06-use-what-you-have/`

Suggested filename: `b06-use-what-you-have-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small selection of pantry ingredients becoming one meal. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B07 — Goal reached

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b07-goal-reached/`

Suggested filename: `b07-goal-reached-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small, restrained celebration around a savings jar. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### B08 — Category to review

Budget and empty states · Optional later · 4:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/b08-category-to-review/`

Suggested filename: `b08-category-to-review-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an unlabelled item beside a gentle question-mark motif. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support a supporting budget or empty-state illustration. Target aspect ratio: 4:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. A notebook, receipt or screen with example figures can decorate the scene. Keep the mood encouraging; actual financial messages will be rendered by the app.

### F01 — A week from the pantry

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f01-a-week-from-the-pantry-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: choosing existing ingredients, choosing meals, then listing missing items. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F02 — Opening a long-lasting item

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f02-opening-a-long-lasting-item-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an unopened bottle becoming an in-use bottle, then a low-stock bottle. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F03 — Batch cooking and leftovers

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f03-batch-cooking-and-leftovers-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: one preparation session becoming several distinct meal containers. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F04 — A mixed shopping trip

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f04-a-mixed-shopping-trip-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: one receipt connected to food, cleaning and personal-care items. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F05 — Too Good To Go unpacking

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f05-too-good-to-go-unpacking-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: one surprise food bag becoming separate food items with a place to store them. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F06 — Freezer portions

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f06-freezer-portions-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a larger food purchase divided into clearly separated portions and containers. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F07 — A gentle weekly review

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f07-a-gentle-weekly-review-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: checking purchases, checking supplies, choosing meals and reviewing one saving goal. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### F08 — Compare pack sizes

Infographic concepts · After workflow approval · 2:3

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/recipes/inbox/`

Suggested filename: `f08-compare-pack-sizes-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: two differently sized packages with space for app-rendered unit-price comparisons. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional illustrated explanation of an approved workflow. Target aspect ratio: 2:3. Keep one clear main subject, with supporting details and enough breathing room to work in a small card. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Titles, labels and step text are welcome. Use the actual recipe or workflow details I supply; decorative example prices may appear, but do not invent food lifetimes, temperatures or health guidance. The app will retain an editable text version of functional instructions.

### H01 — Plan the week

Section banners · Lowest priority · 16:9

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/h01-plan-the-week/`

Suggested filename: `h01-plan-the-week-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: an inviting table with a small shopping list, pantry ingredients and a calendar motif. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional wide section banner. Target aspect ratio: 16:9. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Keep one side quiet for a heading rendered by the app. The app must still work well without this banner.

### H02 — Your pantry

Section banners · Lowest priority · 16:9

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/h02-your-pantry/`

Suggested filename: `h02-your-pantry-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a tidy realistic shelf with a manageable assortment of food. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional wide section banner. Target aspect ratio: 16:9. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Keep one side quiet for a heading rendered by the app. The app must still work well without this banner.

### H03 — Your everyday essentials

Section banners · Lowest priority · 16:9

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/h03-your-everyday-essentials/`

Suggested filename: `h03-your-everyday-essentials-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a small organised collection of home and personal-care supplies. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional wide section banner. Target aspect ratio: 16:9. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Keep one side quiet for a heading rendered by the app. The app must still work well without this banner.

### H04 — Save for what matters

Section banners · Lowest priority · 16:9

**What to give me:** One image file for this subject; variations are optional.

Suggested folder: `assets/images/generated/h04-save-for-what-matters/`

Suggested filename: `h04-save-for-what-matters-v01.png`

Attach the sampler variant you prefer, such as v0503; no final style has been locked.

Generate an image for my personal budget, shopping and meal-planning app. Subject: a bicycle in the background and a modest savings jar in the foreground. I may attach my existing Cardiff-inspired sampler as a reference. Suggested starting point: v0503, with tactile paper collage, sage greens, cream, warm brown and a personal lived-in feel; v0502 is a warmer photographic alternative. Follow the reference I attach, and let me vary the palette, texture, realism or composition. This image will support an optional wide section banner. Target aspect ratio: 16:9. A richly detailed, cosy Cardiff room or tabletop scene is welcome: plants, warm wood, food, shopping bags, receipts and a laptop can tell the story. Merchant logos on bags, product labels, handwritten notes, receipts, laptop app screens and example prices, dates or balances are welcome when they add character. Treat screen content and numbers as illustrative details; the working app will display its own editable data. A small personal signature or watermark is optional if I ask for one. Keep one side quiet for a heading rendered by the app. The app must still work well without this banner.

