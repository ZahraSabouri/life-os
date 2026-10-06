import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createStudyDiscovery } from './discovery.mjs'
import { validateImport } from '../../code/life-os/backend/src/modules/study/schema.js'

async function fixture(t) {
  const fixtureBase = fileURLToPath(new URL('../../.runtime/discovery-test-fixtures/', import.meta.url))
  await fs.mkdir(fixtureBase, { recursive: true })
  const root = await fs.mkdtemp(path.join(fixtureBase, 'life-os-discovery-'))
  const projectRoot = path.join(root, 'project'), directory = path.join(root, 'module-source')
  await fs.mkdir(projectRoot); await fs.mkdir(directory)
  const module = { id: randomUUID(), title: 'Fixture module', semester_id: randomUUID() }
  const materials = [], imports = []
  let now = Date.now() + 10000
  const repository = {
    workspace: async () => ({ modules: [module], materials }),
    importRecords: async input => {
      const batch = validateImport(input)
      imports.push(batch)
      let inserted = 0
      for (const item of batch.records) if (!materials.some(row => row.id === item.record.id)) {
        materials.push({ ...item.record, revision: 1, created_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(), deleted_at: null })
        inserted++
      }
      return { inserted }
    },
  }
  const discovery = createStudyDiscovery({ projectRoot, repository, clock: () => now })
  t.after(async () => {
    await discovery.close()
    const target = path.resolve(root), relative = path.relative(path.resolve(fixtureBase), target)
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative) && path.basename(target).startsWith('life-os-discovery-'), 'Cleanup must stay inside its synthetic fixture root')
    await fs.rm(target, { recursive: true, force: true })
  })
  const configure = (extra = { include_existing: true }) => discovery.configure({ module_id: module.id, directory, enabled: true, ...extra })
  const write = async (relative, content) => { const filename = path.join(directory, relative); await fs.mkdir(path.dirname(filename), { recursive: true }); await fs.writeFile(filename, content); return filename }
  return { root, projectRoot, directory, module, materials, imports, repository, discovery, configure, write, advance: milliseconds => { now += milliseconds }, now: () => now }
}

test('configured new files appear after two stable scans and repeat adds zero', async t => {
  const f = await fixture(t)
  const source = await f.write('Lectures/Week 1.pdf', 'synthetic PDF bytes')
  await f.configure()
  assert.equal((await f.discovery.scan()).pending, 1)
  assert.equal(f.materials.length, 0)
  const added = await f.discovery.scan({ module_id: f.module.id })
  assert.equal(added.added, 1)
  assert.equal(f.materials[0].module_id, f.module.id)
  assert.equal(f.materials[0].semester_id, f.module.semester_id)
  assert.equal(f.materials[0].data.source_path, 'Lectures/Week 1.pdf')
  assert.equal(JSON.stringify(f.materials[0]).includes(f.directory), false)
  const native = path.join(f.root, 'Life_OS_data/study/materials', ...decodeURIComponent(f.materials[0].data.url.slice('/study-files/'.length)).split('/'))
  assert.equal(await fs.readFile(native, 'utf8'), 'synthetic PDF bytes')
  assert.equal(await fs.readFile(source, 'utf8'), 'synthetic PDF bytes')
  assert.equal((await f.discovery.scan()).added, 0)
  assert.equal(f.imports.length, 1)
  assert.equal((await f.discovery.status()).mappings[0].status, 'watching')
})

test('a changed file becomes a new unreviewed version without touching old user data', async t => {
  const f = await fixture(t)
  await f.write('Labs/workbook.ipynb', 'first version')
  await f.configure(); await f.discovery.scan(); await f.discovery.scan()
  const previous = f.materials[0]
  previous.title = 'My workbook'; previous.status = 'archived'; previous.data.notes = [{ id: 'note', text: 'User note' }]; previous.data.reviewed = true; previous.data.tags = ['mine']; previous.revision = 7
  const preserved = structuredClone(previous)
  await f.write('Labs/workbook.ipynb', 'second version has different contents')
  f.advance(10000)
  assert.equal((await f.discovery.scan()).pending, 1)
  const update = await f.discovery.scan()
  assert.equal(update.added, 1); assert.equal(update.changed, 1)
  assert.deepEqual(previous, preserved)
  const newest = f.materials[1]
  assert.equal(newest.data.previousMaterialId, previous.id)
  assert.equal(newest.data.reviewed, false)
  assert.equal(newest.title, 'My workbook')
  assert.equal(newest.status, 'archived')
  assert.deepEqual(newest.data.notes, previous.data.notes)
  assert.deepEqual(newest.data.tags, ['mine'])
})

test('a growing or freshly copied file stays pending until its content and age settle', async t => {
  const f = await fixture(t)
  await f.configure()
  await f.write('fresh.csv', 'first')
  assert.equal((await f.discovery.scan()).pending, 1)
  await f.write('fresh.csv', 'growing,more,data')
  assert.equal((await f.discovery.scan()).pending, 1)
  assert.equal(f.materials.length, 0)
  assert.equal((await f.discovery.scan()).added, 1)
  const young = await f.write('young.txt', 'new')
  await fs.utimes(young, new Date(Date.now()), new Date(Date.now() + 20000))
  assert.equal((await f.discovery.scan()).pending, 1)
  assert.equal((await f.discovery.scan()).pending, 1)
  f.advance(20000)
  assert.equal((await f.discovery.scan()).added, 1)
})

test('native originals deduplicate by module path/hash and safe native file hash without metadata writes', async t => {
  const f = await fixture(t)
  const filename = await f.write('Lectures/existing.pdf', 'already copied')
  const nativeRoot = path.join(f.root, 'Life_OS_data/study/materials')
  await fs.mkdir(path.join(nativeRoot, 'assets'), { recursive: true })
  await fs.writeFile(path.join(nativeRoot, 'assets/old-name.pdf'), 'already copied')
  const existing = { id: randomUUID(), module_id: f.module.id, data: { url: '/study-files/assets/old-name.pdf', filePath: filename, reviewed: true }, revision: 4 }
  f.materials.push(existing)
  const original = structuredClone(existing)
  await f.configure()
  assert.equal((await f.discovery.scan()).added, 0)
  assert.equal((await f.discovery.scan()).added, 0)
  assert.equal(f.imports.length, 0)
  assert.deepEqual(existing, original)
})

test('deleted exact versions are not resurrected and source removal never removes materials', async t => {
  const f = await fixture(t)
  const source = await f.write('notes.md', 'recorded')
  await f.configure(); await f.discovery.scan(); await f.discovery.scan()
  f.materials[0].deleted_at = new Date().toISOString()
  assert.equal((await f.discovery.scan()).added, 0)
  assert.equal(f.materials.length, 1)
  await fs.rm(source)
  assert.equal((await f.discovery.scan()).added, 0)
  assert.equal(f.materials.length, 1)
})

test('housekeeping is skipped while document, dataset and archive fallbacks are visible', async t => {
  const f = await fixture(t)
  for (const name of ['.git/config.txt', '.agents/context.md', 'node_modules/package/index.js', '.ipynb_checkpoints/copy.ipynb', 'tmp/working.csv', 'AGENTS.md', 'CLAUDE.md', 'SKILL.md', '.env.local']) await f.write(name, 'not a study material')
  for (const name of ['brief.docx', 'lecture.pptx', 'data.xlsx', 'data.RData', 'archive.zip', 'lab.py']) await f.write(name, 'study bytes for ' + name)
  await f.configure(); await f.discovery.scan()
  assert.equal((await f.discovery.scan()).added, 6)
  assert.equal(f.materials.some(row => row.data.fileName === 'AGENTS.md'), false)
  assert.equal(f.materials.find(row => row.data.fileName === 'brief.docx').data.viewer, 'file')
  assert.equal(f.materials.find(row => row.data.fileName === 'lab.py').data.viewer, 'code')
})

test('symbolic links are skipped clearly and unrelated folders never get read', async t => {
  const f = await fixture(t)
  const outside = path.join(f.root, 'outside')
  await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'private.pdf'), 'outside bytes')
  try { await fs.symlink(outside, path.join(f.directory, 'linked'), process.platform === 'win32' ? 'junction' : 'dir') }
  catch (error) { if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.skip('This host cannot create a fixture symlink'); return } throw error }
  await f.configure()
  const result = await f.discovery.scan()
  assert.match(result.errors.join(' '), /Symbolic link skipped/)
  assert.equal(result.added, 0)
  assert.equal(f.materials.length, 0)
})

test('unknown parents/config paths are rejected and disabled mappings do not ingest', async t => {
  const f = await fixture(t)
  await assert.rejects(f.discovery.configure({ module_id: randomUUID(), directory: f.directory }), error => error.status === 400)
  await assert.rejects(f.discovery.configure({ module_id: f.module.id, directory: '../not-absolute' }), error => error.status === 400)
  await f.configure(); await f.write('never.txt', 'disabled')
  await f.discovery.configure({ module_id: f.module.id, enabled: false })
  assert.equal((await f.discovery.scan()).scanned_modules, 0)
  assert.equal((await f.discovery.status()).mappings[0].status, 'disabled')
  const config = JSON.parse(await fs.readFile(path.join(f.projectRoot, '.runtime/study-folders.json'), 'utf8'))
  assert.equal(config.mappings[0].enabled, false)
})

test('backed-up repository failure keeps original/copied bytes and retries safely', async t => {
  const f = await fixture(t)
  const source = await f.write('recoverable.txt', 'source retained')
  const originalImport = f.repository.importRecords
  f.repository.importRecords = async () => { throw new Error('backup failure') }
  await f.configure(); await f.discovery.scan()
  assert.match((await f.discovery.scan()).errors.join(' '), /existing materials were kept/)
  assert.equal(f.materials.length, 0)
  assert.equal(await fs.readFile(source, 'utf8'), 'source retained')
  f.repository.importRecords = originalImport
  assert.equal((await f.discovery.scan()).added, 1)
  assert.equal(await fs.readFile(source, 'utf8'), 'source retained')
})

test('native storage, backups, project folders and shared ancestors cannot be watched', async t => {
  const f = await fixture(t)
  const native = path.join(f.root, 'Life_OS_data/study/materials'), backups = path.join(f.root, 'Life_OS_backups')
  await fs.mkdir(native, { recursive: true }); await fs.mkdir(backups)
  for (const directory of [f.root, f.projectRoot, native, backups]) await assert.rejects(f.discovery.configure({ module_id: f.module.id, directory }), error => error.status === 400 && /outside Life OS/.test(error.message))
  assert.equal((await f.configure()).mappings.length, 1)
})

test('connecting a folder leaves files already there alone and brings in only later arrivals', async t => {
  const f = await fixture(t)
  await f.write('Old lecture.pdf', 'already in the folder')
  const connected = await f.configure({})
  assert.ok(connected.mappings[0].baseline_at)
  for (let i = 0; i < 3; i++) { f.advance(3000); await f.discovery.scan() }
  assert.equal(f.materials.length, 0)
  assert.equal((await f.discovery.status()).mappings[0].existing, 1)
  const later = await f.write('New lecture.pdf', 'arrived after connecting')
  const stamp = new Date(f.now() + 1000)
  await fs.utimes(later, stamp, stamp)
  f.advance(5000); await f.discovery.scan(); f.advance(5000)
  assert.equal((await f.discovery.scan()).added, 1)
  assert.deepEqual(f.materials.map(row => row.data.source_path), ['New lecture.pdf'])
  // Saving the folder again keeps watching for new files only.
  await f.configure({})
  assert.equal((await f.discovery.status()).mappings[0].baseline_at, connected.mappings[0].baseline_at)
  // Asking for the backlog afterwards brings the older file in as well, and that choice sticks.
  await f.configure({ include_existing: true })
  f.advance(5000); await f.discovery.scan(); f.advance(5000); await f.discovery.scan()
  assert.deepEqual(f.materials.map(row => row.data.source_path).sort(), ['New lecture.pdf', 'Old lecture.pdf'])
  await f.configure({})
  assert.equal((await f.discovery.status()).mappings[0].baseline_at, null)
})

test('a bulk data folder is skipped as a whole and reported, while its neighbours still import', async t => {
  const f = await fixture(t)
  await fs.mkdir(path.join(f.directory, 'dataset'))
  await Promise.all(Array.from({ length: 501 }, (_, i) => fs.writeFile(path.join(f.directory, 'dataset', `frame-${i}.png`), 'x')))
  await f.write('Notes/Week 2.md', 'real notes')
  await f.configure()
  await f.discovery.scan(); f.advance(3000)
  const result = await f.discovery.scan()
  assert.equal(result.added, 1)
  assert.deepEqual(f.materials.map(row => row.data.source_path), ['Notes/Week 2.md'])
  assert.deepEqual(result.mappings[0].bulk_folders, [{ path: 'dataset', items: 501 }])
})

test('preview counts a folder by type and size without copying or saving anything', async t => {
  const f = await fixture(t)
  await f.write('a.pdf', '12345'); await f.write('sub/b.pdf', '123'); await f.write('c.ipynb', '{}'); await f.write('empty.txt', ''); await f.write('skip.exe', 'no')
  const preview = await f.discovery.preview({ module_id: f.module.id, directory: f.directory })
  assert.deepEqual({ files: preview.files, bytes: preview.bytes, types: preview.types, empty: preview.empty, connected: preview.connected }, { files: 3, bytes: 10, types: { pdf: 2, ipynb: 1 }, empty: 1, connected: false })
  assert.equal(f.imports.length, 0)
  assert.equal((await f.discovery.status()).mappings.length, 0)
  await assert.rejects(fs.access(path.join(f.root, 'Life_OS_data')), error => error.code === 'ENOENT')
  await assert.rejects(f.discovery.preview({ module_id: f.module.id, directory: f.projectRoot }), error => error.status === 400)
})

test('an oversized folder is never partly brought in, but can still be watched for new files', async t => {
  const f = await fixture(t)
  for (let folder = 0; folder < 21; folder++) {
    await fs.mkdir(path.join(f.directory, `set-${folder}`))
    await Promise.all(Array.from({ length: 490 }, (_, i) => fs.writeFile(path.join(f.directory, `set-${folder}`, `row-${i}.txt`), 'x')))
  }
  assert.equal((await f.discovery.preview({ module_id: f.module.id, directory: f.directory })).over_limit, true)
  await f.configure()
  await f.discovery.scan(); f.advance(3000)
  const whole = await f.discovery.scan()
  assert.equal(whole.added, 0)
  assert.match(whole.errors.join(' '), /more than 10000 items/)
  assert.equal(f.materials.length, 0)
  await f.configure({ include_existing: false })
  f.advance(3000)
  const watching = await f.discovery.scan()
  assert.equal(watching.added, 0)
  assert.equal(watching.errors.some(message => /more than 10000 items/.test(message)), false)
  assert.ok(watching.existing > 9000)
})
