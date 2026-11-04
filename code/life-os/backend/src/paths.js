// Where Life OS keeps what is not code, and where it answers: one place, read from the environment
// when asked (code/life-os/backend/.env; .env.example lists every setting). Without settings, data
// and backups sit in folders beside the app folder, and the app answers on this computer only.
import path from 'node:path'

export const dataRoot = (projectRoot) => path.resolve(process.env.LIFE_OS_DATA_DIR || path.join(projectRoot, '../Life_OS_data'))
export const backupRoot = (projectRoot) => path.resolve(process.env.LIFE_OS_BACKUP_DIR || path.join(projectRoot, '../Life_OS_backups'))
export const lifeOsPort = () => Number(process.env.LIFE_OS_PORT || 47850)
export const lifeOsOrigin = () => process.env.LIFE_OS_ORIGIN || `http://127.0.0.1:${lifeOsPort()}`
