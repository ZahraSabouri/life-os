# 2026-11-02 · Claude Code · Study hub · MAT022 test notes

## Goal
Xar sent a "Normal vs Exponential" comparison table: "add this and things like this id need for tests to notes or knowledge to the module MAT022. also sign/tag them with test 1/ test 2 so id know".

## What I did
Seven MAT022 knowledge notes, saved through the guarded state API (`.runtime/study-plan-2026-11-02/knowledge-notes.mjs`). Each is labelled three ways: a rail group (topic "Test 1 · Weeks 1–2" or "Test 2 · Weeks 3–4"), a tag (`test-1`/`test-2`) and a title prefix.
- **Test 1:** Normal vs Exponential (her table plus variance and a Uniform/Normal/Exponential formula table; also tagged `test-2` because Test 2 fits them by MLE); discrete distributions; probability rules and Bayes; describing data (mean/median, SD/IQR, covariance/correlation, Simpson's paradox).
- **Test 2:** MLE vs MAP; which test (CIs, z, t, χ², ANOVA); regression (R output, R², dummies, ridge vs LASSO).
- Which test each topic belongs to comes from a term count in the two MAT022 study apps (Weeks 1–2 vs Weeks 3–4). The content is standard statistics written by me, not copied from the course. Each note ends by pointing to the Test 2 app's Formula sheet page for the course's own notation.

## Checks and data
Dry run, PGDMP backup `Life_OS_backups/study-2026-11-02/before-mat022-knowledge-2026-11-02-1793622773511.dump`, If-Match PUT, readback equal. One follow-up guarded PUT replaced `Pr(>|t|)` in a table cell, where its pipes would split the row. Study revision 71 → 73 (66 → 71 came from Xar's own use in between). Knowledge notes 4 → 11; nothing else changed. Not checked in a browser.

## Follow-up: step-by-step notes
Xar sent the exponential MLE in four steps: "add this to the app and things like this useful for the test". Four more Test 2 notes (`knowledge-notes-2.mjs`), laid out as Step 1 → 4 with `$$` display maths, like her screenshot: MLE Exponential (her four steps plus the working and a numeric example); MLE Bernoulli/Poisson/Geometric/Normal; MAP Bernoulli with a Beta prior (the Test 2 app uses Beta, never Gamma); step-by-step recipes for a CI, t-test, χ² independence, ANOVA and regression by hand. Backup `before-mat022-knowledge-2-2026-11-02-1793627485675.dump`; revision 77 → 78; notes 11 → 15.

## Follow-up: notes for today's task steps
Xar asked for notes on the concepts in six checklist steps of the MLE/MAP and z-tests cards. Written from the source files themselves this time (text extracted from the fitting and hypothesis-testing slides, hw3 and sol3): six notes, one per step, each linked to its card (`cardIds`) so it shows in that card's "knowledge behind this task" panel. hw3 notes give the method first and the official answers last under "Check your answers (after trying)", so the problems can still be done from blank. Recorded from the slides: "no calculus is required in the assessments" (fitting slide 10); slide 13 writes the divide-by-n variance as $s^2$. Backup `before-mat022-knowledge-3-2026-11-02-1793628392835.dump`; revision 79 → 80; notes 15 → 21.

## Follow-up: "recognise the distribution" screenshots
Three screenshots ("i want these") became one note, linked to the MLE/MAP card, tagged `test-1`/`test-2`, in the Test 2 group (`knowledge-notes-4.mjs`). Contents: the clue table, the distinctions, the formula table and the five MLE steps. Notes have no image support, so the distinction pictures are text diagrams in code blocks. Added Uniform and Geometric diagrams and a Geometric formula row (the screenshot cut off after Normal), plus a one-line step-5 shortcut list from the slides. Backup `before-mat022-knowledge-4-2026-11-02-1793636652489.dump`; revision 81 → 82; notes 21 → 22.

## Correction: plain notes, one combined table, also in the Test 2 app
Xar: "not the screenshots as images!!! as notes … combine tables 1 and 4 and put them both in the study app for test 2 and notes of the life os study hub app." The text diagrams read as pictures, so the note was rewritten as plain notes (`knowledge-notes-5.mjs`, refused if she had edited it). It now has one combined table and the five MLE steps. Table columns: clues, example, PMF/PDF, parameter(s), and the MLE from the course's own MLE table (given in the test). The distinctions are now a one-line summary. Backup `before-mat022-knowledge-5-2026-11-02-1793636831362.dump`; revision 82 → 83.
**Test 2 study app** (outside Life OS, not under git): the same table and steps added to page A3a "The MLE table" in `source/content.html`, then rebuilt with `source/build.py`. `test_w4.mjs` and `smoke3.mjs` (110 slides, 304 questions, KaTeX/raw-maths checks) report no problems. Backup of `content.html` and `index.html` in the app's `backups/2026-11-02-before-recognise-table/`. Life OS serves the same file, so its copy is updated too.
