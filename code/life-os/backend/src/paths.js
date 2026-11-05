// Where Life OS keeps what is not code, and where it answers: one place, read from the environment
// when asked (code/life-os/backend/.env; .env.example lists every setting). Without settings, data
// and backups sit in folders beside the app folder, and the app answers on this computer only.
import path from 'node:path'

export const dataRoot = (projectRoot) => path.resolve(process.env.LIFE_OS_DATA_DIR || path.join(projectRoot, '../Life_OS_data'))
export const backupRoot = (projectRoot) => path.resolve(process.env.LIFE_OS_BACKUP_DIR || path.join(projectRoot, '../Life_OS_backups'))
// The Events research (events.csv, its notes, events-settings.json and the built page); a relative
// setting is read from the project folder.
export const eventsRoot = (projectRoot) => (process.env.LIFE_OS_EVENTS_DIR ? path.resolve(projectRoot, process.env.LIFE_OS_EVENTS_DIR) : path.join(dataRoot(projectRoot), 'events'))
// Addresses that moved, so old links and bookmarks still open: "old=new" pairs, comma-separated
// (LIFE_OS_MOVED_ADDRESSES). A pair ending in / moves everything under it.
export function movedAddresses(value = process.env.LIFE_OS_MOVED_ADDRESSES || '') {
  const local = (address) => /^\/(?!\/)[^\s?#]*$/.test(address)
  return value.split(',').map((pair) => pair.split('=').map((part) => part.trim()))
    .filter((pair) => pair.length === 2 && pair.every(local) && pair[0] !== '/' && pair[0] !== pair[1])
}
export const lifeOsPort = () => Number(process.env.LIFE_OS_PORT || 47850)
export const lifeOsOrigin = () => process.env.LIFE_OS_ORIGIN || `http://127.0.0.1:${lifeOsPort()}`
