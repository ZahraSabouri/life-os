# Harvest batches (version 2): what came in, and where it goes

**Written 3 November 2026 for stage 5** (`documents/briefs/stage-5-harvest.md`). For the agent that turns harvested raw files into batches for Life OS (the scheduled task "Integrate", Codex, Claude Code). Everything in `mail/GATHER.md` still holds (the window, never changing a mailbox, no codes or sign-in links, `.part` then rename, the checker). This page adds what version 2 brings.

## The idea

One batch is one way in. Life OS keeps it in its own mail store, in one step it can undo. In a batch:

- **messages**: what arrived (as in version 1), now with their real **links**;
- **actions**: what she must do by a day (reply, pay, apply, submit, decide), as in version 1. These are on Waiting on you, the Calendar and Today;
- **items**: everything else that came in: a vacancy, an event, an announcement, a material, an offer, a dated note. Each item shows in its place, by the rule in `code/life-os/shared/harvest.js`.

Life OS never writes JobMap, Cardiff Life or Budget. Vacancies and events reach those through their own tools (below); Life OS finds them there by their link.

## A version 2 batch

`"version": 2`. The `digest` is optional and is not shown anywhere: the Harvest log is built from the items. Look at `mail/example-batch-v2.json` (made up) for the shape; `mail/mail-batch.schema.json` is the full format.

**Messages**
- `text`: the cleaned text: no quoted replies, signatures, disclaimers or footers; at most 20,000 characters (`textComplete: false` if cut). Automated mail and newsletters may keep their text when an item cites them (a job alert's vacancies); otherwise leave it out, as before.
- `links[]` (up to 50): `{ "href", "text" }` for the real destinations in the message: the advert, the event page, the course page, the form. Never a tracking redirect, an Outlook safe-link or Google redirect wrapper (keep the address inside it), a sign-in page, an unsubscribe or preferences page. The checker refuses those.
- `link`: for **Outlook**, the address of the opened message as the browser shows it (`https://outlook.office.com/mail/inbox/id/AAQk…`); Life OS shows "Open in Outlook" only for such an address. For **Gmail**, the provider's message id in `sourceId` is enough: Life OS builds the link for the account she is signed in as.
- `summary`: what the message says, as a record. Not "you should…", "I recommend…", "worth a look". The checker refuses a summary that talks to her.

**Items** (up to 2,000)
- `ref` (`i1`, `i2`, …), `key`: the same on every run for the same thing: `<source id>:<the message's sourceId, or the page's own id>:<short slug>`. Sending an item again updates it.
- `area`: `admin`, `academic`, `jobs`, `research`, `events`, `money`, `perks`, `health`, `home`.
- `kind`: `vacancy` (jobs or research), `opportunity` (a scholarship, competition, hackathon, programme with an application), `event`, `announcement`, `material` (academic), `offer` (perks, money, home or health), `info` (a dated or useful fact that is none of these).
- `title` (at most 200 characters) and `summary` (at most 300): neutral and factual, in the app's voice. "Graduate Data Analyst, Example Health Board" and "Cardiff, GBP 28,000, closes 7 November", never advice.
- `day`: the London day it came in: the day its first message arrived, or for a web find the day it was checked (`foundAt.checkedAt`). The Harvest log is one page per day, so this must be right.
- When: `start` and `end` (a day `2026-11-05`, or a time `2026-11-05T14:00:00Z` in UTC), `allDay`, `deadline` (the day it closes, ends or is due).
- Where and who: `location`, `url` (its own page; required for a vacancy and an event), `course`, `organiser`, `employer`, `salary`, `cost`, `tags[]`.
- From: `messageRefs[]` (the batch's messages it came from), or `foundAt: { url, checkedAt }` for a web find. One of the two is required. `actionRefs[]` when it led to an action ("Pay the library fine" from a fine notice).

**Things to do are actions, not items.** A bill is an action "Pay …" with `due`; an application she should make is an action "Apply for …" with `due`, and the opportunity itself is an item pointing at it. A deadline that is not hers to act on is an item.

## Where each item shows (the rule in `shared/harvest.js`)

| Item | Shows in |
|---|---|
| announcement, material, info, opportunity with a day (`start` or `deadline`) | the Calendar ("Came in", in the item's area) and the Harvest log |
| event | the Harvest log, linked to the Cardiff Life event with the same link. On the Calendar only through Cardiff Life, once she marks it Plan to go |
| vacancy | the Harvest log, linked to the JobMap job with the same link; Today when it closes within 7 days |
| opportunity | also Today when it closes within 7 days |
| offer | the Offers list on the Budget page; Today in its last 2 days |
| undated announcement or info | the Harvest log and Mail |

## Reaching JobMap and Cardiff Life

- **Vacancies:** after the batch, queue the same vacancies for JobMap through its own route: write a discovery batch as `jobmap/SCHEDULED_SEARCH.md` describes, then `node jobmap/queue-jobs.mjs <file> --dry-run`, check it, and queue it. Use the advert's own `url` (the same one as the item's), so Life OS can find the job. A vacancy the scouts already queued needs only its item.
- **Events:** hand each event to the Cardiff events workflow (its saved handoffs in `C:\Users\ctrlz\Documents\Scheduled Workflows`), which verifies it and adds it to `cardiff-life/events.csv` by Cardiff Life's own rules. The item keeps the organiser's event page as its `url`.
- Never write `jobmap/data`, `cardiff-life/*.csv`, Budget's `state.json`, or Life OS's database yourself.

## Suggestions for the app

The app speaks as an instrument, not as a chat. When her mail shows something Life OS could do better (a kind of message that keeps arriving with nowhere to go, a part that is missing, a filter she would need), write it as a dated line in `mail/suggestions.md` (private) and in the run's report to her, never in a batch.

## Check before finishing

`node mail/check-batch.mjs mail/inbox/<runId>.json.part` must print `OK (version 2)`. Then rename it to `.json`. Life OS takes it in within a minute and writes a line to `mail/import-log.md`.
