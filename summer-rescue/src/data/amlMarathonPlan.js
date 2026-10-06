// CMT307 Applied ML exam marathon -- 2026-08-21 to 2026-08-26.
// Generated from CMT307_Exam_Marathon_20-26_Aug_2026/01_MASTER_PLAN/04_Planner_Handoff.json
// (the canonical machine-readable version of the plan the user co-designed).
// Mirrors intensiveStudyPlan.js's shape exactly: one gate card per day plus a
// matching study-sequence of ordered steps for the Focus Room walkthrough.
// Only 'core' tier blocks from the source plan become steps/checklist items --
// break/buffer/stretch blocks are intentionally left out of the gate.
//
// Rebase (schema 3.0): Emergency phase: Session 1 tonight; longer notebook review; friend-priority concepts first; sklearn-specific debugging.
// This replaces the original 19-26 Aug D0-D7 plan wholesale -- no progress had
// been logged against those cards, so there is nothing to carry forward.

function planStep(label, instruction, resourceIds, checklistText = label, kind = 'do') {
  return { label, kind, instruction, resourceIds, checklistText }
}

const DAYS = [
  {
    id: 'D0',
    index: 0,
    date: '2026-08-21',
    name: 'Session 1 review tonight',
    goal: 'Recover the course vocabulary and end-to-end ML workflow slowly enough to understand it, then remove Session 1 from tomorrow\'s load.',
    milestone: 'Explain the Session 1 concept map without slides and trace every data boundary in Lab 1 Ex1. Ex2 is selective, not a full notebook review.',
    stretch: 'If it is late, cut Ex2 and the debugging rep. The non-negotiable minimum is the focused lecture pass, Lab1 Ex1 cells 0–17 and 20 minutes of closed-book recall. Stop rather than studying into exhaustion.',
    fallback: 'Two-hour route: lecture pp. 8–31 for 35m; Lab1 Ex1 core cells for 65m; closed-book concept/workflow retrieval for 20m. Move the 20-minute Ex2 orientation to D1 opening.',
    estimatedHours: 3.3,
    dueDateTime: '2026-08-21 22:00',
    phase: 'Phase 1',
    steps: [
    planStep('Set up one working page', 'Open the lecture PDF, Lab1 Ex1, Lab1 Ex2-1 and one blank page. Write six headings only: problem, data, features/target, split, preprocessing/model, evaluation. Do not make decorative notes.', ['aml-session-1-lab-1-ex1-notebook', 'aml-session-1-lab-1-ex2-notebook', 'aml-session-1-lab-1-sheet'], 'Start Set up one working page', 'write'),
    planStep('Lecture review - two-pass', 'Pass 1 (10m): skim PDF pages 8–31 for headings. Pass 2 (35m): focus pp. 8–16,18–24,26–31. Under the six headings record only definitions/decisions you could be asked to apply. Skip staff/admin, bibliography and Colab pages.', [], '+10m Lecture review - two-pass', 'do'),
    planStep('Lab 1 Ex1 slow walkthrough', 'Run cells 0–17 in order. Before each code cell, predict the output/purpose. Record X/y shapes; why split occurs before scaler fit; why scaler fits X_train and transforms both; what SVC fit/predict means; what accuracy does and does not prove. Re-type cells 5–6,11,13–17 after closing the source. Skip UCI cells 18–21.', ['aml-session-1-lab-1-ex1-notebook', 'aml-session-1-lab-1-ex2-notebook', 'aml-session-1-lab-1-sheet'], '+65m Lab 1 Ex1 slow walkthrough', 'do'),
    planStep('Lab 1 Ex2 selective orientation', 'Run cells 0–17 and inspect cells 42–46. Identify target, feature types, missingness, class balance and why some integer-coded fields are categorical. Do not run every outlier plot tonight; tomorrow\'s Lab 2 is the serious preprocessing lesson.', ['aml-session-1-lab-1-ex2-notebook', 'aml-session-1-lab-1-ex1-notebook', 'aml-session-1-lab-1-sheet', 'aml-session-2-lab-2-preprocessing-notebook'], '+160m Lab 1 Ex2 selective orientation', 'do'),
    planStep('Closed-book retrieval', 'Close everything. Explain: object/sample, feature, target, classification vs regression, supervised vs unsupervised, workflow order, training/test boundary, model evaluation. Then write the Lab1 code skeleton from memory.', ['aml-session-1-lab-1-ex1-notebook', 'aml-session-1-lab-1-ex2-notebook', 'aml-session-1-lab-1-sheet'], '+195m Closed-book retrieval', 'test'),
    ],
  },
  {
    id: 'D1',
    index: 1,
    date: '2026-08-22',
    name: 'Preprocessing, feature engineering and leakage',
    goal: 'Master the friend-reported highest-risk area through one slow Lab 2 review, a leak-safe rebuild and case practice.',
    milestone: 'By 18:00: independently build a mixed-data ColumnTransformer/Pipeline and correctly explain ten leakage/feature-engineering cases.',
    stretch: 'The 45-minute crash path is optional because the notebook and reconstruction already teach the core. If the Pipeline gate fails, use the time for one exact-source repair instead. Do not extend the day.',
    fallback: 'Minimum viable: Lab 2 cells 2–21 and 32–61, ten leakage cases and one Pipeline reconstruction. Cut most EDA plots, all videos and secondary datasets.',
    estimatedHours: 8.1,
    dueDateTime: '2026-08-22 20:10',
    phase: 'Phase 1',
    steps: [
    planStep('Session 1 retrieval', 'Without notes, draw the complete workflow and write the Lab1 split/scaler/model skeleton. If Ex2 was cut tonight, use the last 15 minutes to inspect cells 0–17 and 42–46.', ['aml-session-1-lab-1-ex2-notebook', 'aml-session-1-lab-1-ex1-notebook', 'aml-session-1-lab-1-sheet'], '08:30 Session 1 retrieval', 'test'),
    planStep('Lab 2 part A - data audit and missingness', 'Work cells 2–21 slowly. At each operation, say what question it answers. Classify columns, quantify missingness and justify drop/impute choices. Keep an error/decision log rather than copying narration.', ['aml-session-2-lab-2-preprocessing-notebook'], '08:55 Lab 2 part A - data audit and missingness', 'do'),
    planStep('Lab 2 part B - EDA with purpose', 'Work cells 22–31. For every plot/statistic, name the modelling decision it could affect. Do not reproduce a graph that answers no question.', ['aml-session-2-lab-2-preprocessing-notebook'], '10:45 Lab 2 part B - EDA with purpose', 'do'),
    planStep('Lab 2 part C - transformations and Pipeline', 'Work cells 32–46 and 49–61. Build numeric/categorical branches; impute, scale and encode; use handle_unknown=\'ignore\'; combine with ColumnTransformer and model Pipeline. Inspect shapes and parameter names. Use the solution only after an attempt.', ['aml-session-2-lab-2-preprocessing-notebook', 'aml-video-ubc-6-1-column-transformer'], '12:50 Lab 2 part C - transformations and Pipeline', 'do'),
    planStep('Leakage and feature-engineering cases', 'Solve ten cases: global imputation/scaling, target proxy, future value, duplicate/group split, resampling before CV, global feature selection, target encoding, repeated test tuning. For each: leaked information, consequence, safe repair, verification. Add five feature ideas and test prediction-time availability.', [], '15:10 Leakage and feature-engineering cases', 'do'),
    planStep('Blank Pipeline reconstruction', 'Use the synthetic mixed data. Rebuild split, typed preprocessing, Pipeline, CV/search and final evaluation without copying. Notes open only after 50 minutes. Explain every fit boundary.', [], '16:40 Blank Pipeline reconstruction', 'write'),
    planStep('Compression and stop', 'Complete the one-page leakage/preprocessing sheet from memory. Record the largest remaining error and tomorrow\'s retrieval target.', [], '19:45 Compression and stop', 'test'),
    ],
  },
  {
    id: 'D2',
    index: 2,
    date: '2026-08-23',
    name: 'Generalisation, evaluation and model-choice foundation',
    goal: 'Build the reasoning needed for case questions: diagnose fit, choose metrics and understand the first model families before tomorrow\'s classification/ensemble implementation.',
    milestone: 'By 20:15: produce a regularised regression workflow, correct metric/fit diagnoses and a defensible logistic/kNN/SVM/tree comparison.',
    stretch: 'The crash-path block is optional. The actual Lab 3 and Lab 4 work is primary. If the day slips, keep metrics, regularisation and the SVM Pipeline; cut gradient detail and crash-course video.',
    fallback: 'Minimum viable: Lab 3 cells 43–75, metrics, model matrix and Lab 4 cells 9–19. Skip detailed linear/GD work, optional videos and all SVR.',
    estimatedHours: 8.6,
    dueDateTime: '2026-08-23 20:35',
    phase: 'Phase 1',
    steps: [
    planStep('D1 retrieval', 'Rebuild the preprocessing graph and solve two leakage cases without notes. Any critical error gets one 10-minute repair only.', [], '08:30 D1 retrieval', 'test'),
    planStep('Lab 3 part A - regression and complexity', 'Run cells 6–19 and 43–58 slowly. Connect predictions/residuals to error; compare linear and polynomial fit; read learning curves. Gradient-descent cells 21–35 are intuition-only: learning rate, convergence, divergence.', ['aml-session-3-lab-3-linear-models-notebook'], '08:55 Lab 3 part A - regression and complexity', 'do'),
    planStep('Lab 3 part B - regularisation and validation', 'Run cells 59–75. Compare Ridge/Lasso and alpha; keep polynomial/scaling/model in Pipeline; explain early stopping and train/CV/test roles. Re-type one regularised Pipeline.', ['aml-session-3-lab-3-linear-models-notebook'], '10:45 Lab 3 part B - regularisation and validation', 'do'),
    planStep('Metrics and case reasoning', 'Choose MAE/RMSE/R2 for regression cases and hand-compute precision/recall/F1 for two confusion matrices. Cover imbalance, thresholds and why test data is not a tuning surface.', ['aml-video-course-s4-evaluation'], '13:00 Metrics and case reasoning', 'test'),
    planStep('Model-choice concepts', 'Build the logistic, kNN, SVM and tree matrix: assumptions/boundary, scaling, interpretability, speed, first parameters and failure modes. The output must answer \'which model and why\', not list definitions.', ['aml-session-4-s4-classification-slides'], '14:40 Model-choice concepts', 'do'),
    planStep('Lab 4 SVM guided start', 'Run cells 9–19 slowly. Explain margin/support vectors, scaling, C and gamma. Trace Pipeline parameter prefixes and CV search. Do not touch SVR cells 21–25.', ['aml-session-4-lab-4-classification-notebook'], '16:00 Lab 4 SVM guided start', 'do'),
    planStep('Regression and model-choice gate', 'From blank, write polynomial+scaler+Ridge Pipeline, evaluation architecture and a 150-word model choice for an imbalanced classification case. Mark with the common rubric.', [], '19:15 Regression and model-choice gate', 'test'),
    planStep('Compression and stop', 'Complete the metrics/generalisation and model-selection one-pagers. Record tomorrow\'s exact Lab 4 starting point.', ['aml-session-4-lab-4-classification-notebook'], '20:15 Compression and stop', 'do'),
    ],
  },
  {
    id: 'D3',
    index: 3,
    date: '2026-08-24',
    name: 'Classification, ensembles and exam integration',
    goal: 'Finish the remaining model families, practise friend-reported model-choice/debug questions and close all new material before evening exam practice.',
    milestone: 'By 18:10: implement tree/search, RF/OOB and boosting and complete the model-choice closure audit. Then complete one debugging set and mini mock.',
    stretch: 'The 45-minute Bug Zoo block is optional, but some debugging must occur through the mini mock and Lab 5 wrong-variable issue. If late, do five high-yield bugs instead of ten. Never add XGBoost/stacking or a second dataset.',
    fallback: 'Minimum viable: Lab 4 cells 30–39, classification comparison, Lab 5 RF/OOB and boosting, six model-choice cases and Mini Mock 1. Cut voting detail, videos and optional debugging volume.',
    estimatedHours: 8.8,
    dueDateTime: '2026-08-24 21:05',
    phase: 'Phase 1',
    steps: [
    planStep('Critical retrieval', 'One leakage case, one metric choice, one C/gamma case, one regularisation diagnosis and the full Pipeline skeleton.', [], '08:30 Critical retrieval', 'test'),
    planStep('Lab 4 trees and search', 'Run cells 30–39 slowly. Explain split logic, depth/leaf controls, overfitting and RandomizedSearchCV. Inspect mean, variability and train-CV gap, not only best score.', ['aml-session-4-lab-4-classification-notebook'], '08:55 Lab 4 trees and search', 'do'),
    planStep('Classification integration', 'Build a mixed-data classification Pipeline; compare logistic/SVM/tree; choose scorer from error cost; tune one model; evaluate the fixed winner once on test. Answer which model/why/check/caveat.', [], '10:45 Classification integration', 'do'),
    planStep('Friend-priority model-choice cases', 'Solve six scenarios involving mixed types, imbalance, high-dimensional data, non-linearity, interpretability and compute limits. Give decision, reason, validation check and caveat.', [], '12:10 Friend-priority model-choice cases', 'test'),
    planStep('Lab 5 voting, bagging, RF and OOB', 'Run cells 6–35 slowly. Explain diversity, hard/soft voting, bootstrap aggregation, random features and OOB limits. Compare one tree and RF fairly.', ['aml-session-5-lab-5-ensemble-notebook'], '13:45 Lab 5 voting, bagging, RF and OOB', 'do'),
    planStep('Lab 5 boosting', 'Run cells 37–38 and 42–60. Explain sequential correction and learning_rate/n_estimators/depth. Detect the wrong-estimator-variable pattern. Skip XGBoost and stacking implementation.', ['aml-session-5-lab-5-ensemble-notebook'], '15:35 Lab 5 boosting', 'do'),
    planStep('Ensemble/model-choice closure', 'Compare tree, RF and gradient boost under the same CV/metric. Explain OOB and feature-importance caveats. Tick the atomic matrix: only critical reds may remain as tomorrow\'s repairs.', [], '17:10 Ensemble/model-choice closure', 'do'),
    planStep('Mini Mock 1', 'Complete the integrated case with local notes but no AI/chat. Move by time/marks.', [], '20:00 Mini Mock 1', 'test'),
    planStep('Mark and prepare full mock', 'Mark strictly; identify the two largest mark-loss errors; prepare tomorrow\'s mock files; stop.', [], '20:45 Mark and prepare full mock', 'test'),
    ],
  },
  {
    id: 'D4',
    index: 4,
    date: '2026-08-25',
    name: 'Full mock, targeted repair and freeze',
    goal: 'Measure performance honestly, repair demonstrated mark losses and protect exam-day cognition.',
    milestone: '90-minute mock + 30-minute packaging rehearsal; target >=65% and zero critical leakage/evaluation errors; pack frozen by 17:30.',
    stretch: 'No second full mock and no late rescue. If the mock is poor, use targeted repairs and Mini Mock 2; sleep is mandatory.',
    fallback: 'Mock <50%: Pipeline/leakage/evaluation first, then model choice. 50–64%: two largest sections. >=65%: accuracy, lookup and calm execution only.',
    estimatedHours: 7.6,
    dueDateTime: '2026-08-25 20:00',
    phase: 'Phase 2',
    steps: [
    planStep('Mock setup', 'Clear desk, close AI/chat, set 90-minute work and 30-minute packaging timers. Use only the resources permitted by the simulation.', [], '08:40 Mock setup', 'test'),
    planStep('Full Mock 1', 'Complete without pausing. If stuck >5 minutes, write the correct workflow/code skeleton and move. Save at question boundaries.', [], '09:00 Full Mock 1', 'test'),
    planStep('Packaging rehearsal', 'Run/reopen files, search TODO/wrong names, verify metric labels/data boundaries and rehearse required packaging without improving answers.', [], '10:30 Packaging rehearsal', 'do'),
    planStep('Strict marking', 'Use solution/rubric; separate concept, sklearn/code, debugging, timing and reading losses. Flag critical leakage/evaluation errors outside total.', [], '11:30 Strict marking', 'test'),
    planStep('Repair highest losses', 'Repair at most three issues using exact source <=8m, close, reproduce and altered variant. Friend-priority errors outrank low-yield syllabus detail.', [], '13:00 Repair highest losses', 'do'),
    planStep('Mini Mock 2', 'Complete alternate integrated case with local notes but no AI. Apply repaired behaviours.', [], '14:40 Mini Mock 2', 'test'),
    planStep('Final retrieval/repair', 'Repair at most two critical/amber skills. Finish with 15 friend-priority prompts: preprocessing, features, leakage, cases, model choice, debugging.', [], '15:50 Final retrieval/repair', 'test'),
    planStep('Freeze pack', 'Verify Quick Lookup/code skeleton, key files offline, official rules and backup. Add only missing anchors, not prose.', [], '16:45 Freeze pack', 'do'),
    planStep('Logistics and shutdown', 'Confirm official time/location/rules, charge laptop and prepare ID/charger/water/alarms. Stop by 20:00.', [], '19:15 Logistics and shutdown', 'do'),
    ],
  },
  {
    id: 'D5',
    index: 5,
    date: '2026-08-26',
    name: 'Exam day',
    goal: 'Arrive rested, retrieve the workflow and protect verification/packaging time.',
    milestone: 'No new learning; 45–60 minute warm-up ends at least 90 minutes before departure/login.',
    stretch: 'None. If tired or the exam is early, use a 20-minute workflow/leakage/Pipeline warm-up and stop.',
    fallback: 'Skip code reps if they increase anxiety. Keep brain dump, breakfast and logistics.',
    estimatedHours: 2,
    dueDateTime: '2026-08-26 22:00',
    phase: 'Phase 2',
    steps: [
    planStep('Brain dump', 'Workflow, leakage barriers, metric choices, model matrix and ensemble map on paper.', [], 'T−4h Brain dump', 'test'),
    planStep('Two tiny code reps', 'Write mixed-data Pipeline and GridSearchCV skeleton; run only to catch syntax/API errors.', [], 'T−3h45 Two tiny code reps', 'do'),
    planStep('Mark and close', 'Read only missed lines, then close study material.', [], 'T−3h20 Mark and close', 'read'),
    planStep('Map paper', 'Read questions/marks; label concept/case/code/debug; allocate time and reserve verification.', [], 'Exam start Map paper', 'test'),
    planStep('Answer discipline', 'Decision → reason → check → caveat. Code: shapes/dtypes → safe Pipeline → correct evaluation → save.', [], 'During Answer discipline', 'do'),
    planStep('Verify and package', 'Run/inspect, search TODO/NameError/wrong estimator, confirm metric labels/no leakage, save/reopen and follow official instructions.', [], 'Final 30m Verify and package', 'read'),
    ],
  },
]

function cardFor(day) {
  return {
    id: `aml-marathon-${day.id.toLowerCase()}`,
    number: `AML-${day.index}`,
    sortOrder: 1300 + day.index,
    title: `AML ${day.id} (${day.date}) - ${day.name}`,
    module: 'Applied ML',
    moduleGroup: 'Applied ML',
    phase: day.phase,
    phaseId: day.phase.toLowerCase().replace(/\s+/g, '-'),
    sourceList: 'CMT307 Exam Marathon 20-26 Aug 2026 (Planner_Handoff.json)',
    status: 'Backlog',
    priority: 'Critical',
    slotType: 'Flex',
    slotLabel: `${day.id} of 8 - CMT307 exam marathon - ${day.steps.length} core blocks`,
    startDate: day.date,
    dueDate: day.date,
    dueDateTime: day.dueDateTime,
    estimatedHours: day.estimatedHours,
    deadlineDriven: true,
    sourcePolicy: 'original-only',
    description: day.goal,
    evidenceRequirement: day.milestone,
    doneCondition: day.milestone,
    trackerNotes: `Generated from CMT307_Exam_Marathon_20-26_Aug_2026/01_MASTER_PLAN/04_Planner_Handoff.json (${day.id}). Stretch: ${day.stretch} Fallback: ${day.fallback}`,
    tags: ['exam', 'aml-marathon', 'cmt307', day.id.toLowerCase()],
  }
}

export const AML_MARATHON_CARDS = DAYS.map((day) => cardFor(day))

export const AML_MARATHON_SEQUENCES = Object.fromEntries(
  DAYS.map((day) => [`aml-marathon-${day.id.toLowerCase()}`, { concepts: [], steps: day.steps }]),
)

export const AML_MARATHON_CARD_IDS_BY_DATE = Object.fromEntries(
  DAYS.map((day) => [day.date, `aml-marathon-${day.id.toLowerCase()}`]),
)
