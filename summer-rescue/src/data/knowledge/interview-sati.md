@@ id=sati-confirmed-facts | title=Sati interview: confirmed facts, evidence, and unknowns | kind=cheatsheet | topic=Sati · Role and facts | key | tags=interview,facts,application,integrity | cards=interview-sati-role,interview-sati-speaking,interview-sati-logistics
## Confirmed from the invitation

| Item | Confirmed information |
| --- | --- |
| Opportunity | **Data Centre Graduate Internship** |
| Format | **Group interview** |
| Date and time | **Monday 27 July 2026, 12:30** |
| Interviewer/contact named | **Abhi Srivastava** |
| Address | **8A Dunraven Place, Bridgend, CF31 1JD** |
| Dress | **Smart casual** |

Companies House publicly associates **SATi Services Ltd** with 8A Dunraven Place. That confirms an address connection; it does **not** reveal the internship's internal systems, clients, data-centre sites, daily duties, or technical stack.

## The three-column guardrail

Before using any company or role statement, put it in one column:

| Confirmed | Reasonable inference to label | Unknown: ask |
| --- | --- | --- |
| Written in the advert, invitation, application, or reliable public record | A possibility supported by the role title or sector, explicitly phrased as an inference | Team structure, exact technologies, clients, shift pattern, internship length, training, supervision, start date |

Useful language:

- **Confirmed:** “The invitation describes this as a Data Centre Graduate Internship.”
- **Labelled inference:** “I expect reliability and careful escalation to matter in this environment, although I would like to understand how that works in your team.”
- **Unknown:** “What would an intern spend most of the first month learning and doing?”

## Fit must come from your real application

For each claim in the submitted CV or cover letter, prepare:

1. the situation or project;
2. what **you** personally did;
3. the tool or decision involved;
4. the result you can honestly support;
5. what you learned or would improve.

Do not upgrade “used Docker in a university project” into “managed production container infrastructure.” A credible learning trajectory is stronger than an inflated claim.

## Three high-value questions

1. What work would the successful intern handle in the first few weeks, and how would it change as they become trusted?
2. How are interns supervised or trained when working with unfamiliar systems or a live service issue?
3. At the end of the internship, what would make you say the intern had done an excellent job?

Ask about working pattern, duration, and start date if the panel does not cover them.

## Check yourself

1. What do you know about Sati's internal infrastructure? :: Nothing confirmed from the invitation; ask rather than invent.
2. What makes a fit claim safe? :: It is tied to a real application claim and an example you can explain.
3. What is the strongest stance on a learning gap? :: Name it honestly, connect it to relevant foundations, and explain how you would learn and escalate safely.

@@ id=sati-technical | title=Sati technical interview: evidence-first troubleshooting playbook | kind=cheatsheet | topic=Sati · Technical | key | tags=interview,linux,networking,docker,virtualisation,data-centre | cards=interview-sati-technical,interview-sati-practical,interview-sati-group,interview-sati-attend
## The answer frame

For an unfamiliar fault, use:

> **Clarify impact → establish scope → ask what changed → observe before changing → isolate the layer → choose the safest action → verify the original symptom → document and escalate.**

This is more valuable than guessing a command immediately.

## An unavailable-service diagnosis

| Step | Question | Example evidence |
| --- | --- | --- |
| 1. Impact | Who or what is affected? How urgent or risky is it? | user reports, monitoring alert, service objective |
| 2. Scope | One user, one host, one subnet, or the whole service? | another client/host, monitoring, known-good path |
| 3. Change | What changed just before the symptom? | deployment, configuration, certificate, firewall, power or network event |
| 4. Host | Is the expected machine reachable and healthy? | console/monitoring, `uptime`, `free -h`, `df -h` |
| 5. Name and route | Does the name resolve correctly and is there a route? | `dig`/`nslookup`, `ip addr`, `ip route` |
| 6. Port | Is the expected process listening locally? | `ss -lntup` |
| 7. Service | Is it running, restarting, or failed? | `systemctl status name`, `journalctl -u name` |
| 8. Application | Does a local request work? | `curl -v http://127.0.0.1:PORT` |
| 9. Dependencies | Are DNS, database, storage, certificate, or upstream services healthy? | dependency-specific health/logs |
| 10. Safe action | What is the least disruptive approved recovery? | rollback, config correction, controlled restart |
| 11. Verify | Does the **original** user path work, and stay healthy? | same request, logs, monitoring |
| 12. Record | What happened, what changed, and what remains uncertain? | ticket/incident note, escalation |

Never imply that `ping` proves an application works. It only tests a limited network path and may be blocked. Never restart first and erase useful evidence unless safety or an approved procedure requires immediate recovery.

## Networking in plain English

- **IP address:** identifies an interface on a network.
- **Subnet:** tells a host which destinations are local.
- **Default gateway:** the next hop for destinations outside the local subnet.
- **DNS:** maps names to records such as IP addresses; successful DNS does not prove the service is reachable.
- **Port:** identifies a service endpoint on a host.
- **TCP:** connection-oriented and ordered; used by SSH, HTTP, and HTTPS.
- **UDP:** datagram-oriented with lower protocol overhead; DNS commonly uses it for ordinary queries.
- **Useful ports:** SSH 22, DNS 53, HTTP 80, HTTPS 443.

Diagnostic distinction:

- `ip addr` and `ip route`: local addressing and routing configuration.
- `dig` or `nslookup`: name resolution.
- `ss -lntup`: listening sockets and, where permitted, processes.
- `curl -v`: TCP/TLS/HTTP behaviour from the requesting machine.
- `traceroute`/`tracert`: observed network hops, subject to filtering.

## VM, container, and data boundaries

| Concept | Safe explanation |
| --- | --- |
| Virtual machine | Virtualised hardware running its own guest operating system and kernel |
| Container | Isolated process environment sharing the host kernel; commonly created from an image |
| Type 1 hypervisor | Runs directly on host hardware |
| Type 2 hypervisor | Runs on a host operating system |
| Image | Read-only template/layers used to create a container |
| Container | A running or stopped instance created from an image |
| Volume | Storage intended to persist independently of a container's writable layer |
| Snapshot | Point-in-time state useful for short recovery workflows; not automatically an independent backup |
| Backup | A recoverable copy governed by retention, separation, and restore testing |

For a failed container: `docker ps -a` → `docker logs NAME` → `docker inspect NAME` → check ports, mounts, environment and dependencies → make an approved correction → recreate/restart → verify the original request.

## Data-centre reasoning

Think in connected layers: **power, cooling, physical security, network, compute, storage, virtualisation, operating systems, services, monitoring, backups, people and process**.

Good reliability answers mention redundancy, monitoring, capacity, maintenance, tested recovery, change control, documentation, and access control. A graduate does not “try things” on live equipment: protect people first, follow procedure, preserve evidence, use least privilege, communicate impact, and escalate beyond authority.

## Check yourself

1. What is the first technical command in every incident? :: There is no universal first command; first clarify impact, scope, and recent change.
2. What proves recovery? :: Repeating the original failed path successfully, plus checking logs/monitoring for stability.
3. Why is a snapshot not automatically a backup? :: It may depend on the same platform/storage and does not by itself provide independent retention or tested restoration.

@@ id=sati-speaking | title=Sati speaking sheet: introduction, motivation, STAR-L, and availability | kind=worksheet | topic=Sati · Speaking | key | tags=interview,speaking,star,availability | cards=interview-sati-speaking,interview-sati-group,interview-sati-logistics,interview-sati-attend
## 45–60 second introduction

Use cues, not a memorised paragraph:

1. **Present:** MSc Data Science and Analytics student; the practical systems or software work you genuinely do.
2. **Evidence:** one short example of diagnosing, building, integrating, or learning a technical system.
3. **Direction:** why a data-centre internship is a valuable next environment for hands-on learning, reliability, and disciplined troubleshooting.

Cut biography that does not help the panel understand your fit.

## Motivation

A strong answer connects:

- what the opportunity appears to offer;
- what you already have evidence for;
- what you want to learn;
- why this setting is the right next stretch;
- the working habits you bring: careful observation, documentation, collaboration, and safe escalation.

Do not say the company uses a technology unless the advert or panel confirms it.

## One real STAR-L story

| Part | Prompt | Time |
| --- | --- | --- |
| Situation | What concrete system/project and symptom? | 15–20 sec |
| Task | What were you responsible for? | 10 sec |
| Action | What did **you** observe, decide, test, communicate, or change? | 50–70 sec |
| Result | What genuinely improved, shipped, or became understood? | 15–20 sec |
| Learning | What would you repeat or improve? | 10–15 sec |

Choose a real incident from university, a team project, personal work, or employment. Never leave the “Result” as an invented percentage. “We isolated the fault and documented the remaining blocker” is a valid result when true.

## Availability

State:

1. your current MSc commitments;
2. the real dates or hours that constrain you;
3. your earliest honest availability;
4. where you can be flexible;
5. a question about their expected start, duration, and working pattern.

The objective is clarity, not guessing the answer they want.

## Closing

> “Thank you. The combination of hands-on technical learning and careful operational work is what interested me. I would be keen to learn the team's systems properly and contribute in a reliable, well-documented way.”

Adapt it to sound like you.

@@ id=sati-group | title=Sati group interview: collaborate visibly without dominating | kind=cheatsheet | topic=Sati · Group interview | key | tags=interview,group,collaboration,scenario | cards=interview-sati-group,interview-sati-attend
## What the panel can observe

A group exercise makes behaviour visible: listening, clarity, prioritisation, inclusion, evidence use, safe decision-making, and whether the group reaches a useful next action. Speaking most is not the same as contributing most.

## A reliable incident-discussion structure

1. Confirm the objective and time available.
2. Establish impact, safety, and scope.
3. List known evidence and missing information.
4. Separate immediate containment/recovery from root-cause work.
5. Compare options by risk, reversibility, authority, and evidence.
6. Assign an owner and verification step.
7. Summarise the decision and unresolved risk.

## Useful phrases

- **Enter early:** “Could we first agree the impact and what evidence we already have?”
- **Build:** “Building on that, I would check whether the symptom is local to one host or broader.”
- **Disagree safely:** “I can see why a restart may restore service. Could we capture the current state first so we do not lose the cause?”
- **Invite:** “We have not heard your view on the network side yet; what would you check?”
- **Time-check:** “We have five minutes. Shall we choose the safest immediate action and name the follow-up?”
- **Summarise:** “So our immediate action is X, Y owns it, and we verify with Z; the root-cause question remains A.”

## Avoid

- waiting silently for the perfect insight;
- interrupting to repeat a point;
- treating an assumption as evidence;
- volunteering to do everything yourself;
- using jargon without explaining the decision;
- forcing consensus when safety or authority requires escalation.

## Check yourself

1. What is a good first contribution? :: Clarify objective, impact, scope, or evidence.
2. How do you disagree without blocking the group? :: Acknowledge the aim, state the risk/evidence, and offer a safer test or reversible next action.
3. What belongs in the final summary? :: Decision, owner, verification, and unresolved risk.

@@ id=sati-travel | title=Sati interview day: route, buffers, packing, and disruption rules | kind=checklist | topic=Sati · Travel | key | tags=interview,travel,packing,bridgend | cards=interview-sati-logistics,interview-sati-attend
## Fixed plan

- Interview: **Monday 27 July 2026 at 12:30**.
- Address: **8A Dunraven Place, Bridgend, CF31 1JD**.
- Planned outbound train: **11:13 Cardiff Central → 11:39 Bridgend**, direct.
- Leave Howard Gardens: **10:20** for a **10:50** station arrival target.
- Locate the address by **11:55**; wait nearby.
- Enter/check in: **12:10–12:15**.

The timetable is a plan, not live operating information. Check National Rail or Transport for Wales before leaving. If the service is disrupted, take the earliest ticket-permitted service that restores a safe arrival buffer and contact the interviewer if a material delay becomes likely.

## Sunday lock

- Confirm ticket restrictions and 26–30 Railcard access.
- Save invitation, address, route, and contact information offline.
- Lay out clean smart-casual clothes and comfortable shoes.
- Pack ID, two CV copies, notebook, two pens, water, snack, charger, power bank, medication if needed.
- Check the live weather Sunday night and Monday morning; pack an umbrella only if useful.
- Charge phone and power bank; set more than one alarm.
- Protect sleep. Stop technical preparation after the one-page sheet is complete.

## Monday rules

1. Eat breakfast, shower, dress, and review one page once.
2. Check live train status, weather, ticket, Railcard, phone charge, and bag.
3. Keep the planned buffers. Do not convert spare time into new study.
4. Use live departures for the return because the interview end time is uncertain.
5. Eat and decompress before writing the debrief.

## Disruption decision

- **Minor uncertainty, still safe:** keep the plan and monitor.
- **Planned train cancelled/delayed:** use the earliest permitted alternative; prefer arriving early over a tight connection.
- **Arrival may be late:** call or email the named contact as soon as the risk is clear, state the facts and revised estimate.
- **Phone/battery problem:** carry the address and contact details on paper.

@@ id=sati-one-page | title=Sati final one-page cue sheet | kind=cheatsheet | topic=Sati · Final sheet | key | tags=interview,one-page,final,travel | cards=interview-sati-logistics,interview-sati-attend
## Facts

- Data Centre Graduate Internship; group interview.
- Mon 27 Jul, 12:30; Abhi Srivastava.
- 8A Dunraven Place, Bridgend CF31 1JD.
- Smart casual.

## My answer cues

- **Introduction:** present → one relevant example → why this learning step.
- **Three fit points:** _write only real evidence here_.
- **STAR-L:** situation → task → my actions → honest result → learning.
- **Availability:** real MSc constraints → earliest start/flexibility → ask expected pattern.

## Technical order

**impact → scope → change → host/resources → DNS/route → port → service/logs → dependencies → safest approved action → original-path verification → record/escalate**

VM has a guest OS/kernel; container shares the host kernel. Snapshot is not automatically an independent backup. In a data centre: safety, procedure, least privilege, evidence, change control, verification, documentation, escalation.

## Group cues

- Enter: clarify impact/evidence.
- Build: add a test or risk to another point.
- Include: invite a quieter view.
- Close: decision + owner + verification + unresolved risk.

## Questions

1. First few weeks and progression?
2. Training/supervision on unfamiliar or live systems?
3. What does excellent internship performance look like?

## Route

Leave Howard Gardens **10:20** → Cardiff Central target **10:50** → planned direct train **11:13–11:39** → locate address **11:55** → enter **12:10–12:15**. Check live rail and weather before leaving.

No new study on Monday.
