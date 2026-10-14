# Life OS — Decisions

A history of what we chose, when and why. Newest first. A decision here means "the best idea at the time", not a contract: when one changes, add a new entry and mark the old one as superseded instead of deleting it.

---

## 14 October 2026 — a product for customers (stage 2e)

- **The app speaks to the person using it, never to the people building it** (Xar, 13 October: "I'm not the customer. I'm developing this with you for another audience"). No one's name in the code (the Court greeted "Xar"), no notes about how pages are maintained, no control that does nothing. Maintenance tools stay out of a user's pages: retaking the Guide's pictures is at `/guide?maintain`.
- **No accounts yet, by her choice; records are ready for them.** `person_identities` waits beside `people` for tying a person to a real account in a later social layer.
- **A journal page is an entry of the kind "journal"**, dated to its day and kept off the calendar's things to do. Its pictures are files in the core's data folder (outside git), checked by their first bytes, and removed with their entry.
- **People are a table of the core, not entries**, as the database already had them; a birthday comes on the calendar every year from there.
- **The four apps take Life OS's look through the shared skin, only when shown inside Life OS** (`html[data-life-os-frame]` in `hosting/skins/public/shared.css`); their own code is not changed for it.
- **JobMap reads a documents folder she connects and never writes into it**; a file from it is copied onto a job only when she asks. The main CV is a path inside that folder.
- **Life OS starts with Windows through one file in the user's Startup folder** (`launch.mjs --start-with-windows on|off`), so the notices outlive a restart.
- **Commits are hers alone** (Xar, 13 October: "commit changes as me, not as me and claude").

## 13 October 2026 — everything hers (stage 2d)

- **What she adds by hand is kept by the part it belongs to.** An event of her own in Cardiff Life is kept in Life OS (one setting, `cardiff-own-events`), beside the researched `events.csv` that her agents write, and is drawn by the same page. JobMap keeps her categories, folder and links as three more fields of its own job record, through its own save route, in both copies.
- **A job keeps where her files are, not the files.** "Open folder" asks JobMap's own local server to show an existing folder in the file manager; nothing in it is run. Keeping the file itself inside Life OS is a later step.
- **One editor for any entry of the core** (`EntryEditor`), built from each kind's declared fields, used by the Ledger and the week planner. Fields the app writes by itself (a focus session's minutes) are not offered.
- **The analysis reads what the week's review reads.** `hosting/review/analysis.mjs` uses the same loaders, so a number on one page is the same number on the other. Statistics are over the days that have happened; r is only worked out from ten days up and always shown with the number of days.
- **The Guide's pictures are not in git.** They are screenshots of her own records, in `guide-shots/`, remade by `scripts/guide-shots.mjs`, which only looks (every write is answered inside the browser). The words are in git (`src/guide/chapters.js`), one recipe for each picture.
- **Life OS keeps the apps inside it running** (`hosting/keep-up.mjs`): every 15 seconds it starts Budget or JobMap again if one stopped answering. "Stopped" in the launcher means the old server process has gone, not that its port closed.
- **Notices with no tab open come from the server through Windows**, only from the real server (not a try-out), only when no tab asked for the notices in the last six minutes, and what was shown is handed to the browser so it is not repeated. On by default because she asked for it twice; one switch turns it off.
- **Budget was assessed, not changed:** a read-only walk found add, change and remove in every section, and Codex was working there the same days.
- **A job's files are stored under ids JobMap makes up** (`jobmap/lib/files.mjs`), in a folder named from a hash of the job's id; the name she gave is only shown and sent back, never used as a path. Kinds a browser shows safely (PDF, images, plain text) open in a tab; every other kind is handed over as a download.
- **The Guide's numbered circles are drawn into the pictures by the script**, in the page or the inner app's own frame, from the same list the words name; a circle with no place on the page is reported, because a picture whose numbers do not match its words misleads.
- **The Guide's diagrams are drawn by the page** from the style's colours, not kept as images, so they follow the style and dark mode.
- **The server can run the picture script** (`hosting/guide.mjs`, "Retake the pictures"): one run at a time, its output in `.runtime/guide-shots.log`.
- **Life OS has its own name for Windows notices:** one key in her own part of the registry (`HKCU\SOFTWARE\Classes\AppUserModelId\LifeOS.Notices`, DisplayName "Life OS"), made the first time a notice is shown. Removing the key undoes it.

## 12 October 2026 (late night) — The Court without the day; notices; plans that repeat (Xar with Claude Code)

- **Xar:** "remove today from court and keep in the today tab." **Decided:** the day hour by hour lives on Today only. *This changes the afternoon's decision* ("the Court itself is the working first page", which put the path on it): the Court keeps the add line and the Study, Jobs, Home and Notes panels. Read narrowly on purpose: she said "today", and the block on the Court was titled "Today".
- **Xar:** "we also need a sorta notification for the whole app, not just study." **Decided:** one bell for every part, worked out fresh from each part's own records each time (nothing is stored but what she has seen). The computer's own notifications are her choice and off by default.
- **Decided:** a repeating plan is one entry; its days are worked out, never stored in advance. A day becomes an entry only when she acts on it. So nothing has to be "generated" ahead, and stopping a plan cannot leave strays.
- **Decided:** what the app remembers for itself (her aims, notices seen, sound links) is a row in a small `settings` table in the core, one per key.
- **Decided:** the host reads each part once for requests that arrive together. A page now asks for five things at once; reading Study, JobMap and Budget five times over made parts time out.
- **Not decided:** the kinds of notice she finds useful; whether the parts should be gathered under one entry in the top bar.

## 12 October 2026 (night) — Focus, sound and review belong to Life OS; the Study hub keeps its own (Xar with Claude Code)

- **Xar:** "I need all those … features inside the whole LifeOS app, not necessarily inside the study hub"; "maybe we need the focus room … to be part of the LifeOS app, or live music, or … YouTube player." After a proposal to write a design first: "go on."
- **Decided:** these are built one level up and nothing is taken out of the hub. The Life OS timer is for anything; the hub's Focus Room stays for study. A session on a study card run with either ends on the card.
- **Decided:** something Life OS changes in the Study hub (a ticked step, a card done, a focus session) is changed by the hub's own rule, saved through the hub's store with its revision check, logged in the hub's event log, and announced on the hub's own channel so an open hub tab reloads. Life OS never writes the hub's state its own way.
- **Decided:** the timer and the player live in the layout above the pages, and the running session in the browser, so moving between pages and parts or reloading does not stop them.
- **Decided:** a look back counts each thing once and only reads. A week in progress is compared with the same days of the week before.
- **Decided (drawing numbers):** one accent colour for every measure, text always in text colours, a bar only where a length means one thing (focus time), a meter for a part of a whole, and words beside every use of the warning colour.
- **Not decided:** her targets (applications a week, focus hours a day); whether the hub's forest and levels should exist outside study; how the top bar is thinned (it holds twelve entries).

## 12 October 2026 (evening) — One part owns each answer; a tick is not a purchase; links name the thing (Xar with Claude Code)

- **Xar:** "Data Manager (Neurological Data Platform) · Swansea University doesnt exist in the job app. where is it … not only that one!" The day had its own idea of which jobs mattered (everything on the shortlist, which the scheduled searches fill by themselves). **Decided:** the day does not rank jobs. It shows JobMap's own first list, in JobMap's order and words, read from one place (`hosting/career/first-screen.mjs`, JobMap's exported `FIRST_SCREEN`). The one thing the day adds is what a day page is for: a job that closes today is said first.
- **Xar:** "these checkboxes that are not checkable … I should be able to kind of track the items, but not necessarily put the price." **Decided:** a tick on a shopping item means "I have it" and nothing else: no price, no receipt, nothing in the balance or the cupboard. Money still changes only by a receipt (Budget's rule, unchanged). The same tick works in Budget, on the Court and on Today.
- **Xar:** "create different shopping lists … based on categories, another one … on the date … based on the shop." **Decided:** these are arrangements of the same items, not copies: By list, By category, By shop, By day, Everything. An item may have its own shop and day; otherwise it takes its list's.
- **Xar:** "everything should be clickable … it should redirect to the main URL"; "if you click on a specific job role … directed to the same component." **Decided:** a link names the thing, not only the part: `/jobmap#job=<id>`, `/study#/today?card=<id>&semester=<id>`, `/budget#/shopping`. A part that is already open is moved to the new place instead of being reloaded.
- **Xar:** the summer app keeps study only; "the admining stuff should be transferred to another part"; outings and people need "a day under … admin or anything". **Decided:** an entry of any kind can carry an area; every area has its own page; "Life admin" is an area. The summer's 140 non-study items became done entries with a mark of where they came from.
- **Xar:** "i need you to use common sense making any of these changes!!" **Taken as:** every change is read on the live page with her real data, as a user, before it is called done (plain words, the urgent thing first, the common action in one step).
- **Not decided:** progress, review, planner and focus for the whole app (TODO section K) wait for a short design with her.

## 12 October 2026 (evening) — JobMap: one first list, nothing open left out, in her own groups (Xar with Claude Code)

- **Xar:** "why arent they present in the job app? i feel dates and roles and priorities and all are so messed up" (about open roles the first list left out for being full-time).
- **Decided by that:** a role that is open is shown. The first tab is "To apply": every role a check has seen open, whatever its hours.
- **The groups are hers:** her career instructions sort leads as Apply now / Email first / Save for later / Exclude and say a full-time advert may justify an enquiry but is not a confirmed match. My priority now reads Apply now · Ask about hours first · Full-time or over your hours · Check it is still open · Not checked since saved. This replaces the late-afternoon entry's single "Apply now", which had counted "part-time mentioned" as hours that fit.
- **Rows show what is known:** Added, Last checked, Advertised only when known; the closing date once.
- **Mine, to be confirmed:** the names of the groups; "Apply now" meaning hours stated within her preference or a single shift.
- **Not done, hers:** archiving the doubled vacancy; clearing the September workbook's High/Low/Later.

## 12 October 2026 (late afternoon) — JobMap: roles confirmed open come first (Xar with Claude Code)

- **Xar:** "I feel like the priorities are a bit messed up in the job app. I need to immidiately apply for the roles available soooo#" (cut off there).
- **What was wrong:** My priority ordered by deadline and never by whether a role is open. Of the first 50 rows, 27 had not been checked since the September import.
- **Now:** among current part-time possibilities, roles confirmed open in the last 14 days lead ("Apply now"), then roles to check, then ones never checked. This sits above the 9 October rule (closing today, tomorrow, within 7 days; then her setting, match, shortlist), which is otherwise unchanged. Both copies.
- **Mine, not hers (to be confirmed):** the 14 days; keeping part-time possibilities above confirmed-open full-time roles; keeping deadline before fit among the open roles.
- **Not decided:** whether to clear the September workbook's High/Low/Later (she has set none herself), and three more questions in `TODO.md` section I.

## 12 October 2026 (afternoon) — The Court itself is the working first page; no borders between the parts (Xar with Claude Code)

- **Xar:** "i still cannot see any meaningful changes for what i asked you initially in case of unifying all apps and making it genuinely functioning as a life os." And, to my question of which page opens first: "court. but today can be also shortly or minorly [embedded] in the court! why are you stuck to these questions and this specific way of implementation and design and sorta borders?"
- **What that corrects:** in the morning I had asked her to choose between pages and then built everything on Today, one click away from the page she lands on. From now: integrate instead of asking her to pick one of two; the first page must itself show and do the work.
- **Her answers, and what was done with each:**
  1. "delete the test entries but keep the section if useful and make it better ux wise": the seven July test entries are deleted (copy of the core database first); "Recently filed" stays, its rows open and can be removed.
  2. Job time: "both": time blocks on the calendar and a target in the Jobs panel.
  3. The 13 shopping items: "yes. and … remove them from the summer app. summer app integrated into the life os has nothing to do with anything other than studying and uni modules": moved to a Budget list and taken out of the study data. The rest of what the summer workspace keeps aside (life cards, schedule rules, the interview module, notes) is still there and still needs a home.
  4. The invented lines: "do what's best": replaced by what is true today.
  5. The Court opens first, with today in it.
  6. "it's good to have today in all sub apps. cuz study is not all we got for today but sometimes one only wants to see what to study for today": every part shows its own today; the Study hub keeps its own Today page.
- **How the parts are joined without rebuilding them:** Life OS draws the day from each part's own data and writes back through each part's own rules. Budget's list is changed with Budget's own functions and saved through Budget's own address; the Study hub and JobMap are read. Nothing inside JobMap's two copies or Budget's files was changed.
- **A new kind of entry, "Time block":** hours set aside for one area (job applications are the first). It is hers to tick off or remove like any plan.

## 12 October 2026 — Today is the page to work from; the Court stays (Xar with Claude Code)

- **Xar:** "I want a connection so I can access all of these from my day." "I'm not happy with any of the design versions' first pages." "We had some features like adding notes on the first pages that are now left alone."
- **Her four answers** (asked with drawn options):
  1. The Court stays as it is. **Today is rebuilt as the working page.** (My recommendation had been one first page replacing both; she chose to keep the Court.)
  2. Layout: "a combo of this path + glance and your four panels". The day as a path in time order, each stop opening what it needs, with Study, Jobs, Home and Notes as four panels beside it.
  3. "All four [styles] should be amazing in their own designing context but for now let's focus the most on Modern." And a **light/dark button everywhere in the app**, not only in the Study hub. This replaces the 8 October rule that light or dark follows the style.
  4. Phone access and a responsive app are wanted, "not our priority yet". She will not use the app at the shop for now.
- **How it is built:** the calendar already carried every area's dated things, so JobMap and the Study hub were connected to it; what was missing was their content. One read-only request (`/api/day`) gives the day's study blocks with their cards and the current content of Study, Jobs, Home and Notes; Today draws it. Acting from the day comes second: first read and open the owning part, then tick from the day through the owner's own save rules.
- **Two agents on one request.** Codex was already entering the study plan when she gave me the same request; she asked us to cooperate. Codex kept the plan and the Study hub data; Claude Code took the day. The hand-over is `COORDINATION_2026-10-12.md`. Job-application time stays outside the Study hub (Codex, following her 6 October rule); where it lives is open.
- Brief: `briefs/stage-2b-my-day.md`. "2b" because Today belongs to Stage 2 of the Roadmap.
- **Dark mode is for Modern only** (Xar, later the same day: "we only need the dark mode for the modern skin"). One button in the top bar of every page and part; it shows in Modern. Madder, Indigo and Paper keep their single look. Light or dark is one choice for the whole app, kept apart from the style, so a future style can list two versions without new plumbing.
- **One to-do list:** `documents/TODO.md`, written at her request from her words that day, the documents' aims and a walk through the app. `STATUS.md` says where things stand; `TODO.md` says what is left.

## 9 October 2026 — The ancient Court flows (Xar with Claude Code)

- **Xar:** "make it responsive and beautiful … it's okay if I have to scroll and also it'd be nice if I don't have to."
- The three Court pages are no longer drawn on a fixed sheet and scaled. They fill the window, fold on a narrow one, and grow with their content. On a screen larger than a laptop's the whole page is enlarged to fill it, so text grows with the screen; on a laptop the page is at its designed size and may scroll a little.
- On a phone the top bar's menu folds behind one button.

## 8 October 2026 — One look: sub-apps are parts of Life OS; a style is a whole design (Xar with Claude Code)

- **Xar:** the sub-apps must look like big parts of the main app, not separate apps. A style must change the design, not only the colours: "a skin like Indigo had a different style and design". The ancient Court pages are well designed but sit as fixed boxes with small text, and the other pages in those styles do not follow them.
- **The frame (her choice):** the Life OS top bar on every page; each part keeps its own side menu, drawn the same way everywhere. Logos inside the parts are removed and the names kept as headings; to be rolled back if it looks wrong.
- **One file holds the styles** (`frontend/src/styles/palettes.css`): colours, then the design of each style, taken from that style's Court page. Madder: soft tiles. Indigo: outlined boxes, sans with serif headings, mono figures. Paper: ruled lines, no boxes. Modern: rounded cards, soft shadows. *Supersedes* the 7 October entry's "Life OS publishes the chosen style" and "Modern means the Study hub's exact look": Modern is the main app's palette everywhere.
- **The sub-apps' own files stay untouched.** Life OS adds the shared skin files to their pages as they are served (`hosting/skins/`), and rewrites colours written straight into Budget's and Cardiff Life's CSS as blends of the shared palette. JobMap's folder is again the standalone app plus relative addresses, which also suits keeping both JobMap copies alike (entry below).
- **The Court (her answer):** responsive and beautiful, scrolling allowed. Done now: it fills the window's width. Still to do: rebuild it as a flowing page at reading size.

## 8 October 2026 - Maintain both JobMap copies (Xar with Codex)

- Xar: "i want you to update both apps when running the scheduled task or doing further development". The targets are `C:\Users\ctrlz\Documents\JobMap\Career Agent\JobMap App` and `C:\Users\ctrlz\Documents\Personal\Projects\Life_OS\jobmap`.
- Supersedes the pending choice to redirect the scheduled search to Life OS alone. The existing automation keeps its times and now compares, saves, validates, queues and checks imports in both copies. Findings use the same runId; vacancy identity is resolved against each target because custom IDs can differ.
- Shared fixes and features are carried to both, preserving Life OS relative paths, hosting, style integration and existing work. Each receives appropriate verification.
- Neither progress.json nor whole data folders are copied over the other workspace. Imports preserve personal edits and dates; personal-data reconciliation remains a conflict-aware, backed-up operation.
- This is a maintenance instruction, not acceptance of the JobMap UI or the current style stage. No application code or vacancy data changed in this session.

## 7 October 2026 (night) — JobMap: one workspace, the Study hub's look (Xar with Claude Code)

- **Xar:** bring in the newest JobMap (it shows when each job was added and advertised), and make it look like part of the Study hub, following the other styles too.
- **The newest JobMap is the standalone one** in `Documents\JobMap\Career Agent\JobMap App`; another agent keeps updating it there. The Life OS copy takes its code and keeps one difference: addresses relative to where the app is served.
- **The look is a second stylesheet** (`jobmap/app/skin.css`) on top of the standalone one, which stays untouched so a newer JobMap can be dropped in again.
- **Life OS publishes the chosen style** for the apps it frames (`lib/frameSkins.js`, colours defined only in `styles/skins.css`). JobMap is the first to follow. Modern there means the Study hub's exact look.
- **Two JobMaps had two sets of data.** They were merged once into the Life OS one: each vacancy once, the earlier "added" date, nothing personal dropped, a disagreement stops the merge. Which JobMap the scheduled search feeds is still open and is Xar's decision.

## 7 October 2026 — How the Study hub keeps its data (Claude Code, following Xar's direction)

- **One workspace per semester.** The app saves its whole state for the open semester, as it always did; the server keeps that state in the Study database (`study.hub_workspaces`). *Replaces* the plan in the stage brief to turn the state into records and back: a two-way translation of an app this large was the riskiest way to lose something of hers.
- **Cards are also written as ordinary Study records after every save**, one way only, so the calendar and Today read them like any other record. The app's state is the source; those records are a copy.
- **Modules, classes, assessments and materials stay ordinary records.** A module record carries the app's description of the module. The app reads them when a semester is opened.
- **The app's lists are worked out when its code loads**, so the code loads only after a semester has been chosen. That is why changing a module restarts the app in the same semester.
- **What is not study is kept aside** inside the summer semester's workspace (`set_aside`) until it has a home elsewhere.
- **Each semester has its own browser storage**, so one semester's leftovers cannot show in another.

## 6 October 2026 (late) — The Study hub is the Summer Rescue app (Xar's correction to Claude Code)

- **The Study hub's structure is the Summer Rescue app's structure.** Same screens, same tools. The one difference: a new module does not come with premade cards. *Supersedes* the proposal in the entry below to remove Planner, Evidence, Rescue, "Why this next?" and similar: nothing of that kind is removed.
- **The summer cards, plans and evidence are Xar's own past entries**, not something fixed in the app. They become data that can be added, read, edited and removed, in a past semester.
- **The right source is the app in her university folder** (`…\1. Spring 2026\Summer_Rescue_Campaign_2026\summer-rescue-plan-app`, last saved 23 August). Everything built before used a copy frozen on 6 July, with almost no progress and about 40 fewer screens and tools.
- **Health and Admin leave Study** (confirmed from the entry below): in the real app these are "Life & Admin", "Admin & Dates", Job Hunt, the interview pages and the shopping list. Their data is kept for a later home.
- **Modules do not run across two semesters.** A module can be duplicated, with its whole planning, into a new time frame.
- **No work on the Life OS frame at this stage.** What matters there: Study is correctly connected to the Life OS calendar, with nothing shown twice.

## 6 October 2026 (evening) — Study is a general study app; one frame for the whole app (Xar with Claude Code)

Xar's correction after using native Study:

- **Study is not her autumn-2026 data-science tracker.** It is a full study app anyone can use; her example is an arts student with his own modules.
- **Semesters are defined by the user and chosen on entering Study.** No import wording in the chooser.
- **Nothing that isn't studying lives in Study.** Health and Admin were removed. Tasks unrelated to study get a home elsewhere later.
- **Study does not plan the study by itself.** It offers tools (tasks, checklists, notes, focus) and module detail (classes, exams, coursework, projects, group projects, timetable). Nothing is designed around her modules. Every item can be added, read, edited and removed. Feeds (JSON and others) come after, so items need not be typed by hand.
- **Study must feel part of Life OS** through base-level UI work (one frame, shared building blocks), not a recolour. *Supersedes* "Keep Summer Rescue's design" (6 October, with Codex) for the frame and the look. Reusing working code still stands.
- She does not want large parts deleted or rewritten without discussing it first. The proposal and open questions are in `sessions/2026-10-06-claude-code-stage-3-study-feedback.md`.

## 6 October 2026 — Four styles for the whole app; backend first (Xar with Claude Code)

- **A fourth, modern style.** Xar: the three existing styles are traditional; she wants a fourth, modern one for the whole app, close to Summer Rescue, JobMap, Cardiff Life and Budget, but one unified style and not a different look in each area. Built as `modern`: warm paper, near-white cards, deep teal-green accent, a terracotta spark, sans text with serif headings, soft rounded cards.
- **The style menu is on every page, in every style**, including the modern one and over the framed apps. The button says "Style" (plain words); the grounds keep their names.
- **One palette per style.** `frontend/src/styles/skins.css` holds a shared `--m-*` palette for each of the four styles. Boards, the modern home and Study all read it. This replaces Study having its own Summer Rescue colours and its own light/dark switch (my reading of "unified"; say if you want a dark modern style as a fifth).
- **Order.** Xar: finish the Calendar and Study backend thoroughly first; styles can follow.
- **Folder discovery watches for new files only (Claude Code's choice, for Xar to confirm).** The seven candidate folders hold about 10,700 supported files, one of them 9,900. Connecting a folder now brings in files added from then on; the existing files come in only when asked for, a folder with more than 500 items is skipped as a dataset, and a folder with more than 10,000 items is never partly brought in. Discovery no longer copies the whole material store before each scan.
- **Backups are never pruned automatically.** The daily dump keeps every copy; removing old ones stays Xar's step. The architecture's "keep 14 daily and 8 weekly" is still a proposal.

## 6 October 2026 — Keep Summer Rescue's design; discover module resources (Xar with Codex)

- Xar prefers the Summer Rescue app design/style over the newly styled Study page, and explicitly says to transfer/reuse existing code rather than rewrite it unnecessarily. The original sidebar/topbar, light/dark palette, component styling and useful studying tools are adapted into native Study; the manuscript Court wrapper no longer owns this page. The source copy remains untouched.
- Study still serves general studying across reusable semesters/modules. Original campaign content stays data; visual familiarity does not reintroduce fixed personal modules/dates.
- Xar asked for automatic discovery when files are added to module folders, and authorised finding the existing Cardiff university materials tree. Seven matching module directories were identified across Spring/Autumn. The server maintains explicit trusted folder mappings outside git, reads supported files, makes native copies and links them through normal Study writes. Imports cannot silently activate arbitrary scan paths. Existing notes/review status and old file versions remain; no originals are deleted.
- New content versions need review; already linked content is skipped. Folder controls expose connection, scanning/errors and a manual refresh. The host scans while running; there is no claim of background discovery while it is shut down.

## 5 October 2026 — Finish Calendar, then Study Hub (Xar with Codex)

- Xar directly instructed: "finish calendar if anything's left and then study hub", then reaffirmed "resetted the usage. go on". This authorises finishing Calendar and building native Study without another brief-approval or stage-acceptance question. Calendar visual acceptance is still unverified, not assumed.
- The Calendar audit found one final Court device-timezone mismatch; its dates, clock and greeting now use Europe/London with fixture coverage.
- Live inspection found PostgreSQL 18.6 running on localhost:5432, with only the default `postgres` database and role. Study can use new `lifeos`/`lifeos_test` databases and restricted project roles; no installation, password reset, existing database replacement or direct data-directory operation is needed.
- Implementation sequence: native Study on PostgreSQL, retaining the existing SQLite core and shared Calendar provider interface during this step. Moving the other core tables and completing the broader Stage 1 foundation remains later work. This is a transitional implementation choice to meet the new order, not a reversal of the PostgreSQL decision.
- Keep Summer Rescue accessible throughout the move, preserve its data and assets, inventory newer commits, and track every feature through parity before retirement.
- Xar reiterated during implementation that Study Hub is for studying across all kinds of modules/students, with varied features. Exam campaigns and rescue are optional, while readings/exercises/coursework/projects/materials/notes/assessments are ordinary study workflows. New semesters/modules are empty editable data; the current personalised campaign is imported history, not a universal template.

## 5 October 2026 — Calendar first (Xar with Claude Code; resumed by Codex)

- Xar asked Claude Code to start work from the plan, write down what it did and leave a brief and precise pickup point for review afterward. This authorises building the documented calendar scope without another brief-approval question for this continuation. Stage acceptance still belongs to Xar.
- Xar then clarified that Calendar and Today should be finished first. Claude agreed to move those ahead of PostgreSQL, but its session ended during read-only mapping. Stage 2 now comes before Stage 1a; PostgreSQL remains the intended core database, followed by native Study. This supersedes the initial order in item 6 below for these next steps.
- Xar said she would install PostgreSQL herself and might need help with the password. No installation, password reset or reuse of the July cluster is authorised by the calendar continuation. Give an interactive installation checklist and verify the chosen server before foundation work.
- Account connections remain important. Assistant connectors and native Life OS OAuth are separate: connecting a provider to an assistant does not connect the app. Setup guidance lives in `CONNECTIONS_SETUP.md`.

## 5 October 2026 — the unified app (Xar with Claude, in Cowork)

1. **One app, not a box of apps.** The four attached apps are rebuilt one by one as native sections of Life OS. Each attached version keeps running until its replacement is accepted. *Why:* Xar wants one app whose parts share a calendar and work together, not a large app holding mini apps. The July architecture already argued for one engine.
2. **Home leads with Today, strongly, and keeps the room doors below it,** with the wording reviewed. *Refines* July's "the hub is a calm lobby of doors". Claude proposed Today alone with the doors moved into the navigation; Xar chose to keep the doors.
3. **The calendar ties everything together.** Every area provides its dated items. Kinds look different (fixed / plan / deadline / reminder); areas are colour layers.
4. **Three ways in for every area:** by hand; by import (files made with ready instructions for your own AI, scheduled agents, connectors such as Cardiff SU, Eventbrite and web pages, calendar subscriptions); later by built-in AI. *Why:* effortless input at £0, using AI subscriptions Xar already has; it's also the foundation the in-app AI will write through.
5. **Study keeps Summer Rescue's behaviour; the manuscript designs are a visual reference for later.** *Why:* in use, the manuscript card was harder to work with than Summer Rescue's (`Study_Redesign_Designer_Notes.md` §A). Summer Rescue becomes **Study**, covering the whole degree; "rescue" becomes a mode.
6. **Order:** Stage 0 (use Budget now) → Foundation → Calendar and Today across all apps → Study → Career → Money & Home → Cardiff Life → the rest of the July plans. *Why:* Study is needed now, and the attached Summer Rescue can't hold a new semester without code changes. Career is the next most important to Xar. Budget is needed right now but already works as it is inside Life OS, and it's the most intricate, so it's rebuilt once the patterns are proven. Cardiff Life is the least urgent.
7. **Database: PostgreSQL from day one.** Xar's decision. Claude recommended SQLite (a single file, nothing to run) with written triggers for moving to PostgreSQL; Xar chose PostgreSQL. *What it gives:* `jsonb`, full-text search and `pgvector` in one engine, real types, mature tooling, a direct path to a hosted multi-user version, and Xar's own DBA experience. *Costs accepted:* a service to run, dump-based backups, major-version upgrades. *Supersedes:* SQLite via `node:sqlite` (5 July).
8. **A modular monolith; no Redis, RabbitMQ or MongoDB.** One server program with a shared core and a module per big area; background jobs in a PostgreSQL table; outside agents feed an inbox folder. New infrastructure only when a written trigger happens (`Life_OS_Architecture.md` §2). *Why:* Xar asked for a structure that can last and grow without unnecessary tools.
9. **Entries for the long tail, module tables for the heavy areas.** Study, Career, Money, Home and Events get their own tables; everything else starts as an entry type and graduates when it needs structure. *Supersedes in part:* "model everything as entries if possible" (July architecture §4, Brief 3 §10.1). *Why:* budget, study and job data have real structure (and the migration notes warned against flattening it), while still needing to connect through the calendar, links and search.
10. **Budget splits into Money and Home; recipes become their own collection.**
11. **Data protection lives in the data layer from the start:** one write door, revisions, change history, soft delete, field ownership for imports, and backups before every risky step. *Why:* AI agents have overwritten edits before, and Xar has lost data to file corruption.
12. **Counts at each module move; the rest of the verification comes later.** Xar preferred to leave hashing and count checks for the late stages; Claude argued that the moment each app's data moves is when data is most likely to be lost; Xar agreed to keep before/after counts at each move.
13. **Other users come in the late stages.** No accounts, onboarding or user tests until then. One rule now: no personal content in code. Modules, exams, budget months and shops are data.
14. **Presenting at Cardiff is parked.**
15. **The Learning Central in-app browser is a late-stage idea.** It's the hardest item on the list (embedding, university login). Until then, materials come in as downloaded files and through imports.
16. **Money is stored as whole pence** in every new table.
17. **Eventbrite constraint noted:** its official API removed public event search (December 2019, fully closed February 2020); only lookups by organiser, venue or event ID remain. Event discovery needs an agent or scraper.
18. **Plain words on actions and labels; the poetry lives in the atmosphere.** *Why:* the manuscript card's poetic verbs were unclear in use.
19. **The workflow: the repository remembers, not the chat.** `STATUS.md` (rewritten every checkpoint), one note per session in `sessions/` (never edited), one brief per stage in `briefs/` with checkpoints and an acceptance checklist. Claude in Cowork plans and reviews; Codex or Claude Code builds on Windows, one agent at a time; a branch per stage, merged and tagged when Xar accepts it. `MIGRATION_HANDOFF.md` is frozen as history. Details: `WORKFLOW.md`, `AGENTS.md`.

## 1 October 2026 — attaching the apps (Codex and Claude, sessions 2–7)

- Keep the original Life OS folder untouched as `Life_OS_preserved_2026-10-01`; work in a fresh `Life_OS` copy.
- Attach Summer Rescue (`/study`), Cardiff Life (`/cardiff-life`), Budget Management (`/budget`) and JobMap (`/jobmap`) unchanged, behind one local host on port 47850, each shown full-screen with a "← Life OS" pill. Visual matching deferred.
- The git repository becomes the whole `Life_OS` folder (branch `v2-subapps`; `v1-pre-subapps` keeps the earlier state). Personal data stays out of git.
- Details: `MIGRATION_HANDOFF.md`.

## 12 July 2026 — the Study Hub manuscript redesign

- The Study Hub was re-skinned to the 42-page manuscript design, inside Life OS. *Superseded:* on 1 October `/study` began showing Summer Rescue instead, and on 5 October the native Study section was set to keep Summer Rescue's behaviour (decision 5 above). The redesign stays as a visual reference.

## 6 July 2026 — architecture, taxonomy and the WAL bug

- **Model A: one engine, rich rooms.** Hub-and-rooms navigation and a shared spine (Capture, Today, Calendar, Search). *Still holds,* refined by 5 October decisions 2 and 9.
- **Twelve rooms** in the taxonomy; people, places and organisations as anchor entities; links between anything; lenses across rooms. *Still holds* as the long-term map, with Money and Events added on 5 October.
- **Domain accent colours** layered over the grounds; a room never overrides the ground. *Still holds.*
- **No forced WAL in SQLite** after a disk I/O error. *Becomes moot for the core* once it moves to PostgreSQL; the lesson still applies to any SQLite file that remains.
- The implementation plan (Implementation Handoff sessions 1–7, then Briefs 7–12). *Superseded as the build plan* by `ROADMAP.md` on 5 October; sessions 1–3 were built, the rest is tracked in `Life_OS_Plans_Inventory.md`.

## 5 July 2026 — the stack

- React 19 + Vite, plain JavaScript; TypeScript when it earns its place. *Still holds.*
- A hand-rolled Node + Express backend instead of PocketBase. *Still holds.*
- SQLite through Node's built-in `node:sqlite`. *Superseded* on 5 October 2026 by PostgreSQL.
- The AI capture layer is parked. Candidates: a free-tier model in the app, or an MCP server so Claude becomes the capture surface. *Still parked;* imports with instructions for your own AI are now the first step.
- Hosting on Xar's own laptop; Tailscale for phone access away from home. *Still holds.*
- Life OS is a fresh app, not a fork of Summer Rescue. *Still holds;* Summer Rescue's behaviour is carried into the native Study section.

## 2 July 2026 — the beginning

- The Vision and the Blueprint: effortless input, design that thrills, private and owned, as close to £0 as possible. An entries core with lenses over it. PocketBase as the leading backend candidate (*superseded* on 5 July).
