import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createStudyBackups } from './backups.mjs'

async function fixture(t, { fail = false } = {}) {
  const backupRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'life-os-backups-test-'))
  t.after(() => fs.rm(backupRoot, { recursive: true, force: true }))
  let now = Date.parse('2026-10-06T09:00:00Z')
  const dumps = []
  const dump = async label => {
    if (fail) throw new Error('pg_dump failed at C:/private/path')
    const directory = path.join(backupRoot, `study-${new Date(now).toISOString().slice(0, 10)}`)
    await fs.mkdir(directory, { recursive: true })
    const destination = path.join(directory, `${label}-${now}.dump`)
    await fs.writeFile(destination, 'synthetic dump')
    dumps.push(destination)
    return destination
  }
  return { backupRoot, dumps, dump, backups: createStudyBackups({ backupRoot, dump, clock: () => now }), advance: milliseconds => { now += milliseconds } }
}

test('one daily backup is made, then none until a day has passed, and nothing is ever removed', async t => {
  const f = await fixture(t)
  assert.equal((await f.backups.status()).count, 0)
  assert.equal((await f.backups.ensureDaily()).created, true)
  assert.equal((await f.backups.ensureDaily()).created, false)
  f.advance(23 * 3600_000)
  assert.equal((await f.backups.ensureDaily()).created, false)
  f.advance(2 * 3600_000)
  assert.equal((await f.backups.ensureDaily()).created, true)
  const status = await f.backups.status()
  assert.equal(status.count, 2)
  assert.equal(status.last_daily.created_at, '2026-10-07T10:00:00.000Z')
  assert.equal(status.bytes, 2 * 'synthetic dump'.length)
  for (const file of f.dumps) assert.equal(await fs.readFile(file, 'utf8'), 'synthetic dump')
})

test('an import backup does not stand in for the daily one, but counts as recent', async t => {
  const f = await fixture(t)
  await f.dump('before-import')
  assert.equal(await f.backups.recent(3600_000), true)
  f.advance(2 * 3600_000)
  assert.equal(await f.backups.recent(3600_000), false)
  assert.equal((await f.backups.ensureDaily()).created, true)
  assert.deepEqual((await f.backups.list()).map(row => row.label), ['daily', 'before-import'])
})

test('a failed backup is reported in plain words without paths and is retried', async t => {
  const f = await fixture(t, { fail: true })
  const result = await f.backups.ensureDaily()
  assert.equal(result.created, false)
  const status = await f.backups.status()
  assert.match(status.error, /could not be made/)
  assert.equal(JSON.stringify(status).includes('private'), false)
  assert.equal((await f.backups.ensureDaily()).created, false)
})

test('unrelated files and empty dumps are ignored', async t => {
  const f = await fixture(t)
  const directory = path.join(f.backupRoot, 'study-2026-10-05')
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'daily-1791000000000.dump'), '')
  await fs.writeFile(path.join(directory, 'notes.txt'), 'not a dump')
  await fs.mkdir(path.join(f.backupRoot, 'budget-2026-10-05'))
  assert.equal((await f.backups.status()).count, 0)
})
