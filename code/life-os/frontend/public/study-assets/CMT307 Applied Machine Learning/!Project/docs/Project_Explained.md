# CMT307 Applied Machine Learning — ASHRAE Great Energy Predictor III
## The Full Project Explained in Plain English

Cardiff University | Spring 2025/26 | Task 9: Energy Usage Prediction

---

# Part 1 — The Big Picture: What Is This Project Actually About?

You're on a 6-person team for a university module called **CMT307 Applied Machine Learning** at Cardiff University.

The project is based on a real-world data science competition called **ASHRAE Great Energy Predictor III**. ASHRAE is an organization of engineers who work on heating, ventilation, and air conditioning in buildings.

**The problem they want solved:** Thousands of large buildings (universities, offices, hospitals) waste enormous amounts of energy. To know *how much energy a building is saving* after efficiency improvements, you need to compare its *actual* energy use against what it *would have used without the improvements.* But you can't go back in time — so you have to **predict** it using a machine learning model.

**Your job:** Build a model that looks at information like:
- What kind of building is it? (university? hospital? office?)
- How big is it?
- What's the weather like outside?
- What time of day / year is it?

...and from all that, **predict how much energy the building will use.**

The data covers **over 1,400 buildings** across **16 different locations**, with hourly readings throughout 2016–2018. That's about **20 million rows** of data just for training.

---

# Part 2 — The Data & What Each Person Was Given to Do

## The Data — What Are You Actually Working With?

There are **6 files** in total, and they all connect to each other like puzzle pieces:

---

### File 1: `train.csv` — The Main Dataset (20 million rows)

This is the heart of the project. It records energy meter readings from **1,449 buildings**, every single hour, for the whole year of **2016**. That's roughly 20 million rows.

Each row tells you:
- **Which building** (a number ID, like building 42)
- **Which meter type** — there are 4 types:
  - `0` = Electricity
  - `1` = Chilled Water (used for cooling)
  - `2` = Steam (used for heating)
  - `3` = Hot Water
- **When** the reading was taken (timestamp, e.g. "2016-03-15 14:00:00")
- **How much energy** was used (the meter reading — a number)

Think of it like a massive electricity bill spreadsheet, but for 1,449 different buildings, every hour, for a whole year, and tracking 4 different types of energy instead of just one.

---

### File 2: `building_metadata.csv` — The Building Directory (1,449 rows)

This is a lookup table — one row per building. It tells you *about* each building:
- **What type it is** — education, office, hospital, religious, retail, etc. (16 categories)
- **How big it is** — square footage
- **When it was built** — year constructed
- **How many floors** it has
- **Which site/location** it's at (there are 16 sites across the dataset)

**Key problems in this file:**
- `floor_count` is missing for **83%** of buildings — almost useless on its own
- `year_built` is missing for **60%** of buildings

These aren't mistakes — the data was just never recorded for most buildings.

---

### File 3 & 4: `weather_train.csv` and `weather_test.csv` — The Weather Data

Hourly weather readings for each of the 16 sites, across 2016 (train) and 2017–2018 (test). Columns include:
- Air temperature
- Dew temperature (how humid it feels)
- Cloud coverage
- Rainfall
- Sea level pressure
- Wind speed and direction

**Key problem:** `cloud_coverage` is missing ~50% of the time. Weather stations just don't always record it. `rainfall` is missing ~36% of the time. This has to be dealt with.

Why does weather matter? Because energy use in buildings is heavily driven by temperature — you use more heating in cold weather, more cooling in hot weather.

---

### File 5: `test.csv` — The Mystery Dataset (41 million rows)

This is 2017 and 2018 data — but **with no meter readings**. The readings have been deliberately removed. Your model has to predict them. This is what gets submitted to be evaluated.

---

### File 6: `sample_submission.csv`

Just shows the format your predictions need to be in when you hand them in.

---

## What Each Person Was Assigned — And What They Actually Did

The team was split into two phases. Think of it like a factory assembly line: some people inspect the raw materials (Sprint 1), then everyone processes and upgrades them (Sprint 2), and finally the models get built (Sprint 3).

---

### Shriya — Person 1: The Train Data Inspector

**Her file:** `train.csv`

**Sprint 1 — What she investigated:**
- How many rows and columns? (20.2 million rows, 4 columns)
- What's the date range? (Jan 2016 – Dec 2016)
- How many unique buildings? How many meter types?
- Are there **zero readings**? (Yes — a lot. This is suspicious — a building that uses zero electricity for hours in a row is probably a data error, not a real reading)
- Are there **negative readings**? (There shouldn't be — you can't use negative energy)

**Sprint 2 — What she contributed:**
- Extracted **time features** from the timestamp: hour, day_of_week, month, day_of_year, season, is_weekend, is_business_hours
- Applied the **log transformation** to the target: instead of predicting `meter_reading` directly, all models predict `log(1 + meter_reading)`. This is because energy readings have a huge range (from 0 to millions), and working in log scale makes predictions far more stable
- These features were then incorporated into the master pipeline (Zahra's notebook) and applied to the full merged dataset

**Key findings:** 964,396 zero readings. Data is extremely right-skewed (a small number of buildings use enormous energy, most use very little). Log transformation fixes the visualisation beautifully. Most buildings have only one meter type; electricity is the most common.

---

### Wahid — Person 2: The Building Profile Auditor

**His file:** `building_metadata.csv`

**Sprint 1 — What he investigated:**
- 1,449 buildings across 16 sites
- Most buildings (38%) are **Education** — universities, schools
- Some categories (like "Religious Worship" or "Food Sales") have fewer than 10 buildings — statistically unreliable
- Most buildings were built between the **1960s and 1980s**
- Site 11 only has 5 buildings in it (very small group)

**Sprint 2 — What he actually fixed:**
- `floor_count` (83% missing): used **group-median imputation with a cascade** — for each building, look at other buildings of the same *type*, in the same *location*, and of similar *size category*, and fill with the median of that group. If that group is also missing, fall back to a broader group (type + size), then just type, then the overall median. This squeezes the most information out of what's available
- `year_built` (60% missing): same cascade approach — grouped by building type and site
- Converted `primary_use` text categories into **dummy variables** (one-hot encoding) — turning "Education" into 16 separate 0/1 columns that a model can use mathematically
- Replaced raw `square_feet` with `log_square_feet` — because building sizes vary enormously, logging squishes the scale so huge buildings don't overwhelm the model
- Replaced `year_built` with `building_age` (2016 minus year built) — age is more directly meaningful than an arbitrary year number
- Added `missing_floor_count_flag` — a 0/1 column so the model knows when floor_count was originally missing (missingness itself can be a useful signal)

**Sprint 3:** Trained a **Linear Regression** model on the final feature set as a simple comparison point.

---

### Tanisha — Person 3: The Weather Data Auditor

**Her files:** `weather_train.csv` and `weather_test.csv`

**Sprint 1 — What she investigated:**
- Both files have exactly 16 sites — no locations missing between train and test
- Train covers 2016, test covers 2017–2018, no overlap — no data leakage risk
- Found major missing value problems: cloud coverage ~50% missing, rainfall ~36% missing, others smaller gaps

**Sprint 2 — What she actually fixed:**
- `air_temperature` and `dew_temperature`: **linear interpolation per site** — if 2pm and 4pm readings exist, estimate 3pm as the midpoint. Done separately per site so you're not mixing up different cities
- `cloud_coverage` (50% missing): **forward fill then backward fill** — use the last known value; if none, use the next known. Anything still missing: site median
- `rainfall` (36% missing): filled with **0** (if not recorded, assume no rain), plus a new `precip_was_missing` flag so the model knows this was originally absent
- `sea_level_pressure` and `wind_direction`: filled using a **24-hour rolling median** — the median of surrounding readings
- Created 2 new engineered features:
  - **`relative_humidity`** — calculated from air temp and dew temp using a physics formula. More meaningful than dew temp alone for predicting energy use
  - **`temp_diff_from_comfort`** — how many degrees away from a comfortable 21°C is the outside air? The further from comfort, the harder the building's heating/cooling system has to work

---

### You (Zahra) — Person 4: The Integration Hub & Team Lead

**Your job:** Take all the cleaned files and **stitch them all together into one giant table** — and then apply everyone else's preprocessing decisions in a single master pipeline.

**Sprint 1 — What you did:**

Performed the first **merge** (join) of all three raw files:
1. Start with `train.csv` (20.2M rows)
2. Add building details by matching on `building_id`
3. Add weather by matching on both `site_id` AND `timestamp`

Result: **one 20-million-row table** where every row has energy + building + weather information together. Row count stays exactly 20,216,100 — no duplicates, no losses. Same process applied to the test set.

**Key findings:** All 1,449 building IDs link up perfectly — no orphan records. Both merges preserved exact row counts. Post-merge missing values documented: `year_built` 60% missing, `floor_count` 83% missing, `cloud_coverage` 44% missing, `precip_depth_1_hr` 19% missing.

**Sprint 2 — The master preprocessing pipeline (your most important contribution):**

Your notebook applies every team member's Sprint 2 work in sequence:

1. **Wahid's building fixes** — floor_count imputation cascade, year_built imputation, building_age, log_square_feet, one-hot encoding of primary_use, missing_floor_count_flag
2. **Tanisha's weather fixes** — full weather preprocessing function (interpolation, forward fill, rolling median, humidity, comfort difference), then re-merges cleaned weather back into the main table
3. **Shriya's time features** — hour, day_of_week, month, day_of_year, season, is_weekend, is_business_hours, log_meter_reading
4. **Ayan's anomaly removals** — deletes Site 0 electricity calibration gap rows (before May 20 2016), and removes all building/meter pairs flagged for zero streaks longer than 168 hours
5. **Final null check** — confirms zero nulls remain in any feature column
6. **Time-based train/validation split** — January–October 2016 = training (~83%), November–December 2016 = validation (~17%). Time-based is critical: a random split would let lag features "see" future data, which is cheating
7. **Saves** `final_train.csv`, `final_val.csv`, `final_test.csv`

**Why this makes you the hub:** Shivalika and Ayan cannot start modelling until your merged and cleaned files exist. The entire pipeline flows through your notebook.

---

### Shivalika — Person 5: Time Series Patterns & LightGBM

**Sprint 1 — Exploratory analysis on the merged data:**
- Energy is highest in the afternoon (~12pm–4pm), lowest in the early morning (~12am–5am)
- Weekdays use significantly more energy than weekends — buildings are actively occupied
- Each meter type has its own seasonal signature: electricity peaks in summer (cooling); steam peaks in spring (heating systems); hot water peaks at start and end of year

**Sprint 2 — Lag and rolling features:**
- **`lag_24h`** — what was this building's reading exactly 24 hours ago?
- **`lag_72h`** — 3 days ago?
- **`lag_168h`** — exactly 1 week ago (same time last week)?
- **`rolling_mean_24h`** — average reading over the past 24 hours
- **`rolling_std_24h`** — how much variation over the past 24 hours (a measure of instability)
- **`rolling_mean_168h`** — the average over the past week

These give the model a "memory" of past behaviour. A building that used X amount at 9am last Monday will probably use something similar at 9am this Monday. All features use a **shift before rolling** to prevent data leakage — the model only ever sees data from *before* the moment it's predicting.

Saved: `final_train_with_features.csv`, `final_val_with_features.csv`

**Sprint 3 — LightGBM model (COMPLETE):**

LightGBM is a **gradient boosted decision tree** model. In plain English: it starts with a rough guess, builds a tiny decision tree to correct its errors, adds that to its collection, builds another to correct the remaining errors, repeats this hundreds of times. Each tree learns from the mistakes of all previous trees. Fast, accurate, and the dominant tool in data science competitions.

**Model 1** (main):
- 500 trees, learning rate 0.05, max 31 leaves per tree
- Trained on full training set
- **RMSLE = 0.0308** — excellent result

**Model 2** (tuned comparison):
- 150 trees, learning rate 0.1, max 50 leaves, max depth 10
- Trained on 20% sample (for speed)
- **RMSLE = 0.0316** — slightly worse

Model 1 wins. An RMSLE of 0.0308 means on average the log-scale predictions are off by about 3%.

---

### Ayan — Person 6: Anomaly Investigation & Random Forest

**Sprint 1 — Finding the bad data:**

Three types of anomalies found:
1. **Zero streaks** — buildings recording zero energy for more than 168 consecutive hours (1 week). Almost certainly sensor failures, not real shutdowns. Buildings 0, 2, 3, 4, 5 most affected, primarily meter type 0 (electricity)
2. **Extreme outliers** — readings above the 99.9th percentile — values so astronomically high they are almost certainly errors
3. **Sudden jumps** — readings more than 10x the previous hour's reading. If a building used 100 units at 2pm and 1,500 at 3pm, something is wrong

Specific known issue: **Site 0 electricity had a calibration gap from January–May 2016** — meters were miscalibrated and recording zeros for most of that period.

**Sprint 2 — Baseline model:**

Built a **naive baseline** — the simplest possible "model": predict the historical median energy reading for each building, each meter type, at each hour of day and day of week. No machine learning — just averages.

**Baseline RMSLE = 0.7787** — bad, which is the point. This is the floor. Any real model should beat this. If your model scores 0.8, something went wrong.

**Sprint 3 — Random Forest (not yet implemented):**

A Random Forest builds many decision trees independently, each trained on a random subset of the data and a random subset of features. The final prediction is the average across all trees. Robust to noise, less prone to overfitting, but generally slightly less accurate than LightGBM on tabular data. Ayan is responsible for this model — it is currently a placeholder in the notebook.

---

## How It All Flows Together

```
Shriya       →  audits train.csv, extracts time features
Wahid        →  cleans building_metadata.csv
Tanisha      →  cleans weather_train/test.csv
                          ↓
YOU (Zahra)  →  merges everything into one table
              →  applies all preprocessing in one pipeline
              →  performs time-based train/val split
                          ↓
         final_train.csv  /  final_val.csv  /  final_test.csv
                          ↓
Shivalika adds lag/rolling features → final_train_with_features.csv
                          ↓                    ↓
  Shivalika → LightGBM model          Ayan → Random Forest model
                          ↓                    ↓
                     RMSLE 0.0308         (to be done)
                          ↓
              Compare, evaluate, write report
```

---

# Part 3 — The Sprints, What's Done, What's Coming, and the Report

## What Is a "Sprint"?

The word **Sprint** comes from a project management style called **Agile**. Instead of trying to plan and do everything at once, you break the work into short, focused bursts (sprints), each with a clear goal. You finish one sprint, review it, then move to the next.

Your project has **4 sprints**, each building directly on the last. Think of it like building a house:
- Sprint 1 = Surveying the land and inspecting the raw materials
- Sprint 2 = Preparing and shaping the materials before construction
- Sprint 3 = Actually building the thing
- Sprint 4 = Inspecting the finished building and writing the report on it

---

## Sprint 1 — Data Exploration & Audit

**Goal:** Understand what you're working with. Don't change anything yet — just look, measure, and report what you find.

**Status: DONE by everyone.**

Each person answered questions like:
- How many rows and columns are there?
- What is the date range?
- Are there missing values? How many? In which columns?
- Are there obviously wrong values (negatives, zeros, impossible readings)?
- What do the distributions look like?

This phase is the equivalent of a doctor doing an initial examination before running any tests. You're not treating anything yet — you're just diagnosing.

---

## Sprint 2 — Feature Engineering & Preprocessing

**Goal:** Clean up all the problems found in Sprint 1, and *create new information* (features) that will help the model make better predictions.

**Status: DONE by everyone.**

### Fixing Missing Values

**Wahid's approach for buildings:**
When `floor_count` is missing, you can't just delete the row (83% gone) or put in a global average (meaningless across building types). He grouped buildings by type + site + size category and used the group median — a "cascade" that falls back to broader groups if the specific group is also all missing.

**Tanisha's approach for weather:**
- Temperature: linear interpolation (temperature changes gradually — midpoint estimation is valid)
- Cloud coverage: forward fill then backward fill (if not known now, use the last or next known value)
- Rainfall: fill with 0 plus a `precip_was_missing` flag (the model can know it was originally absent)
- Pressure and wind direction: 24-hour rolling median

### Creating New Features

**From time (Shriya, applied by Zahra):**
`hour`, `day_of_week`, `month`, `day_of_year`, `season`, `is_weekend`, `is_business_hours`

Why? The model can't read "2016-07-15 14:00:00" and understand "Friday afternoon in summer." By extracting these as separate numbers, the model learns: "whenever hour=14 AND is_weekend=0 AND season=2, energy tends to be high."

**From building data (Wahid):**
`building_age`, `log_square_feet`, 16 `use_*` one-hot columns, `missing_floor_count_flag`

**From weather (Tanisha):**
`relative_humidity`, `temp_diff_from_comfort`, `precip_was_missing`

**From historical energy (Shivalika):**
`lag_24h`, `lag_72h`, `lag_168h`, `rolling_mean_24h`, `rolling_std_24h`, `rolling_mean_168h`

These are **lag and rolling features** — they give the model a memory of what a building did recently, which is a strong predictor of what it will do next.

### Removing Bad Data (Ayan)

The anomalies found in Sprint 1 were removed:
- Site 0 electricity readings before May 20 2016 (calibration gap — 93.75% were zeros)
- All building/meter pairs with zero streaks longer than 168 consecutive hours

### The Train/Validation Split (Zahra)

The data is split into:
- **Training set** — what the model learns from: January–October 2016 (~83%)
- **Validation set** — what you test the model on to measure accuracy: November–December 2016 (~17%)

**Why time-based and not random?** If you split randomly, some July rows might end up in validation but their lag features reference June rows that are in training. The model has effectively "seen" the answer before. That's data leakage — it produces falsely optimistic scores that won't hold up in reality.

---

## Sprint 3 — Model Building

**Goal:** Take the clean, feature-rich dataset and train machine learning models.

**Status: Partially done.**

### What Is a Machine Learning Model, Simply Put?

Think of it like teaching a very fast calculator to recognise patterns. You show it millions of examples: "here's a medium-sized Education building at 2pm on a weekday in July, temperature outside 30°C, yesterday's reading was 180 units — the actual energy reading was 175 units." The model adjusts its internal settings billions of times until it can take a new row it's never seen and make a good guess.

The quality of the guess is measured by **RMSLE** — Root Mean Squared Log Error. Lower = better. A score of 0 is perfect.

### The Baseline Model (Ayan)

The simplest possible prediction: for any building at any hour and day of week, just predict the historical median. No machine learning — just averages.

**Result: RMSLE = 0.7787** — bad on purpose. This is the floor. Any real model should do better.

### LightGBM — Shivalika's Model (COMPLETE)

LightGBM is a **gradient boosted decision tree** model. It builds hundreds of small decision trees sequentially, each one learning from the errors of the previous ones. Fast, accurate, and the dominant tool in data science competitions.

| Model | Configuration | RMSLE |
|-------|--------------|-------|
| Model 1 | 500 trees, lr=0.05, 31 leaves | **0.0308** |
| Model 2 | 150 trees, lr=0.1, 50 leaves, max_depth=10 | 0.0316 |

Model 1 wins. RMSLE of 0.0308 means predictions are off by about 3% in log scale — a strong result.

### Random Forest — Ayan's Model (NOT YET IMPLEMENTED)

A Random Forest builds many trees independently, each on a random subset of data and features. Final prediction is the average across all trees. More robust to noise than a single tree, but generally slightly less accurate than LightGBM. Ayan's Sprint 3 section currently has only a placeholder header.

### Linear Regression — Wahid's Contribution

Wahid trained a simple **Linear Regression** model as a comparison point. Linear regression finds a flat mathematical surface through the data — unable to capture complex patterns, but useful to show how much the more complex models improve on it.

---

## Sprint 4 — Evaluation & Report

**Goal:** Compare all models, analyse results, write the report.

**Status: Not started — empty placeholders in all notebooks.**

---

## The Report — How It's Structured and How It's Graded

Max **4,500 words** · max **10 pages** · 10pt font · 20mm margins.

| Task | Description | Weight |
|------|-------------|--------|
| **T1-1** | Descriptive analysis — what the raw data looks like, distributions, missing values, anomalies | 10% |
| **T1-2** | Results analysis and discussion — what the findings *mean* and what they imply for modelling | 10% |
| **T2-1** | Preprocessing — missing values, outliers, features: all the Sprint 2 decisions and why | 10% |
| **T2-2** | Literature review — what has been done before in this field, what the top approaches are | 10% |
| **T3-1** | Model implementation and tuning — the models built, choices made, hyperparameters, RMSLE scores | 15% |
| **T3-2** | Model evaluation — how well they performed, where they fail, feature importance | 5% |
| **T4** | Report structure and clarity — logical organisation, clear writing, well-labelled charts, coherent story | 20% |
| **Part 2** | Peer assessment and self-reflection — individual, submitted separately | 20% |

---

# Part 4 — Your Role Specifically: What's Done, What's Missing, and What Needs to Happen Next

## First, the Good News — What You've Already Done

Your notebook is the most technically complete in terms of the **pipeline** — the engine that everyone else's work feeds through.

**Sprint 1** — you performed the first merge. You confirmed all 1,449 building IDs link up cleanly, both merges came out exactly right with zero rows lost or duplicated, and you documented every missing column and where it came from.

**Sprint 2** — your notebook builds the master preprocessing pipeline. In a single file, it:
1. Loads the Sprint 1 merged data
2. Applies Wahid's building fixes (cascade imputation, building_age, log_square_feet, one-hot encoding)
3. Applies Tanisha's weather fixes (full preprocessing function, re-merges cleaned weather)
4. Applies Shriya's time features (hour, day_of_week, month, season, is_weekend, is_business_hours, log_meter_reading)
5. Applies Ayan's anomaly removals (Site 0 calibration gap, zero streak building/meter pairs)
6. Runs a final null check confirming zero nulls remain in any feature column
7. Performs the time-based train/validation split (Jan–Oct = train, Nov–Dec = val)
8. Saves `final_train.csv`, `final_val.csv`, `final_test.csv`

You also wrote a **Sprint 2 Key Decisions table** — a summary of every step, what was applied, and which team member's work it came from. That table is worth its weight in gold for the report.

---

## What Is Missing in Your Notebook Right Now

Sprint 3 and Sprint 4 are **completely empty** — just placeholder headers with no content:

```
## Sprint 3 — Preprocessing Pipeline & Train/Val Split   ← title only
## Sprint 4 — Evaluation & Report                        ← title only
```

---

## What You Still Need to Do — Broken Into Clear Pieces

### Your Sprint 3 Section — What It Should Contain

As team lead, your Sprint 3 role is not to build a separate model from scratch. It is to:

**A) Document the final feature set going into the models**
Shivalika's LightGBM loads `final_train_with_features.csv`. You should document exactly what columns are in that file, why each one exists, and what it represents — the "official ingredient list" of your pipeline.

**B) Run a simple model as your own contribution**
Load `final_train_with_features.csv`, define your features and target (`log_meter_reading`), train a simple model (Linear Regression or Decision Tree), evaluate on the validation set, report the RMSLE. The point isn't to beat LightGBM — it's to close the loop from preprocessing to prediction.

**C) Document the anomaly removal impact**
Record in a markdown cell: how many rows were removed for the Site 0 calibration gap, how many for zero streak pairs, what percentage of training data that represents, and why those decisions were justified. The numbers are already in your code comments — they just need surfacing as a proper summary.

### Your Sprint 4 Section — What It Should Contain

A cross-model comparison table:

| Model | Author | RMSLE |
|-------|--------|-------|
| Naive Baseline (median by hour/day) | Ayan | 0.7787 |
| Linear Regression | Wahid | TBD |
| LightGBM Model 1 (500 trees, lr=0.05) | Shivalika | 0.0308 |
| LightGBM Model 2 (150 trees, lr=0.1) | Shivalika | 0.0316 |
| Random Forest | Ayan | TBD |

Plus a short commentary on what the numbers mean, where models fail, and what feature importance tells you.

---

## The Report — Your Specific Sections

### T2-1: Preprocessing — 10% — **Primarily Yours**

This is your main report section. Because all preprocessing runs through your notebook, you are the natural author. Write clearly about:

- Why imputation was necessary (what was missing and by how much)
- Which imputation method was used for each column and **why that method specifically**
  - Example: *"Linear interpolation was used for air_temperature because temperature changes gradually — there are no sudden jumps, so the value at a missing hour can be reliably estimated from the hours around it"*
  - Example: *"Group median cascade was used for floor_count because a global average would be meaningless — a 2-floor house and a 30-floor office tower should not share the same imputed value"*
- The anomaly removal decisions and their justification
- The train/validation split — specifically why time-based, what the dates were, what the ratio ended up being
- All engineered features — what each one represents and why it helps

The Sprint 2 Key Decisions table already in your notebook is a perfect starting point — expand each row into a paragraph.

### T1-1: Descriptive Analysis — 10% — **Shared, but you coordinate**

Every team member contributes their Sprint 1 findings. Your specific contribution: the post-merge null analysis — the first table showing which columns had how many missing values after all three files were joined. As team lead, you likely write this section by pulling together everyone's findings.

### T1-2: Results Analysis and Discussion — 10% — **Shared**

What the Sprint 1 findings *mean* and what they imply. Your specific angle: why the data quality problems (calibration gap, zero streaks) aren't just technical nuisances — they would actively distort any model trained on them if left uncorrected.

### T3-1 and T3-2: Models — 15% + 5% — **Shivalika and Ayan lead; you contribute context**

Your contribution here is a short "pipeline summary" paragraph at the start of T3-1: what the models were given (which features, what transformations, what the split was), and why.

### T4: Report Structure and Clarity — 20% — **Your implicit responsibility as team lead**

The biggest single mark, and it's about *how well the report reads* — logical organisation, clear writing, well-labelled charts, consistent formatting, coherent story, correct word count. Someone needs to assemble all sections into one document and ensure it hangs together. That someone is you.

### Part 2: Peer Assessment and Self-Reflection — 20% — **Individual**

For your self-reflection specifically, write about:
- Your role as team lead and integration hub
- The specific technical decisions you made in the preprocessing pipeline and why
- What went well (clean pipeline handling 20 million rows, zero data leakage in the split)
- What was challenging (coordinating six people's outputs into one coherent pipeline, handling 83% missing data in floor_count)
- What you'd do differently if starting again

Be specific. "I merged the data" is weak. "I built a single preprocessing notebook that sequentially applied each team member's transformations in the correct order, chose time-based splitting specifically to avoid lag feature leakage, and removed approximately X% of training rows flagged as anomalous" is strong.

---

## The State of the Team Right Now — Honest Assessment

| Person | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|--------|----------|----------|----------|----------|
| **Shriya** | Complete | Complete | Minimal | Empty |
| **Wahid** | Complete | Complete | Done — Linear Regression | Empty |
| **Tanisha** | Complete | Complete | Empty placeholder | Empty |
| **You (Zahra)** | Complete | **Complete — best pipeline in team** | Empty placeholder | Empty |
| **Shivalika** | Complete | Complete + rich lag features | **Complete — LightGBM, RMSLE 0.0308** | Empty |
| **Ayan** | Complete | Partial | Empty placeholder | Empty |

**Critical gap:** Ayan's Random Forest (Sprint 3) does not exist yet. Without it, there is only one real model to evaluate. A two-model comparison is much stronger for T3-1 and T3-2.

**Universal gap:** Sprint 4 is empty for everyone — evaluation write-ups and the report have not started.

---

## The Most Important Things to Do Next — In Order of Priority

1. **Chase Ayan** to implement the Random Forest in Sprint 3 — needed before final evaluation can happen
2. **Complete your Sprint 3 section** — run a simple model, document the feature set, summarise anomaly removal impact with row counts
3. **Complete your Sprint 4 section** — model comparison table with all RMSLE scores and brief analysis
4. **Write your T2-1 report section** — expand the Sprint 2 Key Decisions table into properly explained paragraphs
5. **Collect everyone's Sprint 1 findings** and draft T1-1 and T1-2
6. **Assemble the full report** — pull all sections together, check word count (max 4,500), consistent formatting, every figure labelled
7. **Write your peer assessment and self-reflection** last, once you have a clear view of everyone's final contributions
