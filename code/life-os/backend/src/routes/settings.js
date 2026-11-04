import { Router } from 'express'
import db from '../db.js'
import { SETTING_KEY, settingText, settingValue } from '../../../shared/settings.js'

// What Life OS remembers for the whole app (targets, notices seen, sound links): one row per key.
const router = Router()

const SELECT_ALL = 'SELECT key, value, updated_at FROM settings ORDER BY key'
const SELECT_ONE = 'SELECT key, value, updated_at FROM settings WHERE key = ?'
const UPSERT = `
  INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`

// One setting's value as JSON (null when it was never kept), for the server's own readers.
export async function readSetting(key, fallback = null) {
  const row = await db.prepare(SELECT_ONE).get(key)
  if (!row) return fallback
  try { return JSON.parse(row.value) ?? fallback } catch { return fallback }
}
export async function writeSetting(key, value) {
  await db.prepare(UPSERT).run(key, JSON.stringify(value), new Date().toISOString())
}

router.get('/', async (_req, res) => {
  try { res.json({ settings: Object.fromEntries((await db.prepare(SELECT_ALL).all()).map((row) => [row.key, settingValue(row.value)])) }) } catch (error) { res.status(500).json({ error: error.message }) }
})

router.get('/:key', async (req, res) => {
  if (!SETTING_KEY.test(req.params.key)) return res.status(400).json({ error: 'No such setting' })
  try {
    const row = await db.prepare(SELECT_ONE).get(req.params.key)
    res.json({ key: req.params.key, value: row ? settingValue(row.value) : null, updated_at: row?.updated_at ?? null })
  } catch (error) { res.status(500).json({ error: error.message }) }
})

router.put('/:key', async (req, res) => {
  try {
    const text = settingText(req.params.key, req.body?.value)
    const now = new Date().toISOString()
    await db.prepare(UPSERT).run(req.params.key, text, now)
    res.json({ key: req.params.key, value: settingValue(text), updated_at: now })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.status ? error.message : 'The setting could not be kept' })
  }
})

export default router
