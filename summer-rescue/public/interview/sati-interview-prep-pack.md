# Sati Data Centre Graduate Internship — interview prep pack

Interview: Monday 27 July 2026, 12:30  
Format: group interview  
Address: 8A Dunraven Place, Bridgend, CF31 1JD  
Named interviewer/contact: Abhi Srivastava  
Dress: smart casual

## 1. Evidence audit

Open the actual advert, submitted CV, cover letter, and invitation. Complete this table before rehearsing:

| Advert/application claim | My genuine evidence | My action | Honest result | Learning |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

Mark each company statement as **confirmed**, **labelled inference**, or **unknown to ask**. The role title and public address do not establish Sati's internal infrastructure or technologies.

## 2. Core spoken answers

### Introduction: 45–60 seconds

Use three cues:

1. Present: what you study/do now.
2. Evidence: one relevant practical problem or project.
3. Future: why this internship is the right hands-on learning step.

### Motivation

Cover:

- why the operational/data-centre setting interests you;
- what relevant habits you already demonstrate;
- what you want to learn;
- how you approach unfamiliar or live systems safely.

### STAR-L: no more than two minutes

- Situation:
- Task:
- My actions:
- Result I can support:
- Learning:

### Availability

- Current MSc/exam commitments:
- Earliest honest start:
- Hours or dates that are fixed:
- Where I can be flexible:
- Question about Sati's expected pattern:

## 3. Technical answer structure

For any service incident:

**impact → scope → recent change → observe → isolate the layer → safest approved action → original-path verification → document/escalate**

Example evidence:

- host/resources: `uptime`, `free -h`, `df -h`;
- address/route: `ip addr`, `ip route`;
- DNS: `dig` or `nslookup`;
- listening ports: `ss -lntup`;
- service and logs: `systemctl status`, `journalctl -u`;
- application path: `curl -v`;
- containers: `docker ps -a`, `docker logs`, `docker inspect`.

Explain what each check tells you. Do not restart first unless an approved recovery procedure or safety need requires it.

## 4. Group incident exercise

Scenario:

> At 09:00, monitoring shows that a web service used by several staff is unavailable. One person wants to restart everything immediately. Another suspects the network. You have 20 minutes as a group to recommend the immediate action and follow-up.

Produce:

1. impact and scope;
2. facts known versus missing evidence;
3. safe diagnostic order;
4. immediate recovery versus root-cause investigation;
5. risk and escalation point;
6. owner and verification;
7. a 30-second summary.

During rehearsal, practise:

- contributing within the first few minutes;
- building on another idea;
- disagreeing through evidence and risk;
- inviting a quieter view;
- time-checking;
- closing with action, owner, verification, and unresolved risk.

## 5. Questions to ask

1. What would the successful intern work on in the first few weeks?
2. How are interns trained and supervised around unfamiliar or live systems?
3. What would excellent performance look like by the end?

If not covered, ask about working pattern, duration, and start date.

## 6. Debrief template

- Interview start/end:
- Names and roles confirmed:
- Questions asked:
- My answers/examples:
- Technical/group exercise:
- Working pattern, duration, start-date information:
- Stated next step and timing:
- One thing done well:
- One improvement:
- Thank-you sent at:

## Source guardrail

Use the invitation, advert, and submitted application as the primary truth. Public records can confirm basic legal/address facts. Treat journey times as planned until checked live on the day.
