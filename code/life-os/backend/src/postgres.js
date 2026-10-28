import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { spawn } from 'node:child_process'

export function postgresConfig(projectRoot) {
  const filename = process.env.LIFE_OS_DATABASE_CONFIG || path.join(projectRoot, '.runtime', 'postgres.json')
  const config = JSON.parse(fs.readFileSync(filename, 'utf8'))
  if (!['127.0.0.1', 'localhost', '::1'].includes(config.host) || !Number.isInteger(config.port)) throw new Error('Invalid local PostgreSQL configuration')
  return config
}

export function createPostgresPool(config, { role = 'app', database = config.database } = {}) {
  if (!['lifeos', 'lifeos_test'].includes(database)) throw new Error('Unknown Life OS database')
  const account = config[role]
  if (!account?.user || !account.password) throw new Error('PostgreSQL role is not configured')
  return new pg.Pool({ host: config.host, port: config.port, database, ...account, max: 4, connectionTimeoutMillis: 2500, idleTimeoutMillis: 10000 })
}

// area names the backup folder (study-<day>, mail-<day>).
export async function postgresBackup(config, projectRoot, label = 'study', database = config.database, area = 'study') {
  if (!['lifeos', 'lifeos_test'].includes(database)) throw new Error('Unknown backup database')
  const directory = path.resolve(projectRoot, `../Life_OS_backups/${area.replace(/[^a-z0-9_-]/gi, '-')}-${new Date().toISOString().slice(0, 10)}`)
  fs.mkdirSync(directory, { recursive: true })
  const destination = path.join(directory, `${label.replace(/[^a-z0-9_-]/gi, '-')}-${Date.now()}.dump`)
  const executable = path.join(config.bin, process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump')
  await new Promise((resolve, reject) => {
    const child = spawn(executable, ['-h', config.host, '-p', String(config.port), '-U', config.owner.user, '-d', database, '-Fc', '-f', destination], {
      windowsHide: true, env: { ...process.env, PGPASSWORD: config.owner.password }, stdio: ['ignore', 'ignore', 'pipe']
    })
    let error = ''
    child.stderr.on('data', chunk => { error += String(chunk).slice(0, 2000) })
    child.on('error', () => reject(new Error('PostgreSQL backup could not start')))
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`PostgreSQL backup failed (${code}): ${error}`)))
  })
  return destination
}
