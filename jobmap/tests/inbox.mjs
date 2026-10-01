import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, mkdir, readdir, utimes} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../lib/store.mjs';
import {Inbox} from '../lib/inbox.mjs';

const base = JSON.parse(await readFile(new URL('../data/jobs.json', import.meta.url), 'utf8'));
const workspace = await mkdtemp(fileURLToPath(new URL('../data/test-inbox-', import.meta.url)));
const inboxDirectory = path.join(workspace, 'inbox');
await mkdir(inboxDirectory, {recursive: true});

const store = await new Store(base, workspace).init();
const inbox = await new Inbox(store, inboxDirectory, path.join(workspace, 'import-log.md')).init();

// A batch file only counts once it has finished being copied onto the disk.
async function drop(name, contents, {settled = true} = {}) {
 const file = path.join(inboxDirectory, name);
 await writeFile(file, typeof contents === 'string' ? contents : JSON.stringify(contents), 'utf8');
 if (settled) {
  const old = new Date(Date.now() - 60000);
  await utimes(file, old, old);
 }
 return file;
}

const job = {
 role: 'Junior Data Engineer',
 company: 'Scheduled Search Test Ltd',
 url: 'https://example.org/scheduled-search-test-1',
 location: 'Cardiff',
 hours: '16 hours per week',
 employment: 'Part-time',
 salary: '£26,000 pro rata',
 description: 'Build Python and SQL data pipelines. Part-time, 16 hours per week, paid.',
 checked: '2026-09-14',
 source: 'Scheduled search',
 sourceDetail: 'Inbox test',
 availability: 'open'
};

const before = store.jobs().length;

// 1. A well-formed batch is imported and filed away.
await drop('001-batch.json', {runId: 'test-run-1', jobs: [job]});
let scan = await inbox.scan();
assert.equal(scan.results.length, 1);
assert.equal(scan.results[0].ok, true);
assert.equal(scan.results[0].added, 1);
assert.equal(store.jobs().length, before + 1);
const created = store.jobs().find(j => j.url === job.url);
assert.equal(created.status, 'To review');
assert.equal(created.coverage, 'Scheduled search');
assert.equal((await readdir(inbox.processed)).length, 1);

// 2. Running the same runId again changes nothing.
await drop('002-batch.json', {runId: 'test-run-1', jobs: [job]});
scan = await inbox.scan();
assert.equal(scan.results[0].repeated, true);
assert.equal(store.jobs().length, before + 1);

// 3. Fresh evidence for a link already held updates it instead of duplicating it.
await drop('003-batch.json', {runId: 'test-run-2', jobs: [{...job, salary: '£28,000 pro rata', checked: '2026-09-15'}]});
scan = await inbox.scan();
assert.equal(scan.results[0].updated, 1);
assert.equal(store.jobs().length, before + 1);
assert.equal(store.jobs().find(j => j.url === job.url).salary, '£28,000 pro rata');

// 4. A personal edit survives a later scheduled check of the same advert.
await store.patch(created.id, {status: 'Applied', notes: 'Mine, not the search runner\'s.'}, store.state.revision);
await drop('004-batch.json', {runId: 'test-run-3', jobs: [{...job, salary: '£29,000 pro rata', checked: '2026-09-16'}]});
await inbox.scan();
const kept = store.jobs().find(j => j.url === job.url);
assert.equal(kept.status, 'Applied');
assert.equal(kept.notes, 'Mine, not the search runner\'s.');
assert.equal(kept.salary, '£29,000 pro rata');

// 5. Bad input is quarantined with a reason, and the workspace is untouched.
const revisionBefore = store.state.revision;
await drop('005-broken.json', '{not json');
await drop('006-missing-fields.json', {runId: 'test-run-4', jobs: [{role: 'No company', url: 'https://example.org/x', checked: '2026-09-14', source: 'Scheduled search', description: 'x'}]});
scan = await inbox.scan();
assert.equal(scan.results.length, 2);
assert(scan.results.every(r => r.ok === false));
assert.equal(store.state.revision, revisionBefore);
const failed = await readdir(inbox.failed);
assert.equal(failed.filter(n => n.endsWith('.error.txt')).length, 2);

// 6. A file still being written is left alone until it settles.
await drop('007-still-copying.json', {runId: 'test-run-5', jobs: [job]}, {settled: false});
scan = await inbox.scan();
assert.equal(scan.results.length, 0);
assert.equal((await inbox.status()).waiting.length, 1);

// 7. A closed vacancy that is not already held is reported, not added.
await drop('008-closed.json', {runId: 'test-run-6', jobs: [{...job, url: 'https://example.org/closed-role', role: 'Gone', availability: 'closed'}]});
await utimes(path.join(inboxDirectory, '007-still-copying.json'), new Date(Date.now() - 60000), new Date(Date.now() - 60000));
scan = await inbox.scan();
const closed = scan.results.find(r => r.name === '008-closed.json');
assert.equal(closed.ok, true);
assert.equal(closed.added, 0);
assert.equal(closed.skipped.length, 1);

// 8. Everything is written down where she can read it.
const log = await readFile(path.join(workspace, 'import-log.md'), 'utf8');
assert(log.includes('001-batch.json') && log.includes('NOT imported'));

// 9. A restart sees the imported jobs.
const reopened = await new Store(base, workspace).init();
assert(reopened.jobs().some(j => j.url === job.url));

console.log(JSON.stringify({result: 'PASS', checks: ['import', 'runId dedup', 'link update', 'personal edits preserved', 'bad batch quarantined', 'unsettled file skipped', 'closed vacancy not added', 'written log', 'restart persistence'], testDirectory: workspace}));
