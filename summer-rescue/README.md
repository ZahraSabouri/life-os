# Study hub

The Study app inside Life OS, at `/study`. It plans and tracks a semester: its modules, the
cards that make up the work (with steps, hours, evidence and notes), a schedule of study blocks,
a focus room with a timer, a day review, progress and pace, and the semester's own notes.

## Where its content comes from

Nothing about a particular semester is written into the app. When you open a semester, its
modules, the cards prepared for it, its schedule and its wording are read from the Life OS
database (PostgreSQL, schema `study`) through the hub API, and the rest of the app reads them
from one place (`src/hub/session.js`). A new semester starts empty; you add its modules and
cards in "Semester setup" or import them.

How a semester is studied is part of its records too (`src/data/semesterProfile.js`):

| Setting | Where | What it does |
|---|---|---|
| a module's `label`, `accent`, `kind` | the module | its name, its chart colour (`--chart-*`), and its kind of work (study, project, job, admin, life) |
| a module's `resourceGroupOrder` | the module | the order its materials' groups show in |
| `splitTargets` (or a module's `targetShare`) | the plan's options | the share of study time each module should get; Today and Progress show the drift |
| `examGroups` | the plan's options | the modules whose study blocks keep their times, and that re-planning packs |
| `readinessDate`, `projectDeadline` | the plan's options | when exam preparation should be finished (else the semester's end), and a project deadline |

A semester that sets none of these gets neutral defaults: no time split, no exam spine.

## Running it

It is built and served by Life OS (`Build Life OS.cmd` builds it with `--base=/apps/summer-rescue/`;
Life OS shows it at `/study`). On its own:

```bash
npm install
npm run dev        # the development server
npm run build      # a production build into dist/
npm run test       # node:test checks
npm run lint       # ESLint
```

`npm run assets:sync` and `npm run assets:verify` copy and check study materials listed by the
semester's modules into `public/study-assets` (kept out of git: they are the course's own files).

## Tech

React and Vite, plain CSS with design tokens (`src/index.css`, `src/App.css`), hand-built charts
and icons. What you change is saved through Life OS (the hub API, with revision checks); the
browser keeps only a quick-start copy.
