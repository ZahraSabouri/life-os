import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import db from '../db.js'

const router = Router()

const insertPerson = db.prepare(`
  INSERT INTO people (id, name, birthday, notes)
  VALUES (?, ?, ?, ?)
`)

const selectPeople = db.prepare(`
  SELECT * FROM people
  ORDER BY name COLLATE NOCASE ASC
`)

function cleanOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${fieldName} must be an ISO date string`)
  }

  return value.trim()
}

router.post('/', (req, res) => {
  try {
    const { name, birthday = null, notes = null } = req.body ?? {}
    const cleanName = cleanOptionalString(name)

    if (!cleanName) {
      return res.status(400).json({ error: 'name is required' })
    }

    const id = randomUUID()
    const cleanBirthday = cleanOptionalDate(birthday, 'birthday')
    const cleanNotes = cleanOptionalString(notes)

    if (!cleanBirthday) {
      return res.status(400).json({ error: 'birthday is required' })
    }

    insertPerson.run(id, cleanName, cleanBirthday, cleanNotes)

    res.status(201).json({
      id,
      name: cleanName,
      birthday: cleanBirthday,
      notes: cleanNotes
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/', (req, res) => {
  res.json(selectPeople.all())
})

export default router
