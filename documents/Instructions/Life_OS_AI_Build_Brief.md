# Life OS — Build Brief for an AI Coding Assistant

> **History, not instructions (5 October 2026).** The current plan is `../ROADMAP.md`; the status of every July brief is in `../Life_OS_Plans_Inventory.md` §5.

**Written 2026-07-05, for whichever AI assistant (Claude Code, Codex, or similar) executes this on Xar's own Windows machine.**

This document is self-contained — you shouldn't need any other conversation history to act on it. It covers: what to check/install first, what to build, and how to verify it before handing it back. Read the whole thing before starting.

---

## 0. Context, briefly

Life OS is a private, single-user life-management app: one place to capture anything about your life in natural language, which gets filed as structured data and shown back through a beautiful interface. This brief covers only the **first runnable slice**: a database, a small API, and two real screens (an intro and a main page), built to match an existing detailed design prototype. It deliberately does **not** include the AI natural-language capture layer yet — that's parked by explicit decision, see §6.

Full background, if you want it: `documents/Life_OS_Vision.md` (why this exists), `documents/Life_OS_Blueprint.md` (fuller proposal, partly superseded), `documents/Life_OS_Stack_Notes.md` (current stack decisions — read this one, it's authoritative over anything stack-related in the Blueprint).

Project folder root (everything below is relative to this): `Life_OS/`

---

## 1. Prerequisites — check these first, report anything missing

Run these in a terminal (PowerShell) before touching any code. If something is missing or too old, **stop and tell Xar what to install rather than trying to install system-level tools yourself** — you may not have permission to install software on this machine.

```powershell
node -v      # need v24 or newer. v24 is Active LTS; v26 is the newest Current release
             # and is preferred if available, because Node's built-in SQLite support
             # (node:sqlite) only became fully stable (no experimental warning) in v26.
             # v24 also works — node:sqlite just prints a harmless warning on startup.
npm -v       # ships with Node, just confirm it exists
git --version
```

If Node is missing or older than v24: install the current LTS or Current release from https://nodejs.org (Windows installer, default options are fine).

If git is missing: install from https://git-scm.com/download/win.

**Good news:** because we're using Node's built-in `node:sqlite` module instead of a native-compiled package like `better-sqlite3`, you do **not** need Python or Visual Studio Build Tools installed. This was a real pain point in older Node/SQLite setups on Windows and we're deliberately avoiding it.

A code editor (VS Code assumed) should already be present; not required for this brief specifically.

---

## 2. Folder structure to create

Do not touch or modify anything under `code/life-os-app/` — that's a retired design/UI scratchpad (a fork of an exam-tracker app used to explore ideas), not the real app. Build fresh, alongside it:

```
code/
  life-os-app/        <- existing, DO NOT TOUCH
  life-os/             <- NEW, everything below goes here
    .gitignore
    backend/
      package.json
      .env.example
      src/
        server.js
        db.js
        migrations.sql
        routes/
          entries.js
      data/            <- gitignored: life-os.db lives here
    frontend/
      package.json
      vite.config.js
      index.html
      src/
        main.jsx
        App.jsx
        styles/
          tokens.css
        components/
          DivanIntro.jsx
          TheCourt.jsx
```

Initialize git inside `code/life-os/`:

```powershell
cd code/life-os
git init
```

`.gitignore` at `code/life-os/`:
```
node_modules
dist
backend/data/*.db
backend/data/*.db-*
backend/.env
```

Note on backups: the SQLite file is not meant to live in git history (it's personal data, not code, and binary diffs in git are messy). Once the app is running, a simple periodic "copy `backend/data/life-os.db` somewhere else" is the backup story — don't build anything fancier yet.

---

## 3. Backend — Express + node:sqlite

### 3.1 Init and install

```powershell
cd code/life-os/backend
npm init -y
npm install express multer
```

That's the whole dependency list. No ORM, no ID library (`crypto.randomUUID()` is built into Node), no ORM/ODM, no ODM, no CORS package (see proxy note in §4), no ODBC. Keep it this small — more packages is more surface area to maintain solo.

### 3.2 `backend/src/migrations.sql`

This is the "entries core" data model from the Blueprint, expressed as SQL. Only `entries` gets used by the API in this brief (§3.4) — the rest exist so later features (tags, people/birthdays, places, photos, links between entries) don't require a schema rewrite, just new endpoints.

```sql
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'note',
  title TEXT,
  status TEXT,
  start_at TEXT,
  end_at TEXT,
  all_day INTEGER DEFAULT 0,
  details TEXT DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birthday TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS entry_people (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  person_id TEXT NOT NULL REFERENCES people(id),
  role TEXT,
  PRIMARY KEY (entry_id, person_id)
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat REAL,
  lng REAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS entry_places (
  entry_id TEXT NOT NULL REFERENCES entries(id),
  place_id TEXT NOT NULL REFERENCES places(id),
  PRIMARY KEY (entry_id, place_id)
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id),
  path TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entry_links (
  from_entry_id TEXT NOT NULL REFERENCES entries(id),
  to_entry_id TEXT NOT NULL REFERENCES entries(id),
  relation TEXT,
  PRIMARY KEY (from_entry_id, to_entry_id, relation)
);
```

### 3.3 `backend/src/db.js`

```js
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
fs.mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'life-os.db'))
db.exec('PRAGMA journal_mode = WAL;')

const migrations = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8')
db.exec(migrations)

export default db
```

(If `node:sqlite` still shows an experimental warning on the installed Node version, that's expected and harmless — see §1.)

### 3.4 `backend/src/routes/entries.js`

Two endpoints only, on purpose — this brief builds the capture-to-list loop, nothing more:

```js
import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const { type = 'note', title = null, details = {} } = req.body
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO entries (id, type, title, details, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, type, title, JSON.stringify(details), now, now)
  res.status(201).json({ id, type, title, details, created_at: now, updated_at: now })
})

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 100)
  const rows = db.prepare(`
    SELECT * FROM entries ORDER BY created_at DESC LIMIT ?
  `).all(limit)
  res.json(rows.map(r => ({ ...r, details: JSON.parse(r.details) })))
})

export default router
```

(Adjust the `.prepare()`/`.run()`/`.all()` API to whatever `node:sqlite`'s actual method names are on the Node version installed — check https://nodejs.org/api/sqlite.html for the exact current API if it errors; the module is young and has changed shape between versions.)

### 3.5 `backend/src/server.js`

Single-user auth: a shared bearer token, nothing more. Not needed for pure `localhost`-only use, but Tailscale will eventually make this reachable beyond localhost, so build the habit now rather than retrofit later.

```js
import express from 'express'
import entriesRouter from './routes/entries.js'

const PORT = process.env.PORT || 3001
const TOKEN = process.env.LIFE_OS_TOKEN || 'dev-token-change-me'

const app = express()
app.use(express.json())

app.use('/api', (req, res, next) => {
  const auth = req.get('authorization') || ''
  if (auth !== `Bearer ${TOKEN}`) return res.status(401).json({ error: 'unauthorized' })
  next()
})

app.use('/api/entries', entriesRouter)

app.listen(PORT, () => console.log(`Life OS backend on http://localhost:${PORT}`))
```

### 3.6 `backend/.env.example`
```
PORT=3001
LIFE_OS_TOKEN=change-me-to-something-private
```
Copy this to `.env` (gitignored) with a real token before running.

### 3.7 `backend/package.json` scripts
```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js"
  }
}
```
(`--watch` is Node's own built-in file-watcher — no `nodemon` dependency needed.)

---

## 4. Frontend — Vite + React, matching the design prototype

### 4.1 Scaffold

```powershell
cd code/life-os
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### 4.2 Dev proxy (avoids CORS entirely during development)

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3001' }
  }
})
```

### 4.3 The actual design to build from — READ THESE FILES DIRECTLY

Don't rely only on the summary below — open and inspect the real files for pixel-level fidelity:

- `design-explorations/Intro and main page design.zip` — unzip it; inside is `export/Life OS App/Life OS App.dc.html`, a detailed interactive prototype markup (custom template syntax, not React — read it for exact structure/styling, don't copy the templating mechanics).
- `design-explorations/Life OS - Intro + Main Page.html` (+ its `_files/` folder) — an alternate full render of the same design.
- `design-explorations/intro-probes-03.html` — an earlier pass specifically on the intro screen ("Divan-style intro").
- `assets/poems/poems-data.js` — the poetry dataset the intro screen draws from.

**What's already been extracted from those files, so you don't have to re-derive it:**

Two screens exist in the prototype, toggled by state (not routing) — mirror that pattern for v0, don't add a router yet:
- **"Divan — intro"**: full-height screen, deep maroon background, a decorative ornament layer (the original uses a `<canvas>`; a simpler static/CSS treatment is fine for this first pass — flag it as a polish item to revisit, don't sink time into a canvas particle system yet), a centered poem in Persian/Urdu script (right-to-left), poet's name below it, optional italic English translation line, a "Skip intro next time" checkbox, and a way to proceed ("Enter") into the main page.
- **"The Court — main page"**: a top bar with the "Life OS" wordmark, the live date, and pill-shaped nav buttons (Study hub / Ground / Poem / Divan — for this brief, these can be inert placeholders except "Divan," which can re-trigger the intro screen). Below that, a centered **arch-shaped capture panel** — a distinctive doorway/mihrab silhouette made via an unusual border-radius (`200px 200px 16px 16px / 240px 240px 16px 16px`), containing a slowly pulsing gold orb button, the label "Capture," the headline "Capture first. Structure after.", and a textarea. Below the panel, a simple "Recently filed" list.

Design tokens (colors, confirmed via the actual export files):

```css
:root {
  --g-bg: #6f241b;        /* deep maroon — page background */
  --g-ink: #efe3c8;        /* warm cream — primary text */
  --g-acc: #dfae4f;        /* gold — accent, capture orb, active states */
  --g-sub: #d8b9a2;        /* dusty rose — secondary/sub text */
  --g-line: rgba(239, 227, 200, 0.2);   /* hairline dividers */
  --g-panel: rgba(239, 227, 200, 0.045); /* subtle panel fill */
  --g-accsoft: rgba(223, 174, 79, 0.5);  /* soft border on accent elements */
}
```

Fonts (Google Fonts — add the `<link>` tags to `index.html`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Noto+Nastaliq+Urdu:wght@400;700&family=Gulzar&display=swap" rel="stylesheet">
```
- UI chrome and English text: `'Cormorant Garamond', Georgia, serif`
- The Persian/Urdu poem block only: `'Noto Nastaliq Urdu', 'Gulzar', serif`, `direction: rtl`

The capture orb's pulse animation:
```css
@keyframes breath {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(223, 174, 79, 0.28); }
  50% { transform: scale(1.06); box-shadow: 0 0 0 16px rgba(223, 174, 79, 0); }
}
```

Put the token variables in `frontend/src/styles/tokens.css`, import it once in `main.jsx`.

### 4.4 Component plan

- **`App.jsx`** — holds `const [screen, setScreen] = useState('divan')`, renders `<DivanIntro onEnter={() => setScreen('court')} />` or `<TheCourt onDivan={() => setScreen('divan')} />` accordingly. No router for this brief.
- **`DivanIntro.jsx`** — renders a random (or first) poem from `poems-data.js` (copy that file into `frontend/src/data/` or import it directly — check the actual export format in the file before assuming its shape), the "Skip intro next time" control (store the choice in `localStorage` — this one thing is fine to keep local-only, it's a UI preference not life data), and an `onEnter` call on click/Enter key.
- **`TheCourt.jsx`** — the top bar and capture panel described above. On submit: `POST /api/entries` with `{ type: 'note', title: <first ~60 chars of the text>, details: { body: text } }`, using the token from an env var (`VITE_LIFE_OS_TOKEN` in a `frontend/.env`, matching the backend's `.env`), then clear the textarea and refetch the recent list. On mount and after each capture: `GET /api/entries?limit=10`, render title + a relative time ("2 minutes ago" — a small hand-written helper is fine, no need for a date library at this size).

---

## 5. Validation — do this before handing anything back

1. `cd backend && npm run dev` — must start with no errors, prints the listening port.
2. `cd frontend && npm run build` — must succeed with no errors.
3. `cd frontend && npm run dev` — start it, open the printed localhost URL.
4. Manual smoke test: intro screen renders with a real poem and correct colors/fonts → entering leads to The Court → typing something into the capture box and submitting makes it appear in "Recently filed" → refreshing the page keeps it there (proves it actually persisted to SQLite, not just React state).
5. Report back: what you built, exact commands Xar should run to start it day-to-day (both servers, both terminals), and anything from §1 that was missing and needs manual installation.

---

## 6. Explicit do-not list for this brief

Do not build any of these yet — they're real, they're coming, just not now:
- The AI natural-language capture layer (Gemini or Claude-via-MCP) — deliberately parked, see `Life_OS_Stack_Notes.md`.
- TypeScript.
- Any UI component library (Tailwind, MUI, shadcn, etc.) — hand-written CSS with the token file above, matching the existing design's own approach.
- Any lens beyond the main capture screen: no Calendar, Boards, Gallery, Library, Map, People, Ask, or Study Hub yet. Those come later, one at a time.
- File/photo upload — the `files` table exists in the schema for later; no upload UI or endpoint in this brief.
- Any change to `code/life-os-app/`.
- Tailscale setup itself (that's a one-time manual step on Xar's network, not a coding task — flag it as a follow-up, don't attempt it as part of this brief).
