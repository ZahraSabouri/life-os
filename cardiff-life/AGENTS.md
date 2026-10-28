# Cardiff Life

Read `Codex Project Instructions — Cardiff Life.md` before doing project work. It contains the user's permanent objectives, interests, source preferences and autonomy limits. Also read README.md, events.csv, events.md, communities.md and history.md before each research run.

Research and maintain this local Markdown and CSV project. Prioritise repeated contact, conversation and communities that welcome postgraduate or returning students. Keep social value separate from professional value. Do not build an app unless requested.

## Research and records

- Use the current date and Europe/London time. Usually search the next 21 days, with a small later watchlist when worthwhile.
- Verify promising results on organiser, university or official ticket pages. Search snippets are discovery leads. Use the browser when a detail page cannot be read through web search. Record inaccessible sources and unresolved conflicts.
- Read the complete date including year. Never recycle an old event as an upcoming occurrence. A recurring timetable alone does not confirm an individual future session.
- Do not invent cost, ticket availability, deadlines, eligibility, travel times or postgraduate attendance. Unknown is different from free or no booking needed. Ticket controls indicate a booking route, not a guaranteed place.
- Distinguish evidence from assessment. Social, networking and solo-friendliness ratings are reasoned assessments unless an organiser explicitly states the relevant fact.
- Preserve event IDs and first_seen. Match canonical organiser/ticket IDs across platforms and compare name, organiser, date and venue before adding. Strip tracking parameters. Use one record for one dated occurrence. Use a single stable series ID for an undated recurring opportunity and explain that distinction.
- Update a rescheduled occurrence in place when the organiser retains its identity. Record the old date in notes/history. Different dated sessions of one series have distinct event IDs and the same community_id.
- Keep expired, cancelled and sold-out records in events.csv. Exclude them from current recommendations. A failed fetch is not evidence of cancellation. Only advance last_checked when the source was actually checked; log failed attempts separately.
- Keep availability in status. Keep personal attendance and preferences in history.md, and never infer attendance from an event passing or from being shown a recommendation.
- Preserve personal feedback, source provenance, and manually entered notes. An unchanged item can remain in events.md while relevant but must not trigger a fresh notification every run.
- Use the CSV fields and conventions in README.md. Re-read files before saving to avoid overwriting changes made during research. Validate unique IDs, consistent field counts and CSV quoting after edits.

## Current report and follow-up

Rebuild events.md with roughly 10–15 or fewer worthwhile possibilities, strongest first. Group related repeat dates into one choice. Include when, where, cost, booking, direct link, recurrence, social/professional reasoning, solo suitability and genuine urgency. Mark conditional leads clearly. Mention useful timetable conflicts. Keep unknown-date communities in communities.md rather than manufacturing dates.

The user also wants a broader catalogue to make their own choices, especially sports and other SU activities. The 10–15 cap applies to the report only. Search sports/fitness, dance, outdoors, crafts, music, social/language activities and volunteering as well as professional interests. Save worthwhile verified options in events.csv even if they are not in the shortlist. Maintain activity, description and experience fields using README.md conventions. Explain what the user would do and any skill/equipment requirements. Inclusion is not evidence of a personal preference.

The user's preferred view is index.html, with a weekly calendar, Maybe / Plan to go choices and an activity catalogue. After updating the research files, run `python build_html.py` in this folder (Python 3.11+; use the bundled Python runtime if needed). This rebuilds the self-contained HTML from events.csv, events.md and communities.md using html_template.html and planner.js. Keep exact event source links in events.md: their order determines the HTML shortlist. All choices must include the broader catalogue. Keep stable community IDs in communities.md; use four table columns separated by spaced pipes or the existing linked paragraph format. Do not hand-edit index.html because it is generated. Edit the template or planner for presentation/behaviour changes, then rebuild. Preserve the localStorage key and stable event IDs so browser planning choices survive research updates. Browser choices are not attendance, bookings or research feedback; do not infer or overwrite them. Do not advance source-check dates merely because the page was rebuilt. Verify successful output and event/community counts before reporting completion, and link index.html in meaningful updates. Local HTML opens directly without a server, account or internet connection; external event links need internet.

Append a dated, concise run entry to history.md with added/changed/expired items, recommendation IDs shown, source coverage and access gaps. Keep user feedback in its own section. Report only meaningful new findings, material changes, completion, failure or required user action; stay quiet on unchanged runs.

Use the public-source registry in README.md. University research should include departments and research seminars, checking student eligibility rather than assuming PGR-only activities accept taught postgraduates. Wider Cardiff research should look beyond university and beyond Eventbrite. Preserve the separate Cardiff Live Search and avoid routine performance-listing duplication.

## Action boundary

Do not buy tickets, register, join groups, send emails/messages, contact organisers, submit forms, create accounts, or make purchases without an explicit user request. Reading public booking information is allowed. Leave login-dependent actions to the user. Outlook research, when connected, is read-only and limited to relevant university event/community announcements; save concise event facts and useful source references, not email bodies, private recipient lists or authentication links.

## University first and Life OS updates

User priority, 26 October 2026: university Outlook announcements and opportunities first, then teaching timetable, then other events. Catch competitions, hackathons, scholarships, funding, applications and expressions of interest early. Track application deadlines separately from presentation/event dates, including opportunities beyond the ordinary 21-day event window. Confirm taught-MSc eligibility and preparation/team requirements. Never turn a closed application into an upcoming opportunity merely because its presentation is later.

Outlook browser access was verified on 26 October. Recheck access each run; use the signed-in university Codex tab or a connected university connector. The first 30-day backfill is partial. `university-status.json` records coverage and the last complete checkpoint; advance that checkpoint only after finishing the search. Do not interpret a failed or partial search as no opportunities. `opportunities.json` keeps concise facts, stable IDs, stage deadlines, eligibility, source references and availability. Preserve first_seen and user feedback. Do not store email bodies, recipients, tracking links or authentication links.

The Outlook search runs daily at 09:00 Europe/London. Notify on useful new opportunities, material changes, first crossings of 7/3/1-day deadline windows and newly actionable access gaps; record alert IDs/milestones in history to prevent repeats. Thursday and Friday searches keep their times but perform the university priority check first. Timetable file age must remain visible; email corrections go in `timetable-source.json` with scope and source, without rewriting the original export. Missing classes do not establish availability. The source path is local configuration and must not be committed.

After every research update run `python build_html.py`, then `python sync_life_os.py` from the standalone Cardiff Life folder. `life-os-sync.json` names the Life OS Cardiff directory. Sync copies only research files, validates stable IDs/provenance, checks its previous destination hashes, backs up, and builds using Life OS's own display code. It never writes the core database, own-events API or browser choices. If destination research was independently edited, stop and merge the conflict before syncing. Never copy a whole app folder or overwrite Life OS's own planner/template. Confirm source/destination event and community counts and check the live Life OS Cardiff page/calendar when accessible. A successful offline build alone is not proof of a live refresh.

The priority panel is fed by opportunities.json and university-status.json. Dated event occurrences remain in events.csv. Teaching blocks are a separate projection of the saved timetable; they are not optional events and must not be duplicated into Life OS core teaching records. Browser Maybe/Plan to go choices remain intentions only.
