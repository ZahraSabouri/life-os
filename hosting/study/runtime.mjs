import { postgresConfig, createPostgresPool, postgresBackup } from '../../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../../code/life-os/backend/src/modules/study/repository.js'
import { createStudyImports } from './imports.mjs'
import { backupStudySources, backupStudyMaterials, preserveStudyFiles } from './storage.mjs'
import { readLegacyStudy } from './legacy.mjs'
import { StudyError } from '../../code/life-os/backend/src/modules/study/schema.js'
import { createStudyDiscovery } from './discovery.mjs'
import { createStudyBackups } from './backups.mjs'
import path from 'node:path'

export function createStudyRuntime(projectRoot) {
  let config, pool
  try { config = postgresConfig(projectRoot); pool = createPostgresPool(config) }
  catch {
    const unavailable = async () => { throw new StudyError(503, 'Study storage is not configured. The original Study remains available.') }
    return { repository: Object.fromEntries(['workspace','exportWorkspace','create','patch','remove','restore','revert','recordHistory','deleted','previewImport','importRecords'].map(name => [name, unavailable])), imports: {}, close: async () => {}, configured: false }
  }
  const backups = createStudyBackups({ backupRoot: path.resolve(projectRoot, '../Life_OS_backups'), dump: label => postgresBackup(config, projectRoot, label) })
  const repository = createStudyRepository({ pool, beforeImport: async ({ batch }) => {
    // Folder discovery only adds new copies of files that stay in their module folder, so it needs
    // neither a full copy of the material store nor a fresh database dump on every scan.
    if (batch.source.startsWith('module-folder:')) {
      if (!(await backups.recent(60 * 60_000))) await postgresBackup(config, projectRoot, 'before-discovery')
      return
    }
    await postgresBackup(config, projectRoot, 'before-import')
    await backupStudyMaterials(projectRoot)
    if (batch.source === 'summer-rescue-original') {
      await backupStudySources(projectRoot)
      await preserveStudyFiles(projectRoot)
      if ((await readLegacyStudy(projectRoot)).fingerprint !== batch.fingerprint) throw new StudyError(409, 'Study changed during the backup. Preview the import again.')
    }
  } })
  const discovery = createStudyDiscovery({ projectRoot, repository })
  discovery.start()
  backups.start()
  return { repository, imports: createStudyImports({ projectRoot, repository }), discovery, backups, configured: true, pool,
    close: async () => { await discovery.close(); await backups.close(); await pool.end() } }
}
