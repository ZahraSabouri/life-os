import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { DatabaseSync, backup } from 'node:sqlite'

export const sha256 = value => createHash('sha256').update(value).digest('hex')
export function studyFilesRoot(projectRoot) { return path.resolve(projectRoot, '../Life_OS_data/study/materials') }

async function snapshotSqlite(source, target) {
  const db = new DatabaseSync(source, { readOnly: true })
  try { await backup(db, target) } finally { db.close() }
  const check = new DatabaseSync(target, { readOnly: true })
  try {
    if (check.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('SQLite backup integrity check failed')
  } finally { check.close() }
}

export async function backupStudySources(projectRoot) {
  const source = path.join(projectRoot, 'summer-rescue-plan-app')
  const stateFile = path.join(source, 'local-data/summer-rescue-tracker-state.json')
  const before = sha256(await fs.readFile(stateFile))
  const directory = path.resolve(projectRoot, `../Life_OS_backups/study-${new Date().toISOString().slice(0, 10)}/source-${Date.now()}`)
  await fs.mkdir(directory, { recursive: true })
  for (const name of ['local-data', 'public', 'src/data']) {
    await fs.cp(path.join(source, name), path.join(directory, name), {
      recursive: true, filter: filename => !/\.(?:sqlite|db)(?:-(?:wal|shm))?$/.test(filename)
    })
  }
  await snapshotSqlite(path.join(source, 'local-data/app.sqlite'), path.join(directory, 'app.sqlite'))
  await snapshotSqlite(path.join(projectRoot, 'code/life-os/backend/data/life-os.db'), path.join(directory, 'core.sqlite'))
  const after = sha256(await fs.readFile(stateFile))
  if (before !== after) throw new Error('Study changed during backup. Retry before importing.')
  await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify({ stateSha256: before, checkedAt: new Date().toISOString(), sqliteIntegrity: 'ok' }, null, 2))
  return directory
}

async function walk(directory, prefix = '') {
  const result = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Study material symlinks require review')
    const relative = path.join(prefix, entry.name)
    if (entry.isDirectory()) result.push(...await walk(path.join(directory, entry.name), relative))
    else if (entry.isFile()) result.push(relative)
  }
  return result
}

export async function preserveStudyFiles(projectRoot) {
  const source = path.join(projectRoot, 'summer-rescue-plan-app')
  const destination = studyFilesRoot(projectRoot)
  const folders = [
    [path.join(source, 'public/study-assets'), 'assets'],
    [path.join(source, 'local-data/resources'), 'uploads']
  ]
  let files = 0, bytes = 0
  await fs.mkdir(destination, { recursive: true })
  for (const [directory, target] of folders) {
    try { await fs.access(directory) } catch { continue }
    for (const relative of await walk(directory)) {
      const data = await fs.readFile(path.join(directory, relative))
      const filename = path.join(destination, target, relative)
      await fs.mkdir(path.dirname(filename), { recursive: true })
      try {
        if (sha256(await fs.readFile(filename)) !== sha256(data)) throw new Error('Native material differs from source; no file was overwritten')
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        await fs.writeFile(filename, data, { flag: 'wx' })
      }
      if (sha256(await fs.readFile(filename)) !== sha256(data)) throw new Error('Material copy integrity check failed')
      files++; bytes += data.byteLength
    }
  }
  return { directory: destination, files, bytes }
}

const FILE_TYPES = new Map([
  ['pdf', 'application/pdf'], ['txt', 'text/plain'], ['md', 'text/markdown'], ['csv', 'text/csv'], ['json', 'application/json'],
  ['ipynb', 'application/json'], ['py', 'text/plain'], ['r', 'text/plain'], ['js', 'text/plain'], ['sql', 'text/plain'],
  ['html', 'text/html'], ['htm', 'text/html'], ['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'],
  ['gif', 'image/gif'], ['webp', 'image/webp'], ['mp4', 'video/mp4'], ['webm', 'video/webm'], ['mp3', 'audio/mpeg']
])
export function decodeStudyUpload(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 35_000_000 || encoded.length % 4 || /[^A-Za-z0-9+/=]/.test(encoded)) throw Object.assign(new Error('File data is invalid or exceeds 25 MB'), { status: 400 })
  const data = Buffer.from(encoded, 'base64')
  if (!data.byteLength || data.byteLength > 25 * 1024 * 1024) throw Object.assign(new Error('File must be between 1 byte and 25 MB'), { status: 400 })
  if (data.toString('base64') !== encoded) throw Object.assign(new Error('File data is not valid base64'), { status: 400 })
  return data
}
export async function saveStudyUpload(projectRoot, body, repository) {
  if (!body || typeof body.name !== 'string' || typeof body.dataBase64 !== 'string') throw Object.assign(new Error('Choose a file to upload'), { status: 400 })
  const cleanedName = path.basename(body.name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').slice(0, 180)
  const name = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(cleanedName) ? `_${cleanedName}` : cleanedName
  const extension = path.extname(name).slice(1).toLowerCase()
  if (!name || !FILE_TYPES.has(extension)) throw Object.assign(new Error('This file type is not supported. Add a link instead.'), { status: 400 })
  const data = decodeStudyUpload(body.dataBase64)
  const relative = `new/${randomUUID()}/${name}`
  const filename = path.join(studyFilesRoot(projectRoot), relative)
  await fs.mkdir(path.dirname(filename), { recursive: true })
  await fs.writeFile(filename, data, { flag: 'wx' })
  // Failed metadata writes leave a recoverable file; no existing file is removed.
  const material = await repository.create('materials', {
    title: typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 2000) : name, status: 'active', semester_id: body.semester_id || null, module_id: body.module_id || null, card_id: body.card_id || null,
    data: { url: `/study-files/${relative.split('/').map(encodeURIComponent).join('/')}`, fileName: name, type: extension, mime: FILE_TYPES.get(extension), size: data.byteLength, sha256: sha256(data), viewer: extension === 'pdf' ? 'frame' : extension === 'ipynb' ? 'notebook' : ['html', 'htm'].includes(extension) ? 'html' : FILE_TYPES.get(extension).split('/')[0],
      group: typeof body.group === 'string' ? body.group.slice(0, 500) : '', description: typeof body.description === 'string' ? body.description.slice(0, 10000) : '', tags: Array.isArray(body.tags) ? body.tags.filter(tag => typeof tag === 'string').slice(0, 100) : [] }
  })
  return { material }
}
