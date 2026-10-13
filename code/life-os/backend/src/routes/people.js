// The people in her life: a name, and whatever she knows of them (a birthday, how she knows
// them, how to reach them, notes). A birthday shows on the calendar every year. A person is a
// record of hers; `person_identities` (migrations.sql) is where a person could later be tied to
// a real account, and nothing writes to it yet.
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'

const router = Router()
const text = (value, limit) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : null)
// A birthday is a day. The year may be unknown: "--MM-DD" is kept as the year 1900.
function day(value) {
  if (value === undefined || value === null || value === '') return null
  const said = String(value).trim()
  const found = /^(\d{4})-(\d{2})-(\d{2})$/.exec(said)
  if (!found || Number.isNaN(Date.parse(`${said}T12:00:00Z`)) || new Date(`${said}T12:00:00Z`).toISOString().slice(0, 10) !== said) throw new Error('The birthday is a day, like 1996-03-14')
  return said
}
function clean(body, existing = {}) {
  const source = body ?? {}
  const name = 'name' in source ? text(source.name, 200) : existing.name
  if (!name) throw new Error('Give the person a name')
  return {
    name,
    birthday: 'birthday' in source ? day(source.birthday) : existing.birthday ?? null,
    relation: 'relation' in source ? text(source.relation, 120) : existing.relation ?? null,
    contact: 'contact' in source ? text(source.contact, 400) : existing.contact ?? null,
    notes: 'notes' in source ? text(source.notes, 8000) : existing.notes ?? null,
  }
}
const one = db.prepare('SELECT * FROM people WHERE id = ?')

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM people ORDER BY name COLLATE NOCASE ASC').all())
})

router.post('/', (req, res) => {
  try {
    const person = clean(req.body)
    const id = randomUUID()
    db.prepare('INSERT INTO people (id, name, birthday, notes, relation, contact) VALUES (?, ?, ?, ?, ?, ?)').run(id, person.name, person.birthday, person.notes, person.relation, person.contact)
    res.status(201).json(one.get(id))
  } catch (error) { res.status(400).json({ error: error.message }) }
})

router.patch('/:id', (req, res) => {
  try {
    const existing = one.get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })
    const person = clean(req.body, existing)
    db.prepare('UPDATE people SET name = ?, birthday = ?, notes = ?, relation = ?, contact = ? WHERE id = ?').run(person.name, person.birthday, person.notes, person.relation, person.contact, req.params.id)
    res.json(one.get(req.params.id))
  } catch (error) { res.status(400).json({ error: error.message }) }
})

// Removes the person and what exists only because of them (their ties to entries). The entries stay.
router.delete('/:id', (req, res) => {
  if (!one.get(req.params.id)) return res.status(404).json({ error: 'not found' })
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM entry_people WHERE person_id = ?').run(req.params.id)
    db.prepare('DELETE FROM person_identities WHERE person_id = ?').run(req.params.id)
    db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id)
    db.exec('COMMIT')
    res.json({ ok: true })
  } catch (error) { db.exec('ROLLBACK'); res.status(500).json({ error: error.message }) }
})

export default router
