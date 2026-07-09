# Complete Exam Study Plan: Time Series, Math Methods, Applied ML
**For: MSc Data Science and Analytics, Cardiff University**  
**Plan created: Thursday 16 April 2026 | Exams: Math Methods 11 May (Mon), Time Series 22 May (Fri)**

> **⚠️ IMPORTANT**: All university scheduled events (AML Labs, Supervisions, Recorded Lectures) in this plan were originally assigned to wrong weekdays due to a calendar error. The **dates** (e.g., 17 Apr, 24 Apr) are kept as-is, but the **day-of-week labels** have been corrected. Please verify that your AML Labs, Supervisions, and Recorded Lectures fall on the correct dates by checking your university timetable.

---

## PART 1: How to Study Each Module Effectively

### Mathematical Methods for Data Mining (MAT700)
**Exam: Monday 11 May, 13:30–15:30 (100% written, timed)**

#### What the exam tests
Based on analysis of 3 tutorials + 7 lectures + tutorial solutions:
- **Written exam**: Mon 11 May, 13:30–15:30 (2 hours). **⚠️ CONFIRM FORMAT** with module admin — likely proof-based and calculation-heavy with multiple sub-parts per question.
- **Balanced mix** (inferred): ~40% proofs/theory, ~50% calculations/applications, ~10% conceptual (MNIST demo is supplementary, not directly examined)
- **Assessment is cumulative**: All 7 lectures tested, but tutorials are the primary exam prep material

#### The 7 lectures (44–67 slides each)
| Priority | Lecture | Actual Title (from PDF) | Pages | Key Topics |
|----------|---------|------------------------|-------|------------|
| **CRITICAL** | L1 | "What is Science?" — Data Mining Intro | 44 | Data mining scope, Bayesian inference, optimization theory, collaborative filtering |
| **CRITICAL** | L2 | Standard Formulation | 67 | Instances, records, data formats, supervised vs unsupervised, instance-based vs model-based |
| **CRITICAL** | L3 | Example of Data Mining | 47 | Similarity, shingling, minhashing, locality-sensitive hashing |
| **CRITICAL** | L4 | Distance Measures & Similarity | 45 | Definition of distance measure (4 axioms), L₁/L₂/L∞, Jaccard, Edit, Hamming distances |
| **CRITICAL** | L5 | PageRank | 54 | Transition matrices, eigenvector computation, Markov chains, web graph structure |
| **HIGH** | L6 | Clustering | 40 | Hierarchical clustering, agglomerative methods, k-means, linkage rules, centroids |
| **HIGH** | L7 | AdaBoost & Halving | 30 | AdaBoost algorithm, weak learners, Halving algorithm, Multiplicative Weights, loss bounds |

**Also available**: L1 Supplement PDF (extra material on L1 topics), 2 NotebookLM Audio Scripts (good for review while walking)

#### The 3 tutorials — your ONLY exam practice material
No past papers exist for this module. These tutorials are everything.

**Tutorial 1 (13 slides, covers L1–L3) — 11 problems:**
| Problem | Topic | What to practice |
|---------|-------|-----------------|
| P1 | Birthday problem (combinatorics) | Expected value calculation with K objects in N boxes |
| P2–P3 | TF-IDF (IDF computation) | Compute IDF given repository size and document frequency |
| P4 | TF-IDF (full computation) | Compute TF and IDF scores for a document corpus, build TF-IDF matrix |
| P5 | Vector Space Model | Convert document-term matrix to vector representation |
| P6–P9 | Graph Theory | Prove sum of degrees = 2|E|, adjacency matrix powers = walk counts, find adjacency matrices |
| P10–P11 | Jaccard Similarity | Compute Jaccard for sets, understand intersection/union |

**Solutions available**: MA3700SolutionsTutorial1.pdf (5 pages, scanned)

**Tutorial 2 (12 slides, covers L3–L4) — 4 sections with separate numbering:**
| Section | Problems | What to practice |
|---------|----------|-----------------|
| **Jaccard Similarity** | P1 | Compute Jaccard of BAGS (not sets!) — denominator counts multiplicities differently |
| **Distance Measures** | P1–P5 | P1: Check which functions satisfy 4 axioms. P2: Compute L₁/L₂/L∞. P3: Hamming distance. **P4: Prove L∞ is a distance measure** (full 4-axiom proof). **P5: Prove edit distance is a distance measure** (hardest proof). |
| **k-NN Classification** | P1–P2 | Classify unseen instances using k-NN with majority vote and weighted voting |
| **Model Evaluation** | P1–P2 | P1: Classification from 1D data + Spam classifier confusion matrix. P2: Compute precision, recall, F-measure |

**Solutions available**: MA3700SolutionsTutorial2.pdf (4 pages, scanned)

**Tutorial 3 (40 slides, covers L5–L7) — 3 sections:**
| Section | Problems | What to practice |
|---------|----------|-----------------|
| **Link Analysis (PageRank)** | P1–P2 | Compute PageRank for small web graphs by iterating v = (1-β)e/n + βMv. Understand transition matrix construction. |
| **Naive Bayesian Classification** | P1–P2 | P1: Simple classification with frequency tables. P2: Multi-attribute classification, compute posteriors by hand. Understand conditional independence assumption. |
| **Spelling Corrector** | (reading) | Conceptual — understand Bayesian approach to spell-checking. Lower exam priority but elegant application of Bayes. |

**Solutions available**: Tutorial3_Solutions.pdf (2 pages, scanned)

#### What to memorize vs what to derive
**Memorize cold** (2–3 mark freebies — write these on your cheat sheet if allowed):
- Definition of distance measure: 4 axioms (d(x,y) ≥ 0; d(x,y) = 0 iff x=y; d(x,y) = d(y,x); d(x,z) ≤ d(x,y) + d(y,z))
- Jaccard similarity for SETS: |S ∩ T| / |S ∪ T|
- Jaccard similarity for BAGS: different formula — sum of min / sum of max
- TF-IDF: TF_ij = f_ij / max_k(f_kj), IDF_i = log₂(N / n_i) — always log base 2!
- k-NN: majority vote (unweighted) vs 1/d or 1/d² weighted voting
- PageRank update: v = (1-β)e/n + βMv where M is column-stochastic transition matrix, β ≈ 0.85
- Naive Bayes: P(C|X) = P(X|C)·P(C) / P(X), with conditional independence P(X|C) = ∏P(xᵢ|C)
- Precision = TP/(TP+FP), Recall = TP/(TP+FN), F-measure = 2·P·R/(P+R)
- Halving algorithm: at most log₂(n) mistakes where n = number of experts
- AdaBoost: combines weak learners with weights αₜ = ½ ln((1-εₜ)/εₜ)

**Understand deeply** (you'll derive or apply under pressure):
- **Prove distance measure axioms** for L∞ (Tutorial 2 P4) and edit distance (Tutorial 2 P5) — practice these until you can do each in <3 min
- **Calculate TF-IDF matrices** from document corpora end-to-end (Tutorial 1 P2–P4)
- **Apply k-NN** with both voting methods; know how to break ties (Tutorial 2 k-NN section)
- **Compute adjacency matrix powers** and interpret as walk counts (Tutorial 1 P6–P9)
- **Calculate PageRank by hand** for 3–4 node graphs; iterate 2–3 times (Tutorial 3 Link Analysis)
- **Compute Naive Bayes posteriors** step by step — multiply priors × likelihoods, normalize (Tutorial 3 Naive Bayes)
- **Explain clustering**: hierarchical vs k-means tradeoffs, define single/complete/average linkage (L6)
- **Explain AdaBoost + Halving**: how error weighting works, why halving achieves log₂(n) bound (L7)

#### Study method (given your background)
You're a strong coder starting from scratch on maths. MM has **less maths-heavy proofs than Time Series** but requires calculation speed and remembering many formulas:

**Step 1: Concept learning (per lecture)**
1. Read lecture PDF carefully — L1 is 44 slides, L2 is 67 slides, so budget 1.5–2 hours per lecture
2. Use the NotebookLM Audio Scripts for review while walking to/from library (2 scripts available)
3. **Immediately do the corresponding tutorial problems** after each lecture block:
   - After L1–L3: Do Tutorial 1 (all 11 problems)
   - After L4: Do Tutorial 2 (all 4 sections)
   - After L5–L7: Do Tutorial 3 (all 3 sections)
4. Check solutions in tutorial solutions PDFs (scanned — you'll need to read handwriting)
5. Re-do any you got wrong; focus on **calculation speed** (2-hour exam is tight)

**Step 2: Topic-focused drills**
- **Distance measure proofs**: Do Tutorial 2 Distance P4 (L∞) and P5 (edit distance) repeatedly until you can write the full proof in <3 min each. These require checking ALL 4 axioms — missing one = losing marks.
- **Jaccard**: Practice BOTH sets and bags versions. Tutorial 1 P10–P11 (sets) and Tutorial 2 Jaccard P1 (bags). The bag version is trickier.
- **TF-IDF**: Do Tutorial 1 P2–P4 until you can compute a full TF-IDF matrix in 5 min. Remember: log₂, not ln!
- **k-NN**: Do Tutorial 2 k-NN P1–P2. Practice weighted voting (1/d²) alongside majority vote.
- **PageRank**: Do Tutorial 3 Link Analysis P1–P2. Practice iterating the update formula by hand for 3–4 nodes.
- **Naive Bayes**: Do Tutorial 3 Naive Bayes P1–P2. The multi-attribute classification (P2) is harder and more exam-like.
- **Graph theory**: Do Tutorial 1 P6–P9. Matrix multiplication for walk counts is a common exam question.

**Step 3: Exam simulation**
- **No past papers exist**, so create your own exam conditions:
  - Pick 1 problem from each tutorial section, set a 2-hour timer, work closed-book
  - If you can finish 6–8 problems in 2 hours with >80% accuracy, you're exam-ready
  - If not, drill the slow question types
- Do this simulation at least 3 times during crunch week (May 5–10)

#### Critical gaps to avoid
- **Bags vs sets for Jaccard**: Tutorial 2 Jaccard P1 uses BAGS — the denominator uses sum-of-max, not union size. If you use the sets formula on bags, you'll get the wrong answer.
- **Log base in IDF**: ALWAYS log₂(N/nᵢ). Using ln or log₁₀ loses marks.
- **Incomplete distance proofs**: Must verify ALL 4 axioms. Students commonly forget triangle inequality or the "only if" direction of d(x,y)=0 iff x=y.
- **k-NN weight formula**: Check whether the problem specifies 1/d or 1/d². Using the wrong one = wrong classification.
- **PageRank matrix setup**: M must be column-stochastic (columns sum to 1). A common error is making it row-stochastic.
- **Naive Bayes normalization**: After computing P(X|C)·P(C) for each class, you must normalize so probabilities sum to 1. Don't skip this step.
- **Spelling Corrector**: Lower exam priority, but understand the Bayesian formulation P(c|w) ∝ P(w|c)·P(c). If it appears, it's likely a conceptual 2–3 mark question, not a full calculation.

---

### Time Series Analysis and Forecasting (MA3508)
**Exam: Friday 22 May, 09:00–11:00**

#### Actual lecture topics (15 lectures total)
| Lecture | Topic | Exam-like exercises? |
|---------|-------|---------------------|
| L1 | Introduction | No |
| L2 | Smoothing | No |
| **L3** | **Stochastic Processes** (autocovariance, stationarity) | Yes + solutions |
| **L4** | **Basic Named Processes** (WN, MA, AR processes) | Yes + solutions |
| **L5** | **Spectrums & Filtering** (spectral density, filters) | Yes + solutions |
| **L6** | **Linear Forecasting** (best linear predictor) | Yes + solutions (combined L6-L7) |
| **L7** | **Estimation** (method of moments, Yule-Walker) | Yes + solutions (combined L6-L7) |
| **L8** | **ARMA Process** (definition, causality, invertibility) | Yes + solutions |
| **L9** | **Properties of ARMA** (ACF, MA representation) | Yes + solutions |
| L10 | Exercises on ARMA Properties | No (lecture IS exercises) |
| L11 | Fitting the ARMA Model | No |
| L12 | ARMA Forecasting | No |
| L13 | ARMA Forecasting (continued) | No |
| L14 | Analysis of Real-Life Data | No |
| L15 | SSA (Singular Spectrum Analysis) | No |

**Quick reference**:
- 4 questions, answer 3, each worth 25 marks
- ~6-7 sub-parts per question, worth 2–6 marks each
- Extremely consistent across 6 past papers (2015–2020)
- CRITICAL topics: L3–L9 (stochastic processes, named processes, spectrums, forecasting, estimation, ARMA)
- HIGH topics: L11–L13 (ARMA fitting & forecasting)
- LOWER: L1–L2 (intro/smoothing), L10 (exercise lecture), L14–L15 (real-life data, SSA)
- ~105 hours study needed

#### Recurring exam question types (from 2020 paper analysis)
| Type | Marks | Which lectures |
|------|-------|---------------|
| Definitions (Bochner-Khinchin, Brownian motion, Wiener, invertible/causal ARMA, n-order stationary) | 2 each | L3, L4, L8 |
| R code (forecast, periodogram, simulate Gaussian process, compute ACF) | 3-4 | L6, L5, L3, L9 |
| Best linear predictor computation | 5-6 | L6 |
| MA representation coefficients (recursive substitution) | 5 | L9 |
| Spectral density & filtering | 2-3 | L5 |
| Causality/invertibility checking & AR(2) causality proof | 2-5 | L8 |
| Short-range vs long-range dependence | 2 | L5 |
| ARMA model identification from correlation function | 5 | L8, L9 |
| Parameter estimation (MA(1), exponential smoothing) | 4-6 | L7, L2 |
| Sketch temporal/spectral representations | 3 | L5 |

---

### Applied Machine Learning (CS)
**Exam: August 2026 (deprioritised until after 22 May)**

- Keep 6–8 hours/week during other exams to stay warm
- Full focus only after 22 May when Time Series exam is done
- Current plan allocates ~16 hours total (May 1–22), then ramps up post-exam

---

## PART 2: Your Complete Study Plan

### Key parameters
- **Plan reset date**: Thursday 23 April (sickness + AML project caused 6-day delay)
- **Completed so far**: TS L1 and L2 only
- **Math Methods exam**: Mon 11 May, 13:30 (~18 days from reset)
- **Time Series exam**: Fri 22 May, 09:00 (~29 days from reset)
- **Study days available**: ~29 days (no out days — every day counts given the pressure)
- **Realistic daily focused hours**: 5–6 hours normal, 3–4 hours minimum (low-energy days)
- **Daily structure**: Hardest subject first (maths), lighter work later
- **Wake target**: 08:00–08:30
- **Sleep**: Lights out by 23:30, aim for 7–8 hours

### Study location strategy

**Core rotation** (use these 4 most days):
- **ASSL (Arts & Social Studies Library)** – 24/7, ~20–30 min walk from Howard Gardens, your most reliable basecamp. **PG Study Centre on 3rd floor** provides exclusive quiet access (test this early).
- **Abacws** – ~10–15 min walk, in CS/Maths building, most convenient for days with lectures/supervisions
- **Trevithick Library** – ~5–15 min walk, very close, quiet, excellent for deep focus on proofs
- **Science Library** – ~15–25 min walk, formal silent study, best for high-stakes revision (especially last week before exams)

**Occasional variety** (1–2 visits per week, not routine):
- **Cardiff Central Library** – free, good for daytime visits when ASSL is crowded (Mon–Sat only, closed Sunday)
- **Coffee Barker or Waterloo Tea** – lighter sessions only (1–3 hour sprints), not ideal for heavy maths

**Sunday/late-night rule**:
- **ASSL, Abacws, or Science Library** on Sundays and after 17:00 weekdays (most other facilities close)
- **Abacws is accessible 24/7 via your student ID**, making it a practical option for late-night study and Sundays (convenient if you're already nearby)
- **ASSL is 24/7** and your most reliable backup (20–30 min walk always available)
- Do NOT rely on Health Library for routine use (too far from Howard Gardens; impractical for daily commute)
- Plan your Sunday study location (ASSL vs Abacws) based on convenience and energy levels
- **Note**: Sundays in this plan fall on: 19 Apr, 26 Apr, 3 May, 10 May, 17 May — plan library availability accordingly

### Daily template (normal day, 5–6 focused hours)
```
08:00–08:30     Wake up + breakfast
08:30–09:00     Get ready (shower night before if possible)
09:00–09:30     Walk to study spot
09:30–12:00     DEEP BLOCK 1: Hardest subject (Time Series maths or MM proofs)
                [2.5 hrs focused; Pomodoro if energy dips: 25 min work / 5 min break]
12:00–12:45     Lunch break (packed lunch, Greggs, or library café)
12:45–14:30     DEEP BLOCK 2: Second subject or continuation
                [1.75 hrs]
14:30–14:45     Short break (walk, stretch, fresh air)
14:45–16:30     BLOCK 3: Lighter work – R coding, exercises, review, solutions review
                [1.75 hrs]
16:30–17:00     Walk home or relocate
17:00–18:00     Free time / errands / rest
18:00–19:00     Dinner + relax
19:00–20:30     EVENING BLOCK (optional): Review, flashcards, AI Q&A, problem sets
                [Only on high-energy days; skip on low-energy days]
20:30–23:30     Free time, wind down, prepare next day
23:30–00:00     Lights out (7–8 hours sleep before 08:00 wake)
```

**Low-energy days**: Skip evening block. Aim for just 3–4 hours in Blocks 1–3 (08:00–13:00 concentrated work, then early rest).

### Core vs Stretch Tasks

Each day and week has **core tasks** (must complete) and **stretch tasks** (only if time/energy allows).

**CORE** = the minimum you must do to stay on track  
**STRETCH** = optional additions that boost confidence or fill gaps

Examples:
- **Core**: Watch lecture + read notes + do tutorial problems
- **Stretch**: Re-do tutorial problems again for speed, make summary sheets

### Weekly catch-up buffer

**Built-in every Tuesday & Saturday afternoon** (14:45–16:30 is flexible):
- If you're on track: use this slot for stretch tasks or ahead-of-schedule prep
- If you fell behind: use this slot to catch up on previous lectures/tutorials
- No guilt if you use buffer time for catch-up; it's intentional slack built into the plan

---

## PART 3: Week-by-Week Detailed Plan (Revised from Thu 23 Apr)

> **⚠️ PLAN RESET** — Original plan (17–22 Apr) was lost to sickness + AML project demands. Completed so far: **TS L1 and L2 only**. Everything else starts from today. Out days removed — every day counts. MM exam is **18 days away**. TS exam is **29 days away**.

### KEY CHANGES
- Phase 1 compressed: TS L3–L9 must be covered in ~7 days (Apr 23–29) instead of 10
- MM starts immediately alongside TS — both modules run in parallel until May 5
- No out days, no grace days — plan runs at full intensity every day
- Past papers start Fri 1 May (earlier than original plan)

---

### PHASE 1: RAPID FOUNDATION (23–30 Apr) — 8 days
**Goal**: Cover TS L3–L10 + MM L1–L7. This is compressed — no slack days.

#### Thu 23 Apr (TODAY — partial day)
University events: TS recorded lecture 11:10–13:00, AML recorded lecture 13:10–15:00

**Core tasks**:
- 09:30–11:10: Time Series L3 (Stochastic Processes) — watch + read. Autocovariance, stationarity definitions, ACF. Foundational for everything.
- 11:10–13:00: Time Series recorded lecture (scheduled)
- 13:10–15:00: AML recorded lecture (scheduled)
- 15:00–16:30: TS L3 — do exam-like exercises; check solutions (solution-exam-like-exercises-L3.pdf)
- 19:00–20:30: Math Methods L1 — read lecture (44 slides, Data Mining Intro); do Tutorial 1 P1–P3 (birthday problem + IDF computation)

**Location**: Abacws (near lectures)

---

#### Fri 24 Apr
University events: AML lab 09:00–10:30

**Core tasks**:
- 10:30–12:00: Time Series L4 (Basic Named Processes) — watch + read. WN, MA(q), AR(p) definitions. Do exam-like exercises L4.
- 12:45–14:30: TS L4 solutions check + redo errors
- 14:45–16:30: Math Methods L1–L2 — finish L1 + read L2 (67 slides); do Tutorial 1 P4–P5 (TF-IDF full computation)

**Stretch**: MM Tutorial 1 P6–P9 (graph theory)

**Location**: Abacws (lab), then Trevithick

---

#### Sat 25 Apr
**Core tasks**:
- 09:30–12:00: Time Series L5 (Spectrums & Filtering) — watch + read + R supplement. Spectral density, Bochner-Khinchin theorem, filtering. Do exam-like exercises L5.
- 12:45–14:30: TS L5 solutions check + redo errors. L5 appears in EVERY past exam — invest time here.
- 14:45–16:30: Math Methods L2–L3 — read L3 (47 slides); do Tutorial 1 P6–P11 (graph theory P6–P9 + Jaccard P10–P11)

**Stretch**: TS L5 — re-read spectral density derivation

**Location**: Trevithick (quiet for heavy maths)

---

#### Sun 26 Apr
**Core tasks**:
- 09:30–12:00: Time Series L6 (Linear Forecasting) — watch + read carefully. Best linear predictor derivation appears in EVERY past exam (5–6 marks). Do exam-like exercises L6.
- 12:45–14:30: TS L6 solutions check + redo errors (combined L6-L7 solution file)
- 14:45–16:30: Math Methods L3–L4 — read L4 (45 slides); do Tutorial 2: Jaccard P1 (bags — denominator uses sum-of-max!) + Distance Measures P1–P3

**Stretch**: MM Tutorial 2 Distance P4 (prove L∞ is a distance measure — practice full 4-axiom proof)

**Location**: ASSL (24/7, Sunday option)

---

#### Mon 27 Apr
**Core tasks**:
- 09:30–12:00: Time Series L7 (Estimation) — watch + read. Yule-Walker equations, method of moments. Do exam-like exercises L7.
- 12:45–14:30: TS L7 solutions check + redo errors
- 14:45–16:30: Math Methods L4 — do Tutorial 2: Distance Measures P4–P5 (prove L∞ and edit distance are distance measures). Aim for <3 min per proof.

**Stretch**: TS — re-read L6 best linear predictor derivation from scratch

**Location**: ASSL or Abacws

---

#### Tue 28 Apr
University events: AML supervision 14:10–15:00

**Core tasks**:
- 09:30–12:00: Time Series L8 (ARMA Process) — watch + read. ARMA definition, causality & invertibility conditions, characteristic polynomials. Do exam-like exercises L8.
- 12:45–14:10: TS L8 solutions check + redo errors
- 14:10–15:00: AML Project Supervision (scheduled)
- 15:00–16:30: Math Methods L5 — read PageRank (54 slides); do Tutorial 3 Link Analysis P1–P2 (iterate v = (1-β)e/n + βMv for small graphs)

**Stretch**: MM — iterate PageRank manually for a 3-node example until you get it by hand

**Location**: Abacws (near supervision)

---

#### Wed 29 Apr
**Core tasks**:
- 09:30–12:00: Time Series L9 (Properties of ARMA) — watch + read. ACF of ARMA, MA representation coefficients (recursive substitution). Do exam-like exercises L9.
- 12:45–14:30: TS L9 solutions check + R practice (arima.sim(), acf(), ARMAacf())
- 14:45–16:30: Math Methods L6–L7 — read Clustering (40 slides) + AdaBoost/Halving (30 slides). Make 1-page summary for both. All 7 MM lectures now covered.

**Stretch**: MM Tutorial 2 k-NN P1–P2 (classify using majority vote + weighted 1/d² voting)

**Location**: Science Library

---

#### Thu 30 Apr
University events: TS recorded lecture 11:10–13:00, AML recorded lecture 13:10–15:00

**Core tasks**:
- 09:30–11:10: Time Series L10 (ARMA Exercises) — this lecture IS exercises; work through it actively. Also skim L11–L13 (Fitting ARMA + Forecasting) for awareness.
- 11:10–13:00: TS recorded lecture (scheduled)
- 13:10–15:00: AML recorded lecture (scheduled)
- 15:00–16:30: Math Methods — Tutorial 2: k-NN P1–P2 + Model Eval P1–P2 (precision = TP/(TP+FP), recall = TP/(TP+FN), F-measure = 2PR/(P+R))

**Stretch**: MM — redo Tutorial 2 distance proofs from memory

**Location**: Abacws (lectures)

---

### PHASE 2: PAST PAPERS + MM COMPLETION (1–10 May) — 10 days
**Goal**: TS past papers (2015–2019) + complete MM tutorials → MM crunch from May 5.

#### Fri 1 May
University events: AML lab 09:00–10:30

**Core tasks**:
- 10:30–12:00: Time Series — attempt 2015 past paper (Questions 1 & 2 only, diagnostic, open-book allowed)
- 12:45–14:30: TS — grade yourself; identify weakest question types (definitions? best linear predictor? AR estimation?)
- 14:45–16:30: Math Methods — Tutorial 1 full review (all 11 problems: P1 birthday, P2–P4 TF-IDF log₂!, P5 vector space, P6–P9 graph theory, P10–P11 Jaccard sets)

**Stretch**: TS — redo one question from 2015 you got wrong

**Location**: Trevithick

---

#### Sat 2 May
**Core tasks**:
- 09:30–12:00: Time Series — attempt 2016 past paper (full, timed: 3 of 4 questions, 2 hours)
- 12:45–14:30: TS — review 2016 paper; drill weak areas
- 14:45–16:30: Math Methods — Tutorial 2 full review (Jaccard P1 bags, Distance P1–P5 esp. proofs P4–P5, k-NN P1–P2, Model Eval P1–P2)

**Stretch**: MM — redo distance proofs timed; aim <3 min each

**Location**: ASSL or Trevithick

---

#### Sun 3 May
**Core tasks**:
- 09:30–12:00: Time Series — attempt 2017 past paper (timed, 2 hours, closed-book)
- 12:45–14:30: TS — review 2017 paper; focus on best linear predictor + stationarity proofs (highest-value question types)
- 14:45–16:30: Math Methods — Tutorial 3 full review (Link Analysis P1–P2, Naive Bayes P1–P2, Spelling Corrector reading)

**Stretch**: MM — compute Naive Bayes posteriors from memory without looking at solutions

**Location**: ASSL

---

#### Mon 4 May
**Core tasks**:
- 09:30–12:00: Time Series — attempt 2018 past paper (timed, 2 hours, closed-book)
- 12:45–14:30: Math Methods — full tutorial review: all 3 tutorials, hardest problems from each section
- 14:45–16:30: TS — review 2018 paper + quick skim of L14 (Real-Life Data) and L15 (SSA) for awareness

**Stretch**: TS — re-read L5 spectral density derivation; TS L11–L13 deeper read

**Location**: ASSL

---

### >>> MATH METHODS CRUNCH WEEK (5–10 May) <<<
**Exam Mon 11 May, 13:30. Full MM priority. TS maintenance only (30 min/day).**

#### Tue 5 May
**Core tasks**:
- 09:30–12:00: MM — deep review Tutorial 1 (all 11 problems) + Tutorial 2 (all 4 sections, esp. proofs P4–P5)
- 12:45–14:10: MM — timed practice: TF-IDF matrix, distance proof, Jaccard bags
- 14:10–15:00: AML Project Supervision (scheduled)
- 15:00–16:30: TS — quick maintenance: 30 min re-read TS summary notes + definitions

**Stretch**: MM — Jaccard sets vs bags: write both formulas from memory and explain difference

**Location**: Abacws

---

#### Wed 6 May
**Core tasks**:
- 09:30–12:00: MM — deep review Tutorial 3 (PageRank iteration by hand, Naive Bayes P1–P2 multi-attribute, Spelling Corrector conceptual)
- 12:45–14:30: MM — timed practice: PageRank 3-node graph + Naive Bayes posterior computation
- 14:45–16:30: TS — do 2–3 quick exercise questions (ARMA or past paper questions)

**Stretch**: MM — prove distance axioms from memory; write all 4 without checking notes

**Location**: Trevithick

---

#### Thu 7 May
**Core tasks**:
- 09:30–11:10: MM — full timed mock exam (2 hours, closed-book): 1 problem from each tutorial section
- 11:10–13:00: TS recorded lecture (scheduled — last one)
- 13:00–16:30: MM — review mock; drill weak areas. Target: >80% accuracy. See which question types took too long.

**Stretch**: MM — redo mock on weakest section only, timed

**Location**: Abacws

---

#### Fri 8 May
**Core tasks**:
- 09:30–12:00: MM — full day review: 4–5 problems from all tutorials, focus on any remaining weak areas
- 12:45–14:30: MM — speed drills: distance proof <2 min, TF-IDF matrix <5 min, PageRank iteration <5 min
- 14:45–16:30: TS — quick maintenance: 30 min exercises or past paper questions

**Location**: ASSL or Science Library

---

#### Sat 9 May
**Core tasks**:
- 09:30–12:00: MM — final consolidation: 1 problem from every section across all 3 tutorials, timed conditions
- 12:45–14:30: MM — review solutions; write formula sheet by hand (the act of writing locks it in)
- 14:45–16:30: Rest / light review / walk

**Location**: Quiet library

---

#### Sun 10 May — DAY BEFORE MM EXAM
**Core tasks**:
- 09:30–12:00: MM — final review: read your handwritten formula sheet + key definitions ONLY. No new material.
- 12:45–14:30: MM — light practice on familiar problems only (nothing new)
- Afternoon: REST. Prepare exam logistics: student ID, 2 pens, calculator, route to exam room.
- Evening: Relax, shower, prepare clothes, set alarm 07:00. Asleep by 23:00.

**Location**: Home or short library visit

---

#### Mon 11 May — MATH METHODS EXAM DAY
- 08:00: Wake up, breakfast (protein + carbs, not just coffee)
- 09:00–12:30: Light review ONLY — read formula sheet. Focus on: 4 axioms of distance, Jaccard bags (sum-of-min / sum-of-max), TF-IDF (log₂!), PageRank update formula, Naive Bayes posterior, precision/recall/F. **No new material.**
- 12:30–13:00: Light lunch. Pack: student ID, 2 black pens, calculator, water bottle.
- 13:00–13:15: Walk to exam venue, arrive early.
- 13:30–15:30: **EXAM: Mathematical Methods for Data Mining**
  - Strategy: read ALL questions first (5 min). Start with your strongest. Budget ~25 min per question. If stuck on a proof, write what you know and move on — partial marks add up.
- After exam: REST. No study tonight. Time Series restarts gently tomorrow.

---

### PHASE 3: TIME SERIES ALL-IN (12–21 May) — 10 days
**Goal**: Everything is Time Series. 10 days + 2 remaining papers (2019, 2020) + redo weaker ones.

#### Tue 12 May — REST + RESET
**Core tasks**:
- Morning: Sleep in if needed. Recover from MM exam.
- 12:00–14:30: TS — gentle restart. Re-read summary notes from Phase 1–2. Identify 3 weakest question types.
- 14:45–16:30: TS — R code review: write every exam R-code type from memory

**Location**: Trevithick or home

---

#### Wed 13 May
**Core tasks**:
- 09:30–12:00: TS — attempt 2019 past paper (timed, 2 hours, closed-book)
- 12:45–14:30: TS — drill weak areas from 2019 paper
- 14:45–16:30: TS — deep review of L3–L5 (stochastic processes, named processes, spectrums & filtering)

**Location**: ASSL PG Study Centre

---

#### Thu 14 May
**Core tasks**:
- 09:30–12:00: TS — attempt 2020 past paper (timed, closed-book)
- 12:45–14:30: TS — drill weak areas from 2020 paper
- 14:45–16:30: TS — deep review of L6–L8 (linear forecasting, estimation, ARMA process)

**Location**: Science Library

---

#### Fri 15 May
**Core tasks**:
- 09:30–12:00: TS Focus day: **best linear predictor** — redo EVERY prediction question from all 6 past papers. This type is worth 5–6 marks and appears every year.
- 12:45–14:30: TS Focus: **Yule-Walker / AR parameter estimation** — redo every instance from past papers by hand
- 14:45–16:30: R code: prediction + Yule-Walker implementation

**Location**: ASSL

---

#### Sat 16 May
**Core tasks**:
- 09:30–12:00: TS Focus: **stationarity proofs** — redo every cos/sin stationarity proof from past papers
- 12:45–14:30: TS Focus: **MA representation coefficients** (recursive substitution method) — redo every instance
- 14:45–16:30: TS Focus: **causality/invertibility checking** + AR(2) causality proof

**Location**: Trevithick

---

#### Sun 17 May
**Core tasks**:
- 09:30–12:00: TS — re-attempt 2015 or 2016 exam (fully timed, closed-book). Compare with first attempt.
- 12:45–14:30: TS — review and fill gaps
- 14:45–16:30: TS Focus: **spectral density ↔ covariance function conversions, filtering**

**Location**: ASSL

---

#### Mon 18 May
**Core tasks**:
- 09:30–12:00: TS — write ALL definitions from memory; check against notes. Focus on short-range vs long-range dependence.
- 12:45–14:30: TS — re-attempt 2017 or 2018 exam (timed)
- 14:45–16:30: TS — review; identify remaining weak spots

**Location**: ASSL

---

#### Tue 19 May
**Core tasks**:
- 09:30–12:00: TS — final weak-points session: target your worst question types
- 12:45–14:30: TS — write 1-page cheat sheet of all key formulas and definitions (writing locks it in; you won't take it in but it consolidates memory)
- 14:45–16:30: TS — full R code review: write every exam R-code type from scratch without looking

**Location**: Science Library

---

#### Wed 20 May
**Core tasks**:
- 09:30–12:00: TS — final timed past paper (pick whichever you did worst on; redo fully closed-book)
- 12:45–14:30: TS — review and consolidate
- 14:45–16:00: Light review only — read cheat sheet and definitions
- 16:00+: **STOP STUDYING.** Walk, eat well, relax. No evening study.

**Location**: Library morning, then home

---

#### Thu 21 May — DAY BEFORE EXAM
**Core tasks**:
- 09:30–11:00: Light review only — read cheat sheet and definitions. Do NOT learn new material.
- 11:00+: REST. Prepare exam logistics: student ID, pens, route to Abacws 5.05.
- Afternoon: Light activity, fresh air, eat well
- Evening: Relax, shower, prepare clothes, set alarm 06:30. Asleep by 23:00.

**Location**: Home

---

#### Fri 22 May — TIME SERIES EXAM DAY
- 06:30: Wake up, shower
- 07:00–07:30: Breakfast (protein + carbs, stay hydrated)
- 07:30–08:00: Light review ONLY — read 1-page cheat sheet. Focus on definitions (Bochner-Khinchin, causal/invertible ARMA, n-order stationary), best linear predictor setup, Yule-Walker equations. **No new material.**
- 08:00–08:30: Walk to Abacws 5.05. Arrive 30 min early.
- 08:30–09:00: Settle in. Deep breaths. You've done 6 past papers — you know this material.
- 09:00–11:00: **EXAM: Time Series Analysis and Forecasting**
  - Strategy: read ALL 4 questions first (5 min). Pick the 3 you're most confident on. Budget ~38 min per question + 5 min reading + 5 min review. Start with the definitions question (quick 2-mark wins). Leave hardest computation last. If stuck, write the setup and formula — partial marks add up.
- After exam: Celebrate. May exams done. AML in August — rest first.

---

## Summary of Study Hours by Module (Revised from 23 Apr)

| Period | Time Series | Math Methods | AML | Total |
|--------|-------------|--------------|-----|-------|
| Phase 1 (Apr 23–30) | ~28 hrs | ~14 hrs | ~4 hrs (labs) | ~46 hrs |
| Phase 2 (May 1–4) | ~16 hrs | ~12 hrs | ~2 hrs (lab) | ~30 hrs |
| MM Crunch (May 5–10) | ~5 hrs (maintenance) | ~28 hrs | ~2 hrs | ~35 hrs |
| Phase 3 (May 12–21) | ~50 hrs | 0 | 0 | ~50 hrs |
| **TOTAL** | **~99 hrs** | **~54 hrs** | **~8 hrs** | **~161 hrs** |

Slightly fewer total hours than original (lost ~22 hrs to sickness). Still covers all critical content. AML deprioritised — labs and supervision only until after 22 May.

---

## Key Principles Embedded in This Plan

1. **Hardest subject first every morning** (Math Methods maths in Block 1 until Mon 11 May; then Time Series in Block 1 from Tue 12 May onwards)
2. **Out of house 5–6 days/week** on rotating schedule of 4 core libraries; stay home 1–2 days for flexibility
3. **One location per day** (committed space helps focus; don't jump between libraries mid-day)
4. **Math Methods crunch week** (May 5–10) gives MM full priority but keeps Time Series "warm" with 30 min maintenance
5. **Past papers are your primary study tool** (Time Series has 6; Math Methods has 3 tutorials; do them repeatedly)
6. **R code in afternoon/lighter blocks** when your brain is tired for maths; coding is lower cognitive load
7. **Weekly buffers** (Tue & Sat, 14:45–16:30) built in for catch-up with zero guilt
8. **Core vs stretch** tasks let you succeed even on low-energy days; stretch is optional, not required
9. **No cramming the night before exams** – final days are light review + rest only
10. **AI (Claude) is your tutor** – use throughout for: explaining concepts in programmer language, checking calculations, learning syntax

---

## Additional Resources & Logistics

- **Exam locations**: Math Methods exam likely in Abacws (your CS/Maths building) or similar. Time Series exam likely in same building. Confirm locations 1 week before exams on the university portal.
- **Calculator policy**: Check with both modules whether calculators are allowed in exams. Bring one just in case (especially for Math Methods TF-IDF calculations).
- **Formula sheets**: Both modules may allow 1–2 pages of handwritten formulas/notes. Confirm, and prepare these sheets during final review week.
- **Exam papers from previous years**: Time Series has 6; Math Methods has none published. Use tutorials as proxy for MM.
- **NotebookLM audio scripts**: Math Methods provides audio transcripts; use these for review if you prefer listening to reading.
- **MNIST demo notebook**: Supplementary only; helps understand L1 concepts in action. Not directly examined but worth trying if you have time.

---

## If You Fall Behind

**Small slip** (1–2 days behind):
- Use the next Monday/Friday buffer slot (14:45–16:30) to catch up
- Combine topics: e.g., "L3 + L4 review in one session" instead of separately
- Skip "stretch" tasks until caught up

**Medium slip** (1 week behind):
- Extend buffer time: take the full 14:45–16:30 for catch-up on 2–3 days
- Reduce evening blocks (19:00–20:30) to 2–3 days/week
- Prioritize CRITICAL topics only; defer MEDIUM/LOWER topics

**Large slip** (2+ weeks behind):
- Pause on lower-priority AML work entirely
- Extend study days to 6 hours instead of 5–6 (add 15 min per block)
- Reduce variation in locations; stick to ASSL and Science Library (minimal travel time)
- Ask your module instructors/tutors for clarification on hardest topics (saves debugging time)

---

End of plan. Good luck!
