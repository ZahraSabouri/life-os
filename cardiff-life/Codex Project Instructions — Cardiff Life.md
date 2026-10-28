# Cardiff Life

This is an ongoing personal research and planning project for my life while studying at Cardiff University.

The project should help me deliberately build a stronger social life, find communities I genuinely want to become part of, meet new people outside my existing university circle, develop professional and academic connections, and discover worthwhile cultural activities in Cardiff.

This is not simply an event-discovery project.

The main objective is to identify environments that can lead to:

- real friendships;
- repeated contact with the same people;
- communities and societies I can become part of;
- interesting intellectual and cultural experiences;
- professional, academic and research connections;
- a fuller life in Cardiff outside my existing friendship group.

## Sources

Regularly investigate:

- Cardiff Students' Union
- Cardiff University
- Cardiff University societies and Give It A Go activities
- Eventbrite
- university departments, schools and research centres
- public lectures and seminars
- professional communities in Cardiff
- technology, software, AI, machine learning, data and research communities
- startup and entrepreneurship communities
- volunteering organisations
- cultural organisations
- useful local event listings
- any other credible Cardiff sources discovered during research

A separate Cardiff Live Search may cover theatre, concerts, spoken word and live performance. Avoid duplicating ordinary cultural listings unless an event also has unusually high social/community value.

## What matters most

Prioritise opportunities involving repeated contact.

A weekly society, recurring meetup, workshop series, volunteering group or small community where I encounter the same people repeatedly is generally more valuable than a large one-off event.

Consider:

- likelihood of actually talking to people;
- whether attending alone is normal;
- whether people return regularly;
- whether this could develop into friendships;
- whether the group appears welcoming to postgraduate/returning students rather than almost entirely freshers;
- intellectual or cultural interest;
- professional and academic relevance;
- networking potential;
- price;
- distance;
- timing;
- registration requirements;
- deadlines and ticket scarcity.

Do not assume something is worthwhile merely because it is marketed to students.

Be sceptical of generic club nights, low-interaction fairs, promotional events, sales funnels, generic networking events, expensive seminars, MLM-style events and activities where there is little realistic opportunity to meet people.

Freshers or Welcome events are not automatically irrelevant. Recommend them when they provide a genuine route into a society, club or recurring community and returning students can reasonably participate.

## My interests

Strong areas include:

- intellectually interesting conversations and communities;
- literature;
- film;
- theatre and art;
- music;
- languages and international/intercultural environments;
- technology;
- software engineering;
- AI and machine learning;
- data science;
- research;
- entrepreneurship;
- postgraduate academic communities.

Do not restrict discovery completely to these interests. Include occasional wildcards when an activity appears unusually good socially.

## Persistent files

Maintain these files:

### index.html

The preferred human-readable view, requested on 29 September 2026. Maintain a local weekly planner with Maybe / Plan to go choices, a broad catalogue with activity filters, readable event descriptions and communities. The user wants sports, fitness, dance and other SU activities included so they can decide for themselves. Keep the main report selective, but do not cap the wider catalogue at 10–15 or restrict it to the original interests. Rebuild after every research update with `python build_html.py`. Keep CSV and Markdown as research records; edit html_template.html and planner.js for display changes. Preserve browser planning choices using stable event IDs. Plans do not imply bookings or attendance. Do not advance research-check dates when only rebuilding the display.

### events.csv

The structured event database.

Suggested columns:\
event_id\
name\
organiser\
source\
source_url\
category\
date\
start_time\
end_time\
location\
cost\
booking_required\
booking_deadline\
recurring\
social_value\
networking_value\
repeat_potential\
solo_friendliness\
status\
first_seen\
last_checked\
notes

Use a stable event_id where possible so the same event is not repeatedly added as a new event.

### events.md

The human-readable current report.

Keep this concise and useful.

Organise it broadly into:

- Best things to actually do
- Social/community
- Professional/academic
- Interesting wildcards
- Coming later
- Deadlines / act soon

Do not dump every event found.

### communities.md

Maintain a long-term list of societies, clubs, organisers, recurring meetups and communities worth following.

For each community record:

- what it is;
- why it may suit me;
- frequency;
- typical events;
- social potential;
- professional potential where relevant;
- entry point;
- official link;
- whether I have tried it;
- my feedback if known.

### history.md

Keep lightweight historical information needed to improve recommendations.

Record events or groups I:

- attended;
- rejected;
- disliked;
- liked;
- explicitly said I am not interested in.

Use this to avoid repetitive recommendations and improve future searches.

## Updating behaviour

On each automated research run:

1. Read the existing project files before searching.
2. Search the designated sources thoroughly.
3. Verify promising events using authoritative or official sources whenever possible.
4. Update existing event records instead of duplicating them.
5. Add genuinely useful new events.
6. Mark cancelled, expired or sold-out events appropriately.
7. Remove expired events from the main current recommendations while retaining enough history to prevent rediscovery.
8. Update recurring communities when useful new information appears.
9. Rebuild events.md so it reflects the best current choices.
10. Run `python build_html.py` to rebuild index.html from the updated files and verify the output.
11. Report what materially changed since the previous run, linking to index.html.

Do not erase my historical preferences merely because an event has passed.

## Recommendation behaviour

Do not flood me.

The main report should usually contain no more than roughly 10–15 genuinely worthwhile active possibilities, even if many more were discovered.

Surface the strongest few first.

For important events include:

- what it is;
- when;
- where;
- cost;
- booking requirement;
- direct official link;
- whether recurring;
- why it might be socially useful;
- why it might be professionally useful;
- whether attending alone should be comfortable;
- urgency.

Separate SOCIAL VALUE from NETWORKING VALUE. An event can be excellent for one and poor for the other.

Prefer concrete reasoning over generic statements such as "great way to meet people."

## Autonomy limits

Research, organise and update the project files autonomously.

Do not:

- buy tickets;
- register me;
- join societies;
- send emails;
- contact organisers;
- submit forms;
- make purchases

unless I explicitly ask for that action.

When login is required merely to perform an action rather than to view public information, leave the action for me.

## University first and Life OS updates

User priority, 26 October 2026: university Outlook announcements and opportunities first, then teaching timetable, then other events. Catch competitions, hackathons, scholarships, funding, applications and expressions of interest early. Track application deadlines separately from presentation/event dates, including opportunities beyond the ordinary 21-day event window. Confirm taught-MSc eligibility and preparation/team requirements. Never turn a closed application into an upcoming opportunity merely because its presentation is later.

Outlook browser access was verified on 26 October. Recheck access each run; use the signed-in university Codex tab or a connected university connector. The first 30-day backfill is partial. `university-status.json` records coverage and the last complete checkpoint; advance that checkpoint only after finishing the search. Do not interpret a failed or partial search as no opportunities. `opportunities.json` keeps concise facts, stable IDs, stage deadlines, eligibility, source references and availability. Preserve first_seen and user feedback. Do not store email bodies, recipients, tracking links or authentication links.

The Outlook search runs daily at 09:00 Europe/London. Notify on useful new opportunities, material changes, first crossings of 7/3/1-day deadline windows and newly actionable access gaps; record alert IDs/milestones in history to prevent repeats. Thursday and Friday searches keep their times but perform the university priority check first. Timetable file age must remain visible; email corrections go in `timetable-source.json` with scope and source, without rewriting the original export. Missing classes do not establish availability. The source path is local configuration and must not be committed.

After every research update run `python build_html.py`, then `python sync_life_os.py` from the standalone Cardiff Life folder. `life-os-sync.json` names the Life OS Cardiff directory. Sync copies only research files, validates stable IDs/provenance, checks its previous destination hashes, backs up, and builds using Life OS's own display code. It never writes the core database, own-events API or browser choices. If destination research was independently edited, stop and merge the conflict before syncing. Never copy a whole app folder or overwrite Life OS's own planner/template. Confirm source/destination event and community counts and check the live Life OS Cardiff page/calendar when accessible. A successful offline build alone is not proof of a live refresh.

The priority panel is fed by opportunities.json and university-status.json. Dated event occurrences remain in events.csv. Teaching blocks are a separate projection of the saved timetable; they are not optional events and must not be duplicated into Life OS core teaching records. Browser Maybe/Plan to go choices remain intentions only.
