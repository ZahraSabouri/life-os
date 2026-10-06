import { fileType, moduleFileUrl, viewerFor } from '../utils/resourceLinks.js'
import { AML_VIDEOS } from './amlVideoLibrary.js'

// Must match the actual folder names under the workspace root (one level above
// Summer_Rescue_Campaign_2026) — scripts/syncStudyAssets.mjs imports this map
// directly rather than duplicating it, so a rename here is enough to re-point
// the sync. Time Series' source folder was renamed from "MA4508 Time Series"
// to "MAT508 Time Series" on 2026-08-05 without this being updated, which had
// silently broken the sync for every Time Series resource.
export const MODULE_FOLDERS = {
  aml: 'CMT307 Applied Machine Learning',
  timeSeries: 'MAT508 Time Series',
  mat700: 'MAT700 Mathematical Methods for Data Mining',
  teamProject: 'CMT501 Team Project',
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function local(moduleKey, group, title, path, options = {}) {
  return {
    id: options.id ?? `${moduleKey}-${slug(group)}-${slug(title)}`,
    moduleKey,
    group,
    title,
    path,
    type: options.type ?? fileType(path),
    viewer: options.viewer ?? viewerFor(path),
    url: moduleFileUrl(MODULE_FOLDERS[moduleKey], path),
    description: options.description ?? '',
    tags: options.tags ?? [],
    priority: options.priority ?? 'normal',
  }
}

function remote(moduleKey, group, title, url, options = {}) {
  return {
    id: options.id ?? `${moduleKey}-${slug(group)}-${slug(title)}`,
    moduleKey,
    group,
    title,
    path: url,
    type: options.type ?? fileType(url),
    viewer: options.viewer ?? viewerFor(url),
    url,
    description: options.description ?? '',
    tags: options.tags ?? [],
    priority: options.priority ?? 'normal',
    // Present only for timestamped segments of a longer video, so the player can
    // open at the right point instead of the top of a 6h52m recording.
    ...(options.start != null ? { start: options.start } : {}),
    ...(options.end != null ? { end: options.end } : {}),
  }
}

function hero(file) {
  const base = import.meta.env?.BASE_URL || '/'
  return {
    url: `${base}module-heroes/${file}`,
  }
}

function publicFile(moduleKey, group, title, path, options = {}) {
  const base = import.meta.env?.BASE_URL || '/'
  return remote(moduleKey, group, title, `${base}${path.replace(/^\/+/, '')}`, options)
}

const timeSeriesVisual = local(
  'timeSeries',
  'Visual maps',
  'Lecture 8 mind map',
  'Discussions by Professor/NotebookLM Mind Map L8.png',
  {
    id: 'ts-visual-l8-mind-map',
    description: 'Mind-map reference for the ARMA-heavy part of the module.',
  },
)

const mat700Visual = local(
  'mat700',
  'Images',
  'Softmax weights diagram',
  'Tutorials and Examples/images/softmax-weights.png',
  {
    id: 'mat700-visual-softmax',
    description: 'Tutorial image for softmax, weights, and classification notation.',
  },
)

// One consolidated mastery app per lecture \u2014 replaces the old separate
// "Lecture notes" + "Question banks" pair (now archived) with a single
// interactive file per lecture, each independently verified page-by-page
// against the real Lecture{N}.pdf and the three real 2023-2025 past papers.
const mat700FoundationResources = [
  local('mat700', 'Foundation cards', 'MF-01 Mathematical Objects & Notation', 'Print/Foundation/MMDM MF New/MF-01.png', {
    id: 'mat700-mf-01',
    description: 'Print-ready foundation reference card MF-01: Mathematical Objects & Notation.',
    tags: ['foundation', 'mf-01'],
  }),
  local('mat700', 'Foundation cards', 'MF-02 Sets, Subsets, Union & Intersection', 'Print/Foundation/MMDM MF New/MF-02.png', {
    id: 'mat700-mf-02',
    description: 'Print-ready foundation reference card MF-02: Sets, Subsets, Union & Intersection.',
    tags: ['foundation', 'mf-02'],
  }),
  local('mat700', 'Foundation cards', 'MF-03 Sets vs Bags / Multisets', 'Print/Foundation/MMDM MF New/MF-03.png', {
    id: 'mat700-mf-03',
    description: 'Print-ready foundation reference card MF-03: Sets vs Bags / Multisets.',
    tags: ['foundation', 'mf-03'],
  }),
  local('mat700', 'Foundation cards', 'MF-04 Functions, Coordinates, Indices, Sums & Products', 'Print/Foundation/MMDM MF New/MF-04.png', {
    id: 'mat700-mf-04',
    description: 'Print-ready foundation reference card MF-04: Functions, Coordinates, Indices, Sums & Products.',
    tags: ['foundation', 'mf-04'],
  }),
  local('mat700', 'Foundation cards', 'MF-05 Absolute Value, Powers, Roots & Logarithms', 'Print/Foundation/MMDM MF New/MF-05.png', {
    id: 'mat700-mf-05',
    description: 'Print-ready foundation reference card MF-05: Absolute Value, Powers, Roots & Logarithms.',
    tags: ['foundation', 'mf-05'],
  }),
  local('mat700', 'Foundation cards', 'MF-06 Ratios, Normalisation, Min/Max & Argmin/Argmax', 'Print/Foundation/MMDM MF New/MF-06.png', {
    id: 'mat700-mf-06',
    description: 'Print-ready foundation reference card MF-06: Ratios, Normalisation, Min/Max & Argmin/Argmax.',
    tags: ['foundation', 'mf-06'],
  }),
  local('mat700', 'Foundation cards', 'MF-07 Inequalities, Bounds & Logical Statements', 'Print/Foundation/MMDM MF New/MF-07.png', {
    id: 'mat700-mf-07',
    description: 'Print-ready foundation reference card MF-07: Inequalities, Bounds & Logical Statements.',
    tags: ['foundation', 'mf-07'],
  }),
  local('mat700', 'Foundation cards', 'MF-08 How MAT700 Proofs Work', 'Print/Foundation/MMDM MF New/MF-08.png', {
    id: 'mat700-mf-08',
    description: 'Print-ready foundation reference card MF-08: How MAT700 Proofs Work.',
    tags: ['foundation', 'mf-08'],
  }),
  local('mat700', 'Foundation cards', 'MF-09 Events, Probability & Complements', 'Print/Foundation/MMDM MF New/MF-09.png', {
    id: 'mat700-mf-09',
    description: 'Print-ready foundation reference card MF-09: Events, Probability & Complements.',
    tags: ['foundation', 'mf-09'],
  }),
  local('mat700', 'Foundation cards', 'MF-10 Conditional Probability & Bayes', 'Print/Foundation/MMDM MF New/MF-10.png', {
    id: 'mat700-mf-10',
    description: 'Print-ready foundation reference card MF-10: Conditional Probability & Bayes.',
    tags: ['foundation', 'mf-10'],
  }),
  local('mat700', 'Foundation cards', 'MF-11 Independence & Conditional Independence', 'Print/Foundation/MMDM MF New/MF-11.png', {
    id: 'mat700-mf-11',
    description: 'Print-ready foundation reference card MF-11: Independence & Conditional Independence.',
    tags: ['foundation', 'mf-11'],
  }),
  local('mat700', 'Foundation cards', 'MF-12 Indicator Variables, Expectation & Counting', 'Print/Foundation/MMDM MF New/MF-12.png', {
    id: 'mat700-mf-12',
    description: 'Print-ready foundation reference card MF-12: Indicator Variables, Expectation & Counting.',
    tags: ['foundation', 'mf-12'],
  }),
  local('mat700', 'Foundation cards', 'MF-13 Vectors, Coordinates, Norms & Distance Geometry', 'Print/Foundation/MMDM MF New/MF-13.png', {
    id: 'mat700-mf-13',
    description: 'Print-ready foundation reference card MF-13: Vectors, Coordinates, Norms & Distance Geometry.',
    tags: ['foundation', 'mf-13'],
  }),
  local('mat700', 'Foundation cards', 'MF-14 Matrices, Dimensions & Multiplication', 'Print/Foundation/MMDM MF New/MF-14.png', {
    id: 'mat700-mf-14',
    description: 'Print-ready foundation reference card MF-14: Matrices, Dimensions & Multiplication.',
    tags: ['foundation', 'mf-14'],
  }),
  local('mat700', 'Foundation cards', 'MF-15 Graphs, Degree & Adjacency Matrices', 'Print/Foundation/MMDM MF New/MF-15.png', {
    id: 'mat700-mf-15',
    description: 'Print-ready foundation reference card MF-15: Graphs, Degree & Adjacency Matrices.',
    tags: ['foundation', 'mf-15'],
  }),
  local('mat700', 'Foundation cards', 'MF-16 Walks, Matrix Powers & Double Counting', 'Print/Foundation/MMDM MF New/MF-16.png', {
    id: 'mat700-mf-16',
    description: 'Print-ready foundation reference card MF-16: Walks, Matrix Powers & Double Counting.',
    tags: ['foundation', 'mf-16'],
  }),
  local('mat700', 'Foundation cards', 'MF-17 Distance Measures & Triangle-Inequality Reasoning', 'Print/Foundation/MMDM MF New/MF-17.png', {
    id: 'mat700-mf-17',
    description: 'Print-ready foundation reference card MF-17: Distance Measures & Triangle-Inequality Reasoning.',
    tags: ['foundation', 'mf-17'],
  }),
  local('mat700', 'Foundation cards', 'MF-18 Probability Vectors, Stochastic Matrices & Iteration', 'Print/Foundation/MMDM MF New/MF-18.png', {
    id: 'mat700-mf-18',
    description: 'Print-ready foundation reference card MF-18: Probability Vectors, Stochastic Matrices & Iteration.',
    tags: ['foundation', 'mf-18'],
  }),
  local('mat700', 'Foundation cards', 'MF-19 Centroids, Means & Objective Functions', 'Print/Foundation/MMDM MF New/MF-19.png', {
    id: 'mat700-mf-19',
    description: 'Print-ready foundation reference card MF-19: Centroids, Means & Objective Functions.',
    tags: ['foundation', 'mf-19'],
  }),
  local('mat700', 'Foundation cards', 'MF-20 Why an Algorithm Converges', 'Print/Foundation/MMDM MF New/MF-20.png', {
    id: 'mat700-mf-20',
    description: 'Print-ready foundation reference card MF-20: Why an Algorithm Converges.',
    tags: ['foundation', 'mf-20'],
  }),
]

const mat700FormulaResources = [
  local('mat700', 'Formula cards', 'FA-01 Learning Framework, Softmax & Cross-Entropy', 'Print/Formulas/MMDM FA New/FA-01.png', {
    id: 'mat700-fa-01',
    description: 'Print-ready formula reference card FA-01: Learning Framework, Softmax & Cross-Entropy.',
    tags: ['formula', 'fa-01'],
  }),
  local('mat700', 'Formula cards', 'FA-02 Bonferroni Principle + Expected Birthday Collisions', 'Print/Formulas/MMDM FA New/FA-02.png', {
    id: 'mat700-fa-02',
    description: 'Print-ready formula reference card FA-02: Bonferroni Principle + Expected Birthday Collisions.',
    tags: ['formula', 'fa-02'],
  }),
  local('mat700', 'Formula cards', 'FA-03 Complete TF-IDF System', 'Print/Formulas/MMDM FA New/FA-03.png', {
    id: 'mat700-fa-03',
    description: 'Print-ready formula reference card FA-03: Complete TF-IDF System.',
    tags: ['formula', 'fa-03'],
  }),
  local('mat700', 'Formula cards', 'FA-04 Graph & Adjacency-Matrix Toolkit', 'Print/Formulas/MMDM FA New/FA-04.png', {
    id: 'mat700-fa-04',
    description: 'Print-ready formula reference card FA-04: Graph & Adjacency-Matrix Toolkit.',
    tags: ['formula', 'fa-04'],
  }),
  local('mat700', 'Formula cards', 'FA-05 Jaccard Similarity — Sets and Bags', 'Print/Formulas/MMDM FA New/FA-05.png', {
    id: 'mat700-fa-05',
    description: 'Print-ready formula reference card FA-05: Jaccard Similarity — Sets and Bags.',
    tags: ['formula', 'fa-05'],
  }),
  local('mat700', 'Formula cards', 'FA-06 Shingling, Characteristic Matrices & Minhash', 'Print/Formulas/MMDM FA New/FA-06.png', {
    id: 'mat700-fa-06',
    description: 'Print-ready formula reference card FA-06: Shingling, Characteristic Matrices & Minhash.',
    tags: ['formula', 'fa-06'],
  }),
  local('mat700', 'Formula cards', 'FA-07 Distance Measures & Lp Distances', 'Print/Formulas/MMDM FA New/FA-07.png', {
    id: 'mat700-fa-07',
    description: 'Print-ready formula reference card FA-07: Distance Measures & Lp Distances.',
    tags: ['formula', 'fa-07'],
  }),
  local('mat700', 'Formula cards', 'FA-08 Edit, Hamming, Cosine & Jaccard Distances', 'Print/Formulas/MMDM FA New/FA-08.png', {
    id: 'mat700-fa-08',
    description: 'Print-ready formula reference card FA-08: Edit, Hamming, Cosine & Jaccard Distances.',
    tags: ['formula', 'fa-08'],
  }),
  local('mat700', 'Formula cards', 'FA-09 k-Nearest Neighbours & Weighted kNN', 'Print/Formulas/MMDM FA New/FA-09.png', {
    id: 'mat700-fa-09',
    description: 'Print-ready formula reference card FA-09: k-Nearest Neighbours & Weighted kNN.',
    tags: ['formula', 'fa-09'],
  }),
  local('mat700', 'Formula cards', 'FA-10 Confusion Matrix, Precision, Recall, Accuracy & F-Measure', 'Print/Formulas/MMDM FA New/FA-10.png', {
    id: 'mat700-fa-10',
    description: 'Print-ready formula reference card FA-10: Confusion Matrix, Precision, Recall, Accuracy & F-Measure.',
    tags: ['formula', 'fa-10'],
  }),
  local('mat700', 'Formula cards', 'FA-11 Bayes\' Theorem & Naive Bayes Classification', 'Print/Formulas/MMDM FA New/FA-11.png', {
    id: 'mat700-fa-11',
    description: 'Print-ready formula reference card FA-11: Bayes\' Theorem & Naive Bayes Classification.',
    tags: ['formula', 'fa-11'],
  }),
  local('mat700', 'Formula cards', 'FA-12 Naive Bayes Pseudo-Counts + Bayesian Spelling Rule', 'Print/Formulas/MMDM FA New/FA-12.png', {
    id: 'mat700-fa-12',
    description: 'Print-ready formula reference card FA-12: Naive Bayes Pseudo-Counts + Bayesian Spelling Rule.',
    tags: ['formula', 'fa-12'],
  }),
  local('mat700', 'Formula cards', 'FA-13 PageRank: Transition Matrix + Idealised PageRank', 'Print/Formulas/MMDM FA New/FA-13.png', {
    id: 'mat700-fa-13',
    description: 'Print-ready formula reference card FA-13: PageRank: Transition Matrix + Idealised PageRank.',
    tags: ['formula', 'fa-13'],
  }),
  local('mat700', 'Formula cards', 'FA-14 Damped PageRank — Spider Traps & Teleportation', 'Print/Formulas/MMDM FA New/FA-14.png', {
    id: 'mat700-fa-14',
    description: 'Print-ready formula reference card FA-14: Damped PageRank — Spider Traps & Teleportation.',
    tags: ['formula', 'fa-14'],
  }),
  local('mat700', 'Formula cards', 'FA-15 Hierarchical Clustering + Cluster Distance', 'Print/Formulas/MMDM FA New/FA-15.png', {
    id: 'mat700-fa-15',
    description: 'Print-ready formula reference card FA-15: Hierarchical Clustering + Cluster Distance.',
    tags: ['formula', 'fa-15'],
  }),
  local('mat700', 'Formula cards', 'FA-16 k-Means — Objective, Centroids & Update Loop', 'Print/Formulas/MMDM FA New/FA-16.png', {
    id: 'mat700-fa-16',
    description: 'Print-ready formula reference card FA-16: k-Means — Objective, Centroids & Update Loop.',
    tags: ['formula', 'fa-16'],
  }),
  local('mat700', 'Formula cards', 'FA-17 Meta-Algorithms, Online Learning & Halving', 'Print/Formulas/MMDM FA New/FA-17.png', {
    id: 'mat700-fa-17',
    description: 'Print-ready formula reference card FA-17: Meta-Algorithms, Online Learning & Halving.',
    tags: ['formula', 'fa-17'],
  }),
  local('mat700', 'Formula cards', 'FA-18 Halving Algorithm — Mistake Bound', 'Print/Formulas/MMDM FA New/FA-18.png', {
    id: 'mat700-fa-18',
    description: 'Print-ready formula reference card FA-18: Halving Algorithm — Mistake Bound.',
    tags: ['formula', 'fa-18'],
  }),
  local('mat700', 'Formula cards', 'FA-19 Weighted Majority Algorithm', 'Print/Formulas/MMDM FA New/FA-19.png', {
    id: 'mat700-fa-19',
    description: 'Print-ready formula reference card FA-19: Weighted Majority Algorithm.',
    tags: ['formula', 'fa-19'],
  }),
  local('mat700', 'Formula cards', 'FA-20 Weighted Majority — Potential Argument & Performance Bound', 'Print/Formulas/MMDM FA New/FA-20.png', {
    id: 'mat700-fa-20',
    description: 'Print-ready formula reference card FA-20: Weighted Majority — Potential Argument & Performance Bound.',
    tags: ['formula', 'fa-20'],
  }),
  local('mat700', 'Formula cards', 'FA-21 Supervised vs Unsupervised Learning', 'Print/Formulas/MMDM FA New/FA-21.png', {
    id: 'mat700-fa-21',
    description: 'Print-ready formula reference card FA-21: Supervised vs Unsupervised Learning.',
    tags: ['formula', 'fa-21'],
  }),
  local('mat700', 'Formula cards', 'FA-22 Training, Cross-Validation, Testing & Generalisation', 'Print/Formulas/MMDM FA New/FA-22.png', {
    id: 'mat700-fa-22',
    description: 'Print-ready formula reference card FA-22: Training, Cross-Validation, Testing & Generalisation.',
    tags: ['formula', 'fa-22'],
  }),
  local('mat700', 'Formula cards', 'FA-23 Clustroids in Non-Euclidean Clustering', 'Print/Formulas/MMDM FA New/FA-23.png', {
    id: 'mat700-fa-23',
    description: 'Print-ready formula reference card FA-23: Clustroids in Non-Euclidean Clustering.',
    tags: ['formula', 'fa-23'],
  }),
  local('mat700', 'Formula cards', 'FA-24 Why k-Means Terminates', 'Print/Formulas/MMDM FA New/FA-24.png', {
    id: 'mat700-fa-24',
    description: 'Print-ready formula reference card FA-24: Why k-Means Terminates.',
    tags: ['formula', 'fa-24'],
  }),
]

const mat700LectureResources = [
  local('mat700', 'Mastery guides', 'Lecture 1 mastery app', 'Study Notes/MAT700_Lecture1_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-1',
    description: 'The one note file for Lecture 1: what is data mining/ML, stats vs data mining, fake correlations, Bonferroni\u2019s principle, the birthday paradox, and labelled/unlabelled data, taught from the real 28-page Lecture1.pdf plus its supplement, with exact 2023-2025 past-paper citations and reveal-answer drills. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 1'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 2 mastery app', 'Study Notes/MAT700_Lecture2_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-2',
    description: 'The one note file for Lecture 2: the D/P(Z)/H/f/L learning framework, instance- vs model-based learning, softmax and cross entropy, TF-IDF and the vector space model, and graph-theory foundations (walks, paths, adjacency matrices), taught from the real 37-page Lecture2.pdf and Tutorial 1\u2019s solved problems, with exact past-paper citations. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 2'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 3 mastery app', 'Study Notes/MAT700_Lecture3_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-3',
    description: 'The one note file for Lecture 3: finding similar items via shingling, minhashing, and Jaccard similarity, taught from the real 27-page Lecture3.pdf with exact past-paper citations and reveal-answer drills. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 3'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 4 mastery app', 'Study Notes/MAT700_Lecture4_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-4',
    description: 'The one note file for Lecture 4: distance measures (L1/L2/Lr/Jaccard/cosine/edit/Hamming), the k-NN algorithm, generalisation and overfitting, precision/recall/F-measure, and Naive Bayes classification, taught from the real 32-page Lecture4.pdf (including a 12-page image-only MNIST/decision-boundary block the old legacy notes had missed entirely) and Tutorials 2-3, with exact past-paper citations. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 4'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 5 mastery app', 'Study Notes/MAT700_Lecture5_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-5',
    description: 'The one note file for Lecture 5: PageRank \u2014 the tiny-web transition matrix, idealised power iteration, dead ends and spider traps, and the taxation/damping formula, taught from the real 24-page Lecture5.pdf and Tutorial 3\u2019s solved problems, with worked examples cross-checked by exact-fraction computation and exact past-paper citations. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 5'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 6 mastery app', 'Study Notes/MAT700_Lecture6_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-6',
    description: 'The one note file for Lecture 6: clustering \u2014 hierarchical/agglomerative merge rules, the clustroid for non-Euclidean spaces, and the k-means algorithm with its convergence proof, taught from the real 20-page Lecture6.pdf with a hand-checkable numeric k-means trace and exact past-paper citations. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 6'],
    priority: 'high',
  }),
  local('mat700', 'Mastery guides', 'Lecture 7 mastery app', 'Study Notes/MAT700_Lecture7_Interactive_Mastery_App.html', {
    id: 'mat700-mastery-lecture-7',
    description: 'The one note file for Lecture 7 (the module\u2019s final lecture): meta-algorithms and online learning \u2014 the halving algorithm\u2019s mistake-bound proof, multiplicative weights, and the weighted majority algorithm\u2019s potential-function proof, taught from the real 14-page Lecture7.pdf with interactive mistake-bound/weight-trace demos and exact past-paper citations. Has its own timer and saves progress locally in the frame.',
    tags: ['mastery guide', 'lecture 7'],
    priority: 'high',
  }),
]

// One self-contained timed mock exam per lecture (own timer + reveal-solutions
// marking guide baked into the HTML), styled on the real 2023-2025 papers'
// phrasing/sub-part/mark conventions, with every question labelled by source
// (adapted from a named real past-paper question, or generated gap coverage).
const mat700MockResources = [
  local('mat700', 'Mock exams', 'Lecture 1 mock exam (45 min, 37 marks)', 'Mocks/MAT700_Lecture1_Mock_Exam.html', {
    id: 'mat700-mock-lecture-1',
    description: 'Timed closed-book paper covering Bonferroni’s principle, the birthday paradox, fake correlations, and labelled/unlabelled data. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 1', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 2 mock exam (80 min, 50 marks)', 'Mocks/MAT700_Lecture2_Mock_Exam.html', {
    id: 'mat700-mock-lecture-2',
    description: 'Timed closed-book paper covering the D/P(Z)/H/f/L learning framework, softmax/cross entropy, TF-IDF, and graph-theory foundations. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 2', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 3 mock exam (50 min, 32 marks)', 'Mocks/MAT700_Lecture3_Mock_Exam.html', {
    id: 'mat700-mock-lecture-3',
    description: 'Timed closed-book paper covering set/bag Jaccard similarity, shingling, and minhashing. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 3', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 4 mock exam (80 min, 59 marks)', 'Mocks/MAT700_Lecture4_Mock_Exam.html', {
    id: 'mat700-mock-lecture-4',
    description: 'Timed closed-book paper covering distance measures, k-NN, precision/recall/F-measure, and Naive Bayes. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 4', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 5 mock exam (51 min, 32 marks)', 'Mocks/MAT700_Lecture5_Mock_Exam.html', {
    id: 'mat700-mock-lecture-5',
    description: 'Timed closed-book paper covering PageRank: transition matrices, dead ends, spider traps, and taxation/damping. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 5', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 6 mock exam (65 min, 41 marks)', 'Mocks/MAT700_Lecture6_Mock_Exam.html', {
    id: 'mat700-mock-lecture-6',
    description: 'Timed closed-book paper covering the k-means algorithm, its convergence proof, and hierarchical clustering/clustroid. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 6', 'timed'],
    priority: 'high',
  }),
  local('mat700', 'Mock exams', 'Lecture 7 mock exam (55 min, 37 marks)', 'Mocks/MAT700_Lecture7_Mock_Exam.html', {
    id: 'mat700-mock-lecture-7',
    description: 'Timed closed-book paper covering the halving algorithm, multiplicative weights, and the weighted majority algorithm. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
    tags: ['mock', 'exam', 'mock exam', 'lecture 7', 'timed'],
    priority: 'high',
  }),
]

const timeSeriesFoundationResources = [
  local('timeSeries', 'Foundation cards', 'MF-01 Sequence, Signal & Noise', 'Print/Math Foundation/TS MF New/MF-01.png', {
    id: 'timeSeries-mf-01',
    description: 'Print-ready foundation reference card MF-01: Sequence, Signal & Noise.',
    tags: ['foundation', 'mf-01'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-02 Moving Windows, Boundaries & Recursion', 'Print/Math Foundation/TS MF New/MF-02.png', {
    id: 'timeSeries-mf-02',
    description: 'Print-ready foundation reference card MF-02: Moving Windows, Boundaries & Recursion.',
    tags: ['foundation', 'mf-02'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-03 Sample Space & Probability', 'Print/Math Foundation/TS MF New/MF-03.png', {
    id: 'timeSeries-mf-03',
    description: 'Print-ready foundation reference card MF-03: Sample Space & Probability.',
    tags: ['foundation', 'mf-03'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-04 Random Variables', 'Print/Math Foundation/TS MF New/MF-04.png', {
    id: 'timeSeries-mf-04',
    description: 'Print-ready foundation reference card MF-04: Random Variables.',
    tags: ['foundation', 'mf-04'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-05 Discrete vs Continuous', 'Print/Math Foundation/TS MF New/MF-05.png', {
    id: 'timeSeries-mf-05',
    description: 'Print-ready foundation reference card MF-05: Discrete vs Continuous.',
    tags: ['foundation', 'mf-05'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-06 PMF, PDF & CDF', 'Print/Math Foundation/TS MF New/MF-06.png', {
    id: 'timeSeries-mf-06',
    description: 'Print-ready foundation reference card MF-06: PMF, PDF & CDF.',
    tags: ['foundation', 'mf-06'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-07 Expectation, Variance & Standard Deviation', 'Print/Math Foundation/TS MF New/MF-07.png', {
    id: 'timeSeries-mf-07',
    description: 'Print-ready foundation reference card MF-07: Expectation, Variance & Standard Deviation.',
    tags: ['foundation', 'mf-07'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-08 Covariance & Correlation', 'Print/Math Foundation/TS MF New/MF-08.png', {
    id: 'timeSeries-mf-08',
    description: 'Print-ready foundation reference card MF-08: Covariance & Correlation.',
    tags: ['foundation', 'mf-08'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-09 Time-Indexed Family & Sample Paths', 'Print/Math Foundation/TS MF New/MF-09.png', {
    id: 'timeSeries-mf-09',
    description: 'Print-ready foundation reference card MF-09: Time-Indexed Family & Sample Paths.',
    tags: ['foundation', 'mf-09'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-10 Finite-Dimensional Distributions & Lag', 'Print/Math Foundation/TS MF New/MF-10.png', {
    id: 'timeSeries-mf-10',
    description: 'Print-ready foundation reference card MF-10: Finite-Dimensional Distributions & Lag.',
    tags: ['foundation', 'mf-10'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-11 Notation Decoder', 'Print/Math Foundation/TS MF New/MF-11.png', {
    id: 'timeSeries-mf-11',
    description: 'Print-ready foundation reference card MF-11: Notation Decoder.',
    tags: ['foundation', 'mf-11'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-12 Frequency, Period & Spectral Symbols', 'Print/Math Foundation/TS MF New/MF-12.png', {
    id: 'timeSeries-mf-12',
    description: 'Print-ready foundation reference card MF-12: Frequency, Period & Spectral Symbols.',
    tags: ['foundation', 'mf-12'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-13 Vectors, Matrices & Prediction Notation', 'Print/Math Foundation/TS MF New/MF-13.png', {
    id: 'timeSeries-mf-13',
    description: 'Print-ready foundation reference card MF-13: Vectors, Matrices & Prediction Notation.',
    tags: ['foundation', 'mf-13'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-14 AR/MA Memory & Backshift Operator B', 'Print/Math Foundation/TS MF New/MF-14.png', {
    id: 'timeSeries-mf-14',
    description: 'Print-ready foundation reference card MF-14: AR/MA Memory & Backshift Operator B.',
    tags: ['foundation', 'mf-14'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-15 Polynomials, Roots & the Unit Circle', 'Print/Math Foundation/TS MF New/MF-15.png', {
    id: 'timeSeries-mf-15',
    description: 'Print-ready foundation reference card MF-15: Polynomials, Roots & the Unit Circle.',
    tags: ['foundation', 'mf-15'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-16 True Quantities, Hats & Recursive Forecasts', 'Print/Math Foundation/TS MF New/MF-16.png', {
    id: 'timeSeries-mf-16',
    description: 'Print-ready foundation reference card MF-16: True Quantities, Hats & Recursive Forecasts.',
    tags: ['foundation', 'mf-16'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-17 Differencing, Accumulation & Back-Transform', 'Print/Math Foundation/TS MF New/MF-17.png', {
    id: 'timeSeries-mf-17',
    description: 'Print-ready foundation reference card MF-17: Differencing, Accumulation & Back-Transform.',
    tags: ['foundation', 'mf-17'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-18 Log Transform vs First Difference', 'Print/Math Foundation/TS MF New/MF-18.png', {
    id: 'timeSeries-mf-18',
    description: 'Print-ready foundation reference card MF-18: Log Transform vs First Difference.',
    tags: ['foundation', 'mf-18'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-19 ACF, PACF & AIC', 'Print/Math Foundation/TS MF New/MF-19.png', {
    id: 'timeSeries-mf-19',
    description: 'Print-ready foundation reference card MF-19: ACF, PACF & AIC.',
    tags: ['foundation', 'mf-19'],
  }),
  local('timeSeries', 'Foundation cards', 'MF-20 SVD From Zero, for SSA', 'Print/Math Foundation/TS MF New/MF-20.png', {
    id: 'timeSeries-mf-20',
    description: 'Print-ready foundation reference card MF-20: SVD From Zero, for SSA.',
    tags: ['foundation', 'mf-20'],
  }),
]

const timeSeriesFormulaResources = [
  local('timeSeries', 'Formula cards', 'FA-01 Moving Averages & Holt–Winters', 'Print/Formula/TS FA New/FA-01.png', {
    id: 'timeSeries-fa-01',
    description: 'Print-ready formula reference card FA-01: Moving Averages & Holt–Winters.',
    tags: ['formula', 'fa-01'],
  }),
  local('timeSeries', 'Formula cards', 'FA-02 Stochastic Processes & Stationarity', 'Print/Formula/TS FA New/FA-02.png', {
    id: 'timeSeries-fa-02',
    description: 'Print-ready formula reference card FA-02: Stochastic Processes & Stationarity.',
    tags: ['formula', 'fa-02'],
  }),
  local('timeSeries', 'Formula cards', 'FA-03 Covariance, WSS & Gaussian Processes', 'Print/Formula/TS FA New/FA-03.png', {
    id: 'timeSeries-fa-03',
    description: 'Print-ready formula reference card FA-03: Covariance, WSS & Gaussian Processes.',
    tags: ['formula', 'fa-03'],
  }),
  local('timeSeries', 'Formula cards', 'FA-04 White Noise & Random Walk', 'Print/Formula/TS FA New/FA-04.png', {
    id: 'timeSeries-fa-04',
    description: 'Print-ready formula reference card FA-04: White Noise & Random Walk.',
    tags: ['formula', 'fa-04'],
  }),
  local('timeSeries', 'Formula cards', 'FA-05 Brownian Motion, Bridge & Poisson Process', 'Print/Formula/TS FA New/FA-05.png', {
    id: 'timeSeries-fa-05',
    description: 'Print-ready formula reference card FA-05: Brownian Motion, Bridge & Poisson Process.',
    tags: ['formula', 'fa-05'],
  }),
  local('timeSeries', 'Formula cards', 'FA-06 Moving-Average Overlap & Memory', 'Print/Formula/TS FA New/FA-06.png', {
    id: 'timeSeries-fa-06',
    description: 'Print-ready formula reference card FA-06: Moving-Average Overlap & Memory.',
    tags: ['formula', 'fa-06'],
  }),
  local('timeSeries', 'Formula cards', 'FA-07 Mercer/Karhunen-Loève & Bochner–Khinchin', 'Print/Formula/TS FA New/FA-07.png', {
    id: 'timeSeries-fa-07',
    description: 'Print-ready formula reference card FA-07: Mercer/Karhunen-Loève & Bochner–Khinchin.',
    tags: ['formula', 'fa-07'],
  }),
  local('timeSeries', 'Formula cards', 'FA-08 Spectra, Filtering & Convolution', 'Print/Formula/TS FA New/FA-08.png', {
    id: 'timeSeries-fa-08',
    description: 'Print-ready formula reference card FA-08: Spectra, Filtering & Convolution.',
    tags: ['formula', 'fa-08'],
  }),
  local('timeSeries', 'Formula cards', 'FA-09 Linear Forecasting & BLUP', 'Print/Formula/TS FA New/FA-09.png', {
    id: 'timeSeries-fa-09',
    description: 'Print-ready formula reference card FA-09: Linear Forecasting & BLUP.',
    tags: ['formula', 'fa-09'],
  }),
  local('timeSeries', 'Formula cards', 'FA-10 Sample Estimation, Correlogram & Periodogram', 'Print/Formula/TS FA New/FA-10.png', {
    id: 'timeSeries-fa-10',
    description: 'Print-ready formula reference card FA-10: Sample Estimation, Correlogram & Periodogram.',
    tags: ['formula', 'fa-10'],
  }),
  local('timeSeries', 'Formula cards', 'FA-11 AR/MA/ARMA + Root Rules', 'Print/Formula/TS FA New/FA-11.png', {
    id: 'timeSeries-fa-11',
    description: 'Print-ready formula reference card FA-11: AR/MA/ARMA + Root Rules.',
    tags: ['formula', 'fa-11'],
  }),
  local('timeSeries', 'Formula cards', 'FA-12 ARMA Spectrum, Covariance & Yule–Walker', 'Print/Formula/TS FA New/FA-12.png', {
    id: 'timeSeries-fa-12',
    description: 'Print-ready formula reference card FA-12: ARMA Spectrum, Covariance & Yule–Walker.',
    tags: ['formula', 'fa-12'],
  }),
  local('timeSeries', 'Formula cards', 'FA-13 AR Correlation Structure', 'Print/Formula/TS FA New/FA-13.png', {
    id: 'timeSeries-fa-13',
    description: 'Print-ready formula reference card FA-13: AR Correlation Structure.',
    tags: ['formula', 'fa-13'],
  }),
  local('timeSeries', 'Formula cards', 'FA-14 MA(∞) Coefficients & ARMA Engines', 'Print/Formula/TS FA New/FA-14.png', {
    id: 'timeSeries-fa-14',
    description: 'Print-ready formula reference card FA-14: MA(∞) Coefficients & ARMA Engines.',
    tags: ['formula', 'fa-14'],
  }),
  local('timeSeries', 'Formula cards', 'FA-15 Fitting AR(p)', 'Print/Formula/TS FA New/FA-15.png', {
    id: 'timeSeries-fa-15',
    description: 'Print-ready formula reference card FA-15: Fitting AR(p).',
    tags: ['formula', 'fa-15'],
  }),
  local('timeSeries', 'Formula cards', 'FA-16 Fitting MA(1)', 'Print/Formula/TS FA New/FA-16.png', {
    id: 'timeSeries-fa-16',
    description: 'Print-ready formula reference card FA-16: Fitting MA(1).',
    tags: ['formula', 'fa-16'],
  }),
  local('timeSeries', 'Formula cards', 'FA-17 AR/ARMA Forecasting', 'Print/Formula/TS FA New/FA-17.png', {
    id: 'timeSeries-fa-17',
    description: 'Print-ready formula reference card FA-17: AR/ARMA Forecasting.',
    tags: ['formula', 'fa-17'],
  }),
  local('timeSeries', 'Formula cards', 'FA-18 ARIMA + Recursive Forecast', 'Print/Formula/TS FA New/FA-18.png', {
    id: 'timeSeries-fa-18',
    description: 'Print-ready formula reference card FA-18: ARIMA + Recursive Forecast.',
    tags: ['formula', 'fa-18'],
  }),
  local('timeSeries', 'Formula cards', 'FA-19 SARIMA & Seasonal Differencing', 'Print/Formula/TS FA New/FA-19.png', {
    id: 'timeSeries-fa-19',
    description: 'Print-ready formula reference card FA-19: SARIMA & Seasonal Differencing.',
    tags: ['formula', 'fa-19'],
  }),
  local('timeSeries', 'Formula cards', 'FA-20 Transforms, Model Comparison & Forecast Reversal', 'Print/Formula/TS FA New/FA-20.png', {
    id: 'timeSeries-fa-20',
    description: 'Print-ready formula reference card FA-20: Transforms, Model Comparison & Forecast Reversal.',
    tags: ['formula', 'fa-20'],
  }),
  local('timeSeries', 'Formula cards', 'FA-21 SSA: Embedding & Trajectory Matrix', 'Print/Formula/TS FA New/FA-21.png', {
    id: 'timeSeries-fa-21',
    description: 'Print-ready formula reference card FA-21: SSA: Embedding & Trajectory Matrix.',
    tags: ['formula', 'fa-21'],
  }),
  local('timeSeries', 'Formula cards', 'FA-22 SSA: Decomposition & Reconstruction', 'Print/Formula/TS FA New/FA-22.png', {
    id: 'timeSeries-fa-22',
    description: 'Print-ready formula reference card FA-22: SSA: Decomposition & Reconstruction.',
    tags: ['formula', 'fa-22'],
  }),
  local('timeSeries', 'Formula cards', 'FA-23 SSA: Finite-Rank Theory', 'Print/Formula/TS FA New/FA-23.png', {
    id: 'timeSeries-fa-23',
    description: 'Print-ready formula reference card FA-23: SSA: Finite-Rank Theory.',
    tags: ['formula', 'fa-23'],
  }),
  local('timeSeries', 'Formula cards', 'FA-24 SSA: Recurrent vs Vector Forecasting', 'Print/Formula/TS FA New/FA-24.png', {
    id: 'timeSeries-fa-24',
    description: 'Print-ready formula reference card FA-24: SSA: Recurrent vs Vector Forecasting.',
    tags: ['formula', 'fa-24'],
  }),
]

const timeSeriesRSyntaxResources = [
  local('timeSeries', 'R syntax cards', 'R-01 Core R & Smoothing', 'Print/R/TS R New/R-01.png', {
    id: 'timeSeries-r-01',
    description: 'Print-ready r syntax reference card R-01: Core R & Smoothing.',
    tags: ['r syntax', 'r-01'],
  }),
  local('timeSeries', 'R syntax cards', 'R-02 Gaussian + White Noise + Random Walk', 'Print/R/TS R New/R-02.png', {
    id: 'timeSeries-r-02',
    description: 'Print-ready r syntax reference card R-02: Gaussian + White Noise + Random Walk.',
    tags: ['r syntax', 'r-02'],
  }),
  local('timeSeries', 'R syntax cards', 'R-03 Brownian Motion + Bridge + Poisson', 'Print/R/TS R New/R-03.png', {
    id: 'timeSeries-r-03',
    description: 'Print-ready r syntax reference card R-03: Brownian Motion + Bridge + Poisson.',
    tags: ['r syntax', 'r-03'],
  }),
  local('timeSeries', 'R syntax cards', 'R-04 Sinusoids, Periodogram & FIR Filtering', 'Print/R/TS R New/R-04.png', {
    id: 'timeSeries-r-04',
    description: 'Print-ready r syntax reference card R-04: Sinusoids, Periodogram & FIR Filtering.',
    tags: ['r syntax', 'r-04'],
  }),
  local('timeSeries', 'R syntax cards', 'R-05 BLUP: Gamma → solve() → Forecast → Interval', 'Print/R/TS R New/R-05.png', {
    id: 'timeSeries-r-05',
    description: 'Print-ready r syntax reference card R-05: BLUP: Gamma → solve() → Forecast → Interval.',
    tags: ['r syntax', 'r-05'],
  }),
  local('timeSeries', 'R syntax cards', 'R-06 Covariance, Correlogram & Yule–Walker Estimation', 'Print/R/TS R New/R-06.png', {
    id: 'timeSeries-r-06',
    description: 'Print-ready r syntax reference card R-06: Covariance, Correlogram & Yule–Walker Estimation.',
    tags: ['r syntax', 'r-06'],
  }),
  local('timeSeries', 'R syntax cards', 'R-07 Periodogram: Direct + FFT', 'Print/R/TS R New/R-07.png', {
    id: 'timeSeries-r-07',
    description: 'Print-ready r syntax reference card R-07: Periodogram: Direct + FFT.',
    tags: ['r syntax', 'r-07'],
  }),
  local('timeSeries', 'R syntax cards', 'R-08 AR/ARMA Simulation + Roots + Forecast', 'Print/R/TS R New/R-08.png', {
    id: 'timeSeries-r-08',
    description: 'Print-ready r syntax reference card R-08: AR/ARMA Simulation + Roots + Forecast.',
    tags: ['r syntax', 'r-08'],
  }),
  local('timeSeries', 'R syntax cards', 'R-09 Airpass Case Study I', 'Print/R/TS R New/R-09.png', {
    id: 'timeSeries-r-09',
    description: 'Print-ready r syntax reference card R-09: Airpass Case Study I.',
    tags: ['r syntax', 'r-09'],
  }),
  local('timeSeries', 'R syntax cards', 'R-10 Airpass Case Study II', 'Print/R/TS R New/R-10.png', {
    id: 'timeSeries-r-10',
    description: 'Print-ready r syntax reference card R-10: Airpass Case Study II.',
    tags: ['r syntax', 'r-10'],
  }),
  local('timeSeries', 'R syntax cards', 'R-11 Earth Ocean Temperature + Nile', 'Print/R/TS R New/R-11.png', {
    id: 'timeSeries-r-11',
    description: 'Print-ready r syntax reference card R-11: Earth Ocean Temperature + Nile.',
    tags: ['r syntax', 'r-11'],
  }),
  local('timeSeries', 'R syntax cards', 'R-12 Rssa / SSA Workflow', 'Print/R/TS R New/R-12.png', {
    id: 'timeSeries-r-12',
    description: 'Print-ready r syntax reference card R-12: Rssa / SSA Workflow.',
    tags: ['r syntax', 'r-12'],
  }),
]

const teamProjectAdminResources = [
  local('teamProject', 'Module admin', 'CMT501 plan and weekly module map', 'About your module/CMT501Plan and weekly-module-map - Tagged.pdf', {
    description: 'Module plan and weekly map for CMT501 Team Project.',
    tags: ['plan', 'weekly map'],
    priority: 'high',
  }),
  local('teamProject', 'Module admin', 'Module description', 'About your module/Module Description.docx', {
    description: 'Official CMT501 module description document.',
    tags: ['module description'],
  }),
]

const teamProjectAssessmentResources = [
  local('teamProject', 'Assessment', 'Assessment 1 demo brief', 'Assessment & Feedback/CMT501 Assessment 1 Demo.pdf', {
    description: 'Assessment 1 demo expectations and marking context.',
    tags: ['assessment', 'demo'],
    priority: 'high',
  }),
  local('teamProject', 'Assessment', 'Assessment 2 report brief', 'Assessment & Feedback/CMT501 Assessment 2 Report.pdf', {
    description: 'Assessment 2 report requirements and evidence expectations.',
    tags: ['assessment', 'report', 'evidence'],
    priority: 'high',
  }),
]

const teamProjectSessionResources = [
  local('teamProject', 'Session 1', 'Individual Git slides', 'Session 1/Individual Git.pdf', {
    description: 'Session 1 Git material for individual workflow catch-up.',
    tags: ['git', 'session 1'],
  }),
  local(
    'teamProject',
    'Session 1',
    'SPIDR user-story splitting article',
    'Session 1/SPIDR_ Five Simple but Powerful Ways to Split User Stories - Mountain Goat Software.pdf',
    {
      description: 'Story-splitting reference for keeping project increments small.',
      tags: ['spidr', 'stories', 'scope'],
    },
  ),
  local('teamProject', 'Session 2', 'Team GitLab slides', 'Session 2/Team Gitlab.pdf', {
    description: 'Team GitLab workflow material from the 2 July session.',
    tags: ['gitlab', 'teamwork', 'session 2'],
    priority: 'high',
  }),
  local(
    'teamProject',
    'Session 2',
    'GitLab Flow article',
    'Session 2/Gitlab Flow - Article about Gitlab Flow. Using branch workflow effectively in Gitlab..pdf',
    {
      description: 'Branch workflow reference for issues, merge requests, review, and merge.',
      tags: ['gitlab', 'branches', 'merge requests'],
      priority: 'high',
    },
  ),
]

const teamProjectTranscriptResources = [
  local(
    'teamProject',
    'Transcripts',
    '2 Jul Student Futures and Teamwork with GitLab transcript',
    'Transcripts/Lecture - 02.07.2026 (Student Futures and Teamwork with Gitlab).txt',
    {
      description: 'Transcript covering GitLab teamwork, issue/milestone practice, and the e-voting exercise.',
      tags: ['2 july', 'gitlab', 'e-voting', 'teamwork'],
      priority: 'high',
    },
  ),
  local(
    'teamProject',
    'Transcripts',
    '2 Jul Team and Project Selections transcript',
    'Transcripts/Lecture - 02.07.2026 (Team and Project Selections).txt',
    {
      description: 'Transcript covering team/project selection and assessment expectations.',
      tags: ['2 july', 'project selection', 'assessment'],
      priority: 'high',
    },
  ),
  local(
    'teamProject',
    'Transcripts',
    '30 Jun Git for Individual Work Part 1 transcript',
    'Transcripts/Lecture - 30.06.2026 (Git for Individual Work Part 1).txt',
    {
      description: 'Earlier Git/GitLab setup transcript for individual workflow recovery.',
      tags: ['git', 'gitlab', '30 june'],
    },
  ),
  local(
    'teamProject',
    'Transcripts',
    '30 Jun Git for Individual Work Part 2 transcript',
    'Transcripts/Lecture - 30.06.2026 (Git for Individual Work Part 2).txt',
    {
      description: "Earlier Git/GitLab transcript including D'Hondt setup context.",
      tags: ['git', 'dhondt', '30 june'],
    },
  ),
]

const timeSeriesPastPaperResources = [
  [2015, 'ma0367_2015_exam-.pdf'],
  [2016, 'ma0367_2016_exam_.pdf'],
  [2017, 'ma0367_2017_exam_.pdf'],
  [2018, 'ma0367_2018_exam_.pdf'],
  [2019, 'ma0367_2019_exam_.pdf'],
  [2020, 'ma0367_2020_exam_.pdf'],
].map(([year, file]) =>
  local(
    'timeSeries',
    'Past papers',
    `${year} past exam paper`,
    `Past Exams Papers/${file}`,
    {
      description: `Real Time Series past exam paper from ${year}.`,
      tags: ['paper', String(year)],
      priority: 'high',
    },
  ),
)

const timeSeriesExamExerciseResources = [3, 4, 5, 6, 7, 8, 9].map((lecture) =>
  local('timeSeries', 'Exam-like exercises', `Exam-like exercises L${lecture}`, `Learning Materials/exam-like-exercises-L${lecture}.pdf`, {
    description: `Template drilling exercises for lecture ${lecture}.`,
    tags: ['exercise', 'exam', `lecture ${lecture}`],
    priority: 'high',
  }),
)

const timeSeriesExerciseSolutionResources = [
  ['L3', 'solution-exam-like-exercises-L3.pdf'],
  ['L4', 'solution-exam-like-exercises-L4.pdf'],
  ['L5', 'solution-exam-like-exercises-L5.pdf'],
  ['L6-L7', 'solution-exam-like-exercises-L6-L7.pdf'],
  ['L8', 'solution-exam-like-exercises-L8.pdf'],
  ['L9', 'solution-exam-like-exercises-L9.pdf'],
].map(([label, file]) =>
  local('timeSeries', 'Exam-like solutions', `Exam-like solutions ${label}`, `Some solutions/${file}`, {
    description: `Worked solution set for Time Series ${label} exam-like exercises.`,
    tags: ['solution', 'exam', label.toLowerCase()],
    priority: 'high',
  }),
)

const timeSeriesCompleteLectureResources = Array.from({ length: 12 }, (_, index) => {
  const lecture = index + 4
  return local('timeSeries', 'Lecture notes', `Complete lecture ${lecture} notes`, `Complete lecture notes/ma3508_lecture${lecture}.pdf`, {
    description: `Complete Time Series lecture ${lecture} notes.`,
    tags: ['lecture notes', `lecture ${lecture}`],
  })
})

const timeSeriesLearningLectureResources = [1, 2, 3, 14, 15].map((lecture) =>
  local('timeSeries', 'Original class materials', `Lecture ${lecture} original class material`, `Learning Materials/ma3508_lecture${lecture}.pdf`, {
    // Keep the original generated id so existing card links and any progress or
    // notes already saved against this PDF continue to resolve after the clearer
    // title/group correction.
    id: `timeSeries-lecture-notes-lecture-${lecture}-learning-material-notes`,
    description: `Original Time Series class PDF supplied for Lecture ${lecture}; add your own progress, notes, and questions against this source.`,
    tags: ['class material', 'original pdf', `lecture ${lecture}`],
  }),
)

const timeSeriesGapLectureResources = [
  [4, 'ma3508_lecture4_with_gaps.pdf'],
  [5, 'ma3508_lecture5_with_gaps.pdf'],
  [6, 'ma3508_lecture6_with_gaps.pdf'],
  [7, 'ma3508_lecture7_with_gaps.pdf'],
  [8, 'ma3508_lecture8_with_gaps.pdf'],
  [9, 'ma3508_lecture9_with_gaps(1).pdf'],
  [10, 'ma3508_lecture10_with_gaps.pdf'],
  [11, 'ma3508_lecture11_with_gaps.pdf'],
  [12, 'ma3508_lecture12_with_gaps.pdf'],
  [13, 'ma3508_lecture13_with_gaps(1).pdf'],
].map(([lecture, file]) =>
  local('timeSeries', 'Lecture notes with gaps', `Lecture ${lecture} active-recall notes`, `Learning Materials/${file}`, {
    description: `Fill-in version for active recall on lecture ${lecture}.`,
    tags: ['lecture notes', 'active recall', `lecture ${lecture}`],
  }),
)

const mat700SlideResources = [
  local('mat700', 'Lecture slides', 'Lecture 1 slides', 'Lectures/Lecture1.pdf', {
    description: 'Source MAT700 lecture 1 slides.',
    tags: ['slides', 'lecture 1'],
  }),
  local('mat700', 'Lecture slides', 'Lecture 1 supplement', 'Lectures/Lecture1_supplement.pdf', {
    description: 'Supplementary source slides for MAT700 lecture 1.',
    tags: ['slides', 'lecture 1'],
  }),
  ...Array.from({ length: 6 }, (_, index) => {
    const lecture = index + 2
    return local('mat700', 'Lecture slides', `Lecture ${lecture} slides`, `Lectures/Lecture${lecture}.pdf`, {
      description: `Source MAT700 lecture ${lecture} slides.`,
      tags: ['slides', `lecture ${lecture}`],
    })
  }),
]

const mat700TutorialResources = [
  local('mat700', 'Tutorials', 'Tutorial 1 beamer', 'Tutorials and Examples/Tutorial1-beamer-version.pdf', {
    description: 'Tutorial 1 practice sheet.',
    tags: ['tutorial', 'practice'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'Tutorial 1 solutions', 'Tutorials and Examples/MA3700SolutionsTutorial1.pdf', {
    description: 'Worked solutions for tutorial 1.',
    tags: ['tutorial', 'solution'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'Tutorial 2 beamer', 'Tutorials and Examples/Tutorial2-beamer-version.pdf', {
    description: 'Tutorial 2 practice sheet.',
    tags: ['tutorial', 'practice'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'Tutorial 2 solutions', 'Tutorials and Examples/MA3700SolutionsTutorial2.pdf', {
    description: 'Worked solutions for tutorial 2.',
    tags: ['tutorial', 'solution'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'Tutorial 3 beamer', 'Tutorials and Examples/Tutorial3-beamer-version.pdf', {
    description: 'Tutorial 3 practice sheet.',
    tags: ['tutorial', 'practice'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'Tutorial 3 solutions', 'Tutorials and Examples/Tutorial3_Solutions.pdf', {
    description: 'Worked solutions for tutorial 3.',
    tags: ['tutorial', 'solution'],
    priority: 'high',
  }),
  local('mat700', 'Tutorials', 'MNIST simple demo notebook', 'Tutorials and Examples/MNIST simple Demo.ipynb', {
    description: 'Worked demo notebook for image-data examples.',
    tags: ['notebook', 'mnist'],
  }),
  local('mat700', 'Tutorials', 'MNIST demo archive', 'Tutorials and Examples/MNIST Demo.zip', {
    description: 'Archive for the MNIST tutorial demo.',
    tags: ['mnist', 'archive'],
  }),
]

const mat700StudyNoteImageResources = [
  'ChatGPT Image May 10, 2026, 07_13_11 PM (1).png',
  'ChatGPT Image May 10, 2026, 07_13_11 PM (2).png',
  'ChatGPT Image May 11, 2026, 02_09_44 AM.png',
  'ChatGPT Image May 11, 2026, 02_10_07 AM.png',
  'ChatGPT Image May 11, 2026, 02_11_30 AM.png',
].map((file, index) =>
  local('mat700', 'Derivation notes', `Handwritten derivation image ${index + 1}`, `Study Notes/${file}`, {
    description: 'Handwritten/derivation image note for MAT700 recall.',
    tags: ['image', 'derivation'],
  }),
)

const mat700TranscriptResources = [3, 4, 5, 6, 7].map((lecture) =>
  local(
    'mat700',
    'Transcripts',
    `Online class transcript ${lecture}`,
    `Transcripts/${lecture} - MAT700MA4700 Mathematical Methods for Data Mining online class-202602${lecture === 3 ? '05' : lecture === 4 ? '12' : lecture === 5 ? '16' : lecture === 6 ? '19' : '23'}_151${lecture === 3 ? '131' : lecture === 4 ? '009' : lecture === 5 ? '041' : lecture === 6 ? '057' : '118'}-Meeting Recording.txt`,
    {
      description: `Class transcript for MAT700 online session ${lecture}.`,
      tags: ['transcript', `lecture ${lecture}`],
    },
  ),
)

// The Material tab mirrors the live plan: one entry per required video and no
// browse-only backlog. This keeps resource progress meaningful across cards.
const SESSION_GROUP = {
  s1: 'Video — S1 workflow',
  s2: 'Video — S2 preprocessing',
  s3: 'Video — S3 regression & generalisation',
  s4: 'Video — S4 classification & tuning',
  s5: 'Video — S5 ensembles',
}

const amlVideoLectureResources = AML_VIDEOS.map((video) =>
  remote('aml', SESSION_GROUP[video.session] ?? 'Video lectures', video.title, video.url, {
    id: video.id,
    description:
      `${video.source}. ${video.minutes} min playback. ` +
      (video.segmentLabel
        ? `Required practical code-along section: ${video.segmentLabel}; the card reserves additional execution time.`
        : 'Targeted supporting lesson; complete the linked coding action on its card.'),
    tags: [
      'video',
      video.session,
      'required',
      ...(video.segmentLabel ? ['course-spine', 'code-along', 'segment'] : ['targeted-support']),
    ],
    priority: 'high',
    type: 'YOUTUBE',
    viewer: 'youtube',
    start: video.start,
    end: video.end,
  }),
)

export const STUDY_MODULES = [
  {
    id: 'interview',
    viewId: 'interview',
    moduleGroup: 'Interview Prep',
    code: 'SATI · 27 JUL',
    label: 'Sati Interview',
    title: 'Sati Data Centre Graduate Internship',
    subtitle: 'A bounded, practical preparation hub for the 27 July group interview and Bridgend journey.',
    examShape: 'Group interview at 12:30 on Monday 27 July: evidence-backed fit, spoken technical reasoning, collaborative incident work, and reliable travel execution.',
    accent: '--chart-interview',
    hero: hero('interview.svg'),
    visual: hero('interview.svg'),
    objectives: [
      'Use the actual advert, submitted application, and invitation as the source of truth.',
      'Demonstrate technical reasoning by observing, running, explaining, and verifying rather than memorising definitions.',
      'Contribute visibly in a group without dominating, and arrive calm with buffers and contingencies.',
    ],
    operatingRules: [
      'Preparation ends after the Sunday one-page sheet, packed bag, and live-ready route; Monday contains no new technical study.',
      'Never invent Sati systems, experience, results, availability, or company facts. Label inferences and ask about unknowns.',
      'Exams retain protected blocks: interview preparation is capped and replaces job-hunt work plus selected weekend capacity only.',
    ],
    resources: [
      publicFile('interview', 'Prep pack', 'Sati interview preparation pack', 'interview/sati-interview-prep-pack.md', {
        id: 'interview-sati-prep-pack',
        description: 'Evidence audit, spoken-answer frames, technical structure, group scenario, questions, and debrief template.',
        tags: ['interview', 'prep', 'group'],
        priority: 'high',
      }),
      publicFile('interview', 'Final sheet', 'Sati final one-page cue sheet', 'interview/sati-one-page.md', {
        id: 'interview-sati-one-page',
        description: 'Sunday-completed one-page cue sheet for a single light read on Monday.',
        tags: ['interview', 'one-page', 'final'],
        priority: 'high',
      }),
      publicFile('interview', 'Practical', 'Stopped-service diagnosis drill', 'interview/sati-technical-practical.md', {
        id: 'interview-sati-practical-lab',
        description: 'A controlled local service failure, evidence capture, recovery, verification, and 90-second explanation.',
        tags: ['linux', 'docker', 'troubleshooting', 'practical'],
        priority: 'high',
      }),
      remote('interview', 'Verified facts', 'Companies House officer record — SATi Services Ltd', 'https://find-and-update.company-information.service.gov.uk/company/11915346/officers', {
        id: 'interview-companies-house',
        description: 'Public record connecting SATi Services Ltd with 8A Dunraven Place; it does not establish internal technical details.',
        tags: ['company', 'address', 'verified'],
      }),
      remote('interview', 'Travel', 'Transport for Wales — Cardiff Central to Bridgend', 'https://tfw.wales/trains-cardiff-central-to-bridgend', {
        id: 'interview-tfw-route',
        description: 'Route information for the direct rail corridor; check live running before leaving.',
        tags: ['travel', 'train', 'route'],
        priority: 'high',
      }),
      remote('interview', 'Travel', 'National Rail live departures — Cardiff Central to Bridgend', 'https://www.nationalrail.co.uk/live-trains/departures/cardiff-central/bridgend/', {
        id: 'interview-national-rail-live',
        description: 'Live departure check for Monday morning and the flexible return.',
        tags: ['travel', 'live', 'disruption'],
        priority: 'high',
      }),
      remote('interview', 'Travel', 'Walking route — Bridgend station to 8A Dunraven Place', 'https://www.google.com/maps/dir/Bridgend+railway+station/8A+Dunraven+Place,+Bridgend+CF31+1JD', {
        id: 'interview-walk-route',
        description: 'Walking-route reference; save it offline on Sunday and use the generous arrival buffer.',
        tags: ['travel', 'walk', 'address'],
        priority: 'high',
      }),
      remote('interview', 'Travel', 'Met Office — Bridgend weather', 'https://weather.metoffice.gov.uk/forecast/gcjkyxurb', {
        id: 'interview-met-office',
        description: 'Live weather check for outfit and umbrella decisions; do not rely on an older forecast.',
        tags: ['travel', 'weather', 'live'],
      }),
    ],
    drills: [
      {
        title: 'Evidence-first service failure',
        detail: 'Run a small service, preserve a healthy baseline, stop it, diagnose before restarting, recover, and verify the original request.',
        output: 'Terminal evidence plus a 90-second incident explanation.',
      },
      {
        title: 'Genuine STAR-L',
        detail: 'Choose one real troubleshooting or teamwork incident and time the answer to two minutes.',
        output: 'One honest situation-task-action-result-learning story.',
      },
      {
        title: 'Group incident rehearsal',
        detail: 'Clarify impact and evidence, separate recovery from root cause, include other views, then close with owner and verification.',
        output: 'One 20-minute rehearsal and one targeted repair.',
      },
    ],
    recipes: [
      {
        title: 'Unknown fault',
        detail: 'Clarify impact and scope, ask what changed, observe before changing, isolate the layer, choose the safest approved action, verify the original symptom, document, and escalate.',
      },
      {
        title: 'Group contribution',
        detail: 'Enter early with a useful clarification, build on evidence, invite another view, and summarise decision, owner, verification, and unresolved risk.',
      },
      {
        title: 'Interview-day execution',
        detail: 'One-page review only, live rail and weather checks, buffered travel, check in at 12:10-12:15, factual debrief, and a concise thank-you.',
      },
    ],
  },
  {
    id: 'aml',
    viewId: 'aml',
    moduleGroup: 'Applied ML',
    code: 'CMT307',
    label: 'Applied ML',
    title: 'Applied Machine Learning',
    subtitle: 'Notebook-first recovery, a segmented practical course, and an open-book command pack.',
    examShape: 'Open-book class-test style work: fast navigation, lab reconstruction, model choice, and leakage-safe reasoning.',
    accent: '--chart-aml',
    hero: hero('aml.svg'),
    objectives: [
      'Run each lab clean before expanding notes.',
      'Turn every lab into one reusable exam workflow or comparison table.',
      'Use Lab 5 outputs as the concrete ensemble-learning and feature-importance anchor.',
    ],
    operatingRules: [
      'Use labs as the practical source of truth and the segmented complete course as the main external teaching path.',
      'Every course-video block must leave runnable cells, one deliberate parameter change, or an interpreted model output; transcript notes do not count.',
      'Concept notes explain observed code behaviour and choices; they are not prose to memorise for the exam.',
      'For open-book speed, build lookup paths rather than large prose notes.',
    ],
    resources: [
      local(
        'aml',
        'Session 1',
        'S1 slides',
        'Session 1 Machine learning overview & data preprocessing/Session1-Overview of Machine Learning.pdf',
        { description: 'Machine-learning overview and first workflow pass.', tags: ['slides', 'workflow'] },
      ),
      local(
        'aml',
        'Session 1',
        'Lab 1 sheet',
        'Session 1 Machine learning overview & data preprocessing/Practical 1/CMT307 Lab 1.pdf',
        { description: 'Practical sheet for the first lab.', tags: ['lab', 'workflow'] },
      ),
      local(
        'aml',
        'Session 1',
        'Lab 1 Ex1 notebook',
        'Session 1 Machine learning overview & data preprocessing/Practical 1/CMT307Lab1Ex1.ipynb',
        { description: 'Notebook to run and annotate for Card 1.', tags: ['notebook'] },
      ),
      local(
        'aml',
        'Session 1',
        'Lab 1 Ex2 notebook',
        'Session 1 Machine learning overview & data preprocessing/Practical 1/CMT307Lab1Ex2-1.ipynb',
        { description: 'Second Lab 1 notebook for the five-stage workflow page.', tags: ['notebook'] },
      ),
      local(
        'aml',
        'Session 2',
        'S2 preprocessing slides',
        'Session 2 Data Pre-processing/Session2-Data preprocessing.pdf',
        { description: 'Missing values, encoding, scaling, and leakage context.', tags: ['slides', 'preprocessing'] },
      ),
      local(
        'aml',
        'Session 2',
        'Lab 2 preprocessing notebook',
        'Session 2 Data Pre-processing/Practical 2/CMT307_Lab2_data_exploration_preprocessing.ipynb',
        { description: 'Titanic and credit-approval preprocessing lab.', tags: ['notebook', 'preprocessing'] },
      ),
      local(
        'aml',
        'Session 2',
        'Lab 2 solution notebook',
        'Session 2 Data Pre-processing/Practical 2/CMT307_Lab2_solution.ipynb',
        { description: 'Reference notebook for repair after your own attempt.', tags: ['solution'] },
      ),
      local(
        'aml',
        'Session 3',
        'S3 regression and evaluation slides',
        'Session 3 Regression, Generalisation & model evaluation/Session3-Regression, Generalisation & Model evaluation.pdf',
        { description: 'Regression, model evaluation, validation, and generalisation.', tags: ['slides', 'regression'] },
      ),
      local(
        'aml',
        'Session 3',
        'Lab 3 linear models notebook',
        'Session 3 Regression, Generalisation & model evaluation/CMT307_Lab3_TrainingLinearModels.ipynb',
        { description: 'Linear models and evaluation reconstruction target.', tags: ['notebook', 'regression'] },
      ),
      local('aml', 'Session 4', 'S4 classification slides', 'Session 4 Classification/Session4_Classification.pdf', {
        description: 'Classifiers, metrics, and model comparison.',
        tags: ['slides', 'classification'],
      }),
      local('aml', 'Session 4', 'Lab 4 classification notebook', 'Session 4 Classification/CMT307_Lab4_Classification.ipynb', {
        description: 'Classification lab for comparison table and metric recall.',
        tags: ['notebook', 'classification'],
      }),
      local('aml', 'Session 5', 'S5 ensemble slides', 'Session 5 Ensemble Learning/Session5_Ensemble_Learning.pdf', {
        description: 'Bagging, boosting, random forests, and ensemble logic.',
        tags: ['slides', 'ensembles'],
      }),
      local(
        'aml',
        'Session 5',
        'Lab 5 ensemble notebook',
        'Session 5 Ensemble Learning/CMT307_Lab5_ensemble_learning_and_random_forests.ipynb',
        { description: 'Random forests and ensemble-learning reconstruction target.', tags: ['notebook', 'ensembles'] },
      ),
      ...amlVideoLectureResources,
    ],
    drills: [
      {
        title: 'Leakage audit',
        detail: 'For any preprocessing step, say whether it is fitted on train only, then identify the object that stores the fit.',
        output: 'One leakage-safe preprocessing checklist.',
      },
      {
        title: 'Model comparison row',
        detail: 'For logistic regression, kNN, SVM, tree, random forest, and boosting: state assumption, scaling need, strength, failure mode.',
        output: 'A compact classifier and ensemble table.',
      },
      {
        title: 'Open-book navigation race',
        detail: 'Pick 20 likely exam prompts and time the first useful file, cell, or formula lookup.',
        output: 'Lookup index with slow paths repaired.',
      },
    ],
    recipes: [
      {
        title: 'Preprocessing pipeline frame',
        detail: 'Name the split first, fit scaler/encoder/imputer on train only, transform both, then state in one line why this prevents leakage.',
      },
      {
        title: 'Model choice justification',
        detail: 'State the data shape and target, name two candidate models, pick one on assumption fit and scaling cost, then cite the metric that would confirm the choice.',
      },
      {
        title: 'Overfitting diagnosis frame',
        detail: 'Compare train vs validation curves, name the bias-variance side you are on, then propose the matching lever: regularisation, more data, or a simpler/deeper model.',
      },
    ],
  },
  {
    id: 'time-series',
    viewId: 'time-series',
    moduleGroup: 'Time Series',
    code: 'MA4508',
    label: 'Time Series',
    title: 'Time Series',
    subtitle: 'Formula-first paper practice: packs, templates, R snippets, and mock mapping.',
    examShape: 'Two-hour mathematical exam: definitions, proofs, ARMA calculations, spectral methods, forecasting, and R-style workflows.',
    accent: '--chart-ts',
    hero: hero('time-series.svg'),
    visual: timeSeriesVisual,
    objectives: [
      'Convert each pack into formulas, worked examples, and closed-book recall.',
      'Prioritise Packs D and E because ARMA definitions, causality, fitting, and forecasting carry high exam value.',
      'Use timed papers to expose broken templates instead of rereading broadly.',
    ],
    operatingRules: [
      'Definitions are free marks; recall them before solving calculations.',
      'For every formula, keep one example where you can reproduce each line.',
      'Past-paper attempts must end with an error-log update.',
    ],
    resources: [
      local(
        'timeSeries',
        'Quick reference',
        'Master formula and R code sheet',
        'Slides Explained/AI Notes/TS_Master_Formula_Definition_R_Code_Sheet_FINAL_LOCKED_CANDIDATE.html',
        { description: 'Combined definitions, formulas, and R-code reference.', tags: ['formula', 'r'] },
      ),
      local(
        'timeSeries',
        'Quick reference',
        'Master exam question bank',
        'Slides Explained/AI Notes/TS_Master_Exam_Question_Bank_By_Template_FINAL_LOCKED.html',
        { description: 'Question bank organised by exam template.', tags: ['questions', 'templates'] },
      ),
      local(
        'timeSeries',
        'Quick reference',
        'Past paper and mock mapping audit',
        'Slides Explained/AI Notes/TS_Past_Paper_Mock_Mapping_Audit_FINAL_LOCKED.html',
        { description: 'Map of papers, mocks, and recurring templates.', tags: ['past papers', 'audit'] },
      ),
      // One self-contained timed mock exam per pack (own timer + reveal-solutions
      // marking guide baked into the HTML), sat right after finishing that pack —
      // immediate, pack-scoped exam practice instead of waiting for the later
      // whole-syllabus past papers.
      local('timeSeries', 'Mock exams', 'Pack A mock exam — L1-L2 (60 min, 45 marks)', 'Mocks/TS_L1_L2_Compressed_Mock_Exam.html', {
        id: 'ts-mock-pack-a',
        description: 'Timed closed-book paper covering smoothing and decomposition. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack a', 'timed'],
        priority: 'high',
      }),
      local('timeSeries', 'Mock exams', 'Pack B mock exam — L3-L4 (100 min, 52 marks)', 'Mocks/TS_Pack_B_L3_L4_Mock_Exam.html', {
        id: 'ts-mock-pack-b',
        description: 'Timed closed-book paper covering stationarity, named processes, and covariance. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack b', 'timed'],
        priority: 'high',
      }),
      local('timeSeries', 'Mock exams', 'Pack C mock exam — L5-L7 (120 min, 53 marks)', 'Mocks/TS_Pack_C_L5_L7_Mock_Exam.html', {
        id: 'ts-mock-pack-c',
        description: 'Timed closed-book paper covering spectral density, estimation, and BLUP/prediction. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack c', 'timed'],
        priority: 'high',
      }),
      local('timeSeries', 'Mock exams', 'Pack D mock exam — L8-L10 (130 min, 57 marks)', 'Mocks/TS_Pack_D_L8_L10_Mock_Exam.html', {
        id: 'ts-mock-pack-d',
        description: 'Timed closed-book paper covering ARMA, backshift, causality, and invertibility. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack d', 'timed'],
        priority: 'high',
      }),
      local('timeSeries', 'Mock exams', 'Pack E mock exam — L11-L13 (120 min, 47 marks)', 'Mocks/TS_Pack_E_L11_L13_Mock_Exam.html', {
        id: 'ts-mock-pack-e',
        description: 'Timed closed-book paper covering Yule-Walker fitting, ARIMA/SARIMA, and forecasting. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack e', 'timed'],
        priority: 'high',
      }),
      local('timeSeries', 'Mock exams', 'Pack F mock exam — L14-L15 (105 min, 53 marks)', 'Mocks/TS_Pack_F_L14_L15_Mock_Exam.html', {
        id: 'ts-mock-pack-f',
        description: 'Timed closed-book paper covering real-data workflow, AIC, and SSA. Built-in timer and reveal-solutions marking guide; not an official Cardiff paper.',
        tags: ['mock', 'exam', 'mock exam', 'pack f', 'timed'],
        priority: 'high',
      }),
      // Interactive single-file study guides, one per pack — each carries its
      // own timer, worked examples and reveal-answer drills (Pack B's also
      // has bilingual English/Farsi notes and embedded videos), so they earn
      // their own group rather than sitting under "Study packs" (plain notes).
      // All six now exist; add a pack's file here the day a newer version
      // replaces it — same id, just swap the path.
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, so there is one
      // file to read/drill per pack instead of two overlapping ones.
      local('timeSeries', 'Mastery guides', 'Pack A mastery app — L1-L2', 'Mastery Guides/TS_Pack_A_L1_L2_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-a',
        description: 'The one note file for Pack A: smoothing, decomposition, and Holt-Winters taught from the lecture, worked examples, and reveal-answer drills, including the honest finding that no 2015-2020 past paper tests this pack directly. Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack a'],
        priority: 'high',
      }),
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, same as Pack A.
      local('timeSeries', 'Mastery guides', 'Pack B mastery app — L3-L4 (bilingual + videos)', 'Mastery Guides/TS_Pack_B_L3_L4_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-b',
        description: 'The one note file for Pack B: stochastic processes, stationarity, and the named-process toolkit (white noise, random walk, Brownian motion/bridge, Poisson process), taught from the lecture with worked examples, all 6 R blocks reproduced with real output, exam-like-exercise solutions, an exact-question-number past-paper radar, bilingual (English/Farsi) explanations, embedded video lessons, and reveal-answer drills. Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack b', 'bilingual', 'video'],
        priority: 'high',
      }),
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, same as Pack A.
      local('timeSeries', 'Mastery guides', 'Pack C mastery app — L5-L7', 'Mastery Guides/TS_Pack_C_L5_L7_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-c',
        description: 'The one note file for Pack C — one of the highest, most mechanically-drillable-yield packs in the module: spectral density/filtering, Bochner-Khinchin, Mercer/Karhunen-Loeve, BLUP worked by hand, and sample estimation (correlogram/periodogram), taught from the lecture with real RStudio output for the periodogram and BLUP examples, and a past-paper radar confirming these recipes recur in every 2015-2020 paper and the mock. Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack c'],
        priority: 'high',
      }),
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, same as Pack A.
      local('timeSeries', 'Mastery guides', 'Pack D mastery app — L8-L10', 'Mastery Guides/TS_Pack_D_L8_L10_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-d',
        description: 'The one note file for Pack D — the highest-yield pack in the module: ARMA definitions, backshift, causality/invertibility root checks (with the a(z)/b(z) sign convention this module traps people on), MA(∞) recursion, and Yule-Walker, taught from the lecture with real R output, exam-like-exercise solutions, and an exact-question-number past-paper radar showing these recipes in every 2015-2020 paper. Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack d'],
        priority: 'high',
      }),
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, same as Pack A.
      local('timeSeries', 'Mastery guides', 'Pack E mastery app — L11-L13', 'Mastery Guides/TS_Pack_E_L11_L13_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-e',
        description: 'The one note file for Pack E — highest-yield alongside Pack D: Yule-Walker fitting/estimation, ARMA forecasting recursions, and ARIMA/SARIMA, taught from the lecture with real R output (Yule-Walker AR(3) fit and h-step forecast, both the actual student run) and a past-paper radar built from real questions, since no dedicated exercise sheet exists for L11-L13. Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack e'],
        priority: 'high',
      }),
      // The single note file for this pack — merges what used to be a separate
      // "Study packs" plain-notes doc into this interactive app, same as Pack A.
      local('timeSeries', 'Mastery guides', 'Pack F mastery app — L14-L15', 'Mastery Guides/TS_Pack_F_L14_L15_Interactive_Mastery_App.html', {
        id: 'ts-mastery-pack-f',
        description: 'The one note file for Pack F: real-data workflow (Airpass, Earth Ocean temperature, Nile water level) and SSA, taught from the lecture with the real periodogram-and-AIC-model-selection R output the student ran (a 6th model the lecture\'s own printed table omits), reveal-answer drills, and an honest priority note (periodogram code recurs every past paper; SSA has no direct past-paper calculation but is still taught properly). Has its own timer and saves progress locally in the frame.',
        tags: ['mastery guide', 'pack f'],
        priority: 'high',
      }),
      local('timeSeries', 'Quick reference', 'R comprehensive cheat sheet', 'Slides Explained/R_Comprehensive_Cheat_Sheet.pdf', {
        description: 'R-code and syntax cheat sheet for Time Series workflows.',
        tags: ['r', 'cheat sheet'],
        priority: 'high',
      }),
      local('timeSeries', 'Quick reference', 'Lecture 5 R supplement', 'Learning Materials/ma3508_lecture5_R_supplement.pdf', {
        description: 'R supplement for lecture 5 workflows.',
        tags: ['r', 'lecture 5'],
      }),
      // The only videos this module has, and the only lecturer-assigned videos in the
      // whole campaign: set as Lecture 1 homework on p.20 of ma3508_lecture1.pdf.
      // Both are beginner "install R and use it as a calculator" tutorials, so they
      // are attached as optional support on the R-skeleton card only — not to the
      // Pack A cards, whose content is smoothing and decomposition, not R setup.
      remote('timeSeries', 'R setup videos', 'An Introduction to R — brief tutorial', 'https://www.youtube.com/watch?v=LjuXiBjxryQ', {
        id: 'ts-video-r-intro-tutorial',
        description: 'Set as Lecture 1 homework. 17 min, beginner R setup — refresher only, no time-series content.',
        tags: ['video', 'r', 'setup', 'lecture 1 homework'],
        type: 'YOUTUBE',
        viewer: 'youtube',
      }),
      remote('timeSeries', 'R setup videos', 'R Tutorial: Introduction to R', 'https://www.youtube.com/watch?v=7cGwYMhPDUY', {
        id: 'ts-video-r-tutorial-intro',
        description: 'Set as Lecture 1 homework. 20 min, beginner R setup — refresher only, no time-series content.',
        tags: ['video', 'r', 'setup', 'lecture 1 homework'],
        type: 'YOUTUBE',
        viewer: 'youtube',
      }),
      ...timeSeriesPastPaperResources,
      local('timeSeries', 'Past papers', 'Mock exam', 'Some solutions/ma3508_mock_exam.pdf', {
        description: 'Mock exam for timed Time Series practice.',
        tags: ['mock', 'exam'],
        priority: 'high',
      }),
      local('timeSeries', 'Past papers', 'Mock exam solution', 'Some solutions/ma3508_mock_exam_solution.pdf', {
        description: 'Worked solution for the Time Series mock exam.',
        tags: ['mock', 'solution'],
        priority: 'high',
      }),
      ...timeSeriesExamExerciseResources,
      ...timeSeriesExerciseSolutionResources,
      ...timeSeriesLearningLectureResources,
      ...timeSeriesCompleteLectureResources,
      ...timeSeriesGapLectureResources,
      local('timeSeries', 'Video walkthroughs', 'Decoding Time Series recipe', 'Discussions by Professor/Decoding_Time_s_Recipe.mp4', {
        description: 'Professor walkthrough video for Time Series recipe decoding.',
        tags: ['video', 'walkthrough'],
      }),
      timeSeriesVisual,
      ...timeSeriesFoundationResources,
      ...timeSeriesFormulaResources,
      ...timeSeriesRSyntaxResources,
    ],
    drills: [
      {
        title: 'Definition sweep',
        detail: 'Write WSS, strict stationarity, ARMA(p,q), causality, invertibility, short memory, long memory from memory.',
        output: 'A checked two-column recall sheet.',
      },
      {
        title: 'ARMA template drill',
        detail: 'For AR(1), AR(2), MA(1), and ARMA(p,q), write the model, condition, autocovariance move, and forecast move.',
        output: 'One template card per model family.',
      },
      {
        title: 'Timed paper triage',
        detail: 'Attempt first, mark second, then tag each miss by template rather than by lecture number.',
        output: 'Error log with repair cards.',
      },
    ],
    recipes: [
      {
        title: 'AR(2) causality check',
        detail: 'Use the three inequalities for the exam shortcut, then confirm by discussing roots outside the unit disk if proof is requested.',
      },
      {
        title: 'Forecasting answer frame',
        detail: 'State model and mean, compute the h-step predictor recursively, then attach the correct MSE and confidence interval.',
      },
      {
        title: 'Spectral density move',
        detail: 'Start from the inverse Fourier relation, expand any cosine term, then identify which lags survive.',
      },
    ],
  },
  {
    id: 'team-project',
    viewId: 'team-project',
    moduleGroup: 'Group Project',
    code: 'CMT501',
    label: 'Team Project',
    title: 'Team Project',
    subtitle: 'Protected capacity for the live waste-management team project; detailed management stays in its own app.',
    examShape: 'Team software project: integrate a working product, submit a nominally 20-minute team video, and preserve evidence for the individual report.',
    accent: '--chart-project',
    hero: hero('team-project.svg'),
    visual: hero('team-project.svg'),
    objectives: [
      'Protect only the capacity reserved in the Summer Rescue timetable.',
      'Work on the current backend, integration, review, or coordination bottleneck chosen in the project-management app.',
      'Leave a short contribution/evidence record without recreating the detailed issue board here.',
    ],
    operatingRules: [
      'A normal project block stops at two hours; use roughly 75 minutes delivery, 30 minutes review/coordination, and 15 minutes evidence.',
      'If a teammate slips, reduce scope, document the dependency, and escalate before absorbing unlimited rescue work.',
      'After the 2 August internal handoff, allow integration, QA, recording, submission, and evidence only — no new scope.',
    ],
    resources: [
      ...teamProjectAdminResources,
      ...teamProjectAssessmentResources,
      ...teamProjectSessionResources,
      ...teamProjectTranscriptResources,
    ],
    drills: [
      {
        title: 'Current bottleneck block',
        detail: 'Open the separate project board, choose the single current bottleneck, and work it for the protected block only.',
        output: 'One reviewed delivery, integration, or coordination outcome.',
      },
      {
        title: 'Integration closeout',
        detail: 'Check the current backend/ML/frontend/database seam and resolve or clearly log one blocker.',
        output: 'A merged change, test result, or owned blocker with next action.',
      },
      {
        title: 'Evidence closeout',
        detail: 'At the end of the block, preserve the relevant issue, merge request, review, decision, test, or meeting evidence.',
        output: 'A short contribution log entry stored with the project.',
      },
    ],
    recipes: [
      {
        title: 'Two-hour capacity frame',
        detail: 'Use 75 minutes for the current technical bottleneck, 30 minutes for review/coordination, and 15 minutes for evidence and the next handoff.',
      },
      {
        title: 'Rescue decision frame',
        detail: 'Name the missed dependency, assess deadline impact, cut scope or reassign, record the decision, and use extra capacity only when the submission is genuinely at risk.',
      },
    ],
  },
  {
    id: 'mat700',
    viewId: 'mat700',
    moduleGroup: 'MAT700',
    code: 'MAT700',
    label: 'Data Mining',
    title: 'Mathematical Methods for Data Mining',
    subtitle: 'Rebuild seven lectures through tutorials, timed recall, and papers.',
    examShape: 'Written mathematical/data-mining exam: definitions, short proofs, TF-IDF, similarity, PageRank, clustering, boosting, and evaluation metrics.',
    accent: '--chart-mat700',
    hero: hero('mat700.svg'),
    visual: mat700Visual,
    objectives: [
      'Build a safe exam performance from tutorial and question-bank fluency.',
      'Use tutorial and question-bank problems before broad slide reading.',
      'Focus on high-yield templates that can be solved under time.',
    ],
    operatingRules: [
      'Use the protected MAT700 blocks; do not let anxiety turn into unbounded rereading.',
      'Every MAT700 block needs at least one solved problem or recipe rewrite.',
      'Recall first, check second, and feed every miss into one error log.',
    ],
    resources: [
      local('mat700', 'Formula sheets', 'Master formula cheat sheet', 'MAT700_Master_Formula_Cheat_Sheet.html', {
        description: 'Combined formula reference for lectures 1-7.',
        tags: ['formula'],
      }),
      local(
        'mat700',
        'Formula sheets',
        'Two-hour exam cheat sheet',
        'Study Notes/MAT700_2_Hour_Exam_Cheat_Sheet_COMPLETE.html',
        { description: 'Condensed final revision sheet.', tags: ['formula', 'exam'] },
      ),
      ...mat700SlideResources,
      ...mat700LectureResources,
      ...mat700MockResources,
      ...mat700FoundationResources,
      ...mat700FormulaResources,
      local('mat700', 'Past papers', '2025 past paper', 'MAT700 Mathematical Methods for Data 2025.pdf', {
        description: 'Newest past paper in the MAT700 folder.',
        tags: ['paper', '2025'],
      }),
      local('mat700', 'Past papers', '2024 past paper', 'MAT700 Mathematical Methods for Data 2024.pdf', {
        description: 'Past paper for timed practice.',
        tags: ['paper', '2024'],
      }),
      local('mat700', 'Past papers', '2023 past paper', 'MAT700 Mathematical Methods for Data 2023.pdf', {
        description: 'Past paper for topic mapping.',
        tags: ['paper', '2023'],
      }),
      ...mat700TutorialResources,
      mat700Visual,
      local('mat700', 'Images', 'MNIST examples', 'Tutorials and Examples/images/mnist.jpg', {
        description: 'Image-data reference for classification examples.',
        tags: ['image', 'mnist'],
      }),
      local('mat700', 'Images', 'MNIST matrix', 'Tutorials and Examples/images/MNIST-Matrix.png', {
        description: 'Matrix representation of image data.',
        tags: ['image', 'mnist'],
      }),
      local('mat700', 'Images', 'Neuron example', 'Tutorials and Examples/images/neuron1.jpeg', {
        description: 'Neuron example image for neural-network notation.',
        tags: ['image', 'neuron'],
      }),
      ...mat700StudyNoteImageResources,
      local('mat700', 'Derivation notes', 'Lecture 1 handwritten notes', 'Lecture 1 handwritten notes - incomplete.pdf', {
        description: 'Handwritten lecture 1 notes and derivations.',
        tags: ['notes', 'handwritten'],
      }),
      ...mat700TranscriptResources,
      local('mat700', 'Module admin', 'MAT700 module description', 'MAT700 Mathematical Methods for Data Mining module description.docx', {
        description: 'Module description document for MAT700.',
        tags: ['module description'],
      }),
    ],
    drills: [
      {
        title: 'TF-IDF matrix',
        detail: 'Build the term-document count table, compute TF, compute IDF, multiply, then compare only in the same vocabulary order.',
        output: 'One clean worked matrix.',
      },
      {
        title: 'Similarity and distance proof',
        detail: 'For Jaccard, bags, edit distance, and L-infinity, state the formula and one counterexample/proof move.',
        output: 'Proof checklist with one worked question.',
      },
      {
        title: 'PageRank or clustering trace',
        detail: 'Set up the matrix or distance table, show every iteration/update, then state the interpretation.',
        output: 'Timed algorithm trace.',
      },
    ],
    recipes: [
      {
        title: 'PageRank iteration',
        detail: 'Make the transition matrix column-stochastic, fix dead ends, apply damping, iterate, and check the rank vector sums to one.',
      },
      {
        title: 'Clustering trace',
        detail: 'For hierarchical clustering, show the chosen linkage. For k-means, show assignment and centroid recomputation.',
      },
      {
        title: 'AdaBoost weight update',
        detail: 'Compute weighted error, alpha, reweight mistakes/correct predictions, renormalise, and state the final weighted vote.',
      },
    ],
  },
]

export const STUDY_MODULE_MAP = Object.fromEntries(STUDY_MODULES.map((module) => [module.id, module]))
