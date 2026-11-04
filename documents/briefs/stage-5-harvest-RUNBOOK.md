# Running stage 5 (Harvest) with Claude Code in VS Code

This runbook is for Xar. It goes with `stage-5-harvest.md` in this folder.

**4 November:** sessions 1 and 2 are done (planning, then CP1 to CP8 in one sitting). Next is section 4: coming back to Cowork.

## 0. Before the first session (5 minutes)
1. Open VS Code on `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS`, then open the Claude Code panel.
2. Make sure Life OS is running (**Start Life OS.cmd**) so Claude Code can check its work in the browser.
3. Commit or stash any loose changes: Claude Code's routine starts by checking `git status`.
4. Read the brief's three questions at the bottom and decide your answers. The defaults are fine:
   - Events go to the Calendar only when you mark them "going" (they always show in Cardiff Life).
   - Offers live in Budget as an "Offers" list with end dates.
   - Gmail links use account 1 (`u/1`), set in Settings so you can change it.

## 1. Session 1: approve the brief (no code)
Paste this:

> Read AGENTS.md, documents/STATUS.md and documents/briefs/stage-5-harvest.md. This is a planning session, so write no app code. My answers to the brief's questions: (1) events go to the Calendar only when I mark them going; (2) offers live in Budget as an Offers list; (3) Gmail account index is a setting, default 1. Check the brief against the real code: the mail module (backend/src/modules/mail), the entries/core tables, how JobMap, Cardiff Life, Budget and the Study hub take imports today, and frontend/src/components/inbox. Tell me what in the brief is wrong or risky, propose changes, and once I agree, rename it to stage-5-harvest.md, make the checkpoints concrete (files, tables, tests), and update STATUS.md to point at it. Then stop.

Read what it says. Push back where it over-reaches. Say "agreed" when you're happy.

## 2. Build sessions: one checkpoint each
Start each session with:

> Read AGENTS.md and documents/STATUS.md, then do the next unchecked checkpoint of documents/briefs/stage-5-harvest.md on branch stage/5-harvest. Back up before any schema change. Verify (build, tests, the brief's checks), commit as [5-cp<n>], tick it, update STATUS.md, write the session note, and tell me how to try it.

After each one, try it yourself in the browser at http://127.0.0.1:47850, then say "accepted" or describe what's wrong.

What to expect from each checkpoint:
- **cp1 to cp2:** nothing visible yet. Ask it to show you the test file passing and a sample import receipt.
- **cp3:** deadlines appear in Calendar and Today. Test with a made-up harvest file it creates.
- **cp4:** a test vacancy appears in JobMap, a test event in Cardiff Life, a test offer in Budget. Each one has a receipt.
- **cp5:** Inbox → Harvest log, one page per day.
- **cp6:** Inbox → Mail with filters, noise hidden, the stored text and working "open original" links.
- **cp7:** a "Came in" card on Today.
- **cp8:** it asks you before re-importing. Then come back to Cowork (section 4).

## 3. Rules that keep your data safe (Claude Code knows them, but watch for them)
- It must back up the database before migrations (`Life_OS_backups/`), and never run `hosting/app.test.mjs`, which reseeds core.
- Nothing may write directly into JobMap, Cardiff Life or Budget data files. Only their import folders and validators.
- `harvest/` and `mail/archive/` stay out of git (it adds `/harvest/` to `.gitignore` in cp1 if it isn't there yet).

## 4. Coming back to Cowork
Once cp4 is accepted, tell me (Claude in Cowork) "stage 5 import is live". I'll switch the Integrate task from the interim sinks to the new `life-os.harvest` import and re-run the September to November backfill day by day from the saved archive, without reading your mailboxes again.

If anything in the brief changes while you build, just tell me what changed. The four tasks' instructions live in `Scheduled Workflows/instructions/` and are easy to adjust.
