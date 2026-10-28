// Run: bundle with esbuild, then node --test (see the mail session notes for the command).
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { MessageText, ActionLine } from '../src/components/inbox/parts.jsx'
import { MessageReader } from '../src/components/inbox/InboxMail.jsx'

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
