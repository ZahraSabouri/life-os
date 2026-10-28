# 2026-10-28 · Claude (Cowork) · University materials · materials refresh

## Goal
Finish the Learning Central materials refresh another agent (GPT) started on 27 October and stopped part-way, then pick up the changes and additions Xar's lecturer made on 27–28 October.

## What I did
- Found where the earlier run stopped: the MAT022 final project (brief, WAND dataset, LaTeX template) was saved and complete; Week 4 and the records were not.
- Compared every Drive file linked from the MAT022 outline with her folder by SHA-256 (hashed in the browser, compared on disk). New or changed: three Week 4 lecture PDFs, all eight Week 1–2 unannotated slide PDFs (newer Drive versions), and `how-to-use-formula-sheet-2.pdf` in a new "In-class test 2 materials" folder. Everything else matched, including all 63 lab datasets.
- Saved them into the module folders. The Week 1–2 updates sit beside the originals as "(updated 2026-10-28)"; nothing was overwritten. Saved the Week 4 lab notebook and the 26, 27 and 28 October lecture captions.
- Wrote `Assessments/In-Class Test 2/Test details.txt`, `About module/Learning Central content 2026-10-28.txt`, `download-manifest-2026-10-28.json`, `About module/Refresh 2026-10-28.txt`, and rewrote `Current materials.md` (previous version kept as `Current materials - before 2026-10-28.md`). Short refresh notes for CMT309 and MAT021, and `2. Autumn 2026/Refresh 2026-10-28.md`.
- CMT309: no new or replaced files (every link's file version matches earlier manifests). MAT021: nothing published.

## Files and commits
- No Life OS code or commits. Personal source material stays out of git; all files are in `Documents\Apply\...\2. Autumn 2026`.

## How I checked it
Every saved file's SHA-256 matches the Drive original (the Learning Central PDF has no published checksum; `pdfinfo` reads it as a valid 4-page PDF). The 26 October transcript was rebuilt with the same method as the earlier transcripts and reproduces the saved 23 October rows byte for byte. All 37 links in the new `Current materials.md` resolve.

## Data touched
None in Life OS. In her folders only new files were added. Browser downloads remain in `Downloads` (she can clear them).

## Problems and surprises
- Scripted requests to Learning Central itself fail in the browser pane, so CMT309 was checked by file-version IDs rather than checksums.
- The Week 1–2 unannotated slides had changed on Drive in mid-October; earlier refreshes missed it.
- Week 4 ILOs and practice exercises are placeholder links on Learning Central. The lecturer said exam-style questions and the Test 2 formula sheet will go in the Test 2 folder instead.

## Small decisions I made, and questions for Xar
- Kept the original Week 1–2 slides and saved the new ones beside them, as earlier refreshes did for hw2 and the syllabus.

## Next step
Fit the Week 4 slides and the Test 2 guide into this week's Study hub cards (`t2-reg1` to `t2-reg4`). When the Test 2 formula sheet or exam-style questions appear, save them into `Assessments/In-Class Test 2`.
