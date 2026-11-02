# 2026-11-02 · Claude Code · Study hub · the two MAT022 study apps

## Goal
Xar: "can you put/add idk somehow integrate the two study apps for two tests to the study hub of life os?" Low token budget, so keep it small.

## What I did
- The apps are the MAT022 `Test 1 Study App` and `Test 2 Study App` folders: one offline `index.html` each (33 MB and 5.6 MB). Each keeps progress in browser storage under its own key (`mat022w1:`, `mat022t2:`); neither clears storage, uses eval or calls the network.
- **Server** (`hosting/app.mjs`): `GET /study-apps/:id/` serves only apps listed in `Life_OS_data/study/study-apps.json` (personal paths stay out of git). It reads each app where it is, with no copy, so rebuilding an app updates Life OS too. Its CSP allows the app's inline scripts and data: assets, blocks network calls and allows framing only by Life OS. `/study-files` stays sandboxed as before.
- **Reader** (`StudyMaterials.jsx`): a material with `viewer: 'app'` on a `/study-apps/` URL opens unsandboxed, so the app can save progress. Every other material keeps its sandbox.
- **Data:** two MAT022 materials on a new "Apps" shelf, added through the hub API: "MAT022 · Test 2 study app (Weeks 3–4)" and "MAT022 · Test 1 study app (Weeks 1–2)". Study hub → MAT022 → Materials; also findable with Search.

## How I checked it
Frontend build passes; Life OS restarted. Both routes return 200 and an unknown id returns 404. Headless Chrome on `/study-native?material=…` shows the Test 2 app running in the reader, without a sandbox; a storage write/read under its key works; no page errors. `hosting/app.test.mjs` not run (it reseeds core).

## Data touched
Study materials 3305 → 3307. Cards, sessions, assessments and modules unchanged. Backup: `Life_OS_backups/study-2026-11-02/before-study-apps-2026-11-02-1793622137311.dump`. New config: `Life_OS_data/study/study-apps.json`. The app folders are untouched.

## Things to know
- Progress made by opening `index.html` directly (file://) does not carry over: the Life OS copy starts with its own progress. Both keep working; pick one per app. The apps have no progress export, so there is no clean migration.
- The Test 2 app has its own dated route (sessions 1–12, 1–6 November) that is not linked to the Life OS cards. Mapping them was out of scope.
- The Test 2 app's page title still says "MAT022 Test 1"; that comes from the app itself.
