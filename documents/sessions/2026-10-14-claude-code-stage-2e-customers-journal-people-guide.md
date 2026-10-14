# 2026-10-14 · Claude Code · Stage 2e · a product for customers, Journal, People, the Guide in parts

## Goal
Her message of 13 October evening and the ones after it (quoted in `TODO.md` section O): words for customers, the Guide in parts and usable, JobMap's documents and no account block, the four apps as parts of Life OS, journaling, pictures, people and birthdays, what was left, and commits as her alone.

## What I did
- Checked first what existed: notes and calendar events did; journaling, uploading pictures and adding a person did not.
- Journal with pictures; People with birthdays; `person_identities` for later.
- The app's words for customers: the Court's greeting, its menu in three styles, a dead Search button, maintenance notes.
- The Guide in parts: a finder, 25 answers, 17 part pages, clickable diagrams, 76 pictures with example records where pages were empty.
- JobMap: My documents (folder, main CV, previous applications), no account block, the backup carrying files.
- The four apps' look inside Life OS.
- Life OS starting with Windows.
- The lists she asked for (this conversation, the documents, a product's needs: DevOps, cache, UI and UX, security) are `TODO.md` sections O and P.

## Files and commits
- `2290287` [2e-cp1] Journal with pictures, and People
- `c05de28` [2e-cp2] Words for the people who use the app
- `1660a96` [2e-cp3] The Guide in parts
- `67be0fe` [jobmap-cp8] My documents, no account block
- `62dc84c` [2e-cp4] The four apps look like sections of Life OS
- `2737ac0` [2e-cp5] Life OS starts with Windows
- `d0e2d44` [2e-cp6] The Guide covers every page of the apps inside
- `3b86acf` [jobmap-cp9] JobMap's backup carries files

## How I checked it
- The core's new routes on the live app with marked test records removed afterwards: a person with only a name, a birthday that does not exist refused, the birthday on the calendar; a journal page with a picture, a file that is not a picture refused, the picture read back, the page kept off the calendar, the picture removed with the page. Counts the same before and after (1 person, 162 entries).
- The Journal and People pages as a user in Modern and Madder with writes caught; the top bar on one line from 1180 to 1440 pixels.
- The Guide as a customer: no maintenance words, a search for "birthday", an answer's button opening People, "Open the timer" opening the Focus panel, a diagram box leading to its part.
- JobMap: tests and parity in both copies; My documents on the try-out's copy (a wrong path refused, the folder listed, the main CV chosen, a copy kept with a job and the CV used filled in); the live backup file.
- The four apps measured inside Life OS: no brand shown, titles in the same face and size.
- Life OS started by the startup file the way Windows will, all parts answering.

## Data touched
- Core database: backed up (`Life_OS_backups/core-2026-10-13/life-os-before-people-and-pictures-1791903591793.db`); two columns added to `people` and the `person_identities` table; test records added and removed.
- JobMap: the documents setting (folder `C:\Users\ctrlz\Documents\Apply`, main CV `CV/!newJob_CV_Zahra_UK.pdf`), revision 37 to 38; JobMap keeps its own copy of the previous state.
- Her Windows Startup folder: `Life OS.vbs`.

## Problems and surprises
- The computer restarted on the morning of 14 October and Life OS was down until I started it; it now starts at sign-in.
- One attempt to set JobMap's documents from an inline command failed on quoting and saved nothing; done again through a script file.

## Small decisions I made, and questions for Xar
- The documents folder and main CV were chosen for her (the Apply folder, the newest UK CV); both change in one click under My documents.
- Life OS's notices through Windows stay on; she said she did not follow what they were, so the Guide now shows them as a picture.
- The Guide's pictures still show her own records; a product needs them from example data (section O).

## Next step
Her reading of the Guide and of the four apps' look. Then section P, starting with the backup off this laptop.
