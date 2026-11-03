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
  link: 'https://mail.google.com/mail/u/0/#inbox/abc', attachments: [{ name: 'Plan.pdf' }],
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
  const markup = renderToStaticMarkup(<MessageReader message={message} onBack={() => {}} />)
  for (const words of ['Saturday?', 'Sam Taylor', 'Sam asks about Saturday.', 'This weekend.', 'Open in Gmail', 'I need to reply', 'Write it with Claude', 'Hide', 'Plan.pdf', 'Back to the list', 'سلام']) assert.ok(markup.includes(words), words)
  assert.ok(!/<script/i.test(markup))
  const empty = renderToStaticMarkup(<MessageReader message={{ ...message, body: null }} />)
  assert.match(empty, /Only a summary was gathered/)
})

test('a thing she owes shows its kind and priority in words, and its buttons', () => {
  const row = { id: 'a1', revision: 2, kind: 'reply', title: 'Reply to Jo', her_title: 'Reply to Jo with my section', person_name: 'Jo Evans', why: 'Due Thursday', priority: 'urgent', due: '2026-10-29', status: 'open', link: 'https://outlook.office.com/mail/inbox', message_ids: ['m1'] }
  const markup = renderToStaticMarkup(<ul><ActionLine row={row} today="2026-10-28" /></ul>)
  for (const words of ['Reply', 'Urgent', 'Reply to Jo with my section', 'Jo Evans', 'Due Thursday', 'Done', 'Tomorrow', 'Next week', 'Not needed', 'Open the email', 'Write it with Claude']) assert.ok(markup.includes(words), words)
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
