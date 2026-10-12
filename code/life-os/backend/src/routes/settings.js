import { Router } from 'express'
import db from '../db.js'
import { SETTING_KEY, settingText, settingValue } from '../../../shared/settings.js'

// What Life OS remembers for the whole app (targets, notices seen, sound links): one row per key.
const router = Router()

const selectAll = db.prepare('SELECT key, value, updated_at FROM settings ORDER BY key')
const selectOne = db.prepare('SELECT key, value, updated_at FROM settings WHERE key = ?')
const upsert = db.prepare(`
  INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`)

router.get('/', (_req, res) => {
  res.json({ settings: Object.fromEntries(selectAll.all().map((row) => [row.key, settingValue(row.value)])) })
})

router.get('/:key', (req, res) => {
  if (!SETTING_KEY.test(req.params.key)) return res.status(400).json({ error: 'No such setting' })
  const row = selectOne.get(req.params.key)
  res.json({ key: req.params.key, value: row ? settingValue(row.value) : null, updated_at: row?.updated_at ?? null })
})

router.put('/:key', (req, res) => {
  try {
    const text = settingText(req.params.key, req.body?.value)
    const now = new Date().toISOString()
    upsert.run(req.params.key, text, now)
    res.json({ key: req.params.key, value: settingValue(text), updated_at: now })
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.status ? error.message : 'The setting could not be kept' })
  }
})

export default router
