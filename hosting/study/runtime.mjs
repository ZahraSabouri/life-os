import { postgresConfig, createPostgresPool, postgresBackup } from '../../code/life-os/backend/src/postgres.js'
import { createStudyRepository } from '../../code/life-os/backend/src/modules/study/repository.js'
import { createStudyImports } from './imports.mjs'
import { backupStudySources, preserveStudyFiles } from './storage.mjs'
import { readLegacyStudy } from './legacy.mjs'
import { StudyError } from '../../code/life-os/backend/src/modules/study/schema.js'

export function createStudyRuntime(projectRoot) {
  let config, pool
  try { config = postgresConfig(projectRoot); pool = createPostgresPool(config) }
  catch {
    const unavailable = async () => { throw new StudyError(503, 'Study storage is not configured. The original Study remains available.') }
    return { repository: Object.fromEntries(['workspace','exportWorkspace','create','patch','remove','previewImport','importRecords'].map(name => [name, unavailable])), imports: {}, close: async () => {}, configured: false }
  }
  const repository = createStudyRepository({ pool, beforeImport: async ({ batch }) => {
    await postgresBackup(config, projectRoot, 'before-import')
    if (batch.source === 'summer-rescue-original') {
      await backupStudySources(projectRoot)
      await preserveStudyFiles(projectRoot)
      if ((await readLegacyStudy(projectRoot)).fingerprint !== batch.fingerprint) throw new StudyError(409, 'Study changed during the backup. Preview the import again.')
    }
  } })
  return { repository, imports: createStudyImports({ projectRoot, repository }), configured: true, pool, close: () => pool.end() }
}
