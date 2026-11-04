// Run: bundle with esbuild, then node --test (see the mail session notes for the command).
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MessageText, ActionLine } from '../src/components/inbox/parts.jsx'
import { MessageReader } from '../src/components/inbox/InboxMail.jsx'
import { MemoryRouter } from 'react-router-dom'
import { CameInItem, whenOf } from '../src/components/inbox/CameInStrip.jsx'

const message = {
  id: 'm1', revision: 1, subject: 'Saturday?', from_name: 'Sam Taylor', from_address: 'sam.taylor@example.com', to_list: [{ name: 'You', address: 'you@example.com' }],
  received_at: '2026-10-27T19:05:00Z', source_label: 'Gmail', source_kind: 'gmail', summary: 'Sam asks about Saturday.', priority: 'high', priority_reason: 'This weekend.',
  body: 'Hi <b>there</b>\n<script>alert("x")</script>\n<img src=x onerror=alert(1)>\nSee https://example.com/plan and javascript:alert(1)\nسلام، شنبه می‌آیی؟',
  source_message_id: '18c2f0a1b2c3d4e5', link: 'https://mail.google.com/mail/u/0/#inbox/abc', attachments: [{ name: 'Plan.pdf' }],
}

test('a message body is drawn as text: HTML and scripts never become elements', () => {
  const markup = renderToStaticMarkup(<MessageText text={message.body} />)
  assert.ok(!/<script/i.test(markup) && !/<img/i.test(markup) && !/<b>/.test(markup))
  assert.match(markup, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
  assert.match(markup, /<a href="https:\/\/example.com\/plan" target="_blank" rel="noopener noreferrer">/)
  assert.ok(!/href="javascript:/.test(markup))
  assert.match(markup, /dir="auto"/)
})

test('the reader shows who, when, the summary, the text, and the way to the original', () => {
  const markup = renderToStaticMarkup(<MemoryRouter><MessageReader message={message} onBack={() => {}} /></MemoryRouter>)
  for (const words of ['Saturday?', 'Sam Taylor', 'Sam asks about Saturday.', 'This weekend.', 'Open in Gmail', 'I need to reply', 'Hide', 'Plan.pdf', 'Back to the list', 'سلام', 'Everything from sam.taylor@example.com:', 'Fold']) assert.ok(markup.includes(words), words)
  // The app names no assistant and hands out no prompts to copy.
  assert.ok(!/Claude|claude\.ai|prompt/i.test(markup))
  // Gmail opens in her own account (setting mail-gmail-account, 1 until she changes it), from the message's id.
  assert.ok(markup.includes('href="https://mail.google.com/mail/u/1/#all/18c2f0a1b2c3d4e5"'))
  assert.ok(!/<script/i.test(markup))
  const empty = renderToStaticMarkup(<MemoryRouter><MessageReader message={{ ...message, body: null }} /></MemoryRouter>)
  assert.match(empty, /Only a summary was harvested/)
})

test('the reader: what was taken from it, its real links, and no broken Outlook link', () => {
  const outlook = { ...message, source_kind: 'outlook', source_label: 'University Outlook', source_message_id: 'x:3f9a1c0d2b7e4a51', link: 'https://outlook.office.com/mail/', rule: { id: 'r1', rule: 'fold', revision: 1 },
    links: [{ href: 'https://jobs.example.com/view/1001', text: 'Graduate Data Analyst' }, { href: 'https://example.com/unsubscribe?u=1', text: 'Unsubscribe' }],
    taken: { actions: [{ id: 'a1', title: 'Pay the library fine', due: '2026-11-15' }], items: [{ id: 'i3', revision: 1, kind: 'vacancy', area: 'jobs', status: 'new', day: '2026-10-31', title: 'Graduate Data Analyst', summary: 'Cardiff.', deadline: '2026-11-07', place: { app: 'jobmap', href: '/jobmap#job=J1' } }] } }
  const markup = renderToStaticMarkup(<MemoryRouter><MessageReader message={outlook} /></MemoryRouter>)
  for (const words of ['Taken from this', 'Pay the library fine', 'Waiting on you', 'Graduate Data Analyst', 'In JobMap', 'Links', 'jobs.example.com', 'Folded: sam.taylor@example.com', 'Show as usual']) assert.ok(markup.includes(words), words)
  assert.ok(!markup.includes('Open in Outlook'))
  assert.ok(!markup.includes('Unsubscribe'))
})

test('foldDay: newsletters, notifications and folded senders become one line per sender; a lone one stays itself', async () => {
  const { foldDay } = await import('../src/components/inbox/InboxMail.jsx')
  const rows = [
    { id: '1', category: 'needs-you', from_address: 'jo@example.ac.uk' },
    { id: '2', category: 'newsletter', from_address: 'news@shop.example.com' },
    { id: '3', category: 'automated', from_address: 'alerts@jobs.example.com' },
    { id: '4', category: 'newsletter', from_address: 'NEWS@shop.example.com' },
    { id: '5', category: 'conversation', from_address: 'sam@example.com', rule: 'fold' },
    { id: '6', category: 'conversation', from_address: 'sam@example.com', rule: 'fold' },
  ]
  const folded = foldDay(rows)
  assert.deepEqual(folded.map((entry) => entry.row ? entry.row.id : entry.group.rows.map((row) => row.id).join('+')), ['1', '2+4', '3', '5+6'])
})

test('a thing she owes shows its kind and priority in words, and its buttons', () => {
  const row = { id: 'a1', revision: 2, kind: 'reply', title: 'Reply to Jo', her_title: 'Reply to Jo with my section', person_name: 'Jo Evans', why: 'Due Thursday', priority: 'urgent', due: '2026-10-29', status: 'open', link: 'https://outlook.office.com/mail/inbox', message_ids: ['m1'] }
  const markup = renderToStaticMarkup(<ul><ActionLine row={row} today="2026-10-28" /></ul>)
  for (const words of ['Reply', 'Urgent', 'Reply to Jo with my section', 'Jo Evans', 'Due Thursday', 'Done', 'Tomorrow', 'Next week', 'Not needed', 'Open the email']) assert.ok(markup.includes(words), words)
  assert.ok(!/Claude|claude\.ai/.test(markup))
  const compact = renderToStaticMarkup(<ul><ActionLine row={{ ...row, status: 'done', done_by: 'source', resolved_note: 'You replied on 27 October.' }} today="2026-10-28" compact /></ul>)
  assert.match(compact, /Open again/)
  assert.match(compact, /You replied on 27 October\./)
  assert.ok(!compact.includes('Not needed'))
})

test('what came in: its kind, its own page, the one date that matters, where it is, Keep and Dismiss', () => {
  const vacancy = { id: 'i3', revision: 1, kind: 'vacancy', area: 'jobs', status: 'new', day: '2026-10-31', title: 'Graduate Data Analyst', summary: 'Cardiff, GBP 28,000.', deadline: '2026-11-07', url: 'https://jobs.example.com/view/1001', place: { app: 'jobmap', missing: true } }
  const markup = renderToStaticMarkup(<MemoryRouter><ul><CameInItem item={vacancy} /></ul></MemoryRouter>)
  for (const words of ['Vacancy', 'Graduate Data Analyst', 'Cardiff, GBP 28,000.', 'Closes Sat 7 Nov', 'Not in JobMap yet', 'Where it came from', 'Keep', 'Dismiss']) assert.ok(markup.includes(words), words)
  assert.ok(markup.includes('href="https://jobs.example.com/view/1001" target="_blank" rel="noopener noreferrer"'))
  assert.ok(markup.includes('href="/inbox/log?day=2026-10-31&amp;item=i3"'))
  const placed = renderToStaticMarkup(<MemoryRouter><ul><CameInItem item={{ ...vacancy, status: 'kept', place: { app: 'jobmap', href: '/jobmap#job=JOB-7' } }} /></ul></MemoryRouter>)
  assert.ok(placed.includes('href="/jobmap#job=JOB-7"') && placed.includes('>In JobMap</a>'))
  assert.ok(placed.includes('Kept') && !placed.includes('>Keep<'))
  assert.equal(whenOf({ kind: 'offer', deadline: '2026-11-04', day: '2026-10-31' }), 'Ends Wed 4 Nov')
  assert.equal(whenOf({ kind: 'announcement', start_at: '2026-11-05T14:00:00Z', day: '2026-10-30' }), 'Thu 5 Nov, 14:00')
  assert.equal(whenOf({ kind: 'info', day: '2026-10-30' }), 'Came in 30 Oct')
})

test('one day of the Harvest log: a factual line, what came in by area, to do, messages folded, the runs', async () => {
  const { LogDay, SourcesPanel } = await import('../src/components/inbox/InboxLog.jsx')
  const detail = {
    day: '2026-10-31', latestBatchId: 'b1',
    items: [
      { id: 'i3', revision: 1, kind: 'vacancy', area: 'jobs', status: 'new', day: '2026-10-31', title: 'Graduate Data Analyst', summary: 'Cardiff.', deadline: '2026-11-07', place: { app: 'jobmap', missing: true } },
      { id: 'i6', revision: 1, kind: 'offer', area: 'perks', status: 'kept', day: '2026-10-31', title: '20% off books', summary: 'Student card.', deadline: '2026-11-04' },
    ],
    actions: [{ id: 'a1', title: 'Pay the library fine', due: '2026-11-15', status: 'open' }],
    messages: [
      { id: 'm1', subject: 'Lab moved', from_name: 'Dr A. Example', category: 'announcement', summary: 'Room 0.12.', source_label: 'Learning platform' },
      { id: 'm2', subject: 'Weekly digest', category: 'newsletter', summary: 'News.' },
      { id: 'm3', subject: 'Receipt', category: 'automated', summary: 'Paid.' },
    ],
    runs: [{ id: 'b1', gathered_at: '2026-11-02T07:00:00Z', agent: 'Integrate', status: 'applied', counts: { items: { new: 9, updated: 0, unchanged: 0 } }, sources: [{ label: 'Gmail', status: 'read' }] }],
  }
  const entry = { day: '2026-10-31', messages: 3, actions: 1, kinds: { vacancy: 1, offer: 1 } }
  const markup = renderToStaticMarkup(<MemoryRouter><LogDay detail={detail} entry={entry} area="" setArea={() => {}} focus="i3" /></MemoryRouter>)
  for (const words of ['Saturday 31 October', '3 messages, 1 to do, 1 vacancy, 1 offer', 'Jobs', 'Perks', 'Graduate Data Analyst', 'Not in JobMap yet', 'To do', 'Pay the library fine', 'Lab moved', '2 more: newsletters, notifications and the rest', 'Brought by', 'Harvest of Mon 2 Nov, 07:00', 'Gmail read', 'items 9 new, 0 changed', 'Undo']) assert.ok(markup.includes(words), words)
  assert.ok(markup.includes('is-focused'))
  assert.ok(!markup.includes('Weekly digest'))
  assert.ok(!markup.includes('Integrate'), 'the run shows no automation or assistant name')
  assert.ok(!/you should|I recommend/i.test(markup))
  const onlyJobs = renderToStaticMarkup(<MemoryRouter><LogDay detail={detail} entry={entry} area="jobs" setArea={() => {}} /></MemoryRouter>)
  assert.ok(onlyJobs.includes('Graduate Data Analyst') && !onlyJobs.includes('20% off books') && !onlyJobs.includes('Pay the library fine'))
  const sources = renderToStaticMarkup(<SourcesPanel sources={[{ id: 's', label: 'Gmail', status: 'partial', window_to: '2026-11-03T07:00:00Z', messages: 797, coverage: 'Primary and Updates.' }]} lastGathered="2026-11-03T07:05:00Z" />)
  for (const words of ['Sources', 'Gmail', 'Partly read', 'to Tue 3 Nov, 07:00', '797 messages', 'Primary and Updates.', 'Last harvest Tue 3 Nov, 07:05']) assert.ok(sources.includes(words), words)
})

test('Today: what came in, as lines that lead to where each thing is; nothing when nothing came in', async () => {
  const { CameInLines } = await import('../src/components/inbox/InboxPanel.jsx')
  const cameIn = { today: 2, more: 3, lines: [
    { id: 'i6', kind: 'offer', day: '2026-10-31', title: '20% off books', deadline: '2026-11-04' },
    { id: 'i3', kind: 'vacancy', day: '2026-10-31', title: 'Graduate Data Analyst', deadline: '2026-11-07', place: { app: 'jobmap', href: '/jobmap#job=J1' } },
  ] }
  const markup = renderToStaticMarkup(<MemoryRouter><CameInLines cameIn={cameIn} /></MemoryRouter>)
  for (const words of ['Came in', '2 today', 'Offer', '20% off books', 'Ends Wed 4 Nov', 'Vacancy', 'Closes Sat 7 Nov', '3 more']) assert.ok(markup.includes(words), words)
  assert.ok(markup.includes('href="/jobmap#job=J1"'))
  assert.ok(markup.includes('href="/inbox/log?day=2026-10-31&amp;item=i6"'))
  assert.equal(renderToStaticMarkup(<MemoryRouter><CameInLines cameIn={{ today: 0, lines: [], more: 0 }} /></MemoryRouter>), '')
})

test('the Desk: a card says its kind, the date that matters, its facts, its state, where it is, and the JobMap change', async () => {
  const { ThingCard, Triage, kindLabel, factsOf } = await import('../src/components/inbox/InboxDesk.jsx')
  const order = { id: 't1', revision: 1, kind: 'order', area: 'home', domain: 'home', status: 'new', state: 'dispatched', day: '2026-11-02', title: 'Example Books order EB-20431', start_day: '2026-11-04', deadline: '2026-12-01', amount_pence: 2399, currency: 'GBP', external_ref: 'EB-20431', details: { organiser: 'Example Books' }, soon: true }
  const markup = renderToStaticMarkup(<MemoryRouter><ThingCard thing={order} /></MemoryRouter>)
  for (const words of ['Order', 'Arrives Wed 4 Nov', 'Example Books order EB-20431', 'Example Books', '£23.99', 'Ref EB-20431', 'Dispatched', 'Keep', 'Dismiss']) assert.ok(markup.includes(words), words)
  assert.ok(markup.includes('--c:var(--d-home)'))
  assert.ok(markup.includes('is-soon'))
  const delivered = renderToStaticMarkup(<MemoryRouter><ThingCard thing={{ ...order, state: 'delivered', soon: false }} /></MemoryRouter>)
  assert.ok(delivered.includes('Returns until Tue 1 Dec') && delivered.includes('Delivered'))
  const application = { id: 't2', revision: 1, kind: 'application', area: 'jobs', domain: 'work', status: 'kept', state: 'unsuccessful', day: '2026-11-09', title: 'Insight Analyst, Example Retail', details: { employer: 'Example Retail' },
    place: { app: 'jobmap', href: '/jobmap#job=EX-2', id: 'EX-2', status: 'Applied' }, suggestion: { job: 'EX-2', status: 'Rejected', from: 'Applied' } }
  const app = renderToStaticMarkup(<MemoryRouter><ThingCard thing={application} /></MemoryRouter>)
  for (const words of ['Application', 'Unsuccessful', 'In JobMap', 'JobMap says Applied.', 'Move to Rejected', 'Kept']) assert.ok(app.includes(words), words)
  assert.ok(!app.includes('>Keep<'), 'a kept thing offers Dismiss only')
  assert.equal(kindLabel({ kind: 'opportunity', form: 'scholarship' }), 'Scholarship')
  assert.deepEqual(factsOf({ details: { employer: 'A', organiser: 'A' }, location: 'Cardiff', amount_pence: 1200, currency: 'GBP' }), ['A', 'Cardiff', '£12.00'])
  const triage = renderToStaticMarkup(<MemoryRouter><Triage things={[order, { ...order, id: 't3', title: 'Second' }, application]} onClose={() => {}} /></MemoryRouter>)
  for (const words of ['0/2', 'Example Books order EB-20431', 'Dismiss', 'Later', 'Keep', 'Back to the Desk']) assert.ok(triage.includes(words), words)
  assert.ok(!triage.includes('Insight Analyst'), 'only new things are triaged')
})

test('the one date that matters, for the kinds that move', () => {
  assert.equal(whenOf({ kind: 'order', state: 'out-for-delivery', day: '2026-11-03' }), 'Arrives today')
  assert.equal(whenOf({ kind: 'bill', state: 'due', deadline: '2026-11-18', day: '2026-11-02' }), 'Due Wed 18 Nov')
  assert.equal(whenOf({ kind: 'subscription', state: 'renewing', deadline: '2026-11-12', day: '2026-11-02' }), 'Renews Thu 12 Nov')
  assert.equal(whenOf({ kind: 'booking', start_at: '2026-11-21T08:05:00Z', day: '2026-11-02' }), 'Sat 21 Nov, 08:05')
  assert.equal(whenOf({ kind: 'application', state: 'test', deadline: '2026-11-07', day: '2026-11-02' }), 'By Sat 7 Nov')
})
