export const INTENSIVE_PLAN_START = '2026-08-08'
export const INTENSIVE_READING_END = '2026-08-12'
export const INTENSIVE_REVIEW_START = '2026-08-13'
export const INTENSIVE_PLAN_END = '2026-08-17'

function planStep(label, instruction, resourceIds, checklistText = label, kind = 'study') {
  return { label, kind, instruction, resourceIds, checklistText }
}

const TS = {
  l1: 'timeSeries-lecture-notes-lecture-1-learning-material-notes',
  l2: 'timeSeries-lecture-notes-lecture-2-learning-material-notes',
  l3: 'timeSeries-lecture-notes-lecture-3-learning-material-notes',
  l4: 'timeSeries-lecture-notes-complete-lecture-4-notes',
  l5: 'timeSeries-lecture-notes-complete-lecture-5-notes',
  l6: 'timeSeries-lecture-notes-complete-lecture-6-notes',
  l7: 'timeSeries-lecture-notes-complete-lecture-7-notes',
  l8: 'timeSeries-lecture-notes-complete-lecture-8-notes',
  l9: 'timeSeries-lecture-notes-complete-lecture-9-notes',
  l10: 'timeSeries-lecture-notes-complete-lecture-10-notes',
  l11: 'timeSeries-lecture-notes-complete-lecture-11-notes',
  l12: 'timeSeries-lecture-notes-complete-lecture-12-notes',
  l13: 'timeSeries-lecture-notes-complete-lecture-13-notes',
  l14: 'timeSeries-lecture-notes-complete-lecture-14-notes',
  l15: 'timeSeries-lecture-notes-complete-lecture-15-notes',
  l5r: 'timeSeries-quick-reference-lecture-5-r-supplement',
  e3: 'timeSeries-exam-like-exercises-exam-like-exercises-l3',
  e4: 'timeSeries-exam-like-exercises-exam-like-exercises-l4',
  e5: 'timeSeries-exam-like-exercises-exam-like-exercises-l5',
  e6: 'timeSeries-exam-like-exercises-exam-like-exercises-l6',
  e7: 'timeSeries-exam-like-exercises-exam-like-exercises-l7',
  e8: 'timeSeries-exam-like-exercises-exam-like-exercises-l8',
  e9: 'timeSeries-exam-like-exercises-exam-like-exercises-l9',
  s3: 'timeSeries-exam-like-solutions-exam-like-solutions-l3',
  s4: 'timeSeries-exam-like-solutions-exam-like-solutions-l4',
  s5: 'timeSeries-exam-like-solutions-exam-like-solutions-l5',
  s67: 'timeSeries-exam-like-solutions-exam-like-solutions-l6-l7',
  s8: 'timeSeries-exam-like-solutions-exam-like-solutions-l8',
  s9: 'timeSeries-exam-like-solutions-exam-like-solutions-l9',
  p2015: 'timeSeries-past-papers-2015-past-exam-paper',
  p2016: 'timeSeries-past-papers-2016-past-exam-paper',
  p2017: 'timeSeries-past-papers-2017-past-exam-paper',
  p2018: 'timeSeries-past-papers-2018-past-exam-paper',
  p2019: 'timeSeries-past-papers-2019-past-exam-paper',
  p2020: 'timeSeries-past-papers-2020-past-exam-paper',
  mock: 'timeSeries-past-papers-mock-exam',
  mockSolution: 'timeSeries-past-papers-mock-exam-solution',
  // Verified interactive note+drill apps (Pack A-F), each rebuilt and checked
  // page-by-page against the original lecture PDFs — see cardResources.js's
  // sourcePolicy handling for why these are allowed alongside original sources.
  packA: 'ts-mastery-pack-a',
  packB: 'ts-mastery-pack-b',
  packC: 'ts-mastery-pack-c',
  packD: 'ts-mastery-pack-d',
  packE: 'ts-mastery-pack-e',
  packF: 'ts-mastery-pack-f',
  // Print-card decks (Mathematical Foundation / Formula Atlas / R Syntax),
  // placed on their day exactly per the "5-Day Card Map" priority documents.
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`mf${i + 1}`, `timeSeries-mf-${String(i + 1).padStart(2, '0')}`])),
  ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`fa${i + 1}`, `timeSeries-fa-${String(i + 1).padStart(2, '0')}`])),
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`r${i + 1}`, `timeSeries-r-${String(i + 1).padStart(2, '0')}`])),
}

const MAT = {
  l1: 'mat700-lecture-slides-lecture-1-slides',
  l1Supplement: 'mat700-lecture-slides-lecture-1-supplement',
  l2: 'mat700-lecture-slides-lecture-2-slides',
  l3: 'mat700-lecture-slides-lecture-3-slides',
  l4: 'mat700-lecture-slides-lecture-4-slides',
  l5: 'mat700-lecture-slides-lecture-5-slides',
  l6: 'mat700-lecture-slides-lecture-6-slides',
  l7: 'mat700-lecture-slides-lecture-7-slides',
  tutorial1: 'mat700-tutorials-tutorial-1-beamer',
  tutorial1Solution: 'mat700-tutorials-tutorial-1-solutions',
  tutorial2: 'mat700-tutorials-tutorial-2-beamer',
  tutorial2Solution: 'mat700-tutorials-tutorial-2-solutions',
  tutorial3: 'mat700-tutorials-tutorial-3-beamer',
  tutorial3Solution: 'mat700-tutorials-tutorial-3-solutions',
  mnist: 'mat700-tutorials-mnist-simple-demo-notebook',
  p2023: 'mat700-past-papers-2023-past-paper',
  p2024: 'mat700-past-papers-2024-past-paper',
  p2025: 'mat700-past-papers-2025-past-paper',
  l6Transcript: 'mat700-transcripts-online-class-transcript-6',
  // Verified interactive note+drill apps (Lectures 1-7), each rebuilt and
  // checked page-by-page against the real Lecture{N}.pdf and the three real
  // 2023-2025 past papers — see cardResources.js's sourcePolicy handling for
  // why these are allowed alongside original sources.
  g1: 'mat700-mastery-lecture-1',
  g2: 'mat700-mastery-lecture-2',
  g3: 'mat700-mastery-lecture-3',
  g4: 'mat700-mastery-lecture-4',
  g5: 'mat700-mastery-lecture-5',
  g6: 'mat700-mastery-lecture-6',
  g7: 'mat700-mastery-lecture-7',
  // One timed mock exam per lecture, styled on the real 2023-2025 papers —
  // attached alongside each lecture's own mastery guide above, same reasoning.
  mock1: 'mat700-mock-lecture-1',
  mock2: 'mat700-mock-lecture-2',
  mock3: 'mat700-mock-lecture-3',
  mock4: 'mat700-mock-lecture-4',
  mock5: 'mat700-mock-lecture-5',
  mock6: 'mat700-mock-lecture-6',
  mock7: 'mat700-mock-lecture-7',
  // Print-card decks (Mathematical Foundation / Formula Atlas), placed on
  // their day exactly per the "5-Day Card Map" priority document.
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`mf${i + 1}`, `mat700-mf-${String(i + 1).padStart(2, '0')}`])),
  ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`fa${i + 1}`, `mat700-fa-${String(i + 1).padStart(2, '0')}`])),
}

const DAYS = [
  {
    date: '2026-08-08',
    day: 1,
    stage: 'Reading',
    timeSeries: {
      title: 'Time Series Day 1 - finish L3-L4 probability foundations',
      concepts: [
        'Stochastic processes, finite-dimensional distributions, strict stationarity and WSS',
        'Mean, variance, covariance, correlation, covariance symmetry/bounds and Gaussian recognition',
        'White noise, random walk, Brownian motion/bridge and Poisson process',
        'Moving-average overlap, positive-semidefinite covariance and short/long memory',
      ],
      steps: [
        planStep('Finish Lecture 3 from the current midpoint', 'Resume exactly where you stopped in L3. Finish the original PDF and keep the MASTER / MEMORISE / RECOGNISE boundary from the five-day plan: understand process language and WSS, memorise the stated definitions, and recognise rather than derive the multivariate Gaussian material.', [TS.l3, TS.packB, TS.mf3, TS.mf4, TS.mf5, TS.mf6, TS.mf7, TS.mf8, TS.mf9, TS.mf10, TS.mf11, TS.fa2, TS.fa3, TS.fa4, TS.fa5, TS.fa6, TS.r2, TS.r3], 'Finish the remaining original L3 pages without turning the Gaussian-density pages into a calculus detour.'),
        planStep('Build the L3 stationarity map', 'On one page, connect stochastic process -> mean/variance/covariance/correlation -> n-order and strict stationarity -> WSS. Include strict plus finite second moments implies WSS, R(-t)=R(t), and |R(t)| <= R(0).', [TS.l3, TS.packB, TS.mf3, TS.mf4, TS.mf5, TS.mf6, TS.mf7, TS.mf8, TS.mf9, TS.mf10, TS.mf11, TS.fa2, TS.fa3, TS.fa4, TS.fa5, TS.fa6, TS.r2, TS.r3], 'Produce the one-page L3 stationarity/covariance map from the original lecture.'),
        planStep('Read all of Lecture 4', 'Cover white noise, random walk, Wiener/Brownian motion, Brownian bridge, Poisson process, moving averages, covariance positive semidefiniteness, short/long dependence, the first spectral bridge, and the lecture R-code structures.', [TS.l4, TS.packB, TS.mf3, TS.mf4, TS.mf5, TS.mf6, TS.mf7, TS.mf8, TS.mf9, TS.mf10, TS.mf11, TS.fa2, TS.fa3, TS.fa4, TS.fa5, TS.fa6, TS.r2, TS.r3], 'Finish all original L4 content, including its R-code structures.'),
        planStep('Work the L4 engines', 'Reproduce the moving-average overlap method, the positive-semidefinite proof engine, and the p-series/geometric-series short-versus-long-memory decisions on paper.', [TS.l4, TS.packB, TS.mf3, TS.mf4, TS.mf5, TS.mf6, TS.mf7, TS.mf8, TS.mf9, TS.mf10, TS.mf11, TS.fa2, TS.fa3, TS.fa4, TS.fa5, TS.fa6, TS.r2, TS.r3], 'Reproduce the overlap, PSD and memory-classification engines on paper.'),
        planStep('Pass the Day 1 closed-book gate', 'Without either PDF open, explain the full chain from stochastic process to short/long dependence and state why Var(X_t)=t sigma^2 makes a random walk non-WSS. Reopen only to correct named gaps.', [TS.l3, TS.l4, TS.packB, TS.mf3, TS.mf4, TS.mf5, TS.mf6, TS.mf7, TS.mf8, TS.mf9, TS.mf10, TS.mf11, TS.fa2, TS.fa3, TS.fa4, TS.fa5, TS.fa6, TS.r2, TS.r3], 'Pass the L3-L4 closed-book explanation gate and record every gap.'),
      ],
      evidence: 'L3-L4 stationarity/process map + three worked L4 engines + closed-book gap list',
      done: 'L3 and L4 are fully read, the core definitions and proof/calculation engines can be explained without the PDFs, and every remaining gap is named',
    },
    mat700: {
      title: 'MAT700 Day 1 - L1 and L2 pp.1-21 learning framework',
      concepts: [
        'Bonferroni principle and birthday expected-count structure',
        'Data-learning vocabulary and labelled/unlabelled, supervised/unsupervised distinctions',
        'Instance-based versus model-based learning',
        'The D, P(Z), H, f and L mathematical learning framework',
      ],
      steps: [
        planStep('Patch only the mathematics L1-L2 needs', 'Clarify sets/elements, probability, expectation, combinations, functions, D={z1,...,zn}, P(Z), E[.], and minimisation only as each appears. Do not start a general probability course.', [MAT.l1, MAT.l2, MAT.g1, MAT.g2, MAT.mock1, MAT.mock2, MAT.mf1, MAT.mf2, MAT.mf4, MAT.mf6, MAT.mf9, MAT.mf12, MAT.fa21, MAT.fa2, MAT.fa1], 'Patch only the local probability/set/function notation required by today\'s pages.'),
        planStep('Read all of Lecture 1', 'Finish all 44 original slides. Master Bonferroni and the birthday expected-count logic; understand every K, m and N. Learn the data-mining vocabulary, then read the historical/application material once without memorising paragraphs.', [MAT.l1, MAT.g1, MAT.mock1, MAT.mf1, MAT.mf2, MAT.mf4, MAT.mf6, MAT.mf9, MAT.mf12, MAT.fa21, MAT.fa2, MAT.fa1], 'Finish all 44 original L1 slides with Bonferroni and birthday counting mastered.'),
        planStep('Audit the Lecture 1 supplement', 'Read the image/matrix material once and record only the mathematical/data representation point. There is no substantial Python program here to memorise.', [MAT.l1Supplement, MAT.g1, MAT.mock1, MAT.mf1, MAT.mf2, MAT.mf4, MAT.mf6, MAT.mf9, MAT.mf12, MAT.fa21, MAT.fa2, MAT.fa1], 'Read the L1 supplement once and record the image-as-numerical-matrix idea.'),
        planStep('Read Lecture 2 pp.1-21', 'Master instance-based versus model-based learning and the course framework D, P(Z), H, f and L. Understand the expected-loss objective, Ockham\'s razor, regression/classification and clustering.', [MAT.l2, MAT.g2, MAT.mock2, MAT.mf1, MAT.mf2, MAT.mf4, MAT.mf6, MAT.mf9, MAT.mf12, MAT.fa21, MAT.fa2, MAT.fa1], 'Finish original L2 pp.1-21 and write the D/P/H/f/L framework in plain language.'),
        planStep('Pass the Day 1 closed-book gate', 'Answer the seven gate questions from the plan: Bonferroni, the combination term, labelled/unlabelled, supervised/unsupervised, instance/model based, D/P/H/f/L, and the quantity being minimised.', [MAT.l1, MAT.l2, MAT.g1, MAT.g2, MAT.mock1, MAT.mock2, MAT.mf1, MAT.mf2, MAT.mf4, MAT.mf6, MAT.mf9, MAT.mf12, MAT.fa21, MAT.fa2, MAT.fa1], 'Answer all seven Day 1 gate questions without the slides and log corrections.'),
      ],
      evidence: 'Bonferroni/birthday worked structure + D/P/H/f/L framework sheet + seven closed-book gate answers',
      done: 'L1 and L2 pp.1-21 are read and all seven gate questions can be answered without looking',
    },
  },
  {
    date: '2026-08-09',
    day: 2,
    stage: 'Reading',
    timeSeries: {
      title: 'Time Series Day 2 - L8-L10 ARMA core',
      concepts: [
        'ARMA(p,q), backward shift and course AR/MA sign conventions',
        'Distinct stationary-solution, causality and invertibility root rules',
        'Yule-Walker, AR(1), AR(2) and MA-infinity representations',
        'Reusable ARMA coefficient, covariance, spectrum and simulation engines',
      ],
      steps: [
        planStep('Patch the root-check mathematics', 'Review the quadratic formula, polynomial roots, |z|, the unit circle and the geometric series only to the level required by L8-L10.', [TS.l8, TS.packD, TS.mf14, TS.mf15, TS.fa11, TS.fa12, TS.fa13, TS.fa14, TS.r8], 'Patch quadratic roots, modulus/unit-circle reading and the geometric series.'),
        planStep('Master Lecture 8', 'Read L8 and write the exact ARMA/backshift/polynomial conventions. Keep three distinct conclusions: no AR root on the unit circle for a stationary solution, AR roots outside for causality, and MA roots outside for invertibility. Add the spectral-density and Yule-Walker statements.', [TS.l8, TS.packD, TS.mf14, TS.mf15, TS.fa11, TS.fa12, TS.fa13, TS.fa14, TS.r8], 'Finish L8 and write the exact ARMA signs, backshift form and three root rules.'),
        planStep('Master the transferable parts of Lecture 9', 'Work AR(1) causality, MA-infinity form, variance/correlation, the lecture AR(2) causality inequalities and the recursive AR(2) correlation route. Recognise the closed root form after the recursion is secure.', [TS.l9, TS.packD, TS.mf14, TS.mf15, TS.fa11, TS.fa12, TS.fa13, TS.fa14, TS.r8], 'Finish L9 with AR(1), AR(2) causality and correlation recursion reproducible.'),
        planStep('Use Lecture 10 as a calculation laboratory', 'Trace every original example and label its engine: MA-infinity, covariance from coefficients, AR-infinity, root check, AR(2), MA(2), spectrum-to-covariance, ARMA(1,1), or c_j recursion. Translate one difference equation into the lecture R-loop structure.', [TS.l10, TS.packD, TS.mf14, TS.mf15, TS.fa11, TS.fa12, TS.fa13, TS.fa14, TS.r8], 'Trace every L10 worked example and label the reusable engine it uses.'),
        planStep('Pass the Day 2 transfer gate', 'For a fresh ARMA equation, identify p and q, construct a(z) and b(z), state the causal/invertible tests, generate c0-c3, and explain what Yule-Walker calculates.', [TS.l8, TS.l9, TS.l10, TS.packD, TS.mf14, TS.mf15, TS.fa11, TS.fa12, TS.fa13, TS.fa14, TS.r8], 'Complete the fresh ARMA transfer gate and record any sign/root mistake.'),
      ],
      evidence: 'ARMA sign/root sheet + annotated L10 engine list + fresh ARMA transfer-gate solution',
      done: 'L8-L10 are fully read and a new ARMA equation can be classified and expanded without copying a worked example',
    },
    mat700: {
      title: 'MAT700 Day 2 - L2 pp.22-67, L3 pp.1-22 and MNIST',
      concepts: [
        'Softmax and cross entropy at the course level',
        'Course TF-IDF with log base 2 and within-document max-frequency normalisation',
        'Graph/adjacency/degree/walk foundations',
        'Set versus bag Jaccard and recognition-level MNIST code',
      ],
      steps: [
        planStep('Patch today\'s notation', 'Repair log base 2, exponentials, vectors/matrices, A_ij, matrix multiplication, intersection, union and cardinality only as used today.', [MAT.l2, MAT.l3, MAT.g2, MAT.g3, MAT.mock2, MAT.mock3, MAT.mf3, MAT.mf5, MAT.mf13, MAT.mf14, MAT.mf15, MAT.mf16, MAT.fa1, MAT.fa3, MAT.fa4, MAT.fa5], 'Patch only the log/matrix/set notation needed for today\'s original pages.'),
        planStep('Finish Lecture 2 pp.22-67', 'Master softmax, cross entropy, TF, IDF and TF-IDF with the course\'s exact conventions. Then cover graph vocabulary, adjacency matrices, the degree-sum theorem and the interpretation of entries of A^r.', [MAT.l2, MAT.g2, MAT.mock2, MAT.mf3, MAT.mf5, MAT.mf13, MAT.mf14, MAT.mf15, MAT.mf16, MAT.fa1, MAT.fa3, MAT.fa4, MAT.fa5], 'Finish L2 pp.22-67 and reproduce softmax, TF-IDF and the graph foundations.'),
        planStep('Inspect all 39 MNIST notebook cells', 'Understand load/split, 28x28-to-784 reshape, scaling by 255, one-hot labels, Sequential/Dense/softmax, cross-entropy, fit/evaluate, overfitting and the later ReLU model. Do not memorise Keras syntax.', [MAT.mnist, MAT.g2, MAT.mock2, MAT.mf3, MAT.mf5, MAT.mf13, MAT.mf14, MAT.mf15, MAT.mf16, MAT.fa1, MAT.fa3, MAT.fa4, MAT.fa5], 'Inspect every MNIST cell and write a plain-language pipeline without memorising syntax.'),
        planStep('Read Lecture 3 pp.1-22', 'Master set Jaccard, its bounds/symmetry, and the current lecture\'s bag Jaccard definition that counts repeated elements. Read the applications for purpose only.', [MAT.l3, MAT.g3, MAT.mock3, MAT.mf3, MAT.mf5, MAT.mf13, MAT.mf14, MAT.mf15, MAT.mf16, MAT.fa1, MAT.fa3, MAT.fa4, MAT.fa5], 'Finish L3 pp.1-22 and write a set-versus-bag Jaccard comparison.'),
        planStep('Pass the Day 2 closed-book gate', 'Write softmax, cross entropy, TF, IDF and set Jaccard; explain bag Jaccard; draw a tiny adjacency matrix; and explain why the degree sum is 2|E|.', [MAT.l2, MAT.l3, MAT.g2, MAT.g3, MAT.mock2, MAT.mock3, MAT.mf3, MAT.mf5, MAT.mf13, MAT.mf14, MAT.mf15, MAT.mf16, MAT.fa1, MAT.fa3, MAT.fa4, MAT.fa5], 'Pass all Day 2 formula/graph/Jaccard gates without notes and log corrections.'),
      ],
      evidence: 'TF-IDF symbol sheet + MNIST pipeline explanation + set/bag Jaccard comparison + closed-book gate',
      done: 'Assigned L2/L3 pages and every MNIST cell are inspected, with all Day 2 formulas and distinctions reproducible',
    },
  },
  {
    date: '2026-08-10',
    day: 3,
    stage: 'Reading',
    timeSeries: {
      title: 'Time Series Day 3 - L11-L13 estimation, forecasting and ARIMA',
      concepts: [
        'Sample mean/covariance/correlation and Yule-Walker estimation',
        'MA(1) quadratic estimation with invertible-root selection',
        'AR(1), AR(p) and causal-ARMA forecasting, MSE and bounds',
        'ARIMA, differencing, random walk and SARIMA notation',
      ],
      steps: [
        planStep('Patch the minimum calculation tools', 'Review a 2x2 linear system, C^-1 v, the quadratic formula, recursive substitution and x-hat +/- 1.96 SE only as used in L11-L13.', [TS.l11, TS.l12, TS.packE, TS.mf16, TS.mf17, TS.fa15, TS.fa16, TS.fa17, TS.fa18, TS.fa19, TS.r6], 'Patch the local matrix/quadratic/recursion/interval tools needed today.'),
        planStep('Master Lecture 11 estimation', 'Read L11. Reproduce the 1/n sample-covariance convention, sample correlation, Yule-Walker matrix estimator, AR(1)/AR(2) closed forms, noise-variance estimate and MA(1) quadratic with the |b-hat|<1 root.', [TS.l11, TS.packE, TS.mf16, TS.mf17, TS.fa15, TS.fa16, TS.fa17, TS.fa18, TS.fa19, TS.r6], 'Finish L11 and reproduce the complete AR/MA(1) estimation workflow.'),
        planStep('Master Lecture 12 forecasting', 'Read L12. Work the AR(1) h-step forecast/MSE/bound, causal-ARMA forecast from c_i coefficients, and recursive AR(p) principle: observed values while available, then previous forecasts.', [TS.l12, TS.packE, TS.mf16, TS.mf17, TS.fa15, TS.fa16, TS.fa17, TS.fa18, TS.fa19, TS.r6], 'Finish L12 and reproduce point forecast -> MSE -> interval for the taught models.'),
        planStep('Consolidate with Lecture 13', 'Treat L13 review pages as consolidation. Learn ARIMA and differencing, random walk as ARIMA(0,1,0), ARIMA(1,1,0) recursion and SARIMA notation without expanding huge seasonal polynomials.', [TS.l13, TS.packE, TS.mf16, TS.mf17, TS.fa15, TS.fa16, TS.fa17, TS.fa18, TS.fa19, TS.r6], 'Finish L13 and connect differencing/random walk to ARIMA/SARIMA.'),
        planStep('Pass the Day 3 workflow gate', 'From blank paper, write data -> mean -> covariance -> correlation -> parameter estimates -> noise variance, then model -> forecast -> MSE -> prediction interval. Explain the two MA(1) roots and why one is rejected.', [TS.l11, TS.l12, TS.l13, TS.packE, TS.mf16, TS.mf17, TS.fa15, TS.fa16, TS.fa17, TS.fa18, TS.fa19, TS.r6], 'Pass both estimation/forecast workflow gates and the MA(1) root explanation.'),
      ],
      evidence: 'L11 estimation sheet + L12 forecast engine + ARIMA/SARIMA map + two closed-book workflows',
      done: 'L11-L13 are fully read and the estimation and forecasting workflows can be reconstructed independently',
    },
    mat700: {
      title: 'MAT700 Day 3 - finish L3 and master all L4',
      concepts: [
        'Shingling, characteristic matrices and the minhash/Jaccard theorem',
        'All four metric axioms and the taught distance families',
        'kNN/weighted kNN, generalisation and validation/test roles',
        'Precision/recall/F, Bayes/Naive Bayes and pseudo-count correction',
      ],
      steps: [
        planStep('Finish Lecture 3 pp.23-47', 'Cover shingling, characteristic matrices, minhash signatures and P(h(S)=h(T))=SIM(S,T). Do not add LSH: it is not in the current original L3 PDF.', [MAT.l3, MAT.g3, MAT.mock3, MAT.mf7, MAT.mf8, MAT.mf10, MAT.mf11, MAT.mf17, MAT.fa6, MAT.fa7, MAT.fa8, MAT.fa9, MAT.fa22, MAT.fa10, MAT.fa11, MAT.fa12], 'Finish L3 pp.23-47 and reproduce the minhash definition/theorem.'),
        planStep('Master L4 distances and kNN', 'Read the original L4 distance and kNN sections. Memorise all four metric axioms, understand each taught distance, the L-infinity/edit/Jaccard proof engines, basic and weighted kNN, k selection and overfitting.', [MAT.l4, MAT.g4, MAT.mock4, MAT.mf7, MAT.mf8, MAT.mf10, MAT.mf11, MAT.mf17, MAT.fa6, MAT.fa7, MAT.fa8, MAT.fa9, MAT.fa22, MAT.fa10, MAT.fa11, MAT.fa12], 'Master the four metric axioms, distance-proof engines and kNN workflow.'),
        planStep('Master evaluation and generalisation', 'Cover training/validation/test roles, overfitting, TP/FP/TN/FN, precision, recall, F, accuracy/TNR and the F <= (P+R)/2 proof target.', [MAT.l4, MAT.g4, MAT.mock4, MAT.mf7, MAT.mf8, MAT.mf10, MAT.mf11, MAT.mf17, MAT.fa6, MAT.fa7, MAT.fa8, MAT.fa9, MAT.fa22, MAT.fa10, MAT.fa11, MAT.fa12], 'Reproduce the evaluation formulas and explain training versus generalisation error.'),
        planStep('Master Bayes and Naive Bayes', 'Work prior/likelihood/posterior, class comparison, conditional independence, frequency estimates and the lecture pseudo-count formula. Read the Tutorial 3 spelling-corrector code only for its Bayesian link.', [MAT.l4, MAT.tutorial3, MAT.g4, MAT.mock4, MAT.mf7, MAT.mf8, MAT.mf10, MAT.mf11, MAT.mf17, MAT.fa6, MAT.fa7, MAT.fa8, MAT.fa9, MAT.fa22, MAT.fa10, MAT.fa11, MAT.fa12], 'Reproduce Bayes, Naive Bayes and the course pseudo-count correction.'),
        planStep('Pass the Day 3 closed-book gate', 'Explain how kNN and Naive Bayes classify a new observation, then write the metric axioms, L-infinity/Jaccard distance, precision/recall/F, Bayes, the independence product and pseudo-count formula.', [MAT.l4, MAT.g4, MAT.mock4, MAT.mf7, MAT.mf8, MAT.mf10, MAT.mf11, MAT.mf17, MAT.fa6, MAT.fa7, MAT.fa8, MAT.fa9, MAT.fa22, MAT.fa10, MAT.fa11, MAT.fa12], 'Pass the complete L4 closed-book gate and log any dropped condition or denominator.'),
      ],
      evidence: 'Minhash chain + four-axiom/distance sheet + kNN/NB explanations + L4 formula gate',
      done: 'L3 is finished, all L4 is read, and its algorithms/formulas can be explained without the slides',
    },
  },
  {
    date: '2026-08-11',
    day: 4,
    stage: 'Reading',
    timeSeries: {
      title: 'Time Series Day 4 - L5-L7 spectra, BLUP and sample theory',
      concepts: [
        'Mercer/Karhunen-Loeve and continuous/discrete Bochner-Khinchin statements',
        'Frequency interpretation, filtering and convolution',
        'BLUP covariance geometry, MSE and Gaussian bounds',
        'Sample estimation theory, correlogram and periodogram forms',
      ],
      steps: [
        planStep('Read Lecture 5 with strict depth control', 'Memorise rather than derive Mercer/KL and the two Bochner-Khinchin forms. Master angular/ordinary frequency conversion and filtering sinusoids; understand convolution. Inspect the original R supplement for Pgram/fir1/freqz/filter purpose only.', [TS.l5, TS.l5r, TS.packC, TS.mf12, TS.mf13, TS.fa7, TS.fa8, TS.fa9, TS.fa10, TS.r4, TS.r5, TS.r7], 'Finish L5 and its original R supplement at the plan\'s memorise/master/recognise depths.'),
        planStep('Master the Lecture 6 BLUP engine', 'Read L6 carefully. For the n=2 and n=3 examples, build Gamma and b_h, centre observations, solve a=Gamma^-1 b_h, predict, compute R(0)-b_h^T Gamma^-1 b_h and form the Gaussian interval.', [TS.l6, TS.packC, TS.mf12, TS.mf13, TS.fa7, TS.fa8, TS.fa9, TS.fa10, TS.r4, TS.r5, TS.r7], 'Work the original n=2 and n=3 BLUP examples through prediction variance and bounds.'),
        planStep('Read Lecture 7 sample theory', 'Revisit sample mean/covariance/correlation, understand the n Var(X-bar) -> 2 pi f(0) proof skeleton, recognise the mixing CLT, and master the periodogram trigonometric and equivalent forms.', [TS.l7, TS.packC, TS.mf12, TS.mf13, TS.fa7, TS.fa8, TS.fa9, TS.fa10, TS.r4, TS.r5, TS.r7], 'Finish L7 with the sample-theory proof skeleton and periodogram forms recorded.'),
        planStep('Inspect the high-priority R structures', 'From original L5-L7 code, map the correlogram loop, sine/cosine periodogram, FFT periodogram and BLUP solve(Gamma) workflow. Record inputs, outputs and recurring traps rather than copying punctuation.', [TS.l5, TS.l5r, TS.l6, TS.l7, TS.packC, TS.mf12, TS.mf13, TS.fa7, TS.fa8, TS.fa9, TS.fa10, TS.r4, TS.r5, TS.r7], 'Create the original-source L5-L7 R workflow map.'),
        planStep('Pass the Day 4 closed-book gate', 'Set up a BLUP matrix problem; distinguish R(k) from R-hat(k); explain spectrum versus periodogram; convert/filter a sinusoid; and state what Mercer/KL/Bochner provide.', [TS.l5, TS.l6, TS.l7, TS.packC, TS.mf12, TS.mf13, TS.fa7, TS.fa8, TS.fa9, TS.fa10, TS.r4, TS.r5, TS.r7], 'Pass all five Day 4 gates and correct every matrix/frequency error.'),
      ],
      evidence: 'theorem/frequency sheet + two BLUP setups + periodogram forms + original-source R map + gate answers',
      done: 'L5-L7 are fully read and the BLUP, filtering and periodogram engines can be used without copying',
    },
    mat700: {
      title: 'MAT700 Day 4 - all L5 PageRank and L6 pp.1-15',
      concepts: [
        'Column-stochastic transition matrices and idealised PageRank iteration',
        'Dead ends, spider traps and teleportation/damping',
        'Hierarchical/agglomerative clustering skeleton',
        'Cluster-distance/representation motivation',
      ],
      steps: [
        planStep('Patch the PageRank mathematics', 'Review column vectors, matrix-vector multiplication, probability vectors, iteration v_(t+1)=Mv_t and fixed points v=Mv only as used in L5.', [MAT.l5, MAT.g5, MAT.mock5, MAT.mf18, MAT.fa13, MAT.fa14, MAT.fa15], 'Patch only the vector/matrix/iteration ideas needed for PageRank.'),
        planStep('Read all Lecture 5', 'Read every original L5 slide. Master the course orientation source page = column, destination = row; construct a column-stochastic M; write v0, iterate, and state v=Mv.', [MAT.l5, MAT.g5, MAT.mock5, MAT.mf18, MAT.fa13, MAT.fa14, MAT.fa15], 'Finish L5 and construct/iterate a course-convention PageRank matrix.'),
        planStep('Master PageRank failure and repair cases', 'Explain dead ends, leaking probability, the uniform repair, spider traps and v=(1-beta)e/n + beta Mv. Keep the lecture beta=0.85 separate from tutorial/paper beta=0.8.', [MAT.l5, MAT.g5, MAT.mock5, MAT.mf18, MAT.fa13, MAT.fa14, MAT.fa15], 'Explain and repair dead ends/spider traps with the exact damping convention.'),
        planStep('Read Lecture 6 pp.1-15', 'Understand hierarchical versus point-assignment clustering and the agglomerative loop: singleton clusters, closest pair, merge, repeat to k clusters. Explain why cluster-to-cluster distance is needed.', [MAT.l6, MAT.g6, MAT.mock6, MAT.mf18, MAT.fa13, MAT.fa14, MAT.fa15], 'Finish L6 pp.1-15 and explain the hierarchical-clustering loop.'),
        planStep('Pass the Day 4 closed-book gate', 'Draw a small web graph, construct M, explain column stochasticity, v0, iteration, dead ends, spider traps and teleportation; then narrate hierarchical clustering.', [MAT.l5, MAT.l6, MAT.g5, MAT.g6, MAT.mock5, MAT.mock6, MAT.mf18, MAT.fa13, MAT.fa14, MAT.fa15], 'Pass the PageRank graph gate and hierarchical-clustering explanation without slides.'),
      ],
      evidence: 'small-graph PageRank construction + dead-end/spider-trap repair + hierarchical-clustering explanation',
      done: 'All L5 and L6 pp.1-15 are read and the PageRank/clustering gates can be completed from memory',
    },
  },
  {
    date: '2026-08-12',
    day: 5,
    stage: 'Reading',
    timeSeries: {
      title: 'Time Series Day 5 - L14-L15, L1-L2 audit and R map',
      concepts: [
        'Real-data transform -> identify -> compare -> forecast -> back-transform workflow',
        'SSA embedding, SVD/eigentriples, reconstruction and forecasting skeleton',
        'L1-L2 smoothing/Holt-Winters audit',
        'Priority A/B/C original-source R-code map',
      ],
      steps: [
        planStep('Master the Lecture 14 workflow', 'Read all L14 datasets as repetitions of one pipeline: plot, transform/difference, ACF/PACF, periodogram, candidate ARIMA models, compare, forecast. Record log/difference rules, the model-choice directions and cumulative-sum/exponentiation back-transform.', [TS.l14, TS.packF, TS.mf1, TS.mf2, TS.mf18, TS.mf19, TS.mf20, TS.fa1, TS.fa20, TS.fa21, TS.fa22, TS.fa23, TS.fa24, TS.r1, TS.r9, TS.r10, TS.r11, TS.r12], 'Finish L14 and reproduce its one real-data workflow and back-transform logic.'),
        planStep('Cover Lecture 15 SSA to the right depth', 'Master embedding/trajectory matrix and K=N-L+1; understand SVD/eigentriples, grouping/reconstruction, recurrent versus vector forecasting and the Rssa call sequence. Recognise finite-rank/order/difference-dimension theory without deriving the ODE material.', [TS.l15, TS.packF, TS.mf1, TS.mf2, TS.mf18, TS.mf19, TS.mf20, TS.fa1, TS.fa20, TS.fa21, TS.fa22, TS.fa23, TS.fa24, TS.r1, TS.r9, TS.r10, TS.r11, TS.r12], 'Finish L15 with the four-stage SSA algorithm and Rssa workflow reproducible.'),
        planStep('Run the L1-L2 audit', 'Do not reread from zero. Check SMA/CMA/WMA/SES formulas and behaviour, Holt/Holt-Winters level/trend/seasonality, additive versus multiplicative, and the course-supported smoothing R calls.', [TS.l1, TS.l2, TS.packA, TS.mf1, TS.mf2, TS.mf18, TS.mf19, TS.mf20, TS.fa1, TS.fa20, TS.fa21, TS.fa22, TS.fa23, TS.fa24, TS.r1, TS.r9, TS.r10, TS.r11, TS.r12], 'Audit L1-L2 and repair only the smoothing/Holt-Winters items that fail recall.'),
        planStep('Build the complete original-source R map', 'Classify the original lecture code: Priority A reproduce/adapt (simulation, ARMA loop, covariance/correlogram, periodogram, BLUP, Yule-Walker, recursive forecast); Priority B modify; Priority C recognise workflow.', [TS.l1, TS.l2, TS.l4, TS.l5, TS.l5r, TS.l6, TS.l7, TS.l11, TS.l12, TS.l14, TS.l15, TS.packA, TS.packB, TS.packC, TS.packE, TS.packF, TS.mf1, TS.mf2, TS.mf18, TS.mf19, TS.mf20, TS.fa1, TS.fa20, TS.fa21, TS.fa22, TS.fa23, TS.fa24, TS.r1, TS.r9, TS.r10, TS.r11, TS.r12], 'Create the Priority A/B/C R-code map from original lecture sources.'),
        planStep('Pass the complete-module reading audit', 'Check the five daily outcome rows from the PDF. Every L1-L15 family must be at least recognised at its assigned depth; list any unclosed gap by lecture and exact object, not as a vague weak topic.', [TS.l1, TS.l2, TS.l14, TS.l15, TS.packA, TS.packF, TS.mf1, TS.mf2, TS.mf18, TS.mf19, TS.mf20, TS.fa1, TS.fa20, TS.fa21, TS.fa22, TS.fa23, TS.fa24, TS.r1, TS.r9, TS.r10, TS.r11, TS.r12], 'Complete the L1-L15 audit and produce an exact gap list for Days 6-10.'),
      ],
      evidence: 'L14 workflow + SSA four-stage sheet + L1-L2 audit + Priority A/B/C R map + exact gap list',
      done: 'Every lecture L1-L15 has been studied at the assigned depth and all remaining gaps are named for question-only repair',
    },
    mat700: {
      title: 'MAT700 Day 5 - finish L6, all L7 and close every gap',
      concepts: [
        'Hierarchical cluster representations and the k-means objective/algorithm',
        'k-means termination, initialisation and local-minimum issues',
        'Meta-algorithms, online learning and the Halving mistake bound',
        'Weighted Majority algorithm and the complete 32-object audit',
      ],
      steps: [
        planStep('Finish Lecture 6 pp.16-40', 'Read the cluster comparison variants without over-memorising geometry. Master the k-means partition, centroid, objective, assignment/update loop, local minima, repeated initialisation and the two source-supported initialisation ideas.', [MAT.l6, MAT.g6, MAT.mock6, MAT.mf19, MAT.mf20, MAT.fa15, MAT.fa23, MAT.fa16, MAT.fa24, MAT.fa17, MAT.fa18, MAT.fa19, MAT.fa20], 'Finish L6 pp.16-40 and reproduce k-means objective, algorithm and initialisation choices.'),
        planStep('Understand the k-means termination proof', 'Use L6 plus the source class transcript: finitely many partitions and strict objective decrease on every non-trivial update imply termination. Do not import a different generic proof.', [MAT.l6, MAT.l6Transcript, MAT.g6, MAT.mock6, MAT.mf19, MAT.mf20, MAT.fa15, MAT.fa23, MAT.fa16, MAT.fa24, MAT.fa17, MAT.fa18, MAT.fa19, MAT.fa20], 'Write the source-supported finite-partitions plus strict-decrease termination proof.'),
        planStep('Read all Lecture 7', 'Master meta-algorithm and online-learning definitions, the Halving algorithm and M <= log2 n proof. Learn the Weighted Majority algorithm and proof architecture, but do not import generic AdaBoost formulas absent from the current PDF.', [MAT.l7, MAT.g7, MAT.mock7, MAT.mf19, MAT.mf20, MAT.fa15, MAT.fa23, MAT.fa16, MAT.fa24, MAT.fa17, MAT.fa18, MAT.fa19, MAT.fa20], 'Finish L7 with Halving automatic and Weighted Majority accurately describable.'),
        planStep('Run the complete 32-object audit', 'Use the planner PDF list from Bonferroni through Weighted Majority. For each object, mark: can define, can calculate/use, or still missing. Repair from the exact original lecture only.', [MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7, MAT.mf19, MAT.mf20, MAT.fa15, MAT.fa23, MAT.fa16, MAT.fa24, MAT.fa17, MAT.fa18, MAT.fa19, MAT.fa20], 'Audit all 32 named objects and repair each missing definition/formula from its original lecture.'),
        planStep('Freeze the Days 6-10 question queue', 'Tag Tutorial 1 P1-P11, Tutorial 2 its 9 numbered problems, Tutorial 3 its 4 numbered problems, and every source-supported subpart of the 2023-2025 papers. Flag 2023 SVM/harmonic questions as a source gap rather than importing outside material.', [MAT.tutorial1, MAT.tutorial2, MAT.tutorial3, MAT.p2023, MAT.p2024, MAT.p2025], 'Freeze the complete tutorial/paper queue and explicitly flag unsupported legacy 2023 material.'),
      ],
      evidence: 'k-means sheet/proof + Halving/Weighted-Majority sheet + 32-object audit + frozen question queue',
      done: 'L6-L7 and the full source-supported module are covered, with a complete question queue and no unnamed gaps',
    },
  },
  {
    date: '2026-08-13',
    day: 6,
    stage: 'Questions',
    timeSeries: {
      title: 'Time Series Day 6 - solve and mark all L3-L9 exam-like sheets',
      concepts: ['Original exam-like exercises L3-L9', 'Official solution-led marking', 'Immediate blank-page redos', 'Error classification by template'],
      steps: [
        planStep('Attempt L3-L5 sheets closed-book', 'Attempt every supplied question in the original L3, L4 and L5 exam-like sheets before opening solutions. Stop only to write the exact blocked theorem/formula in the error log.', [TS.e3, TS.e4, TS.e5], 'Attempt every original L3-L5 exam-like question before checking solutions.', 'test'),
        planStep('Mark and redo L3-L5', 'Use the official L3-L5 solutions. Mark each part, classify each miss as recall/method/notation/calculation, then redo every incorrect part from a blank page.', [TS.s3, TS.s4, TS.s5, TS.packB, TS.packC], 'Mark, classify and blank-page redo every missed L3-L5 part.', 'review'),
        planStep('Attempt L6-L9 sheets closed-book', 'Attempt every supplied question in the original L6-L9 exam-like sheets. Preserve full working for BLUP, estimation, roots, Yule-Walker and coefficient recursions.', [TS.e6, TS.e7, TS.e8, TS.e9], 'Attempt every original L6-L9 exam-like question with full working.', 'test'),
        planStep('Mark and redo L6-L9', 'Use the official L6-L9 solutions. Mark at subpart level, classify each miss and redo it without copying.', [TS.s67, TS.s8, TS.s9, TS.packC, TS.packD], 'Mark, classify and blank-page redo every missed L6-L9 part.', 'review'),
        planStep('Build the exercise-sheet repair queue', 'Rank the broken templates by recurrence and severity. Carry only unresolved items into Days 7-10; do not reread whole lectures.', [TS.s3, TS.s4, TS.s5, TS.s67, TS.s8, TS.s9, TS.packB, TS.packC, TS.packD], 'Rank all unresolved exercise-sheet templates for targeted repair.'),
      ],
      evidence: 'attempts for every L3-L9 exam-like sheet + marked scores/subparts + corrected redos + ranked error queue',
      done: 'Every supplied L3-L9 exam-like question is attempted, checked against an official solution where available, and every miss is corrected or explicitly queued',
    },
    mat700: {
      title: 'MAT700 Day 6 - Tutorial 1 P1-P11 and corrections',
      concepts: ['All 11 Tutorial 1 problems', 'Bonferroni/birthday and L1-L3 core', 'Solution-led marking', 'Blank-page correction'],
      steps: [
        planStep('Attempt Tutorial 1 P1-P11', 'Complete all 11 numbered problems without the solution PDF open. Show the expected-count, TF-IDF, graph and related working clearly enough to mark.', [MAT.tutorial1], 'Attempt all Tutorial 1 P1-P11 before viewing any solution.', 'test'),
        planStep('Mark every Tutorial 1 problem', 'Use the official solution PDF. Record a result for every numbered problem and identify the exact first incorrect step, not only the final answer.', [MAT.tutorial1Solution], 'Mark all 11 Tutorial 1 problems and record the first failed step in each miss.', 'review'),
        planStep('Redo every miss from blank paper', 'Close the solution and redo each incorrect or incomplete problem. Reopen only to compare after the full second attempt.', [MAT.tutorial1, MAT.tutorial1Solution], 'Redo every missed Tutorial 1 problem from blank paper.', 'review'),
        planStep('Extract the Tutorial 1 exam templates', 'Write a one-line trigger and procedure for each recurring template uncovered today. Add formula/convention traps such as log base 2 to the MAT700 error log.', [MAT.tutorial1, MAT.tutorial1Solution], 'Create the Tutorial 1 trigger/procedure list and update the error log.'),
      ],
      evidence: 'all 11 Tutorial 1 attempts + per-problem marking + blank-page redos + template/error list',
      done: 'Tutorial 1 P1-P11 are all attempted, marked and corrected, with recurring templates extracted',
    },
  },
  {
    date: '2026-08-14',
    day: 7,
    stage: 'Questions',
    timeSeries: {
      title: 'Time Series Day 7 - 2015 and 2016 past papers',
      concepts: ['Two original past papers under their printed conditions', 'Template-level marking/audit', 'Full working and notation discipline', 'Immediate targeted redos'],
      steps: [
        planStep('Sit the 2015 paper', 'Attempt the original 2015 paper under its printed time/choice conditions. Use only the aids the paper permits and show every line of working.', [TS.p2015], 'Sit the original 2015 paper under its printed conditions.', 'test'),
        planStep('Audit and repair 2015', 'No official 2015 solution is supplied. Audit each part against the exact lecture theorem/formula and your completed official exercise examples; record confidence as verified, uncertain or blank. Redo uncertain/blank parts after checking the source.', [TS.p2015, TS.l3, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.packB, TS.packC, TS.packD], 'Source-audit every 2015 subpart and redo uncertain or blank answers.', 'review'),
        planStep('Sit the 2016 paper', 'Attempt the original 2016 paper under its printed time/choice conditions, with full working and no generated answer bank.', [TS.p2016], 'Sit the original 2016 paper under its printed conditions.', 'test'),
        planStep('Audit and repair 2016', 'Use original lecture pages and official exercise solutions to verify method and notation. Mark only what is genuinely verifiable; label uncertainty instead of inventing a score.', [TS.p2016, TS.l3, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.packB, TS.packC, TS.packD], 'Source-audit every 2016 subpart and redo uncertain or blank answers.', 'review'),
      ],
      evidence: '2015 and 2016 attempts + source-audit grids + corrected redos + updated TS error log',
      done: 'Both papers are attempted and every subpart is either source-verified and repaired or explicitly marked uncertain for final review',
    },
    mat700: {
      title: 'MAT700 Day 7 - Tutorial 2 all 9 problems and corrections',
      concepts: ['One Jaccard, five distance, two kNN and one model-evaluation problem', 'Metric-proof discipline', 'Course weighted-kNN convention', 'Official-solution corrections'],
      steps: [
        planStep('Attempt all 9 Tutorial 2 problems', 'Complete the original inventory exactly: Jaccard P1, Distance P1-P5, kNN P1-P2 and Model Evaluation P1. Do not invent a second model-evaluation problem.', [MAT.tutorial2], 'Attempt the exact nine numbered Tutorial 2 problems before checking solutions.', 'test'),
        planStep('Mark all Tutorial 2 work', 'Use the official solution. Mark every axiom, inequality, neighbour choice, weight and metric denominator, not just final labels.', [MAT.tutorial2Solution], 'Mark every Tutorial 2 problem and identify the first incorrect proof/calculation step.', 'review'),
        planStep('Redo every proof and calculation miss', 'Close the solution and redo all incomplete distance proofs, kNN decisions and evaluation calculations from blank paper.', [MAT.tutorial2, MAT.tutorial2Solution], 'Blank-page redo every missed Tutorial 2 proof or calculation.', 'review'),
        planStep('Freeze the L4 error sheet', 'Consolidate four metric axioms, distance proofs, weighted kNN and precision/recall/F traps into one small repair sheet for the past papers.', [MAT.l4, MAT.tutorial2Solution, MAT.g4, MAT.mock4], 'Produce the final L4 distance/kNN/evaluation repair sheet.'),
      ],
      evidence: 'all 9 Tutorial 2 attempts + marked solution comparison + corrected redos + L4 repair sheet',
      done: 'The exact Tutorial 2 inventory is fully attempted, marked and corrected',
    },
  },
  {
    date: '2026-08-15',
    day: 8,
    stage: 'Questions',
    timeSeries: {
      title: 'Time Series Day 8 - 2017 and 2018 past papers',
      concepts: ['Two original timed papers', 'Recurring roots/MA-infinity/Yule-Walker/forecast templates', 'Source-bounded audit', 'Error-log repair'],
      steps: [
        planStep('Sit and audit the 2017 paper', 'Sit the original 2017 paper under its printed conditions. Then verify methods against the exact original lecture pages, label uncertainty honestly and redo every blank/uncertain part.', [TS.p2017, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.l11, TS.l12], 'Sit, source-audit and repair the 2017 paper.', 'test'),
        planStep('Sit and audit the 2018 paper', 'Repeat the same disciplined cycle for the 2018 paper: timed attempt first, source audit second, blank-page repair third.', [TS.p2018, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.l11, TS.l12], 'Sit, source-audit and repair the 2018 paper.', 'test'),
        planStep('Compare the repeated templates', 'Create a cross-paper table for BLUP, roots, MA coefficients, AR(2)/Yule-Walker, forecasting, spectrum/filtering, dependence, definitions and R code. Mark which are now reliable versus still fragile.', [TS.p2017, TS.p2018], 'Update the cross-paper recurrence/reliability table.'),
        planStep('Repair the two highest-frequency failures', 'Choose the two failures with the largest recurrence or mark impact and complete one fresh closed-book example of each from the original lectures/exercises.', [TS.s3, TS.s4, TS.s5, TS.s67, TS.s8, TS.s9, TS.packB, TS.packC, TS.packD], 'Complete fresh closed-book repairs for the two highest-frequency failures.', 'review'),
      ],
      evidence: '2017/2018 attempts + audit/repair grids + cross-paper template table + two fresh repairs',
      done: 'Both papers are completed and their repeated high-value failures are repaired rather than merely listed',
    },
    mat700: {
      title: 'MAT700 Day 8 - Tutorial 3 plus source-supported 2023 paper',
      concepts: ['Tutorial 3 PageRank and Naive Bayes inventory', 'Course column-stochastic PageRank', 'Source-supported 2023 exam subparts', 'Explicit SVM/harmonic source boundary'],
      steps: [
        planStep('Attempt Tutorial 3 Link Analysis and Naive Bayes', 'Attempt Link Analysis P1-P2 and Naive Bayes P1-P2 before opening the solution. The spelling-corrector code remains teaching context, not another numbered problem.', [MAT.tutorial3], 'Attempt all four numbered Tutorial 3 problems before checking solutions.', 'test'),
        planStep('Mark and redo Tutorial 3', 'Use the official solution. Check PageRank orientation/damping and every Naive-Bayes normalisation/pseudo-count step; redo misses from blank paper.', [MAT.tutorial3Solution], 'Mark and blank-page redo every missed Tutorial 3 part.', 'review'),
        planStep('Sit the source-supported 2023 paper', 'Attempt every 2023 subpart supported by the current L1-L7 material under paper conditions. Do not answer SVM or graph-Laplacian/harmonic-function parts from outside knowledge.', [MAT.p2023], 'Attempt every current-source-supported 2023 paper subpart under exam conditions.', 'test'),
        planStep('Audit the 2023 boundary and repairs', 'Mark supported answers against exact lecture/tutorial definitions and solutions. Record unsupported legacy subparts as source gap - not attempted, rather than wrong or silently imported.', [MAT.p2023, MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7], 'Source-audit 2023, repair supported misses and flag unsupported legacy parts.'),
      ],
      evidence: 'four Tutorial 3 attempts/corrections + source-supported 2023 attempt + explicit unsupported-subpart log',
      done: 'Tutorial 3 is fully corrected and every 2023 subpart is either source-supported and attempted or explicitly bounded as unsupported legacy material',
    },
  },
  {
    date: '2026-08-16',
    day: 9,
    stage: 'Questions',
    timeSeries: {
      title: 'Time Series Day 9 - 2019 and 2020 past papers',
      concepts: ['Latest supplied original past papers', 'Full timed working', 'Recurring-template confidence', 'Final-paper repair queue'],
      steps: [
        planStep('Sit and audit the 2019 paper', 'Complete the original 2019 paper first. Then source-audit each answer, redo uncertain/blank parts, and update the template table.', [TS.p2019, TS.l3, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.l11, TS.l12, TS.l13, TS.l14], 'Sit, source-audit and repair the 2019 paper.', 'test'),
        planStep('Sit and audit the 2020 paper', 'Complete the original 2020 paper first. Then source-audit and repair it with the same verified/uncertain/blank discipline.', [TS.p2020, TS.l3, TS.l4, TS.l5, TS.l6, TS.l8, TS.l9, TS.l10, TS.l11, TS.l12, TS.l13, TS.l14], 'Sit, source-audit and repair the 2020 paper.', 'test'),
        planStep('Freeze the final TS error queue', 'Rank remaining failures by recurrence across 2015-2020, then by mark impact. Separate definition/proof/calculation/R-code failures so Day 10 repair is surgical.', [TS.p2015, TS.p2016, TS.p2017, TS.p2018, TS.p2019, TS.p2020], 'Freeze the final ranked TS error queue by recurrence, mark impact and failure type.', 'review'),
      ],
      evidence: '2019/2020 attempts + source-audit repairs + six-paper template table + ranked final error queue',
      done: 'All six supplied past papers have now been attempted and the remaining TS weaknesses are ranked for the official mock/final repair day',
    },
    mat700: {
      title: 'MAT700 Day 9 - complete and mark the 2024 paper',
      concepts: ['Full 2024 paper under printed conditions', 'Current high-frequency templates', 'Source-bounded marking', 'Targeted blank-page repair'],
      steps: [
        planStep('Sit the 2024 paper', 'Attempt the original 2024 paper under its printed time and question-choice conditions. Show all working and use only the permitted crib sheet/aids.', [MAT.p2024], 'Sit the full 2024 paper under its printed conditions.', 'test'),
        planStep('Source-audit every 2024 subpart', 'Verify each method and definition against L1-L7 and the official tutorial solutions. Record marks only where the paper/answer is genuinely assessable; otherwise use verified/uncertain/blank.', [MAT.p2024, MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7], 'Source-audit every 2024 subpart and classify the result honestly.', 'review'),
        planStep('Redo all weak 2024 parts', 'Close the sources and redo every uncertain/blank answer. Prioritise the exact current traps: bag Jaccard, all metric axioms, k-means termination, PageRank orientation and Halving.', [MAT.p2024], 'Blank-page redo every weak 2024 subpart.'),
        planStep('Update the MAT700 error and crib-sheet queue', 'For each remaining error, write the smallest formula/condition/procedure that must enter the final crib sheet or final-day drill.', [MAT.p2024], 'Convert every remaining 2024 error into a crib-sheet or final-drill item.', 'review'),
      ],
      evidence: '2024 timed attempt + audit grid + corrected redos + updated error/crib-sheet queue',
      done: 'The 2024 paper is completed, honestly audited and fully repaired at subpart level',
    },
  },
  {
    date: '2026-08-17',
    day: 10,
    stage: 'Questions',
    timeSeries: {
      title: 'Time Series Day 10 - official mock, marking and final repairs',
      concepts: ['Current mock under full conditions', 'Official-solution marking', 'Final proof/calculation/R-code repairs', 'Exam-ready formula/error sheet'],
      steps: [
        planStep('Sit the current official mock', 'Complete the supplied mock under its stated 2-hour, three-question conditions with full working and only permitted aids.', [TS.mock], 'Sit the complete official mock under genuine exam conditions.', 'test'),
        planStep('Mark against the official mock solution', 'Mark every subpart using the official solution. Record a score, classify each loss, and identify the first failed line in every incomplete answer.', [TS.mockSolution], 'Self-mark every mock subpart against the official solution and record the score.', 'review'),
        planStep('Repair the final proof and calculation failures', 'From the mock and six-paper error queue, reproduce every still-shaky high-frequency proof/calculation once more closed-book: roots/MA coefficients, Yule-Walker/forecast, BLUP, spectrum/filtering, dependence and definitions as needed.', [TS.mockSolution, TS.s3, TS.s4, TS.s5, TS.s67, TS.s8, TS.s9, TS.packB, TS.packC, TS.packD], 'Redo every still-shaky high-frequency proof/calculation from blank paper.', 'review'),
        planStep('Run the Priority A R-code recall', 'From memory, write the reusable structures for Gaussian/white-noise/process simulation, ARMA loops, covariance/correlogram, both periodograms, BLUP solve, Yule-Walker estimation and recursive forecasting. Check only against original lecture code.', [TS.l4, TS.l5, TS.l5r, TS.l6, TS.l7, TS.l10, TS.l11, TS.l12, TS.packB, TS.packC, TS.packD, TS.packE], 'Reproduce and original-source-check every Priority A R-code structure.', 'review'),
        planStep('Lock the exam-ready sheet', 'Reduce the final error log to exact formulas, conditions, signs, indices and trigger phrases. Stop adding new sources; prepare only the items that still failed today.', [TS.mockSolution], 'Lock the final TS formula/error sheet with no unnamed weakness.'),
      ],
      evidence: 'timed mock + official score/marking + final redos + Priority A R recall + locked formula/error sheet',
      done: 'The official mock is marked, every recurrent weak template is repaired once more, and the final TS sheet contains only verified course material',
    },
    mat700: {
      title: 'MAT700 Day 10 - 2025 paper, final repairs and crib sheet lock',
      concepts: ['Full 2025 paper', 'Current Bonferroni/learning/metrics/PageRank/k-means/experts spine', 'Final blank-page repairs', 'One A4 double-sided crib sheet'],
      steps: [
        planStep('Sit the 2025 paper', 'Attempt the original 2025 paper under its printed time and question-choice conditions using only the permitted aids.', [MAT.p2025], 'Sit the full 2025 paper under its printed conditions.', 'test'),
        planStep('Source-audit and repair every 2025 subpart', 'Verify against the current L1-L7 lectures and official tutorial solutions. Redo every uncertain/blank answer from blank paper and update the final error queue.', [MAT.p2025, MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.tutorial1Solution, MAT.tutorial2Solution, MAT.tutorial3Solution, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7], 'Source-audit and blank-page repair every weak 2025 subpart.', 'review'),
        planStep('Replay the highest-frequency templates', 'Complete one clean closed-book example/proof for Bonferroni/birthday, TF-IDF, a metric proof, kNN or Naive Bayes, PageRank, k-means and Halving/Weighted Majority, choosing from actual failed items.', [MAT.tutorial1, MAT.tutorial2, MAT.tutorial3, MAT.p2024, MAT.p2025], 'Complete one final closed-book replay for each still-relevant high-frequency family.', 'review'),
        planStep('Lock the A4 double-sided crib sheet', 'Use only current original lecture/tutorial content. Include exact course conventions: log2 IDF, set versus bag Jaccard, four metric axioms, weighted kNN, column-stochastic PageRank, normalised Naive Bayes, k-means termination and Halving. Remove anything unverified.', [MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7], 'Lock and proofread the final A4 double-sided MAT700 crib sheet.'),
        planStep('Run the 32-object final gate', 'Recite/identify all 32 objects from the learning-phase audit. Any failure gets one last source check and one-line repair; no new topic is opened.', [MAT.l1, MAT.l2, MAT.l3, MAT.l4, MAT.l5, MAT.l6, MAT.l7, MAT.g1, MAT.g2, MAT.g3, MAT.g4, MAT.g5, MAT.g6, MAT.g7, MAT.mock1, MAT.mock2, MAT.mock3, MAT.mock4, MAT.mock5, MAT.mock6, MAT.mock7], 'Pass the final 32-object gate and close the MAT700 error log.'),
      ],
      evidence: '2025 paper attempt/audit + final template replays + locked A4 double-sided crib sheet + completed 32-object gate',
      done: 'The 2025 paper and final repair loop are complete, the crib sheet is source-verified, and all 32 course objects are identifiable',
    },
  },
]

function cardFor({ date, day, stage }, moduleGroup, plan) {
  const idPrefix = moduleGroup === 'Time Series' ? 'ts' : 'mat700'
  const phase = stage === 'Reading' ? 'Phase 0' : 'Phase 1'
  return {
    id: `${idPrefix}-intensive-day-${day}`,
    number: `${idPrefix.toUpperCase()}-${day}`,
    sortOrder: day * 10 + (moduleGroup === 'Time Series' ? 1 : 2),
    title: plan.title,
    module: moduleGroup,
    moduleGroup,
    phase,
    phaseId: phase.toLowerCase().replace(/\s+/g, '-'),
    sourceList: '8 August dual-module ten-day sprint',
    status: 'Backlog',
    priority: 'Critical',
    slotType: 'Flex',
    slotLabel: `Day ${day} of 10 - daily completion gate - no hour quota`,
    startDate: date,
    dueDate: date,
    dueDateTime: `${date} 22:00`,
    estimatedHours: 0,
    deadlineDriven: true,
    sourcePolicy: 'original-only',
    description: stage === 'Reading'
      ? `Concurrent five-day learning pass. Finish this complete ${moduleGroup} daily gate alongside the other module; repair weak mathematics locally and use only the original course sources.`
      : `Question-only phase. Attempt before checking, mark only against source-supported evidence, redo every miss from blank paper, and keep the error log precise.`,
    evidenceRequirement: plan.evidence,
    doneCondition: plan.done,
    trackerNotes: `Generated from the attached ${moduleGroup === 'Time Series' ? '2526-MAT508 Time Series - 5 Days.pdf' : '2526-MAT700 Mathematical Methods for Data Mining - 5 Days.pdf'} and the user's 8-17 August two-module sprint. Existing generated HTML packs are not source material for this card.`,
    tags: ['exam', 'intensive-10-day', stage === 'Reading' ? 'reading-phase' : 'question-phase', 'deadline-driven', 'original-sources-only'],
  }
}

export const INTENSIVE_STUDY_CARDS = DAYS.flatMap((day) => [
  cardFor(day, 'Time Series', day.timeSeries),
  cardFor(day, 'MAT700', day.mat700),
])

export const INTENSIVE_STUDY_SEQUENCES = Object.fromEntries(
  DAYS.flatMap((day) => [
    [`ts-intensive-day-${day.day}`, { concepts: day.timeSeries.concepts, steps: day.timeSeries.steps }],
    [`mat700-intensive-day-${day.day}`, { concepts: day.mat700.concepts, steps: day.mat700.steps }],
  ]),
)

export const INTENSIVE_PLAN_CARD_IDS_BY_DATE = Object.fromEntries(
  DAYS.map((day) => [
    day.date,
    {
      timeSeries: `ts-intensive-day-${day.day}`,
      mat700: `mat700-intensive-day-${day.day}`,
    },
  ]),
)

