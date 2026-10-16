# Health: a part of its own (exercise, food, appointments), the UK way

Requested by Xar, 15 October 2026 ("now work on more details for the health mini app, exercises, dietry and recipes and even gather stuff from the internet and work a uk kinda style"), building on 14 October ("another app for health, which has, like, doctor appointments, tests, and gym sessions and exercises, and also food recipes"). Her words and what each became: `TODO.md` section S.

## Shape
- **Health is a part of Life OS** (`/health`), beside the four apps inside: in the top bar, behind the Court's Body & Health tile (`/room/body` goes there), with a panel on Today. Four pages: This week · Exercise · Food · Appointments & tests.
- **What it keeps is core entries:** a session is a `workout` (planned, done or skipped; minutes at moderate and vigorous effort, strength, exercises, programme and session), an appointment an `appointment` (UK care kinds, a place), a result a `medical-record`, a weight or the day's 5 A Day and drinks a `measurement`. Her diet is the setting `health-diet`. No database change: the new fields are added to the entry types.
- **Food stays in Budget** (decision of 14 October): Health reads it through Life OS (`/api/health/food`, Budget's own rules loaded as for shopping) and adds a UK recipe to her recipes there with Budget's revision check.
- **The UK content is part of the product:** `code/life-os/shared/health/` holds the guidance (with its sources), 43 exercises, 4 programmes and 36 UK recipes, all written for the app. Nothing of it is put into her records until she chooses it.

## Gathered from the internet (checked 15 October 2026)
- NHS physical activity guidelines for adults 19 to 64: 150 minutes moderate or 75 vigorous a week, strength on 2 days, the talk test, examples.
- NHS Couch to 5K running plan: every run of the nine weeks, used exactly (warm-up and cool-down walks of 5 minutes; totals 28½ to 40 minutes).
- NHS strength exercises (sit-to-stand, mini squat, calf raises, sideways leg lift, leg lift behind, wall press-up, biceps curl) and the strength-and-flexibility pages.
- The Eatwell Guide shares (40, 38, 12, 8, 1 per cent; GOV.UK), NHS 5 A Day (80 g, 30 g dried, 150 ml juice once, pulses once, potatoes do not count), fluids 6 to 8 a day, reference intakes (8,400 kJ / 2,000 kcal; fat 70 g; saturates 20 g; carbohydrate 260 g; sugars 90 g; protein 50 g; salt 6 g), free sugars at most 30 g, salt 6 g, fibre 30 g.
- Front-of-pack traffic lights (food and drink bands, and the portion rule), from the UK front-of-pack guidance.
- The 14 allergens named by UK food law (Food Standards Agency).
- NHS Healthier Families recipes (196 listed): 29 of the 36 UK recipes link to a similar one there. BBC Good Food and BBC Food could not be read by the research tool. Recipes are written for the app; their methods are not copied (the NHS pages are Crown copyright).

## Checkpoints
- [x] CP1 The content: guidance, exercises, programmes, UK recipes, matching against food at home; tests (`shared/health/health.test.js`, 7).
- [x] CP2 Exercise: log and plan, a session's own card, programmes on the calendar, the library, week by week.
- [x] CP3 Food: today, her diet and the 14 allergens, UK recipes against what is at home, "Add to my recipes" into Budget, missing things to the shopping list, the Eatwell Guide, 5 A Day, intakes, the label checker. Budget opens a recipe from a link (`?recipe=`) and points to the UK recipes.
- [x] CP4 Appointments & tests: appointments (calendar, bell), results and letters, measurements, where to get help.
- [x] CP5 On the day: Today's Health panel; the Court's Body & Health tile with this week's figures; the calendar's Health area; the bell for appointments and sessions.
- [x] CP6 The Guide: a Health chapter (8 steps), six "How do I" answers, the figures; and, as she asked the same day, everything else the Guide did not cover (Today's Health panel, Budget's week and batches, the other Food & supplies views, the calendar and bell lines).

## Checked
- Tests: Health 7, Health food 2, Life OS day/calendar/shopping/bell 44, core entry types 6, Budget 188.
- The whole part walked on the try-out (`.runtime/hub-dev/dev-server.mjs`): every save to the core answered inside the browser, because the try-out shares the real core database; Budget saves went to its copy.
- Looked at in Modern light and dark, Madder, Indigo, Paper, at 400 pixels, and the top bar measured at eight widths in four styles (one line at every one; two widths that wrapped before now fit).

## Open
- Her own first sessions, programme and appointments (nothing was entered for her).
- A session from the Study-hub-style focus timer, steps from a watch, and Review's week counting active minutes: later, if she wants them.
