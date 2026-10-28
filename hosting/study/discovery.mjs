import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { StudyError, validateId } from '../../code/life-os/backend/src/modules/study/schema.js'
import { studyFilesRoot } from './storage.mjs'

const MAX_FILE_BYTES = 100 * 1024 * 1024
const MAX_SCAN_BYTES = 500 * 1024 * 1024
const MAX_FILES = 10000
const MAX_DEPTH = 20
// A folder holding this many items is a dataset or export, not reading material.
const MAX_FOLDER_ITEMS = 500
const STABLE_AGE_MS = 2000
const INTERVAL_MS = 30000
const IGNORED_DIRECTORIES = new Set(['node_modules', '.venv', 'venv', '__pycache__', 'dist', 'build', 'tmp', 'temp'])
const IGNORED_FILES = new Set(['agents.md', 'claude.md', 'skill.md'])
const TYPES = new Map([
  ['pdf', ['application/pdf', 'frame']], ['ipynb', ['application/json', 'notebook']],
  ['md', ['text/markdown', 'markdown']], ['txt', ['text/plain', 'text']], ['csv', ['text/csv', 'text']], ['tsv', ['text/tab-separated-values', 'text']],
  ...['json', 'py', 'r', 'js', 'jsx', 'ts', 'tsx', 'css', 'sql', 'tex', 'bib', 'yaml', 'yml', 'xml', 'm'].map(type => [type, ['text/plain', 'code']]),
  ...['html', 'htm'].map(type => [type, ['text/html', 'html']]),
  ...['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].map(type => [type, [`image/${type === 'jpg' ? 'jpeg' : type}`, 'image']]),
  ...['mp4', 'webm', 'mov'].map(type => [type, [`video/${type === 'mov' ? 'quicktime' : type}`, 'video']]),
  ...['mp3', 'wav', 'ogg', 'm4a'].map(type => [type, [`audio/${type === 'mp3' ? 'mpeg' : type === 'm4a' ? 'mp4' : type}`, 'audio']]),
  ...['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'zip', '7z', 'rar', 'tar', 'gz', 'rdata', 'rds', 'mat', 'parquet', 'feather', 'npy', 'npz'].map(type => [type, ['application/octet-stream', 'file']]),
])
const digest = value => createHash('sha256').update(value).digest('hex')
const dataOf = row => row?.data && typeof row.data === 'object' && !Array.isArray(row.data) ? row.data : {}
const slash = value => value.split(path.sep).join('/')
const within = (root, filename) => { const relative = path.relative(root, filename); return !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative) }
const signature = stat => `${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}:${stat.ino}:${stat.dev}`
const samePath = (one, two) => process.platform === 'win32' ? one.toLowerCase() === two.toLowerCase() : one === two

function stableUuid(value) {
  const hash = digest(value)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

async function readStableFile(filename, { bytes = false } = {}) {
  const beforePath = await fs.lstat(filename)
  if (beforePath.isSymbolicLink() || !beforePath.isFile()) throw new StudyError(400, 'Links and non-files are not imported')
  if (beforePath.size > MAX_FILE_BYTES) throw new StudyError(413, 'File exceeds the 100 MB discovery limit')
  const handle = await fs.open(filename, 'r')
  try {
    const before = await handle.stat()
    if (signature(beforePath) !== signature(before)) return null
    const hash = createHash('sha256'), parts = [], buffer = Buffer.alloc(64 * 1024)
    let size = 0
    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null)
      if (!bytesRead) break
      size += bytesRead
      if (size > MAX_FILE_BYTES) throw new StudyError(413, 'File exceeds the 100 MB discovery limit')
      hash.update(buffer.subarray(0, bytesRead))
      if (bytes) parts.push(Buffer.from(buffer.subarray(0, bytesRead)))
    }
    const after = await handle.stat(), afterPath = await fs.lstat(filename)
    if (afterPath.isSymbolicLink() || signature(before) !== signature(after) || signature(before) !== signature(afterPath) || size !== before.size) return null
    return { sha256: hash.digest('hex'), size, signature: signature(before), modifiedAt: before.mtime.toISOString(), ...(bytes ? { bytes: Buffer.concat(parts, size) } : {}) }
  } finally { await handle.close() }
}

async function safeNativeHash(root, url, cache) {
  if (typeof url !== 'string' || !url.startsWith('/study-files/')) return null
  let filename
  try {
    const relative = decodeURIComponent(url.split(/[?#]/)[0].slice('/study-files/'.length))
    filename = path.resolve(root, relative)
    if (!within(root, filename)) return null
    const real = await fs.realpath(filename)
    if (!within(root, real)) return null
    const stat = await fs.lstat(filename)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > MAX_FILE_BYTES) return null
    const key = `${filename}:${signature(stat)}`
    if (cache.has(key)) return cache.get(key)
    const read = await readStableFile(filename)
    if (!read) return null
    cache.set(key, read.sha256)
    return read.sha256
  } catch { return null }
}

function materialRelative(material, directory) {
  const data = dataOf(material)
  for (const value of [data.filePath, data.originalPath, data.path]) {
    if (typeof value !== 'string' || !path.isAbsolute(value)) continue
    const filename = path.resolve(value)
    if (within(directory, filename)) return slash(path.relative(directory, filename))
  }
  for (const value of [data.relativePath, data.source_path, data.discovery?.relative_path]) {
    if (typeof value === 'string' && value && !path.isAbsolute(value)) return slash(value.replaceAll('\\', path.sep))
  }
  return null
}

function mappingState(mapping, state = {}) {
  return { ...mapping, status: !mapping.enabled ? 'disabled' : state.errors?.length ? 'error' : 'watching', last_scan_at: null, added: 0, pending: 0, changed: 0, skipped: 0, existing: 0, bulk_folders: [], errors: [], ...state }
}

export function createStudyDiscovery({ projectRoot, repository, configFile = path.join(projectRoot, '.runtime/study-folders.json'), clock = () => Date.now() } = {}) {
  if (!projectRoot || !repository?.workspace || !repository?.importRecords) throw new TypeError('Study discovery requires a root and repository')
  const nativeRoot = studyFilesRoot(projectRoot), observations = new Map(), states = new Map(), nativeHashes = new Map()
  const protectedRoots = [nativeRoot, path.resolve(projectRoot, '../Life_OS_backups'), path.resolve(projectRoot)]
  let mappings, loadingConfig, interval, scanning = false, lastScanAt = null, queue = Promise.resolve(), closed = false

  async function load() {
    if (mappings) return
    if (!loadingConfig) loadingConfig = (async () => {
      let stored
      try { stored = JSON.parse(await fs.readFile(configFile, 'utf8')) }
      catch (error) {
        if (error.code === 'ENOENT') { mappings = []; return }
        throw new StudyError(503, 'Study folder configuration could not be read; no files were imported')
      }
      if (!stored || stored.version !== 1 || !Array.isArray(stored.mappings) || stored.mappings.length > 100) throw new StudyError(503, 'Study folder configuration is invalid')
      const parsed = stored.mappings.map(mapping => {
        if (!mapping || typeof mapping.directory !== 'string' || !path.isAbsolute(mapping.directory) || typeof mapping.enabled !== 'boolean') throw new StudyError(503, 'Study folder configuration is invalid')
        try { validateId(mapping.module_id, 'module_id') } catch { throw new StudyError(503, 'Study folder configuration has an invalid module ID') }
        const baseline = mapping.baseline_at ?? null
        if (baseline !== null && (typeof baseline !== 'string' || !Number.isFinite(Date.parse(baseline)))) throw new StudyError(503, 'Study folder configuration has an invalid baseline time')
        return { module_id: mapping.module_id, directory: path.resolve(mapping.directory), enabled: mapping.enabled, baseline_at: baseline }
      })
      if (new Set(parsed.map(row => row.module_id)).size !== parsed.length) throw new StudyError(503, 'Study folder configuration has duplicate modules')
      mappings = parsed
    })()
    try { await loadingConfig } finally { loadingConfig = null }
  }

  async function status() {
    await load()
    return { configured: mappings.length > 0, scanning, interval_ms: INTERVAL_MS, max_file_bytes: MAX_FILE_BYTES, last_scan_at: lastScanAt, mappings: mappings.map(mapping => mappingState(mapping, states.get(mapping.module_id))) }
  }

  async function safeSourceRoot(directory) {
    const resolved = await fs.realpath(directory)
    for (const protectedRoot of protectedRoots) {
      const protectedReal = await fs.realpath(protectedRoot).catch(() => path.resolve(protectedRoot))
      if (within(protectedReal, resolved) || within(resolved, protectedReal)) throw new StudyError(400, 'Choose a module folder outside Life OS, native storage and backups; shared parent folders cannot be watched')
    }
    return resolved
  }

  async function configureNow(body = {}) {
    await load()
    if (closed) throw new StudyError(503, 'Study folder discovery is stopped')
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new StudyError(400, 'Folder configuration must be an object')
    const moduleId = validateId(body.module_id, 'module_id')
    const workspace = await repository.workspace()
    if (!workspace.modules.some(row => row.id === moduleId && !row.deleted_at)) throw new StudyError(400, 'Choose an existing Study module')
    const previous = mappings.find(row => row.module_id === moduleId)
    const enabled = body.enabled === undefined ? previous?.enabled ?? true : body.enabled
    if (typeof enabled !== 'boolean') throw new StudyError(400, 'enabled must be true or false')
    const value = body.directory === undefined ? previous?.directory : body.directory
    if (typeof value !== 'string' || !value.trim() || value.length > 4096 || !path.isAbsolute(value.trim())) throw new StudyError(400, 'Choose an absolute module-material folder path')
    const directory = path.resolve(value.trim()), stat = await fs.lstat(directory).catch(() => null)
    if (!stat?.isDirectory() || stat.isSymbolicLink()) throw new StudyError(400, 'Choose an existing folder, not a symbolic link')
    const resolved = await safeSourceRoot(directory)
    if (mappings.some(row => row.module_id !== moduleId && samePath(row.directory, resolved))) throw new StudyError(409, 'This folder is already mapped to another Study module')
    if (body.include_existing !== undefined && typeof body.include_existing !== 'boolean') throw new StudyError(400, 'include_existing must be true or false')
    // Connecting a folder watches for files added from now on. Files already
    // there are brought in only when asked for, so a full folder cannot flood Materials.
    const sameFolder = Boolean(previous) && samePath(previous.directory, resolved)
    const baseline_at = body.include_existing === true ? null
      : sameFolder && body.include_existing === undefined ? previous.baseline_at ?? null
      : (sameFolder && previous.baseline_at) || new Date(clock()).toISOString()
    const next = { module_id: moduleId, directory: resolved, enabled, baseline_at }
    const updated = [...mappings.filter(row => row.module_id !== moduleId), next]
    if (updated.length > 100) throw new StudyError(400, 'At most 100 Study folders can be configured')
    await fs.mkdir(path.dirname(configFile), { recursive: true })
    const resolvedConfig = path.resolve(configFile), temporary = path.resolve(`${configFile}.${randomUUID()}.tmp`)
    if (!samePath(path.dirname(temporary), path.dirname(resolvedConfig))) throw new StudyError(400, 'Configuration paths must stay in their intended folder')
    await fs.writeFile(temporary, JSON.stringify({ version: 1, mappings: updated }, null, 2), { flag: 'wx' })
    await fs.rename(temporary, resolvedConfig)
    mappings = updated
    if (!previous || previous.directory !== resolved || previous.baseline_at !== baseline_at) {
      states.delete(moduleId)
      for (const key of observations.keys()) if (key.startsWith(`${moduleId}\0`)) observations.delete(key)
    }
    return status()
  }

  function configure(body = {}) {
    const result = queue.then(() => configureNow(body))
    queue = result.catch(() => {})
    return result
  }

  async function filesUnder(directory, summary) {
    const files = []
    let visited = 0
    async function visit(folder, relative = '', depth = 0) {
      if (depth > MAX_DEPTH) { summary.errors.push('A deeply nested folder was skipped'); return }
      const entries = (await fs.readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
      if (entries.length > MAX_FOLDER_ITEMS) {
        summary.skipped += entries.length
        summary.bulk_folders.push({ path: slash(relative) || '.', items: entries.length })
        return
      }
      for (const entry of entries) {
        if (++visited > MAX_FILES) { if (!summary.truncated) summary.errors.push('The scan reached 10000 entries; narrow the module folder'); summary.truncated = true; return }
        const name = entry.name.toLowerCase(), local = path.join(relative, entry.name)
        if (entry.name.startsWith('.') || IGNORED_FILES.has(name) || name.startsWith('.env')) { summary.skipped++; continue }
        if (entry.isSymbolicLink()) { summary.skipped++; summary.errors.push(`Symbolic link skipped: ${slash(local)}`); continue }
        if (entry.isDirectory()) {
          if (IGNORED_DIRECTORIES.has(name)) summary.skipped++
          else await visit(path.join(folder, entry.name), local, depth + 1)
        } else if (entry.isFile()) {
          const extension = path.extname(entry.name).slice(1).toLowerCase()
          if (!TYPES.has(extension) || slash(local).length > 2048) { summary.skipped++; continue }
          files.push({ filename: path.join(directory, local), relative: slash(local), extension })
        }
      }
    }
    await visit(directory)
    return files
  }

  async function scanMapping(mapping, workspace, budget) {
    const summary = { module_id: mapping.module_id, last_scan_at: new Date(clock()).toISOString(), added: 0, pending: 0, changed: 0, skipped: 0, existing: 0, bulk_folders: [], errors: [] }
    try {
      const module = workspace.modules.find(row => row.id === mapping.module_id && !row.deleted_at)
      if (!module) throw new StudyError(400, 'Mapped Study module is unavailable')
      const stat = await fs.lstat(mapping.directory)
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new StudyError(400, 'Mapped folder is unavailable or is a symbolic link')
      if (!samePath(await safeSourceRoot(mapping.directory), mapping.directory)) throw new StudyError(400, 'Mapped folder path changed through a link; configure its real module folder again')
      const materials = workspace.materials.filter(row => row.module_id === mapping.module_id)
      const existing = await Promise.all(materials.map(async material => ({ material, relative: materialRelative(material, mapping.directory), sha256: dataOf(material).sha256 || await safeNativeHash(nativeRoot, dataOf(material).url, nativeHashes) })))
      const files = await filesUnder(mapping.directory, summary), records = [], source = `module-folder:${mapping.module_id}`, seen = new Set()
      const baseline = mapping.baseline_at ? Date.parse(mapping.baseline_at) : null
      // Part of an oversized folder is never brought in: that would fill Materials with an arbitrary slice of it.
      if (summary.truncated && baseline === null) throw new StudyError(400, 'This folder holds more than 10000 items, so its existing files were not brought in. Connect a narrower folder, or watch it for new files only.')
      for (const file of files) {
        const key = `${mapping.module_id}\0${file.relative}`
        seen.add(key)
        try {
          const current = await fs.lstat(file.filename)
          if (!current.isFile() || current.isSymbolicLink()) { summary.skipped++; continue }
          // Copying or moving a file into the folder refreshes its creation or change time, even when its modified time is old.
          if (baseline !== null && Math.max(current.mtimeMs, current.ctimeMs, current.birthtimeMs) < baseline) { summary.existing++; continue }
          const resolved = await fs.realpath(file.filename)
          if (!within(mapping.directory, resolved) || !samePath(resolved, path.resolve(file.filename))) { summary.skipped++; summary.errors.push(`Symbolic link path skipped: ${file.relative}`); continue }
          if (!current.size || current.size > MAX_FILE_BYTES) { summary.skipped++; if (current.size > MAX_FILE_BYTES) summary.errors.push(`File exceeds 100 MB: ${file.relative}`); continue }
          const previous = observations.get(key), fileSignature = signature(current)
          let observation = previous
          if (!previous || previous.signature !== fileSignature) {
            if (budget.bytes + current.size > MAX_SCAN_BYTES) { summary.pending++; continue }
            budget.bytes += current.size
            const read = await readStableFile(file.filename)
            if (!read) { observations.delete(key); summary.pending++; continue }
            observation = { ...read, seen: 1 }
            observations.set(key, observation)
          } else { observation.seen++ }
          const exact = existing.find(row => row.sha256 === observation.sha256 && (row.relative === file.relative || !row.relative))
            || existing.find(row => row.sha256 === observation.sha256)
          if (exact) { summary.skipped++; continue }
          if (observation.seen < 2 || clock() - Math.max(current.mtimeMs, current.ctimeMs) < STABLE_AGE_MS) { summary.pending++; continue }
          if (budget.bytes + current.size > MAX_SCAN_BYTES) { summary.pending++; continue }
          budget.bytes += current.size
          const read = await readStableFile(file.filename, { bytes: true })
          if (!read || read.signature !== observation.signature || read.sha256 !== observation.sha256) { observations.delete(key); summary.pending++; continue }
          const previousVersion = existing.filter(row => row.relative === file.relative).sort((a, b) => String(b.material.updated_at || '').localeCompare(String(a.material.updated_at || '')))[0]?.material
          const nativeRelative = `discovered/${mapping.module_id}/${read.sha256}/${file.relative}`
          const destination = path.join(nativeRoot, ...nativeRelative.split('/'))
          if (!within(nativeRoot, destination)) throw new StudyError(400, 'Material path is outside native storage')
          await fs.mkdir(path.dirname(destination), { recursive: true })
          if (!samePath(await fs.realpath(path.dirname(destination)), path.resolve(path.dirname(destination)))) throw new StudyError(400, 'Native material links are not followed')
          try { await fs.writeFile(destination, read.bytes, { flag: 'wx' }) }
          catch (error) { if (error.code !== 'EEXIST' || (await readStableFile(destination))?.sha256 !== read.sha256) throw new Error('An existing native material differs; no file was overwritten') }
          const previousData = dataOf(previousVersion), [mime, viewer] = TYPES.get(file.extension)
          const sourceId = `${digest(file.relative)}:${read.sha256}`
          const inherited = Object.fromEntries(['description', 'tags', 'group', 'notes'].filter(field => previousData[field] !== undefined).map(field => [field, previousData[field]]))
          records.push({ entity: 'materials', source_id: sourceId, record: {
            id: stableUuid(`${source}\0${sourceId}`), title: previousVersion?.title || path.basename(file.relative), status: previousVersion?.status || 'active',
            module_id: module.id, semester_id: module.semester_id || null,
            data: { ...inherited, url: `/study-files/${nativeRelative.split('/').map(encodeURIComponent).join('/')}`, fileName: path.basename(file.relative), relativePath: file.relative,
              source_path: file.relative, type: file.extension, mime, viewer, size: read.size, sha256: read.sha256, reviewed: false,
              group: inherited.group || (slash(path.dirname(file.relative)) === '.' ? 'Discovered materials' : slash(path.dirname(file.relative))),
              ...(previousVersion ? { previousMaterialId: previousVersion.id } : {}),
              discovery: { module_id: module.id, relative_path: file.relative, source_modified_at: read.modifiedAt, discovered_at: new Date(clock()).toISOString() } }
          } })
          if (previousVersion) summary.changed++
        } catch (error) { summary.errors.push(`${file.relative}: ${error.status === 413 ? error.message : 'File could not be copied safely'}`) }
      }
      for (const key of observations.keys()) if (key.startsWith(`${mapping.module_id}\0`) && !seen.has(key)) observations.delete(key)
      if (records.length) {
        const fingerprint = digest(JSON.stringify(records.map(row => [row.source_id, row.record.id])))
        const result = await repository.importRecords({ source, fingerprint, records })
        summary.added = result.inserted ?? result.added ?? 0
      }
    } catch (error) { summary.errors.push(error instanceof StudyError ? error.message : 'Folder scan could not finish; existing materials were kept') }
    summary.errors = summary.errors.slice(0, 30)
    summary.bulk_folders = summary.bulk_folders.slice(0, 30)
    states.set(mapping.module_id, summary)
    return summary
  }

  // Counts what connecting a folder would involve. Reads names and sizes only; nothing is copied or saved.
  async function preview(body = {}) {
    await load()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new StudyError(400, 'Folder preview must be an object')
    const moduleId = validateId(body.module_id, 'module_id')
    const mapping = mappings.find(row => row.module_id === moduleId)
    const value = body.directory === undefined ? mapping?.directory : body.directory
    if (typeof value !== 'string' || !value.trim() || value.length > 4096 || !path.isAbsolute(value.trim())) throw new StudyError(400, 'Choose an absolute module-material folder path')
    const directory = path.resolve(value.trim()), stat = await fs.lstat(directory).catch(() => null)
    if (!stat?.isDirectory() || stat.isSymbolicLink()) throw new StudyError(400, 'Choose an existing folder, not a symbolic link')
    const resolved = await safeSourceRoot(directory)
    const summary = { skipped: 0, bulk_folders: [], errors: [] }
    const files = await filesUnder(resolved, summary), types = {}
    let bytes = 0, tooLarge = 0, empty = 0
    for (const file of files) {
      const current = await fs.lstat(file.filename).catch(() => null)
      if (!current?.isFile()) continue
      if (!current.size) { empty++; continue }
      if (current.size > MAX_FILE_BYTES) { tooLarge++; continue }
      bytes += current.size
      types[file.extension] = (types[file.extension] || 0) + 1
    }
    const eligible = Object.values(types).reduce((sum, count) => sum + count, 0)
    return { module_id: moduleId, connected: Boolean(mapping && samePath(mapping.directory, resolved)), baseline_at: mapping?.baseline_at ?? null,
      files: eligible, bytes, types, too_large: tooLarge, empty, over_limit: Boolean(summary.truncated), unsupported_or_hidden: summary.skipped, bulk_folders: summary.bulk_folders.slice(0, 30), errors: summary.errors.slice(0, 30) }
  }

  function scan(input = {}) {
    const moduleId = typeof input === 'string' ? input : input?.module_id
    if (moduleId !== undefined) validateId(moduleId, 'module_id')
    const run = async () => {
      await load()
      if (closed) throw new StudyError(503, 'Study folder discovery is stopped')
      if (moduleId && !mappings.some(row => row.module_id === moduleId)) throw new StudyError(404, 'Configure this module folder before scanning')
      scanning = true
      try {
        const workspace = await repository.workspace({ includeDeleted: true, historyLimit: 1 }), budget = { bytes: 0 }, summaries = []
        for (const mapping of mappings.filter(row => row.enabled && (!moduleId || row.module_id === moduleId))) summaries.push(await scanMapping(mapping, workspace, budget))
        lastScanAt = new Date(clock()).toISOString()
        return { scanned_modules: summaries.length, added: summaries.reduce((n, row) => n + row.added, 0), pending: summaries.reduce((n, row) => n + row.pending, 0),
          changed: summaries.reduce((n, row) => n + row.changed, 0), skipped: summaries.reduce((n, row) => n + row.skipped, 0), existing: summaries.reduce((n, row) => n + row.existing, 0), errors: summaries.flatMap(row => row.errors), mappings: summaries }
      } finally { scanning = false }
    }
    const result = queue.then(run)
    queue = result.catch(() => {})
    return result
  }

  function start({ intervalMs = INTERVAL_MS } = {}) {
    if (interval) return
    closed = false
    interval = setInterval(() => { if (!scanning) scan().catch(() => {}) }, Math.max(1000, Number(intervalMs) || INTERVAL_MS))
    interval.unref?.()
  }
  async function close() { closed = true; if (interval) clearInterval(interval); interval = null; await queue }
  return Object.freeze({ status, configure, preview, scan, start, close })
}
