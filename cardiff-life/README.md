# Cardiff Life

A lasting list of places to meet people, return regularly, and build a fuller life in Cardiff. The priority is friendship and community, alongside intellectual interests and professional or academic connections.

Open **[Cardiff Life](index.html)** in your browser. **My week** shows Monday–Sunday, available options and your own **Maybe / Plan to go** choices. **All choices** offers the wider catalogue, a smaller shortlist and your saved choices, with filters for activity, date, source and free admission. Double-click index.html to open it; no server is needed. Reload the page after a scheduled search updates it.

[events.csv](events.csv) remains the structured record. The [written report](events.md), [community notes](communities.md) and [history](history.md) remain available. The original [project instructions](Codex%20Project%20Instructions%20%E2%80%94%20Cardiff%20Life.md) contain the detailed brief; AGENTS.md makes it part of the working instructions.

## Updating the HTML

Every scheduled search must update the research files, then run `python build_html.py` in this folder. The script requires Python 3.11+ and no third-party packages. On this machine the bundled executable is `C:\Users\ctrlz\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.

The script combines events.csv, recommendation order in events.md, and the community entries in communities.md. It reads the saved automation states when available. `html_template.html` holds the page design and `planner.js` holds planner behaviour; both are embedded into the generated `index.html`. Keep links in the report identical to CSV source URLs, and keep community IDs stable. If one official programme URL covers several active occurrences, the builder includes each of those dates; describe all of them in that report choice. Past/inactive occurrences on the same URL are excluded. The script validates input before replacing index.html. Research dates stay tied to actual source checks.

The HTML contains its data, styling and scripts, so it works offline and needs no spreadsheet application. It hides past/inactive events from discovery but retains them in saved choices, with their status shown. Unknown dates are kept off the calendar. Overlap notices compare known event times, including overnight events; they do not include travel time. Research dates do not prove that tickets are still available.

Choices and personal notes use browser localStorage under a stable key, keyed by event_id. They survive rebuilding the same HTML file in a browser that supports storage for local files. Use **Updates & backup → Export my choices** before changing browser, moving the file or clearing browser data. Import merges missing choices and preserves existing choices and notes. If storage fails, the page warns that export is needed. Browser choices are not automatically readable by scheduled research tasks and are not written to history.md. Tell the agent in chat about attendance/preferences that should inform research. A plan is never treated as a booking or as attendance.

## Preferences

Prioritise conversation, repeated contact, welcoming solo attendance and postgraduate/returning-student suitability in the shortlist. Keep the report to about 10–15 choices, but **do not apply this cap to the wider catalogue**. The user asked for breadth on 29 September: include sports, fitness, dance, outdoors, crafts, music and other SU activities as well as established intellectual/professional interests. Give each option a concrete description so the user can decide. Do not silently exclude an activity merely because it is outside the original interests. Keep generic sales events and separate Cardiff Live performance listings outside routine duplication.

Budget ceiling, home starting point, preferred travel radius and weekly availability are not yet specified. Do not invent these or infer sensitive personal characteristics from the types of groups researched. Attendance and feedback are not yet known. Research and file updates are authorised; bookings, joining and contacting people require an explicit request.

## Weekly searches

Schedules use UK local time (Europe/London). The slots are Thursday 09:00 for SU + University, Friday 09:00 for Eventbrite + wider Cardiff, and daily 09:00 for University Outlook. See the confirmed automation status below. Each search reads and updates these same files, rebuilds index.html and looks roughly three weeks ahead. Notify only for useful new discoveries, significant changes, failures or a required decision.

University Outlook browser access was verified on 26 October 2026. The daily search is active; each run must verify access and report gaps. The separate Cardiff Live Search remains outside this project's ordinary cultural listings.

### Automation status

Saved and verified on 29 September 2026. These are recurring follow-ups attached to this chat, using this same local project.

| Search | Schedule | State | Automation ID |
| --- | --- | --- | --- |
| Cardiff Life — SU + University | Thursday 09:00; first scheduled date 1 October 2026 | Active | `cardiff-life-su-university` |
| Cardiff Life — Eventbrite + wider Cardiff | Friday 09:00; first scheduled date 2 October 2026 | Active | `cardiff-life-eventbrite-wider-cardiff` |
| Cardiff Life — University Outlook | Daily 09:00 | Active; authorised browser access verified 26 October | `cardiff-life-university-outlook` |

Outlook Email was available but not installed/connected when checked. The active daily search currently uses the authorised signed-in university browser tab; verify access on every run. A university connector can be used if connected later. First SU + University scheduled research run completed on 1 October 2026, with the HTML rebuilt and record counts validated. The original Cardiff Live Search was not changed. SU + University research completed on 8 October; wider-Cardiff research checked on 4 October was saved at the same time after its update was interrupted. Source-check dates remain tied to those actual checks. SU + University research was refreshed on 15 October for 15 October-5 November, with an 11 November AI watchlist item. One Creative Lives lead from the interrupted 9 October wider-city run was rechecked and saved; that wider search was not a completed refresh. A fresh wider-Cardiff run completed on 16 October for 16 October-6 November, preserving yesterday's university check dates. SU + University refreshed on 22 October for 22 October-12 November, with a later Boccia volunteer opportunity flagged for its 31 October registration deadline. Wider-Cardiff entries retain their actual earlier source-check dates.

All three saved automation prompts were updated and read back on 29 September 2026 to include broader activity discovery and `python build_html.py` after research. Active/paused states and weekly times were preserved.

## Sources to revisit

| Scope | Starting points | What to look for |
| --- | --- | --- |
| SU | [All events](https://www.cardiffstudents.com/whatson/all/), [Give It A Go](https://www.cardiffstudents.com/whatson/giveitago/), [societies](https://www.cardiffstudents.com/activities/societies/), [postgraduates](https://www.cardiffstudents.com/postgrad/) | Sports and fitness, dance, outdoor activities, crafts, music, society entry points, repeat sessions, volunteering and postgraduate gatherings |
| University | [Events](https://events.cardiff.ac.uk/browse-events/), [Computer Science events](https://www.cardiff.ac.uk/computer-science/events), [Data analytics and machine learning](https://www.cardiff.ac.uk/research/explore/research-units/data-analytics-and-machine-learning) | Public lectures, seminars, research groups, workshops and innovation communities |
| Wider Cardiff | [Eventbrite](https://www.eventbrite.co.uk/d/united-kingdom--cardiff/events/), [PyData Cardiff](https://www.meetup.com/pydata-cardiff-meetup/), [AI Wales programme](https://aiwales.org/events/) | Practical technical communities, founder groups and interactive meetups |
| Social and volunteering | [Language exchange](https://linktr.ee/cardifflanguageexchange), [Global Gardens](https://www.globalgardensproject.co.uk/garden), [Cardiff Hackspace](https://cardiffhackspace.co.uk/hackspace-policy/), [Readers of the Round Table](https://linktr.ee/TheReadersOfTheRoundTable) | Regular contact outside the university circle |
| University research and public talks | [ExChange Wales webinar](https://events.cardiff.ac.uk/view/can-early-years-support-impact-childrens-social-care/), [Earth public lecture series](https://events.cardiff.ac.uk/view/public-lecture-series-the-emergence-of-life-on-earth-what-we-know-what-we-think-we-know-and-what-we-have-no-idea-about/), [JOMEC public events](https://events.cardiff.ac.uk/view/the-news-is-dead-why-the-media-is-broken-and-what-you-can-do-about-it/) | Student-accessible research and intellectual options; distinguish lecture learning from conversation opportunities |
| Wider activity groups | [GoodGym Cardiff](https://www.goodgym.org/v3/areas/cardiff), [Lark Design Make](https://www.larkdesignmake.co.uk/list-craft-workshops-cardiff), [Swing Project](https://www.swingproject.co.uk/event-calendar), [Readers](https://linktr.ee/TheReadersOfTheRoundTable), [Desi Beats](https://bookwhen.com/desibeats) | Volunteering with movement, crafts, dance and repeat social contact; verify each session and its requirements |
| Research networks and seminars | [South Wales OR Network](https://www.theorsociety.com/ORS/Event_Display.aspx?EventKey=SWORDOCT26&WebsiteKey=c1745213-aec0-45e5-a960-0ec98ebabd4e), [CUBRIC seminars](https://www.cardiff.ac.uk/cardiff-university-brain-research-imaging-centre/events/seminars) | Quantitative research and interdisciplinary seminars; confirm dates, taught-postgraduate audience, admission and registration separately |
| Additional academic and community discovery | [GAPT seminars](https://research-sites.cardiff.ac.uk/gapt/), [Cyber Innovation Hub event](https://events.cardiff.ac.uk/view/resilient-ai-innovation-day-in-partnership-with-nvidia/), [Being Human gaming workshop](https://events.cardiff.ac.uk/view/fact-versus-fiction-in-the-gaming-world/), [SU volunteering projects](https://www.cardiffstudents.com/jobs-skills/volunteering/projects/) | Check each date and taught-PG eligibility; keep incomplete seminar arrangements on the community watchlist |
| Further wider Cardiff communities | [Cardiff Outdoor Group](https://cardiffoutdoorgroup.wordpress.com/current-programme/), [Ardour Academy](https://ardouracademy.com/), [FinTech Wales](https://fintechwales.org/events/future-finance-hackathon-can-ai-give-better-insurance-answers/) | Dated walks, music/craft/dance participation and practical AI/finance collaboration; verify prices, venue and individual dates |
| Additional public workshops and volunteering | [Being Human 2026 programme](https://www.cardiff.ac.uk/being-human-festival/being-human-festival-programme-2026), [Boccia volunteering](https://www.disabilitysportwales.com/en-gb/news/volunteering-opportunities-boccia-july-2026), [Clean Up Cardiff](https://www.cardiffstudents.com/jobs-skills/volunteering/project/cleanupcardiff/), [Language mentoring](https://www.cardiffstudents.com/jobs-skills/volunteering/project/community-partners/mfllangculturementor/) | Hands-on public humanities; verify individual dates, registration deadlines and taught-PG/volunteer eligibility. Undated intake pages remain community leads. |
| University Outlook | Relevant university newsletters, school announcements and event invitations in the connected university account | Opportunities missing from public listings; retain only necessary event facts |

These are starting points, not an exhaustive source list. Follow credible new organisers. Treat similarly named groups on different domains as separate until their relationship is verified.

## Data conventions

- UTF-8 CSV with a header, quoted fields and one record per event occurrence, plus explicitly labelled undated recurring opportunities. Dates use YYYY-MM-DD and times use 24-hour local time. `timezone` is Europe/London.
- `event_id`: `su-<official event number>`, `eventbrite-<ticket id>`, or a stable organiser/series identifier. Never regenerate IDs because a title changes. `community_id` links related dates.
- `status`: `upcoming`, `needs_verification`, `recurring`, `sold_out`, `cancelled`, `postponed`, or `expired`. It describes the listing, not the user's intentions.
- `first_seen` and `last_checked`: research dates. `last_shown`: most recent report inclusion, used to avoid repetitive alerts. `verification` explains the level and gaps of evidence.
- Empty date/deadline cells mean not established. `cost` is descriptive GBP text so fees, optional purchases and unknown prices remain explicit. Do not treat an empty or unknown price as zero.
- `social_value`, `networking_value`, `repeat_potential`, and `solo_friendliness` contain short assessments and their reasoning. They are not measured scores or promises of friendships.
- `recurring` explains whether the event is a repeat meeting, an entry into a continuing society, or a one-off. Do not create future dates from this field without verification.
- `notes` holds eligibility caveats, source conflicts, secondary source URLs and useful changes. Preserve user notes. Keep rejected/attended/liked/disliked history in history.md permanently unless the user requests removal.
- `activity`: exactly one primary navigation category: `sport`, `dance`, `creative`, `music`, `social`, `professional`, or `volunteering`. This is a classification, not a user preference. Keep the descriptive `category` field as context.
- `description`: a short, source-grounded explanation of what the person would actually do. `experience`: required ability, equipment or preparation, with unknowns explicit. These fields help the user decide without opening every source.

Current catalogue: 135 records (134 dated and one undated), 22 records in 11 grouped shortlist choices, and 87 community entries, as of 28 October 2026. These are researched examples, not complete coverage of the SU calendar.

After an update, check that IDs are unique, row widths match the header, dates are valid, source URLs are present, the report has no expired recommendations, and every report item maps to a saved record or a clearly identified community. No ticket has been purchased and no attendance has been booked by this project.

## University first and Life OS updates

User priority, 26 October 2026: university Outlook announcements and opportunities first, then teaching timetable, then other events. Catch competitions, hackathons, scholarships, funding, applications and expressions of interest early. Track application deadlines separately from presentation/event dates, including opportunities beyond the ordinary 21-day event window. Confirm taught-MSc eligibility and preparation/team requirements. Never turn a closed application into an upcoming opportunity merely because its presentation is later.

Outlook browser access was verified on 26 October. Recheck access each run; use the signed-in university Codex tab or a connected university connector. The first 30-day backfill is partial. `university-status.json` records coverage and the last complete checkpoint; advance that checkpoint only after finishing the search. Do not interpret a failed or partial search as no opportunities. `opportunities.json` keeps concise facts, stable IDs, stage deadlines, eligibility, source references and availability. Preserve first_seen and user feedback. Do not store email bodies, recipients, tracking links or authentication links.

The Outlook search runs daily at 09:00 Europe/London. Notify on useful new opportunities, material changes, first crossings of 7/3/1-day deadline windows and newly actionable access gaps; record alert IDs/milestones in history to prevent repeats. Thursday and Friday searches keep their times but perform the university priority check first. Timetable file age must remain visible; email corrections go in `timetable-source.json` with scope and source, without rewriting the original export. Missing classes do not establish availability. The source path is local configuration and must not be committed.

After every research update run `python build_html.py`, then `python sync_life_os.py` from the standalone Cardiff Life folder. `life-os-sync.json` names the Life OS Cardiff directory. Sync copies only research files, validates stable IDs/provenance, checks its previous destination hashes, backs up, and builds using Life OS's own display code. It never writes the core database, own-events API or browser choices. If destination research was independently edited, stop and merge the conflict before syncing. Never copy a whole app folder or overwrite Life OS's own planner/template. Confirm source/destination event and community counts and check the live Life OS Cardiff page/calendar when accessible. A successful offline build alone is not proof of a live refresh.

The priority panel is fed by opportunities.json and university-status.json. Dated event occurrences remain in events.csv. Teaching blocks are a separate projection of the saved timetable; they are not optional events and must not be duplicated into Life OS core teaching records. Browser Maybe/Plan to go choices remain intentions only.

## Local research data and recovery

Research files, generated index.html, university evidence and local timetable/sync configuration are kept outside git because they can contain private university references. Back them up separately. A fresh code checkout needs those local inputs restored from the standalone project or its protected backups before building; never substitute an empty catalogue. Life OS retains its own display code during sync.
