# Gathering Xar's inboxes into Life OS

**Written 28 October 2026.** For any agent asked to "gather my inboxes": the Claude scheduled task "Gather my inboxes", Codex, or her own AI. It runs only when Xar starts it, never on a timer. A run **reads** her mailboxes, **never changes them**, and leaves one batch for Life OS plus a digest she can read straight away. This file is the authority; a task prompt is only a summary of it.

## What a run leaves behind

1. `mail/inbox/<runId>.json`: one batch in the format `mail/mail-batch.schema.json` (version 1). Write it as `<runId>.json.part`, check it, then rename it to `.json`, so Life OS never picks up half a file. Until Life OS's Mail part exists, batches simply wait here.
2. `mail/digests/<runId>.md`: the digest as a page (headline, what needs her, deadlines, each source in a few lines, what could not be read).
3. One line appended to `mail/gather-log.md`: `<runId> | <when> | <each source and its status> | <messages> messages, <actions> actions`.
4. `mail/gather-state.json` updated (see "The window").
5. The run's last message: the digest in under 15 lines. British English, no em dashes, plain words.

`runId` is `YYYY-MM-DD-HHMM-` plus 6 random lowercase letters or digits, in Europe/London time (for example `2026-10-28-0915-k3x9qa`). Create `mail/digests/` if it does not exist.

## Read first

1. `mail/sources.json`: her sources, in order, and how to reach each. If it is missing, use `mail/sources.example.json` and say so.
2. `mail/gather-state.json`, if it exists: how far each source has been read completely.
3. `mail/mail-batch.schema.json` and `mail/example-batch.json` (made-up data showing the shape).
4. The last three batches (newest files in `mail/inbox/` and `mail/inbox/processed/`): their open actions are re-checked this run.

## The window

- Per source: from that source's `completeTo` in `gather-state.json`, minus one day of overlap, to now. With no state for a source: the last `firstRunDays` days (14).
- Never more than `maxDays` (30) in one run. If more is due, read the newest 30 days and name the rest under the digest's `gaps`.
- If Xar's request names a window ("since Monday", "this month"), use hers.
- Also re-check the threads behind every open action in the last three batches, however old: if she has since replied or done it, send the action again with `resolvedAtSource: true` and a `resolvedNote` ("You replied on 27 October").
- `gather-state.json` looks like `{ "sources": { "<id>": { "completeTo": "<ISO time>", "lastRunId": "<runId>", "status": "read" } } }`. Move `completeTo` forward only for a source read completely for its window. A partial or failed source keeps its old `completeTo`.

## Reaching each source

In order of preference, per source: a **connector** (reads without marking anything read), then a **browser where she is already signed in** (the built-in browser first, then Claude in Chrome), then skip it.

- **Gmail**: the Gmail connector; otherwise mail.google.com.
- **Cardiff Outlook** (university Microsoft 365): the Microsoft 365 connector (`outlook_email_search`, `read_resource`) if connected; otherwise outlook.office.com. Read Focused and Other.
- **Learning Central** (Blackboard): the browser only. The activity stream, the Announcements of each current course, and Messages. If her announcements also arrive by email, count each once: keep the Learning Central one and leave the email copy out.
- **Teams chats**: the Microsoft 365 connector (`chat_message_search`) if connected; otherwise teams.microsoft.com if signed in; otherwise mark it unavailable without fuss. It is optional.
- Any further source listed in `sources.json`, the same way.

A sign-in page, a code or approval prompt, "admin approval required", or a page that will not load: try once, record the source as `unavailable` (or `partial` if some of it was read) with the reason in `coverage`, and move on. Never type a password or code, never approve a sign-in, never retry in a loop, never try to get round a wall.

## Never

- Send, reply, forward, draft, delete, archive, move, flag, label, pin, snooze, mute, unsubscribe, accept or decline anything, or change any setting, in any mailbox, in Learning Central or in Teams.
- Open links inside messages (other than to open the message itself), download attachments or open them. Note attachment names and sizes only.
- **Read state.** Connectors do not change it. In a browser, opening an unread message can mark it read: note which messages were unread before you opened them, and mark exactly those unread again before you leave the page. That is the only change a run may make anywhere. Where the list or preview shows enough, do not open the message.
- Write to Life OS's database, its data files, JobMap, Cardiff Life or Budget. The only files a run writes are the five above.
- Copy into a batch or digest: one-time codes, sign-in or password-reset links, passwords, bank or card numbers, or the content of security alerts. Keep only a line such as "A sign-in code from Microsoft", category `automated`, with no `text`. The checker refuses a batch that looks like it holds a code.
- Decide for her. Priorities and actions are suggestions; she changes them in Life OS and her changes always win.

## What goes in a batch

**Sources.** Every source in `sources.json`, read or not, with `route`, `status`, the `window` actually read (not needed when unavailable) and `coverage` in plain words ("Inbox, Focused and Other, and Sent, 14 to 28 October: 46 messages").

**Messages.** One record per message received in the window (not one per thread). Skip messages she sent; use Sent only to see what she has answered.
- `sourceId`: the provider's message id when one is available (connectors give it). Otherwise `h:` plus the first 16 hex characters of the SHA-256 of `<source id>|<receivedAt to the minute>|<sender address>|<subject>`, for example with `node -e "console.log('h:'+require('crypto').createHash('sha256').update(process.argv[1]).digest('hex').slice(0,16))" "<the string>"`. The same message must get the same `sourceId` on every run.
- `threadId` when the source shows one; `link`: an `https://` link that opens the message at its source, or else the mailbox's address.
- `text`: the message as plain text, without quoted earlier replies, signatures and disclaimers, at most 20,000 characters (`textComplete: false` if it was cut). Leave `text` out for `newsletter`, `automated` and `noise`: the summary is enough.
- `summary`: one or two sentences saying what it is and what, if anything, it asks of her. Write it in the message's language if that is Persian.
- `unreadAtSource`, `repliedAtSource` as the source shows them.
- `category`:
  - `needs-you`: someone asks her for something (an answer, a document, a decision, to come) and she has not done it yet.
  - `deadline`: carries a date by which she must act (a form, payment, registration, submission, application).
  - `announcement`: from a course, school, the university or a service, to many people, worth knowing.
  - `conversation`: personal or work mail that needs nothing from her now.
  - `fyi`, `newsletter`, `automated` (receipts, notifications, codes), `noise` (marketing).
- `priority` with a one-line `priorityReason`:
  - `urgent`: needs her within 48 hours (a deadline, a meeting, someone waiting against a date), or real consequences if missed (university, money, housing, work).
  - `high`: needs her this week; or a person has waited three days or more for a reply. A change to a class (room, time, cancelled) is at least `high`.
  - `normal`: needs her at some point, or is worth reading.
  - `low`: nothing to do; fine never to open.
- `deadline`: the day she must act by, if the message gives one.

**Actions** (what she owes). One per thing to do, not one per message; several messages can point to one action through `messageRefs`.
- `kind`: `reply` (someone is waiting for an answer), `email` (she needs to write first, such as "send me the form" or something she said she would send), `text` or `call` (a message asks her to text or ring someone), `read` (an announcement or brief she is asked to read), `do` (submit, pay, book, register, sign up), `decide` (accept or decline).
- `title` starts with a verb and names the person or thing ("Reply to Jo about the report", "Read the coursework brief"). `why` in one line. `person` when there is one. `since`: when it started. `due` if known.
- `dedupeKey` must be the same on every run for the same thing: `<kind>:<source id>:<threadId, or the message's sourceId>`. A later run then updates the action instead of adding a second one.
- Not actions: job alerts and vacancies (JobMap's searches deal with those), event listings (Cardiff Life's), marketing, and anything already done.
- Birthdays and "text someone" reminders she adds herself come from Life OS, not from mail.

**Digest.** `headline`: one sentence on the state of things. `needsYou`: up to seven lines, most pressing first. `bySource`: one to three sentences per source read. `deadlines`: every dated thing found, with the `ref` of its message or action. `gaps`: every source or part not read, and why. Never describe an unread source as quiet.

An empty run is fine: no messages, no actions, a headline such as "Nothing new since Monday."

**Size.** At most 10 MB. If a run finds more than 500 messages, keep `text` only for `needs-you`, `deadline` and `announcement`.

## Check before finishing

1. `node mail/check-batch.mjs mail/inbox/<runId>.json.part` must print `OK`. Fix and re-check until it does; never hand over a batch that fails.
2. Rename it to `mail/inbox/<runId>.json`.
3. Write the digest page, append the log line, update `gather-state.json`.
4. Report: the headline; what needs her (top five); deadlines; what could not be read and why; where the files are.
