// Reviewed setup for fresh project databases only. It never edits the cluster's
// data directory, changes existing credentials or reuses a nonempty database.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const configPath = path.join(root, '.runtime/postgres.json')
try { await fs.access(configPath); console.log('Existing project PostgreSQL configuration preserved.'); process.exit(0) } catch {}
const host = '127.0.0.1', port = 5432
const client = new pg.Client({ host, port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 3000 })
await client.connect()
try {
  const existing = await client.query("SELECT datname FROM pg_database WHERE datname IN ('lifeos','lifeos_test')")
  const roles = await client.query("SELECT rolname FROM pg_roles WHERE rolname IN ('lifeos_owner','lifeos_app')")
  if (existing.rowCount || roles.rowCount) throw new Error('Project database or roles already exist; setup stopped without changing them.')
  const ownerPassword = randomBytes(32).toString('hex'), appPassword = randomBytes(32).toString('hex')
  // Fixed identifiers and generated hex passwords are the only interpolations.
  await client.query(`CREATE ROLE lifeos_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${ownerPassword}'`)
  await client.query(`CREATE ROLE lifeos_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${appPassword}'`)
  await client.query('CREATE DATABASE lifeos OWNER lifeos_owner TEMPLATE template0')
  await client.query('CREATE DATABASE lifeos_test OWNER lifeos_owner TEMPLATE template0')
  for (const database of ['lifeos', 'lifeos_test']) {
    await client.query(`REVOKE ALL ON DATABASE ${database} FROM PUBLIC`)
    await client.query(`GRANT CONNECT ON DATABASE ${database} TO lifeos_owner, lifeos_app`)
  }
  await fs.mkdir(path.dirname(configPath), { recursive: true })
  await fs.writeFile(configPath, JSON.stringify({ host, port, database: 'lifeos', testDatabase: 'lifeos_test', bin: 'C:/Program Files/PostgreSQL/18/bin', owner: { user: 'lifeos_owner', password: ownerPassword }, app: { user: 'lifeos_app', password: appPassword } }, null, 2), { mode: 0o600 })
  console.log(JSON.stringify({ databases: ['lifeos', 'lifeos_test'], roles: ['lifeos_owner', 'lifeos_app'], configuration: '.runtime/postgres.json', credentialsPrinted: false }))
} finally { await client.end() }
