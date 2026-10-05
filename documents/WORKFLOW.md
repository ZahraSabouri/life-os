# Life OS: how we work (Xar's guide)

**Written 5 October 2026. A living guide: change it whenever the workflow stops fitting.**

## The idea in one line

The repository remembers, not the chat. Every agent reads the same few files at the start of a session and updates them before it stops, so any agent (Codex, Claude Code or Claude in Cowork) can pick up exactly where the last one left off, even when a usage limit cuts a session short.

## Who does what

| Who | Role | Where |
|---|---|---|
| **You (Xar)** | Decide, test, accept. You approve each stage's plan, try what's built, give feedback, and say when a stage is done. | |
| **Claude in Cowork** | Planner and reviewer: thinks things through with you, writes each stage's brief, reviews work, keeps the big documents in shape. It can read and write the project folder but can't run the app or use git. | This Cowork project |
| **Codex or Claude Code** | Builder: works through a brief one checkpoint at a time on Windows, runs and tests the app, commits, and records progress. Use whichever has usage left; the other one reviews. | Your laptop, opened at the `Life_OS` folder |

You can run everything with just the Windows agents (they can plan too, see prompt 2), but keeping planning and building apart catches more mistakes.

## The files that carry the memory

| File | What it is | Updated |
|---|---|---|
| `AGENTS.md` (and `CLAUDE.md`, which loads it for Claude Code) | The rules and the session routine every agent follows. Codex reads it automatically. | Rarely, with you |
| `documents/STATUS.md` | One page: where things stand right now, the exact next step, what's waiting on you. The first thing every agent reads. | Rewritten at every checkpoint and every session end |
| `documents/sessions/` | One short note per session: what was done, how it was checked, problems, next step. Never edited afterwards, so it's a true history. | A new file every session |
| `documents/briefs/` | One plan per stage, cut into checkpoints, with an acceptance checklist for you. Boxes get ticked as work is done. | Written when planning, ticked while building |
| `documents/ROADMAP.md` | The order of the stages. | When a stage is accepted or the order changes |
| `documents/DECISIONS.md` | What was decided and why. | When you decide something |
| `documents/Life_OS_Plans_Inventory.md` | Everything ever planned, with its status. | When a feature's status changes |
| `documents/MIGRATION_HANDOFF.md` | History of the sessions that attached the four apps. Frozen. | Never |

## The cycle for every stage

1. **Plan.** Ask Claude in Cowork for the stage's brief (prompt 2). Read it and approve it or ask for changes. Nothing gets built without an approved brief.
2. **Build.** Open Codex or Claude Code in a fresh chat and give the Continue prompt (prompt 3). It does the next checkpoint, tests it, commits, writes its note and updates STATUS.md. Repeat, one checkpoint per session, switching agents whenever you like. If a session gets cut off, use prompt 4.
3. **Review.** When the stage is built, and after any checkpoint that moves data or changes the database, ask the agent that didn't build it to review (prompt 5).
4. **Test.** Try it yourself with the acceptance checklist at the end of the brief. Note what you find.
5. **Fix.** Send your findings (prompt 6). The builder fixes them through the same routine.
6. **Accept.** When you're happy, close the stage (prompt 7): merged into `main`, tagged, documents updated. Then plan the next stage.

You can test earlier too: after every session, STATUS.md says how to see what's new.

## Getting started, in order

1. **Stage 0: Budget for October.** Record your spending at `/budget` inside Life OS. Don't use the old launcher.
2. **Session 0: setup.** In Codex or Claude Code, opened at the `Life_OS` folder, give prompt 1. It tidies git, commits the planning documents, makes a full backup, and checks the app and your first Budget save.
3. **Plan Stage 1a** (the PostgreSQL foundation) with Claude in Cowork (prompt 2), and approve the brief.
4. **Build Stage 1a** with the Continue prompt; then review, test, fix and accept.

## Habits that keep it safe

- **One agent at a time.** Never let Codex and Claude Code work in the folder at the same moment.
- **A fresh chat for every session.** The files carry the memory; long chats get muddled and use up your limits faster.
- **Open the agent at the `Life_OS` folder,** not a subfolder, so it finds `AGENTS.md`.
- **Read the agent's last message** before closing it: what changed, how to try it, what it needs from you.
- **Say no to deleting** anything in your data folders, or to rewriting data files wholesale. If an agent asks, stop and check.
- **Stop cleanly.** If you have to leave mid-session, use prompt 8.
- Approve the normal commands the agents ask to run (build, tests, git, starting the app).

## Git, in short

- `main` holds accepted work only.
- Each stage gets a branch, such as `stage/1a-postgres-foundation`.
- Each checkpoint ends with at least one commit, such as `[1a-cp2] Add the migration runner`.
- An accepted stage gets a tag, such as `accepted/stage-1a`.
- Personal data is never in git; backups are separate (see `README.md`).

---

## The prompts

Copy them as they are and fill in the parts in [square brackets]. The details live in `AGENTS.md`, which keeps the prompts short.

### 1. Session 0: setup (once; Codex or Claude Code)

```
Session 0 for Life OS: setup only, no app features. Read AGENTS.md first, then documents/STATUS.md.
1. If git complains about ownership, run: git config --global --add safe.directory C:/Users/ctrlz/Documents/Personal/Projects/Life_OS
2. Delete the empty file .git/stale-index-lock-from-claude-2026-10-05.
3. Commit the uncommitted planning documents (documents/, AGENTS.md, CLAUDE.md, README.md) on v2-subapps.
4. Merge v2-subapps into main, tag it pre-development-2026-10, and push both branches and the tag.
5. code/life-os/.git is an old, redundant repository (its history is already in the main one). Move it, don't delete it, to C:\Users\ctrlz\Documents\Personal\Projects\Life_OS_backups\code-life-os-git, then check that git status at the root still looks right.
6. Stop Life OS, then copy the whole Life_OS folder except node_modules and .git to C:\Users\ctrlz\Documents\Personal\Projects\Life_OS_backups\full-2026-10-before-development. Report the file count and total size.
7. Start Life OS and check that all four apps open. Check whether my first Budget save landed in budget-management\data\state.json (revision above 91, and a new file in data\backups).
8. Write your session note and rewrite documents/STATUS.md as AGENTS.md says.
```

### 2. Plan a stage (Claude in Cowork)

```
We're continuing Life OS. Read AGENTS.md, documents/STATUS.md, ROADMAP.md and Life_OS_Architecture.md, and look at the code this stage touches. Then write the brief for Stage [1a] in documents/briefs/, following documents/briefs/_TEMPLATE.md: checkpoints small enough for one session each, each with "done when" and how to verify it; the backups and counts it needs; and an acceptance checklist written for me. Don't write app code. Ask me about anything that's my decision, then update STATUS.md.
```

If Cowork isn't available, give the same prompt to Codex or Claude Code and add: "This is a planning-only session."

### 3. Continue (the everyday prompt; Codex or Claude Code)

```
Continue Life OS. Follow the session routine in AGENTS.md: read documents/STATUS.md, the current brief and the latest session note, check that reality matches them, then do the next unchecked checkpoint. Verify it, commit, and document before you stop.
```

Optional extra lines: `Today, do only checkpoint [n].` or `Before the checkpoint, fix: [item from STATUS.md].`

### 4. Resume after a cut-off session

```
Continue Life OS. The last session stopped before it finished. Before anything new, compare git status and the latest commits with documents/STATUS.md and the latest session note. Finish the half-done checkpoint or undo it cleanly, and tell me which and why. Then carry on with the session routine in AGENTS.md.
```

### 5. Review (the agent that didn't build it, or Claude in Cowork)

```
Review Life OS work without changing any code. Read documents/STATUS.md, the brief for Stage [1a] and the session notes for [checkpoints 1 to 4], and look at the commits they list. Check: does it do what the brief says; do the build and tests pass (run them if you can); were the data rules in AGENTS.md followed (backups, counts, nothing overwritten, nothing deleted); is anything fragile, missing or over-built. Write your findings as a review note in documents/sessions/, most serious first, and add anything that must be fixed before acceptance to STATUS.md.
```

### 6. My feedback after testing

```
My feedback on Stage [1a] [checkpoint n] after testing it myself:
1. I [did this]. I expected [this]. Instead [this happened].
2. ...
Must fix before I accept: [numbers]. Nice to have: [numbers]. Changes of mind: [anything].
Fix the must-fix items first, one commit each, with a test where it makes sense. Ask me if something is unclear instead of guessing. Update the brief, STATUS.md and your session note as usual.
```

Put everything in one numbered message, and attach screenshots when you have them.

### 7. Accept a stage

```
I accept Stage [1a]. Merge its branch into main, tag it accepted/stage-[1a] and push. Mark the stage done in documents/ROADMAP.md with today's date, record any decisions made during the stage in DECISIONS.md, update the statuses in Life_OS_Plans_Inventory.md, point STATUS.md at the next stage, and write a short session note. Don't start the next stage.
```

### 8. Wrap up now

```
Wrap up now. Get to a safe stopping point (finish or undo the current small step), commit, write the session note, update STATUS.md with exactly where to pick up, and tell me how to see what changed.
```

### 9. Something's broken

```
Something's wrong in Life OS. I [did this], expected [this], and [this happened]. [It started around: date or change, if I know.] Find the cause before changing anything and explain it to me in plain words. If the fix is small and touches no data, fix it with a test that would have caught it; otherwise tell me the fix and wait. Document as usual.
```

### 10. A new idea or a change of mind (Claude in Cowork, or any agent)

```
New idea or change of mind for Life OS: [describe it]. Don't code yet. Tell me what it affects (the current stage, the roadmap, the data model, other areas). Then update only the documents that should change: the Vision if it changes what the app is for, ROADMAP for the order, the Inventory for the list, DECISIONS for anything that replaces an earlier choice, and the current brief if it changes this stage. Show me what you changed.
```

### 11. Monthly health check (Codex or Claude Code; no new features)

```
Life OS health check, no new features. Run the build and all tests. Check the backups (latest dates and sizes) and restore the latest one into the test database. List uncommitted or stray files. Check that STATUS.md, ROADMAP.md and the Inventory still match reality, and fix any drift in the documents. Report what you found.
```

(The restore step applies once Stage 1a has set up PostgreSQL.)

### 12. A new chat with Claude in Cowork

```
We're continuing Life OS. Read documents/STATUS.md and the latest notes in documents/sessions/, then [plan the next stage / review checkpoint n / help me think about this: ...].
```
